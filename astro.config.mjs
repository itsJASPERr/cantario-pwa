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
    injectRegister: 'auto',
    includeAssets: ['icon.svg','icons/apple-touch-icon.png'],
    manifest: {
      name: 'Cantario · Tu cancionero vivo', short_name: 'Cantario',
      description: 'Canciones para llevar, cantar y compartir.',
      lang: 'es', id: base, start_url: base, scope: base,
      display: 'standalone', background_color: '#f6f2e8', theme_color: '#253d31',
      icons: [
        {src:base+'icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
        {src:base+'icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
        {src:base+'icons/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
      ]
    },
    workbox: {
      globPatterns: ['**/*.{html,css,js,json,png,svg,webmanifest,woff2}'],
      cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true
    }
  })]
});
