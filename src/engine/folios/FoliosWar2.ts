import * as THREE from 'three';
import { FolioRuntimeState } from '../../types/atlas';
import { buildCodecFigure, buildShardGodFigure } from '../drakken/CharacterFigures';
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

    // Ruby-obsidian tactical horizon arch
    const arch = this.buildBackdropArch(4.5, 1.38, 0x2d1f23, 0xb89650);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    // Base stepped obsidian Ruby Eclipse tactical relief board
    const baseY = this.pageY(0);
    const board = this.buildLayeredTerrace(
      [3.15, 2.86],
      [2.02, 1.84],
      0.026,
      [0x1e2228, 0x2a2f38],
      0xb89650,
    );
    board.position.set(0, baseY, -0.22);
    this.root.add(board);

    // Etched tactical grid rules & bastion blocks
    const gridMat = this.makePaperMat(0x5d5649, 0.72);
    for (let gx = -1.1; gx <= 1.1; gx += 0.55) {
      const rule = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 1.65), gridMat);
      rule.position.set(gx, baseY + 0.058, -0.22);
      this.root.add(rule);
    }

    const rubyNode = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26, 0),
      this.makePaperMat(0x9e322b, 0.42, 0.22, 0x45120f, 0.35),
    );
    rubyNode.position.set(-0.62, baseY + 0.36, -0.28);
    rubyNode.castShadow = true;
    this.root.add(rubyNode);

    const unkCard = this.makeCardLabel(
      'TACTICS · CASUALTIES',
      'SOURCE RECORD: UNKNOWN',
      1.62,
      0.34,
      '#20242A',
      '#E2D8C4',
      0.16,
    );
    unkCard.position.set(0.68, baseY + 0.08, -0.58);
    this.root.add(unkCard);

    // [A] Rear-hinged Translucent Plan Overlay Sheet lifting cleanly above tactical board
    const hingePost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 2.72, 8),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    hingePost.rotation.z = Math.PI / 2;
    hingePost.position.set(0, baseY + 0.14, -1.0);
    this.root.add(hingePost);

    this.planOverlay = new THREE.Group();
    this.planOverlay.position.set(0, baseY + 0.14, -1.0);
    const planFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.68, 0.018, 1.52),
      this.makePaperMat(0xd6ccb6, 0.85),
    );
    planFrame.position.set(0, 0, 0.78);
    const planSheet = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.022, 1.38),
      new THREE.MeshStandardMaterial({
        color: 0xf4ecd8,
        transparent: true,
        opacity: 0.44,
        roughness: 0.7,
        side: THREE.DoubleSide,
      }),
    );
    planSheet.position.set(0, 0.006, 0.78);
    this.bindMechanismTarget(planFrame, 'A');
    this.bindMechanismTarget(planSheet, 'A');
    this.planOverlay.add(planFrame, planSheet);
    this.root.add(this.planOverlay);

    // [B] Hinged Flip Outcome Cost Card on brass easel
    this.outcomePlate = new THREE.Group();
    this.outcomePlate.position.set(0.68, baseY + 0.16, 0.34);
    const flipCard = this.makeCardLabel(
      'SIEGE OUTCOME · YEAR 121',
      'Attrition Cost · Unknown Totals',
      1.58,
      0.34,
      '#7C231F',
      '#F3EEE1',
      0.22,
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

    const lbl = this.makeCardLabel('YEARS 120–169 · RUBY ECLIPSE', 'Siege Planning & Unknowns', 2.45, 0.26, '#EFE9DA', '#20262E', 0.18);
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

    // Aureal Gate arch
    const arch = this.buildBackdropArch(4.5, 1.44, 0x222730, 0x4ccae8);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    // Grounded stepped obsidian Aureal Gate dais
    const dais = this.buildLayeredTerrace([2.8, 2.3], [1.65, 1.35], 0.028, [0x242933, 0x323845], 0x4ccae8);
    dais.position.set(-0.15, this.pageY(-0.15), -0.32);
    this.root.add(dais);

    // Twin obsidian Aureal Gate gateposts framing Shard-god
    const pillarMat = this.makePaperMat(0x1b2028, 0.8);
    const capMat = this.makePaperMat(0xc2a25d, 0.4, 0.72);
    for (const px of [-1.05, 0.35]) {
      const py = this.pageY(px) + 0.04;
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.96, 0.22), pillarMat);
      col.position.set(px, py + 0.48, -0.35);
      col.castShadow = true;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.3), capMat);
      cap.position.set(px, py + 0.98, -0.35);
      this.root.add(col, cap);
    }

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

    // [A] Split Outward-Parting Shield Doors mounted cleanly on front gateposts (ZERO center diagonal clipping)
    const shieldMat = this.makePaperMat(0x282d36, 0.78);
    this.doorLeft = new THREE.Group();
    this.doorLeft.position.set(-1.02, this.pageY(-1.02) + 0.06, 0.18);
    const leafL = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.86, 0.045), shieldMat);
    leafL.position.set(0.33, 0.43, 0);
    leafL.castShadow = true;
    this.doorLeft.add(leafL);

    this.doorRight = new THREE.Group();
    this.doorRight.position.set(0.32, this.pageY(0.32) + 0.06, 0.18);
    const leafR = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.86, 0.045), shieldMat);
    leafR.position.set(-0.33, 0.43, 0);
    leafR.castShadow = true;
    this.doorRight.add(leafR);

    this.bindMechanismTarget(leafL, 'A');
    this.bindMechanismTarget(leafR, 'A');
    this.root.add(this.doorLeft, this.doorRight);

    // [C] 20 Conquered Worlds Stepped Risers (non-geographic schematic tile array)
    this.worldStrip = new THREE.Group();
    this.worldStrip.position.set(-1.62, this.pageY(0) + 0.04, 0.74);
    for (let i = 0; i < 20; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.045, 0.24),
        this.makePaperMat(row === 0 ? 0x8c2a24 : 0xa53a32, 0.65),
      );
      tile.position.set(col * 0.36, 0.022 + row * 0.02, row * 0.32);
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
      '#EFE9DA',
      '#20262E',
      0.16,
    );
    lbl.position.set(0.2, this.pageY(0.2) + 0.05, -1.25);
    this.root.add(lbl);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.doorTarget = state.interactions.A.active ? 1 : 0;
    this.isFractured = state.interactions.B.active;
    this.stripScaleTarget = state.interactions.C.active ? 1.0 : 0.22;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.doorOpenRatio += (this.doorTarget - this.doorOpenRatio) * k;
    this.doorLeft.rotation.y = this.doorOpenRatio * 1.48;
    this.doorRight.rotation.y = -this.doorOpenRatio * 1.48;

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
  private modelStarMesh!: THREE.Mesh;
  private modelBlackHoleMesh!: THREE.Mesh;
  private modelAccretionRing!: THREE.Mesh;
  private gimbalRing!: THREE.Mesh;
  private starCollapsed = false;

  // Sequential 4-star cluster bar [B]
  private seqStars: { star: THREE.Mesh; hole: THREE.Mesh }[] = [];
  private seqStep = 0;

  // Wide containment boundary calipers [C]
  private boundaryRings!: THREE.Group;
  private boundaryScaleTarget = 0.42;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Midnight obsidian horizon arch
    const arch = this.buildBackdropArch(4.5, 1.4, 0x181c24, 0x4ccae8);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    // 1. Central Sacrificial MODEL STAR demonstration [A] in brass gimbal cage (nonhistorical teaching model)
    const modelBaseY = this.pageY(-1.02);
    const ped = this.buildLayeredTerrace([1.32, 1.1], [1.32, 1.1], 0.025, [0x242830, 0x353b47], 0xc2a25d);
    ped.position.set(-1.02, modelBaseY, -0.34);
    this.root.add(ped);

    const modelGroup = new THREE.Group();
    modelGroup.position.set(-1.02, modelBaseY + 0.56, -0.34);

    const plaque = this.makeCardLabel('MODEL STAR', 'Irreversible Filament Law', 1.32, 0.26, '#24272D', '#F2E7CA', 0.18);
    plaque.position.set(0, -0.44, 0.72);
    modelGroup.add(plaque);

    this.gimbalRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.49, 0.022, 6, 28),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    this.gimbalRing.rotation.y = Math.PI / 6;

    this.modelStarMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.36, 1),
      this.makePaperMat(0xf4c96b, 0.42, 0.2, 0xb8761c, 0.55),
    );
    this.modelStarMesh.castShadow = true;

    this.modelBlackHoleMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x050608 }),
    );
    this.modelBlackHoleMesh.visible = false;

    this.modelAccretionRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.028, 6, 26),
      this.makePaperMat(0x4ccae8, 0.35, 0.2, 0x165e73, 0.5),
    );
    this.modelAccretionRing.rotation.x = Math.PI / 2 - 0.22;
    this.modelAccretionRing.visible = false;

    // Pullable cyan Starsilk extraction tether & ring
    const tether = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6),
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

    this.bindMechanismTarget(this.modelStarMesh, 'A');
    this.bindMechanismTarget(pullRing, 'A');
    this.bindMechanismTarget(this.modelBlackHoleMesh, 'A');
    modelGroup.add(
      this.gimbalRing,
      this.modelStarMesh,
      this.modelBlackHoleMesh,
      this.modelAccretionRing,
      tether,
      pullRing,
    );
    this.root.add(modelGroup);

    // 2. Sequential Destruction 4-Star Cluster [B] mounted on brass pins
    const brassMat = this.makePaperMat(0xc2a25d, 0.36, 0.78);
    for (let i = 0; i < 4; i++) {
      const sx = 0.48 + i * 0.46;
      const py = this.pageY(sx);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.032, 0.34, 6), brassMat);
      pin.position.set(sx, py + 0.17, -0.54);
      this.root.add(pin);

      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        this.makePaperMat(0xedd07a, 0.45, 0.2, 0x8f5b14, 0.35),
      );
      star.position.set(sx, py + 0.4, -0.54);
      star.castShadow = true;

      const hole = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
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
    // Irreversible law: once f09_a activates, star stays black hole throughout session
    this.starCollapsed = state.interactions.A.active || state.interactions.A.locked;
    this.modelStarMesh.visible = !this.starCollapsed;
    this.modelBlackHoleMesh.visible = this.starCollapsed;
    this.modelAccretionRing.visible = this.starCollapsed;

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
    if (!reducedMotion) {
      if (!this.starCollapsed) {
        this.modelStarMesh.rotation.y = elapsed * 0.5;
      } else {
        this.modelAccretionRing.rotation.z = elapsed * 0.4;
      }
      this.gimbalRing.rotation.z = elapsed * 0.22;
    }
    this.animateLevers(dt, reducedMotion);
  }
}
