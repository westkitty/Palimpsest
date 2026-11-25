export function createEarly(T,fx) {
  const sessions=new WeakMap();
  const sat=(n)=>Math.max(0,Math.min(1,n));
  const smooth=(a,b,n)=>{const t=sat((n-a)/(b-a));return t*t*(3-2*t);};
  const first=(root,test)=>{let o;root.traverse(n=>{if(!o&&test(n))o=n;});return o;};
  const every=(root,test)=>{const out=[];root.traverse(n=>{if(test(n))out.push(n);});return out;};
  const isVisible=node=>{for(let n=node;n;n=n.parent)if(!n.visible)return false;return true;};
  const vertex=`
  varying vec2 vUv; varying vec3 vWorld;
  void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const shader=(fragment,uniforms={})=>new T.Shader({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,
    depthWrite:false,toneMapped:false,side:2,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const patch=(desc,before,after)=>{if(!desc.includes(before))throw new Error('Early atmosphere native F02 shader anchor missing: '+before);
    return desc.replace(before,after);};
  const addPlate=(parent,name,width,depth,mat,x,y,z)=>{
    const o=new T.Mesh(new T.Plane(width,depth),mat);o.name=name;
    o.position.set(x,y,z);o.rotation.x=-Math.PI*.5;parent.add(o);return o;
  };
  function emboss(parent){
    const matched=every(parent,n=>n.name==='Bonded station foot');
    const fragment=`
      varying vec2 vUv; varying vec3 vWorld;
      uniform float style;
      void main(){
        vec2 p=vUv;
        vec3 toEye=normalize(cameraPosition-vWorld);
        float graze=.24+.76*(1.-smoothstep(.35,.87,abs(toEye.y)));
        float edge=smoothstep(.03,.12,p.x)*(1.-smoothstep(.88,.97,p.x));
        float bend=.041*sin(p.x*15.+style)*sin(p.x*3.14159);
        float g0=p.y-.29-bend,g1=p.y-.51+bend*.72,g2=p.y-.74-bend*.33;
        float verge=min(abs(g0),min(abs(g1),abs(g2)));
        float hollow=exp(-pow(verge/.046,2.0));
        float rim=exp(-pow(min(abs(g0-.058),min(abs(g1-.058),abs(g2-.058)))/.037,2.));
        float fiber=.87+.13*sin(161.*p.x+7.*p.y);
        float grey=.22+.32*rim;
        gl_FragColor=vec4(vec3(grey*.835,grey*.779,grey*.672),edge*graze*fiber*(hollow*.45+rim*.29));
        #include <colorspace_fragment>
      }`;
    return matched.map((foot,i)=>{
      const m=shader(fragment,{style:{value:(i+1)*1.05}});
      const face=addPlate(foot,'F01 | Blind Starsilk emboss in the native station stock',1.43,.19,m,0,.0237,.112);
      face.renderOrder=1;return face;
    });
  }
  function nativeVellum(root){
    return every(root,n=>n.isMesh&&n.material?.isShaderMaterial&&n.material.fragmentShader?.includes('float fiberTime=channel')
      &&n.material.uniforms?.advance);
  }
  function attachInk(objects){
    const dwell={value:0},geode={value:0};
    for(const node of objects){
      const mat=node.material;
      let s=mat.fragmentShader;
      // Follow the same existing authorial front, sharpening longitudinal
      // fibers but preserving the dark mask and the three stage thresholds.
      s=patch(s,'uniform float advance;','uniform float advance;\nuniform float palDwell;\nuniform float palGeodeReturn;');
      s=patch(s,'float arrive=p.x<0.?left:right;',`float arrive=p.x<0.?left:right;
        float warp=(noise(vec2(p.x*2.8+p.y*.92,p.y*44.0))-.48)*.025;
        float micro=(noise(vec2(p.x*6.4,p.y*97.0))-.5)*.010;
        float scoreCross=abs(p.y+1.43+abs(p.x)*.029);
        // The grain races laterally; the compressed score arrests lateral
        // seepage for a short interval without becoming a permanent barrier.
        float creaseDelay=.021*(1.-smoothstep(.012,.107,scoreCross));
        arrive+= (warp+micro+creaseDelay)*smoothstep(.10,.38,broad);`);
      s=patch(s,'float rimTide=(1.-smoothstep(.002,.014,abs(tide-.010)))*spread;',
        `float rimTide=(1.-smoothstep(.002,.014,abs(tide-.010)))*spread;
        float dwell=exp(-palDwell*2.8);
        wet*=dwell;
        rimTide*=dwell;
        vec3 sight=normalize(cameraPosition-vec3(p.x,.21,p.y));
        float glancing=.37+.63*(1.-smoothstep(.38,.88,abs(sight.y)));
        float lineVein=pow(noise(vec2(p.x*4.5+p.y*.29,p.y*40.)),2.3);
        ink+=wet*glancing*lineVein*vec3(.046,.066,.101);`);
      s=patch(s,'ink+=rimTide*vec3(.085,.120,.162)*runnels;',
        'ink+=rimTide*vec3(.073,.105,.143)*runnels*glancing;');
      s=patch(s,'float safeInterior=smoothstep(.059,.090,tide)*step(.001,advance);',
        `float driedTide=tide+min(palDwell,.75)*.032;
        float safeInterior=smoothstep(.067,.108,driedTide)*step(.001,advance)
          * (1.-clamp(wet*.85+rimTide*.36,0.,1.));`);
      s=patch(s,'gl_FragColor=vec4(paper,1.);',`// One very local patch of blue reflected by the exact vellum beneath the Geode.
        // Standard stock folds receive a real point light; this non-lit native
        // ink material needs the same color masked directly into its albedo.
        vec2 spillUV=p-vec2(2.27,.71);
        spillUV.x+=spillUV.y*.16;
        float pool=exp(-3.3*dot(spillUV*vec2(1.04,1.34),spillUV*vec2(1.04,1.34)));
        float stopEdge=1.-smoothstep(.43,1.12,length(spillUV));
        float prism=(.81+.19*fiber)*(1.-.13*score);
        paper+=vec3(.223,.571,1.)*.037*palGeodeReturn*pool*stopEdge*prism;
        gl_FragColor=vec4(paper,1.);`);
      mat.uniforms.palDwell=dwell;mat.uniforms.palGeodeReturn=geode;mat.fragmentShader=s;mat.needsUpdate=true;
    }
    return {dwell,geode};
  }
  function globeShadow(parent,name,x,y,z){
    const material=shader(`
      varying vec2 vUv;
      uniform float folded;
      uniform float amount;
      uniform float ribs;
      uniform float roll;
      void main(){
        vec2 p=(vUv-.5)*2.;
        p.x+=p.y*.18;
        float open=1.-folded;
        vec2 q=p/vec2(.73+open*.17,.74-open*.20);
        float a=atan(q.y,q.x)+roll;
        float scallop=pow(.5+.5*cos(a*ribs),1.7)*(.068+.034*open);
        float d=length(q)-(.89-scallop);
        float soft=1.-smoothstep(-.050,.115,d);
        float core=1.-smoothstep(-.29,.12,d);
        float seam=pow(.5+.5*cos(a*ribs),8.)*smoothstep(.18,.90,length(q));
        gl_FragColor=vec4(.022,.014,.019,(soft*.49+core*.25+seam*.20*soft)*amount);
        #include <colorspace_fragment>
      }`,{folded:{value:1},amount:{value:0},ribs:{value:12},roll:{value:0}});
    const plane=addPlate(parent,name,.91,.73,material,x,y,z);
    plane.renderOrder=1;return {plane,u:material.uniforms};
  }
  function workshop(parent){
    const source=first(parent,n=>n.name==='WorldsVault notched source cradle');
    const delivery=first(parent,n=>n.name==='Notebook output tray');
    const cabinet=first(parent,n=>n.name==='WorldsVault folded-planet cabinet');
    if(!source||!delivery||!cabinet)return null;
    const sourceShadow=globeShadow(source,'F03 | Scalloped shadow on the source cradle stock',.105,.057,.082);
    // Receives the projected silhouette beside the moving card, not on glass.
    const outputShadow=globeShadow(delivery,'F03 | The folding globe draws its ribbed shadow on the output tray',.106,.036,.086);
    const stock=shader(`
      varying vec2 vUv;
      uniform float strength;
      void main() {
        float p=sin(vUv.x*3.14159);
        float fade=pow(max(0.,p),.72)*exp(-vUv.y*3.7);
        gl_FragColor=vec4(.58,.27,.081,fade*strength);
        #include <colorspace_fragment>
      }`,{strength:{value:0}});
    const seam=addPlate(cabinet,'F03 | Reflected amber on the selected sleeve sill',.32,.088,stock,0,.128,.087);
    seam.renderOrder=2;seam.visible=false;
    const bounce=new T.PointLight(0xffcc97,0,.63,2);
    bounce.name='F03 | Warm drawer bounce, bounded to one sleeve';cabinet.add(bounce);
    return {parent,sourceShadow,outputShadow,seam,bounce};
  }
  function f04Lenses(root) {
    const row=every(root,n=>/^B__Lamp0[1-5]$/.test(n.name)).sort((a,b)=>a.name.localeCompare(b.name));
    const colony=first(root,n=>n.name==='Paper first lamp amber insert');
    if(row.length!==5||!colony)return null;
    const slots=[colony,...row];
    return slots.map((source,i)=>{
      const color=i===0?0xffcc83:0xffd39b;
      const l=new T.PointLight(color,0,i===0?.79:.52,2);
      l.name=`F04 | Local amber bounce ${i===0?'at the first colony':'from lit settlement '+i}`;root.add(l);
      return {source,l};
    });
  }
  function mount(root,index){
    if(index<0||index>3)return;
    sessions.set(root,{index,frames:0,bound:false,lastInk:NaN,group:null});
  }
  function step(root,index,ctx){
    const s=sessions.get(root);
    if(!s||s.index!==index)return;
    const reduced=ctx.reduced===true;
    const discover=s.frames++%7===0;
    if(index===0){
      if(!s.bound&&discover){
        const relay=first(root,n=>n.name.includes('pre-stellar Starsilk tension relay'));
        if(relay){s.emboss=emboss(relay);s.bound=s.emboss.length===3;}
      }
      return (root.userData.atmosphereEarly={emboss:s.emboss?.length??0});
    }
    if(index===1){
      if(discover&&(!s.bound||!s.group?.every(n=>n.parent))){
        const found=nativeVellum(root);
        if(found.length===2){Object.assign(s,attachInk(found));s.group=found;s.bound=true;}
      }
      if(s.dwell){
        const a=Number(s.group[0].material.uniforms.advance.value)||0;
        const moved=!Number.isFinite(s.lastInk)||Math.abs(s.lastInk-a)>.00014;
        s.dwell.value=reduced?1.5:a<.001||moved?0:Math.min(1.75,s.dwell.value+(ctx.dt||0));
        s.lastInk=a;
        s.geode.value=ctx.reveal===3&&!ctx.muteLight?smooth(.82,.98,a):0;
        return (root.userData.atmosphereEarly={ink:a,dwell:s.dwell.value,panels:s.group.length,geodeLeaf:s.geode.value});
      }
      return;
    }
    if(index===2){
      if(!s.workshop&&discover){
        const w=first(root,n=>n.name==='F03 folded-paper cabinet, press and output');
        if(w)s.workshop=workshop(w);
      }
      if(s.workshop){
        const {parent,sourceShadow,outputShadow,seam,bounce}=s.workshop;
        const {sleeveOpen=0,folded=0,cardDraw=0,sourceRoll=0,family=0,sourceVisible=false}=parent.userData;
        const sourceAmount=Number(sourceVisible)*smooth(.48,.97,sourceRoll)*.59;
        const outputAmount=smooth(.76,1,cardDraw)*(.24+smooth(.04,.93,folded)*.47);
        const ribs=[12,10,14][family%3];
        sourceShadow.u.amount.value=sourceAmount;
        sourceShadow.u.ribs.value=ribs;sourceShadow.u.roll.value=sourceRoll*.41;
        sourceShadow.plane.visible=sourceAmount>.005;
        outputShadow.u.amount.value=outputAmount;
        outputShadow.u.folded.value=folded;outputShadow.u.ribs.value=ribs;outputShadow.u.roll.value=.31+folded*.58;
        outputShadow.plane.scale.set(.82-.16*folded,.76+.12*folded,1);
        outputShadow.plane.visible=outputAmount>.005;
        const open=smooth(.10,.95,sleeveOpen),x=(family-1)*.40;
        const warm=ctx.muteLight?0:open;
        seam.material.uniforms.strength.value=warm*.26;seam.position.x=x;seam.visible=warm>.01;
        bounce.position.set(x,.231,.066);bounce.intensity=.091*warm;
        return (root.userData.atmosphereEarly={sourceShadow:sourceAmount,outputShadow:outputAmount,crease:folded,drawer:open,drawerSpill:warm});
      }
      return;
    }
    if(!s.lenses&&discover)s.lenses=f04Lenses(root);
    if(!s.lenses)return;
    const at=s.at||(s.at=new T.Vector3());const lit=[];
    s.lenses.forEach(({source,l},i)=>{
      const on=isVisible(source)?(i===0?1:smooth(.53,.91,source.scale.x)):0;
      source.getWorldPosition(at);root.worldToLocal(at);
      // Scope actual inverse-square bounce to paper beneath/by the exact mesh.
      l.position.copy(at);l.position.y-=i===0?.068:.044;
      l.intensity=(i===0?.44:.093)*(ctx.muteLight?0:on);
      lit.push(on);
    });
    return (root.userData.atmosphereEarly={colonies:lit.length,lights:lit,muted:Boolean(ctx.muteLight)});
  }
  return {mount,step};
}
