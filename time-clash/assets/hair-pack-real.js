(()=>{const META={
"hair/m-french-crop-real":{src:"/time-clash/assets/hair-real/m-french-crop-real.png",label:"French Crop",unisex:false,fit:{s:1.40,x:0,y:.01},thumb:{s:1.32,x:0,y:.06}},
"hair/m-faux-hawk-real":{src:"/time-clash/assets/hair-real/m-faux-hawk-real.png",label:"Faux Hawk",unisex:false,fit:{s:1.35,x:0,y:-.08},thumb:{s:1.22,x:0,y:.01}},
"hair/m-modern-mohawk-real":{src:"/time-clash/assets/hair-real/m-modern-mohawk-real.png",label:"Moderner Mohawk",unisex:false,fit:{s:1.30,x:0,y:-.12},thumb:{s:1.18,x:0,y:-.02}},
"hair/m-tight-curly-top-real":{src:"/time-clash/assets/hair-real/m-tight-curly-top-real.png",label:"Kurzer Lockiger Cut",unisex:true,fit:{s:1.40,x:0,y:-.03},thumb:{s:1.27,x:0,y:.03}},
"hair/m-cornrows-real":{src:"/time-clash/assets/hair-real/m-cornrows-real.png",label:"Cornrows",unisex:true,fit:{s:1.42,x:0,y:.02},thumb:{s:1.28,x:0,y:.07}},
"hair/m-short-twisted-locs-real":{src:"/time-clash/assets/hair-real/m-short-twisted-locs-real.png",label:"Kurze Twisted Locs",unisex:true,fit:{s:1.42,x:0,y:-.02},thumb:{s:1.27,x:0,y:.04}},
"hair/m-medium-locs-real":{src:"/time-clash/assets/hair-real/m-medium-locs-real.png",label:"Mittellange Locs",unisex:true,fit:{s:1.38,x:0,y:.02},thumb:{s:1.20,x:0,y:.08}},
"hair/m-short-curly-afro-real":{src:"/time-clash/assets/hair-real/m-short-curly-afro-real.png",label:"Kurzer Curly Afro",unisex:true,fit:{s:1.37,x:0,y:-.04},thumb:{s:1.23,x:0,y:.02}},
"hair/m-messy-side-swept-real":{src:"/time-clash/assets/hair-real/m-messy-side-swept-real.png",label:"Messy Side-Swept Cut",unisex:false,fit:{s:1.40,x:-.01,y:0},thumb:{s:1.27,x:-.01,y:.05}},
"hair/f-shoulder-waves-real":{src:"/time-clash/assets/hair-real/f-shoulder-waves-real.png",label:"Schulterlange Wellen",unisex:false,fit:{s:1.42,x:0,y:0},thumb:{s:1.18,x:0,y:.08}},
"hair/f-asymmetric-bob-real":{src:"/time-clash/assets/hair-real/f-asymmetric-bob-real.png",label:"Asymmetrischer Bob",unisex:false,fit:{s:1.42,x:0,y:0},thumb:{s:1.18,x:0,y:.08}},
"hair/f-low-ponytail-real":{src:"/time-clash/assets/hair-real/f-low-ponytail-real.png",label:"Tiefer Pferdeschwanz",unisex:false,fit:{s:1.42,x:0,y:0},thumb:{s:1.18,x:0,y:.08}},
"hair/f-low-chignon-real":{src:"/time-clash/assets/hair-real/f-low-chignon-real.png",label:"Tiefer Chignon",unisex:false,fit:{s:1.38,x:0,y:-.03},thumb:{s:1.18,x:0,y:.05}},
"hair/f-sport-braided-ponytail-real":{src:"/time-clash/assets/hair-real/f-sport-braided-ponytail-real.png",label:"Geflochtener Sport-Pferdeschwanz",unisex:false,fit:{s:1.40,x:0,y:-.02},thumb:{s:1.17,x:0,y:.06}},
"hair/f-medium-box-braids-real":{src:"/time-clash/assets/hair-real/f-medium-box-braids-real.png",label:"Mittlere Box Braids",unisex:false,fit:{s:1.42,x:0,y:.02},thumb:{s:1.16,x:0,y:.09}},
"hair/f-high-afro-puff-real":{src:"/time-clash/assets/hair-real/f-high-afro-puff-real.png",label:"Hoher Afro Puff",unisex:false,fit:{s:1.28,x:0,y:-.13},thumb:{s:1.10,x:0,y:-.02}}
};
function cell(key){return META[key]||null}
function pos(m,x,y,w,h,mode){const f=(mode==="thumb"?m.thumb:m.fit)||{s:1,x:0,y:0},s=Number(f.s||1),bw=w*s,bh=h*s,bx=x+(w-bw)/2+(Number(f.x||0)*w),by=y+(Number(f.y||0)*h);return {bx,by,bw,bh}}
function svgImage(key,x,y,w,h,extra="",mode="render"){const m=cell(key);if(!m)return "";const p=pos(m,x,y,w,h,mode);return '<svg x="'+p.bx.toFixed(2)+'" y="'+p.by.toFixed(2)+'" width="'+p.bw.toFixed(2)+'" height="'+p.bh.toFixed(2)+'" viewBox="0 0 200 133" overflow="visible" preserveAspectRatio="xMidYMin meet" '+extra+'><image href="'+m.src+'" x="0" y="0" width="200" height="133" preserveAspectRatio="xMidYMin meet"/></svg>'}
function thumbSvg(key,w=96,h=96){const m=cell(key);if(!m)return "";return '<svg viewBox="0 0 96 96" width="'+w+'" height="'+h+'" overflow="hidden"><ellipse cx="48" cy="54" rx="21" ry="27" fill="#c89472" opacity=".88"/><path d="M31 78 Q48 88 65 78 L69 96 H27Z" fill="#173445" opacity=".95"/>'+svgImage(key,0,0,96,96,"","thumb")+'</svg>'}
window.TimeClashHairAssets={cell,svgImage,thumbSvg,meta:META,keys:Object.keys(META)};
})();