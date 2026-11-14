import * as THREE from 'three';
import { ProceduralTexturePack } from './proceduralTextures';

export const BOOK_PAGE_W = 4.2; // each half-page width
export const BOOK_PAGE_D = 5.6; // page depth (front-to-back)
export const BOOK_SPREAD_W = BOOK_PAGE_W * 2; // 8.4 total open spread width
export const BOOK_BASE_Y = 0.24; // base surface height of open pages

/**
 * Computes the gentle natural paper-arch height across the open book spread at local (x, z),
 * dipping slightly into the central binding gutter and swelling softly toward each page middle.
 */
export function getOpenPageY(x: number): number {
  const absX = Math.min(BOOK_PAGE_W, Math.abs(x));
  const u = absX / BOOK_PAGE_W; // 0 at spine -> 1 at fore-edge
  const gutterDip = -0.022 * Math.exp(-absX * 3.4);
  const pageArch = 0.042 * Math.sin(u * Math.PI);
  return gutterDip + pageArch;
}

const _wearTmpCol = new THREE.Color();

const ARCHIVAL_WEAR_GLSL_HELPERS = /* glsl */ `
uniform float uWearTime;
uniform float uWearLevel;
uniform float uWearSeed;
uniform vec3 uWearTintColor;
uniform vec3 uWearScorchColor;

float wearHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float wearNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(wearHash(i), wearHash(i + vec2(1.0, 0.0)), u.x),
    mix(wearHash(i + vec2(0.0, 1.0)), wearHash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

vec3 applyArchivalWear(vec3 baseRgb, vec2 uv, float isSingleLeaf) {
  float level = clamp(uWearLevel, 0.0, 1.0);
  if (level <= 0.01) return baseRgb;

  float edgeY = min(uv.y, 1.0 - uv.y) * 2.0;
  float edgeX = isSingleLeaf > 0.5 ? (1.0 - uv.x) * 1.45 : min(uv.x, 1.0 - uv.x) * 2.0;
  float perimeter = min(edgeX, edgeY);

  float grain = wearNoise(uv * 16.0 + vec2(uWearSeed * 1.9, uWearSeed * 0.7));
  float cornerScorch = 1.0 - smoothstep(0.02, 0.22 + level * 0.14, perimeter - (grain - 0.5) * 0.09);

  // Subtle handling shadow + mild archival margin scorch; preserves crisp 4:3 diagram interior
  float marginWeight = cornerScorch * (0.14 + 0.34 * level) * (0.85 + 0.15 * grain);
  vec3 worn = mix(baseRgb, baseRgb * 0.68 + uWearScorchColor * 0.22, marginWeight);

  // Faint age crease along spine & top corners
  float fineAge = (grain - 0.5) * 0.025 * level;
  return clamp(worn + uWearTintColor * fineAge, 0.0, 1.0);
}
`;

/**
 * Physical charcoal linen archival volume resting atop a chamfered matte black slate slab.
 * Zero wooden desk, zero candles/inkwell/dividers/wax stamps; includes brass magnifier tool & hinged 3D binding.
 */
export class BookAndDeskRig {
  public readonly root = new THREE.Group();
  public readonly bookGroup = new THREE.Group();

  private leftCoverPivot = new THREE.Group();
  private spineGroup = new THREE.Group();
  private claspLatch = new THREE.Group();
  public readonly claspHitMesh: THREE.Mesh;

  private spreadMat: THREE.MeshStandardMaterial;
  public readonly spreadMesh: THREE.Mesh;

  private turningLeafGeo: THREE.PlaneGeometry;
  private turningLeafBackGeo: THREE.PlaneGeometry;
  private turningLeafBasePos: Float32Array;
  private turningLeafMat: THREE.MeshStandardMaterial;
  private turningLeafBackMat: THREE.MeshStandardMaterial;
  public readonly turningLeafMesh: THREE.Mesh;

  public readonly cornerRightHit: THREE.Mesh;
  public readonly cornerLeftHit: THREE.Mesh;

  public readonly deskInteractables: THREE.Object3D[] = [];
  private deskMagnifierGroup!: THREE.Group;

  private magnifierUniforms = {
    uMagActive: { value: 0.0 },
    uMagCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uMagRadius: { value: 0.13 },
    uSecretTex: { value: null as THREE.Texture | null },
  };

  private archivalWearUniforms = {
    uWearTime: { value: 0.0 },
    uWearLevel: { value: 0.08 },
    uWearSeed: { value: 1.0 },
    uWearTintColor: { value: new THREE.Color(0x3a352c) },
    uWearScorchColor: { value: new THREE.Color(0x4a3b2a) },
  };

  private openAmount = 0;
  private currentCornerLift = 0;

  constructor(private textures: ProceduralTexturePack) {
    this.buildSlateTable();

    this.bookGroup.position.set(0, 0, 0);
    this.root.add(this.bookGroup);

    const coverMat = new THREE.MeshStandardMaterial({
      map: textures.linenColor,
      bumpMap: textures.linenBump,
      bumpScale: 0.022,
      roughness: 0.78,
      metalness: 0.04,
    });

    const frontCoverMat = new THREE.MeshPhysicalMaterial({
      map: textures.coverFrontColor,
      bumpMap: textures.coverFrontBump,
      bumpScale: 0.032,
      metalnessMap: textures.coverFrontMetalness,
      metalness: 0.9,
      roughnessMap: textures.coverFrontRoughness,
      roughness: 0.88,
      clearcoat: 0.14,
      clearcoatRoughness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const tarnishedBrassMat = new THREE.MeshStandardMaterial({
      color: 0xbda166,
      roughness: 0.36,
      metalness: 0.86,
    });

    const cyanFilamentMat = new THREE.MeshStandardMaterial({
      color: 0x4ccae8,
      emissive: 0x165e73,
      emissiveIntensity: 0.45,
      roughness: 0.32,
      metalness: 0.25,
    });

    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: textures.pageEdgeColor,
      roughness: 0.86,
      metalness: 0.02,
    });

    const boardThickness = 0.09;
    const boardWidth = BOOK_PAGE_W + 0.4;
    const boardDepth = BOOK_PAGE_D + 0.44;
    const stackThickness = 0.14;

    // Book contact shadow on black slate
    const bookShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(BOOK_SPREAD_W + 1.6, BOOK_PAGE_D + 1.6),
      new THREE.MeshBasicMaterial({
        map: textures.contactShadow,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
      }),
    );
    bookShadow.rotation.x = -Math.PI / 2;
    bookShadow.position.y = 0.005;
    this.bookGroup.add(bookShadow);

    // Right board + sober tarnished-brass binder corner guards
    const rightBoard = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth, boardThickness, boardDepth),
      coverMat,
    );
    rightBoard.position.set(boardWidth / 2, boardThickness / 2, 0);
    rightBoard.castShadow = true;
    rightBoard.receiveShadow = true;
    this.bookGroup.add(rightBoard);

    const addCornerGuard = (parent: THREE.Object3D, xEdge: number, zEdge: number, yCenter: number) => {
      const sx = xEdge >= 0 ? -1 : 1;
      const sz = zEdge >= 0 ? -1 : 1;
      const legA = new THREE.Mesh(new THREE.BoxGeometry(0.42, boardThickness + 0.018, 0.08), tarnishedBrassMat);
      legA.position.set(xEdge + sx * 0.21, yCenter, zEdge + sz * 0.02);
      const legB = new THREE.Mesh(new THREE.BoxGeometry(0.08, boardThickness + 0.018, 0.42), tarnishedBrassMat);
      legB.position.set(xEdge + sx * 0.02, yCenter, zEdge + sz * 0.21);
      legA.castShadow = true;
      legB.castShadow = true;
      parent.add(legA, legB);
    };
    addCornerGuard(this.bookGroup, boardWidth, boardDepth / 2, boardThickness / 2);
    addCornerGuard(this.bookGroup, boardWidth, -boardDepth / 2, boardThickness / 2);

    // Four-step fanned right page stack (visibly layered cream cardstock signatures)
    for (let s = 0; s < 4; s++) {
      const stepH = stackThickness / 4;
      const wInset = s * 0.026;
      const dInset = s * 0.018;
      const layer = new THREE.Mesh(
        new THREE.BoxGeometry(BOOK_PAGE_W - wInset, stepH + 0.004, BOOK_PAGE_D - dInset),
        pageEdgeMat,
      );
      layer.position.set(
        (BOOK_PAGE_W - wInset) / 2 + 0.02,
        boardThickness + stepH * (s + 0.5),
        0,
      );
      layer.castShadow = true;
      layer.receiveShadow = true;
      this.bookGroup.add(layer);
    }

    // Linen spine with sober tarnished-brass binder bands & woven charcoal-gold bookmark ribbon tail
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

    for (const bandZ of [-1.8, 0, 1.8]) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.234, 0.018, 8, 18, Math.PI),
        tarnishedBrassMat,
      );
      band.rotation.x = Math.PI / 2;
      band.rotation.y = Math.PI / 2;
      band.position.set(0, 0, bandZ);
      this.spineGroup.add(band);
    }
    this.bookGroup.add(this.spineGroup);

    // Sewn archival headbands + subtle brass spine binding eyelets at top/bottom binding channel
    const headbandMat = new THREE.MeshStandardMaterial({
      color: 0x3b687c,
      roughness: 0.72,
      metalness: 0.08,
    });
    for (const hz of [-(BOOK_PAGE_D / 2 - 0.04), BOOK_PAGE_D / 2 - 0.04]) {
      const hb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.22, 8),
        headbandMat,
      );
      hb.rotation.z = Math.PI / 2;
      hb.position.set(0, BOOK_BASE_Y - 0.035, hz);
      this.bookGroup.add(hb);
    }
    for (const ez of [-1.85, 0, 1.85]) {
      const eyelet = new THREE.Mesh(
        new THREE.TorusGeometry(0.032, 0.008, 6, 12),
        tarnishedBrassMat,
      );
      eyelet.rotation.x = Math.PI / 2;
      eyelet.position.set(0, BOOK_BASE_Y - 0.02, ez);
      this.bookGroup.add(eyelet);
    }

    // Subtle bookmark ribbon emerging cleanly from the bottom gutter onto the slate
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x264454,
      roughness: 0.78,
      metalness: 0.05,
    });
    const ribbonTail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.014, 0.92), ribbonMat);
    ribbonTail.position.set(0.08, 0.016, BOOK_PAGE_D / 2 + 0.34);
    ribbonTail.rotation.y = 0.14;
    ribbonTail.castShadow = true;
    const ribbonTip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.016, 0.05), tarnishedBrassMat);
    ribbonTip.position.set(0.145, 0.018, BOOK_PAGE_D / 2 + 0.78);
    ribbonTip.rotation.y = 0.14;
    this.bookGroup.add(ribbonTail, ribbonTip);

    // Left cover wing (closes neatly atop right board at angle=-PI)
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

    addCornerGuard(this.leftCoverPivot, -boardWidth, boardDepth / 2, -boardThickness / 2);
    addCornerGuard(this.leftCoverPivot, -boardWidth, -boardDepth / 2, -boardThickness / 2);

    // Front cover graphic plate (un-mirrored orthonormal basis)
    const plateWidth = boardWidth - 0.1;
    const plateDepth = boardDepth - 0.1;
    const frontCoverPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(plateWidth, plateDepth),
      frontCoverMat,
    );
    const coverBasis = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, -1, 0),
    );
    frontCoverPlate.quaternion.setFromRotationMatrix(coverBasis);
    frontCoverPlate.position.set(-boardWidth / 2, -boardThickness - 0.002, 0);
    frontCoverPlate.receiveShadow = true;
    this.leftCoverPivot.add(frontCoverPlate);

    // Minimalist embossed brass technical star + concentric rings + cyan Starsilk filament relief at cover center
    const emblemGroup = new THREE.Group();
    emblemGroup.position.set(-boardWidth / 2, -boardThickness - 0.006, 0);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.016, 10, 36),
      tarnishedBrassMat,
    );
    outerRing.rotation.x = Math.PI / 2;

    const midRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.012, 10, 32),
      tarnishedBrassMat,
    );
    midRing.rotation.x = Math.PI / 2;

    const filamentArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.013, 8, 28, Math.PI * 1.15),
      cyanFilamentMat,
    );
    filamentArc.rotation.x = Math.PI / 2;
    filamentArc.rotation.z = 0.42;

    const centerStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      tarnishedBrassMat,
    );
    centerStar.scale.set(1, 0.24, 1);

    emblemGroup.add(outerRing, midRing, filamentArc, centerStar);
    this.leftCoverPivot.add(emblemGroup);

    // Four-step fanned left page stack
    for (let s = 0; s < 4; s++) {
      const stepH = stackThickness / 4;
      const wInset = s * 0.026;
      const dInset = s * 0.018;
      const layer = new THREE.Mesh(
        new THREE.BoxGeometry(BOOK_PAGE_W - wInset, stepH + 0.004, BOOK_PAGE_D - dInset),
        pageEdgeMat,
      );
      layer.position.set(-(BOOK_PAGE_W - wInset) / 2 - 0.02, stepH * (s + 0.5), 0);
      layer.castShadow = true;
      layer.receiveShadow = true;
      this.leftCoverPivot.add(layer);
    }

    // Simple sober tarnished-brass archival fore-edge clasp (zero crimson jewel)
    this.claspLatch.position.set(-boardWidth - 0.01, -boardThickness / 2, 0);
    const strapHinge = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.05, 0.44),
      tarnishedBrassMat,
    );
    strapHinge.position.set(0.1, -0.044, 0);

    const strapBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.34, 0.38),
      coverMat,
    );
    strapBody.position.set(-0.02, 0.14, 0);

    const haspPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.3, 0.46),
      tarnishedBrassMat,
    );
    haspPlate.position.set(-0.04, 0.14, 0);
    haspPlate.castShadow = true;

    this.claspLatch.add(strapHinge, strapBody, haspPlate);
    this.leftCoverPivot.add(this.claspLatch);

    // Large accessible hit volume on closed book/clasp
    this.claspHitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + 0.5, 0.72, boardDepth + 0.5),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.claspHitMesh.position.set(-boardWidth / 2, -0.05, 0);
    this.claspHitMesh.userData = { interactionType: 'openBook' };
    this.leftCoverPivot.add(this.claspHitMesh);

    // Active open spread cardstock with Lens Marginalia + Archival Wear shaders
    this.magnifierUniforms.uSecretTex.value = textures.worldSecretInk[0];
    this.spreadMat = new THREE.MeshStandardMaterial({
      map: textures.worldParchment[0],
      bumpMap: textures.paperGrainBump,
      bumpScale: 0.008,
      roughness: 0.9,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.spreadMat.customProgramCacheKey = () => 'spread-archival-lens-wear-v3';
    this.spreadMat.onBeforeCompile = (shader) => {
      shader.uniforms.uMagActive = this.magnifierUniforms.uMagActive;
      shader.uniforms.uMagCenter = this.magnifierUniforms.uMagCenter;
      shader.uniforms.uMagRadius = this.magnifierUniforms.uMagRadius;
      shader.uniforms.uSecretTex = this.magnifierUniforms.uSecretTex;
      shader.uniforms.uWearTime = this.archivalWearUniforms.uWearTime;
      shader.uniforms.uWearLevel = this.archivalWearUniforms.uWearLevel;
      shader.uniforms.uWearSeed = this.archivalWearUniforms.uWearSeed;
      shader.uniforms.uWearTintColor = this.archivalWearUniforms.uWearTintColor;
      shader.uniforms.uWearScorchColor = this.archivalWearUniforms.uWearScorchColor;

      shader.fragmentShader =
        `
        uniform float uMagActive;
        uniform vec2 uMagCenter;
        uniform float uMagRadius;
        uniform sampler2D uSecretTex;
        ` +
        ARCHIVAL_WEAR_GLSL_HELPERS +
        shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        diffuseColor.rgb = applyArchivalWear(diffuseColor.rgb, vMapUv, 0.0);
        if (uMagActive > 0.01) {
          vec2 d = vMapUv - uMagCenter;
          d.x *= 1.5;
          float dist = length(d);
          float innerMask = 1.0 - smoothstep(uMagRadius * 0.78, uMagRadius, dist);
          vec4 secretSample = texture2D(uSecretTex, vMapUv);
          vec3 glowInk = mix(diffuseColor.rgb * 0.88, vec3(0.28, 0.78, 0.91), secretSample.a);
          diffuseColor.rgb = mix(diffuseColor.rgb, glowInk, innerMask * uMagActive * 0.9);
        }
        `,
      );
    };

    // Gently arched two-page open spread surface dipping into center gutter
    const spreadGeo = new THREE.PlaneGeometry(BOOK_SPREAD_W, BOOK_PAGE_D, 48, 16);
    spreadGeo.rotateX(-Math.PI / 2);
    const sPos = spreadGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < sPos.count; i++) {
      const vx = sPos.getX(i);
      sPos.setY(i, getOpenPageY(vx));
    }
    sPos.needsUpdate = true;
    spreadGeo.computeVertexNormals();

    this.spreadMesh = new THREE.Mesh(spreadGeo, this.spreadMat);
    this.spreadMesh.position.set(0, BOOK_BASE_Y, 0);
    this.spreadMesh.receiveShadow = true;
    this.spreadMesh.visible = false;
    this.bookGroup.add(this.spreadMesh);

    // Physical animated turning cardstock leaf
    this.turningLeafGeo = new THREE.PlaneGeometry(BOOK_PAGE_W, BOOK_PAGE_D, 28, 18);
    this.turningLeafGeo.translate(BOOK_PAGE_W / 2, 0, 0);
    this.turningLeafGeo.rotateX(-Math.PI / 2);
    this.turningLeafBasePos = new Float32Array(
      (this.turningLeafGeo.attributes.position as THREE.BufferAttribute).array,
    );

    const configureLeafShader = (mat: THREE.MeshStandardMaterial) => {
      mat.customProgramCacheKey = () => 'leaf-wear-v3';
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uWearTime = this.archivalWearUniforms.uWearTime;
        shader.uniforms.uWearLevel = this.archivalWearUniforms.uWearLevel;
        shader.uniforms.uWearSeed = this.archivalWearUniforms.uWearSeed;
        shader.uniforms.uWearTintColor = this.archivalWearUniforms.uWearTintColor;
        shader.uniforms.uWearScorchColor = this.archivalWearUniforms.uWearScorchColor;

        shader.fragmentShader = ARCHIVAL_WEAR_GLSL_HELPERS + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          #include <map_fragment>
          diffuseColor.rgb = applyArchivalWear(diffuseColor.rgb, vMapUv, 1.0);
          `,
        );
      };
    };

    this.turningLeafMat = new THREE.MeshStandardMaterial({
      map: textures.worldParchment[0],
      bumpMap: textures.paperGrainBump,
      bumpScale: 0.006,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.FrontSide,
    });
    configureLeafShader(this.turningLeafMat);

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
      bumpScale: 0.006,
      roughness: 0.88,
      metalness: 0.02,
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

    // Page corner drag/click targets
    const cornerHitGeo = new THREE.BoxGeometry(1.05, 0.25, 1.05);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.cornerRightHit = new THREE.Mesh(cornerHitGeo, hitMat);
    this.cornerRightHit.position.set(BOOK_PAGE_W - 0.52, BOOK_BASE_Y + 0.06, BOOK_PAGE_D / 2 - 0.52);
    this.cornerRightHit.userData = {
      interactionType: 'pageCorner',
      direction: 1,
      label: 'Next Folio Corner',
      category: 'Binding',
      hint: 'Click or drag to turn to the next folio',
    };

    this.cornerLeftHit = new THREE.Mesh(cornerHitGeo, hitMat);
    this.cornerLeftHit.position.set(-BOOK_PAGE_W + 0.52, BOOK_BASE_Y + 0.06, BOOK_PAGE_D / 2 - 0.52);
    this.cornerLeftHit.userData = {
      interactionType: 'pageCorner',
      direction: -1,
      label: 'Previous Folio Corner',
      category: 'Binding',
      hint: 'Click or drag to turn to the previous folio',
    };

    this.bookGroup.add(this.cornerRightHit, this.cornerLeftHit);

    this.setBookOpenProgress(0);
  }

  private buildSlateTable(): void {
    // Deep matte black void surrounding the slate slab
    const voidFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 48),
      new THREE.MeshBasicMaterial({ color: 0x0a0c0f }),
    );
    voidFloor.rotation.x = -Math.PI / 2;
    voidFloor.position.y = -0.18;
    this.root.add(voidFloor);

    // Thick matte black mineral slate slab beneath the book
    const slateMat = new THREE.MeshStandardMaterial({
      map: this.textures.slateColor,
      bumpMap: this.textures.slateBump,
      bumpScale: 0.015,
      roughness: 0.92,
      metalness: 0.03,
    });
    const slabW = 14.4;
    const slabD = 9.2;
    const slabH = 0.16;
    const slateSlab = new THREE.Mesh(new THREE.BoxGeometry(slabW, slabH, slabD), slateMat);
    slateSlab.position.set(0, -slabH / 2, 0);
    slateSlab.receiveShadow = true;
    this.root.add(slateSlab);

    // Subtle physical slate mineral chips along slab corners/edges
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x20252d,
      roughness: 0.85,
      metalness: 0.05,
    });
    const chips: [number, number, number, number][] = [
      [-6.85, -4.35, 0.35, 0.22],
      [6.9, 4.25, -0.48, 0.26],
      [-5.4, 4.45, 0.18, 0.16],
      [6.4, -4.38, -0.25, 0.18],
    ];
    chips.forEach(([cx, cz, rotY, sz]) => {
      const flake = new THREE.Mesh(
        new THREE.CylinderGeometry(sz, sz * 1.15, 0.035, 5),
        chipMat,
      );
      flake.position.set(cx, 0.01, cz);
      flake.rotation.y = rotY;
      flake.receiveShadow = true;
      this.root.add(flake);
    });

    // Resting Brass Inspection Lens on right slate surface
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xbda166,
      roughness: 0.34,
      metalness: 0.88,
    });
    this.deskMagnifierGroup = new THREE.Group();
    this.deskMagnifierGroup.position.set(5.35, 0.045, 0.2);
    this.deskMagnifierGroup.rotation.y = -0.35;

    const magBezel = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.034, 10, 28), brassMat);
    magBezel.rotation.x = Math.PI / 2;
    magBezel.castShadow = true;

    const magGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.02, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xeaf6fb,
        roughness: 0.08,
        transparent: true,
        opacity: 0.34,
        clearcoat: 1.0,
      }),
    );

    const magHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.048, 0.68, 10),
      new THREE.MeshStandardMaterial({ color: 0x242830, roughness: 0.55 }),
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
      label: 'Archival Inspection Lens',
      category: 'Inspection Tool',
      hint: 'Click to toggle Lens Inspection across folio margins',
    };
    this.deskMagnifierGroup.add(magBezel, magGlass, magHandle, magHit);
    this.deskInteractables.push(magHit);
    this.root.add(this.deskMagnifierGroup);
  }

  public setBookOpenProgress(progress: number): void {
    this.openAmount = Math.max(0, Math.min(1, progress));
    const angle = (1 - this.openAmount) * -Math.PI;
    this.leftCoverPivot.rotation.z = angle;
    this.leftCoverPivot.position.y = THREE.MathUtils.lerp(0.37, 0.09, this.openAmount);

    this.spineGroup.position.y = THREE.MathUtils.lerp(0.23, 0.04, this.openAmount);
    this.spineGroup.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.62, this.openAmount));

    this.bookGroup.position.x = (1 - this.openAmount) * -(BOOK_PAGE_W / 2 + 0.18);
    this.claspLatch.rotation.z = Math.min(1, this.openAmount * 3.5) * 0.85;

    this.spreadMesh.visible = this.openAmount > 0.82;
    this.claspHitMesh.visible = this.openAmount < 0.25;
  }

  public setDeskPropStates(opts: { magnifierOnDesk: boolean }): void {
    this.deskMagnifierGroup.visible = opts.magnifierOnDesk;
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

  public updateArchivalWear(
    elapsed: number,
    wearLevel: number,
    worldId: number,
    accentHex: string,
  ): void {
    const u = this.archivalWearUniforms;
    u.uWearTime.value = elapsed;
    u.uWearLevel.value = THREE.MathUtils.clamp(wearLevel, 0.05, 0.95);
    u.uWearSeed.value = worldId + 1;
    u.uWearTintColor.value.setHex(0x3a362e).lerp(_wearTmpCol.set(accentHex), 0.18);
    u.uWearScorchColor.value.setHex(worldId >= 4 ? 0x4b2f24 : 0x524635);
  }

  public updateTurningLeaf(
    active: boolean,
    progress: number,
    cornerLift: number,
    elapsed: number,
    reducedMotion: boolean,
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

    const baseAngle = p * Math.PI;
    for (let i = 0; i < posAttr.count; i++) {
      const bx = base[i * 3];
      const bz = base[i * 3 + 2];
      const u = bx / BOOK_PAGE_W;
      const vNorm = (bz + BOOK_PAGE_D / 2) / BOOK_PAGE_D;

      const lag = Math.sin(p * Math.PI) * (0.44 * u + 0.14 * vNorm);
      const localAngle = Math.max(0, Math.min(Math.PI, baseAngle - lag));

      const archLift = Math.sin(u * Math.PI) * Math.sin(p * Math.PI) * 0.62;
      const hoverLift =
        !active && this.currentCornerLift > 0.01
          ? Math.pow(u, 2.1) * Math.pow(vNorm, 1.8) * 0.36 * this.currentCornerLift
          : 0;
      const flutter = reducedMotion
        ? 0
        : Math.pow(u, 1.6) * Math.sin(elapsed * 3.8 + bz * 1.2) * 0.01;

      const restArch = getOpenPageY(bx) * (0.4 + 0.6 * Math.abs(Math.cos(localAngle)));
      const x = Math.cos(localAngle) * bx;
      const y = Math.sin(localAngle) * bx + archLift + hoverLift + restArch + Math.max(0, flutter);
      posAttr.setXYZ(i, x, y, bz);
    }

    posAttr.needsUpdate = true;
    this.turningLeafGeo.computeVertexNormals();
  }
}
