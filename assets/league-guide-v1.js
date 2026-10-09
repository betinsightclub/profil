/* BetInsight league guide v1 – display-only catalogue and safe dropdown consolidation. */
(function () {
  'use strict';
  if (window.BetInsightLeagueGuide) return;
  const clean = v => String(v == null ? '' : v).trim();
  const norm = v => clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const matches = (v, re) => re.test(norm(v));
  const catalogue = [
    {key:'es1',flag:'🇪🇸',country:'Spanien',name:'La Liga',tier:'1. Liga',aliases:/^(la ?liga|primera division|spanien (1|erste) liga|spanish la liga)$/},
    {key:'es2',flag:'🇪🇸',country:'Spanien',name:'LaLiga 2',tier:'2. Liga',aliases:/^(la ?liga 2|segunda division|segunda division spanien|laliga hypermotion|la liga hypermotion|spanien (2|zweite) liga|spanien la liga 2|spanien liga 2|laliga 2 segunda division laliga hypermotion)$/},
    {key:'de1',flag:'🇩🇪',country:'Deutschland',name:'Bundesliga',tier:'1. Liga',aliases:/^(bundesliga|1 bundesliga|deutsche bundesliga|germany bundesliga)$/},
    {key:'de2',flag:'🇩🇪',country:'Deutschland',name:'2. Bundesliga',tier:'2. Liga',aliases:/^(2 bundesliga|zweite bundesliga|germany bundesliga 2)$/},
    {key:'de3',flag:'🇩🇪',country:'Deutschland',name:'3. Liga',tier:'3. Liga',aliases:/^(3 liga|dritte liga|germany 3 liga)$/},
    {key:'en1',flag:'🇬🇧',country:'England',name:'Premier League',tier:'1. Liga',aliases:/^(premier league|english premier league|england premier league)$/},
    {key:'en2',flag:'🇬🇧',country:'England',name:'Championship',tier:'2. Liga',aliases:/^(championship|efl championship|english championship)$/},
    {key:'it1',flag:'🇮🇹',country:'Italien',name:'Serie A',tier:'1. Liga',aliases:/^(serie a|italy serie a|italien serie a)$/},
    {key:'it2',flag:'🇮🇹',country:'Italien',name:'Serie B',tier:'2. Liga',aliases:/^(serie b|italy serie b|italien serie b)$/},
    {key:'fr1',flag:'🇫🇷',country:'Frankreich',name:'Ligue 1',tier:'1. Liga',aliases:/^(ligue 1|france ligue 1|frankreich ligue 1)$/},
    {key:'fr2',flag:'🇫🇷',country:'Frankreich',name:'Ligue 2',tier:'2. Liga',aliases:/^(ligue 2|france ligue 2|frankreich ligue 2)$/},
    {key:'pt1',flag:'🇵🇹',country:'Portugal',name:'Primeira Liga',tier:'1. Liga',aliases:/^(primeira liga|primera liga|liga portugal|liga portugal betclic|portugal primeira liga)$/},
    {key:'pt2',flag:'🇵🇹',country:'Portugal',name:'Liga Portugal 2',tier:'2. Liga',aliases:/^(liga portugal 2|liga portugal 2 meu super|segunda liga|portugal segunda liga)$/},
    {key:'nl1',flag:'🇳🇱',country:'Niederlande',name:'Eredivisie',tier:'1. Liga',aliases:/^(eredivisie|niederlande eredivisie)$/},
    {key:'nl2',flag:'🇳🇱',country:'Niederlande',name:'Eerste Divisie',tier:'2. Liga',aliases:/^(eerste divisie|keuken kampioen divisie|niederlande eerste divisie)$/},
    {key:'br1',flag:'🇧🇷',country:'Brasilien',name:'Brasileirão Série A',tier:'1. Liga',aliases:/^(brasileirao serie a|brasileiro serie a|brazil serie a|brasilien serie a)$/},
    {key:'br2',flag:'🇧🇷',country:'Brasilien',name:'Brasileirão Série B',tier:'2. Liga',aliases:/^(brasileirao serie b|brasileiro serie b|brazil serie b|brasilien serie b)$/},
    {key:'tr1',flag:'🇹🇷',country:'Türkei',name:'Süper Lig',tier:'1. Liga',aliases:/^(super lig|turkey super lig|turkei super lig)$/},
    {key:'at1',flag:'🇦🇹',country:'Österreich',name:'Bundesliga',tier:'1. Liga',aliases:/^(osterreich bundesliga|austrian bundesliga)$/},
    {key:'ch1',flag:'🇨🇭',country:'Schweiz',name:'Super League',tier:'1. Liga',aliases:/^(schweiz super league|swiss super league|swiss superleague)$/},
    {key:'us1',flag:'🇺🇸',country:'USA',name:'MLS',tier:'1. Liga',aliases:/^(mls|major league soccer|usa mls)$/}
  ];
  // A display name can contain a country and qualifier. Never merge two
  // competitions solely because their names have the same ordinal number.
  function identify(value) {
    const raw = clean(value).replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'');
    let name = norm(raw);
    name = name.replace(/ \((?:1|2|3) liga\)$/,'');
    name = name.replace(/ spanien segunda division$/,'');
    const hit = catalogue.find(c=>c.aliases.test(name));
    if (hit) return hit;
    if (/^la ?liga 2(?: |$)/.test(name)) return catalogue.find(c=>c.key==='es2');
    // Match the established friendly display values as well.
    return catalogue.find(c=>norm(c.name+' '+c.country+' '+c.tier)===name) || null;
  }
  const flags = [
    [/deutschland|germany|dfb|bundesliga|regionalliga|oberliga|dfb pokal/i,'🇩🇪'],
    [/spanien|spain|la ?liga|copa del rey|segunda|hypermotion/i,'🇪🇸'],
    [/england|english|premier league|efl|fa cup|championship/i,'🇬🇧'],
    [/italien|italy|serie [ab]|coppa italia/i,'🇮🇹'],
    [/frankreich|france|ligue [12]|coupe de france/i,'🇫🇷'],
    [/portugal|primeira liga|liga portugal/i,'🇵🇹'],
    [/niederlande|netherlands|eredivisie|eerste divisie/i,'🇳🇱'],
    [/brasilien|brazil|brasileir|carioca|paulista/i,'🇧🇷'],
    [/osterreich|österreich|austria/i,'🇦🇹'],
    [/schweiz|switzerland|swiss/i,'🇨🇭'],
    [/turkei|türkei|turkey|super lig|süper lig/i,'🇹🇷'],
    [/argentin|argentin|primera nacional/i,'🇦🇷'],
    [/mexiko|mexico|liga mx/i,'🇲🇽'],
    [/usa|united states|major league soccer|\bmls\b/i,'🇺🇸'],
    [/schottland|scotland|scottish/i,'🏴'],
    [/belgien|belgium|jupiler/i,'🇧🇪'],
    [/polen|poland|ekstraklasa/i,'🇵🇱'],
    [/danemark|dänemark|denmark/i,'🇩🇰'],
    [/norwegen|norway|eliteserien/i,'🇳🇴'],
    [/schweden|sweden|allsvenskan/i,'🇸🇪'],
    [/griechenland|greece|super league greece/i,'🇬🇷'],
    [/kroatien|croatia/i,'🇭🇷'],
    [/japan|j league|j1 league/i,'🇯🇵'],
    [/sudkorea|südkorea|south korea|k league/i,'🇰🇷'],
    [/china|chinese super league/i,'🇨🇳'],
    [/australien|australia|a league/i,'🇦🇺']
  ];
  function flag(value) {
    const hit=identify(value); if(hit)return hit.flag;
    const raw=clean(value);
    const f=flags.find(([re])=>re.test(raw));return f?f[1]:(/uefa|fifa|weltmeisterschaft|world cup|champions league|europa league|nations league/i.test(raw)?'🌍':'🌐');
  }
  function display(value) {
    const raw=clean(value),hit=identify(raw);
    if(hit) return hit.flag+' '+hit.name+' – '+hit.country+' ('+(hit.key==='es2'?'Segunda División':hit.tier)+')';
    const fl=flag(raw);
    return (raw.startsWith(fl)?'':fl+' ')+raw;
  }
  function explain(value,language) {
    const hit=identify(value); const en=/^en\b/i.test(clean(language));
    if(!hit)return '';
    if(hit.key==='es1')return en?'La Liga is the highest division of Spanish club football (first division).':'La Liga ist die höchste spanische Fußballliga (1. Liga).';
    if(hit.key==='es2')return en?'LaLiga 2 is Spain’s second-highest football division. It is also known as Segunda División or LaLiga Hypermotion.':'LaLiga 2 ist die zweithöchste spanische Fußballliga. Sie heißt auch Segunda División oder LaLiga Hypermotion.';
    return en?hit.name+' is the '+hit.tier.replace('1. Liga','first division').replace('2. Liga','second division').replace('3. Liga','third division')+' in '+hit.country+'.':hit.name+' ist die '+hit.tier+' in '+hit.country+'.';
  }
  function leagueSelect(select) {
    if(!select || select.tagName!=='SELECT')return false;
    if(select.id==='liga'||/^(liga|league|competition|wettbewerb)(?:[\[\]_\d-].*)?$/i.test(clean(select.name||select.dataset.field)))return true;
    if([...select.options].some(o=>/^(?:Liga auswählen|Zuerst Liga auswählen)$/i.test(clean(o.textContent))))return true;
    const parent=select.parentElement,lab=parent && parent.querySelector('label');
    return !!(lab && /^(Liga\s*\/\s*Wettbewerb|Liga\s*\*?\s*$)/i.test(clean(lab.textContent)));
  }
  function formatSelect(select) {
    if(!leagueSelect(select))return;
    let changed=false;
    const seen=new Set();
    const options=Array.from(select.options);
    // Prefer the canonical API-compatible value if it already exists.
    const canonical=options.find(o=>clean(o.value)==='LaLiga 2');
    for(const opt of options){
      const original=opt.dataset.biOriginalLeague||clean(opt.value)||clean(opt.textContent);
      if(!opt.dataset.biOriginalLeague) opt.dataset.biOriginalLeague=original;
      const hit=identify(original)||identify(opt.textContent);
      const raw=clean(opt.textContent);
      if(!raw || !clean(opt.value))continue;
      let key=hit?hit.key:'text:'+norm(raw.replace(/^[^a-zA-Z0-9]+/,''));
      if(hit?.key==='es2' && canonical && opt!==canonical){opt.remove();changed=true;continue;}
      if(seen.has(key)){opt.remove();changed=true;continue;}
      seen.add(key);
      const label=hit?display(hit.name+(hit.key==='es2'?'':' '+hit.country+' '+hit.tier)):display(raw);
      if(opt.textContent!==label){opt.textContent=label;changed=true;}
    }
    if(changed && select.selectedIndex<0) select.selectedIndex=0;
  }
  function applyDropdowns(root) {
    (root||document).querySelectorAll('select').forEach(formatSelect);
  }
  function activateDropdowns() {
    applyDropdowns();
    let pending=false;
    const observer=new MutationObserver(()=>{
      if(pending)return;
      pending=true;
      setTimeout(()=>{pending=false;applyDropdowns();},160);
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  window.BetInsightLeagueGuide={identify,flag,display,explain,applyDropdowns,activateDropdowns};
})();
