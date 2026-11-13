import * as THREE from 'three';
import {
  CreatureState,
  PlantedTreeState,
  Vec2Point,
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

/**
 * Shared BaseWorld scaffolding providing reusable 3-12 part paper-craft builders
 * and unified interactive rigging for all 10 systems.
 */
export abstract class BaseWorld {
  public readonly root = new THREE.Group();
  public readonly interactables: THREE.Object3D[] = [];

  protected popups: PopupRig[] = [];
  protected bridges: BridgeRig[] = [];
  protected riverRig: RiverRig | null = null;
  protected plantedTreeGroup = new THREE.Group();
  protected plantedTreeMeshes = new Map<string, { group: THREE.Group; plantedAt: number; targetScale: number }>();
  protected ships: ShipAgent[] = [];
  protected constellation: ConstellationRig | null = null;
  protected creatures: CreatureAgent[] = [];
  protected hiddenLayers: HiddenLayerRig[] = [];
  protected illuminatedMaterials: THREE.MeshStandardMaterial[] = [];
  protected swayingParts: { obj: THREE.Object3D; phase: number; amp: number }[] = [];

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

  public setFoldFactor(factor: number): void {
    this.worldFoldFactor = Math.max(0.01, Math.min(1, factor));
    // Smoothly compress Y scale like a real pop-up spread closing between pages
    this.root.scale.y = this.worldFoldFactor;
    this.root.visible = factor > 0.02;
  }

  protected makePaperMat(color: number, roughness = 0.84, metalness = 0.03): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      bumpMap: this.paperBump,
      bumpScale: 0.008,
      roughness,
      metalness,
      side: THREE.DoubleSide,
    });
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
      species === 'crystal' ? 0x675b78 : species === 'blossom' ? 0x5d433b : 0x5c422c,
      0.86,
      species === 'crystal' ? 0.25 : 0.02,
    );

    if (species === 'pine' || species === 'cypress') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.055, 0.24, 6), trunkMat);
      trunk.position.y = 0.12;
      trunk.castShadow = true;
      g.add(trunk);

      const foliageColor = species === 'pine' ? 0x3b6e4c : 0x366454;
      const tierCount = species === 'cypress' ? 4 : 3;
      for (let i = 0; i < tierCount; i++) {
        const coneMat = this.makePaperMat(
          new THREE.Color(foliageColor).offsetHSL(0, 0, i * 0.04).getHex(),
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
    } else if (species === 'oak' || species === 'blossom') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.06, 0.34, 6), trunkMat);
      trunk.position.y = 0.17;
      trunk.castShadow = true;
      g.add(trunk);

      const leafHex = species === 'blossom' ? 0xe5a4b2 : 0x558447;
      const accentHex = species === 'blossom' ? 0xf6d1da : 0x74a357;
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
    } else if (species === 'palm') {
      // Segmented curved trunk + folded paper fronds
      for (let s = 0; s < 4; s++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.032 - s * 0.004, 0.04 - s * 0.004, 0.16, 6), trunkMat);
        seg.position.set(s * 0.025, 0.08 + s * 0.14, 0);
        seg.rotation.z = -0.08 * s;
        seg.castShadow = true;
        g.add(seg);
      }
      const frondMat = this.makePaperMat(0x5f8f4e, 0.78);
      for (let f = 0; f < 5; f++) {
        const ang = (f / 5) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 3), frondMat);
        frond.position.set(0.08 + Math.cos(ang) * 0.18, 0.56, Math.sin(ang) * 0.18);
        frond.rotation.z = -Math.PI / 2.6;
        frond.rotation.y = -ang;
        frond.castShadow = true;
        g.add(frond);
      }
    } else {
      // Crystalline desert bloom (faceted luminous spires)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.06, 6), trunkMat);
      base.position.y = 0.03;
      g.add(base);
      const crysMat = new THREE.MeshPhysicalMaterial({
        color: 0x7ce5dc,
        emissive: 0x1c7072,
        emissiveIntensity: 0.45,
        roughness: 0.18,
        metalness: 0.15,
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
    };
    this.root.add(sealMesh);
    this.interactables.push(sealMesh);

    // Origami Creature Group (4-7 parts)
    const group = new THREE.Group();
    const wingsOrLimbs: THREE.Object3D[] = [];
    const glowParts: THREE.MeshStandardMaterial[] = [];

    const bodyColor =
      cState.kind === 'stag'
        ? 0xc49c68
        : cState.kind === 'owl'
          ? 0xa48562
          : cState.kind === 'fox' || cState.kind === 'fennec'
            ? 0xd6743c
            : cState.kind === 'gull'
              ? 0xf4f0e6
              : cState.kind === 'whale'
                ? 0x4c7c94
                : cState.kind === 'crab'
                  ? 0xc7543c
                  : cState.kind === 'scarab'
                    ? 0xc49f46
                    : 0xf2a541;

    const bodyMat = this.makePaperMat(bodyColor, 0.65, cState.kind === 'scarab' ? 0.6 : 0.08);
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

    // Wings / Legs / Antlers
    if (cState.kind === 'owl' || cState.kind === 'gull' || cState.kind === 'phoenix') {
      const wingGeo = new THREE.PlaneGeometry(0.22, 0.1);
      const wingL = new THREE.Mesh(wingGeo, bodyMat);
      wingL.position.set(-0.11, 0.14, 0);
      const wingR = new THREE.Mesh(wingGeo, bodyMat);
      wingR.position.set(0.11, 0.14, 0);
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

  public syncState(state: WorldState, elapsed: number): void {
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
        agent.state.kind === 'phoenix';

      const activityRate = isNocturnal ? 0.45 + nightFactor * 0.95 : 1.15 - nightFactor * 0.55;
      agent.phase += dt * activityRate;

      const cx = agent.baseCenter.x + Math.cos(agent.phase) * agent.radius;
      const cz = agent.baseCenter.y + Math.sin(agent.phase * 1.3) * agent.radius * 0.72;
      const nx = agent.baseCenter.x + Math.cos(agent.phase + 0.05) * agent.radius;
      const nz = agent.baseCenter.y + Math.sin((agent.phase + 0.05) * 1.3) * agent.radius * 0.72;

      const isFlyer =
        agent.state.kind === 'owl' ||
        agent.state.kind === 'gull' ||
        agent.state.kind === 'phoenix';
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

    this.updateWorldSpecific(dt, elapsed, nightFactor, weather);
  }

  protected abstract updateWorldSpecific(
    dt: number,
    elapsed: number,
    nightFactor: number,
    weather: WeatherPreset,
  ): void;

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
