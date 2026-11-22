# PALIMPSEST — Prototype-Wonder Recovery Plan

**Status:** User-requested, source-grounded, **proposed implementation sequence**, not an implementation authorization or proof of visual success.
**Prepared:** 2026-11-21
**Verified source baseline:** `westkitty/Palimpsest` main `86d6f4214af204dbbe347a04f7aa9e18f18b7876`
**Authority:** [PALIMPSEST_CREATIVE_DIRECTION.md](PALIMPSEST_CREATIVE_DIRECTION.md), then [OPERATIONAL_STATE.md](OPERATIONAL_STATE.md), and controlling authored manifest/approved source materials.

## Goal

Recover the unforgettable beauty and tactile pop-up-book feel of the first successful PALIMPSEST prototype **through the existing complete F01–F12 Living Book**, keeping the Administration's historically factual yet selectively deceptive institutional account at the center.

**Do not scope this as an optical-puzzle build, new alternate mode, extra game mechanics, or conversion back into a three-folio demonstration.**

## Verified starting point

- `/` currently routes into `folio-vnext.html`, a deliberately **closed** physical book. It opens on the physical cover and supports direct pointer-driven page-corner turns. Owners: `src/vnext/livingBookBinding.ts`, `src/vnext/previewV2.ts`.
- One joined Living Book holds F01–F12; F04–F12 reuse original authored `BaseFolioWorld` classes through `src/vnext/laterFolioScenes.ts`. Each folio preserves its A/B/C mechanism. The archive remains explicit at `archive.html`.
- F04–F12 have source-bounded die-cut hinged scenic profiles in `src/vnext/livingStagecraft.ts`. F05's four-stage sequence and F09's irreversible model-star state are covered by tests.
- Four movable conventional windows already hide by default behind the **existing** bottom-center chevron in `folio-vnext.html`; physical page turns have no visible Prev/Next WebGL buttons.
- The early Living Book is presently an **unnarrated review edition**. `production/folio_vnext/F01_F03_DIRECTION_AND_DELTA.md` records new narration direction and unresolved revisions; it does not authorize replacing archival text.
- `production/folio_vnext/evidence/physical-theatre-20261120/` contains representative desktop/portrait Chromium/SwiftShader captures, **not** a complete visually approved F01–F12 gallery or real-phone test. `OPERATIONAL_STATE.md` retains physical-device art quality, touch ergonomics, and sustained GPU lifecycle as open.
- The exact original prototype **visual reference / build SHA that the user praised** has not yet been positively established by this plan. Existing historical `src/vnext/preview.ts` and `src/engine/BookAndDeskRig.ts` are useful *code precedents*, not substitutes for seeing that original result.
- Existing `src/story/historyManifest.ts` contains the archival instructional edition and may differ in places from the revised F01–F03 voice contract. Do not infer that either the current draft or published archival narrator has been approved under the new global framing.

## Phase 0 — Anchor the look, not another feature list (READ-ONLY)

**Work:** Identify the exact original impressive prototype run (source commit/branch, screenshots/video, camera angle, paper setup and interaction behavior). Capture the current twelve-folio build in equivalent shots. Produce a side-by-side visual comparison without assuming remembered grandeur is already reproduced.

**Evidence:** At minimum closed/open book, F01, first F02 stars, F02 fully deployed, F03, F05 stage 0/4, F09 pre/post, F12. Retain full-size sources; do not substitute collages for primary proof. Record viewport, browser, GPU, source SHA and the user's actual preference on each comparison.

**Exit:** The reference is confirmed or recorded as unavailable; a concrete visual rubric identifies what worked in the original (silhouette, scale, unfolding, paper craft, lighting, color, pacing, physical handling) versus what current shots actually show. No ungrounded "matches prototype" claim.

## Phase 1 — One gold-standard spread, then a mechanical contrast (IMPLEMENTATION ONLY AFTER APPROVAL)

**Primary target: F02.** Make the first-stars-to-full-galaxy page a breathtaking demonstration of paper visibly unfolding into the All. Retain three authored A/B/C states, source landmarks, existing Geode, protected testimony and return path. The expanded cosmos must still trace back to hinges/leaves on the page.

**Second target: F05.** Prove the same material design language works for a physically staged industrial teaching apparatus, with the exact four-source-step manufacture and no magical halo. This guards against overfitting the art style to stars.

**Exit:** Both spreads demonstrably outperform the matched current baseline in paper depth, materials, lighting, readability, tactile control and interpretive clarity, without any protected behavior regressing. Require a user visual-review gate before scaling to ten more spreads.

## Phase 2 — Material and book-engineering system

Use the gold spreads to establish repeatable construction patterns in the existing `LivingBookBinding`, `previewV2` and `livingStagecraft` ownership: stable page-to-pop-up attachment, meaningful 3D depth, visible creases/hinges, two-sided cardstock, contact shadows, cel/ink handling, scale shifts sourced from folds, coherent camera rest positions and pointer hit surfaces.

**Exit:** opening, page turning, deploying and collapsing a spread all feel continuously physical. Reduced motion snaps to the same meaningful states. No renderer forks, scene-swap swipes, obstructive controls, regression to placeholder figures, or extra dependencies without compelling evidence.

## Phase 3 — Administration editorial and narration pass (SOURCE/USER APPROVAL GATE)

Create an F01–F12 **framing ledger** with one row per folio: historical source fact; exact official claim; emphasized achievement; omitted/minimized context; permissible paper demonstration; approved hidden/alternative record (if any); narrator knowledge boundary; status of exact script wording.

Audit current `src/story/historyManifest.ts` and F01–F03 direction against the user-approved thesis: *factually true, institutionally selective, meaningfully deceptive*. Preserve public narrator sincerity and institutional warmth. Do **not** make narrator self-aware, overtly condemn Administration, invent lies, or explain secrets out loud. Protect exact existing secret gates and text.

**Exit:** Proposed revised narration or manuscript changes are **separate review drafts**. No implementation or recording of new words until specifically approved. The archival edition is retained regardless.

## Phase 4 — Scale visual standards across the remaining ten folios

Apply gold-standard construction and per-chapter art direction to F01, F03, F04, and F06–F12 **without homogenizing them**. Different historical events should yield different physical paper engineering: figures, paper atlas, mechanical production, campaign records, gate, heliocide, Wall, recovery and postwar closure.

Keep source-authored A/B/C and allowed model roster untouched. Give each folio a verified before/after screenshot for normal/rest and meaningful operated states. Treat unfinished scene art and fidelity as open until reviewed.

**Exit:** All twelve pass the visual rubric individually, not merely the same test harness. Open/close/turn interactions remain available chapter to chapter.

## Phase 5 — Remove screen clutter without deleting access

Retain the bottom chevron as the only persistent conventional UI. When closed: just the physical book. When opened: the minimum compact set of navigation, mechanisms, reading, camera, settings and accessibility alternatives. Do not automatically remove the existing four movable windows until all their keyboard/touch/screen-reader capabilities have a safe, verified replacement.

**Exit:** Mobile and desktop first paint show the closed book and discreet arrow; hidden controls neither cover the book nor trap focus. Mechanisms are primarily operated by the actual physical object. A non-WebGL illustrated reading equivalent stays complete; reduced motion and no-flash alternatives are usable.

## Phase 6 — Performance, visual acceptance, and release decision

- Run all original canon/source/study/physical-book tests, TypeScript, build, fresh Chromium end-to-end and archive/independent-route checks on the exact candidate SHA.
- Test real desktop and real touch devices, complete page-turn/gesture cancellation and focus recovery, inspection/secret boundaries, F05 four-stage cycle, F09 irreversible session/reload, all 36 mechanisms, and all twelve page transitions.
- Benchmark comparable hardware/viewport/quality settings; sample frame pacing and renderer geometry/texture counts after warm-up and ten repeated page/scene/open-close cycles.
- Capture uncompressed/legible representative rendered images and physically review each folio against the confirmed original look. Code/CI success is **necessary but not visual approval**.
- Keep the archive and provenance intact; report failures, compromises and unverified states. Publish only with separate authorization after the quality gate.

## Stop conditions and protected scope

Stop or revert an attempted uplift if the original source figures are replaced by generic symbols, F01 gains stars, F02 testimony leaks into narration, F03 unapproved text appears, F05 drops a step, F09 regains its collapsed MODEL STAR, accessible routes break, the folded-paper origin is lost, the archival edition changes unintentionally, or the proposed effect makes the page less beautiful/legible.

**Defer:** cross-folio sighting puzzle, alternate experimental routes, standalone visualizers, new canonical characters/strains/planets, new hidden inscriptions, sweeping narration rewrites, unrelated feature additions, release automation changes.

## Recommended first implementation packet after Phase 0

**Scope:** F02 visual recovery plus F05 mechanical contrast only, no other folio overhaul. Freeze current source/state, identify reference shots, choose a bounded detail list based on actual comparison, implement on an isolated branch, run matched tests/captures, and stop for visual approval before extending across the other ten folios.

**Definition of done:** A reader can physically open the same book, unfold a magnificent paper-bound All, manipulate credible cardstock machinery, and understand an assured Administration historical lesson, with all existing journeys preserved. A team cannot declare completion merely because the controls respond or the build succeeds.
