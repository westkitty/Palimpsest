import * as THREE from 'three';
import { getOpenPageY as pageY } from '../engine/BookAndDeskRig';

const sat=(n:number)=>Math.max(0,Math.min(1,n));
const step=(x:number,a:number,b:number)=>sat((x-a)/(b-a));
export function f09Cue(frame:number) {
  const phase=frame<10?'rest':frame<18?'tension':frame<31?'inward-wave':frame<49?'scored-fold':'quiet-absence';
  const waves=[0,1,2].map(i=>{
    const t=step(frame,18+i*4,43+i*3);
    return Math.sin(t*Math.PI)**2 * [1,.75,.55][i];
  });
  const petals=Array.from({length:8},(_,i)=>38+12*step(frame,31+i*.80,40+i*.80));
  const ramp=step(frame,30,34)*(1-step(frame,44,49));
  const gimbal=[0,1,2].map(i=>ramp*Math.sin((frame-29)*1.72+i*.72)*[.059,.043,.035][i]);
  return {phase,waves,petals,gimbal};
}

/** Full cut-paper sectors hinged outside the model and turning toward it.
 * The sectors are local to the left model leaf; there is no shared transform
 * with the historical symbols, light field or containment diagram.
 */
export function newF09CollapsingPaperGround(owner:THREE.Group,center:THREE.Vector3){
  const assembly=new THREE.Group();assembly.name='F09 model-leaf · three inward scored waves';owner.add(assembly);
  const angle=(d:number)=>d*Math.PI/180;
  const shades=[0x31414a,0x283740,0x26333b];
  const inks=[0x708580,0x60716d,0x505f5f];
  const tiers=[.86,1.19,1.52].map((r,j)=>{
    const paper=new THREE.MeshStandardMaterial({color:shades[j],roughness:.96,side:THREE.DoubleSide});
    const ink=new THREE.MeshStandardMaterial({color:inks[j],roughness:.94,side:THREE.DoubleSide});
    return [116,146,175,204,233,263].map((deg,k)=>{
      const t=angle(deg),x=center.x+Math.cos(t)*r,z=center.z+Math.sin(t)*r;
      const pivot=new THREE.Group();pivot.name='F09 model leaf scored ground '+j+'/'+k;
      pivot.position.set(x,pageY(x)+.028+.003*(2-j),z);
      pivot.rotation.y=Math.atan2(Math.cos(t),Math.sin(t));assembly.add(pivot);
      const lane=new THREE.Group();pivot.add(lane);
      const w=[.40,.54,.68][j],len=[.29,.32,.33][j];
      const geo=new THREE.Shape().moveTo(-w/2,0).lineTo(w/2,0).lineTo(w*.432,len*.64)
        .lineTo(w*.29,len).lineTo(-w*.29,len).lineTo(-w*.42,len*.66).closePath();
      const panel=new THREE.Mesh(new THREE.ExtrudeGeometry(geo,{depth:.020,bevelEnabled:false,curveSegments:1}),paper);
      panel.rotation.x=-Math.PI/2;panel.castShadow=true;panel.receiveShadow=true;lane.add(panel);
      const hinge=new THREE.Mesh(new THREE.BoxGeometry(w*.98,.018,.019),ink);
      hinge.position.set(0,.012,0);hinge.receiveShadow=true;pivot.add(hinge);
      const crease=new THREE.Mesh(new THREE.BoxGeometry(w*.64,.009,.013),ink);
      crease.position.set(.009,.025,-len*.72);crease.rotation.y=(k%2===0?1:-1)*.14;lane.add(crease);
      const foot=new THREE.Mesh(new THREE.BoxGeometry(w*1.04,.023,.052),paper);
      foot.position.set(0,-.010,.044);foot.receiveShadow=true;pivot.add(foot);
      return lane;
    });
  });
  return {
    update(frame:number,reduced:boolean){
      const {waves}=f09Cue(frame);
      const movement=(reduced?[0,0,0]:waves);
      tiers.forEach((tier,j)=>tier.forEach((leaf,k)=>{
        // Positive rotation lifts the free near edge into the well; glue feet and hinge axes remain in place.
        leaf.rotation.x=.015+movement[j]*([1.30,1.18,1.04][j]-.025*Math.abs(k-2.5));
      }));
      return movement.map(n=>Number(n.toFixed(3)));
    },
  };
}

/** The model's mounting bed is sacrificed, not the historical witness leaf.
 * Separate glued roots, cut edges, printed gold traces and a dry, level endpoint.
 */
export function makeF09RuptureBed(owner:THREE.Group,center:THREE.Vector3){
  const group=new THREE.Group();
  group.name='F09 model theatre · destroyed mounting bed';owner.add(group);
  const hole=new THREE.Mesh(
    new THREE.CircleGeometry(1,15),
    new THREE.MeshBasicMaterial({color:0x07080b,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}));
  hole.rotation.x=-Math.PI/2;hole.position.set(center.x,pageY(center.x)+.024,center.z);
  hole.scale.set(.90,.71,1);group.add(hole);
  const stock=[0x62757a,0x45565d,0x7b8070].map(color=>new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:.95}));
  const core=new THREE.MeshStandardMaterial({color:0x25282a,side:THREE.DoubleSide,roughness:1});
  const edge=new THREE.MeshStandardMaterial({color:0xc6b491,side:THREE.DoubleSide,roughness:1});
  const trace=new THREE.MeshBasicMaterial({color:0x81cacc});
  const sparks=new THREE.MeshBasicMaterial({color:0xb3ede8,transparent:true,opacity:0,depthWrite:false});
  const debris=new THREE.Group();group.add(debris);
  const cut=(i:number)=>.72+.12*Math.sin(i*8.24)+.10*Math.cos(i*3.4);
  const xy=(i:number,n:number,r:number)=>new THREE.Vector2(Math.cos(i/n*Math.PI*2)*r,Math.sin(i/n*Math.PI*2)*r*.79);
  const slabs=Array.from({length:13},(_,i)=>{
    const p=xy(i,13,cut(i)),q=xy(i+1,13,cut(i+1)),m=xy(i+.48,13,.23+(i%3)*.045);
    const origin=new THREE.Vector2().addVectors(p,q).multiplyScalar(.5);
    const shape=new THREE.Shape().moveTo(p.x-origin.x,p.y-origin.y)
      .lineTo(q.x-origin.x,q.y-origin.y).lineTo(m.x-origin.x,m.y-origin.y).closePath();
    const hinge=new THREE.Group();
    hinge.position.set(center.x+origin.x,pageY(center.x+origin.x)+.03,center.z-origin.y);
    group.add(hinge);
    const chip=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.024,bevelEnabled:false,curveSegments:1}),[stock[i%3],edge]);
    chip.rotation.x=-Math.PI/2;chip.castShadow=true;hinge.add(chip);
    const a=new THREE.Vector3(p.x-origin.x,.025,-p.y+origin.y),b=new THREE.Vector3(m.x-origin.x,.025,-m.y+origin.y);
    const lace=new THREE.Mesh(new THREE.BoxGeometry(a.distanceTo(b)*.78,.009,.013),trace);
    lace.position.copy(a).lerp(b,.49);
    lace.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),b.sub(a).normalize());hinge.add(lace);
    return {hinge,lace,at:hinge.position.clone()};
  });
  const flakes=Array.from({length:27},(_,i)=>{
    const p=xy(i,27,.33+(i%5)*.12);
    const mesh=new THREE.Mesh(new THREE.TetrahedronGeometry(.045+(i%4)*.018,0),i%4===0?sparks:i%3===0?edge:core);
    mesh.castShadow=i%3===0;debris.add(mesh);
    return {mesh,origin:new THREE.Vector3(center.x+p.x,center.y-.18,center.z-p.y)};
  });
  // Briefly illuminates the surrounding imprint with one rise and fall, never a strobe.
  const spill=new THREE.PointLight(0x8ff1ec,0,3.1,2);spill.position.copy(center).y+=.38;
  group.add(spill);
  const bed=(elapsed:number,reduced:boolean)=>{
    group.visible=elapsed>=0;
    if(!group.visible)return 0;
    const t=reduced?1:sat(elapsed);
    const ash=t>=.91;
    const force=(x:number)=>Math.sin(Math.PI*sat(x));
    hole.visible=t>.14;
    slabs.forEach(({hinge,lace,at},i)=>{
      const phase=step(t,.04+(i%5)*.027,.67+(i%4)*.051);
      const flung=i%3!==1;
      hinge.position.copy(at);
      hinge.position.y+=reduced?0:force(phase)*(.27+(i%4)*.10);
      if(flung)hinge.position.lerp(new THREE.Vector3(center.x,pageY(center.x)-.13,center.z),phase*(.70+(i%4)*.08));
      hinge.rotation.x=phase*(flung?1.45:.22)+(reduced?0:force(phase)*.64)*(i%2===0?1:-1);
      hinge.rotation.z=phase*(flung?-1.04:.28)*(i%2===0?1:-1);
      hinge.visible=!(flung&&phase>.95);
      lace.visible=!ash&&!reduced&&phase<.68;
    });
    flakes.forEach(({mesh,origin},i)=>{
      const f=step(t,.09+(i%8)*.031,.70+(i%6)*.043);
      mesh.visible=!reduced&&f>0&&f<1;
      if(!mesh.visible)return;
      mesh.position.copy(origin).lerp(center,f*.85);
      mesh.position.y+=force(f)*(.23+(i%7)*.12)-f*.61;
      mesh.rotation.set(i*.16+f*5,i*.32-f*4,f*3);
    });
    sparks.opacity=reduced?0:force(step(t,.01,.59))*.85;
    spill.intensity=reduced?0:3.4*force(step(t,0,.42));
    return slabs.filter(x=>x.hinge.visible).length;
  };
  group.visible=false;
  return {update:bed};
}
