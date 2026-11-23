import * as THREE from 'three';
import type { DraxisRig } from '../engine/drakken/DraxisModels';

type Point=readonly [number,number,number];
type Head={pivot:Point;stock:readonly Point[];optics:readonly Point[];yaw:number;pitch:number;frequency:number;blinkAt:number};

// Bind only to existing head stock from the named DraxisModels.ts switch
// branches. F06 only adds a pose to Obsidian Gul; its six other visible
// catalog models keep their own internals. No archive constructor is changed.
const heads:Readonly<Record<string,Head>>={
  '004':{ // Obsidian Gul: helm, horns and maw; the orange maw is not an eye.
    pivot:[0,.33,.29],stock:[[0,.34,.42],[-.075,.42,.32],[.075,.42,.32],[0,.31,.46]],optics:[],
    yaw:.069,pitch:.044,frequency:1.44,blinkAt:0,
  },
  '037':{ // Ironcant: original furnace visor under the helm, not invented eyelids.
    pivot:[0,.66,.025],stock:[[0,.72,.04],[0,.70,.095]],optics:[[0,.70,.095]],
    yaw:.040,pitch:.054,frequency:.94,blinkAt:2.40,
  },
  '055':{ // Foldhowl: ears, snout and the source's two solid cyan eyes.
    pivot:[.05,.56,.245],stock:[[.05,.57,.38],[-.01,.68,.26],[.11,.68,.26],[-.005,.585,.42],[.105,.585,.42]],
    optics:[[-.005,.585,.42],[.105,.585,.42]],yaw:.085,pitch:.042,frequency:1.39,blinkAt:1.69,
  },
  '044':{ // Gorevault: smooth scythe head only; barrel reservoirs are not optics.
    pivot:[0,.38,.31],stock:[[0,.40,.42]],optics:[],
    yaw:.034,pitch:.068,frequency:.71,blinkAt:0,
  },
};
const r=(x:number,a:number,b:number)=>THREE.MathUtils.smoothstep(x,a,b);

export function bindDraxisFigurePerformance(rig:DraxisRig) {
  const recipe=heads[rig.id];
  const resolve=(at:Point)=>rig.group.children.find((n):n is THREE.Mesh=>
    n instanceof THREE.Mesh&&n.position.distanceToSquared(new THREE.Vector3(...at))<1e-8);
  const hinge=new THREE.Group();
  hinge.name='Living DRAXIS grounded head hinge '+rig.id;
  const stock=recipe?.stock.map(resolve);
  const optics=recipe?.optics.map(resolve);
  if(recipe&&stock?.every(o=>o!==undefined)&&optics?.every(o=>o!==undefined)){
    hinge.position.set(...recipe.pivot);
    rig.group.add(hinge);
    for(const item of stock){
      item.position.sub(hinge.position);
      hinge.add(item);
    }
  }
  const opticalStock=hinge.parent?(optics??[]).flatMap(o=>o?[{mesh:o,height:o.scale.y}]:[]):[];
  const posed=recipe&&Boolean(hinge.parent);
  let age=0,started=false;
  return {
    update(dt:number,exposed:boolean,reduced:boolean,restWeight=1) {
      const active=exposed&&!reduced;
      age=active&&started?age+Math.max(0,Math.min(dt,.19)):0;
      started=active;
      // Native motion already exists for several catalog specimens; sample
      // them at the same mount-local clock rather than against page uptime.
      rig.animate(age,true);
      let yaw=0,pitch=0;
      let optical:number|null=opticalStock.length?1:null;
      if(posed&&age>0){
        const blend=r(age,.10,.46)*restWeight;
        const pulse=age*recipe.frequency;
        yaw=blend*recipe.yaw*Math.sin(pulse);
        pitch=blend*recipe.pitch*Math.sin(.74*pulse);
        if(opticalStock.length){
          const d=Math.abs(age%(rig.id==='055'?4.6:5.8)-recipe.blinkAt);
          optical=1-(1-r(d,.026,.13))*(rig.id==='055'?.94:.55)*blend;
        }
      }
      hinge.rotation.set(pitch,yaw,0);
      for(const {mesh,height} of opticalStock)mesh.scale.y=height*(optical??1);
      return {age,yaw,pitch,optical};
    },
  };
}
