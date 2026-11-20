/**
 * Bounded, editorially illustrative folio state. This module is deliberately
 * pure: no speech, chronology, secrets, storage or canonical world names.
 */
export type FolioIndex = 0 | 1 | 2;
export type Slot = 'A' | 'B' | 'C';
export type FolioActions = {
  folio: FolioIndex;
  f01: { fold: boolean; detail: boolean; compare: boolean };
  f02: { reveal: 0 | 1 | 2 | 3 };
  f03: { vaultOpen: boolean; template: 0 | 1 | 2; generation: number };
};

export type PlanetPattern = {
  family: number;
  generation: number;
  familyName: string;
  hull: number;
  bandCount: number;
  tilt: number;
  seamAngle: number;
  oceanShare: number;
  facet: number;
};
const sourceTemplates = [
  { familyName: 'SOURCE PLATE 01', hull: 0x396c7c, bandCount: 3, oceanShare: 0.66, facet: 8 },
  { familyName: 'SOURCE PLATE 02', hull: 0x667c6b, bandCount: 4, oceanShare: 0.44, facet: 10 },
  { familyName: 'SOURCE PLATE 03', hull: 0x687b91, bandCount: 2, oceanShare: 0.57, facet: 12 },
] as const;
export const TEMPLATE_COUNT = sourceTemplates.length;
const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));

/** Distinct variants inherit a finite source shape; never create new archetypes. */
export function planetPattern(family: number, generation: number): PlanetPattern {
  if (!Number.isInteger(family) || family < 0 || family >= TEMPLATE_COUNT) throw new RangeError('unknown source template');
  if (!Number.isInteger(generation) || generation < 0 || generation > 9999) throw new RangeError('invalid variation');
  const t = sourceTemplates[family];
  const wiggle = Math.sin((generation + 1) * 1.618 + family * 2.37);
  return {
    family,
    generation,
    familyName: t.familyName,
    hull: t.hull,
    bandCount: t.bandCount,
    oceanShare: clamp(t.oceanShare + wiggle * 0.085, 0.2, 0.8),
    tilt: -0.22 + (generation % 5) * 0.11,
    seamAngle: (generation * 0.47 + family * 0.29) % (Math.PI * 2),
    facet: t.facet,
  };
}

export function startFolio(folio: FolioIndex): FolioActions {
  if (![0, 1, 2].includes(folio)) throw new RangeError('unknown folio');
  return { folio, f01: { fold: false, detail: false, compare: false }, f02: { reveal: 0 }, f03: {vaultOpen: false, template: 0, generation: 0} };
}

/** Each A/B/C operation has a predictable physical teaching effect. */
export function activateSlot(state: FolioActions, slot: Slot): FolioActions {
  const result: FolioActions = {
    folio: state.folio, f01: {...state.f01}, f02: {...state.f02}, f03: {...state.f03},
  };
  if (state.folio === 0) {
    if (slot === 'A') result.f01.fold = !result.f01.fold;
    if (slot === 'B') result.f01.detail = !result.f01.detail;
    if (slot === 'C') result.f01.compare = !result.f01.compare;
  } else if (state.folio === 1) {
    const target = slot === 'A' ? 1 : slot === 'B' ? 2 : 3;
    result.f02.reveal = Math.max(state.f02.reveal, target) as 0 | 1 | 2 | 3;
  } else {
    if (slot === 'A') result.f03.vaultOpen = !result.f03.vaultOpen;
    if (slot === 'B') result.f03.template = ((result.f03.template + 1) % TEMPLATE_COUNT) as 0 | 1 | 2;
    if (slot === 'C') result.f03.generation = (result.f03.generation + 1) % 1000;
  }
  return result;
}

export type Inspection = 'overview' | 'miniature' | 'geode';
export function mayReveal(what: 'f01-testimony' | 'f02-testimony', folio: FolioIndex, mode: Inspection, near: boolean, gaze: boolean): boolean {
  return near && gaze && ((what === 'f01-testimony' && folio === 0 && mode === 'miniature') ||
    (what === 'f02-testimony' && folio === 1 && mode === 'geode'));
}


/**
 * Editorial study-state only. The archive's history session, narrator, discovered
 * testimony and camera state are intentionally NOT part of this payload.
 */
const FOLIOS: FolioIndex[] = [0, 1, 2];
const registrationMarks = [
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [1, 1, 0, 0],
] as const;

export function sourceInkRegistration(family: number): readonly number[] {
  if (!Number.isInteger(family) || family < 0 || family >= TEMPLATE_COUNT) throw new RangeError('unknown source register');
  return registrationMarks[family];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Untrusted session data is rejected or clamped to the small approved study domain. */
export function restoreFolioStudy(raw: unknown): FolioActions[] {
  const result = FOLIOS.map(startFolio);
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.folios)) return result;
  for (const folio of FOLIOS) {
    const record: unknown = raw.folios[folio];
    if (!isRecord(record) || record.folio !== folio) continue;
    const old01 = isRecord(record.f01) ? record.f01 : {};
    const old02 = isRecord(record.f02) ? record.f02 : {};
    const old03 = isRecord(record.f03) ? record.f03 : {};
    const reveal = old02.reveal;
    const template = old03.template;
    const generation = old03.generation;
    result[folio] = {
      folio,
      f01: {
        fold: old01.fold === true,
        detail: old01.detail === true,
        compare: old01.compare === true,
      },
      f02: {
        reveal: typeof reveal === 'number' && Number.isInteger(reveal) && reveal >= 0 && reveal <= 3 ? reveal as 0 | 1 | 2 | 3 : 0,
      },
      f03: {
        vaultOpen: old03.vaultOpen === true,
        template: typeof template === 'number' && Number.isInteger(template) && template >= 0 && template < TEMPLATE_COUNT ? template as 0 | 1 | 2 : 0,
        generation: typeof generation === 'number' && Number.isInteger(generation) && generation >= 0 && generation < 1000 ? generation : 0,
      },
    };
  }
  return result;
}
