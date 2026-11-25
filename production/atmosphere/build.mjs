import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createCommon} from './common.mjs';
import {createEarly} from './early.mjs';
import {createWar} from './war.mjs';
import {createLate} from './late.mjs';

const pin='32644a1183e38b948889838edfb7ebe7b304be7ae69e366f1097d840d3c040bd';
const url=k=>new URL(k,import.meta.url);
const sha=x=>createHash('sha256').update(x).digest('hex');
const dest=process.argv[2]??'Palimpsest-Atmosphere-Review.html';
const source=process.argv[3]??url('baseline/encore.html.gz');
const mode=process.argv[4]==='pages';
const packed=readFileSync(source);
const buf=packed[0]===31&&packed[1]===139?gunzipSync(packed):packed;
assert.equal(sha(buf),pin,'The input must be the exact reviewed 360-action Encore.');
let html=buf.toString('utf8');
function patch(a,b){assert.equal(html.split(a).length,2,'Unbound release anchor '+a.slice(0,90));html=html.replace(a,()=>b);}
const constructs='const palBGProof=new URLSearchParams(window.location.search).has("background-proof");';
patch(constructs,constructs+`
const palAirQuery=new URLSearchParams(window.location.search);
const palAirProof=palAirQuery.has("atmosphere-proof");
const palAirMuted=palAirProof&&palAirQuery.has("mute-spill");
const palAirT={Group:x,Mesh:W,Box:QA,Plane:QD,Shape:qP,ShapeGeo:TI,Basic:zP,Standard:aA,Shader:a8,PointLight:k8,Vector3:G,Color:RA,Raycaster:bQ.constructor};
const palAirFx={
  find(root,re){let hit;root.traverse(n=>{if(!hit && re.test(n.name))hit=n;});return hit;},
  visible(n){for(;n;n=n.parent)if(!n.visible||Math.min(n.scale.x,n.scale.y,n.scale.z)<.012)return false;return true;},
  clamp(x,a=0,b=1){return Math.min(b,Math.max(a,x));},
  smooth(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);}
};
const palAir=[${[createCommon,createEarly,createWar,createLate].map(f=>'('+f.toString()+')(palAirT,palAirFx)').join(',')}];
const palAirClocks=new WeakMap();
function palAtmosphereMount(root,i){
  palAirClocks.set(root,0);
  for(const module of palAir)module.mount(root,i);
}
function palAtmosphereStep(root,i,dt){
  if(!palAirClocks.has(root))return;
  const t=palAirClocks.get(root)+(dP||document.hidden||xP||MD!=="open"?0:Math.max(0,dt));
  palAirClocks.set(root,t);
  const later=ND[i-3], wall10=Number(zD?.root?.userData.f10Lift??0), ink=Number(vA.dataset.inkAdvance||0);
  const ctx={t,dt:dP||document.hidden?0:dt,reduced:dP,camera:eP,scene:Lg,view:VP,canvas:vA,
    turn:xP?{progress:palAirFx.clamp(xP.travel),direction:xP.direction,incoming:xP.swapped}:null,
    ink,reveal:i===1?SA.f02.reveal:0,frame11:Number(zD?.root?.userData.authoredFrame??vA.dataset.f11AuthoredFrame??0),
    canopy:Boolean(zD?.root.userData.allPlantsUnfolded||Number(zD?.root.userData.authoredFrame)>=99),
    locked09:ND[5].interactions.B.locked,f09Locked:ND[5].interactions.B.locked,f09Time:g8,
    phase09:g8==null?null:UQ(g8,dP),f09ExtractFrame:i===8?JSON.parse(vA.dataset.f09CandidateState||'{}').authorFrame:0,wall10,nativeState:later,later,muteLight:palAirMuted};
  const proof=palAirProof?[]:null;
  for(const module of palAir){const outcome=module.step(root,i,ctx);if(proof)proof.push(outcome??null);}
  if(proof)vA.dataset.atmosphereProof=JSON.stringify({folio:i+1,t,ink,turn:ctx.turn,frame11:ctx.frame11,
    phase09:ctx.phase09,locked09:ctx.locked09,wall10,layers:proof,
    nodes:root.children.filter(n=>n.name.startsWith("Atmosphere")).map(n=>n.name)});
}
`);
const attach='RP&&(palBG.attach(_A,A),palLiving.mount(_A,A),palEncore.mount(_A,A)),P||(';
patch(attach,'RP&&(palBG.attach(_A,A),palLiving.mount(_A,A),palEncore.mount(_A,A),palAtmosphereMount(_A,A)),P||(');
const draw='(()=>{const cast=palCast.aroundDraw(_A,HA,C,dP,';
patch(draw,'(()=>{palAtmosphereStep(_A,HA,C);const cast=palCast.aroundDraw(_A,HA,C,dP,');
const wick='function dr(A){let P=gP(65,74,A);return{bead:gP(61.5,63.1,A)*(1-gP(65,71,A)),wet:P,strain:gP(67,76,A)*(1-.24*gP(78,95,A)),phase:A<62?"dry":A<65?"bead":A<73?"wicking":"stained"}}';
patch(wick,'function dr(A){let P=gP(42.5,48.6,A);return{bead:gP(38.5,40.2,A)*(1-gP(42.5,47,A)),wet:P,strain:gP(43,49.2,A)*(1-.24*gP(78,95,A)),phase:A<39?"dry":A<42.5?"bead":A<48.6?"wicking":"stained"}}');
patch('<title>PALIMPSEST — Twelve Living Folios</title>','<title>PALIMPSEST — Twelve Living Folios · Atmosphere</title>\n  <meta name="palimpsest-edition" content="paper-atmosphere-v1">');
if(mode){
  patch('https://westkitty.github.io/Palimpsest/archive.html','./archive.html');
}
writeFileSync(dest,html);
console.log(sha(html)+'  '+dest);
