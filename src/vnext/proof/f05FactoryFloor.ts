import * as THREE from 'three';
const stations=[-.98,.53,2.03,3.53];
export function factoryRead(step:number,age:number,reduced:boolean){
  const bay=Math.max(0,Math.min(4,step));
  const feed=reduced?1:THREE.MathUtils.smoothstep(age,0,.80);
  const prev=stations[Math.max(0,bay-2)];
  const next=stations[Math.max(0,bay-1)];
  const x=THREE.MathUtils.lerp(prev,next,feed);
  return {bay,x,moving:bay>1&&feed<1,operation:bay===0?'rest':(['settle','compress','extrude','close'][bay-1])};
}

export function makeFactoryFloor(parent:THREE.Group){
  const root=new THREE.Group();root.name='One continuous folded factory line';parent.add(root);
  const stock=new THREE.MeshStandardMaterial({color:0x5a3932,roughness:.9});
  const crease=new THREE.MeshStandardMaterial({color:0xa48060,roughness:.89});
  const crimson=new THREE.MeshStandardMaterial({color:0x983e43,roughness:.36,metalness:.18});
  const ochre=new THREE.MeshStandardMaterial({color:0xdbb56c,roughness:.88});
  const box=(w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0,p:THREE.Group=root)=>{
    const m0=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);m0.position.set(x,y,z);m0.receiveShadow=true;m0.castShadow=h>.12;p.add(m0);return m0;
  };
  const hinge=new THREE.Group();hinge.position.set(1.25,.392,.015);root.add(hinge);
  box(5.22,.075,.29,stock,0,0,0,hinge);
  for(const side of [-1,1])box(5.22,.026,.027,crease,0,.052,side*.138,hinge);
  for(let i=0;i<13;i++){
    const pin=box(.052,.083,.23,crease,-2.42+i*.40,-.008,0,hinge);
    pin.rotation.z=.13*(i%2?1:-1);
  }
  const carrier=new THREE.Group();carrier.name='The one batch of material through all four bays';root.add(carrier);
  box(.31,.038,.23,stock,0,-.035,0,carrier);
  const raw=new THREE.Mesh(new THREE.IcosahedronGeometry(.137,0),ochre);raw.position.y=.105;carrier.add(raw);
  const pressed=box(.255,.085,.155,crimson,0,.052,0,carrier);
  const strip=box(.52,.063,.095,crimson,0,.050,0,carrier);
  const band=new THREE.Group();band.position.y=.114;carrier.add(band);
  const halves=[0,1].map(i=>{
    const q=new THREE.Mesh(new THREE.TorusGeometry(.12,.031,4,16,Math.PI),crimson);
    q.rotation.z=i*Math.PI;q.rotation.x=-Math.PI/2;band.add(q);return q;
  });
  let last=-1,age=0;
  return (step:number,dt:number,reduced:boolean)=>{
    if(last!==step){last=step;age=0;}
    age+=Math.min(.075,Math.max(0,dt));
    const state=factoryRead(step,age,reduced);
    root.visible=step>0;
    carrier.position.set(state.x,.492,.018);
    const beat=reduced?1:THREE.MathUtils.smoothstep(age,.27,1.06);
    raw.visible=step===1;pressed.visible=step===2;strip.visible=step===3;band.visible=step===4;
    if(step===1){raw.position.y=.093+(reduced?0:Math.abs(Math.sin(age*13))*Math.exp(-age*3)*.36);raw.rotation.z=reduced?0:.42*Math.sin(age*7);}
    if(step===2){pressed.scale.set(1+.24*beat,1.92-.92*beat,1+.13*beat);}
    if(step===3){strip.scale.x=.15+.85*beat;strip.position.x=.12*(1-beat);}
    if(step===4){halves[0].position.x=-.24*(1-beat);halves[1].position.x=.24*(1-beat);}
    return state;
  };
}
