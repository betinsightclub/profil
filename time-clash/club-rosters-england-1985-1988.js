/* BetInsight TIME CLASH · England champions 1985/86 & 1987/88 · verified season-squad expansion · 2026-10-04
   Player identities and broad positions follow the cited LFChistory season-squad pages.
   No historical starting XI is invented. New game-strength values are derived from the existing same-season
   positional median on TIME CLASH's established 1–25 model and are not official historical ratings. */
(function(){
 const sourceSquads={"Liverpool FC 1985/86":[["Bob Bolder","TW"],["Bruce Grobbelaar","TW"],["Gary Ablett","ABW"],["Jim Beglin","ABW"],["Gary Gillespie","ABW"],["Alan Hansen","ABW"],["Alan Kennedy","ABW"],["Mark Lawrenson","ABW"],["John McGregor","ABW"],["Phil Neal","ABW"],["Steve Nicol","ABW"],["Kenny Dalglish","MIT"],["Craig Johnston","MIT"],["Sammy Lee","MIT"],["Kevin MacDonald","MIT"],["Steve McMahon","MIT"],["Jan Mølby","MIT"],["Mark Seagraves","MIT"],["John Wark","MIT"],["Ronnie Whelan","MIT"],["Ian Rush","ST"],["Paul Walsh","ST"]],"Liverpool FC 1987/88":[["Bruce Grobbelaar","TW"],["Mike Hooper","TW"],["Gary Ablett","ABW"],["Gary Gillespie","ABW"],["Alan Hansen","ABW"],["Mark Lawrenson","ABW"],["Steve Nicol","ABW"],["Steve Staunton","ABW"],["Barry Venison","ABW"],["Alex Watson","ABW"],["John Barnes","MIT"],["Kenny Dalglish","MIT"],["Ray Houghton","MIT"],["Craig Johnston","MIT"],["Kevin MacDonald","MIT"],["Mike Marsh","MIT"],["Steve McMahon","MIT"],["Jan Mølby","MIT"],["Mark Seagraves","MIT"],["Nigel Spackman","MIT"],["John Wark","MIT"],["Ronnie Whelan","MIT"],["John Aldridge","ST"],["Peter Beardsley","ST"],["John Durnin","ST"],["Paul Walsh","ST"]]};
 const coaches={"Liverpool FC 1985/86":"Kenny Dalglish","Liverpool FC 1987/88":"Kenny Dalglish"};
 const sources={"Liverpool FC 1985/86":"https://www.lfchistory.net/season-archive/squad/27","Liverpool FC 1987/88":"https://www.lfchistory.net/season-archive/squad/29"};
 const db=window.TC_ROSTER_DB=window.TC_ROSTER_DB||{};
 const cdb=window.TC_COACH_DB=window.TC_COACH_DB||{};
 const sdb=window.TC_TEAM_SOURCE=window.TC_TEAM_SOURCE||{};
 const roleName={TW:"Torwart",ABW:"Abwehr",MIT:"Mittelfeld",ST:"Sturm"};
 const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 const median=a=>{a=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
 for(const [team,rows] of Object.entries(sourceSquads)){
   const old=Array.isArray(db[team])?db[team]:[];
   const oldByName=new Map(old.map(p=>[norm(p.name),p]));
   const teamMedian=median(old.map(p=>Number(p.strength)))||18;
   const roleMedian={};
   for(const pos of ["TW","ABW","MIT","ST"]) roleMedian[pos]=median(old.filter(p=>String(p.pos||"")===pos).map(p=>Number(p.strength)))||teamMedian;
   const players=rows.map(([name,pos],i)=>{
     const prev=oldByName.get(norm(name))||{};
     const strength=Number.isFinite(Number(prev.strength))?Number(prev.strength):Math.round(roleMedian[pos]*2)/2;
     return {...prev,id:prev.id||norm(name),name,pos,prole:roleName[pos],strength,impact:Number(prev.impact)||Math.max(2,Math.min(5,Math.round(strength/4.5))),starter:false,squadIndex:i};
   });
   if(!Array.isArray(db[team])||players.length>db[team].length) db[team]=players;
   if(!cdb[team]) cdb[team]=coaches[team];
   sdb[team]={source:sources[team],verifiedSeasonSquad:true,referenceXI:false,noInventedPlayers:true};
 }
 window.TC_CLUB_EXPANSION_ENGLAND_1985_1988_VERSION="2026-10-04-v1";
})();
