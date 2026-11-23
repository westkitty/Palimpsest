import * as THREE from 'three';

export const F01_STATIONS = ['Tiger','Wordstreamer','NiAlBu'] as const;
const edges=[-3.98,-1.335,1.335,3.98] as const;
const centers=[-2.67,0,2.67] as const;
const stationWindows=[[.015,.276],[.317,.574],[.616,.878]] as const;
const range=(v:number,a:number,b:number)=>THREE.MathUtils.clamp((v-a)/(b-a),0,1);
const smooth=(v:number)=>v*v*(3-2*v);
export function f01CreaseProgress(position:number) {
  return stationWindows.map(([a,b])=>range(position,a,b));
}
export function f01ArchJoin(position:number):number {return smooth(range(position,.901,1));}

function card(color:number){
  return new THREE.MeshStandardMaterial({color,roughness:.95,metalness:0,side:THREE.DoubleSide});
}

function strip(root:THREE.Object3D,w:number,h:number,d:number,material:THREE.Material,at:THREE.Vector3,name:string){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.name=name;mesh.position.copy(at);
  mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
}

const prism=(n:number)=>{
  // The top face and bonded lower lip share each hinge edge. No plane or y scaling substitutes for stock.
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*6),3).setUsage(THREE.DynamicDrawUsage));
  const ix=[];
  for(let i=1;i<n-1;i++)ix.push(0,i+1,i,n,n+i,n+i+1);
  for(let i=0;i<n;i++){const j=(i+1)%n;ix.push(i,j,j+n,i,j+n,i+n);}
  g.setIndex(ix);return g;
};
function setShape(geometry:THREE.BufferGeometry,points:readonly THREE.Vector3[],thickness:number){
  const n=points.length,a=geometry.getAttribute('position');
  for(let i=0;i<n;i++){
    const p=points[i];a.setXYZ(i,p.x,p.y,p.z);a.setXYZ(i+n,p.x,p.y-thickness,p.z);
  }
  a.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}

type XP=[number,number];
const shadowContours:readonly XP[][]=[
  [[.14,.14],[.79,.08],[.86,.44],[.77,.84],[.34,.93],[.20,.73],[.09,.57]],
  [[.29,.05],[.67,.04],[.75,.67],[.57,.98],[.38,.92],[.25,.65]],
  [[.33,.13],[.75,.09],[.84,.32],[.75,.71],[.62,.72],[.58,.86],[.26,.81],[.15,.57]],
];

export function bindF01EnvironmentalStage(model:THREE.Group){
  const stageParent=model.getObjectByName('Group001');
  const arches=['Group002','Group004','Group006'].map(x=>model.getObjectByName(x));
  const actors=['tiger','wordstreamer','nialbu'].map(x=>model.getObjectByName('palimpsest-original-'+x));
  if(!stageParent||arches.some(x=>!x)||actors.some(x=>!x))throw new Error('F01 must expose all three authored paper territories');
  const actorBase=actors.map(x=>x!.quaternion.clone());
  const archBase=arches.map(x=>x!.quaternion.clone());
  const layer=new THREE.Group();layer.name='F01 connected three-panel depth stage';
  stageParent.add(layer);
  const black=card(0x171a21),edge=card(0x353013);
  const gapMat=card(0x20252f),score=card(0x534935);
  const fold=new THREE.Quaternion(),ax=new THREE.Vector3(1,0,0),az=new THREE.Vector3(0,0,1);
  const depths=[.13,.225,.18];
  const panels=centers.map((x,i)=>{
    const material=card([0x28313e,0x333942,0x28353c][i]);
    const geo=prism(4);const panel=new THREE.Mesh(geo,material);
    panel.name='F01 shared-spine foil / '+F01_STATIONS[i];panel.castShadow=true;panel.receiveShadow=true;
    layer.add(panel);
    const blackGeometry=prism(shadowContours[i].length);
    const blackInk=new THREE.MeshBasicMaterial({color:[0x12161d,0x151923,0x10171c][i],side:THREE.DoubleSide,
      transparent:true,opacity:.20,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const shadow=new THREE.Mesh(blackGeometry,blackInk);shadow.renderOrder=2;
    shadow.name='F01 carved shadow ' + F01_STATIONS[i];layer.add(shadow);
    return {geo,blackGeometry,blackInk};
  });
  const spine=strip(layer,7.97,.025,.067,black,new THREE.Vector3(0,.248,.48),'F01 continuous front hinge');
  strip(spine,7.91,.009,.010,edge,new THREE.Vector3(0,.016,.011),'F01 front hinge scored edge');
  const scoredSeams=edges.slice(1,-1).map(x=>strip(layer,.027,.012,1,score,new THREE.Vector3(x,.255,.05),'F01 common crease between panels'));

  // The two scored links fill only the gaps between the three actual imported
  // niche arches. Stay in their rear silhouette plane; never paint over an actor.
  const bridges=[-1.637,1.040].map((x,i)=>{
    const pivot=new THREE.Group();pivot.name='F01 late arch latch '+(i+1);pivot.position.set(x,.68,-2.56);layer.add(pivot);
    const outline=new THREE.Shape().moveTo(0,0).lineTo(.615,0).lineTo(.615,.47)
      .lineTo(.496,.54).lineTo(.314,.457).lineTo(.160,.54).lineTo(0,.47).closePath();
    const connector=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.082,bevelEnabled:true,
      bevelThickness:.008,bevelSize:.009,bevelSegments:1,curveSegments:1}),gapMat);
    connector.castShadow=true;connector.receiveShadow=true;pivot.add(connector);
    strip(pivot,.575,.018,.010,score,new THREE.Vector3(.305,.128,.085),'Scored bridge joint');
    return pivot;
  });
  const frontZ=.48,frontY=.252;
  const provisional=new THREE.Vector3();
  function update(position:number){
    const stations=f01CreaseProgress(position),join=f01ArchJoin(position);
    const raised=stations.map(smooth);
    // A foot is fixed to each authored hinge, not interpolated across the paper.
    for(let i=0;i<3;i++){
      const foldFrom=[1.26,1.17,1.19][i];
      fold.setFromAxisAngle(ax,foldFrom*(1-raised[i]));
      actors[i]!.quaternion.copy(actorBase[i]).multiply(fold);
      const roll=[.057,-.033,-.056][i]*(1-join)*(1-raised[i]);
      fold.setFromAxisAngle(az,roll);
      arches[i]!.quaternion.copy(archBase[i]).multiply(fold);
    }
    const y=[raised[0]*depths[0],(raised[0]*depths[0]+raised[1]*depths[1])*.5,
      (raised[1]*depths[1]+raised[2]*depths[2])*.5,raised[2]*depths[2]];
    const z=[raised[0],(raised[0]+raised[1])*.5,(raised[1]+raised[2])*.5,raised[2]];
    const front=(x:number)=>new THREE.Vector3(x,frontY,frontZ);
    const back=(i:number)=>new THREE.Vector3(edges[i],.280+y[i],-.34-z[i]*.30);
    panels.forEach(({geo,blackGeometry,blackInk},i)=>{
      const lo=back(i),hi=back(i+1),lF=front(edges[i]),rF=front(edges[i+1]);
      setShape(geo,[lF,rF,hi,lo],.037);
      // Three bounded, charcoal-only occlusion cuts on the stock itself. Those
      // shadows grow along different contours from each station, never globally.
      const pts=shadowContours[i].map(([x,d])=>{
        const v=THREE.MathUtils.lerp(.14,.96,d)*(0.50+0.5*raised[i]);
        const out=lF.clone().lerp(rF,x).lerp(provisional.copy(lo).lerp(hi,x),v);
        out.y+=.007;return out;
      });
      setShape(blackGeometry,pts,.003);
      blackInk.opacity=.16+.61*raised[i];
    });
    scoredSeams.forEach((bar,i)=>{
      const f=front(edges[i+1]);f.y+=.009;
      const b=back(i+1);b.y+=.009;
      bar.position.copy(f).add(b).multiplyScalar(.5);
      bar.scale.z=f.distanceTo(b)+.005;
      bar.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),b.sub(f).normalize());
    });
    bridges.forEach((pivot,i)=>{
      pivot.visible=join>.002;
      pivot.rotation.y=(i===0?1:-1)*(1-join)*1.18;
    });
    return {stations,archJoin:join,depths:y.map(n=>Number(n.toFixed(3))),
      territories:raised.map(n=>Number((.16+.61*n).toFixed(3)))};
  }
  update(0);
  return {update};
}
