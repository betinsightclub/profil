/* BetInsight TIME CLASH · England champions 1970/71–1974/75 · verified season-squad expansion · 2026-10-04
   Player identities and positions come from the cited season squad/statistics sources.
   No historical starting XI is invented. Where a player was missing from the existing TIME CLASH master,
   strength is assigned deterministically from the existing same-season positional median; this is a game-model
   value on the existing 1–25 scale, not a claim about an official historical rating. */
(function(){
 const sourceSquads={"Arsenal FC 1970/71":[["Bob Wilson","TW"],["Terry Unwin","TW"],["Geoff Barnett","TW"],["Pat Rice","ABW"],["Frank McLintock","ABW"],["Peter Simpson","ABW"],["Bob McNab","ABW"],["Sammy Nelson","ABW"],["John Roberts","ABW"],["George Armstrong","MIT"],["George Graham","MIT"],["Jon Sammels","MIT"],["Peter Storey","MIT"],["Eddie Kelly","MIT"],["Ray Kennedy","ST"],["John Radford","ST"],["Charlie George","ST"],["Peter Marinello","ST"]],"Derby County 1971/72":[["Colin Boulton","TW"],["Graham Moseley","TW"],["Ron Webster","ABW"],["Roy McFarland","ABW"],["Colin Todd","ABW"],["John Robson","ABW"],["Terry Hennessey","ABW"],["Jim Walker","ABW"],["Tony Bailey","ABW"],["Peter Daniel","ABW"],["Alan Lewis","ABW"],["Tony Parry","ABW"],["John McGovern","MIT"],["Alan Durban","MIT"],["Archie Gemmill","MIT"],["Alan Hinton","MIT"],["Steve Powell","MIT"],["Kevin Hector","ST"],["John O'Hare","ST"],["Frank Wignall","ST"],["Jeff Bourne","ST"],["Barry Butlin","ST"],["Roger Davies","ST"]],"Liverpool FC 1972/73":[["Ray Clemence","TW"],["Frankie Lane","TW"],["Grahame Lloyd","TW"],["Steve Arnold","ABW"],["Roy Evans","ABW"],["Chris Lawler","ABW"],["Alec Lindsay","ABW"],["Larry Lloyd","ABW"],["John McLaughlin","ABW"],["Ian Ross","ABW"],["Tommy Smith","ABW"],["Trevor Storton","ABW"],["John Webb","ABW"],["Ian Callaghan","MIT"],["Peter Cormack","MIT"],["Brian Hall","MIT"],["Steve Heighway","MIT"],["Emlyn Hughes","MIT"],["Hughie McAuley","MIT"],["Phil Thompson","MIT"],["Peter Thompson","MIT"],["Phil Boersma","ST"],["Derek Brownbill","ST"],["Kevin Keegan","ST"],["Kevin Kewley","ST"],["John Toshack","ST"],["Jack Whitham","ST"]],"Leeds United 1973/74":[["David Harvey","TW"],["David Stewart","TW"],["John Shaw","TW"],["Gary Sprake","TW"],["Trevor Cherry","ABW"],["Norman Hunter","ABW"],["Paul Madeley","ABW"],["Paul Reaney","ABW"],["Gordon McQueen","ABW"],["Roy Ellam","ABW"],["Frank Gray","ABW"],["Peter Hampton","ABW"],["Terry Cooper","ABW"],["Billy Bremner","MIT"],["Peter Lorimer","MIT"],["Terry Yorath","MIT"],["Johnny Giles","MIT"],["Mick Bates","MIT"],["Eddie Gray","MIT"],["Allan Clarke","ST"],["Mick Jones","ST"],["Joe Jordan","ST"],["Gary Liddell","ST"],["Jimmy Mann","ST"]],"Derby County 1974/75":[["Colin Boulton","TW"],["Graham Moseley","TW"],["Peter Daniel","ABW"],["Roy McFarland","ABW"],["David Nish","ABW"],["Rod Thomas","ABW"],["Colin Todd","ABW"],["Ron Webster","ABW"],["Archie Gemmill","MIT"],["Alan Hinton","MIT"],["Jeff King","MIT"],["Henry Newton","MIT"],["Steve Powell","MIT"],["Bruce Rioch","MIT"],["Jeff Bourne","ST"],["Eric Carruthers","ST"],["Roger Davies","ST"],["Chris Egan","ST"],["Kevin Hector","ST"],["Francis Lee","ST"],["John Sims","ST"]]};
 const coaches={"Arsenal FC 1970/71":"Bertie Mee","Derby County 1971/72":"Brian Clough","Liverpool FC 1972/73":"Bill Shankly","Leeds United 1973/74":"Don Revie","Derby County 1974/75":"Dave Mackay"};
 const sources={"Arsenal FC 1970/71":"https://en.wikipedia.org/wiki/1970%E2%80%9371_Arsenal_F.C._season","Derby County 1971/72":"https://www.11v11.com/teams/derby-county/tab/players/season/1972/","Liverpool FC 1972/73":"https://en.wikipedia.org/wiki/1972%E2%80%9373_Liverpool_F.C._season","Leeds United 1973/74":"https://lufchistory.com/seasons/1973-1974/","Derby County 1974/75":"https://en.wikipedia.org/wiki/1974%E2%80%9375_Derby_County_F.C._season"};
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
   if(!cdb[team])cdb[team]=coaches[team];
   sdb[team]={source:sources[team],verifiedSeasonSquad:true,referenceXI:false};
 }
 window.TC_CLUB_EXPANSION_ENGLAND_1970_1975_VERSION="2026-10-04-v1";
})();
