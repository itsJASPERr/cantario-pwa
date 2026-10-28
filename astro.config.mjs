import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';
import rehypeChords from './src/lib/rehype-chords.mjs';
import rehypeLyricLines from './src/lib/rehype-lyric-lines.mjs';
const base = '/cantario-pwa/';
export default defineConfig({
  site: 'https://itsjasperr.github.io',
  base: '/cantario-pwa',
  trailingSlash: 'always',
  markdown: { rehypePlugins: [rehypeChords, rehypeLyricLines] },
  integrations: [AstroPWA({
    base,
    scope: base,
    registerType: 'autoUpdate',
    // Explicitly registered from /scripts/pwa-bootstrap.js
    injectRegister: false,
    includeAssets: ['icon.svg','icons/apple-touch-icon.png'],
    // Ship a verified static manifest rather than an injected one.
    manifest: false,
    workbox: {
      globPatterns: ['**/*.{html,css,js,mjs,json,png,svg,webmanifest,woff2}'],
      navigateFallback: base + 'index.html',
      navigateFallbackAllowlist: [/^\/cantario-pwa\//],
      cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true
    }
  })]
});
