/** Site-specific late-folio effects. Shared authored story remains the timing authority. */
export function createLate(T,fx){
  const records=new WeakMap(),clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,x)=>{
    const w=clamp((x-a)/(b-a));return w*w*(3-2*w);
  };
  const get=(root,s)=>root.getObjectByName(s);
  const make=(root,name)=>{const group=new T.Group();group.name=name;root.add(group);return group;};
  function stage8(root,rec,ctx){
    if(!rec.gate){
      rec.gate=get(root,'F08 · circular Hookshot portal');
      if(!rec.gate)return;
      const planet=get(root,'F08 · planet limb below the suspended Hookshot deck');
      rec.bounce=new T.PointLight(0x75abda,.55,1.65,2);
      rec.bounce.name='Atmosphere 20 · cool planetary reflection under the orbital gate';
      if(planet){planet.add(rec.bounce);rec.bounce.position.set(.07,.20,.53);}
      else{rec.gate.add(rec.bounce);rec.bounce.position.set(.10,-.49,.09);}
      rec.carrier=fx.find(root,/^F08 travelling folded-card carrier/);
      const aperture=rec.gate.children.find(n=>n.isMesh&&n.material?.uniforms?.uEnergy&&n.material?.uniforms?.uImpulse);
      const m=aperture?.material;
      if(m?.fragmentShader?.includes('void main(){')&&m.fragmentShader.includes('gl_FragColor=vec4(body,')){
        rec.mask={value:new T.Vector3(4,4,0)};
        m.uniforms.uAtmosCarrier=rec.mask;
        m.fragmentShader=m.fragmentShader
         .replace('void main(){','uniform vec3 uAtmosCarrier;\n      void main(){')
         .replace('gl_FragColor=vec4(body,',
          `vec2 relative = p-uAtmosCarrier.xy;
          vec2 wake = vec2(relative.x+relative.y*.26,relative.y-relative.x*.16);
          float silhouette = (1.0-smoothstep(.67,1.44,length(wake*vec2(4.4,13.8))))*uAtmosCarrier.z;
          body *= 1.0-.66*silhouette;
          gl_FragColor=vec4(body,`);
        m.needsUpdate=true;
      }
    }
    if(!rec.mask)return;
    rec.carrier ||= fx.find(root,/^F08 travelling folded-card carrier/);
    rec.bounce.intensity=.56;
    const {gate,carrier}=rec;
    const strength=Number(gate.children.find(n=>n.material?.uniforms?.uEnergy)?.material.uniforms.uEnergy.value)||0;
    let x=4,y=4,shade=0,side='off';
    if(carrier&&fx.visible(carrier)&&strength>.02){
      const p=gate.worldToLocal(carrier.getWorldPosition(rec.vec));
      x=p.x/.449;y=(p.y+.032)/.449;
      const z=p.z,near=(1-smooth(.24,.68,Math.abs(z))) * (1-smooth(.75,1.20,Math.hypot(x,y)));
      // The native ship itself is retained and occludes normally. This is only
      // its soft penumbra in the translucent plasma sheet.
      shade=near*(z>.035?.91:.46);
      side=z>.035?'approach':'far';
    }
    rec.mask.value.set(x,y,shade);
    rec.proof={planetBounce:rec.bounce.intensity,carrierPenumbra:Number(shade.toFixed(3)),carrierSide:side};
  }
  const wetVertex=`
    uniform float uWet; uniform float uSag;
    varying vec2 vWick;
    void main(){
      vWick=uv*2.0-1.0;
      vec3 pp=position;
      float along=clamp((vWick.y+1.0)*.51,0.0,1.0);
      float fit=1.0-smoothstep(.10,.48,abs(vWick.x-sin(along*5.2)*.15));
      float soaked=fit*(1.0-smoothstep(uWet-.12,uWet+.03,along));
      pp.z-=uSag*soaked*(.011+.009*sin(vWick.x*17.0+along*8.0)*sin(along*4.1));
      gl_Position=projectionMatrix*modelViewMatrix*vec4(pp,1.0);
    }`;
  const wetFragment=`
    uniform float uWet; varying vec2 vWick;
    void main(){
      float along=clamp((vWick.y+1.0)*.51,0.0,1.0);
      float axis=vWick.x-sin(along*5.2)*.15;
      float grain=sin(vWick.x*48.0+along*7.2)*.022+sin(vWick.x*137.2-along*5.7)*.012;
      float front=uWet+.04*sin(vWick.x*16.0)-.018*sin(vWick.x*41.0);
      float taper=.36*(.58+.42*sin(along*2.8));
      float side=(1.0-smoothstep(taper*.38,taper,abs(axis)+grain));
      float falloff=smoothstep(0.0,.045,along)*(1.0-smoothstep(.76,1.0,along));
      float soak=side*falloff*(1.0-smoothstep(front-.085,front,along));
      float dampEdge=exp(-pow((along-front+.014)*30.0,2.0))*side*falloff;
      gl_FragColor=vec4(mix(vec3(.033,.027,.014),vec3(.11,.11,.076),dampEdge*.35),soak*.64);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  function setupWet(rec,root){
    const stock=get(root,'F11 grounded stock, gravity and slit proof');if(!stock)return;
    const source=get(stock,'F11 Codec single first-dirt patch at cylinder foot');
    if(!source)return;
    const layer=make(stock,'Atmosphere 23 · water drawn along scored fibers before root entry');
    const uniforms={uWet:{value:0},uSag:{value:0}};
    const mat=new T.Shader({uniforms,vertexShader:wetVertex,fragmentShader:wetFragment,transparent:true,depthWrite:false,side:2,polygonOffset:true,polygonOffsetFactor:-1});
    const strip=new T.Mesh(new T.Plane(1.82,1.28,30,24),mat);
    strip.rotation.set(-Math.PI/2,0,.34);
    strip.position.set(.014,source.position.y+.014,.385);
    strip.name='Fiber-aligned shallow wet deformation and advancing edge';layer.add(strip);layer.visible=false;strip.renderOrder=1;
    // Three thin paper curls at the lower fold. Their fixed foot stays on the
    // same stock; the free ends droop only in the path of the capillary stain.
    const paper=new T.Standard({color:0x5b5340,roughness:.96,side:2});
    const fibers=[];
    const foldShape=new T.Shape();foldShape.moveTo(-.014,0).lineTo(.008,.003).lineTo(.016,.10).lineTo(.004,.17).lineTo(-.009,.151).closePath();
    const shapes=new T.ShapeGeo(foldShape);
    for(let i=0;i<3;i++){
      const foot=make(layer,'Fixed wet fiber hinge '+i);foot.position.set(-.09+i*.11,source.position.y+.024,.32+i*.057);
      foot.rotation.y=(i-1)*.11;
      const curl=new T.Mesh(shapes,paper);
      curl.rotation.x=Math.PI*.31;foot.add(curl);curl.visible=false;fibers.push(curl);
    }
    rec.wet={layer,uniforms,fibers,paper};
  }
  function dappleMaterial(m,uniforms){
    const a=m.clone();
    const old=m.onBeforeCompile;
    const oldKey=m.customProgramCacheKey?.();
    a.customProgramCacheKey=()=>String(oldKey||'standard')+'-palimpsest-canopy-dapple-01';
    a.onBeforeCompile=function(s,r){
      old?.call(a,s,r);
      if(!s.vertexShader.includes('#include <project_vertex>')||!s.fragmentShader.includes('#include <tonemapping_fragment>'))return;
      Object.assign(s.uniforms,uniforms);
      s.vertexShader='varying vec3 vAtmosCanopyWorld;\n'+s.vertexShader.replace('#include <project_vertex>',`
        #include <project_vertex>
        vec4 palimDappleP=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          palimDappleP=instanceMatrix*palimDappleP;
        #endif
        vAtmosCanopyWorld=(modelMatrix*palimDappleP).xyz;
      `);
      s.fragmentShader=`
        varying vec3 vAtmosCanopyWorld;
        uniform vec3 uAtmosCanopyOrigin;
        uniform float uAtmosCanopyPhase;
        uniform float uAtmosCanopyStrength;
        float palimDappleLeaves(vec2 p){
          vec2 cell=floor(p); vec2 f=fract(p)-.5;
          float key=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);
          vec2 rot=vec2(cos(key*6.28),sin(key*6.28));
          vec2 q=vec2(dot(rot,f),dot(vec2(-rot.y,rot.x),f));
          float leaf=1.0-smoothstep(.19,.46,length(q*vec2(1.09,2.68)));
          return leaf*mix(.26,1.0,key);
        }
      `+s.fragmentShader.replace('#include <tonemapping_fragment>',`
        vec3 palimRelative=vAtmosCanopyWorld-uAtmosCanopyOrigin;
        vec2 palimShadowXZ=palimRelative.xz+palimRelative.y*vec2(.29,-.23);
        vec2 palimShadowDrift=vec2(sin(uAtmosCanopyPhase*.44),cos(uAtmosCanopyPhase*.35))*.16;
        float palimDark=palimDappleLeaves((palimShadowXZ+palimShadowDrift)*3.8);
        palimDark=max(palimDark,palimDappleLeaves(palimShadowXZ*2.8-palimShadowDrift+.36)*.62);
        float palimZone=(1.0-smoothstep(1.48,2.56,abs(palimRelative.x)))*(1.0-smoothstep(.79,1.68,abs(palimRelative.z)));
        gl_FragColor.rgb*=1.0-uAtmosCanopyStrength*palimZone*(palimDark*.35);
        #include <tonemapping_fragment>
      `);
    };
    return a;
  }
  function scoutCanopy(root,rec){
    const groups=[
      get(root,'F11 grounded stock, gravity and slit proof'),
      get(root,'ACTOR_CODEC_PAGE_MOUNT'),get(root,'ACTOR_MARCEL_PAGE_MOUNT'),get(root,'ACTOR_TIGER_PAGE_MOUNT'),
    ].filter(Boolean);
    const stage=get(root,'F11 dimensional Blender challenger');
    let cylinder=stage&&fx.find(stage,/(?:LOAM_CYLINDER|GLASS_CYLINDER|^LOAM$|^CYLINDER$)/i);
    // The original F11 world does not name its cylinder or crater. Match
    // their authored dimensions, not arbitrary cylinders elsewhere.
    root.traverse(n=>{
      if(n.geometry?.type!=='CylinderGeometry')return;
      const g=n.geometry.parameters;
      if(!cylinder&&Math.abs(g.radiusTop-.19)<.001&&Math.abs(g.radiusBottom-.19)<.001&&Math.abs(g.height-.84)<.001)cylinder=n.parent;
      if(Math.abs(g.radiusTop-1.32)<.001&&Math.abs(g.height-.036)<.001||Math.abs(g.radiusTop-1.88)<.001&&Math.abs(g.height-.048)<.001)groups.push(n);
    });
    if(cylinder)groups.push(cylinder);
    for(const g of groups)g.traverse(n=>{
      if(!n.isMesh||rec.canopyReceivers.has(n)||!n.material||n.name.startsWith('Atmosphere')||n.parent?.name.startsWith('Atmosphere'))return;
      const list=Array.isArray(n.material)?n.material:[n.material];
      const transparentCylinder=cylinder&&n.parent===cylinder;
      if(!list.some(m=>m.isMeshStandardMaterial&&(!m.transparent||transparentCylinder)))return;
      const replaced=list.map(m=>{
        if(!m.isMeshStandardMaterial||m.transparent&&!transparentCylinder)return m;
        if(!rec.leafMaterials.has(m))rec.leafMaterials.set(m,dappleMaterial(m,rec.leafUniforms));
        return rec.leafMaterials.get(m);
      });
      n.material=Array.isArray(n.material)?replaced:replaced[0];rec.canopyReceivers.add(n);++rec.receivers;
    });
    rec.dappleCylinder=!!cylinder;
  }
  function stage11(root,rec,ctx){
    const stage=get(root,'F11 dimensional Blender challenger');
    if(!stage)return;
    if(!rec.wet)setupWet(rec,root);
    const frame=Number(ctx.frame11)||Number(stage.userData.frame)||0;
    if(!rec.wet||!frame)return;
    const wet=smooth(38.2,48.3,frame);
    const sag=smooth(41.2,48.8,frame)*(1-.24*smooth(78,95,frame));
    rec.wet.layer.visible=wet>.001;
    rec.wet.uniforms.uWet.value=wet;rec.wet.uniforms.uSag.value=sag;
    rec.wet.fibers.forEach((f,i)=>{
      f.visible=wet>(.31+i*.11);
      f.rotation.x=Math.PI*(.28-.27*sag);
      f.rotation.z=(i-1)*.12+sag*.075;
    });
    rec.wet.paper.color.setHex(0x5b5340).lerp(new T.Color(0x342d22),sag);
    if(!rec.leafUniforms){
      rec.leafUniforms={uAtmosCanopyOrigin:{value:new T.Vector3()},uAtmosCanopyPhase:{value:0},uAtmosCanopyStrength:{value:0}};
      rec.leafMaterials=new WeakMap();rec.canopyReceivers=new WeakSet();rec.receivers=0;rec.nextCanopyScan=-1;
    }
    if(rec.receivers===0 || rec.nextCanopyScan<ctx.t){scoutCanopy(root,rec);rec.nextCanopyScan=ctx.t+.75;}
    const canopy=smooth(93,108,frame);
    stage.getWorldPosition(rec.leafUniforms.uAtmosCanopyOrigin.value);
    rec.leafUniforms.uAtmosCanopyPhase.value=ctx.reduced?1.2:ctx.t;
    rec.leafUniforms.uAtmosCanopyStrength.value=canopy*.74;
    rec.proof={authoredFrame:frame,wet:Number(wet.toFixed(3)),sag:Number(sag.toFixed(3)),rootEligible:frame>=49,dapple:Number(canopy.toFixed(3)),dappleReceivers:rec.receivers,dappleCylinder:!!rec.dappleCylinder};
  }
  function stage12(root,rec,ctx){
    if(!rec.orbit){
      const zones=[];
      root.traverse(n=>{if(n.name==='F12 upper-vacuum light field behind the orbital docks')zones.push(n);});
      if(!zones.length)return;
      rec.orbit=[];
      for(const [island,g] of zones.entries())g.traverse(n=>{
        if(!n.isMesh||Array.isArray(n.material)||!n.material?.color)return;
        const m=n.material.clone();n.material=m;
        m.transparent=true;m.depthWrite=false;const origin=m.opacity;
        // Shallower pins remain readable; smaller dots and rear arcs recede.
        const rank=rec.orbit.length%12;
        rec.orbit.push({m,origin,depth:.30+((rank*7+island*3)%11)/11*.61,rank,island});
      });
    }
    const t=ctx.reduced?2.17:ctx.t;
    const reveal=smooth(.14,1.95,t);
    const closing=typeof ctx.turn?.progress==='number'&&(ctx.turn.to===12||ctx.turn.direction>0&&!ctx.turn.incoming)?smooth(.13,.67,ctx.turn.progress):0;
    for(const a of rec.orbit){
      const coast=1-a.depth*.42*smooth(1.1+a.depth,2.8+a.depth,t);
      a.m.opacity=a.origin*(.17+.75*reveal)*(1-a.depth*.61)*coast*(1-closing);
    }
    rec.proof={orbitalFieldFaces:rec.orbit.length,outerDepthOpacity:rec.orbit.at(-1)?.m.opacity||0,codaFade:closing};
  }
  function stageCoda(root,rec,ctx){
    if(!rec.rake){
      const crease=get(root,'Coda legible real horizontal paper crease');if(!crease?.parent)return;
      const uniforms={uRake:{value:0},uBend:{value:0}};
      const material=new T.Shader({
        uniforms,transparent:true,depthWrite:false,side:2,
        vertexShader:`varying vec2 q;void main(){q=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`
          uniform float uRake;uniform float uBend;varying vec2 q;
          void main(){
            float crease=exp(-22.0*abs(q.y-.04*sin(q.x*16.0)));
            float lip=exp(-28.0*abs(q.y+.12));
            float dry=.86+.097*sin(q.x*164.0)+.04*sin(q.x*261.0);
            float wick=(1.0-smoothstep(.83,1.0,abs(q.x)))*dry;
            float beam=exp(-2.8*pow(q.x+1.05-uRake*2.10,2.0));
            gl_FragColor=vec4(vec3(.68,.55,.36),(crease*.31+lip*.15)*wick*uBend*beam);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      const line=new T.Mesh(new T.Plane(7.41,.24),material);
      line.name='Atmosphere 25 · one-time grazing light on the physical closing crease';
      line.position.set(crease.position.x,crease.position.y,crease.position.z+.006);
      line.renderOrder=4;crease.parent.add(line);rec.rake={line,uniforms};
    }
    const t=ctx.reduced?2.3:ctx.t;
    const sweep=smooth(.45,1.73,t);
    const settle=smooth(.38,.78,t)*(1-smooth(1.57,2.15,t));
    rec.rake.line.visible=settle>.002;
    rec.rake.uniforms.uRake.value=sweep;rec.rake.uniforms.uBend.value=settle;
    rec.proof={rakeSweep:Number(sweep.toFixed(3)),rakeLight:Number(settle.toFixed(3)),still:t>=2.15};
  }
  function mount(root,index){if([7,10,11,12].includes(index))records.set(root,{vec:new T.Vector3()});}
  function step(root,index,ctx){
    if(![7,10,11,12].includes(index))return;
    if(!records.has(root))mount(root,index);
    const rec=records.get(root);
    if(index===7)stage8(root,rec,ctx);
    if(index===10)stage11(root,rec,ctx);
    if(index===11)stage12(root,rec,ctx);
    if(index===12)stageCoda(root,rec,ctx);
    if(rec.proof)root.userData.lateAtmos=rec.proof;
    return rec.proof||null;
  }
  return {mount,step};
}
