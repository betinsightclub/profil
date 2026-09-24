(()=>{
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const cfg=a=>({
 height:clamp(a?.height||182,165,210),build:a?.build||"athletic",skin:a?.skin||"#d7a17e",
 faceShape:a?.faceShape||"oval",faceWidth:clamp(a?.faceWidth??50,25,75),jawWidth:clamp(a?.jawWidth??50,25,75),chinLength:clamp(a?.chinLength??50,25,75),
 eyeSpacing:clamp(a?.eyeSpacing??50,25,75),eyeSize:clamp(a?.eyeSize??50,25,75),eyeY:clamp(a?.eyeY??50,25,75),browY:clamp(a?.browY??50,25,75),
 noseLength:clamp(a?.noseLength??50,25,75),mouthWidth:clamp(a?.mouthWidth??50,25,75),
 hairStyle:a?.hairStyle||a?.hairLength||"short",hairLength:a?.hairLength||"short",hairTexture:a?.hairTexture||"straight",hairColor:a?.hairColor||"#3a2418",
 beard:a?.beard||"none",kitStyle:a?.kitStyle||"solid",kit1:a?.kit1||"#25a9ff",kit2:a?.kit2||"#f7c64e",kit3:a?.kit3||"#ffffff",
 stripeCount:clamp(a?.stripeCount??5,2,9),stripeWidth:a?.stripeWidth||"medium",shirtNo:clamp(a?.shirtNo||10,1,99),shirtName:a?.shirtName||""
});
function facePath(a){
 const width=54+(a.faceWidth-50)*.34, jaw=42+(a.jawWidth-50)*.28, chin=26+(a.chinLength-50)*.20;
 if(a.faceShape==="round")return `M90 23 C${90-width} 23 ${90-width-7} 48 ${90-width+1} 72 C${90-width+8} 95 ${90-jaw} 112 90 ${120+chin*.1} C${90+jaw} 112 ${90+width-8} 95 ${90+width-1} 72 C${90+width+7} 48 ${90+width} 23 90 23Z`;
 if(a.faceShape==="square")return `M90 22 C${90-width} 22 ${90-width-4} 42 ${90-width+1} 68 L${90-jaw} 108 Q90 ${121+chin*.18} ${90+jaw} 108 L${90+width-1} 68 C${90+width+4} 42 ${90+width} 22 90 22Z`;
 if(a.faceShape==="long")return `M90 18 C${90-width*.92} 18 ${90-width} 44 ${90-width+2} 77 C${90-width+8} 103 ${90-jaw*.85} 126 90 ${137+chin*.16} C${90+jaw*.85} 126 ${90+width-8} 103 ${90+width-2} 77 C${90+width} 44 ${90+width*.92} 18 90 18Z`;
 if(a.faceShape==="diamond")return `M90 22 C${90-width*.72} 22 ${90-width} 49 ${90-width*.88} 74 C${90-width*.72} 98 ${90-jaw*.72} 112 90 ${126+chin*.18} C${90+jaw*.72} 112 ${90+width*.72} 98 ${90+width*.88} 74 C${90+width} 49 ${90+width*.72} 22 90 22Z`;
 return `M90 20 C${90-width} 20 ${90-width-5} 46 ${90-width+1} 72 C${90-width+8} 99 ${90-jaw} 116 90 ${128+chin*.16} C${90+jaw} 116 ${90+width-8} 99 ${90+width-1} 72 C${90+width+5} 46 ${90+width} 20 90 20Z`;
}
function hair(a){
 const c=a.hairColor, t=a.hairStyle;
 if(t==="bald")return "";
 if(t==="buzz"||t==="veryshort")return `<path d="M46 47 Q53 18 90 16 Q127 18 134 47 Q117 33 90 33 Q63 33 46 47Z" fill="${c}" opacity=".95"/>`;
 if(t==="fade")return `<path d="M47 55 Q51 20 90 16 Q126 18 133 52 Q112 34 90 35 Q67 35 47 55Z" fill="${c}"/><path d="M50 56 Q52 42 62 36 L62 69 Q55 65 50 56Z" fill="${c}" opacity=".72"/><path d="M130 56 Q128 42 118 36 L118 69 Q125 65 130 56Z" fill="${c}" opacity=".72"/>`;
 if(t==="sidepart")return `<path d="M46 55 Q49 21 89 16 Q126 17 135 49 Q112 36 83 37 Q65 38 46 55Z" fill="${c}"/><path d="M85 18 Q90 38 88 45" stroke="#ffffff44" stroke-width="2"/>`;
 if(t==="slick")return `<path d="M49 51 Q61 19 93 16 Q121 19 132 45 Q111 34 91 34 Q68 35 49 51Z" fill="${c}"/><path d="M64 26 Q86 20 111 27" stroke="#ffffff2f" stroke-width="2" fill="none"/>`;
 if(t==="curly"||t==="coily")return `<g fill="${c}">${[[-32,4],[-25,-9],[-13,-18],[0,-21],[14,-18],[26,-8],[33,5],[-18,2],[-4,-4],[10,-3],[23,4]].map(([x,y])=>`<circle cx="${90+x}" cy="${43+y}" r="${t==="coily"?10:9}"/>`).join("")}</g>`;
 if(t==="long")return `<path d="M45 55 Q48 18 90 16 Q132 19 136 55 L130 120 Q117 96 112 74 Q90 62 68 74 Q62 97 50 121Z" fill="${c}"/>`;
 if(t==="medium"||t==="wavy")return `<path d="M46 57 Q49 19 90 16 Q130 19 134 55 L126 82 Q111 64 91 62 Q70 63 54 83Z" fill="${c}"/>`;
 return `<path d="M47 52 Q52 20 90 16 Q127 19 133 50 Q112 35 90 36 Q66 36 47 52Z" fill="${c}"/>`;
}
function beard(a){
 const c=a.hairColor,b=a.beard;
 if(b==="none")return "";
 if(b==="mustache")return `<path d="M72 92 Q82 85 90 92 Q98 85 108 92 Q101 101 90 97 Q79 101 72 92Z" fill="${c}"/>`;
 if(b==="goatee")return `<path d="M77 93 Q90 102 103 93 Q100 112 90 118 Q80 112 77 93Z" fill="${c}" opacity=".92"/>`;
 if(b==="stubble")return `<path d="M64 88 Q90 119 116 88 Q112 116 90 124 Q68 116 64 88Z" fill="${c}" opacity=".28"/>`;
 if(b==="short")return `<path d="M61 82 Q90 120 119 82 Q116 116 90 128 Q64 116 61 82Z" fill="${c}" opacity=".72"/>`;
 if(b==="combo")return `<path d="M72 92 Q82 85 90 92 Q98 85 108 92 Q101 101 90 97 Q79 101 72 92Z" fill="${c}"/><path d="M77 96 Q90 105 103 96 Q100 114 90 119 Q80 114 77 96Z" fill="${c}"/>`;
 return `<path d="M59 77 Q90 126 121 77 Q117 121 90 134 Q63 121 59 77Z" fill="${c}"/>`;
}
function facial(a){
 const dx=16+(a.eyeSpacing-50)*.12, ey=69+(a.eyeY-50)*.14, es=5+(a.eyeSize-50)*.06, by=ey-14-(a.browY-50)*.10;
 const nose=88+(a.noseLength-50)*.24, mw=18+(a.mouthWidth-50)*.16;
 return `<g><path d="M${90-dx-es} ${ey} Q${90-dx} ${ey-es*.62} ${90-dx+es} ${ey} Q${90-dx} ${ey+es*.5} ${90-dx-es} ${ey}Z" fill="#f7fbff"/><circle cx="${90-dx}" cy="${ey}" r="${es*.42}" fill="#2a3a44"/><circle cx="${90-dx}" cy="${ey}" r="${es*.18}" fill="#0d1519"/><path d="M${90+dx-es} ${ey} Q${90+dx} ${ey-es*.62} ${90+dx+es} ${ey} Q${90+dx} ${ey+es*.5} ${90+dx-es} ${ey}Z" fill="#f7fbff"/><circle cx="${90+dx}" cy="${ey}" r="${es*.42}" fill="#2a3a44"/><circle cx="${90+dx}" cy="${ey}" r="${es*.18}" fill="#0d1519"/><path d="M${90-dx-es-2} ${by} Q${90-dx} ${by-4} ${90-dx+es+3} ${by+1}" stroke="${a.hairColor}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M${90+dx-es-3} ${by+1} Q${90+dx} ${by-4} ${90+dx+es+2} ${by}" stroke="${a.hairColor}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M90 ${ey+4} Q86 ${nose-5} 90 ${nose} Q94 ${nose+2} 97 ${nose}" stroke="#8f5e4e" stroke-width="2" fill="none" opacity=".7"/><path d="M${90-mw} ${nose+16} Q90 ${nose+22} ${90+mw} ${nose+16} Q90 ${nose+27} ${90-mw} ${nose+16}Z" fill="#8a4f4a" opacity=".8"/></g>`;
}
function kitPattern(a,id){
 const c1=a.kit1,c2=a.kit2,c3=a.kit3,count=Math.round(a.stripeCount),mode=a.kitStyle,width=a.stripeWidth==="narrow"?.62:a.stripeWidth==="wide"?1.38:1;
 if(mode==="solid")return `<linearGradient id="${id}" x1="0" x2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`;
 if(mode==="halves")return `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
 if(mode==="gradient")return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset=".68" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>`;
 const base=100/count, sw=base*width;
 if(mode==="horizontal")return `<pattern id="${id}" width="100" height="${base*2}" patternUnits="userSpaceOnUse"><rect width="100" height="${base*2}" fill="${c1}"/><rect width="100" height="${sw}" fill="${c2}"/></pattern>`;
 if(mode==="diagonal")return `<pattern id="${id}" width="${base*2}" height="${base*2}" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><rect width="${base*2}" height="${base*2}" fill="${c1}"/><rect width="${sw}" height="${base*2}" fill="${c2}"/></pattern>`;
 if(mode==="pinstripe")return `<pattern id="${id}" width="${Math.max(8,base)}" height="100" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="${c1}"/><rect width="${Math.max(2,sw*.22)}" height="100" fill="${c2}"/></pattern>`;
 return `<pattern id="${id}" width="${base*2}" height="100" patternUnits="userSpaceOnUse"><rect width="${base*2}" height="100" fill="${c1}"/><rect width="${sw}" height="100" fill="${c2}"/></pattern>`;
}
function bodyFront(a,name){
 const body=a.build==="slim"?.86:a.build==="stocky"?1.18:a.build==="strong"?1.1:1,w=84*body,h=Math.max(165,Math.min(210,a.height)),leg=112+(h-165)*.55,id="kitF"+Math.random().toString(36).slice(2,7);
 return `<defs>${kitPattern(a,id)}<linearGradient id="skinGrad" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient><filter id="sh"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity=".24"/></filter></defs><ellipse cx="90" cy="310" rx="${54*body}" ry="8" fill="#000" opacity=".28"/><path d="M${90-w/2} 150 Q90 136 ${90+w/2} 150 L${90+w/2-8} 234 L${90-w/2+8} 234Z" fill="url(#${id})" filter="url(#sh)"/><path d="M${90-w/2+8} 227 L80 ${285+leg*.22} L61 ${285+leg*.22} L70 222Z" fill="#102c3c"/><path d="M${90+w/2-8} 227 L100 ${285+leg*.22} L119 ${285+leg*.22} L110 222Z" fill="#102c3c"/><path d="M${90-w/2} 150 Q90 136 ${90+w/2} 150 L${90+w/2-8} 234 L${90-w/2+8} 234Z" fill="url(#skinGrad)" opacity=".35"/><text x="90" y="204" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="13" font-weight="900">${esc(name).slice(0,16)}</text>`;
}
function backPanel(a,name){
 const id="kitB"+Math.random().toString(36).slice(2,7),label=(a.shirtName||name||"").split(/\s+/).slice(-1)[0].toUpperCase().slice(0,12);
 return `<g transform="translate(178 32) scale(.63)"><defs>${kitPattern(a,id)}</defs><path d="M48 82 Q90 66 132 82 L124 182 L56 182Z" fill="url(#${id})" stroke="#ffffff22" stroke-width="1.5"/><text x="90" y="112" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="14" font-weight="900">${esc(label)}</text><text x="90" y="160" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="1.4" paint-order="stroke" font-size="46" font-weight="1000">${esc(a.shirtNo)}</text><text x="90" y="202" text-anchor="middle" fill="#a7c3d1" font-size="10">BACK</text></g>`;
}
function render(a0,name,mini=false){const a=cfg(a0);return `<svg viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg" cx=".5" cy=".2" r=".9"><stop stop-color="#10435a"/><stop offset="1" stop-color="#031019"/></radialGradient><linearGradient id="faceLight" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".2"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs><rect width="300" height="360" rx="18" fill="url(#bg)"/><g transform="translate(38 6)">${bodyFront(a,name)}<path d="${facePath(a)}" fill="${a.skin}" stroke="#8d6554" stroke-width="1.2"/><path d="${facePath(a)}" fill="url(#faceLight)"/>${facial(a)}${beard(a)}${hair(a)}</g>${backPanel(a,name)}<text x="235" y="208" text-anchor="middle" fill="#8fb0bf" font-size="9">FRONT / BACK</text></svg>`;}
window.TimeClashAvatar={render,normalize:cfg,kitPattern};
})();