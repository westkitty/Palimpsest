# Palimpsest — Starsilk first-draft build
Read \`production/history_v1/README.md\` and companion full manuscripts before changing code.
- The authored Starsilk Character Dossier governs canon facts and source quotations; this repository's existing ten-world fiction does NOT govern the new twelve-folio history.
- Build the whole source-grounded F01-F12 physical 3D book in a separate branch, preserve \`main\` and its functionality as rollback. Reuse existing Three.js page, fold, camera, quality, sound, and interaction machinery instead of rescaffolding.
- Art style: matte black slate table, cream layered cardstock, period 1954–61 Administration instructional films framed 4:3 *inside* a real 3D book. Captions off by default, full DOM transcript always accessible.
- Historical locks: 170-year Blood Eclipse War; user-facing name **The Shard-god**; slogan exactly **Your fate is in our hands.** Mother remains a planet, Blood Ring is manufactured physical material, Starsilk a mnemonic/programmatic filament. No spiders, no invented Drakken or ungrounded dates. Source-specific 21 original Drakken plates govern anatomy; generated papercraft is provisional composition reference.
- Every folio contains six narration cues (OPEN, LESSON, A, B, C, CLOSE), at least three real interactive instructional mechanisms, and meaningful non-WebGL, keyboard, touch and reduced-motion paths.
- No paid API calls, audio fabrication, telemetry, secrets exposure, force push, destructive data migration, deployment, publishing, or canonical approval without separate authorization.
- Use \`.agents/skills/palimpsest-history-compiler/SKILL.md\` for the build; source documents are supplied in the private companion ZIP and should be imported into \`production/history_v1/source/\` before implementation.
