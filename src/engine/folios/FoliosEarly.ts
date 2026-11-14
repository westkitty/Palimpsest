import * as THREE from 'three';
import { DraxisId, FolioRuntimeState } from '../../types/atlas';
import {
  buildNiAlBuGeode,
  buildShardGodFigure,
  buildWordstreamerFigure,
} from '../drakken/CharacterFigures';
import { buildDraxisModel, DraxisRig } from '../drakken/DraxisModels';
import { buildCutCardShape, getSharedPapercraftTextures } from '../drakken/papercraftArt';
import { BaseFolioWorld } from './BaseFolioWorld';

const F03_DRAXIS_SEQUENCE: DraxisId[] = ['001', '023', '019', '008', '032'];
const F03_THESIS_LABELS = ['PYRIC · 001', 'AQUEOUS · 023', 'TELLURIC · 019', 'AERIC · 008', 'UMBRAL · 032'];

export class F01FolioWorld extends BaseFolioWorld {
  private vellumFlap!: THREE.Group;
  private vellumTargetRot = 0;
  private dialWheel!: THREE.Group;
  private gearAux!: THREE.Group;
  private dialTargetRot = 0;
  private nodeArms: THREE.Group[] = [];
  private starCore!: THREE.Group;
  private starOcta!: THREE.Mesh;
  private starRing!: THREE.Mesh;
  private nodesTargetConverged = false;
  private nodesProgress = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);
    const sharedTex = getSharedPapercraftTextures();

    // Subtle twilight celestial arch framing F01 behind the lifting astrolabe hinge
    const backdrop = this.buildIllustratedBackdropArch(4.5, 1.16, {
      topHex: '#182230',
      bottomHex: '#28384A',
      cloudHex: '#35485D',
      accentHex: '#4FD8F4',
      motif: 'stars',
      ridgeBackHex: 0x212c39,
      ridgeFrontHex: 0x303f50,
    });
    backdrop.position.set(0, this.pageY(0) + 0.01, -1.72);
    this.root.add(backdrop);

    // Recessed ivory ledger platen framed by cardstock strips
    const platen = this.buildLayeredTerrace(
      [3.9, 3.6],
      [2.5, 2.25],
      0.022,
      [0xd8ceb8, 0xefe8d6],
      0x2c333d,
    );
    platen.position.set(0, 0.004, -0.18);
    this.root.add(platen);

    // Subtle azure Program rule threads across platen
    const ruleMat = this.makePaperMat(0x3b9bb8, 0.45);
    for (let x = -1.4; x <= 1.4; x += 0.7) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 2.1), ruleMat);
      line.position.set(x, 0.052, -0.18);
      this.root.add(line);
    }

    // Precision geared brass Recursion Astrolabe Dial [B]
    this.dialWheel = new THREE.Group();
    this.dialWheel.position.set(0, 0.068, -0.18);
    const dialRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.06, 0.04, 8, 36),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    dialRing.rotation.x = Math.PI / 2;
    dialRing.castShadow = true;
    this.dialWheel.add(dialRing);
    const innerBrassRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.022, 6, 30),
      this.makePaperMat(0x3b9bb8, 0.4, 0.25),
    );
    innerBrassRing.rotation.x = Math.PI / 2;
    this.dialWheel.add(innerBrassRing);

    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.036, k % 3 === 0 ? 0.18 : 0.11),
        this.makePaperMat(k % 3 === 0 ? 0x20262e : 0xc2a25d, 0.5, 0.5),
      );
      tick.position.set(Math.cos(a) * 1.06, 0.015, Math.sin(a) * 1.06);
      tick.rotation.y = -a;
      this.dialWheel.add(tick);
    }
    this.bindMechanismTarget(dialRing, 'B');
    this.root.add(this.dialWheel);

    // Meshed auxiliary brass gear on right perimeter
    this.gearAux = this.buildBrassGear(0.26, 12, 0.034);
    this.gearAux.position.set(1.38, 0.075, -0.18);
    this.bindMechanismTarget(this.gearAux, 'B');
    this.root.add(this.gearAux);

    // Three Law / Memory / Rendering hinged pillars converging along slotted tracks [C]
    const nodeTitles = ['LAW', 'MEMORY', 'RENDERING'];
    nodeTitles.forEach((title, idx) => {
      const ang = (idx / 3) * Math.PI * 2 - Math.PI / 2;
      const track = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.014, 1.08),
        this.makePaperMat(0x282d35, 0.7),
      );
      track.position.set(Math.cos(ang) * 0.56, 0.055, -0.18 + Math.sin(ang) * 0.48);
      track.rotation.y = -ang + Math.PI / 2;
      this.root.add(track);

      const arm = new THREE.Group();
      arm.userData = { angle: ang };
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.12, 6),
        this.makePaperMat(0xc2a25d, 0.4, 0.68, 0, 0, false, true),
      );
      marker.position.y = 0.06;
      marker.castShadow = true;
      const pin = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.075, 0),
        this.makePaperMat(0x4ad4f2, 0.34, 0.2, 0x165e73, 0.48, false, true),
      );
      pin.position.y = 0.17;
      const card = this.makeCardLabel(title, 'Condition', 0.86, 0.25, '#FAF5E8', '#181C22', 0.2);
      card.position.set(0, 0.048, 0.27);
      arm.add(marker, pin, card);
      arm.position.set(Math.cos(ang) * 1.12, 0.06, -0.18 + Math.sin(ang) * 0.92);
      this.bindMechanismTarget(marker, 'C');
      this.bindMechanismTarget(pin, 'C');
      this.root.add(arm);
      this.nodeArms.push(arm);
    });

    // Multi-layered Origami Star Core + Gimbal Ring [C]
    this.starCore = new THREE.Group();
    this.starCore.position.set(0, 0.44, -0.18);
    this.starOcta = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      this.makePaperMat(0xf5e5b8, 0.38, 0.2, 0x3b9bb8, 0.35, true, true),
    );
    const secondStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      this.makePaperMat(0xc2a25d, 0.38, 0.65, 0, 0, false, true),
    );
    secondStar.rotation.y = Math.PI / 4;
    secondStar.scale.set(0.82, 0.82, 0.82);
    this.starRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.022, 6, 20),
      this.makePaperMat(0x4ccae8, 0.32, 0.25, 0x166882, 0.4),
    );
    this.starRing.rotation.x = Math.PI / 3;
    this.starOcta.castShadow = true;
    this.bindMechanismTarget(this.starOcta, 'C');
    this.starCore.add(this.starOcta, secondStar, this.starRing);
    this.root.add(this.starCore);
    this.addGroundShadow(this.root, 0.62, 0.28, 0.055);

    // Translucent Printed Astrolabe Vellum Overlay Flap with rear brass spine hinge [A]
    this.vellumFlap = new THREE.Group();
    this.vellumFlap.position.set(0, 0.24, -1.33);
    const brassSpine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 3.78, 8),
      this.makePaperMat(0xc2a25d, 0.35, 0.8),
    );
    brassSpine.rotation.z = Math.PI / 2;

    const vellumSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(3.72, 2.26),
      new THREE.MeshStandardMaterial({
        map: sharedTex.vellumAstrolabe,
        transparent: true,
        opacity: 0.72,
        roughness: 0.74,
        side: THREE.DoubleSide,
      }),
    );
    vellumSheet.rotation.x = -Math.PI / 2;
    vellumSheet.position.set(0, 0.004, 1.15);

    const frameRim = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.024, 0.055),
      this.makePaperMat(0xdcd2bc),
    );
    frameRim.position.set(0, 0.006, 2.28);
    const vellumTab = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.028, 0.28),
      this.makePaperMat(0x3b9bb8, 0.45),
    );
    vellumTab.position.set(0, 0.014, 2.42);
    this.bindMechanismTarget(vellumSheet, 'A');
    this.bindMechanismTarget(vellumTab, 'A');
    this.vellumFlap.add(brassSpine, vellumSheet, frameRim, vellumTab);
    this.root.add(this.vellumFlap);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.vellumTargetRot = state.interactions.A.active ? -0.78 : 0;
    this.dialTargetRot = -(state.interactions.B.step * Math.PI) / 2;
    this.nodesTargetConverged = state.interactions.C.active;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    this.animateLevers(dt, reducedMotion);
    const speed = reducedMotion ? 10 : 5.5;
    const k = 1 - Math.exp(-speed * dt);
    this.vellumFlap.rotation.x += (this.vellumTargetRot - this.vellumFlap.rotation.x) * k;
    this.dialWheel.rotation.y += (this.dialTargetRot - this.dialWheel.rotation.y) * k;
    this.gearAux.rotation.y = -this.dialWheel.rotation.y * 2.2;

    const targetN = this.nodesTargetConverged ? 1 : 0;
    this.nodesProgress += (targetN - this.nodesProgress) * k;
    this.nodeArms.forEach((arm) => {
      const ang = arm.userData.angle as number;
      const radX = THREE.MathUtils.lerp(1.12, 0.44, this.nodesProgress);
      const radZ = THREE.MathUtils.lerp(0.92, 0.36, this.nodesProgress);
      arm.position.set(Math.cos(ang) * radX, 0.06, -0.18 + Math.sin(ang) * radZ);
    });

    const starMat = this.starOcta.material as THREE.MeshStandardMaterial;
    starMat.emissiveIntensity = 0.28 + this.nodesProgress * 0.58;
    this.starCore.scale.setScalar(0.84 + this.nodesProgress * 0.28);
    if (!reducedMotion) {
      this.starCore.rotation.y = elapsed * 0.42;
      this.starRing.rotation.z = elapsed * 0.55;
    }
  }
}

export class F02FolioWorld extends BaseFolioWorld {
  private wingLeft!: THREE.Group;
  private wingRight!: THREE.Group;
  private triptychTarget = 0;
  private redactionShutter!: THREE.Group;
  private redactionTargetZ = 0.38;
  private geodeCap!: THREE.Group;
  private geodeFrontDoor!: THREE.Group;
  private geodeTargetOpen = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Pop-up slate celestial horizon backdrop with crisp illustrated stars & layered mountains
    const backdrop = this.buildIllustratedBackdropArch(4.55, 1.28, {
      topHex: '#131A26',
      bottomHex: '#253348',
      cloudHex: '#2F4159',
      accentHex: '#50E0FF',
      motif: 'stars',
      ridgeBackHex: 0x1d2533,
      ridgeFrontHex: 0x2c384b,
    });
    backdrop.position.set(0, this.pageY(0) + 0.01, -1.68);
    this.root.add(backdrop);

    // Stepped Central Pedestal for Wordstreamer + flowing Starsilk ribbons + gothic cream arch behind her
    const centerPlinth = this.buildLayeredTerrace(
      [1.56, 1.34],
      [1.76, 1.5],
      0.032,
      [0xd8ceb8, 0xefe8d6],
      0x262c35,
    );
    centerPlinth.position.set(0, this.pageY(0), -0.24);
    this.root.add(centerPlinth);

    // Framed cream triptych arch behind Wordstreamer
    const archBackC = buildCutCardShape(
      [[-0.58, 0], [-0.58, 0.72], [-0.36, 0.96], [0, 1.08], [0.36, 0.96], [0.58, 0.72], [0.58, 0]],
      0.025,
      this.makePaperMat(0x28303d, 0.82, 0.05, 0, 0, false, true),
    );
    archBackC.position.set(0, this.pageY(0) + 0.064, -0.84);
    this.root.add(archBackC);

    const ws = buildWordstreamerFigure(this.paperBump, 1.15);
    ws.position.set(0, this.pageY(0) + 0.068, -0.36);
    this.root.add(ws);

    // Layered cyan Starsilk conduit ribbons spanning plinth
    const silkMat = this.makePaperMat(0x4ccae8, 0.36, 0.2, 0x165e73, 0.5);
    for (let s = -1; s <= 1; s++) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(0.54 + Math.abs(s) * 0.11, 0.014, 5, 18, Math.PI * 0.72),
        silkMat,
      );
      arc.position.set(0, 0.32 + s * 0.04, 0.04);
      arc.rotation.z = Math.PI * 0.14;
      this.root.add(arc);
    }

    // Brass-railed Slotted Louver Redaction Gate Shutter [B] (non-blocking, slides along track)
    for (const rx of [-0.58, 0.58]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 0.018, 0.92),
        this.makePaperMat(0xc2a25d, 0.36, 0.78),
      );
      rail.position.set(rx, 0.075, 0.56);
      this.root.add(rail);
    }

    this.redactionShutter = new THREE.Group();
    this.redactionShutter.position.set(0, 0.2, 0.38);
    // Thin slotted brass louver bars rather than a thick black brick
    const louverMat = this.makePaperMat(0x232934, 0.72);
    for (let b = 0; b < 3; b++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.042, 0.065), louverMat);
      slat.position.set(0, -0.05 + b * 0.065, 0);
      slat.castShadow = true;
      this.bindMechanismTarget(slat, 'B');
      this.redactionShutter.add(slat);
    }
    const redLabel = this.makeCardLabel('REDACTED PLATE', 'Slide to inspect', 1.24, 0.26, '#20262E', '#FAF4E6', 0.24);
    redLabel.position.set(0, 0.13, 0.04);
    this.bindMechanismTarget(redLabel, 'B');
    this.redactionShutter.add(redLabel);
    this.root.add(this.redactionShutter);

    // Left Hinged Triarchic Gatefold Wing: The Shard-god [A]
    this.wingLeft = new THREE.Group();
    this.wingLeft.position.set(-0.78, this.pageY(-1.4) + 0.03, -0.22);
    const panelL = this.buildLayeredTerrace([1.38, 1.24], [1.75, 1.56], 0.025, [0xd4cab3, 0xe8e0cd], 0x1e242b);
    panelL.position.set(-0.72, 0, 0);
    const archBackL = buildCutCardShape(
      [[-0.5, 0], [-0.5, 0.62], [0, 0.92], [0.5, 0.62], [0.5, 0]],
      0.022,
      this.makePaperMat(0x222833, 0.85, 0.04, 0, 0, false, true),
    );
    archBackL.position.set(-0.72, 0.055, -0.58);
    const shardGod = buildShardGodFigure(this.paperBump, 1.22);
    shardGod.position.set(-0.72, 0.055, -0.1);
    const cardL = this.makeCardLabel('THE SHARD-GOD', 'Triarchic Principle', 1.2, 0.27, '#FAF5E8', '#181C22', 0.22);
    cardL.position.set(-0.72, 0.075, 0.64);
    this.bindMechanismTarget(panelL, 'A');
    this.bindMechanismTarget(shardGod, 'A');
    this.wingLeft.add(panelL, archBackL, shardGod, cardL);
    this.root.add(this.wingLeft);

    // Right Hinged Gatefold Wing: Digital Geode & Inverted NiAlBu [C]
    this.wingRight = new THREE.Group();
    this.wingRight.position.set(0.78, this.pageY(1.4) + 0.03, -0.22);
    const panelR = this.buildLayeredTerrace([1.38, 1.24], [1.75, 1.56], 0.025, [0xd4cab3, 0xe8e0cd], 0x1e242b);
    panelR.position.set(0.72, 0, 0);
    const archBackR = buildCutCardShape(
      [[-0.5, 0], [-0.5, 0.62], [0, 0.92], [0.5, 0.62], [0.5, 0]],
      0.022,
      this.makePaperMat(0x252b38, 0.85, 0.04, 0, 0, false, true),
    );
    archBackR.position.set(0.72, 0.055, -0.58);
    const geode = buildNiAlBuGeode(this.paperBump, 1.12);
    geode.position.set(0.72, 0.055, -0.14);

    // Hinged top crystal cap + translucent crystal inspection door for Digital Geode [C]
    this.geodeCap = new THREE.Group();
    this.geodeCap.position.set(0.72, 0.72, -0.4);
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 0.07, 6),
      this.makePaperMat(0x3b485b, 0.5, 0.1, 0, 0, false, true),
    );
    lid.position.set(0, 0, 0.26);
    lid.castShadow = true;
    this.geodeCap.add(lid);

    this.geodeFrontDoor = new THREE.Group();
    this.geodeFrontDoor.position.set(0.98, 0.4, 0.14);
    const doorFacet = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.5, 0.026),
      new THREE.MeshStandardMaterial({
        color: 0x3b4a5e,
        transparent: true,
        opacity: 0.55,
        roughness: 0.4,
        flatShading: true,
      }),
    );
    doorFacet.position.set(-0.16, 0, 0);
    this.geodeFrontDoor.add(doorFacet);

    this.bindMechanismTarget(lid, 'C');
    this.bindMechanismTarget(doorFacet, 'C');
    this.bindMechanismTarget(geode, 'C');
    const cardR = this.makeCardLabel('NIALBU', 'Digital Geode', 1.2, 0.27, '#FAF5E8', '#181C22', 0.22);
    cardR.position.set(0.72, 0.075, 0.64);
    this.bindMechanismTarget(panelR, 'A');
    this.wingRight.add(panelR, archBackR, geode, this.geodeCap, this.geodeFrontDoor, cardR);
    this.root.add(this.wingRight);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.triptychTarget = state.interactions.A.active ? 1 : 0;
    this.redactionTargetZ = state.interactions.B.active ? 0.96 : 0.38;
    this.geodeTargetOpen = state.interactions.C.active ? 1 : 0;
  }

  public update(dt: number, _elapsed: number, reducedMotion: boolean): void {
    this.animateLevers(dt, reducedMotion);
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5.5) * dt);
    const targetRot = this.triptychTarget ? 0 : 0.36;
    this.wingLeft.rotation.z += (-targetRot - this.wingLeft.rotation.z) * k;
    this.wingRight.rotation.z += (targetRot - this.wingRight.rotation.z) * k;
    this.redactionShutter.position.z += (this.redactionTargetZ - this.redactionShutter.position.z) * k;
    const redY = THREE.MathUtils.lerp(0.2, 0.12, (this.redactionShutter.position.z - 0.38) / 0.58);
    this.redactionShutter.position.y = redY;
    this.geodeCap.rotation.x += (-this.geodeTargetOpen * 1.55 - this.geodeCap.rotation.x) * k;
    this.geodeFrontDoor.rotation.y += (this.geodeTargetOpen * 1.75 - this.geodeFrontDoor.rotation.y) * k;
  }
}

export class F03FolioWorld extends BaseFolioWorld {
  private motherRig!: DraxisRig;
  private eggShellRight!: THREE.Group;
  private eggOpenTarget = 0;
  private strainDraxis: DraxisRig[] = [];
  private thesisCards: THREE.Group[] = [];
  private activeThesisIdx = 0;
  private specimenDeck!: THREE.Group;
  private templeLeftWing!: THREE.Group;
  private templeRightWing!: THREE.Group;
  private strataCore!: THREE.Mesh;
  private templeLiftTarget = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Aureal Nebula illustrated die-cut archival backdrop arch
    const backdrop = this.buildIllustratedBackdropArch(4.85, 1.36, {
      topHex: '#1D1830',
      bottomHex: '#352B52',
      cloudHex: '#4F4274',
      accentHex: '#5CE4FF',
      motif: 'nebula',
      ridgeBackHex: 0x352c4e,
      ridgeFrontHex: 0x524577,
    });
    backdrop.position.set(0, this.pageY(0) + 0.01, -1.68);
    this.root.add(backdrop);

    // Left: Fixed Planetary Homeworld Mother (060) framed by P00 lavender die-cut foothills
    const motherTerrace = this.buildLayeredTerrace([1.56, 1.24], [1.52, 1.22], 0.03, [0x463d5e, 0x625680], 0x221d2e);
    motherTerrace.position.set(-1.42, this.pageY(-1.42), -0.35);
    this.root.add(motherTerrace);

    const lavenderHills = this.buildPaperRidgeCluster(1.52, 3, 0x3f3659, 0x736399, 0.34, 0.048);
    lavenderHills.position.set(-1.42, this.pageY(-1.42) + 0.06, -0.82);
    this.root.add(lavenderHills);

    this.motherRig = buildDraxisModel('060', this.paperBump);
    this.motherRig.group.position.set(-1.42, this.pageY(-1.42) + 0.1, -0.34);
    this.motherRig.group.scale.setScalar(1.16);
    this.root.add(this.motherRig.group);
    const motherLabel = this.makeCardLabel('060 · MOTHER', 'Fixed Homeworld', 1.34, 0.26, '#FAF5E8', '#181C22', 0.2);
    motherLabel.position.set(-1.42, this.pageY(-1.42) + 0.055, 0.7);
    this.root.add(motherLabel);

    // Center-Back: Cutaway Drakken Egg (059) with hinged wing exposing swirling barcode core [A]
    const eggGroup = new THREE.Group();
    eggGroup.position.set(0, this.pageY(0) + 0.02, -0.78);
    const eggCore = buildDraxisModel('059', this.paperBump);
    eggCore.group.scale.setScalar(0.86);

    for (const cy of [0.34, 0.56, 0.78]) {
      const innerCoil = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.015, 5, 16),
        this.makePaperMat(0x52e0ff, 0.35, 0.2, 0x1680a0, 0.6),
      );
      innerCoil.rotation.x = Math.PI / 2;
      innerCoil.position.y = cy;
      eggGroup.add(innerCoil);
    }

    this.eggShellRight = new THREE.Group();
    this.eggShellRight.position.set(0.2, 0.52, -0.12);
    const shellCover = buildCutCardShape(
      [[0, -0.36], [0.22, -0.22], [0.26, 0.12], [0.1, 0.36], [0, 0.36]],
      0.045,
      this.makePaperMat(0x28313f, 0.68, 0.08, 0, 0, false, true),
    );
    shellCover.rotation.y = -0.35;
    shellCover.position.set(-0.08, 0, 0.1);
    shellCover.castShadow = true;
    this.bindMechanismTarget(shellCover, 'A');
    this.eggShellRight.add(shellCover);
    eggGroup.add(eggCore.group, this.eggShellRight);
    this.root.add(eggGroup);

    // Right: Geared Rotating 5 Ecological Theses Pedestal [B]
    this.specimenDeck = new THREE.Group();
    this.specimenDeck.position.set(1.42, this.pageY(1.42), -0.25);
    const gearBase = this.buildBrassGear(0.82, 16, 0.045, 0xc2a25d);
    gearBase.position.y = 0.025;
    const innerPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.72, 0.032, 12),
      this.makePaperMat(0x252b34, 0.74),
    );
    innerPad.position.y = 0.056;
    this.bindMechanismTarget(gearBase, 'B');
    this.bindMechanismTarget(innerPad, 'B');
    this.specimenDeck.add(gearBase, innerPad);
    this.root.add(this.specimenDeck);

    F03_DRAXIS_SEQUENCE.forEach((dId, idx) => {
      const rig = buildDraxisModel(dId, this.paperBump);
      rig.group.position.set(1.42, this.pageY(1.42) + 0.085, -0.25);
      rig.group.scale.setScalar(0.95);
      rig.group.visible = idx === 0;
      this.bindMechanismTarget(rig.group, 'B');
      this.root.add(rig.group);
      this.strainDraxis.push(rig);

      const tCard = this.makeCardLabel('5 ECOLOGICAL THESES', F03_THESIS_LABELS[idx], 1.44, 0.26, '#FAF5E8', '#181C22', 0.2);
      tCard.position.set(1.42, this.pageY(1.42) + 0.055, 0.78);
      tCard.visible = idx === 0;
      this.bindMechanismTarget(tCard, 'B');
      this.root.add(tCard);
      this.thesisCards.push(tCard);
    });

    // Center-Front: Parting Neoclassical Mortal Temple Facade hiding Terraforming Strata [C]
    const templeMount = new THREE.Group();
    templeMount.position.set(0, this.pageY(0) + 0.02, 0.64);
    const strataSlab = this.buildLayeredTerrace([1.3, 1.06], [0.76, 0.56], 0.026, [0x2a333e, 0x3b9bb8], 0x1a2026);
    this.strataCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.044, 0.36),
      this.makePaperMat(0x4ccae8, 0.36, 0.2, 0x165e73, 0.5),
    );
    this.strataCore.position.y = 0.072;

    const marbleMat = this.makePaperMat(0xeae2ce, 0.82, 0.04, 0, 0, false, true);
    const gableMat = this.makePaperMat(0xc2a25d, 0.42, 0.62, 0, 0, false, true);

    this.templeLeftWing = new THREE.Group();
    this.templeLeftWing.position.set(-0.56, 0.06, 0);
    const colWallL = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.28, 0.36), marbleMat);
    colWallL.position.set(0.27, 0.14, 0);
    for (const cx of [0.1, 0.28, 0.46]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.3, 6), marbleMat);
      col.position.set(cx, 0.15, 0.19);
      this.templeLeftWing.add(col);
    }
    const roofL = buildCutCardShape([[-0.28, 0], [0.28, 0], [0.28, 0.18]], 0.42, gableMat);
    roofL.position.set(0.27, 0.28, 0);
    this.templeLeftWing.add(colWallL, roofL);

    this.templeRightWing = new THREE.Group();
    this.templeRightWing.position.set(0.56, 0.06, 0);
    const colWallR = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.28, 0.36), this.makePaperMat(0xd8cfb8, 0.82, 0.04, 0, 0, false, true));
    colWallR.position.set(-0.27, 0.14, 0);
    for (const cx of [-0.1, -0.28, -0.46]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.3, 6), marbleMat);
      col.position.set(cx, 0.15, 0.19);
      this.templeRightWing.add(col);
    }
    const roofR = buildCutCardShape([[-0.28, 0], [0.28, 0], [-0.28, 0.18]], 0.42, gableMat);
    roofR.position.set(-0.27, 0.28, 0);
    this.templeRightWing.add(colWallR, roofR);

    this.bindMechanismTarget(colWallL, 'C');
    this.bindMechanismTarget(colWallR, 'C');
    this.bindMechanismTarget(this.strataCore, 'C');
    templeMount.add(strataSlab, this.strataCore, this.templeLeftWing, this.templeRightWing);
    this.root.add(templeMount);

    this.syncState(state, null);
  }

  public syncState(state: FolioRuntimeState, activeDraxisId: DraxisId | null): void {
    this.syncLevers(state);
    this.eggOpenTarget = state.interactions.A.active ? 1.48 : 0;
    const requestedIdx = activeDraxisId ? F03_DRAXIS_SEQUENCE.indexOf(activeDraxisId) : -1;
    this.activeThesisIdx = requestedIdx >= 0 ? requestedIdx : state.interactions.B.step % F03_DRAXIS_SEQUENCE.length;
    this.strainDraxis.forEach((rig, idx) => {
      rig.group.visible = idx === this.activeThesisIdx;
    });
    this.thesisCards.forEach((card, idx) => {
      card.visible = idx === this.activeThesisIdx;
    });
    this.templeLiftTarget = state.interactions.C.active ? 1.28 : 0;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    this.animateLevers(dt, reducedMotion);
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5.5) * dt);
    this.eggShellRight.rotation.y += (this.eggOpenTarget - this.eggShellRight.rotation.y) * k;
    this.templeLeftWing.rotation.z += (this.templeLiftTarget - this.templeLeftWing.rotation.z) * k;
    this.templeRightWing.rotation.z += (-this.templeLiftTarget - this.templeRightWing.rotation.z) * k;
    const deckAngle = -(this.activeThesisIdx * Math.PI * 2) / 5;
    this.specimenDeck.rotation.y += (deckAngle - this.specimenDeck.rotation.y) * k;
    if (!reducedMotion) {
      this.motherRig.animate(elapsed, true);
      const active = this.strainDraxis[this.activeThesisIdx];
      active?.animate(elapsed, true);
    }
  }
}
