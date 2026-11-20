# PALIMPSEST — Folios 01–03 Creative Direction and Source-to-Code Delta

Status: **Accepted production direction for PALIMPSEST, NOT an approved revised manuscript or global canon update**  
Recorded: 2026-11-20  
Source: [Conversation handoff](sources/Palimpsest_Folios_1-3_Observations_and_Ideas_2026-11-20.md)  
Baseline: `2cd577f8487ba640e2669c6b858119047229d48c`  
Provenance: uploaded handoff, user request "Update the project w these", and inspected PALIMPSEST repository.  
Change surface: **planning/reference only in this branch**. The active reader has not yet been rewritten to this direction. Do not infer new runtime behavior from these files.

## Binding creative decisions

1. **Two knowledge layers.** The Administration narrator offers a sincere, pleasant, conversational mid-century educational lesson. It never voices, implies, reacts to, times a knowing pause for, or changes its performance because a reader discovers the hidden history. Audio is independent of secret-discovery state. The experience must remain wondrous even when secrets are missed.
2. **F01 — before stars.** No stellar objects, starfields, or narrated star-model demonstration belong on F01. Show the primordial order/rupture associated with Tiger, Wordstreamer and NiAlBu. Only the reader's miniature inspection beneath Wordstreamer's mechanism reveals the EXACT hidden inscription **"He murdered her."** Its effect is azure, not gold; no reward or narrator disclosure.
3. **Character identities.** NiAlBu is Wordstreamer's husband (he/him), Wordstreamer is his wife (she/her), and Tiger murdered Wordstreamer. NiAlBu remains alive in captivity. Do not infer that the dead are conscious.
4. **F02 — the All first lights.** The first visible stars belong here. An initially starless page physically unfolds to stellar points, clusters, and an immense, beautiful, spatially explorable galaxy. Zentrum and Tiger's Digital Geode are highlighted in the benign public lesson. Zentrum's scenic prominence is NOT proof it is literally the center of space.
5. **F02 miniature testimony.** Only inspection **inside** the Digital Geode reveals the EXACT hidden wording **"NiAlBu still watches her die. Again and again."** Azure shimmer, optional two-beat reveal, no graphic murder replay, no interruption or change to narration/music. NiAlBu witnesses his wife's death; he is not deceased.
6. **F03 — how worlds fill the All.** Most planets result from procedural recombination/variation of inherited templates held in the World's Vault, through the Notebook Program. They are related but not exact duplicates. The account must not portray Tiger as spontaneously creating planets. This spread establishes the procedure before explaining the emergence of the Drakken.
7. **Physical book experience.** Pop-up mechanisms emerge from actual folded leaves; orbit inspection and optional miniature first-person exploration remain distinct modes. Preserve readable non-WebGL fallback, captions-off default, accessible keyboard/touch controls, and saved-state semantics.

## Source status: deliberately NOT approved

- The title "The Wonderful World of the Notebook Program" is **proposed**.
- The cheerful sample narrator lines for F03 are **proposed, not recorded or approved**.
- F03 inscription "He could not create. He locked away the templates." is **proposed, NOT authorized text**. The user-directed topic is Tiger's control/sequestration of templates, not these exact words.
- F03 hidden-text location and whether a public-facing Vault lock animation should occur are **open**.
- Use/placement/source verification of "Time did not heal. Time simply moved on." and "The universe remembered it was wounded." are **open**. Neither may be added as a knowingly ominous public narrator clue.
- Exact formal term "World's Vault", inventory/provenance of templates, and the extent of Tiger's inability to create need canon-source confirmation. This is about planetary production; it does NOT silently contradict the existing fact that Tiger created Starsilk.
- The precise later folio that introduces Drakken, and treatment of displaced older F03 Mother/Egg material, are **open**. Do not invent an alternate chronology to fill the gap.
- The animated falling-into-liquid-paper choreography on F01 is a **possible visual metaphor**, not a physical cosmology statement or locked mechanism.
- No new canonical images, approval records, scripts, or global Starsilk lore may be inferred from this handoff.

## Current code mismatch ledger (inspected at the pinned baseline)

| Surface | Current behavior / text | Direction | Status |
| --- | --- | --- | --- |
| `src/engine/folios/FoliosEarly.ts` / F01 | Backdrop uses `motif: 'stars'`; a literal faceted star core is built and animated | Starless primordial order with three figures | **MUST REBUILD** |
| `src/story/historyManifest.ts` / F01 | Core narration says "Here is a star." and A/C describes the model star | New reviewed public lesson without stars; never knowingly foreshadow secret | **SCRIPT APPROVAL REQUIRED** |
| `src/engine/folios/FoliosEarly.ts` / F02 | Triptych of three divinities, sliding redaction, small geode | First magnificent galaxy unfolds; Zentrum/Geode remain inspectable landmarks | **MUST REBUILD** |
| `src/story/historyManifest.ts` / F02 | Public narrator explicitly states Wordstreamer was murdered and explains NiAlBu's punishment | Narrator must never reveal hidden history; public lesson celebrates the All | **SCRIPT APPROVAL REQUIRED** |
| `src/story/historyManifest.ts` / `MAGNIFIER_SECRETS` | F01–F02 notes disclose technical/archival data; do not contain required hidden phrases | Exact concealed inscriptions, spatially placed; azure-only reveal | **MUST REWORK** |
| `src/engine/folios/FoliosEarly.ts` / F03 | Mother, Drakken Egg 059, rotating strain theses, temple | World's Vault templates and Notebook Program world-generation demonstration | **MUST REBUILD / OPEN STAGING** |
| `src/story/historyManifest.ts` / F03 | Entire folio is Mother & Great Misunderstanding with Egg/temple cues | Planetary-template production first; Drakken explanation later | **SOURCE/CHRONOLOGY RESOLUTION REQUIRED** |
| `src/state/atlasStore.ts` | F03 B state drives five Drakken IDs and also selects active DRAXIS | Must not silently reinterpret saved interactions as planetary templates | **MIGRATION/COMPATIBILITY REQUIRED** |
| `src/components/NonWebglFolioView.tsx` | F01 star diagram, F02 triptych, F03 Egg/strains | Equivalent F01 starless, F02 stars, F03 procedural templates | **MUST REWORK** |
| `src/audio/NarrationEngine.ts` | Uses supplied cues, triggered on interactions; no proven secret-aware narration branch | Preserve independent narration; never react to secret discovery | **PRESERVE / VERIFY** |

## Acceptance and non-regression gates for a later implementation

- F01: no star-related geometry, sky art, SVG, narration, or text equivalence in its actual folio. First star appears in F02 and not before.
- F01: the literal maker testimony "He murdered her." is discoverable only by miniature inspection under Wordstreamer; speaking/public transcript remains oblivious.
- F02: an unfolding paper-based cosmos with visible incremental galaxy construction, Zentrum and Digital Geode; neither location invents new cosmological geography.
- F02: Geode-inside inspection reveals the corrected NiAlBu phrase, no violence replay, no narrator/score response. She = Wordstreamer; he = NiAlBu.
- F03: a visually legible bounded-template generator yields family resemblance and controlled variation, replacing the old Drakken Egg display without deleting or rewriting unrelated canonical Drakken art.
- Confirmed F03 theme appears in accessible reading equivalent; pending F03 inscription remains absent from production until approved.
- F01/F02/F03 narrator reads only reviewed official material. No references to murder, captivity, stolen templates, wounded cosmos, or hidden inscriptions in public voice, titles, cues, or deliberate tonal changes.
- Preserve A/B/C, movement between pages, orbit/pointer/keyboard/touch navigation, subtitles off unless toggled, no-flash and reduced-motion alternatives, session restoration/restart, and F04–F12 intact.
- Test WebGL and SVG fallback, keyboard-only and screen-reader discovery, narrative independence after secret discovery and after revisiting folios, and a full TypeScript/build/test check. Validate on the live build before release.
- Do **not** touch `main` or deploy based solely on this planning record. An implemented change must pass source-specific review and separate publication authorization.

## Next decision gate

Before replacing active F01–F03 manuscript cues, authorize reviewed *public* narration, and resolve where the displaced Mother/Egg material goes in the chronology. The F03 hidden-inscription wording and visible-vs-secret Vault lock remain explicit user decisions. Until then, existing reader implementation remains historic baseline, **not compliance with this new direction**.
