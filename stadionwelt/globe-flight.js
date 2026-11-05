/* BetInsight Stadium World — cinematic globe journey.
 * Four guarantees: zoom out, constant-rate great-circle travel, quick zoom in,
 * and no mutation of visit data. Passing zero milliseconds to pointOfView
 * avoids the eased/tweened single-stage motion that looked progressively faster.
 */
(function(){
 "use strict";
 let frame=null,generation=0,runningGlobe=null;
 const rad=Math.PI/180,deg=180/Math.PI;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const normLng=x=>((x+180)%360+360)%360-180;
 function ease(x){const t=clamp(x,0,1);return t*t*(3-2*t)}
 function toVec(lat,lng){
  const la=lat*rad,lo=lng*rad;
  return [Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)];
 }
 function slerp(a,b,t){
  const av=toVec(a.lat,a.lng),bv=toVec(b.lat,b.lng);
  const dot=clamp(av[0]*bv[0]+av[1]*bv[1]+av[2]*bv[2],-1,1);
  const angle=Math.acos(dot),sinAngle=Math.sin(angle);
  // Rare antipodal cases: interpolate longitude along shortest difference.
  if(Math.abs(sinAngle)<1e-6){
   return {lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+normLng(b.lng-a.lng)*t};
  }
  const u=Math.sin((1-t)*angle)/sinAngle,v=Math.sin(t*angle)/sinAngle;
  const x=av[0]*u+bv[0]*v,y=av[1]*u+bv[1]*v,z=av[2]*u+bv[2]*v;
  return {lat:Math.atan2(z,Math.hypot(x,y))*deg,lng:Math.atan2(y,x)*deg};
 }
 function cancel(){
  generation++;
  if(frame!==null){cancelAnimationFrame(frame);frame=null}
  runningGlobe=null;
 }
 function flyTo(globe,target,durationMs=8000){
  if(!globe||!target)return false;
  let from;
  try{from=globe.pointOfView()}catch{return false}
  if(!from||![from.lat,from.lng].every(Number.isFinite))return false;
  const to={lat:Number(target.lat),lng:Number(target.lng)};
  if(![to.lat,to.lng].every(Number.isFinite)||Math.abs(to.lat)>90)return false;
  const beginning={lat:Number(from.lat),lng:Number(from.lng)};
  const startAltitude=Number.isFinite(Number(from.altitude))?Number(from.altitude):1.65;
  const targetAltitude=Number.isFinite(Number(target.altitude))?Number(target.altitude):1.65;
  // The globe first pulls back far enough to make the continental movement legible.
  const highAltitude=Math.max(3.1,startAltitude,targetAltitude);
  const total=clamp(Number(durationMs)||8000,4000,30000);
  // Zoom phases remain quick at both 4 and 25-second travel settings.
  const zoomOutMs=Math.min(600,total*0.12);
  const zoomInMs=Math.min(650,total*0.13);
  const zoomOutPart=zoomOutMs/total,travelEnd=1-zoomInMs/total;
  cancel();
  const run=++generation;
  runningGlobe=globe;
  try{globe.controls().autoRotate=false}catch{}
  const started=performance.now();
  function draw(now){
   if(run!==generation||runningGlobe!==globe)return;
   const t=clamp((now-started)/total,0,1);
   let view;
   if(t<zoomOutPart){
    view={lat:beginning.lat,lng:beginning.lng,
     altitude:startAltitude+(highAltitude-startAltitude)*ease(t/zoomOutPart)};
   }else if(t<travelEnd){
    const travel=(t-zoomOutPart)/(travelEnd-zoomOutPart);
    const p=slerp(beginning,to,travel);
    view={lat:p.lat,lng:p.lng,altitude:highAltitude};
   }else{
    const z=ease((t-travelEnd)/(1-travelEnd));
    view={lat:to.lat,lng:to.lng,altitude:highAltitude+(targetAltitude-highAltitude)*z};
   }
   try{globe.pointOfView(view,0)}
   catch(error){console.warn("Stadionwelt: Kameraflug abgebrochen",error);cancel();return}
   if(t<1)frame=requestAnimationFrame(draw);
   else{frame=null;runningGlobe=null}
  }
  frame=requestAnimationFrame(draw);
  return true;
 }
 window.BetInsightStadiumFlight={flyTo,cancel,slerp,isFlying:()=>frame!==null};
})();
