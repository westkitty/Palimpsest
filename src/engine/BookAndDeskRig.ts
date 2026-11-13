import * as THREE from 'three';
import { ProceduralTexturePack } from './proceduralTextures';
import { WeatherPreset } from '../types/atlas';

export const BOOK_PAGE_W = 4.2; // each half-page width
export const BOOK_PAGE_D = 5.6; // page depth (front-to-back)
export const BOOK_SPREAD_W = BOOK_PAGE_W * 2; // 8.4 total open spread width
export const BOOK_BASE_Y = 0.24; // top surface height of open pages

export class BookAndDeskRig {
  public readonly root = new THREE.Group();
  public readonly bookGroup = new THREE.Group();

  // Hinged left wing for closed->open book animation
  private leftCoverPivot = new THREE.Group();
  private claspLatch = new THREE.Group();
  public readonly claspHitMesh: THREE.Mesh;

  // Spread surface planes (for world parchment + magnifier shader uniforms)
  private spreadMat: THREE.MeshStandardMaterial;
  public readonly spreadMesh: THREE.Mesh;

  // Animated physical page-turning leaf
  private turningLeafGeo: THREE.PlaneGeometry;
  private turningLeafBasePos: Float32Array;
  private turningLeafMat: THREE.MeshStandardMaterial;
  public readonly turningLeafMesh: THREE.Mesh;

  // Corner drag hitboxes for physical page turning
  public readonly cornerRightHit: THREE.Mesh;
  public readonly cornerLeftHit: THREE.Mesh;

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
      roughness: 0.68,
      metalness: 0.06,
    });

    const frontCoverMat = new THREE.MeshStandardMaterial({
      map: textures.coverFrontColor,
      bumpMap: textures.coverFrontBump,
      bumpScale: 0.035,
      roughness: 0.48,
      metalness: 0.22,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af6e,
      roughness: 0.26,
      metalness: 0.88,
    });

    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: textures.pageEdgeColor,
      roughness: 0.85,
      metalness: 0.04,
    });

    // Book contact shadow on desk
    const bookShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(BOOK_SPREAD_W + 1.8, BOOK_PAGE_D + 1.8),
      new THREE.MeshBasicMaterial({
        map: textures.contactShadow,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    );
    bookShadow.rotation.x = -Math.PI / 2;
    bookShadow.position.y = 0.005;
    this.bookGroup.add(bookShadow);

    // Back / Right board (remains resting on desk)
    const boardThickness = 0.09;
    const rightBoard = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_PAGE_W + 0.35, boardThickness, BOOK_PAGE_D + 0.4),
      coverMat,
    );
    rightBoard.position.set((BOOK_PAGE_W + 0.35) / 2, boardThickness / 2, 0);
    rightBoard.castShadow = true;
    rightBoard.receiveShadow = true;
    this.bookGroup.add(rightBoard);

    // Right page block (gilt stack)
    const rightStack = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_PAGE_W, 0.14, BOOK_PAGE_D),
      pageEdgeMat,
    );
    rightStack.position.set(BOOK_PAGE_W / 2, boardThickness + 0.07, 0);
    rightStack.castShadow = true;
    rightStack.receiveShadow = true;
    this.bookGroup.add(rightStack);

    // Rounded leather spine with raised cords
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, BOOK_PAGE_D + 0.4, 16, 1, false, 0, Math.PI),
      coverMat,
    );
    spine.rotation.x = Math.PI / 2;
    spine.rotation.z = Math.PI;
    spine.position.set(0, 0.12, 0);
    spine.castShadow = true;
    this.bookGroup.add(spine);

    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.19, 0.025, 8, 16, Math.PI),
        brassMat,
      );
      rib.rotation.x = Math.PI / 2;
      rib.rotation.y = Math.PI / 2;
      rib.position.set(0, 0.12, i * 1.15);
      this.bookGroup.add(rib);
    }

    // Left cover wing (hinges from Z-axis at X=0 from closed (angle=PI) to open (angle=0))
    this.leftCoverPivot.position.set(0, 0.09, 0);
    this.bookGroup.add(this.leftCoverPivot);

    const leftBoard = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_PAGE_W + 0.35, boardThickness, BOOK_PAGE_D + 0.4),
      [coverMat, coverMat, coverMat, frontCoverMat, coverMat, coverMat],
    );
    leftBoard.position.set(-(BOOK_PAGE_W + 0.35) / 2, -boardThickness / 2, 0);
    leftBoard.castShadow = true;
    leftBoard.receiveShadow = true;
    this.leftCoverPivot.add(leftBoard);

    // Left page stack
    const leftStack = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_PAGE_W, 0.14, BOOK_PAGE_D),
      pageEdgeMat,
    );
    leftStack.position.set(-BOOK_PAGE_W / 2, 0.07, 0);
    leftStack.castShadow = true;
    leftStack.receiveShadow = true;
    this.leftCoverPivot.add(leftStack);

    // Brass corner brackets on left cover
    const cornerOffsets = [
      [-(BOOK_PAGE_W + 0.32), -(BOOK_PAGE_D / 2 + 0.17)],
      [-(BOOK_PAGE_W + 0.32), BOOK_PAGE_D / 2 + 0.17],
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.28), brassMat);
      cap.position.set(cx, -boardThickness / 2, cz);
      this.leftCoverPivot.add(cap);
    });

    // Brass book clasp latch (on outer edge of left cover when closed)
    this.claspLatch.position.set(-(BOOK_PAGE_W + 0.36), -0.04, 0);
    const hasp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.62), brassMat);
    hasp.castShadow = true;
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.1, 0),
      new THREE.MeshStandardMaterial({
        color: 0xb8433e,
        roughness: 0.2,
        metalness: 0.2,
        emissive: 0x451210,
      }),
    );
    gem.position.set(-0.08, -0.02, 0);
    this.claspLatch.add(hasp, gem);
    this.leftCoverPivot.add(this.claspLatch);

    // Invisible larger hit volume for easy clicking on the closed book/clasp
    this.claspHitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_PAGE_W + 0.7, 0.65, BOOK_PAGE_D + 0.6),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.claspHitMesh.position.set(-(BOOK_PAGE_W + 0.2) / 2, 0.12, 0);
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
    this.spreadMat.customProgramCacheKey = () => 'spread-magnifier-portal-v1';
    this.spreadMat.onBeforeCompile = (shader) => {
      shader.uniforms.uMagActive = this.magnifierUniforms.uMagActive;
      shader.uniforms.uMagCenter = this.magnifierUniforms.uMagCenter;
      shader.uniforms.uMagRadius = this.magnifierUniforms.uMagRadius;
      shader.uniforms.uSecretTex = this.magnifierUniforms.uSecretTex;
      shader.uniforms.uSpreadPortalMorph = this.spreadPortalUniforms.uSpreadPortalMorph;
      shader.uniforms.uSpreadPortalUv = this.spreadPortalUniforms.uSpreadPortalUv;
      shader.uniforms.uSpreadPortalColor = this.spreadPortalUniforms.uSpreadPortalColor;

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
        ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
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

    this.turningLeafMat = new THREE.MeshStandardMaterial({
      map: textures.worldParchment[0],
      bumpMap: textures.paperGrainBump,
      bumpScale: 0.008,
      roughness: 0.86,
      metalness: 0.03,
      side: THREE.DoubleSide,
    });
    this.turningLeafMesh = new THREE.Mesh(this.turningLeafGeo, this.turningLeafMat);
    this.turningLeafMesh.position.set(0, BOOK_BASE_Y + 0.012, 0);
    this.turningLeafMesh.castShadow = true;
    this.turningLeafMesh.receiveShadow = true;
    this.turningLeafMesh.visible = false;
    this.bookGroup.add(this.turningLeafMesh);

    // Page corner drag/click targets (bottom-right & bottom-left)
    const cornerHitGeo = new THREE.BoxGeometry(1.05, 0.25, 1.05);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.cornerRightHit = new THREE.Mesh(cornerHitGeo, hitMat);
    this.cornerRightHit.position.set(BOOK_PAGE_W - 0.52, BOOK_BASE_Y + 0.06, BOOK_PAGE_D / 2 - 0.52);
    this.cornerRightHit.userData = { interactionType: 'pageCorner', direction: 1 };

    this.cornerLeftHit = new THREE.Mesh(cornerHitGeo, hitMat);
    this.cornerLeftHit.position.set(-BOOK_PAGE_W + 0.52, BOOK_BASE_Y + 0.06, BOOK_PAGE_D / 2 - 0.52);
    this.cornerLeftHit.userData = { interactionType: 'pageCorner', direction: -1 };

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
    inkGroup.add(inkBase, inkCollar, quillShaft, quillVane);
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
    dividers.add(legA, legB, hinge);
    this.root.add(dividers);

    // Crimson Wax Seal Stamp (bottom-right of desk)
    const sealStamp = new THREE.Group();
    sealStamp.position.set(5.45, 0, 2.0);
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
    sealStamp.add(stampHead, stampHandle);
    this.root.add(sealStamp);
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

    candleGroup.add(saucer, stem, wax, flame, light);
    this.root.add(candleGroup);

    return { flame, light };
  }

  public setBookOpenProgress(progress: number): void {
    this.openAmount = Math.max(0, Math.min(1, progress));
    // Closed: left wing folded onto right wing (rotation.z = -PI + small thickness)
    // Open: left wing flat at rotation.z = 0
    const angle = (1 - this.openAmount) * -Math.PI;
    this.leftCoverPivot.rotation.z = angle;

    // Center the closed book at X=0 when closed, or centered spread when open
    this.bookGroup.position.x = (1 - this.openAmount) * -(BOOK_PAGE_W / 2);

    // Clasp lifts open slightly before cover swings
    this.claspLatch.rotation.z = -Math.min(1, this.openAmount * 4) * 0.75;

    this.spreadMesh.visible = this.openAmount > 0.82;
    this.claspHitMesh.visible = this.openAmount < 0.25;
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

  /**
   * Deforms the physical turning leaf along a curved parabolic page-turn arc.
   * progress: 0 = flat right, 1 = flat left. direction: 1 (forward) or -1 (backward).
   */
  public updateTurningLeaf(
    active: boolean,
    progress: number,
    cornerLift: number,
    elapsed: number,
    weather: WeatherPreset,
    worldTextureIndex: number,
  ): void {
    this.currentCornerLift += (cornerLift - this.currentCornerLift) * 0.16;

    const showLeaf = active || this.currentCornerLift > 0.01;
    this.turningLeafMesh.visible = showLeaf && this.openAmount > 0.9;
    if (!this.turningLeafMesh.visible) return;

    const idx = Math.max(0, Math.min(this.textures.worldParchment.length - 1, worldTextureIndex));
    const tex = this.textures.worldParchment[idx];
    if (this.turningLeafMat.map !== tex) {
      this.turningLeafMat.map = tex;
      this.turningLeafMat.needsUpdate = true;
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

  public updateCandle(elapsed: number, nightFactor: number, weather: WeatherPreset): void {
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
