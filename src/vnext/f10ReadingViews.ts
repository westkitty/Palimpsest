export type F10ReadingView='book'|'wall'|'street';
const scale=(aspect:number)=>Math.max(1,Math.min(1.70,.82/Math.max(.35,aspect)));
/** Two Administration study views from above the inhabited-side front of
 * the paper spread. The wall overview looks across the collar, never from
 * inside it. Wide framing offsets about the point of attention, not origin. */
export function f10ReadingView(view:Exclude<F10ReadingView,'book'>,aspect:number,ground:boolean){
  const s=scale(aspect);
  if(view==='wall'){
    const target=[-.94,.42,-.22] as const;
    return {target,position:[target[0]+1.25*s,target[1]+2.43*s,target[2]+3.25*s] as const};
  }
  const target=ground?[.65,.46,-.30] as const:[1.87,.39,-.34] as const;
  return {target,position:[target[0]+.82*s,target[1]+1.34*s,target[2]+2.20*s] as const};
}
