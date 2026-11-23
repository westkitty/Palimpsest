export const F08_ACT_DURATION=2.28;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
const ranged=(a:number,b:number,n:number)=>smooth((n-a)/(b-a));
export function f08CueClock(previous:number,wasOn:boolean,on:boolean,dt:number,snap:boolean):number{
  if(snap)return on?F08_ACT_DURATION:0;
  // If A is re-engaged during closure, retain its current paper pose, but
  // guarantee a dark interval before firing the aperture again.
  const seed=on&&!wasOn?Math.min(previous,.805):previous;
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
