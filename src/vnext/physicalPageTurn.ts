/** Normalized travel runs from the departing page (0) to the arriving page (1)
 * in both directions. All clocks are real elapsed seconds, not frame counts. */
export const TURN_PULL_SECONDS=.26;
export const TURN_RETURN_SECONDS=.30;
export type TurnDirection=-1|1;
export const unit=(n:number):number=>Math.max(0,Math.min(1,n));
export function turnEase(n:number):number {
  const t=unit(n);
  const x=Math.min(t,1-t);
  const value=x*x*x*(x*(x*6-15)+10);
  return t<=.5?value:1-value;
}
export function physicalLeafPosition(direction:TurnDirection,travel:number):number {
  return direction===1?unit(travel):1-unit(travel);
}
export function pageDragTravel(direction:TurnDirection,delta:number,width:number):number {
  return unit(-direction*delta/Math.max(1,width*.36));
}
export function commitPageDrag(delta:number,travel:number):boolean {
  // A tap is an accessible complete turn. A hesitant reverse/short drag rolls
  // all the way back, never leaving the leaf up or changing the printed page.
  return Math.abs(delta)<9 || travel>=.21;
}
export function pageSettleSeconds(from:number,to:0|1):number {
  return to===1 ? .28+.52*(1-unit(from)) : .22+.23*unit(from);
}
export function pageSettlePosition(from:number,to:0|1,elapsed:number):number {
  return from+(to-from)*turnEase(elapsed/pageSettleSeconds(from,to));
}
export function turnTheatre(travel:number):{outgoing:number;incoming:number} {
  // Sculptures fold into the stock before crossing the spine and emerge
  // behind the passing paper, independent of their authored user controls.
  return {
    outgoing:1-turnEase((travel-.04)/.47),
    incoming:turnEase((travel-.52)/.46),
  };
}
export function commonTurnCamera(aspect:number):{position:[number,number,number];target:[number,number,number]} {
  const size=Math.max(1,1.16/Math.max(.35,aspect));
  return {position:[0,11.25*size,12.80*size],target:[0,.40,0]};
}
