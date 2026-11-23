export const F08_ACT_DURATION=3.56;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
const ranged=(a:number,b:number,n:number)=>smooth((n-a)/(b-a));
export function f08CueClock(previous:number,wasOn:boolean,on:boolean,dt:number,snap:boolean):number{
  if(snap)return on?F08_ACT_DURATION:0;
  // If A is re-engaged during closure, retain its current paper pose, but
  // guarantee a dark interval before firing the aperture again.
  // The longer visible reflection must not lengthen the existing shutter
  // release after A is cut. The aperture follows its original close clock.
  const seed=on&&!wasOn?Math.min(previous,.805):!on&&wasOn?Math.min(previous,2.28):previous;
  return Math.max(0,Math.min(F08_ACT_DURATION,seed+Math.min(.07,Math.max(0,dt))*(on?1:-2.25)));
}
export function f08Cue(t:number,on:boolean) {
  const left=ranged(.025,.50,t),right=ranged(.24,.76,t);
  const collar=on?ranged(.91,1.23,t):0;
  const rim=on?ranged(1.15,1.51,t):0;
  const plasma=on?ranged(1.47,1.89,t):0;
  const impulse=on?ranged(1.48,1.78,t)*(1-ranged(1.82,2.20,t)):0;
  const phase=!on?'off':t<.24?'first-shutter':t<.76?'second-shutter':t<.91?'open-dark':
    t<1.15?'collar':t<1.47?'rim':t<1.89?'ignition':t<F08_ACT_DURATION?'settling':'settled';
  return {left,right,collar,rim,plasma,impulse,phase};
}
export function f08LeafTravel(progress:number):number[]{
  // Each child remains at the previous paper crease in the actual source
  // hierarchy. A small stagger makes the opening front travel to the far fold.
  return Array.from({length:4},(_,i)=>ranged(i*.105,.69+i*.103,progress));
}

/** Directional A-only theatrical witness: folded stock reflects toward Marcel. */
export function f08ThresholdCue(t:number,on:boolean,reduced=false){
  const lean=Array.from({length:7},(_,i)=>
    ranged(1.35+i*.085,1.82+i*.110,t)*(1-ranged(2.25+i*.09,3.10+i*.035,t)*.42));
  const head=!on?-1:Math.min(7,Math.max(-1,Math.floor((t-1.63)/.153)));
  const edge=(i:number,lag=0)=>{
    if(!on)return 0;
    const at=1.63+i*.153+lag;
    const tail=ranged(at,at+.15,t)*.22;
    if(reduced)return tail;
    return tail+ranged(at,at+.097,t)*(1-ranged(at+.12,at+.31,t))*.73;
  };
  const edges=Array.from({length:7},(_,i)=>edge(i));
  const floor=Array.from({length:7},(_,i)=>edge(i,.073)*.79);
  const contact=edge(7,.006);
  const climb=on?ranged(2.62,3.17,t):0;
  const actorLight=on?(ranged(2.63,3.01,t)*(reduced?.60:2.25-1.42*ranged(3.01,3.54,t))):0;
  const phase=!on?'off':t<1.63?'rest':t<2.62?'fold-crawl':t<3.17?'marcel-reflection':'settled';
  return {lean,head,edges,floor,contact,climb,actorLight,phase};
}
