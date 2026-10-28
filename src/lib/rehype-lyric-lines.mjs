/**
 * Preserve musical lines for chords and optional line-start timestamps.
 * Runs after rehypeChords. Timed lines receive data-start-ms; the timestamp
 * is stripped from rendered lyric text in both reader modes.
 */
import { parseTimePrefix } from './song-timing.mjs';

const skipTags = new Set(['a','code','pre','script','style','kbd','svg','math']);

function isChord(node) {
  return node?.type === 'element' && (node.properties?.className || []).includes('chord-anchor');
}
function containsChord(node) {
  return isChord(node) || (Array.isArray(node?.children) && node.children.some(containsChord));
}
function splitChildren(children) {
  const lines = [[]];
  for (const node of children) {
    const parts = splitNode(node);
    lines[lines.length-1].push(...parts[0]);
    for (let i=1;i<parts.length;i++) lines.push([...parts[i]]);
  }
  return lines;
}
function splitNode(node) {
  if (node.type === 'text') return node.value.split(/\r?\n/).map(text => text ? [{...node,value:text}] : []);
  if (node.type !== 'element') return [[node]];
  if (node.tagName === 'br') return [[],[]];
  if (skipTags.has(node.tagName) || isChord(node) || !Array.isArray(node.children)) return [[node]];
  return splitChildren(node.children).map(children => children.length ? [{...node,children}] : []);
}
function extractTimestamp(children) {
  if (!children.length || children[0]?.type !== 'text') return null;
  const parsed=parseTimePrefix(children[0].value);
  if (!parsed) return null;
  const remaining=children[0].value.slice(parsed.length);
  if (remaining) children[0]={...children[0],value:remaining};
  else children.shift();
  return parsed.milliseconds;
}
export default function rehypeLyricLines() {
  return root => {
    function visit(node) {
      if (!Array.isArray(node.children) || skipTags.has(node.tagName)) return;
      if (node.tagName === 'p') {
        const parts=splitChildren(node.children);
        const times=parts.map(line=>extractTimestamp(line));
        if (times.some(time=>time!==null) || containsChord(node)) {
          node.children=parts.map((children,i)=>({
            type:'element',tagName:'span',
            properties:{
              className:['lyric-line',...(children.some(containsChord)?['has-chord']:[])],
              ...(times[i]!==null?{'data-start-ms':String(times[i])}:{})
            },
            children:children.length?children:[{type:'text',value:'\u00a0'}]
          }));
          return;
        }
      }
      for(const child of node.children) visit(child);
    }
    visit(root);
  };
}
