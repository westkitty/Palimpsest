# Palimpsest: An Illustrated History of the All

An interactive Three.js pop-up book presenting an Administration instructional edition in layered cardstock over a matte black slate table.

**Governing creative direction:** [PALIMPSEST Creative Direction](PALIMPSEST_CREATIVE_DIRECTION.md) · [Prototype-Wonder Recovery Plan](PALIMPSEST_RECOVERY_PLAN.md). The Administration's history is factual but selectively framed; the primary experience is a magnificent physical-feeling pop-up book with near-invisible conventional UI. These documents govern future design planning without altering the existing manuscript or canon.

**Live Deployment:** https://westkitty.github.io/Palimpsest/

**Public Living Book:** The production build opens a continuous thirteen-folio Paper Atmosphere edition at `folio-vnext.html`. The Great Misunderstanding appears as F04. The nine original later worlds appear as public F05–F13 and retain their original source IDs and saved study state. A separate closing imprint follows F13.

**Archive and comparison:** `archive.html` preserves the twelve-folio historical reader and manuscript. The archive’s Living Folios bridge uses its original source numbering. `folio-vnext-classic.html` is the Vite-native twelve-folio comparison.

## Overview

- **Twelve original source folios (`F01`–`F12` in the archive)**: Chronicles the initialization of reality, the Triarchic Order, Mother & the 170-Year Blood Eclipse War, the Siege of the Ruby Eclipse, the Aureal Gate, the Hal'Ven Heliocide, the Siege Wall & Postwar Protocols, Nacreous VI, and the unfinished postwar peace ending with *"Your fate is in our hands."*
- **Thirty-Six Physical Teaching Mechanisms (`3` per Folio)**: Direct interactive dials, pull-tabs, comparison slides, stepped manufacturing sequences, and archival reveals (`[A]`, `[B]`, `[C]`), including persistent state such as `F09`'s irreversible Model Star filament pull.
- **21 Procedural Drakken Assemblies & 6 Character Figures**: Modular Three.js paper-and-ink models constructed from the 21 DRAXIS catalog entries (`production/history_v1/DRAXIS_21.json`), paired with inspection lens marginalia (`F`).
- **Period 1954–61 Instructional Presentation**: Controlled `4:3` framing inside a physical hinged charcoal-linen volume with period typography, acoustic projector/paper sound effects, and an archival PNG plate exporter.

## Controls & Accessibility

- **Open / Next Mechanism:** `Space` or `Enter`, pointer click, or touch tap
- **Teaching Mechanisms:** `A`, `B`, `C` keys, bottom dock buttons, or direct click/tap on 3D paper tabs
- **Folio Navigation:** `[` / `]`, `ArrowLeft` / `ArrowRight`, page corner drag, or bottom `F01`–`F12` bar
- **Camera Presets:** `1` (Slate Inspection), `2` (`4:3` Frame), `3` (Close Model View + `WASD`/Arrow panning), plus orbit/zoom
- **Inspection Lens:** `F` to toggle, move with pointer or `WASD` / Arrow keys
- **Transcript & Sources Drawer (`T`):** Full accessible DOM transcript (`OPEN`, `LESSON`, `A`, `B`, `C`, `CLOSE` cues), mechanism triggers, and DRAXIS catalog inspector
- **Optional Captions (`K`):** Strictly **Off** by default; toggleable via header button or `K`
- **Cue Playback (`V`):** Steps narration cues via browser speech synthesis when available or timed caption progression
- **Accessibility Modes:** `Reduced Motion`, `No Flash` (disables gate flicker/luminance shifts), collapsible HUD (`H`), and full **Non-WebGL `4:3 Schematic` SVG & Reading Fallback**

## Local Setup & Build

Use a Vite-compatible release of Node.js and Bun. The cloud setup was validated on Node 24.22.3 and Bun 1.4.5.

```bash
bun install --frozen-lockfile
bun run lint
bun run build
bun run preview
```

For full local development with the Node server:

```bash
bun run dev
```

The Vite dev server exercises the classic source renderer. Use the build and preview commands to validate the assembled public reader. Static production assets build into `dist/` via Vite (`base: './'`) and do not require the Node/Express server at runtime on static hosts such as GitHub Pages.

## Historical Version & Rollback

The earlier **ten-world prototype** (*Palimpsest — The Impossible Living Atlas*, Folios `I`–`X`, preserving `localStorage['palimpsest_atlas_save_v1']`) remains preserved at commit `1416c581b703e8385f33a5385163d7c51aac6bae` (`rollback/ten-world-main-20261114`). The twelve-folio edition stores temporary session state strictly in `sessionStorage` so prior save data is untouched.

## Known Limitations

- **Software WebGL Rendering:** Environments lacking hardware GPU acceleration fall back to software rasterization (e.g., SwiftShader) at reduced pixel ratio and frame rate; use **Quality** or **4:3 Schematic** mode if needed.
- **Browser Speech Voices:** Spoken audio narration depends on operating-system/browser `speechSynthesis` voices; when no voice is installed, **Read Cue (`V`)** steps reading cues silently at transcript pace.
- **Static Browser Hosting:** The static GitHub Pages build omits local-only Node server routes and runs fully client-side.

## Twelve-folio archive and classic navigation (2026-11-20)

- Open the Living Folios from the cover or main reader's header. A single 12-folio rail navigates **F01 through F12 inside the same living 3D reader**. The browser's archival counterpart is optional and explicit. Choosing F04 no longer exits the living volume.
- All twelve scenes use the shared living stage, repositionable instrument windows, A/B/C physical mechanisms, close inspection, reduced-motion support and source-authored paper construction. F01–F03 preserve their original inked characters, starless-first-scene rules, Geode-only testimony and bounded planet templates. F04–F12 reuse the nine original full paper scenes (including the authorized DRAXIS assemblies where the story requires them), not generic icon replicas. Closing returns to the archive without copying secrets, narration or study data.
- `Escape` exits the joined view from normal overview. Keyboard focus is confined by the native modal dialogue; original page state remains unchanged until the user explicitly continues into another folio.
- The separate `folio-vnext.html` URL supports all twelve folios and provides source-description reading plates when WebGL is unavailable. No historical script or original renderer module is replaced. The Living Folios have their own validated, namespaced, session-only teaching-state storage; original session history remains separate.

## Original source-world regression checks

The living edition is meant to be **one complete physical book**, not a three-page demonstration with an older renderer stapled behind it. Each of the twelve folios must have a meaningful source-specific 3D paper sculpture and three functional, individually defined physical mechanisms. Later folios reuse `src/engine/folios/FoliosWar1.ts`, `FoliosWar2.ts`, and `FoliosAftermath.ts` from the original manuscript instead of producing unverified substitutes. The first three remain separately authored as locked source-review studies until public narration is approved.

The separate scene-state and restoration contracts are in `src/vnext/laterFolioState.ts`; the source-model mounting adapter is `src/vnext/laterFolioScenes.ts`. Run `bun test tests/living-twelve.test.mjs`, `node tests/living-folios-bridge.test.cjs`, `bun run lint`, and `bun run build` before publication, plus the branch Chromium checks. Browser test completion does not replace hands-on desktop/mobile visual QA; inspect framing, panel overlap, papercraft depth, cel colors and GPU lifecycle across F01–F12 before calling the full visual uplift finished.
