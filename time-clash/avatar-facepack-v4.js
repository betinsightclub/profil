(function(){
"use strict";
const A=window.TimeClashAvatarAssets;
const B64=window.__TC_FACEPACK_V4||"";
if(!A||!B64){return}
const META={
"faces/player-m04":{x:0,y:0,w:144,h:144},
"faces/player-m05":{x:144,y:0,w:144,h:144},
"faces/player-m06":{x:288,y:0,w:144,h:144},
"faces/player-m07":{x:432,y:0,w:144,h:144},
"faces/player-m08":{x:0,y:144,w:144,h:144},
"faces/player-m09":{x:144,y:144,w:144,h:144},
"faces/player-m10":{x:288,y:144,w:144,h:144},
"faces/player-m11":{x:432,y:144,w:144,h:144},
"faces/player-m12":{x:0,y:288,w:144,h:144},
"faces/player-m13":{x:144,y:288,w:144,h:144},
"faces/player-m14":{x:288,y:288,w:144,h:144},
"faces/player-m15":{x:432,y:288,w:144,h:144},
"faces/player-m16":{x:0,y:432,w:144,h:144},
"faces/player-m17":{x:144,y:432,w:144,h:144}
};
let url="";
function faceSpriteUrl(){
 if(url)return url;
 const bin=atob(B64),bytes=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 url=URL.createObjectURL(new Blob([bytes],{type:"image/webp"}));
 return url;
}
const oldCell=A.cell.bind(A),oldSvg=A.svgImage.bind(A);
A.cell=function(key){return META[key]||oldCell(key)};
A.svgImage=function(key,x,y,w,h,extra=""){
 const m=META[key];
 if(!m)return oldSvg(key,x,y,w,h,extra);
 return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${m.x} ${m.y} ${m.w} ${m.h}" preserveAspectRatio="xMidYMid meet" ${extra}><image href="${faceSpriteUrl()}" x="0" y="0" width="576" height="576" preserveAspectRatio="none"/></svg>`;
};
A.meta=Object.assign(A.meta||{},META);
A.keys=Array.from(new Set([...(A.keys||[]),...Object.keys(META)]));
A.faceSpriteV4=faceSpriteUrl;
window.__TC_FACEPACK_V4="";
})();