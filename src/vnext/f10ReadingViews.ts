export type F10ReadingView='book'|'containment'|'street';
const scale=(aspect:number)=>Math.max(1,Math.min(1.70,.82/Math.max(.35,aspect)));
/** Two editorial viewpoints of the same Living F10, in existing scene
 * coordinates. Wide framing offsets around the point of attention, not the
 * scene origin, so portrait readers still see the intended paper object. */
export function f10ReadingView(view:Exclude<F10ReadingView,'book'>,aspect:number,ground:boolean){
  const s=scale(aspect);
  if(view==='containment'){
    const target=[-1.07,.42,-.22] as const;
    return {target,position:[target[0]-.95*s,target[1]+1.60*s,target[2]+3.08*s] as const};
  }
  const target=ground?[.65,.46,-.30] as const:[1.87,.39,-.34] as const;
  return {target,position:[target[0]+.88*s,target[1]+.87*s,target[2]+2.20*s] as const};
}
