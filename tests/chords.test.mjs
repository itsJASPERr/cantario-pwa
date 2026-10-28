import test from 'node:test';
import assert from 'node:assert/strict';
import rehypeChords, {tokenizeChordText, stripChordTokens, hasChordTokens} from '../src/lib/rehype-chords.mjs';

test('chords attach to character boundaries, including before spaces', () => {
  const parts = tokenizeChordText('[Am]Ca[G]mino [F] sale');
  assert.deepEqual(parts.map(p => p.type === 'marker' ? [p.kind, p.label] : p.value),
    [['chord','Am'], 'Ca', ['chord','G'], 'mino ', ['chord','F'], ' sale']);
  assert.equal(stripChordTokens('[Am]Ca[G]mino [F] sale'), 'Camino  sale');
});
test('common chord shapes and free-text cues', () => {
  const parts=tokenizeChordText('[Cmaj7][F#m7][Bb/D][Dsus4][*Suave]');
  assert.deepEqual(parts.filter(p=>p.type==='marker').map(p=>p.label),
    ['Cmaj7','F#m7','Bb/D','Dsus4','Suave']);
});
test('bracketed prose is not mistaken for chords', () => {
  assert.equal(hasChordTokens('[Verso] Hola [Palmas]'), false);
  assert.equal(stripChordTokens('A [Verse 1] B'), 'A [Verse 1] B');
});
test('rehype transformation is safe, preserves literal lyrics and skips links and code', () => {
  const root={type:'root',children:[{
    type:'element',tagName:'p',properties:{},children:[
      {type:'text',value:'[Am]Ca[G]mino'},
      {type:'element',tagName:'a',properties:{href:'/x'},children:[{type:'text',value:'[Am]'}]},
      {type:'element',tagName:'code',properties:{},children:[{type:'text',value:'[G]'}]}
    ]
  }]};
  rehypeChords()(root);
  const children=root.children[0].children;
  assert.equal(children[0].properties['data-kind'],'chord');
  assert.equal(children[0].children[0].children[0].value,'Am');
  assert.equal(children[1].value,'Ca');
  assert.equal(children[2].children[0].children[0].value,'G');
  assert.equal(children[3].value,'mino');
  assert.equal(children[4].children[0].value,'[Am]');
  assert.equal(children[5].children[0].value,'[G]');
});
test('cue markup is rendered as an untrusted text node, never HTML', () => {
  const root={type:'root',children:[{type:'text',value:'[*<script>bad</script>] canto'}]};
  rehypeChords()(root);
  const annotation=root.children[0];
  assert.equal(annotation.tagName,'span');
  assert.equal(annotation.properties['data-kind'],'cue');
  assert.equal(annotation.children[0].children[0].value,'<script>bad</script>');
});
