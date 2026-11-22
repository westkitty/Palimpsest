import * as THREE from 'three';
import { cssStock, folioStock, isDarkStock } from './livingPaperStock.ts';

/**
 * Physical theatre binding for the continuous Living Folios.
 * The approved original BookAndDeskRig is the material/hinge precedent.
 * This volume owns only the table, cover and physical leaves; folio worlds
 * and their separate archival/manuscript state remain owned by previewV2.
 */
const PAGE_WIDTH = 4.65;
const PAGE_DEPTH = 5.76;
const LEAF_Y = 0.43;
const clamp01 = (n: number) => THREE.MathUtils.clamp(n, 0, 1);

function wovenSurface(base: string, bright: string, dark: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Book material canvas unavailable');
  c.fillStyle = base;
  c.fillRect(0, 0, 256, 256);
  for (let i=0; i<256; i+=5) {
    c.fillStyle = i%10 ? bright : dark;
    c.fillRect(i, 0, 1, 256);
    c.fillRect(0, i+2, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 3.2);
  tex.anisotropy = 4;
  return tex;
}

function mineralSurface(): THREE.CanvasTexture {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const c=canvas.getContext('2d');
  if(!c)throw new Error('Slate mineral texture unavailable');
  c.fillStyle='#161c22';c.fillRect(0,0,256,256);
  let seed=0x65832b7f;
  const rand=()=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;
  };
  for(let i=0;i<4500;i++){
    const v=rand()>0.5?210:15;
    c.fillStyle='rgba('+v+','+v+','+v+','+(0.014+rand()*0.035)+')';
    c.fillRect(rand()*256,rand()*256,0.4+rand()*2.6,0.4+rand()*1.6);
  }
  for(let i=0;i<24;i++){
    c.beginPath();
    c.strokeStyle='rgba(112,129,144,'+(0.012+rand()*0.027)+')';
    c.lineWidth=0.2+rand()*0.55;
    const x=rand()*256,y=rand()*256;
    c.moveTo(x,y);
    c.quadraticCurveTo(x+25,y-4,x+40+rand()*40,y+4);
    c.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(3,2);
  texture.anisotropy=4;
  return texture;
}

function coverPrinting(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1080;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Cover typography canvas unavailable');
  c.fillStyle = '#17212b';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = '#a18b60';
  c.lineWidth = 13;
  c.strokeRect(37, 35, 694, 1010);
  c.lineWidth = 3;
  c.strokeRect(56, 55, 656, 972);
  c.lineWidth = 1.5;
  c.strokeRect(81, 83, 606, 912);
  c.fillStyle = '#d9caa9';
  c.textAlign = 'center';
  c.font = 'bold 78px Georgia,serif';
  c.fillText('PALIMPSEST', 384, 340, 680);
  c.font = '30px Georgia,serif';
  c.fillText('AN ILLUSTRATED', 384, 430, 660);
  c.fillText('HISTORY OF THE ALL', 384, 478, 660);
  c.fillStyle = '#b49a6c';
  c.beginPath();
  c.arc(384, 680, 114, 0, Math.PI * 2);
  c.arc(384, 680, 91, 0, Math.PI * 2, true);
  c.fill('evenodd');
  c.strokeStyle = '#76c0ce';
  c.lineWidth = 7;
  c.beginPath();
  c.arc(384, 680, 68, 0.28, 2.96);
  c.stroke();
  for (const radius of [151, 162]) {
    c.strokeStyle = '#7f735c';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(384, 680, radius, -Math.PI * 0.77, Math.PI * 0.77);
    c.stroke();
  }
  c.fillStyle = '#b8a17a';
  c.font = '25px Georgia,serif';
  c.fillText('YOUR FATE IS IN OUR HANDS.', 384, 918, 656);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;
  texture.anisotropy = 4;
  return texture;
}

function folioPrinting(title: string, page: number, soaked: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1000;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Folio leaf canvas unavailable');
  const stock = folioStock(page,soaked);
  const dark = isDarkStock(stock);
  c.fillStyle = cssStock(stock.face);
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = dark ? '#b69a6b' : '#9b8056';
  c.lineWidth = 7;
  c.strokeRect(34, 35, 700, 930);
  c.strokeStyle = dark ? '#81765e' : '#c1ac87';
  c.lineWidth = 2;
  c.strokeRect(52, 54, 664, 894);
  c.fillStyle = dark ? '#dfd1b4' : '#303d49';
  c.textAlign = 'center';
  c.font = '26px Georgia,serif';
  c.fillText('PALIMPSEST  /  LIVING FOLIOS', 384, 124);
  c.fillStyle = dark ? '#f1e6ce' : '#3a4855';
  c.font = 'bold 110px Georgia,serif';
  c.fillText('F' + String(page + 1).padStart(2, '0'), 384, 424);
  c.font = 'bold 52px Georgia,serif';
  c.fillText(title.replace(/^[IVX]+\\s*[—-]\\s*/, ''), 384, 543, 645);
  c.fillStyle = dark ? '#b69a6b' : '#8c7658';
  for (let i=0; i<5; i++) c.fillRect(146+i*92,654,52,3);
  c.fillStyle = dark ? '#d5c5ab' : '#4e5b63';
  c.font = '24px Georgia,serif';
  c.fillText('A PAGE MADE TO BE TURNED', 384, 880);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function mesh(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material,
  x: number, y: number, z: number): THREE.Mesh {
  const value = new THREE.Mesh(geometry, material);
  value.position.set(x, y, z);
  value.castShadow = true;
  value.receiveShadow = true;
  parent.add(value);
  return value;
}

/** Click/drag targets occupy the physical book, never an overlay menu. */
export class LivingBookBinding {
  public readonly root = new THREE.Group();
  public readonly coverHit: THREE.Mesh;
  public readonly rightCornerHit: THREE.Mesh;
  public readonly leftCornerHit: THREE.Mesh;
  public readonly leaf: THREE.Mesh;
  public coverProgress = 0;
  private readonly volume = new THREE.Group();
  private readonly coverPivot = new THREE.Group();
  private readonly closedStack = new THREE.Group();
  private readonly cornerMarkers = new THREE.Group();
  private readonly pageEdges = new THREE.Group();
  private readonly spine = new THREE.Group();
  private readonly leafGeo: THREE.PlaneGeometry;
  private readonly leafBackGeo: THREE.PlaneGeometry;
  private readonly leafBase: Float32Array;
  private readonly edgeGeo: THREE.BufferGeometry;
  private readonly leafFrontMat: THREE.MeshStandardMaterial;
  private readonly leafBackMat: THREE.MeshStandardMaterial;
  private readonly leafRim: THREE.MeshStandardMaterial;
  private readonly leafEdgeFront = new THREE.Color();
  private readonly leafEdgeBack = new THREE.Color();
  private readonly ownedMaterials = new Set<THREE.Material>();
  private readonly ownedTextures = new Set<THREE.Texture>();

  constructor() {
    this.root.name = 'Living Folios physical volume and slate tabletop';
    this.root.add(this.volume);
    const linen = wovenSurface('#17212b','#223342','#101922');
    const pageEdge = wovenSurface('#d9cdb4','#eee4cb','#a99b7c');
    const slateTexture = mineralSurface();
    this.ownedTextures.add(linen).add(pageEdge).add(slateTexture);
    const coverMat = new THREE.MeshPhysicalMaterial({
      map: linen, color:0xe4e9ec, bumpMap: linen, bumpScale:0.018,
      roughness:0.81, metalness:0.04, clearcoat:0.12, clearcoatRoughness:0.67,
    });
    const paperMat = new THREE.MeshStandardMaterial({map:pageEdge,color:0xf8f4e9,roughness:0.96});
    const brass = new THREE.MeshStandardMaterial({color:0xae9463,metalness:0.7,roughness:0.44});
    const ink = new THREE.MeshStandardMaterial({color:0x101923,roughness:0.91});
    const slate = new THREE.MeshStandardMaterial({
      map:slateTexture,roughness:0.94,metalness:0.025,bumpMap:slateTexture,bumpScale:0.014,
    });
    for(const mat of [coverMat,paperMat,brass,ink,slate])this.ownedMaterials.add(mat);

    // One uninterrupted table exists underneath every state. The authored
    // spread's own shallow boards sit above it, without a second slate slab.
    const table = mesh(this.root,new THREE.BoxGeometry(18.5,0.19,12.8),slate,0,-0.35,0);
    table.castShadow = false;
    const rim = mesh(this.root,new THREE.BoxGeometry(18.62,0.035,12.92),ink,0,-0.465,0);
    rim.castShadow = false;
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width=shadowCanvas.height=256;
    const s=shadowCanvas.getContext('2d');
    if(!s)throw new Error('Contact shadow unavailable');
    const grad=s.createRadialGradient(128,128,16,128,128,126);
    grad.addColorStop(0,'rgba(0,0,0,0.69)');
    grad.addColorStop(0.52,'rgba(0,0,0,0.38)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    s.fillStyle=grad;s.fillRect(0,0,256,256);
    const contact=new THREE.CanvasTexture(shadowCanvas);
    this.ownedTextures.add(contact);
    const shadowMat=new THREE.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false,opacity:0.86});
    this.ownedMaterials.add(shadowMat);
    const shadow=mesh(this.root,new THREE.PlaneGeometry(12.6,8.6),shadowMat,0,-0.251,0);
    shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;

    // The sealed volume has substantial board and separately readable leaf
    // signatures. Its hinge is a shaped cylindrical linen spine, not a line.
    mesh(this.closedStack,new THREE.BoxGeometry(4.82,0.29,6.12),paperMat,2.36,0.10,0);
    mesh(this.closedStack,new THREE.BoxGeometry(4.94,0.09,6.22),coverMat,2.36,-0.095,0);
    mesh(this.closedStack,new THREE.BoxGeometry(0.17,0.40,6.20),brass,0.04,0.08,0);
    for(let i=0;i<11;i++){
      const elevation=-0.035+i*0.022;
      const signature=mesh(this.closedStack,new THREE.BoxGeometry(4.72-i*0.009,0.006,6.07-i*0.004),
        i%3===0?brass:paperMat,2.37,elevation,0);
      signature.castShadow=false;
    }
    this.volume.add(this.closedStack);

    const spineBody=mesh(this.spine,new THREE.CylinderGeometry(0.24,0.24,6.2,22,1,false,0,Math.PI),coverMat,0,0.08,0);
    spineBody.rotation.x=Math.PI/2;
    spineBody.rotation.z=Math.PI;
    for(const z of [-2.22,-1.75,0,1.75,2.22]){
      const band=mesh(this.spine,new THREE.TorusGeometry(0.246,0.024,8,24,Math.PI),brass,0,0.08,z);
      band.rotation.x=Math.PI/2;band.rotation.y=Math.PI/2;
    }
    this.volume.add(this.spine);

    this.coverPivot.position.set(0,0.21,0);
    const coverBoard=mesh(this.coverPivot,
      new THREE.BoxGeometry(4.94, 0.18, 6.26),coverMat,-2.43,-0.13,0);
    coverBoard.name='Linen-covered heavy hinged front board';
    const print=coverPrinting();
    this.ownedTextures.add(print);
    const coverPrint=new THREE.MeshBasicMaterial({map:print,side:THREE.DoubleSide});
    this.ownedMaterials.add(coverPrint);
    const plate=mesh(this.coverPivot,new THREE.PlaneGeometry(4.48,5.81),coverPrint,-2.43,-0.231,0);
    plate.rotation.x=Math.PI/2;
    plate.castShadow=false;
    for(const z of [-2.90,2.90]){
      mesh(this.coverPivot,new THREE.BoxGeometry(0.16,0.10,0.22),brass,-0.20,-0.13,z);
      mesh(this.coverPivot,new THREE.BoxGeometry(0.32,0.028,0.24),brass,-4.54,-0.231,z>0?2.72:-2.72);
    }
    for(let i=0;i<5;i++){
      const thread=mesh(this.coverPivot,new THREE.BoxGeometry(0.018,0.012,5.70),brass,-0.18-i*0.042,-0.229,0);
      thread.castShadow=false;
    }
    this.volume.add(this.coverPivot);

    // Both under-page stacks remain visible as the reader advances. Their
    // signature heights respond to folio position without rewriting worlds.
    this.volume.add(this.pageEdges);
    for(const side of [-1,1]){
      for(let i=0;i<7;i++){
        const layer=mesh(this.pageEdges,new THREE.BoxGeometry(4.62-i*0.013,0.015,5.78-i*0.013),
          i%3===0?brass:paperMat,side*2.33,0.020+i*0.020,0);
        layer.name=side<0?'turned signature':'unread signature';
        layer.userData.signatureIndex=i;
        layer.userData.signatureSide=side;
      }
    }

    const hidden=new THREE.MeshBasicMaterial({visible:false});
    this.ownedMaterials.add(hidden);
    this.coverHit=mesh(this.volume,new THREE.BoxGeometry(5.08,0.62,6.34),hidden,2.43,0.49,0);
    this.coverHit.name='Touch or click the physical closed cover to open';
    this.rightCornerHit=mesh(this.volume,new THREE.BoxGeometry(1.6,0.55,2.0),hidden,3.82,0.36,1.88);
    this.leftCornerHit=mesh(this.volume,new THREE.BoxGeometry(1.6,0.55,2.0),hidden,-3.82,0.36,1.88);
    this.rightCornerHit.name='Drag the right page edge to the left';
    this.leftCornerHit.name='Drag the left page edge to the right';
    for(const side of [-1,1]){
      const corner=mesh(this.cornerMarkers,new THREE.BoxGeometry(0.25,0.012,0.25),
        brass,side*4.15,0.295,2.42);
      corner.rotation.y=Math.PI/4;
    }
    this.volume.add(this.cornerMarkers);

    this.leafGeo=new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_DEPTH, 28, 18);
    this.leafGeo.translate(PAGE_WIDTH/2,0,0);
    this.leafGeo.rotateX(-Math.PI/2);
    this.leafBase=new Float32Array((this.leafGeo.attributes.position as THREE.BufferAttribute).array);
    this.leafBackGeo=this.leafGeo.clone();
    this.leafBackGeo.setAttribute('position',this.leafGeo.attributes.position);
    this.leafBackGeo.setAttribute('normal',this.leafGeo.attributes.normal);
    const backUv=this.leafBackGeo.attributes.uv as THREE.BufferAttribute;
    for(let i=0;i<backUv.count;i++)backUv.setX(i,1-backUv.getX(i));
    backUv.needsUpdate=true;
    this.leafFrontMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.92,metalness:0,side:THREE.FrontSide});
    this.leafBackMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.92,metalness:0,side:THREE.BackSide});
    this.ownedMaterials.add(this.leafFrontMat).add(this.leafBackMat);
    this.leaf=mesh(this.volume,this.leafGeo,this.leafFrontMat,0,LEAF_Y,0);
    const reverse=new THREE.Mesh(this.leafBackGeo,this.leafBackMat);
    reverse.receiveShadow=true;
    this.leaf.add(reverse);
    this.leaf.name='physically curling folio paper';
    this.leaf.visible=false;
    this.edgeGeo=new THREE.BufferGeometry();
    this.edgeGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(19*2*3),3));
    const indices:number[]=[];
    for(let i=0;i<18;i++){
      const n=i*2;
      indices.push(n,n+1,n+2,n+1,n+3,n+2);
    }
    this.edgeGeo.setIndex(indices);
    const paperRim=new THREE.MeshStandardMaterial({color:0xc9b68f,roughness:0.99,side:THREE.DoubleSide});
    this.leafRim=paperRim;
    this.ownedMaterials.add(paperRim);
    const edge=new THREE.Mesh(this.edgeGeo,paperRim);
    edge.name='deforming physical paper thickness at outer tip';
    edge.castShadow=true;
    this.leaf.add(edge);
    this.setPageIndex(0);
    this.setCoverProgress(0);
  }

  public setPageIndex(index:number):void {
    const page=Math.max(0,Math.min(12,Math.floor(index)));
    for(const layer of this.pageEdges.children){
      if(!(layer instanceof THREE.Mesh))continue;
      const left=layer.userData.signatureSide<0;
      const signature=Number(layer.userData.signatureIndex);
      layer.visible=left?signature<Math.min(7,page):signature<Math.min(7,13-page);
      layer.position.y=0.02+signature*0.020;
    }
  }

  public setCoverProgress(amount:number):void {
    this.coverProgress=clamp01(amount);
    this.coverPivot.rotation.z=-(1-this.coverProgress)*Math.PI;
    this.coverPivot.position.y=THREE.MathUtils.lerp(0.21,0.08,this.coverProgress);
    this.volume.position.x=-PAGE_WIDTH/2*(1-this.coverProgress);
    this.volume.position.y=-0.10*(1-this.coverProgress);
    this.spine.scale.setScalar(THREE.MathUtils.lerp(1,0.65,this.coverProgress));
    this.spine.position.y=THREE.MathUtils.lerp(0.09,-0.035,this.coverProgress);
    this.closedStack.visible=this.coverProgress<0.87;
    this.closedStack.scale.y=THREE.MathUtils.lerp(1,0.45,this.coverProgress);
    this.coverHit.visible=this.coverProgress<0.1;
    this.cornerMarkers.visible=this.coverProgress>0.99;
    this.rightCornerHit.visible=this.coverProgress>0.99;
    this.leftCornerHit.visible=this.coverProgress>0.99;
    this.pageEdges.visible=this.coverProgress>0.76;
  }

  public setLeafTitles(front:string,frontIndex:number,back:string,backIndex:number,soaked=false):void {
    const frontTexture=folioPrinting(front,frontIndex,soaked);
    const backTexture=folioPrinting(back,backIndex,soaked);
    this.leafEdgeFront.setHex(folioStock(frontIndex,soaked).cut);
    this.leafEdgeBack.setHex(folioStock(backIndex,soaked).cut);
    this.leafFrontMat.map?.dispose();
    this.leafBackMat.map?.dispose();
    this.leafFrontMat.map=frontTexture;
    this.leafBackMat.map=backTexture;
    this.leafFrontMat.needsUpdate=true;
    this.leafBackMat.needsUpdate=true;
  }

  public setLeafProgress(progress:number,visible=true):void {
    this.leaf.visible=visible && this.coverProgress>0.97;
    if(!this.leaf.visible)return;
    const p=clamp01(progress);
    const positions=this.leafGeo.attributes.position as THREE.BufferAttribute;
    this.leafRim.color.copy(this.leafEdgeFront).lerp(this.leafEdgeBack,p);
    const bend=Math.sin(p*Math.PI);
    for(let i=0;i<positions.count;i++){
      const bx=this.leafBase[i*3],bz=this.leafBase[i*3+2];
      const u=bx/PAGE_WIDTH,v=(bz+PAGE_DEPTH/2)/PAGE_DEPTH;
      const lag=bend*(0.40*u+0.13*v);
      const angle=THREE.MathUtils.clamp(p*Math.PI-lag,0,Math.PI);
      const arch=Math.sin(u*Math.PI)*bend*0.40;
      const rest=0.045*Math.sin(u*Math.PI);
      positions.setXYZ(i,Math.cos(angle)*bx,Math.sin(angle)*bx*0.42+arch+rest,bz);
    }
    positions.needsUpdate=true;
    this.leafGeo.computeVertexNormals();
    const edge=this.edgeGeo.attributes.position as THREE.BufferAttribute;
    for(let i=0;i<=18;i++){
      const v=i/18,z=-PAGE_DEPTH/2+v*PAGE_DEPTH;
      const lag=bend*(0.40+0.13*v);
      const angle=THREE.MathUtils.clamp(p*Math.PI-lag,0,Math.PI);
      const x=Math.cos(angle)*PAGE_WIDTH;
      const y=Math.sin(angle)*PAGE_WIDTH*0.42+0.015;
      edge.setXYZ(i*2,x,y-0.021,z);
      edge.setXYZ(i*2+1,x,y+0.021,z);
    }
    edge.needsUpdate=true;
    this.edgeGeo.computeVertexNormals();
  }

  public dispose():void {
    const geometries=new Set<THREE.BufferGeometry>();
    this.root.traverse(obj=>{
      if(obj instanceof THREE.Mesh)geometries.add(obj.geometry);
    });
    for(const geometry of geometries)geometry.dispose();
    for(const material of this.ownedMaterials)material.dispose();
    for(const texture of this.ownedTextures)texture.dispose();
    this.leafFrontMat.map?.dispose();
    this.leafBackMat.map?.dispose();
    this.root.clear();
  }
}
