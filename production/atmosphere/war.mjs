// War and aftermath atmosphere. All receivers live on their native object or
// folded leaf; cadence comes from existing folio mechanics, not a second story.
export function createWar(T, fx) {
  const {Group,Mesh,Plane,Shape,ShapeGeo,Shader,Standard,Vector3,Color} = T;
  const state = new WeakMap();
  const clamp = (x, lo=0, hi=1) => Math.min(hi,Math.max(lo,x));
  const ramp=(x,a,b)=>{const v=clamp((x-a)/(b-a));return v*v*(3-2*v);};
  const get=(root,re)=>{let o;root.traverse(n=>{if(!o&&n.name&&re.test(n.name))o=n;});return o;};
  const findAll=(root,re)=>{const a=[]; root?.traverse(o=>{if(o.name&&re.test(o.name))a.push(o);});return a;};
  const seen=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return !!o;};
  const vtx=`
    varying vec2 paperUv;
    varying vec3 paperWorld;
    void main() {
      paperUv=uv;
      vec4 pt=modelMatrix*vec4(position,1.0);
      paperWorld=pt.xyz;
      gl_Position=projectionMatrix*viewMatrix*pt;
    }
  `;
  const color=(hex)=>new Color(hex);
  const shader=(body,uniforms)=>{
    const u=Object.fromEntries(Object.entries(uniforms).map(([k,value])=>[k,{value}]));
    const m=new Shader({
      uniforms:u, vertexShader:vtx, transparent:true, depthWrite:false, side:2,
      polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,
      fragmentShader:`
        varying vec2 paperUv;
        varying vec3 paperWorld;
        ${body}
      `,
    });
    return {m,u};
  };
  const vector=()=>new Vector3();
  function skin(source,mat,name,order=2){
    if(!source?.isMesh)return null;
    const mesh=new Mesh(source.geometry.clone(),mat);
    mesh.name=name;mesh.renderOrder=order;mesh.raycast=()=>{};
    source.add(mesh);
    return mesh;
  }
  function plate(parent,mat,name,w,h,x,y,z,order=1){
    const mesh=new Mesh(new Plane(w,h,1,1),mat);
    mesh.name=name;mesh.renderOrder=order;mesh.raycast=()=>{};
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function data(root,key,fallback){
    let match=null;
    root.traverse(o=>{if(match===null&&o.userData?.[key]!==undefined)match=o.userData;});
    return match??fallback??{};
  }

  function findFoundry(s,root){
    const native=get(root,/^F05 · Blender-authored crimson ring and inspection works$/);
    if(!native||native.userData.assetState!=='ready')return;
    const ring=get(native,/two physical Blade Ring halves draw together/);
    const orbit=get(native,/planet.orbital.comparison.pivot/i);
    const rim=get(native,/^A__Opaque_rim_shard$/);
    const die=get(native,/^The one batch of material through all four bays$/);
    const receivers=findAll(native,/^(Planet_glued_stepped_plinth\d*|Tapered_brass_planet_stand|Factory_stepped_technical_bed\d*|Front cut-stock foundry crew step)$/);
    if(!ring||!orbit||!rim||!die||!receivers.length)return;
    const shadow=shader(`
      uniform vec3 center,heading,castColor;
      uniform float strength;
      void main() {
        vec3 d=paperWorld-center;
        vec2 dir=normalize(heading.xz+vec2(0.0001,0.0));
        vec2 side=vec2(dir.y,-dir.x);
        float along=dot(d.xz,dir);
        float arc=0.19*sin(along*1.89+heading.y*2.1)+0.045*along*along;
        float lateral=dot(d.xz,side)-arc-0.14;
        float band=1.0-smoothstep(0.042,0.235,abs(lateral));
        float lengthMask=smoothstep(-1.31,-0.88,along)*(1.0-smoothstep(1.08,2.20,along));
        float reach=(0.62+smoothstep(-0.95,0.35,d.y)*0.38);
        gl_FragColor=vec4(castColor, strength*lengthMask*band*reach);
        #include <colorspace_fragment>
      }`,{center:vector(),heading:new Vector3(1,0,0),castColor:color(0x50202a),strength:0});
    // Shadow appears on the plinth and nearest paper machinery, not a sheet
    // hovering over the set. The weak red core remains a shadow, not emission.
    for(const receiver of receivers)skin(receiver,shadow.m,'F05 red-ring penumbra on '+receiver.name,1);
    const heat=shader(`
      uniform float time,strength;
      uniform vec3 warmth;
      void main() {
        vec2 q=paperUv;
        float wave=sin(q.y*19.0-time*2.8)*0.045+sin(q.y*31.0-time*4.3)*0.024;
        float warm=smoothstep(0.0,0.13,q.y)*(1.0-smoothstep(0.48,0.94,q.y));
        float blur=0.06+q.y*0.21;
        float x=q.x-0.5-wave;
        float distortion=exp(-pow((x-0.08)/blur,2.0))*0.37+exp(-pow((x+0.13)/blur,2.0))*0.20;
        float ribbon=0.68+0.18*sin(q.y*47.0-time*6.4+q.x*4.0);
        gl_FragColor=vec4(warmth, strength*warm*distortion*ribbon);
        #include <colorspace_fragment>
      }`,{time:0,strength:0,warmth:color(0xb49a86)});
    const lift=plate(die,heat.m,'F05 bounded convective warm-paper shimmer above the compression die',.64,.68,.007,.50,.027,3);
    lift.rotation.y=-.16;
    s.bind={native,ring,orbit,rim,shadow,heat,lift,receivers};
  }
  function stepFoundry(s,root,ctx){
    if(!s.bind)findFoundry(s,root);
    if(!s.bind)return;
    const {native,ring,orbit,rim,shadow,heat,lift}=s.bind;
    const armed=seen(ring)||seen(orbit);
    const p=shadow.u.center.value;
    (seen(ring)?ring:orbit).getWorldPosition(p);
    const h=shadow.u.heading.value;
    rim.getWorldPosition(h).sub(p);
    if(h.lengthSq()<.01)h.set(1,0,0);
    const k=clamp(Number(native.userData.assembledRing??native.userData.ring));
    shadow.u.strength.value=armed ? .34+.05*k : 0;
    const f=native.userData.factory;
    // Offcut aftermath is warm briefly; the idle bay does not glow all day.
    const phase=f?.offcut?.phase;
    const live=!!f?.moving||phase==='hot'||phase==='flight'||phase==='snag';
    const work=f?.operation==='compress'||f?.bay===2;
    const heatTarget=!ctx.reduced&&work?(live ? .35 : .16):0;
    s.heatAmount+= (heatTarget-s.heatAmount)*(1-Math.exp(-clamp(ctx.dt,0,.1)*4.2));
    lift.visible=s.heatAmount>.012;
    heat.u.time.value=ctx.t;heat.u.strength.value=s.heatAmount;
    s.group.userData.warAtmosphere={ringBand:shadow.u.strength.value,ringAnchor:p.toArray(),nativeReceivers:s.bind.receivers.length,heat:s.heatAmount};
  }
  function findFray(s,root){
    const flap=get(root,/^F06 torn stock still bonded at outer right crease$/);
    if(!flap)return;
    const original=findAll(flap,/^One exposed pulp fiber still on the lifted edge$/);
    if(!original.length)return;
    // These ends are bonded to the native toe of the torn flap, not floating
    // threads. Their curled final pose remains on the spent copy after reload.
    const thick=new Standard({color:0xd5ae83,roughness:.94,depthWrite:true,flatShading:true,side:2});
    const pale=new Standard({color:0xa67755,roughness:.97,depthWrite:true,flatShading:true,side:2});
    const anchors=[];
    for(let i=0;i<original.length;i++){
      const fiber=original[i],pin=new Group();
      pin.name='F06 torn pulp fibrils · '+(i+1);flap.add(pin);
      for(let j=0;j<2;j++){
        const length=.076+i*.008+j*.021;
        const p=new Shape();
        p.moveTo(0,-.004).lineTo(-length*.35,-.006).lineTo(-length*.69,-.019-j*.004).lineTo(-length,-.027-j*.012)
          .lineTo(-length*.62,-.010).lineTo(-length*.26,.005).lineTo(0,.006).closePath();
        const ribbon=new Mesh(new ShapeGeo(p),j?pale:thick);ribbon.raycast=()=>{};
        ribbon.name='F06 bent paper fibre stays bonded';ribbon.position.z=(j?1:-1)*.013;
        ribbon.rotation.x=j*.56-.21;pin.add(ribbon);
      }
      anchors.push({pin,fiber});
    }
    s.bind={flap,anchors};
  }
  function stepFray(s,root,ctx){
    if(!s.bind)findFray(s,root);
    if(!s.bind)return;
    const d=data(root,'tearOpen');
    const actual=d.tearOpen ?? clamp(-s.bind.flap.rotation.z/1.02);
    const torn=!!d.crossingTorn;
    if(torn&&!s.torn)s.bendAge=s.first||ctx.reduced?2:0;
    s.torn=torn||s.torn;s.first=false;
    s.bendAge+=clamp(ctx.dt,0,.08);
    const u=Math.max(actual,s.torn ? .43 : 0);
    const bend=ramp(u,.24,.83);
    for(let i=0;i<s.bind.anchors.length;i++){
      const {pin,fiber}=s.bind.anchors[i];
      pin.visible=seen(s.bind.flap)&&u>.21;
      pin.position.copy(fiber.position);
      pin.position.x-=.023+(i*.005);
      const settling=ctx.reduced?0:Math.sin(s.bendAge*14+i*.37)*Math.exp(-5.6*s.bendAge)*bend;
      pin.rotation.set(.09*(i%2?1:-1),fiber.rotation.y*.82, -.04+bend*(.43+i*.035)+settling*.11);
      pin.scale.set(.52+.48*bend, .79+bend*.21, 1);
    }
    s.group.userData.warAtmosphere={torn:s.torn,open:actual,fibres:actual>.21?s.bind.anchors.length*2:0,bend};
  }

  function findRelief(s,root){
    const fleet=get(root,/^F07 · Ruby Eclipse fleet attrition in cut stock$/);
    const shelter=get(root,/^F07 · illustrated relief shelter behind the parcel ramp$/);
    const plan=get(root,/^F07_PlanVellum$/);
    const roof=get(root,/^F07 folded translucent vellum sheet$/);
    if(!fleet||!shelter||!plan||!roof)return;
    const glow=shader(`
      uniform vec3 ember,smoke,sourcePoint;
      uniform float flash,after;
      void main() {
        float spread=1.0/(1.0+dot(paperWorld-sourcePoint,paperWorld-sourcePoint)*0.24);
        float grain=0.94+0.06*sin(paperUv.x*66.0+paperUv.y*101.0);
        float a=(flash*0.63*spread+after*0.19)*grain;
        gl_FragColor=vec4(mix(smoke,ember,flash/(flash+after*0.40+0.01)),a);
        #include <colorspace_fragment>
      }`,{ember:color(0xe2a383),smoke:color(0x453a45),flash:0,after:0,sourcePoint:vector()});
    const receivers=[plan,roof].map(o=>skin(o,glow.m,'F07 distant losses · light caught by '+o.name,4));
    const fog=shader(`
      uniform vec3 ink;
      uniform float time,strength;
      void main() {
        vec2 p=paperUv;
        float x=smoothstep(0.0,0.15,p.x)*(1.0-smoothstep(0.75,1.0,p.x));
        float dy=(p.y-0.31)+sin(p.x*13.0+time*0.29)*0.08;
        float y=exp(-15.0*dy*dy)*smoothstep(0.0,0.16,p.y)*(1.0-smoothstep(0.58,0.99,p.y));
        float hole=1.0-0.31*exp(-pow((p.x-0.27)/0.087,2.0))-0.28*exp(-pow((p.x-0.74)/0.093,2.0));
        gl_FragColor=vec4(ink,strength*x*y*hole);
        #include <colorspace_fragment>
      }`,{ink:color(0x9b96a0),time:0,strength:.14});
    // Two low sheets straddle the back footings; solid posts occlude both.
    const haze0=plate(shelter,fog.m,'F07 low haze behind the landing posts',1.16,.145,0,.079,-.193,2);
    const haze1=plate(shelter,fog.m,'F07 low haze on the rear seam fold',.98,.096,-.023,.058,-.25,2);
    haze1.rotation.y=.11;
    s.bind={fleet,shelter,glow,receivers,fog,defenders:findAll(fleet,/^defending paper wing \d+$/),haze:[haze0,haze1]};
  }
  function stepRelief(s,root,ctx){
    if(!s.bind)findRelief(s,root);
    if(!s.bind)return;
    const {defenders,glow,fog,receivers}=s.bind;
    let casualties=0,mostRecent=null;
    for(let i=0;i<defenders.length;i++){
      const lost=!defenders[i].visible;
      if(lost){
        casualties++;
        if(s.prevLoss[i]===false)mostRecent=defenders[i];
      }
      s.prevLoss[i]=lost;
    }
    if(mostRecent&&!ctx.reduced){
      mostRecent.getWorldPosition(glow.u.sourcePoint.value);
      s.flashAge=0;
    }
    s.flashAge+=clamp(ctx.dt,0,.08);
    const flash=ctx.reduced?0:(1-ramp(s.flashAge,.02,.53))*.56;
    glow.u.flash.value=flash;
    glow.u.after.value=casualties/Math.max(1,defenders.length);
    for(const r of receivers)if(r)r.visible=flash>.008||casualties>0;
    fog.u.time.value=ctx.reduced?0:ctx.t;
    fog.u.strength.value=.13+.026*glow.u.after.value;
    s.group.userData.warAtmosphere={losses:casualties,flash,veil:glow.u.after.value,haze:fog.u.strength.value};
  }

  function stepQuiet(s,root,ctx){
    const locked=!!(ctx.locked09??ctx.f09Locked);
    const time=ctx.f09Time;
    // Well before the native rupture at 2.59s, take out the small motion
    // whose absence sells the silence. Keep the plot's fleet and fracture.
    const quiet=locked&&(time==null||ctx.reduced||time>=1.32||
      ['rupture','aftermath','turn'].includes(ctx.phase09));
    if(quiet){
      for(const o of root.children){
        if(/^(Second background layer · folio 9|Living margins · folio 9|Encore · folio 9|Atmosphere · shared|Atmosphere · bound stock and local bounce)/i.test(o.name))o.visible=false;
      }
      if(!s.quietRings){
        const stars=findAll(root,/^F09 · folded cluster satellite \d+$/);
        if(stars.length)s.quietRings=stars.flatMap(n=>n.children.filter(m=>m.geometry?.type==='RingGeometry'));
      }
      // Extinguish the thin reflected glints, not the folded source stars.
      // The normal collapse still moves and removes its own source objects.
      for(const ring of s.quietRings??[])ring.visible=false;
    }
    s.group.userData.warAtmosphere={quiet,quenchedGlints:quiet?(s.quietRings?.length??0):0,spent:locked&&(time==null||ctx.phase09==='aftermath'||ctx.phase09==='turn')};
  }

  function findWall(s,root){
    const receiver=get(root,/^F10 · recessed black paper receiver$/);
    const terrain=get(root,/^F10 whole-stock spatial environmental response$/);
    if(!receiver||!terrain)return;
    const papers=findAll(terrain,/^F10 (?:cold folding paper field|laminated stock opposing facet|dark exposed under-stock|pressed ground-paper slip)$/);
    if(!papers.length)return;
    const dress=shader(`
      uniform vec3 center,oldSky,afterSky;
      uniform float lift,heading,strength;
      void main() {
        vec2 p=paperWorld.xz-center.xz;
        float radius=length(p);
        float a=atan(p.y,p.x);
        float lead=0.5+0.5*cos(a-heading);
        float direction=0.42+0.58*lead;
        float rim=smoothstep(0.1,0.8,radius)*(1.0-smoothstep(1.7,2.63,radius));
        float oncoming=lift*(0.38+direction*0.62);
        float recede=smoothstep(radius*0.075,0.87,oncoming);
        float beyond=smoothstep(-0.14,1.12,p.x);
        float room=0.72+0.28*cos(a*3.0+radius*3.2);
        gl_FragColor=vec4(mix(oldSky,afterSky,recede),rim*room*(1.0-beyond)*mix(0.075,0.37,recede)*strength);
        #include <colorspace_fragment>
      }`,{center:vector(),oldSky:color(0x8daabe),afterSky:color(0x171924),lift:0,heading:0,strength:1});
    for(const node of papers)skin(node,dress.m,'F10 receding starlight on '+node.name,2);
    s.bind={receiver,terrain,papers,dress};
  }
  function stepWall(s,root,ctx){
    if(!s.bind)findWall(s,root);
    if(!s.bind)return;
    const d=data(root,'f10Lift');
    const l=clamp(Number(d.f10Lift??ctx.wall10?.lift??ctx.wall10??0)||0);
    const {receiver,terrain,papers,dress}=s.bind;
    receiver.getWorldPosition(dress.u.center.value);
    // Read a rotating physical crease lane. Only the already affected terrain
    // receives the darkening skin; inhabited-door paper is deliberately untouched.
    const raw=d.f10Wave??ctx.wall10?.wave??{};
    let direction=l*3.25-.96;
    if(Array.isArray(raw)&&raw.length>2){
      let x=0,y=0;
      raw.forEach((v,i)=>{const a=i/raw.length*Math.PI*2,w=clamp(Number(v)||0);
        x+=Math.cos(a)*w;y+=Math.sin(a)*w;});
      if(Math.hypot(x,y)>.06)direction=Math.atan2(y,x);
    }else{
      const phase=Number(raw.angle??raw.phase??raw.front??raw.progress);
      if(Number.isFinite(phase))direction=phase*3.25-.96;
    }
    dress.u.heading.value=direction;
    dress.u.lift.value=l;
    dress.u.strength.value=seen(terrain)?1:0;
    s.group.userData.warAtmosphere={lightTaken:l,heading:dress.u.heading.value,terrainReceivers:papers.length,inhabitedLightRetained:true};
  }

  function mount(root,index){
    if(![4,5,6,8,9].includes(index))return;
    const group=new Group();
    group.name='Atmosphere · war folio '+(index+1);
    root.add(group);
    state.set(root,{group,index,heatAmount:0,first:true,torn:false,bendAge:2,flashAge:3,prevLoss:[]});
  }
  function step(root,index,ctx){
    const s=state.get(root);
    if(!s||s.index!==index)return;
    switch(index){
      case 4:stepFoundry(s,root,ctx);break;
      case 5:stepFray(s,root,ctx);break;
      case 6:stepRelief(s,root,ctx);break;
      case 8:stepQuiet(s,root,ctx);break;
      case 9:stepWall(s,root,ctx);break;
    }
    return s.group.userData.warAtmosphere;
  }
  return {mount,step};
}
