import {
  AtlasSnapshot,
  BookPhase,
  CameraMode,
  INTERACTION_TOOLS,
  InteractionTool,
  MagnifierDiscovery,
  PlantedTreeState,
  QualityTier,
  Vec2Point,
  WeatherPreset,
  WorldId,
  WorldState,
} from '../types/atlas';

function createInitialWorlds(): [WorldState, WorldState, WorldState] {
  return [
    // World 0: The Verdant Kingdom
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
      hiddenLayers: [
        { id: 'k-grotto', label: 'Root Sanctuary Vault', revealed: false },
      ],
      discoveredSecrets: [],
    },
    // World 1: The Forgotten Harbor
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
      hiddenLayers: [
        { id: 'h-cove', label: "Smuggler's Sea Cave", revealed: false },
      ],
      discoveredSecrets: [],
    },
    // World 2: The Celestial Desert
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
      hiddenLayers: [
        { id: 'd-vault', label: 'Sunken Crystal Vault', revealed: false },
      ],
      discoveredSecrets: [],
    },
  ];
}

export const MAGNIFIER_SECRETS: MagnifierDiscovery[] = [
  // World 0
  {
    worldId: 0,
    id: 'k-secret-root',
    title: 'Cartographer’s Marginalia · Sylvan Roots',
    inscription: '“Beneath the folded ridge, the silver mycelium remembers every rainstorm since the First Binding.”',
    x: -1.75,
    z: 1.2,
  },
  {
    worldId: 0,
    id: 'k-secret-mill',
    title: 'Millwright Cipher',
    inscription: '“Turn the waterwheel at dusk when lanterns wake; seven sparks mark the ancient crossing.”',
    x: 1.8,
    z: -0.8,
  },
  // World 1
  {
    worldId: 1,
    id: 'h-secret-tide',
    title: 'Admiralty Sounding Note',
    inscription: '“Fathom XIV off Pharos Point: a brass astrolabe still ticks beneath the smuggler’s cove.”',
    x: -1.9,
    z: -1.0,
  },
  {
    worldId: 1,
    id: 'h-secret-fleet',
    title: 'Harbor Master’s Seal',
    inscription: '“Origami keels never sink in paper storms; chart their wakes between the twin beacons.”',
    x: 1.75,
    z: 1.1,
  },
  // World 2
  {
    worldId: 2,
    id: 'd-secret-orrery',
    title: 'Astronomer’s Ephemeris',
    inscription: '“When the seventh zenith star is threaded, the brass rings align with the buried crystal chamber.”',
    x: -1.5,
    z: -1.1,
  },
  {
    worldId: 2,
    id: 'd-secret-oasis',
    title: 'Mirage Aqueduct Rubric',
    inscription: '“Ink water drawn across folded dunes awakens crystalline palms that sing in starlight.”',
    x: 1.85,
    z: 1.2,
  },
];

type Listener = (snapshot: AtlasSnapshot) => void;

class AtlasStore {
  private state: AtlasSnapshot;
  private listeners = new Set<Listener>();

  constructor() {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

    this.state = {
      bookPhase: 'closed',
      activeWorld: 0,
      turningToWorld: null,
      turnProgress: 0,
      timeOfDay: 10.2, // Warm morning light
      autoTime: true,
      weather: 'clear',
      cameraMode: 'inspection',
      activeTool: 'explore',
      audioMuted: false,
      reducedMotion: Boolean(prefersReduced),
      qualityTier: isMobile ? 'medium' : 'high',
      hudCollapsed: false,
      magnifierActive: false,
      magnifierPos: { x: 0, z: 0 },
      activeSecret: null,
      statusHint: 'Click the brass clasp or press Space to unseal the living atlas.',
      worlds: createInitialWorlds(),
    };
  }

  public getSnapshot(): AtlasSnapshot {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    // Shallow clone top-level object so React re-renders cleanly
    this.state = { ...this.state };
    this.listeners.forEach((l) => l(this.state));
  }

  public setBookPhase(phase: BookPhase): void {
    if (this.state.bookPhase === phase) return;
    this.state.bookPhase = phase;
    if (phase === 'opening') {
      this.state.statusHint = 'Unfolding Folio I — The Verdant Kingdom...';
    } else if (phase === 'open') {
      this.state.cameraMode = 'diorama';
      this.state.statusHint = this.getDefaultToolHint(this.state.activeTool);
    } else {
      this.state.cameraMode = 'inspection';
      this.state.magnifierActive = false;
      this.state.statusHint = 'Click the brass clasp or press Space to unseal the living atlas.';
    }
    this.emit();
  }

  public setActiveWorld(world: WorldId): void {
    this.state.activeWorld = world;
    this.state.turningToWorld = null;
    this.state.turnProgress = 0;
    this.state.activeSecret = null;
    this.emit();
  }

  public setPageTurnState(target: WorldId | null, progress: number): void {
    this.state.turningToWorld = target;
    this.state.turnProgress = progress;
    this.emit();
  }

  public setTimeOfDay(hours: number, emitEvent = true): void {
    const normalized = ((hours % 24) + 24) % 24;
    this.state.timeOfDay = normalized;
    if (emitEvent) this.emit();
  }

  public advanceTimeQuietly(hours: number): void {
    this.state.timeOfDay = ((hours % 24) + 24) % 24;
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
      // Gently shift toward twilight so stars glow vividly while still keeping user control
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

  public setStatusHint(hint: string): void {
    this.state.statusHint = hint;
    this.emit();
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
    this.state.statusHint = 'Riverbed geometry reshaped across the parchment.';
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
    this.state.statusHint = `Ink seed rooted — sprouting a folded ${tree.species} paper tree.`;
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
    this.state.statusHint = `Plotted ${points.length}-waypoint sailing course.`;
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
        this.state.statusHint = 'Celestial constellation aligned — sky magic awakened!';
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
