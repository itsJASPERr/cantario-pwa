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


## Modo Escenario mobile controls (v0.3.1)

Mobile and phone-landscape performance screens show a **compact, always-available bottom bar** with − / Play-Pause / +, progress and elapsed time, and an **Ajustes** icon. The bar occupies approximately 70–76 px, plus the safe area of the device.

The settings icon opens a temporary dark drawer **over** the song, without resizing the scroll viewport, containing the existing song-duration, font-size, chord-visibility, countdown and screen-awake settings. Tap outside the drawer, tap its close control, or press Play/Resume to close it. If the song is playing, it closes automatically after five seconds without interaction, except while editing a field.

The normal desktop controls are unchanged. All existing localStorage settings are retained, and no CMS or song format migration is required. The compact bar is never auto-hidden; Pause remains easy to reach.

## Performance icons and screen wake lock

The performance settings use Lucide's Astro SVG icons (`@lucide/astro`), including the duration dropdown chevron, close button, settings control, and wake-lock states. **Pantalla activa** means the Screen Wake Lock API successfully requested the screen to stay on during performance; **Pantalla normal** means the feature is off and normal device timeout rules apply. Unsupported, denied, and released states are displayed separately. This does not control brightness or guarantee that the OS will honor the request (low battery or backgrounding can release it).

**Wake-lock control wording:** The performance settings label is now `Keep awake · ON`, `Keep awake · OFF`, or `Keep awake · Unavailable` (with an activation state). ON means the browser actually acquired a screen wake lock; enabling the preference does not guarantee the device grants it. The tooltip explains that this prevents screen locking during a performance when supported.


## v0.4 — Line-timed live scrolling (GitHub Issues #1/#2)

In Pages CMS **Canciones**, optionally fill in **Duración de referencia (mm:ss)**, e.g. `03:45` for 3 minutes 45 seconds. In **Letra → Source**, add LRC-style timestamps at the **beginning of a sung line**, before any chords:


```text
[00:18.00][Am]Un paso, una huella,
[00:23.50]la [G]tierra me deja estar.
[00:29.00]El [F]viento trae canciones,

[01:12.00][C]Cuando la noche se acerca
```


Each timestamp represents the planned beginning of a lyric line in a **live performance**. Timestamps must increase strictly and be before the song duration; use at least two. Intermediate lines without timestamps are left between reference anchors. Timestamps and chord markers do not appear literally in the published reader. Stay in Pages CMS **Source** mode when saving to avoid unexpected Markdown normalization.

In Modo Escenario, choose **Sincronizado** if the duration and timestamps are valid. The clock interpolates between line anchors, anticipating the following line by approximately two seconds. Existing **Continuo** mode is retained and used by songs with missing or invalid timing; manual swipe still pauses. The duration selector controls only continuous scrolling. In synchronized mode the song's reference duration is shown instead. Live −/+ changes timing speed without changing source timestamps.

This is a fixed rehearsal reference, not automatic listening or microphone detection; an interactive tap-to-sync authoring tool and live resynchronization are separate future GitHub issues (#3 and #4).


The synchronized reader subtly highlights the currently timed lyric line as the live clock passes each authored timestamp; this highlight is independent of the two-second read-ahead used for scrolling and never appears in Continuous mode.

### CMS duration field update
The song duration is now a plain text field named `duration_mmss` with format **mm:ss**, such as `04:52` or `02:25`. Pages CMS displays **Duración de referencia (mm:ss)**. The synchronized performance engine parses the value into seconds internally. Existing demo and user song durations were converted without touching their lyrics. Previous `duration_seconds` values remain supported for older files that haven't been migrated. Incorrect values safely disable Synchronized mode for that song; Continuous mode remains available. Use a two-digit seconds component (for example `03:05`, not `3:5`).


## v0.4.0a — Live Start Cue and likely interludes (#6)

The performance view now provides a compact floating visual cue near the top of the song **without resizing the lyric viewport**.

- In **Sincronizado**, before the first lyric timestamp it shows \`INTRO · mm:ss\` as a countdown to that first sung line. The final three seconds show \`PREPARATE · 3 / 2 / 1\`, then briefly \`¡AHORA!\` at the timestamp.
- The optional pre-start 3-second countdown is separate from the song's intro and is also shown here, including in Continuous mode. It does **not** consume the song's own clock.
- A **likely interlude** is inferred when two consecutive annotated lyric timestamps are at least 20 seconds apart. The cue does not announce it until at least 7 seconds after the preceding lyric onset. It then counts down to the next line and displays another prepare / now cue. These are heuristics, not detection of instrumental music.
- Pausing freezes the reference clock and its visible countdown. Restarting resets it. When there are no valid timestamps, or the reader is set to **Continuo**, no inferred INTRO or INTERLUDIO is displayed.
- The floating cue does not alter the timing file format, song metadata, source lyrics, compact performance controls, or audio. No new CMS fields are needed. It remains offline-first.

To reduce false INTERLUDIO predictions in partially timed songs, Cantario only infers an interlude from a 20+ second gap **when the next timed line begins a new stanza** (separated by a blank line in the song Source). A gap inside the same stanza is treated as normal phrasing, even if it is long. This is intentionally conservative until explicit section cues are available.


## Install Cantario PWA from the UI

Both the song library and individual song pages show an **Instalar** button in the top header (hidden in standalone/PWA mode). The button uses the browser's native install prompt if \`beforeinstallprompt\` is available and valid. On iOS, where that event generally isn't available, a small dialog explains how to **open Cantario in Safari → Share → Add to Home Screen → Add**. Android and desktop browsers without an available native prompt receive manual browser menu instructions instead. The button never claims installation succeeded until an installation event confirms it. A browser embedded inside another app may not support installing; open the site in Safari or Chrome.

The PWA already has a manifest and offline service-worker cache. The install control only improves discoverability; some browsers may decline to install if their platform requirements are not satisfied. Saved recordings still require their separate offline-storage action.


## Visual BPM pulse + tap tempo (GitHub issue #8)

Pages CMS songs may optionally set **Tempo de referencia (BPM)** (integer 40–240). This is metadata, not musical analysis; there is no server, microphone or audio playback dependency.

In Modo Escenario, four numbered beat markers pulse in the header. The existing − / + controls now operate in **2 BPM** increments; the selected BPM is shown in the compact mobile bar and settings. On a song with an authored BPM, the timeline runs at **selected BPM / song BPM** while preserving the source lyric timestamps; e.g. 90 BPM from a reference 80 BPM runs its timeline at 1.125×.

If you **don't know the BPM**, use **Marcar pulso** in settings: tap at least four regular beats (optionally continue), and Cantario estimates a BPM from the intervals locally, without requesting microphone access. For songs with no authored BPM, the initial **~80 BPM** is explicitly provisional, not detected. The first tap result becomes that song's reference tempo for the local device; it is not committed to Pages CMS. You can later add the measured BPM in CMS. Manually changing the unknown guide BPM is also possible but remains an estimate. Selected BPM is stored per song in localStorage.

When BPM is established via CMS, tapping or manual adjustment, the optional pre-start countdown becomes **1–2–3–4** at the selected beat interval. Without a known tempo, the original three-second countdown remains. Four beats are a visual pulse guide, **not** proof of meter, beat-one alignment, or whether a song is in 4/4. Different meters and accurate beat-phase calibration can be added after field testing.

Continuous mode, untimed songs, the existing visual INTRO / INTERLUDIO cues, manual scrolling, offline caching and the compact mobile control bar all remain supported.

To choose a specific tempo quickly, type a BPM between **40 and 240** into **BPM elegido** in Modo Escenario settings. The effective speed remains safety-limited to 0.5×–2.5× the song's reference BPM; the input and −/+ controls stay synchronized. **Marcar pulso** remains available when you don't know the BPM.


## Offline launch reliability on iOS (issue #9)
Cantario now ships an explicit static Web App Manifest, linked on every page, and explicitly registers the scoped service worker. Its offline navigation fallback is the library homepage. CI checks that the published artifact contains the manifest, icons, registration script and offline start page.

Both library and song reader display a cache-readiness status. "Lista para usar sin conexión" appears only after a cached app shell is found, not because the Home Screen shortcut exists. On iPhone, open the INSTALLED Cantario app while online, wait for the ready indicator, then try airplane mode. If an older shortcut launches ordinary Safari with its address bar, remove it and add the site from Safari again. On iOS versions with an "Open as Web App" switch, keep it on. Audio recordings still need separate offline download.


## Prominent four-beat brackets view (issue #10)
Modo Escenario now has a dedicated beat-brackets row under the song title, displaying **[1] [2] [3] [4]** in stable, legible boxes with the current BPM. The active beat is highlighted in amber; beat one has a distinctive border. A second, reserved row displays INTRO, INTERLUDIO and 3–2–1 cues without covering or moving lyrics. The beat view freezes on Pause, shows no fake beat when ready/finished, and follows the four-beat pre-count when calibrated. The settings drawer includes **Pulso visual: sí/no**; turning it off saves the preference and retains the shorter cue row. This is a visual guide, not a claim of automatic time-signature or live downbeat detection.

## Custom Pages CMS authoring components

Prototype components for a self-hosted Pages CMS instance live in [`pagescms-custom-fields/`](pagescms-custom-fields/README.md): a line-by-line lyric timing editor with rehearsal capture, and a BPM tap field. These are **not active in the hosted Pages CMS**. The hosted `.pages.yml` retains compatible built-in fields; follow the integration README to install these in a self-hosted CMS application.
