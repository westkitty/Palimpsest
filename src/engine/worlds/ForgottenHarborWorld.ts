import * as THREE from 'three';
import { WeatherPreset, WorldState } from '../../types/atlas';
import { BOOK_SPREAD_W, BOOK_PAGE_D } from '../BookAndDeskRig';
import { BaseWorld } from './BaseWorld';

export class ForgottenHarborWorld extends BaseWorld {
  private oceanGeo: THREE.PlaneGeometry | null = null;
  private oceanBaseZ: Float32Array | null = null;
  private lighthouseBeam: THREE.Mesh | null = null;
  private harborFlags: THREE.Mesh[] = [];

  constructor(paperBump: THREE.Texture, contactShadowTex: THREE.Texture) {
    super(1, paperBump, contactShadowTex);
  }

  public build(state: WorldState): void {
    // 1. Animated Undulating Paper Sea Surface (Right & Center-Left Bay)
    this.oceanGeo = new THREE.PlaneGeometry(BOOK_SPREAD_W - 0.6, BOOK_PAGE_D - 0.6, 36, 24);
    this.oceanGeo.rotateX(-Math.PI / 2);
    this.oceanBaseZ = new Float32Array(
      (this.oceanGeo.attributes.position as THREE.BufferAttribute).array,
    );
    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x2f6880,
      roughness: 0.24,
      metalness: 0.1,
      clearcoat: 0.85,
      clearcoatRoughness: 0.18,
      transparent: true,
      opacity: 0.84,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const ocean = new THREE.Mesh(this.oceanGeo, oceanMat);
    ocean.position.set(0, 0.018, 0);
    ocean.receiveShadow = true;
    ocean.userData = { interactionType: 'waterSurface', worldId: this.worldId };
    this.root.add(ocean);

    // 2. Coastal Limestone Sea-Cliffs & Quayside Promontories
    this.buildCoastalCliffs();

    // 3. Pop-Up 1: Pharos Beacon Lighthouse
    const lighthousePopup = new THREE.Group();
    const lighthousePivot = new THREE.Group();
    lighthousePivot.position.set(-2.3, 0.14, -1.25);
    lighthousePopup.add(lighthousePivot);

    const towerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.34, 1.35, 8),
      this.makePaperMat(0xf0e8d6, 0.84),
    );
    towerBody.position.y = 0.675;
    towerBody.castShadow = true;
    towerBody.receiveShadow = true;
    lighthousePivot.add(towerBody);

    // Crimson maritime band
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.255, 0.285, 0.28, 8),
      this.makePaperMat(0xb8433e, 0.78),
    );
    band.position.y = 0.72;
    lighthousePivot.add(band);

    // Gallery balcony
    const gallery = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.26, 0.08, 8),
      this.makePaperMat(0x525e68, 0.6, 0.3),
    );
    gallery.position.y = 1.38;
    lighthousePivot.add(gallery);

    // Glowing lantern room + rotating volumetric beam
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe49e,
      emissive: 0xffb83c,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    this.illuminatedMaterials.push(lanternMat);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 8), lanternMat);
    lantern.position.y = 1.52;
    lighthousePivot.add(lantern);

    const dome = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.2, 8),
      this.makePaperMat(0xd4af6e, 0.35, 0.75),
    );
    dome.position.y = 1.72;
    lighthousePivot.add(dome);

    const beamGeo = new THREE.ConeGeometry(0.55, 2.8, 12, 1, true);
    beamGeo.translate(0, -1.4, 0);
    beamGeo.rotateX(Math.PI / 2);
    this.lighthouseBeam = new THREE.Mesh(
      beamGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffe28a,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.lighthouseBeam.position.set(0, 1.52, 0);
    lighthousePivot.add(this.lighthouseBeam);

    // Keeper's cottage beside lighthouse
    const keeperHouse = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.28, 0.38),
      this.makePaperMat(0xe5dbc6, 0.85),
    );
    keeperHouse.position.set(0.48, 0.14, 0.12);
    keeperHouse.castShadow = true;
    const keeperRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.24, 4),
      this.makePaperMat(0x4b6374, 0.8),
    );
    keeperRoof.position.set(0.48, 0.39, 0.12);
    keeperRoof.rotation.y = Math.PI / 4;
    lighthousePivot.add(keeperHouse, keeperRoof);

    this.root.add(lighthousePopup);
    const lhState = state.popups.find((p) => p.id === 'harbor-lighthouse')!;
    this.registerPopupRig(
      lhState.id,
      lhState.label,
      lighthousePopup,
      new THREE.Vector3(-3.85, 0.05, -1.9),
      new THREE.Vector3(-1, 0, 0),
      [{ mesh: lighthousePivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      lhState.pullRatio,
    );

    // 4. Pop-Up 2: Harbor Citadel, Archway Pier & Crane Derrick
    const citadelPopup = new THREE.Group();
    const citadelPivot = new THREE.Group();
    citadelPivot.position.set(2.05, 0.12, -1.15);
    citadelPopup.add(citadelPivot);

    const hall = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.45, 0.62),
      this.makePaperMat(0xdcd1bc, 0.86),
    );
    hall.position.y = 0.225;
    hall.castShadow = true;
    const hallRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.68, 0.38, 4),
      this.makePaperMat(0x3b586e, 0.78),
    );
    hallRoof.position.y = 0.64;
    hallRoof.rotation.y = Math.PI / 4;
    hallRoof.castShadow = true;
    citadelPivot.add(hall, hallRoof);

    // Harbor lantern windows
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xffd78c,
      emissive: 0xff9e32,
      emissiveIntensity: 0.2,
    });
    this.illuminatedMaterials.push(winMat);
    for (const wx of [-0.25, 0, 0.25]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.64), winMat);
      win.position.set(wx, 0.24, 0);
      citadelPivot.add(win);
    }

    // Harbor flagpole & fluttering pennant
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.7, 6),
      this.makePaperMat(0xd4af6e, 0.4, 0.6),
    );
    pole.position.set(-0.55, 0.35, 0.35);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.14, 4, 2),
      this.makePaperMat(0xc4493f, 0.82),
    );
    flag.position.set(-0.4, 0.62, 0.35);
    citadelPivot.add(pole, flag);
    this.harborFlags.push(flag);

    this.root.add(citadelPopup);
    const citState = state.popups.find((p) => p.id === 'harbor-citadel')!;
    this.registerPopupRig(
      citState.id,
      citState.label,
      citadelPopup,
      new THREE.Vector3(3.85, 0.05, -1.65),
      new THREE.Vector3(1, 0, 0),
      [{ mesh: citadelPivot, closedRotX: -Math.PI / 2 + 0.08, openRotX: 0 }],
      citState.pullRatio,
    );

    // 5. Tidal Estuary Channel + Draggable Beads
    this.buildRiverSystem(state.riverControlPoints, 0x4ca3bd, 0.56);

    // 6. Folding Causeway & Pontoon Bridges
    const b1 = state.bridges.find((b) => b.id === 'harbor-drawbridge')!;
    this.buildFoldingBridge(
      b1.id,
      b1.label,
      new THREE.Vector3(-1.4, 0.12, -0.7),
      new THREE.Vector3(-0.35, 0.12, -0.35),
      b1.unfolded,
    );
    const b2 = state.bridges.find((b) => b.id === 'harbor-pier-span')!;
    this.buildFoldingBridge(
      b2.id,
      b2.label,
      new THREE.Vector3(1.1, 0.08, -0.45),
      new THREE.Vector3(1.9, 0.08, 0.4),
      b2.unfolded,
    );

    // 7. Paper Galleon & Sloop Following Sea-Lanes
    const r0 = state.shipRoutes[0]?.points ?? [
      { x: -2.6, z: 1.4 },
      { x: 0, z: 1.0 },
      { x: 2.8, z: -0.6 },
    ];
    const r1 = state.shipRoutes[1]?.points ?? [
      { x: 2.4, z: 1.7 },
      { x: 0.4, z: 1.3 },
      { x: -2.4, z: 1.7 },
    ];
    this.addShipAgent('harbor-galleon', r0, 'galleon', 0.065);
    this.addShipAgent('harbor-sloop', r1, 'sloop', 0.09);

    // 8. Maritime Constellation ("The Mariner's Compass")
    this.buildConstellationNodes([
      [-2.3, 2.45, -0.9],
      [-0.6, 2.85, -1.2],
      [1.2, 2.6, -0.8],
      [2.3, 2.35, 0.4],
      [0.4, 2.2, 0.9],
      [-1.4, 2.25, 0.8],
    ]);

    // 9. Coastal Creatures & Seals
    const sealCoords = [
      new THREE.Vector3(-0.85, 0.04, 0.45),
      new THREE.Vector3(0.45, 0.04, 1.85),
      new THREE.Vector3(2.3, 0.12, -0.35),
    ];
    const patrolCenters = [
      new THREE.Vector2(-1.4, -0.3),
      new THREE.Vector2(0.4, 1.3),
      new THREE.Vector2(2.1, -0.3),
    ];
    state.creatures.forEach((c, idx) => {
      this.addCreatureWithSeal(c, sealCoords[idx], patrolCenters[idx], 0.72);
    });

    // 10. Hidden Layer: Smuggler's Sea Cave & Sunken Astrolabe
    const hl = state.hiddenLayers[0];
    this.addHiddenLayerPlateau(
      hl.id,
      hl.label,
      new THREE.Vector3(-2.1, 0.02, 1.1),
      1.35,
      1.05,
      0x9a9586,
      0x4de3dc,
      hl.revealed,
    );

    this.syncState(state, 0);
  }

  private buildCoastalCliffs(): void {
    const cliffMat = this.makePaperMat(0xb6ae9c, 0.88);
    const pierMat = this.makePaperMat(0x8c6848, 0.8);

    const slabs = [
      { x: -2.25, z: -1.2, w: 2.1, h: 0.15, d: 1.7 },
      { x: 2.15, z: -1.15, w: 2.1, h: 0.14, d: 1.6 },
      { x: 2.65, z: 0.35, w: 1.3, h: 0.09, d: 1.2 },
    ];
    slabs.forEach((s) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), cliffMat);
      mesh.position.set(s.x, s.h / 2, s.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
    });

    // Wooden dock pier extending into harbor
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.36), pierMat);
    pier.position.set(1.35, 0.06, -0.2);
    pier.castShadow = true;
    this.root.add(pier);
  }

  protected updateWorldSpecific(
    dt: number,
    elapsed: number,
    nightFactor: number,
    weather: WeatherPreset,
    influence?: import('../../types/atlas').CrossWorldInfluence,
  ): void {
    const flowScale = influence?.riverFlowRatio ?? 1.0;
    const skyWind = influence?.skyWindBoost ?? 1.0;

    // Rotating lighthouse beacon (accelerates during tempests)
    if (this.lighthouseBeam) {
      const beamRate = weather === 'thunderstorm' ? 1.55 : weather === 'mist' ? 0.6 : 0.9;
      this.lighthouseBeam.rotation.y += dt * beamRate;
      const beamMat = this.lighthouseBeam.material as THREE.MeshBasicMaterial;
      beamMat.opacity = 0.06 + nightFactor * 0.34 + (weather === 'mist' ? 0.08 : 0);
    }

    // Fluttering harbor flags boosted by local weather & Clockwork Sky trade winds
    const windMult =
      (weather === 'windy' ? 2.4 : weather === 'thunderstorm' ? 2.8 : 1.0) * skyWind;
    this.harborFlags.forEach((flag, idx) => {
      flag.rotation.y = Math.sin(elapsed * 6.5 * windMult + idx) * 0.25;
    });

    // Gently undulating paper ocean waves fed by Verdant Valley river flow
    if (this.oceanGeo && this.oceanBaseZ) {
      const pos = this.oceanGeo.attributes.position as THREE.BufferAttribute;
      const baseAmp =
        weather === 'thunderstorm'
          ? 0.055
          : weather === 'windy'
            ? 0.042
            : 0.022;
      const amp = baseAmp * (0.75 + 0.32 * flowScale);
      for (let i = 0; i < pos.count; i++) {
        const bx = this.oceanBaseZ[i * 3];
        const bz = this.oceanBaseZ[i * 3 + 2];
        const y =
          Math.sin(bx * 1.6 + elapsed * 2.1 * skyWind) * amp +
          Math.cos(bz * 2.1 - elapsed * 1.6) * amp * 0.7;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      this.oceanGeo.computeVertexNormals();
    }
  }
}
