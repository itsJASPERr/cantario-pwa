/**
 * Render ChordPro-style inline tokens in song Markdown.
 *
 * [Am], [F#m7], [C/G] attach to the following character (even a space).
 * [*Palmas] is a free-text performance cue.
 * Text, Markdown formatting, and newlines remain intact.
 * Bracketed prose that doesn't resemble a chord is left untouched.
 */
const TOKEN = /\[([^\]\r\n]{1,48})\]/g;
const CHORD = /^[A-G](?:#|b|♯|♭)?[a-zA-Z0-9#b♯♭+°øΔ()/−-]{0,24}$/;
const SKIP = new Set(['a', 'code', 'pre', 'script', 'style', 'kbd', 'svg', 'math']);

function marker(raw) {
  if (raw.startsWith('*') && raw.length > 1 && raw.slice(1).trim()) {
    return {kind: 'cue', label: raw.slice(1).trim()};
  }
  if (CHORD.test(raw)) return {kind: 'chord', label: raw};
  return null;
}

export function tokenizeChordText(value) {
  const result = [];
  let index = 0;
  for (const match of value.matchAll(TOKEN)) {
    const annotated = marker(match[1]);
    if (!annotated) continue;
    if (match.index > index) result.push({type: 'text', value: value.slice(index, match.index)});
    result.push({type: 'marker', ...annotated});
    index = match.index + match[0].length;
  }
  if (index < value.length) result.push({type: 'text', value: value.slice(index)});
  if (!result.length) result.push({type: 'text', value});
  return result;
}

export function stripChordTokens(value) {
  return tokenizeChordText(value).map(part => part.type === 'text' ? part.value : '').join('');
}

export function hasChordTokens(value) {
  return tokenizeChordText(value).some(part => part.type === 'marker');
}

function makeAnchor(part) {
  return {
    type: 'element',
    tagName: 'span',
    properties: {className: ['chord-anchor'], 'data-kind': part.kind},
    children: [{
      type: 'element',
      tagName: 'span',
      properties: {className: ['chord-chip']},
      children: [{type: 'text', value: part.label}]
    }]
  };
}

export default function rehypeChords() {
  return tree => {
    function visit(parent) {
      if (!Array.isArray(parent.children) || SKIP.has(parent.tagName)) return;
      const output = [];
      for (const child of parent.children) {
        if (child.type === 'text' && typeof child.value === 'string') {
          const parts = tokenizeChordText(child.value);
          if (parts.some(part => part.type === 'marker')) {
            for (const part of parts) {
              output.push(part.type === 'marker'
                ? makeAnchor(part)
                : {type: 'text', value: part.value});
            }
            continue;
          }
        } else if (child.type === 'element') visit(child);
        output.push(child);
      }
      parent.children = output;
    }
    visit(tree);
  };
}
