'use strict';
/* Runtime regression: actual lazy-network renderer in all eight shipped languages.
   No logins, purchase mutations, or network requests are used. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..');
const LANGS=['de','en','es','pt','it','fr','nl','zh-tw'];
const source=fs.readFileSync(path.join(ROOT,'assets/network-lazy.js'),'utf8');
const anchor='  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();';
assert.equal(source.split(anchor).length,2,'Must instrument the real network renderer once');
const instrumented=source.replace(anchor,'  window.__networkTest={placeholderCard,renderLoadedLevel,loadedRows,refreshNetworkLabels};\n'+anchor);
const locales=Object.fromEntries(LANGS.map(lang=>[
 lang,JSON.parse(fs.readFileSync(path.join(ROOT,'assets/i18n/pages/dashboard',lang+'.json'),'utf8')).dashboardPage
]));
const headers=['biNumber','sponsor','purchasedUnits','totalConsumedUnits','usedPurchasedUnits','expectedReferral','releasedReferral'];
const metrics=['partner','purchased','expected','released'];

for(const lang of LANGS){
  let dict=locales[lang];
  const card={innerHTML:'',className:'',querySelectorAll:()=>[]};
  const translated={textContent:'',getAttribute:key=>key==='data-bi-network-label'?'totalConsumedUnits':null};
  const window={
    BetInsightI18n:{
      t:(key,vars={},fallback='')=>String(dict[key.replace('dashboardPage.','')]||fallback)
         .replace(/\{\{\s*(\w+)\s*\}\}/g,(_,name)=>String(vars[name]??''))
    }
  };
  const document={
    readyState:'loading',addEventListener(){},querySelectorAll:()=>[translated],
    getElementById(id){
      if(id.startsWith('levelCard'))return card;
      if(id==='referralPrivacyButton')return {classList:{contains:()=>false}};
      return {textContent:''};
    }
  };
  new Function('window','document','localStorage','MutationObserver',instrumented)(window,document,{},function(){});
  const test=window.__networkTest;
  assert.ok(test,lang+': renderer must expose testing hooks');

  test.renderLoadedLevel(1,[{
    user_id:'260000063',bi_nummer:'BI260000063',sponsor:'BI260000002',
    gekaufte_units:46.11,verbrauchte_units:4,verbrauchte_kauf_units:3.89,
    erwartete_referral_units:2.77,freigegebene_referral_units:0.23
  }],true);
  const html=card.innerHTML;
  for(const key of [...headers,...metrics]){
    assert.ok(dict[key],lang+': locale key '+key);
    assert.ok(html.includes('data-bi-network-label="'+key+'">'+dict[key]+'</span>'),
      lang+': runtime label '+key+' was not translated');
  }
  for(const value of ['46,11','3,89','2,77']){
    assert.ok(html.includes(value),lang+': unit values must remain unchanged');
  }
  assert.ok(html.includes(dict.directPartners),lang+': direct partner title');
  const placeholder=test.placeholderCard(2);
  for(const value of [dict.level.replace('{{level}}','2'),dict.levelLoadHint,dict.levelLoadInfo]){
    assert.ok(placeholder.includes(value),lang+': lazy placeholder not translated');
  }
  assert.ok(test.loadedRows([]).includes(dict.noPartnersLevel),lang+': empty level message');

  test.refreshNetworkLabels();
  assert.equal(translated.textContent,dict.totalConsumedUnits,lang+': initial label');
  const other=lang==='zh-tw'?'nl':'zh-tw';
  dict=locales[other];
  test.refreshNetworkLabels();
  assert.equal(translated.textContent,dict.totalConsumedUnits,lang+': live language change');
  console.log('PASS '+lang+' (7 headers, 4 metrics, levels, empty, switch, numerical values)');
}
console.log('All eight network i18n runtime tests passed.');
