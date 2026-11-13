export type WorldId = 0 | 1 | 2;

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

export interface WorldMeta {
  id: WorldId;
  roman: string;
  title: string;
  subtitle: string;
  folioCode: string;
  accentHex: string;
}

export const WORLD_METADATA: Record<WorldId, WorldMeta> = {
  0: {
    id: 0,
    roman: 'I',
    title: 'The Verdant Kingdom',
    subtitle: 'Folded Canopy & Whispering Rivers',
    folioCode: 'Folio I · Sylvan',
    accentHex: '#6FA868',
  },
  1: {
    id: 1,
    roman: 'II',
    title: 'The Forgotten Harbor',
    subtitle: 'Paper Galleons & Tidal Cliffs',
    folioCode: 'Folio II · Maritime',
    accentHex: '#5A9BB5',
  },
  2: {
    id: 2,
    roman: 'III',
    title: 'The Celestial Desert',
    subtitle: 'Origami Dunes & Astral Orreries',
    folioCode: 'Folio III · Astral',
    accentHex: '#D4AF6E',
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

export interface PlantedTreeState {
  id: string;
  x: number;
  z: number;
  species: 'pine' | 'oak' | 'blossom' | 'cypress' | 'palm' | 'crystal';
  scale: number;
  rotation: number;
  plantedAt: number; // elapsed seconds when planted
}

export interface ShipRouteState {
  shipId: string;
  points: Vec2Point[];
}

export interface ConstellationEdge {
  from: number;
  to: number;
}

export interface CreatureState {
  id: string;
  sealId: string;
  kind:
    | 'stag'
    | 'owl'
    | 'fox'
    | 'gull'
    | 'whale'
    | 'crab'
    | 'scarab'
    | 'phoenix'
    | 'fennec';
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
}

export interface AtlasSnapshot {
  bookPhase: BookPhase;
  activeWorld: WorldId;
  turningToWorld: WorldId | null;
  turnProgress: number; // 0..1 when turning
  timeOfDay: number; // 0..24
  autoTime: boolean;
  weather: WeatherPreset;
  cameraMode: CameraMode;
  activeTool: InteractionTool;
  audioMuted: boolean;
  reducedMotion: boolean;
  qualityTier: QualityTier;
  hudCollapsed: boolean;
  magnifierActive: boolean;
  magnifierPos: Vec2Point;
  activeSecret: MagnifierDiscovery | null;
  statusHint: string;
  worlds: [WorldState, WorldState, WorldState];
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
    shortHint: 'Drag a gilded bottom page corner or use the turn arrows to bend between worlds.',
    shortcut: 'P',
  },
  {
    id: 'popup',
    label: 'Pop-Up Tabs',
    shortHint: 'Pull or click paper margin tabs to raise and fold mountains, towers, and keeps.',
    shortcut: 'U',
  },
  {
    id: 'river',
    label: 'River Bend',
    shortHint: 'Drag glowing water control beads to reshape rivers, channels, and mirage streams.',
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
    shortHint: 'Click terrain clearings to drop magical ink seeds and grow folded paper trees.',
    shortcut: 'G',
  },
  {
    id: 'sailing',
    label: 'Sail Routes',
    shortHint: 'Draw or click waypoints across water and dunes to chart paths for paper vessels.',
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
    shortHint: 'Drag the brass magnifying lens across the spread to read secret ink runes.',
    shortcut: 'F',
  },
];
