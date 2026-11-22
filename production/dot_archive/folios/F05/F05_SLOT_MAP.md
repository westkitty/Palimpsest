# F05 · The Standard of Conquest
**Year 3 · Fallenstar Prime.** Separate editable Blender candidate; the living book, official assets, manuscript and audio are unchanged.

## Source of truth
Pinned to `westkitty/Palimpsest@86d6f4214af204dbbe347a04f7aa9e18f18b7876`:
- [Authored F05 world, planet, cutaway, and evidence cards](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/engine/folios/FoliosWar1.ts#L183-L415)
- [Living stagecraft crest, construction motifs, and four B markers](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/livingStagecraft.ts#L16-L23), [four apertures](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/livingStagecraft.ts#L161-L174), and [step gating](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/livingStagecraft.ts#L304-L312)
- [History manifest](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/story/historyManifest.ts#L795-L971) governs surviving documentary distinctions and stage naming.
- [Draxis procedural Ringthroat](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/engine/drakken/DraxisModels.ts#L835-L887) and [Gorevault](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/engine/drakken/DraxisModels.ts#L1115-L1179), [catalogue](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/production/history_v1/DRAXIS_21.json). The meshes are paper translations of those authorized **procedural silhouettes**, not claims of replacing the original plates.

## Editable keys and review stills
| State | Frame | Review | Mechanism or meaning |
|---|---:|---|---|
| Arrival | 1 | `F05_01_Arrival.png` | Green/slate world, open sky; machine shapes visible through genuine door slits; zero inspection markers. |
| A / After | 38 | `F05_02_Orbital_Ring.png` | Finger tab has slid, globe darkened, and opaque, closed, faceted glass-iron band physically encircles it. No emission, aura or transparent outline. |
| B1 | 65 | `F05_03_B1_Input.png` | Both inspection bifolds clear the view. Input/harvest aperture and first marker rise. Paper strata stand for harvested people and matter; there is no graphic imagery. |
| B2 | 85 | `F05_04_B2_Conversion.png` | Second leaf and marker add Gorevault (044) conversion; first remains. |
| B3 | 105 | `F05_05_B3_Extrusion.png` | Third leaf and marker add Ringthroat (029) extrusion. Cyan marks are confined to the authored machine details and do not belong on the planetary Blood Ring. |
| B4 | 126 | `F05_06_B4_Cutaway.png` | Fourth leaf and marker add the solid vitrified orbital-ring cross-section, in the inspection camera. |
| C / overview | 159 | `F05_07_Hero.png` | Two evidence plaques fold toward review while the prior mechanisms stay settled. |
| C / reading proof | 159 | `F05_08_Doctrine_and_Record.png` | Verbatim public doctrine is visibly attributed; opposite cream plaque presents the factual material/process record. No projection of hidden marginalia or invented witness. |

## Assembly and verification
Brass paper lattice shutters have real open slits, fixed pin joints, and a second synchronized return fold that exposes the cutaway without crossing the final standing record. Four solid punched aperture boards have hinges bonded into the book and open only at their own steps. This adapts the run-time outward swing, four marker gates and paired C sheets into a Blender review mechanism; it does not implement keyboard/state code or change official assets. The Blender timeline is animated; the submitted proofs are stills.

`blender -b -t 2 -P build_f05.py` creates the scene. `blender -b Palimpsest_F05_The_Standard_of_Conquest.blend -t 3 -P render_f05.py` renders the eight review PNGs. `blender -b Palimpsest_F05_The_Standard_of_Conquest.blend -t 2 -P verify_f05.py` checks the seven states, physical joint samples, ring topology and shading, silhouette counts, text separation and absence of public marginalia and audio.
