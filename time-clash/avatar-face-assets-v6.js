/* TIME CLASH clean face assets v6 — direct individual data assets, no sprite/masks */
(()=>{
"use strict";
const A=window.TimeClashAvatarAssets;
const M=window.__TC_FACE_ASSETS_V6||{};
if(!A||!Object.keys(M).length)return;
const META=Object.fromEntries(Object.keys(M).map(k=>[k,{x:0,y:0,w:160,h:160,external:true,src:M[k]}]));
const PRESETS=["presets/player-hair-p01","presets/player-hair-p02","presets/player-hair-p03","presets/player-hair-p04"];
const oldCell=A.cell.bind(A),oldSvg=A.svgImage.bind(A);
A.cell=function(key){return META[key]||oldCell(key)};
A.svgImage=function(key,x,y,w,h,extra=""){
 const src=M[key];
 if(!src)return oldSvg(key,x,y,w,h,extra);
 return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 160 160" preserveAspectRatio="xMidYMid meet" ${extra}><image href="${src}" x="0" y="0" width="160" height="160" preserveAspectRatio="xMidYMid meet"/></svg>`;
};
A.meta=Object.assign(A.meta||{},META);
A.keys=Array.from(new Set([...(A.keys||[]),...Object.keys(M)]));
A.playerFacePresets=PRESETS;
})();
