/* TIME CLASH · playable historic squads · 2026-10-25
   Reconstruction is simulated, never a claim of historical player identity. */
(function(){
 "use strict";
 const club=window.TC_CLUB_CATALOG=window.TC_CLUB_CATALOG||{};
 const nation=window.TC_ADDITIONAL_NATIONS=window.TC_ADDITIONAL_NATIONS||{};
 const russianClubs=[
  "Spartak Moskau 1996|🇷🇺|80",
  "ZSKA Moskau 2005|🇷🇺|81",
  "Zenit St. Petersburg 2007|🇷🇺|81",
  "Rubin Kasan 2008|🇷🇺|79",
  "Lokomotive Moskau 2004|🇷🇺|79"
 ];
 club["Russland · Meister (Auswahl)"]=russianClubs;
 // A distinct competition-group label avoids suggesting these are World Cup winners.
 nation["Europa · Russland"]=[
  "Russland 2008 · EM-Halbfinale|🇷🇺|80",
  "Russland 2018 · WM-Viertelfinale|🇷🇺|79"
 ];
 const source=window.TC_ROSTER_DB=window.TC_ROSTER_DB||{};
 const seen=[];
 const all=[...Object.values(club).flat(),...Object.values(nation).flat()];
 const roles=["TW","ABW","ABW","ABW","ABW","MIT","MIT","MIT","MIT","ST","ST","TW","ABW","ABW","MIT","MIT","ST","ST"];
 for(const entry of all){
  const key=String(entry).split("|")[0];
  if(!key||seen.includes(key))continue;
  seen.push(key);
  const real=Array.isArray(source[key])?source[key].map(p=>({...p})):[];
  const name=String(key).replace(/[^a-z0-9]+/gi,"-").toLowerCase();
  const actualIds=new Set(real.map(p=>String(p.id||p.name)));
  let augmented=real.slice();
  const hasKeeper=real.some(p=>/^(TW|GK)$/i.test(String(p.pos||""))||/torwart|goalkeeper/i.test(String(p.prole||p.role||"")));
  // A goalkeeper must exist. Do not change real player records.
  if(!hasKeeper){
   // Force the reconstructed goalkeeper into the XI when the archived XI has none.
   // Historical membership is retained; one outfield player becomes a reserve.
   const starters=augmented.filter((p,i)=>p.starter===true||(p.starter===undefined&&i<11));
   if(starters.length>=11){
    const candidate=augmented.findLastIndex(p=>p.starter===true);
    if(candidate>=0)augmented[candidate].starter=false;
    else if(augmented.length>=11)augmented[10].starter=false;
   }
   augmented.push({id:"tc-reconstruction-"+name+"-gk",name:"Rekonstruktion · Torwart",pos:"TW",prole:"Torwart",impact:3,starter:true,squadIndex:augmented.length,reconstructed:true,provenance:"SIMULATION_ONLY"});
  }
  let ix=0;
  while(augmented.length<18){
   const role=roles[ix%roles.length]==="TW"?"ABW":roles[ix%roles.length];
   const label=role==="ABW"?"Abwehr":role==="MIT"?"Mittelfeld":"Sturm";
   const id="tc-reconstruction-"+name+"-"+(++ix);
   if(actualIds.has(id))continue;
   augmented.push({id,name:"Rekonstruktion · "+label+" "+ix,pos:role,prole:label,impact:3,starter:false,squadIndex:augmented.length,reconstructed:true,provenance:"SIMULATION_ONLY"});
  }
  if(real.length<18||!hasKeeper)source[key]=augmented;
 }
 window.TC_RECONSTRUCTION_STATUS={catalogTeams:seen.length,reconstructionPolicy:"SIMULATION_ONLY",generatedOn:"2026-10-25"};
})();