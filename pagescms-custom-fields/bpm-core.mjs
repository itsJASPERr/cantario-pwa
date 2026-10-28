/** Optional BPM tap-estimation for the self-hosted Pages CMS custom field. */
export function normalizeBpm(value) {
  if(value===''||value===null||value===undefined) return null;
  const n=Number(value);
  return Number.isInteger(n)&&n>=40&&n<=240?n:null;
}
export function pushBpmTap(previous,timestamp) {
  const prior=Array.isArray(previous)?previous.filter(Number.isFinite):[];
  const t=Number(timestamp);
  if(!Number.isFinite(t)) return {taps:[],bpm:null};
  const last=prior.at(-1);
  const taps=last==null||t<=last||t-last>2200||t-last<190?[t]:[...prior,t].slice(-10);
  if(taps.length<4) return {taps,bpm:null};
  const intervals=taps.slice(1).map((v,i)=>v-taps[i]).sort((a,b)=>a-b);
  const median=intervals[Math.floor(intervals.length/2)];
  const consistent=intervals.filter(i=>Math.abs(i-median)<=median*.2);
  if(consistent.length<3) return {taps,bpm:null};
  const average=consistent.reduce((a,b)=>a+b,0)/consistent.length;
  return {taps,bpm:normalizeBpm(Math.round(60000/average))};
}
