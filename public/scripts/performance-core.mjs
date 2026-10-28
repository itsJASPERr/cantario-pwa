// Shared, deterministic math for Cantario's offline performance reader.
export const MIN_DURATION_SECONDS = 60;
export const MAX_DURATION_SECONDS = 1800;
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.5;
export const SPEED_STEP = 0.25;
export function clamp(value, minimum, maximum) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(maximum, Math.max(minimum, n)) : minimum;
}
export function normalizeDuration(value) {
  return Math.round(clamp(value, MIN_DURATION_SECONDS, MAX_DURATION_SECONDS));
}
export function normalizeSpeed(value) {
  return Math.round(clamp(value, MIN_SPEED, MAX_SPEED) / SPEED_STEP) * SPEED_STEP;
}
export function maxScrollDistance(scrollHeight, viewportHeight) {
  return Math.max(0, scrollHeight - viewportHeight);
}
export function scrollRate(distance, durationSeconds, speedMultiplier = 1) {
  const d = Math.max(0, Number(distance) || 0);
  return d / normalizeDuration(durationSeconds) * normalizeSpeed(speedMultiplier);
}
export function advanceScroll(position, distance, elapsedSeconds, rate) {
  return Math.min(Math.max(0, distance), Math.max(0, position) + Math.max(0, elapsedSeconds) * Math.max(0, rate));
}
export function progressPercent(position, distance) {
  if (distance <= 0) return 100;
  return Math.round(clamp(position / distance, 0, 1) * 100);
}


/**
 * Offline timeline mathematics. Each authored cue is {time:seconds, y:pixels}.
 * The song clock is independent of CSS pixels or a source audio recording.
 */
export function makeTimedTrack(cues, durationSeconds, distance, leadSeconds = 2) {
  const length = Number(durationSeconds);
  if (!Array.isArray(cues) || cues.length < 2 || !Number.isFinite(length) || length <= 0 ||
      !Number.isFinite(distance) || distance <= 0) return null;
  let prevT = -1, prevY = 0;
  const points = [{time:0,y:0}];
  for (const cue of cues) {
    const time = Number(cue.time);
    const y = Number(cue.y);
    if (!Number.isFinite(time) || !Number.isFinite(y) || time <= prevT || time < 0 || time >= length) return null;
    prevT = time;
    // Never scroll upward when authored markers move backward in layout.
    const targetY = clamp(y, prevY, distance);
    prevY = targetY;
    const cueTime = Math.max(0, time - Math.max(0, Number(leadSeconds) || 0));
    if (cueTime > points[points.length-1].time) points.push({time:cueTime,y:targetY});
    else points[points.length-1].y = targetY;
  }
  if (length > points[points.length-1].time) {
    points.push({time:length,y:distance});
  }
  return {duration:length, distance, points};
}
export function timedPositionAt(track, timeSeconds) {
  if (!track) return 0;
  const t=clamp(timeSeconds,0,track.duration);
  const p=track.points;
  if (t <= p[0].time) return p[0].y;
  for(let i=1;i<p.length;i++){
    const a=p[i-1], b=p[i];
    if(t<=b.time) return a.y+(b.y-a.y)*(t-a.time)/(b.time-a.time);
  }
  return track.distance;
}
export function timedClockAtPosition(track, scrollPosition) {
  if (!track) return 0;
  const y=clamp(scrollPosition,0,track.distance);
  const p=track.points;
  if(y<=p[0].y) return p[0].time;
  for(let i=1;i<p.length;i++){
    const a=p[i-1],b=p[i];
    if(y<=b.y) {
      if(b.y === a.y) return a.time;
      return a.time+(b.time-a.time)*(y-a.y)/(b.y-a.y);
    }
  }
  return track.duration;
}


/**
 * Visual live start cues. Timings are authored lyric onsets, not detected
 * beats or instrumental passages. A large gap is only a likely interlude.
 * Pure state machine: pausing freezes the cue because the song clock freezes.
 */
export const INTERLUDE_MIN_GAP_SECONDS = 20;
export const INTERLUDE_GRACE_SECONDS = 7;
export const CUE_PREPARE_SECONDS = 3;
export const CUE_NOW_SECONDS = 1.35;

function cueTime(seconds) {
  const n=Math.max(0,Math.ceil(seconds - 0.00001));
  return String(Math.floor(n/60)).padStart(2,'0') + ':' +
    String(n%60).padStart(2,'0');
}
function prepareCue(remaining,first) {
  return {
    kind:'prepare', label:'PREPARATE PARA CANTAR',
    value:String(Math.max(1,Math.ceil(remaining-0.00001))),
    detail:first?'Primera frase':'Próxima frase'
  };
}
function arrivalCue() {
  return {kind:'now',label:'¡AHORA!',value:'',detail:'Comenzá la frase'};
}

/**
 * @param {number[]|undefined} timestamps - Monotonic sung-line starts (seconds)
 * @param {number} clock - Current song time in seconds
 * @param {{state?:string,countdownRemaining?:number,timed?:boolean,interludeStarts?:number[]}} options
 * @returns {{kind:string,label:string,value:string,detail:string}|null}
 */
export function liveCueAt(timestamps, clock, options = {}) {
  const state=options.state || 'playing';
  if (state === 'countdown') {
    const n=Math.max(1,Math.min(3,Math.ceil(Number(options.countdownRemaining)||1)));
    return {kind:'countdown',label:'LA CANCIÓN COMIENZA EN',value:String(n),
      detail:'Cuenta previa al inicio'};
  }
  if (!options.timed || state === 'finished') return null;
  if (!Array.isArray(timestamps) || timestamps.length < 2 ||
      !Number.isFinite(Number(clock))) return null;
  const times=timestamps.map(item=>Number(item));
  if (times.some((time,i)=>!Number.isFinite(time)||time<0||(i>0&&time<=times[i-1]))) return null;

  const now=Math.max(0,Number(clock));
  const first=times[0];

  if (now < first) {
    const remaining=first-now;
    if (remaining<=CUE_PREPARE_SECONDS) return prepareCue(remaining,true);
    return {kind:'intro',label:'INTRO',value:cueTime(remaining),
      detail:'Hasta la primera frase'};
  }
  if (now < first+CUE_NOW_SECONDS && state === 'playing') return arrivalCue();

  for(let i=1;i<times.length;i++){
    const previous=times[i-1];
    const next=times[i];
    // At runtime, only infer interludes when the upcoming line begins a new
    // stanza. A long gap within a stanza may contain untimed sung lines.
    const gapIsInterlude = next-previous >= INTERLUDE_MIN_GAP_SECONDS &&
      (!Array.isArray(options.interludeStarts) || options.interludeStarts.includes(next));
    if(now >= next && now < next+CUE_NOW_SECONDS && state === 'playing' &&
       gapIsInterlude) return arrivalCue();
    if(now>=next) continue;
    // A long break might be a sustained vocal or free-form instrumental.
    // Wait several seconds after the previous line before announcing a gap.
    if(!gapIsInterlude || now < previous+INTERLUDE_GRACE_SECONDS) return null;
    const remaining=next-now;
    if(remaining<=CUE_PREPARE_SECONDS) return prepareCue(remaining,false);
    return {kind:'interlude',label:'INTERLUDIO',value:cueTime(remaining),
      detail:'Hasta la próxima frase · tiempo orientativo'};
  }
  return null;
}
