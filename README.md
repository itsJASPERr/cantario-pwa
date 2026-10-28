# Cantario · Tu cancionero vivo

**Cantario** is an installable, offline-first songbook. This is the first lyrics-only release, built with Astro, GitHub Pages and [Pages CMS](https://app.pagescms.org/).

## What it does
- Browse songs by title or artist; search titles, artists and lyric text.
- Read responsive lyrics, set the type size and mark favorites on this device.
- After visiting the deployed site online, install it as a PWA and access the published songs offline.
- Edit songs in Pages CMS; each save commits Markdown to GitHub and triggers a new static build.

## Add songs with Pages CMS
1. Visit https://app.pagescms.org/, sign in with GitHub and install/authorize the Pages CMS GitHub App for `itsJASPERr/cantario-pwa`.
2. Open the repository in Pages CMS, choose **Canciones**, then **New**.
3. Set **Título**, **Artista**, optionally language and tags, then enter lyrics under **Letra**.
4. Save; Pages CMS commits `src/content/songs/<slug>.md`. Deployment starts automatically on commits to `main`.

The content schema lives in `.pages.yml`, with the matching Astro schema in `src/content.config.ts`. Separate verses with blank lines. To preserve intentional lyric line breaks, keep each sung line on a separate Markdown line. Original and properly licensed content only: public GitHub repositories and deployed pages expose all published lyrics.

## Deploy
1. In GitHub open **Settings → Pages** and choose **GitHub Actions** for **Build and deployment**.
2. The workflow at `.github/workflows/deploy.yml` installs dependencies, generates PWA icons, builds Astro and publishes `dist/`.
3. Visit **https://itsjasperr.github.io/cantario-pwa/** after successful deployment.

`site`, `base`, manifest scope and PWA icon URLs currently target this GitHub Pages project path. Change all of them together before moving to a custom domain.

## Local development
Requires Node.js 22 or newer.

```bash
npm install
npm run dev
npm run build
npm run preview
```

The PWA service worker is generated on production build. Test offline by building and previewing, then loading the site while online once before disconnecting. The entire generated HTML, CSS, JS, manifest and icons are precached on successful installation, including every song page. Favorites and font size are stored only in this browser.

## Roadmap
- **v0.1**: lyrics, artists, search, favorites, readable mobile layout, install and offline access.
- **v0.2**: ChordPro or structured chords, optional chord visibility, transposition.
- **Later**: sets, performance mode and personal annotations.

## License and attribution
The demo lyrics in `src/content/songs/` are original examples created for this starter project. Do not publish third-party song lyrics or arrangements unless you have the necessary rights or permission.
