import * as THREE from 'three';
import { WeatherPreset, WorldState } from '../../types/atlas';
import { BaseWorld } from './BaseWorld';

export class VerdantKingdomWorld extends BaseWorld {
  private waterfallStrips: THREE.Mesh[] = [];
  private millWheel: THREE.Group | null = null;

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(0, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // 1. Layered Terraced Paper Meadow Reliefs
    this.buildTerrainTerraces();

    // 2. Pop-Up Structure 1: Highland Crags & Cascading Waterfall
    const peaksPopup = new THREE.Group();
    const peaksFoldPivot = new THREE.Group();
    peaksFoldPivot.position.set(-2.35, 0.02, -1.35);
    peaksPopup.add(peaksFoldPivot);

    const mountainSpecs = [
      [0, 0, 0.95, 1.48, 0x5c6858, true],
      [-0.78, 0.25, 0.7, 1.05, 0x6d7766, true],
      [0.72, -0.15, 0.66, 0.96, 0x4f5b4d, false],
    ] as const;

    mountainSpecs.forEach(([mx, mz, rad, h, col, hasCap]) => {
      const mGroup = new THREE.Group();
      mGroup.position.set(mx, 0, mz);
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(rad, h, 5),
        this.makePaperMat(col, 0.88),
      );
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      mGroup.add(body);

      if (hasCap) {
        const cap = new THREE.Mesh(
          new THREE.ConeGeometry(rad * 0.36, h * 0.35, 5),
          this.makePaperMat(0xf4efe4, 0.82),
        );
        cap.position.y = h * 0.84;
        mGroup.add(cap);
      }
      peaksFoldPivot.add(mGroup);
    });

    // Animated Paper Waterfall Ribbons cascading down central crag
    const fallMat = new THREE.MeshStandardMaterial({
      color: 0x7fd2e6,
      emissive: 0x1e5c72,
      emissiveIntensity: 0.25,
      roughness: 0.22,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 3; i++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.18 - i * 0.03, 0.95, 2, 8), fallMat);
      strip.position.set(0.16 + (i - 1) * 0.07, 0.45, 0.42 + i * 0.03);
      strip.rotation.x = -0.36;
      peaksFoldPivot.add(strip);
      this.waterfallStrips.push(strip);
    }

    this.root.add(peaksPopup);
    const peaksState = state.popups.find((p) => p.id === 'kingdom-peaks')!;
    this.registerPopupRig(
      peaksState.id,
      peaksState.label,
      peaksPopup,
      new THREE.Vector3(-3.85, 0.05, -2.1),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: peaksFoldPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      peaksState.pullRatio,
    );

    // 3. Pop-Up Structure 2: Whispering Mill & Tudor Village
    const villagePopup = new THREE.Group();
    const villagePivot = new THREE.Group();
    villagePivot.position.set(2.05, 0.02, -0.85);
    villagePopup.add(villagePivot);

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffd580,
      emissive: 0xff9b28,
      emissiveIntensity: 0.2,
      roughness: 0.3,
    });
    this.illuminatedMaterials.push(windowMat);

    const cottageConfigs = [
      { x: 0, z: 0, w: 0.44, h: 0.36, d: 0.38, roofCol: 0x9c4838, rot: 0.15 },
      { x: -0.62, z: 0.32, w: 0.36, h: 0.28, d: 0.34, roofCol: 0x7b4c3a, rot: -0.3 },
      { x: 0.58, z: 0.24, w: 0.34, h: 0.48, d: 0.34, roofCol: 0x4b5b6b, rot: 0.2 }, // clock/bell tower
    ];

    cottageConfigs.forEach((c) => {
      const house = new THREE.Group();
      house.position.set(c.x, 0, c.z);
      house.rotation.y = c.rot;

      const walls = new THREE.Mesh(
        new THREE.BoxGeometry(c.w, c.h, c.d),
        this.makePaperMat(0xf0e5cf, 0.85),
      );
      walls.position.y = c.h / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      house.add(walls);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(c.w, c.d) * 0.85, c.h * 0.72, 4),
        this.makePaperMat(c.roofCol, 0.78),
      );
      roof.position.y = c.h + c.h * 0.34;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      house.add(roof);

      // Glowing windows
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, c.d + 0.015), windowMat);
      win.position.set(0, c.h * 0.52, 0);
      const winSide = new THREE.Mesh(new THREE.BoxGeometry(c.w + 0.015, 0.11, 0.09), windowMat);
      winSide.position.set(0, c.h * 0.52, 0);
      house.add(win, winSide);

      this.addGroundShadow(house, 0.36);
      villagePivot.add(house);
    });

    // Rotating Paper Watermill Wheel
    this.millWheel = new THREE.Group();
    this.millWheel.position.set(-0.28, 0.18, 0.25);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.02, 6, 14),
      this.makePaperMat(0x7c5434, 0.75),
    );
    this.millWheel.add(rim);
    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.02, 0.06),
        this.makePaperMat(0x9a6d44, 0.8),
      );
      spoke.rotation.z = (s / 6) * Math.PI;
      this.millWheel.add(spoke);
    }
    villagePivot.add(this.millWheel);

    this.root.add(villagePopup);
    const villageState = state.popups.find((p) => p.id === 'kingdom-village')!;
    this.registerPopupRig(
      villageState.id,
      villageState.label,
      villagePopup,
      new THREE.Vector3(3.85, 0.05, -1.55),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: villagePivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      villageState.pullRatio,
    );

    // 4. Static Background Paper Pine Grove (InstancedMesh for crisp 60fps)
    this.buildStaticForest();

    // 5. Winding Emerald River + Draggable Control Beads
    this.buildRiverSystem(state.riverControlPoints, 0x3b8ea5, 0.44);

    // 6. Accordion Folding Bridges
    const b1 = state.bridges.find((b) => b.id === 'kingdom-bridge-west')!;
    this.buildFoldingBridge(
      b1.id,
      b1.label,
      new THREE.Vector3(-1.35, 0.06, -0.95),
      new THREE.Vector3(-0.35, 0.06, -0.1),
      b1.unfolded,
    );
    const b2 = state.bridges.find((b) => b.id === 'kingdom-bridge-east')!;
    this.buildFoldingBridge(
      b2.id,
      b2.label,
      new THREE.Vector3(1.15, 0.06, 0.45),
      new THREE.Vector3(2.05, 0.06, 1.15),
      b2.unfolded,
    );

    // 7. River Skiff Navigation Agent
    const route = state.shipRoutes[0]?.points ?? state.riverControlPoints;
    this.addShipAgent('kingdom-skiff', route, 'skiff', 0.075);

    // 8. Constellation Nodes above Canopy ("The Great Stag")
    this.buildConstellationNodes([
      [-2.1, 2.35, -1.2],
      [-0.85, 2.7, -0.75],
      [0.35, 2.55, -1.15],
      [1.45, 2.8, -0.4],
      [2.2, 2.3, 0.6],
      [0.5, 2.25, 0.85],
    ]);

    // 9. Origami Creatures & Wax Seals
    const sealCoords = [
      new THREE.Vector3(-0.7, 0.03, 1.45),
      new THREE.Vector3(1.15, 0.03, -1.95),
      new THREE.Vector3(2.65, 0.03, 0.45),
    ];
    const patrolCenters = [
      new THREE.Vector2(-1.0, 1.15),
      new THREE.Vector2(0.8, -1.2),
      new THREE.Vector2(2.3, 0.4),
    ];
    state.creatures.forEach((c, idx) => {
      this.addCreatureWithSeal(c, sealCoords[idx], patrolCenters[idx], 0.65);
    });

    // 10. Hidden Layer Plateau: Subterranean Root Sanctuary Vault
    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(
      hl.id,
      hl.label,
      new THREE.Vector3(-1.8, 0.01, 1.35),
      1.35,
      1.05,
      0x6b8b56,
      0x65e8c2,
      hl.revealed,
    );

    this.syncState(state, 0);
  }

  private buildTerrainTerraces(): void {
    const terraces = [
      { x: -2.15, z: -1.3, rx: 1.5, rz: 1.05, h: 0.08, col: 0x86a36b },
      { x: -2.0, z: 1.25, rx: 1.35, rz: 0.95, h: 0.05, col: 0x77965d },
      { x: 2.1, z: -0.9, rx: 1.45, rz: 1.05, h: 0.07, col: 0x90ab72 },
      { x: 2.4, z: 1.35, rx: 1.25, rz: 0.85, h: 0.05, col: 0x7c9c62 },
    ];

    terraces.forEach((t) => {
      const geo = new THREE.CylinderGeometry(t.rx * 0.85, t.rx, t.h, 12);
      geo.scale(1, 1, t.rz / t.rx);
      const mesh = new THREE.Mesh(geo, this.makePaperMat(t.col, 0.88));
      mesh.position.set(t.x, t.h / 2, t.z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.root.add(mesh);
    });
  }

  private buildStaticForest(): void {
    const treePositions: [number, number, number][] = [
      [-3.3, 0.4, 0.9],
      [-3.1, 1.8, 0.8],
      [-2.8, -0.35, 1.05],
      [-1.1, -1.85, 0.9],
      [-0.4, -1.55, 0.82],
      [0.65, -1.8, 1.0],
      [2.95, -1.75, 0.95],
      [3.35, -0.35, 0.85],
      [3.2, 1.75, 1.0],
      [1.35, 1.85, 0.85],
      [-0.35, 1.9, 0.92],
      [-2.55, 0.45, 0.78],
      [0.95, -0.45, 0.88],
      [2.65, 0.85, 0.76],
      [-1.4, -0.45, 0.82],
      [1.6, 0.05, 0.78],
      [-3.45, -1.1, 0.86],
      [3.45, 0.75, 0.9],
      [0.2, 1.45, 0.75],
      [-0.9, 0.65, 0.8],
      [2.2, -1.85, 0.9],
      [-2.9, 1.2, 0.72],
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.025, 0.045, 0.22, 6);
    trunkGeo.translate(0, 0.11, 0);
    const crownGeo = new THREE.ConeGeometry(0.19, 0.46, 6);
    crownGeo.translate(0, 0.36, 0);

    const trunkMat = this.makePaperMat(0x5c422c, 0.88);
    const crownMat = this.makePaperMat(0x467a52, 0.82);

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treePositions.length);
    trunks.castShadow = true;
    crowns.castShadow = true;
    crowns.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    treePositions.forEach(([x, z, sc], i) => {
      dummy.position.set(x, 0.01, z);
      dummy.rotation.y = i * 1.1;
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      crowns.setMatrixAt(i, dummy.matrix);
      col.setHex(0x467a52).offsetHSL((i % 3) * 0.015 - 0.015, 0, (i % 4) * 0.025 - 0.03);
      crowns.setColorAt(i, col);
    });
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    trunks.computeBoundingSphere();
    crowns.computeBoundingSphere();

    this.root.add(trunks, crowns);
  }

  protected updateWorldSpecific(
    dt: number,
    elapsed: number,
    _nightFactor: number,
    _weather: WeatherPreset,
  ): void {
    if (this.millWheel) {
      this.millWheel.rotation.z -= dt * 1.35;
    }
    this.waterfallStrips.forEach((strip, idx) => {
      strip.position.y = 0.45 + Math.sin(elapsed * 7 + idx * 1.4) * 0.025;
      (strip.material as THREE.MeshStandardMaterial).opacity =
        0.75 + Math.sin(elapsed * 8 + idx) * 0.14;
    });
  }
}
