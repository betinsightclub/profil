(()=>{
  'use strict';

  const clean=v=>String(v??'').trim();
  const API_URL='https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-tennis-admin';
  const SESSION_KEY='betinsight_admin_session_v1';
  const CACHE_KEY='betinsight_tennis_tournaments_v2';
  const CACHE_TTL_MS=30*60*1000;

  const TENNIS_MARKETS=[
    'Matchsieger',
    'Satz 1 Sieger',
    'Satz 2 Sieger',
    'Satz 3 Sieger',
    'Satz 4 Sieger',
    'Satz 5 Sieger',
    'Exaktes Satzergebnis',
    'Satz Handicap',
    'Game Handicap',
    'Games Over/Under Match',
    'Games Over/Under Satz 1',
    'Games Over/Under Satz 2',
    'Games Over/Under Satz 3',
    'Sätze Over/Under',
    'Tie-Break im Match Ja/Nein',
    'Tie-Break Satz 1 Ja/Nein',
    'Beide gewinnen einen Satz Ja/Nein',
    'Spieler gewinnt mindestens einen Satz',
    'Erster Break',
    'Eigener Markt'
  ];

  let sportMode='Fussball';
  let tournamentsLoaded=false;
  let eventsById=new Map();

  const $=id=>document.getElementById(id);
  const marketField=()=> $('markt') || document.querySelector('[data-field="markt"],[name="markt"]');
  const tipField=()=> $('tipp') || document.querySelector('[data-field="tipp"],[name="tipp"]');

  function bytesToHex(bytes){
    return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function sha256Hex(text){
    const data=new TextEncoder().encode(String(text||''));
    const digest=await crypto.subtle.digest('SHA-256',data);
    return bytesToHex(new Uint8Array(digest));
  }

  async function getSessionHash(){
    let raw='';
    try{
      const stored=sessionStorage.getItem(SESSION_KEY);
      if(stored){
        const session=JSON.parse(stored);
        raw=clean(session?.token);
      }
    }catch(e){}
    if(!raw) throw new Error('Keine gültige Admin-Sitzung gefunden. Bitte über das Admin Center neu anmelden.');
    return sha256Hex(raw);
  }

  async function apiRequest(action,sportKey=''){
    const sessionHash=await getSessionHash();
    let response;
    try{
      response=await fetch(API_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        cache:'no-store',
        credentials:'omit',
        body:JSON.stringify({
          action,
          session_hash:sessionHash,
          sport_key:sportKey||undefined
        })
      });
    }catch(e){
      throw new Error('Tennis-Datenquelle ist momentan nicht erreichbar.');
    }
    const raw=await response.text();
    let data={};
    try{ data=raw?JSON.parse(raw):{}; }catch(e){}
    if(!response.ok || data?.ok!==true){
      const msg=clean(data?.message||data?.error);
      if(response.status===401 || /session/i.test(msg)){
        throw new Error('Admin-Sitzung abgelaufen. Bitte über das Admin Center neu anmelden.');
      }
      if(response.status===429){
        throw new Error('Zu viele Abfragen. Bitte einen Moment warten und erneut versuchen.');
      }
      throw new Error(msg||'Tennis-Daten konnten nicht geladen werden.');
    }
    return data;
  }

  function berlinNowKey(){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/Berlin',
      year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date());
    const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return o.year+'-'+o.month+'-'+o.day+'T'+o.hour+':'+o.minute;
  }

  function berlinParts(iso){
    const d=new Date(iso);
    if(Number.isNaN(d.getTime())) return null;
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/Berlin',
      year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(d);
    const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return {
      date:o.year+'-'+o.month+'-'+o.day,
      time:o.hour+':'+o.minute,
      label:o.day+'.'+o.month+'.'+o.year+' · '+o.hour+':'+o.minute+' Uhr'
    };
  }

  function makeManualId(meta){
    const slug=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,18).toUpperCase();
    return 'BI-TENNIS-'+clean(meta.spiel_datum).replace(/-/g,'')+'-'+
      clean(meta.anpfiff).replace(':','')+'-'+slug(meta.player_one)+'-'+slug(meta.player_two)+'-'+
      Date.now().toString().slice(-6);
  }

  function setFootballControlsDisabled(disabled){
    ['liga','homeTeam','awayTeam','lookupBtn'].forEach(id=>{
      const el=$(id);
      if(el) el.disabled=disabled;
    });
  }

  function findFootballSelectionSection(){
    const headings=[...document.querySelectorAll('h1,h2,h3,h4,strong')];
    const heading=headings.find(el=>/1\.\s*Liga\s+und\s+Mannschaften\s+auswählen/i.test(clean(el.textContent)));
    if(!heading) return null;
    return heading.closest('section,article,fieldset,.card,.panel,.box') || heading.parentElement;
  }

  function setFootballSectionVisible(visible){
    const section=findFootballSelectionSection();
    if(!section) return;
    if(!visible){
      if(!section.dataset.biOriginalDisplay){
        section.dataset.biOriginalDisplay=section.style.display||'__EMPTY__';
      }
      section.dataset.biTennisHidden='1';
      section.style.display='none';
      section.setAttribute('aria-hidden','true');
    }else if(section.dataset.biTennisHidden==='1'){
      const original=section.dataset.biOriginalDisplay;
      section.style.display=original&&original!=='__EMPTY__'?original:'';
      section.removeAttribute('aria-hidden');
      delete section.dataset.biTennisHidden;
      delete section.dataset.biOriginalDisplay;
    }
  }

  function addTennisMarkets(){
    const el=marketField();
    if(!el || el.tagName!=='SELECT') return;
    TENNIS_MARKETS.forEach(label=>{
      if([...el.options].some(o=>o.value===label)) return;
      const opt=document.createElement('option');
      opt.value=label;
      opt.textContent='🎾 '+label;
      opt.dataset.biTennisOption='1';
      el.appendChild(opt);
    });
  }

  function removeTennisMarkets(){
    const el=marketField();
    if(!el || el.tagName!=='SELECT') return;
    const current=el.selectedOptions?.[0];
    const wasTennis=current?.dataset?.biTennisOption==='1';
    el.querySelectorAll('option[data-bi-tennis-option="1"]').forEach(o=>o.remove());
    if(wasTennis){
      el.value='';
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function forceTennisTipEntry(){
    document.querySelectorAll('[data-bi-selection-helper="1"]').forEach(el=>el.remove());
    const tip=tipField();
    if(!tip) return;
    tip.style.display='';
    tip.removeAttribute('readonly');
    tip.placeholder='z. B. Spieler gewinnt / Über 22,5 Games / 2:0 Sätze';
  }

  function tennisPlayers(){
    const meta=window.__biTennisMeta||{};
    let players=[clean(meta.player_one),clean(meta.player_two)].filter(Boolean);
    if(players.length===2) return players;

    const summary=clean($('gameSummary')?.textContent);
    const match=summary.match(/^(.+?)\s+[–-]\s+(.+?)(?:\s+·|$)/);
    if(match) players=[clean(match[1]),clean(match[2])].filter(Boolean);
    return players;
  }

  function setTipSelectOptions(options,placeholder='Bitte auswählen'){
    const tip=tipField();
    if(!tip) return;
    tip.style.display='';
    tip.removeAttribute('readonly');
    if(tip.tagName!=='SELECT'){
      tip.value='';
      tip.placeholder=placeholder;
      return;
    }
    const previous=clean(tip.value);
    tip.innerHTML='';
    const first=document.createElement('option');
    first.value='';
    first.textContent=placeholder;
    tip.appendChild(first);
    for(const item of options){
      const value=typeof item==='string'?item:clean(item?.value);
      const label=typeof item==='string'?item:clean(item?.label||item?.value);
      if(!value) continue;
      const opt=document.createElement('option');
      opt.value=value;
      opt.textContent=label;
      tip.appendChild(opt);
    }
    if(previous && [...tip.options].some(o=>o.value===previous)) tip.value=previous;
    tip.disabled=false;
  }

  function tennisLineOptions(kind){
    const [p1,p2]=tennisPlayers();
    const out=[];
    if(kind==='games_total'){
      for(let x=17.5;x<=31.5;x+=1){
        const line=String(x).replace('.',',');
        out.push('Über '+line+' Games','Unter '+line+' Games');
      }
    }else if(kind==='set_games_total'){
      for(let x=6.5;x<=13.5;x+=1){
        const line=String(x).replace('.',',');
        out.push('Über '+line+' Games','Unter '+line+' Games');
      }
    }else if(kind==='game_handicap'){
      for(const p of [p1,p2].filter(Boolean)){
        for(let x=-6.5;x<=6.5;x+=1){
          if(Math.abs(x)<0.01) continue;
          const sign=x>0?'+':'';
          out.push(p+' '+sign+String(x).replace('.',',')+' Games');
        }
      }
    }else if(kind==='set_handicap'){
      for(const p of [p1,p2].filter(Boolean)){
        [-2.5,-1.5,1.5,2.5].forEach(x=>{
          const sign=x>0?'+':'';
          out.push(p+' '+sign+String(x).replace('.',',')+' Sätze');
        });
      }
    }
    return out;
  }

  let tennisSelectionTimer=0;
  function scheduleTennisSelection(){
    if(sportMode!=='Tennis') return;
    clearTimeout(tennisSelectionTimer);
    populateTennisSelection();
    tennisSelectionTimer=setTimeout(()=>{
      if(sportMode==='Tennis') populateTennisSelection();
    },60);
    setTimeout(()=>{
      if(sportMode==='Tennis') populateTennisSelection();
    },180);
  }

  function populateTennisSelection(){
    if(sportMode!=='Tennis') return;
    const market=clean(marketField()?.value);
    const [p1,p2]=tennisPlayers();
    let options=[];
    let placeholder='Bitte Auswahl treffen';

    if(!market){
      setTipSelectOptions([],'Zuerst Markt auswählen');
      return;
    }

    if(market==='Matchsieger'){
      options=[p1,p2];
    }else if(/^Satz [1-5] Sieger$/.test(market)){
      options=[p1,p2];
    }else if(market==='Exaktes Satzergebnis'){
      options=[
        p1+' 2:0',p1+' 2:1',p2+' 2:0',p2+' 2:1',
        p1+' 3:0',p1+' 3:1',p1+' 3:2',p2+' 3:0',p2+' 3:1',p2+' 3:2'
      ].filter(x=>!/^\s/.test(x));
    }else if(market==='Satz Handicap'){
      options=tennisLineOptions('set_handicap');
    }else if(market==='Game Handicap'){
      options=tennisLineOptions('game_handicap');
    }else if(market==='Games Over/Under Match'){
      options=tennisLineOptions('games_total');
    }else if(/^Games Over\/Under Satz [1-3]$/.test(market)){
      options=tennisLineOptions('set_games_total');
    }else if(market==='Sätze Over/Under'){
      options=['Über 2,5 Sätze','Unter 2,5 Sätze','Über 3,5 Sätze','Unter 3,5 Sätze','Über 4,5 Sätze','Unter 4,5 Sätze'];
    }else if(market==='Tie-Break im Match Ja/Nein' || market==='Tie-Break Satz 1 Ja/Nein' || market==='Beide gewinnen einen Satz Ja/Nein'){
      options=['Ja','Nein'];
    }else if(market==='Spieler gewinnt mindestens einen Satz'){
      options=[p1+' – Ja',p1+' – Nein',p2+' – Ja',p2+' – Nein'].filter(x=>!/^\s/.test(x));
    }else if(market==='Erster Break'){
      options=[p1,p2,'Kein Break im 1. Satz'].filter(Boolean);
    }else if(market==='Eigener Markt'){
      const tip=tipField();
      if(tip && tip.tagName==='SELECT'){
        const helper=document.createElement('input');
        helper.type='text';
        helper.dataset.biSelectionHelper='1';
        helper.id='biTennisCustomSelection';
        helper.placeholder='Eigene Auswahl eingeben, z. B. Spieler A gewinnt Satz 1';
        helper.style.cssText='width:100%;margin-top:8px;padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)';
        tip.insertAdjacentElement('afterend',helper);
        tip.innerHTML='<option value="__CUSTOM__">Eigene Auswahl eingeben</option>';
        tip.value='__CUSTOM__';
        tip.disabled=false;
        helper.addEventListener('input',()=>{tip.options[0].value=clean(helper.value)||'__CUSTOM__'; tip.value=tip.options[0].value;});
        return;
      }
      placeholder='Eigene Auswahl eingeben';
    }

    setTipSelectOptions(options,placeholder);
  }

  function setStatus(text,type=''){
    const el=$('biTennisStatus');
    if(!el) return;
    el.textContent=text||'';
    el.style.color=type==='error'?'#ff9d9d':type==='ok'?'#9ff3cf':'#b9d8e8';
  }

  function setLoading(loading,text=''){
    const tournament=$('biTennisTournamentSelect');
    const event=$('biTennisEventSelect');
    const apply=$('biTennisApplyApi');
    if(tournament) tournament.disabled=loading;
    if(event) event.disabled=loading || !event.value;
    if(apply) apply.disabled=loading || !event?.value;
    if(text) setStatus(text);
  }

  function clearTennis(){
    window.__biTennisMeta=null;
    eventsById.clear();
    if(typeof window.__biClearManualEvent==='function'){
      try{window.__biClearManualEvent()}catch(e){}
    }
    const alarm=$('biLiveAlarmOne');
    if(alarm){alarm.disabled=false; alarm.title='';}
    const event=$('biTennisEventSelect');
    if(event){
      event.innerHTML='<option value="">Zuerst Turnier auswählen</option>';
      event.disabled=true;
    }
    const apply=$('biTennisApplyApi');
    if(apply) apply.disabled=true;
    setStatus('');
  }

  function useTennisMeta(meta,statusText){
    window.__biTennisMeta=meta;
    if(typeof window.__biUseManualEvent!=='function'){
      throw new Error('Die Match-Übernahme konnte nicht initialisiert werden. Bitte Seite neu laden.');
    }
    window.__biUseManualEvent(meta);
    addTennisMarkets();
    forceTennisTipEntry();
    scheduleTennisSelection();

    const alarm=$('biLiveAlarmOne');
    if(alarm){
      alarm.checked=true;
      alarm.disabled=true;
      alarm.title='Tennis-Tipps werden automatisch an Live-Alarm 1 übergeben.';
    }
    setStatus(statusText||'✓ Tennis-Match übernommen · Live-Alarm 1 ist automatisch aktiv.','ok');
  }

  function fillTournamentOptions(tournaments){
    const select=$('biTennisTournamentSelect');
    if(!select) return;
    select.innerHTML='<option value="">Turnier auswählen</option>';
    for(const t of tournaments){
      const key=clean(t?.sport_key);
      if(!key) continue;
      const opt=document.createElement('option');
      opt.value=key;
      opt.textContent='🎾 '+clean(t?.title||key);
      opt.dataset.title=clean(t?.title||key);
      opt.dataset.description=clean(t?.description);
      select.appendChild(opt);
    }
    select.disabled=false;
  }

  async function loadTournaments(force=false){
    if(sportMode!=='Tennis') return;
    setLoading(true,'Aktive Tennis-Turniere werden geladen …');
    let tournaments=null;

    if(!force){
      try{
        const cached=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
        if(cached && Date.now()-Number(cached.savedAt||0)<CACHE_TTL_MS && Array.isArray(cached.tournaments)){
          tournaments=cached.tournaments;
        }
      }catch(e){}
    }

    try{
      if(!tournaments){
        const data=await apiRequest('tournaments');
        tournaments=Array.isArray(data?.tournaments)?data.tournaments:[];
        try{
          sessionStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),tournaments}));
        }catch(e){}
      }
      fillTournamentOptions(tournaments);
      tournamentsLoaded=true;
      if(tournaments.length){
        setStatus(tournaments.length+' aktive Tennis-Turnier'+(tournaments.length===1?'':'e')+' verfügbar. Turnier auswählen.');
      }else{
        setStatus('Aktuell liefert die Datenquelle kein aktives Tennis-Turnier. Nutze bei Bedarf die manuelle Erfassung.','error');
      }
    }catch(e){
      fillTournamentOptions([]);
      setStatus(e?.message||'Turniere konnten nicht geladen werden.','error');
    }finally{
      const select=$('biTennisTournamentSelect');
      if(select) select.disabled=false;
    }
  }

  async function loadEvents(){
    const tournament=$('biTennisTournamentSelect');
    const eventSelect=$('biTennisEventSelect');
    const apply=$('biTennisApplyApi');
    if(!tournament||!eventSelect) return;

    const sportKey=clean(tournament.value);
    eventsById.clear();
    eventSelect.innerHTML='<option value="">Match auswählen</option>';
    eventSelect.disabled=true;
    if(apply) apply.disabled=true;
    if(!sportKey){
      setStatus('Bitte zuerst ein Turnier auswählen.');
      return;
    }

    setLoading(true,'Matches werden direkt aus der Tennis-Datenquelle geladen …');
    try{
      const data=await apiRequest('events',sportKey);
      const rawEvents=Array.isArray(data?.events)?data.events:[];
      const now=Date.now()-5*60*1000;
      const futureEvents=rawEvents
        .filter(ev=>{
          const ts=Date.parse(clean(ev?.commence_time));
          return Number.isFinite(ts)&&ts>=now&&clean(ev?.event_id)&&clean(ev?.player_one)&&clean(ev?.player_two);
        })
        .sort((a,b)=>Date.parse(a.commence_time)-Date.parse(b.commence_time));

      for(const ev of futureEvents){
        const id=clean(ev.event_id);
        const parts=berlinParts(ev.commence_time);
        if(!parts) continue;
        eventsById.set(id,{...ev,_berlin:parts});
        const opt=document.createElement('option');
        opt.value=id;
        opt.textContent=parts.label+' · '+clean(ev.player_one)+' – '+clean(ev.player_two);
        eventSelect.appendChild(opt);
      }

      eventSelect.disabled=futureEvents.length===0;
      if(futureEvents.length){
        setStatus(futureEvents.length+' kommende Matches geladen. Spieler und Startzeit werden automatisch übernommen.');
      }else{
        setStatus('Für dieses Turnier wurden aktuell keine kommenden Matches gefunden. Nutze bei Bedarf die manuelle Erfassung.','error');
      }
    }catch(e){
      setStatus(e?.message||'Matches konnten nicht geladen werden.','error');
    }finally{
      tournament.disabled=false;
    }
  }

  function chooseEvent(){
    const eventSelect=$('biTennisEventSelect');
    const apply=$('biTennisApplyApi');
    const id=clean(eventSelect?.value);
    if(apply) apply.disabled=!id;
    if(!id) return;
    const ev=eventsById.get(id);
    if(ev){
      const p=ev._berlin||berlinParts(ev.commence_time);
      setStatus('Ausgewählt: '+clean(ev.player_one)+' – '+clean(ev.player_two)+' · '+(p?.label||''));
    }
  }

  function applyApiTennis(){
    const id=clean($('biTennisEventSelect')?.value);
    const ev=eventsById.get(id);
    if(!ev){
      setStatus('Bitte zuerst ein Match auswählen.','error');
      return;
    }
    const p=ev._berlin||berlinParts(ev.commence_time);
    if(!p){
      setStatus('Startzeit des Matches ist ungültig.','error');
      return;
    }
    const tournamentTitle=clean(
      $('biTennisTournamentSelect')?.selectedOptions?.[0]?.dataset?.title ||
      ev.tournament ||
      $('biTennisTournamentSelect')?.selectedOptions?.[0]?.textContent
    ).replace(/^🎾\s*/,'');
    const sportKey=clean(ev.sport_key||$('biTennisTournamentSelect')?.value);

    const meta={
      player_one:clean(ev.player_one),
      player_two:clean(ev.player_two),
      tournament:tournamentTitle,
      round:'',
      spiel_datum:p.date,
      anpfiff:p.time,
      api_event_id:id,
      sport_key:sportKey,
      api_sport_key:sportKey,
      api_commence_time:clean(ev.commence_time),
      api_match_status:'SCHEDULED',
      odds_api_status:'EXTERNAL_API',
      event_source:'ODDS_API_TENNIS',
      sportart:'Tennis',
      spielart:'Tennis',
      wettbewerb:tournamentTitle,
      home_team:clean(ev.player_one),
      away_team:clean(ev.player_two)
    };

    try{
      useTennisMeta(meta,'✓ API-Tennis-Match übernommen: '+meta.player_one+' – '+meta.player_two+' · '+p.label);
    }catch(e){
      setStatus(e?.message||'Match konnte nicht übernommen werden.','error');
    }
  }

  function toggleManual(){
    const panel=$('biTennisManualPanel');
    const btn=$('biTennisManualToggle');
    if(!panel||!btn) return;
    panel.hidden=!panel.hidden;
    btn.textContent=panel.hidden?'＋ Match nicht gefunden? Manuell erfassen':'− Manuelle Erfassung schließen';
  }

  function applyManualTennis(){
    const err=$('biTennisManualError');
    if(err) err.textContent='';
    const meta={
      player_one:clean($('biTennisPlayer1')?.value),
      player_two:clean($('biTennisPlayer2')?.value),
      tournament:clean($('biTennisTournamentManual')?.value),
      round:clean($('biTennisRound')?.value),
      spiel_datum:clean($('biTennisDate')?.value),
      anpfiff:clean($('biTennisTime')?.value)
    };

    const fail=msg=>{if(err)err.textContent=msg;};
    if(!meta.player_one||!meta.player_two||!meta.tournament||!meta.spiel_datum||!meta.anpfiff){
      fail('Bitte Spieler 1, Spieler 2, Turnier, Datum und Uhrzeit ausfüllen.');
      return;
    }
    if(meta.player_one.toLocaleLowerCase('de')===meta.player_two.toLocaleLowerCase('de')){
      fail('Spieler 1 und Spieler 2 dürfen nicht identisch sein.');
      return;
    }
    if(meta.spiel_datum+'T'+meta.anpfiff<=berlinNowKey()){
      fail('Der Matchbeginn muss in der Zukunft liegen (deutsche Zeit).');
      return;
    }

    meta.manual_event_id=makeManualId(meta);
    meta.api_event_id='';
    meta.sport_key='tennis_manual';
    meta.api_sport_key='tennis_manual';
    meta.api_commence_time='';
    meta.api_match_status='MANUAL_TENNIS';
    meta.odds_api_status='MANUAL';
    meta.spielart='Tennis';
    meta.wettbewerb=meta.tournament+(meta.round?' · '+meta.round:'');
    meta.home_team=meta.player_one;
    meta.away_team=meta.player_two;
    meta.sportart='Tennis';
    meta.event_source='MANUAL_TENNIS';

    try{
      useTennisMeta(meta,'✓ Manuelles Tennis-Match übernommen · Live-Alarm 1 ist automatisch aktiv.');
      const panel=$('biTennisManualPanel');
      if(panel) panel.hidden=true;
      const btn=$('biTennisManualToggle');
      if(btn) btn.textContent='＋ Match nicht gefunden? Manuell erfassen';
    }catch(e){
      fail(e?.message||'Match konnte nicht übernommen werden.');
    }
  }

  function setMode(mode){
    sportMode=mode==='Tennis'?'Tennis':'Fussball';
    const panel=$('biTennisPanel');
    const note=$('biSportNote');
    if(panel) panel.hidden=sportMode!=='Tennis';

    document.querySelectorAll('[data-bi-sport-btn]').forEach(btn=>{
      const active=btn.dataset.biSportBtn===sportMode;
      btn.setAttribute('aria-pressed',active?'true':'false');
      btn.style.borderColor=active?'rgba(0,218,255,.95)':'rgba(255,255,255,.18)';
      btn.style.background=active?'rgba(0,168,245,.22)':'rgba(255,255,255,.05)';
    });

    if(sportMode==='Tennis'){
      setFootballControlsDisabled(true);
      setFootballSectionVisible(false);
      addTennisMarkets();
      forceTennisTipEntry();
      scheduleTennisSelection();
      if(note) note.textContent='🎾 Tennis: Turnier und Match oben auswählen. Spieler, Datum und Uhrzeit werden automatisch übernommen; der Fußball-Bereich wird in diesem Modus ausgeblendet.';
      if(!tournamentsLoaded) loadTournaments(false);
    }else{
      clearTennis();
      removeTennisMarkets();
      setFootballControlsDisabled(false);
      setFootballSectionVisible(true);
      if(note) note.textContent='⚽ Fußball: bisheriger API-Ablauf bleibt unverändert.';
    }
  }

  function mount(){
    if($('biSportModeWrap')) return;
    const liga=$('liga');
    const anchor=(liga&&liga.closest('section,article,fieldset,.card,.panel,.box')) || document.querySelector('form') || document.body;

    const wrap=document.createElement('section');
    wrap.id='biSportModeWrap';
    wrap.style.cssText='margin:0 0 18px;padding:16px;border:1px solid rgba(0,218,255,.40);border-radius:16px;background:linear-gradient(180deg,rgba(10,55,78,.96),rgba(6,29,42,.96));box-shadow:0 12px 28px rgba(0,0,0,.18);';
    wrap.innerHTML=
      '<div style="font-size:18px;font-weight:900;margin-bottom:10px">Sportart</div>'+
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+
        '<button type="button" data-bi-sport-btn="Fussball" aria-pressed="true" style="padding:13px;border-radius:12px;border:1px solid rgba(0,218,255,.95);background:rgba(0,168,245,.22);color:#fff;font-weight:900;cursor:pointer">⚽ Fußball</button>'+
        '<button type="button" data-bi-sport-btn="Tennis" aria-pressed="false" style="padding:13px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#fff;font-weight:900;cursor:pointer">🎾 Tennis</button>'+
      '</div>'+
      '<div id="biSportNote" style="margin-top:9px;color:#b9d8e8;font-size:13px">⚽ Fußball: bisheriger API-Ablauf bleibt unverändert.</div>'+

      '<div id="biTennisPanel" hidden style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,.12)">'+
        '<div style="font-weight:900;font-size:16px;margin-bottom:5px">Tennis-Match aus der API auswählen</div>'+
        '<div style="color:#9fc7d8;font-size:13px;line-height:1.5;margin-bottom:12px">Aktive ATP-/WTA-Turniere und die dazu verfügbaren Matches werden automatisch geladen. Spieler, Datum und Startzeit müssen nicht mehr manuell eingetippt werden.</div>'+
        '<div style="display:grid;grid-template-columns:1fr;gap:10px">'+
          '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px">'+
            '<select id="biTennisTournamentSelect" disabled style="width:100%;padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)"><option value="">Turniere werden geladen …</option></select>'+
            '<button id="biTennisRefresh" type="button" title="Turniere neu laden" style="padding:0 14px;border-radius:10px;border:1px solid rgba(0,218,255,.35);background:#0d3347;color:#fff;font-weight:900;cursor:pointer">↻</button>'+
          '</div>'+
          '<select id="biTennisEventSelect" disabled style="width:100%;padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)"><option value="">Zuerst Turnier auswählen</option></select>'+
          '<button id="biTennisApplyApi" type="button" disabled style="width:100%;padding:12px 16px;border:0;border-radius:999px;background:#16a8f5;color:#fff;font-weight:900;cursor:pointer;disabled:opacity:.5">✓ API-Match übernehmen</button>'+
        '</div>'+
        '<div id="biTennisStatus" style="min-height:18px;margin-top:9px;color:#b9d8e8;font-size:13px"></div>'+

        '<div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.10)">'+
          '<button id="biTennisManualToggle" type="button" style="width:100%;padding:11px 14px;border-radius:12px;border:1px solid rgba(255,186,73,.42);background:rgba(255,186,73,.10);color:#ffe1a6;font-weight:900;cursor:pointer">＋ Match nicht gefunden? Manuell erfassen</button>'+
          '<div id="biTennisManualPanel" hidden style="margin-top:12px">'+
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+
              '<input id="biTennisPlayer1" placeholder="Spieler 1 *" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
              '<input id="biTennisPlayer2" placeholder="Spieler 2 *" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
              '<input id="biTennisTournamentManual" placeholder="Turnier * · z. B. ATP Shanghai" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
              '<input id="biTennisRound" placeholder="Runde · optional" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
              '<input id="biTennisDate" type="date" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
              '<input id="biTennisTime" type="time" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
            '</div>'+
            '<div id="biTennisManualError" style="min-height:18px;margin-top:9px;color:#ff9d9d;font-size:13px"></div>'+
            '<button id="biTennisApplyManual" type="button" style="width:100%;margin-top:5px;padding:12px 16px;border:0;border-radius:999px;background:#a66b13;color:#fff;font-weight:900;cursor:pointer">✓ Manuelles Match übernehmen</button>'+
          '</div>'+
        '</div>'+
      '</div>';

    anchor.insertAdjacentElement('beforebegin',wrap);

    wrap.querySelectorAll('[data-bi-sport-btn]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.biSportBtn)));
    $('biTennisTournamentSelect')?.addEventListener('change',loadEvents);
    marketField()?.addEventListener('change',()=>{
      if(sportMode==='Tennis') scheduleTennisSelection();
    },true);

    document.addEventListener('change',event=>{
      if(sportMode!=='Tennis') return;
      const market=marketField();
      if(event.target===market) scheduleTennisSelection();
    },true);
    $('biTennisEventSelect')?.addEventListener('change',chooseEvent);
    $('biTennisApplyApi')?.addEventListener('click',applyApiTennis);
    $('biTennisRefresh')?.addEventListener('click',()=>{
      try{sessionStorage.removeItem(CACHE_KEY)}catch(e){}
      tournamentsLoaded=false;
      const e=$('biTennisEventSelect');
      if(e){e.innerHTML='<option value="">Zuerst Turnier auswählen</option>';e.disabled=true;}
      loadTournaments(true);
    });
    $('biTennisManualToggle')?.addEventListener('click',toggleManual);
    $('biTennisApplyManual')?.addEventListener('click',applyManualTennis);
  }

  // Bestehende Veröffentlichungsstrecke bleibt unverändert.
  // Wir ergänzen bei Tennis nur die strukturierten Match-Metadaten.
  const inheritedFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const meta=window.__biTennisMeta;
    const url=typeof input==='string'?input:(input&&input.url?String(input.url):'');
    const isPublish=url.includes('route=tip-historical-publish') ||
      url.includes('jnj854h9aeg5iqny6prd3owgt4mpcd51');

    if(sportMode!=='Tennis' || !meta || !isPublish){
      return inheritedFetch(input,init);
    }

    let opts=init?{...init}:{};
    try{
      const enrich=obj=>{
        obj.sportart='Tennis';
        obj.spiel=clean(meta.player_one)+' – '+clean(meta.player_two);
        obj.liga=clean(meta.tournament)+(clean(meta.round)?' · '+clean(meta.round):'');
        obj.home_team=clean(meta.player_one);
        obj.away_team=clean(meta.player_two);
        obj.spiel_datum=clean(meta.spiel_datum).split('-').reverse().join('.');
        obj.anpfiff=clean(meta.anpfiff);
        obj.api_sport_key=clean(meta.api_sport_key||meta.sport_key||'tennis_manual');
        obj.api_event_id=clean(meta.api_event_id||'');
        obj.api_event_home=clean(meta.player_one);
        obj.api_event_away=clean(meta.player_two);
        obj.api_commence_time=clean(meta.api_commence_time||'');
        obj.api_match_status=clean(meta.api_match_status||meta.event_source||'MANUAL_TENNIS');
        obj.odds_api_status=clean(meta.odds_api_status||(meta.api_event_id?'EXTERNAL_API':'MANUAL'));
        obj.event_source=clean(meta.event_source||'MANUAL_TENNIS');
        obj.manual_event_id=clean(meta.api_event_id?'':meta.manual_event_id||'');
        obj.spielart='Tennis';
        obj.live_alarm_1='JA';
        return obj;
      };

      const body=opts.body;
      if(typeof body==='string'){
        let done=false;
        try{
          const obj=JSON.parse(body);
          if(obj&&typeof obj==='object'){
            opts.body=JSON.stringify(enrich(obj));
            done=true;
          }
        }catch(e){}
        if(!done){
          const p=new URLSearchParams(body);
          if([...p.keys()].length){
            const enriched=enrich(Object.fromEntries(p.entries()));
            const next=new URLSearchParams();
            Object.entries(enriched).forEach(([k,v])=>next.set(k,String(v??'')));
            opts.body=next.toString();
          }
        }
      }else if(typeof URLSearchParams!=='undefined' && body instanceof URLSearchParams){
        const p=new URLSearchParams(body);
        const enriched=enrich(Object.fromEntries(p.entries()));
        const next=new URLSearchParams();
        Object.entries(enriched).forEach(([k,v])=>next.set(k,String(v??'')));
        opts.body=next;
      }else if(typeof FormData!=='undefined' && body instanceof FormData){
        const fd=new FormData();
        for(const [k,v] of body.entries()) fd.append(k,v);
        const enriched=enrich({});
        Object.entries(enriched).forEach(([k,v])=>fd.set(k,String(v??'')));
        opts.body=fd;
      }
    }catch(e){
      console.warn('BetInsight Tennis payload enrichment failed',e);
    }
    return inheritedFetch(input,opts);
  };

  const boot=()=>{
    mount();
    const mo=new MutationObserver(()=>{
      mount();
      if(sportMode==='Tennis'){
        setFootballControlsDisabled(true);
        setFootballSectionVisible(false);
        addTennisMarkets();
        forceTennisTipEntry();

        const market=clean(marketField()?.value);
        const tip=tipField();
        const placeholder=clean(tip?.selectedOptions?.[0]?.textContent||tip?.value);
        const baseReset=/^Zuerst Markt auswählen$/i.test(placeholder) || (market && tip && tip.options && tip.options.length<=1);
        if(baseReset) scheduleTennisSelection();

        const alarm=$('biLiveAlarmOne');
        if(alarm){alarm.checked=true;alarm.disabled=true;}
      }else{
        setFootballSectionVisible(true);
      }
    });
    mo.observe(document.body,{childList:true,subtree:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();