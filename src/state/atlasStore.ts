import { F06_CAMPAIGN_DRAXIS_IDS } from '../story/draxisCatalog';
import {
  FOLIO_BY_WORLD,
  FOLIO_MANIFESTS,
  MAGNIFIER_SECRETS,
} from '../story/historyManifest';
import {
  AtlasSnapshot,
  BookPhase,
  CameraMode,
  CueId,
  DraxisId,
  FolioInteractionSlot,
  FolioRuntimeState,
  HoverCallout,
  INTERACTION_TOOLS,
  InteractionTool,
  NarrationCapability,
  NarrationStatus,
  QualityTier,
  TOTAL_WORLDS,
  Vec2Point,
  WorldId,
} from '../types/atlas';

export const HISTORY_SESSION_KEY = 'palimpsest_history_v1_session';

const F03_THESIS_DRAXIS: DraxisId[] = ['001', '023', '019', '008', '032'];

function detectBrowserSpeech(): NarrationCapability {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const voices = window.speechSynthesis.getVoices?.() ?? [];
      if (voices.length > 0) return 'browser-speech';
    } catch {
      return 'transcript-only';
    }
  }
  return 'transcript-only';
}

function createInitialFolios(): FolioRuntimeState[] {
  return FOLIO_MANIFESTS.map((m) => {
    const defA = m.interactions[0];
    const defB = m.interactions[1];
    const defC = m.interactions[2];
    return {
      id: m.worldId,
      folioId: m.id,
      interactions: {
        A: { active: false, step: 0, maxSteps: defA.maxSteps ?? 1, locked: false },
        B: { active: false, step: 0, maxSteps: defB.maxSteps ?? 1, locked: false },
        C: { active: false, step: 0, maxSteps: defC.maxSteps ?? 1, locked: false },
      },
      discoveredSecrets: [],
      selectedCampaignIndex: 0,
      wearLevel: 0.08 + m.worldId * 0.025,
    };
  });
}

interface PersistedHistorySession {
  version: number;
  activeWorld: WorldId;
  visitedWorlds: WorldId[];
  completedFolios: WorldId[];
  captionsVisible: boolean;
  narrationEnabled: boolean;
  noFlashMode: boolean;
  nonWebglMode: boolean;
  endcardOpen: boolean;
  activeDraxisId: DraxisId | null;
  worlds: FolioRuntimeState[];
}

function hydrateFolioState(
  base: FolioRuntimeState,
  saved?: Partial<FolioRuntimeState>,
): FolioRuntimeState {
  if (!saved) return base;
  const slots: FolioInteractionSlot[] = ['A', 'B', 'C'];
  const interactions = { ...base.interactions };
  for (const s of slots) {
    const incoming = saved.interactions?.[s];
    if (incoming && typeof incoming === 'object') {
      interactions[s] = {
        active: Boolean(incoming.active),
        step:
          typeof incoming.step === 'number'
            ? Math.max(0, Math.min(base.interactions[s].maxSteps, incoming.step))
            : 0,
        maxSteps: base.interactions[s].maxSteps,
        locked: Boolean(incoming.locked),
      };
    }
  }
  return {
    ...base,
    interactions,
    discoveredSecrets: Array.isArray(saved.discoveredSecrets)
      ? saved.discoveredSecrets.filter((x): x is string => typeof x === 'string')
      : [],
    selectedCampaignIndex:
      typeof saved.selectedCampaignIndex === 'number'
        ? Math.max(0, Math.min(F06_CAMPAIGN_DRAXIS_IDS.length - 1, saved.selectedCampaignIndex))
        : 0,
    wearLevel:
      typeof saved.wearLevel === 'number'
        ? Math.max(0.04, Math.min(1, saved.wearLevel))
        : base.wearLevel,
  };
}

type Listener = (snapshot: AtlasSnapshot) => void;

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

    let worlds = createInitialFolios();
    let activeWorld: WorldId = 0;
    let visitedWorlds: WorldId[] = [0];
    let completedFolios: WorldId[] = [];
    let captionsVisible = false; // Strictly OFF by default per contract
    let narrationEnabled = true;
    let noFlashMode = Boolean(prefersReduced);
    let nonWebglMode = false;
    let endcardOpen = false;
    let activeDraxisId: DraxisId | null = '060';

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(HISTORY_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedHistorySession>;
          if (parsed && parsed.version === 2) {
            if (
              typeof parsed.activeWorld === 'number' &&
              parsed.activeWorld >= 0 &&
              parsed.activeWorld < TOTAL_WORLDS
            ) {
              activeWorld = parsed.activeWorld as WorldId;
            }
            if (Array.isArray(parsed.visitedWorlds) && parsed.visitedWorlds.length > 0) {
              visitedWorlds = parsed.visitedWorlds.filter(
                (w): w is WorldId => typeof w === 'number' && w >= 0 && w < TOTAL_WORLDS,
              );
              if (!visitedWorlds.includes(activeWorld)) visitedWorlds.push(activeWorld);
            }
            if (Array.isArray(parsed.completedFolios)) {
              completedFolios = parsed.completedFolios.filter(
                (w): w is WorldId => typeof w === 'number' && w >= 0 && w < TOTAL_WORLDS,
              );
            }
            if (typeof parsed.captionsVisible === 'boolean') captionsVisible = parsed.captionsVisible;
            if (typeof parsed.narrationEnabled === 'boolean') narrationEnabled = parsed.narrationEnabled;
            if (typeof parsed.noFlashMode === 'boolean') noFlashMode = parsed.noFlashMode;
            if (typeof parsed.nonWebglMode === 'boolean') nonWebglMode = parsed.nonWebglMode;
            if (typeof parsed.endcardOpen === 'boolean') endcardOpen = parsed.endcardOpen;
            if (typeof parsed.activeDraxisId === 'string') activeDraxisId = parsed.activeDraxisId as DraxisId;
            if (Array.isArray(parsed.worlds)) {
              worlds = worlds.map((base, idx) => hydrateFolioState(base, parsed.worlds?.[idx]));
            }
          }
        }
      }
    } catch {
      // Ignore corrupt session payload cleanly
    }

    const activeManifest = FOLIO_BY_WORLD[activeWorld];

    this.state = {
      bookPhase: 'closed',
      activeWorld,
      activeFolioId: activeManifest.id,
      turningToWorld: null,
      turnProgress: 0,
      cameraMode: 'inspection',
      activeTool: 'explore',
      audioMuted: false,
      narrationEnabled,
      captionsVisible,
      narrationCapability: detectBrowserSpeech(),
      narrationStatus: 'idle',
      narrationCueId: null,
      narrationCaption: null,
      narrationSpeakerLabel: null,
      narrationProgress: null,
      reducedMotion: Boolean(prefersReduced),
      noFlashMode,
      nonWebglMode,
      qualityTier: isMobile ? 'medium' : 'high',
      hudCollapsed: false,
      chronicleOpen: false,
      endcardOpen,
      hoveredProp: null,
      magnifierActive: false,
      magnifierPos: { x: 0, z: 0 },
      activeSecret: null,
      activeDraxisId,
      statusHint: 'Click the cover clasp or press Space to open Palimpsest: An Illustrated History of the All.',
      visitedWorlds,
      completedFolios,
      bookWearLevel: Math.min(1, visitedWorlds.length / TOTAL_WORLDS),
      worlds,
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

  private scheduleSave(immediate = false): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const writeNow = () => {
      try {
        const payload: PersistedHistorySession = {
          version: 2,
          activeWorld: this.state.activeWorld,
          visitedWorlds: this.state.visitedWorlds,
          completedFolios: this.state.completedFolios,
          captionsVisible: this.state.captionsVisible,
          narrationEnabled: this.state.narrationEnabled,
          noFlashMode: this.state.noFlashMode,
          nonWebglMode: this.state.nonWebglMode,
          endcardOpen: this.state.endcardOpen,
          activeDraxisId: this.state.activeDraxisId,
          worlds: this.state.worlds,
        };
        window.sessionStorage.setItem(HISTORY_SESSION_KEY, JSON.stringify(payload));
      } catch {
        // Non-fatal
      }
    };

    if (this.saveTimer !== null) {
      globalThis.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (immediate) {
      writeNow();
    } else {
      this.saveTimer = globalThis.setTimeout(writeNow, 260);
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
    const manifest = FOLIO_BY_WORLD[this.state.activeWorld];
    if (phase === 'opening') {
      this.state.endcardOpen = false;
      this.state.statusHint = `Opening ${manifest.code} — ${manifest.title}...`;
    } else if (phase === 'open') {
      this.state.cameraMode = 'diorama';
      this.state.statusHint = `${manifest.code}: ${manifest.title} · Use mechanisms A / B / C or inspect the 4:3 plate.`;
    } else {
      this.state.cameraMode = 'inspection';
      this.state.magnifierActive = false;
      this.state.hoveredProp = null;
      this.state.statusHint = 'Volume closed on slate. Click clasp or press Space to resume reading.';
    }
    this.emit(false);
  }

  public setActiveWorld(world: WorldId): void {
    const manifest = FOLIO_BY_WORLD[world];
    this.state.activeWorld = world;
    this.state.activeFolioId = manifest.id;
    this.state.turningToWorld = null;
    this.state.turnProgress = 0;
    this.state.activeSecret = null;
    if (!this.state.visitedWorlds.includes(world)) {
      this.state.visitedWorlds = [...this.state.visitedWorlds, world];
    }
    this.state.bookWearLevel = Math.min(1, this.state.visitedWorlds.length / TOTAL_WORLDS);
    if (world === 2) {
      this.state.activeDraxisId = F03_THESIS_DRAXIS[this.state.worlds[2].interactions.B.step % 5];
    } else if (world === 4) {
      this.state.activeDraxisId = '044';
    } else if (world === 5) {
      const idx = this.state.worlds[5].selectedCampaignIndex % F06_CAMPAIGN_DRAXIS_IDS.length;
      this.state.activeDraxisId = F06_CAMPAIGN_DRAXIS_IDS[idx];
    }
    this.state.statusHint = `${manifest.code} — ${manifest.title} (${manifest.temporalMarker})`;
    this.emit(true);
  }

  public setPageTurnState(target: WorldId | null, progress: number): void {
    this.state.turningToWorld = target;
    this.state.turnProgress = progress;
    this.emit(false);
  }

  public activateInteraction(
    worldId: WorldId,
    slot: FolioInteractionSlot,
  ): {
    cueId: CueId;
    active: boolean;
    step: number;
    locked: boolean;
    interactionLabel: string;
  } {
    const folio = this.state.worlds[worldId];
    const manifest = FOLIO_BY_WORLD[worldId];
    const slotIdx = slot === 'A' ? 0 : slot === 'B' ? 1 : 2;
    const def = manifest.interactions[slotIdx];
    const st = folio.interactions[slot];

    if (def.persistPolicy === 'irreversible') {
      // e.g., F09_A model star collapse — immediate, permanent in session
      st.active = true;
      st.step = 1;
      st.locked = true;
    } else if (def.persistPolicy === 'stepped') {
      const maxS = Math.max(2, def.maxSteps ?? 4);
      // For F09_B sequential cluster collapse, step monotonically up to maxSteps
      if (def.id === 'f09_b') {
        st.step = Math.min(maxS, st.step + 1);
        st.active = st.step > 0;
        if (st.step >= maxS) st.locked = true;
      } else {
        st.step = (st.step + 1) % maxS;
        st.active = true;
      }
      if (def.id === 'f03_b') {
        this.state.activeDraxisId = F03_THESIS_DRAXIS[st.step % F03_THESIS_DRAXIS.length];
      }
      if (def.id === 'f06_b') {
        folio.selectedCampaignIndex = st.step % F06_CAMPAIGN_DRAXIS_IDS.length;
        this.state.activeDraxisId = F06_CAMPAIGN_DRAXIS_IDS[folio.selectedCampaignIndex];
      }
    } else {
      st.active = !st.active;
      st.step = st.active ? 1 : 0;
    }

    if (!this.state.completedFolios.includes(worldId)) {
      this.state.completedFolios = [...this.state.completedFolios, worldId];
    }
    folio.wearLevel = Math.min(1, folio.wearLevel + 0.04);

    this.state.statusHint = `${manifest.code} [${slot}] ${def.label} — ${def.textEquivalent}`;
    this.emit(true);

    return {
      cueId: def.narrationSegmentId,
      active: st.active,
      step: st.step,
      locked: st.locked,
      interactionLabel: def.label,
    };
  }

  public selectDraxisSpecimen(id: DraxisId): void {
    this.state.activeDraxisId = id;
    const f06 = this.state.worlds[5];
    const matchIdx = F06_CAMPAIGN_DRAXIS_IDS.indexOf(id);
    if (matchIdx >= 0) {
      f06.selectedCampaignIndex = matchIdx;
      f06.interactions.B.step = matchIdx % Math.max(1, f06.interactions.B.maxSteps);
      f06.interactions.B.active = true;
    }
    this.emit(true);
  }

  public setCameraMode(mode: CameraMode): void {
    this.state.cameraMode = mode;
    if (mode === 'immersion') {
      this.state.statusHint = 'Close camera: WASD / Arrow keys to inspect 4:3 plate details.';
    } else if (mode === 'diorama') {
      this.state.statusHint = 'Overhead 4:3 instructional framing restored.';
    } else {
      this.state.statusHint = 'Slate table inspection: Orbit freely around the charcoal linen volume.';
    }
    this.emit(false);
  }

  public setActiveTool(tool: InteractionTool): void {
    this.state.activeTool = tool;
    this.state.magnifierActive = tool === 'magnifier';
    if (tool !== 'magnifier') {
      this.state.activeSecret = null;
    }
    this.state.statusHint =
      INTERACTION_TOOLS.find((t) => t.id === tool)?.shortHint ??
      'Inspect the 4:3 instructional spread.';
    this.emit(false);
  }

  public setAudioMuted(muted: boolean): void {
    this.state.audioMuted = muted;
    this.emit(false);
  }

  public setNarrationEnabled(enabled: boolean): void {
    this.state.narrationEnabled = enabled;
    this.emit(true);
  }

  public setCaptionsVisible(visible: boolean): void {
    this.state.captionsVisible = visible;
    this.state.statusHint = visible
      ? 'Optional projection captions enabled.'
      : 'Captions hidden; full transcript remains accessible in the Transcript drawer.';
    this.emit(true);
  }

  public refreshNarrationCapability(): void {
    this.state.narrationCapability = detectBrowserSpeech();
    this.emit(false);
  }

  public setNarrationState(
    status: NarrationStatus,
    cueId: CueId | null,
    caption: string | null,
    speakerLabel: string | null,
    progress: { line: number; total: number } | null,
  ): void {
    this.state = {
      ...this.state,
      narrationStatus: status,
      narrationCueId: cueId,
      narrationCaption: caption,
      narrationSpeakerLabel: speakerLabel,
      narrationProgress: progress,
    };
    this.listeners.forEach((l) => l(this.state));
  }

  public setReducedMotion(reduced: boolean): void {
    this.state.reducedMotion = reduced;
    if (reduced) {
      this.state.noFlashMode = true;
    }
    this.emit(true);
  }

  public setNoFlashMode(noFlash: boolean): void {
    this.state.noFlashMode = noFlash;
    this.emit(true);
  }

  public setNonWebglMode(nonWebgl: boolean): void {
    this.state.nonWebglMode = nonWebgl;
    this.state.statusHint = nonWebgl
      ? 'Non-WebGL Diagram & Reading View active. Full transcript and 4:3 schematics available.'
      : 'Returned to interactive 3D Three.js volume.';
    this.emit(true);
  }

  public setQualityTier(tier: QualityTier): void {
    this.state.qualityTier = tier;
    this.emit(false);
  }

  public setHudCollapsed(collapsed: boolean): void {
    this.state.hudCollapsed = collapsed;
    this.emit(false);
  }

  public setChronicleOpen(open: boolean): void {
    this.state.chronicleOpen = open;
    this.emit(false);
  }

  public setEndcardOpen(open: boolean): void {
    this.state.endcardOpen = open;
    this.emit(true);
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

  public setStatusHint(hint: string): void {
    this.state.statusHint = hint;
    this.emit(false);
  }

  public updateMagnifier(pos: Vec2Point): void {
    this.state.magnifierPos = {
      x: Math.max(-3.6, Math.min(3.6, pos.x)),
      z: Math.max(-2.3, Math.min(2.3, pos.z)),
    };
    const worldId = this.state.activeWorld;
    const folio = this.state.worlds[worldId];
    const found = MAGNIFIER_SECRETS.find(
      (s) =>
        s.worldId === worldId &&
        Math.hypot(s.x - this.state.magnifierPos.x, s.z - this.state.magnifierPos.z) < 0.9,
    );
    const prevId = this.state.activeSecret?.id ?? null;
    const nextId = found?.id ?? null;
    this.state.activeSecret = found ?? null;
    if (found && !folio.discoveredSecrets.includes(found.id)) {
      folio.discoveredSecrets.push(found.id);
    }
    if (prevId !== nextId) {
      if (found) {
        this.state.statusHint = `Archival marginalia: ${found.title}`;
      }
      this.emit(true);
    }
  }

  public restartHistorySession(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(HISTORY_SESSION_KEY);
      }
    } catch {
      // Non-fatal
    }
    this.state.worlds = createInitialFolios();
    this.state.activeWorld = 0;
    this.state.activeFolioId = 'f01';
    this.state.visitedWorlds = [0];
    this.state.completedFolios = [];
    this.state.bookWearLevel = 1 / TOTAL_WORLDS;
    this.state.endcardOpen = false;
    this.state.activeSecret = null;
    this.state.hoveredProp = null;
    this.state.activeDraxisId = '060';
    this.state.statusHint = 'History session reset. Only observation state was cleared; historical records remain unchanged.';
    this.scheduleSave(true);
    this.emit(false);
  }
}

export const atlasStore = new AtlasStore();
