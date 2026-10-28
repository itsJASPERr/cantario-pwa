/**
 * Optional LRC-like line timing for Cantario. Timing is a rehearsal reference,
 * never a substitute for the musician's live tempo.
 *
 * [mm:ss], [mm:ss.d] or [mm:ss.dd] must appear at the BEGINNING of each
 * timed Markdown lyric line, before [Am] chord labels. No HTML involved.
 */
const PREFIX = /^\s*\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/;
const TIME_LIKE = /^\s*\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/;

export function parseTimePrefix(line) {
  if (typeof line !== 'string') return null;
  const match = line.match(PREFIX);
  if (!match) return null;
  const min = Number(match[1]);
  const sec = Number(match[2]);
  const centis = match[3] === undefined ? 0 : Number(match[3].padEnd(2,'0'));
  if (sec > 59 || min > 59) return null;
  return {milliseconds: (min*60 + sec)*1000 + centis*10, length: match[0].length};
}

/**
 * Duration is authored in Pages CMS as mm:ss, e.g. "04:52".
 * Numeric seconds are accepted only for previously stored song metadata.
 * Reject malformed text instead of silently treating it as 0 seconds.
 */
export function parseSongDuration(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 && value <= 3600 ? value : null;
  }
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const total = minutes * 60 + seconds;
  if (seconds > 59 || total <= 0 || total > 3600) return null;
  return total;
}

export function inspectSongTiming(markdown, durationInput) {
  const duration = parseSongDuration(durationInput);
  const markers = [];
  let invalid = false;
  for (const [index,line] of String(markdown || '').split(/\r?\n/).entries()) {
    const parsed = parseTimePrefix(line);
    if (parsed) markers.push({line:index+1, milliseconds:parsed.milliseconds});
    else if (TIME_LIKE.test(line) || /^\s*\[\d{1,2}:\d{2}/.test(line)) invalid = true;
  }
  const validDuration = duration !== null;
  let previous = -1;
  for (const marker of markers) {
    if (marker.milliseconds <= previous || (validDuration && marker.milliseconds >= duration*1000)) invalid = true;
    previous = marker.milliseconds;
  }
  const valid = validDuration && markers.length >= 2 && !invalid;
  const reason = !validDuration ? 'Falta duración válida'
    : markers.length < 2 ? 'Se necesitan al menos dos líneas con tiempo'
    : invalid ? 'Timestamps fuera de orden, duplicados o fuera de duración'
    : null;
  return {valid, reason, count:markers.length, durationSeconds:validDuration?duration:null, markers};
}


// Used by the library search index. Actual lyrics remain unchanged.
export function stripSongTimeTokens(markdown) {
  return String(markdown || '').replace(/(^|\r?\n)[ \t]*\[\d{1,2}:\d{2}(?:\.\d{1,2})?\]/g, '$1');
}
