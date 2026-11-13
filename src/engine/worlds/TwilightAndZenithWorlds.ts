import * as THREE from 'three';
import { WeatherPreset, WorldState } from '../../types/atlas';
import { BaseWorld } from './BaseWorld';

/**
 * Folio VIII — The Whispering Mycelium
 */
export class WhisperingMyceliumWorld extends BaseWorld {
  private sporeCaps: THREE.Mesh[] = [];

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(7, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // Mossy Umbral Terraces
    const beds = [
      { x: -2.15, z: -1.1, rx: 1.45, rz: 1.0, h: 0.1, col: 0x453562 },
      { x: 2.15, z: -1.0, rx: 1.4, rz: 1.0, h: 0.1, col: 0x3a2c54 },
      { x: -1.9, z: 1.3, rx: 1.25, rz: 0.9, h: 0.07, col: 0x4e3c6e },
      { x: 2.2, z: 1.35, rx: 1.2, rz: 0.85, h: 0.07, col: 0x3f3159 },
    ];
    beds.forEach((b) => {
      const geo = new THREE.CylinderGeometry(b.rx * 0.88, b.rx, b.h, 10);
      geo.scale(1, 1, b.rz / b.rx);
      const m = new THREE.Mesh(geo, this.makePaperMat(b.col, 0.88));
      m.position.set(b.x, b.h / 2, b.z);
      m.receiveShadow = true;
      m.castShadow = true;
      this.root.add(m);
    });

    // Pop-Up 1: Giant Bioluminescent Toadstool Crown
    const canopyPopup = new THREE.Group();
    const canopyPivot = new THREE.Group();
    canopyPivot.position.set(-2.1, 0.09, -1.05);
    canopyPopup.add(canopyPivot);

    const stalkMat = this.makePaperMat(0xdfd5ea, 0.84);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x8b6ae6,
      emissive: 0x472ea8,
      emissiveIntensity: 0.65,
      roughness: 0.4,
    });
    this.illuminatedMaterials.push(capMat);

    const specs = [
      [0, 0, 0.12, 1.05, 0.65],
      [-0.48, 0.25, 0.08, 0.7, 0.42],
      [0.45, 0.2, 0.09, 0.78, 0.48],
    ];
    specs.forEach(([mx, mz, sr, sh, cr]) => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(sr * 0.75, sr, sh, 8), stalkMat);
      stalk.position.set(mx, sh / 2, mz);
      stalk.castShadow = true;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(cr, cr * 0.55, 12), capMat);
      cap.position.set(mx, sh + cr * 0.2, mz);
      cap.castShadow = true;
      const gill = new THREE.Mesh(new THREE.TorusGeometry(cr * 0.76, 0.025, 6, 16), capMat);
      gill.rotation.x = Math.PI / 2;
      gill.position.set(mx, sh + 0.02, mz);
      canopyPivot.add(stalk, cap, gill);
      this.sporeCaps.push(cap);
    });

    this.root.add(canopyPopup);
    const canState = state.popups.find((p) => p.id === 'mycel-canopy')!;
    this.registerPopupRig(
      canState.id,
      canState.label,
      canopyPopup,
      new THREE.Vector3(-3.85, 0.05, -1.6),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: canopyPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      canState.pullRatio,
    );

    // Pop-Up 2: Spore Lantern Pagoda
    const pagPopup = new THREE.Group();
    const pagPivot = new THREE.Group();
    pagPivot.position.set(2.1, 0.09, -0.95);
    pagPopup.add(pagPivot);

    const eaveMat = this.makePaperMat(0x5d4585, 0.76);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x9ef7ea,
      emissive: 0x3ec4ba,
      emissiveIntensity: 0.7,
    });
    this.illuminatedMaterials.push(glowMat);

    for (let tier = 0; tier < 3; tier++) {
      const s = 1 - tier * 0.22;
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.46 * s, 0.24, 0.46 * s), glowMat);
      core.position.y = 0.14 + tier * 0.34;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.45 * s, 0.2, 4), eaveMat);
      roof.position.y = 0.32 + tier * 0.34;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      pagPivot.add(core, roof);
    }

    this.root.add(pagPopup);
    const pagState = state.popups.find((p) => p.id === 'mycel-pagoda')!;
    this.registerPopupRig(
      pagState.id,
      pagState.label,
      pagPopup,
      new THREE.Vector3(3.85, 0.05, -1.55),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: pagPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      pagState.pullRatio,
    );

    // Grove of Miniature Glowing Mushrooms
    for (const [mx, mz] of [
      [-3.1, 0.35], [-1.05, 1.85], [0.9, -1.75], [3.2, 0.3], [3.05, 1.8],
    ]) {
      const m = this.createPaperTree('mushroom', 0.9);
      m.position.set(mx, 0.01, mz);
      this.root.add(m);
    }

    this.buildRiverSystem(state.riverControlPoints, 0x67e8dc, 0.38);
    const b1 = state.bridges.find((b) => b.id === 'mycel-span-1')!;
    this.buildFoldingBridge(b1.id, b1.label, new THREE.Vector3(-1.3, 0.08, 0.4), new THREE.Vector3(-0.3, 0.08, -0.2), b1.unfolded);
    const b2 = state.bridges.find((b) => b.id === 'mycel-span-2')!;
    this.buildFoldingBridge(b2.id, b2.label, new THREE.Vector3(0.95, 0.08, -0.65), new THREE.Vector3(1.85, 0.08, -0.05), b2.unfolded);

    this.addShipAgent('mycel-gondola', state.shipRoutes[0]?.points ?? state.riverControlPoints, 'skiff', 0.075);

    this.buildConstellationNodes([
      [-2.1, 2.45, -0.9], [-0.7, 2.75, -0.5], [0.5, 2.5, -1.0],
      [1.9, 2.75, -0.4], [2.1, 2.3, 0.65], [0.2, 2.2, 0.9],
    ]);

    const seals = [
      new THREE.Vector3(-0.75, 0.04, 1.5),
      new THREE.Vector3(0.65, 0.04, -1.8),
      new THREE.Vector3(2.4, 0.04, 0.5),
    ];
    const centers = [new THREE.Vector2(-0.9, 1.1), new THREE.Vector2(0.5, -1.0), new THREE.Vector2(2.1, 0.5)];
    state.creatures.forEach((c, idx) => this.addCreatureWithSeal(c, seals[idx], centers[idx], 0.7));

    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(hl.id, hl.label, new THREE.Vector3(-1.95, 0.01, 1.35), 1.35, 1.0, 0x5c4782, 0x9cfcf0, hl.revealed);

    this.syncState(state, 0);
  }

  protected updateWorldSpecific(_dt: number, elapsed: number, nightFactor: number): void {
    this.sporeCaps.forEach((cap, idx) => {
      cap.scale.setScalar(1 + Math.sin(elapsed * 2.2 + idx) * (0.03 + nightFactor * 0.05));
    });
  }
}

/**
 * Folio IX — The Glass Archipelago
 */
export class GlassArchipelagoWorld extends BaseWorld {
  private sundialNeedle: THREE.Mesh | null = null;
  private prismSpires: THREE.Mesh[] = [];

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(8, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // Reflective Silver-Blue Lagoon Sheet
    const lagoon = new THREE.Mesh(
      new THREE.PlaneGeometry(7.8, 5.0),
      new THREE.MeshPhysicalMaterial({
        color: 0x5c7da3,
        roughness: 0.08,
        metalness: 0.25,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.85,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    lagoon.rotation.x = -Math.PI / 2;
    lagoon.position.y = 0.015;
    lagoon.receiveShadow = true;
    this.root.add(lagoon);

    // Alabaster & Amethyst Island Plinths
    const islands = [
      [-2.1, -1.0, 1.3, 0.12, 0xe8e3f2],
      [2.1, -1.0, 1.25, 0.12, 0xd9d0ea],
      [-2.0, 1.35, 1.1, 0.08, 0xe8e3f2],
      [2.05, 1.3, 1.15, 0.09, 0xd9d0ea],
    ];
    islands.forEach(([x, z, r, h, col]) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.9, r, h, 8),
        this.makePaperMat(col, 0.55, 0.15),
      );
      m.position.set(x, h / 2, z);
      m.receiveShadow = true;
      m.castShadow = true;
      this.root.add(m);
    });

    // Pop-Up 1: Crystal Prism Pavilion
    const prismPopup = new THREE.Group();
    const prismPivot = new THREE.Group();
    prismPivot.position.set(-2.1, 0.11, -1.0);
    prismPopup.add(prismPivot);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcc7ff,
      emissive: 0x553b96,
      emissiveIntensity: 0.4,
      roughness: 0.12,
      metalness: 0.2,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.92,
    });
    this.illuminatedMaterials.push(glassMat);

    const spireSpecs = [
      [0, 0, 0.24, 1.35],
      [-0.36, 0.18, 0.16, 0.88],
      [0.36, -0.14, 0.17, 0.95],
      [0.12, 0.34, 0.14, 0.72],
    ];
    spireSpecs.forEach(([sx, sz, r, h]) => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), glassMat);
      sp.position.set(sx, h / 2, sz);
      sp.castShadow = true;
      prismPivot.add(sp);
      this.prismSpires.push(sp);
    });

    this.root.add(prismPopup);
    const prismState = state.popups.find((p) => p.id === 'glass-pavilion')!;
    this.registerPopupRig(
      prismState.id,
      prismState.label,
      prismPopup,
      new THREE.Vector3(-3.85, 0.05, -1.6),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: prismPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      prismState.pullRatio,
    );

    // Pop-Up 2: Mirror Sundial Court
    const sunPopup = new THREE.Group();
    const sunPivot = new THREE.Group();
    sunPivot.position.set(2.1, 0.11, -1.0);
    sunPopup.add(sunPivot);

    const dialRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.82, 0.12, 16),
      this.makePaperMat(0xf0ecf8, 0.45, 0.25),
    );
    dialRing.position.y = 0.06;
    const brassGnomon = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.82, 3),
      new THREE.MeshStandardMaterial({ color: 0xd4af6e, roughness: 0.22, metalness: 0.9 }),
    );
    brassGnomon.position.y = 0.46;
    brassGnomon.rotation.x = 0.25;
    brassGnomon.castShadow = true;
    this.sundialNeedle = brassGnomon;
    sunPivot.add(dialRing, brassGnomon);

    this.root.add(sunPopup);
    const sunState = state.popups.find((p) => p.id === 'glass-sundial')!;
    this.registerPopupRig(
      sunState.id,
      sunState.label,
      sunPopup,
      new THREE.Vector3(3.85, 0.05, -1.6),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: sunPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      sunState.pullRatio,
    );

    this.buildRiverSystem(state.riverControlPoints, 0x9ec8f5, 0.42);
    const b1 = state.bridges.find((b) => b.id === 'glass-span-1')!;
    this.buildFoldingBridge(b1.id, b1.label, new THREE.Vector3(-1.3, 0.08, -0.5), new THREE.Vector3(-0.3, 0.08, 0.15), b1.unfolded);
    const b2 = state.bridges.find((b) => b.id === 'glass-span-2')!;
    this.buildFoldingBridge(b2.id, b2.label, new THREE.Vector3(0.9, 0.08, 0.2), new THREE.Vector3(1.85, 0.08, -0.35), b2.unfolded);

    this.addShipAgent('glass-catamaran', state.shipRoutes[0]?.points ?? state.riverControlPoints, 'sloop', 0.09);

    this.buildConstellationNodes([
      [-2.0, 2.5, -0.9], [-0.5, 2.85, -0.9], [0.8, 2.65, -0.5],
      [2.1, 2.4, 0.3], [0.4, 2.2, 0.9], [-1.3, 2.3, 0.7],
    ]);

    const seals = [
      new THREE.Vector3(-0.75, 0.04, 1.45),
      new THREE.Vector3(0.55, 0.04, -1.75),
      new THREE.Vector3(2.25, 0.06, 1.3),
    ];
    const centers = [new THREE.Vector2(-0.9, 1.0), new THREE.Vector2(0.5, -0.9), new THREE.Vector2(2.0, 0.9)];
    state.creatures.forEach((c, idx) => this.addCreatureWithSeal(c, seals[idx], centers[idx], 0.72));

    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(hl.id, hl.label, new THREE.Vector3(1.85, 0.02, 1.3), 1.35, 1.0, 0xcbc2e0, 0xd2a8ff, hl.revealed);

    this.syncState(state, 0);
  }

  protected updateWorldSpecific(dt: number, elapsed: number): void {
    if (this.sundialNeedle) {
      this.sundialNeedle.rotation.y += dt * 0.35;
    }
    this.prismSpires.forEach((sp, idx) => {
      sp.rotation.y = elapsed * 0.25 + idx;
    });
  }
}

/**
 * Folio X — The Meridian Heart
 */
export class MeridianHeartWorld extends BaseWorld {
  private grandRings: THREE.Mesh[] = [];
  private coreOrb: THREE.Mesh | null = null;

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(9, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // Gilded Concentric Mandala Terraces
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af6e,
      roughness: 0.24,
      metalness: 0.88,
    });
    const ivoryMat = this.makePaperMat(0xf0e4c8, 0.72, 0.12);
    const espressoMat = this.makePaperMat(0x2e211b, 0.82);

    const centralPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.1, 16), espressoMat);
    centralPlinth.position.set(-1.95, 0.05, -0.85);
    centralPlinth.receiveShadow = true;
    this.root.add(centralPlinth);

    const trimRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.03, 8, 36), goldMat);
    trimRing.rotation.x = Math.PI / 2;
    trimRing.position.set(-1.95, 0.1, -0.85);
    this.root.add(trimRing);

    // Pop-Up 1: The Grand Meridian Astrolabe
    const astroPopup = new THREE.Group();
    const astroPivot = new THREE.Group();
    astroPivot.position.set(-1.95, 0.1, -0.85);
    astroPopup.add(astroPivot);

    const basePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.32, 8), ivoryMat);
    basePedestal.position.y = 0.16;
    basePedestal.castShadow = true;
    astroPivot.add(basePedestal);

    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.68 - i * 0.11, 0.025, 10, 32),
        goldMat,
      );
      ring.position.y = 1.05;
      ring.rotation.set(i * 0.45, i * 0.7, i * 0.3);
      ring.castShadow = true;
      astroPivot.add(ring);
      this.grandRings.push(ring);
    }

    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xfff0b2,
      emissive: 0xe6a838,
      emissiveIntensity: 1.0,
      roughness: 0.15,
      metalness: 0.45,
    });
    this.illuminatedMaterials.push(orbMat);
    this.coreOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), orbMat);
    this.coreOrb.position.y = 1.05;
    astroPivot.add(this.coreOrb);

    this.root.add(astroPopup);
    const astroState = state.popups.find((p) => p.id === 'heart-astrolabe')!;
    this.registerPopupRig(
      astroState.id,
      astroState.label,
      astroPopup,
      new THREE.Vector3(-3.85, 0.05, -1.55),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: astroPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      astroState.pullRatio,
    );

    // Pop-Up 2: The Chronicler's Sanctum Tower
    const sancPopup = new THREE.Group();
    const sancPivot = new THREE.Group();
    sancPivot.position.set(2.05, 0.04, -0.95);
    sancPopup.add(sancPivot);

    const tierHeights = [0.42, 0.38, 0.34];
    let curY = 0;
    tierHeights.forEach((h, idx) => {
      const r = 0.48 - idx * 0.1;
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 8), ivoryMat);
      tower.position.y = curY + h / 2;
      tower.castShadow = true;
      const collar = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, 0.02, 6, 16), goldMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = curY + h;
      sancPivot.add(tower, collar);
      curY += h;
    });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.48, 8), goldMat);
    spire.position.y = curY + 0.24;
    spire.castShadow = true;
    sancPivot.add(spire);

    this.root.add(sancPopup);
    const sancState = state.popups.find((p) => p.id === 'heart-sanctum')!;
    this.registerPopupRig(
      sancState.id,
      sancState.label,
      sancPopup,
      new THREE.Vector3(3.85, 0.05, -1.55),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: sancPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      sancState.pullRatio,
    );

    // Golden Starlight River
    this.buildRiverSystem(state.riverControlPoints, 0xe8be5e, 0.4);
    const b1 = state.bridges.find((b) => b.id === 'heart-span-1')!;
    this.buildFoldingBridge(b1.id, b1.label, new THREE.Vector3(-1.1, 0.08, 0.45), new THREE.Vector3(-0.05, 0.08, 0.3), b1.unfolded);
    const b2 = state.bridges.find((b) => b.id === 'heart-span-2')!;
    this.buildFoldingBridge(b2.id, b2.label, new THREE.Vector3(0.85, 0.08, -0.35), new THREE.Vector3(1.75, 0.08, -0.85), b2.unfolded);

    this.addShipAgent('heart-barge', state.shipRoutes[0]?.points ?? state.riverControlPoints, 'galleon', 0.085);

    this.buildConstellationNodes([
      [-2.1, 2.55, -0.9], [-0.8, 2.9, -0.5], [0.0, 2.45, 0.3],
      [0.85, 2.9, -0.5], [2.1, 2.55, -0.9], [0.0, 2.25, -1.35],
    ]);

    const seals = [
      new THREE.Vector3(-0.7, 0.04, 1.55),
      new THREE.Vector3(0.55, 0.04, -1.85),
      new THREE.Vector3(2.4, 0.04, 0.45),
    ];
    const centers = [new THREE.Vector2(-0.8, 1.1), new THREE.Vector2(0.0, -0.4), new THREE.Vector2(2.1, 0.6)];
    state.creatures.forEach((c, idx) => this.addCreatureWithSeal(c, seals[idx], centers[idx], 0.78));

    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(hl.id, hl.label, new THREE.Vector3(-1.85, 0.01, 1.4), 1.4, 1.0, 0x3b2c22, 0xf7cf6e, hl.revealed);

    this.syncState(state, 0);
  }

  protected updateWorldSpecific(dt: number, elapsed: number, nightFactor: number): void {
    this.grandRings.forEach((ring, idx) => {
      ring.rotation.x += dt * (0.4 + idx * 0.22);
      ring.rotation.y -= dt * (0.55 - idx * 0.12);
    });
    if (this.coreOrb) {
      this.coreOrb.rotation.y = elapsed * 1.1;
      (this.coreOrb.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.85 + nightFactor * 1.2 + Math.sin(elapsed * 3) * 0.15;
    }
  }
}
