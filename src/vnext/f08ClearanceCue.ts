import {paperEase} from './folioPaperProcession.ts';

export const F08_CREW_CLEAR=2.62;
export const f08CrewRoute=[
  [[-2.19,1.29],[-1.40,1.18],[-.76,1.25]],
  [[-2.58,1.29],[-1.81,1.23],[-1.11,1.27]],
] as const;

export function clearanceCrewClock(seconds:number,on:boolean,dt:number,snap:boolean){
  if(seconds>=F08_CREW_CLEAR)return F08_CREW_CLEAR; // stay on the safe side until leaving the page
  if(snap)return on?F08_CREW_CLEAR:0;
  return Math.max(0,Math.min(F08_CREW_CLEAR,seconds+(on?1:-1.66)*Math.max(0,Math.min(.065,dt))));
}
export function clearanceCrewPose(seconds:number){
  const advance=paperEase(.12,1.20,seconds);
  const assist=paperEase(1.47,2.42,seconds);
  const grip=paperEase(1.20,1.49,seconds)*(1-paperEase(2.40,2.57,seconds));
  const positions=f08CrewRoute.map(([origin,hold,clear])=>{
    const stepped=seconds<=1.30?origin:hold,target=seconds<=1.30?hold:clear;
    const move=seconds<=1.30?advance:assist;
    return [stepped[0]+(target[0]-stepped[0])*move,stepped[1]+(target[1]-stepped[1])*move] as [number,number];
  });
  return {advance,assist,grip,positions,clear:seconds>=F08_CREW_CLEAR,
    phase:seconds<.12?'at-stations':seconds<1.2?'crossing-lane':seconds<1.47?'reaching':
      seconds<2.42?'tugging-clear':seconds<F08_CREW_CLEAR?'leaving-lane':'lane-clear'};
}
