/**
 * Living-only F04: The Great Misunderstanding.
 *
 * Separate from the twelve source worlds and their private archival state.
 * The steps are visual demonstrations, not biological or cosmological canon.
 */
export type MisunderstandingSlot = 'A' | 'B' | 'C';
export type MisunderstandingState = Readonly<{
  eggLanded: boolean;
  templeRaised: boolean;
  roofLifted: boolean;
}>;
export const MISUNDERSTANDING_STUDY_KEY = 'palimpsest.living.great-misunderstanding.study.v1';
export const NEW_FOLIO_ACTIONS = [
  'Observe the dark Egg landing',
  'Raise the welcoming temple',
  'Lift the roof and inspect the changing ground',
] as const;
export const INITIAL_MISUNDERSTANDING_STATE: MisunderstandingState = Object.freeze({
  eggLanded: false, templeRaised: false, roofLifted: false,
});

export function activateMisunderstanding(
  state: MisunderstandingState,
  slot: MisunderstandingSlot,
): MisunderstandingState {
  // A always provides the object of the later two observations.
  if(slot === 'A') {
    const eggLanded = !state.eggLanded;
    return {eggLanded,templeRaised: eggLanded && state.templeRaised,roofLifted: eggLanded && state.roofLifted};
  }
  if(slot === 'B') return {eggLanded: true,templeRaised: !state.templeRaised,roofLifted: state.roofLifted && !state.templeRaised};
  if(slot === 'C') return {eggLanded: true,templeRaised: true,roofLifted: !state.roofLifted};
  throw new RangeError('unknown misunderstanding mechanism');
}

export function restoreMisunderstanding(raw: unknown): MisunderstandingState {
  if(typeof raw !== 'object' || raw === null || Array.isArray(raw))return INITIAL_MISUNDERSTANDING_STATE;
  const record=raw as Record<string,unknown>;
  if(record.version !== 1 || typeof record.state !== 'object' || record.state === null || Array.isArray(record.state)) {
    return INITIAL_MISUNDERSTANDING_STATE;
  }
  const state=record.state as Record<string,unknown>;
  const eggLanded=state.eggLanded === true;
  const templeRaised=eggLanded && state.templeRaised === true;
  const roofLifted=templeRaised && state.roofLifted === true;
  return {eggLanded, templeRaised, roofLifted};
}
export function serializeMisunderstanding(state:MisunderstandingState) {
  return {version:1,state:{eggLanded:state.eggLanded,templeRaised:state.templeRaised,roofLifted:state.roofLifted}};
}
