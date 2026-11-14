export type WorldId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const TOTAL_WORLDS = 12;
export const TOTAL_FOLIOS = 12;

export type FolioId =
  | 'f01'
  | 'f02'
  | 'f03'
  | 'f04'
  | 'f05'
  | 'f06'
  | 'f07'
  | 'f08'
  | 'f09'
  | 'f10'
  | 'f11'
  | 'f12';

export type FolioInteractionSlot = 'A' | 'B' | 'C';

export type FolioInteractionId =
  | 'f01_a' | 'f01_b' | 'f01_c'
  | 'f02_a' | 'f02_b' | 'f02_c'
  | 'f03_a' | 'f03_b' | 'f03_c'
  | 'f04_a' | 'f04_b' | 'f04_c'
  | 'f05_a' | 'f05_b' | 'f05_c'
  | 'f06_a' | 'f06_b' | 'f06_c'
  | 'f07_a' | 'f07_b' | 'f07_c'
  | 'f08_a' | 'f08_b' | 'f08_c'
  | 'f09_a' | 'f09_b' | 'f09_c'
  | 'f10_a' | 'f10_b' | 'f10_c'
  | 'f11_a' | 'f11_b' | 'f11_c'
  | 'f12_a' | 'f12_b' | 'f12_c';

export type CueSlot = 'OPEN' | 'LESSON' | 'A' | 'B' | 'C' | 'CLOSE';

export type CueId =
  | 'BOOK_IMPRINT'
  | 'BOOK_PROLOGUE'
  | 'BOOK_ENDCARD'
  | `${Uppercase<FolioId>}_${CueSlot}`;

export type BookPhase = 'closed' | 'opening' | 'open';

export type PeriodEra = 'early' | 'prewar' | 'war' | 'aftermath';

export type WeatherPreset = 'projection' | 'archival' | 'muted';

export type CameraMode = 'inspection' | 'diorama' | 'immersion';

export type InteractionTool = 'explore' | 'interact' | 'magnifier' | 'pageTurn';

export type QualityTier = 'high' | 'medium' | 'low';

export type EvidenceKind =
  | 'source-fact'
  | 'historical-quotation'
  | 'editorial-illustration'
  | 'demonstration'
  | 'uncertainty';

export type DraxisId =
  | '001' | '003' | '004' | '005' | '008' | '009' | '012'
  | '015' | '019' | '023' | '026' | '029' | '030' | '032'
  | '036' | '037' | '044' | '045' | '055' | '059' | '060';

export interface DraxisSpec {
  id: DraxisId;
  name: string;
  category: 'strain' | 'genesis';
  thesis: 'Pyric' | 'Aqueous' | 'Telluric' | 'Aeric' | 'Umbral' | 'Genesis';
  silhouetteNote: string;
  operationalRole: string;
  folioLinks: FolioId[];
}

export interface SourceNote {
  id: string;
  kind: EvidenceKind;
  heading: string;
  body: string;
  sourceRef: string;
  verbatim?: boolean;
}

export interface PeriodPalette {
  era: PeriodEra;
  label: string;
  paperInner: string;
  paperMid: string;
  paperEdge: string;
  accentHex: string;
  secondaryHex: string;
  washRgba: string;
  lineRgba: string;
  inkHex: string;
  ambientHex: string;
}

export interface FolioCueSegment {
  cueId: CueId;
  slot: CueSlot | 'PROLOGUE' | 'ENDCARD' | 'IMPRINT';
  heading: string;
  paragraphs: string[];
}

export interface FolioInteractionDef {
  id: FolioInteractionId;
  slot: FolioInteractionSlot;
  type: 'flap' | 'dial' | 'nodes' | 'triptych' | 'slider' | 'cutaway' | 'plates' | 'drum' | 'toggle' | 'trigger';
  label: string;
  description: string;
  visualInput: string;
  visualTransformation: string;
  visualOutput: string;
  persistPolicy: 'reversible' | 'stepped' | 'irreversible';
  maxSteps?: number;
  narrationSegmentId: CueId;
  keyboardLabel: string;
  textEquivalent: string;
}

export interface FolioManifest {
  worldId: WorldId;
  id: FolioId;
  code: string;
  roman: string;
  chapterIndex: number;
  title: string;
  subtitle: string;
  eraLabel: string;
  temporalMarker: string;
  chronologyEventIds: string[];
  sourcePointers: { label: string; url: string }[];
  historicalActors: string[];
  uncertaintyNotes: string[];
  sourceNotes: SourceNote[];
  periodPalette: PeriodPalette;
  sceneFactoryKey: FolioId;
  visualCues: string[];
  narrationSegmentIds: CueId[];
  cues: Record<CueSlot, FolioCueSegment>;
  interactions: [FolioInteractionDef, FolioInteractionDef, FolioInteractionDef];
  prevFolio: FolioId | null;
  nextFolio: FolioId | null;
  completedRules: string;
}

export interface FolioInteractionRuntimeState {
  active: boolean;
  step: number;
  maxSteps: number;
  locked: boolean; // true for irreducible historical demonstrations such as f09_a
}

export interface FolioRuntimeState {
  id: WorldId;
  folioId: FolioId;
  interactions: Record<FolioInteractionSlot, FolioInteractionRuntimeState>;
  discoveredSecrets: string[];
  selectedCampaignIndex: number;
  wearLevel: number;
}

export interface Vec2Point {
  x: number;
  z: number;
}

export interface MagnifierDiscovery {
  worldId: WorldId;
  folioId: FolioId;
  id: string;
  title: string;
  inscription: string;
  sourceKind: EvidenceKind;
  x: number;
  z: number;
}

export interface HoverCallout {
  id: string;
  label: string;
  category: string;
  hint: string;
  x: number;
  y: number;
}

export type NarrationStatus = 'idle' | 'speaking' | 'paused';
export type NarrationCapability = 'transcript-only' | 'browser-speech';

export interface AtlasSnapshot {
  bookPhase: BookPhase;
  activeWorld: WorldId;
  activeFolioId: FolioId;
  turningToWorld: WorldId | null;
  turnProgress: number;
  cameraMode: CameraMode;
  activeTool: InteractionTool;
  audioMuted: boolean;
  narrationEnabled: boolean;
  captionsVisible: boolean;
  narrationCapability: NarrationCapability;
  narrationStatus: NarrationStatus;
  narrationCueId: CueId | null;
  narrationCaption: string | null;
  narrationSpeakerLabel: string | null;
  narrationProgress: { line: number; total: number } | null;
  reducedMotion: boolean;
  noFlashMode: boolean;
  nonWebglMode: boolean;
  qualityTier: QualityTier;
  hudCollapsed: boolean;
  chronicleOpen: boolean;
  endcardOpen: boolean;
  hoveredProp: HoverCallout | null;
  magnifierActive: boolean;
  magnifierPos: Vec2Point;
  activeSecret: MagnifierDiscovery | null;
  activeDraxisId: DraxisId | null;
  statusHint: string;
  visitedWorlds: WorldId[];
  completedFolios: WorldId[];
  bookWearLevel: number;
  worlds: FolioRuntimeState[];
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
    label: 'Inspect & Operate',
    shortHint: 'Click diagrams, hinged tabs, dials, or cutaway plates directly on the 4:3 folio aperture.',
    shortcut: 'E',
  },
  {
    id: 'interact',
    label: 'Mechanisms A/B/C',
    shortHint: 'Step through the three causal demonstrations (keys A, B, C) inside the current folio.',
    shortcut: 'M',
  },
  {
    id: 'magnifier',
    label: 'Lens Inspection',
    shortHint: 'Move the archival lens across the spread (or WASD / arrow keys) to read marginal source records.',
    shortcut: 'F',
  },
  {
    id: 'pageTurn',
    label: 'Turn Folio',
    shortHint: 'Drag a page corner or press [ / ] or Left/Right arrows to move across F01–F12.',
    shortcut: 'P',
  },
];

export const DRAXIS_CATALOG_VERSION = 'palimpsest-draxis-reference/1';
