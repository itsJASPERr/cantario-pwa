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
