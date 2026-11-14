import * as THREE from 'three';
import { FolioRuntimeState } from '../../types/atlas';
import { buildCodecFigure, buildShardGodFigure } from '../drakken/CharacterFigures';
import { buildCutCardShape, getSharedPapercraftTextures } from '../drakken/papercraftArt';
import { BaseFolioWorld } from './BaseFolioWorld';

export class F07FolioWorld extends BaseFolioWorld {
  private planOverlay!: THREE.Group;
  private planLiftTarget = 0;
  private outcomePlate!: THREE.Group;
  private outcomeLiftTarget = 0;
  private supplyArm!: THREE.Group;
  private supplyGear!: THREE.Group;
  private supplyRotTarget = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);
    const sharedTex = getSharedPapercraftTextures();

    // Ruby-obsidian tactical horizon arch
    const arch = this.buildIllustratedBackdropArch(4.55, 1.38, {
      topHex: '#241318',
      bottomHex: '#462026',
      cloudHex: '#5E2B32',
      accentHex: '#D8A24A',
      motif: 'nebula',
      ridgeBackHex: 0x2c171b,
      ridgeFrontHex: 0x452227,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // Base stepped obsidian Ruby Eclipse tactical relief board
    const baseY = this.pageY(0);
    const board = this.buildLayeredTerrace(
      [3.18, 2.88],
      [2.04, 1.84],
      0.026,
      [0x1d2128, 0x2a2f38],
      0xb89650,
    );
    board.position.set(0, baseY, -0.22);
    this.root.add(board);

    // Sculpted crimson/slate fortress ridges along upper tactical horizon
    const crags = this.buildPaperRidgeCluster(2.7, 2, 0x351b1e, 0x5c272c, 0.24, 0.04);
    crags.position.set(0, baseY + 0.052, -0.96);
    this.root.add(crags);

    const gridMat = this.makePaperMat(0x635b4c, 0.72);
    for (let gx = -1.1; gx <= 1.1; gx += 0.55) {
      const rule = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 1.65), gridMat);
      rule.position.set(gx, baseY + 0.058, -0.22);
      this.root.add(rule);
    }

    const rubyNode = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26, 0),
      this.makePaperMat(0xa8322a, 0.38, 0.24, 0x4a120f, 0.4, false, true),
    );
    rubyNode.position.set(-0.62, baseY + 0.36, -0.28);
    rubyNode.castShadow = true;
    this.root.add(rubyNode);

    const unkCard = this.makeCardLabel(
      'TACTICS · CASUALTIES',
      'SOURCE RECORD: UNKNOWN',
      1.62,
      0.34,
      '#1F232A',
      '#FAF4E6',
      0.2,
    );
    unkCard.position.set(0.68, baseY + 0.085, -0.56);
    this.root.add(unkCard);

    // [A] Rear-hinged Translucent Printed Star-Chart Vellum Sheet lifting cleanly above tactical board
    const hingePost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 2.74, 8),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    hingePost.rotation.z = Math.PI / 2;
    hingePost.position.set(0, baseY + 0.14, -1.0);
    this.root.add(hingePost);

    this.planOverlay = new THREE.Group();
    this.planOverlay.position.set(0, baseY + 0.14, -1.0);

    // Perimeter cardstock frame rails so center remains completely crystal-clear acetate
    const frameMat = this.makePaperMat(0xd6ccb6, 0.85);
    const barF = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.02, 0.06), frameMat);
    barF.position.set(0, 0, 1.5);
    const barL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 1.5), frameMat);
    barL.position.set(-1.32, 0, 0.78);
    const barR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 1.5), frameMat);
    barR.position.set(1.32, 0, 0.78);

    const planSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.58, 1.44),
      new THREE.MeshStandardMaterial({
        map: sharedTex.vellumTactical,
        transparent: true,
        opacity: 0.76,
        roughness: 0.65,
        side: THREE.DoubleSide,
      }),
    );
    planSheet.rotation.x = -Math.PI / 2;
    planSheet.position.set(0, 0.008, 0.78);

    this.bindMechanismTarget(barF, 'A');
    this.bindMechanismTarget(planSheet, 'A');
    this.planOverlay.add(barF, barL, barR, planSheet);
    this.root.add(this.planOverlay);

    // [B] Hinged Flip Outcome Cost Card on brass easel
    this.outcomePlate = new THREE.Group();
    this.outcomePlate.position.set(0.68, baseY + 0.16, 0.36);
    const flipCard = this.makeCardLabel(
      'SIEGE OUTCOME · YEAR 121',
      'Attrition Cost · Unknown Totals',
      1.58,
      0.34,
      '#7C231F',
      '#FAF4E6',
      0.24,
    );
    this.bindMechanismTarget(flipCard, 'B');
    this.outcomePlate.add(flipCard);
    this.root.add(this.outcomePlate);

    // [C] Brass Caliper Gear Pivot + Logistics Support Arm
    this.supplyGear = this.buildBrassGear(0.24, 12, 0.036);
    this.supplyGear.position.set(-1.38, baseY + 0.08, 0.45);
    this.root.add(this.supplyGear);

    this.supplyArm = new THREE.Group();
    this.supplyArm.position.set(-1.38, baseY + 0.1, 0.45);
    const conduit = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.05, 0.14),
      this.makePaperMat(0xc29e59, 0.4, 0.65),
    );
    conduit.position.set(0.68, 0.02, 0);
    conduit.castShadow = true;
    const caliperPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8),
      this.makePaperMat(0x9e322b, 0.5),
    );
    caliperPin.position.set(1.32, 0.05, 0);
    this.bindMechanismTarget(conduit, 'C');
    this.bindMechanismTarget(caliperPin, 'C');
    this.supplyArm.add(conduit, caliperPin);
    this.root.add(this.supplyArm);

    const lbl = this.makeCardLabel('YEARS 120–169 · RUBY ECLIPSE', 'Siege Planning & Unknowns', 2.45, 0.27, '#FAF5E8', '#181C22', 0.2);
    lbl.position.set(0, baseY + 0.055, 1.08);
    this.root.add(lbl);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.planLiftTarget = state.interactions.A.active ? -0.76 : 0;
    this.outcomeLiftTarget = state.interactions.B.active ? 0.28 : 0;
    this.supplyRotTarget = state.interactions.C.active ? -0.45 : 0;
  }

  public update(dt: number, _elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.planOverlay.rotation.x += (this.planLiftTarget - this.planOverlay.rotation.x) * k;
    this.outcomePlate.position.y += (this.pageY(0) + 0.16 + this.outcomeLiftTarget - this.outcomePlate.position.y) * k;
    this.supplyArm.rotation.y += (this.supplyRotTarget - this.supplyArm.rotation.y) * k;
    this.supplyGear.rotation.y = this.supplyArm.rotation.y * 2;
    this.animateLevers(dt, reducedMotion);
  }
}

export class F08FolioWorld extends BaseFolioWorld {
  private doorLeft!: THREE.Group;
  private doorRight!: THREE.Group;
  private doorOpenRatio = 0;
  private doorTarget = 0;

  private fractureBand!: THREE.Mesh;
  private snareLines: THREE.Mesh[] = [];
  private isFractured = false;

  private worldStrip!: THREE.Group;
  private stripExpand = 0.2;
  private stripScaleTarget = 0.2;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Aureal Gate celestial portal backdrop arch
    const arch = this.buildIllustratedBackdropArch(4.55, 1.44, {
      topHex: '#151B27',
      bottomHex: '#28364C',
      cloudHex: '#354863',
      accentHex: '#4FD8F4',
      motif: 'stars',
      ridgeBackHex: 0x1d2534,
      ridgeFrontHex: 0x2c394f,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // Grounded stepped obsidian Aureal Gate dais
    const dais = this.buildLayeredTerrace([2.8, 2.3], [1.65, 1.35], 0.028, [0x242933, 0x323845], 0x4ccae8);
    dais.position.set(-0.15, this.pageY(-0.15), -0.32);
    this.root.add(dais);

    // Carved Layered Papercraft Aureal Gate Portal Pillars + Stepped Lintel Arch framing Shard-god
    const pillarMat = this.makePaperMat(0x1b2028, 0.8, 0.05, 0, 0, false, true);
    const capMat = this.makePaperMat(0xc2a25d, 0.4, 0.72);
    for (const px of [-1.05, 0.35]) {
      const py = this.pageY(px) + 0.04;
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.96, 0.22), pillarMat);
      col.position.set(px, py + 0.48, -0.35);
      col.castShadow = true;
      const fluting = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.86, 0.25), this.makePaperMat(0x2a3342, 0.75));
      fluting.position.set(px, py + 0.48, -0.35);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.3), capMat);
      cap.position.set(px, py + 0.98, -0.35);
      this.root.add(col, fluting, cap);
    }

    // Overhead carved gate lintel pediment spanning between twin pillars
    const lintelBeam = buildCutCardShape(
      [[-0.84, 0], [-0.84, 0.14], [0, 0.28], [0.84, 0.14], [0.84, 0]],
      0.16,
      pillarMat,
    );
    lintelBeam.position.set(-0.35, this.pageY(-0.35) + 1.02, -0.35);
    const lintelTrim = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.04, 0.24), capMat);
    lintelTrim.position.set(-0.35, this.pageY(-0.35) + 1.04, -0.35);
    this.root.add(lintelBeam, lintelTrim);

    // Central The Shard-god + Codec Witness at Aureal Gate
    const shardGod = buildShardGodFigure(this.paperBump, 1.22);
    shardGod.position.set(-0.35, this.pageY(-0.35) + 0.06, -0.35);
    this.addGroundShadow(shardGod, 0.42, 0.4);
    this.root.add(shardGod);

    const codec = buildCodecFigure(this.paperBump, 0.95);
    codec.position.set(1.12, this.pageY(1.12) + 0.05, -0.2);
    this.addGroundShadow(codec, 0.34, 0.36);
    this.root.add(codec);

    // [B] Weaponized cyan Starsilk snare threads + crimson vulnerability fracture ring
    const silkMat = this.makePaperMat(0x4ccae8, 0.35, 0.2, 0x165e73, 0.5);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.4, 5), silkMat);
      line.position.set(-0.35, this.pageY(-0.35) + 0.48, -0.35);
      line.rotation.z = Math.PI / 2;
      line.rotation.y = a;
      this.bindMechanismTarget(line, 'B');
      this.root.add(line);
      this.snareLines.push(line);
    }

    this.fractureBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.045, 6, 20),
      this.makePaperMat(0xa13229, 0.48, 0.16),
    );
    this.fractureBand.rotation.x = Math.PI / 2;
    this.fractureBand.position.set(-0.35, this.pageY(-0.35) + 0.48, -0.35);
    this.bindMechanismTarget(this.fractureBand, 'B');
    this.root.add(this.fractureBand);

    // [A] Split Outward-Parting Shield Doors with cutaway upper brass grillwork so Shard-god stays readable
    const shieldMat = this.makePaperMat(0x282d36, 0.78);
    const buildGateDoorLeaf = (dir: 1 | -1) => {
      const leaf = new THREE.Group();
      const lowerPlate = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.44, 0.045), shieldMat);
      lowerPlate.position.set(0.33 * dir, 0.22, 0);
      lowerPlate.castShadow = true;
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.045, 0.05), capMat);
      topRail.position.set(0.33 * dir, 0.76, 0);
      const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.045, 0.055), capMat);
      midRail.position.set(0.33 * dir, 0.44, 0);
      const outerStile = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.05), capMat);
      outerStile.position.set(0.025 * dir, 0.39, 0);
      const innerStile = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.05), capMat);
      innerStile.position.set(0.635 * dir, 0.39, 0);
      const grillBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.03), capMat);
      grillBar.position.set(0.33 * dir, 0.6, 0);
      this.bindMechanismTarget(lowerPlate, 'A');
      this.bindMechanismTarget(midRail, 'A');
      leaf.add(lowerPlate, topRail, midRail, outerStile, innerStile, grillBar);
      return leaf;
    };

    this.doorLeft = new THREE.Group();
    this.doorLeft.position.set(-1.02, this.pageY(-1.02) + 0.06, 0.18);
    this.doorLeft.add(buildGateDoorLeaf(1));

    this.doorRight = new THREE.Group();
    this.doorRight.position.set(0.32, this.pageY(0.32) + 0.06, 0.18);
    this.doorRight.add(buildGateDoorLeaf(-1));
    this.root.add(this.doorLeft, this.doorRight);

    // [C] 20 Conquered Worlds Stepped Monument Risers on slate archival tray
    const tray = this.buildLayeredTerrace([1.14, 1.04], [0.58, 0.5], 0.022, [0x242830, 0x353b47], 0xc2a25d);
    tray.position.set(-1.26, this.pageY(-1.26), 0.78);
    this.root.add(tray);

    this.worldStrip = new THREE.Group();
    this.worldStrip.position.set(-1.62, this.pageY(-1.26) + 0.044, 0.68);
    for (let i = 0; i < 20; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(0.072, 0.055 + (i % 3) * 0.022, 0.15),
        this.makePaperMat(row === 0 ? 0x8c2a24 : 0xa83e35, 0.65, 0.04, 0, 0, false, true),
      );
      tile.position.set(col * 0.08, 0.028 + row * 0.018, row * 0.2);
      tile.castShadow = true;
      this.bindMechanismTarget(tile, 'C');
      this.worldStrip.add(tile);
    }
    this.root.add(this.worldStrip);

    const lbl = this.makeCardLabel(
      'YEAR 170 · AUREAL GATE',
      '20 Conquered Worlds Schematic',
      2.4,
      0.26,
      '#FAF5E8',
      '#181C22',
      0.2,
    );
    lbl.position.set(0.2, this.pageY(0.2) + 0.055, -1.24);
    this.root.add(lbl);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.doorTarget = state.interactions.A.active ? 1 : 0;
    this.isFractured = state.interactions.B.active;
    this.stripScaleTarget = state.interactions.C.active ? 1.0 : 0.45;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.doorOpenRatio += (this.doorTarget - this.doorOpenRatio) * k;
    const gateAng = 0.2 + this.doorOpenRatio * 1.32;
    this.doorLeft.rotation.y = -gateAng;
    this.doorRight.rotation.y = gateAng;

    const bandTarget = this.isFractured ? 1.0 : 0.12;
    this.fractureBand.scale.lerp(new THREE.Vector3(bandTarget, bandTarget, bandTarget), k);
    this.snareLines.forEach((l, idx) => {
      l.scale.x = this.isFractured ? 1.0 : 0.72;
      if (!reducedMotion) {
        l.rotation.y = (idx / 4) * Math.PI * 2 + Math.PI / 4 + elapsed * (this.isFractured ? 0.35 : 0.08);
      }
    });

    this.stripExpand += (this.stripScaleTarget - this.stripExpand) * k;
    this.worldStrip.scale.x = this.stripExpand;
    this.worldStrip.scale.y = 0.6 + this.stripExpand * 0.9;
    this.animateLevers(dt, reducedMotion);
  }
}

export class F09FolioWorld extends BaseFolioWorld {
  // Sacrificial Model Star (irreversibly collapses into black hole when f09_a fires)
  private modelStarGroup!: THREE.Group;
  private modelBlackHoleMesh!: THREE.Mesh;
  private modelAccretionRing!: THREE.Mesh;
  private gimbalOuter!: THREE.Mesh;
  private gimbalInner!: THREE.Mesh;
  private starCollapsed = false;
  private collapseProgress = 0;

  // Sequential 4-star cluster bar [B]
  private seqStars: { star: THREE.Mesh; hole: THREE.Mesh }[] = [];
  private seqStep = 0;

  // Wide containment boundary calipers [C]
  private boundaryRings!: THREE.Group;
  private boundaryScaleTarget = 0.42;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Midnight singularity illustrated horizon arch
    const arch = this.buildIllustratedBackdropArch(4.55, 1.4, {
      topHex: '#0C0F18',
      bottomHex: '#1A2334',
      cloudHex: '#253146',
      accentHex: '#4BE0FF',
      motif: 'stars',
      ridgeBackHex: 0x141a26,
      ridgeFrontHex: 0x222c3d,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // 1. Central Sacrificial MODEL STAR demonstration [A] in multi-ring brass armillary gimbal
    const modelBaseY = this.pageY(-1.02);
    const ped = this.buildLayeredTerrace([1.36, 1.12], [1.36, 1.12], 0.025, [0x242830, 0x353b47], 0xc2a25d);
    ped.position.set(-1.02, modelBaseY, -0.34);
    this.root.add(ped);

    const modelGroup = new THREE.Group();
    modelGroup.position.set(-1.02, modelBaseY + 0.56, -0.34);

    const plaque = this.makeCardLabel('MODEL STAR', 'Irreversible Filament Law', 1.36, 0.27, '#22262C', '#FAF3E4', 0.22);
    plaque.position.set(0, -0.44, 0.72);
    modelGroup.add(plaque);

    const brassMat = this.makePaperMat(0xc2a25d, 0.36, 0.78);
    this.gimbalOuter = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.022, 6, 32), brassMat);
    this.gimbalOuter.rotation.y = Math.PI / 6;
    this.gimbalInner = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.016, 6, 28), brassMat);
    this.gimbalInner.rotation.x = Math.PI / 3;

    // Sculpted layered origami star crystal
    this.modelStarGroup = new THREE.Group();
    const starA = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      this.makePaperMat(0xf4c96b, 0.42, 0.2, 0xb8761c, 0.55, false, true),
    );
    const starB = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      this.makePaperMat(0xffdf8e, 0.38, 0.25, 0xd48d22, 0.4, false, true),
    );
    starB.rotation.set(Math.PI / 4, Math.PI / 4, 0);
    starB.scale.setScalar(0.86);
    starA.castShadow = true;
    this.modelStarGroup.add(starA, starB);

    this.modelBlackHoleMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x050608 }),
    );
    this.modelBlackHoleMesh.scale.setScalar(0.01);
    this.modelBlackHoleMesh.visible = false;

    this.modelAccretionRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.032, 6, 28),
      this.makePaperMat(0x4ccae8, 0.35, 0.2, 0x165e73, 0.55),
    );
    this.modelAccretionRing.rotation.x = Math.PI / 2 - 0.22;
    this.modelAccretionRing.scale.setScalar(0.01);
    this.modelAccretionRing.visible = false;

    // Pullable cyan Starsilk extraction tether & crystal pull-ring
    const tether = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.44, 6),
      this.makePaperMat(0x4ccae8, 0.35, 0.2, 0x165e73, 0.45),
    );
    tether.rotation.z = Math.PI / 2;
    tether.position.set(0.34, 0, 0);

    const pullRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.026, 6, 16),
      this.makePaperMat(0x4ccae8, 0.35, 0.25),
    );
    pullRing.position.set(0.58, 0, 0);
    pullRing.rotation.x = Math.PI / 2;

    this.bindMechanismTarget(starA, 'A');
    this.bindMechanismTarget(starB, 'A');
    this.bindMechanismTarget(pullRing, 'A');
    this.bindMechanismTarget(this.modelBlackHoleMesh, 'A');
    modelGroup.add(
      this.gimbalOuter,
      this.gimbalInner,
      this.modelStarGroup,
      this.modelBlackHoleMesh,
      this.modelAccretionRing,
      tether,
      pullRing,
    );
    this.root.add(modelGroup);

    // 2. Sequential Destruction 4-Star Cluster [B] mounted on brass cradles
    for (let i = 0; i < 4; i++) {
      const sx = 0.48 + i * 0.46;
      const py = this.pageY(sx);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.04, 0.34, 6), brassMat);
      pin.position.set(sx, py + 0.17, -0.54);
      const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 5, 12), brassMat);
      cradle.rotation.x = Math.PI / 2;
      cradle.position.set(sx, py + 0.34, -0.54);
      this.root.add(pin, cradle);

      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        this.makePaperMat(0xedd07a, 0.42, 0.22, 0x8f5b14, 0.35, false, true),
      );
      star.position.set(sx, py + 0.42, -0.54);
      star.castShadow = true;

      const hole = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x050608 }),
      );
      hole.position.copy(star.position);
      hole.visible = false;

      this.bindMechanismTarget(star, 'B');
      this.bindMechanismTarget(hole, 'B');
      this.root.add(star, hole);
      this.seqStars.push({ star, hole });
    }

    // 3. Cumulative Singularity Boundary Expansion Calipers [C]
    this.boundaryRings = new THREE.Group();
    this.boundaryRings.position.set(0.28, this.pageY(0.28) + 0.06, 0.18);
    for (const r of [0.78, 1.24, 1.72]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.024, 6, 32),
        this.makePaperMat(0x282c32, 0.65),
      );
      ring.rotation.x = Math.PI / 2;
      this.bindMechanismTarget(ring, 'C');
      this.boundaryRings.add(ring);
    }
    this.root.add(this.boundaryRings);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.starCollapsed = state.interactions.A.active || state.interactions.A.locked;

    this.seqStep = state.interactions.B.step;
    this.seqStars.forEach((item, idx) => {
      const collapsed = idx < this.seqStep;
      item.star.visible = !collapsed;
      item.hole.visible = collapsed;
    });

    this.boundaryScaleTarget = state.interactions.C.active ? 1.0 : 0.42;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.boundaryRings.scale.lerp(
      new THREE.Vector3(this.boundaryScaleTarget, 1, this.boundaryScaleTarget),
      k,
    );

    const collapseTarget = this.starCollapsed ? 1 : 0;
    if (reducedMotion) {
      this.collapseProgress = collapseTarget;
    } else {
      this.collapseProgress += (collapseTarget - this.collapseProgress) * k;
    }

    const starVis = this.collapseProgress < 0.55;
    this.modelStarGroup.visible = starVis;
    this.modelStarGroup.scale.setScalar(Math.max(0.01, 1 - this.collapseProgress * 1.6));

    const bhVis = this.collapseProgress > 0.25;
    this.modelBlackHoleMesh.visible = bhVis;
    this.modelAccretionRing.visible = bhVis;
    const bhScale = THREE.MathUtils.clamp((this.collapseProgress - 0.2) / 0.8, 0.01, 1);
    this.modelBlackHoleMesh.scale.setScalar(bhScale);
    this.modelAccretionRing.scale.setScalar(bhScale);

    if (!reducedMotion) {
      if (starVis) {
        this.modelStarGroup.rotation.y = elapsed * 0.5;
      }
      if (bhVis) {
        this.modelAccretionRing.rotation.z = elapsed * 0.45;
      }
      this.gimbalOuter.rotation.z = elapsed * 0.22;
      this.gimbalInner.rotation.y = -elapsed * 0.34;
    }
    this.animateLevers(dt, reducedMotion);
  }
}
