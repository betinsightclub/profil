import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = path => fs.readFileSync(path,'utf8');
const load = path => JSON.parse(read(path));
const manifest = load('assets/provider-whitelist-batches.json');
const data = load('assets/provider-whitelist.json');
function merge(target,source) {
  for(const [key,value] of Object.entries(source||{})) {
    if(value && typeof value==='object' && !Array.isArray(value)) {
      if(!target[key] || typeof target[key]!=='object' || Array.isArray(target[key])) target[key]={};
      merge(target[key],value);
    } else target[key]=value;
  }
  return target;
}
assert.equal(manifest.files.length,93,'all regulatory batches must be present');
for(const file of manifest.files) {
  assert.match(file,/^provider-whitelist-web-batch(?:-\d+)?\.json$/);
  merge(data,load('assets/'+file));
}
const countries=data.country_codes;
assert.equal(countries.length,250,'all 250 country/territory entries must load');
assert.equal(new Set(countries).size,countries.length,'country codes must be unique');
for(const language of ['de','en','es','pt','it','fr','nl','zh-tw']) {
  const d=load('assets/i18n/pages/providers/'+language+'.json').providersPage;
  for(const key of ['notVerified','albaniaNoLicense','verifiedZero','officialSource','noCrypto','noAllowed']) {
    assert.ok(d[key],language+' missing '+key);
  }
}

const nodes=new Map();
const listeners=Object.create(null);
function element(id) {
  let value='',html='',text='';
  const classes=new Set(['results','regionWrap','confirmedCountry','filterStep','statusBox','countryDropdownList'].includes(id)?['hidden']:[]);
  const e={
    id,disabled:false,placeholder:'',style:{},dataset:{},options:[],children:[],events:{},
    classList:{
      add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),
      toggle:(x,force)=>{const set=force===undefined?!classes.has(x):Boolean(force);set?classes.add(x):classes.delete(x);return set;}
    },
    addEventListener(name,handler){this.events[name]=handler;},
    dispatchEvent(event){return this.events[event.type]?.(event);},
    setAttribute(name,val){this[name]=String(val);},
    getAttribute(name){return this[name]||null;},
    querySelector(){return null;},querySelectorAll(){return [];},
    appendChild(child){this.children.push(child);return child;},
    contains(){return true;},focus(){},scrollIntoView(){},
  };
  Object.defineProperties(e,{
    value:{get:()=>value,set:x=>{value=String(x??'');}},
    innerHTML:{get:()=>html,set:x=>{
      html=String(x);
      if(id==='countrySelect'||id==='regionSelect'){
        e.options=[...html.matchAll(/<option\b[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)].map(m=>({value:m[1],textContent:m[2]}));
        value='';
      }
    }},
    textContent:{get:()=>text,set:x=>{text=String(x??'');if(id==='statusBox') e.children=[];}},
    selectedOptions:{get:()=>e.options.filter(o=>o.value===value)}
  });
  return e;
}
function el(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);}
const choices=['allowed','crypto','any'].map(mode=>Object.assign(element('choice-'+mode),{dataset:{mode}}));
const continents=['all','europe','north-america','south-america','asia','africa','oceania','other'].map(continent=>Object.assign(element('continent-'+continent),{dataset:{continent}}));
const document={
  getElementById:el,
  querySelectorAll(selector){if(selector==='.choice')return choices;if(selector==='.continent-button')return continents;return [];},
  createElement:tag=>element(tag),
  addEventListener(type,handler){listeners[type]=handler;},
  documentElement:{lang:'de'},
  activeElement:null
};
const window={
  BetInsightI18n:{
    getLanguage:()=> 'de',
    t:(key,vars={},fallback='')=>{
      const raw=load('assets/i18n/pages/providers/de.json').providersPage[key.replace(/^providersPage\./,'')];
      return raw?raw.replace(/\{\{(\w+)\}\}/g,(_,k)=>String(vars[k]??'')):fallback;
    }
  },
  BetInsightRegionalRestrictions:{
    ready:async()=>true,
    isBrazilBlocked:code=>code==='BR',
    rememberCountry:()=>{},clearRememberedCountry:()=>{},
    getMessages:()=>({title:'Für Brasilien derzeit nicht verfügbar',body:'In Brasilien nicht verfügbar.'})
  },
  addEventListener:()=>{}
};
const location={href:'https://app.betinsight.club/anbieter/',search:''};
let fetchCount=0;
async function fakeFetch(url) {
  const path=new URL(url,location.href).pathname.replace(/^\//,'');
  fetchCount++;
  const payload=load(path);
  return {ok:true,status:200,json:async()=>payload};
}
const html=read('anbieter/index.html');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!/src\s*=/.test(m[1]) && m[2].trim());
assert.equal(scripts.length,1,'exactly one inline selector controller');
const context=vm.createContext({document,window,location,fetch:fakeFetch,URL,Intl,Date,Event,Set,console});
new vm.Script(scripts[0][2],{filename:'anbieter/index.html'}).runInContext(context);

for(let i=0;i<300 && !el('dataStand').textContent.includes('2026');i++) await new Promise(resolve=>setTimeout(resolve,10));
assert.equal(fetchCount,95,'base + manifest + 93 regulatory batches requested');
assert.equal(el('countrySelect').options.length,251,'all 250 countries offered plus placeholder');
assert.equal(el('countryDropdownTrigger').disabled,false,'country picker must be enabled');

let cases=0,verifiedWithProviders=0,verifiedEmpty=0,pending=0,blocked=0,regionalCases=0;
const confirmed=el('confirmCountry'),change=el('changeCountry');
function assertView(country,region,mode,rule) {
  assert.equal(el('results').classList.contains('hidden'),false,country+'/'+region+'/'+mode+' must display a result');
  const noRule= !rule || rule.status!=='verified'||!Array.isArray(rule.providers);
  const permitted=noRule?[]:rule.providers.filter(x=>typeof x==='string'||x.allowed!==false);
  const expected=mode==='crypto'?permitted.filter(x=>typeof x!=='string'&&(x.crypto===true||x.crypto_status==='yes'||x.crypto_status==='confirmed')):permitted;
  const actual=(el('providerGrid').innerHTML.match(/class="provider-card"/g)||[]).length;
  assert.equal(actual,expected.length,country+'/'+region+'/'+mode+' displayed provider count');
  if(actual===0){
    assert.equal(el('statusBox').classList.contains('hidden'),false,country+'/'+region+'/'+mode+' must explain an empty result');
    assert.ok(el('statusBox').textContent.length>12,country+'/'+region+'/'+mode+' must have readable explanation');
  }else{
    assert.equal(el('statusBox').classList.contains('hidden'),true,country+'/'+region+'/'+mode+' should not show an error');
  }
  if(country==='AL' && !region && (mode==='any'||mode==='allowed')){
    assert.match(el('statusBox').textContent,/albanisch/i,'Albania must show its verified-empty explanation');
    assert.equal(el('statusBox').children.filter(x=>x.id==='a').length,1,'Albania must link to official register');
  }
  cases++;
}
async function select(country,region){
  change.events.click?.();
  el('countrySearch').value='';
  // Exercise the same custom country-option handler as a real click.
  const option={dataset:{country},closest:()=>option};
  el('countryDropdownList').events.click({target:option});
  assert.equal(el('countrySelect').value,country,'country dropdown click failed '+country);
  const regionOptions=data.regions?.[country]||[];
  if(regionOptions.length){
    assert.equal(confirmed.disabled,true,country+' requires a region');
    el('regionSelect').value=region;
    el('regionSelect').events.change();
  }
  assert.equal(confirmed.disabled,false,country+'/'+region+' confirmation must be enabled');
  await confirmed.events.click();
  if(country==='BR'){
    assert.equal(el('filterStep').classList.contains('hidden'),true,'Brazil restrictions must remain');
    assert.equal(el('statusBox').classList.contains('hidden'),false,'Brazil must show blocking message');
    assert.equal(el('providerGrid').innerHTML,'','Brazil must show no providers');
    blocked++;
    return;
  }
  assert.equal(el('filterStep').classList.contains('hidden'),false,country+'/'+region+' must offer all three choices');
  assert.equal(el('results').classList.contains('hidden'),false,country+'/'+region+' auto-result must be shown');
  assertView(country,region,'any',getExpectedRule(country,region));
  for(const mode of ['allowed','crypto','any']){
    const choice=choices.find(x=>x.dataset.mode===mode);
    assert.ok(choice.events.click,country+' missing '+mode+' handler');
    choice.events.click();
    assert.equal(choice.classList.contains('active'),true,country+'/'+region+'/'+mode+' must be visibly selected');
    assertView(country,region,mode,getExpectedRule(country,region));
  }
}
function getExpectedRule(country,region){
  const base=data.country_rules?.[country];
  return region && base?.regions?.[region] ? base.regions[region]:base;
}
for(const country of countries) {
  const regions=data.regions?.[country]||[];
  assert.equal(new Set(regions.map(x=>x.code)).size,regions.length,'duplicate region '+country);
  const selected=regions.length?regions:[null];
  for(const regionObj of selected){
    const region=regionObj?.code||'';
    if(region)regionalCases++;
    const rule=getExpectedRule(country,region);
    if(country!=='BR'){
      if(rule?.status==='verified'&&Array.isArray(rule.providers)){
        if(rule.providers.some(p=>typeof p==='string'||p.allowed!==false))verifiedWithProviders++;
        else verifiedEmpty++;
      }else pending++;
    }
    await select(country,region);
  }
}
console.log('PASS country-selector live-controller regression: '+countries.length+' countries/territories, '+regionalCases+' regional paths, '+cases+' mode/result assertions (including auto-results), '+verifiedWithProviders+' jurisdictions with approved providers, '+verifiedEmpty+' verified-empty, '+pending+' unverified, '+blocked+' blocked Brazil, '+fetchCount+' files fetched.');