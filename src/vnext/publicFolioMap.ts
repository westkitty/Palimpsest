/**
 * Public Living Book page numbering approved 2026-11-22.
 *
 * The historical archive is NOT renumbered. Its original F01-F12 source world
 * indices stay 0..11; the new public-only Great Misunderstanding occupies F04.
 *
 * Never use a public folio index to index FOLIO_BY_WORLD, laterStates, or
 * archived history directly. Translate at the boundary first.
 */
export const PUBLIC_HISTORICAL_FOLIOS = 13;
export const PUBLIC_CODA_INDEX = 13;
export const NEW_PUBLIC_FOLIO_INDEX = 3;
export const ORIGINAL_SOURCE_FOLIOS = 12;
export const INSERTION_SOURCE_INDEX = 3;

export type PublicPage =
  | {kind: 'existing'; publicIndex: number; sourceIndex: number}
  | {kind: 'great-misunderstanding'; publicIndex: 3}
  | {kind: 'coda'; publicIndex: 13};

export function publicPage(index: number): PublicPage {
  if (!Number.isInteger(index) || index < 0 || index > PUBLIC_CODA_INDEX) {
    throw new RangeError('invalid public Living Book page');
  }
  if (index === PUBLIC_CODA_INDEX) return {kind: 'coda', publicIndex: 13};
  if (index === NEW_PUBLIC_FOLIO_INDEX) return {kind: 'great-misunderstanding', publicIndex: 3};
  return {kind: 'existing', publicIndex: index, sourceIndex: index > NEW_PUBLIC_FOLIO_INDEX ? index - 1 : index};
}

export function sourceToPublicIndex(sourceIndex: number): number {
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= ORIGINAL_SOURCE_FOLIOS) {
    throw new RangeError('invalid original source world');
  }
  return sourceIndex < INSERTION_SOURCE_INDEX ? sourceIndex : sourceIndex + 1;
}

export function isPublicPageIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= PUBLIC_CODA_INDEX;
}
