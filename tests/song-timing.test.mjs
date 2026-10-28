import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimePrefix,inspectSongTiming} from '../src/lib/song-timing.mjs';
import rehypeChords from '../src/lib/rehype-chords.mjs';
import rehypeLyricLines from '../src/lib/rehype-lyric-lines.mjs';

test('timestamp precision and line-start matching',()=>{
 assert.deepEqual(parseTimePrefix('[00:18.50][Am]Hola'),{milliseconds:18500,length:10});
 assert.deepEqual(parseTimePrefix('[01:02.5]Hey'),{milliseconds:62500,length:9});
 assert.equal(parseTimePrefix('middle [00:18.00] of phrase'),null);
 assert.equal(parseTimePrefix('[01:99]wrong'),null);
});
test('inspects monotonically increasing song timing and duration',()=>{
 const song='[00:12.00][Am]Inicio\n[00:25.00]Siguiente';
 assert.equal(inspectSongTiming(song,145).valid,true);
 assert.equal(inspectSongTiming(song,undefined).valid,false);
 assert.equal(inspectSongTiming(song,10).valid,false);
 assert.equal(inspectSongTiming('[00:25]A\n[00:12]B',145).valid,false);
 assert.equal(inspectSongTiming('[00:12]A\n[00:12]B',145).valid,false);
 assert.equal(inspectSongTiming('[00:12]A\n[00:99]B',145).valid,false);
});
test('rehype removes timing tokens from lyric text and preserves chords, line breaks, and plain lines',()=>{
 const tree={type:'root',children:[{type:'element',tagName:'p',properties:{},children:[
  {type:'text',value:'[00:12.00][Am]Primera\n[00:19.50]segunda\ntercera'}
 ]}]};
 rehypeChords()(tree);rehypeLyricLines()(tree);
 const rows=tree.children[0].children;
 assert.equal(rows.length,3);
 assert.equal(rows[0].properties['data-start-ms'],'12000');
 assert.equal(rows[1].properties['data-start-ms'],'19500');
 assert.equal(rows[2].properties['data-start-ms'],undefined);
 assert.equal(rows[0].properties.className.includes('has-chord'),true);
 assert.equal(rows[0].children[0].tagName,'span'); // chord anchor
 assert.equal(rows[0].children[1].value,'Primera');
 assert.equal(rows[1].children[0].value,'segunda');
});
test('timestamped lyrics without any chords still produce addressable lines',()=>{
 const tree={type:'root',children:[{type:'element',tagName:'p',properties:{},children:[
  {type:'text',value:'[00:01]A\n[00:03]B'}
 ]}]};
 rehypeLyricLines()(tree);
 assert.deepEqual(tree.children[0].children.map(c=>c.properties['data-start-ms']),['1000','3000']);
});
