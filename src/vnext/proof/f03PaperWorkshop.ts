import * as THREE from 'three';
import { sourceInkRegistration,type FolioActions } from '../folioLogic';
import { foldedGlobe,REVISION_VAULT_TEMPLATES } from '../revisionEarlyArt';

type Template=0|1|2;
const clamp=(x:number)=>Math.min(1,Math.max(0,x));
const ease=(a:number,b:number,t:number)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
const asColor=(value:number)=>new THREE.MeshStandardMaterial({color:value,side:THREE.DoubleSide,roughness:.86});
const pos=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const sourcePlace=pos(-1.71,.488,.185), outputPlace=pos(1.66,.430,.43), diePlace=pos(-.12,.211,.545);
function add<M extends THREE.Material>(root:THREE.Object3D,name:string,geo:THREE.BufferGeometry,mat:M,x=0,y=0,z=0){
  const item=new THREE.Mesh(geo,mat);
  item.name=name;item.position.set(x,y,z);item.castShadow=item.receiveShadow=true;
  root.add(item);return item;
}
function box<M extends THREE.Material>(root:THREE.Object3D,name:string,material:M,w:number,h:number,d:number,x=0,y=0,z=0){
  return add(root,name,new THREE.BoxGeometry(w,h,d),material,x,y,z);
}
function dispose(root:THREE.Object3D){
  const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
  root.traverse(n=>{
    if(!(n instanceof THREE.Mesh)&&!(n instanceof THREE.Line))return;
    geometries.add(n.geometry);
    (Array.isArray(n.material)?n.material:[n.material]).forEach(m=>materials.add(m));
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();
}
/** Project the actual selected piece into its die. No generic globe outline. */
function contour(globe:THREE.Group) {
  globe.updateWorldMatrix(true,true);
  const projection:THREE.Vector2[]=[];
  const transform=new THREE.Matrix4().copy(globe.matrixWorld).invert();
  const raw=new THREE.Vector3();
  globe.traverse(node=>{
    if(!(node instanceof THREE.Mesh))return;
    const a=node.geometry.getAttribute('position');
    const matrix=new THREE.Matrix4().multiplyMatrices(transform,node.matrixWorld);
    for(let i=0;i<a.count;i++){
      raw.fromBufferAttribute(a,i).applyMatrix4(matrix);
      projection.push(new THREE.Vector2(raw.x,-raw.y));
    }
  });
  projection.sort((a,b)=>a.x-b.x||a.y-b.y);
  const oriented=(a:THREE.Vector2,b:THREE.Vector2,c:THREE.Vector2)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const half=(p:THREE.Vector2[])=>{
    const ring:THREE.Vector2[]=[];
    for(const x of p){while(ring.length>=2&&oriented(ring.at(-2)!,ring.at(-1)!,x)<=0)ring.pop();ring.push(x);}
    ring.pop();return ring;
  };
  return [...half(projection),...half(projection.reverse())];
}
function perimeter(parent:THREE.Group,name:string,outline:THREE.Vector2[],material:THREE.Material,scale:number,y:number,depth:number){
  const line=new THREE.Group();line.name=name;parent.add(line);
  for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length];
    const x=(a.x+b.x)*scale*.5,z=(a.y+b.y)*scale*.5;
    const ink=box(line,'Fold impression edge',material,a.distanceTo(b)*scale+.005,y,depth,x,0,z);
    ink.rotation.y=-Math.atan2(b.y-a.y,b.x-a.x);
  }
}
function foundryNet(parent:THREE.Group,target:THREE.Group,color:number) {
  // Lay out the very same scored gores used by the selected Globe. Their
  // original vertex destination is retained; this is folding the card, not
  // scaling an independently generated sphere into view.
  const gores=target.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&o.name.startsWith('Scored and folded cardstock gore '));
  const stock=asColor(color),crease=asColor(0x423f39);
  const pieces=gores.map((g,i)=>{
    const geo=g.geometry.clone();
    const from=geo.getAttribute('position');
    const original=Float32Array.from(from.array);
    const paper=add(parent,'Fresh paper net gore '+(i+1),geo,stock);
    const seam=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x493e45}));
    const lines=new Float32Array((from.count/3-1)*6);
    seam.geometry.setAttribute('position',new THREE.BufferAttribute(lines,3));paper.add(seam);
    paper.frustumCulled=false;seam.frustumCulled=false;
    return {geo,from,original,lines,seam,i};
  });
  const tab=box(parent,'Slide-out folded sheet edge tab',crease,.19,.016,.052,0,-.010,.282);
  let previous=-1;
  return (p:number)=>{
    if(p===previous)return;previous=p;
    for(const {geo,from,original,lines,seam,i} of pieces){
      for(let j=0;j<from.count;j++){
        const k=Math.floor(j/3),j3=j*3,within=j%3;
        const flatX=(((i+within*.5)/pieces.length)-.5)*.54;
        const flatZ=(k/(from.count/3-1)-.5)*.51;
        const bend=Math.sin(p*Math.PI)*(.09+.038*Math.cos(k*.65))*(.38+i/pieces.length);
        from.setXYZ(j,THREE.MathUtils.lerp(flatX,original[j3],p),original[j3+1]*p+bend,THREE.MathUtils.lerp(flatZ,original[j3+2],p));
        if(within===0&&k>0){
          const a=j-3,l=(k-1)*6;
          lines.set([from.getX(a),from.getY(a)+.006,from.getZ(a),from.getX(j),from.getY(j)+.006,from.getZ(j)],l);
        }
      }
      from.needsUpdate=true;seam.geometry.getAttribute('position').needsUpdate=true;geo.computeVertexNormals();
    }
    tab.visible=p<.35;
  };
}

export function makeF03PaperWorkshop() {
  const root=new THREE.Group();root.name='F03 folded-paper cabinet, press and output';
  const stock=asColor(0x31495b),shade=asColor(0x231e29), brass=asColor(0xad8551), pearl=asColor(0xd6c4a0);
  const cabinet=new THREE.Group();
  cabinet.name='WorldsVault folded-planet cabinet';
  cabinet.position.set(-1.84,.217,-.815);root.add(cabinet);
  box(cabinet,'Bonded cabinet footer',shade,1.27,.055,.43,0,0,-.10);
  box(cabinet,'Cabinet back scored blue stock',stock,1.22,.59,.035,0,.29,-.26);
  box(cabinet,'Laminated cabinet lid',stock,1.30,.08,.38,0,.62,-.10);
  box(cabinet,'Warm cabinet lid cut edge',brass,1.27,.022,.044,0,.58,.075);
  const slips=REVISION_VAULT_TEMPLATES.map((family,i)=>{
    const x=(i-1)*.40;
    const frame=new THREE.Group();frame.name=family.name+' cabinet sleeve';cabinet.add(frame);frame.position.x=x;
    const cover=new THREE.Group();cover.position.set(0,.125,.091);frame.add(cover);
    const paper=asColor(family.stock);
    box(frame,'Sleeve backed stock',shade,.37,.39,.055,0,.310,-.19);
    box(frame,'Hinged drawer sill',brass,.37,.036,.36,0,.104,-.05);
    for(const side of [-1,1])box(frame,'Creased slip side rail',stock,.034,.40,.32,side*.181,.32,-.072);
    box(cover,'Planar selected sleeve door',paper,.319,.341,.036,0,.169);
    box(cover,'Die-cut pull lip',brass,.172,.046,.057,0,.294,.029);
    sourceInkRegistration(i).forEach((bit,j)=>box(cover,'Template family impression notch',bit?shade:pearl,.030,.052,.011,(j-1.5)*.053,.16,.024));
    return cover;
  });
  const cradle=new THREE.Group();cradle.name='WorldsVault notched source cradle';root.add(cradle);
  cradle.position.set(sourcePlace.x,.220,sourcePlace.z);
  box(cradle,'Source cradle bonded to the leaf',shade,.79,.050,.62);
  for(const sign of [-1,1]){
    const seat=box(cradle,'Paper cradle jaw',stock,.10,.14,.48,sign*.24,.075,0);seat.rotation.z=sign*.30;
    const edge=box(cradle,'Brass-paper crease on cradle jaw',brass,.035,.043,.38,sign*.206,.128,0);edge.rotation.z=sign*.31;
    box(cradle,'Scored cradle footing',pearl,.14,.016,.10,sign*.265,.015,.24);
  }
  const plate=new THREE.Group();plate.name='Notebook press, keyed sleeve and feedstock';plate.position.copy(diePlace);root.add(plate);
  box(plate,'Dovetail bonded carrier plate',shade,.76,.04,.72);
  box(plate,'Paper-press bed',brass,.68,.041,.64,0,.041);
  const sheet=box(plate,'Blank stock held under the die',pearl,.565,.021,.50,0,.070);
  const rails=new THREE.Group();rails.name='Scored press guides';plate.add(rails);
  for(const side of [-1,1]){
    box(rails,'Bonded die guide',stock,.056,.436,.09,side*.354,.23,-.145);
    box(rails,'Brass overlay of die guide',brass,.082,.034,.112,side*.354,.445,-.145);
  }
  const ram=new THREE.Group();ram.name='Source-profile physical press ram';plate.add(ram);
  box(ram,'Dark folded press block',stock,.655,.096,.570,0,.067);
  box(ram,'Raised press handle',brass,.27,.048,.082,0,.14);
  // Rotating triplet of small physical register pins, not a text overlay.
  const registers=[cradle,plate].map(g=>Array.from({length:4},(_,i)=>
    box(g,'Shared template register',asColor(0x695449),.053,.025,.046,(i-1.5)*.088,.041,.31)));
  const delivery=new THREE.Group();delivery.name='Notebook output tray';delivery.position.set(outputPlace.x,.220,outputPlace.z);root.add(delivery);
  box(delivery,'Bound output mount',shade,.76,.047,.61);
  for(const side of [-1,1])box(delivery,'Low output paper guide',stock,.057,.078,.57,side*.35,.048);
  registers.push(Array.from({length:4},(_,i)=>
    box(delivery,'Inherited print notch',asColor(0x695449),.053,.027,.048,(i-1.5)*.088,.042,.292)));
  const carrier=new THREE.Group(), resultPivot=new THREE.Group(),feed=new THREE.Group(), dieShape=new THREE.Group();
  carrier.name='Selected source rolling carrier';resultPivot.name='Settled Notebook variant';feed.name='Pressed blank card travels and buckles';dieShape.name='Selected physical silhouette';
  root.add(carrier,resultPivot,feed);ram.add(dieShape);
  let selectionParts:THREE.Group[]=[], foldPaper:(p:number)=>void=()=>{};
  let family:Template|undefined, generation=-1, vaultOpen=false;
  let roll=1, printing=4, door=0, lastClock=0, profile=0, geometrySignature=0;
  function rebuild(template:Template,variant:number){
    // Remove only the per-selection resources and leave native mechanics and
    // permanent paper fixtures alone. Scope through a temporary disposal root.
    const sourceModel=new THREE.Group(),outModel=new THREE.Group(), paperModel=new THREE.Group(),profileModel=new THREE.Group();
    carrier.clear();resultPivot.clear();feed.clear();dieShape.clear();
    carrier.add(sourceModel);resultPivot.add(outModel);feed.add(paperModel);dieShape.add(profileModel);
    selectionParts=[sourceModel,outModel,paperModel,profileModel];
    const source=foldedGlobe(sourceModel,template,0,.272,true);
    const result=foldedGlobe(outModel,template,variant,.208,false);
    if(template===1){
      // The existing printed pattern gets a thicker spot ink at book scale;
      // keep the exact canonical arrangement/geometry, not new features.
      for(const globe of [source,result])globe.traverse(n=>{
        if(n.name==='Print-lit bioluminescent mark')n.scale.setScalar(1.8);
      });
    }
    const outline=contour(source);profile=outline.length;
    geometrySignature=outline.reduce((v,p)=>Math.imul(v^(Math.round(p.x*10000)&65535)^((Math.round(p.y*10000)&65535)<<16),16777619),2166136261)>>>0;
    const key=asColor(REVISION_VAULT_TEMPLATES[template].ink),imprint=asColor(REVISION_VAULT_TEMPLATES[template].stock);
    perimeter(profileModel,'Pressed rim follows actual globe contour',outline,key,.78,.027,.017);
    const imprintPlate=new THREE.Group();paperModel.add(imprintPlate);imprintPlate.position.y=.015;
    perimeter(imprintPlate,'Imprint inherited from the same globe profile',outline,imprint,.77,.018,.010);
    foldPaper=foundryNet(paperModel,result,REVISION_VAULT_TEMPLATES[template].stock);
    const pressT=foldPaper;
    const unturned=new THREE.Quaternion();
    foldPaper=(p:number)=>{
      imprintPlate.visible=p<.18;
      paperModel.quaternion.slerpQuaternions(unturned,result.quaternion,ease(.43,1,p));
      pressT(p);
    };
    const ir=sourceInkRegistration(template);
    for(const r of registers)r.forEach((mesh,i)=>mesh.material.color.setHex(ir[i]?REVISION_VAULT_TEMPLATES[template].stock:0x695449));
  }
  function clearSelection(){
    selectionParts.forEach(dispose);selectionParts=[];
  }
  function update(s:FolioActions['f03'],dt:number,reduced:boolean){
    const now=performance.now();
    const elapsed=dt===0||lastClock===0?0:Math.min(.20,(now-lastClock)/1000);
    lastClock=now;
    const first=family===undefined, familyChanged=family!==s.template, newPrint=generation!==s.generation;
    const load=s.vaultOpen||s.generation>0;
    if(first||familyChanged||newPrint){
      clearSelection();rebuild(s.template,s.generation);
      if(!first&&familyChanged&&load)roll=0;
      if(!first&&s.generation>0&&(familyChanged||newPrint))printing=0;
    }
    if(!first&&!vaultOpen&&s.vaultOpen)roll=0;
    if(!first&&newPrint&&s.generation>0&&!(vaultOpen||generation>0))roll=0;
    if(reduced||first){roll=1;printing=4;door=Number(s.vaultOpen);}
    else{
      roll=clamp(roll+elapsed*1.62);
      if(s.generation>0&&roll===1)printing+=elapsed;
      const doorTarget=Number(s.vaultOpen||(load&&roll<.93));
      door=THREE.MathUtils.damp(door,doorTarget,12,elapsed);
    }
    family=s.template;generation=s.generation;vaultOpen=s.vaultOpen;
    for(let i=0;i<slips.length;i++)slips[i].rotation.x=s.template===i?door*1.15:0;
    carrier.visible=load;
    const selectedStart=pos(-1.84+(s.template-1)*.40,.510,-.692);
    const arrival=ease(0,1,roll);
    carrier.position.copy(selectedStart).lerp(sourcePlace,arrival);
    carrier.position.y+=Math.sin(Math.PI*arrival)*.037;
    carrier.rotation.x=arrival*3.26-3.26;
    carrier.scale.setScalar(.59+.41*ease(0,.48,roll));
    // The pressing order is explicit: source seats, die closes, the blank
    // moves out still flat, then its exact gores buckle up from the card.
    const t=s.generation>0?printing:0;
    const pressed=ease(.10,.53,t)*(1-ease(.61,.89,t));
    ram.position.y=.366-.286*pressed;
    const paperTravel=ease(.81,1.39,t);
    const folded=ease(1.23,2.04,t);
    sheet.visible=s.generation===0||t<.84;
    feed.visible=s.generation>0&&t>=.84&&folded<.998;
    feed.position.set(diePlace.x,.293,diePlace.z).lerp(pos(outputPlace.x,.261,outputPlace.z),paperTravel);
    feed.position.y+=(outputPlace.y-.261)*folded;
    foldPaper(folded);
    resultPivot.visible=s.generation>0&&folded>=.998;
    resultPivot.position.copy(outputPlace);
    Object.assign(root.userData,{
      family:s.template,template:REVISION_VAULT_TEMPLATES[s.template].name,generation:s.generation,
      sourceVisible:carrier.visible,outputVisible:resultPivot.visible,sourceRoll:roll,printedProfileVertices:profile,
      profileKey:sourceInkRegistration(s.template).join(''),geometrySignature,folded,pressDepth:pressed,sleeveOpen:door,
    });
  }
  return {root,update,dispose:()=>{clearSelection();dispose(root);}};
}
