(()=>{
const A=()=>window.TimeClashAvatarAssets;
const P=()=>window.TimeClashBodyPack||{bodies:{},clothing:{},tattoos:{}};
const CT=()=>window.TimeClashTrainerBodiesByKey||{};
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const safeHex=(v,d)=>/^#[0-9a-fA-F]{6}$/.test(String(v||""))?String(v):d;
const rgb=hex=>{const s=safeHex(hex,"#3a2418").slice(1),n=parseInt(s,16);return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}};
const PLAYER_SKIN_MAP={"faces/player-m01":"#d7a17e","faces/player-m02":"#5a392d","faces/player-m03":"#d8a98d","faces/player-m04":"#7b4d35","faces/player-m05":"#563629","faces/player-m06":"#d2a282","faces/player-m07":"#bd8665","faces/player-m08":"#bd825c","faces/player-m09":"#a46d4c","faces/player-m10":"#c99775","faces/player-m11":"#c38a61","faces/player-m12":"#ad7858","faces/player-m13":"#d0a07f","faces/player-m14":"#d8ae95","faces/player-m15":"#d0a080","faces/player-m16":"#ae7959","faces/player-m17":"#d9aa8f","presets/player-hair-p01":"#c58a68","presets/player-hair-p02":"#bd8260","presets/player-hair-p03":"#c69272","presets/player-hair-p04":"#c28a68"};
const COACH_SKIN_MAP={"faces/coach-m01":"#c88f70","faces/coach-m02":"#b97e60","faces/coach-m03":"#c99a79","faces/coach-m04":"#694536","faces/coach-f01":"#d6a58b","faces/coach-f02":"#754b39","faces/coach-f03":"#d2a087","faces/coach-f05":"#c99a82"};
function toneHex(hex,brightness=0,warmth=0){
 const q=rgb(hex),b=clamp(brightness,-40,25),w=clamp(warmth,-20,20),m=1+b/100;
 const cv=n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,"0");
 return "#"+cv(q.r*m*(1+w*.0045))+cv(q.g*m*(1+w*.0012))+cv(q.b*m*(1-w*.0045));
}
const id=()=>"tc"+Math.random().toString(36).slice(2,9);

const PLAYER_FACES=["faces/player-m01","faces/player-m02","faces/player-m03","faces/player-m04","faces/player-m05","faces/player-m06","faces/player-m07","faces/player-m08","faces/player-m09","faces/player-m10","faces/player-m11","faces/player-m12","faces/player-m13","faces/player-m14","faces/player-m15","faces/player-m16","faces/player-m17"];
const PLAYER_FACE_PRESETS=["presets/player-hair-p01","presets/player-hair-p02","presets/player-hair-p03","presets/player-hair-p04"];
const COACH_FACES_M=["faces/coach-m01","faces/coach-m02","faces/coach-m03","faces/coach-m04"];
const COACH_FACES_F=["faces/coach-f01","faces/coach-f02","faces/coach-f03","faces/coach-f05"];
const HAIR_M=["none","hair/m-buzz","hair/m-short-classic","hair/m-short-textured","hair/m-sidepart","hair/m-messy","hair/m-curly","hair/m-long-wavy","hair/m-long-straight"];
const HAIR_F=["none","hair/f-bun","hair/f-high-ponytail","hair/f-lob","hair/f-curly","hair/f-long-straight","hair/f-long-wavy"];
const BROWS=["none","original","brows/b01","brows/b03","brows/b05","brows/b07"];
const BEARDS=["none","beard/stubble-light","beard/stubble-medium","beard/beard-light","beard/beard-anchor","beard/beard-goatee","beard/beard-mustache","beard/beard-full"];

function mapLegacyFace(a){
 const raw=String(a?.faceAsset||""); if(PLAYER_FACES.includes(raw)||PLAYER_FACE_PRESETS.includes(raw))return raw;
 const old=String(a?.faceBase||""); const m={real01:PLAYER_FACES[0],real02:PLAYER_FACES[1],real03:PLAYER_FACES[2],real04:PLAYER_FACES[0],real05:PLAYER_FACES[1],real06:PLAYER_FACES[2],vector:PLAYER_FACES[0]};
 return m[old]||PLAYER_FACES[0];
}
function mapLegacyHair(a){
 const raw=String(a?.hairAsset||""); if(HAIR_M.includes(raw))return raw;
 const h=String(a?.hairStyle||a?.hairLength||"").toLowerCase();
 if(!h)return "none"; if(h==="bald")return "none"; if(h==="buzz"||h==="fade")return "hair/m-buzz"; if(h==="sidepart")return "hair/m-sidepart"; if(h==="slick")return "hair/m-short-classic"; if(h==="curly"||h==="coily")return "hair/m-curly"; if(h==="wavy"||h==="medium")return "hair/m-messy"; if(h==="long")return "hair/m-long-wavy"; return "hair/m-short-textured";
}
function mapLegacyBeard(a){
 const raw=String(a?.beardAsset||""); if(BEARDS.includes(raw))return raw;
 const b=String(a?.beard||"").toLowerCase(); if(b==="none"||!b)return "none"; if(b==="mustache")return "beard/beard-mustache"; if(b==="goatee")return "beard/beard-goatee"; if(b==="full")return "beard/beard-full"; if(b==="combo")return "beard/beard-anchor"; return "beard/beard-light";
}
function normalize(a={}){
 const faceAsset=mapLegacyFace(a),faceIsPreset=PLAYER_FACE_PRESETS.includes(faceAsset),pack=P(),defaultBody={slim:"slim",athletic:"athletic",strong:"strong-athletic",stocky:"power"}[a.build]||"athletic",skinBrightness=clamp(a.skinBrightness??0,-40,25),skinWarmth=clamp(a.skinWarmth??0,-20,20),skin=toneHex(PLAYER_SKIN_MAP[faceAsset]||"#d7a17e",faceIsPreset?0:skinBrightness,faceIsPreset?0:skinWarmth);
 return {
  avatarVersion:3,kind:"player",
  height:clamp(a.height||182,150,220),build:["slim","athletic","strong","stocky"].includes(a.build)?a.build:"athletic",chestWidth:clamp(a.chestWidth??50,35,65),legLength:clamp(a.legLength??50,35,65),headScale:clamp(a.headScale??100,70,140),headX:clamp(a.headX??0,-35,35),headY:clamp(a.headY??0,-35,35),
  faceAsset,skin,skinBrightness,skinWarmth,
  hairAsset:faceIsPreset?"none":mapLegacyHair(a),browAsset:faceIsPreset?"none":(BROWS.includes(a.browAsset)?a.browAsset:"none"),beardAsset:faceIsPreset?"none":mapLegacyBeard(a),hairColor:safeHex(a.hairColor,"#3a2418"),
  hairX:clamp(a.hairX??0,-35,35),hairY:clamp(a.hairY??0,-35,35),hairScale:clamp(a.hairScale??100,10,200),
  browX:clamp(a.browX??0,-35,35),browY:clamp(a.browY??0,-35,35),browScale:clamp(a.browScale??100,10,200),
  beardX:clamp(a.beardX??0,-35,35),beardY:clamp(a.beardY??0,-35,35),beardScale:clamp(a.beardScale??100,10,200),
  bodyAsset:pack.bodies?.[a.bodyAsset]?a.bodyAsset:defaultBody,undershirtAsset:pack.clothing?.[a.undershirtAsset]?a.undershirtAsset:"",
  isCaptain:!!a.isCaptain,captainArmband:pack.clothing?.[a.captainArmband]?a.captainArmband:"captain-classic",
  leftTattooAsset:pack.tattoos?.[a.leftTattooAsset]?a.leftTattooAsset:"",rightTattooAsset:pack.tattoos?.[a.rightTattooAsset]?a.rightTattooAsset:"",neckTattooAsset:pack.tattoos?.[a.neckTattooAsset]?a.neckTattooAsset:"",
  leftTattooX:clamp(a.leftTattooX??0,-25,25),leftTattooY:clamp(a.leftTattooY??0,-35,35),leftTattooScale:clamp(a.leftTattooScale??100,45,170),rightTattooX:clamp(a.rightTattooX??0,-25,25),rightTattooY:clamp(a.rightTattooY??0,-35,35),rightTattooScale:clamp(a.rightTattooScale??100,45,170),neckTattooX:clamp(a.neckTattooX??0,-20,20),neckTattooY:clamp(a.neckTattooY??0,-20,20),neckTattooScale:clamp(a.neckTattooScale??100,45,170),
  kitStyle:["solid","vertical","horizontal","diagonal","halves","pinstripe","gradient"].includes(a.kitStyle)?a.kitStyle:"solid",stripeCount:clamp(a.stripeCount??5,2,9),stripeWidth:["narrow","medium","wide"].includes(a.stripeWidth)?a.stripeWidth:"medium",kit1:safeHex(a.kit1,"#25a9ff"),kit2:safeHex(a.kit2,"#f7c64e"),kit3:safeHex(a.kit3,"#ffffff"),shirtNo:clamp(a.shirtNo||10,1,99),shirtName:String(a.shirtName||"")
 };
}
function normalizeCoach(a={}){
 let face=String(a.faceAsset||COACH_FACES_M[0]),gender=String(a.gender||"");
 if(COACH_FACES_F.includes(face))gender="female"; else if(COACH_FACES_M.includes(face))gender="male"; else {gender=gender==="female"?"female":"male";face=gender==="female"?COACH_FACES_F[0]:COACH_FACES_M[0]}
 const hairs=gender==="female"?HAIR_F:HAIR_M,pack=window.TimeClashTrainerBodies||{male:[],female:[]},allowed=(pack[gender]||[]).map(x=>x.key),fallback=gender==="female"?"coach-m-suit-open":"coach-m-tracksuit",skinBrightness=clamp(a.skinBrightness??0,-40,25),skinWarmth=clamp(a.skinWarmth??0,-20,20),skin=toneHex(COACH_SKIN_MAP[face]||"#c99879",skinBrightness,skinWarmth);
 return {avatarVersion:4,kind:"coach",gender,bodyAsset:allowed.includes(a.bodyAsset)?a.bodyAsset:fallback,outfitColor:safeHex(a.outfitColor,"#223647"),outfitTint:clamp(a.outfitTint??0,0,70),faceAsset:face,hairAsset:hairs.includes(a.hairAsset)?a.hairAsset:"none",browAsset:BROWS.includes(a.browAsset)?a.browAsset:"none",beardAsset:gender==="male"&&BEARDS.includes(a.beardAsset)?a.beardAsset:"none",hairColor:safeHex(a.hairColor,"#3a2418"),skin,
  skinBrightness,skinWarmth,headScale:clamp(a.headScale??100,70,140),headX:clamp(a.headX??0,-35,35),headY:clamp(a.headY??0,-35,35),
  hairX:clamp(a.hairX??0,-35,35),hairY:clamp(a.hairY??0,-35,35),hairScale:clamp(a.hairScale??100,10,200),
  browX:clamp(a.browX??0,-35,35),browY:clamp(a.browY??0,-35,35),browScale:clamp(a.browScale??100,10,200),
  beardX:clamp(a.beardX??0,-35,35),beardY:clamp(a.beardY??0,-35,35),beardScale:clamp(a.beardScale??100,10,200)};
}
function asset(key,x,y,w,h,filter="",attrs=""){
 if(!key||key==="none"||key==="original"||!A()?.cell(key))return "";
 return `<g${attrs?" "+attrs:""}${filter?` filter="url(#${filter})"`:""}>${A().svgImage(key,x,y,w,h)}</g>`;
}
function stubbleAsset(key,x,y,w,h,filter="",tx=0,ty=0,scale=100,layer=""){
 const s=clamp(scale,10,200)/100,cx=x+w/2,cy=y+h/2,medium=String(key).includes("medium"),op=medium?.52:.30;
 const pts=[[.34,.55],[.39,.57],[.44,.59],[.49,.60],[.54,.59],[.59,.57],[.64,.55],[.31,.60],[.36,.63],[.41,.65],[.46,.67],[.51,.68],[.56,.67],[.61,.65],[.66,.62],[.29,.65],[.34,.69],[.39,.72],[.44,.74],[.49,.75],[.54,.74],[.59,.72],[.64,.69],[.69,.65],[.36,.52],[.42,.53],[.48,.54],[.54,.53],[.60,.52]];
 const marks=pts.map((p,i)=>`<ellipse cx="${(x+w*p[0]).toFixed(2)}" cy="${(y+h*p[1]).toFixed(2)}" rx="${medium?1.05:.78}" ry="${medium?1.45:1.05}" fill="#2b211c" opacity="${(op+(i%3)*.05).toFixed(2)}"/>`).join("");
 const jaw=`<path d="M ${x+w*.28} ${y+h*.58} Q ${x+w*.33} ${y+h*.79} ${x+w*.50} ${y+h*.82} Q ${x+w*.67} ${y+h*.79} ${x+w*.72} ${y+h*.58}" fill="none" stroke="#2b211c" stroke-width="${medium?3.2:2.0}" stroke-linecap="round" opacity="${medium?.22:.13}"/>`;
 return `<g data-avatar-layer="${esc(layer)}" transform="translate(${clamp(tx,-35,35)} ${clamp(ty,-35,35)}) translate(${cx} ${cy}) scale(${s.toFixed(3)}) translate(${-cx} ${-cy})"${filter?` filter="url(#${filter})"`:""}>${jaw}${marks}</g>`;
}
function transformedAsset(key,x,y,w,h,filter="",tx=0,ty=0,scale=100,layer=""){
 if(!key||key==="none"||key==="original")return "";
 if(String(key).startsWith("beard/stubble-"))return stubbleAsset(key,x,y,w,h,filter,tx,ty,scale,layer);
 if(!A()?.cell(key))return "";
 const s=clamp(scale,10,200)/100,cx=x+w/2,cy=y+h/2;
 return `<g data-avatar-layer="${esc(layer)}" transform="translate(${clamp(tx,-35,35)} ${clamp(ty,-35,35)}) translate(${cx} ${cy}) scale(${s.toFixed(3)}) translate(${-cx} ${-cy})"${filter?` filter="url(#${filter})"`:""}>${A().svgImage(key,x,y,w,h)}</g>`;
}
function skinToneDef(fid,brightness=0,warmth=0){
 const b=clamp(brightness,-40,25),w=clamp(warmth,-20,20),m=1+b/100;
 const rr=m*(1+w*.0045),gg=m*(1+w*.0012),bb=m*(1-w*.0045);
 return `<filter id="${fid}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${rr.toFixed(3)} 0 0 0 0  0 ${gg.toFixed(3)} 0 0 0  0 0 ${bb.toFixed(3)} 0 0  0 0 0 1 0"/></filter>`;
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
function packImage(cat,key,x,y,w,h,attrs=""){
 const item=P()?.[cat]?.[key],src=item?.src;if(!src)return "";
 return `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"${attrs?" "+attrs:""}/>`;
}
function tattooImage(key,x,y,w,h,tx=0,ty=0,scale=100,mirror=false){
 const item=P().tattoos?.[key];if(!item?.src)return "";const s=clamp(scale,45,170)/100,cx=x+w/2,cy=y+h/2;
 return `<g opacity=".78" style="mix-blend-mode:multiply" transform="translate(${tx} ${ty}) translate(${cx} ${cy}) scale(${mirror?-s:s} ${s}) translate(${-cx} ${-cy})"><image href="${item.src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/></g>`;
}
function bodyFront(a,name){
 const body=a.build==="slim"?.88:a.build==="stocky"?1.17:a.build==="strong"?1.09:1,chest=body*(1+(a.chestWidth-50)*.006),w=82*chest,leg=78+(a.height-165)*.35+(a.legLength-50)*.24,pid=id(),src=P().bodies?.[a.bodyAsset]?.src;
 if(!src)return `<defs>${kitPattern(a,pid)}</defs><ellipse cx="90" cy="286" rx="${50*body}" ry="7" fill="#000" opacity=".28"/><path d="M${90-w/2} 126 Q90 112 ${90+w/2} 126 L${90+w/2-7} 214 L${90-w/2+7} 214Z" fill="url(#${pid})"/><path d="M${90-w/2+8} 207 L80 ${252+leg*.20} L62 ${252+leg*.20} L70 204Z" fill="#102c3c"/><path d="M${90+w/2-8} 207 L100 ${252+leg*.20} L118 ${252+leg*.20} L110 204Z" fill="#102c3c"/><text x="90" y="181" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".65" paint-order="stroke" font-size="11" font-weight="900">${esc(name).slice(0,16)}</text>`;
 const clip=id(),under=id(),bodyMask=id();
 const undershirt=a.undershirtAsset?packImage("clothing",a.undershirtAsset,18,80,144,145,`clip-path="url(#${under})"`):"";
 const rightTat=a.undershirtAsset?"" : tattooImage(a.rightTattooAsset,27,126,31,94,a.rightTattooX,a.rightTattooY,a.rightTattooScale,false);
 const leftTat=a.undershirtAsset?"" : tattooImage(a.leftTattooAsset,122,126,31,94,a.leftTattooX,a.leftTattooY,a.leftTattooScale,true);
 const captain=a.isCaptain?packImage("clothing",a.captainArmband,126,121,30,24):"";
 return `<defs>${kitPattern(a,pid)}<clipPath id="${clip}"><rect x="16" y="76" width="148" height="222" rx="8"/></clipPath><clipPath id="${under}"><path d="M18 132H55V225H18ZM125 132H162V225H125ZM72 78H108V102H72Z"/></clipPath><mask id="${bodyMask}"><image href="${src}" x="16" y="76" width="148" height="222" preserveAspectRatio="xMidYMin meet"/></mask></defs><ellipse cx="90" cy="287" rx="49" ry="7" fill="#000" opacity=".24"/><g clip-path="url(#${clip})"><image href="${src}" x="16" y="76" width="148" height="222" preserveAspectRatio="xMidYMin meet"/></g><g mask="url(#${bodyMask})"><path d="M${90-w/2} 102 Q90 90 ${90+w/2} 102 L${90+w/2-5} 214 L${90-w/2+5} 214Z" fill="url(#${pid})" opacity=".72" style="mix-blend-mode:multiply"/><path d="M52 208 H128 L120 267 H60Z" fill="url(#${pid})" opacity=".72" style="mix-blend-mode:multiply"/><path d="M18 124 H55 V226 H18ZM125 124 H162 V226 H125ZM72 76 H108 V102 H72ZM48 258 H132 V300 H48Z" fill="${a.skin}" opacity=".72" style="mix-blend-mode:color"/><path d="M18 124 H55 V226 H18ZM125 124 H162 V226 H125ZM72 76 H108 V102 H72ZM48 258 H132 V300 H48Z" fill="${a.skin}" opacity=".34" style="mix-blend-mode:multiply"/></g>${undershirt}${rightTat}${leftTat}${captain}<text x="90" y="160" text-anchor="middle" fill="#ffffff" stroke="#00000088" stroke-width=".8" paint-order="stroke" font-size="16" font-weight="900">${esc(a.shirtNo)}</text>`;
}
function neckAccessory(a){return tattooImage(a.neckTattooAsset,79,82,22,28,a.neckTattooX,a.neckTattooY,a.neckTattooScale,false)}
function backPanel(a,name){const pid=id(),label=(a.shirtName||name||"").split(/\s+/).slice(-1)[0].toUpperCase().slice(0,12);return `<g transform="translate(178 48) scale(.58)"><defs>${kitPattern(a,pid)}</defs><path d="M48 82 Q90 66 132 82 L124 182 L56 182Z" fill="url(#${pid})" stroke="#ffffff22" stroke-width="1.5"/><text x="90" y="112" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="14" font-weight="900">${esc(label)}</text><text x="90" y="160" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="1.4" paint-order="stroke" font-size="46" font-weight="1000">${esc(a.shirtNo)}</text></g>`}
function headLayers(a,x=15,y=-16,w=150,h=150){
 const f=id(),sf=id(),defs=tintDef(f,a.hairColor)+skinToneDef(sf,a.skinBrightness,a.skinWarmth);
 return {defs,html:
  asset(a.faceAsset,x,y,w,h,PLAYER_FACE_PRESETS.includes(a.faceAsset)?"":sf,'data-avatar-layer="face"')+
  transformedAsset(a.browAsset,x,y,w,h,f,a.browX,a.browY,a.browScale,"brow")+
  transformedAsset(a.beardAsset,x,y,w,h,f,a.beardX,a.beardY,a.beardScale,"beard")+
  transformedAsset(a.hairAsset,x,y,w,h,f,a.hairX,a.hairY,a.hairScale,"hair")};
}
function render(a0,name,mini=false,mode="both"){
 const a=normalize(a0),front=mode==="front",view=front?"20 0 180 300":"0 0 300 320",shift=front?20:38,hs=96*(a.headScale/100),hx=90-hs/2+a.headX,hy=8+a.headY,h=headLayers(a,hx,hy,hs,hs);
 return `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg" cx=".5" cy=".2" r=".9"><stop stop-color="#10435a"/><stop offset="1" stop-color="#031019"/></radialGradient>${h.defs}</defs><rect width="${front?220:300}" height="330" rx="18" fill="url(#bg)"/><g transform="translate(${shift} 8)">${bodyFront(a,name)}${h.html}${neckAccessory(a)}</g>${front?"":backPanel(a,name)}</svg>`;
}
function headSvg(a0,x=0,y=0,w=180,h=145){const a=normalize(a0),layers=headLayers(a);return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 180 145" overflow="visible"><defs>${layers.defs}</defs>${layers.html}</svg>`}
function coachSkinZones(key){
 const hands="M24 198 C20 211 20 228 23 241 C25 249 30 254 36 253 C42 251 46 240 47 226 C48 215 47 204 44 198 Z M136 198 C133 204 132 215 133 226 C134 240 138 251 144 253 C150 254 155 249 157 241 C160 228 160 211 156 198 Z";
 const neck="M79 79 C82 88 98 88 101 79 L100 105 C97 111 83 111 80 105 Z";
 const openNeck="M77 80 C82 90 98 90 103 80 L100 109 C97 115 83 115 80 109 Z";
 const fullArms="M29 128 C23 144 20 167 21 191 C21 215 25 238 32 249 C36 254 42 252 45 246 C49 235 50 216 49 196 C48 172 45 147 42 129 Z M138 129 C135 147 132 172 131 196 C130 216 131 235 135 246 C138 252 144 254 148 249 C155 238 159 215 159 191 C160 167 157 144 151 128 Z";
 const forearms="M28 151 C23 165 21 184 22 205 C22 224 26 242 32 249 C36 253 42 251 45 245 C48 234 49 216 48 198 C47 179 44 163 41 151 Z M139 151 C136 163 133 179 132 198 C131 216 132 234 135 245 C138 251 144 253 148 249 C154 242 158 224 158 205 C159 184 157 165 152 151 Z";
 const skirtLegs="M58 225 C57 239 57 257 59 273 C61 279 67 282 73 280 C79 278 82 270 82 258 L82 226 Z M98 226 L98 258 C98 270 101 278 107 280 C113 282 119 279 121 273 C123 257 123 239 122 225 Z";
 if(key==="coach-m-polo")return neck+" "+fullArms;
 if(key==="coach-f-polo")return openNeck+" "+fullArms;
 if(key==="coach-f-dark-suit-neckline"||key==="coach-f-taupe-suit-neckline")return openNeck+" "+forearms;
 if(key==="coach-f-skirt-blazer")return openNeck+" "+forearms+" "+skirtLegs;
 if(key==="coach-m-suit-open")return openNeck+" "+hands;
 if(key==="coach-m-turtleneck"||key==="coach-m-tracksuit"||key==="coach-m-suit-tie"||key==="coach-m-overcoat"||key==="coach-f-tracksuit"||key==="coach-f-closed-suit")return hands;
 return neck+" "+hands;
}
function renderCoach(a0,name="Coach"){
 const a=normalizeCoach(a0),f=id(),sf=id(),cid=id(),soft=id(),body=CT()[a.bodyAsset],bodySrc=body?.src||"",bodyMask=bodySrc?`<mask id="${cid}"><image href="${bodySrc}" x="16" y="78" width="148" height="198" preserveAspectRatio="xMidYMin meet"/></mask>`:"",softDef=`<filter id="${soft}" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur stdDeviation="1.6"/></filter>`,defs=tintDef(f,a.hairColor)+skinToneDef(sf,a.skinBrightness,a.skinWarmth)+bodyMask+softDef,hs=96*(a.headScale/100),x=90-hs/2+a.headX,y=8+(96-hs)/2+a.headY,w=hs,h=hs;
 const head=asset(a.faceAsset,x,y,w,h,sf,'data-avatar-layer="face"')+
  transformedAsset(a.browAsset,x,y,w,h,f,a.browX,a.browY,a.browScale,"brow")+
  transformedAsset(a.beardAsset,x,y,w,h,f,a.beardX,a.beardY,a.beardScale,"beard")+
  transformedAsset(a.hairAsset,x,y,w,h,f,a.hairX,a.hairY,a.hairScale,"hair");
 const tint=a.outfitTint>0&&bodySrc?`<path d="M34 98 H146 V270 H34Z" fill="${a.outfitColor}" opacity="${(a.outfitTint/100).toFixed(2)}" style="mix-blend-mode:color" mask="url(#${cid})"/>`:"";
 const skinZones=coachSkinZones(a.bodyAsset),skinTint=bodySrc?`<g mask="url(#${cid})" filter="url(#${soft})"><path d="${skinZones}" fill="${a.skin}" opacity=".44" style="mix-blend-mode:color"/><path d="${skinZones}" fill="${a.skin}" opacity=".16" style="mix-blend-mode:multiply"/></g>`:"";
 const bodyHtml=bodySrc?`<g data-avatar-layer="coach-body"><image href="${bodySrc}" x="16" y="78" width="148" height="198" preserveAspectRatio="xMidYMin meet"/>${skinTint}${tint}</g>`:`<path d="M42 138 Q90 118 138 138 L148 270 H32Z" fill="#101b24"/>`;
 return `<svg viewBox="0 0 180 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="cbg" cx=".5" cy=".18" r=".9"><stop stop-color="#174b63"/><stop offset="1" stop-color="#04131d"/></radialGradient>${defs}</defs><rect width="180" height="300" rx="16" fill="url(#cbg)"/>${bodyHtml}${head}<text x="90" y="290" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="11" font-weight="900">${esc(name).slice(0,18)}</text></svg>`;
}
window.TimeClashAvatar={render,renderCoach,headSvg,normalize,normalizeCoach,kitPattern,assets:{PLAYER_FACES,PLAYER_FACE_PRESETS,COACH_FACES_M,COACH_FACES_F,HAIR_M,HAIR_F,BROWS,BEARDS,BODY_KEYS:Object.keys(P().bodies||{}),CLOTHING_KEYS:Object.keys(P().clothing||{}),TATTOO_KEYS:Object.keys(P().tattoos||{})}};
})();