# Palimpsest - illustrated history first-draft handoff
Status: **instructions and assets staged; the first-draft runtime is NOT yet implemented.**

The branch stages an Antigravity-native `AGENTS.md`, workspace Skill, build contract, twelve-folio validation list and 21-source Drakken manifest. Existing source code on `main` remains intact. The full original 12-folio narration (55 KB), implementation handoff (35 KB) and all reference PNG bytes are in the separate downloaded ZIP named `Palimpsest_Antigravity_First_Draft_Kit_v1.zip`.

## Before running the agent
1. Clone/open this branch as the active Antigravity workspace.
2. Extract the ZIP. Merge its `repo_overlay/` into the working clone without overwriting other project work; the ZIP supplies both verbatim Markdown documents in `production/history_v1/source/`.
3. Keep `asset_pack/` OUTSIDE the public Git repo, such as its parent directory. Original Drakken imagery and provisional generated studies are not canon-approved, and publishing their raw pixels is a separate decision.
4. Paste `ANTIGRAVITY_FIRST_DRAFT_PROMPT.txt` into Antigravity. The prompt is also summarized below in `ANTIGRAVITY_TASK.md`.
5. Implement all twelve folios as one cohesive first draft; preserve the older app's mechanics, save data, and a rollback. Never report building completed before browser proof.

Current code seams inspected: `src/engine/AtlasEngine.ts`, `src/engine/BookAndDeskRig.ts`, `src/engine/worlds/BaseWorld.ts`, `src/state/atlasStore.ts`, `src/story/chronicleScripts.ts`, `src/App.tsx`. The old README describes ten unrelated fantasy folios; do NOT copy them as canonical Starsilk history.

Sources of truth:
- Runtime: https://github.com/westkitty/Palimpsest
- Authored lore: https://github.com/westkitty/Starsilk_Character_Dossier/tree/main/src/content/sections
- Machine locks: https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/canon/invariants.json
- Full original image library: https://drive.google.com/drive/folders/1mzt0OBuUEAfhT7_0dloLHHeUr3n0esCx
- Papercraft studies: https://drive.google.com/drive/folders/1ywmXqXaxsPuKo5QSrxvSZEwBkyI7W1He

**Import boundary:** this branch contains the *public-safe* source index and contract; the full manuscript and private reference images are shipped in the separate ZIP, not silently pushed into a public GitHub branch.
