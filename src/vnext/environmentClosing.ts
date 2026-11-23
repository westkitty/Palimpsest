import * as THREE from 'three';
import { ADMINISTRATION_SLOGAN } from './revisionCodaLogic.ts';

const clamp=(t:number)=>Math.min(1,Math.max(0,t));
const ease=(t:number)=>{const x=clamp(t);return x*x*(3-2*x);};
export const WALL_WIDTH=7.55;
export const WALL_HEIGHT=2.54;
export const WALL_ANGLE=1.26;
export function closingReadingPose(aspect:number){
  // Frame the material subject, not the closed-book footprint, on phones.
  const d=Math.max(9.3,WALL_WIDTH/(2*Math.tan(Math.PI/8)*Math.max(.28,aspect)*.88));
  return {distance:d,focusY:1.18,focusZ:.59};
}
export function closingBeat(seconds:number,reduced:boolean){
  const t=reduced?2.35:clamp(seconds/2.35)*2.35;
  const rise=ease(t/1.38);
  const settle=t>1.38&&t<2.03?Math.sin((t-1.38)/.65*Math.PI*2)*.014*(1-ease((t-1.38)/.65)):0;
  return {
    angle:.06+(WALL_ANGLE-.06)*rise+settle,
    relief:ease((t-.76)/1.20),
    stage:t>=2.35?'held':t>=1.38?'emboss':'rising',
  };
}
function put(root:THREE.Group, g:THREE.BufferGeometry, m:THREE.Material, x=0,y=0,z=0){
  const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;root.add(o);return o;
}
function letterTexture(emboss:boolean, lightOnly=false){
  const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=606;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Closing sheet canvas not available');
  if(!lightOnly){
    const paper=ctx.createLinearGradient(0,0,1640,606);
    for(const [p,col] of [[0,'#ded0b2'],[.54,'#d6c6a3'],[1,'#bdad89']] as const)paper.addColorStop(p,col);
    ctx.fillStyle=paper;ctx.fillRect(0,0,1800,606);
    let seed=7821561;
    const noise=()=>((seed=(Math.imul(1664525,seed)+1013904223)|0)>>>0)/4294967296;
    for(let i=0;i<29000;i++){
      const col=noise()>.46?'255,248,233':'66,49,23';
      ctx.fillStyle='rgba('+col+','+(.02+noise()*.066)+')';
      ctx.fillRect(noise()*1800,noise()*606,.35+noise()*6,.16+noise()*1.8);
    }
    // Paper scoring, not a decorative frame or inset panel.
    for(let i=0;i<2;i++){
      ctx.fillStyle=i?'rgba(240,225,193,.37)':'rgba(82,64,37,.12)';
      ctx.fillRect(35+i*2,60,1,475);ctx.fillRect(1764+i*2,60,1,475);
    }
  }
  if(emboss){
    const words=ADMINISTRATION_SLOGAN.split(' ');
    const lines=[words.slice(0,3).join(' '),words.slice(3).join(' ')];
    ctx.font='600 167px Georgia, "Times New Roman", serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(const [i,line] of lines.entries()){
      const y=227+i*161;
      // A highlight and shadow on opposite edges create a shallow relief.
      ctx.fillStyle='rgba(76,58,35,.92)';ctx.fillText(line,905,y-4);
      ctx.fillStyle='rgba(249,233,195,.95)';ctx.fillText(line,896,y+4);
      ctx.fillStyle='#8a7956';ctx.fillText(line,900,y);
    }
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
export function createEnvironmentalClosing(textures:THREE.Texture[]){
  const root=new THREE.Group();root.name='Closing imprint • scored paper wall and working tension folds';
  const hinge=new THREE.Group();hinge.position.set(0,.257,1.44);root.add(hinge);
  const top=new THREE.Group();top.position.z=-WALL_HEIGHT/2;top.rotation.x=-Math.PI/2;hinge.add(top);
  const stock=letterTexture(false),impression=letterTexture(true,true);
  textures.push(stock,impression);
  const fibre=new THREE.MeshStandardMaterial({color:0xe6d7b6,roughness:.96});
  const cut=new THREE.MeshStandardMaterial({color:0x8b7f64,roughness:.91});
  const face=new THREE.MeshStandardMaterial({map:stock,roughness:.95});
  const ink=new THREE.MeshStandardMaterial({map:impression,transparent:true,opacity:0,roughness:.95,depthWrite:false});
  put(hinge,new THREE.BoxGeometry(WALL_WIDTH,.052,WALL_HEIGHT),cut,0,0,-WALL_HEIGHT/2).castShadow=true;
  put(top,new THREE.PlaneGeometry(WALL_WIDTH-.055,WALL_HEIGHT-.045),face,0,0,.027).receiveShadow=false;
  const blind=put(top,new THREE.PlaneGeometry(WALL_WIDTH-.055,WALL_HEIGHT-.045),ink,0,0,.0285);
  blind.name='Only words in the character-free coda: blind relief';
  blind.receiveShadow=false;
  blind.renderOrder=2;
  const braces=[-1,1].map(sign=>{
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(18),3));
    geo.setIndex([0,1,2,0,2,3,3,2,4,3,4,5,2,1,4]);
    const mat=fibre.clone();mat.side=THREE.DoubleSide;mat.color.setHex(sign<0?0xbcae90:0xa99d80);
    const brace=put(root,geo,mat);brace.castShadow=true;brace.frustumCulled=false;
    brace.name='Scored paper tension brace '+(sign<0?'left':'right');
    return {sign,geo};
  });
  put(root,new THREE.BoxGeometry(WALL_WIDTH+.06,.028,.11),fibre,0,.261,1.447);
  let elapsed=0, last=NaN;
  return {root,update(dt:number,reduced:boolean){
    elapsed=Math.min(2.35,elapsed+Math.min(.10,Math.max(0,dt)));
    const beat=closingBeat(elapsed,reduced);
    const a=beat.angle;
    if(a!==last){
      hinge.rotation.x=a;ink.opacity=beat.relief;blind.visible=beat.relief>.001;
      for(const {sign,geo} of braces){
        const p=geo.getAttribute('position') as THREE.BufferAttribute;
        const x=sign*(WALL_WIDTH/2-.22), baseZ=hinge.position.z;
        const z=baseZ-1.43*Math.cos(a),y=.25+1.43*Math.sin(a),dx=.37*sign;
        p.setXYZ(0,x,.246,baseZ+.79);p.setXYZ(1,x,.246,baseZ+.09);
        p.setXYZ(2,x+.13*sign,y*.56+.11,baseZ+.35-.26*Math.sin(a));
        p.setXYZ(3,x+dx,.247,baseZ+.52);p.setXYZ(4,x,y,z);p.setXYZ(5,x+dx*.65,.247,baseZ-.36);
        p.needsUpdate=true;geo.computeVertexNormals();
      }
      last=a;
    }
    // Relief continues for a moment after the wall locks, even though its angle rests.
    ink.opacity=beat.relief;blind.visible=beat.relief>.001;
    return beat.stage;
  }};
}
