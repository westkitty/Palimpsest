/** Monotonic acted time for capillary spread. Spatial gating lives in its paper shader. */
export function f02InkRate(advance:number):number {
  if(advance<.115)return .58; // fall and fork
  if(advance<.34)return .43;  // the channels stain outward across the rag
  if(advance<.47)return .19;  // binding dam
  if(advance<.68)return .77;  // the overflow surges across the facing leaf
  return .37;
}
export function f02InkBeat(advance:number):string {
  if(advance<=0)return 'white-vellum';
  if(advance<.115)return 'drop-and-forks';
  if(advance<.34)return 'wick';
  if(advance<.47)return 'gutter-dam';
  if(advance<.68)return 'crossing';
  return advance<1?'soaking':'settled';
}
export function f02ArmExtensions(frame:number):number[]{
  return Array.from({length:4},(_,i)=>{
    const t=Math.max(0,Math.min(1,(frame-72-i*3.8)/18));
    return .21+.79*(t*t*(3-2*t));
  });
}
export function f02AnchoredHeight(height:number,extension:number):number {
  // Common spatial deformation for every original strip, its ink, and its
  // five V supports. Their contacts agree exactly and the glued feet are still.
  const contact=.034;
  return height<=contact?height:contact+(height-contact)*extension;
}
