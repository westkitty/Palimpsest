import * as THREE from 'three';
import { FolioRuntimeState } from '../../types/atlas';
import {
  buildCodecFigure,
  buildKailFigure,
  buildMarcelFigure,
  buildShardGodFigure,
} from '../drakken/CharacterFigures';
import { BaseFolioWorld } from './BaseFolioWorld';

export class F10FolioWorld extends BaseFolioWorld {
  private boundaryCollar!: THREE.Group;
  private collarTargetScaleY = 0.16;
  private schematicView!: THREE.Group;
  private horizonView!: THREE.Group;
  private showHorizonStreak = false;
  private protocolFlap!: THREE.Group;
  private protocolOpenTarget = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Cold postwar slate horizon arch
    const arch = this.buildBackdropArch(4.5, 1.38, 0x232730, 0x9ba4b0);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    // 1. [A] Telescoping Segmented Black-Hole Boundary Collar on cream inner core
    const collarY = this.pageY(-1.12);
    const coreDisk = this.buildLayeredTerrace([1.68], [1.68], 0.025, [0xdfd6c1], 0x20262e);
    coreDisk.position.set(-1.12, collarY, -0.25);
    this.root.add(coreDisk);

    this.boundaryCollar = new THREE.Group();
    this.boundaryCollar.position.set(-1.12, collarY + 0.03, -0.25);
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.96, 0.48, 12, 1, true),
      this.makePaperMat(0x1b1f26, 0.65),
    );
    collar.position.y = 0.24;
    collar.castShadow = true;
    const collarRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.032, 6, 16),
      this.makePaperMat(0x9ba4b0, 0.5, 0.45),
    );
    collarRim.rotation.x = Math.PI / 2;
    collarRim.position.y = 0.48;
    this.bindMechanismTarget(collar, 'A');
    this.bindMechanismTarget(collarRim, 'A');
    this.boundaryCollar.add(collar, collarRim);
    this.root.add(this.boundaryCollar);

    // 2. [B] Toggle: Administration Schematic Lattice vs Inhabited-World Pitch-Black Sky Streak
    const viewY = this.pageY(0.74) + 0.04;
    const viewPad = this.buildLayeredTerrace([1.92], [1.62], 0.024, [0xe6decb], 0x2c333d);
    viewPad.position.set(0.74, this.pageY(0.74), -0.25);
    this.root.add(viewPad);

    this.schematicView = new THREE.Group();
    this.schematicView.position.set(0.74, viewY, -0.25);
    for (let r = 0.28; r <= 0.78; r += 0.25) {
      const lattice = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.018, 5, 20),
        this.makePaperMat(0xc2a25d, 0.42, 0.65),
      );
      lattice.rotation.x = Math.PI / 2;
      lattice.position.y = 0.26;
      this.bindMechanismTarget(lattice, 'B');
      this.schematicView.add(lattice);
    }
    const meridian = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.016, 5, 20),
      this.makePaperMat(0x282d35, 0.6),
    );
    meridian.position.y = 0.26;
    this.bindMechanismTarget(meridian, 'B');
    const schemLbl = this.makeCardLabel('SCHEMATIC DIAGRAM', 'Administration Containment Model', 1.54, 0.24, '#EFE9DA', '#20262E', 0.16);
    schemLbl.position.set(0, 0.03, 0.72);
    this.schematicView.add(meridian, schemLbl);
    this.root.add(this.schematicView);

    this.horizonView = new THREE.Group();
    this.horizonView.position.set(0.74, viewY, -0.25);
    this.horizonView.visible = false;

    // Miniature layered cardstock inhabited town under clear daylight sky + ONLY pitch-black Siege Wall streak (NO sky grid!)
    const townHill = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.12, 0.92),
      this.makePaperMat(0x7c7465),
    );
    townHill.position.y = 0.06;
    for (let h = 0; h < 4; h++) {
      const house = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.12 + (h % 2) * 0.06, 0.16),
        this.makePaperMat(h % 2 === 0 ? 0xeae2ce : 0xcbc0a8),
      );
      house.position.set(-0.52 + h * 0.34, 0.17, (h % 2 === 0 ? 1 : -1) * 0.12);
      house.castShadow = true;
      this.horizonView.add(house);
    }
    const darkSkyBackdrop = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.82, 0.04),
      this.makePaperMat(0x8ea3b5),
    );
    darkSkyBackdrop.position.set(0, 0.5, -0.44);
    // Strict pitch-black Siege Wall streak bisecting inhabited sky
    const blackStreak = new THREE.Mesh(
      new THREE.BoxGeometry(1.64, 0.15, 0.058),
      new THREE.MeshBasicMaterial({ color: 0x050608 }),
    );
    blackStreak.position.set(0, 0.56, -0.42);
    blackStreak.rotation.z = 0.12;
    const horLbl = this.makeCardLabel('INHABITED HORIZON VIEW', 'Black Sky Streak (No Sky Grid)', 1.56, 0.24, '#EFE9DA', '#20262E', 0.16);
    horLbl.position.set(0, 0.03, 0.72);
    this.bindMechanismTarget(darkSkyBackdrop, 'B');
    this.bindMechanismTarget(blackStreak, 'B');
    this.horizonView.add(townHill, darkSkyBackdrop, blackStreak, horLbl);
    this.root.add(this.horizonView);

    // 3. [C] Outlawed Protocol Prohibition Sheet on easel
    this.protocolFlap = new THREE.Group();
    this.protocolFlap.position.set(0, this.pageY(0) + 0.06, 0.96);
    const sheet = this.makeCardLabel(
      'POSTWAR PROTOCOLS',
      'Heliocide Study Strictly Prohibited',
      2.3,
      0.28,
      '#23262C',
      '#EFE9DA',
      0.2,
    );
    this.bindMechanismTarget(sheet, 'C');
    this.protocolFlap.add(sheet);
    this.root.add(this.protocolFlap);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.collarTargetScaleY = state.interactions.A.active ? 1.0 : 0.16;
    this.showHorizonStreak = state.interactions.B.active;
    this.schematicView.visible = !this.showHorizonStreak;
    this.horizonView.visible = this.showHorizonStreak;
    this.protocolOpenTarget = state.interactions.C.active ? 0.22 : 0;
  }

  public update(dt: number, _elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.boundaryCollar.scale.y += (this.collarTargetScaleY - this.boundaryCollar.scale.y) * k;
    this.protocolFlap.position.y += (this.pageY(0) + 0.06 + this.protocolOpenTarget - this.protocolFlap.position.y) * k;
    this.animateLevers(dt, reducedMotion);
  }
}

export class F11FolioWorld extends BaseFolioWorld {
  private cylinderMount!: THREE.Group;
  private cylElevateTarget = 0;
  private macroArray!: THREE.Group;
  private macroTargetRot = 0;
  private quotePanel!: THREE.Group;
  private quoteElevateTarget = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Pale volcanic-ash Nacreous VI horizon arch
    const arch = this.buildBackdropArch(4.5, 1.38, 0x3b3833, 0xa89262);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    // Level 3 Remnant Nacreous VI stepped barren cratered terrain — STRICTLY BARREN outside glass cylinder
    const craterY = this.pageY(0);
    const outerAsh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.86, 1.94, 0.048, 16),
      this.makePaperMat(0x4b4740, 0.92),
    );
    outerAsh.position.set(0, craterY + 0.024, -0.26);
    outerAsh.receiveShadow = true;

    const innerCrater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.44, 0.036, 14),
      this.makePaperMat(0x5c574f, 0.9),
    );
    innerCrater.position.set(0, craterY + 0.052, -0.26);
    innerCrater.receiveShadow = true;
    this.root.add(outerAsh, innerCrater);

    // Three Figures strictly grounded on crater floor: Marcel, Codec, The Shard-god
    const marcel = buildMarcelFigure(this.paperBump, 0.92);
    marcel.position.set(-1.38, craterY + 0.06, -0.15);
    this.addGroundShadow(marcel, 0.32, 0.36);

    const codec = buildCodecFigure(this.paperBump, 0.95);
    codec.position.set(1.24, craterY + 0.06, -0.35);
    this.addGroundShadow(codec, 0.32, 0.36);

    const shardGod = buildShardGodFigure(this.paperBump, 1.05);
    shardGod.position.set(1.42, craterY + 0.06, 0.25);
    this.addGroundShadow(shardGod, 0.38, 0.38);

    this.root.add(marcel, codec, shardGod);

    // [A] Forearm-sized Glass Loam Cylinder + Single Living Wheat Stalk (ONLY life in scene)
    this.cylinderMount = new THREE.Group();
    this.cylinderMount.position.set(-0.22, craterY + 0.08, -0.16);

    const baseCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.07, 14),
      this.makePaperMat(0xc2a25d, 0.38, 0.72),
    );
    baseCollar.position.y = 0.035;

    const loamCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.24, 12),
      this.makePaperMat(0x4b3828),
    );
    loamCore.position.y = 0.16;

    const wheatStalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 0.48, 6),
      this.makePaperMat(0xd4b65e),
    );
    wheatStalk.position.y = 0.46;

    const wheatHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, 0.15, 5),
      this.makePaperMat(0xe5c86e),
    );
    wheatHead.position.y = 0.72;

    const glassTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.84, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0xe6f4fa,
        roughness: 0.08,
        transparent: true,
        opacity: 0.36,
        clearcoat: 1.0,
      }),
    );
    glassTube.position.y = 0.46;

    const topCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.045, 14),
      this.makePaperMat(0xc2a25d, 0.38, 0.72),
    );
    topCap.position.y = 0.89;

    this.bindMechanismTarget(glassTube, 'A');
    this.bindMechanismTarget(baseCollar, 'A');
    this.cylinderMount.add(baseCollar, loamCore, wheatStalk, wheatHead, glassTube, topCap);
    this.root.add(this.cylinderMount);

    // [B] Weapons-Macro to Life-Preserving Containment Repurposing Geared Turntable
    const gear = this.buildBrassGear(0.32, 12, 0.032);
    gear.position.set(0.65, craterY + 0.09, -0.58);
    this.root.add(gear);

    this.macroArray = new THREE.Group();
    this.macroArray.position.set(0.65, craterY + 0.28, -0.58);
    const emitterPod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.23, 0.3, 6),
      this.makePaperMat(0x9e322b, 0.55),
    );
    emitterPod.position.x = -0.18;
    emitterPod.castShadow = true;

    const shieldPod = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      this.makePaperMat(0x42c2e0, 0.45),
    );
    shieldPod.position.x = 0.2;
    shieldPod.castShadow = true;

    this.bindMechanismTarget(emitterPod, 'B');
    this.bindMechanismTarget(shieldPod, 'B');
    this.macroArray.add(emitterPod, shieldPod);
    this.root.add(this.macroArray);

    // [C] Attributed Confrontation Card on tilted easel
    this.quotePanel = new THREE.Group();
    this.quotePanel.position.set(0, craterY + 0.07, 0.95);
    const card = this.makeCardLabel(
      'NACREOUS VI · 31 DAYS POST-WAR',
      '"Your private discomfort with the shape of survival..."',
      2.65,
      0.3,
      '#24272D',
      '#EFE8D6',
      0.2,
    );
    this.bindMechanismTarget(card, 'C');
    this.quotePanel.add(card);
    this.root.add(this.quotePanel);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.cylElevateTarget = state.interactions.A.active ? 0.34 : 0;
    this.macroTargetRot = state.interactions.B.active ? Math.PI : 0;
    this.quoteElevateTarget = state.interactions.C.active ? 0.2 : 0;
  }

  public update(dt: number, _elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.cylinderMount.position.y += (this.pageY(0) + 0.08 + this.cylElevateTarget - this.cylinderMount.position.y) * k;
    this.macroArray.rotation.y += (this.macroTargetRot - this.macroArray.rotation.y) * k;
    this.quotePanel.position.y += (this.pageY(0) + 0.07 + this.quoteElevateTarget - this.quotePanel.position.y) * k;
    this.animateLevers(dt, reducedMotion);
  }
}

export class F12FolioWorld extends BaseFolioWorld {
  private plaqueLeft!: THREE.Group;
  private plaqueRight!: THREE.Group;
  private splitRatio = 0;
  private silkMat!: THREE.MeshStandardMaterial;
  private deadSwitchPlunger!: THREE.Mesh;
  private switchActivated = false;
  private memorialLeaf!: THREE.Group;
  private leafOpenTarget = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Archival slate-linen V-fold horizon arch
    const arch = this.buildBackdropArch(4.5, 1.38, 0x282d35, 0xc2a25d);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    const centerY = this.pageY(0);

    // Brass dovetail rail track for institutional claim plaques [A]
    const slideRail = new THREE.Mesh(
      new THREE.BoxGeometry(3.45, 0.025, 0.14),
      this.makePaperMat(0xc2a25d, 0.38, 0.72),
    );
    slideRail.position.set(0, centerY + 0.025, -0.58);
    this.root.add(slideRail);

    // 1. [A] Victory & Continuity Institutional Plaques sliding apart (THREE.Group!)
    this.plaqueLeft = this.makeCardLabel('CLAIM I: VICTORY', 'Military Cessation', 1.38, 0.34, '#D9D0BE', '#20262E', 0.18);
    this.plaqueLeft.position.set(-0.42, centerY + 0.055, -0.58);
    this.plaqueRight = this.makeCardLabel('CLAIM II: CONTINUITY', 'Unsettled Postwar Cost', 1.38, 0.34, '#24272D', '#EFE8D6', 0.18);
    this.plaqueRight.position.set(0.42, centerY + 0.075, -0.58);
    this.bindMechanismTarget(this.plaqueLeft, 'A');
    this.bindMechanismTarget(this.plaqueRight, 'A');
    this.root.add(this.plaqueLeft, this.plaqueRight);

    // 2. [B] Symbolic Syrin-Blood Starsilk Dead-Switch Diagram on stepped obsidian plinth
    const silkCoilGroup = new THREE.Group();
    silkCoilGroup.position.set(0, centerY + 0.04, 0.06);

    const switchPad = this.buildLayeredTerrace([1.15, 0.92], [1.15, 0.92], 0.024, [0x22262d, 0x303640], 0xc2a25d);
    silkCoilGroup.add(switchPad);

    this.silkMat = this.makePaperMat(0x4ccae8, 0.35, 0.25, 0x1688a8, 0.6, true);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.034, 8, 28), this.silkMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = 0.1;

    const vial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.36, 12),
      this.makePaperMat(0x9e322b, 0.45, 0.15),
    );
    vial.position.y = 0.24;
    vial.castShadow = true;

    this.deadSwitchPlunger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.18, 10),
      this.makePaperMat(0xc2a25d, 0.36, 0.74),
    );
    this.deadSwitchPlunger.position.y = 0.48;
    this.deadSwitchPlunger.castShadow = true;

    this.bindMechanismTarget(coil, 'B');
    this.bindMechanismTarget(vial, 'B');
    this.bindMechanismTarget(this.deadSwitchPlunger, 'B');
    silkCoilGroup.add(coil, vial, this.deadSwitchPlunger);
    this.root.add(silkCoilGroup);

    // 3. [C] Closing Archival Leaf: Kail & Syrin 4 Genocide Record
    this.memorialLeaf = new THREE.Group();
    this.memorialLeaf.position.set(0, centerY + 0.04, 0.88);
    const kail = buildKailFigure(this.paperBump, 0.85);
    kail.position.set(-1.14, 0.04, -0.05);
    this.addGroundShadow(kail, 0.32, 0.34);

    const card = this.makeCardLabel(
      'SYRIN 4 GENOCIDE RECORD',
      'Kail · Surviving Syrin Initiate',
      2.18,
      0.3,
      '#EFE8D6',
      '#20262E',
      0.2,
    );
    card.position.set(0.32, 0.04, 0);
    this.bindMechanismTarget(card, 'C');
    this.memorialLeaf.add(kail, card);
    this.root.add(this.memorialLeaf);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.splitRatio = state.interactions.A.active ? 1 : 0;
    this.switchActivated = state.interactions.B.active;
    this.silkMat.color.setHex(this.switchActivated ? 0x5c646d : 0x4ccae8);
    this.silkMat.emissiveIntensity = this.switchActivated ? 0 : 0.6;
    this.leafOpenTarget = state.interactions.C.active ? 0.2 : 0;
  }

  public update(dt: number, _elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    const offX = 0.42 + this.splitRatio * 0.82;
    this.plaqueLeft.position.x += (-offX - this.plaqueLeft.position.x) * k;
    this.plaqueRight.position.x += (offX - this.plaqueRight.position.x) * k;
    const plungerY = this.switchActivated ? 0.28 : 0.48;
    this.deadSwitchPlunger.position.y += (plungerY - this.deadSwitchPlunger.position.y) * k;
    this.memorialLeaf.position.y += (this.pageY(0) + 0.04 + this.leafOpenTarget - this.memorialLeaf.position.y) * k;
    this.animateLevers(dt, reducedMotion);
  }
}
