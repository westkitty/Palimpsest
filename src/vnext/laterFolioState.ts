import { FOLIO_BY_WORLD } from '../story/historyManifest';
import { F06_CAMPAIGN_DRAXIS_IDS } from '../story/draxisCatalog';
import type { FolioInteractionSlot, FolioRuntimeState, WorldId } from '../types/atlas';

/**
 * The nine later Living Folios use the existing, source-authored mechanism
 * definitions. This is a separate teaching-state store, not the archive session.
 * Only the three mechanisms and the F06 sourced specimen index may persist.
 * In particular: no discovered testimony, narration or historical record data.
 */
export const FIRST_LATER_FOLIO = 3;
export const LIVING_FOLIO_COUNT = 12;
export type LaterFolioIndex = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
const slots = ['A', 'B', 'C'] as const;
export const LATER_STUDY_STORAGE_KEY = 'palimpsest.living.f04-f12.study.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isLaterIndex(value: number): value is LaterFolioIndex {
  return Number.isInteger(value) && value >= FIRST_LATER_FOLIO && value < LIVING_FOLIO_COUNT;
}
export function newLaterState(index: LaterFolioIndex): FolioRuntimeState {
  const manifest = FOLIO_BY_WORLD[index];
  return {
    id: index,
    folioId: manifest.id,
    interactions: {
      A: { active: false, step: 0, maxSteps: manifest.interactions[0].maxSteps ?? 1, locked: false },
      B: { active: false, step: 0, maxSteps: manifest.interactions[1].maxSteps ?? 1, locked: false },
      C: { active: false, step: 0, maxSteps: manifest.interactions[2].maxSteps ?? 1, locked: false },
    },
    discoveredSecrets: [],
    selectedCampaignIndex: 0,
    wearLevel: 0.08 + index * 0.025,
  };
}

export function operateLater(state: FolioRuntimeState, slot: FolioInteractionSlot): FolioRuntimeState {
  if (!isLaterIndex(state.id)) throw new RangeError('not a later Living Folio');
  const manifest = FOLIO_BY_WORLD[state.id];
  const def = manifest.interactions[slots.indexOf(slot)];
  if (!def) throw new RangeError('unrecognized mechanism');
  const interactions = {
    A: { ...state.interactions.A },
    B: { ...state.interactions.B },
    C: { ...state.interactions.C },
  };
  const next = interactions[slot];
  if (def.persistPolicy === 'irreversible') {
    next.active = true;
    next.step = 1;
    next.locked = true;
  } else if (def.persistPolicy === 'stepped') {
    const max = Math.max(2, def.maxSteps ?? 4);
    next.step = def.id === 'f09_b' ? Math.min(max, next.step + 1) : (next.step + 1) % max;
    next.active = next.step > 0 || def.id !== 'f09_b';
    next.locked = def.id === 'f09_b' && next.step >= max;
  } else {
    next.active = !next.active;
    next.step = next.active ? 1 : 0;
  }
  return {
    ...state,
    interactions,
    discoveredSecrets: [],
    selectedCampaignIndex: state.id === 5 && slot === 'B'
      ? next.step % F06_CAMPAIGN_DRAXIS_IDS.length
      : state.selectedCampaignIndex,
  };
}

/** Rejects the unknown properties of untrusted session data and bounds every mechanism. */
export function restoreLaterStudy(raw: unknown): FolioRuntimeState[] {
  const defaults = Array.from({ length: 9 }, (_, i) => newLaterState((i + 3) as LaterFolioIndex));
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.folios)) return defaults;
  return defaults.map((base, i) => {
    const candidate: unknown = raw.folios[i];
    if (!isRecord(candidate) || candidate.id !== base.id || !isRecord(candidate.interactions)) return base;
    const interactions = { ...base.interactions };
    for (const slot of slots) {
      const from: unknown = candidate.interactions[slot];
      if (!isRecord(from)) continue;
      const def = FOLIO_BY_WORLD[base.id].interactions[slots.indexOf(slot)];
      const max = def.persistPolicy === 'stepped' ? Math.max(2, def.maxSteps ?? 4) : 1;
      const step = typeof from.step === 'number' && Number.isInteger(from.step) && from.step >= 0 && from.step <= max ? from.step : 0;
      const active = def.persistPolicy === 'irreversible' ? step === 1
        : def.persistPolicy === 'stepped' ? (def.id !== 'f09_b' ? from.active === true : step > 0)
        : (from.active === true && step === 1);
      interactions[slot] = {
        active,
        step: active ? step : 0,
        maxSteps: base.interactions[slot].maxSteps,
        locked: def.persistPolicy === 'irreversible' ? active
          : def.id === 'f09_b' && step >= max,
      };
    }
    const selectedCampaignIndex = base.id === 5
      ? interactions.B.step % F06_CAMPAIGN_DRAXIS_IDS.length : 0;
    return { ...base, interactions, selectedCampaignIndex };
  });
}

export function serializeLaterStudy(folios: readonly FolioRuntimeState[]): object {
  return {
    version: 1,
    folios: folios.map(s => ({
      id: s.id,
      interactions: Object.fromEntries(slots.map(slot => [slot, {
        active: s.interactions[slot].active,
        step: s.interactions[slot].step,
      }])),
    })),
  };
}

export function isLivingIndex(value: number): value is WorldId {
  return Number.isInteger(value) && value >= 0 && value < LIVING_FOLIO_COUNT;
}
