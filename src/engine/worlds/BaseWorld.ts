import * as THREE from 'three';
import {
  CreatureState,
  CrossWorldInfluence,
  MeridianQuestProgress,
  PlantedTreeState,
  PortalArchStyle,
  PortalLink,
  Vec2Point,
  WORLD_METADATA,
  WeatherPreset,
  WorldId,
  WorldState,
} from '../../types/atlas';
import { BOOK_BASE_Y } from '../BookAndDeskRig';

export interface PopupRig {
  id: string;
  label: string;
  group: THREE.Group;
  tabMesh: THREE.Mesh;
  tabBasePos: THREE.Vector3;
  tabPullDir: THREE.Vector3;
  currentRatio: number;
  targetRatio: number;
  hingedParts: { mesh: THREE.Object3D; closedRotX: number; openRotX: number }[];
}

export interface BridgeRig {
  id: string;
  label: string;
  group: THREE.Group;
  sealMesh: THREE.Mesh;
  slats: THREE.Mesh[];
  unfolded: boolean;
  progress: number;
}

export interface RiverRig {
  mesh: THREE.Mesh;
  beads: THREE.Mesh[];
  material: THREE.MeshStandardMaterial;
  uniforms: { uTime: { value: number }; uRain: { value: number } };
  points: Vec2Point[];
}

export interface ShipAgent {
  shipId: string;
  group: THREE.Group;
  sails: THREE.Mesh[];
  curve: THREE.CatmullRomCurve3;
  t: number;
  speed: number;
  routeLine: THREE.Line;
}

export interface ConstellationRig {
  nodes: THREE.Mesh[];
  positions: THREE.Vector3[];
  linesGroup: THREE.Group;
  selectedIndex: number | null;
  lastEdgeCount: number;
}

export interface CreatureAgent {
  state: CreatureState;
  group: THREE.Group;
  sealMesh: THREE.Mesh;
  wingsOrLimbs: THREE.Object3D[];
  glowParts: THREE.MeshStandardMaterial[];
  phase: number;
  baseCenter: THREE.Vector2;
  radius: number;
  unfoldProgress: number;
}

export interface HiddenLayerRig {
  id: string;
  label: string;
  lidPivot: THREE.Group;
  tabMesh: THREE.Mesh;
  chamberGroup: THREE.Group;
  revealed: boolean;
  openProgress: number;
}

export interface PortalRig {
  portal: PortalLink;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  gimbalRing: THREE.Mesh;
  irisPivots: THREE.Group[];
  veilMaterial: THREE.MeshStandardMaterial;
  veilUniforms: { uTime: { value: number }; uEnergy: { value: number } };
  keystoneMat: THREE.MeshStandardMaterial;
  hovered: boolean;
  activating: boolean;
  irisProgress: number;
}

/**
 * Shared BaseWorld scaffolding providing reusable 3-12 part paper-craft builders
 * and unified interactive rigging for all 10 systems.
 */
export abstract class BaseWorld {
  public readonly root = new THREE.Group();
  public readonly interactables: THREE.Object3D[] = [];
  public readonly portalHitMeshes: THREE.Object3D[] = [];

  protected popups: PopupRig[] = [];
  protected bridges: BridgeRig[] = [];
  protected riverRig: RiverRig | null = null;
  protected plantedTreeGroup = new THREE.Group();
  protected plantedTreeMeshes = new Map<string, { group: THREE.Group; plantedAt: number; targetScale: number }>();
  protected ships: ShipAgent[] = [];
  protected constellation: ConstellationRig | null = null;
  protected creatures: CreatureAgent[] = [];
  protected hiddenLayers: HiddenLayerRig[] = [];
  protected portals: PortalRig[] = [];
  protected illuminatedMaterials: THREE.MeshStandardMaterial[] = [];
  protected swayingParts: { obj: THREE.Object3D; phase: number; amp: number }[] = [];

  protected portalUniforms = {
    uPortalMorph: { value: 0.0 },
    uPortalDir: { value: -1.0 },
    uPortalOrigin: { value: new THREE.Vector3(0, 0.45, 0) },
  };
  private portalDeformAttached = new WeakSet<THREE.Material>();
  private worldFoldFactor = 1; // 1 = unfolded on open page, 0 = flattened during page turn

  constructor(
    public readonly worldId: WorldId,
    protected paperBump: THREE.Texture,
    protected contactShadowTex: THREE.Texture,
  ) {
    this.root.position.set(0, BOOK_BASE_Y, 0);
    this.root.add(this.plantedTreeGroup);
  }

  public abstract build(state: WorldState): void;

  protected attachPortalDeform(material: THREE.Material): void {
    if (this.portalDeformAttached.has(material)) return;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    this.portalDeformAttached.add(material);

    const prevOnBeforeCompile = material.onBeforeCompile;
    const prevKey = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () =>
      (prevKey ? `${prevKey()}-` : '') + 'portal-threshold-deform-v1';

    material.onBeforeCompile = (shader, renderer) => {
      if (prevOnBeforeCompile) {
        prevOnBeforeCompile.call(material, shader, renderer);
      }
      shader.uniforms.uPortalMorph = this.portalUniforms.uPortalMorph;
      shader.uniforms.uPortalDir = this.portalUniforms.uPortalDir;
      shader.uniforms.uPortalOrigin = this.portalUniforms.uPortalOrigin;

      shader.vertexShader =
        `
        uniform float uPortalMorph;
        uniform float uPortalDir;
        uniform vec3 uPortalOrigin;
        ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        if (uPortalMorph > 0.001) {
          vec4 wPos = modelMatrix * mvPosition;
          vec2 delta = wPos.xz - uPortalOrigin.xz;
          float dist = length(delta);
          float rNorm = clamp(dist / 4.4, 0.0, 1.0);
          float waveDelay = clamp(uPortalMorph * 1.32 - rNorm * 0.32, 0.0, 1.0);
          float pull = pow(waveDelay, 1.35);
          float angle = dist > 0.001 ? atan(delta.y, delta.x) : 0.0;
          float origamiPleat = sin(angle * 8.0 + uPortalMorph * 2.6) * 0.14 * rNorm * pull;
          float twist = uPortalDir * pull * (1.15 - rNorm * 0.5) * 1.45;
          float cs = cos(twist);
          float sn = sin(twist);
          vec2 spun = vec2(delta.x * cs - delta.y * sn, delta.x * sn + delta.y * cs);
          vec2 targetXZ = uPortalOrigin.xz + spun * (1.0 - pull * 0.86);
          float foldWeight = smoothstep(0.06, 0.55, rNorm);
          wPos.xz = mix(wPos.xz, targetXZ, pull * (0.28 + 0.72 * foldWeight));
          float funnelY = mix(wPos.y, 0.58 + rNorm * 0.64 + origamiPleat, pull * 0.84);
          wPos.y = mix(wPos.y, funnelY, pull * 0.84);
          float ringCrest = exp(-pow((dist - (1.0 - waveDelay) * 2.1) * 1.6, 2.0)) * 0.28 * sin(waveDelay * 3.14159);
          wPos.y += ringCrest;
          mvPosition = viewMatrix * wPos;
        } else {
          mvPosition = modelViewMatrix * mvPosition;
        }
        gl_Position = projectionMatrix * mvPosition;
        `,
      );
    };
    material.needsUpdate = true;
  }

  public setFoldFactor(factor: number): void {
    this.worldFoldFactor = Math.max(0.01, Math.min(1, factor));
    // Smoothly compress Y scale like a real pop-up spread closing between pages
    this.portalUniforms.uPortalMorph.value = 0;
    this.root.position.set(0, BOOK_BASE_Y, 0);
    this.root.scale.set(1, this.worldFoldFactor, 1);
    this.root.rotation.set(0, 0, 0);
    this.root.visible = factor > 0.02;
  }

  /**
   * Physically deforms the paper geometry of the world into a threshold vortex
   * anchored at the portal gate, creating a continuous origami Portal Entry.
   */
  public setPortalMorph(
    progress: number,
    phase: 'idle' | 'outgoing' | 'incoming',
    originX: number,
    originZ: number,
  ): void {
    if (phase === 'idle') {
      this.portalUniforms.uPortalMorph.value = 0;
      this.setFoldFactor(progress);
      return;
    }

    const clamped = Math.max(0, Math.min(1, progress));
    this.portalUniforms.uPortalOrigin.value.set(originX, BOOK_BASE_Y + 0.45, originZ);

    if (phase === 'outgoing') {
      this.portalUniforms.uPortalDir.value = -1.0;
      this.portalUniforms.uPortalMorph.value = clamped;
      const fold = 1 - clamped;
      const easedY = Math.max(0.03, Math.pow(fold, 1.2));
      const xz = 0.84 + 0.16 * fold;
      this.root.visible = fold > 0.015;
      this.root.scale.set(xz, easedY, xz);
      this.root.position.set(originX * (1 - xz), BOOK_BASE_Y, originZ * (1 - xz));
      this.root.rotation.x = -0.06 * clamped;
      this.portals.forEach((p) => {
        p.activating = true;
      });
    } else {
      const unfoldMorph = 1 - clamped;
      this.portalUniforms.uPortalDir.value = 1.0;
      this.portalUniforms.uPortalMorph.value = unfoldMorph;
      const overshoot = 1 - Math.pow(1 - clamped, 3) + Math.sin(clamped * Math.PI) * 0.05;
      const yScale = Math.max(0.03, Math.min(1.05, overshoot));
      const xz = 0.86 + 0.14 * Math.min(1, clamped * 1.15);
      this.root.visible = clamped > 0.015;
      this.root.scale.set(xz, yScale, xz);
      this.root.position.set(originX * (1 - xz), BOOK_BASE_Y, originZ * (1 - xz));
      this.root.rotation.x = 0.05 * (1 - clamped);
      this.portals.forEach((p) => {
        p.activating = clamped < 0.88;
      });
    }
  }

  protected makePaperMat(color: number, roughness = 0.84, metalness = 0.03): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color,
      bumpMap: this.paperBump,
      bumpScale: 0.008,
      roughness,
      metalness,
      side: THREE.DoubleSide,
    });
    this.attachPortalDeform(mat);
    return mat;
  }

  protected addGroundShadow(parent: THREE.Object3D, radius: number, opacity = 0.38): void {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, radius * 2),
      new THREE.MeshBasicMaterial({
        map: this.contactShadowTex,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.006;
    parent.add(shadow);
  }

  /**
   * Builds a composite 4-7 part paper tree grounded at bottom-center (y=0).
   */
  public createPaperTree(
    species: PlantedTreeState['species'],
    scale = 1,
  ): THREE.Group {
    const g = new THREE.Group();
    const trunkMat = this.makePaperMat(
      species === 'crystal' || species === 'prism'
        ? 0x675b78
        : species === 'blossom'
          ? 0x5d433b
          : species === 'icepine'
            ? 0x485869
            : species === 'emberfern'
              ? 0x3b2824
              : 0x5c422c,
      0.86,
      species === 'crystal' || species === 'prism' || species === 'goldlotus' ? 0.35 : 0.02,
    );

    if (species === 'pine' || species === 'cypress' || species === 'icepine') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.055, 0.24, 6), trunkMat);
      trunk.position.y = 0.12;
      trunk.castShadow = true;
      g.add(trunk);

      const foliageColor =
        species === 'icepine' ? 0xcde3f0 : species === 'pine' ? 0x3b6e4c : 0x366454;
      const tierCount = species === 'cypress' ? 4 : 3;
      for (let i = 0; i < tierCount; i++) {
        const coneMat = this.makePaperMat(
          new THREE.Color(foliageColor).offsetHSL(0, 0, i * 0.03).getHex(),
          0.8,
        );
        const r = species === 'cypress' ? 0.16 - i * 0.028 : 0.26 - i * 0.055;
        const h = species === 'cypress' ? 0.28 : 0.3;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), coneMat);
        cone.position.y = 0.26 + i * (species === 'cypress' ? 0.16 : 0.18);
        cone.rotation.y = i * 0.5;
        cone.castShadow = true;
        cone.receiveShadow = true;
        g.add(cone);
      }
    } else if (species === 'oak' || species === 'blossom' || species === 'skybloom') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.06, 0.34, 6), trunkMat);
      trunk.position.y = 0.17;
      trunk.castShadow = true;
      g.add(trunk);

      const leafHex =
        species === 'blossom' ? 0xe5a4b2 : species === 'skybloom' ? 0xe8d59a : 0x558447;
      const accentHex =
        species === 'blossom' ? 0xf6d1da : species === 'skybloom' ? 0xf8eed0 : 0x74a357;
      const clusters = [
        [0, 0.45, 0, 0.2, leafHex],
        [-0.12, 0.38, 0.08, 0.14, accentHex],
        [0.13, 0.4, -0.07, 0.15, accentHex],
        [0.02, 0.54, 0.04, 0.13, accentHex],
      ] as const;
      clusters.forEach(([cx, cy, cz, r, col]) => {
        const puff = new THREE.Mesh(
          new THREE.DodecahedronGeometry(r, 0),
          this.makePaperMat(col, 0.82),
        );
        puff.position.set(cx, cy, cz);
        puff.castShadow = true;
        g.add(puff);
      });
    } else if (species === 'palm' || species === 'emberfern') {
      for (let s = 0; s < 4; s++) {
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032 - s * 0.004, 0.04 - s * 0.004, 0.16, 6),
          trunkMat,
        );
        seg.position.set(s * 0.025, 0.08 + s * 0.14, 0);
        seg.rotation.z = -0.08 * s;
        seg.castShadow = true;
        g.add(seg);
      }
      const frondMat = this.makePaperMat(
        species === 'emberfern' ? 0xd95f34 : 0x5f8f4e,
        0.74,
      );
      for (let f = 0; f < 5; f++) {
        const ang = (f / 5) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 3), frondMat);
        frond.position.set(0.08 + Math.cos(ang) * 0.18, 0.56, Math.sin(ang) * 0.18);
        frond.rotation.z = -Math.PI / 2.6;
        frond.rotation.y = -ang;
        frond.castShadow = true;
        g.add(frond);
      }
    } else if (species === 'mushroom') {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.065, 0.34, 8),
        this.makePaperMat(0xdcd3e8, 0.86),
      );
      stalk.position.y = 0.17;
      stalk.castShadow = true;
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x8e6be0,
        emissive: 0x452898,
        emissiveIntensity: 0.6,
        roughness: 0.45,
      });
      this.illuminatedMaterials.push(capMat);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 10), capMat);
      cap.position.y = 0.39;
      cap.castShadow = true;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 6, 12), capMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.31;
      g.add(stalk, cap, rim);
    } else if (species === 'coral' || species === 'goldlotus') {
      const isLotus = species === 'goldlotus';
      const petalMat = new THREE.MeshStandardMaterial({
        color: isLotus ? 0xf2c96d : 0xef7b78,
        emissive: isLotus ? 0x996b18 : 0x542230,
        emissiveIntensity: isLotus ? 0.5 : 0.35,
        roughness: isLotus ? 0.3 : 0.6,
        metalness: isLotus ? 0.72 : 0.05,
      });
      this.illuminatedMaterials.push(petalMat);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const arm = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.34, 5), petalMat);
        arm.position.set(Math.cos(a) * 0.11, 0.19, Math.sin(a) * 0.11);
        arm.rotation.z = -Math.cos(a) * 0.48;
        arm.rotation.x = Math.sin(a) * 0.48;
        arm.castShadow = true;
        g.add(arm);
      }
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), petalMat);
      core.position.y = 0.22;
      g.add(core);
    } else {
      // Crystal / Prism faceted spire cluster
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.06, 6), trunkMat);
      base.position.y = 0.03;
      g.add(base);
      const crysMat = new THREE.MeshPhysicalMaterial({
        color: species === 'prism' ? 0xd2b3f5 : 0x7ce5dc,
        emissive: species === 'prism' ? 0x5c3c94 : 0x1c7072,
        emissiveIntensity: 0.48,
        roughness: 0.16,
        metalness: 0.18,
        clearcoat: 1.0,
      });
      this.illuminatedMaterials.push(crysMat);
      const spires = [
        [0, 0.28, 0, 0.07, 0.48, 0, 0],
        [-0.08, 0.18, 0.05, 0.045, 0.28, 0.2, 0.3],
        [0.09, 0.2, -0.04, 0.05, 0.32, -0.25, -0.2],
      ];
      spires.forEach(([sx, sy, sz, r, h, rx, rz]) => {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), crysMat);
        sp.position.set(sx, sy, sz);
        sp.rotation.set(rx, 0, rz);
        sp.castShadow = true;
        g.add(sp);
      });
    }

    this.addGroundShadow(g, 0.24);
    g.scale.setScalar(scale);
    this.swayingParts.push({ obj: g, phase: Math.random() * Math.PI * 2, amp: 0.05 });
    return g;
  }

  /**
   * Builds a composite paper pop-up pull tab on the page margin linked to hinged structures.
   */
  protected registerPopupRig(
    id: string,
    label: string,
    group: THREE.Group,
    tabPos: THREE.Vector3,
    tabPullDir: THREE.Vector3,
    hingedParts: { mesh: THREE.Object3D; closedRotX: number; openRotX: number }[],
    initialRatio: number,
  ): void {
    const tabMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.05, 0.26),
      new THREE.MeshStandardMaterial({
        color: 0xd4af6e,
        roughness: 0.35,
        metalness: 0.7,
      }),
    );
    tabMesh.position.copy(tabPos).addScaledVector(tabPullDir, initialRatio * 0.45);
    tabMesh.castShadow = true;
    tabMesh.userData = {
      interactionType: 'popupTab',
      worldId: this.worldId,
      popupId: id,
      label,
      category: 'Pop-Up Tab',
      hint: 'Click or drag horizontally to fold or raise',
    };

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.015, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xf4ecdc, roughness: 0.3, metalness: 0.85 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(tabPullDir.x * 0.16, 0.03, tabPullDir.z * 0.08);
    tabMesh.add(ring);

    this.root.add(tabMesh);
    this.interactables.push(tabMesh);

    this.popups.push({
      id,
      label,
      group,
      tabMesh,
      tabBasePos: tabPos.clone(),
      tabPullDir: tabPullDir.clone().normalize(),
      currentRatio: initialRatio,
      targetRatio: initialRatio,
      hingedParts,
    });
  }

  /**
   * Builds an accordion-pleated folding paper bridge spanning between two points.
   */
  protected buildFoldingBridge(
    id: string,
    label: string,
    start: THREE.Vector3,
    end: THREE.Vector3,
    unfolded: boolean,
  ): void {
    const group = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const angle = Math.atan2(dir.x, dir.z);

    group.position.copy(start);
    group.rotation.y = angle;

    const slatCount = 8;
    const slats: THREE.Mesh[] = [];
    const woodPaperMat = this.makePaperMat(0xb88b58, 0.78);
    const railMat = this.makePaperMat(0xd4af6e, 0.5, 0.35);

    for (let i = 0; i < slatCount; i++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.035, len / slatCount - 0.015),
        woodPaperMat,
      );
      slat.castShadow = true;
      slat.receiveShadow = true;

      // Miniature side railings
      const railL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.09, len / slatCount), railMat);
      railL.position.set(-0.15, 0.05, 0);
      const railR = railL.clone();
      railR.position.x = 0.15;
      slat.add(railL, railR);

      group.add(slat);
      slats.push(slat);
    }

    // Bridge wax/brass toggle seal at start abutment
    const sealMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.06, 12),
      new THREE.MeshStandardMaterial({
        color: unfolded ? 0x5c8f58 : 0xb8433e,
        roughness: 0.4,
        metalness: 0.3,
      }),
    );
    sealMesh.position.set(0, 0.06, -0.14);
    sealMesh.castShadow = true;
    sealMesh.userData = {
      interactionType: 'bridgeSeal',
      worldId: this.worldId,
      bridgeId: id,
      label,
      category: 'Folding Bridge',
      hint: 'Click seal to accordion-unfold or retract span',
    };
    group.add(sealMesh);
    this.interactables.push(sealMesh);
    this.root.add(group);

    this.bridges.push({
      id,
      label,
      group,
      sealMesh,
      slats,
      unfolded,
      progress: unfolded ? 1 : 0,
    });
  }

  /**
   * Builds and updates the dynamic navigable river/channel/aqueduct ribbon.
   */
  protected buildRiverSystem(points: Vec2Point[], waterHex: number, width = 0.44): void {
    const uniforms = {
      uTime: { value: 0 },
      uRain: { value: 0 },
    };

    const mat = new THREE.MeshPhysicalMaterial({
      color: waterHex,
      roughness: 0.16,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uRain = uniforms.uRain;
      shader.vertexShader =
        `
        uniform float uTime;
        uniform float uRain;
        ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float wave = sin(position.x * 5.0 + uTime * 2.6) * cos(position.z * 4.5 - uTime * 2.1);
        float rainRipple = sin(length(position.xz) * 18.0 - uTime * 7.5) * uRain;
        transformed.y += wave * 0.012 + rainRipple * 0.01;
        `,
      );
    };
    this.attachPortalDeform(mat);

    const geo = this.createRibbonGeometry(points, width);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.025;
    mesh.receiveShadow = true;
    mesh.userData = { interactionType: 'waterSurface', worldId: this.worldId };
    this.root.add(mesh);

    const beads: THREE.Mesh[] = [];
    const beadGeo = new THREE.OctahedronGeometry(0.12, 0);
    points.forEach((pt, idx) => {
      const beadMat = new THREE.MeshStandardMaterial({
        color: 0x76d1e8,
        emissive: 0x1b6d85,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.35,
      });
      const bead = new THREE.Mesh(beadGeo, beadMat);
      bead.position.set(pt.x, 0.16, pt.z);
      bead.castShadow = true;
      bead.userData = {
        interactionType: 'riverBead',
        worldId: this.worldId,
        beadIndex: idx,
        label: `Channel Node ${idx + 1}`,
        category: 'River Bed',
        hint: 'Drag control bead to reshape the channel flow',
      };
      this.root.add(bead);
      this.interactables.push(bead);
      beads.push(bead);
    });

    this.riverRig = {
      mesh,
      beads,
      material: mat,
      uniforms,
      points: points.map((p) => ({ ...p })),
    };
  }

  private createRibbonGeometry(points: Vec2Point[], width: number): THREE.BufferGeometry {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(p.x, 0, p.z)),
    );
    const segs = 48;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normalX = -tangent.z;
      const normalZ = tangent.x;
      const w = width * (0.75 + 0.35 * Math.sin(t * Math.PI));

      positions.push(pt.x - normalX * w * 0.5, 0, pt.z - normalZ * w * 0.5);
      positions.push(pt.x + normalX * w * 0.5, 0, pt.z + normalZ * w * 0.5);
      uvs.push(0, t * 4, 1, t * 4);

      if (i < segs) {
        const b = i * 2;
        indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  public updateRiverPoints(points: Vec2Point[]): void {
    if (!this.riverRig) return;
    this.riverRig.points = points.map((p) => ({ ...p }));
    const oldGeo = this.riverRig.mesh.geometry;
    const width = this.worldId === 1 ? 0.62 : this.worldId === 2 ? 0.36 : 0.44;
    this.riverRig.mesh.geometry = this.createRibbonGeometry(points, width);
    oldGeo.dispose();

    points.forEach((pt, idx) => {
      if (this.riverRig!.beads[idx]) {
        this.riverRig!.beads[idx].position.set(pt.x, 0.16, pt.z);
      }
    });
  }

  /**
   * Builds a multi-part origami sailing vessel (hull + deck + mast + fluttering paper sails).
   */
  protected addShipAgent(
    shipId: string,
    routePoints: Vec2Point[],
    style: 'galleon' | 'sloop' | 'skiff',
    speed = 0.08,
  ): void {
    const group = new THREE.Group();
    const hullMat = this.makePaperMat(style === 'skiff' ? 0xc99c58 : 0x6b472b, 0.72);
    const sailMat = this.makePaperMat(style === 'skiff' ? 0xf5e5bd : 0xfaf4e6, 0.85);
    const trimMat = this.makePaperMat(style === 'galleon' ? 0xb8433e : 0xd4af6e, 0.5, 0.35);

    // Origami faceted hull
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.06, style === 'galleon' ? 0.56 : 0.42, 4),
      hullMat,
    );
    hull.rotation.x = Math.PI / 2;
    hull.rotation.z = Math.PI / 4;
    hull.scale.set(1.1, 1, 0.65);
    hull.position.y = 0.06;
    hull.castShadow = true;
    group.add(hull);

    // Prow ornament
    const prow = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), trimMat);
    prow.rotation.x = Math.PI / 2;
    prow.position.set(0, 0.09, style === 'galleon' ? 0.32 : 0.24);
    group.add(prow);

    // Mast & Paper Sails
    const sails: THREE.Mesh[] = [];
    const mastH = style === 'galleon' ? 0.54 : 0.38;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, mastH, 6), hullMat);
    mast.position.set(0, 0.08 + mastH / 2, 0);
    group.add(mast);

    const mainSail = new THREE.Mesh(
      new THREE.PlaneGeometry(style === 'galleon' ? 0.3 : 0.22, mastH * 0.72, 4, 4),
      sailMat,
    );
    mainSail.position.set(0, 0.14 + mastH * 0.45, 0.03);
    mainSail.castShadow = true;
    group.add(mainSail);
    sails.push(mainSail);

    if (style === 'galleon') {
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 3), trimMat);
      pennant.rotation.x = -Math.PI / 2;
      pennant.position.set(0, 0.08 + mastH, -0.06);
      group.add(pennant);
      sails.push(pennant);
    }

    this.addGroundShadow(group, 0.24, 0.28);
    this.root.add(group);

    const curve = new THREE.CatmullRomCurve3(
      routePoints.map((p) => new THREE.Vector3(p.x, 0.04, p.z)),
      false,
    );
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xd4af6e,
      dashSize: 0.14,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.55,
    });
    const routeLine = new THREE.Line(lineGeo, lineMat);
    routeLine.computeLineDistances();
    this.root.add(routeLine);

    this.ships.push({
      shipId,
      group,
      sails,
      curve,
      t: Math.random(),
      speed,
      routeLine,
    });
  }

  public updateShipRoute(shipId: string, points: Vec2Point[]): void {
    const agent = this.ships.find((s) => s.shipId === shipId) ?? this.ships[0];
    if (!agent || points.length < 2) return;
    agent.curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(p.x, 0.04, p.z)),
      false,
    );
    agent.routeLine.geometry.dispose();
    agent.routeLine.geometry = new THREE.BufferGeometry().setFromPoints(agent.curve.getPoints(40));
    agent.routeLine.computeLineDistances();
  }

  /**
   * Builds sky-dome constellation star pins above the diorama.
   */
  protected buildConstellationNodes(coords: [number, number, number][]): void {
    const nodes: THREE.Mesh[] = [];
    const positions: THREE.Vector3[] = [];
    const starGeo = new THREE.OctahedronGeometry(0.11, 0);

    coords.forEach(([x, y, z], index) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf9e3a4,
        emissive: 0xe6b84c,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.5,
      });
      const star = new THREE.Mesh(starGeo, mat);
      star.position.set(x, y, z);
      star.userData = {
        interactionType: 'starNode',
        worldId: this.worldId,
        starIndex: index,
        label: `Star Pin ${index + 1}`,
        category: 'Constellation',
        hint: 'Click star pins to weave celestial threads',
      };
      this.root.add(star);
      this.interactables.push(star);
      nodes.push(star);
      positions.push(new THREE.Vector3(x, y, z));
    });

    const linesGroup = new THREE.Group();
    this.root.add(linesGroup);

    this.constellation = {
      nodes,
      positions,
      linesGroup,
      selectedIndex: null,
      lastEdgeCount: -1,
    };
  }

  public syncConstellationEdges(state: WorldState): void {
    if (!this.constellation) return;
    if (this.constellation.lastEdgeCount === state.constellationEdges.length) return;
    this.constellation.lastEdgeCount = state.constellationEdges.length;

    while (this.constellation.linesGroup.children.length > 0) {
      const child = this.constellation.linesGroup.children[0] as THREE.Line;
      child.geometry.dispose();
      this.constellation.linesGroup.remove(child);
    }

    const lineMat = new THREE.LineBasicMaterial({
      color: state.constellationComplete ? 0xffeb9c : 0xd4af6e,
      transparent: true,
      opacity: state.constellationComplete ? 0.95 : 0.78,
    });

    state.constellationEdges.forEach(({ from, to }) => {
      const pA = this.constellation!.positions[from];
      const pB = this.constellation!.positions[to];
      if (!pA || !pB) return;
      const geo = new THREE.BufferGeometry().setFromPoints([pA, pB]);
      this.constellation!.linesGroup.add(new THREE.Line(geo, lineMat));
    });
  }

  /**
   * Builds a composite origami creature + clickable crimson wax seal.
   */
  protected addCreatureWithSeal(
    cState: CreatureState,
    sealPos: THREE.Vector3,
    patrolCenter: THREE.Vector2,
    patrolRadius: number,
  ): void {
    // Wax seal on parchment
    const sealMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.19, 0.045, 14),
      new THREE.MeshStandardMaterial({
        color: cState.summoned ? 0xc8633b : 0x9b2e2a,
        emissive: 0x3a0f0e,
        emissiveIntensity: 0.35,
        roughness: 0.38,
        metalness: 0.15,
      }),
    );
    sealMesh.position.copy(sealPos);
    sealMesh.castShadow = true;
    sealMesh.userData = {
      interactionType: 'creatureSeal',
      worldId: this.worldId,
      creatureId: cState.id,
      label: cState.label,
      category: 'Origami Wax Seal',
      hint: cState.summoned ? 'Click to dismiss creature' : 'Click seal to unfold creature',
    };
    this.root.add(sealMesh);
    this.interactables.push(sealMesh);

    // Origami Creature Group (4-7 parts)
    const group = new THREE.Group();
    const wingsOrLimbs: THREE.Object3D[] = [];
    const glowParts: THREE.MeshStandardMaterial[] = [];

    const bodyColorMap: Record<string, number> = {
      stag: 0xc49c68,
      owl: 0xa48562,
      fox: 0xd6743c,
      fennec: 0xd6743c,
      gull: 0xf4f0e6,
      whale: 0x4c7c94,
      crab: 0xc7543c,
      scarab: 0xc49f46,
      phoenix: 0xf2a541,
      wolf: 0xdbe6ef,
      moth: 0x9eb8e6,
      manta: 0x4b9aa8,
      jellyfish: 0x7ae2dc,
      serpent: 0x3b8a82,
      salamander: 0xe66532,
      beetle: 0xc99640,
      hawk: 0x8e6b4a,
      finch: 0xe2bc5d,
      heron: 0xded9ee,
      turtle: 0x829bb8,
      gryphon: 0xe6be63,
    };
    const bodyColor = bodyColorMap[cState.kind] ?? 0xd4af6e;

    const bodyMat = this.makePaperMat(
      bodyColor,
      0.65,
      cState.kind === 'scarab' || cState.kind === 'beetle' || cState.kind === 'gryphon' ? 0.6 : 0.08,
    );
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffdf7a,
      emissive: 0xffaa2a,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    glowParts.push(eyeMat);

    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 4), bodyMat);
    torso.rotation.x = Math.PI / 2;
    torso.position.y = 0.12;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), bodyMat);
    head.position.set(0, 0.17, 0.12);
    head.castShadow = true;
    group.add(head);

    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 3), eyeMat);
    crest.position.set(0, 0.23, 0.11);
    group.add(crest);

    const isWinged =
      cState.kind === 'owl' ||
      cState.kind === 'gull' ||
      cState.kind === 'phoenix' ||
      cState.kind === 'moth' ||
      cState.kind === 'manta' ||
      cState.kind === 'jellyfish' ||
      cState.kind === 'hawk' ||
      cState.kind === 'finch' ||
      cState.kind === 'heron' ||
      cState.kind === 'gryphon';

    // Wings / Legs
    if (isWinged) {
      const wingGeo = new THREE.PlaneGeometry(0.24, 0.11);
      const wingL = new THREE.Mesh(wingGeo, bodyMat);
      wingL.position.set(-0.12, 0.14, 0);
      const wingR = new THREE.Mesh(wingGeo, bodyMat);
      wingR.position.set(0.12, 0.14, 0);
      group.add(wingL, wingR);
      wingsOrLimbs.push(wingL, wingR);
    } else {
      for (const lx of [-0.05, 0.05]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.11, 0.025), bodyMat);
        leg.position.set(lx, 0.055, 0.05);
        group.add(leg);
        wingsOrLimbs.push(leg);
      }
    }

    this.addGroundShadow(group, 0.16, 0.3);
    group.position.set(sealPos.x, 0, sealPos.z);
    this.root.add(group);

    this.creatures.push({
      state: cState,
      group,
      sealMesh,
      wingsOrLimbs,
      glowParts,
      phase: Math.random() * Math.PI * 2,
      baseCenter: patrolCenter,
      radius: patrolRadius,
      unfoldProgress: cState.summoned ? 1 : 0,
    });
  }

  /**
   * Builds a stepped paper plateau with a liftable hinged lid revealing a recessed underground chamber.
   */
  protected addHiddenLayerPlateau(
    id: string,
    label: string,
    center: THREE.Vector3,
    width: number,
    depth: number,
    lidColor: number,
    chamberAccentHex: number,
    revealed: boolean,
  ): void {
    const height = 0.16;
    const frameGroup = new THREE.Group();
    frameGroup.position.set(center.x, 0, center.z);

    const wallMat = this.makePaperMat(lidColor, 0.85);
    const floorMat = this.makePaperMat(0x211b1e, 0.9);
    const glowMat = new THREE.MeshStandardMaterial({
      color: chamberAccentHex,
      emissive: chamberAccentHex,
      emissiveIntensity: 0.95,
      roughness: 0.25,
    });
    this.illuminatedMaterials.push(glowMat);

    // 4 raised paper walls framing the recessed subterranean cavity
    const wt = 0.12;
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(width, height, wt), wallMat);
    wallN.position.set(0, height / 2, -depth / 2 + wt / 2);
    const wallS = wallN.clone();
    wallS.position.z = depth / 2 - wt / 2;
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(wt, height, depth - wt * 2), wallMat);
    wallW.position.set(-width / 2 + wt / 2, height / 2, 0);
    const wallE = wallW.clone();
    wallE.position.x = width / 2 - wt / 2;
    frameGroup.add(wallN, wallS, wallW, wallE);

    // Subterranean chamber floor + glowing crystal pillars/artifacts inside
    const chamberGroup = new THREE.Group();
    const subFloor = new THREE.Mesh(new THREE.PlaneGeometry(width - wt * 1.6, depth - wt * 1.6), floorMat);
    subFloor.rotation.x = -Math.PI / 2;
    subFloor.position.y = 0.025;
    chamberGroup.add(subFloor);

    for (let i = 0; i < 4; i++) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), glowMat);
      crystal.position.set((i - 1.5) * 0.24, 0.08, Math.sin(i * 1.7) * 0.18);
      chamberGroup.add(crystal);
    }
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.08, 6), glowMat);
    altar.position.set(0, 0.06, 0);
    chamberGroup.add(altar);

    frameGroup.add(chamberGroup);

    // Hinged terrain lid pivoted along back edge (-Z)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, height, -depth / 2);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), wallMat);
    lid.position.set(0, 0.02, depth / 2);
    lid.castShadow = true;
    lid.receiveShadow = true;
    lid.userData = {
      interactionType: 'hiddenLayer',
      worldId: this.worldId,
      layerId: id,
      label,
      category: 'Subterranean Vault',
      hint: 'Click flap to open or seal hidden chamber',
    };

    const tabMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.04, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xd4af6e, roughness: 0.35, metalness: 0.72 }),
    );
    tabMesh.position.set(0, 0.045, depth - 0.06);
    tabMesh.userData = {
      interactionType: 'hiddenLayer',
      worldId: this.worldId,
      layerId: id,
      label,
      category: 'Subterranean Vault',
      hint: 'Click tab to lift hinged paper terrain',
    };

    lidPivot.add(lid, tabMesh);
    frameGroup.add(lidPivot);
    this.root.add(frameGroup);
    this.interactables.push(lid, tabMesh);

    this.hiddenLayers.push({
      id,
      label,
      lidPivot,
      tabMesh,
      chamberGroup,
      revealed,
      openProgress: revealed ? 1 : 0,
    });
  }

  /**
   * Builds a composite 10-part paper-engineered Portal Landmark with articulated
   * origami iris blades and a destination-tinted shimmering veil.
   */
  protected buildPortalLandmark(portal: PortalLink): void {
    const paletteMap: Record<PortalArchStyle, { stone: number; trim: number }> = {
      stone: { stone: 0x85947a, trim: 0xd4af6e },
      maritime: { stone: 0xbcb39e, trim: 0xd4af6e },
      sun: { stone: 0xd8b176, trim: 0xffe08a },
      glacial: { stone: 0xc8dfee, trim: 0x92d8f8 },
      coral: { stone: 0xc2d8d4, trim: 0x56dfd2 },
      basalt: { stone: 0x453534, trim: 0xf08243 },
      brass: { stone: 0xd9cfb6, trim: 0xd4af6e },
      mycelium: { stone: 0x5c4782, trim: 0xa68ef2 },
      prism: { stone: 0xe6dff4, trim: 0xd4af6e },
      meridian: { stone: 0x3b2c22, trim: 0xf2c96a },
    };

    const pal = paletteMap[portal.archStyle];
    const destMeta = WORLD_METADATA[portal.targetWorld];
    const destHex = new THREE.Color(destMeta.accentHex).getHex();

    const group = new THREE.Group();
    const baseY = this.worldId === 1 ? 0.09 : 0.015;
    group.position.set(portal.x, baseY, portal.z);
    group.rotation.y = portal.rotationY;

    const stoneMat = this.makePaperMat(pal.stone, 0.82, 0.05);
    const trimMat = new THREE.MeshStandardMaterial({
      color: pal.trim,
      roughness: 0.28,
      metalness: 0.82,
    });

    // 1. Stepped octagonal plinth grounded at y=0
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 0.07, 8), stoneMat);
    plinth.position.y = 0.035;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    const floorRing = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.36, 20),
      new THREE.MeshBasicMaterial({
        color: destHex,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.073;
    group.add(floorRing);

    // 2. Twin fluted pillars + capitals
    for (const px of [-0.32, 0.32]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.68, 6), stoneMat);
      pillar.position.set(px, 0.4, 0);
      pillar.castShadow = true;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.16), trimMat);
      cap.position.set(px, 0.76, 0);
      cap.castShadow = true;
      group.add(pillar, cap);
    }

    // 3. Arched lintel & keystone crystal
    const archMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.065, 8, 20, Math.PI),
      stoneMat,
    );
    archMesh.position.y = 0.75;
    archMesh.castShadow = true;
    group.add(archMesh);

    const keystoneMat = new THREE.MeshStandardMaterial({
      color: destHex,
      emissive: destHex,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.3,
    });
    this.illuminatedMaterials.push(keystoneMat);
    const keystone = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), keystoneMat);
    keystone.position.set(0, 1.12, 0.02);
    keystone.castShadow = true;
    group.add(keystone);

    // 4. Rotating brass gimbal ring framing the portal opening
    const gimbalRing = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.018, 8, 28), trimMat);
    gimbalRing.position.set(0, 0.62, 0);
    for (let s = 0; s < 4; s++) {
      const stud = new THREE.Mesh(new THREE.OctahedronGeometry(0.028, 0), trimMat);
      const a = (s / 4) * Math.PI * 2;
      stud.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0);
      gimbalRing.add(stud);
    }
    group.add(gimbalRing);

    // 5. Shimmering portal threshold veil (custom GLSL ripple via onBeforeCompile)
    const veilUniforms = {
      uTime: { value: 0 },
      uEnergy: { value: 0.35 },
    };
    const veilMaterial = new THREE.MeshStandardMaterial({
      color: destHex,
      emissive: destHex,
      emissiveIntensity: 0.75,
      roughness: 0.12,
      metalness: 0.2,
      transparent: true,
      opacity: 0.64,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    veilMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = veilUniforms.uTime;
      shader.uniforms.uEnergy = veilUniforms.uEnergy;
      shader.vertexShader =
        `
        uniform float uTime;
        uniform float uEnergy;
        ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float r = length(position.xy);
        transformed.z += sin(r * 24.0 - uTime * 4.5) * 0.018 * uEnergy;
        `,
      );
    };
    const veil = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), veilMaterial);
    veil.position.set(0, 0.62, 0);
    group.add(veil);

    // 6. Six articulated origami iris petals that physically part open on hover/activation
    const irisPivots: THREE.Group[] = [];
    const petalMat = this.makePaperMat(0xf4ecdc, 0.72, 0.12);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.position.set(Math.cos(angle) * 0.24, 0.62 + Math.sin(angle) * 0.24, 0.025);
      pivot.rotation.z = angle + Math.PI / 2;

      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.21, 3), petalMat);
      blade.position.y = -0.095;
      blade.rotation.x = Math.PI;
      blade.scale.set(1, 1, 0.25);
      pivot.add(blade);
      group.add(pivot);
      irisPivots.push(pivot);
    }

    // 7. Generous invisible click/hover hitbox
    const hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 1.15, 0.56),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitMesh.position.set(0, 0.58, 0);
    hitMesh.userData = {
      interactionType: 'portalLandmark',
      worldId: this.worldId,
      portalId: portal.id,
      targetWorld: portal.targetWorld,
      portal,
      label: portal.label,
      category: `Portal → Folio ${WORLD_METADATA[portal.targetWorld].roman}`,
      hint: `Click gate to cross into ${WORLD_METADATA[portal.targetWorld].title}`,
    };
    group.add(hitMesh);

    this.addGroundShadow(group, 0.56, 0.36);
    this.root.add(group);
    this.interactables.push(hitMesh);
    this.portalHitMeshes.push(hitMesh);

    this.portals.push({
      portal,
      group,
      hitMesh,
      gimbalRing,
      irisPivots,
      veilMaterial,
      veilUniforms,
      keystoneMat,
      hovered: false,
      activating: false,
      irisProgress: 0.22,
    });
  }

  public setPortalHovered(portalId: string | null): void {
    this.portals.forEach((p) => {
      p.hovered = portalId !== null && p.portal.id === portalId;
    });
  }

  public getPortalInteractables(): THREE.Object3D[] {
    return this.portalHitMeshes;
  }

  public syncState(state: WorldState, elapsed: number): void {
    if (this.portals.length === 0) {
      this.buildPortalLandmark(WORLD_METADATA[this.worldId].portal);
    }
    // Ensure all bespoke chapter paper, crystal, metal, and instanced materials share threshold deformation
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m && !this.portalDeformAttached.has(m)) {
            this.attachPortalDeform(m);
          }
        });
      }
    });
    // Sync pop-ups
    state.popups.forEach((p) => {
      const rig = this.popups.find((r) => r.id === p.id);
      if (rig) rig.targetRatio = p.pullRatio;
    });

    // Sync bridges
    state.bridges.forEach((b) => {
      const rig = this.bridges.find((r) => r.id === b.id);
      if (rig) rig.unfolded = b.unfolded;
    });

    // Sync planted trees
    const activeIds = new Set(state.plantedTrees.map((t) => t.id));
    this.plantedTreeMeshes.forEach((entry, id) => {
      if (!activeIds.has(id)) {
        this.plantedTreeGroup.remove(entry.group);
        this.plantedTreeMeshes.delete(id);
      }
    });
    state.plantedTrees.forEach((tree) => {
      if (!this.plantedTreeMeshes.has(tree.id)) {
        const mesh = this.createPaperTree(tree.species, 1);
        mesh.position.set(tree.x, 0.01, tree.z);
        mesh.rotation.y = tree.rotation;
        mesh.scale.setScalar(0.01);
        this.plantedTreeGroup.add(mesh);
        this.plantedTreeMeshes.set(tree.id, {
          group: mesh,
          plantedAt: tree.plantedAt < 0 ? -10 : elapsed,
          targetScale: tree.scale,
        });
      }
    });

    // Sync constellations
    this.syncConstellationEdges(state);

    // Sync creatures
    state.creatures.forEach((c) => {
      const agent = this.creatures.find((a) => a.state.id === c.id);
      if (agent) {
        agent.state = c;
        (agent.sealMesh.material as THREE.MeshStandardMaterial).color.setHex(
          c.summoned ? 0xc8633b : 0x9b2e2a,
        );
      }
    });

    // Sync hidden layers
    state.hiddenLayers.forEach((hl) => {
      const rig = this.hiddenLayers.find((r) => r.id === hl.id);
      if (rig) rig.revealed = hl.revealed;
    });
  }

  public update(
    dt: number,
    elapsed: number,
    nightFactor: number,
    weather: WeatherPreset,
    constellationToolActive: boolean,
    influence?: CrossWorldInfluence,
    quest?: MeridianQuestProgress,
  ): void {
    const damp = 1 - Math.exp(-8 * dt);

    // 1. Pop-up hinge animations & margin pull tabs
    this.popups.forEach((rig) => {
      rig.currentRatio += (rig.targetRatio - rig.currentRatio) * damp;
      rig.tabMesh.position
        .copy(rig.tabBasePos)
        .addScaledVector(rig.tabPullDir, rig.currentRatio * 0.45);
      rig.hingedParts.forEach(({ mesh, closedRotX, openRotX }) => {
        mesh.rotation.x = THREE.MathUtils.lerp(closedRotX, openRotX, rig.currentRatio);
      });
    });

    // 2. Accordion folding bridges
    this.bridges.forEach((bridge) => {
      const target = bridge.unfolded ? 1 : 0;
      bridge.progress += (target - bridge.progress) * damp;
      const total = bridge.slats.length;
      const spanLen = 1.15;
      bridge.slats.forEach((slat, i) => {
        const frac = (i + 0.5) / total;
        slat.position.z = frac * spanLen * bridge.progress;
        slat.position.y = Math.sin(frac * Math.PI) * 0.08 * bridge.progress + (1 - bridge.progress) * 0.02 * i;
        slat.rotation.x = (1 - bridge.progress) * (i % 2 === 0 ? 1.35 : -1.35);
      });
      (bridge.sealMesh.material as THREE.MeshStandardMaterial).color.setHex(
        bridge.unfolded ? 0x5c8f58 : 0xb8433e,
      );
    });

    // 3. River water ripples & raindrop response
    if (this.riverRig) {
      this.riverRig.uniforms.uTime.value = elapsed;
      this.riverRig.uniforms.uRain.value =
        weather === 'rain' ? 0.85 : weather === 'thunderstorm' ? 1.25 : 0;
    }

    // 4. Planted tree sprouting growth
    this.plantedTreeMeshes.forEach((entry) => {
      const age = entry.plantedAt < 0 ? 10 : Math.max(0, elapsed - entry.plantedAt);
      const growth = Math.min(1, age / 1.35);
      const eased = 1 - Math.pow(1 - growth, 3);
      entry.group.scale.setScalar(Math.max(0.01, eased * entry.targetScale));
    });

    // 5. Wind sway on foliage, sails, flags
    const windStrength =
      weather === 'windy'
        ? 1.8
        : weather === 'thunderstorm'
          ? 2.2
          : weather === 'rain'
            ? 0.9
            : 0.35;
    this.swayingParts.forEach((item) => {
      item.obj.rotation.z = Math.sin(elapsed * 2.2 + item.phase) * item.amp * windStrength;
    });

    // 6. Ships gliding along charted Catmull-Rom routes
    this.ships.forEach((ship, idx) => {
      const windBoost = weather === 'windy' ? 1.65 : weather === 'thunderstorm' ? 1.9 : 1.0;
      ship.t = (ship.t + dt * ship.speed * windBoost) % 1;
      const pos = ship.curve.getPointAt(ship.t);
      const look = ship.curve.getPointAt(Math.min(1, ship.t + 0.015));
      ship.group.position.copy(pos);
      ship.group.position.y += Math.sin(elapsed * 2.8 + idx) * 0.015;
      ship.group.lookAt(look.x, ship.group.position.y, look.z);
      ship.group.rotation.z = Math.sin(elapsed * 2.4 + idx) * 0.06 * windBoost;
      ship.sails.forEach((sail, sIdx) => {
        sail.rotation.y = Math.sin(elapsed * 5.0 + sIdx) * 0.14 * windBoost;
      });
    });

    // 7. Constellation star glow (intensifies at dusk/night or when tool active)
    if (this.constellation) {
      const starVis = Math.max(nightFactor, constellationToolActive ? 0.95 : 0.25);
      this.constellation.nodes.forEach((star, i) => {
        star.rotation.y = elapsed * 0.8 + i;
        const mat = star.material as THREE.MeshStandardMaterial;
        const selected = this.constellation!.selectedIndex === i;
        mat.emissiveIntensity = selected ? 2.2 : 0.55 + starVis * 0.95;
        star.scale.setScalar(selected ? 1.45 : 0.85 + starVis * 0.35);
      });
    }

    // 8. Origami Creatures with Day/Night Behavior Shifts
    this.creatures.forEach((agent) => {
      const target = agent.state.summoned ? 1 : 0;
      agent.unfoldProgress += (target - agent.unfoldProgress) * damp;
      agent.group.visible = agent.unfoldProgress > 0.03;
      if (!agent.group.visible) return;

      agent.group.scale.setScalar(agent.unfoldProgress);
      const isNocturnal =
        agent.state.kind === 'owl' ||
        agent.state.kind === 'fox' ||
        agent.state.kind === 'crab' ||
        agent.state.kind === 'scarab' ||
        agent.state.kind === 'phoenix' ||
        agent.state.kind === 'moth' ||
        agent.state.kind === 'jellyfish' ||
        agent.state.kind === 'wolf';

      const activityRate = isNocturnal ? 0.45 + nightFactor * 0.95 : 1.15 - nightFactor * 0.55;
      agent.phase += dt * activityRate;

      const cx = agent.baseCenter.x + Math.cos(agent.phase) * agent.radius;
      const cz = agent.baseCenter.y + Math.sin(agent.phase * 1.3) * agent.radius * 0.72;
      const nx = agent.baseCenter.x + Math.cos(agent.phase + 0.05) * agent.radius;
      const nz = agent.baseCenter.y + Math.sin((agent.phase + 0.05) * 1.3) * agent.radius * 0.72;

      const isFlyer =
        agent.state.kind === 'owl' ||
        agent.state.kind === 'gull' ||
        agent.state.kind === 'phoenix' ||
        agent.state.kind === 'moth' ||
        agent.state.kind === 'manta' ||
        agent.state.kind === 'jellyfish' ||
        agent.state.kind === 'hawk' ||
        agent.state.kind === 'finch' ||
        agent.state.kind === 'heron' ||
        agent.state.kind === 'gryphon';
      const baseHeight = isFlyer
        ? isNocturnal && nightFactor < 0.35 && agent.state.kind === 'owl'
          ? 0.42 // owls perch lower during daytime
          : 0.95 + Math.sin(elapsed * 2.5 + agent.phase) * 0.14
        : 0.02 + Math.abs(Math.sin(agent.phase * 5)) * 0.03;

      agent.group.position.set(cx, baseHeight, cz);
      agent.group.lookAt(nx, baseHeight, nz);

      agent.wingsOrLimbs.forEach((part, idx) => {
        if (isFlyer) {
          part.rotation.z = Math.sin(elapsed * 8.5 + idx * Math.PI) * 0.48 * activityRate;
        } else {
          part.rotation.x = Math.sin(agent.phase * 7 + idx * Math.PI) * 0.35;
        }
      });

      agent.glowParts.forEach((mat) => {
        mat.emissiveIntensity = 0.25 + nightFactor * 1.6;
      });
    });

    // 9. Hidden Layer Hinged Lids
    this.hiddenLayers.forEach((hl) => {
      const target = hl.revealed ? 1 : 0;
      hl.openProgress += (target - hl.openProgress) * damp;
      hl.lidPivot.rotation.x = -hl.openProgress * (Math.PI * 0.62);
    });

    // 10. Nighttime Building Windows & Crystal Illumination
    this.illuminatedMaterials.forEach((mat) => {
      mat.emissiveIntensity = 0.1 + nightFactor * 1.35;
    });

    // 11. Portal Landmarks (Origami Iris, Brass Gimbal & Ripple Veil)
    this.portals.forEach((p) => {
      const targetIris = p.activating ? 1.0 : p.hovered ? 0.88 : 0.22;
      p.irisProgress += (targetIris - p.irisProgress) * damp;
      p.irisPivots.forEach((piv) => {
        piv.rotation.x = -p.irisProgress * 1.15;
      });
      const spinRate = p.activating ? 3.4 : p.hovered ? 1.8 : 0.45;
      p.gimbalRing.rotation.z += dt * spinRate;
      p.veilUniforms.uTime.value = elapsed;
      p.veilUniforms.uEnergy.value = 0.35 + p.irisProgress * 0.9;
      p.veilMaterial.emissiveIntensity = 0.55 + nightFactor * 0.75 + p.irisProgress * 0.9;
      p.veilMaterial.opacity = 0.45 + p.irisProgress * 0.45;
      if (!p.hovered && !p.activating) {
        p.keystoneMat.emissiveIntensity = 0.45 + nightFactor * 1.1;
      } else {
        p.keystoneMat.emissiveIntensity = 1.65;
      }
      p.activating = false;
    });

    this.updateWorldSpecific(dt, elapsed, nightFactor, weather, influence, quest);
  }

  protected abstract updateWorldSpecific(
    dt: number,
    elapsed: number,
    nightFactor: number,
    weather: WeatherPreset,
    influence?: CrossWorldInfluence,
    quest?: MeridianQuestProgress,
  ): void;

  public dispose(): void {
    // Subclasses with external render targets (e.g. Reflector) override to dispose cleanly
  }

  public getInteractables(): THREE.Object3D[] {
    return this.interactables;
  }

  public getSelectedStarIndex(): number | null {
    return this.constellation?.selectedIndex ?? null;
  }

  public setSelectedStarIndex(idx: number | null): void {
    if (this.constellation) {
      this.constellation.selectedIndex = idx;
    }
  }
}
