(()=>{
'use strict';

const clean=v=>String(v??'').trim();
const API_URL='https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-tennis-admin';
const SESSION_KEY='betinsight_admin_session_v1';
const VERSION='Tennis API v15';
const $=id=>document.getElementById(id);
let sportMode='Fussball';
let tournamentsLoaded=false;
const eventsById=new Map();
const oddsCache=new Map();
let currentOddsRows=[];

const TENNIS_MARKETS=[
  'Matchsieger','Satz 1 Sieger','Satz 2 Sieger','Satz 3 Sieger',
  'Exaktes Satzergebnis','Satz Handicap','Game Handicap',
  'Games Over/Under Match','Games Over/Under Satz 1','Games Over/Under Satz 2',
  'Sätze Over/Under','Tie-Break im Match Ja/Nein',
  'Beide gewinnen einen Satz Ja/Nein','Spieler gewinnt mindestens einen Satz',
  'Erster Break','Eigener Markt'
];

const marketField=()=> $('markt') || $('market') ||
  document.querySelector('[name="markt"],[data-field="markt"],[name="market"],[data-field="market"]');

const selectionField=()=> $('selection') || $('auswahl') || $('tipp') || $('pick') ||
  document.querySelector('[name="selection"],[data-field="selection"],[name="auswahl"],[data-field="auswahl"],[name="tipp"],[data-field="tipp"],[name="pick"]');

function bytesToHex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
async function sha256Hex(text){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text||'')));
  return bytesToHex(new Uint8Array(digest));
}
async function getSessionHash(){
  let token='';
  try{token=clean(JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')?.token)}catch(e){}
  if(!token) throw new Error('Keine gültige Admin-Sitzung. Bitte über das Admin Center neu anmelden.');
  return sha256Hex(token);
}
async function apiRequest(action,sportKey='',extra={}){
  const session_hash=await getSessionHash();
  const res=await fetch(API_URL,{
    method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',credentials:'omit',
    body:JSON.stringify({action,session_hash,sport_key:sportKey||undefined,...extra})
  });
  const raw=await res.text();
  let data={}; try{data=raw?JSON.parse(raw):{}}catch(e){}
  if(!res.ok||data?.ok!==true) throw new Error(clean(data?.message||data?.error)||'Tennis-API nicht erreichbar.');
  return data;
}
function berlinParts(iso){
  const d=new Date(iso); if(Number.isNaN(d.getTime())) return null;
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(d);
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return {date:o.year+'-'+o.month+'-'+o.day,time:o.hour+':'+o.minute,label:o.day+'.'+o.month+'.'+o.year+' · '+o.hour+':'+o.minute+' Uhr'};
}
function berlinNowKey(){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date());
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return o.year+'-'+o.month+'-'+o.day+'T'+o.hour+':'+o.minute;
}
function makeManualId(meta){
  const slug=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,18).toUpperCase();
  return 'BI-TENNIS-'+meta.spiel_datum.replace(/-/g,'')+'-'+meta.anpfiff.replace(':','')+'-'+slug(meta.player_one)+'-'+slug(meta.player_two)+'-'+Date.now().toString().slice(-6);
}
function setStatus(text,type=''){
  const el=$('biTennisStatus'); if(!el) return;
  el.textContent=text||'';
  el.style.color=type==='error'?'#ff9d9d':type==='ok'?'#9ff3cf':'#b9d8e8';
}
function findFootballSection(){
  const h=[...document.querySelectorAll('h1,h2,h3,h4')].find(x=>/1\.\s*Liga\s+und\s+Mannschaften\s+auswählen/i.test(clean(x.textContent)));
  return h?.closest('section,article,fieldset,.card,.panel,.box')||h?.parentElement||null;
}
function showFootballSection(show){
  const s=findFootballSection(); if(!s) return;
  s.style.display=show?'':'none';
}
function setFootballControlsDisabled(disabled){
  ['liga','homeTeam','awayTeam','lookupBtn'].forEach(id=>{const el=$(id);if(el)el.disabled=disabled});
}
function addTennisMarkets(){
  const el=marketField(); if(!el||el.tagName!=='SELECT') return;
  TENNIS_MARKETS.forEach(label=>{
    if([...el.options].some(o=>o.value===label)) return;
    const o=document.createElement('option');o.value=label;o.textContent='🎾 '+label;o.dataset.biTennisOption='1';el.appendChild(o);
  });
}
function removeTennisMarkets(){
  const el=marketField(); if(!el||el.tagName!=='SELECT') return;
  el.querySelectorAll('option[data-bi-tennis-option="1"]').forEach(o=>o.remove());
}
function tennisPlayers(){
  const m=window.__biTennisMeta||{};
  return [clean(m.player_one),clean(m.player_two)].filter(Boolean);
}

function apiMarketKey(market){
  if(market==='Matchsieger') return 'h2h';
  if(market==='Game Handicap') return 'spreads';
  if(market==='Games Over/Under Match') return 'totals';
  return '';
}
function decimalDE(v){
  const n=Number(v);
  return Number.isFinite(n)?String(n).replace('.',','):'';
}
function outcomeLabel(outcome,marketKey){
  const name=clean(outcome?.name);
  const point=Number(outcome?.point);
  if(marketKey==='h2h') return name;
  if(marketKey==='spreads'){
    if(!name||!Number.isFinite(point)) return '';
    return name+' '+(point>0?'+':'')+decimalDE(point)+' Games';
  }
  if(marketKey==='totals'){
    if(!Number.isFinite(point)) return '';
    const side=/^over$/i.test(name)?'Über':/^under$/i.test(name)?'Unter':name;
    return side+' '+decimalDE(point)+' Games';
  }
  return '';
}
function fieldByLabel(re){
  const root=$('marketFieldset')||document;
  for(const label of root.querySelectorAll('label')){
    const txt=clean(label.textContent).replace(/\s*\*\s*$/,'');
    if(!re.test(txt)) continue;
    const id=clean(label.getAttribute('for'));
    if(id&&$(id)) return $(id);
    const p=label.parentElement;
    const el=p?.querySelector('input,select,textarea');
    if(el) return el;
  }
  return null;
}
function setNativeValue(el,value){
  if(!el)return;
  el.value=String(value??'');
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
}
function prepareCoreReference(apiMode){
  const mode=$('referenceMode');
  if(!mode) return;
  if(!mode.dataset.biOwnText){
    const own=[...mode.options].find(o=>o.value==='own');
    if(own) mode.dataset.biOwnText=own.textContent||'';
  }
  const own=[...mode.options].find(o=>o.value==='own');
  if(own){
    own.textContent=apiMode?'Tennis-API / Buchmacher automatisch':(mode.dataset.biOwnText||own.textContent);
  }
  mode.value='own';
  mode.dispatchEvent(new Event('change',{bubbles:true}));
}
function setCoreSelectedReference(row){
  const meta=window.__biTennisMeta||{};
  const market=clean(marketField()?.value);
  const marketKey=apiMarketKey(market);
  const ref={
    event_id:clean(meta.api_event_id),
    sport_key:clean(meta.api_sport_key||meta.sport_key),
    market_key:marketKey,
    selection_key:clean(row?.label||selectionField()?.value),
    line:Number.isFinite(Number(row?.point))?Number(row.point):null,
    bookmaker_key:clean(row?.bookmaker_key),
    bookmaker_title:clean(row?.bookmaker),
    bookmaker:clean(row?.bookmaker),
    price:Number(row?.price),
    quote:Number(row?.price),
    link:clean(row?.link),
    source:'TENNIS_API'
  };
  try{
    if(typeof selectedReference!=='undefined') selectedReference=ref;
  }catch(e){}
  window.__biTennisSelectedReference=ref;
  return ref;
}
function clearCoreSelectedReference(){
  try{
    if(typeof selectedReference!=='undefined') selectedReference=null;
  }catch(e){}
  window.__biTennisSelectedReference=null;
}
function fillCoreReference(row){
  prepareCoreReference(true);
  setCoreSelectedReference(row);
  setTimeout(()=>{
    const bookmaker=fieldByLabel(/^Buchmacher\s*\/\s*Quelle\b/i);
    const quote=fieldByLabel(/^Quote\b/i);
    const link=fieldByLabel(/^Quelle\s*\/\s*Link\b/i);
    setNativeValue(bookmaker,row.bookmaker);
    setNativeValue(quote,row.price);
    if(link)setNativeValue(link,row.link||'');
    try{if(typeof refreshTechnical==='function')refreshTechnical()}catch(e){}
    try{if(typeof refreshSaveState==='function')refreshSaveState()}catch(e){}
    try{if(typeof updatePreview==='function')updatePreview()}catch(e){}
    setStatus('✓ Buchmacherquote übernommen: '+row.bookmaker+' · '+row.label+' · '+row.price,'ok');
  },0);
}
function mountTennisOddsPanel(){
  if($('biTennisOddsWrap')) return;
  const host=$('marketFieldset');
  if(!host) return;
  const wrap=document.createElement('div');
  wrap.id='biTennisOddsWrap';
  wrap.hidden=sportMode!=='Tennis';
  wrap.style.cssText='margin-top:14px;padding:14px 16px;border:1px solid rgba(255,186,73,.42);border-radius:14px;background:rgba(255,186,73,.08)';
  wrap.innerHTML=
    '<div style="font-weight:900;color:#ffe1a6;margin-bottom:5px">🎾 Tennis-Buchmacherquote · API</div>'+
    '<div id="biTennisOddsNote" style="color:#cfe7f2;font-size:13px;line-height:1.45;margin-bottom:10px">Markt und Auswahl festlegen. Verfügbare Buchmacher werden automatisch geladen.</div>'+
    '<button id="biTennisOddsReload" type="button" style="width:100%;padding:11px 14px;border-radius:999px;border:1px solid rgba(0,218,255,.4);background:#0d5577;color:#fff;font-weight:900;cursor:pointer">↻ Buchmacherquoten neu laden</button>'+
    '<select id="biTennisBookmakerSelect" disabled style="width:100%;margin-top:10px;padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)"><option value="">Zuerst Markt und Auswahl wählen</option></select>';
  host.appendChild(wrap);
  $('biTennisOddsReload').addEventListener('click',()=>loadOddsForCurrentMarket(true));
  $('biTennisBookmakerSelect').addEventListener('change',()=>{
    const idx=Number($('biTennisBookmakerSelect').value);
    const row=Number.isInteger(idx)?currentOddsRows[idx]:null;
    if(row)fillCoreReference(row);
  });
}
function oddsPanelNote(text,type=''){
  const el=$('biTennisOddsNote');if(!el)return;
  el.textContent=text||'';
  el.style.color=type==='error'?'#ff9d9d':type==='ok'?'#9ff3cf':'#cfe7f2';
}
function setBookmakerSelectState(message,disabled=true){
  const select=$('biTennisBookmakerSelect');
  if(!select)return;
  select.innerHTML='';
  const o=document.createElement('option');
  o.value='';
  o.textContent=message;
  select.appendChild(o);
  select.value='';
  select.disabled=disabled;
}
function renderBookmakerChoices(){
  mountTennisOddsPanel();
  clearCoreSelectedReference();
  const select=$('biTennisBookmakerSelect');if(!select)return;
  const chosen=clean(selectionField()?.value);
  select.innerHTML='<option value="">Buchmacher auswählen</option>';
  if(!chosen){select.disabled=true;oddsPanelNote('Bitte zuerst eine Auswahl treffen.');return;}
  const matches=[];
  currentOddsRows.forEach((row,idx)=>{if(row.label===chosen)matches.push({row,idx})});
  for(const {row,idx} of matches){
    const o=document.createElement('option');o.value=String(idx);
    o.textContent=row.bookmaker+' · Quote '+row.price+(row.link?' · Link verfügbar':'');
    select.appendChild(o);
  }
  select.disabled=matches.length===0;
  oddsPanelNote(matches.length
    ? matches.length+' Buchmacherquote'+(matches.length===1?'':'n')+' für diese Auswahl verfügbar.'
    :'Für genau diese Auswahl liefert die API aktuell keine Buchmacherquote. Bitte manuelle Quelle/Quote verwenden.',
    matches.length?'ok':'error');
}
async function loadOddsForCurrentMarket(force=false){
  if(sportMode!=='Tennis')return;
  mountTennisOddsPanel();
  const meta=window.__biTennisMeta||{};
  const market=clean(marketField()?.value);
  const key=apiMarketKey(market);
  currentOddsRows=[];
  const select=$('biTennisBookmakerSelect');
  setBookmakerSelectState('Buchmacher werden geladen …',true);
  if(!meta.api_event_id||!meta.api_sport_key){
    clearCoreSelectedReference();
    setBookmakerSelectState('Manuelles Match · Buchmacher/Quote unten manuell eintragen',true);
    oddsPanelNote('Manuelles Tennis-Match: Buchmacher und Quote bitte im gelben Feld manuell eintragen.');
    prepareCoreReference(false);
    return;
  }
  if(!key){
    clearCoreSelectedReference();
    setBookmakerSelectState('Keine API-Quote für diesen Markt · manuelle Eingabe verwenden',true);
    oddsPanelNote('Dieser Tennis-Markt wird von unserer Buchmacher-API derzeit nicht automatisch geliefert. Buchmacher und Quote bitte im gelben Feld manuell eintragen.');
    prepareCoreReference(false);
    return;
  }
  prepareCoreReference(true);
  const cacheKey=meta.api_sport_key+'|'+meta.api_event_id+'|'+key;
  try{
    let data=!force?oddsCache.get(cacheKey):null;
    if(!data){
      data=await apiRequest('odds',meta.api_sport_key,{event_id:meta.api_event_id,market_key:key});
      oddsCache.set(cacheKey,data);
    }
    const body=data?.odds||{};
    const rows=[];
    for(const b of (Array.isArray(body.bookmakers)?body.bookmakers:[])){
      for(const m of (Array.isArray(b.markets)?b.markets:[])){
        if(clean(m.key)!==key)continue;
        for(const out of (Array.isArray(m.outcomes)?m.outcomes:[])){
          const label=outcomeLabel(out,key);
          const price=Number(out.price);
          if(!label||!Number.isFinite(price))continue;
          rows.push({bookmaker:clean(b.title||b.key),bookmaker_key:clean(b.key),label,price:String(price),link:clean(out.link||m.link||b.link)});
        }
      }
    }
    currentOddsRows=rows;
    const options=[...new Set(rows.map(r=>r.label))];
    const current=clean(selectionField()?.value);
    setSelectionOptions(options,'Bitte Auswahl treffen');
    if(current&&options.includes(current))selectionField().value=current;
    renderBookmakerChoices();
    if(!rows.length){
      setBookmakerSelectState('Aktuell keine Buchmacherquote verfügbar · manuelle Eingabe verwenden',true);
    }
    oddsPanelNote(rows.length
      ? rows.length+' verfügbare Buchmacherquoten geladen. Auswahl festlegen und danach Buchmacher auswählen.'
      :'Für diesen Markt sind aktuell keine Buchmacherquoten vorhanden. Buchmacher und Quote bitte manuell eintragen.',
      rows.length?'ok':'error');
  }catch(e){
    setBookmakerSelectState('API-Abfrage fehlgeschlagen · manuelle Eingabe verwenden',true);
    oddsPanelNote(e.message||'Buchmacherquoten konnten nicht geladen werden.','error');
  }
}
function setSelectionOptions(options,placeholder='Bitte auswählen'){
  const el=selectionField();
  if(!el){setStatus('Das Auswahl-Feld des Terminals wurde nicht gefunden.','error');return}
  if(el.tagName!=='SELECT'){el.value='';el.placeholder=placeholder;return}
  el.innerHTML='';
  const first=document.createElement('option');first.value='';first.textContent=placeholder;el.appendChild(first);
  options.filter(Boolean).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.appendChild(o)});
  el.disabled=false;
}
function lineOptions(kind){
  const [p1,p2]=tennisPlayers(); const out=[];
  if(kind==='match_total') for(let x=17.5;x<=31.5;x+=1){const l=String(x).replace('.',',');out.push('Über '+l+' Games','Unter '+l+' Games')}
  if(kind==='set_total') for(let x=6.5;x<=13.5;x+=1){const l=String(x).replace('.',',');out.push('Über '+l+' Games','Unter '+l+' Games')}
  if(kind==='game_hcap') for(const p of [p1,p2].filter(Boolean)) for(let x=-6.5;x<=6.5;x+=1){if(Math.abs(x)<.01)continue;out.push(p+' '+(x>0?'+':'')+String(x).replace('.',',')+' Games')}
  if(kind==='set_hcap') for(const p of [p1,p2].filter(Boolean)) [-2.5,-1.5,1.5,2.5].forEach(x=>out.push(p+' '+(x>0?'+':'')+String(x).replace('.',',')+' Sätze'));
  return out;
}
function populateTennisSelection(){
  if(sportMode!=='Tennis') return;
  const market=clean(marketField()?.value); const [p1,p2]=tennisPlayers();
  if(!market){setSelectionOptions([],'Zuerst Markt auswählen');currentOddsRows=[];renderBookmakerChoices();return}
  if(apiMarketKey(market)&&window.__biTennisMeta?.api_event_id){
    loadOddsForCurrentMarket(false);
    return;
  }
  currentOddsRows=[];
  let options=[];
  if(market==='Matchsieger'||/^Satz [1-3] Sieger$/.test(market)) options=[p1,p2];
  else if(market==='Exaktes Satzergebnis') options=[p1+' 2:0',p1+' 2:1',p2+' 2:0',p2+' 2:1',p1+' 3:0',p1+' 3:1',p1+' 3:2',p2+' 3:0',p2+' 3:1',p2+' 3:2'];
  else if(market==='Satz Handicap') options=lineOptions('set_hcap');
  else if(market==='Game Handicap') options=lineOptions('game_hcap');
  else if(market==='Games Over/Under Match') options=lineOptions('match_total');
  else if(/^Games Over\/Under Satz [1-2]$/.test(market)) options=lineOptions('set_total');
  else if(market==='Sätze Over/Under') options=['Über 2,5 Sätze','Unter 2,5 Sätze','Über 3,5 Sätze','Unter 3,5 Sätze','Über 4,5 Sätze','Unter 4,5 Sätze'];
  else if(market==='Tie-Break im Match Ja/Nein'||market==='Beide gewinnen einen Satz Ja/Nein') options=['Ja','Nein'];
  else if(market==='Spieler gewinnt mindestens einen Satz') options=[p1+' – Ja',p1+' – Nein',p2+' – Ja',p2+' – Nein'];
  else if(market==='Erster Break') options=[p1,p2,'Kein Break im 1. Satz'];
  else if(market==='Eigener Markt'){
    const el=selectionField();
    if(el&&el.tagName==='SELECT'){el.innerHTML='<option value="Eigene Auswahl">Eigene Auswahl</option>';el.value='Eigene Auswahl';el.disabled=false}
    setBookmakerSelectState('Eigener Markt · Buchmacher/Quote manuell eintragen',true);
    oddsPanelNote('Eigener Markt: Auswahl und Buchmacherquote bitte manuell erfassen.');
    prepareCoreReference(false);
    setStatus('Eigener Markt: Auswahl bitte in der internen Notiz präzisieren.','');
    return;
  }
  setSelectionOptions(options,'Bitte Auswahl treffen');
  setBookmakerSelectState('Keine automatische API-Quote für diesen Markt · manuelle Eingabe verwenden',true);
  oddsPanelNote('Für diesen Tennis-Markt ist keine automatische Buchmacherquote hinterlegt. Buchmacher und Quote bitte im gelben Feld manuell eintragen.');
  prepareCoreReference(false);
}
function bindMarketHandler(){
  const m=marketField(); if(!m||m.dataset.biTennisBound==='1') return;
  m.dataset.biTennisBound='1';
  m.addEventListener('change',()=>{
    if(sportMode!=='Tennis') return;
    setTimeout(populateTennisSelection,0);
    setTimeout(populateTennisSelection,50);
  });
  document.addEventListener('change',event=>{
    if(sportMode!=='Tennis')return;
    if(event.target===selectionField())renderBookmakerChoices();
  },true);
}
function useMeta(meta,statusText){
  window.__biTennisMeta=meta;
  if(typeof window.__biUseManualEvent!=='function') throw new Error('Terminal-Brücke ist nicht verfügbar.');
  window.__biUseManualEvent(meta);
  addTennisMarkets();bindMarketHandler();mountTennisOddsPanel();
  const oddsWrap=$('biTennisOddsWrap');if(oddsWrap)oddsWrap.hidden=false;
  const alarm=$('biLiveAlarmOne');
  if(alarm){alarm.checked=true;alarm.disabled=true;alarm.title='Tennis-Tipps gehen automatisch an Live-Alarm 1.'}
  setTimeout(populateTennisSelection,0);
  setStatus(statusText,'ok');
}
function fillTournaments(items){
  const s=$('biTennisTournamentSelect'); if(!s)return;
  s.innerHTML='<option value="">Turnier auswählen</option>';
  items.forEach(t=>{const o=document.createElement('option');o.value=clean(t.sport_key);o.textContent='🎾 '+clean(t.title||t.sport_key);o.dataset.title=clean(t.title||t.sport_key);s.appendChild(o)});
  s.disabled=false;
}
async function loadTournaments(){
  setStatus('Aktive Tennis-Turniere werden über die API geladen …');
  try{
    const d=await apiRequest('tournaments');
    const items=Array.isArray(d?.tournaments)?d.tournaments:[];
    fillTournaments(items);tournamentsLoaded=true;
    setStatus(items.length+' aktive Tennis-Turniere geladen.');
  }catch(e){fillTournaments([]);setStatus(e.message||'Turniere konnten nicht geladen werden.','error')}
}
async function loadEvents(){
  const s=$('biTennisTournamentSelect'),e=$('biTennisEventSelect'),b=$('biTennisApplyApi');
  const key=clean(s?.value);eventsById.clear();
  e.innerHTML='<option value="">Match auswählen</option>';e.disabled=true;b.disabled=true;
  if(!key)return;
  setStatus('Matches werden über die BetInsight-Tennis-API geladen …');
  try{
    const d=await apiRequest('events',key);
    const now=Date.now()-300000;
    const items=(Array.isArray(d?.events)?d.events:[]).filter(x=>Date.parse(x.commence_time)>=now);
    items.forEach(x=>{
      const p=berlinParts(x.commence_time); if(!p)return;
      eventsById.set(clean(x.event_id),{...x,_p:p});
      const o=document.createElement('option');o.value=clean(x.event_id);o.textContent=p.label+' · '+clean(x.player_one)+' – '+clean(x.player_two);e.appendChild(o);
    });
    e.disabled=items.length===0;
    setStatus(items.length+' kommende Matches geladen.');
  }catch(err){setStatus(err.message||'Matches konnten nicht geladen werden.','error')}
}
function chooseEvent(){const id=clean($('biTennisEventSelect')?.value);$('biTennisApplyApi').disabled=!id}
function applyApi(){
  const ev=eventsById.get(clean($('biTennisEventSelect')?.value));
  if(!ev){setStatus('Bitte zuerst ein Match auswählen.','error');return}
  const p=ev._p||berlinParts(ev.commence_time);
  const title=clean($('biTennisTournamentSelect')?.selectedOptions?.[0]?.dataset?.title||ev.tournament);
  const meta={
    player_one:clean(ev.player_one),player_two:clean(ev.player_two),tournament:title,round:'',
    spiel_datum:p.date,anpfiff:p.time,api_event_id:clean(ev.event_id),
    sport_key:clean(ev.sport_key||$('biTennisTournamentSelect')?.value),
    api_sport_key:clean(ev.sport_key||$('biTennisTournamentSelect')?.value),
    api_commence_time:clean(ev.commence_time),api_match_status:'SCHEDULED',
    odds_api_status:'EXTERNAL_API',event_source:'ODDS_API_TENNIS',
    spielart:'Tennis',sportart:'Tennis',wettbewerb:title,home_team:clean(ev.player_one),away_team:clean(ev.player_two)
  };
  try{useMeta(meta,'✓ API-Match übernommen: '+meta.player_one+' – '+meta.player_two+' · '+p.label)}catch(e){setStatus(e.message,'error')}
}
function toggleManual(){
  const p=$('biTennisManualPanel');p.hidden=!p.hidden;
  $('biTennisManualToggle').textContent=p.hidden?'＋ Match nicht gefunden? Manuell erfassen':'− Manuelle Erfassung schließen';
}
function applyManual(){
  const meta={
    player_one:clean($('biTennisPlayer1')?.value),player_two:clean($('biTennisPlayer2')?.value),
    tournament:clean($('biTennisTournamentManual')?.value),round:clean($('biTennisRound')?.value),
    spiel_datum:clean($('biTennisDate')?.value),anpfiff:clean($('biTennisTime')?.value)
  };
  if(!meta.player_one||!meta.player_two||!meta.tournament||!meta.spiel_datum||!meta.anpfiff){setStatus('Bitte alle Pflichtfelder ausfüllen.','error');return}
  if(meta.spiel_datum+'T'+meta.anpfiff<=berlinNowKey()){setStatus('Der Matchbeginn muss in der Zukunft liegen.','error');return}
  Object.assign(meta,{manual_event_id:makeManualId(meta),api_event_id:'',api_sport_key:'tennis_manual',api_commence_time:'',api_match_status:'MANUAL_TENNIS',odds_api_status:'MANUAL',event_source:'MANUAL_TENNIS',spielart:'Tennis',sportart:'Tennis',wettbewerb:meta.tournament+(meta.round?' · '+meta.round:''),home_team:meta.player_one,away_team:meta.player_two});
  try{useMeta(meta,'✓ Manuelles Tennis-Match übernommen.')}catch(e){setStatus(e.message,'error')}
}
function clearTennis(){
  window.__biTennisMeta=null;eventsById.clear();removeTennisMarkets();
  const alarm=$('biLiveAlarmOne');if(alarm){alarm.disabled=false;alarm.title=''}
  try{if(typeof window.__biClearManualEvent==='function')window.__biClearManualEvent()}catch(e){}
}
function setMode(mode){
  sportMode=mode==='Tennis'?'Tennis':'Fussball';
  $('biTennisPanel').hidden=sportMode!=='Tennis';
  document.querySelectorAll('[data-bi-sport-btn]').forEach(btn=>{
    const active=btn.dataset.biSportBtn===sportMode;
    btn.setAttribute('aria-pressed',active?'true':'false');
    btn.style.borderColor=active?'rgba(0,218,255,.95)':'rgba(255,255,255,.18)';
    btn.style.background=active?'rgba(0,168,245,.22)':'rgba(255,255,255,.05)';
  });
  if(sportMode==='Tennis'){
    setFootballControlsDisabled(true);showFootballSection(false);addTennisMarkets();bindMarketHandler();mountTennisOddsPanel();
    const oddsWrap=$('biTennisOddsWrap');if(oddsWrap)oddsWrap.hidden=false;
    $('biSportNote').textContent='🎾 '+VERSION+' · Turnier, Match und verfügbare Buchmacherquoten werden automatisch geladen. Manuelle Eingabe ist nur Fallback.';
    if(!tournamentsLoaded)loadTournaments();
  }else{
    const oddsWrap=$('biTennisOddsWrap');if(oddsWrap)oddsWrap.hidden=true;
    prepareCoreReference(false);
    clearTennis();setFootballControlsDisabled(false);showFootballSection(true);
    $('biSportNote').textContent='⚽ Fußball: bisheriger Ablauf bleibt unverändert.';
  }
}
function mount(){
  if($('biSportModeWrap'))return;
  const liga=$('liga');
  const anchor=(liga&&liga.closest('section,article,fieldset,.card,.panel,.box'))||document.querySelector('form')||document.body;
  const wrap=document.createElement('section');wrap.id='biSportModeWrap';
  wrap.style.cssText='margin:0 0 18px;padding:16px;border:1px solid rgba(0,218,255,.40);border-radius:16px;background:linear-gradient(180deg,rgba(10,55,78,.96),rgba(6,29,42,.96));box-shadow:0 12px 28px rgba(0,0,0,.18)';
  wrap.innerHTML=
    '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px"><strong style="font-size:18px">Sportart</strong><span style="font-size:12px;color:#9ff3cf">'+VERSION+'</span></div>'+
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+
      '<button type="button" data-bi-sport-btn="Fussball" aria-pressed="true" style="padding:13px;border-radius:12px;border:1px solid rgba(0,218,255,.95);background:rgba(0,168,245,.22);color:#fff;font-weight:900;cursor:pointer">⚽ Fußball</button>'+
      '<button type="button" data-bi-sport-btn="Tennis" aria-pressed="false" style="padding:13px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#fff;font-weight:900;cursor:pointer">🎾 Tennis</button>'+
    '</div>'+
    '<div id="biSportNote" style="margin-top:9px;color:#b9d8e8;font-size:13px">⚽ Fußball: bisheriger Ablauf bleibt unverändert.</div>'+
    '<div id="biTennisPanel" hidden style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,.12)">'+
      '<div style="font-weight:900;margin-bottom:10px">Tennis-Match automatisch auswählen</div>'+
      '<select id="biTennisTournamentSelect" disabled style="width:100%;padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)"><option>Turniere werden geladen …</option></select>'+
      '<select id="biTennisEventSelect" disabled style="width:100%;margin-top:10px;padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(0,218,255,.35)"><option>Zuerst Turnier auswählen</option></select>'+
      '<button id="biTennisApplyApi" type="button" disabled style="width:100%;margin-top:10px;padding:12px 16px;border:0;border-radius:999px;background:#16a8f5;color:#fff;font-weight:900;cursor:pointer">✓ API-Match übernehmen</button>'+
      '<div id="biTennisStatus" style="min-height:20px;margin-top:9px;color:#b9d8e8;font-size:13px"></div>'+
      '<button id="biTennisManualToggle" type="button" style="width:100%;margin-top:8px;padding:11px;border-radius:12px;border:1px solid rgba(255,186,73,.42);background:rgba(255,186,73,.10);color:#ffe1a6;font-weight:900;cursor:pointer">＋ Match nicht gefunden? Manuell erfassen</button>'+
      '<div id="biTennisManualPanel" hidden style="margin-top:10px"><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+
        '<input id="biTennisPlayer1" placeholder="Spieler 1 *" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
        '<input id="biTennisPlayer2" placeholder="Spieler 2 *" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
        '<input id="biTennisTournamentManual" placeholder="Turnier *" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
        '<input id="biTennisRound" placeholder="Runde · optional" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
        '<input id="biTennisDate" type="date" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
        '<input id="biTennisTime" type="time" style="padding:12px;border-radius:10px;background:#061d2a;color:#fff;border:1px solid rgba(255,186,73,.35)">'+
      '</div><button id="biTennisApplyManual" type="button" style="width:100%;margin-top:10px;padding:12px;border:0;border-radius:999px;background:#a66b13;color:#fff;font-weight:900;cursor:pointer">✓ Manuelles Match übernehmen</button></div>'+
    '</div>';
  anchor.insertAdjacentElement('beforebegin',wrap);
  wrap.querySelectorAll('[data-bi-sport-btn]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.biSportBtn)));
  $('biTennisTournamentSelect').addEventListener('change',loadEvents);
  $('biTennisEventSelect').addEventListener('change',chooseEvent);
  $('biTennisApplyApi').addEventListener('click',applyApi);
  $('biTennisManualToggle').addEventListener('click',toggleManual);
  $('biTennisApplyManual').addEventListener('click',applyManual);
  bindMarketHandler();
}

// Bestehende Publish-Strecke bleibt bestehen; Tennis-Metadaten werden nur ergänzt.
const inheritedFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const meta=window.__biTennisMeta;
  const url=typeof input==='string'?input:(input&&input.url?String(input.url):'');
  const isPublish=url.includes('route=tip-historical-publish')||url.includes('jnj854h9aeg5iqny6prd3owgt4mpcd51');
  if(sportMode!=='Tennis'||!meta||!isPublish)return inheritedFetch(input,init);
  let opts=init?{...init}:{};
  try{
    const enrich=obj=>{
      obj.sportart='Tennis';obj.spiel=meta.player_one+' – '+meta.player_two;
      obj.liga=meta.wettbewerb;obj.home_team=meta.player_one;obj.away_team=meta.player_two;
      obj.spiel_datum=meta.spiel_datum.split('-').reverse().join('.');obj.anpfiff=meta.anpfiff;
      obj.api_sport_key=meta.api_sport_key||'tennis_manual';obj.api_event_id=meta.api_event_id||'';
      obj.api_event_home=meta.player_one;obj.api_event_away=meta.player_two;obj.api_commence_time=meta.api_commence_time||'';
      obj.api_match_status=meta.api_match_status||'MANUAL_TENNIS';obj.odds_api_status=meta.odds_api_status||'MANUAL';
      obj.event_source=meta.event_source||'MANUAL_TENNIS';obj.manual_event_id=meta.manual_event_id||'';obj.spielart='Tennis';obj.live_alarm_1='JA';
      const m=marketField(),s=selectionField();
      if(m?.value)obj.markt=m.value;
      if(s?.value)obj.tipp=s.value;
      return obj;
    };
    if(typeof opts.body==='string'){
      try{const o=JSON.parse(opts.body);opts.body=JSON.stringify(enrich(o))}catch(e){}
    }else if(typeof URLSearchParams!=='undefined'&&opts.body instanceof URLSearchParams){
      const o=enrich(Object.fromEntries(opts.body.entries()));const p=new URLSearchParams();Object.entries(o).forEach(([k,v])=>p.set(k,String(v??'')));opts.body=p;
    }else if(typeof FormData!=='undefined'&&opts.body instanceof FormData){
      const fd=new FormData();for(const [k,v] of opts.body.entries())fd.append(k,v);const o=enrich({});Object.entries(o).forEach(([k,v])=>fd.set(k,String(v??'')));opts.body=fd;
    }
  }catch(e){console.warn('BetInsight Tennis payload enrichment failed',e)}
  return inheritedFetch(input,opts);
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();