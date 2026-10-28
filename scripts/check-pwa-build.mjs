import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const root='dist';
const required=[
 'index.html','manifest.webmanifest','sw.js',
 'scripts/pwa-bootstrap.js','scripts/install-app.js',
 'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'
];
for(const path of required) assert.ok(existsSync(join(root,path)), 'Missing PWA artifact: '+path);
const html=readFileSync(join(root,'index.html'),'utf8');
const manifest=JSON.parse(readFileSync(join(root,'manifest.webmanifest'),'utf8'));
const sw=readFileSync(join(root,'sw.js'),'utf8');
assert.match(html,/rel=["']manifest["']/,'HTML must link manifest');
assert.ok(html.includes('/cantario-pwa/manifest.webmanifest'),'Manifest URL must include project base');
assert.ok(html.includes('/cantario-pwa/scripts/pwa-bootstrap.js'),'Missing registration script link');
assert.equal(manifest.display,'standalone');
assert.equal(manifest.scope,'/cantario-pwa/');
assert.equal(manifest.start_url,'/cantario-pwa/');
assert.ok(manifest.icons.length>=2,'Manifest needs install icons');
assert.ok(sw.includes('index.html'),'Service worker must cache index entry');
assert.ok(sw.includes('/cantario-pwa/'),'Service worker must use project base');
console.log('PWA artifacts verified: manifest, icons, register script and offline shell.');
