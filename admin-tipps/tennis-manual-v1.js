(()=>{
  'use strict';

  const clean=v=>String(v??'').trim();
  const TENNIS_MARKETS=[
    'Matchsieger',
    'Satzsieger',
    'Satz Handicap',
    'Game Handicap',
    'Games Over/Under',
    'Sätze Over/Under',
    'Tie-Break Ja/Nein',
    'Eigener Markt'
  ];
  let sportMode='Fussball';

  const $=id=>document.getElementById(id);
  const marketField=()=> $('markt') || document.querySelector('[data-field="markt"],[name="markt"]');
  const tipField=()=> $('tipp') || document.querySelector('[data-field="tipp"],[name="tipp"]');

  function berlinNowKey(){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/Berlin',
      year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date());
    const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return o.year+'-'+o.month+'-'+o.day+'T'+o.hour+':'+o.minute;
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

  function forceManualTipEntry(){
    document.querySelectorAll('[data-bi-selection-helper="1"]').forEach(el=>el.remove());
    const tip=tipField();
    if(!tip) return;
    tip.style.display='';
    tip.removeAttribute('readonly');
    tip.placeholder='z. B. Spieler 1 gewinnt / Über 22,5 Games / 2:0 Sätze';
  }

  function clearTennis(){
    window.__biTennisMeta=null;
    if(typeof window.__biClearManualEvent==='function'){
      try{window.__biClearManualEvent()}catch(e){}
    }
    const alarm=$('biLiveAlarmOne');
    if(alarm){alarm.disabled=false; alarm.title='';}
  }

  function applyTennis(){
    const err=$('biTennisError');
    if(err) err.textContent='';
    const meta={
      player_one:clean($('biTennisPlayer1')?.value),
      player_two:clean($('biTennisPlayer2')?.value),
      tournament:clean($('biTennisTournament')?.value),
      round:clean($('biTennisRound')?.value),
      spiel_datum:clean($('biTennisDate')?.value),
      anpfiff:clean($('biTennisTime')?.value)
    };

    if(!meta.player_one||!meta.player_two||!meta.tournament||!meta.spiel_datum||!meta.anpfiff){
      if(err) err.textContent='Bitte Spieler 1, Spieler 2, Turnier, Datum und Uhrzeit ausfüllen.';
      return;
    }
    if(meta.player_one.toLocaleLowerCase('de')===meta.player_two.toLocaleLowerCase('de')){
      if(err) err.textContent='Spieler 1 und Spieler 2 dürfen nicht identisch sein.';
      return;
    }
    if(meta.spiel_datum+'T'+meta.anpfiff<=berlinNowKey()){
      if(err) err.textContent='Der Matchbeginn muss in der Zukunft liegen (deutsche Zeit).';
      return;
    }

    meta.manual_event_id=makeManualId(meta);
    meta.spielart='Tennis';
    meta.wettbewerb=meta.tournament+(meta.round?' · '+meta.round:'');
    meta.home_team=meta.player_one;
    meta.away_team=meta.player_two;
    meta.sportart='Tennis';
    meta.event_source='MANUAL_TENNIS';
    window.__biTennisMeta=meta;

    if(typeof window.__biUseManualEvent==='function'){
      window.__biUseManualEvent(meta);
    }

    addTennisMarkets();
    forceManualTipEntry();

    const alarm=$('biLiveAlarmOne');
    if(alarm){
      alarm.checked=true;
      alarm.disabled=true;
      alarm.title='Tennis-Tipps werden automatisch an Live-Alarm 1 übergeben.';
    }

    const status=$('biTennisStatus');
    if(status){
      status.textContent='✓ Tennis-Match übernommen · Live-Alarm 1 ist automatisch aktiv.';
      status.style.color='#9ff3cf';
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
      addTennisMarkets();
      forceManualTipEntry();
      if(note) note.textContent='🎾 Tennis: Matchdaten werden manuell eingetragen. Live-Alarm 1 wird automatisch aktiviert.';
    }else{
      clearTennis();
      removeTennisMarkets();
      setFootballControlsDisabled(false);
      if(note) note.textContent='⚽ Fußball: bisheriger Ablauf bleibt unverändert.';
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
      '<div id="biSportNote" style="margin-top:9px;color:#b9d8e8;font-size:13px">⚽ Fußball: bisheriger Ablauf bleibt unverändert.</div>'+
      '<div id="biTennisPanel" hidden style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,.12)">'+
        '<div style="font-weight:900;margin-bottom:10px">Tennis-Match manuell erfassen</div>'+
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+
          '<input id="biTennisPlayer1" placeholder="Spieler 1 *" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)">'+
          '<input id="biTennisPlayer2" placeholder="Spieler 2 *" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)">'+
          '<input id="biTennisTournament" placeholder="Turnier * · z. B. ATP Shanghai" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)">'+
          '<input id="biTennisRound" placeholder="Runde · optional" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)">'+
          '<input id="biTennisDate" type="date" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)">'+
          '<input id="biTennisTime" type="time" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)">'+
        '</div>'+
        '<div id="biTennisError" style="min-height:18px;margin-top:9px;color:#ff9d9d;font-size:13px"></div>'+
        '<button id="biTennisApply" type="button" style="width:100%;margin-top:5px;padding:12px 16px;border:0;border-radius:999px;background:#16a8f5;color:#fff;font-weight:900;cursor:pointer">✓ Tennis-Match übernehmen</button>'+
        '<div id="biTennisStatus" style="min-height:18px;margin-top:9px;font-size:13px"></div>'+
      '</div>';

    anchor.insertAdjacentElement('beforebegin',wrap);
    wrap.querySelectorAll('[data-bi-sport-btn]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.biSportBtn)));
    $('biTennisApply')?.addEventListener('click',applyTennis);
  }

  // The existing publish pipeline stays unchanged; for Tennis we only enrich its payload.
  // This applies equally to master and normal tipster sessions because both use this terminal.
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
        obj.spiel=meta.player_one+' – '+meta.player_two;
        obj.liga=meta.tournament+(meta.round?' · '+meta.round:'');
        obj.home_team=meta.player_one;
        obj.away_team=meta.player_two;
        obj.spiel_datum=meta.spiel_datum.split('-').reverse().join('.');
        obj.anpfiff=meta.anpfiff;
        obj.api_sport_key='tennis_manual';
        obj.api_event_id='';
        obj.api_event_home=meta.player_one;
        obj.api_event_away=meta.player_two;
        obj.api_commence_time='';
        obj.api_match_status='MANUAL_TENNIS';
        obj.odds_api_status='MANUAL';
        obj.event_source='MANUAL_TENNIS';
        obj.manual_event_id=meta.manual_event_id;
        obj.spielart='Tennis';
        // User requirement: every Tennis tip goes immediately into Live-Alarm 1.
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
            const obj=Object.fromEntries(p.entries());
            const enriched=enrich(obj);
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
    // Wichtig: bewusst KEIN MutationObserver.
    // Der frühere Observer reagierte auf DOM-Änderungen, die der Tennis-Modus selbst
    // auslöst (Markt-Optionen / Auswahl-Helfer). Zusammen mit der Basis-UI konnte
    // dadurch eine Rückkopplung entstehen und der Browser-Tab beim Klick auf Tennis hängen.
    mount();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();