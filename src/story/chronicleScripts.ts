import {
  BOOK_ENDCARD_CUE,
  BOOK_IMPRINT_CUE,
  BOOK_PROLOGUE_CUE,
  FOLIO_BY_WORLD,
  FOLIO_MANIFESTS,
} from './historyManifest';
import { CueId, CueSlot, FolioCueSegment, WorldId } from '../types/atlas';

export {
  BOOK_ENDCARD_CUE,
  BOOK_IMPRINT_CUE,
  BOOK_PROLOGUE_CUE,
  FOLIO_BY_WORLD,
  FOLIO_MANIFESTS,
};

export function getFolioCueSegment(worldId: WorldId, slot: CueSlot): FolioCueSegment {
  return FOLIO_BY_WORLD[worldId].cues[slot];
}

export function resolveCueById(cueId: CueId): {
  cue: FolioCueSegment;
  worldId: WorldId | null;
  label: string;
} {
  if (cueId === 'BOOK_PROLOGUE') {
    return {
      cue: BOOK_PROLOGUE_CUE,
      worldId: 0,
      label: 'Prologue · Palimpsest: An Illustrated History of the All',
    };
  }
  if (cueId === 'BOOK_IMPRINT') {
    return {
      cue: BOOK_IMPRINT_CUE,
      worldId: 0,
      label: 'Inside-Front-Cover Imprint',
    };
  }
  if (cueId === 'BOOK_ENDCARD') {
    return {
      cue: BOOK_ENDCARD_CUE,
      worldId: 11,
      label: 'Closing Imprint · Administration Archival Edition',
    };
  }
  const match = cueId.match(/^F(\d{2})_(OPEN|LESSON|A|B|C|CLOSE)$/);
  if (match) {
    const idx = Number.parseInt(match[1], 10) - 1;
    const slot = match[2] as CueSlot;
    const manifest = FOLIO_MANIFESTS[idx];
    if (manifest) {
      return {
        cue: manifest.cues[slot],
        worldId: manifest.worldId,
        label: `${manifest.code} · ${manifest.title} — ${manifest.cues[slot].heading}`,
      };
    }
  }
  return {
    cue: BOOK_PROLOGUE_CUE,
    worldId: 0,
    label: 'Archival Narration',
  };
}
