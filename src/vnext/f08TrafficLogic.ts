/** Schematic anonymous traffic belongs to the physical Living diorama only. */
export const HOOKSHOT_PLANE=-.287, HOOKSHOT_CROSS=.58;
const LEFT_WAIT=.39,RIGHT_WAIT=.76;
export type TrafficState={p:number;direction:1|-1;on:boolean;started:boolean;crossings:number};
export const restingF08Traffic:TrafficState={p:0,direction:1,on:false,started:false,crossings:0};
export const f08TrafficWaypoints=[
  [0,-1.05,.24,1.67],[.29,-1.48,.73,.82],[LEFT_WAIT,-1.66,.965,.43],
  [HOOKSHOT_CROSS,-1.66,.965,HOOKSHOT_PLANE],[.73,-1.78,1.10,-.86],
  [.84,-2.35,1.22,-1.22],[1,-3.17,.55,-1.19],
] as const;
const clamp=(t:number)=>Math.max(0,Math.min(1,t));
const smooth=(t:number)=>{const x=clamp(t);return x*x*(3-2*x);};
export function f08TrafficPosition(at:number):[number,number,number]{
  for(let i=1;i<f08TrafficWaypoints.length;i++){
    const a=f08TrafficWaypoints[i-1],b=f08TrafficWaypoints[i];
    if(at<=b[0]||i===f08TrafficWaypoints.length-1){
      const t=clamp((at-a[0])/(b[0]-a[0]));
      // No easing through the plane: the real middle stretch is one glide.
      const blend=i===3||i===4?t:i===1?t*(2-t):i===6?smooth(t):t;
      return [a[1]+(b[1]-a[1])*blend,a[2]+(b[2]-a[2])*blend,a[3]+(b[3]-a[3])*t];
    }
  }
  return [-3.17,.55,-1.19];
}
export function f08TrafficStep(s:TrafficState,on:boolean,permitted:boolean,dt:number,reduced:boolean):TrafficState{
  let p=s.p,direction=s.direction;
  if(!s.started&&on&&permitted)return {p:1,direction:1,on,started:true,crossings:0};
  if(on&&!s.on)direction=p<=HOOKSHOT_CROSS?1:-1;
  if(reduced){
    if(on&&permitted)p=direction===1?1:0;
    else if(!on)p=p<=HOOKSHOT_CROSS?0:1;
    return {p,direction,on,started:true,crossings:s.crossings};
  }
  const beforePlane=p<HOOKSHOT_CROSS||(p===HOOKSHOT_CROSS&&direction>0);
  const home=beforePlane?0:1;
  const target=!on?home:permitted?(direction===1?1:0):(direction===1?LEFT_WAIT:RIGHT_WAIT);
  // After an interrupted transit the courier can only finish/return on its
  // existing side. A new crossing always requires the opened native shutters.
  const speed=on&&!permitted?.61:1.10;
  const step=Math.min(.065,Math.max(0,dt))*speed;
  p+=Math.sign(target-p)*Math.min(Math.abs(target-p),step);
  const crosses=permitted&&on&&(direction===1?s.p<HOOKSHOT_CROSS&&p>=HOOKSHOT_CROSS:s.p>HOOKSHOT_CROSS&&p<=HOOKSHOT_CROSS);
  return {p,direction,on,started:true,crossings:s.crossings+Number(crosses)};
}
export function f08TrafficPhase(s:TrafficState,permitted:boolean):string{
  if(s.p<=.0001)return s.direction<0&&s.on?'docked-front':'front-berth';
  if(s.p>=.9999)return 'docked-far';
  if(!s.on)return 'clear-approach';
  const forward=s.direction===1;
  const waiting=forward?LEFT_WAIT:RIGHT_WAIT;
  if(!permitted&&Math.abs(s.p-waiting)<.0001)return 'holding';
  if(forward?s.p<LEFT_WAIT:s.p>RIGHT_WAIT)return 'approach';
  if(forward?s.p<.75:s.p>.48)return 'transit';
  return 'exit';
}
