import * as THREE from 'three';
import { ProceduralTexturePack } from './proceduralTextures';
import { WeatherPreset } from '../types/atlas';

export const BOOK_PAGE_W = 4.2; // each half-page width
export const BOOK_PAGE_D = 5.6; // page depth (front-to-back)
export const BOOK_SPREAD_W = BOOK_PAGE_W * 2; // 8.4 total open spread width
export const BOOK_BASE_Y = 0.24; // top surface height of open pages

const _stainTmpCol = new THREE.Color();

const CHRONICLE_STAIN_GLSL_HELPERS = /* glsl */ `
uniform float uStainTime;
uniform float uStainLevel;
uniform float uStainActivity;
uniform float uStainSeed;
uniform vec3 uStainInkColor;
uniform vec3 uStainEdgeGlow;

float stainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float stainNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(stainHash(i), stainHash(i + vec2(1.0, 0.0)), u.x),
    mix(stainHash(i + vec2(0.0, 1.0)), stainHash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float stainFbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    v += amp * stainNoise(p);
    p = p * 2.07 + vec2(4.3, 2.9);
    amp *= 0.5;
  }
  return v;
}

vec3 applyChronicleStaining(vec3 baseRgb, vec2 uv, float isSingleLeaf) {
  float level = clamp(uStainLevel, 0.0, 1.0);
  if (level <= 0.005) return baseRgb;

  float edgeY = min(uv.y, 1.0 - uv.y) * 2.0;
  float perimeter;
  float spineMask;
  vec2 aspectUv;

  if (isSingleLeaf > 0.5) {
    float edgeOuter = 1.0 - uv.x;
    perimeter = min(edgeOuter * 1.45, edgeY);
    spineMask = uv.x * 2.2;
    aspectUv = vec2(uv.x * 0.75 + 0.75, uv.y);
  } else {
    float edgeX = min(uv.x, 1.0 - uv.x) * 2.0;
    perimeter = min(edgeX, edgeY);
    spineMask = abs(uv.x - 0.5) * 2.0 * 1.85;
    aspectUv = vec2(uv.x * 1.5, uv.y);
  }

  float driftSpeed = 0.10 + 0.28 * uStainActivity;
  vec2 animShift = vec2(sin(uStainTime * 0.23), cos(uStainTime * 0.19)) * (0.045 * uStainActivity);
  float fbmA = stainFbm(aspectUv * 9.5 + vec2(uStainSeed * 3.1, uStainSeed * 1.7) + animShift + uStainTime * driftSpeed * 0.05);
  float fbmB = stainFbm(aspectUv * 21.0 - vec2(uStainSeed * 2.3, uStainTime * driftSpeed * 0.08));

  // Four deterministic localized ink-bleed pockets hugging corners & outer margins per folio
  float s0 = fract(sin(uStainSeed * 12.9898 + 1.1) * 43758.5453);
  float s1 = fract(sin(uStainSeed * 78.233 + 2.7) * 43758.5453);
  float s2 = fract(sin(uStainSeed * 39.425 + 4.3) * 43758.5453);
  float s3 = fract(sin(uStainSeed * 91.117 + 6.9) * 43758.5453);

  vec2 c0 = isSingleLeaf > 0.5 ? vec2(0.71, 0.05 + s0 * 0.16) : vec2(0.05 + s0 * 0.14, 0.06 + s1 * 0.14);
  vec2 c1 = isSingleLeaf > 0.5 ? vec2(0.72, 0.94 - s1 * 0.18) : vec2(1.45 - s2 * 0.14, 0.07 + s3 * 0.16);
  vec2 c2 = isSingleLeaf > 0.5 ? vec2(0.68, 0.45 + s2 * 0.24) : vec2(0.06 + s1 * 0.18, 0.93 - s0 * 0.14);
  vec2 c3 = isSingleLeaf > 0.5 ? vec2(0.18 + s3 * 0.2, 0.06) : vec2(1.44 - s0 * 0.16, 0.92 - s2 * 0.16);

  float d0 = length(aspectUv - c0);
  float d1 = length(aspectUv - c1);
  float d2 = length(aspectUv - c2);
  float d3 = length(aspectUv - c3);
  float pocketNear = min(min(d0, d1), min(d2, d3));
  float pocketPulse = 0.024 * uStainActivity * sin(uStainTime * (1.2 + uStainActivity * 1.5) - pocketNear * 24.0 + fbmB * 4.0);
  float pocketInfluence = (1.0 - smoothstep(0.04, 0.26 + level * 0.18, pocketNear - (fbmA - 0.5) * 0.12 - pocketPulse));

  float edgePerturb = (fbmA - 0.44) * (0.09 + 0.16 * level) + (fbmB - 0.5) * 0.045;
  float creepRipple = 0.015 * uStainActivity * sin(uStainTime * 1.45 + fbmA * 9.0 - perimeter * 18.0);
  float reach = mix(0.032, 0.23, level);

  float edgeField = perimeter - edgePerturb - creepRipple;
  float spineField = spineMask - (fbmB - 0.45) * 0.085;
  float marginField = min(edgeField, spineField * 1.15);

  float marginBleed = 1.0 - smoothstep(reach * 0.12, reach, marginField);
  float combinedBleed = clamp(max(marginBleed, pocketInfluence * (0.35 + 0.65 * level)), 0.0, 1.0);

  // Watercolor capillary tide-line along the advancing wet ink front
  float frontCenter = reach * 0.86;
  float tideBand = exp(-pow((marginField - frontCenter) / max(0.014, reach * 0.22), 2.0));
  float pocketRing = exp(-pow((pocketNear - (0.14 + level * 0.14)) / 0.035, 2.0)) * (0.35 + 0.65 * uStainActivity);
  float tideLine = clamp(tideBand * (0.45 + 0.55 * uStainActivity) + pocketRing, 0.0, 1.0);

  // Translucent rag-paper pigment absorption keeping underlying ink & map lines visible
  float stainAlpha = combinedBleed * (0.30 + 0.48 * level) * (0.82 + 0.18 * fbmB);
  vec3 absorbed = mix(baseRgb, baseRgb * (0.44 + uStainInkColor * 1.15) + uStainInkColor * 0.18, stainAlpha);
  vec3 withTide = mix(absorbed, absorbed * (0.62 + uStainEdgeGlow * 0.72), tideLine * (0.28 + 0.42 * level));
  return withTide;
}
`;

export class BookAndDeskRig {
  public readonly root = new THREE.Group();
  public readonly bookGroup = new THREE.Group();

  // Hinged left wing for closed->open book animation
  private leftCoverPivot = new THREE.Group();
  private spineGroup = new THREE.Group();
  private claspLatch = new THREE.Group();
  public readonly claspHitMesh: THREE.Mesh;

  // Spread surface planes (for world parchment + magnifier shader uniforms)
  private spreadMat: THREE.MeshStandardMaterial;
  public readonly spreadMesh: THREE.Mesh;

  // Animated physical page-turning leaf (double-sided recto + verso)
  private turningLeafGeo: THREE.PlaneGeometry;
  private turningLeafBackGeo: THREE.PlaneGeometry;
  private turningLeafBasePos: Float32Array;
  private turningLeafMat: THREE.MeshStandardMaterial;
  private turningLeafBackMat: THREE.MeshStandardMaterial;
  public readonly turningLeafMesh: THREE.Mesh;

  // Corner drag hitboxes for physical page turning
  public readonly cornerRightHit: THREE.Mesh;
  public readonly cornerLeftHit: THREE.Mesh;

  // Interactive Atelier Desk Props
  public readonly deskInteractables: THREE.Object3D[] = [];
  private deskMagnifierGroup!: THREE.Group;
  private quillPivot!: THREE.Group;
  private stampGroup!: THREE.Group;
  private pageStampGroup!: THREE.Group;
  private quillDipAnim = 0;
  private stampPressAnim = 0;
  private deskPropsStamped = false;
  private deskPropsCandleLit = true;
  private deskPropsMagOnDesk = true;

  // Candle flame & flickering light
  private candleFlame: THREE.Mesh;
  private candleLight: THREE.PointLight;
  private magnifierUniforms = {
    uMagActive: { value: 0.0 },
    uMagCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uMagRadius: { value: 0.13 },
    uSecretTex: { value: null as THREE.Texture | null },
  };

  // Animated portal aperture wave & parchment dimple shader on the spread surface
  private portalRingMesh: THREE.Mesh;
  private portalRingMat: THREE.MeshBasicMaterial;
  private spreadPortalUniforms = {
    uSpreadPortalMorph: { value: 0.0 },
    uSpreadPortalUv: { value: new THREE.Vector2(0.5, 0.5) },
    uSpreadPortalColor: { value: new THREE.Color(0xf0c96a) },
  };

  // Chronicle Staining: localized animated edge ink-bleed uniforms shared across spread & turning leaf
  private chronicleStainUniforms = {
    uStainTime: { value: 0.0 },
    uStainLevel: { value: 0.12 },
    uStainActivity: { value: 0.18 },
    uStainSeed: { value: 0.0 },
    uStainInkColor: { value: new THREE.Color(0x3a2a1d) },
    uStainEdgeGlow: { value: new THREE.Color(0x5b3f28) },
  };

  private openAmount = 0; // 0 = closed, 1 = open flat
  private currentCornerLift = 0;

  constructor(private textures: ProceduralTexturePack) {
    this.buildDeskAndProps();

    // Candle light & flame
    const { flame, light } = this.buildCandle(5.35, -2.55);
    this.candleFlame = flame;
    this.candleLight = light;

    // Book assembly
    this.bookGroup.position.set(0, 0, 0);
    this.root.add(this.bookGroup);

    const coverMat = new THREE.MeshStandardMaterial({
      map: textures.leatherColor,
      bumpMap: textures.leatherBump,
      bumpScale: 0.025,
      roughness: 0.62,
      metalness: 0.05,
    });

    const frontCoverMat = new THREE.MeshPhysicalMaterial({
      map: textures.coverFrontColor,
      bumpMap: textures.coverFrontBump,
      bumpScale: 0.036,
      metalnessMap: textures.coverFrontMetalness,
      metalness: 0.95,
      roughnessMap: textures.coverFrontRoughness,
      roughness: 0.85,
      clearcoat: 0.34,
      clearcoatRoughness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd9b36c,
      roughness: 0.24,
      metalness: 0.9,
    });

    const darkBrassMat = new THREE.MeshStandardMaterial({
      color: 0x9b793e,
      roughness: 0.36,
      metalness: 0.85,
    });

    const jewelMat = new THREE.MeshPhysicalMaterial({
      color: 0xa82824,
      roughness: 0.14,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: 0x4b110d,
      emissiveIntensity: 0.55,
    });

    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: textures.pageEdgeColor,
      roughness: 0.84,
      metalness: 0.04,
    });

    const boardThickness = 0.09;
    const boardWidth = BOOK_PAGE_W + 0.38;
    const boardDepth = BOOK_PAGE_D + 0.44;
    const stackThickness = 0.14;

    // Book contact shadow on desk
    const bookShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(BOOK_SPREAD_W + 1.8, BOOK_PAGE_D + 1.8),
      new THREE.MeshBasicMaterial({
        map: textures.contactShadow,
        transparent: true,
        opacity: 0.64,
        depthWrite: false,
      }),
    );
    bookShadow.rotation.x = -Math.PI / 2;
    bookShadow.position.y = 0.005;
    this.bookGroup.add(bookShadow);

    // Back / Right board (remains resting flush on desk Y = 0..0.09)
    const rightBoard = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth, boardThickness, boardDepth),
      coverMat,
    );
    rightBoard.position.set(boardWidth / 2, boardThickness / 2, 0);
    rightBoard.castShadow = true;
    rightBoard.receiveShadow = true;
    this.bookGroup.add(rightBoard);

    // Right page block (Y = 0.09..0.23, slightly recessed within board overhang)
    const rightStack = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_PAGE_W, stackThickness, BOOK_PAGE_D),
      pageEdgeMat,
    );
    rightStack.position.set(BOOK_PAGE_W / 2 + 0.02, boardThickness + stackThickness / 2, 0);
    rightStack.castShadow = true;
    rightStack.receiveShadow = true;
    this.bookGroup.add(rightStack);

    // Rounded leather spine with raised hubs & gold-tooled bands (wraps Y = 0..0.46 when closed)
    this.spineGroup.position.set(0, 0.23, 0);
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, boardDepth, 20, 1, false, 0, Math.PI),
      coverMat,
    );
    spine.rotation.x = Math.PI / 2;
    spine.rotation.z = Math.PI;
    spine.castShadow = true;
    spine.receiveShadow = true;
    this.spineGroup.add(spine);

    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.235, 0.024, 8, 18, Math.PI),
        brassMat,
      );
      rib.rotation.x = Math.PI / 2;
      rib.rotation.y = Math.PI / 2;
      rib.position.set(0, 0, i * 1.15);
      this.spineGroup.add(rib);
    }
    this.bookGroup.add(this.spineGroup);

    // Left cover wing (hinges from closed at angle=-PI, pivotY=0.37 -> open at angle=0, pivotY=0.09)
    this.leftCoverPivot.position.set(0, 0.37, 0);
    this.bookGroup.add(this.leftCoverPivot);

    const leftBoard = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth, boardThickness, boardDepth),
      coverMat,
    );
    leftBoard.position.set(-boardWidth / 2, -boardThickness / 2, 0);
    leftBoard.castShadow = true;
    leftBoard.receiveShadow = true;
    this.leftCoverPivot.add(leftBoard);

    // Correctly oriented un-mirrored embossed leather & 24k gold-leaf front cover plate
    const plateWidth = boardWidth - 0.1;
    const plateDepth = boardDepth - 0.1;
    const frontCoverPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(plateWidth, plateDepth),
      frontCoverMat,
    );
    // Oriented via explicit orthonormal basis: Plane +X->local -X (World +X right), +Y->local -Z (World -Z top), Normal +Z->local -Y (World +Y up when closed)
    const coverBasis = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, -1, 0),
    );
    frontCoverPlate.quaternion.setFromRotationMatrix(coverBasis);
    frontCoverPlate.position.set(-boardWidth / 2, -boardThickness - 0.002, 0);
    frontCoverPlate.receiveShadow = true;
    this.leftCoverPivot.add(frontCoverPlate);

    // Four sculpted L-shaped brass corner protectors with corner bosses & rivet studs
    const cornerSpecs: [number, number, number, number][] = [
      [-boardWidth, -boardDepth / 2, 1, 1], // closed: top-right (fore-edge north)
      [-boardWidth, boardDepth / 2, 1, -1], // closed: bottom-right (fore-edge south)
      [0, -boardDepth / 2, -1, 1],          // closed: top-left (spine north)
      [0, boardDepth / 2, -1, -1],          // closed: bottom-left (spine south)
    ];
    const cornerArmXGeo = new THREE.BoxGeometry(0.62, boardThickness + 0.028, 0.11);
    const cornerArmZGeo = new THREE.BoxGeometry(0.11, boardThickness + 0.028, 0.62);
    const cornerPlateGeo = new THREE.BoxGeometry(0.32, boardThickness + 0.026, 0.32);
    const rivetGeo = new THREE.SphereGeometry(0.024, 10, 8);

    cornerSpecs.forEach(([cx, cz, sx, sz]) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(cx, -boardThickness / 2, cz);

      const armX = new THREE.Mesh(cornerArmXGeo, brassMat);
      armX.position.set(sx * 0.28, -0.004, sz * 0.03);
      armX.castShadow = true;

      const armZ = new THREE.Mesh(cornerArmZGeo, brassMat);
      armZ.position.set(sx * 0.03, -0.004, sz * 0.28);
      armZ.castShadow = true;

      const gusset = new THREE.Mesh(cornerPlateGeo, darkBrassMat);
      gusset.position.set(sx * 0.14, -0.003, sz * 0.14);

      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), brassMat);
      boss.scale.set(1, 0.48, 1);
      boss.position.set(sx * 0.16, -boardThickness / 2 - 0.015, sz * 0.16);

      const rivA = new THREE.Mesh(rivetGeo, brassMat);
      rivA.position.set(sx * 0.5, -boardThickness / 2 - 0.014, sz * 0.04);
      const rivB = new THREE.Mesh(rivetGeo, brassMat);
      rivB.position.set(sx * 0.04, -boardThickness / 2 - 0.014, sz * 0.5);

      cGroup.add(gusset, armX, armZ, boss, rivA, rivB);
      this.leftCoverPivot.add(cGroup);
    });

    // Raised 3D Brass Meridian Medallion & Cabochon Jewel aligned with cover astrolabe (canvas cy=700/1400 -> z=0)
    const medallionGroup = new THREE.Group();
    medallionGroup.position.set(-boardWidth / 2, -boardThickness - 0.004, 0);

    const outerBezel = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.036, 12, 36), brassMat);
    outerBezel.rotation.x = Math.PI / 2;
    outerBezel.castShadow = true;

    const innerBezel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.026, 10, 28), brassMat);
    innerBezel.rotation.x = Math.PI / 2;
    innerBezel.position.y = -0.008;

    const colletRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.23, 0.042, 16),
      darkBrassMat,
    );
    colletRing.position.y = -0.018;

    const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), jewelMat);
    centerGem.scale.set(1, 0.55, 1);
    centerGem.position.y = -0.036;

    medallionGroup.add(outerBezel, innerBezel, colletRing, centerGem);

    // 8 raised brass compass rays inside the central medallion
    const rayGeo = new THREE.BoxGeometry(0.048, 0.022, 0.44);
    for (let r = 0; r < 4; r++) {
      const ray = new THREE.Mesh(rayGeo, brassMat);
      ray.rotation.y = (r * Math.PI) / 4;
      ray.position.y = -0.012;
      medallionGroup.add(ray);
    }
    this.leftCoverPivot.add(medallionGroup);

    // Left page stack (Y = 0..0.14 local -> rests atop rightStack when closed, desk when open)
    const leftStack = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_PAGE_W, stackThickness, BOOK_PAGE_D),
      pageEdgeMat,
    );
    leftStack.position.set(-BOOK_PAGE_W / 2 - 0.02, stackThickness / 2, 0);
    leftStack.castShadow = true;
    leftStack.receiveShadow = true;
    this.leftCoverPivot.add(leftStack);

    // Hinged leather-and-brass clasp strap wrapping the outer fore-edge when closed
    this.claspLatch.position.set(-boardWidth - 0.01, -boardThickness / 2, 0);
    const strapHinge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.52), brassMat);
    strapHinge.position.set(0.12, -0.048, 0);

    const strapLeather = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.44), coverMat);
    strapLeather.position.set(-0.02, 0.14, 0);

    const hasp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.56), brassMat);
    hasp.position.set(-0.04, 0.15, 0);
    hasp.castShadow = true;

    const claspGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 1), jewelMat);
    claspGem.scale.set(0.65, 1.0, 1.0);
    claspGem.position.set(-0.09, 0.15, 0);

    this.claspLatch.add(strapHinge, strapLeather, hasp, claspGem);
    this.leftCoverPivot.add(this.claspLatch);

    // Invisible larger hit volume for easy clicking anywhere on the closed book/clasp
    this.claspHitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + 0.5, 0.72, boardDepth + 0.5),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.claspHitMesh.position.set(-boardWidth / 2, -0.05, 0);
    this.claspHitMesh.userData = { interactionType: 'openBook' };
    this.leftCoverPivot.add(this.claspHitMesh);

    // Active open spread parchment surface with Secret Ink Magnifier shader injection
    this.magnifierUniforms.uSecretTex.value = textures.worldSecretInk[0];
    this.spreadMat = new THREE.MeshStandardMaterial({
      map: textures.worldParchment[0],
      bumpMap: textures.paperGrainBump,
      bumpScale: 0.008,
      roughness: 0.88,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.spreadMat.customProgramCacheKey = () => 'spread-magnifier-portal-stain-v2';
    this.spreadMat.onBeforeCompile = (shader) => {
      shader.uniforms.uMagActive = this.magnifierUniforms.uMagActive;
      shader.uniforms.uMagCenter = this.magnifierUniforms.uMagCenter;
      shader.uniforms.uMagRadius = this.magnifierUniforms.uMagRadius;
      shader.uniforms.uSecretTex = this.magnifierUniforms.uSecretTex;
      shader.uniforms.uSpreadPortalMorph = this.spreadPortalUniforms.uSpreadPortalMorph;
      shader.uniforms.uSpreadPortalUv = this.spreadPortalUniforms.uSpreadPortalUv;
      shader.uniforms.uSpreadPortalColor = this.spreadPortalUniforms.uSpreadPortalColor;
      shader.uniforms.uStainTime = this.chronicleStainUniforms.uStainTime;
      shader.uniforms.uStainLevel = this.chronicleStainUniforms.uStainLevel;
      shader.uniforms.uStainActivity = this.chronicleStainUniforms.uStainActivity;
      shader.uniforms.uStainSeed = this.chronicleStainUniforms.uStainSeed;
      shader.uniforms.uStainInkColor = this.chronicleStainUniforms.uStainInkColor;
      shader.uniforms.uStainEdgeGlow = this.chronicleStainUniforms.uStainEdgeGlow;

      shader.vertexShader =
        `
        uniform float uSpreadPortalMorph;
        uniform vec2 uSpreadPortalUv;
        varying float vPortalWave;
        ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vPortalWave = 0.0;
        if (uSpreadPortalMorph > 0.001) {
          vec2 pDelta = uv - uSpreadPortalUv;
          pDelta.x *= 1.5;
          float pDist = length(pDelta);
          float well = exp(-pDist * pDist * 16.0);
          float crest = exp(-pow((pDist - (1.0 - uSpreadPortalMorph) * 0.55) * 7.5, 2.0));
          transformed.z -= well * 0.24 * uSpreadPortalMorph;
          transformed.z += crest * 0.08 * uSpreadPortalMorph;
          vPortalWave = clamp(well * 0.85 + crest * 0.7, 0.0, 1.0) * uSpreadPortalMorph;
        }
        `,
      );

      shader.fragmentShader =
        `
        uniform float uMagActive;
        uniform vec2 uMagCenter;
        uniform float uMagRadius;
        uniform sampler2D uSecretTex;
        uniform vec3 uSpreadPortalColor;
        varying float vPortalWave;
        ` +
        CHRONICLE_STAIN_GLSL_HELPERS +
        shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        diffuseColor.rgb = applyChronicleStaining(diffuseColor.rgb, vMapUv, 0.0);
        if (uMagActive > 0.01) {
          vec2 d = vMapUv - uMagCenter;
          d.x *= 1.5; // compensate 8.4:5.6 spread aspect ratio
          float dist = length(d);
          float innerMask = 1.0 - smoothstep(uMagRadius * 0.78, uMagRadius, dist);
          vec4 secretSample = texture2D(uSecretTex, vMapUv);
          vec3 glowInk = mix(diffuseColor.rgb * 0.72, vec3(0.95, 0.82, 0.45), secretSample.a);
          diffuseColor.rgb = mix(diffuseColor.rgb, glowInk, innerMask * uMagActive * 0.92);
        }
        if (vPortalWave > 0.005) {
          diffuseColor.rgb = mix(diffuseColor.rgb, uSpreadPortalColor * 1.25, vPortalWave * 0.65);
        }
        `,
      );
    };

    this.spreadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(BOOK_SPREAD_W, BOOK_PAGE_D, 36, 24),
      this.spreadMat,
    );
    this.spreadMesh.rotation.x = -Math.PI / 2;
    this.spreadMesh.position.set(0, BOOK_BASE_Y, 0);
    this.spreadMesh.receiveShadow = true;
    this.spreadMesh.visible = false;
    this.bookGroup.add(this.spreadMesh);

    // Physical animated turning page leaf (hinged along spine X=0)
    this.turningLeafGeo = new THREE.PlaneGeometry(BOOK_PAGE_W, BOOK_PAGE_D, 28, 18);
    this.turningLeafGeo.translate(BOOK_PAGE_W / 2, 0, 0); // pivot at left edge X=0
    this.turningLeafGeo.rotateX(-Math.PI / 2);
    this.turningLeafBasePos = new Float32Array(
      (this.turningLeafGeo.attributes.position as THREE.BufferAttribute).array,
    );

    const configureLeafShader = (mat: THREE.MeshStandardMaterial) => {
      mat.customProgramCacheKey = () => 'leaf-stain-v1';
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uStainTime = this.chronicleStainUniforms.uStainTime;
        shader.uniforms.uStainLevel = this.chronicleStainUniforms.uStainLevel;
        shader.uniforms.uStainActivity = this.chronicleStainUniforms.uStainActivity;
        shader.uniforms.uStainSeed = this.chronicleStainUniforms.uStainSeed;
        shader.uniforms.uStainInkColor = this.chronicleStainUniforms.uStainInkColor;
        shader.uniforms.uStainEdgeGlow = this.chronicleStainUniforms.uStainEdgeGlow;

        shader.fragmentShader = CHRONICLE_STAIN_GLSL_HELPERS + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          #include <map_fragment>
          diffuseColor.rgb = applyChronicleStaining(diffuseColor.rgb, vMapUv, 1.0);
          `,
        );
      };
    };

    this.turningLeafMat = new THREE.MeshStandardMaterial({
      map: textures.worldParchment[0],
      bumpMap: textures.paperGrainBump,
      bumpScale: 0.008,
      roughness: 0.86,
      metalness: 0.03,
      side: THREE.FrontSide,
    });
    configureLeafShader(this.turningLeafMat);

    // Verso (underside of the turning sheet): shares deformed position/normal attributes cleanly with mirrored U.x
    this.turningLeafBackGeo = this.turningLeafGeo.clone();
    this.turningLeafBackGeo.setAttribute('position', this.turningLeafGeo.attributes.position);
    this.turningLeafBackGeo.setAttribute('normal', this.turningLeafGeo.attributes.normal);
    const backUvAttr = this.turningLeafBackGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < backUvAttr.count; i++) {
      backUvAttr.setX(i, 1.0 - backUvAttr.getX(i));
    }
    backUvAttr.needsUpdate = true;

    this.turningLeafBackMat = new THREE.MeshStandardMaterial({
      map: textures.worldParchment[1] ?? textures.worldParchment[0],
      bumpMap: textures.paperGrainBump,
      bumpScale: 0.008,
      roughness: 0.86,
      metalness: 0.03,
      side: THREE.BackSide,
    });
    configureLeafShader(this.turningLeafBackMat);

    this.turningLeafMesh = new THREE.Mesh(this.turningLeafGeo, this.turningLeafMat);
    this.turningLeafMesh.position.set(0, BOOK_BASE_Y + 0.012, 0);
    this.turningLeafMesh.castShadow = true;
    this.turningLeafMesh.receiveShadow = true;
    this.turningLeafMesh.visible = false;

    const turningLeafBackMesh = new THREE.Mesh(this.turningLeafBackGeo, this.turningLeafBackMat);
    turningLeafBackMesh.receiveShadow = true;
    this.turningLeafMesh.add(turningLeafBackMesh);

    this.bookGroup.add(this.turningLeafMesh);

    // Persistent 3D Crimson Wax Meridian Seal impressed on active folio's bottom-right corner
    this.pageStampGroup = new THREE.Group();
    this.pageStampGroup.position.set(3.55, BOOK_BASE_Y + 0.014, 2.25);
    const waxDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.23, 0.024, 16),
      new THREE.MeshStandardMaterial({
        color: 0x9b241f,
        roughness: 0.34,
        metalness: 0.08,
      }),
    );
    waxDisc.position.y = 0.012;
    waxDisc.castShadow = true;
    const waxRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.014, 8, 20),
      new THREE.MeshStandardMaterial({
        color: 0xb63830,
        roughness: 0.3,
        metalness: 0.18,
      }),
    );
    waxRim.rotation.x = Math.PI / 2;
    waxRim.position.y = 0.025;
    const waxStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06, 0),
      brassMat,
    );
    waxStar.scale.set(1, 0.32, 1);
    waxStar.position.y = 0.026;
    this.pageStampGroup.add(waxDisc, waxRim, waxStar);
    this.pageStampGroup.visible = false;
    this.bookGroup.add(this.pageStampGroup);

    // Page corner drag/click targets (bottom-right & bottom-left)
    const cornerHitGeo = new THREE.BoxGeometry(1.05, 0.25, 1.05);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.cornerRightHit = new THREE.Mesh(cornerHitGeo, hitMat);
    this.cornerRightHit.position.set(BOOK_PAGE_W - 0.52, BOOK_BASE_Y + 0.06, BOOK_PAGE_D / 2 - 0.52);
    this.cornerRightHit.userData = { interactionType: 'pageCorner', direction: 1, label: 'Next Folio Corner', category: 'Binding', hint: 'Click or drag to turn page forward' };

    this.cornerLeftHit = new THREE.Mesh(cornerHitGeo, hitMat);
    this.cornerLeftHit.position.set(-BOOK_PAGE_W + 0.52, BOOK_BASE_Y + 0.06, BOOK_PAGE_D / 2 - 0.52);
    this.cornerLeftHit.userData = { interactionType: 'pageCorner', direction: -1, label: 'Previous Folio Corner', category: 'Binding', hint: 'Click or drag to turn page backward' };

    this.bookGroup.add(this.cornerRightHit, this.cornerLeftHit);

    // Gilded portal aperture shockwave ring flush on open spread
    this.portalRingMat = new THREE.MeshBasicMaterial({
      color: 0xf0c96a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.portalRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.56, 36),
      this.portalRingMat,
    );
    this.portalRingMesh.rotation.x = -Math.PI / 2;
    this.portalRingMesh.position.set(0, BOOK_BASE_Y + 0.025, 0);
    this.portalRingMesh.visible = false;
    this.bookGroup.add(this.portalRingMesh);

    // Start closed
    this.setBookOpenProgress(0);
  }

  private buildDeskAndProps(): void {
    // Rich Walnut Atelier Desk
    const deskGeo = new THREE.PlaneGeometry(46, 36);
    const deskMat = new THREE.MeshStandardMaterial({
      map: this.textures.walnutColor,
      bumpMap: this.textures.walnutBump,
      bumpScale: 0.018,
      roughness: 0.62,
      metalness: 0.05,
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    this.root.add(desk);

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xcfa55c,
      roughness: 0.28,
      metalness: 0.88,
    });
    const inkGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e2b36,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
    });

    // Inkwell + Feather Quill (top-left of desk)
    const inkGroup = new THREE.Group();
    inkGroup.position.set(-5.4, 0, -2.1);

    const inkBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, 0.26, 8),
      inkGlassMat,
    );
    inkBase.position.y = 0.13;
    inkBase.castShadow = true;

    const inkCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 12), brassMat);
    inkCollar.position.y = 0.29;

    // Feather quill
    this.quillPivot = new THREE.Group();
    const quillCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.25, 0),
      new THREE.Vector3(-0.18, 0.85, -0.1),
      new THREE.Vector3(-0.42, 1.45, -0.22),
    ]);
    const quillShaft = new THREE.Mesh(
      new THREE.TubeGeometry(quillCurve, 12, 0.016, 6, false),
      new THREE.MeshStandardMaterial({ color: 0xeadfc8, roughness: 0.5 }),
    );
    const quillVane = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.85, 4),
      new THREE.MeshStandardMaterial({ color: 0xf0e7d4, roughness: 0.72 }),
    );
    quillVane.position.set(-0.28, 1.12, -0.15);
    quillVane.rotation.set(-0.18, 0, 0.35);
    quillVane.scale.set(0.35, 1, 1.1);
    this.quillPivot.add(quillShaft, quillVane);
    inkGroup.add(inkBase, inkCollar, this.quillPivot);

    const quillHit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 1.5, 10),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    quillHit.position.set(-0.1, 0.75, -0.05);
    quillHit.userData = {
      interactionType: 'deskQuill',
      label: 'Inkwell & Feather Quill',
      category: 'Atelier Tool',
      hint: 'Click to blot excess ink stain on active folio',
    };
    inkGroup.add(quillHit);
    this.deskInteractables.push(quillHit);
    this.root.add(inkGroup);

    // Brass Drafting Compass Dividers (bottom-left of desk)
    const dividers = new THREE.Group();
    dividers.position.set(-5.3, 0.03, 1.8);
    dividers.rotation.y = 0.42;
    const legGeo = new THREE.CylinderGeometry(0.028, 0.008, 1.45, 8);
    const legA = new THREE.Mesh(legGeo, brassMat);
    legA.rotation.x = Math.PI / 2;
    legA.rotation.z = 0.18;
    legA.position.set(-0.14, 0.02, 0);
    const legB = new THREE.Mesh(legGeo, brassMat);
    legB.rotation.x = Math.PI / 2;
    legB.rotation.z = -0.18;
    legB.position.set(0.14, 0.02, 0);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), brassMat);
    hinge.position.set(0, 0.03, -0.68);
    const dividersHit = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.32, 1.7),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    dividersHit.position.set(0, 0.14, -0.1);
    dividersHit.userData = {
      interactionType: 'deskDividers',
      label: 'Brass Drafting Dividers',
      category: 'Atelier Tool',
      hint: 'Click to toggle Desk Inspection / Diorama view',
    };
    dividers.add(legA, legB, hinge, dividersHit);
    this.deskInteractables.push(dividersHit);
    this.root.add(dividers);

    // Crimson Wax Seal Stamp (bottom-right of desk)
    this.stampGroup = new THREE.Group();
    this.stampGroup.position.set(5.45, 0, 2.0);
    const stampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.14, 16), brassMat);
    stampHead.position.y = 0.07;
    const stampHandle = new THREE.Mesh(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.06, 0.14),
          new THREE.Vector2(0.05, 0.35),
          new THREE.Vector2(0.14, 0.62),
          new THREE.Vector2(0.11, 0.85),
          new THREE.Vector2(0.0, 0.92),
        ],
        14,
      ),
      new THREE.MeshStandardMaterial({ color: 0x5c1f1a, roughness: 0.42, metalness: 0.08 }),
    );
    const stampHit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 1.05, 10),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    stampHit.position.y = 0.5;
    stampHit.userData = {
      interactionType: 'deskStamp',
      label: 'Meridian Wax Seal Stamp',
      category: 'Atelier Tool',
      hint: 'Click to stamp crimson seal onto folio margin',
    };
    this.stampGroup.add(stampHead, stampHandle, stampHit);
    this.deskInteractables.push(stampHit);
    this.root.add(this.stampGroup);

    // Resting Brass Magnifying Glass on right walnut desk (hidden when active tool = magnifier)
    this.deskMagnifierGroup = new THREE.Group();
    this.deskMagnifierGroup.position.set(5.35, 0.045, 0.15);
    this.deskMagnifierGroup.rotation.y = -0.35;
    const magBezel = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.036, 10, 28), brassMat);
    magBezel.rotation.x = Math.PI / 2;
    magBezel.castShadow = true;
    const magGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.02, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xfff5d8,
        roughness: 0.06,
        transparent: true,
        opacity: 0.32,
        clearcoat: 1.0,
      }),
    );
    const magHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.052, 0.68, 10),
      new THREE.MeshStandardMaterial({ color: 0x4b2416, roughness: 0.42 }),
    );
    magHandle.rotation.x = Math.PI / 2;
    magHandle.position.set(0, 0, 0.82);
    magHandle.castShadow = true;
    const magHit = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.32, 1.65),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    magHit.position.set(0, 0.12, 0.42);
    magHit.userData = {
      interactionType: 'deskMagnifier',
      label: 'Brass Magnifier Lens',
      category: 'Atelier Tool',
      hint: 'Click to equip Magnifier and scan for secret ink',
    };
    this.deskMagnifierGroup.add(magBezel, magGlass, magHandle, magHit);
    this.deskInteractables.push(magHit);
    this.root.add(this.deskMagnifierGroup);
  }

  private buildCandle(x: number, z: number): { flame: THREE.Mesh; light: THREE.PointLight } {
    const candleGroup = new THREE.Group();
    candleGroup.position.set(x, 0, z);

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af6e,
      roughness: 0.28,
      metalness: 0.88,
    });

    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 0.08, 18), brassMat);
    saucer.position.y = 0.04;
    saucer.receiveShadow = true;

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.22, 14), brassMat);
    stem.position.y = 0.16;

    const wax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.95, 16),
      new THREE.MeshStandardMaterial({
        color: 0xf4e8ce,
        roughness: 0.58,
        emissive: 0x3b220a,
        emissiveIntensity: 0.45,
      }),
    );
    wax.position.y = 0.72;
    wax.castShadow = true;

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.24, 10),
      new THREE.MeshBasicMaterial({ color: 0xffcf6e }),
    );
    flame.position.y = 1.32;

    const light = new THREE.PointLight(0xffa44c, 2.8, 15, 1.8);
    light.position.set(0, 1.48, 0);

    const candleHit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.52, 1.55, 10),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    candleHit.position.y = 0.78;
    candleHit.userData = {
      interactionType: 'deskCandle',
      label: 'Atelier Tallow Candle',
      category: 'Atelier Prop',
      hint: 'Click to snuff or relight candle',
    };
    this.deskInteractables.push(candleHit);

    candleGroup.add(saucer, stem, wax, flame, light, candleHit);
    this.root.add(candleGroup);

    return { flame, light };
  }

  public setBookOpenProgress(progress: number): void {
    this.openAmount = Math.max(0, Math.min(1, progress));
    // Closed: left wing folded onto right wing (rotation.z = -PI, pivotY = 0.37) so front board sits atop full page stack
    // Open: left wing rests flat on desk (rotation.z = 0, pivotY = 0.09)
    const angle = (1 - this.openAmount) * -Math.PI;
    this.leftCoverPivot.rotation.z = angle;
    this.leftCoverPivot.position.y = THREE.MathUtils.lerp(0.37, 0.09, this.openAmount);

    // Spine smoothly lowers & tucks neatly beneath the crease when open
    this.spineGroup.position.y = THREE.MathUtils.lerp(0.23, 0.04, this.openAmount);
    this.spineGroup.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.62, this.openAmount));

    // Center the closed book at X~0 when closed, or centered spread when open
    this.bookGroup.position.x = (1 - this.openAmount) * -(BOOK_PAGE_W / 2 + 0.18);

    // Clasp unhooks outward & folds flat cleanly as the cover opens
    this.claspLatch.rotation.z = Math.min(1, this.openAmount * 3.5) * 0.85;

    this.spreadMesh.visible = this.openAmount > 0.82;
    this.claspHitMesh.visible = this.openAmount < 0.25;
    this.pageStampGroup.visible = this.deskPropsStamped && this.openAmount > 0.85;
  }

  public setDeskPropStates(opts: {
    magnifierOnDesk: boolean;
    stamped: boolean;
    candleLit: boolean;
  }): void {
    this.deskPropsMagOnDesk = opts.magnifierOnDesk;
    this.deskPropsStamped = opts.stamped;
    this.deskPropsCandleLit = opts.candleLit;
    this.deskMagnifierGroup.visible = this.deskPropsMagOnDesk;
    this.pageStampGroup.visible = this.deskPropsStamped && this.openAmount > 0.85;
  }

  public triggerQuillDip(): void {
    this.quillDipAnim = 1.0;
  }

  public triggerStampPress(): void {
    this.stampPressAnim = 1.0;
  }

  public setActiveWorldSpread(worldId: number): void {
    const idx = Math.max(0, Math.min(this.textures.worldParchment.length - 1, worldId));
    this.spreadMat.map = this.textures.worldParchment[idx];
    this.spreadMat.needsUpdate = true;
    this.magnifierUniforms.uSecretTex.value = this.textures.worldSecretInk[idx];
  }

  public setMagnifierState(active: boolean, worldX: number, worldZ: number): void {
    this.magnifierUniforms.uMagActive.value = active ? 1.0 : 0.0;
    const u = (worldX + BOOK_SPREAD_W / 2) / BOOK_SPREAD_W;
    const v = 1.0 - (worldZ + BOOK_PAGE_D / 2) / BOOK_PAGE_D;
    this.magnifierUniforms.uMagCenter.value.set(u, v);
  }

  public updatePortalRing(
    active: boolean,
    progress: number,
    worldX: number,
    worldZ: number,
    accentHex: string,
  ): void {
    const wave = active ? Math.sin(progress * Math.PI) : 0;
    this.spreadPortalUniforms.uSpreadPortalMorph.value = active && this.openAmount > 0.85 ? wave : 0;
    const u = (worldX + BOOK_SPREAD_W / 2) / BOOK_SPREAD_W;
    const v = 1.0 - (worldZ + BOOK_PAGE_D / 2) / BOOK_PAGE_D;
    this.spreadPortalUniforms.uSpreadPortalUv.value.set(u, v);
    this.spreadPortalUniforms.uSpreadPortalColor.value.set(accentHex);

    this.portalRingMesh.visible = active && this.openAmount > 0.85;
    if (!this.portalRingMesh.visible) return;
    const scale = 0.8 + wave * 6.2;
    this.portalRingMesh.position.set(worldX, BOOK_BASE_Y + 0.025, worldZ);
    this.portalRingMesh.scale.setScalar(scale);
    this.portalRingMat.color.set(accentHex);
    this.portalRingMat.opacity = wave * 0.72;
  }

  public updateChronicleStain(
    elapsed: number,
    stainLevel: number,
    weather: WeatherPreset,
    worldId: number,
    accentHex: string,
  ): void {
    const u = this.chronicleStainUniforms;
    u.uStainTime.value = elapsed;
    u.uStainLevel.value = THREE.MathUtils.clamp(stainLevel, 0, 1);
    u.uStainSeed.value = worldId + 1;

    const targetActivity =
      weather === 'thunderstorm'
        ? 1.0
        : weather === 'rain'
          ? 0.88
          : weather === 'mist'
            ? 0.65
            : weather === 'overcast'
              ? 0.42
              : weather === 'windy'
                ? 0.36
                : 0.16;
    u.uStainActivity.value += (targetActivity - u.uStainActivity.value) * 0.12;

    // Weather-driven iron-gall / sepia ink tones blended subtly with chapter pigment
    const baseHex =
      weather === 'thunderstorm'
        ? 0x1a1e2e
        : weather === 'rain'
          ? 0x222534
          : weather === 'mist'
            ? 0x283238
            : weather === 'windy'
              ? 0x3f2d1d
              : 0x3a291b;
    const glowHex =
      weather === 'thunderstorm' || weather === 'rain'
        ? 0x3b4863
        : weather === 'mist'
          ? 0x4b5c63
          : 0x6b4b2e;

    u.uStainInkColor.value.setHex(baseHex).lerp(_stainTmpCol.set(accentHex), 0.22);
    u.uStainEdgeGlow.value.setHex(glowHex).lerp(_stainTmpCol, 0.18);
  }

  /**
   * Deforms the double-sided physical turning leaf along a curved parabolic page-turn arc.
   * Front face carries worldTextureIndex; back verso carries backWorldTextureIndex.
   */
  public updateTurningLeaf(
    active: boolean,
    progress: number,
    cornerLift: number,
    elapsed: number,
    weather: WeatherPreset,
    worldTextureIndex: number,
    backWorldTextureIndex = worldTextureIndex,
  ): void {
    this.currentCornerLift += (cornerLift - this.currentCornerLift) * 0.16;

    const showLeaf = active || this.currentCornerLift > 0.01;
    this.turningLeafMesh.visible = showLeaf && this.openAmount > 0.9;
    if (!this.turningLeafMesh.visible) return;

    const count = this.textures.worldParchment.length;
    const frontIdx = Math.max(0, Math.min(count - 1, worldTextureIndex));
    const backIdx = Math.max(0, Math.min(count - 1, backWorldTextureIndex));

    const frontTex = this.textures.worldParchment[frontIdx];
    if (this.turningLeafMat.map !== frontTex) {
      this.turningLeafMat.map = frontTex;
      this.turningLeafMat.needsUpdate = true;
    }

    const backTex = this.textures.worldParchment[backIdx];
    if (this.turningLeafBackMat.map !== backTex) {
      this.turningLeafBackMat.map = backTex;
      this.turningLeafBackMat.needsUpdate = true;
    }

    const posAttr = this.turningLeafGeo.attributes.position as THREE.BufferAttribute;
    const base = this.turningLeafBasePos;
    const p = active ? Math.max(0, Math.min(1, progress)) : 0;

    const windAmp =
      weather === 'windy' ? 0.08 : weather === 'thunderstorm' ? 0.06 : 0.012;

    const baseAngle = p * Math.PI;
    for (let i = 0; i < posAttr.count; i++) {
      const bx = base[i * 3]; // 0 .. BOOK_PAGE_W
      const bz = base[i * 3 + 2]; // -BOOK_PAGE_D/2 .. +BOOK_PAGE_D/2
      const u = bx / BOOK_PAGE_W; // 0 at spine, 1 at outer edge
      const vNorm = (bz + BOOK_PAGE_D / 2) / BOOK_PAGE_D; // 0 top, 1 bottom corner

      // Parabolic lag along Z & X so the page curves smoothly rather than acting like a stiff board
      const lag = Math.sin(p * Math.PI) * (0.48 * u + 0.16 * vNorm);
      const localAngle = Math.max(0, Math.min(Math.PI, baseAngle - lag));

      const archLift = Math.sin(u * Math.PI) * Math.sin(p * Math.PI) * 0.65;
      const hoverLift =
        !active && this.currentCornerLift > 0.01
          ? Math.pow(u, 2.1) * Math.pow(vNorm, 1.8) * 0.42 * this.currentCornerLift
          : 0;
      const flutter =
        Math.pow(u, 1.6) *
        Math.sin(elapsed * 4.5 + bz * 1.4) *
        windAmp *
        (active ? 1.5 : 0.45);

      const x = Math.cos(localAngle) * bx;
      const y = Math.sin(localAngle) * bx + archLift + hoverLift + Math.max(0, flutter);
      posAttr.setXYZ(i, x, y, bz);
    }

    posAttr.needsUpdate = true;
    this.turningLeafGeo.computeVertexNormals();
  }

  public updateCandle(
    dt: number,
    elapsed: number,
    nightFactor: number,
    weather: WeatherPreset,
    candleLit = this.deskPropsCandleLit,
  ): void {
    this.deskPropsCandleLit = candleLit;
    this.candleFlame.visible = candleLit;

    if (this.quillDipAnim > 0) {
      this.quillDipAnim = Math.max(0, this.quillDipAnim - dt * 2.6);
      this.quillPivot.rotation.z = Math.sin(this.quillDipAnim * Math.PI) * 0.28;
      this.quillPivot.position.y = -Math.sin(this.quillDipAnim * Math.PI) * 0.08;
    } else {
      this.quillPivot.rotation.z = 0;
      this.quillPivot.position.y = 0;
    }

    if (this.stampPressAnim > 0) {
      this.stampPressAnim = Math.max(0, this.stampPressAnim - dt * 3.2);
      this.stampGroup.position.y = Math.sin(this.stampPressAnim * Math.PI) * 0.22;
    } else {
      this.stampGroup.position.y = 0;
    }

    if (!candleLit) {
      this.candleLight.intensity = 0;
      return;
    }

    const stormFlicker =
      weather === 'windy' || weather === 'thunderstorm'
        ? Math.sin(elapsed * 19.0) * 0.25 + Math.cos(elapsed * 27.0) * 0.18
        : 0;
    const gentleFlicker = Math.sin(elapsed * 6.2) * 0.08 + Math.sin(elapsed * 11.4) * 0.05;
    const scaleY = 1 + gentleFlicker + stormFlicker * 0.5;
    this.candleFlame.scale.set(1 - gentleFlicker * 0.3, Math.max(0.55, scaleY), 1);
    this.candleFlame.rotation.z = stormFlicker * 0.35;

    // Stronger candle warmth at dusk/night, gentle accent in daytime
    const baseIntensity = 1.6 + nightFactor * 3.6;
    this.candleLight.intensity = baseIntensity * (1 + gentleFlicker + stormFlicker * 0.35);
  }
}
