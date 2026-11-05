/* BetInsight Stadium World: WebGL-independent Leaflet fallback.
   Loaded only when WebGL-based maps cannot render. No backend writes. */
(function(){
 "use strict";
 let map=null,base=null,dots=null,flags=null,selectedMarker=null,loader=null,opts={},version=0,canvas=null;
 const languages={
  de:"Die Kartenansicht konnte nicht geladen werden. Die Stadionliste bleibt verfügbar.",
  en:"The map could not be loaded. The stadium list remains available.",
  es:"No se pudo cargar el mapa. La lista de estadios sigue disponible.",
  pt:"Não foi possível carregar o mapa. A lista de estádios continua disponível.",
  it:"Impossibile caricare la mappa. L'elenco degli stadi resta disponibile.",
  fr:"La carte n'a pas pu être chargée. La liste des stades reste disponible.",
  nl:"De kaart kon niet worden geladen. De stadionlijst blijft beschikbaar.",
  zh:"無法載入地圖，但仍可使用球場列表。"
 };
 function html(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
 function load(){
  if(window.L)return Promise.resolve();
  if(loader)return loader;
  const urls=[
   ["https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js","https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"],
   ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js","https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]
  ];
  function attempt(index){
   if(index>=urls.length)return Promise.reject(Error("Leaflet CDN unavailable"));
   return new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-bi-leaflet]')){
     const css=document.createElement("link");css.rel="stylesheet";css.dataset.biLeaflet="1";
     css.href=urls[index][1];document.head.appendChild(css);
    }
    const script=document.createElement("script");script.src=urls[index][0];
    script.onload=()=>window.L?resolve():reject(Error("Leaflet not initialized"));
    script.onerror=()=>reject(Error("Leaflet script unavailable"));document.head.appendChild(script);
   }).catch(()=>{
    document.querySelector('link[data-bi-leaflet]')?.remove();
    return attempt(index+1);
   });
  }
  loader=attempt(0).catch(error=>{loader=null;throw error});
  return loader;
 }
 function center(){const s=opts.selected;const lat=Number(s?.latitude),lng=Number(s?.longitude);return Number.isFinite(lat)&&Number.isFinite(lng)?[lat,lng]:[21,9]}
 function zoomLevel(z){return opts.selected?(opts.mode==="satellite"?12:Math.max(12,Math.min(16,z))):Math.min(3,z)}
 function tiles(){
  if(!map)return;
  if(base){map.removeLayer(base);base=null}
  const satellite=opts.mode==="satellite";
  base=L.tileLayer(satellite?
   "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg":
   "https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
     maxZoom:20,maxNativeZoom:satellite?13:19,
     attribution:satellite?"EOxCloudless © EOX IT Services GmbH · CC BY 4.0":"© OpenStreetMap contributors"
   }).addTo(map);
 }
 function draw(){
  if(!map||!window.L)return;
  if(dots){dots.remove();dots=null}
  if(flags){flags.remove();flags=null}
  dots=L.layerGroup().addTo(map);flags=L.layerGroup().addTo(map);
  canvas=canvas||L.canvas({padding:.3});
  const visited=new Set((opts.visits||[]).map(x=>Number(x.stadium_id)));
  for(const s of opts.stadiums||[]){
   const lat=Number(s.latitude),lng=Number(s.longitude);
   if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180)continue;
   const band=opts.capacityBand?.(s.capacity)??-1;
   const marker=L.circleMarker([lat,lng],{
    renderer:canvas,radius:band<0?3:4+band*.6,weight:1,color:"#123142",
    fillColor:opts.stadiumColor?.(s.capacity)||"#67b8f2",fillOpacity:.9,bubblingMouseEvents:false
   });
   marker.bindTooltip([s.name,s.city,s.country].filter(Boolean).map(html).join(" · "));
   marker.on("click",()=>opts.onSelect?.(Number(s.id)));marker.addTo(dots);
   if(visited.has(Number(s.id))&&Number(s.id)!==Number(opts.selected?.id)){
    const flag=L.marker([lat,lng],{
     icon:L.divIcon({className:"stadium-leaflet-flag",html:"🚩",iconSize:[25,27],iconAnchor:[12,27]})
    });
    flag.on("click",()=>opts.onSelect?.(Number(s.id)));flag.addTo(flags);
   }
  }
  drawSelected();
  opts.onMarkersRendered?.(visited.size);
 }
 function drawSelected(){
  if(selectedMarker){selectedMarker.remove();selectedMarker=null}
  const s=opts.selected;
  if(!map||!window.L||!s||typeof opts.selectedPinHtml!=="function")return;
  const lat=Number(s.latitude),lng=Number(s.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180)return;
  selectedMarker=L.marker([lat,lng],{
   icon:L.divIcon({className:"stadium-leaflet-selection",html:opts.selectedPinHtml(s),iconSize:[220,150],iconAnchor:[110,150]}),
   zIndexOffset:1200
  }).addTo(map);
  selectedMarker.on("click",()=>opts.onSelect?.(Number(s.id)));
 }
 async function show(next){
  opts={...opts,...next};
  const seq=++version,holder=opts.container;
  if(!holder)return false;
  try{
   await load();
   if(seq!==version)return false;
   if(!map){
    holder.replaceChildren();holder.classList.remove("maplibregl-map");
    map=L.map(holder,{preferCanvas:true,worldCopyJump:true});
    map.on("click",event=>{if(opts.isPicking?.())opts.onPick?.(event.latlng.lat,event.latlng.lng)});
   }
   map.invalidateSize();
   map.setView(center(),zoomLevel(Number(opts.zoom||2)));
   tiles();draw();
   requestAnimationFrame(()=>map?.invalidateSize());
   return true;
  }catch(error){
   console.warn("BetInsight 2D fallback failed:",error);
   if(seq===version&&holder){
    holder.textContent=languages[opts.lang]||languages.en;
    holder.style.color="#e6f7fb";holder.style.padding="130px 22px 22px";
   }
   return false;
  }
 }
 function update(next){
  opts={...opts,...next};if(map)draw();
 }
 function focus(stadium){
  if(!map||!stadium)return;
  const lat=Number(stadium.latitude),lng=Number(stadium.longitude);
  if(Number.isFinite(lat)&&Number.isFinite(lng)){
   opts.selected=stadium;draw();map.flyTo([lat,lng],opts.mode==="satellite"?12:14);
  }
 }
 function zoom(delta){if(map)map.setZoom(Math.max(1,Math.min(opts.mode==="satellite"?13:20,map.getZoom()+delta)))}
 function reset(){if(map)map.setView([21,9],2)}
 function getCenter(){return map?.getCenter()||null}
 window.BetInsightLeaflet2D={show,update,focus,zoom,reset,getCenter,active:()=>!!map};
})();