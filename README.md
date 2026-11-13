# Palimpsest — The Impossible Living Atlas

An interactive 3D magical pop-up storybook built with Three.js, React, TypeScript, and Vite.

## Features

- **Candlelit Antiquarian Tome**: Embossed leather and gold-leaf cover resting on a walnut desk with candlelit props. Unclasp the cover to unfold miniature 3D paper-engineered worlds.
- **Ten Living Worlds & Coherent Chronicle** (with persistent independent state across Folios I–X):
  1. **I · The Verdant Kingdom**: Layered paper hills, cascading waterfall peaks, Tudor mill village, winding Emerald River, and Root Sanctuary Vault.
  2. **II · The Forgotten Harbor**: Animated ocean waves, Pharos lighthouse with rotating night beam, maritime citadel, sailing galleons, and Smuggler's Sea Cave.
  3. **III · The Celestial Desert**: Origami sand dunes, rotating brass astral orrery ziggurat, crystal sun temple, mirage aqueduct, and Sunken Crystal Vault.
  4. **IV · The Frostbound Spire**: Glacial ridges, swinging icebound belfry spire, frozen falls, boreal pines, snow wolves, and Permafrost Ice Cavern.
  5. **V · The Sunken Athenaeum**: Drowned rotunda dome, coral arch colonnade, bathysphere vessel, manta rays, and Drowned Scroll Vault.
  6. **VI · The Ember Foundry**: Basalt caldera cascade, bellows & hammer mill, molten ember stream, magma barge, and Magma Crucible Vault.
  7. **VII · The Clockwork Sky**: Floating cloud islands, spinning windmill spire, airship mooring mast, paper dirigible, and Cloud-Core Engine.
  8. **VIII · The Whispering Mycelium**: Bioluminescent toadstool canopy, spore lantern pagoda, twilight brook, luna moths, and Ancient Heartwood Crypt.
  9. **IX · The Glass Archipelago**: Crystal prism pavilion, mirror sundial court, refracting lagoons, catamaran, crystal heron, and Mirror-Glass Grotto.
  10. **X · The Meridian Heart**: Rotating Grand Meridian Astrolabe, Chronicler's Sanctum, golden lotus flora, golden gryphon, and Architect's Final Chamber.
- **Cartographer's Chronicle (`N`)**: Follow the ten-chapter narrative arc of *The Unbound Meridian* and recover 20 secret journal inscriptions via the Magical Magnifier.
- **24-Hour Day/Night Cycle & 6 Weather Presets**: Orbiting sun/moon, dynamic shadows, nocturnal illumination, stars, plus Clear, Overcast, Rain, Thunderstorm, Windy, and Mist conditions.
- **Ten Paper-Engineered Interactive Systems**:
  1. Physical Page Turning (drag corners or turn controls)
  2. Pop-Up Engineering (pull margin tabs)
  3. River Redirection (drag water spline beads)
  4. Folding Bridges (unfold accordion spans)
  5. Paper Tree Cultivation (plant ink seeds)
  6. Sailing Routes (draw routes for paper ships)
  7. Constellation Drawing (connect sky dome star nodes)
  8. Creature Summoning (press wax seals to unfold origami fauna)
  9. Hidden Layers (lift hinged terrain flaps to reveal underground chambers)
  10. Magical Magnifier (glide the brass glass lens to reveal secret ink marginalia)
- **Three Camera Modes**: Desk Inspection (`1`), Diorama Close-Up (`2`), and Miniature Immersion (`3` with `WASD`/Arrow or touch navigation).
- **Procedural Web Audio & Adaptive Quality**: Synthesized paper rustles, weather ambience, chimes, plus adaptive mobile quality and reduced-motion support.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Production Build

```bash
npm run lint
npm run build
```
