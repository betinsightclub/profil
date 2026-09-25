(()=>{
const A=()=>window.TimeClashAvatarAssets;
const P=()=>window.TimeClashBodyPack||{bodies:{},clothing:{},tattoos:{}};
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const safeHex=(v,d)=>/^#[0-9a-fA-F]{6}$/.test(String(v||""))?String(v):d;
const rgb=hex=>{const s=safeHex(hex,"#3a2418").slice(1),n=parseInt(s,16);return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}};
const id=()=>"tc"+Math.random().toString(36).slice(2,9);

const PLAYER_FACES=["faces/player-m01","faces/player-m02","faces/player-m03","faces/player-m04","faces/player-m05","faces/player-m06","faces/player-m07","faces/player-m08","faces/player-m09","faces/player-m10","faces/player-m11","faces/player-m12","faces/player-m13","faces/player-m14","faces/player-m15","faces/player-m16","faces/player-m17"];
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
 const faceAsset=mapLegacyFace(a),pack=P(),defaultBody={slim:"slim",athletic:"athletic",strong:"strong-athletic",stocky:"power"}[a.build]||"athletic",skinMap={"faces/player-m01":"#d7a17e","faces/player-m02":"#5a392d","faces/player-m03":"#d8a98d","faces/player-m04":"#7b4d35","faces/player-m05":"#563629","faces/player-m06":"#d2a282","faces/player-m07":"#bd8665","faces/player-m08":"#bd825c","faces/player-m09":"#a46d4c","faces/player-m10":"#c99775","faces/player-m11":"#c38a61","faces/player-m12":"#ad7858","faces/player-m13":"#d0a07f","faces/player-m14":"#d8ae95","faces/player-m15":"#d0a080","faces/player-m16":"#ae7959","faces/player-m17":"#d9aa8f"};
 return {
  avatarVersion:3,kind:"player",
  height:clamp(a.height||182,150,220),build:["slim","athletic","strong","stocky"].includes(a.build)?a.build:"athletic",chestWidth:clamp(a.chestWidth??50,35,65),legLength:clamp(a.legLength??50,35,65),
  faceAsset,skin:safeHex(a.skin,skinMap[faceAsset]||"#d7a17e"),skinBrightness:clamp(a.skinBrightness??0,-40,25),skinWarmth:clamp(a.skinWarmth??0,-20,20),
  hairAsset:mapLegacyHair(a),browAsset:BROWS.includes(a.browAsset)?a.browAsset:"original",beardAsset:mapLegacyBeard(a),hairColor:safeHex(a.hairColor,"#3a2418"),
  hairX:clamp(a.hairX??0,-35,35),hairY:clamp(a.hairY??0,-35,35),hairScale:clamp(a.hairScale??100,10,200),
  browX:clamp(a.browX??0,-35,35),browY:clamp(a.browY??0,-35,35),browScale:clamp(a.browScale??100,10,200),
  beardX:clamp(a.beardX??0,-35,35),beardY:clamp(a.beardY??0,-35,35),beardScale:clamp(a.beardScale??100,10,200),
  bodyAsset:pack.bodies?.[a.bodyAsset]?a.bodyAsset:defaultBody,undershirtAsset:pack.clothing?.[a.undershirtAsset]?a.undershirtAsset:"none",
  isCaptain:!!a.isCaptain,captainArmband:pack.clothing?.[a.captainArmband]?a.captainArmband:"captain-classic",
  leftTattooAsset:pack.tattoos?.[a.leftTattooAsset]?a.leftTattooAsset:"",rightTattooAsset:pack.tattoos?.[a.rightTattooAsset]?a.rightTattooAsset:"",neckTattooAsset:pack.tattoos?.[a.neckTattooAsset]?a.neckTattooAsset:"",
  leftTattooX:clamp(a.leftTattooX??0,-25,25),leftTattooY:clamp(a.leftTattooY??0,-35,35),leftTattooScale:clamp(a.leftTattooScale??100,45,170),rightTattooX:clamp(a.rightTattooX??0,-25,25),rightTattooY:clamp(a.rightTattooY??0,-35,35),rightTattooScale:clamp(a.rightTattooScale??100,45,170),neckTattooX:clamp(a.neckTattooX??0,-20,20),neckTattooY:clamp(a.neckTattooY??0,-20,20),neckTattooScale:clamp(a.neckTattooScale??100,45,170),
  kitStyle:["solid","vertical","horizontal","diagonal","halves","pinstripe","gradient"].includes(a.kitStyle)?a.kitStyle:"solid",stripeCount:clamp(a.stripeCount??5,2,9),stripeWidth:["narrow","medium","wide"].includes(a.stripeWidth)?a.stripeWidth:"medium",kit1:safeHex(a.kit1,"#25a9ff"),kit2:safeHex(a.kit2,"#f7c64e"),kit3:safeHex(a.kit3,"#ffffff"),shirtNo:clamp(a.shirtNo||10,1,99),shirtName:String(a.shirtName||"")
 };
}
function normalizeCoach(a={}){
 let face=String(a.faceAsset||COACH_FACES_M[0]),gender=String(a.gender||"");
 if(COACH_FACES_F.includes(face))gender="female"; else if(COACH_FACES_M.includes(face))gender="male"; else {gender=gender==="female"?"female":"male";face=gender==="female"?COACH_FACES_F[0]:COACH_FACES_M[0]}
 const hairs=gender==="female"?HAIR_F:HAIR_M;
 return {avatarVersion:3,kind:"coach",gender,faceAsset:face,hairAsset:hairs.includes(a.hairAsset)?a.hairAsset:(gender==="female"?"hair/f-lob":"hair/m-short-classic"),browAsset:BROWS.includes(a.browAsset)?a.browAsset:"original",beardAsset:gender==="male"&&BEARDS.includes(a.beardAsset)?a.beardAsset:"none",hairColor:safeHex(a.hairColor,"#3a2418"),
  skinBrightness:clamp(a.skinBrightness??0,-40,25),skinWarmth:clamp(a.skinWarmth??0,-20,20),
  hairX:clamp(a.hairX??0,-35,35),hairY:clamp(a.hairY??0,-35,35),hairScale:clamp(a.hairScale??100,10,200),
  browX:clamp(a.browX??0,-35,35),browY:clamp(a.browY??0,-35,35),browScale:clamp(a.browScale??100,10,200),
  beardX:clamp(a.beardX??0,-35,35),beardY:clamp(a.beardY??0,-35,35),beardScale:clamp(a.beardScale??100,10,200)};
}
function asset(key,x,y,w,h,filter="",attrs=""){
 if(!key||key==="none"||key==="original"||!A()?.cell(key))return "";
 return `<g${attrs?" "+attrs:""}${filter?` filter="url(#${filter})"`:""}>${A().svgImage(key,x,y,w,h)}</g>`;
}
function transformedAsset(key,x,y,w,h,filter="",tx=0,ty=0,scale=100,layer=""){
 if(!key||key==="none"||key==="original"||!A()?.cell(key))return "";
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
 const clip=id(),under=id();
 const undershirt=a.undershirtAsset!=="none"?packImage("clothing",a.undershirtAsset,18,80,144,145,`clip-path="url(#${under})"`):"";
 const rightTat=a.undershirtAsset?"" : tattooImage(a.rightTattooAsset,27,126,31,94,a.rightTattooX,a.rightTattooY,a.rightTattooScale,false);
 const leftTat=a.undershirtAsset?"" : tattooImage(a.leftTattooAsset,122,126,31,94,a.leftTattooX,a.leftTattooY,a.leftTattooScale,true);
 const captain=a.isCaptain?packImage("clothing",a.captainArmband,126,121,30,24):"";
 return `<defs><clipPath id="${clip}"><rect x="16" y="76" width="148" height="222" rx="8"/></clipPath><clipPath id="${under}"><path d="M18 132H55V225H18ZM125 132H162V225H125ZM72 78H108V102H72Z"/></clipPath></defs><ellipse cx="90" cy="287" rx="49" ry="7" fill="#000" opacity=".24"/><g clip-path="url(#${clip})"><image href="${src}" x="16" y="76" width="148" height="222" preserveAspectRatio="xMidYMin meet"/></g>${undershirt}${rightTat}${leftTat}${captain}<text x="90" y="160" text-anchor="middle" fill="#1d2a32" opacity=".72" font-size="16" font-weight="900">${esc(a.shirtNo)}</text>`;
}
function neckAccessory(a){return tattooImage(a.neckTattooAsset,79,82,22,28,a.neckTattooX,a.neckTattooY,a.neckTattooScale,false)}
function backPanel(a,name){const pid=id(),label=(a.shirtName||name||"").split(/\s+/).slice(-1)[0].toUpperCase().slice(0,12);return `<g transform="translate(178 48) scale(.58)"><defs>${kitPattern(a,pid)}</defs><path d="M48 82 Q90 66 132 82 L124 182 L56 182Z" fill="url(#${pid})" stroke="#ffffff22" stroke-width="1.5"/><text x="90" y="112" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="14" font-weight="900">${esc(label)}</text><text x="90" y="160" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="1.4" paint-order="stroke" font-size="46" font-weight="1000">${esc(a.shirtNo)}</text></g>`}
function headLayers(a,x=15,y=-16,w=150,h=150){
 const f=id(),sf=id(),defs=tintDef(f,a.hairColor)+skinToneDef(sf,a.skinBrightness,a.skinWarmth);
 return {defs,html:
  asset(a.faceAsset,x,y,w,h,sf,'data-avatar-layer="face"')+
  transformedAsset(a.browAsset,x,y,w,h,f,a.browX,a.browY,a.browScale,"brow")+
  transformedAsset(a.beardAsset,x,y,w,h,f,a.beardX,a.beardY,a.beardScale,"beard")+
  transformedAsset(a.hairAsset,x,y,w,h,f,a.hairX,a.hairY,a.hairScale,"hair")};
}
function render(a0,name,mini=false,mode="both"){
 const a=normalize(a0),front=mode==="front",view=front?"20 0 180 300":"0 0 300 320",shift=front?20:38,h=headLayers(a);
 return `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg" cx=".5" cy=".2" r=".9"><stop stop-color="#10435a"/><stop offset="1" stop-color="#031019"/></radialGradient>${h.defs}</defs><rect width="${front?220:300}" height="330" rx="18" fill="url(#bg)"/><g transform="translate(${shift} 8)">${bodyFront(a,name)}${h.html}${neckAccessory(a)}</g>${front?"":backPanel(a,name)}</svg>`;
}
function headSvg(a0,x=0,y=0,w=180,h=145){const a=normalize(a0),layers=headLayers(a);return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 180 145" overflow="visible"><defs>${layers.defs}</defs>${layers.html}</svg>`}
function renderCoach(a0,name="Coach"){
 const a=normalizeCoach(a0),f=id(),sf=id(),defs=tintDef(f,a.hairColor)+skinToneDef(sf,a.skinBrightness,a.skinWarmth),x=15,y=-8,w=150,h=150;
 const head=asset(a.faceAsset,x,y,w,h,sf,'data-avatar-layer="face"')+
  transformedAsset(a.browAsset,x,y,w,h,f,a.browX,a.browY,a.browScale,"brow")+
  transformedAsset(a.beardAsset,x,y,w,h,f,a.beardX,a.beardY,a.beardScale,"beard")+
  transformedAsset(a.hairAsset,x,y,w,h,f,a.hairX,a.hairY,a.hairScale,"hair");
 return `<svg viewBox="0 0 180 235" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="cbg" cx=".5" cy=".18" r=".9"><stop stop-color="#174b63"/><stop offset="1" stop-color="#04131d"/></radialGradient>${defs}</defs><rect width="180" height="235" rx="16" fill="url(#cbg)"/><path d="M42 138 Q90 118 138 138 L148 228 H32Z" fill="#101b24"/><path d="M76 132 L90 151 L104 132 L118 228 H62Z" fill="#263744"/><path d="M85 147 L90 157 L95 147 L98 197 L90 207 L82 197Z" fill="#b88c3b" opacity=".9"/>${head}<text x="90" y="220" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="12" font-weight="900">${esc(name).slice(0,18)}</text></svg>`;
}
window.TimeClashAvatar={render,renderCoach,headSvg,normalize,normalizeCoach,kitPattern,assets:{PLAYER_FACES,COACH_FACES_M,COACH_FACES_F,HAIR_M,HAIR_F,BROWS,BEARDS,BODY_KEYS:Object.keys(P().bodies||{}),CLOTHING_KEYS:Object.keys(P().clothing||{}),TATTOO_KEYS:Object.keys(P().tattoos||{})}};
})();