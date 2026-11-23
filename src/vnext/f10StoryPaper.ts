import * as THREE from 'three';
import type { F10FolioWorld } from '../engine/folios/FoliosAftermath';

const ease=(a:number,b:number,t:number)=>THREE.MathUtils.smoothstep(t,a,b);
export function createF10StoryPaper(world:F10FolioWorld,pageY:(x:number)=>number) {
  const root=new THREE.Group();root.name='F10 Living inhabited margin and protocol threshold';
  const {horizon,protocol}=world.livingWitnessHandles();
  const token={interactionType:'folioMechanism',worldId:9,slot:'C',label:'[C] Open Postwar Protocol threshold'};
  const hits:THREE.Mesh[]=[];
  const paper=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.86,side:THREE.DoubleSide,flatShading:true});
  const slate=paper(0x333b47),chalk=paper(0xd0c4a8),roof=paper(0x625445),dark=paper(0x24272f),brass=paper(0xa38055);
  const amber=new THREE.MeshBasicMaterial({color:0xffc977,toneMapped:false,side:THREE.DoubleSide});
  const dimAmber=new THREE.MeshBasicMaterial({color:0xaf814d,toneMapped:false,side:THREE.DoubleSide});
  function slab(owner:THREE.Group,w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0,name=''){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.name=name;o.position.set(x,y,z);owner.add(o);return o;
  }
  const margin=new THREE.Group();margin.name='F10 low inhabited-side witness in page margin';margin.position.set(2.19,pageY(2.19)+.028,-.42);margin.rotation.y=-.16;root.add(margin);
  slab(margin,1.19,.047,.66,slate,0,.027,0);
  slab(margin,1.19,.012,.018,brass,0,.057,.32);
  slab(margin,.98,.082,.12,dark,0,.070,-.22);
  const marginWindows:THREE.Mesh[]=[];
  for(let i=0;i<4;i++){
    const x=-.42+i*.285,z=.015+Math.sin(i*1.4)*.11,h=.14+(i%3)*.058,w=.183+(i%2)*.025;
    slab(margin,w,h,.16,chalk,x,.053+h/2,z,'Anonymous inhabited-side cottage');
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.139,.139,.195,3),roof);
    top.rotation.x=Math.PI/2;top.position.set(x,.068+h+.036,z);margin.add(top);
    for(const j of [-1,1]){
      slab(margin,.041,.061,.013,roof,x+j*w*.25,.068+h*.53,z+.085);
      marginWindows.push(slab(margin,.026,.041,.009,amber,x+j*w*.25,.068+h*.53,z+.095,'Inhabited-side slit window'));
    }
  }
  const horizonWindows=new THREE.Group();horizonWindows.name='F10 warm light on the inhabited ground only';horizon.add(horizonWindows);
  const bLights:THREE.Mesh[]=[];
  const originalStreaks=horizon.children.filter(x=>x instanceof THREE.Mesh&&x.geometry instanceof THREE.BoxGeometry&&
    Math.abs(x.geometry.parameters.width-1.74)<.001&&x.material instanceof THREE.MeshBasicMaterial);
  for(let i=0;i<4;i++){
    const x=-.52+i*.34,z=(i%2===0?1:-1)*.14+.087,h=.13+(i%2)*.05;
    for(const j of [-1,1]){
      slab(horizonWindows,.038,.054,.013,roof,x+j*.043,.103+h*.48,z);
      bLights.push(slab(horizonWindows,.025,.037,.009,amber,x+j*.043,.103+h*.48,z+.008,'Inhabited horizon cottage window'));
    }
  }

  // A literal paper threshold, not a new policy document. Opening these
  // hinges reveals the unchanged original source protocol card beyond.
  const gate=new THREE.Group();gate.name='F10 gatefold over the Postwar Protocols';gate.position.set(0,pageY(0)+.075,1.123);root.add(gate);
  const touch=(o:THREE.Mesh)=>{o.userData={...token};hits.push(o);world.interactables.push(o);return o;};
  touch(slab(gate,1.77,.040,.205,slate,0,.023,0,'Fixed raised threshold'));
  for(const x of [-.875,.875]){
    touch(slab(gate,.085,.36,.14,slate,x,.196,0,'Gatefold pillar'));
    touch(slab(gate,.102,.025,.157,brass,x,.383,0,'Scored gatefold cap'));
  }
  const shutter:THREE.Group[]=[];
  for(const side of [-1,1]){
    const g=new THREE.Group();g.position.set(side*.828,.043,0);gate.add(g);shutter.push(g);
    touch(slab(g,.816,.326,.051,slate,-side*.410,.162,0,'Hinged slate protocol door'));
    touch(slab(g,.793,.012,.010,brass,-side*.410,.041,.030));
    touch(slab(g,.793,.012,.010,brass,-side*.410,.286,.030));
    for(const x of [.071,.756])touch(slab(g,.009,.25,.009,brass,-side*x,.162,.031));
    touch(slab(g,.048,.059,.013,chalk,-side*.716,.164,.036,'Folded brass latch'));
  }
  // The exact source heading, with no technical content or new wording.
  let labelMaterial:THREE.MeshBasicMaterial|undefined;
  let texture:THREE.CanvasTexture|undefined;
  const c=document.createElement('canvas');c.width=512;c.height=112;
  const ctx=c.getContext('2d');
  if(ctx){
    ctx.fillStyle='#2a3039';ctx.fillRect(0,0,512,112);ctx.strokeStyle='#aa936d';ctx.lineWidth=3;ctx.strokeRect(5,5,502,102);
    ctx.fillStyle='#e4cfaa';ctx.font='700 32px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('POSTWAR PROTOCOLS',256,57,480);
    texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    labelMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.63,.152),labelMaterial);
    sign.position.set(0,.386,.003);sign.rotation.x=-.36;gate.add(sign);touch(sign);
  }
  protocol.visible=false;
  const amberTarget=new THREE.Color(0xd49a58),dimTarget=new THREE.Color(0x87674a);
  for(const [i,n] of [...marginWindows,...bLights].entries())n.material=i%5===2?dimAmber:amber;
  let openness=0;
  return {root,update(open:boolean,ground:boolean,lift:number,dt:number,reduce:boolean){
    if(reduce)openness=Number(open);
    else {
      const amount=Math.max(0,dt)/.69;
      openness=open?Math.min(1,openness+amount):Math.max(0,openness-amount);
    }
    const eased=ease(0,1,openness);
    shutter[0].rotation.y=1.53*eased;shutter[1].rotation.y=-1.53*eased;
    protocol.visible=open&&eased>.38;
    margin.visible=!ground;
    // Tint only windows on the inhabited side. The same black streak stays
    // unlit, untextured and entirely unaffected, along with the schematic.
    const light=ease(.11,.94,lift);
    amber.color.setHex(0xffc977).lerp(amberTarget,light*.42);
    dimAmber.color.setHex(0xaf814d).lerp(dimTarget,light*.38);
    return {door:Math.round(eased*100)/100,record:protocol.visible,horizon:ground,litWindows:ground?bLights.length:marginWindows.length,streaks:originalStreaks.filter(n=>n.visible&&horizon.visible).length};
  },dispose(){
    for(const n of hits){const i=world.interactables.indexOf(n);if(i>=0)world.interactables.splice(i,1);}
    texture?.dispose();labelMaterial?.dispose();protocol.visible=true;
    horizonWindows.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
    horizonWindows.removeFromParent();amber.dispose();dimAmber.dispose();
  }};
}
