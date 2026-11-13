export type WorldId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const TOTAL_WORLDS = 10;

export type BookPhase = 'closed' | 'opening' | 'open';

export type WeatherPreset =
  | 'clear'
  | 'overcast'
  | 'rain'
  | 'thunderstorm'
  | 'windy'
  | 'mist';

export type CameraMode = 'inspection' | 'diorama' | 'immersion';

export type InteractionTool =
  | 'explore'
  | 'pageTurn'
  | 'popup'
  | 'river'
  | 'bridge'
  | 'trees'
  | 'sailing'
  | 'constellation'
  | 'creature'
  | 'hiddenLayer'
  | 'magnifier';

export type QualityTier = 'high' | 'medium' | 'low';

export type PortalArchStyle =
  | 'stone'
  | 'maritime'
  | 'sun'
  | 'glacial'
  | 'coral'
  | 'basalt'
  | 'brass'
  | 'mycelium'
  | 'prism'
  | 'meridian';

export interface PortalLink {
  id: string;
  label: string;
  description: string;
  passageText: string;
  sourceWorld: WorldId;
  targetWorld: WorldId;
  archStyle: PortalArchStyle;
  x: number;
  z: number;
  rotationY: number;
}

export interface ChapterStoryBeats {
  vault: string;
  stars: string;
  notes: string;
}

export interface WorldMeta {
  id: WorldId;
  roman: string;
  act: string;
  biome: string;
  title: string;
  subtitle: string;
  folioCode: string;
  chapterTitle: string;
  narrativeLead: string;
  narrativeBody: string;
  storyBeatCue: string;
  paperAssets: string[];
  storyBeats: ChapterStoryBeats;
  accentHex: string;
  ambientHex: string;
  portal: PortalLink;
}

export const WORLD_METADATA: Record<WorldId, WorldMeta> = {
  0: {
    id: 0,
    roman: 'I',
    act: 'Act I · The Unraveling Coast',
    biome: 'Temperate Paper Woodland & River Valley',
    title: 'The Verdant Kingdom',
    subtitle: 'Folded Canopy & Whispering Rivers',
    folioCode: 'Folio I · Sylvan',
    chapterTitle: 'Chapter I · Departure from the Hearth',
    narrativeLead: 'At dawn, the Cartographer unlatched the compass and followed the silver river east.',
    narrativeBody:
      'Before the binding broke, all nine outer realms were tethered to this quiet valley. Look beneath the mossy western ridge: the first shard of the Meridian Compass still hums among glowing roots while the millwheel turns the hours.',
    storyBeatCue: 'Lift the Root Sanctuary Vault, or enter the Valley Weir Gate to reach the Harbor.',
    paperAssets: ['Twin Alpine Ridge Pop-Up', 'Turning Millhouse & Hamlet', 'Root Sanctuary Vault'],
    storyBeats: {
      vault: 'The mossy earth-flap hinges open, revealing the first humming bronze compass shard.',
      stars: 'Pine-crowns answer the Sylvan Crown overhead, lighting a safe ink-trail eastward.',
      notes: 'Marginalia confirms the river does not end in the valley—it carves through the spine.',
    },
    accentHex: '#6FA868',
    ambientHex: '#253324',
    portal: {
      id: 'portal-verdant-harbor',
      label: 'Valley Weir Gate',
      description: 'Follows the silver river eastward to the sea.',
      passageText: 'Pine-clad slopes curl into salt-wind creases as the valley stream widens toward open water.',
      sourceWorld: 0,
      targetWorld: 1,
      archStyle: 'stone',
      x: 0.05,
      z: -1.05,
      rotationY: 0.08,
    },
  },
  1: {
    id: 1,
    roman: 'II',
    act: 'Act I · The Unraveling Coast',
    biome: 'Tidal Cliff & Maritime Shoals',
    title: 'The Forgotten Harbor',
    subtitle: 'Paper Galleons & Tidal Cliffs',
    folioCode: 'Folio II · Maritime',
    chapterTitle: 'Chapter II · Across the Salt Meridian',
    narrativeLead: 'Where the valley river met salt water, a paper galleon waited beneath the Pharos lamp.',
    narrativeBody:
      'No tide ever sweeps this harbor dry. By night, the Pharos Beacon casts a narrow beam toward a smugglers’ sea cave where an old brass astrolabe still ticks in salt air, marking the route beyond the reef.',
    storyBeatCue: 'Chart a sea-lane or enter the Seaward Horizon Gate toward the Celestial Desert.',
    paperAssets: ['Stepped Coastal Citadel', 'Rotating Pharos Lighthouse', 'Origami Merchant Galleons'],
    storyBeats: {
      vault: 'Behind the cliff slab, salt-crusted lockers yield an astrolabe stamped with desert meridians.',
      stars: 'Harbor beacons lock onto the Mariner’s Anchor constellation across the breakwater.',
      notes: 'Logbook entries warn that beyond the eastern strait, water turns to folded dunes.',
    },
    accentHex: '#5A9BB5',
    ambientHex: '#1D2D3B',
    portal: {
      id: 'portal-harbor-desert',
      label: 'Seaward Horizon Gate',
      description: 'Opens across the strait toward dunes of folded parchment.',
      passageText: 'Harbor waves flatten into dry parchment ripples as the eastern cliff archway drinks the sun.',
      sourceWorld: 1,
      targetWorld: 2,
      archStyle: 'maritime',
      x: 2.8,
      z: 0.55,
      rotationY: -0.45,
    },
  },
  2: {
    id: 2,
    roman: 'III',
    act: 'Act I · The Unraveling Coast',
    biome: 'Saffron Origami Dunes & Solar Oasis',
    title: 'The Celestial Desert',
    subtitle: 'Origami Dunes & Astral Orreries',
    folioCode: 'Folio III · Astral',
    chapterTitle: 'Chapter III · The Orrery of Shifting Sands',
    narrativeLead: 'Across the strait rose dunes folded sharp as parchment, crowned by turning brass rings.',
    narrativeBody:
      'Here the Cartographer raised an armillary ziggurat to catch falling starlight. An aqueduct of mirage water cools the sandstone obelisks—redirect its flow and the buried crystal chamber below wakes.',
    storyBeatCue: 'Align the Astral Phoenix stars or enter the Starlight Sun-Gate into the northern frost.',
    paperAssets: ['Armillary Brass Ziggurat', 'Stepped Sandstone Temples', 'Faceted Oasis Crystals'],
    storyBeats: {
      vault: 'Shifting sandstone plates part over a luminous crystal cistern reflecting northern stars.',
      stars: 'The Astral Phoenix ignites, pointing the zenith bearing toward high polar ice.',
      notes: 'Sun-dial calculations prove the next meridian lies frozen under four seasons of snow.',
    },
    accentHex: '#D4AF6E',
    ambientHex: '#3A2B1C',
    portal: {
      id: 'portal-desert-frost',
      label: 'Starlight Sun-Gate',
      description: 'Channels astral light northward toward frozen timberlines.',
      passageText: 'Warm ochre pleats bleach into crystalline frost as solar rings align north.',
      sourceWorld: 2,
      targetWorld: 3,
      archStyle: 'sun',
      x: 0.12,
      z: -1.15,
      rotationY: 0,
    },
  },
  3: {
    id: 3,
    roman: 'IV',
    act: 'Act II · Below & Beyond the Fold',
    biome: 'Sub-Zero Alpine Glacier & Frozen Pines',
    title: 'The Frostbound Spire',
    subtitle: 'Glacial Ridges & Frozen Bells',
    folioCode: 'Folio IV · Boreal',
    chapterTitle: 'Chapter IV · Silence Above the Timberline',
    narrativeLead: 'Northward the ink froze pale as bone, locking an ancient belfry high upon the glacier.',
    narrativeBody:
      'The Cartographer’s ink froze inside the quill as snow wolves tracked the pass. Only when the frozen bell-tower is raised and the ice bridge unfolded across the crevasse does the permafrost vault thaw.',
    storyBeatCue: 'Unfold the Crevasse Span or descend through the Boreal Ice-Arch to the Drowned Library.',
    paperAssets: ['Icebound Belfry Spire', 'Translucent Glacial Archway', 'Frost-Needle Pine Stand'],
    storyBeats: {
      vault: 'Frost shears off the cavern lid to expose deep abyssal stairs carved straight down.',
      stars: 'Ursa Borealis rings the belfry bell once, cracking the sea-ice shelf beneath.',
      notes: 'Marginal notes record the sunken dome of the Athenaeum directly below this glacier.',
    },
    accentHex: '#92C7E8',
    ambientHex: '#1B2D3D',
    portal: {
      id: 'portal-frost-athenaeum',
      label: 'Boreal Ice-Arch',
      description: 'Thaws downward into the submerged marble rotunda.',
      passageText: 'Crystalline ridges melt into translucent cerulean arches as the shelf plunges beneath the tide.',
      sourceWorld: 3,
      targetWorld: 4,
      archStyle: 'glacial',
      x: 0.05,
      z: -1.15,
      rotationY: 0.06,
    },
  },
  4: {
    id: 4,
    roman: 'V',
    act: 'Act II · Below & Beyond the Fold',
    biome: 'Abyssal Coral Trench & Drowned Colonnade',
    title: 'The Sunken Athenaeum',
    subtitle: 'Drowned Colonnades & Coral Scrolls',
    folioCode: 'Folio V · Abyssal',
    chapterTitle: 'Chapter V · The Drowned Library',
    narrativeLead: 'Beneath the northern ice-shelf lay a marble rotunda filled with luminous tides and unread folios.',
    narrativeBody:
      'Long ago, an overambitious binder sank this archive to keep its maps from conquerors. A paper bathysphere glides between coral arches while manta rays guard the sealed vault of drowned scrolls.',
    storyBeatCue: 'Pilot the bathysphere or enter the Abyssal Trench Gate toward the Ember Foundry.',
    paperAssets: ['Sunken Dome Rotunda', 'Coral Arch Colonnade', 'Orbital Brass Astrolabe Rings'],
    storyBeats: {
      vault: 'Barnacled archive tiles lift to unveil sealed copper canisters containing forge schematics.',
      stars: 'Refracted kelp-lamps trace the Trench Serpent path across the sunken ceiling.',
      notes: 'Submerged folios describe volcanic magma shafts heating the ocean floor further down.',
    },
    accentHex: '#4EC2B8',
    ambientHex: '#132E33',
    portal: {
      id: 'portal-athenaeum-ember',
      label: 'Abyssal Trench Gate',
      description: 'Follows rising geothermal steam down into basalt forges.',
      passageText: 'Sea-green terraces fracture into dark hexagonal basalt as geothermal vents ignite below.',
      sourceWorld: 4,
      targetWorld: 5,
      archStyle: 'coral',
      x: 0.05,
      z: 1.55,
      rotationY: 0,
    },
  },
  5: {
    id: 5,
    roman: 'VI',
    act: 'Act II · Below & Beyond the Fold',
    biome: 'Geothermal Basalt Caldera & Forge Terraces',
    title: 'The Ember Foundry',
    subtitle: 'Basalt Forges & Molten Ink',
    folioCode: 'Folio VI · Ignis',
    chapterTitle: 'Chapter VI · The Mountain That Breathes Ink',
    narrativeLead: 'To mend the fractured Meridian Compass, the Cartographer descended into living basalt.',
    narrativeBody:
      'Streams of liquid amber wind between hexagonal cliffs while paper bellows breathe life into the hammer mill. When evening falls, salamanders dance along the magma channel and the crucible glows gold.',
    storyBeatCue: 'Redirect the molten stream or ride the Thermal Updraft Gate into the Clockwork Sky.',
    paperAssets: ['Hexagonal Basalt Caldera', 'Gear-Driven Hammer Mill', 'Molten Ink Crucible Channel'],
    storyBeats: {
      vault: 'Basalt plates slide open over tempered golden cogs forged for an airborne compass.',
      stars: 'Sparks meet the Anvil constellation, tempering the brass needles needed above the clouds.',
      notes: 'Forge ledgers chart the thermal updraft lifting tempered ribs straight into the clouds.',
    },
    accentHex: '#E07442',
    ambientHex: '#331B16',
    portal: {
      id: 'portal-ember-sky',
      label: 'Thermal Updraft Gate',
      description: 'Carries tempered brass skyward on caldera currents.',
      passageText: 'Obsidian cliffs tear free from the hearth and lift on warm updrafts into open sky.',
      sourceWorld: 5,
      targetWorld: 6,
      archStyle: 'basalt',
      x: 0.05,
      z: 1.55,
      rotationY: 0,
    },
  },
  6: {
    id: 6,
    roman: 'VII',
    act: 'Act II · Below & Beyond the Fold',
    biome: 'Tropospheric Cloud Isles & Windmill Spires',
    title: 'The Clockwork Sky',
    subtitle: 'Floating Isles & Windmill Spires',
    folioCode: 'Folio VII · Aether',
    chapterTitle: 'Chapter VII · Islands Moored to Clouds',
    narrativeLead: 'Lightened by forged brass, the Cartographer cast anchor lines upward into drifting cloud-isles.',
    narrativeBody:
      'Giant paper windmills turn in perpetual trade winds, mooring floating terraces above an empty gulf. A paper dirigible ferries star-charts between towers while sky-hawks circle the mooring spire.',
    storyBeatCue: 'Plot a sky-lane or descend via the Cloud-Anchor Gate to the Whispering Mycelium.',
    paperAssets: ['Rotating Windmill Tower', 'Suspended Cloud Islands', 'Brass Airship Mooring Mast'],
    storyBeats: {
      vault: 'A cloud-isle hatch reveals coiled sky-roots plunging down into an unseen twilight forest.',
      stars: 'Trade winds align with the Sky Loom, steadying the dirigible for its final descent.',
      notes: 'Sky-charts reveal that every torn page settles into a bioluminescent hollow far below.',
    },
    accentHex: '#E6C67A',
    ambientHex: '#252B36',
    portal: {
      id: 'portal-sky-mycelium',
      label: 'Cloud-Anchor Gate',
      description: 'Follows dangling sky-roots down into twilight groves.',
      passageText: 'Suspended islands fold downward along braided paper roots into velvet twilight.',
      sourceWorld: 6,
      targetWorld: 7,
      archStyle: 'brass',
      x: 0.0,
      z: 1.55,
      rotationY: 0,
    },
  },
  7: {
    id: 7,
    roman: 'VIII',
    act: 'Act III · The Returning Meridian',
    biome: 'Umbral Bioluminescent Hollow & Root Crypts',
    title: 'The Whispering Mycelium',
    subtitle: 'Bioluminescent Canopy & Root Crypts',
    folioCode: 'Folio VIII · Umbral',
    chapterTitle: 'Chapter VIII · Roots Beneath the Ink',
    narrativeLead: 'Down a hollow banyan trunk, every erased word in the atlas grew into glowing fungi.',
    narrativeBody:
      'In this velvet twilight realm, pleated paper toadstools shed pale cyan spores over a tranquil brook. Paper moths awaken after dusk, leading travelers toward the Heartwood Crypt where old drafts sleep.',
    storyBeatCue: 'Plant luminous flora or step through the Heartwood Mirror Arch to the Glass Archipelago.',
    paperAssets: ['Pleated Toadstool Canopy', 'Tiered Spore Pagoda', 'Heartwood Root Crypt'],
    storyBeats: {
      vault: 'Interlocking violet roots unweave to expose drafts written before the binding split.',
      stars: 'Lantern moths trace the Spore Weaver above the glowing canopy.',
      notes: 'Root-ink inscriptions glimmer beside an obsidian mirror opening onto sunlit lagoons.',
    },
    accentHex: '#9C82E8',
    ambientHex: '#231B38',
    portal: {
      id: 'portal-mycelium-glass',
      label: 'Heartwood Mirror Arch',
      description: 'Reflects twilight spores onto silver-blue lagoons.',
      passageText: 'Velvet spores crystallize into silver mirror facets across calm archipelago waters.',
      sourceWorld: 7,
      targetWorld: 8,
      archStyle: 'mycelium',
      x: 0.15,
      z: 1.55,
      rotationY: 0,
    },
  },
  8: {
    id: 8,
    roman: 'IX',
    act: 'Act III · The Returning Meridian',
    biome: 'Specular Crystal Lagoons & Prism Pavilions',
    title: 'The Glass Archipelago',
    subtitle: 'Prism Pavilions & Mirror Lagoons',
    folioCode: 'Folio IX · Specular',
    chapterTitle: 'Chapter IX · Mirrors of the Returning Tide',
    narrativeLead: 'At the atlas’s rim, translucent lagoons reflected every realm already crossed.',
    narrativeBody:
      'Here the Cartographer understood the secret of Palimpsest: the ink does not merely depict distant lands—it remembers the hands that shaped them. Crystal spires chime in the wind beside a silver catamaran.',
    storyBeatCue: 'Summon the Crystal Heron or enter the Refraction Crown Gate to the Meridian Heart.',
    paperAssets: ['Crystal Prism Pavilion', 'Brass Sundial Court', 'Specular Lagoon Flats'],
    storyBeats: {
      vault: 'Mirrored alabaster slabs fold apart to catch a rainbow beam aimed straight at Chapter X.',
      stars: 'Every prism spire tunes to the Specular Crown, focusing light toward the final binding.',
      notes: 'Silver watermarks unite all eight prior bearings into one golden meridian axis.',
    },
    accentHex: '#B89EE8',
    ambientHex: '#212438',
    portal: {
      id: 'portal-glass-heart',
      label: 'Refraction Crown Gate',
      description: 'Gathers all nine refracted beams toward the final binding.',
      passageText: 'Prismatic lagoons fold inward along golden rays straight toward the center of the spine.',
      sourceWorld: 8,
      targetWorld: 9,
      archStyle: 'prism',
      x: 0.05,
      z: 1.55,
      rotationY: 0,
    },
  },
  9: {
    id: 9,
    roman: 'X',
    act: 'Act III · The Returning Meridian',
    biome: 'Gilded Concentric Mandala & Clockwork Sanctum',
    title: 'The Meridian Heart',
    subtitle: 'Grand Astrolabe & Final Binding',
    folioCode: 'Folio X · Zenith',
    chapterTitle: 'Chapter X · The Final Binding',
    narrativeLead: 'All nine threads converge here around the golden astrolabe—waiting for one final turn.',
    narrativeBody:
      'At the center of the tenth folio stands the Sanctum of the Unbound Meridian. Raise the Great Astrolabe, connect the final crown of stars, and peer through the brass lens to read the Cartographer’s last testament.',
    storyBeatCue: 'Awaken the Grand Astrolabe, or enter the Unbound Meridian Gate back to Dawn.',
    paperAssets: ['Quad-Ring Meridian Astrolabe', 'Chronicler’s Sanctum Spire', 'Gilded Mandala Vault'],
    storyBeats: {
      vault: 'The golden mandala opens, cradling the restored Meridian Heart in steady light.',
      stars: 'All ten constellations lock into resonance—every chapter across the atlas breathes as one.',
      notes: 'The final marginalia reveals the book never ends: each dawn opens the Verdant Valley anew.',
    },
    accentHex: '#F0C96A',
    ambientHex: '#2B2118',
    portal: {
      id: 'portal-heart-verdant',
      label: 'Unbound Meridian Gate',
      description: 'Completes the tenfold ring, returning to the Verdant Kingdom.',
      passageText: 'Concentric gold rings unwind into green valley ridges as dawn breaks over Folio I once more.',
      sourceWorld: 9,
      targetWorld: 0,
      archStyle: 'meridian',
      x: 0.15,
      z: 1.55,
      rotationY: 0,
    },
  },
};

export interface Vec2Point {
  x: number;
  z: number;
}

export interface PopupState {
  id: string;
  label: string;
  pullRatio: number; // 0 (collapsed) .. 1 (raised)
}

export interface BridgeState {
  id: string;
  label: string;
  unfolded: boolean;
}

export type TreeSpecies =
  | 'pine'
  | 'oak'
  | 'blossom'
  | 'cypress'
  | 'palm'
  | 'crystal'
  | 'icepine'
  | 'coral'
  | 'emberfern'
  | 'skybloom'
  | 'mushroom'
  | 'prism'
  | 'goldlotus';

export interface PlantedTreeState {
  id: string;
  x: number;
  z: number;
  species: TreeSpecies;
  scale: number;
  rotation: number;
  plantedAt: number;
}

export interface ShipRouteState {
  shipId: string;
  points: Vec2Point[];
}

export interface ConstellationEdge {
  from: number;
  to: number;
}

export type CreatureKind =
  | 'stag'
  | 'owl'
  | 'fox'
  | 'gull'
  | 'whale'
  | 'crab'
  | 'scarab'
  | 'phoenix'
  | 'fennec'
  | 'wolf'
  | 'moth'
  | 'manta'
  | 'jellyfish'
  | 'serpent'
  | 'salamander'
  | 'beetle'
  | 'hawk'
  | 'finch'
  | 'heron'
  | 'turtle'
  | 'gryphon';

export interface CreatureState {
  id: string;
  sealId: string;
  kind: CreatureKind;
  label: string;
  summoned: boolean;
}

export interface HiddenLayerState {
  id: string;
  label: string;
  revealed: boolean;
}

export interface MagnifierDiscovery {
  worldId: WorldId;
  id: string;
  title: string;
  inscription: string;
  x: number;
  z: number;
}

export interface WorldState {
  id: WorldId;
  popups: PopupState[];
  riverControlPoints: Vec2Point[];
  bridges: BridgeState[];
  plantedTrees: PlantedTreeState[];
  shipRoutes: ShipRouteState[];
  constellationEdges: ConstellationEdge[];
  constellationComplete: boolean;
  creatures: CreatureState[];
  hiddenLayers: HiddenLayerState[];
  discoveredSecrets: string[];
  stainLevel: number;
}

export interface HoverCallout {
  id: string;
  label: string;
  category: string;
  hint: string;
  x: number;
  y: number;
}

export interface MeridianQuestProgress {
  shard1Verdant: boolean;
  shard2Frost: boolean;
  shard3Ember: boolean;
  shardsCollected: number;
  constellationsAligned: number;
  vaultsUnsealed: number;
  canMendMeridian: boolean;
  mendedMeridian: boolean;
}

export interface CrossWorldInfluence {
  riverFlowRatio: number;
  emberHeatFactor: number;
  totalTreesPlanted: number;
  skyWindBoost: number;
  constellationsAligned: number;
}

export type NarrationStatus = 'idle' | 'speaking' | 'paused';

export interface AtlasSnapshot {
  bookPhase: BookPhase;
  activeWorld: WorldId;
  turningToWorld: WorldId | null;
  turnProgress: number;
  timeOfDay: number;
  autoTime: boolean;
  weather: WeatherPreset;
  cameraMode: CameraMode;
  activeTool: InteractionTool;
  audioMuted: boolean;
  narrationEnabled: boolean;
  narratorVoiceId: string;
  narrationStatus: NarrationStatus;
  narrationCaption: string | null;
  narrationSpeakerLabel: string | null;
  narrationProgress: { line: number; total: number } | null;
  candleLit: boolean;
  stampedWorlds: WorldId[];
  mendedMeridian: boolean;
  reducedMotion: boolean;
  qualityTier: QualityTier;
  hudCollapsed: boolean;
  chronicleOpen: boolean;
  portalTransition: {
    active: boolean;
    fromWorld: WorldId;
    toWorld: WorldId;
    progress: number;
    portalLabel: string;
  } | null;
  hoveredPortal: PortalLink | null;
  hoveredProp: HoverCallout | null;
  magnifierActive: boolean;
  magnifierPos: Vec2Point;
  activeSecret: MagnifierDiscovery | null;
  statusHint: string;
  visitedWorlds: WorldId[];
  worlds: WorldState[];
}

export interface ToolDescriptor {
  id: InteractionTool;
  label: string;
  shortHint: string;
  shortcut: string;
}

export const INTERACTION_TOOLS: ToolDescriptor[] = [
  {
    id: 'explore',
    label: 'Explore',
    shortHint: 'Click any glowing tab, seal, or corner hotspot directly on the spread.',
    shortcut: 'E',
  },
  {
    id: 'pageTurn',
    label: 'Turn Page',
    shortHint: 'Drag a gilded bottom page corner or use the turn arrows to move across all 10 folios.',
    shortcut: 'P',
  },
  {
    id: 'popup',
    label: 'Pop-Up Tabs',
    shortHint: 'Pull or click paper margin tabs to raise and fold mountains, spires, and engines.',
    shortcut: 'U',
  },
  {
    id: 'river',
    label: 'River Bend',
    shortHint: 'Drag glowing water control beads to reshape rivers, magma streams, and sky channels.',
    shortcut: 'R',
  },
  {
    id: 'bridge',
    label: 'Bridges',
    shortHint: 'Click bridge anchor seals to accordion-unfold paper spans across chasms.',
    shortcut: 'B',
  },
  {
    id: 'trees',
    label: 'Ink Seeds',
    shortHint: 'Click terrain clearings to drop magical ink seeds and grow folded paper flora.',
    shortcut: 'G',
  },
  {
    id: 'sailing',
    label: 'Sail Routes',
    shortHint: 'Draw or click waypoints across water, magma, or clouds to chart vessel courses.',
    shortcut: 'S',
  },
  {
    id: 'constellation',
    label: 'Stars',
    shortHint: 'Connect luminous star pins in the sky dome to weave animated constellations.',
    shortcut: 'C',
  },
  {
    id: 'creature',
    label: 'Summon',
    shortHint: 'Press crimson wax seals on the page to unfold animated origami creatures.',
    shortcut: 'M',
  },
  {
    id: 'hiddenLayer',
    label: 'Hidden Layers',
    shortHint: 'Lift hinged paper terrain flaps to uncover subterranean vaults and secret chambers.',
    shortcut: 'L',
  },
  {
    id: 'magnifier',
    label: 'Magnifier',
    shortHint: 'Drag the brass magnifying lens across the spread to read secret Cartographer notes.',
    shortcut: 'F',
  },
];
