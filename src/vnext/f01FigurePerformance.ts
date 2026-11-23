import * as THREE from 'three';

const actorNames=['tiger','wordstreamer','nialbu'] as const;
const rate=[.77,1.13,.63] as const;
const ramp=(age:number,a:number,b:number)=>THREE.MathUtils.smoothstep(age,a,b);
const phrase=(age:number,start:number,hold:number,end:number)=>
  ramp(age,start,hold) * (1-ramp(age,end,end+.48));

function requireMesh(model:THREE.Object3D,name:string):THREE.Mesh {
  const mesh=model.getObjectByName(name);
  if(!(mesh instanceof THREE.Mesh))throw new Error('Missing original F01 face stock: '+name);
  return mesh;
}

export function bindF01FigurePerformance(model:THREE.Group, idle:THREE.AnimationClip | undefined) {
  if(!idle)throw new Error('F01 authored standee performance absent');
  const mixer=new THREE.AnimationMixer(model);
  const idlePatterns=[/Tiger/i,/Wordstreamer|^Mesh199\./i,/NiAlBu/i];
  const actions=idlePatterns.map((rule,i)=>{
    const tracks=idle.tracks.filter(t=>rule.test(t.name));
    if(!tracks.length)throw new Error('F01 actor idle absent: '+actorNames[i]);
    const a=mixer.clipAction(new THREE.AnimationClip('F01 authored actor '+i,idle.duration,tracks)).play();
    a.paused=true;
    return a;
  });
  // The new layer never competes with the Blender body/face clips, figure lifts
  // or A/B/C authored hinges. Its only pivot is the standee's planted mount.
  const pivots=actorNames.map(name=>{
    const actor=model.getObjectByName('palimpsest-original-'+name);
    const body=actor?.children[0];
    if(!actor||!body)throw new Error('Missing original F01 standee: '+name);
    const pivot=new THREE.Group();
    pivot.name='F01 mounted attention / '+name;
    actor.add(pivot);
    pivot.add(body);
    return pivot;
  });

  const eyes=['L','R'].map(s=>requireMesh(model,'F01_Tiger_|_existing_cyan_slit_'+s));
  const band=requireMesh(model,'Mesh199'); // Existing Wordstreamer cheek/eye ink, never a new eyeball.
  const bandHeight=band.scale.y;
  const jaw=requireMesh(model,'Mesh131');
  const cuts=['Mesh133','Mesh136'].map(n=>requireMesh(model,n));
  const legacy=new Set<THREE.Material>(cuts.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]));
  cuts.forEach(n=>n.material=jaw.material);
  model.traverse(n=>{
    if(n instanceof THREE.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])legacy.delete(m);
  });
  legacy.forEach(m=>m.dispose());

  // Turn the legacy pale cones into dark foreground mineral cuts and inlay the
  // original cyan print just behind them. This is a recessed, tapered mouth
  // opening on the imported head, not a neon outline or any new anatomy.
  const grin=new THREE.Shape().moveTo(-.058,-.033).lineTo(-.035,-.041)
    .lineTo(-.018,-.037).lineTo(0,-.046).lineTo(.021,-.037)
    .lineTo(.04,-.04).lineTo(.056,-.032).lineTo(.044,-.047)
    .lineTo(.019,-.054).lineTo(-.012,-.055).lineTo(-.037,-.05).closePath();
  const inner=new THREE.Mesh(new THREE.ShapeGeometry(grin),eyes[0].material);
  inner.name='F01 Tiger cyan inner mouth ink';
  inner.position.z=.139;
  jaw.parent!.add(inner);

  const ages=[0,0,0], exposed=[false,false,false];
  return {
    update(stations:readonly number[],dt:number,reduced:boolean,stageVisible:boolean) {
      const visible=stations.map(v=>stageVisible&&v>=1);
      for(let i=0;i<3;i++){
        const wasActive=exposed[i];
        exposed[i]=visible[i]&&!reduced;
        ages[i]=exposed[i]&&wasActive?ages[i]+dt:0;
      }
      const idleTimes=actions.map((a,i)=>{
        // Start at the authored rest frame every time a station is newly exposed.
        const t=(ages[i]*rate[i])%idle.duration;
        a.time=t;
        a.setEffectiveWeight(exposed[i]?ramp(ages[i],0,.32):0);
        return t;
      });
      mixer.update(0);

      // A pair can notice each other only when both figures are exposed.
      // The reveals themselves stay untouched; this is an editorial eye-line,
      // not a literal meeting or a new narrative beat.
      const first=exposed[0]&&exposed[1]?ages[1]%13.8:0;
      const second=exposed[1]&&exposed[2]?ages[2]%13.8:0;
      const toWord=phrase(first,.31,.67,1.64);
      const towardTiger=phrase(first,.68,1.01,1.71);
      const toNiAlBu=phrase(second,1.09,1.49,2.31);
      const towardWord=phrase(second,1.44,1.86,2.49);
      const yaw=[.145*toWord,-.107*towardTiger+.129*toNiAlBu,0-.159*towardWord];
      pivots.forEach((pivot,i)=>pivot.rotation.y=yaw[i]);

      // Tiger's equal solid cyan scores blink in the exported animation; the
      // central standee simply narrows its existing ink band. The right figure
      // has no separate eye ink: use the native observation plate, not eyes.
      const bandAge=ages[1]%6.33;
      const bandBlink=ramp(bandAge,2.15,2.22)*(1-ramp(bandAge,2.26,2.38));
      band.scale.y=bandHeight*(1-.94*bandBlink);
      return {idleTimes,attention:ages.map((visibleAge,i)=>({visibleAge,yaw:yaw[i]}))};
    },
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);},
  };
}
