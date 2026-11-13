import {
  AtlasSnapshot,
  BookPhase,
  CameraMode,
  CrossWorldInfluence,
  HoverCallout,
  INTERACTION_TOOLS,
  InteractionTool,
  MagnifierDiscovery,
  MeridianQuestProgress,
  NarrationStatus,
  PlantedTreeState,
  PortalLink,
  QualityTier,
  TOTAL_WORLDS,
  Vec2Point,
  WeatherPreset,
  WORLD_METADATA,
  WorldId,
  WorldState,
} from '../types/atlas';

export const ATLAS_STORAGE_KEY = 'palimpsest_atlas_save_v1';

const VALID_WEATHERS = new Set<WeatherPreset>([
  'clear',
  'overcast',
  'rain',
  'thunderstorm',
  'windy',
  'mist',
]);

export function computeMeridianQuestProgress(
  worlds: WorldState[],
  mendedMeridian: boolean,
): MeridianQuestProgress {
  const shard1Verdant = Boolean(worlds[0]?.hiddenLayers.some((hl) => hl.revealed));
  const shard2Frost = Boolean(worlds[3]?.hiddenLayers.some((hl) => hl.revealed));
  const shard3Ember = Boolean(worlds[5]?.hiddenLayers.some((hl) => hl.revealed));
  const shardsCollected =
    (shard1Verdant ? 1 : 0) + (shard2Frost ? 1 : 0) + (shard3Ember ? 1 : 0);
  const constellationsAligned = worlds.filter((w) => w.constellationComplete).length;
  const vaultsUnsealed = worlds.filter((w) => w.hiddenLayers.some((hl) => hl.revealed)).length;

  return {
    shard1Verdant,
    shard2Frost,
    shard3Ember,
    shardsCollected,
    constellationsAligned,
    vaultsUnsealed,
    canMendMeridian: shardsCollected >= 3,
    mendedMeridian,
  };
}

export function computeCrossWorldInfluence(worlds: WorldState[]): CrossWorldInfluence {
  const verdant = worlds[0];
  let riverSpread = 0;
  if (verdant && verdant.riverControlPoints.length >= 2) {
    for (let i = 1; i < verdant.riverControlPoints.length; i++) {
      const prev = verdant.riverControlPoints[i - 1];
      const cur = verdant.riverControlPoints[i];
      riverSpread += Math.hypot(cur.x - prev.x, cur.z - prev.z);
    }
  }
  // Baseline span ~8.2 units across page -> normalized 0.6..1.75
  const riverFlowRatio = Math.max(0.6, Math.min(1.75, riverSpread / 7.8 || 1.0));

  const ember = worlds[5];
  let emberHeatFactor = 0.12;
  if (ember) {
    if (ember.hiddenLayers.some((hl) => hl.revealed)) emberHeatFactor += 0.48;
    if (ember.constellationComplete) emberHeatFactor += 0.25;
    const avgPop =
      ember.popups.reduce((acc, p) => acc + p.pullRatio, 0) /
      Math.max(1, ember.popups.length);
    emberHeatFactor += avgPop * 0.15;
  }
  emberHeatFactor = Math.max(0, Math.min(1, emberHeatFactor));

  const totalTreesPlanted = worlds
    .slice(0, 8)
    .reduce((acc, w) => acc + w.plantedTrees.length, 0);

  const sky = worlds[6];
  let skyWindBoost = 1.0;
  if (sky) {
    if (sky.constellationComplete) skyWindBoost += 0.35;
    if (sky.hiddenLayers.some((hl) => hl.revealed)) skyWindBoost += 0.25;
  }

  const constellationsAligned = worlds.filter((w) => w.constellationComplete).length;

  return {
    riverFlowRatio,
    emberHeatFactor,
    totalTreesPlanted,
    skyWindBoost,
    constellationsAligned,
  };
}

function createInitialWorlds(): WorldState[] {
  return [
    // 0: The Verdant Kingdom
    {
      id: 0,
      popups: [
        { id: 'kingdom-peaks', label: 'Highland Crags & Falls', pullRatio: 1 },
        { id: 'kingdom-village', label: 'Whispering Mill Village', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.2, z: -2.0 },
        { x: -1.1, z: -0.6 },
        { x: 0.7, z: 0.5 },
        { x: 2.4, z: 1.7 },
        { x: 3.6, z: 2.5 },
      ],
      bridges: [
        { id: 'kingdom-bridge-west', label: 'Stone-Crest Span', unfolded: false },
        { id: 'kingdom-bridge-east', label: 'Millstream Arch', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-k-1', x: -2.4, z: 1.3, species: 'pine', scale: 1.0, rotation: 0.3, plantedAt: -10 },
        { id: 'seed-k-2', x: 1.6, z: -1.5, species: 'blossom', scale: 0.95, rotation: 1.2, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'kingdom-skiff',
          points: [
            { x: -2.5, z: -1.5 },
            { x: -0.9, z: -0.4 },
            { x: 0.9, z: 0.6 },
            { x: 2.8, z: 1.9 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'k-stag', sealId: 'seal-k-stag', kind: 'stag', label: 'Sylvan Stag', summoned: true },
        { id: 'k-owl', sealId: 'seal-k-owl', kind: 'owl', label: 'Clockwork Owl', summoned: false },
        { id: 'k-fox', sealId: 'seal-k-fox', kind: 'fox', label: 'Lantern Fox', summoned: false },
      ],
      hiddenLayers: [{ id: 'k-grotto', label: 'Root Sanctuary Vault', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.12,
    },
    // 1: The Forgotten Harbor
    {
      id: 1,
      popups: [
        { id: 'harbor-lighthouse', label: 'Pharos Beacon Tower', pullRatio: 1 },
        { id: 'harbor-citadel', label: 'Harbor Citadel & Pier', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.5, z: 1.1 },
        { x: -1.6, z: 0.7 },
        { x: 0.4, z: 0.2 },
        { x: 2.1, z: -0.6 },
        { x: 3.7, z: -1.3 },
      ],
      bridges: [
        { id: 'harbor-drawbridge', label: 'Lighthouse Causeway', unfolded: false },
        { id: 'harbor-pier-span', label: 'Admiralty Pontoon', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-h-1', x: -2.7, z: -1.6, species: 'cypress', scale: 1.0, rotation: 0.6, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'harbor-galleon',
          points: [
            { x: -2.8, z: 1.5 },
            { x: -0.6, z: 1.1 },
            { x: 1.4, z: 0.3 },
            { x: 3.0, z: -0.8 },
          ],
        },
        {
          shipId: 'harbor-sloop',
          points: [
            { x: 2.5, z: 1.8 },
            { x: 0.7, z: 1.4 },
            { x: -1.3, z: 0.5 },
            { x: -2.8, z: 1.8 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'h-gull', sealId: 'seal-h-gull', kind: 'gull', label: 'Paper Albatross', summoned: true },
        { id: 'h-whale', sealId: 'seal-h-whale', kind: 'whale', label: 'Leviathan Fin', summoned: false },
        { id: 'h-crab', sealId: 'seal-h-crab', kind: 'crab', label: 'Pier Hermit', summoned: false },
      ],
      hiddenLayers: [{ id: 'h-cove', label: "Smuggler's Sea Cave", revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.14,
    },
    // 2: The Celestial Desert
    {
      id: 2,
      popups: [
        { id: 'desert-orrery', label: 'Astral Orrery Ziggurat', pullRatio: 1 },
        { id: 'desert-temple', label: 'Sun Obelisk Temple', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.2, z: 1.8 },
        { x: -1.3, z: 0.9 },
        { x: 0.5, z: -0.2 },
        { x: 2.0, z: -1.1 },
        { x: 3.5, z: -1.9 },
      ],
      bridges: [
        { id: 'desert-span-1', label: 'Meridian Archway', unfolded: false },
        { id: 'desert-span-2', label: 'Observatory Walk', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-d-1', x: -1.8, z: 1.5, species: 'palm', scale: 1.0, rotation: 0.9, plantedAt: -10 },
        { id: 'seed-d-2', x: 1.9, z: -1.6, species: 'crystal', scale: 1.0, rotation: 0.4, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'desert-skiff',
          points: [
            { x: -2.7, z: -1.4 },
            { x: -0.8, z: -0.7 },
            { x: 1.1, z: 0.7 },
            { x: 2.9, z: 1.6 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'd-scarab', sealId: 'seal-d-scarab', kind: 'scarab', label: 'Gilded Scarab', summoned: true },
        { id: 'd-phoenix', sealId: 'seal-d-phoenix', kind: 'phoenix', label: 'Star Phoenix', summoned: false },
        { id: 'd-fennec', sealId: 'seal-d-fennec', kind: 'fennec', label: 'Dune Fennec', summoned: false },
      ],
      hiddenLayers: [{ id: 'd-vault', label: 'Sunken Crystal Vault', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.1,
    },
    // 3: The Frostbound Spire
    {
      id: 3,
      popups: [
        { id: 'frost-belfry', label: 'Icebound Belfry Spire', pullRatio: 1 },
        { id: 'frost-glacier', label: 'Glacial Arch & Falls', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.3, z: -1.6 },
        { x: -1.4, z: -0.5 },
        { x: 0.2, z: 0.2 },
        { x: 1.9, z: 1.1 },
        { x: 3.4, z: 1.9 },
      ],
      bridges: [
        { id: 'frost-crevasse', label: 'Crevasse Ice Span', unfolded: false },
        { id: 'frost-bellway', label: 'Belfry Causeway', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-f-1', x: -2.8, z: 1.4, species: 'icepine', scale: 1.0, rotation: 0.2, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'frost-sled',
          points: [
            { x: -2.6, z: -1.2 },
            { x: -0.9, z: -0.2 },
            { x: 1.1, z: 0.8 },
            { x: 2.8, z: 1.6 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'f-wolf', sealId: 'seal-f-wolf', kind: 'wolf', label: 'Snow Wolf', summoned: true },
        { id: 'f-owl', sealId: 'seal-f-owl', kind: 'owl', label: 'Boreal Owl', summoned: false },
        { id: 'f-moth', sealId: 'seal-f-moth', kind: 'moth', label: 'Frost Moth', summoned: false },
      ],
      hiddenLayers: [{ id: 'f-cavern', label: 'Permafrost Ice Cavern', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.12,
    },
    // 4: The Sunken Athenaeum
    {
      id: 4,
      popups: [
        { id: 'abyss-rotunda', label: 'Sunken Dome Rotunda', pullRatio: 1 },
        { id: 'abyss-colonnade', label: 'Coral Arch Colonnade', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.4, z: 0.9 },
        { x: -1.5, z: -0.3 },
        { x: 0.3, z: -0.9 },
        { x: 2.0, z: 0.1 },
        { x: 3.4, z: 1.2 },
      ],
      bridges: [
        { id: 'abyss-arch-1', label: 'Tidal Reading Span', unfolded: false },
        { id: 'abyss-arch-2', label: 'Scriptorium Bridge', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-a-1', x: -2.3, z: 1.6, species: 'coral', scale: 1.0, rotation: 0.4, plantedAt: -10 },
        { id: 'seed-a-2', x: 2.4, z: -1.5, species: 'coral', scale: 0.9, rotation: 1.1, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'abyss-bathysphere',
          points: [
            { x: -2.7, z: 0.7 },
            { x: -0.8, z: -0.3 },
            { x: 1.2, z: -0.4 },
            { x: 2.8, z: 0.9 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'a-manta', sealId: 'seal-a-manta', kind: 'manta', label: 'Paper Manta', summoned: true },
        { id: 'a-jelly', sealId: 'seal-a-jelly', kind: 'jellyfish', label: 'Lantern Jelly', summoned: false },
        { id: 'a-serpent', sealId: 'seal-a-serpent', kind: 'serpent', label: 'Archive Wyrm', summoned: false },
      ],
      hiddenLayers: [{ id: 'a-vault', label: 'Drowned Scroll Vault', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.16,
    },
    // 5: The Ember Foundry
    {
      id: 5,
      popups: [
        { id: 'ember-volcano', label: 'Caldera Magma Cascade', pullRatio: 1 },
        { id: 'ember-forge', label: 'Bellows & Hammer Mill', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -2.8, z: -1.5 },
        { x: -1.0, z: -0.8 },
        { x: 0.6, z: 0.3 },
        { x: 2.1, z: 1.2 },
        { x: 3.4, z: 2.0 },
      ],
      bridges: [
        { id: 'ember-span-1', label: 'Obsidian Drawbridge', unfolded: false },
        { id: 'ember-span-2', label: 'Anvil Gantry', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-e-1', x: -2.5, z: 1.5, species: 'emberfern', scale: 1.0, rotation: 0.7, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'ember-barge',
          points: [
            { x: -2.2, z: -1.2 },
            { x: -0.5, z: -0.4 },
            { x: 1.2, z: 0.7 },
            { x: 2.9, z: 1.7 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'e-salamander', sealId: 'seal-e-salamander', kind: 'salamander', label: 'Cinder Salamander', summoned: true },
        { id: 'e-beetle', sealId: 'seal-e-beetle', kind: 'beetle', label: 'Brass Anvil Beetle', summoned: false },
        { id: 'e-phoenix', sealId: 'seal-e-phoenix', kind: 'phoenix', label: 'Spark Phoenix', summoned: false },
      ],
      hiddenLayers: [{ id: 'e-crucible', label: 'Magma Crucible Vault', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.14,
    },
    // 6: The Clockwork Sky
    {
      id: 6,
      popups: [
        { id: 'sky-windmill', label: 'Grand Windmill Spire', pullRatio: 1 },
        { id: 'sky-mooring', label: 'Airship Mooring Mast', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.4, z: -0.8 },
        { x: -1.4, z: -1.2 },
        { x: 0.3, z: -0.1 },
        { x: 1.9, z: 0.9 },
        { x: 3.4, z: 0.5 },
      ],
      bridges: [
        { id: 'sky-span-1', label: 'Gale Rope Span', unfolded: false },
        { id: 'sky-span-2', label: 'Cloud-Walk Arch', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-s-1', x: -2.3, z: 1.3, species: 'skybloom', scale: 1.0, rotation: 0.5, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'sky-dirigible',
          points: [
            { x: -2.8, z: -0.7 },
            { x: -0.7, z: -1.0 },
            { x: 1.3, z: 0.4 },
            { x: 2.9, z: 0.6 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 's-hawk', sealId: 'seal-s-hawk', kind: 'hawk', label: 'Gale Sky-Hawk', summoned: true },
        { id: 's-finch', sealId: 'seal-s-finch', kind: 'finch', label: 'Clockwork Finch', summoned: false },
        { id: 's-moth', sealId: 'seal-s-moth', kind: 'moth', label: 'Aether Moth', summoned: false },
      ],
      hiddenLayers: [{ id: 's-engine', label: 'Cloud-Core Engine', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.1,
    },
    // 7: The Whispering Mycelium
    {
      id: 7,
      popups: [
        { id: 'mycel-canopy', label: 'Giant Toadstool Crown', pullRatio: 1 },
        { id: 'mycel-pagoda', label: 'Spore Lantern Pagoda', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.1, z: 1.6 },
        { x: -1.2, z: 0.6 },
        { x: 0.4, z: -0.3 },
        { x: 2.0, z: -1.0 },
        { x: 3.4, z: -1.6 },
      ],
      bridges: [
        { id: 'mycel-span-1', label: 'Cap-Rim Crossing', unfolded: false },
        { id: 'mycel-span-2', label: 'Pagoda Root Bridge', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-m-1', x: -2.4, z: -1.4, species: 'mushroom', scale: 1.1, rotation: 0.3, plantedAt: -10 },
        { id: 'seed-m-2', x: 2.2, z: 1.3, species: 'mushroom', scale: 0.95, rotation: 1.5, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'mycel-gondola',
          points: [
            { x: -2.6, z: 1.3 },
            { x: -0.7, z: 0.4 },
            { x: 1.2, z: -0.6 },
            { x: 2.8, z: -1.3 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'm-stag', sealId: 'seal-m-stag', kind: 'stag', label: 'Spore Hart', summoned: true },
        { id: 'm-moth', sealId: 'seal-m-moth', kind: 'moth', label: 'Umbral Luna Moth', summoned: false },
        { id: 'm-fox', sealId: 'seal-m-fox', kind: 'fox', label: 'Mycelial Fox', summoned: false },
      ],
      hiddenLayers: [{ id: 'm-crypt', label: 'Ancient Heartwood Crypt', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.15,
    },
    // 8: The Glass Archipelago
    {
      id: 8,
      popups: [
        { id: 'glass-pavilion', label: 'Crystal Prism Pavilion', pullRatio: 1 },
        { id: 'glass-sundial', label: 'Mirror Sundial Court', pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.3, z: -1.2 },
        { x: -1.3, z: -0.2 },
        { x: 0.2, z: 0.8 },
        { x: 1.8, z: 0.2 },
        { x: 3.4, z: -0.9 },
      ],
      bridges: [
        { id: 'glass-span-1', label: 'Prism Causeway', unfolded: false },
        { id: 'glass-span-2', label: 'Lagoon Mirror Span', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-g-1', x: -2.6, z: 1.5, species: 'prism', scale: 1.0, rotation: 0.8, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'glass-catamaran',
          points: [
            { x: -2.8, z: -1.0 },
            { x: -0.9, z: 0.1 },
            { x: 1.1, z: 0.5 },
            { x: 2.9, z: -0.6 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'g-heron', sealId: 'seal-g-heron', kind: 'heron', label: 'Crystal Heron', summoned: true },
        { id: 'g-turtle', sealId: 'seal-g-turtle', kind: 'turtle', label: 'Prism Terrapin', summoned: false },
        { id: 'g-fox', sealId: 'seal-g-fox', kind: 'fox', label: 'Moonlight Vixen', summoned: false },
      ],
      hiddenLayers: [{ id: 'g-grotto', label: 'Mirror-Glass Grotto', revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.11,
    },
    // 9: The Meridian Heart
    {
      id: 9,
      popups: [
        { id: 'heart-astrolabe', label: 'Grand Meridian Astrolabe', pullRatio: 1 },
        { id: 'heart-sanctum', label: "Chronicler's Sanctum", pullRatio: 1 },
      ],
      riverControlPoints: [
        { x: -3.2, z: 1.2 },
        { x: -1.3, z: 1.5 },
        { x: 0.1, z: 0.4 },
        { x: 1.6, z: -1.2 },
        { x: 3.2, z: -1.4 },
      ],
      bridges: [
        { id: 'heart-span-1', label: 'Golden Spine Bridge', unfolded: false },
        { id: 'heart-span-2', label: 'Zenith Walk', unfolded: true },
      ],
      plantedTrees: [
        { id: 'seed-z-1', x: -2.5, z: -1.5, species: 'goldlotus', scale: 1.05, rotation: 0.2, plantedAt: -10 },
        { id: 'seed-z-2', x: 2.5, z: 1.4, species: 'goldlotus', scale: 1.05, rotation: 1.4, plantedAt: -10 },
      ],
      shipRoutes: [
        {
          shipId: 'heart-barge',
          points: [
            { x: -2.7, z: 1.0 },
            { x: -0.6, z: 1.3 },
            { x: 1.2, z: -0.7 },
            { x: 2.8, z: -1.1 },
          ],
        },
      ],
      constellationEdges: [],
      constellationComplete: false,
      creatures: [
        { id: 'z-gryphon', sealId: 'seal-z-gryphon', kind: 'gryphon', label: 'Golden Gryphon', summoned: true },
        { id: 'z-owl', sealId: 'seal-z-owl', kind: 'owl', label: 'Astral Archivist', summoned: false },
        { id: 'z-stag', sealId: 'seal-z-stag', kind: 'stag', label: 'Meridian Hart', summoned: false },
      ],
      hiddenLayers: [{ id: 'z-chamber', label: "Architect's Final Chamber", revealed: false }],
      discoveredSecrets: [],
      stainLevel: 0.12,
    },
  ];
}

export const MAGNIFIER_SECRETS: MagnifierDiscovery[] = [
  // 0
  {
    worldId: 0,
    id: 'k-secret-root',
    title: 'Journal I · The Broken Meridian',
    inscription: '“I left the first compass shard under the mossy ridge. Follow the river where paper oaks remember spring.”',
    x: -1.75,
    z: 1.2,
  },
  {
    worldId: 0,
    id: 'k-secret-mill',
    title: 'Journal I · Millwright’s Cipher',
    inscription: '“The millwheel turns nine times before the harbor bell answers from Folio II.”',
    x: 1.8,
    z: -0.8,
  },
  // 1
  {
    worldId: 1,
    id: 'h-secret-tide',
    title: 'Journal II · Fathom XIV',
    inscription: '“Beneath Pharos Point sleeps a brass astrolabe; its needle points not north, but toward the Orrery dunes.”',
    x: -1.9,
    z: -1.0,
  },
  {
    worldId: 1,
    id: 'h-secret-fleet',
    title: 'Journal II · Harbor Master’s Log',
    inscription: '“Folded keels survive every paper tempest—steer between the twin beacons to find the southern desert.”',
    x: 1.75,
    z: 1.1,
  },
  // 2
  {
    worldId: 2,
    id: 'd-secret-orrery',
    title: 'Journal III · Ephemeris of Brass',
    inscription: '“The desert stars spell a northward ascent toward ice and frozen bells.”',
    x: -1.5,
    z: -1.1,
  },
  {
    worldId: 2,
    id: 'd-secret-oasis',
    title: 'Journal III · Mirage Rubric',
    inscription: '“Draw water across dry creases and crystalline blooms will mark the buried staircase.”',
    x: 1.85,
    z: 1.2,
  },
  // 3
  {
    worldId: 3,
    id: 'f-secret-bell',
    title: 'Journal IV · The Frozen Chime',
    inscription: '“Inside the belfry spire, ice preserves the sound of the First Binding like amber.”',
    x: -1.8,
    z: -0.9,
  },
  {
    worldId: 3,
    id: 'f-secret-crevasse',
    title: 'Journal IV · Below the Glacier',
    inscription: '“Deep beneath the permafrost lies the stair descending into the Drowned Library.”',
    x: 1.7,
    z: 1.15,
  },
  // 4
  {
    worldId: 4,
    id: 'a-secret-rotunda',
    title: 'Journal V · Sunken Catalog',
    inscription: '“Saltwater dissolved the ink of lesser kings, leaving only the luminous brass annotations intact.”',
    x: -1.75,
    z: -1.0,
  },
  {
    worldId: 4,
    id: 'a-secret-trench',
    title: 'Journal V · Abyssal Heat',
    inscription: '“Steam rises through the lower spine—beyond the drowned shelves burns the Ember Foundry.”',
    x: 1.8,
    z: 1.0,
  },
  // 5
  {
    worldId: 5,
    id: 'e-secret-anvil',
    title: 'Journal VI · Tempering the Compass',
    inscription: '“In molten paper-gold I recast the cracked ring, yet it still lacked the breath of high winds.”',
    x: -1.65,
    z: 1.15,
  },
  {
    worldId: 5,
    id: 'e-secret-chimney',
    title: 'Journal VI · Updraft Note',
    inscription: '“Ride the warm thermal upward past the caldera; cloud islands await above the smoke.”',
    x: 1.85,
    z: -0.95,
  },
  // 6
  {
    worldId: 6,
    id: 's-secret-vane',
    title: 'Journal VII · Trade-Wind Chart',
    inscription: '“The windmills do not grind grain—they wind the mainspring that keeps all ten folios aloft.”',
    x: -1.7,
    z: -0.95,
  },
  {
    worldId: 6,
    id: 's-secret-roots',
    title: 'Journal VII · Hanging Anchor',
    inscription: '“Follow the dangling cloud-roots downward into the quiet indigo of the Whispering Mycelium.”',
    x: 1.75,
    z: 1.15,
  },
  // 7
  {
    worldId: 7,
    id: 'm-secret-spore',
    title: 'Journal VIII · Memory of Ink',
    inscription: '“Every crossed-out draft I ever wrote bloomed here as glowing velvet caps.”',
    x: -1.8,
    z: 1.1,
  },
  {
    worldId: 7,
    id: 'm-secret-crypt',
    title: 'Journal VIII · Heartwood Door',
    inscription: '“Through the crypt’s silver mirror lies the Glass Archipelago of returning tides.”',
    x: 1.7,
    z: -1.0,
  },
  // 8
  {
    worldId: 8,
    id: 'g-secret-prism',
    title: 'Journal IX · Refraction IX',
    inscription: '“Hold the lens to the crystal court: all eight preceding realms shine back within a single facet.”',
    x: -1.75,
    z: -1.05,
  },
  {
    worldId: 8,
    id: 'g-secret-horizon',
    title: 'Journal IX · The Penultimate Fold',
    inscription: '“One crease remains. Turn to Folio X to reunite the Meridian Heart.”',
    x: 1.8,
    z: 1.05,
  },
  // 9
  {
    worldId: 9,
    id: 'z-secret-astrolabe',
    title: 'Journal X · The Final Binding',
    inscription: '“I bound myself inside these pages so the atlas would never go silent. Turn any leaf—the world lives in your hands.”',
    x: -1.65,
    z: -0.95,
  },
  {
    worldId: 9,
    id: 'z-secret-signature',
    title: 'Journal X · Cartographer’s Colophon',
    inscription: '“Ten realms folded as one living palimpsest. May every reader chart new rivers and wake new stars.”',
    x: 1.75,
    z: 1.15,
  },
];

type Listener = (snapshot: AtlasSnapshot) => void;

interface PersistedAtlasSave {
  version: number;
  activeWorld: WorldId;
  timeOfDay: number;
  autoTime: boolean;
  weather: WeatherPreset;
  narrationEnabled: boolean;
  narratorVoiceId: string;
  candleLit: boolean;
  stampedWorlds: WorldId[];
  mendedMeridian: boolean;
  visitedWorlds: WorldId[];
  worlds: WorldState[];
}

function hydrateWorldState(base: WorldState, saved?: Partial<WorldState>): WorldState {
  if (!saved) return base;
  return {
    ...base,
    popups: base.popups.map((p) => {
      const match = saved.popups?.find((sp) => sp.id === p.id);
      return match && typeof match.pullRatio === 'number'
        ? { ...p, pullRatio: Math.max(0, Math.min(1, match.pullRatio)) }
        : p;
    }),
    riverControlPoints:
      Array.isArray(saved.riverControlPoints) && saved.riverControlPoints.length === base.riverControlPoints.length
        ? saved.riverControlPoints.map((pt, i) => ({
            x: typeof pt?.x === 'number' ? pt.x : base.riverControlPoints[i].x,
            z: typeof pt?.z === 'number' ? pt.z : base.riverControlPoints[i].z,
          }))
        : base.riverControlPoints,
    bridges: base.bridges.map((b) => {
      const match = saved.bridges?.find((sb) => sb.id === b.id);
      return match && typeof match.unfolded === 'boolean' ? { ...b, unfolded: match.unfolded } : b;
    }),
    plantedTrees: Array.isArray(saved.plantedTrees)
      ? saved.plantedTrees.slice(0, 24)
      : base.plantedTrees,
    shipRoutes:
      Array.isArray(saved.shipRoutes) && saved.shipRoutes.length > 0
        ? saved.shipRoutes
        : base.shipRoutes,
    constellationEdges: Array.isArray(saved.constellationEdges)
      ? saved.constellationEdges
      : base.constellationEdges,
    constellationComplete: Boolean(saved.constellationComplete),
    creatures: base.creatures.map((c) => {
      const match = saved.creatures?.find((sc) => sc.id === c.id);
      return match && typeof match.summoned === 'boolean' ? { ...c, summoned: match.summoned } : c;
    }),
    hiddenLayers: base.hiddenLayers.map((hl) => {
      const match = saved.hiddenLayers?.find((sh) => sh.id === hl.id);
      return match && typeof match.revealed === 'boolean' ? { ...hl, revealed: match.revealed } : hl;
    }),
    discoveredSecrets: Array.isArray(saved.discoveredSecrets)
      ? saved.discoveredSecrets
      : base.discoveredSecrets,
    stainLevel:
      typeof saved.stainLevel === 'number'
        ? Math.max(0, Math.min(1, saved.stainLevel))
        : base.stainLevel,
  };
}

class AtlasStore {
  private state: AtlasSnapshot;
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

    let worlds = createInitialWorlds();
    let activeWorld: WorldId = 0;
    let timeOfDay = 10.2;
    let autoTime = true;
    let weather: WeatherPreset = 'clear';
    let narrationEnabled = true;
    let narratorVoiceId = 'Charon';
    let candleLit = true;
    let stampedWorlds: WorldId[] = [];
    let mendedMeridian = false;
    let visitedWorlds: WorldId[] = [0];

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(ATLAS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedAtlasSave>;
          if (parsed && parsed.version === 1) {
            if (typeof parsed.activeWorld === 'number' && parsed.activeWorld >= 0 && parsed.activeWorld < TOTAL_WORLDS) {
              activeWorld = parsed.activeWorld as WorldId;
            }
            if (typeof parsed.timeOfDay === 'number' && Number.isFinite(parsed.timeOfDay)) {
              timeOfDay = ((parsed.timeOfDay % 24) + 24) % 24;
            }
            if (typeof parsed.autoTime === 'boolean') autoTime = parsed.autoTime;
            if (parsed.weather && VALID_WEATHERS.has(parsed.weather)) weather = parsed.weather;
            if (typeof parsed.narrationEnabled === 'boolean') narrationEnabled = parsed.narrationEnabled;
            if (typeof parsed.narratorVoiceId === 'string' && parsed.narratorVoiceId) {
              narratorVoiceId = parsed.narratorVoiceId;
            }
            if (typeof parsed.candleLit === 'boolean') candleLit = parsed.candleLit;
            if (Array.isArray(parsed.stampedWorlds)) {
              stampedWorlds = parsed.stampedWorlds.filter(
                (w): w is WorldId => typeof w === 'number' && w >= 0 && w < TOTAL_WORLDS,
              );
            }
            if (typeof parsed.mendedMeridian === 'boolean') mendedMeridian = parsed.mendedMeridian;
            if (Array.isArray(parsed.visitedWorlds) && parsed.visitedWorlds.length > 0) {
              visitedWorlds = parsed.visitedWorlds.filter(
                (w): w is WorldId => typeof w === 'number' && w >= 0 && w < TOTAL_WORLDS,
              );
              if (!visitedWorlds.includes(activeWorld)) visitedWorlds.push(activeWorld);
            }
            if (Array.isArray(parsed.worlds)) {
              worlds = worlds.map((baseW, idx) => hydrateWorldState(baseW, parsed.worlds?.[idx]));
            }
          }
        }
      }
    } catch {
      // Ignore storage parsing errors cleanly
    }

    this.state = {
      bookPhase: 'closed',
      activeWorld,
      turningToWorld: null,
      turnProgress: 0,
      timeOfDay,
      autoTime,
      weather,
      cameraMode: 'inspection',
      activeTool: 'explore',
      audioMuted: false,
      narrationEnabled,
      narratorVoiceId,
      narrationStatus: 'idle',
      narrationCaption: null,
      narrationSpeakerLabel: null,
      narrationProgress: null,
      candleLit,
      stampedWorlds,
      mendedMeridian,
      reducedMotion: Boolean(prefersReduced),
      qualityTier: isMobile ? 'medium' : 'high',
      hudCollapsed: true,
      chronicleOpen: false,
      portalTransition: null,
      hoveredPortal: null,
      hoveredProp: null,
      magnifierActive: false,
      magnifierPos: { x: 0, z: 0 },
      activeSecret: null,
      statusHint: 'Click the brass clasp or press Space to unseal the living atlas.',
      visitedWorlds,
      worlds,
    };
  }

  public getSnapshot(): AtlasSnapshot {
    return this.state;
  }

  public getMeridianQuestProgress(): MeridianQuestProgress {
    return computeMeridianQuestProgress(this.state.worlds, this.state.mendedMeridian);
  }

  public getCrossWorldInfluence(): CrossWorldInfluence {
    return computeCrossWorldInfluence(this.state.worlds);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private scheduleSave(immediate = false): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const writeNow = () => {
      try {
        const payload: PersistedAtlasSave = {
          version: 1,
          activeWorld: this.state.activeWorld,
          timeOfDay: this.state.timeOfDay,
          autoTime: this.state.autoTime,
          weather: this.state.weather,
          narrationEnabled: this.state.narrationEnabled,
          narratorVoiceId: this.state.narratorVoiceId,
          candleLit: this.state.candleLit,
          stampedWorlds: this.state.stampedWorlds,
          mendedMeridian: this.state.mendedMeridian,
          visitedWorlds: this.state.visitedWorlds,
          worlds: this.state.worlds,
        };
        window.localStorage.setItem(ATLAS_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Non-fatal if storage quota exceeded or disabled
      }
    };

    if (this.saveTimer !== null) {
      globalThis.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (immediate) {
      writeNow();
    } else {
      this.saveTimer = globalThis.setTimeout(writeNow, 420);
    }
  }

  private emit(persist = true): void {
    this.state = { ...this.state };
    this.listeners.forEach((l) => l(this.state));
    if (persist) {
      this.scheduleSave(false);
    }
  }

  public setBookPhase(phase: BookPhase): void {
    if (this.state.bookPhase === phase) return;
    this.state.bookPhase = phase;
    if (phase === 'opening') {
      const meta = WORLD_METADATA[this.state.activeWorld];
      this.state.statusHint = `Unfolding Folio ${meta.roman} — ${meta.chapterTitle}...`;
    } else if (phase === 'open') {
      this.state.cameraMode = 'diorama';
      this.state.statusHint = WORLD_METADATA[this.state.activeWorld].storyBeatCue;
    } else {
      this.state.cameraMode = 'inspection';
      this.state.magnifierActive = false;
      this.state.chronicleOpen = false;
      this.state.hoveredProp = null;
      this.state.statusHint = 'Click the brass clasp or press Space to unseal the living atlas.';
    }
    this.emit(false);
  }

  public setActiveWorld(world: WorldId): void {
    this.state.activeWorld = world;
    this.state.turningToWorld = null;
    this.state.turnProgress = 0;
    this.state.activeSecret = null;
    if (!this.state.visitedWorlds.includes(world)) {
      this.state.visitedWorlds = [...this.state.visitedWorlds, world];
    }
    this.state.statusHint = WORLD_METADATA[world].storyBeatCue;
    this.emit();
  }

  public setPageTurnState(target: WorldId | null, progress: number): void {
    this.state.turningToWorld = target;
    this.state.turnProgress = progress;
    this.emit();
  }

  public setPortalTransitionState(
    transition: AtlasSnapshot['portalTransition'],
  ): void {
    this.state.portalTransition = transition;
    if (transition?.active) {
      const destMeta = WORLD_METADATA[transition.toWorld];
      this.state.statusHint = `Crossing ${transition.portalLabel} → ${destMeta.folioCode}: ${destMeta.title}`;
    }
    this.emit();
  }

  public setHoveredPortal(portal: PortalLink | null): void {
    const prevId = this.state.hoveredPortal?.id ?? null;
    const nextId = portal?.id ?? null;
    if (prevId === nextId) return;
    this.state.hoveredPortal = portal;
    if (portal && !this.state.portalTransition?.active) {
      const destMeta = WORLD_METADATA[portal.targetWorld];
      this.state.statusHint = `${portal.label} → ${destMeta.folioCode} (${destMeta.title}) — click to cross.`;
    } else if (!portal && !this.state.portalTransition?.active) {
      this.state.statusHint = WORLD_METADATA[this.state.activeWorld].storyBeatCue;
    }
    this.emit();
  }

  public setTimeOfDay(hours: number, emitEvent = true): void {
    this.state.timeOfDay = ((hours % 24) + 24) % 24;
    if (emitEvent) this.emit();
  }

  public advanceTimeQuietly(hours: number): void {
    this.state.timeOfDay = ((hours % 24) + 24) % 24;
  }

  public advanceWorldStainQuietly(worldId: WorldId, delta: number): void {
    const world = this.state.worlds[worldId];
    if (!world || delta <= 0) return;
    world.stainLevel = Math.min(1, world.stainLevel + delta);
  }

  public blotWorldStain(worldId: WorldId): void {
    const world = this.state.worlds[worldId];
    if (!world) return;
    world.stainLevel = 0.06;
    this.state.statusHint = `Parchment margins on Folio ${WORLD_METADATA[worldId].roman} gently blotted dry.`;
    this.emit();
  }

  public notify(): void {
    this.emit();
  }

  public setAutoTime(auto: boolean): void {
    this.state.autoTime = auto;
    this.emit();
  }

  public setWeather(weather: WeatherPreset): void {
    this.state.weather = weather;
    const labels: Record<WeatherPreset, string> = {
      clear: 'Clear skies over the parchment spread.',
      overcast: 'Soft paper clouds drift above the valley.',
      rain: 'Gentle ink rain ripples across the water.',
      thunderstorm: 'Lightning illuminates the folded peaks and tempest.',
      windy: 'Breezes sway paper pines, sails, and page corners.',
      mist: 'Translucent valley mist settles along the creases.',
    };
    this.state.statusHint = labels[weather];
    this.emit();
  }

  public setCameraMode(mode: CameraMode): void {
    this.state.cameraMode = mode;
    if (mode === 'immersion') {
      this.state.statusHint = 'Immersion view: WASD or drag to roam inside the illustrated world.';
    } else if (mode === 'diorama') {
      this.state.statusHint = this.getDefaultToolHint(this.state.activeTool);
    } else {
      this.state.statusHint = 'Desk inspection: Orbit around the leather-bound atlas.';
    }
    this.emit();
  }

  public setActiveTool(tool: InteractionTool): void {
    this.state.activeTool = tool;
    this.state.magnifierActive = tool === 'magnifier';
    if (tool !== 'magnifier') {
      this.state.activeSecret = null;
    }
    if (tool === 'constellation' && this.state.timeOfDay > 6 && this.state.timeOfDay < 18.5) {
      this.state.timeOfDay = 21.2;
      this.state.autoTime = false;
    }
    this.state.statusHint = this.getDefaultToolHint(tool);
    this.emit();
  }

  public setAudioMuted(muted: boolean): void {
    this.state.audioMuted = muted;
    this.emit();
  }

  public setNarrationEnabled(enabled: boolean): void {
    this.state.narrationEnabled = enabled;
    this.emit();
  }

  public setNarrationState(
    status: NarrationStatus,
    caption: string | null,
    speakerLabel: string | null,
    progress: { line: number; total: number } | null,
  ): void {
    this.state = {
      ...this.state,
      narrationStatus: status,
      narrationCaption: caption,
      narrationSpeakerLabel: speakerLabel,
      narrationProgress: progress,
    };
    this.listeners.forEach((l) => l(this.state));
  }

  public setReducedMotion(reduced: boolean): void {
    this.state.reducedMotion = reduced;
    this.emit();
  }

  public setQualityTier(tier: QualityTier): void {
    this.state.qualityTier = tier;
    this.emit();
  }

  public setHudCollapsed(collapsed: boolean): void {
    this.state.hudCollapsed = collapsed;
    this.emit();
  }

  public setChronicleOpen(open: boolean): void {
    this.state.chronicleOpen = open;
    this.emit();
  }

  public setHoveredProp(prop: HoverCallout | null): void {
    const prev = this.state.hoveredProp;
    if (
      prev?.id === prop?.id &&
      Math.abs((prev?.x ?? 0) - (prop?.x ?? 0)) < 2 &&
      Math.abs((prev?.y ?? 0) - (prop?.y ?? 0)) < 2
    ) {
      return;
    }
    this.state.hoveredProp = prop;
    this.emit(false);
  }

  public toggleCandle(): boolean {
    this.state.candleLit = !this.state.candleLit;
    this.state.statusHint = this.state.candleLit
      ? 'Atelier tallow candle lit — warm amber shadows cast across the vellum.'
      : 'Atelier candle snuffed — ambient twilight cools the desk.';
    this.emit(true);
    return this.state.candleLit;
  }

  public stampWorld(worldId: WorldId): boolean {
    const already = this.state.stampedWorlds.includes(worldId);
    if (!already) {
      this.state.stampedWorlds = [...this.state.stampedWorlds, worldId];
    }
    this.state.statusHint = already
      ? `Folio ${WORLD_METADATA[worldId].roman} bears Aldous’s crimson Meridian wax seal.`
      : `Stamped Folio ${WORLD_METADATA[worldId].roman} with the crimson Meridian seal.`;
    this.scheduleSave(true);
    this.emit(false);
    return !already;
  }

  public mendMeridian(): boolean {
    const quest = this.getMeridianQuestProgress();
    if (!quest.canMendMeridian) {
      this.state.statusHint = `Recover all 3 Meridian Shards (Folios I, IV, VI) before uniting the Heart (${quest.shardsCollected}/3).`;
      this.emit(false);
      return false;
    }
    this.state.mendedMeridian = true;
    this.state.statusHint =
      'The Tenfold Meridian Heart is whole! All ten folios resonate as one continuous world.';
    this.scheduleSave(true);
    this.emit(false);
    return true;
  }

  public resetChronicle(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ATLAS_STORAGE_KEY);
      }
    } catch {
      // Ignore storage removal errors
    }
    this.state.worlds = createInitialWorlds();
    this.state.visitedWorlds = [0];
    this.state.activeWorld = 0;
    this.state.stampedWorlds = [];
    this.state.mendedMeridian = false;
    this.state.candleLit = true;
    this.state.timeOfDay = 10.2;
    this.state.autoTime = true;
    this.state.weather = 'clear';
    this.state.activeSecret = null;
    this.state.hoveredProp = null;
    this.state.statusHint = 'Chronicle bound fresh — Folio I awaits at dawn.';
    this.scheduleSave(true);
    this.emit(false);
  }

  public setNarratorVoiceId(voiceId: string): void {
    this.state.narratorVoiceId = voiceId;
    this.emit(true);
  }

  public setStatusHint(hint: string): void {
    this.state.statusHint = hint;
    this.emit(false);
  }

  public updatePopupRatio(worldId: WorldId, popupId: string, ratio: number): void {
    const world = this.state.worlds[worldId];
    const target = world.popups.find((p) => p.id === popupId);
    if (!target) return;
    target.pullRatio = Math.max(0, Math.min(1, ratio));
    this.state.statusHint = `${target.label}: ${Math.round(target.pullRatio * 100)}% unfolded.`;
    this.emit();
  }

  public togglePopup(worldId: WorldId, popupId: string): number {
    const world = this.state.worlds[worldId];
    const target = world.popups.find((p) => p.id === popupId);
    if (!target) return 1;
    const next = target.pullRatio > 0.5 ? 0.08 : 1;
    target.pullRatio = next;
    this.state.statusHint = `${target.label} ${next > 0.5 ? 'raised' : 'folded flat'}.`;
    this.emit();
    return next;
  }

  public updateRiverPoint(worldId: WorldId, index: number, point: Vec2Point): void {
    const world = this.state.worlds[worldId];
    if (!world.riverControlPoints[index]) return;
    world.riverControlPoints[index] = {
      x: Math.max(-3.6, Math.min(3.6, point.x)),
      z: Math.max(-2.3, Math.min(2.3, point.z)),
    };
    this.state.statusHint = 'Channel geometry reshaped across the parchment.';
    this.emit();
  }

  public toggleBridge(worldId: WorldId, bridgeId: string): boolean {
    const world = this.state.worlds[worldId];
    const bridge = world.bridges.find((b) => b.id === bridgeId);
    if (!bridge) return false;
    bridge.unfolded = !bridge.unfolded;
    this.state.statusHint = `${bridge.label} ${bridge.unfolded ? 'unfolded across the crossing' : 'folded away'}.`;
    this.emit();
    return bridge.unfolded;
  }

  public addPlantedTree(worldId: WorldId, tree: PlantedTreeState): void {
    const world = this.state.worlds[worldId];
    if (world.plantedTrees.length >= 24) {
      world.plantedTrees.shift();
    }
    world.plantedTrees.push(tree);
    this.state.statusHint = `Ink seed rooted — sprouting a folded ${tree.species} structure.`;
    this.emit();
  }

  public setShipRoute(worldId: WorldId, shipId: string, points: Vec2Point[]): void {
    const world = this.state.worlds[worldId];
    const existing = world.shipRoutes.find((r) => r.shipId === shipId);
    if (existing) {
      existing.points = points;
    } else {
      world.shipRoutes.push({ shipId, points });
    }
    this.state.statusHint = `Plotted ${points.length}-waypoint course.`;
    this.emit();
  }

  public toggleConstellationEdge(worldId: WorldId, from: number, to: number): boolean {
    if (from === to) return false;
    const world = this.state.worlds[worldId];
    const a = Math.min(from, to);
    const b = Math.max(from, to);
    const exists = world.constellationEdges.some((e) => e.from === a && e.to === b);
    if (!exists) {
      world.constellationEdges.push({ from: a, to: b });
      if (world.constellationEdges.length >= 5) {
        world.constellationComplete = true;
        this.state.statusHint = 'Celestial constellation aligned — chapter star magic awakened!';
      } else {
        this.state.statusHint = `Star thread woven (${world.constellationEdges.length}/5 to complete pattern).`;
      }
      this.emit();
      return true;
    }
    return false;
  }

  public toggleCreature(worldId: WorldId, creatureId: string): boolean {
    const world = this.state.worlds[worldId];
    const creature = world.creatures.find((c) => c.id === creatureId);
    if (!creature) return false;
    creature.summoned = !creature.summoned;
    this.state.statusHint = creature.summoned
      ? `${creature.label} unfolded onto the spread.`
      : `${creature.label} returned to its wax seal.`;
    this.emit();
    return creature.summoned;
  }

  public toggleHiddenLayer(worldId: WorldId, layerId: string): boolean {
    const world = this.state.worlds[worldId];
    const layer = world.hiddenLayers.find((l) => l.id === layerId);
    if (!layer) return false;
    layer.revealed = !layer.revealed;
    this.state.statusHint = layer.revealed
      ? `Hinged section lifted: ${layer.label} revealed.`
      : `${layer.label} closed flush with the terrain.`;
    this.emit();
    return layer.revealed;
  }

  public updateMagnifier(pos: Vec2Point): void {
    this.state.magnifierPos = {
      x: Math.max(-3.6, Math.min(3.6, pos.x)),
      z: Math.max(-2.3, Math.min(2.3, pos.z)),
    };
    const worldId = this.state.activeWorld;
    const world = this.state.worlds[worldId];
    const found = MAGNIFIER_SECRETS.find(
      (s) =>
        s.worldId === worldId &&
        Math.hypot(s.x - this.state.magnifierPos.x, s.z - this.state.magnifierPos.z) < 0.85,
    );
    const prevId = this.state.activeSecret?.id ?? null;
    const nextId = found?.id ?? null;
    this.state.activeSecret = found ?? null;
    if (found && !world.discoveredSecrets.includes(found.id)) {
      world.discoveredSecrets.push(found.id);
    }
    if (prevId !== nextId) {
      if (found) {
        this.state.statusHint = `Secret uncovered: ${found.title}`;
      }
      this.emit();
    }
  }

  private getDefaultToolHint(tool: InteractionTool): string {
    return (
      INTERACTION_TOOLS.find((t) => t.id === tool)?.shortHint ??
      'Explore the three-dimensional living atlas.'
    );
  }
}

export const atlasStore = new AtlasStore();
