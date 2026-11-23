/** This is the existing ink-crossing crease in the spread, not an in-world
 * origin claim or the separate lower-left wick. Coordinates are world XYZ. */
export const F02_RETURN_CREASE=[-.09,.224,.27] as const;
export const F02_RETURN_SECONDS=2.58;
export const F02_RETURN_NEAR=[.06,2.48,2.40] as const;
const ease=(n:number)=>{const x=Math.max(0,Math.min(1,n));return x*x*(3-2*x);};
export function f02WitnessReturn(seconds:number,reduced=false){
  if(reduced)return {stage:'page',collapse:1,glint:0,approach:1,recede:1} as const;
  const at=Math.min(F02_RETURN_SECONDS,Math.max(0,seconds));
  const collapse=ease((at-.09)/.83);
  const approach=ease(at/.96);
  const recede=ease((at-1.33)/(F02_RETURN_SECONDS-1.33));
  // The position holds for 0.37s; this is a modest raking reflection, not a flash.
  const glint=.58*ease((at-.60)/.31)*(1-ease((at-1.30)/.48));
  return {stage:at<.96?'gathering':at<1.33?'crease-hold':at<F02_RETURN_SECONDS?'receding':'page',
    collapse,glint,approach,recede} as const;
}
