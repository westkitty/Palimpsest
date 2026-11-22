# F05 runtime migration
The Standard of Conquest candidate now drives the Living Book's visible F05 set. The prior runtime state source and accessible control names remain authoritative. The old procedural art is a load-failure fallback, not shown behind a successful import.

- Input: private `Palimpsest_F05_The_Standard_of_Conquest.blend` as reviewed, SHA-256 `b412b31a271b47e52fcee3ee45ddb621031edca47d095fa59c14087b962fb264`.
- Export: `src/vnext/proof/assets/palimpsest-f05.glb`, SHA-256 `06b8f7b2f010bb036e6af12d033c658cb9cb6811057b17a254b5be78a4249f49`. 350 nodes, 335 meshes, 21 animation clips. No cameras, studio lights or extra properties. Text becomes geometry using the Liberation Serif substitute where necessary.
- A: authored comparison slider, material-state globe and opaque ring deployment. Orbit, planet axial turn and Draxis idle are separately timed in the runtime; shimmer is a small change in roughness, not emission.
- B: original bifold shutters and four authored lift poses; the browser can step B independently of A/C and wrap back to rest.
- C: original paired evidence folds; attribution is not conflated with the process record.
- Runtime material grain is not an exact Blender render. The subtle runtime Draxis sway is not a full facial acting pass. The ring and both globe states are exported geometry; this is not a flattened animation or image plate.
- Reproduce: `blender -b <input.blend> -t 2 -P production/dot_archive/exports/export_f05.py -- /absolute/path/palimpsest-f05.glb`.
