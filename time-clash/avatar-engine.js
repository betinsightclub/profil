(()=>{
const A=()=>window.TimeClashAvatarAssets;
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const safeHex=(v,d)=>/^#[0-9a-fA-F]{6}$/.test(String(v||""))?String(v):d;
const rgb=hex=>{const s=safeHex(hex,"#3a2418").slice(1),n=parseInt(s,16);return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}};
const id=()=>"tc"+Math.random().toString(36).slice(2,9);

const PLAYER_FACES=["faces/player-m01","faces/player-m02","faces/player-m03"];
const COACH_FACES_M=["faces/coach-m01","faces/coach-m02","faces/coach-m03","faces/coach-m04"];
const COACH_FACES_F=["faces/coach-f01","faces/coach-f02","faces/coach-f03","faces/coach-f05"];
const HAIR_M=["none","hair/m-buzz","hair/m-short-classic","hair/m-short-textured","hair/m-sidepart","hair/m-messy","hair/m-curly","hair/m-long-wavy","hair/m-long-straight"];
const HAIR_F=["none","hair/f-bun","hair/f-high-ponytail","hair/f-lob","hair/f-curly","hair/f-long-straight","hair/f-long-wavy"];
const BROWS=["original","brows/b01","brows/b03","brows/b05","brows/b07"];
const BEARDS=["none","beard/beard-light","beard/beard-anchor","beard/beard-goatee","beard/beard-mustache","beard/beard-full"];

function mapLegacyFace(a){
 const raw=String(a?.faceAsset||""); if(PLAYER_FACES.includes(raw))return raw;
 const old=String(a?.faceBase||""); const m={real01:PLAYER_FACES[0],real02:PLAYER_FACES[1],real03:PLAYER_FACES[2],real04:PLAYER_FACES[0],real05:PLAYER_FACES[1],real06:PLAYER_FACES[2],vector:PLAYER_FACES[0]};
 return m[old]||PLAYER_FACES[0];
}
function mapLegacyHair(a){
 const raw=String(a?.hairAsset||""); if(HAIR_M.includes(raw))return raw;
 const h=String(a?.hairStyle||a?.hairLength||"").toLowerCase();
 if(h==="bald")return "none"; if(h==="buzz"||h==="fade")return "hair/m-buzz"; if(h==="sidepart")return "hair/m-sidepart"; if(h==="slick")return "hair/m-short-classic"; if(h==="curly"||h==="coily")return "hair/m-curly"; if(h==="wavy"||h==="medium")return "hair/m-messy"; if(h==="long")return "hair/m-long-wavy"; return "hair/m-short-textured";
}
function mapLegacyBeard(a){
 const raw=String(a?.beardAsset||""); if(BEARDS.includes(raw))return raw;
 const b=String(a?.beard||"").toLowerCase(); if(b==="none"||!b)return "none"; if(b==="mustache")return "beard/beard-mustache"; if(b==="goatee")return "beard/beard-goatee"; if(b==="full")return "beard/beard-full"; if(b==="combo")return "beard/beard-anchor"; return "beard/beard-light";
}
function normalize(a={}){
 return {
  avatarVersion:3,kind:"player",
  height:clamp(a.height||182,150,220),build:["slim","athletic","strong","stocky"].includes(a.build)?a.build:"athletic",chestWidth:clamp(a.chestWidth??50,35,65),legLength:clamp(a.legLength??50,35,65),
  faceAsset:mapLegacyFace(a),hairAsset:mapLegacyHair(a),browAsset:BROWS.includes(a.browAsset)?a.browAsset:"original",beardAsset:mapLegacyBeard(a),hairColor:safeHex(a.hairColor,"#3a2418"),
  kitStyle:["solid","vertical","horizontal","diagonal","halves","pinstripe","gradient"].includes(a.kitStyle)?a.kitStyle:"solid",stripeCount:clamp(a.stripeCount??5,2,9),stripeWidth:["narrow","medium","wide"].includes(a.stripeWidth)?a.stripeWidth:"medium",kit1:safeHex(a.kit1,"#25a9ff"),kit2:safeHex(a.kit2,"#f7c64e"),kit3:safeHex(a.kit3,"#ffffff"),shirtNo:clamp(a.shirtNo||10,1,99),shirtName:String(a.shirtName||"")
 };
}
function normalizeCoach(a={}){
 let face=String(a.faceAsset||COACH_FACES_M[0]),gender=String(a.gender||"");
 if(COACH_FACES_F.includes(face))gender="female"; else if(COACH_FACES_M.includes(face))gender="male"; else {gender=gender==="female"?"female":"male";face=gender==="female"?COACH_FACES_F[0]:COACH_FACES_M[0]}
 const hairs=gender==="female"?HAIR_F:HAIR_M;
 return {avatarVersion:3,kind:"coach",gender,faceAsset:face,hairAsset:hairs.includes(a.hairAsset)?a.hairAsset:(gender==="female"?"hair/f-lob":"hair/m-short-classic"),browAsset:BROWS.includes(a.browAsset)?a.browAsset:"original",beardAsset:gender==="male"&&BEARDS.includes(a.beardAsset)?a.beardAsset:"none",hairColor:safeHex(a.hairColor,"#3a2418")};
}
function asset(key,x,y,w,h,filter=""){
 if(!key||key==="none"||key==="original"||!A()?.cell(key))return "";
 return `<g${filter?` filter="url(#${filter})"`:""}>${A().svgImage(key,x,y,w,h)}</g>`;
}
function tintDef(fid,color){
 const c=rgb(color),sr=Math.max(.08,c.r/170),sg=Math.max(.08,c.g/170),sb=Math.max(.08,c.b/170);
 return `<filter id="${fid}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="${sr.toFixed(3)}"/><feFuncG type="linear" slope="${sg.toFixed(3)}"/><feFuncB type="linear" slope="${sb.toFixed(3)}"/><feFuncA type="identity"/></feComponentTransfer></filter>`;
}
function kitPattern(a,pid){
 const c1=a.kit1,c2=a.kit2,c3=a.kit3,count=Math.round(a.stripeCount),mode=a.kitStyle,width=a.stripeWidth==="narrow"?.62:a.stripeWidth==="wide"?1.38:1,base=100/count,sw=base*width;
 if(mode==="solid")return `<linearGradient id="${pid}"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`;
 if(mode==="halves")return `<linearGradient id="${pid}"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
 if(mode==="gradient")return `<linearGradient id="${pid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset=".68" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>`;
 if(mode==="horizontal")return `<pattern id="${pid}" width="100" height="${base*2}" patternUnits="userSpaceOnUse"><rect width="100" height="${base*2}" fill="${c1}"/><rect width="100" height="${sw}" fill="${c2}"/></pattern>`;
 if(mode==="diagonal")return `<pattern id="${pid}" width="${base*2}" height="${base*2}" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><rect width="${base*2}" height="${base*2}" fill="${c1}"/><rect width="${sw}" height="${base*2}" fill="${c2}"/></pattern>`;
 if(mode==="pinstripe")return `<pattern id="${pid}" width="${Math.max(8,base)}" height="100" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="${c1}"/><rect width="${Math.max(1.5,sw*.22)}" height="100" fill="${c2}"/></pattern>`;
 return `<pattern id="${pid}" width="${base*2}" height="100" patternUnits="userSpaceOnUse"><rect width="${base*2}" height="100" fill="${c1}"/><rect width="${sw}" height="100" fill="${c2}"/></pattern>`;
}
function bodyFront(a,name){
 const body=a.build==="slim"?.88:a.build==="stocky"?1.17:a.build==="strong"?1.09:1,chest=body*(1+(a.chestWidth-50)*.006),w=82*chest,leg=78+(a.height-165)*.35+(a.legLength-50)*.24,pid=id();
 return `<defs>${kitPattern(a,pid)}</defs><ellipse cx="90" cy="286" rx="${50*body}" ry="7" fill="#000" opacity=".28"/><path d="M${90-w/2} 126 Q90 112 ${90+w/2} 126 L${90+w/2-7} 214 L${90-w/2+7} 214Z" fill="url(#${pid})"/><path d="M${90-w/2+8} 207 L80 ${252+leg*.20} L62 ${252+leg*.20} L70 204Z" fill="#102c3c"/><path d="M${90+w/2-8} 207 L100 ${252+leg*.20} L118 ${252+leg*.20} L110 204Z" fill="#102c3c"/><text x="90" y="181" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".65" paint-order="stroke" font-size="11" font-weight="900">${esc(name).slice(0,16)}</text>`;
}
function backPanel(a,name){const pid=id(),label=(a.shirtName||name||"").split(/\s+/).slice(-1)[0].toUpperCase().slice(0,12);return `<g transform="translate(178 48) scale(.58)"><defs>${kitPattern(a,pid)}</defs><path d="M48 82 Q90 66 132 82 L124 182 L56 182Z" fill="url(#${pid})" stroke="#ffffff22" stroke-width="1.5"/><text x="90" y="112" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="14" font-weight="900">${esc(label)}</text><text x="90" y="160" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="1.4" paint-order="stroke" font-size="46" font-weight="1000">${esc(a.shirtNo)}</text></g>`}
function headLayers(a,x=15,y=-16,w=150,h=150){
 const f=id(),defs=tintDef(f,a.hairColor);return {defs,html:asset(a.faceAsset,x,y,w,h)+asset(a.browAsset,x,y,w,h,f)+asset(a.beardAsset,x,y,w,h,f)+asset(a.hairAsset,x,y,w,h,f)};
}
function render(a0,name,mini=false,mode="both"){
 const a=normalize(a0),front=mode==="front",view=front?"20 0 180 300":"0 0 300 320",shift=front?20:38,h=headLayers(a);
 return `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg" cx=".5" cy=".2" r=".9"><stop stop-color="#10435a"/><stop offset="1" stop-color="#031019"/></radialGradient>${h.defs}</defs><rect width="${front?220:300}" height="330" rx="18" fill="url(#bg)"/><g transform="translate(${shift} 8)">${bodyFront(a,name)}${h.html}</g>${front?"":backPanel(a,name)}</svg>`;
}
function headSvg(a0,x=0,y=0,w=180,h=145){const a=normalize(a0),layers=headLayers(a);return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 180 145" overflow="visible"><defs>${layers.defs}</defs>${layers.html}</svg>`}
function renderCoach(a0,name="Coach"){
 const a=normalizeCoach(a0),f=id(),defs=tintDef(f,a.hairColor),x=15,y=-8,w=150,h=150;
 const head=asset(a.faceAsset,x,y,w,h)+asset(a.browAsset,x,y,w,h,f)+asset(a.beardAsset,x,y,w,h,f)+asset(a.hairAsset,x,y,w,h,f);
 return `<svg viewBox="0 0 180 235" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="cbg" cx=".5" cy=".18" r=".9"><stop stop-color="#174b63"/><stop offset="1" stop-color="#04131d"/></radialGradient>${defs}</defs><rect width="180" height="235" rx="16" fill="url(#cbg)"/><path d="M42 138 Q90 118 138 138 L148 228 H32Z" fill="#101b24"/><path d="M76 132 L90 151 L104 132 L118 228 H62Z" fill="#263744"/><path d="M85 147 L90 157 L95 147 L98 197 L90 207 L82 197Z" fill="#b88c3b" opacity=".9"/>${head}<text x="90" y="220" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="12" font-weight="900">${esc(name).slice(0,18)}</text></svg>`;
}
window.TimeClashAvatar={render,renderCoach,headSvg,normalize,normalizeCoach,kitPattern,assets:{PLAYER_FACES,COACH_FACES_M,COACH_FACES_F,HAIR_M,HAIR_F,BROWS,BEARDS}};
})();