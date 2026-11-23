import * as THREE from 'three';

export const f04Detents=[2.4,7.4,14.4,21.4,28.4,35.4] as const;
export function f04EnvironmentalRead(frame:number){
  let segment=-1;
  for(let i=0;i<f04Detents.length-1;i++){
    if(frame>=f04Detents[i]&&frame<f04Detents[i+1]){segment=i;break;}
  }
  const along=segment<0?0:THREE.MathUtils.clamp((frame-f04Detents[segment])/(f04Detents[segment+1]-f04Detents[segment]),0,1);
  return {segment,along,colonySignal:frame>=f04Detents[0],relays:f04Detents.slice(1).map(x=>THREE.MathUtils.smoothstep(frame,x-.6,x+1.4))};
}

export function createF04Environment(parent:THREE.Group,colony:THREE.Object3D,lamps:THREE.Object3D[]){
  const stage=new THREE.Group();stage.name='F04 · scored expansion network and low relay hinges';parent.add(stage);
  const signal=new THREE.Group();signal.name='F04 · controlled signal fixed to native colony';colony.add(signal);
  const all:THREE.Mesh[]=[];const mats=new Set<THREE.Material>();
  const paper=(color:number,extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color,roughness:.87,side:THREE.DoubleSide,...extra});
  function put(parent:THREE.Object3D,name:string,g:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0){
    const m=new THREE.Mesh(g,mat);m.name=name;m.position.set(x,y,z);parent.add(m);all.push(m);mats.add(mat);return m;
  }
  const box=(p:THREE.Object3D,name:string,mat:THREE.Material,w:number,h:number,d:number,x=0,y=0,z=0)=>
    put(p,name,new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const black=paper(0x263432),trim=paper(0x8a7755),railInk=paper(0x584f3c),flare=new THREE.MeshBasicMaterial({color:0xffdb93}),
    ruby=paper(0x2e2020),cargoStock=paper(0x917645),lightPrint=paper(0xd4b486);
  const gray=paper(0x354748);
  const lens=put(signal,'Paper first lamp amber insert',new THREE.CylinderGeometry(.095,.091,.018,20),flare,-.220,.587,-.10);
  put(signal,'First lamp folded graphite ring',new THREE.TorusGeometry(.104,.019,6,20),gray,-.220,.587,-.10).rotation.x=-Math.PI*.5;
  const coal=put(signal,'Unlit colony signal face',new THREE.CylinderGeometry(.092,.078,.016,20),black,-.220,.585,-.10);
  // Bring the colony wire out through the fore-edge instead of letting
  // its first lit pulse run invisibly underneath the city card.
  const cutPoint=new THREE.Vector3(-1.62,.123,.48);
  box(stage,'Colony outgoing signal cut and brass heel',trim,.13,.044,.10,-1.62,.113,.49);
  const nodes=[cutPoint,...lamps.map(n=>n.position.clone().add(new THREE.Vector3(0,-.07,.015)))];
  const paths=nodes.slice(1).map((n,i)=>{
    const a=nodes[i],middle=a.clone().lerp(n,.57);
    middle.z+=i===0?.08:.034;
    if(i===0)return new THREE.CatmullRomCurve3([
      a,new THREE.Vector3(-1.33,.13,.53),new THREE.Vector3(-.76,.145,.45),
      new THREE.Vector3(-.65,.154,-.06),n,
    ]);
    return new THREE.CatmullRomCurve3([a,middle,n]);
  });
  const final=nodes.at(-1)!;
  const darkTail=new THREE.CatmullRomCurve3([final.clone(),new THREE.Vector3(.67,.183,-.57),new THREE.Vector3(.91,.109,-.37)]);
  const printed=(curve:THREE.Curve<THREE.Vector3>,name:string,col:THREE.Material,r=.012)=>put(stage,name,new THREE.TubeGeometry(curve,24,r,4),col);
  paths.forEach((p,i)=>{
    printed(p,'Scored low paper route rail '+(i+1),railInk,.021);
    const edge=new THREE.CatmullRomCurve3(p.getPoints(8).map(q=>q.add(new THREE.Vector3(0,.013,.018))));
    printed(edge,'Saffron pressed crease edge '+(i+1),trim,.006);
  });
  printed(darkTail,'Unfinished dark lane, no destination represented',gray,.021);
  box(stage,'Unlit cut edge at unfinished lane',black,.096,.030,.060,.916,.11,-.370);
  const pulse=new THREE.Group();pulse.name='Ink glint travelling the scored connections';stage.add(pulse);
  for(let i=0;i<4;i++)put(pulse,'Struck saffron pulse ink '+i,new THREE.SphereGeometry(.045-i*.008,8,5),flare);
  const relays=lamps.map((l,i)=>{
    const x=l.position.x, z=-.545+(i%2)*.078;
    box(stage,'Clip in the paper dock',black,.165,.016,.119,x,.102,z);
    box(stage,'Die-cut coil beneath dock',trim,.118,.016,.009,x,.120,z+.061);
    const flap=new THREE.Group();flap.name='A relay opens as its preceding pulse lands';flap.position.set(x,.123,z-.053);stage.add(flap);
    box(flap,'Attached dark paper relay hinge',trim,.134,.021,.023,0,0,0);
    box(flap,'The cargo leaf raises actual paper',cargoStock,.127,.024,.117,0,.006,.064);
    box(flap,'Saffron crease scored into packet face',lightPrint,.080,.018,.012,0,.024,.080);
    box(flap,'Folded relay receipt tab',gray,.041,.021,.036,.037,.026,.112);
    return flap;
  });
  // A small, anonymous working rhythm in the last already-lit dock.
  // It turns an existing paper receipt from the receiving side to the
  // filing side. The unfinished rail has no new lamp or destination.
  const lastLamp=lamps.at(-1)!;
  const terminal=new THREE.Group();terminal.name='Last lit relay · receive, check, and file';
  terminal.position.set(lastLamp.position.x-.018,.103,-.446);
  stage.add(terminal);
  const terminalFace=paper(0x596a5c),receiptStock=paper(0xb99365);
  box(terminal,'Working dock footing under the last relay',black,.174,.022,.140,0,0,0);
  for(const side of [-1,1]){
    box(terminal,'Laminated receiving and filing rim',trim,.030,.039,.110,side*.072,.022,-.001);
  }
  const shutter=new THREE.Group();shutter.name='Last relay lift-and-return hinge';
  shutter.position.set(0,.051,-.029);terminal.add(shutter);
  box(shutter,'Folded inspection cover',terminalFace,.132,.021,.075,0,.007,-.028);
  box(shutter,'Burnished last inspection edge',trim,.111,.015,.012,0,.019,-.060);
  const receipt=box(terminal,'Existing last dock receipt slides under the cover',receiptStock,.068,.010,.073,0,.026,.032);
  box(terminal,'Terminal receiving rail stays on this card',trim,.136,.013,.013,0,.024,.060);
  let endpointAge=0;
  // Evidence on the already-authored reverse. These are broken print folds,
  // not extra attacks, destinations, or a chronological casualty diagram.
  for(const [i,pair] of [[-.65,-.51],[-.31,.13],[.12,-.06],[.41,.32]].entries()){
    const [x,z]=pair;
    const crack=box(colony,'Pressed fracture on the existing counter-response face',i%2?gray:ruby,.267,.012,.043,x,-.0615,z);
    crack.rotation.y=(i%2?1:-1)*(.37+i*.22);
  }
  return {update(frame:number,dt=0,reduced=false){
    const story=f04EnvironmentalRead(frame);
    // Run this little task after—not during—the arrival of the fifth pulse.
    // An early pause holds the wave, but a settled outpost can keep working.
    const endpoint=story.relays[4]>=.999;
    endpointAge=endpoint?(endpointAge+Math.min(.075,Math.max(0,dt)))%2.84:0;
    const cycle=reduced?0:endpointAge;
    const cover=endpoint
      ?THREE.MathUtils.smoothstep(cycle,.08,.47)*(1-THREE.MathUtils.smoothstep(cycle,1.64,2.11)):0;
    const check=endpoint
      ?THREE.MathUtils.smoothstep(cycle,.43,.92)*(1-THREE.MathUtils.smoothstep(cycle,1.37,1.88)):0;
    shutter.rotation.x=.93*cover;
    receipt.position.z=.032-.070*check;
    receipt.position.y=.026+.038*check;
    receipt.rotation.x=-.31*check;
    lens.visible=story.colonySignal;coal.visible=!story.colonySignal;
    pulse.visible=story.segment>=0;
    if(story.segment>=0){
      for(let j=0;j<pulse.children.length;j++){
        const along=Math.max(0,story.along-j*.085);
        const position=paths[story.segment].getPoint(along);
        position.y+=.032;
        pulse.children[j].position.copy(position);
      }
    }
    relays.forEach((r,i)=>{r.rotation.x=-1.07*story.relays[i];});
    return {colonySignal:story.colonySignal,pulseSegment:story.segment,pulseAlong:story.along,
      relaysUnfolded:story.relays.filter(x=>x>.90).length,unfinishedLaneDark:true,
      endpointRoutine:{active:endpoint,cover,receipt:check}};
  },dispose(){
    all.forEach(n=>{n.removeFromParent();n.geometry.dispose();});
    mats.forEach(m=>m.dispose());stage.removeFromParent();signal.removeFromParent();
  }};
}
