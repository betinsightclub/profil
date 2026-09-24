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
function textureMarks(a,m){
 const int=a.hairTextureIntensity/100,n=Math.max(3,Math.round(4+int*8)),top=m.top-5-(a.hairVolume-50)*.12,dark=shadeHex(a.hairColor,-24),light=shadeHex(a.hairColor,16);let s="";
 if(a.hairTexture==="straight"){for(let i=0;i<n;i++){const x=59+i*(62/Math.max(1,n-1));s+='<path d="M'+x+' '+(top+8)+' Q'+(x-1.5)+' '+(top+21)+' '+(x+1)+' '+(top+34)+'"/>'}return '<g stroke="'+dark+'" stroke-opacity="'+(.18+.16*int)+'" fill="none" stroke-width="'+(.8+int*.45)+'">'+s+'</g>'}
 if(a.hairTexture==="wavy"){for(let i=0;i<n;i++){const x=57+i*(66/Math.max(1,n-1)),amp=2.5+4.5*int;s+='<path d="M'+x+' '+(top+8)+' q'+amp+' 5 0 10 q-'+amp+' 5 0 10 q'+amp+' 5 0 10"/>'}return '<g stroke="'+light+'" stroke-opacity="'+(.20+.18*int)+'" fill="none" stroke-width="'+(1+int*.55)+'">'+s+'</g>'}
 const rad=a.hairTexture==="coily"?2.0+2.1*int:2.8+2.8*int;for(let i=0;i<n+5;i++){const x=54+(i%7)*11.5+(i%2)*2.5,y=top+10+Math.floor(i/7)*12;s+='<circle cx="'+x+'" cy="'+y+'" r="'+rad+'"/>'}return '<g fill="none" stroke="'+(a.hairTexture==="coily"?dark:light)+'" stroke-opacity="'+(.22+.22*int)+'" stroke-width="'+(.9+int*.65)+'">'+s+'</g>'
}
function textureSilhouette(a,m){
 const int=a.hairTextureIntensity/100;if(a.hairTexture==="straight"||int<.12)return "";
 const count=a.hairTexture==="coily"?12:a.hairTexture==="curly"?10:8,rad=(a.hairTexture==="coily"?4.0:a.hairTexture==="curly"?5.8:6.8)*(0.70+int*.42),y=m.top+7-(a.hairVolume-50)*.10,fill=shadeHex(a.hairColor,a.hairTexture==="coily"?-12:8);let s="";
 for(let i=0;i<count;i++){let x=(90-m.headW*.74)+i*((m.headW*1.48)/(count-1)),yy=y+((i%2)?2.5:-1.2);s+='<circle cx="'+x+'" cy="'+yy+'" r="'+rad+'" fill="'+fill+'" opacity="'+(.52+.3*int)+'"/>'}
 return '<g>'+s+'</g>'
}
function hair(a){
 const c=a.hairColor,t=a.hairStyle,m=metrics(a),vol=1+(a.hairVolume-50)*.009,len=(a.hairLengthLevel-50)*.55;let base="";
 if(t==="bald")return "";
 if(t==="buzz")base='<path d="M'+(90-m.headW*.82)+' '+(m.cheekY-29)+' Q'+(90-m.headW*.72)+' '+(m.top-5)+' 90 '+(m.top-8)+' Q'+(90+m.headW*.72)+' '+(m.top-5)+' '+(90+m.headW*.82)+' '+(m.cheekY-29)+' Q112 '+(m.top+17)+' 90 '+(m.top+18)+' Q68 '+(m.top+17)+' '+(90-m.headW*.82)+' '+(m.cheekY-29)+'Z" fill="'+c+'" opacity=".92"/>';
 else if(t==="fade")base='<path d="M'+(90-m.headW*.88)+' '+(m.cheekY-22)+' Q'+(90-m.headW*.73)+' '+(m.top-8)+' 90 '+(m.top-11)+' Q'+(90+m.headW*.76)+' '+(m.top-7)+' '+(90+m.headW*.88)+' '+(m.cheekY-22)+' Q112 '+(m.top+21)+' 90 '+(m.top+20)+' Q68 '+(m.top+22)+' '+(90-m.headW*.88)+' '+(m.cheekY-22)+'Z" fill="'+c+'"/>';
 else if(t==="sidepart")base='<path d="M'+(90-m.headW*.9)+' '+(m.cheekY-20)+' Q'+(90-m.headW*.82)+' '+(m.top-9)+' 88 '+(m.top-13)+' Q'+(90+m.headW*.76)+' '+(m.top-8)+' '+(90+m.headW*.9)+' '+(m.cheekY-24)+' Q111 '+(m.top+20)+' 83 '+(m.top+22)+' Q64 '+(m.top+25)+' '+(90-m.headW*.9)+' '+(m.cheekY-20)+'Z" fill="'+c+'"/>';
 else if(t==="slick")base='<path d="M'+(90-m.headW*.82)+' '+(m.cheekY-25)+' Q'+(90-m.headW*.58)+' '+(m.top-10)+' 92 '+(m.top-13)+' Q'+(90+m.headW*.69)+' '+(m.top-5)+' '+(90+m.headW*.82)+' '+(m.cheekY-26)+' Q113 '+(m.top+20)+' 91 '+(m.top+19)+' Q67 '+(m.top+20)+' '+(90-m.headW*.82)+' '+(m.cheekY-25)+'Z" fill="'+c+'"/>';
 else if(t==="long")base='<path d="M'+(90-m.headW*.94)+' '+(m.cheekY-18)+' Q'+(90-m.headW*.84)+' '+(m.top-9)+' 90 '+(m.top-12)+' Q'+(90+m.headW*.84)+' '+(m.top-8)+' '+(90+m.headW*.94)+' '+(m.cheekY-18)+' L'+(90+m.cheekW+3)+' '+(m.jawY+18+len)+' Q112 '+(m.cheekY+14)+' 90 '+(m.cheekY+4)+' Q68 '+(m.cheekY+14)+' '+(90-m.cheekW-3)+' '+(m.jawY+18+len)+'Z" fill="'+c+'"/>';
 else if(t==="medium")base='<path d="M'+(90-m.headW*.92)+' '+(m.cheekY-18)+' Q'+(90-m.headW*.82)+' '+(m.top-9)+' 90 '+(m.top-12)+' Q'+(90+m.headW*.82)+' '+(m.top-8)+' '+(90+m.headW*.92)+' '+(m.cheekY-18)+' L'+(90+m.cheekW)+' '+(m.cheekY+17+len*.45)+' Q111 '+(m.cheekY+1)+' 90 '+(m.cheekY-7)+' Q69 '+(m.cheekY+1)+' '+(90-m.cheekW)+' '+(m.cheekY+17+len*.45)+'Z" fill="'+c+'"/>';
 else if(t==="curly"||t==="coily"||t==="wavy"){const rr=(t==="coily"?7:t==="curly"?9:10)*vol,pts=[[-35,5],[-30,-8],[-18,-17],[-4,-22],[11,-20],[25,-12],[34,2],[-22,4],[-8,-4],[7,-5],[22,2]];base='<g fill="'+c+'">'+pts.map(q=>'<circle cx="'+(90+q[0]*vol)+'" cy="'+(m.top+28+q[1]*vol)+'" r="'+rr+'"/>').join("")+'</g>'}
 else base='<path d="M'+(90-m.headW*.88)+' '+(m.cheekY-24)+' Q'+(90-m.headW*.72)+' '+(m.top-8)+' 90 '+(m.top-11)+' Q'+(90+m.headW*.75)+' '+(m.top-7)+' '+(90+m.headW*.88)+' '+(m.cheekY-24)+' Q113 '+(m.top+23)+' 90 '+(m.top+22)+' Q66 '+(m.top+22)+' '+(90-m.headW*.88)+' '+(m.cheekY-24)+'Z" fill="'+c+'"/>';
 const hairLayer=base+textureSilhouette(a,m)+textureMarks(a,m),sx=Math.max(.84,Math.min(1.20,1+(a.hairVolume-50)*.006)),sy=Math.max(.88,Math.min(1.16,1+(a.hairVolume-50)*.0045));return '<g transform="translate(90 68) scale('+sx+' '+sy+') translate(-90 -68)">'+hairLayer+'</g>'
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
function facial(a){
 const m=metrics(a),es=5+(a.eyeSize-50)*.075,shape=(a.eyeShape-50)/20,eyeH=Math.max(2.4,es*(.62-shape*.12)),by=m.eyeY-14-(a.browY-50)*.11,bw=1.7+(a.browThickness-30)*.055,nw=5+(a.noseWidth-50)*.12+(a.noseSize-50)*.07,nl=(a.noseSize-50)*.05,mw=18+(a.mouthWidth-50)*.17,lip=2.2+(a.lipFullness-30)*.07;
 const eye=cx=>'<path d="M'+(cx-es)+' '+m.eyeY+' Q'+cx+' '+(m.eyeY-eyeH)+' '+(cx+es)+' '+m.eyeY+' Q'+cx+' '+(m.eyeY+eyeH*.75)+' '+(cx-es)+' '+m.eyeY+'Z" fill="#f7fbff"/><ellipse cx="'+cx+'" cy="'+m.eyeY+'" rx="'+(es*.42)+'" ry="'+Math.max(1.8,es*.38)+'" fill="#435760"/><circle cx="'+cx+'" cy="'+m.eyeY+'" r="'+Math.max(1.1,es*.17)+'" fill="#0b1418"/><circle cx="'+(cx-1)+'" cy="'+(m.eyeY-1)+'" r=".7" fill="#fff" opacity=".8"/>';
 return '<g>'+eye(90-m.eyeDx)+eye(90+m.eyeDx)+'<path d="M'+(90-m.eyeDx-es-2)+' '+by+' Q'+(90-m.eyeDx)+' '+(by-4)+' '+(90-m.eyeDx+es+3)+' '+(by+1)+'" stroke="'+a.hairColor+'" stroke-width="'+bw+'" stroke-linecap="round" fill="none"/><path d="M'+(90+m.eyeDx-es-3)+' '+(by+1)+' Q'+(90+m.eyeDx)+' '+(by-4)+' '+(90+m.eyeDx+es+2)+' '+by+'" stroke="'+a.hairColor+'" stroke-width="'+bw+'" stroke-linecap="round" fill="none"/><path d="M90 '+(m.eyeY+5)+' Q'+(90-nw*.45)+' '+(m.noseY-5)+' '+(90-nw*.12)+' '+(m.noseY+nl)+' Q90 '+(m.noseY+3+nl)+' '+(90+nw)+' '+(m.noseY+1+nl)+'" stroke="#8f5e4e" stroke-width="'+(1.5+(a.noseSize-30)*.025)+'" fill="none" opacity=".72"/><path d="M'+(90-mw)+' '+m.mouthY+' Q90 '+(m.mouthY+lip)+' '+(90+mw)+' '+m.mouthY+' Q90 '+(m.mouthY+lip*2.1)+' '+(90-mw)+' '+m.mouthY+'Z" fill="#9a5b58" opacity=".86"/></g>'
}
function kitPattern(a,id){
 const c1=a.kit1,c2=a.kit2,c3=a.kit3,count=Math.round(a.stripeCount),mode=a.kitStyle,width=a.stripeWidth==="narrow"?.62:a.stripeWidth==="wide"?1.38:1;if(mode==="solid")return '<linearGradient id="'+id+'" x1="0" x2="1"><stop stop-color="'+c1+'"/><stop offset="1" stop-color="'+c1+'"/></linearGradient>';if(mode==="halves")return '<linearGradient id="'+id+'" x1="0" x2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset=".5" stop-color="'+c1+'"/><stop offset=".5" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient>';if(mode==="gradient")return '<linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+c1+'"/><stop offset=".68" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c3+'"/></linearGradient>';const base=100/count,sw=base*width;if(mode==="horizontal")return '<pattern id="'+id+'" width="100" height="'+(base*2)+'" patternUnits="userSpaceOnUse"><rect width="100" height="'+(base*2)+'" fill="'+c1+'"/><rect width="100" height="'+sw+'" fill="'+c2+'"/></pattern>';if(mode==="diagonal")return '<pattern id="'+id+'" width="'+(base*2)+'" height="'+(base*2)+'" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><rect width="'+(base*2)+'" height="'+(base*2)+'" fill="'+c1+'"/><rect width="'+sw+'" height="'+(base*2)+'" fill="'+c2+'"/></pattern>';if(mode==="pinstripe")return '<pattern id="'+id+'" width="'+Math.max(8,base)+'" height="100" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="'+c1+'"/><rect width="'+Math.max(1.5,sw*.22)+'" height="100" fill="'+c2+'"/></pattern>';return '<pattern id="'+id+'" width="'+(base*2)+'" height="100" patternUnits="userSpaceOnUse"><rect width="'+(base*2)+'" height="100" fill="'+c1+'"/><rect width="'+sw+'" height="100" fill="'+c2+'"/></pattern>'
}
function bodyFront(a,name){const body=a.build==="slim"?.88:a.build==="stocky"?1.17:a.build==="strong"?1.09:1,chest=body*(1+(a.chestWidth-50)*.006),w=84*chest,leg=112+(a.height-165)*.45+(a.legLength-50)*.30,id="kitF"+Math.random().toString(36).slice(2,7);return '<defs>'+kitPattern(a,id)+'<linearGradient id="skinGrad" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient><filter id="sh"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity=".24"/></filter></defs><ellipse cx="90" cy="318" rx="'+(54*body)+'" ry="8" fill="#000" opacity=".28"/><path d="M'+(90-w/2)+' 150 Q90 136 '+(90+w/2)+' 150 L'+(90+w/2-8)+' 234 L'+(90-w/2+8)+' 234Z" fill="url(#'+id+')" filter="url(#sh)"/><path d="M'+(90-w/2+8)+' 227 L80 '+(287+leg*.22)+' L61 '+(287+leg*.22)+' L70 222Z" fill="#102c3c"/><path d="M'+(90+w/2-8)+' 227 L100 '+(287+leg*.22)+' L119 '+(287+leg*.22)+' L110 222Z" fill="#102c3c"/><path d="M'+(90-w/2)+' 150 Q90 136 '+(90+w/2)+' 150 L'+(90+w/2-8)+' 234 L'+(90-w/2+8)+' 234Z" fill="url(#skinGrad)" opacity=".28"/><text x="90" y="204" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="12" font-weight="900">'+esc(name).slice(0,16)+'</text>'}
function backPanel(a,name){const id="kitB"+Math.random().toString(36).slice(2,7),label=(a.shirtName||name||"").split(/\s+/).slice(-1)[0].toUpperCase().slice(0,12);return '<g transform="translate(178 32) scale(.63)"><defs>'+kitPattern(a,id)+'</defs><path d="M48 82 Q90 66 132 82 L124 182 L56 182Z" fill="url(#'+id+')" stroke="#ffffff22" stroke-width="1.5"/><text x="90" y="112" text-anchor="middle" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke" font-size="14" font-weight="900">'+esc(label)+'</text><text x="90" y="160" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="1.4" paint-order="stroke" font-size="46" font-weight="1000">'+esc(a.shirtNo)+'</text><text x="90" y="202" text-anchor="middle" fill="#a7c3d1" font-size="10">BACK</text></g>'}
function render(a0,name,mini=false,mode="both"){
 const a=normalizeFace(cfg(a0)),front=mode==="front",view=front?"20 0 180 255":"0 0 300 360",shift=front?20:38;
 return '<svg viewBox="'+view+'" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg" cx=".5" cy=".2" r=".9"><stop stop-color="#10435a"/><stop offset="1" stop-color="#031019"/></radialGradient><linearGradient id="faceLight" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".13"/></linearGradient></defs><rect width="'+(front?220:300)+'" height="360" rx="18" fill="url(#bg)"/><g transform="translate('+shift+' 6)">'+bodyFront(a,name)+ears(a)+'<path d="'+facePath(a)+'" fill="'+a.skin+'" stroke="#8d6554" stroke-width="1.15"/><path d="'+facePath(a)+'" fill="url(#faceLight)"/>'+facial(a)+beard(a)+hair(a)+'</g>'+(front?'':backPanel(a,name)+'<text x="235" y="208" text-anchor="middle" fill="#8fb0bf" font-size="9">FRONT / BACK</text>')+'</svg>'
}
window.TimeClashAvatar={render,normalize:a=>normalizeFace(cfg(a)),kitPattern};
})();