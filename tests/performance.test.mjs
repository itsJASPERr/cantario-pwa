import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDuration, normalizeSpeed, scrollRate, advanceScroll,
  maxScrollDistance, progressPercent
} from '../public/scripts/performance-core.mjs';

test('duration and speed have predictable boundaries', () => {
  assert.equal(normalizeDuration(210),210);
  assert.equal(normalizeDuration(-4),60);
  assert.equal(normalizeDuration(99999),1800);
  assert.equal(normalizeDuration('invalid'),60);
  assert.equal(normalizeSpeed(1.15),1.25);
  assert.equal(normalizeSpeed(5),2.5);
  assert.equal(normalizeSpeed(0),0.5);
});
test('a complete 210 second song advances linearly', () => {
  const distance=630;
  const rate=scrollRate(distance,210,1);
  assert.equal(rate,3);
  assert.equal(advanceScroll(0,distance,30,rate),90);
  assert.equal(advanceScroll(90,distance,180,rate),630);
  assert.equal(progressPercent(315,distance),50);
});
test('faster and slower controls change speed without resetting scroll position', () => {
  const current=145;
  assert.equal(advanceScroll(current,630,10,scrollRate(630,210,0.5)),160);
  assert.equal(advanceScroll(current,630,10,scrollRate(630,210,2)),205);
});
test('short songs have no scroll distance and no invalid progress', () => {
  assert.equal(maxScrollDistance(300,500),0);
  assert.equal(scrollRate(0,210,1),0);
  assert.equal(progressPercent(0,0),100);
});
test('progress never overshoots end or goes below start', () => {
  assert.equal(advanceScroll(620,630,10,3),630);
  assert.equal(advanceScroll(-3,630,0,3),0);
  assert.equal(progressPercent(1000,630),100);
});


test('fractional movement accumulates even when scrollTop is rounded by a browser', () => {
  const distance = 450;
  const rate = scrollRate(distance, 210, 1);
  let virtualPosition = 0;
  let browserScrollTop = 0;
  for (let i = 0; i < 120; i++) {
    virtualPosition = advanceScroll(virtualPosition, distance, 1 / 60, rate);
    browserScrollTop = Math.round(virtualPosition);
  }
  assert.ok(virtualPosition > 4);
  assert.ok(browserScrollTop >= 4);
});


import {makeTimedTrack,timedPositionAt,timedClockAtPosition} from '../public/scripts/performance-core.mjs';
test('timeline interpolates based on authored line starts rather than total page height',()=>{
 const track=makeTimedTrack([{time:18,y:120},{time:28,y:240}],100,500,0);
 assert.ok(track);
 assert.equal(timedPositionAt(track,18),120);
 assert.equal(timedPositionAt(track,23),180);
 assert.equal(timedPositionAt(track,28),240);
 assert.equal(timedPositionAt(track,100),500);
});
test('invalid and duplicate timestamps disable timed scrolling safely',()=>{
 assert.equal(makeTimedTrack([],100,400),null);
 assert.equal(makeTimedTrack([{time:30,y:100},{time:20,y:200}],100,400),null);
 assert.equal(makeTimedTrack([{time:10,y:100},{time:100,y:300}],100,400),null);
 assert.equal(makeTimedTrack([{time:10,y:100},{time:20,y:200}],null,400),null);
});
test('reading lead advances upcoming text and renderer never scrolls backward',()=>{
 const track=makeTimedTrack([{time:10,y:100},{time:20,y:70},{time:35,y:300}],90,400,2);
 assert.equal(timedPositionAt(track,8),100);
 assert.ok(timedPositionAt(track,18)>=100);
 assert.equal(timedPositionAt(track,33),300);
});
test('manual scroll can approximate the running song clock on resuming',()=>{
 const track=makeTimedTrack([{time:15,y:90},{time:30,y:200}],90,450,0);
 assert.ok(Math.abs(timedClockAtPosition(track,145)-22.5)<1e-6);
 assert.ok(Math.abs(timedPositionAt(track,timedClockAtPosition(track,145))-145)<1e-6);
});


import {liveCueAt,INTERLUDE_MIN_GAP_SECONDS,INTERLUDE_GRACE_SECONDS}
  from '../public/scripts/performance-core.mjs';

test('live intro cue shows remaining seconds before first sung line',()=>{
 const points=[12,19,28,36,63];
 assert.deepEqual(liveCueAt(points,0,{timed:true,state:'ready'}),{
   kind:'intro',label:'INTRO',value:'00:12',detail:'Hasta la primera frase'
 });
 assert.equal(liveCueAt(points,6.1,{timed:true}).value,'00:06');
 assert.deepEqual(liveCueAt(points,9.1,{timed:true,state:'playing'}),{
   kind:'prepare',label:'PREPARATE PARA CANTAR',value:'3',detail:'Primera frase'
 });
 assert.equal(liveCueAt(points,11.2,{timed:true}).value,'1');
 assert.equal(liveCueAt(points,12,{timed:true,state:'playing'}).kind,'now');
 assert.equal(liveCueAt(points,13.4,{timed:true,state:'playing'}),null);
});
test('generic pre-start 3-2-1 is visible even without timed lyrics',()=>{
 assert.equal(liveCueAt([],0,{timed:false,state:'countdown',countdownRemaining:3}).value,'3');
 assert.equal(liveCueAt([],0,{timed:false,state:'countdown',countdownRemaining:2}).value,'2');
 assert.equal(liveCueAt([],0,{timed:false,state:'countdown',countdownRemaining:1}).value,'1');
 assert.equal(liveCueAt([],0,{timed:false,state:'playing'}),null);
});
test('interlude cue uses conservative long-gap threshold and grace period',()=>{
 const points=[12,19,36,63,72]; // 27 second gap from 36 to 63
 assert.equal(INTERLUDE_MIN_GAP_SECONDS,20);
 assert.equal(INTERLUDE_GRACE_SECONDS,7);
 assert.equal(liveCueAt(points,39,{timed:true}),null);
 assert.equal(liveCueAt(points,42.99,{timed:true}),null);
 const middle=liveCueAt(points,44,{timed:true});
 assert.equal(middle.kind,'interlude');
 assert.equal(middle.value,'00:19');
 assert.equal(liveCueAt(points,60.3,{timed:true}).kind,'prepare');
 assert.equal(liveCueAt(points,63,{timed:true}).kind,'now');
 assert.equal(liveCueAt(points,64.5,{timed:true}),null);
});
test('normal long lyric phrases are not falsely classified as interludes',()=>{
 assert.equal(liveCueAt([4,18,34],10,{timed:true}),null);
 assert.equal(liveCueAt([4,23,46],11,{timed:true}),null);
 assert.equal(liveCueAt([4,23,46],22,{timed:true}),null);
});
test('missing, invalid, or disabled timing produces no intro or interlude cues',()=>{
 for (const items of [[],[12],[20,12],[12,12],[12,NaN]]) {
   assert.equal(liveCueAt(items,0,{timed:true}),null);
 }
 assert.equal(liveCueAt([12,40],0,{timed:false}),null);
 assert.equal(liveCueAt([12,40],35,{timed:false}),null);
 assert.equal(liveCueAt([12,40],35,{timed:true,state:'finished'}),null);
});
test('cue timestamps freeze through pause and only resume on advancing clock',()=>{
 const points=[12,36,63];
 const paused=liveCueAt(points,44.1,{timed:true,state:'paused'});
 const playing=liveCueAt(points,44.1,{timed:true,state:'playing'});
 assert.deepEqual(paused,playing);
 assert.equal(paused.value,'00:19');
});
