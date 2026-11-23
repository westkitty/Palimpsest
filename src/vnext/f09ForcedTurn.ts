/** An intentional pull, not entry, restore, other folio actions or a review of the spent plate. */
export const F09_INDEX=8;
export const F09_AFTERMATH_SECONDS=3.55;
export const F09_AUTO_TURN_SECONDS=4.40;
export const F09_REDUCED_TURN_SECONDS=1.15;
export function armsF09(index:number,slot:string,wasLocked:boolean,isLocked:boolean):boolean {
  return index===F09_INDEX&&slot==='A'&&!wasLocked&&isLocked;
}
export function f09ForcedBeat(time:number,reduced:boolean) {
  if(reduced)return time>=F09_REDUCED_TURN_SECONDS?'turn':'aftermath';
  if(time>=F09_AUTO_TURN_SECONDS)return 'turn';
  if(time>=F09_AFTERMATH_SECONDS)return 'aftermath';
  if(time>=2.59)return 'rupture';
  return 'pull';
}
