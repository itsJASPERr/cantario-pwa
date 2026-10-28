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
