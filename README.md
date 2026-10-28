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

## Chord layout and long songs

Chord pills sit **1.3em above their character anchor**, providing more separation from the lyric baseline than before. Each manual lyric line is treated separately:

- Lines with chords reserve an upper chord lane.
- Lines without chords remain compact, even inside a verse that has other chorded lines.
- Blank lines still separate stanzas.
- Lyrics-only mode stays compact, without the reserved chord lane.
- Long individual lines still wrap on narrow screens. Lines containing chords use extra line-height on all visual wraps so pills have room; unusual strings of tightly packed chords may still overlap.

For predictable chord placement on mobile, write one musical phrase per Markdown source line rather than putting an entire verse on a single line. This enhancement does not change or rewrite any saved lyrics.


## Modo Escenario · offline performance scrolling (v0.3)

Open any song and choose **▶ Modo Escenario**. Cantario opens an immersive dark performance reader. The song is already present in the PWA's offline bundle; no backend or external service is necessary.

- **▶ Iniciar** starts with an optional three-second countdown (enabled by default).
- **Ⅱ Pausar / ▶ Continuar** stops and resumes at the same exact line.
- **− / +** changes the rate from 0.5× to 2.5× in 0.25× increments while scrolling.
- Choose an approximate **Duración** for the full scroll; default is 3:30.
- **A− / A+**, **♫ Acordes**, and a compact dark performance theme are shared with the normal reader.
- **☼ Pantalla activa** requests a Screen Wake Lock when supported and reports if it was denied or released.
- Swiping, using the scroll wheel or keyboard scrolling pauses automatic movement immediately. Tap empty lyric space to toggle the bottom controls.
- The scroll stops at the last readable lines and never automatically switches to another song.
- Exiting or hiding the app pauses and cleans up the scrolling engine and wake lock.

Duration, speed, countdown and wake-lock preferences are stored locally on the device; font size and chord visibility use the same settings as the ordinary reader. The feature works offline after the updated PWA has been loaded. On iOS, screen wake lock depends on browser / OS support and may not be available. Browser storage and cached offline assets are not guaranteed permanent.

Performance mode bases its speed on the actual scrollable height, adapting to font-size changes, chord visibility, browser resizing and long song content. Short songs that are fully visible do not scroll. Long individual lyric lines may wrap, and tightly placed chord pills can still overlap.


### v0.3 scrolling reliability fix
Short songs now remain scrollable in Modo Escenario even if all lyric lines initially fit in the reading area. The scrolling container uses a larger trailing space and stops with the last lines still readable. Its target is measured from the actual position of the final lyric, not from an offset parent that may vary between browsers. Automatic movement accumulates sub-pixel changes independent of browser rounding, and the progress indicator includes elapsed time. If a song scrolls very slowly at the default 3:30 duration, choose **1:00** and increase speed with **+** to test immediately; saved preferences remain unchanged.
