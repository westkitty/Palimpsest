import { isLivingIndex } from './laterFolioState';
import { ADMINISTRATION_SLOGAN } from '../story/historyManifest';
export { ADMINISTRATION_SLOGAN };
export const CODA_INDEX=12;
export function playableIndex(index:number):boolean {
  return isLivingIndex(index)||index===CODA_INDEX;
}
