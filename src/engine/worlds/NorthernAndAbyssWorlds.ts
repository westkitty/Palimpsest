import * as THREE from 'three';
import { WeatherPreset, WorldState } from '../../types/atlas';
import { BaseWorld } from './BaseWorld';

/**
 * Folio IV — The Frostbound Spire
 */
export class FrostboundSpireWorld extends BaseWorld {
  private bellGroup: THREE.Group | null = null;
  private iceFalls: THREE.Mesh[] = [];

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(3, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // Glacial Ridges
    const ridges = [
      { x: -2.2, z: -1.2, rx: 1.55, rz: 1.1, h: 0.12, col: 0xdbe8f2 },
      { x: 2.15, z: -1.1, rx: 1.45, rz: 1.0, h: 0.14, col: 0xc8dceb },
      { x: -1.9, z: 1.3, rx: 1.25, rz: 0.9, h: 0.08, col: 0xe6f0f7 },
      { x: 2.35, z: 1.35, rx: 1.3, rz: 0.95, h: 0.09, col: 0xd1e2ef },
    ];
    ridges.forEach((t) => {
      const geo = new THREE.CylinderGeometry(t.rx * 0.78, t.rx, t.h, 7);
      geo.scale(1, 1, t.rz / t.rx);
      const mesh = new THREE.Mesh(geo, this.makePaperMat(t.col, 0.76));
      mesh.position.set(t.x, t.h / 2, t.z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.root.add(mesh);
    });

    // Pop-Up 1: Icebound Belfry Spire
    const belfryPopup = new THREE.Group();
    const belfryPivot = new THREE.Group();
    belfryPivot.position.set(-2.2, 0.1, -1.15);
    belfryPopup.add(belfryPivot);

    const stoneIceMat = this.makePaperMat(0xc8d8e6, 0.72);
    const roofIceMat = this.makePaperMat(0x527a9e, 0.65, 0.15);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe4a8,
      emissive: 0xffae42,
      emissiveIntensity: 0.35,
      roughness: 0.25,
    });
    this.illuminatedMaterials.push(lanternMat);

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 0.68), stoneIceMat);
    base.position.y = 0.36;
    base.castShadow = true;
    const belfryOpen = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.46), lanternMat);
    belfryOpen.position.y = 0.88;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.88, 4), roofIceMat);
    spire.position.y = 1.48;
    spire.rotation.y = Math.PI / 4;
    spire.castShadow = true;

    this.bellGroup = new THREE.Group();
    this.bellGroup.position.set(0, 0.98, 0.28);
    const bell = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4af6e, roughness: 0.25, metalness: 0.88 }),
    );
    bell.position.y = -0.07;
    this.bellGroup.add(bell);

    belfryPivot.add(base, belfryOpen, spire, this.bellGroup);
    this.root.add(belfryPopup);

    const belfryState = state.popups.find((p) => p.id === 'frost-belfry')!;
    this.registerPopupRig(
      belfryState.id,
      belfryState.label,
      belfryPopup,
      new THREE.Vector3(-3.85, 0.05, -1.75),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: belfryPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      belfryState.pullRatio,
    );

    // Pop-Up 2: Glacial Arch & Frozen Waterfall
    const glacierPopup = new THREE.Group();
    const glacierPivot = new THREE.Group();
    glacierPivot.position.set(2.1, 0.12, -1.05);
    glacierPopup.add(glacierPivot);

    const iceCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xa6dcfa,
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 1.0,
    });
    for (const [gx, gy, r, h] of [
      [-0.45, 0, 0.45, 1.15],
      [0.45, 0, 0.42, 1.05],
      [0, 0.68, 0.35, 0.55],
    ]) {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), iceCrystalMat);
      shard.position.set(gx, gy + h / 2, 0);
      shard.castShadow = true;
      glacierPivot.add(shard);
    }

    const fallMat = new THREE.MeshStandardMaterial({
      color: 0xc2ecff,
      emissive: 0x3b86b0,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 2; i++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.82), fallMat);
      strip.position.set((i - 0.5) * 0.24, 0.44, 0.25);
      strip.rotation.x = -0.25;
      glacierPivot.add(strip);
      this.iceFalls.push(strip);
    }
    this.root.add(glacierPopup);

    const glacierState = state.popups.find((p) => p.id === 'frost-glacier')!;
    this.registerPopupRig(
      glacierState.id,
      glacierState.label,
      glacierPopup,
      new THREE.Vector3(3.85, 0.05, -1.6),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: glacierPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      glacierState.pullRatio,
    );

    // Instanced Frost Pines
    const coords: [number, number, number][] = [
      [-3.2, 0.2, 0.85], [-3.0, -1.9, 0.9], [-1.0, -1.8, 0.8], [0.8, -1.75, 0.92],
      [3.15, -0.1, 0.88], [3.2, 1.85, 0.95], [1.2, 1.85, 0.85], [-0.8, 1.85, 0.9],
    ];
    coords.forEach(([x, z, sc]) => {
      const t = this.createPaperTree('icepine', sc);
      t.position.set(x, 0.01, z);
      this.root.add(t);
    });

    // Glacial Meltwater Stream & Bridges
    this.buildRiverSystem(state.riverControlPoints, 0x62b9db, 0.42);
    const b1 = state.bridges.find((b) => b.id === 'frost-crevasse')!;
    this.buildFoldingBridge(b1.id, b1.label, new THREE.Vector3(-1.3, 0.08, -0.7), new THREE.Vector3(-0.35, 0.08, 0.0), b1.unfolded);
    const b2 = state.bridges.find((b) => b.id === 'frost-bellway')!;
    this.buildFoldingBridge(b2.id, b2.label, new THREE.Vector3(0.95, 0.08, 0.3), new THREE.Vector3(1.85, 0.08, 0.95), b2.unfolded);

    // Icebreaker Sled-Skiff
    this.addShipAgent('frost-sled', state.shipRoutes[0]?.points ?? state.riverControlPoints, 'skiff', 0.08);

    // Constellation: Ursa Borealis
    this.buildConstellationNodes([
      [-2.2, 2.5, -1.0], [-1.0, 2.75, -0.5], [0.2, 2.5, -0.9],
      [1.3, 2.8, -0.6], [2.2, 2.4, 0.4], [0.8, 2.25, 0.9],
    ]);

    // Northern Creatures
    const seals = [
      new THREE.Vector3(-0.9, 0.05, 1.5),
      new THREE.Vector3(0.6, 0.05, -1.8),
      new THREE.Vector3(2.4, 0.05, 0.55),
    ];
    const centers = [new THREE.Vector2(-1.0, 1.1), new THREE.Vector2(0.5, -1.1), new THREE.Vector2(2.2, 0.5)];
    state.creatures.forEach((c, idx) => this.addCreatureWithSeal(c, seals[idx], centers[idx], 0.68));

    // Hidden Layer: Permafrost Ice Cavern
    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(hl.id, hl.label, new THREE.Vector3(-1.8, 0.01, 1.35), 1.35, 1.0, 0xbcd4e6, 0x7aeaff, hl.revealed);

    this.syncState(state, 0);
  }

  protected updateWorldSpecific(_dt: number, elapsed: number, nightFactor: number): void {
    if (this.bellGroup) {
      this.bellGroup.rotation.z = Math.sin(elapsed * 2.2) * (0.12 + nightFactor * 0.25);
    }
    this.iceFalls.forEach((f, idx) => {
      (f.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25 + nightFactor * 0.75 + Math.sin(elapsed * 3 + idx) * 0.08;
    });
  }
}

/**
 * Folio V — The Sunken Athenaeum
 */
export class SunkenAthenaeumWorld extends BaseWorld {
  private domeRings: THREE.Mesh[] = [];

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(4, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // Seabed Terraces
    const beds = [
      { x: -2.1, z: -1.1, rx: 1.5, rz: 1.0, h: 0.1, col: 0x2f636a },
      { x: 2.1, z: -1.0, rx: 1.4, rz: 1.0, h: 0.12, col: 0x26545c },
      { x: 0, z: 0, rx: 3.9, rz: 2.55, h: 0.02, col: 0x1c3f46 },
    ];
    beds.forEach((b) => {
      const geo = new THREE.CylinderGeometry(b.rx * 0.9, b.rx, b.h, 10);
      geo.scale(1, 1, b.rz / b.rx);
      const mesh = new THREE.Mesh(geo, this.makePaperMat(b.col, 0.85));
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.receiveShadow = true;
      this.root.add(mesh);
    });

    // Pop-Up 1: Sunken Dome Rotunda
    const rotundaPopup = new THREE.Group();
    const rotundaPivot = new THREE.Group();
    rotundaPivot.position.set(-2.1, 0.09, -1.05);
    rotundaPopup.add(rotundaPivot);

    const marbleMat = this.makePaperMat(0xcde0dc, 0.78);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af6e, roughness: 0.28, metalness: 0.85 });

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.14, 12), marbleMat);
    plinth.position.y = 0.07;
    rotundaPivot.add(plinth);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.56, 8), marbleMat);
      col.position.set(Math.cos(a) * 0.58, 0.42, Math.sin(a) * 0.58);
      col.castShadow = true;
      rotundaPivot.add(col);
    }

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      this.makePaperMat(0x47969e, 0.65, 0.15),
    );
    dome.position.y = 0.7;
    dome.castShadow = true;
    rotundaPivot.add(dome);

    const orbRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 24), goldMat);
    orbRing.position.y = 0.45;
    rotundaPivot.add(orbRing);
    this.domeRings.push(orbRing);

    this.root.add(rotundaPopup);
    const rotState = state.popups.find((p) => p.id === 'abyss-rotunda')!;
    this.registerPopupRig(
      rotState.id,
      rotState.label,
      rotundaPopup,
      new THREE.Vector3(-3.85, 0.05, -1.6),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: rotundaPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      rotState.pullRatio,
    );

    // Pop-Up 2: Coral Arch Colonnade
    const colPopup = new THREE.Group();
    const colPivot = new THREE.Group();
    colPivot.position.set(2.1, 0.09, -1.0);
    colPopup.add(colPivot);

    for (const cx of [-0.45, -0.15, 0.15, 0.45]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.65, 8), marbleMat);
      pillar.position.set(cx, 0.325, 0);
      pillar.castShadow = true;
      colPivot.add(pillar);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.28), marbleMat);
    lintel.position.y = 0.7;
    lintel.castShadow = true;
    colPivot.add(lintel);

    this.root.add(colPopup);
    const colState = state.popups.find((p) => p.id === 'abyss-colonnade')!;
    this.registerPopupRig(
      colState.id,
      colState.label,
      colPopup,
      new THREE.Vector3(3.85, 0.05, -1.65),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: colPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      colState.pullRatio,
    );

    // Coral Grove
    for (const [cx, cz] of [
      [-3.0, 0.3], [-1.0, 1.8], [1.2, 1.7], [3.1, 0.4], [0.1, -1.8],
    ]) {
      const coral = this.createPaperTree('coral', 0.95);
      coral.position.set(cx, 0.02, cz);
      this.root.add(coral);
    }

    this.buildRiverSystem(state.riverControlPoints, 0x4de2d8, 0.52);
    const b1 = state.bridges.find((b) => b.id === 'abyss-arch-1')!;
    this.buildFoldingBridge(b1.id, b1.label, new THREE.Vector3(-1.3, 0.08, -0.35), new THREE.Vector3(-0.3, 0.08, -0.75), b1.unfolded);
    const b2 = state.bridges.find((b) => b.id === 'abyss-arch-2')!;
    this.buildFoldingBridge(b2.id, b2.label, new THREE.Vector3(0.9, 0.08, -0.6), new THREE.Vector3(1.85, 0.08, 0.1), b2.unfolded);

    this.addShipAgent('abyss-bathysphere', state.shipRoutes[0]?.points ?? state.riverControlPoints, 'sloop', 0.075);

    this.buildConstellationNodes([
      [-2.1, 2.4, -0.8], [-0.7, 2.75, -1.1], [0.8, 2.6, -0.5],
      [2.1, 2.35, 0.3], [0.3, 2.2, 0.95], [-1.3, 2.3, 0.7],
    ]);

    const seals = [
      new THREE.Vector3(-0.8, 0.04, 1.25),
      new THREE.Vector3(0.7, 0.04, -1.8),
      new THREE.Vector3(2.3, 0.04, 0.9),
    ];
    const centers = [new THREE.Vector2(-0.8, 0.8), new THREE.Vector2(0.5, -1.0), new THREE.Vector2(2.0, 0.8)];
    state.creatures.forEach((c, idx) => this.addCreatureWithSeal(c, seals[idx], centers[idx], 0.7));

    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(hl.id, hl.label, new THREE.Vector3(-1.85, 0.01, 1.35), 1.35, 1.0, 0x3b767c, 0x52fff0, hl.revealed);

    this.syncState(state, 0);
  }

  protected updateWorldSpecific(dt: number): void {
    this.domeRings.forEach((r) => {
      r.rotation.y += dt * 0.75;
      r.rotation.x += dt * 0.35;
    });
  }
}

/**
 * Folio VI — The Ember Foundry
 */
export class EmberFoundryWorld extends BaseWorld {
  private anvilWheel: THREE.Group | null = null;
  private magmaGlow: THREE.MeshStandardMaterial | null = null;

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(5, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // Hexagonal Basalt Terraces
    const basaltCols = [0x3b2d2c, 0x4a3734, 0x2f2526];
    const hexPos = [
      [-2.1, -1.0, 1.35, 0.14],
      [2.15, -1.0, 1.3, 0.12],
      [-2.2, 1.35, 1.15, 0.1],
      [2.2, 1.3, 1.2, 0.1],
      [0.1, -1.75, 0.9, 0.09],
    ];
    hexPos.forEach(([x, z, r, h], idx) => {
      const hex = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.9, r, h, 6),
        this.makePaperMat(basaltCols[idx % basaltCols.length], 0.86),
      );
      hex.position.set(x, h / 2, z);
      hex.receiveShadow = true;
      hex.castShadow = true;
      this.root.add(hex);
    });

    // Pop-Up 1: Caldera Volcano & Magma Cascade
    const volcPopup = new THREE.Group();
    const volcPivot = new THREE.Group();
    volcPivot.position.set(-2.1, 0.12, -1.05);
    volcPopup.add(volcPivot);

    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.92, 1.18, 7),
      this.makePaperMat(0x3a2c2b, 0.88),
    );
    cone.position.y = 0.59;
    cone.castShadow = true;
    volcPivot.add(cone);

    this.magmaGlow = new THREE.MeshStandardMaterial({
      color: 0xff7a2e,
      emissive: 0xff4800,
      emissiveIntensity: 1.1,
      roughness: 0.25,
    });
    this.illuminatedMaterials.push(this.magmaGlow);

    const craterPool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 7), this.magmaGlow);
    craterPool.position.y = 1.16;
    const lavaStream = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.05), this.magmaGlow);
    lavaStream.position.set(0.28, 0.56, 0.42);
    lavaStream.rotation.x = -0.45;
    lavaStream.rotation.z = -0.2;
    volcPivot.add(craterPool, lavaStream);

    this.root.add(volcPopup);
    const volcState = state.popups.find((p) => p.id === 'ember-volcano')!;
    this.registerPopupRig(
      volcState.id,
      volcState.label,
      volcPopup,
      new THREE.Vector3(-3.85, 0.05, -1.65),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: volcPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      volcState.pullRatio,
    );

    // Pop-Up 2: Bellows & Hammer Mill
    const forgePopup = new THREE.Group();
    const forgePivot = new THREE.Group();
    forgePivot.position.set(2.15, 0.12, -0.95);
    forgePopup.add(forgePivot);

    const hall = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.52, 0.65), this.makePaperMat(0x4c3b38, 0.84));
    hall.position.y = 0.26;
    hall.castShadow = true;
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.72, 6), this.makePaperMat(0x2f2526, 0.85));
    chimney.position.set(0.22, 0.72, -0.1);
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.68), this.magmaGlow);
    furnace.position.set(-0.15, 0.18, 0);

    this.anvilWheel = new THREE.Group();
    this.anvilWheel.position.set(-0.46, 0.28, 0.1);
    const gear = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.035, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4af6e, roughness: 0.3, metalness: 0.88 }),
    );
    gear.rotation.y = Math.PI / 2;
    this.anvilWheel.add(gear);
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.04), this.makePaperMat(0xc4954f, 0.4, 0.7));
      spoke.rotation.x = (s / 4) * Math.PI;
      this.anvilWheel.add(spoke);
    }

    forgePivot.add(hall, chimney, furnace, this.anvilWheel);
    this.root.add(forgePopup);
    const forgeState = state.popups.find((p) => p.id === 'ember-forge')!;
    this.registerPopupRig(
      forgeState.id,
      forgeState.label,
      forgePopup,
      new THREE.Vector3(3.85, 0.05, -1.55),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: forgePivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      forgeState.pullRatio,
    );

    // Molten Magma River
    this.buildRiverSystem(state.riverControlPoints, 0xf26829, 0.42);
    const b1 = state.bridges.find((b) => b.id === 'ember-span-1')!;
    this.buildFoldingBridge(b1.id, b1.label, new THREE.Vector3(-1.25, 0.09, -0.8), new THREE.Vector3(-0.35, 0.09, -0.2), b1.unfolded);
    const b2 = state.bridges.find((b) => b.id === 'ember-span-2')!;
    this.buildFoldingBridge(b2.id, b2.label, new THREE.Vector3(0.95, 0.09, 0.3), new THREE.Vector3(1.85, 0.09, 0.95), b2.unfolded);

    this.addShipAgent('ember-barge', state.shipRoutes[0]?.points ?? state.riverControlPoints, 'galleon', 0.07);

    this.buildConstellationNodes([
      [-2.0, 2.4, -0.9], [-0.7, 2.7, -1.0], [0.5, 2.65, -0.6],
      [1.8, 2.4, 0.2], [0.6, 2.2, 0.9], [-1.1, 2.25, 0.75],
    ]);

    const seals = [
      new THREE.Vector3(-0.85, 0.05, 1.35),
      new THREE.Vector3(0.55, 0.05, -1.75),
      new THREE.Vector3(2.4, 0.05, 0.35),
    ];
    const centers = [new THREE.Vector2(-0.9, 1.1), new THREE.Vector2(0.5, -1.1), new THREE.Vector2(2.1, 0.5)];
    state.creatures.forEach((c, idx) => this.addCreatureWithSeal(c, seals[idx], centers[idx], 0.68));

    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(hl.id, hl.label, new THREE.Vector3(-1.95, 0.02, 1.35), 1.35, 1.0, 0x4f3834, 0xff7b33, hl.revealed);

    this.syncState(state, 0);
  }

  protected updateWorldSpecific(dt: number, elapsed: number, nightFactor: number): void {
    if (this.anvilWheel) {
      this.anvilWheel.rotation.x += dt * 1.4;
    }
    if (this.magmaGlow) {
      this.magmaGlow.emissiveIntensity = 0.8 + nightFactor * 0.9 + Math.sin(elapsed * 4) * 0.18;
    }
  }
}

/**
 * Folio VII — The Clockwork Sky
 */
export class ClockworkSkyWorld extends BaseWorld {
  private windmillBlades: THREE.Group | null = null;
  private floatingIslands: THREE.Group[] = [];

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(6, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // Suspended Cloud-Islands with Hanging Roots
    const islandSpecs = [
      { x: -2.15, y: 0.36, z: -1.0, r: 1.15 },
      { x: 2.15, y: 0.4, z: -0.95, r: 1.1 },
      { x: -1.85, y: 0.28, z: 1.35, r: 0.95 },
      { x: 2.05, y: 0.32, z: 1.3, r: 0.95 },
    ];
    const turfMat = this.makePaperMat(0xdcd3b8, 0.82);
    const rootMat = this.makePaperMat(0x8e795e, 0.86);

    islandSpecs.forEach((is) => {
      const ig = new THREE.Group();
      ig.position.set(is.x, is.y, is.z);

      const top = new THREE.Mesh(new THREE.CylinderGeometry(is.r, is.r * 0.78, 0.14, 9), turfMat);
      top.castShadow = true;
      top.receiveShadow = true;
      const underCone = new THREE.Mesh(new THREE.ConeGeometry(is.r * 0.72, 0.36, 7), rootMat);
      underCone.rotation.x = Math.PI;
      underCone.position.y = -0.24;
      ig.add(top, underCone);
      this.addGroundShadow(ig, is.r * 0.8, 0.22);
      this.root.add(ig);
      this.floatingIslands.push(ig);
    });

    // Pop-Up 1: Grand Windmill Spire
    const millPopup = new THREE.Group();
    const millPivot = new THREE.Group();
    millPivot.position.set(-2.15, 0.42, -1.0);
    millPopup.add(millPivot);

    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.38, 1.05, 8),
      this.makePaperMat(0xf0e7d4, 0.84),
    );
    tower.position.y = 0.525;
    tower.castShadow = true;
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.34, 8),
      this.makePaperMat(0xb8433e, 0.78),
    );
    cap.position.y = 1.22;
    millPivot.add(tower, cap);

    this.windmillBlades = new THREE.Group();
    this.windmillBlades.position.set(0, 0.92, 0.28);
    const sailMat = this.makePaperMat(0xfaf4e6, 0.85);
    const sparMat = this.makePaperMat(0x7a5636, 0.8);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group();
      arm.rotation.z = (i / 4) * Math.PI * 2;
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.65, 0.03), sparMat);
      spar.position.y = 0.32;
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.52), sailMat);
      sail.position.set(0.1, 0.38, 0.01);
      sail.rotation.y = 0.18;
      arm.add(spar, sail);
      this.windmillBlades.add(arm);
    }
    millPivot.add(this.windmillBlades);
    this.root.add(millPopup);

    const millState = state.popups.find((p) => p.id === 'sky-windmill')!;
    this.registerPopupRig(
      millState.id,
      millState.label,
      millPopup,
      new THREE.Vector3(-3.85, 0.05, -1.6),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: millPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      millState.pullRatio,
    );

    // Pop-Up 2: Airship Mooring Mast
    const mastPopup = new THREE.Group();
    const mastPivot = new THREE.Group();
    mastPivot.position.set(2.15, 0.45, -0.95);
    mastPopup.add(mastPivot);

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af6e, roughness: 0.28, metalness: 0.86 });
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.28, 1.25, 6), brassMat);
    spire.position.y = 0.625;
    spire.castShadow = true;
    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshStandardMaterial({ color: 0xffe49e, emissive: 0xffb336, emissiveIntensity: 0.9 }),
    );
    beacon.position.y = 1.32;
    this.illuminatedMaterials.push(beacon.material as THREE.MeshStandardMaterial);
    mastPivot.add(spire, beacon);
    this.root.add(mastPopup);

    const mastState = state.popups.find((p) => p.id === 'sky-mooring')!;
    this.registerPopupRig(
      mastState.id,
      mastState.label,
      mastPopup,
      new THREE.Vector3(3.85, 0.05, -1.55),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: mastPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      mastState.pullRatio,
    );

    // Sky-Stream Channel & Rope Bridges
    this.buildRiverSystem(state.riverControlPoints, 0x8ccce8, 0.36);
    const b1 = state.bridges.find((b) => b.id === 'sky-span-1')!;
    this.buildFoldingBridge(b1.id, b1.label, new THREE.Vector3(-1.2, 0.36, -0.45), new THREE.Vector3(-0.2, 0.32, 0.1), b1.unfolded);
    const b2 = state.bridges.find((b) => b.id === 'sky-span-2')!;
    this.buildFoldingBridge(b2.id, b2.label, new THREE.Vector3(0.9, 0.34, -0.4), new THREE.Vector3(1.8, 0.38, 0.25), b2.unfolded);

    // Paper Dirigible
    this.addShipAgent('sky-dirigible', state.shipRoutes[0]?.points ?? state.riverControlPoints, 'galleon', 0.085);

    this.buildConstellationNodes([
      [-2.2, 2.55, -0.8], [-0.8, 2.85, -1.1], [0.6, 2.7, -0.5],
      [2.1, 2.45, 0.3], [0.4, 2.25, 0.95], [-1.3, 2.35, 0.8],
    ]);

    const seals = [
      new THREE.Vector3(-0.7, 0.05, 1.45),
      new THREE.Vector3(0.75, 0.05, -1.75),
      new THREE.Vector3(2.2, 0.36, 1.35),
    ];
    const centers = [new THREE.Vector2(-1.0, 1.0), new THREE.Vector2(0.5, -0.9), new THREE.Vector2(2.0, 1.0)];
    state.creatures.forEach((c, idx) => this.addCreatureWithSeal(c, seals[idx], centers[idx], 0.72));

    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(hl.id, hl.label, new THREE.Vector3(1.8, 0.01, 1.3), 1.35, 1.0, 0xc7bea5, 0xffe285, hl.revealed);

    this.syncState(state, 0);
  }

  protected updateWorldSpecific(dt: number, elapsed: number, _nightFactor: number, weather: WeatherPreset): void {
    const windSpeed = weather === 'windy' ? 3.2 : weather === 'thunderstorm' ? 3.8 : 1.5;
    if (this.windmillBlades) {
      this.windmillBlades.rotation.z -= dt * windSpeed;
    }
    this.floatingIslands.forEach((ig, idx) => {
      ig.position.y = (idx < 2 ? 0.38 : 0.3) + Math.sin(elapsed * 1.4 + idx * 1.3) * 0.03;
    });
  }
}
