import * as THREE from 'three';
import { WeatherPreset, WorldState } from '../../types/atlas';
import { BaseWorld } from './BaseWorld';

export class CelestialDesertWorld extends BaseWorld {
  private orreryRings: THREE.Mesh[] = [];
  private orrerySun: THREE.Mesh | null = null;
  private crystalSpires: THREE.Mesh[] = [];

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(2, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // 1. Folded Origami Sand Dunes
    this.buildOrigamiDunes();

    // 2. Pop-Up 1: The Great Brass Astral Orrery Observatory
    const orreryPopup = new THREE.Group();
    const orreryPivot = new THREE.Group();
    orreryPivot.position.set(-2.1, 0.04, -0.95);
    orreryPopup.add(orreryPivot);

    const sandstoneMat = this.makePaperMat(0xd9b37c, 0.85);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af6e,
      roughness: 0.24,
      metalness: 0.88,
    });

    // Stepped Ziggurat Base (3 tiers)
    const tiers = [
      [0.92, 0.2, 0.1],
      [0.68, 0.2, 0.3],
      [0.44, 0.2, 0.5],
    ];
    tiers.forEach(([r, h, y]) => {
      const step = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r, h, 8), sandstoneMat);
      step.position.y = y;
      step.castShadow = true;
      step.receiveShadow = true;
      orreryPivot.add(step);
    });

    // Counter-rotating Brass Armillary Rings
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.46 - i * 0.08, 0.022, 8, 28),
        goldMat,
      );
      ring.position.y = 1.08;
      ring.rotation.set(i * 0.5, i * 0.7, 0);
      ring.castShadow = true;
      orreryPivot.add(ring);
      this.orreryRings.push(ring);
    }

    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffdf7e,
      emissive: 0xe69830,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.4,
    });
    this.illuminatedMaterials.push(sunMat);
    this.orrerySun = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), sunMat);
    this.orrerySun.position.y = 1.08;
    orreryPivot.add(this.orrerySun);

    this.root.add(orreryPopup);
    const orreryState = state.popups.find((p) => p.id === 'desert-orrery')!;
    this.registerPopupRig(
      orreryState.id,
      orreryState.label,
      orreryPopup,
      new THREE.Vector3(-3.85, 0.05, -1.65),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: orreryPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      orreryState.pullRatio,
    );

    // 3. Pop-Up 2: Sunken Sun Temple & Luminous Crystal Obelisks
    const templePopup = new THREE.Group();
    const templePivot = new THREE.Group();
    templePivot.position.set(2.1, 0.04, -1.05);
    templePopup.add(templePivot);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.85), sandstoneMat);
    plinth.position.y = 0.07;
    plinth.castShadow = true;
    templePivot.add(plinth);

    const sanctum = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.52), sandstoneMat);
    sanctum.position.y = 0.35;
    sanctum.castShadow = true;
    templePivot.add(sanctum);

    const pyramidRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.34, 4),
      goldMat,
    );
    pyramidRoof.position.y = 0.72;
    pyramidRoof.rotation.y = Math.PI / 4;
    pyramidRoof.castShadow = true;
    templePivot.add(pyramidRoof);

    // Crystal Obelisks flanking the temple
    const crysMat = new THREE.MeshPhysicalMaterial({
      color: 0x79f2e6,
      emissive: 0x1e8f88,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    this.illuminatedMaterials.push(crysMat);

    for (const ox of [-0.46, 0.46]) {
      const obelisk = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.62, 4), crysMat);
      obelisk.position.set(ox, 0.45, 0.32);
      obelisk.castShadow = true;
      templePivot.add(obelisk);
      this.crystalSpires.push(obelisk);
    }

    this.root.add(templePopup);
    const tempState = state.popups.find((p) => p.id === 'desert-temple')!;
    this.registerPopupRig(
      tempState.id,
      tempState.label,
      templePopup,
      new THREE.Vector3(3.85, 0.05, -1.75),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: templePivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      tempState.pullRatio,
    );

    // 4. Luminous Mirage Aqueduct + Draggable Beads
    this.buildRiverSystem(state.riverControlPoints, 0x45c8be, 0.36);

    // 5. Gilded Folding Bridges across Starlight Canyon
    const b1 = state.bridges.find((b) => b.id === 'desert-span-1')!;
    this.buildFoldingBridge(
      b1.id,
      b1.label,
      new THREE.Vector3(-1.35, 0.06, 0.35),
      new THREE.Vector3(-0.25, 0.06, -0.3),
      b1.unfolded,
    );
    const b2 = state.bridges.find((b) => b.id === 'desert-span-2')!;
    this.buildFoldingBridge(
      b2.id,
      b2.label,
      new THREE.Vector3(0.95, 0.06, -0.65),
      new THREE.Vector3(1.85, 0.06, -0.05),
      b2.unfolded,
    );

    // 6. Paper Sand-Skiff Gliding Across Dunes
    const route = state.shipRoutes[0]?.points ?? [
      { x: -2.7, z: -1.4 },
      { x: -0.7, z: -0.6 },
      { x: 1.2, z: 0.7 },
      { x: 2.9, z: 1.6 },
    ];
    this.addShipAgent('desert-skiff', route, 'skiff', 0.085);

    // 7. Astral Constellation ("The Astral Phoenix")
    this.buildConstellationNodes([
      [-2.1, 2.45, -1.0],
      [-0.7, 2.85, -0.4],
      [0.0, 2.4, 0.25],
      [0.85, 2.88, -0.45],
      [2.15, 2.45, -1.0],
      [0.0, 2.2, -1.4],
    ]);

    // 8. Origami Desert Creatures & Seals
    const sealCoords = [
      new THREE.Vector3(-0.75, 0.04, 1.55),
      new THREE.Vector3(0.45, 0.04, -1.85),
      new THREE.Vector3(2.45, 0.04, 0.85),
    ];
    const patrolCenters = [
      new THREE.Vector2(-0.8, 1.25),
      new THREE.Vector2(0.0, -0.4),
      new THREE.Vector2(2.3, 0.9),
    ];
    state.creatures.forEach((c, idx) => {
      this.addCreatureWithSeal(c, sealCoords[idx], patrolCenters[idx], 0.75);
    });

    // 9. Hidden Layer: Sunken Crystal Vault & Star Gears
    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(
      hl.id,
      hl.label,
      new THREE.Vector3(1.65, 0.01, 1.4),
      1.4,
      1.05,
      0xd4ad76,
      0x7bf0e2,
      hl.revealed,
    );

    this.syncState(state, 0);
  }

  private buildOrigamiDunes(): void {
    const duneColors = [0xe8cb96, 0xdec089, 0xd1af76];
    const duneSpecs = [
      [-2.8, 1.35, 1.25, 0.28, 0.95, 0.4],
      [-0.9, -1.65, 1.45, 0.34, 1.05, -0.25],
      [0.95, 1.55, 1.35, 0.26, 0.95, 0.3],
      [2.85, 0.55, 1.15, 0.32, 0.88, -0.45],
      [-2.5, -0.1, 1.0, 0.22, 0.8, 0.15],
    ];

    duneSpecs.forEach(([x, z, rx, h, rz, rot], idx) => {
      // Crisp 4-sided pyramid-ridge origami dune
      const geo = new THREE.ConeGeometry(rx, h, 4);
      geo.scale(1.2, 1, rz / rx);
      const mesh = new THREE.Mesh(
        geo,
        this.makePaperMat(duneColors[idx % duneColors.length], 0.86),
      );
      mesh.position.set(x, h / 2, z);
      mesh.rotation.y = rot;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
    });
  }

  protected updateWorldSpecific(
    dt: number,
    elapsed: number,
    nightFactor: number,
    weather: WeatherPreset,
    influence?: import('../../types/atlas').CrossWorldInfluence,
  ): void {
    const heat = 0.9 + (influence?.emberHeatFactor ?? 0.2) * 0.65;
    const stormRate = weather === 'windy' ? 1.35 : weather === 'thunderstorm' ? 1.55 : 1.0;

    this.orreryRings.forEach((ring, idx) => {
      ring.rotation.x += dt * (0.35 + idx * 0.22) * heat * stormRate;
      ring.rotation.y += dt * (0.48 - idx * 0.18) * heat;
    });
    if (this.orrerySun) {
      this.orrerySun.rotation.y = elapsed * 0.9 * heat;
    }
    const rainOasis = weather === 'rain' || weather === 'thunderstorm' ? 1 : 0;
    if (this.riverRig) {
      this.riverRig.material.emissiveIntensity = 0.15 + rainOasis * 0.45;
    }
    this.crystalSpires.forEach((spire, idx) => {
      spire.position.y =
        0.45 + Math.sin(elapsed * 2.1 + idx) * (0.02 + nightFactor * 0.04 + rainOasis * 0.03);
    });
  }
}
