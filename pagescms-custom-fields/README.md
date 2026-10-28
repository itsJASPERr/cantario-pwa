# Cantario custom fields for Pages CMS (self-hosted only)

This directory contains **actual Pages CMS v2 custom-field modules**, using the APIs described in:
https://pagescms.org/docs/guides/creating-custom-field/

**Important:** These modules **do not load into https://app.pagescms.org** merely by being present in the Cantario repository. Pages CMS discovers custom fields from its own source tree at \`fields/custom/<field-type>/index.tsx\`, during the CMS build. Cantario's hosted \`.pages.yml\` intentionally remains on supported built-in field types so existing editing continues to work.

## Fields

1. \`lyric-timing\` replaces the **body** field in a *self-hosted* Pages CMS: line-by-line timing controls, rehearsal clock, mark-current-line workflow, raw source fallback, timestamp validation, and lossless preservation of existing Markdown/chords/stanzas. The stored value is still the **original Markdown body string**; no migrations.
2. \`bpm-tap\` replaces the built-in **bpm** number field: numeric BPM entry and four-tap BPM estimate, stored as a **number** in existing YAML frontmatter.

## Installing into a self-hosted Pages CMS checkout

Start with a specific, tested Pages CMS v2 revision from
https://github.com/hunvreus/pagescms and follow its own self-hosting/environment docs.
Do **not** embed GitHub credentials or self-hosting secrets in the public Cantario PWA.

Copy these files into the **CMS checkout**, preserving their paths:

\`\`\`
pagescms-custom-fields/fields/custom/lyric-timing/*.tsx
  → pagescms/fields/custom/lyric-timing/
pagescms-custom-fields/fields/custom/bpm-tap/*.tsx
  → pagescms/fields/custom/bpm-tap/
pagescms-custom-fields/lyrics-core.mjs + lyrics-core.d.mts
  → pagescms/lyrics-core.mjs + lyrics-core.d.mts
pagescms-custom-fields/bpm-core.mjs + bpm-core.d.mts
  → pagescms/bpm-core.mjs + bpm-core.d.mts
\`\`\`

Rebuild or restart the CMS server so that \`fields/custom.generated.ts\` is regenerated
from those \`index.tsx\` files. Test this configuration **in the self-hosted instance only**:

\`\`\`yaml
content:
  - name: songs
    type: collection
    path: src/content/songs
    format: yaml-frontmatter
    fields:
      - name: title
        type: string
        required: true
      - name: artist
        type: string
        required: true
      - name: bpm
        label: Tempo de referencia (BPM)
        type: bpm-tap
      - name: duration_mmss
        label: Duración (mm:ss)
        type: string
      - name: body
        label: Letra y sincronización
        type: lyric-timing
        required: true
\`\`\`

Retain the other field definitions from Cantario's current \`.pages.yml\` when migrating. Only the \`bpm\` and \`body\` type identifiers need changing. **Never** set \`type: lyric-timing\` in Cantario's hosted \`.pages.yml\`; the hosted service has not registered that module.

## Data and safety rules

- The editor only changes the \`[mm:ss.xx]\` prefix of the selected physical Markdown line.
- Notes, stanza spacing, \`[Am]\` chords and \`[*Suave]\` cues are never rewritten.
- Raw source editing remains available for complex Markdown.
- The schema blocks malformed/duplicate/non-monotonic timing, but allows partial authoring: a song with fewer than two valid timestamps remains in Continuo on the Cantario site.
- \`duration_mmss\` is still edited independently (e.g. \`03:45\`). The existing Cantario build determines whether timestamps are usable relative to duration.
- Tap BPM and rehearsal timing use the editor's local clock; no audio upload, speech analysis, network service or microphone permission.
- Unsaved editor changes are still subject to Pages CMS's normal Save workflow.

## Verification and deployment status

Pure editing and estimation helpers are tested using Cantario's \`npm test\`.
Run a full **render → edit → save → reload → validate** smoke test in the self-hosted CMS before switching any production editor links away from \`app.pagescms.org\`.
