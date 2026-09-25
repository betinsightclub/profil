(()=>{
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const safe=(v,d,set)=>set.has(String(v))?String(v):d;
const hexToRgb=hex=>{let s=String(hex||"").replace("#","");if(!/^[0-9a-fA-F]{6}$/.test(s))return{r:58,g:36,b:24};let n=parseInt(s,16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255}};
const rgbToHex=(r,g,b)=>"#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
const shadeHex=(hex,amt)=>{let q=hexToRgb(hex);return rgbToHex(q.r+amt,q.g+amt,q.b+amt)};

const cfg=a=>{
 const out={
  height:clamp(a?.height||182,150,220),build:safe(a?.build,"athletic",new Set(["slim","athletic","strong","stocky"])),skin:a?.skin||"#d7a17e",
  faceShape:safe(a?.faceShape,"oval",new Set(["oval","round","square","long","diamond"])),
  headWidth:clamp(a?.headWidth??50,30,70),headHeight:clamp(a?.headHeight??50,30,70),faceWidth:clamp(a?.faceWidth??50,30,70),cheekWidth:clamp(a?.cheekWidth??50,30,70),jawWidth:clamp(a?.jawWidth??50,30,70),chinLength:clamp(a?.chinLength??50,30,70),chinWidth:clamp(a?.chinWidth??50,30,70),
  eyeSpacing:clamp(a?.eyeSpacing??50,30,70),eyeSize:clamp(a?.eyeSize??50,30,70),eyeY:clamp(a?.eyeY??50,30,70),eyeShape:clamp(a?.eyeShape??50,30,70),browY:clamp(a?.browY??50,30,70),browThickness:clamp(a?.browThickness??50,30,70),
  noseLength:clamp(a?.noseLength??50,30,70),noseWidth:clamp(a?.noseWidth??50,30,70),noseSize:clamp(a?.noseSize??50,30,70),mouthWidth:clamp(a?.mouthWidth??50,30,70),lipFullness:clamp(a?.lipFullness??50,30,70),earSize:clamp(a?.earSize??50,30,70),
  hairStyle:safe(a?.hairStyle||a?.hairLength,"short",new Set(["bald","buzz","fade","short","sidepart","slick","wavy","curly","coily","medium","long"])),
  hairTexture:safe(a?.hairTexture,"straight",new Set(["straight","wavy","curly","coily"])),hairTextureIntensity:clamp(a?.hairTextureIntensity??50,0,100),hairVolume:clamp(a?.hairVolume??50,20,80),hairLengthLevel:clamp(a?.hairLengthLevel??50,20,80),hairColor:a?.hairColor||"#3a2418",
  beard:safe(a?.beard,"none",new Set(["none","stubble","short","full","goatee","mustache","combo"])),beardDensity:clamp(a?.beardDensity??55,15,90),beardLength:clamp(a?.beardLength??45,15,85),stubbleSize:clamp(a?.stubbleSize??45,20,80),stubbleCoverage:clamp(a?.stubbleCoverage??55,20,90),stubbleShape:safe(a?.stubbleShape,"natural",new Set(["jaw","natural","chin","full"])),
  chestWidth:clamp(a?.chestWidth??50,35,65),legLength:clamp(a?.legLength??50,35,65),
  kitStyle:safe(a?.kitStyle,"solid",new Set(["solid","vertical","horizontal","diagonal","halves","pinstripe","gradient"])),kit1:a?.kit1||"#25a9ff",kit2:a?.kit2||"#f7c64e",kit3:a?.kit3||"#ffffff",stripeCount:clamp(a?.stripeCount??5,2,9),stripeWidth:safe(a?.stripeWidth,"medium",new Set(["narrow","medium","wide"])),shirtNo:clamp(a?.shirtNo||10,1,99),shirtName:a?.shirtName||""
 };
 out.jawWidth=Math.min(out.jawWidth,out.faceWidth+12);out.chinWidth=Math.min(out.chinWidth,out.jawWidth+10);return out
};
function normalizeFace(a){
 const x={...a},mix=(v,t,p)=>v+(t-v)*p;
 x.headWidth=Math.max(x.faceWidth-9,Math.min(x.faceWidth+13,x.headWidth));
 x.cheekWidth=Math.max(x.jawWidth-8,Math.min(x.faceWidth+10,x.cheekWidth));
 x.jawWidth=Math.max(x.faceWidth-15,Math.min(x.faceWidth+9,x.jawWidth));
 x.chinWidth=Math.max(x.jawWidth-17,Math.min(x.jawWidth+7,x.chinWidth));
 const naturalEyes=50+(x.faceWidth-50)*.22;x.eyeSpacing=Math.max(34,Math.min(66,mix(x.eyeSpacing,naturalEyes,.16)));
 x.noseWidth=Math.max(34,Math.min(66,x.noseWidth));x.mouthWidth=Math.max(x.noseWidth-9,Math.min(68,x.mouthWidth));
 x.eyeY=Math.max(34,Math.min(66,x.eyeY));x.browY=Math.max(34,Math.min(66,x.browY));x.noseLength=Math.max(34,Math.min(66,x.noseLength));x.noseSize=Math.max(34,Math.min(66,x.noseSize));
 return x
}
function metrics(a){
 const headW=52+(a.headWidth-50)*.32,templeW=headW+(a.faceWidth-50)*.18,cheekW=49+(a.cheekWidth-50)*.30,jawW=39+(a.jawWidth-50)*.27,chinW=21+(a.chinWidth-50)*.20;
 const top=18-(a.headHeight-50)*.16,cheekY=75+(a.headHeight-50)*.08,jawY=107+(a.headHeight-50)*.16,chinY=128+(a.chinLength-50)*.25+(a.headHeight-50)*.12;
 const eyeY=68+(a.eyeY-50)*.15,eyeDx=16+(a.eyeSpacing-50)*.13,noseY=88+(a.noseLength-50)*.25+(a.noseSize-50)*.07,mouthY=noseY+17+(a.noseSize-50)*.05;
 return {headW,templeW,cheekW,jawW,chinW,top,cheekY,jawY,chinY,eyeY,eyeDx,noseY,mouthY}
}
function facePath(a){
 const m=metrics(a),t=m.templeW,c=m.cheekW,j=m.jawW,ch=m.chinW;
 if(a.faceShape==="round")return "M90 "+m.top+" C"+(90-t)+" "+m.top+" "+(90-t-5)+" 45 "+(90-c)+" "+m.cheekY+" C"+(90-c+2)+" "+(m.jawY-10)+" "+(90-j)+" "+m.jawY+" "+(90-ch)+" "+(m.chinY-6)+" Q90 "+(m.chinY+2)+" "+(90+ch)+" "+(m.chinY-6)+" C"+(90+j)+" "+m.jawY+" "+(90+c-2)+" "+(m.jawY-10)+" "+(90+c)+" "+m.cheekY+" C"+(90+t+5)+" 45 "+(90+t)+" "+m.top+" 90 "+m.top+"Z";
 if(a.faceShape==="square")return "M90 "+m.top+" C"+(90-t)+" "+m.top+" "+(90-t-3)+" 42 "+(90-t+2)+" "+m.cheekY+" L"+(90-j)+" "+m.jawY+" L"+(90-ch)+" "+(m.chinY-4)+" Q90 "+(m.chinY+1)+" "+(90+ch)+" "+(m.chinY-4)+" L"+(90+j)+" "+m.jawY+" L"+(90+t-2)+" "+m.cheekY+" C"+(90+t+3)+" 42 "+(90+t)+" "+m.top+" 90 "+m.top+"Z";
 if(a.faceShape==="diamond")return "M90 "+m.top+" C"+(90-t*.72)+" "+m.top+" "+(90-c-7)+" 47 "+(90-c)+" "+m.cheekY+" C"+(90-c+5)+" 94 "+(90-j)+" "+m.jawY+" "+(90-ch)+" "+(m.chinY-5)+" Q90 "+(m.chinY+2)+" "+(90+ch)+" "+(m.chinY-5)+" C"+(90+j)+" "+m.jawY+" "+(90+c-5)+" 94 "+(90+c)+" "+m.cheekY+" C"+(90+c+7)+" 47 "+(90+t*.72)+" "+m.top+" 90 "+m.top+"Z";
 if(a.faceShape==="long")return "M90 "+(m.top-4)+" C"+(90-t*.88)+" "+(m.top-4)+" "+(90-t)+" 48 "+(90-c)+" "+(m.cheekY+5)+" C"+(90-c+5)+" "+(m.jawY+5)+" "+(90-j*.9)+" "+(m.jawY+10)+" "+(90-ch)+" "+(m.chinY+6)+" Q90 "+(m.chinY+13)+" "+(90+ch)+" "+(m.chinY+6)+" C"+(90+j*.9)+" "+(m.jawY+10)+" "+(90+c-5)+" "+(m.jawY+5)+" "+(90+c)+" "+(m.cheekY+5)+" C"+(90+t)+" 48 "+(90+t*.88)+" "+(m.top-4)+" 90 "+(m.top-4)+"Z";
 return "M90 "+m.top+" C"+(90-t)+" "+m.top+" "+(90-t-5)+" 45 "+(90-c)+" "+m.cheekY+" C"+(90-c+3)+" "+(m.jawY-7)+" "+(90-j)+" "+m.jawY+" "+(90-ch)+" "+(m.chinY-5)+" Q90 "+(m.chinY+2)+" "+(90+ch)+" "+(m.chinY-5)+" C"+(90+j)+" "+m.jawY+" "+(90+c-3)+" "+(m.jawY-7)+" "+(90+c)+" "+m.cheekY+" C"+(90+t+5)+" 45 "+(90+t)+" "+m.top+" 90 "+m.top+"Z"
}
function ears(a){const m=metrics(a),r=7+(a.earSize-50)*.08,y=m.cheekY-3,x=m.cheekW+3;return '<g fill="'+a.skin+'" stroke="#8d6554" stroke-width="1"><ellipse cx="'+(90-x)+'" cy="'+y+'" rx="'+(r*.62)+'" ry="'+r+'"/><ellipse cx="'+(90+x)+'" cy="'+y+'" rx="'+(r*.62)+'" ry="'+r+'"/></g><g fill="none" stroke="#9d715e" stroke-width="1" opacity=".55"><path d="M'+(90-x)+' '+(y-3)+' q5 3 0 8"/><path d="M'+(90+x)+' '+(y-3)+' q-5 3 0 8"/></g>'}

function hairAnchors(a){
 const m=metrics(a),vol=(a.hairVolume-50)/50,len=(a.hairLengthLevel-50)/50,int=a.hairTextureIntensity/100;
 const outer=m.headW*(.94+vol*.10),temple=m.templeW*(.91+vol*.05),hairline=m.top+27-len*2.5,sideY=m.cheekY-17;
 return {...m,outer,temple,hairline,sideY,vol,len,int}
}
function hairBack(a){
 const h=hairAnchors(a),c=a.hairColor,d=shadeHex(c,-20),t=a.hairStyle;
 if(!["medium","long","wavy","curly","coily"].includes(t))return "";
 const drop=t==="long"?Math.max(h.jawY+8,h.chinY+18+h.len*18):h.cheekY+36+h.len*10;
 const wide=t==="long"?h.temple+6:h.temple+2;
 return '<path d="M'+(90-wide)+' '+h.sideY+' Q'+(90-h.outer)+' '+(h.top+2)+' 90 '+(h.top-7)+' Q'+(90+h.outer)+' '+(h.top+2)+' '+(90+wide)+' '+h.sideY+' L'+(90+h.cheekW+6)+' '+drop+' Q'+(90+h.jawW*.62)+' '+(drop+8)+' 90 '+(drop+5)+' Q'+(90-h.jawW*.62)+' '+(drop+8)+' '+(90-h.cheekW-6)+' '+drop+'Z" fill="'+d+'" opacity=".94"/>'
}
function hairCapPath(a){
 const h=hairAnchors(a),t=a.hairStyle,top=h.top-(a.hairVolume-50)*.10;
 const left=90-h.outer,right=90+h.outer,line=h.hairline;
 if(t==="sidepart")return 'M'+left+' '+h.sideY+' Q'+(left+5)+' '+(top+2)+' 88 '+(top-5)+' Q'+(right-6)+' '+top+' '+right+' '+h.sideY+' Q113 '+(line-4)+' 91 '+(line+2)+' Q70 '+(line-1)+' '+left+' '+h.sideY+'Z';
 if(t==="slick")return 'M'+left+' '+h.sideY+' Q'+(left+9)+' '+(top+3)+' 91 '+(top-6)+' Q'+(right-3)+' '+top+' '+right+' '+h.sideY+' Q112 '+(line-5)+' 91 '+(line-2)+' Q69 '+(line-1)+' '+left+' '+h.sideY+'Z';
 if(t==="fade")return 'M'+left+' '+(h.sideY+4)+' Q'+(left+7)+' '+top+' 90 '+(top-5)+' Q'+(right-7)+' '+top+' '+right+' '+(h.sideY+4)+' Q113 '+(line-7)+' 90 '+(line-4)+' Q67 '+(line-7)+' '+left+' '+(h.sideY+4)+'Z';
 if(t==="buzz")return 'M'+(left+5)+' '+(h.sideY+6)+' Q'+(left+11)+' '+(top+4)+' 90 '+top+' Q'+(right-11)+' '+(top+4)+' '+(right-5)+' '+(h.sideY+6)+' Q112 '+(line-6)+' 90 '+(line-5)+' Q68 '+(line-6)+' '+(left+5)+' '+(h.sideY+6)+'Z';
 if(["curly","coily","wavy"].includes(t))return 'M'+(left-2)+' '+h.sideY+' Q'+(left+4)+' '+(top-7)+' 90 '+(top-10)+' Q'+(right-4)+' '+(top-7)+' '+(right+2)+' '+h.sideY+' Q113 '+(line-2)+' 90 '+(line+1)+' Q67 '+(line-2)+' '+(left-2)+' '+h.sideY+'Z';
 return 'M'+left+' '+h.sideY+' Q'+(left+6)+' '+(top-2)+' 90 '+(top-7)+' Q'+(right-6)+' '+(top-2)+' '+right+' '+h.sideY+' Q113 '+(line-2)+' 90 '+(line+2)+' Q67 '+(line-2)+' '+left+' '+h.sideY+'Z'
}
function hairTexture(a){
 const h=hairAnchors(a),t=a.hairTexture,int=h.int,base=a.hairColor,dark=shadeHex(base,-28),light=shadeHex(base,12),count=Math.max(5,Math.round(6+int*8));
 if(int<.08)return "";
 let out="";
 if(t==="straight"){
  for(let i=0;i<count;i++){let x=(90-h.outer*.70)+i*((h.outer*1.40)/(count-1)),bend=(i-count/2)*.18;out+='<path d="M'+x+' '+(h.top+5)+' Q'+(x+bend)+' '+(h.hairline-10)+' '+(x+bend*.5)+' '+(h.hairline+1)+'"/>'}
  return '<g fill="none" stroke="'+dark+'" stroke-opacity="'+(.22+.18*int)+'" stroke-width="'+(.75+.45*int)+'">'+out+'</g>'
 }
 if(t==="wavy"){
  for(let i=0;i<count;i++){let x=(90-h.outer*.68)+i*((h.outer*1.36)/(count-1)),amp=2.3+int*3.8;out+='<path d="M'+x+' '+(h.top+7)+' q'+amp+' 6 0 12 q-'+amp+' 6 0 12 q'+amp+' 5 0 10"/>'}
  return '<g fill="none" stroke="'+light+'" stroke-opacity="'+(.22+.18*int)+'" stroke-width="'+(.9+.55*int)+'">'+out+'</g>'
 }
 const rows=t==="coily"?3:2,cols=t==="coily"?8:7,rx=t==="coily"?(2.5+int*1.6):(3.8+int*2.0),ry=t==="coily"?(2.0+int*1.3):(2.8+int*1.5);
 for(let r=0;r<rows;r++)for(let i=0;i<cols;i++){let x=(90-h.outer*.65)+i*((h.outer*1.3)/(cols-1))+(r%2?2:0),y=h.top+11+r*9;out+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'"/>'}
 return '<g fill="none" stroke="'+(t==="coily"?dark:light)+'" stroke-opacity="'+(.24+.22*int)+'" stroke-width="'+(.8+.55*int)+'">'+out+'</g>'
}
function hairFront(a){
 const h=hairAnchors(a),t=a.hairStyle,c=a.hairColor,dark=shadeHex(c,-14),light=shadeHex(c,9);
 if(t==="bald")return "";
 let cap='<path d="'+hairCapPath(a)+'" fill="'+c+'"/>';
 let detail="";
 if(t==="sidepart")detail='<path d="M87 '+(h.top-1)+' Q90 '+(h.hairline-10)+' 88 '+(h.hairline+1)+'" fill="none" stroke="'+light+'" stroke-opacity=".38" stroke-width="1.2"/>';
 else if(t==="slick")detail='<path d="M64 '+(h.top+11)+' Q87 '+(h.top+1)+' 113 '+(h.top+10)+'" fill="none" stroke="'+light+'" stroke-opacity=".30" stroke-width="1.1"/>';
 else if(t==="fade")detail='<path d="M'+(90-h.outer*.87)+' '+h.sideY+' Q'+(90-h.outer*.67)+' '+(h.hairline-2)+' '+(90-h.outer*.48)+' '+(h.hairline-5)+'" fill="none" stroke="'+dark+'" stroke-opacity=".45" stroke-width="2"/><path d="M'+(90+h.outer*.87)+' '+h.sideY+' Q'+(90+h.outer*.67)+' '+(h.hairline-2)+' '+(90+h.outer*.48)+' '+(h.hairline-5)+'" fill="none" stroke="'+dark+'" stroke-opacity=".45" stroke-width="2"/>';
 if(t==="long")detail+='<path d="M90 '+(h.hairline-7)+' Q75 '+(h.hairline-2)+' '+(90-h.cheekW+10)+' '+(h.cheekY+6)+'" fill="none" stroke="'+light+'" stroke-opacity=".25" stroke-width="1.1"/><path d="M90 '+(h.hairline-7)+' Q105 '+(h.hairline-2)+' '+(90+h.cheekW-10)+' '+(h.cheekY+6)+'" fill="none" stroke="'+light+'" stroke-opacity=".25" stroke-width="1.1"/>';
 return cap+hairTexture(a)+detail
}
function stubble(a,m){
 const density=a.beardDensity/100,coverage=a.stubbleCoverage/100,r=.35+(a.stubbleSize/100)*1.05,pts=[],top=m.mouthY-1-(coverage-.5)*16,bottom=m.chinY-2;
 for(let y=Math.round(top);y<=bottom;y+=4)for(let x=Math.round(90-m.cheekW+8);x<=Math.round(90+m.cheekW-8);x+=4){const yn=(y-top)/Math.max(1,bottom-top),half=(m.cheekW*(1-yn)+m.chinW*yn)*.78,dx=Math.abs(x-90);let ok=dx<half;if(a.stubbleShape==="chin")ok=dx<(m.chinW+8)&&yn>.28;if(a.stubbleShape==="jaw")ok=ok&&yn>.42&&(dx>half*.52||yn>.72);if(a.stubbleShape==="full")ok=dx<half*1.08;const hash=((x*13+y*17+Math.round(a.stubbleSize)*7)%101)/100;if(ok&&hash<density*.82)pts.push('<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+a.hairColor+'" opacity="'+(.48+density*.38)+'"/>')}
 return '<g>'+pts.join("")+'</g>'
}
function beard(a){
 const m=metrics(a),c=a.hairColor,b=a.beard,den=.45+(a.beardDensity/100)*.55,len=(a.beardLength-50)*.20;
 if(b==="none")return "";if(b==="stubble")return stubble(a,m);
 const mw=13+(a.mouthWidth-50)*.12,side=Math.max(12,m.jawW-4),chin=Math.max(10,m.chinW);
 if(b==="mustache")return '<path d="M'+(90-mw-5)+' '+(m.mouthY-7)+' Q'+(90-mw*.45)+' '+(m.mouthY-13)+' 90 '+(m.mouthY-7)+' Q'+(90+mw*.45)+' '+(m.mouthY-13)+' '+(90+mw+5)+' '+(m.mouthY-7)+' Q'+(90+mw*.45)+' '+(m.mouthY+1)+' 90 '+(m.mouthY-2)+' Q'+(90-mw*.45)+' '+(m.mouthY+1)+' '+(90-mw-5)+' '+(m.mouthY-7)+'Z" fill="'+c+'" opacity="'+den+'"/>';
 if(b==="goatee")return '<path d="M'+(90-chin*.62)+' '+(m.mouthY+2)+' Q90 '+(m.mouthY+11)+' '+(90+chin*.62)+' '+(m.mouthY+2)+' Q'+(90+chin*.5)+' '+(m.chinY-3+len)+' 90 '+(m.chinY+2+len)+' Q'+(90-chin*.5)+' '+(m.chinY-3+len)+' '+(90-chin*.62)+' '+(m.mouthY+2)+'Z" fill="'+c+'" opacity="'+den+'"/>';
 const cheekTop=m.mouthY-(b==="full"?15:8),bottom=m.chinY+(b==="full"?6:2)+len,path='M'+(90-side)+' '+cheekTop+' Q'+(90-side+2)+' '+m.jawY+' '+(90-chin)+' '+(m.chinY-6)+' Q90 '+bottom+' '+(90+chin)+' '+(m.chinY-6)+' Q'+(90+side-2)+' '+m.jawY+' '+(90+side)+' '+cheekTop+' Q'+(90+side*.55)+' '+(m.mouthY+7)+' 90 '+(m.mouthY+9)+' Q'+(90-side*.55)+' '+(m.mouthY+7)+' '+(90-side)+' '+cheekTop+'Z',main='<path d="'+path+'" fill="'+c+'" opacity="'+(b==="short"?Math.min(.88,den):Math.min(.98,den+.1))+'"/>';
 if(b==="combo")return main+'<path d="M'+(90-mw-5)+' '+(m.mouthY-7)+' Q90 '+(m.mouthY-14)+' '+(90+mw+5)+' '+(m.mouthY-7)+' Q90 '+(m.mouthY+1)+' '+(90-mw-5)+' '+(m.mouthY-7)+'Z" fill="'+c+'"/>';return main
}

function faceDepth(a){
 const m=metrics(a),shadow=shadeHex(a.skin,-26),light=shadeHex(a.skin,18),warm=shadeHex(a.skin,-10);
 return '<g pointer-events="none"><path d="M'+(90-m.cheekW+7)+' '+(m.cheekY-2)+' Q'+(90-m.jawW)+' '+(m.jawY-3)+' '+(90-m.chinW)+' '+(m.chinY-7)+'" fill="none" stroke="'+shadow+'" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/><path d="M'+(90+m.cheekW-7)+' '+(m.cheekY-2)+' Q'+(90+m.jawW)+' '+(m.jawY-3)+' '+(90+m.chinW)+' '+(m.chinY-7)+'" fill="none" stroke="'+shadow+'" stroke-opacity=".12" stroke-width="4" stroke-linecap="round"/><ellipse cx="'+(90-m.cheekW*.46)+'" cy="'+(m.cheekY+7)+'" rx="'+(m.cheekW*.26)+'" ry="10" fill="'+warm+'" opacity=".08"/><ellipse cx="'+(90+m.cheekW*.42)+'" cy="'+(m.cheekY+7)+'" rx="'+(m.cheekW*.24)+'" ry="9" fill="'+light+'" opacity=".06"/><path d="M75 '+(m.top+24)+' Q90 '+(m.top+17)+' 105 '+(m.top+24)+'" fill="none" stroke="'+light+'" stroke-opacity=".10" stroke-width="4" stroke-linecap="round"/></g>'
}
function renderEyesReal(a){
 const m=metrics(a),es=4.6+(a.eyeSize-50)*.060,shape=(a.eyeShape-50)/20,eh=Math.max(2.3,3.3-shape*.45+(a.eyeSize-50)*.015),iris=shadeHex(a.hairColor,28),lid=shadeHex(a.skin,-36),white="#e9e4dc";
 const one=(cx,flip)=>'<g><path d="M'+(cx-es)+' '+m.eyeY+' Q'+cx+' '+(m.eyeY-eh)+' '+(cx+es)+' '+m.eyeY+' Q'+cx+' '+(m.eyeY+eh*.63)+' '+(cx-es)+' '+m.eyeY+'Z" fill="'+white+'" opacity=".94"/><ellipse cx="'+cx+'" cy="'+(m.eyeY+.2)+'" rx="'+Math.max(2,es*.34)+'" ry="'+Math.max(1.8,eh*.70)+'" fill="'+iris+'"/><ellipse cx="'+cx+'" cy="'+(m.eyeY+.2)+'" rx="'+Math.max(1.05,es*.15)+'" ry="'+Math.max(1.15,eh*.36)+'" fill="#11181b"/><circle cx="'+(cx-.8)+'" cy="'+(m.eyeY-1)+'" r=".55" fill="#fff" opacity=".72"/><path d="M'+(cx-es-1)+' '+m.eyeY+' Q'+cx+' '+(m.eyeY-eh-1)+' '+(cx+es+1)+' '+m.eyeY+'" fill="none" stroke="'+lid+'" stroke-width="1.15" stroke-linecap="round"/><path d="M'+(cx-es*.75)+' '+(m.eyeY+eh*.65)+' Q'+cx+' '+(m.eyeY+eh*.95)+' '+(cx+es*.72)+' '+(m.eyeY+eh*.60)+'" fill="none" stroke="'+lid+'" stroke-opacity=".36" stroke-width=".7"/></g>';
 return one(90-m.eyeDx,-1)+one(90+m.eyeDx,1)
}
function renderBrowsReal(a){
 const m=metrics(a),es=4.6+(a.eyeSize-50)*.060,by=m.eyeY-13-(a.browY-50)*.10,bw=1.4+(a.browThickness-30)*.046,c=shadeHex(a.hairColor,-8);
 return '<path d="M'+(90-m.eyeDx-es-3)+' '+(by+1)+' Q'+(90-m.eyeDx)+' '+(by-3)+' '+(90-m.eyeDx+es+3)+' '+by+'" stroke="'+c+'" stroke-width="'+bw+'" stroke-linecap="round" fill="none"/><path d="M'+(90+m.eyeDx-es-3)+' '+by+' Q'+(90+m.eyeDx)+' '+(by-3)+' '+(90+m.eyeDx+es+3)+' '+(by+1)+'" stroke="'+c+'" stroke-width="'+bw+'" stroke-linecap="round" fill="none"/>'
}
function renderNoseReal(a){
 const m=metrics(a),w=4.4+(a.noseWidth-50)*.12+(a.noseSize-50)*.05,shadow=shadeHex(a.skin,-34),mid=shadeHex(a.skin,-18),light=shadeHex(a.skin,20),base=m.noseY+(a.noseSize-50)*.05;
 return '<g><path d="M90 '+(m.eyeY+6)+' Q'+(90-w*.28)+' '+(base-9)+' '+(90-w*.10)+' '+(base-1)+'" fill="none" stroke="'+shadow+'" stroke-opacity=".55" stroke-width="1.15" stroke-linecap="round"/><path d="M92 '+(m.eyeY+7)+' Q'+(92+w*.12)+' '+(base-10)+' '+(91+w*.34)+' '+(base-3)+'" fill="none" stroke="'+light+'" stroke-opacity=".30" stroke-width=".9" stroke-linecap="round"/><path d="M'+(90-w)+' '+(base+1)+' Q'+(90-w*.52)+' '+(base+4)+' 90 '+(base+3)+' Q'+(90+w*.52)+' '+(base+4)+' '+(90+w)+' '+(base+1)+'" fill="none" stroke="'+mid+'" stroke-opacity=".72" stroke-width="1.2" stroke-linecap="round"/><path d="M'+(90-w*.64)+' '+(base+2.5)+' q'+(w*.25)+' 1.7 '+(w*.50)+' 0 M'+(90+w*.14)+' '+(base+2.5)+' q'+(w*.25)+' 1.7 '+(w*.50)+' 0" fill="none" stroke="'+shadow+'" stroke-opacity=".58" stroke-width=".85" stroke-linecap="round"/></g>'
}
function renderMouthReal(a){
 const m=metrics(a),mw=14+(a.mouthWidth-50)*.15,full=1.6+(a.lipFullness-30)*.045,line=shadeHex(a.skin,-46),upper=shadeHex(a.skin,-29),lower=shadeHex(a.skin,-14),y=m.mouthY;
 return '<g><path d="M'+(90-mw)+' '+y+' Q'+(90-mw*.44)+' '+(y-1.2)+' 90 '+(y+.3)+' Q'+(90+mw*.44)+' '+(y-1.2)+' '+(90+mw)+' '+y+'" fill="none" stroke="'+line+'" stroke-opacity=".76" stroke-width=".95" stroke-linecap="round"/><path d="M'+(90-mw*.76)+' '+(y-.2)+' Q90 '+(y-full)+' '+(90+mw*.76)+' '+(y-.2)+' Q90 '+(y+full*.15)+' '+(90-mw*.76)+' '+(y-.2)+'Z" fill="'+upper+'" opacity=".42"/><path d="M'+(90-mw*.70)+' '+(y+.5)+' Q90 '+(y+full*1.25)+' '+(90+mw*.70)+' '+(y+.5)+' Q90 '+(y+full*.38)+' '+(90-mw*.70)+' '+(y+.5)+'Z" fill="'+lower+'" opacity=".36"/><path d="M87 '+(y+full*2.3)+' Q90 '+(y+full*2.8)+' 93 '+(y+full*2.3)+'" fill="none" stroke="'+shadeHex(a.skin,-20)+'" stroke-opacity=".22" stroke-width=".8"/></g>'
}
function facial(a){return renderEyesReal(a)+renderBrowsReal(a)+renderNoseReal(a)+renderMouthReal(a)}
function kitPattern(a,id){
 const c1=a.kit1,c2=a.kit2,c3=a.kit3,count=Math.round(a.stripeCount),mode=a.kitStyle,width=a.stripeWidth==="narrow"?.62:a.stripeWidth==="wide"?1.38:1;if(mode==="solid")return '<linearGradient id="'+id+'" x1="0" x2="1"><stop stop-color="'+c1+'"/><stop offset="1" stop-color="'+c1+'"/></linearGradient>';if(mode==="halves")return '<linearGradient id="'+id+'" x1="0" x2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset=".5" stop-color="'+c1+'"/><stop offset=".5" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient>';if(mode==="gradient")return '<linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+c1+'"/><stop offset=".68" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c3+'"/></linearGradient>';const base=100/count,sw=base*width;if(mode==="horizontal")return '<pattern id="'+id+'" width="100" height="'+(base*2)+'" patternUnits="userSpaceOnUse"><rect width="100" height="'+(base*2)+'" fill="'+c1+'"/><rect width="100" height="'+sw+'" fill="'+c2+'"/></pattern>';if(mode==="diagonal")return '<pattern id="'+id+'" width="'+(base*2)+'" height="'+(base*2)+'" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><rect width="'+(base*2)+'" height="'+(base*2)+'" fill="'+c1+'"/><rect width="'+sw+'" height="'+(base*2)+'" fill="'+c2+'"/></pattern>';if(mode==="pinstripe")return '<pattern id="'+id+'" width="'+Math.max(8,base)+'" height="100" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="'+c1+'"/><rect width="'+Math.max(1.5,sw*.22)+'" height="100" fill="'+c2+'"/></pattern>';return '<pattern id="'+id+'" width="'+(base*2)+'" height="100" patternUnits="userSpaceOnUse"><rect width="'+(base*2)+'" height="100" fill="'+c1+'"/><rect width="'+sw+'" height="100" fill="'+c2+'"/></pattern>'
}
function bodyFront(a,name){const body=a.build==="slim"?.88:a.build==="stocky"?1.17:a.build==="strong"?1.09:1,chest=body*(1+(a.chestWidth-50)*.006),w=84*chest,leg=112+(a.height-165)*.45+(a.legLength-50)*.30,id="kitF"+Math.random().toString(36).slice(2,7);return '<defs>'+kitPattern(a,id)+'<linearGradient id="skinGrad" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient><filter id="sh"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity=".24"/></filter></defs><ellipse cx="90" cy="318" rx="'+(54*body)+'" ry="8" fill="#000" opacity=".28"/><path d="M'+(90-w/2)+' 150 Q90 136 '+(90+w/2)+' 150 L'+(90+w/2-8)+' 234 L'+(90-w/2+8)+' 234Z" fill="url(#'+id+')" filter="url(#sh)"/><path d="M'+(90-w/2+8)+' 227 L80 '+(287+leg*.22)+' L61 '+(287+leg*.22)+' L70 222Z" fill="#102c3c"/><path d="M'+(90+w/2-8)+' 227 L100 '+(287+leg*.22)+' L119 '+(287+leg*.22)+' L110 222Z" fill="#102c3c"/><path d="M'+(90-w/2)+' 150 Q90 136 '+(90+w/2)+' 150 L'+(90+w/2-8)+' 234 L'+(90-w/2+8)+' 234Z" fill="url(#skinGrad)" opacity=".28"/><text x="90" y="204" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="12" font-weight="900">'+esc(name).slice(0,16)+'</text>'}
function backPanel(a,name){const id="kitB"+Math.random().toString(36).slice(2,7),label=(a.shirtName||name||"").split(/\s+/).slice(-1)[0].toUpperCase().slice(0,12);return '<g transform="translate(178 32) scale(.63)"><defs>'+kitPattern(a,id)+'</defs><path d="M48 82 Q90 66 132 82 L124 182 L56 182Z" fill="url(#'+id+')" stroke="#ffffff22" stroke-width="1.5"/><text x="90" y="112" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="14" font-weight="900">'+esc(label)+'</text><text x="90" y="160" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="1.4" paint-order="stroke" font-size="46" font-weight="1000">'+esc(a.shirtNo)+'</text><text x="90" y="202" text-anchor="middle" fill="#a7c3d1" font-size="10">BACK</text></g>'}
function render(a0,name,mini=false,mode="both"){
 const a=normalizeFace(cfg(a0)),front=mode==="front",view=front?"20 0 180 255":"0 0 300 360",shift=front?20:38;
 return '<svg viewBox="'+view+'" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg" cx=".5" cy=".2" r=".9"><stop stop-color="#10435a"/><stop offset="1" stop-color="#031019"/></radialGradient><linearGradient id="faceLight" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".10"/><stop offset=".52" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".10"/></linearGradient></defs><rect width="'+(front?220:300)+'" height="360" rx="18" fill="url(#bg)"/><g transform="translate('+shift+' 6)">'+bodyFront(a,name)+hairBack(a)+ears(a)+'<path d="'+facePath(a)+'" fill="'+a.skin+'" stroke="'+shadeHex(a.skin,-34)+'" stroke-opacity=".72" stroke-width=".9"/><path d="'+facePath(a)+'" fill="url(#faceLight)"/>'+faceDepth(a)+facial(a)+beard(a)+hairFront(a)+'</g>'+(front?'':backPanel(a,name)+'<text x="235" y="208" text-anchor="middle" fill="#8fb0bf" font-size="9">FRONT / BACK</text>')+'</svg>'
}
window.TimeClashAvatar={render,normalize:a=>normalizeFace(cfg(a)),kitPattern};
})();