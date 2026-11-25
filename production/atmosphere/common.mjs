export function createCommon(T,fx){
 const {Group,Mesh,Plane,Box,Shader,Basic,Standard,PointLight,Vector3,Color}=T;
 const {clamp,smooth,find,visible}=fx;
 const state=new WeakMap(), world=new Vector3(), p2=new Vector3(), up=new Vector3(0,1,0);
 const specs={
   1:{name:'Digital Geode',anchor:/^palimpsest-original-nialbu-geode$/,color:'#82c7ff',offset:[-.21,.55,.47],intensity:1.35,dist:2.04},
   4:{name:'Foundry die',anchor:/^The one batch of material through all four bays$/,color:'#ff9950',offset:[0,.20,.19],intensity:.90,dist:1.29},
   7:{name:'Aureal Gate',anchor:/^F08 · circular Hookshot portal$/,color:'#63dce8',offset:[-.06,-.14,.46],intensity:1.47,dist:2.35},
   8:{name:'Starsilk extraction',anchor:/^F09_A_FILAMENT$|^F09 · Starsilk slip pulled from the model$/,color:'#7de5f2',offset:[.18,.12,.16],intensity:1.11,dist:1.7},
   10:{name:'Marcel’s gravity wordstream',anchor:/^MARCEL_EFFECT$|^living-f11-marcel-gravity-wordstreaming$/,color:'#8cbfff',offset:[.16,.28,.16],intensity:1.09,dist:1.88},
   11:{name:'Starscraper transit crown',anchor:/^F12 split ground-to-orbit starscraper 1$/,color:'#83d8e5',offset:[0,2.52,-.025],intensity:.82,dist:1.61}
 };
 const taper=new Float32Array(16);
 const vertex=`varying vec2 q;void main(){q=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 function plane(color,w,h,y,mode){
  const m=new Shader({
   uniforms:{tint:{value:new Color(color)},a:{value:0},shape:{value:mode}},
   vertexShader:vertex,fragmentShader:`varying vec2 q;uniform vec3 tint;uniform float a,shape;
   void main(){vec2 k=q;float r=length(k);float roundness=1.-smoothstep(.10,1.0,r);
   float ribbon=(1.-smoothstep(.17,1.,abs(q.y)))*(1.-smoothstep(.28,1.,abs(q.x)));
   float alpha=a*mix(roundness*roundness,ribbon,shape);if(alpha<.001)discard;
   gl_FragColor=vec4(tint,alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`,depthWrite:false,transparent:true,side:2,polygonOffset:true,polygonOffsetFactor:-1
  });
  const mesh=new Mesh(new Plane(w,h),m);mesh.position.y=y;mesh.rotation.x=-Math.PI/2;mesh.raycast=()=>{};
  return mesh;
 }
 const alpha=(n,x)=>{n.material.uniforms.a.value=x;n.visible=x>.001;};
 let room=null;
 function setupScene(scene){
   if(room)return;
   const table=scene.getObjectByName('Living Folios physical volume and slate tabletop')?.children.find(n=>n.isMesh&&n.geometry?.parameters?.width===18.5);
   const leaf=scene.getObjectByName('physically curling folio paper');
   room={crease:{value:0},travel:{value:0}};
   if(table){
     const mat=table.material,prev=mat.onBeforeCompile;
     mat.onBeforeCompile=function(s,renderer){
       prev.call(this,s,renderer);
       s.vertexShader='varying vec3 paperTableLocal;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaperTableLocal=position;');
       s.fragmentShader='varying vec3 paperTableLocal;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          float vignette = smoothstep(.23,1.12,length(paperTableLocal.xz/vec2(9.1,6.2)));
          diffuseColor.rgb *= 1.-.41*vignette;`);
     };mat.customProgramCacheKey=()=> 'paper-room-falloff-v1';mat.needsUpdate=true;
   }
   if(leaf){
     for(const m of [leaf.material,...leaf.children.filter(n=>n.isMesh&&n.material?.map!==undefined).slice(0,1).map(n=>n.material)]){
       if(!m?.isMeshStandardMaterial)continue;
       const old=m.onBeforeCompile;
       m.onBeforeCompile=function(s,r){
         old.call(this,s,r);
         s.uniforms.paperCrease=room.crease;s.uniforms.paperTravel=room.travel;
         s.vertexShader='varying vec2 paperCreaseUV;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaperCreaseUV=uv;');
         s.fragmentShader='varying vec2 paperCreaseUV;uniform float paperCrease,paperTravel;\n'+s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
           float c=exp(-pow((paperCreaseUV.x-(.038+.24*paperTravel))/.024,2.));
           float along=smoothstep(.01,.12,paperCreaseUV.y)*(1.-smoothstep(.85,.99,paperCreaseUV.y));
           diffuseColor.rgb += vec3(.22,.167,.098)*c*along*paperCrease;`);
       };m.customProgramCacheKey=()=> 'paper-curl-catch-v1';m.needsUpdate=true;
     }
   }
 }
 function mount(root,i,insertedSpread){
   const g=new Group();g.name='Atmosphere · bound stock and local bounce';root.add(g);
   const under=[],vellum=[],draft=[],dust=[];
   if(i<12||insertedSpread){
     for(const [x,z,w,l] of [[-2.13,-.37,3.1,1.58],[2.11,-.52,3.08,1.52],[-.48,.48,2.16,.87]]){
       const n=plane('#1b1b22',w,l,.205,0);n.position.set(x,.205,z);n.name='Folio stock · contact penumbra';under.push(n);g.add(n);
     }
     const ash=new Standard({color:i===0?'#c3ad83':'#927753',side:2,roughness:.96});
     const skin=new Standard({color:i===0?'#ded1bc':'#b19a72',side:2,roughness:.95});
     for(let j=0;j<3;j++){
       const h=new Group();h.position.set(j===2?3.98:-3.91+j*.34,.20,-.82+j*.91);h.rotation.y=.19+j*.31;
       h.name=['Draft · exposed paper corner','Draft · second fold','Draft · loose hanging strip'][j];g.add(h);
       const bottom=new Mesh(new Box(.158+j*.017,.012,.073),ash);bottom.position.set(.065,.009,0);h.add(bottom);
       const flap=new Mesh(new Plane(.148,.106+j*.012),skin);flap.position.set(.081,.021,.001);flap.rotation.x=-Math.PI/2;h.add(flap);
       draft.push(h);
     }
   }
   if(i===1||i===6){
     for(const z of [-1.19,.99]){
       const edge=plane(i===1?'#f2d7a3':'#c3d5db',1.21,.31,.215,1);edge.position.set(i===1?-3.28:2.78,.215,z);edge.name='Vellum · thickness-limited light transmission';g.add(edge);vellum.push(edge);
     }
   }
   const spec=specs[i];
   let light=null;
   if(spec){
     light=new PointLight(spec.color,0,spec.dist,2);light.name='Paper bounce · '+spec.name;light.castShadow=false;g.add(light);
     if(i!==1){
       const fleckMat=new Basic({color:spec.color,transparent:true,opacity:.22,depthWrite:false});
       const fleckGeom=new Box(.011,.009,.009);
       for(let k=0;k<7;k++){const n=new Mesh(fleckGeom,fleckMat);n.name='Dust · emitter beam only';n.raycast=()=>{};dust.push(n);g.add(n);}
     }
   }
   state.set(root,{g,under,vellum,draft,dust,light,spec,anchor:null});
 }
 function intensity(i,n,ctx){
   if(!n||!visible(n))return 0;
   if(i===1)return (ctx.reveal===3?smooth(.72,1,ctx.ink):0);
   if(i===4)return ctx.nativeState?.interactions.B.active&&ctx.nativeState.interactions.B.step>=2?1:0;
   if(i===7){let power=0;n.traverse(o=>{const u=o.material?.uniforms?.uEnergy;if(u&&o.visible)power=Math.max(power,u.value)});return clamp(power);}
   if(i===8){const frame=Number(ctx.f09ExtractFrame);return ctx.locked09?0:ctx.nativeState?.interactions.A.active?(Number.isFinite(frame)&&frame>0?smooth(4,15,frame)*(1-smooth(38,49,frame)):1):0;}
   if(i===10)return smooth(22,36,ctx.frame11)*(1-smooth(80,101,ctx.frame11));
   if(i===11)return .68+(ctx.reduced?0:.12*Math.sin(ctx.t*.62));
   return 0;
 }
 function step(root,i,ctx){
   setupScene(ctx.scene);
   if(room){room.crease.value=ctx.reduced||!ctx.turn?0:Math.sin(Math.PI*ctx.turn.progress)**.72;room.travel.value=ctx.turn?.progress??0;}
   const s=state.get(root);if(!s||!root.visible)return;
   const wind=ctx.reduced?0:ctx.t%15.6;
   const blackout=i===8&&ctx.locked09;
   for(let j=0;j<s.draft.length;j++){
     const t=wind-(5.7+j*.46);
     const wave=blackout||ctx.reduced?0:smooth(0,.49,t)*(1-smooth(.75,1.95,t));
     s.draft[j].rotation.z=wave*(j===1?-.20:.32);s.draft[j].rotation.x=wave*.075;
   }
   const settle=(ctx.reduced?1:smooth(.19,1.95,ctx.t));
   s.under.forEach((u,j)=>{alpha(u,blackout?.034:.035+.042*settle);u.scale.set(.87+.13*(1-settle),.96+(1-settle)*.12,1);u.position.z=(j===0?-.37:j===1?-.52:.48)+.20*(1-settle);});
   s.vellum.forEach((v,j)=>alpha(v,i===1?(.085-j*.026)*(1-smooth(.16,.92,ctx.ink)):(j===0?.085:.043)));
   let out=null;
   if(s.light){
     if(!s.anchor||!s.anchor.parent||!visible(s.anchor)){
       let fallback=null,hit=null;root.traverse(n=>{if(s.spec.anchor.test(n.name)){fallback??=n;if(!hit&&visible(n))hit=n;}});s.anchor=hit??fallback;
     }
     const amount=ctx.muteLight?0:intensity(i,s.anchor,ctx);
     s.light.intensity=s.spec.intensity*amount;
     if(s.anchor){
       s.anchor.getWorldPosition(world);
       p2.set(...s.spec.offset).add(world);
       s.g.worldToLocal(p2);s.light.position.copy(p2);
       s.dust.forEach((o,j)=>{
         const p=(ctx.t*.096+j*.152)%1;
         o.position.set(p2.x+(j-3)*.057+.19*p,p2.y-.24+.48*p,p2.z+.21+Math.sin(7*p+j)*.092);
         o.scale.setScalar(Math.max(.001,Math.sin(Math.PI*p)*amount));
         o.visible=!ctx.reduced&&!blackout&&amount>.12&&p>.16&&p<.84;
       });
     }
     out={name:s.spec.name,matched:s.anchor?.name??null,color:s.spec.color,intensity:s.light.intensity,distance:s.light.distance,position:s.light.position.toArray()};
   }
   return {light:out,draft:s.draft.map(n=>n.rotation.z),contact:settle,crease:room?.crease.value??0};
 }
 return {mount,step};
}
