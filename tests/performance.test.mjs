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
