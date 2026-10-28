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

## Song links and uploaded recordings

Edit any song in **Pages CMS → Canciones**. The optional **Spotify**, **YouTube**, and **Shazam** fields create external listening buttons. Use **Grabaciones propias** to upload one or more MP3, M4A, OGG, WAV or WebM files. Uploaded recordings are stored in `public/media/recordings/` and are accessible to anyone using this **public** GitHub repository or the website.

Upload only audio you own or have permission to distribute. Prefer compressed MP3/M4A and modest file sizes. GitHub's browser upload limit is 25 MiB per file, and a regular Git repository blocks files above 100 MiB. For a large audio library, migrate recording assets to a dedicated object store.

Audio is **not automatically included in the initial offline PWA bundle** because large audio would slow down installing and updating Cantario. On a song page choose **Guardar sin conexión** on each recording to cache that file locally; use **Quitar descarga** to remove its cached copy. Offline copies are held in browser Cache Storage and may be evicted by the browser or removed when site data is cleared. Spotify, YouTube and Shazam links still need internet.

## Create and manage multiple song lists

There are two complementary list types:

1. **Personal lists in the PWA:** create, rename and delete from the homepage, then use **+ Lista** on a song card or song page to place it into **multiple** personal lists. Lists and membership are stored in localStorage, work offline, and are specific to the current browser/device (no account sync or automatic backup).
2. **Published lists in Pages CMS:** open **Listas publicadas → New** and enter a title and description, then use the **Canciones de la lista** reference picker to select many songs. A song can appear in as many published lists as you want. Saving triggers GitHub Pages deployment; visitors can browse the published lists, which become available offline with the updated site. Published lists are read-only in the PWA and editable through Pages CMS.

The sample published list **Cantos del camino** contains two original demonstration songs. To publish personal list changes to all devices, recreate the list in Pages CMS; they do not sync automatically.


## Inline chords in Pages CMS (ChordPro-style)

No separate chord editor is required. Open the song with **Editar** → Pages CMS → **Letra** → **Source**.

Insert square-bracket tokens *immediately before the character* where the chord should sound:



 ```text
[Am]Cada paso me [G]lleva
hacia el [F]sol.

Ca[C]mino hacia vos.
[*Suave]Dejo salir mi voz.
```

- Chords may be attached to **any letter or space**, including inside words (`Ca[C]mino`).
- Standard chord forms such as `[Am]`, `[F#m7]`, `[Bb/D]`, `[Dsus4]` and `[Cmaj7]` are supported.
- A custom performance note can be written `[*Palmas]` or `[*Suave]`; it is displayed as a differently colored floating label.
- Ordinary text in square brackets (for example `[Verso 1]`) is left alone unless it resembles chord notation.
- In Cantario, use the **Letra / Letra + acordes** toggle. Its preference is remembered on the device, and both modes work offline.
- Existing songs without chords continue to render as before. Search indexes ignore chord tokens, so words broken by chords remain searchable.

**Editing precaution:** Stay in Pages CMS **Source** mode when entering/saving chord markers. Switching to its rich-text visual mode may normalize the Markdown. We have not guaranteed that an Editor → Source round trip preserves chord tokens; verify a test song before using both modes on chord-annotated lyrics.

**Current limitation:** This first release displays the chord labels above their exact text anchors but does not provide drag-and-drop editing or transposition. Closely spaced labels can overlap visually. Uploaded audio and personal lists are unchanged.
