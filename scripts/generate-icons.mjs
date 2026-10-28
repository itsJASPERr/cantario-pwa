import { readFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
const source = await readFile(new URL('../public/icon.svg', import.meta.url));
const dir = new URL('../public/icons/', import.meta.url);
await mkdir(dir, {recursive: true});
for (const [file,size] of [['icon-192.png',192],['icon-512.png',512],['apple-touch-icon.png',180]]) {
  await sharp(source).resize(size,size).png().toFile(new URL(file,dir));
}
const safe = await sharp(source).resize(350,350).png().toBuffer();
await sharp({create:{width:512,height:512,channels:4,background:'#253d31'}})
  .composite([{input:safe,left:81,top:81}]).png().toFile(new URL('maskable-512.png',dir));
console.log('Generated Cantario icons');
