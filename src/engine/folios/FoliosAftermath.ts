import * as THREE from 'three';
import { FolioRuntimeState } from '../../types/atlas';
import {
  buildCodecFigure,
  buildKailFigure,
  buildMarcelFigure,
  buildShardGodFigure,
} from '../drakken/CharacterFigures';
import { buildCutCardShape, buildTaperedCurve } from '../drakken/papercraftArt';
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

    // Cold postwar twilight horizon arch
    const arch = this.buildIllustratedBackdropArch(4.55, 1.38, {
      topHex: '#181E28',
      bottomHex: '#333C4D',
      cloudHex: '#475368',
      accentHex: '#9BA6B8',
      motif: 'ash',
      ridgeBackHex: 0x222834,
      ridgeFrontHex: 0x353e4f,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // 1. [A] Articulated Crenellated Siege Wall Boundary Collar on dark core disk
    const collarY = this.pageY(-1.12);
    const coreDisk = this.buildLayeredTerrace([1.72], [1.72], 0.025, [0xdfd6c1], 0x20262e);
    coreDisk.position.set(-1.12, collarY, -0.25);
    this.root.add(coreDisk);

    const voidCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.032, 16),
      new THREE.MeshBasicMaterial({ color: 0x050608 }),
    );
    voidCore.position.set(-1.12, collarY + 0.026, -0.25);
    this.root.add(voidCore);

    this.boundaryCollar = new THREE.Group();
    this.boundaryCollar.position.set(-1.12, collarY + 0.03, -0.25);
    const wallMat = this.makePaperMat(0x1f242d, 0.72, 0.08, 0, 0, false, true);
    const rimMat = this.makePaperMat(0x9ba4b0, 0.45, 0.55);
    const panelCount = 12;
    for (let i = 0; i < panelCount; i++) {
      const a = (i / panelCount) * Math.PI * 2;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.055), wallMat);
      fin.position.set(Math.cos(a) * 0.84, 0.24, Math.sin(a) * 0.84);
      fin.rotation.y = -a + Math.PI / 2;
      fin.castShadow = true;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.075), rimMat);
      merlon.position.set(Math.cos(a) * 0.84, 0.52, Math.sin(a) * 0.84);
      merlon.rotation.y = -a + Math.PI / 2;
      this.bindMechanismTarget(fin, 'A');
      this.boundaryCollar.add(fin, merlon);
    }
    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.028, 6, 24), rimMat);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.y = 0.48;
    this.bindMechanismTarget(collarRing, 'A');
    this.boundaryCollar.add(collarRing);
    this.root.add(this.boundaryCollar);

    // 2. [B] Toggle: Administration Schematic Lattice vs Inhabited-World Pitch-Black Sky Streak
    const viewY = this.pageY(0.74) + 0.04;
    const viewPad = this.buildLayeredTerrace([1.96], [1.66], 0.024, [0xe6decb], 0x2c333d);
    viewPad.position.set(0.74, this.pageY(0.74), -0.25);
    this.root.add(viewPad);

    this.schematicView = new THREE.Group();
    this.schematicView.position.set(0.74, viewY, -0.25);
    for (let r = 0.28; r <= 0.78; r += 0.25) {
      const lattice = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.02, 5, 22),
        this.makePaperMat(0xc2a25d, 0.42, 0.65),
      );
      lattice.rotation.x = Math.PI / 2;
      lattice.position.y = 0.28;
      this.bindMechanismTarget(lattice, 'B');
      this.schematicView.add(lattice);
    }
    for (const rotY of [0, Math.PI / 3, -Math.PI / 3]) {
      const meridian = new THREE.Mesh(
        new THREE.TorusGeometry(0.76, 0.016, 5, 20),
        this.makePaperMat(0x282d35, 0.6),
      );
      meridian.position.y = 0.28;
      meridian.rotation.y = rotY;
      this.bindMechanismTarget(meridian, 'B');
      this.schematicView.add(meridian);
    }
    const schemLbl = this.makeCardLabel('SCHEMATIC DIAGRAM', 'Administration Containment Model', 1.56, 0.25, '#FAF5E8', '#181C22', 0.2);
    schemLbl.position.set(0, 0.04, 0.74);
    this.schematicView.add(schemLbl);
    this.root.add(this.schematicView);

    this.horizonView = new THREE.Group();
    this.horizonView.position.set(0.74, viewY, -0.25);
    this.horizonView.visible = false;

    // Layered papercraft town hills + pitched-roof cottages under clear sky + ONLY pitch-black Siege Wall streak (NO sky grid!)
    const townHills = this.buildPaperRidgeCluster(1.68, 2, 0x627358, 0x879976, 0.22, 0.06);
    townHills.position.set(0, 0.03, -0.34);

    const townGround = new THREE.Mesh(
      new THREE.BoxGeometry(1.64, 0.08, 0.92),
      this.makePaperMat(0x7c7465, 0.88, 0.02, 0, 0, false, true),
    );
    townGround.position.y = 0.04;

    const wallCream = this.makePaperMat(0xf0e7d4, 0.85, 0.02, 0, 0, false, true);
    const roofSlate = this.makePaperMat(0x52463d, 0.85, 0.04, 0, 0, false, true);
    for (let h = 0; h < 4; h++) {
      const hx = -0.52 + h * 0.34;
      const hz = (h % 2 === 0 ? 1 : -1) * 0.14;
      const houseH = 0.13 + (h % 2) * 0.05;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, houseH, 0.16), wallCream);
      body.position.set(hx, 0.08 + houseH / 2, hz);
      body.castShadow = true;
      const roof = buildCutCardShape([[-0.11, 0], [0, 0.1], [0.11, 0]], 0.18, roofSlate);
      roof.position.set(hx, 0.08 + houseH, hz);
      this.horizonView.add(body, roof);
    }

    const darkSkyBackdrop = new THREE.Mesh(
      new THREE.BoxGeometry(1.72, 0.88, 0.04),
      this.makePaperMat(0x9fb8ce, 0.82),
    );
    darkSkyBackdrop.position.set(0, 0.5, -0.44);

    // Strict pitch-black Siege Wall streak bisecting inhabited sky (zero sky grid!)
    const blackStreak = new THREE.Mesh(
      new THREE.BoxGeometry(1.74, 0.145, 0.058),
      new THREE.MeshBasicMaterial({ color: 0x050608 }),
    );
    blackStreak.position.set(0, 0.56, -0.42);
    blackStreak.rotation.z = 0.11;

    const horLbl = this.makeCardLabel('INHABITED HORIZON VIEW', 'Black Sky Streak (No Sky Grid)', 1.56, 0.25, '#FAF5E8', '#181C22', 0.2);
    horLbl.position.set(0, 0.04, 0.74);
    this.bindMechanismTarget(darkSkyBackdrop, 'B');
    this.bindMechanismTarget(blackStreak, 'B');
    this.horizonView.add(townHills, townGround, darkSkyBackdrop, blackStreak, horLbl);
    this.root.add(this.horizonView);

    // 3. [C] Outlawed Protocol Prohibition Sheet on easel
    this.protocolFlap = new THREE.Group();
    this.protocolFlap.position.set(0, this.pageY(0) + 0.06, 0.96);
    const sheet = this.makeCardLabel(
      'POSTWAR PROTOCOLS',
      'Heliocide Study Strictly Prohibited',
      2.3,
      0.29,
      '#21252B',
      '#FAF4E6',
      0.22,
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
    const arch = this.buildIllustratedBackdropArch(4.55, 1.38, {
      topHex: '#252320',
      bottomHex: '#464139',
      cloudHex: '#5D564A',
      accentHex: '#B69D63',
      motif: 'ash',
      ridgeBackHex: 0x322f2a,
      ridgeFrontHex: 0x47423b,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // Level 3 Remnant Nacreous VI stepped barren cratered terrain — STRICTLY BARREN outside glass cylinder
    const craterY = this.pageY(0);
    const outerAsh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.88, 1.96, 0.048, 16),
      this.makePaperMat(0x4a463f, 0.92, 0.02, 0, 0, false, true),
    );
    outerAsh.position.set(0, craterY + 0.024, -0.26);
    outerAsh.receiveShadow = true;

    const innerCrater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.44, 0.036, 14),
      this.makePaperMat(0x5c574f, 0.9, 0.02, 0, 0, false, true),
    );
    innerCrater.position.set(0, craterY + 0.052, -0.26);
    innerCrater.receiveShadow = true;

    // Barren fractured stone crater ruins & ash ridges along outer back arc (zero green/plant life!)
    const craterRuins = this.buildPaperRidgeCluster(2.6, 2, 0x3b3832, 0x565148, 0.24, 0.05);
    craterRuins.position.set(0, craterY + 0.05, -1.24);
    this.root.add(outerAsh, innerCrater, craterRuins);

    // Three Figures strictly grounded on crater floor: Marcel, Codec, The Shard-god
    const marcel = buildMarcelFigure(this.paperBump, 0.95);
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

    const brassMat = this.makePaperMat(0xc2a25d, 0.36, 0.76);
    const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.075, 14), brassMat);
    baseCollar.position.y = 0.038;

    const loamCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, 0.24, 12),
      this.makePaperMat(0x4b3828, 0.9),
    );
    loamCore.position.y = 0.16;

    const wheatStalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.017, 0.46, 6),
      this.makePaperMat(0xcfb156, 0.72),
    );
    wheatStalk.position.y = 0.45;
    const wheatLeaf = buildCutCardShape(
      [[0, 0], [0.06, 0.09], [0.02, 0.14], [0, 0.06]],
      0.01,
      this.makePaperMat(0x889b48, 0.72, 0.02, 0, 0, false, true),
    );
    wheatLeaf.position.set(0.01, 0.36, 0);

    // Multi-layered origami wheat grain ear spikelets inside cylinder
    const wheatMat = this.makePaperMat(0xe5c768, 0.65, 0.05, 0, 0, false, true);
    for (let k = 0; k < 5; k++) {
      const grain = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), wheatMat);
      grain.scale.set(0.75, 1.25, 0.75);
      grain.position.set((k % 2 === 0 ? 1 : -1) * 0.022, 0.62 + k * 0.036, 0);
      grain.rotation.z = (k % 2 === 0 ? -1 : 1) * 0.28;
      this.cylinderMount.add(grain);
    }

    const glassTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.84, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0xe6f4fa,
        roughness: 0.08,
        transparent: true,
        opacity: 0.34,
        clearcoat: 1.0,
      }),
    );
    glassTube.position.y = 0.46;

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.048, 14), brassMat);
    topCap.position.y = 0.89;

    this.bindMechanismTarget(glassTube, 'A');
    this.bindMechanismTarget(baseCollar, 'A');
    this.cylinderMount.add(baseCollar, loamCore, wheatStalk, wheatLeaf, glassTube, topCap);
    this.root.add(this.cylinderMount);

    // [B] Intricate Weapons-Macro to Life-Preserving Containment Repurposing Turntable
    const gear = this.buildBrassGear(0.35, 12, 0.032);
    gear.position.set(0.62, craterY + 0.09, -0.58);
    this.root.add(gear);

    this.macroArray = new THREE.Group();
    this.macroArray.position.set(0.62, craterY + 0.12, -0.58);

    // Sculpted Weapon Emitter Pod (crimson hex cannon projector)
    const emitterPod = new THREE.Group();
    emitterPod.position.set(-0.2, 0, 0);
    const eBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.18, 0.3, 6),
      this.makePaperMat(0x9e322b, 0.55, 0.1, 0, 0, false, true),
    );
    eBody.position.y = 0.15;
    const eNozzle = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.14, 6), this.makePaperMat(0x282d35, 0.6));
    eNozzle.position.y = 0.35;
    emitterPod.add(eBody, eNozzle);

    // Sculpted Containment Shield Prism Node (translucent azure faceted core + brass ribs)
    const shieldPod = new THREE.Group();
    shieldPod.position.set(0.2, 0, 0);
    const sCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      this.makePaperMat(0x42c2e0, 0.36, 0.2, 0x165e73, 0.38, false, true),
    );
    sCore.position.y = 0.2;
    const sRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 5, 16), brassMat);
    sRing.rotation.x = Math.PI / 2;
    sRing.position.y = 0.2;
    shieldPod.add(sCore, sRing);

    this.bindMechanismTarget(eBody, 'B');
    this.bindMechanismTarget(sCore, 'B');
    this.macroArray.add(emitterPod, shieldPod);
    this.root.add(this.macroArray);

    // [C] Attributed Confrontation Card on tilted easel
    this.quotePanel = new THREE.Group();
    this.quotePanel.position.set(0, craterY + 0.07, 0.96);
    const card = this.makeCardLabel(
      'NACREOUS VI · 31 DAYS POST-WAR',
      '"Your private discomfort with the shape of survival..."',
      2.65,
      0.3,
      '#22262C',
      '#FAF4E6',
      0.22,
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

    // Archival dawn-slate memorial horizon arch
    const arch = this.buildIllustratedBackdropArch(4.55, 1.38, {
      topHex: '#181C24',
      bottomHex: '#2E3645',
      cloudHex: '#434C5E',
      accentHex: '#C2A25D',
      motif: 'sun',
      ridgeBackHex: 0x222731,
      ridgeFrontHex: 0x353c4a,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    const centerY = this.pageY(0);

    // Brass dovetail rail track for institutional claim plaques [A] (set well rear of Dead-Switch!)
    const slideRail = new THREE.Mesh(
      new THREE.BoxGeometry(3.85, 0.024, 0.12),
      this.makePaperMat(0xc2a25d, 0.38, 0.72),
    );
    slideRail.position.set(0, centerY + 0.026, -0.74);
    this.root.add(slideRail);

    // 1. [A] Victory & Continuity Institutional Plaques cleanly separated (ZERO overlap at rest or split!)
    this.plaqueLeft = this.makeCardLabel('CLAIM I: VICTORY', 'Military Cessation', 1.28, 0.32, '#FAF5E8', '#181C22', 0.22);
    this.plaqueLeft.position.set(-0.78, centerY + 0.06, -0.74);
    this.plaqueRight = this.makeCardLabel('CLAIM II: CONTINUITY', 'Unsettled Postwar Cost', 1.28, 0.32, '#22262C', '#FAF4E6', 0.22);
    this.plaqueRight.position.set(0.78, centerY + 0.06, -0.74);
    this.bindMechanismTarget(this.plaqueLeft, 'A');
    this.bindMechanismTarget(this.plaqueRight, 'A');
    this.root.add(this.plaqueLeft, this.plaqueRight);

    // 2. [B] Symbolic Syrin-Blood Helical Starsilk Dead-Switch Diagram on stepped obsidian plinth
    const silkCoilGroup = new THREE.Group();
    silkCoilGroup.position.set(0, centerY + 0.04, 0.14);

    const switchPad = this.buildLayeredTerrace([1.15, 0.92], [1.15, 0.92], 0.024, [0x22262d, 0x303640], 0xc2a25d);
    silkCoilGroup.add(switchPad);

    this.silkMat = this.makePaperMat(0x4ccae8, 0.35, 0.25, 0x1688a8, 0.6, true);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.032, 8, 28), this.silkMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = 0.095;

    // Helical tapered Starsilk filament rising around central Syrin-blood vial
    const helixPts: THREE.Vector3[] = [];
    for (let s = 0; s <= 12; s++) {
      const a = (s / 12) * Math.PI * 3.5;
      helixPts.push(new THREE.Vector3(Math.cos(a) * 0.24, 0.12 + s * 0.026, Math.sin(a) * 0.24));
    }
    const helix = buildTaperedCurve(helixPts, 0.018, 0.012, 14, 5, this.silkMat);

    const vial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.36, 12),
      this.makePaperMat(0x9e322b, 0.45, 0.15),
    );
    vial.position.y = 0.24;
    vial.castShadow = true;

    this.deadSwitchPlunger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.095, 0.18, 10),
      this.makePaperMat(0xc2a25d, 0.36, 0.74),
    );
    this.deadSwitchPlunger.position.y = 0.48;
    this.deadSwitchPlunger.castShadow = true;

    this.bindMechanismTarget(coil, 'B');
    this.bindMechanismTarget(vial, 'B');
    this.bindMechanismTarget(this.deadSwitchPlunger, 'B');
    silkCoilGroup.add(coil, helix, vial, this.deadSwitchPlunger);
    this.root.add(silkCoilGroup);

    // 3. [C] Closing Archival Leaf: Kail (blue hair, black suit, red scarf over mouth) & Syrin 4 Record
    this.memorialLeaf = new THREE.Group();
    this.memorialLeaf.position.set(0, centerY + 0.04, 0.94);
    const kail = buildKailFigure(this.paperBump, 0.96);
    kail.position.set(-1.14, 0.04, -0.05);
    this.addGroundShadow(kail, 0.34, 0.36);

    const card = this.makeCardLabel(
      'SYRIN 4 GENOCIDE RECORD',
      'Kail · Surviving Syrin Initiate',
      2.18,
      0.3,
      '#FAF4E6',
      '#181C22',
      0.22,
    );
    card.position.set(0.32, 0.045, 0);
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
    const offX = 0.78 + this.splitRatio * 0.56;
    this.plaqueLeft.position.x += (-offX - this.plaqueLeft.position.x) * k;
    this.plaqueRight.position.x += (offX - this.plaqueRight.position.x) * k;
    const plungerY = this.switchActivated ? 0.28 : 0.48;
    this.deadSwitchPlunger.position.y += (plungerY - this.deadSwitchPlunger.position.y) * k;
    this.memorialLeaf.position.y += (this.pageY(0) + 0.04 + this.leafOpenTarget - this.memorialLeaf.position.y) * k;
    this.animateLevers(dt, reducedMotion);
  }
}
