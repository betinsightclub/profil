(()=>{const META={
"hair/m-french-crop-real":{src:"/time-clash/assets/hair-real/m-french-crop-real.png",label:"French Crop",unisex:false},
"hair/m-faux-hawk-real":{src:"/time-clash/assets/hair-real/m-faux-hawk-real.png",label:"Faux Hawk",unisex:false},
"hair/m-modern-mohawk-real":{src:"/time-clash/assets/hair-real/m-modern-mohawk-real.png",label:"Moderner Mohawk",unisex:false},
"hair/m-tight-curly-top-real":{src:"/time-clash/assets/hair-real/m-tight-curly-top-real.png",label:"Kurzer Lockiger Cut",unisex:true},
"hair/m-cornrows-real":{src:"/time-clash/assets/hair-real/m-cornrows-real.png",label:"Cornrows",unisex:true},
"hair/m-short-twisted-locs-real":{src:"/time-clash/assets/hair-real/m-short-twisted-locs-real.png",label:"Kurze Twisted Locs",unisex:true},
"hair/m-medium-locs-real":{src:"/time-clash/assets/hair-real/m-medium-locs-real.png",label:"Mittellange Locs",unisex:true},
"hair/m-short-curly-afro-real":{src:"/time-clash/assets/hair-real/m-short-curly-afro-real.png",label:"Kurzer Curly Afro",unisex:true},
"hair/m-messy-side-swept-real":{src:"/time-clash/assets/hair-real/m-messy-side-swept-real.png",label:"Messy Side-Swept Cut",unisex:false},
"hair/f-shoulder-waves-real":{src:"/time-clash/assets/hair-real/f-shoulder-waves-real.png",label:"Schulterlange Wellen",unisex:false},
"hair/f-asymmetric-bob-real":{src:"/time-clash/assets/hair-real/f-asymmetric-bob-real.png",label:"Asymmetrischer Bob",unisex:false},
"hair/f-low-ponytail-real":{src:"/time-clash/assets/hair-real/f-low-ponytail-real.png",label:"Tiefer Pferdeschwanz",unisex:false},
"hair/f-low-chignon-real":{src:"/time-clash/assets/hair-real/f-low-chignon-real.png",label:"Tiefer Chignon",unisex:false},
"hair/f-sport-braided-ponytail-real":{src:"/time-clash/assets/hair-real/f-sport-braided-ponytail-real.png",label:"Geflochtener Sport-Pferdeschwanz",unisex:false},
"hair/f-medium-box-braids-real":{src:"/time-clash/assets/hair-real/f-medium-box-braids-real.png",label:"Mittlere Box Braids",unisex:false},
"hair/f-high-afro-puff-real":{src:"/time-clash/assets/hair-real/f-high-afro-puff-real.png",label:"Hoher Afro Puff",unisex:false}
};
function cell(key){return META[key]||null}
function svgImage(key,x,y,w,h,extra=""){const m=cell(key);if(!m)return "";return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="0 0 200 133" overflow="visible" preserveAspectRatio="xMidYMin meet" '+extra+'><image href="'+m.src+'" x="0" y="0" width="200" height="133" preserveAspectRatio="xMidYMin meet"/></svg>'}
window.TimeClashHairAssets={cell,svgImage,meta:META,keys:Object.keys(META)};
})();