// Development-only scheduling policy; no cron, RPC, database writes or settlement.
// Count only successful completed scans with no observed payment. RPC errors must be retried separately.
// Late incoming payments must go to manual review; a quote expiry is not a monitoring cutoff.
const MIN=60000,DAY=1440*MIN;
export const NETWORK_POLICY={
  "BSC": {
    "poll": 3,
    "expiry": 15
  },
  "ETHEREUM": {
    "poll": 3,
    "expiry": 20
  },
  "TRON": {
    "poll": 3,
    "expiry": 15
  },
  "POLYGON": {
    "poll": 3,
    "expiry": 15
  },
  "SOLANA": {
    "poll": 3,
    "expiry": 15
  },
  "BITCOIN": {
    "poll": 10,
    "expiry": 60
  },
  "LITECOIN": {
    "poll": 5,
    "expiry": 30
  },
  "DOGECOIN": {
    "poll": 3,
    "expiry": 30
  },
  "XRPL": {
    "poll": 3,
    "expiry": 15
  },
  "BITCOINCASH": {
    "poll": 20,
    "expiry": 60
  }
};
export function nextCheck({network,createdMs,lastCheckMs,emptyChecks=0,status="UNPAID"}){
 const p=NETWORK_POLICY[network];
 if(!p||!Number.isSafeInteger(createdMs)||createdMs<0||!Number.isSafeInteger(emptyChecks)||emptyChecks<0||!Number.isSafeInteger(lastCheckMs)||lastCheckMs<createdMs)throw Error("INVALID_SCHEDULE");
 if(["SETTLED","CANCELLED","MANUAL_REVIEW","STOPPED"].includes(status))return null;
 if(!["UNPAID","PAYMENT_SEEN"].includes(status))throw Error("INVALID_STATUS");
 // Recognized payment awaiting finality stays on its network-specific short cadence.
 if(status==="PAYMENT_SEEN")return lastCheckMs+p.poll*MIN;
 const deadline=createdMs+7*DAY, daily=createdMs+DAY;
 if(lastCheckMs>=deadline)return null;
 if(lastCheckMs>=daily)return Math.min(lastCheckMs+DAY,deadline);
 const interval=Math.min(1440,p.poll*2**Math.min(12,Math.max(0,emptyChecks-9)));
 return Math.min(lastCheckMs+interval*MIN,daily,deadline);
}
export function quoteExpires(network,createdMs){const p=NETWORK_POLICY[network];if(!p||!Number.isSafeInteger(createdMs)||createdMs<0)throw Error("INVALID_QUOTE_WINDOW");return createdMs+p.expiry*MIN}
export function testSchedule(){
 const cases=[];
 for(const [network,p] of Object.entries(NETWORK_POLICY)){
 let t=0;
 for(let n=0;n<10;n++){const next=nextCheck({network,createdMs:0,lastCheckMs:t,emptyChecks:n});cases.push([network+" check "+(n+1),next-t===p.poll*MIN]);t=next;}
 cases.push([network+" first backoff",nextCheck({network,createdMs:0,lastCheckMs:t,emptyChecks:10})-t===2*p.poll*MIN]);
 cases.push([network+" quote expiry",quoteExpires(network,0)===p.expiry*MIN]);
 }
 const b={network:"BITCOINCASH",createdMs:0,lastCheckMs:DAY,emptyChecks:15};
 cases.push(["daily",nextCheck(b)===2*DAY],["stop at seven days",nextCheck({...b,lastCheckMs:7*DAY})===null],["last check at seven days",nextCheck({...b,lastCheckMs:7*DAY-MIN})===7*DAY],["cap at day one",nextCheck({...b,lastCheckMs:DAY-MIN,emptyChecks:20})===DAY],["seen BCH short cadence",nextCheck({...b,status:"PAYMENT_SEEN"})===DAY+20*MIN],["seen BTC short cadence",nextCheck({...b,network:"BITCOIN",status:"PAYMENT_SEEN"})===DAY+10*MIN],["settled stops",nextCheck({...b,status:"SETTLED"})===null],["review stops",nextCheck({...b,status:"MANUAL_REVIEW"})===null]);
 return cases.map(([name,pass])=>({name,pass}));
}
