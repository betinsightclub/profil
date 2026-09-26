(()=>{const META={
"hair/m-french-crop-real":{src:"/time-clash/assets/hair-real/m-french-crop-real.png",label:"French Crop",unisex:false},
"hair/m-faux-hawk-real":{src:"/time-clash/assets/hair-real/m-faux-hawk-real.png",label:"Faux Hawk",unisex:false},
"hair/m-modern-mohawk-real":{src:"/time-clash/assets/hair-real/m-modern-mohawk-real.png",label:"Moderner Mohawk",unisex:false},
"hair/m-tight-curly-top-real":{src:"/time-clash/assets/hair-real/m-tight-curly-top-real.png",label:"Kurzer Lockiger Cut",unisex:true},
"hair/m-cornrows-real":{src:"/time-clash/assets/hair-real/m-cornrows-real.png",label:"Cornrows",unisex:true},
"hair/m-short-twisted-locs-real":{src:"/time-clash/assets/hair-real/m-short-twisted-locs-real.png",label:"Kurze Twisted Locs",unisex:true},
"hair/m-medium-locs-real":{src:"/time-clash/assets/hair-real/m-medium-locs-real.png",label:"Mittellange Locs",unisex:true},
"hair/m-short-curly-afro-real":{src:"/time-clash/assets/hair-real/m-short-curly-afro-real.png",label:"Kurzer Curly Afro",unisex:true},
"hair/m-messy-side-swept-real":{src:"/time-clash/assets/hair-real/m-messy-side-swept-real.png",label:"Messy Side-Swept Cut",unisex:false}
};
function cell(key){return META[key]||null}
function svgImage(key,x,y,w,h,extra=""){const m=cell(key);if(!m)return "";return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="0 0 200 133" overflow="visible" preserveAspectRatio="xMidYMin meet" '+extra+'><image href="'+m.src+'" x="0" y="0" width="200" height="133" preserveAspectRatio="xMidYMin meet"/></svg>'}
window.TimeClashHairAssets={cell,svgImage,meta:META,keys:Object.keys(META)};
})();