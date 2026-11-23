const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(a:number,b:number,t:number)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
export function reliefFoldCue(phase:number,reduced:boolean){
  if(reduced)return {look:0,receive:0,brace:0,load:0};
  return {
    look:smooth(1.55,2.30,phase)*(1-smooth(4.2,4.86,phase)),
    receive:smooth(3.0,3.56,phase)*(1-smooth(3.65,4.55,phase)),
    brace:smooth(3.18,3.63,phase)*(1-smooth(3.95,4.55,phase)),
    load:smooth(4.99,5.43,phase)*(1-smooth(5.48,6.15,phase)),
  };
}
export function pressPaperFlex(x:number,depth:number){
  const edge=clamp(Math.abs(x)/.2825);
  return depth*(Math.pow(edge,2.1)*.074-.022);
}
// First two mechanical beats lead the eye. No pulse survives the final star.
export function historicalMachineBeat(time:number,finale:number,locked:boolean,reduced:boolean){
  const quiet=locked&&(finale<0||finale>=2.72);
  if(quiet||reduced)return {beat:0,moving:false};
  const t=Math.max(0,time), hit=Math.max(0,1-(t%1.05)/.33);
  return {beat:hit*hit,moving:true};
}
