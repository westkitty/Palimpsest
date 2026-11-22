# PALIMPSEST — Locked narration / F04 integration contract

**Status:** approved script committed; public sequence map and invariant tests added; full visible 13-folio integration **not yet implemented**.
**User approval:** 2026-11-22. **Base:** `main` at `99eb1965d77f005b87261ce427366f160d87de1b`.
**Public script authority:** [PALIMPSEST_PUBLIC_NARRATION_LOCKED.md](PALIMPSEST_PUBLIC_NARRATION_LOCKED.md). This file is an exact-language lock. **No content or cadence edits without new user approval.**

## 1. Governing boundaries

- Public volume: **F01–F13** plus a **separate closing pop-out**. F04 is **The Great Misunderstanding**, inserted between Notebook and Year Zero.
- Preserve the physical closed-cover entry, directly draggable deforming page, one continuous open book, A/B/C learning actions on each page, unobstructed resting view, bottom-center chevron, accessible keyboard/pointer/touch and non-WebGL paths.
- The original `archive.html`, `src/story/historyManifest.ts`, `src/story/chronicleScripts.ts`, original source-world classes, original narrator/hidden testimony and any recording are protected; do **not** replace or renumber them.
- The new public narrator is sincere, midcentury instructional and **never perceives/replies to** F01 Wordstreamer testimony (`He murdered her.`) or F02 NiAlBu testimony (`NiAlBu still watches her die. Again and again.`).
- Source-derived actual facts, deliberate editorial miniatures and personal testimony must remain distinct; no invented Drakken anatomy, Mother sculpture or divine imagery. The Great Misunderstanding visual page is an **instructional paper interpretation**.
- Nacreous VI **did subsequently experience miraculous recovery, as did many other worlds**. F12's `31 days` soil cylinder is the *initial milestone*. Its paper jungle is a future-facing explanatory animation, not an assertion that the recovered forest existed on the thirty-first day.
- Keep exact final line `Your fate is in our hands.` and the last printed pop-out free from character artwork.
- This approval supersedes the older twelve-folio *public-edition count only*. It does not reauthorize changing archived canon, exact testimony, historic mechanism semantics, or the separate archival manuscript.

## 2. Current implementation anatomy

The old Living Book uses public index = source world index throughout `src/vnext/previewV2.ts` and the old source indices 0–11 for nine later worlds. `CODA_INDEX=12`; existing saved study states have IDs 3–11 under `palimpsest.living.f04-f12.study.v1`. The source manifest has twelve worlds, and existing `LivingStagecraft`/War1/War2/Aftermath art use original world indices.

The new `src/vnext/publicFolioMap.ts` is the explicit public-to-source translation. It currently is a **seam and not yet wired into the renderer**:

| Public page | Existing source world | Meaning |
|---|---:|---|
| F01–F03 (0–2) | 0–2 | Remain unchanged |
| **F04 (3)** | **new independent living-only scene** | Mother / Eggs / temple / terraforming revelation |
| F05–F13 (4–12) | 3–11 | Exact existing worlds, mechanisms, states and art |
| Closing imprint (13) | not a world | Separate `Your fate is in our hands.` leaf |

## 3. Implementation order and change boundaries

### Slice A — Approved-source preservation **DONE**
- Committed locked public narration at `production/folio_vnext/PALIMPSEST_PUBLIC_NARRATION_LOCKED.md`.
- Added public/index translation `src/vnext/publicFolioMap.ts` (no archive/source-index mutation).
- Added tests of mapping, structure, known testimony exclusions and final closing line.
- This does **not** yet make the script audible or change what existing UI displays.

### Slice B — New independent F04 3D papercraft scene **PENDING**
Add a new living-only page scene and pure interaction state. Three physical, accessible A/B/C actions:
- **A — Open the Egg:** an unmarked **dark Egg** appears above a paper world. Do not define literal biological anatomy/strain or redesign Mother as a character.
- **B — Raise the Temple:** hinged architectural paper walls surround the landed Egg; this is an inhabited society's historical response, not proof the visitors were divine.
- **C — Lift the Roof:** roof raises to reveal a **cross-section of ground already being altered** below. Maintain legible die-cut sections, braced paper supports, and a different ending state from a generic glow/particle event.

Define pure `F04` state outside `laterFolioState.ts` to protect the existing serialized source-world study. Mechanisms must support repeat interaction, independent restoration or reset, keyboard/pointer direct manipulation, status announcements, reduced motion, and a native SVG/text fallback. Scene, geometry, textures, materials, listeners and target registrations must be disposed on turn.

### Slice C — Make public book indices real **PENDING**
- Route public 0..13 through `publicPage()` in `previewV2.ts` at every reading/navigation, page-turn, rendering, action, progress, fallback, deep-link and bridge boundary.
- Keep *source* world index for `createLaterFolio()`, `getLaterCopy()`, `LivingStagecraft`, `createRevisionWar1Art/War2Art/AftermathArt`, and legacy study arrays. **Never** use a public index on those arrays.
- Set coda = public 13, not source 12. Both first/last edges remain bounded.
- `livingBookBinding.ts` uses actual folio count for page-signature thickness and turning-end geometry; avoid the current hard-coded 12/13.
- Adapt accessible fallback/plate numbering, chapter title, progress and deep-link `?folio=` to the *public* sequence. Embed/bridge transitions must document whether their number is source or public; retain an archive-compatible translator.
- Preserve `LATER_STUDY_STORAGE_KEY` data by continuing to index the preexisting nine states through their original source world IDs. A separate versioned key can persist the new F04 state; provide non-destructive migration or safe defaults.
- Move stagecraft source-relative semantics only at the public display boundary; **do not** blindly increment internal F05/F09/F10/F11 indices, which are still attached to their existing source artifacts.

### Slice D — Public narration presentation **PENDING**
- Extract exact segments from approved Markdown without rewriting content. Speaker labels and headings are metadata, not spoken utterances. Preserve original paragraph divisions.
- Define optional reading/transcript cues keyed by public folio. Preserve stage-based timing: action references wait for corresponding visible paper state. Do not introduce autoplay audio/TTS as an unrequested dependency.
- If narration audio is later produced, validate actual recording line-by-line against locked words, pronunciation of `C.R.o.W.N.`, cue timing, playback reset/seek, audibility and stored-media permissions.
- Keep archival manuscripts, narrator and hidden testimony **independent**. Never copy secret testimony into public narration payload, tooltip, aria announcement or initial presentation.

### Slice E — Validation and review **PENDING**
1. Verify locked script contains thirteen historical folio sections, one prologue and one independent closing pop-out, verbatim against this approval.
2. Run existing TypeScript/Vite and complete legacy source/canon/test suites. Existing old-world state and all **36 original A/B/C** operations must still pass; prove the **3 added F04** operations too.
3. Browser smoke: closed cover → F01, starless → F02 ink/stars, F03 Notebook variations, **new F04 A/B/C**, F05 Year 0 → F13 postwar service → separate coda. Navigate back across F04/F05; reload and reset; test keyboard, drag corner and pointer cancellation.
4. Verify F01/F02 original secrets remain discoverable by their intentional inspection gates, **without** the public narrator reacting, and remain absent from public transcript and default announcements.
5. Verify F12's cylinder is positioned as 31-day beginning, and avoid any copy suggesting Nacreous VI never later recovered. Preserve Codec/Marcel/Tiger visual sequencing.
6. Inspect real rendered desktop + portrait frames, no-WebGL state, reduced motion, lifecycle/disposal and final book end. Real-device touch and perceptual/audio checks stay **unverified** until observed.
7. Only after all applicable gates pass: mark review-ready, request user visual approval, and separately authorize merge/deployment. Do not promote this branch as a finished experience.

## 4. Failure / rollback

Do not fast-forward or merge this branch into `main` while Slice B–E are pending. Any accidental public/source index aliasing is a **blocker**: it risks corrupting persistent state, historical scene identity and secret gates. Preserve the prior twelve-folio site at original `main` until thirteen-folio browser proof is collected.

## 5. Immediate next implementation unit

Implement **new F04 living-only scene** and its **three unit-tested states** without touching archives. Next wire the public translation boundary across preview/navigation in one isolated commit and run the full suite. Stop before merge/deploy for visual review.
