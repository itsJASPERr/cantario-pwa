import test from 'node:test';
import assert from 'node:assert/strict';
import {
 normalizeBpm,changeBpm,tempoMultiplier,addTempoTap,visualBeat
} from '../public/scripts/tempo-core.mjs';

test('CMS BPM validates safe bounds and missing BPM remains unknown',()=>{
 assert.equal(normalizeBpm(80),80);
 assert.equal(normalizeBpm(40),40);
 assert.equal(normalizeBpm(240),240);
 for(const bad of [undefined,null,'',0,-4,241,30,80.5,'hello']){
  assert.equal(normalizeBpm(bad),null);
 }
});
test('BPM display controls use fine, true BPM ratios for scrolling',()=>{
 assert.equal(changeBpm(80,2,80),82);
 assert.equal(changeBpm(80,-2,80),78);
 assert.equal(changeBpm(80,-1000,80),40);
 assert.equal(changeBpm(80,1000,80),200);
 assert.equal(tempoMultiplier(90,80),1.125);
});
test('tap tempo requires at least four consistent taps, resets after silence',()=>{
 let taps=[], result;
 for (const t of [0,750,1500,2250]){
  result=addTempoTap(taps,t);taps=result.taps;
 }
 assert.equal(result.bpm,80);
 assert.equal(addTempoTap(taps,6000).taps.length,1);
 const bad=addTempoTap([0,500,1000],1100);
 assert.equal(bad.bpm,null);
});
test('four beat visualization advances at exactly selected BPM',()=>{
 assert.equal(visualBeat(0,80).beat,1);
 assert.equal(visualBeat(0.75,80).beat,2);
 assert.equal(visualBeat(1.5,80).beat,3);
 assert.equal(visualBeat(2.25,80).beat,4);
 assert.equal(visualBeat(3,80).beat,1);
 assert.equal(visualBeat(0,null),null);
});


import {beatViewState} from '../public/scripts/tempo-core.mjs';
test('bracket view highlights the selected beat and freezes when paused',()=>{
 const live=beatViewState({state:'playing',clock:1.5,bpm:80});
 assert.deepEqual(live,{beat:3,running:true,paused:false,counting:false});
 const paused=beatViewState({state:'paused',clock:1.5,bpm:80});
 assert.deepEqual(paused,{beat:3,running:false,paused:true,counting:false});
});
test('readiness, finished and generic countdown never show a false beat',()=>{
 for(const state of ['ready','finished','countdown']){
   const result=beatViewState({state,bpm:80});
   assert.equal(result.beat,null);
   assert.equal(result.running,false);
 }
});
test('four count-in brackets are driven by the real selected count-in beat',()=>{
 for(let n=1;n<=4;n++){
  const result=beatViewState({state:'countdown',beatCountIn:true,countInBeat:n});
  assert.equal(result.beat,n);
  assert.equal(result.counting,true);
 }
});
