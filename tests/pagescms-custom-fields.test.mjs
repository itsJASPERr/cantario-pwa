import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTime,formatTime,editableRows,setLineTime,inspectTimeRows}
  from '../pagescms-custom-fields/lyrics-core.mjs';
import {normalizeBpm,pushBpmTap}
  from '../pagescms-custom-fields/bpm-core.mjs';

test('lossless lyric timestamp editing preserves chords, CRLF and blank lines',()=>{
 const input='[Am]Una canción,\r\nla [G]tierra respira.\r\n\r\n[C]Volvemos.\r\n';
 const timed=setLineTime(input,0,'00:12.50');
 assert.ok(timed.startsWith('[00:12.50][Am]Una canción,\r\n'));
 assert.ok(timed.includes('\r\n\r\n[C]Volvemos.'));
 assert.equal(setLineTime(timed,0,''),input);
});
test('editing timestamp replaces only its prefix and retains original lyric text',()=>{
 const source='  [00:02.00]la [G]tierra\n[01:20]sí\n';
 const result=setLineTime(source,0,'00:11.5');
 assert.equal(result,'  [00:11.50]la [G]tierra\n[01:20]sí\n');
 assert.equal(setLineTime(result,1,''),'  [00:11.50]la [G]tierra\nsí\n');
});
test('timestamp helper validates ranges, centiseconds and strict ordering',()=>{
 assert.equal(parseTime('01:20.5'),80500);
 assert.equal(formatTime(80500),'01:20.50');
 for(const bad of ['00:60','90:00','bad','01:3','-01:30']){
  assert.equal(parseTime(bad),null);
 }
 assert.equal(inspectTimeRows('[00:02]a\n[00:05]b').valid,true);
 assert.equal(inspectTimeRows('[00:05]a\n[00:02]b').valid,false);
 assert.equal(inspectTimeRows('[00:02]a\n[00:02]b').valid,false);
 assert.equal(inspectTimeRows('[00:99]a\nb').valid,false);
 assert.equal(inspectTimeRows('a\nb').valid,true); // partial work is allowed
});
test('source line mapping ignores headings, stanza gaps and code fences',()=>{
 const source='# Título\n\n[00:03]Línea 1\n\n'+'~~~\n[00:04]code\n~~~\nLínea 2';
 const rows=editableRows(source);
 assert.deepEqual(rows.map(x=>x.lineIndex),[2,7]);
});
test('tap BPM estimate requires four regular beats, resets on long gaps',()=>{
 let result={taps:[],bpm:null};
 for(const t of [0,750,1500,2250])result=pushBpmTap(result.taps,t);
 assert.equal(result.bpm,80);
 assert.equal(pushBpmTap(result.taps,6000).bpm,null);
 assert.equal(normalizeBpm(80),80);
 assert.equal(normalizeBpm(400),null);
 assert.equal(normalizeBpm(''),null);
});
