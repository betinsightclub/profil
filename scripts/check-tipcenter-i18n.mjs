// BetInsight Tipp-Center localization guard. Read-only, no secrets or APIs.
// Run: node scripts/check-tipcenter-i18n.mjs
import { readFileSync } from "node:fs";
import { exit } from "node:process";

const html=readFileSync("tipps/index.html","utf8");
const languages=["de","en","es","pt","it","fr","nl","zh-tw"];
const errors=[];
const keys=[...html.matchAll(/data-bi-i18n(?:-aria-label|-title|-placeholder)?="tipsCenter\.([\w-]+)"/g)].map(x=>x[1]);
const required=new Set(keys);
const newCardKeys=[
 "weeklyBadge","weeklyName","weeklyDesc",
 "emptyAriatipsters","emptyTitletipsters","emptyDesctipsters",
 "emptyAriaai","emptyTitleai","emptyDescai",
 "emptyAriastrategies","emptyTitlestrategies","emptyDescstrategies",
 "emptyBadge","emptyStatus","miniDisclaimer","miniBalance","miniSettled"
];
newCardKeys.forEach(key=>required.add(key));

// Check a high-risk area: every text-bearing element of the tipster cards
// must declare a locale key, except names of actual people.
const grid=html.match(/<div class="provider-grid">([\s\S]*?)<\/div>\s*<p class="mini-disclaimer"/)?.[1] || "";
if(!grid)errors.push("Tipster card area not found");
else{
 const tags=["pro-name","pro-sub","pill","placeholder-status"];
 for(const tag of tags){
  const re=new RegExp('<span class="[^"]*\\b'+tag+'\\b[^"]*"([^>]*)>([^<]+)<\\/span>','g');
  for(const m of grid.matchAll(re)){
   if(["Martin","Frank"].includes(m[2].trim()))continue;
   if(!m[1].includes("data-bi-i18n="))errors.push('Untranslated card label: '+m[2].trim());
  }
 }
}

for(const language of languages){
 const path="assets/i18n/pages/tips/"+language+".json";
 let data;
 try{data=JSON.parse(readFileSync(path,"utf8")).tipsCenter||{}}catch(e){errors.push(language+": invalid/missing locale JSON: "+e.message);continue}
 for(const key of required){
  if(typeof data[key]!=="string" || !data[key].trim())errors.push(language+": missing tipsCenter."+key);
 }
}

// Generated card statistics must call tr() rather than hardcode German labels.
if(html.includes('{label:"Bilanz (U)"')||html.includes('{label:"Abgerechnet"'))errors.push("Hardcoded mini-stat labels detected");
if(errors.length){console.error("BetInsight i18n audit failed:\n"+errors.map(x=>" - "+x).join("\n"));exit(1)}
console.log("BetInsight tip center i18n keys and card labels: PASS ("+languages.length+" languages; "+required.size+" required keys)");
