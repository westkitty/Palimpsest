const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const s=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export function paperFeedMotion(at:number,reduced:boolean){
  const feed=reduced?1:s(.14,.82,at);
  const grip=reduced?0:s(.62,.87,at)*(1-s(1.12,1.38,at));
  const press=reduced?0:s(.88,1.02,at)*(1-s(1.12,1.29,at));
  const eject=reduced?0:s(1.36,2.05,at);
  return {feed,grip,press,eject,marked:reduced||at>=1.09,
    stage:reduced?'parked':at<.20?'waiting':at<.87?'feeding':at<1.29?'pressing':at<2.05?'leaving':'residue'} as const;
}
export function depthShadowPosition(seconds:number){
  // One diffuse occlusion crosses the whole stage and returns slowly.
  return 3.8*Math.cos(Math.max(0,seconds)*Math.PI/11);
}
