import test from 'node:test';
import assert from 'node:assert/strict';
import {installedMode,installPlatform,installGuide} from '../public/scripts/install-app-core.mjs';

test('installed modes recognize standalone PWA and legacy iOS home-screen launch',()=>{
 assert.equal(installedMode(true,false),true);
 assert.equal(installedMode(false,true),true);
 assert.equal(installedMode(false,false),false);
});
test('iPhone, iPad, Android and desktop receive appropriate installation instructions',()=>{
 assert.equal(installPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)','iPhone',5),'ios');
 assert.equal(installPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)','MacIntel',5),'ios');
 assert.equal(installPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 7)','Linux',5),'android');
 assert.equal(installPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)','Win32',0),'desktop');
});
test('all supported platforms have usable fallback steps, no false automatic installation claim',()=>{
 for (const platform of ['ios','android','desktop']){
   const guide=installGuide(platform);
   assert.ok(guide.title.length>8);
   assert.ok(guide.steps.length>=3);
   assert.ok(guide.note.length>10);
 }
 assert.ok(installGuide('ios').steps.some(step=>step.includes('pantalla de inicio')));
 assert.ok(installGuide('android').steps.some(step=>step.includes('Chrome')));
});


test('iOS installation guide explains app-web mode and offline first launch',()=>{
 const guide=installGuide('ios');
 assert.ok(guide.steps.some(x=>x.includes('app web')));
 assert.ok(guide.note.includes('CON internet'));
 assert.ok(guide.note.includes('Safari'));
});
