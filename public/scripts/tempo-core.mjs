/**
 * Cantario tempo guidance: no audio processing, microphone or backend.
 * A BPM value is reference metadata, not proof of live beat alignment.
 */
export const MIN_BPM = 40;
export const MAX_BPM = 240;
export const BPM_STEP = 2;
export const DEFAULT_GUIDE_BPM = 80;
export function normalizeBpm(value) {
  const n=Number(value);
  return Number.isInteger(n)&&n>=MIN_BPM&&n<=MAX_BPM ? n : null;
}
export function changeBpm(current, delta, reference = DEFAULT_GUIDE_BPM) {
  const baseline=normalizeBpm(reference)||DEFAULT_GUIDE_BPM;
  const lo=Math.max(MIN_BPM,Math.ceil(baseline * 0.5));
  const hi=Math.min(MAX_BPM,Math.floor(baseline * 2.5));
  const start=normalizeBpm(current)||baseline;
  return Math.min(hi,Math.max(lo,start+Number(delta||0)));
}
export function tempoMultiplier(selected, reference) {
  const base=normalizeBpm(reference)||DEFAULT_GUIDE_BPM;
  const current=normalizeBpm(selected)||base;
  return Math.max(0.5,Math.min(2.5,current/base));
}
export function addTempoTap(history, timestampMs) {
  const previous=Array.isArray(history)?history.filter(Number.isFinite):[];
  const at=Number(timestampMs);
  if(!Number.isFinite(at)) return {taps:[],bpm:null};
  const last=previous.at(-1);
  const taps=last===undefined || at<=last || at-last>2500 || at-last<180
    ? [at] : [...previous,at].slice(-8);
  if(taps.length<4) return {taps,bpm:null};
  const gaps=taps.slice(1).map((time,i)=>time-taps[i]).sort((a,b)=>a-b);
  const median=gaps[Math.floor(gaps.length/2)];
  const regular=gaps.filter(gap=>Math.abs(gap-median)<=median*0.22);
  if(regular.length<3) return {taps,bpm:null};
  const mean=regular.reduce((a,b)=>a+b,0)/regular.length;
  const bpm=normalizeBpm(Math.round(60000/mean));
  return {taps,bpm};
}
export function visualBeat(clockSeconds, bpm, beatAnchorSeconds=0) {
  const selected=normalizeBpm(bpm);
  if(selected===null||!Number.isFinite(clockSeconds)) return null;
  const beats=Math.max(0,(clockSeconds-beatAnchorSeconds)*selected/60);
  return {beat:Math.floor(beats)%4+1,phase:beats%1};
}


/**
 * Pure beat display state. Ready/finished and a generic 3-second countdown
 * intentionally do not show a false musical beat.
 */
export function beatViewState({
  state='ready',clock=0,bpm=null,beatAnchor=0,beatCountIn=false,countInBeat=1
}={}) {
  if(state === 'countdown' && beatCountIn) {
    return {beat:Math.max(1,Math.min(4,Math.floor(Number(countInBeat)||1))),
      running:true,paused:false,counting:true};
  }
  if(state !== 'playing' && state !== 'paused') {
    return {beat:null,running:false,paused:false,counting:false};
  }
  const pulse=visualBeat(clock,bpm,beatAnchor);
  if(!pulse) return {beat:null,running:false,paused:false,counting:false};
  return {beat:pulse.beat,running:state === 'playing',
    paused:state === 'paused',counting:false};
}
