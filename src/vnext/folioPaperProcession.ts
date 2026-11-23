const unit=(x:number)=>Math.max(0,Math.min(1,x));
export const paperEase=(a:number,b:number,x:number)=>{
  const t=unit((x-a)/(b-a));return t*t*(3-2*t);
};

/** Distinct world-space support and swing samples. Each planted foot holds
 * its preceding station; it advances one full interval only during its swing. */
export function paperFoot(progress:number,steps:number,side:0|1):[number,number]{
  if(progress<=0||progress>=1)return [unit(progress),0];
  const phase=progress*steps, index=Math.floor(phase), fraction=phase-index;
  const liftAt=side===0?.34:.02,landAt=side===0?.98:.65;
  const swing=unit((fraction-liftAt)/(landAt-liftAt));
  return [(index+paperEase(0,1,swing))/steps,Math.sin(Math.PI*swing)**2];
}

export const F12_FEED_START=2.58;
export const F12_PORTRAIT_DWELL=6.6;
export const f12FeedTime=(seconds:number)=>Math.max(0,seconds-F12_FEED_START);
const portraitSamples=[.68,1.52,1.90,2.28,2.54,F12_FEED_START,5.15,F12_PORTRAIT_DWELL];
export function f12ProcessionStep(at:number,dt:number):number{
  const boundary=portraitSamples.find(t=>t>at+.000002&&t<=at+dt);
  return boundary===undefined?dt:boundary-at+1e-7;
}
const f12Arrivals=[[.15,1.26],[.37,1.38],[.49,1.46],[.83,1.48]] as const;
export function f12PortraitPose(seconds:number,reduced:boolean){
  const returnHome=paperEase(5.12,F12_PORTRAIT_DWELL,seconds);
  const actors=f12Arrivals.map(([begin,end],i)=>{
    const walk=paperEase(begin,end,seconds);
    const deliberateError=i===3?paperEase(1.11,1.50,seconds)*(1-paperEase(2.12,2.50,seconds)):0;
    const give=i===2?paperEase(1.66,2.01,seconds)*(1-paperEase(2.24,2.52,seconds)):0;
    return {
      move:reduced?1:walk*(1-returnHome),
      miss:reduced?0:deliberateError,
      give:reduced?0:give,
      glance:reduced||i<2?0:paperEase(1.53,1.82,seconds)*(1-paperEase(2.33,2.58,seconds)),
      returning:!reduced&&returnHome>0,
    };
  });
  return {actors,grouped:reduced||seconds>=2.52&&seconds<=5.12,
    phase:reduced?'portrait':seconds<.15?'stations':seconds<1.48?'procession':
      seconds<1.66?'off-mark':seconds<2.52?'make-room':seconds<=5.12?'portrait':'return'};
}
