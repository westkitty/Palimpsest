import * as THREE from 'three';

const ease=(a:number,b:number,n:number)=>THREE.MathUtils.smoothstep(n,a,b);
const lerp=THREE.MathUtils.lerp;
const round=(n:number)=>Number(n.toFixed(4));
const unitX=new THREE.Vector3(1,0,0);

const stock=(color:number)=>new THREE.MeshStandardMaterial({
  color,roughness:.95,flatShading:true,side:THREE.DoubleSide,
});
function cut(parent:THREE.Object3D,geometry:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0){
  const node=new THREE.Mesh(geometry,mat);
  node.position.set(x,y,z);node.castShadow=node.receiveShadow=true;parent.add(node);return node;
}
function slab(parent:THREE.Object3D,w:number,h:number,d:number,mat:THREE.Material,x=0,y=0,z=0){
  return cut(parent,new THREE.BoxGeometry(w,h,d),mat,x,y,z);
}
function stretch(part:THREE.Mesh,origin:THREE.Vector3,target:THREE.Vector3){
  const delta=target.clone().sub(origin);
  part.position.copy(origin).addScaledVector(delta,.5);
  part.scale.x=delta.length();part.quaternion.setFromUnitVectors(unitX,delta.normalize());
}

export function startF06CrossingDispatch(crossing:THREE.Group,flap:THREE.Group){
  const root=new THREE.Group();root.name='F06 illustrative crossing couriers';crossing.add(root);
  const cream=stock(0xe5cc97),brown=stock(0x714730),coatLeft=stock(0x6aafaf),coatRight=stock(0xad5344),blond=stock(0xbc8a52);
  const slip=slab(flap,.111,.016,.076,cream);
  slip.name='F06 paper dispatch on its attached crossing flap';
  slab(slip,.029,.002,.066,brown,.017,.009);
  const foldingCorner=slab(slip,.029,.003,.025,blond,-.038,.009,-.023);
  foldingCorner.rotation.y=.46;
  const couriers=[-1,1].map((dir,i)=>{
    const hues=i===0?coatLeft:coatRight;
    // Actual physical stock at either end of the same crossing, with no new
    // spans over the rupture. These are the fixed shoring slips for feet.
    const shore=slab(root,.45,.024,.193,brown,dir*.505,.018,.145);
    shore.name='F06 bonded courier bank';
    slab(shore,.433,.009,.176,blond,0,.015);
    for(let j=0;j<4;j++)slab(shore,.026,.003,.12,brown,-.126+.083*j,.021);
    const body=new THREE.Group();body.name=i===0?'F06 anonymous west-bank courier':'F06 anonymous east-bank courier';
    root.add(body);
    const jacket=cut(body,new THREE.CylinderGeometry(.049,.067,.121,5),hues,0,.112);
    jacket.scale.z=.68;
    const head=cut(body,new THREE.IcosahedronGeometry(.037,0),cream,0,.215);
    const cap=slab(body,.071,.028,.054,brown,0,.237);
    cap.rotation.z=dir*.14;
    const shoes=[0,1].map(j=>{
      const foot=slab(root,.050,.024,.036,brown);
      foot.name='F06 planted paper boot '+j;
      return {foot,shin:slab(root,1,.031,.030,hues)};
    });
    const arm=slab(root,1,.030,.041,hues),hand=slab(root,.043,.033,.042,cream);
    return {body,head,shoes,arm,hand,dir};
  });
  const tip=new THREE.Vector3(),handOff=new THREE.Vector3(),surface=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3();
  const surfaceRotation=new THREE.Quaternion(),tempRotation=new THREE.Quaternion();
  const blankRotation=new THREE.Quaternion();
  const pitch=new THREE.Euler();
  const from=.67;
  let elapsed=0;
  let started=false;
  let reducedLast=false;
  return {
    beforeTear(era:number,dt:number,reduced:boolean){
      if(era!==3){elapsed=0;started=false;}
      else if(reduced){elapsed=3.6;started=true;}
      else if(!(reducedLast&&started)){elapsed=Math.min(3.6,elapsed+Math.max(0,Math.min(.12,dt)));started=true;}
      reducedLast=reduced;
      return era===3&&(reduced||elapsed>=.95);
    },
    update(era:number,reduced:boolean){
      const on=era===3;
      root.visible=on;
      slip.visible=on;
      const phase=!on?'off':elapsed<.95?'approaching':elapsed<1.58?'rupture':elapsed<1.92?'send':
        elapsed<2.68?'sliding':'received';
      if(!on)return {phase,banks:[],paperX:0,paperParent:'hidden',feet:[]};
      const walk=ease(.06,.94,elapsed);
      const recoil=ease(.98,1.13,elapsed)*(1-ease(1.17,1.48,elapsed));
      const release=ease(1.44,1.88,elapsed);
      const transit=ease(1.77,1.92,elapsed);
      const slide=ease(1.92,2.58,elapsed);
      const catchIt=ease(2.46,2.68,elapsed);
      const collect=ease(2.68,3.08,elapsed);
      const banks:number[]=[],feet:number[][]=[];
      const standing=.045,foreground=.15;
      const wristStart=new THREE.Vector3(-.56,.157,foreground+.040);
      const lip=new THREE.Vector3(-.091,.109,foreground+.024);
      // The tablet starts in the sender’s hand, touches the surviving cut fold,
      // rides up the actual moving stock and ends in the receiving hand.
      const localX=lerp(-.383,-.024,slide);
      const slideZ=lerp(.09,.145,slide);
      const localY=.057;
      flap.updateWorldMatrix(true,false);
      crossing.updateWorldMatrix(true,false);
      const relative=new THREE.Matrix4().copy(crossing.matrixWorld).invert().multiply(flap.matrixWorld);
      surface.set(localX,localY,slideZ).applyMatrix4(relative);
      surfaceRotation.setFromRotationMatrix(relative);
      handOff.copy(wristStart).lerp(lip,release);
      handOff.x+=.26*walk*(1-release);
      if(transit>0){
        handOff.lerp(surface,transit);
        handOff.y+=Math.sin(transit*Math.PI)*.026;
      }
      if(collect>0)handOff.lerp(new THREE.Vector3(.534,.203,foreground+.038),collect);
      slip.position.copy(handOff).applyMatrix4(relative.clone().invert());
      pitch.set(.17*(1-collect),.14*collect,-.49*collect);
      tempRotation.copy(blankRotation).slerp(surfaceRotation,transit*(1-collect)).multiply(
        new THREE.Quaternion().setFromEuler(pitch));
      slip.quaternion.copy(surfaceRotation).invert().multiply(tempRotation);
      // Contact pose while on the flap has exactly its local up and no float.
      if(transit>=1&&collect===0){
        slip.position.set(localX,localY,slideZ);slip.quaternion.identity();
      }
      for(const [i,{body,head,shoes,arm,hand,dir}] of couriers.entries()){
        const end=i===0?.319:.465;
        const settle=lerp(from,end,walk);
        const kneel=i===0?release*(1-ease(2.35,3.05,elapsed)):catchIt*(1-collect*.78);
        const dx=Math.abs(from-end)/4;
        const x=dir*(settle+.027*recoil);
        const y=standing-kneel*.044;
        body.position.set(x,y,foreground);
        body.rotation.y=-dir*.52;
        body.rotation.z=dir*(.10+.36*kneel-.18*recoil);
        head.rotation.y=-dir*.34;
        head.rotation.z=-dir*.13*recoil;
        banks.push(round(x));
        const k=walk*4,j=Math.floor(k),part=k-j;
        const lifts:number[]=[];
        for(const [f,{foot,shin}] of shoes.entries()){
          const swing=j<4&&j%2===f;
          const lead=(Math.floor((j+1-f)/2)*2+Number(swing)*2*ease(0,1,part))*dx;
          const lift=swing&&!reduced?Math.sin(part*Math.PI)*.027:0;
          const lx=dir*(from-lead)+(f===0?-.025:.025);
          const z=foreground+(f===0?-.050:.049);
          foot.position.set(lx,standing+.010+lift,z);
          a.set(lx,standing+.023+lift,z);
          b.set(x+(f===0?-.020:.020),y+.070,foreground);
          stretch(shin,a,b);
          lifts.push(round(lift));
        }
        feet.push(lifts);
        a.set(x-dir*.027,y+.166,foreground+.009);
        tip.set(x-dir*.066,y+.113,foreground+.044);
        const grip=i===0?(1-transit):(catchIt);
        tip.lerp(handOff,grip);
        stretch(arm,a,tip);
        hand.position.copy(tip);
      }
      return {phase,banks,paperX:round(handOff.x),paperParent:'attached-flap',feet};
    },
  };
}
