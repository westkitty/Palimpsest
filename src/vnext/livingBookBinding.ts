import * as THREE from 'three';

/**
 * Physical book binding for the continuous Living Folios.
 *
 * The original BookAndDeskRig established the contract: hinged cover first,
 * then a curved cardstock page under direct pointer control. This smaller
 * book-only component uses that same page-spine geometry without duplicating
 * the historical reader's narrator, document state or 3D folio worlds.
 */
const PAGE_WIDTH = 4.65;
const PAGE_DEPTH = 5.76;
const LEAF_Y = 0.43;
const clamp01 = (n: number) => THREE.MathUtils.clamp(n, 0, 1);

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
  c.fillStyle = '#b8a17a';
  c.font = '25px Georgia,serif';
  c.fillText('YOUR FATE IS IN OUR HANDS.', 384, 918, 656);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // The front plate is printed on the cover's underside when fully open.
  // Closing flips that underside upward: rotate print 180 degrees to read
  // correctly from the visitor's near edge of the table.
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;
  texture.anisotropy = 4;
  return texture;
}

function folioPrinting(title: string, page: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1000;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Folio leaf canvas unavailable');
  c.fillStyle = '#e6dcc8';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = '#9b8056';
  c.lineWidth = 7;
  c.strokeRect(34, 35, 700, 930);
  c.strokeStyle = '#c1ac87';
  c.lineWidth = 2;
  c.strokeRect(52, 54, 664, 894);
  c.fillStyle = '#303d49';
  c.textAlign = 'center';
  c.font = '26px Georgia,serif';
  c.fillText('PALIMPSEST  /  LIVING FOLIOS', 384, 124);
  c.fillStyle = '#3a4855';
  c.font = 'bold 110px Georgia,serif';
  c.fillText('F' + String(page + 1).padStart(2, '0'), 384, 424);
  c.font = 'bold 52px Georgia,serif';
  c.fillText(title.replace(/^[IVX]+\s*[—-]\s*/, ''), 384, 543, 645);
  c.fillStyle = '#8c7658';
  for (let i = 0; i < 5; i++) {
    c.fillRect(146 + i * 92, 654, 52, 3);
  }
  c.fillStyle = '#4e5b63';
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

/** The two click zones are 3D paper regions, not screen-space UI buttons. */
export class LivingBookBinding {
  public readonly root = new THREE.Group();
  public readonly coverHit: THREE.Mesh;
  public readonly rightCornerHit: THREE.Mesh;
  public readonly leftCornerHit: THREE.Mesh;
  public readonly leaf: THREE.Mesh;
  public coverProgress = 0;
  private readonly coverPivot = new THREE.Group();
  private readonly closedStack = new THREE.Group();
  private readonly cornerMarkers = new THREE.Group();
  private readonly leafGeo: THREE.PlaneGeometry;
  private readonly leafBackGeo: THREE.PlaneGeometry;
  private readonly leafBase: Float32Array;
  private readonly leafFrontMat: THREE.MeshStandardMaterial;
  private readonly leafBackMat: THREE.MeshStandardMaterial;
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly ownedTextures: THREE.Texture[] = [];

  constructor() {
    const coverMat = new THREE.MeshStandardMaterial({color: 0x17212b, roughness: 0.88});
    const paperMat = new THREE.MeshStandardMaterial({color: 0xd9ccb5, roughness: 0.96});
    const brass = new THREE.MeshStandardMaterial({color: 0xae9463, metalness: 0.24, roughness: 0.65});
    this.ownedMaterials.push(coverMat, paperMat, brass);
    this.root.name = 'Living Folios physical binding; independent of historical reader';

    // Underlying right-hand page stack makes the closed volume genuinely thick.
    const stack = mesh(this.closedStack,
      new THREE.BoxGeometry(4.82, 0.29, 6.12), paperMat, 2.36, 0.10, 0);
    stack.castShadow = true;
    mesh(this.closedStack, new THREE.BoxGeometry(4.94, 0.09, 6.22),
      coverMat, 2.36, -0.095, 0);
    mesh(this.closedStack, new THREE.BoxGeometry(0.17, 0.40, 6.20),
      brass, 0.04, 0.08, 0);
    this.root.add(this.closedStack);

    this.coverPivot.position.set(0, 0.21, 0);
    const coverBoard = mesh(this.coverPivot,
      new THREE.BoxGeometry(4.94, 0.18, 6.26), coverMat, -2.43, -0.13, 0);
    coverBoard.castShadow = true;
    // The front imprint belongs on the outside (underside when the board is
    // open, upper surface when rotated shut around the original hinge).
    const print = coverPrinting();
    this.ownedTextures.push(print);
    const coverPrint = new THREE.MeshBasicMaterial({map: print, side: THREE.DoubleSide});
    this.ownedMaterials.push(coverPrint);
    const plate = mesh(this.coverPivot,
      new THREE.PlaneGeometry(4.48, 5.81), coverPrint, -2.43, -0.231, 0);
    plate.rotation.x = Math.PI / 2;
    // Hinge guards, not invented lore features.
    for (const z of [-2.90, 2.90]) {
      mesh(this.coverPivot,new THREE.BoxGeometry(0.16, 0.10, 0.22),
        brass,-0.20,-0.13,z);
    }
    this.root.add(this.coverPivot);

    const hidden = new THREE.MeshBasicMaterial({visible: false});
    this.ownedMaterials.push(hidden);
    this.coverHit = mesh(this.root,new THREE.BoxGeometry(5.08, 0.62, 6.34),
      hidden, 2.43, 0.49, 0);
    this.coverHit.name = 'Touch or click the physical closed cover to open';
    this.rightCornerHit = mesh(this.root,new THREE.BoxGeometry(1.6, 0.55, 2.0),
      hidden, 3.82, 0.36, 1.88);
    this.leftCornerHit = mesh(this.root,new THREE.BoxGeometry(1.6, 0.55, 2.0),
      hidden, -3.82, 0.36, 1.88);
    this.rightCornerHit.name = 'Drag the right page edge to the left';
    this.leftCornerHit.name = 'Drag the left page edge to the right';

    for (const side of [-1, 1]) {
      const corner = mesh(this.cornerMarkers,new THREE.BoxGeometry(0.25, 0.012, 0.25),
        brass,side * 4.15,0.295,2.42);
      corner.rotation.y = Math.PI / 4;
    }
    this.root.add(this.cornerMarkers);

    this.leafGeo = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_DEPTH, 28, 18);
    this.leafGeo.translate(PAGE_WIDTH/2, 0, 0);
    this.leafGeo.rotateX(-Math.PI/2);
    this.leafBase = new Float32Array(
      (this.leafGeo.attributes.position as THREE.BufferAttribute).array);
    this.leafBackGeo = this.leafGeo.clone();
    this.leafBackGeo.setAttribute('position',this.leafGeo.attributes.position);
    this.leafBackGeo.setAttribute('normal',this.leafGeo.attributes.normal);
    const backUv=this.leafBackGeo.attributes.uv as THREE.BufferAttribute;
    for(let i=0;i<backUv.count;i++)backUv.setX(i,1-backUv.getX(i));
    backUv.needsUpdate=true;
    this.leafFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness:0.92,metalness:0.0,side:THREE.FrontSide});
    this.leafBackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness:0.92,metalness:0.0,side:THREE.BackSide});
    this.ownedMaterials.push(this.leafFrontMat,this.leafBackMat);
    this.leaf = mesh(this.root,this.leafGeo,this.leafFrontMat,0,LEAF_Y,0);
    const reverse = new THREE.Mesh(this.leafBackGeo,this.leafBackMat);
    reverse.receiveShadow=true;
    this.leaf.add(reverse);
    this.leaf.name = 'physically curling folio paper';
    this.leaf.visible = false;

    this.setCoverProgress(0);
  }

  public setCoverProgress(amount: number): void {
    this.coverProgress = clamp01(amount);
    this.coverPivot.rotation.z = -(1-this.coverProgress)*Math.PI;
    this.coverPivot.position.y = THREE.MathUtils.lerp(0.21, 0.08, this.coverProgress);
    this.closedStack.visible = this.coverProgress < 0.58;
    this.coverHit.visible = this.coverProgress < 0.1;
    this.cornerMarkers.visible = this.coverProgress > 0.99;
    this.rightCornerHit.visible = this.coverProgress > 0.99;
    this.leftCornerHit.visible = this.coverProgress > 0.99;
  }

  public setLeafTitles(front: string, frontIndex: number, back: string, backIndex: number): void {
    const frontTexture = folioPrinting(front,frontIndex);
    const backTexture = folioPrinting(back,backIndex);
    if (this.leafFrontMat.map) this.leafFrontMat.map.dispose();
    if (this.leafBackMat.map) this.leafBackMat.map.dispose();
    this.leafFrontMat.map = frontTexture;
    this.leafBackMat.map = backTexture;
    this.leafFrontMat.needsUpdate = true;
    this.leafBackMat.needsUpdate = true;
  }

  public setLeafProgress(progress: number, visible=true):void {
    this.leaf.visible = visible && this.coverProgress>0.97;
    if(!this.leaf.visible)return;
    const p=clamp01(progress);
    const positions=this.leafGeo.attributes.position as THREE.BufferAttribute;
    const bend=Math.sin(p*Math.PI);
    for(let i=0;i<positions.count;i++){
      const bx=this.leafBase[i*3], bz=this.leafBase[i*3+2];
      const u=bx/PAGE_WIDTH, v=(bz+PAGE_DEPTH/2)/PAGE_DEPTH;
      const lag=bend*(0.40*u+0.13*v);
      const angle=THREE.MathUtils.clamp(p*Math.PI-lag,0,Math.PI);
      const arch=Math.sin(u*Math.PI)*bend*0.40;
      const rest=0.045*Math.sin(u*Math.PI);
      positions.setXYZ(i,Math.cos(angle)*bx,
        Math.sin(angle)*bx+arch+rest,bz);
    }
    positions.needsUpdate=true;
    this.leafGeo.computeVertexNormals();
  }

  public dispose():void {
    this.root.traverse(obj=>{
      if(obj instanceof THREE.Mesh){
        obj.geometry.dispose();
      }
    });
    for(const material of this.ownedMaterials)material.dispose();
    for(const texture of this.ownedTextures)texture.dispose();
    this.leafFrontMat.map?.dispose();
    this.leafBackMat.map?.dispose();
    this.root.clear();
  }
}
