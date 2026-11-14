import * as THREE from 'three';
import { F06_CAMPAIGN_DRAXIS_IDS } from '../../story/draxisCatalog';
import { DraxisId, FolioRuntimeState } from '../../types/atlas';
import { buildCodecFigure } from '../drakken/CharacterFigures';
import { buildDraxisModel, DraxisRig } from '../drakken/DraxisModels';
import { buildCutCardShape } from '../drakken/papercraftArt';
import { BaseFolioWorld } from './BaseFolioWorld';

export class F04FolioWorld extends BaseFolioWorld {
  private colonyFlipPlate!: THREE.Group;
  private colonyTargetRot = 0;
  private responseArrows!: THREE.Group;
  private arrowsTargetProgress = 0;
  private setLogisticsExpand!: (expand01: number) => void;
  private logisticsExpand = 0.15;
  private logisticsTargetExpand = 0.15;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Colonial citadel dusk skyline V-fold backdrop
    const arch = this.buildIllustratedBackdropArch(4.55, 1.36, {
      topHex: '#1F2B28',
      bottomHex: '#394B43',
      cloudHex: '#4E6257',
      accentHex: '#C8A55E',
      motif: 'citadel',
      ridgeBackHex: 0x26322d,
      ridgeFrontHex: 0x3b4d45,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // Grounded stepped cardstock terraces under the three stations
    const leftPad = this.buildLayeredTerrace([1.68, 1.52], [1.62, 1.46], 0.024, [0xdfd5be, 0xc8bfa7]);
    leftPad.position.set(-1.46, this.pageY(-1.46), -0.24);
    const centerPad = this.buildLayeredTerrace([1.22], [1.72], 0.022, [0x2a2f36], 0x9b824d);
    centerPad.position.set(0, this.pageY(0), -0.26);
    const rightPad = this.buildLayeredTerrace([1.32], [1.72], 0.022, [0xe6decb]);
    rightPad.position.set(1.48, this.pageY(1.48), -0.24);
    this.root.add(leftPad, centerPad, rightPad);

    // [A] Brass-axle mounted Colonial Citadel: Verdant Terrace City (top) / Jagged Charred Volcanic Underside
    const axleY = this.pageY(-1.46) + 0.19;
    const trunnionMat = this.makePaperMat(0xc2a25d, 0.36, 0.78);
    for (const sx of [-0.78, 0.78]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.1), trunnionMat);
      post.position.set(-1.46 + sx, this.pageY(-1.46) + 0.12, -0.24);
      post.castShadow = true;
      this.root.add(post);
    }

    this.colonyFlipPlate = new THREE.Group();
    this.colonyFlipPlate.position.set(-1.46, axleY, -0.24);
    const intactSide = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.055, 1.32),
      this.makePaperMat(0x527b5b, 0.84, 0.02, 0, 0, false, true),
    );
    intactSide.castShadow = true;
    intactSide.receiveShadow = true;

    const civicPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.05, 0.78),
      this.makePaperMat(0x6b946f, 0.84, 0.02, 0, 0, false, true),
    );
    civicPlinth.position.set(-0.04, 0.048, -0.06);

    const civicTower = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.44, 0.24),
      this.makePaperMat(0xefe6d0, 0.82, 0.03, 0, 0, false, true),
    );
    civicTower.position.set(-0.22, 0.26, -0.1);
    civicTower.castShadow = true;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      trunnionMat,
    );
    dome.position.set(-0.22, 0.48, -0.1);

    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.22, 0.28),
      this.makePaperMat(0xdcd3bf, 0.82, 0.03, 0, 0, false, true),
    );
    wing.position.set(0.24, 0.14, 0.18);
    wing.castShadow = true;
    const wingRoof = buildCutCardShape([[-0.25, 0], [0, 0.12], [0.25, 0]], 0.3, trunnionMat);
    wingRoof.position.set(0.24, 0.25, 0.18);

    // Sculpted paper garden hills behind civic dome
    const gardenHills = this.buildPaperRidgeCluster(1.28, 2, 0x3b6344, 0x628c68, 0.24, 0.035);
    gardenHills.position.set(0, 0.03, -0.52);

    // Charred basalt underside with jagged crimson-black obsidian craters visible when flipped
    const scarredUnderside = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.05, 1.32),
      this.makePaperMat(0x2d1c19, 0.9, 0.04, 0, 0, false, true),
    );
    scarredUnderside.position.y = -0.05;
    scarredUnderside.castShadow = true;

    for (let c = 0; c < 4; c++) {
      const slag = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.3 + (c % 2) * 0.1, 5),
        this.makePaperMat(c % 2 === 0 ? 0x6b221a : 0x3a2623, 0.72, 0.05, 0, 0, false, true),
      );
      slag.rotation.x = Math.PI;
      slag.position.set(-0.38 + c * 0.25, -0.2, (c % 2 === 0 ? 1 : -1) * 0.22);
      this.colonyFlipPlate.add(slag);
    }

    this.bindMechanismTarget(intactSide, 'A');
    this.bindMechanismTarget(civicTower, 'A');
    this.bindMechanismTarget(scarredUnderside, 'A');
    this.colonyFlipPlate.add(intactSide, civicPlinth, civicTower, dome, wing, wingRoof, gardenHills, scarredUnderside);
    this.root.add(this.colonyFlipPlate);

    // [B] Codec figure + slotted Administration Macro Response track
    const codec = buildCodecFigure(this.paperBump, 1.05);
    codec.position.set(0, this.pageY(0) + 0.03, -0.78);
    this.addGroundShadow(codec, 0.34, 0.36);
    this.root.add(codec);

    const railMat = this.makePaperMat(0xc2a25d, 0.4, 0.72);
    for (let i = 0; i < 3; i++) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.015, 0.04), railMat);
      rail.position.set(0, this.pageY(0) + 0.032, -0.32 + i * 0.3);
      this.root.add(rail);
    }

    this.responseArrows = new THREE.Group();
    this.responseArrows.position.set(-0.22, this.pageY(0) + 0.075, -0.02);
    const arrowMat = this.makePaperMat(0xc8923a, 0.4, 0.58, 0, 0, false, true);
    for (let i = 0; i < 3; i++) {
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.1), arrowMat);
      shaft.position.set(0, 0, (i - 1) * 0.3);
      shaft.castShadow = true;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.22, 3), arrowMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.set(0.4, 0, (i - 1) * 0.3);
      tip.castShadow = true;
      this.bindMechanismTarget(shaft, 'B');
      this.bindMechanismTarget(tip, 'B');
      this.responseArrows.add(shaft, tip);
    }
    this.root.add(this.responseArrows);

    // [C] Real Z-folded Accordion Logistics Verification strip
    const strip = this.buildAccordionStrip(6, 1.08, 0.24, 0xeae2ce, 0xcbc0a8, 'C');
    this.setLogisticsExpand = strip.setExpand;
    strip.root.position.set(1.48, this.pageY(1.48) + 0.03, -0.96);
    this.root.add(strip.root);

    const logLbl = this.makeCardLabel('VERIFICATION', 'Logistics Record', 1.14, 0.25, '#FAF5E8', '#181C22', 0.2);
    logLbl.position.set(1.48, this.pageY(1.48) + 0.048, 0.72);
    this.bindMechanismTarget(logLbl, 'C');
    this.root.add(logLbl);

    const lbl = this.makeCardLabel('YEAR 0 · FIRST CONTACT', 'Macro Response & Verification', 2.45, 0.28, '#FAF5E8', '#181C22', 0.2);
    lbl.position.set(0, this.pageY(0) + 0.055, 1.08);
    this.root.add(lbl);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.colonyTargetRot = state.interactions.A.active ? Math.PI : 0;
    this.arrowsTargetProgress = state.interactions.B.active ? 1 : 0;
    this.logisticsTargetExpand = state.interactions.C.active ? 1.0 : 0.16;
  }

  public update(dt: number, _elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.colonyFlipPlate.rotation.x += (this.colonyTargetRot - this.colonyFlipPlate.rotation.x) * k;
    const arrowX = THREE.MathUtils.lerp(-0.24, 0.26, this.arrowsTargetProgress);
    this.responseArrows.position.x += (arrowX - this.responseArrows.position.x) * k;
    this.logisticsExpand += (this.logisticsTargetExpand - this.logisticsExpand) * k;
    this.setLogisticsExpand(this.logisticsExpand);
    this.animateLevers(dt, reducedMotion);
  }
}

export class F05FolioWorld extends BaseFolioWorld {
  private globeMat!: THREE.MeshStandardMaterial;
  private bloodRingGroup!: THREE.Group;
  private ringRevealRatio = 0;
  private ringScaleCurr = 0.05;

  private coverLeft!: THREE.Group;
  private coverRight!: THREE.Group;
  private cutawayOpenRatio = 0;
  private cutawayTargetOpen = 0;

  private gorevault!: DraxisRig;
  private ringthroat!: DraxisRig;
  private slurryPulse!: THREE.Mesh;
  private extrudedSample!: THREE.Mesh;

  private quotePanel!: THREE.Group;
  private quoteSlideTarget = 0;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Somber crimson-slate illustrated battle-storm backdrop arch
    const arch = this.buildIllustratedBackdropArch(4.55, 1.4, {
      topHex: '#201316',
      bottomHex: '#3B1E21',
      cloudHex: '#4F282B',
      accentHex: '#B6463D',
      motif: 'storm',
      ridgeBackHex: 0x291517,
      ridgeFrontHex: 0x422023,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // Grounded stepped terraces for Globe Station (left) & Cutaway Factory (right)
    const globePad = this.buildLayeredTerrace([1.45, 1.25], [1.45, 1.25], 0.024, [0x2a2d34, 0x3b3533]);
    globePad.position.set(-1.42, this.pageY(-1.42), -0.26);
    const factoryPad = this.buildLayeredTerrace([2.58, 2.42], [1.46, 1.3], 0.024, [0x2a2d34, 0xd8ceb8], 0x6b2420);
    factoryPad.position.set(0.68, this.pageY(0.68), -0.26);
    this.root.add(globePad, factoryPad);

    // [A] Fallenstar Prime Globe on brass stand + Multi-layered Vitrified Crimson Physical Blood Ring
    const standPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.075, 0.42, 8),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    standPost.position.set(-1.42, this.pageY(-1.42) + 0.24, -0.26);
    this.root.add(standPost);

    this.globeMat = this.makePaperMat(0x527a66, 0.78, 0.05, 0x000000, 0, true, true);
    const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 2), this.globeMat);
    globe.position.set(-1.42, this.pageY(-1.42) + 0.56, -0.26);
    globe.castShadow = true;
    this.bindMechanismTarget(globe, 'A');
    this.root.add(globe);

    this.bloodRingGroup = new THREE.Group();
    this.bloodRingGroup.position.set(-1.42, this.pageY(-1.42) + 0.56, -0.26);
    this.bloodRingGroup.rotation.x = Math.PI / 2 - 0.3;
    const bloodRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.068, 7, 28),
      this.makePaperMat(0x7c1f1a, 0.56, 0.16, 0x000000, 0, false, true),
    );
    bloodRingMesh.castShadow = true;
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.54, 0.022, 6, 24),
      this.makePaperMat(0x4c1714, 0.65),
    );
    this.bloodRingGroup.add(bloodRingMesh, innerRing);
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2;
      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.045, 0),
        this.makePaperMat(0x9a2a23, 0.5, 0.1, 0, 0, false, true),
      );
      shard.position.set(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0);
      this.bloodRingGroup.add(shard);
    }
    this.bindMechanismTarget(bloodRingMesh, 'A');
    this.root.add(this.bloodRingGroup);

    // [B] Four-stage Cutaway Pipeline: Gorevault (044) -> Slurry Conduit -> Ringthroat (029) -> Extruded Slag Sample
    const fy = this.pageY(0.68) + 0.06;
    this.gorevault = buildDraxisModel('044', this.paperBump);
    this.gorevault.group.position.set(-0.08, fy, -0.28);
    this.gorevault.group.scale.setScalar(0.84);
    this.root.add(this.gorevault.group);

    this.ringthroat = buildDraxisModel('029', this.paperBump);
    this.ringthroat.group.position.set(1.26, fy, -0.28);
    this.ringthroat.group.scale.setScalar(0.84);
    this.root.add(this.ringthroat.group);

    const conduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.12, 8),
      this.makePaperMat(0x56201c, 0.65),
    );
    conduit.rotation.z = Math.PI / 2;
    conduit.position.set(0.58, fy + 0.22, -0.28);
    this.root.add(conduit);

    this.slurryPulse = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.08),
      this.makePaperMat(0x9e2720, 0.52),
    );
    this.slurryPulse.position.set(0.58, fy + 0.22, -0.28);
    this.root.add(this.slurryPulse);

    this.extrudedSample = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.036, 6, 16, Math.PI * 1.4),
      this.makePaperMat(0x7c1f1a, 0.55, 0.14),
    );
    this.extrudedSample.position.set(1.72, fy + 0.26, -0.28);
    this.extrudedSample.rotation.x = Math.PI / 2;
    this.root.add(this.extrudedSample);

    // See-through slotted brass-and-vellum inspection doors (Gorevault & Ringthroat visible at rest AND open wide on [B]!)
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.04, 0.06),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    rail.position.set(0.68, fy + 0.78, 0.34);
    this.root.add(rail);

    const buildInspectionLeaf = (width: number, height: number, dir: 1 | -1) => {
      const leaf = new THREE.Group();
      const brassFrame = this.makePaperMat(0xc2a25d, 0.38, 0.76);
      const cx = (width / 2) * dir;

      const glassPane = new THREE.Mesh(
        new THREE.PlaneGeometry(width - 0.1, height - 0.1),
        new THREE.MeshStandardMaterial({
          color: 0xe6dcc6,
          transparent: true,
          opacity: 0.24,
          roughness: 0.5,
          side: THREE.DoubleSide,
        }),
      );
      glassPane.position.set(cx, height / 2, 0);

      const topStile = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, 0.042), brassFrame);
      topStile.position.set(cx, height - 0.025, 0);
      const botStile = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, 0.042), brassFrame);
      botStile.position.set(cx, 0.025, 0);
      const hingeStile = new THREE.Mesh(new THREE.BoxGeometry(0.055, height, 0.042), brassFrame);
      hingeStile.position.set(0.025 * dir, height / 2, 0);
      const centerStile = new THREE.Mesh(new THREE.BoxGeometry(0.055, height, 0.042), brassFrame);
      centerStile.position.set(width * dir - 0.025 * dir, height / 2, 0);
      const midBar = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, 0.036, 0.032), brassFrame);
      midBar.position.set(cx, height * 0.48, 0);

      this.bindMechanismTarget(glassPane, 'B');
      this.bindMechanismTarget(midBar, 'B');
      leaf.add(glassPane, topStile, botStile, hingeStile, centerStile, midBar);
      return leaf;
    };

    this.coverLeft = new THREE.Group();
    this.coverLeft.position.set(-0.52, fy, 0.34);
    this.coverLeft.add(buildInspectionLeaf(1.18, 0.58, 1));

    this.coverRight = new THREE.Group();
    this.coverRight.position.set(1.88, fy, 0.34);
    this.coverRight.add(buildInspectionLeaf(1.18, 0.58, -1));

    this.bindMechanismTarget(this.gorevault.group, 'B');
    this.bindMechanismTarget(this.ringthroat.group, 'B');
    this.root.add(this.coverLeft, this.coverRight);

    // [C] Doctrinal Inscription vs Verbatim Memorial Record on stepped easel
    this.quotePanel = new THREE.Group();
    this.quotePanel.position.set(0, this.pageY(0) + 0.04, 0.88);
    const doctrineCard = this.makeCardLabel(
      'DOCTRINAL RING INSCRIPTION',
      'Fallenstar Prime Monument',
      2.05,
      0.3,
      '#24272E',
      '#EFE6D2',
      0.22,
    );
    doctrineCard.position.set(-1.12, 0.03, 0);
    const verbatimCard = this.makeCardLabel(
      'FACTUAL RECORD · YEAR 3',
      '"Your sky is built from your dead."',
      2.35,
      0.32,
      '#FAF4E6',
      '#6B1C18',
      0.22,
    );
    verbatimCard.position.set(1.12, 0.04, 0);
    this.bindMechanismTarget(doctrineCard, 'C');
    this.bindMechanismTarget(verbatimCard, 'C');
    this.quotePanel.add(doctrineCard, verbatimCard);
    this.root.add(this.quotePanel);

    this.syncState(state);
  }

  public syncState(state: FolioRuntimeState): void {
    this.syncLevers(state);
    this.ringRevealRatio = state.interactions.A.active ? 1 : 0;
    this.globeMat.color.setHex(state.interactions.A.active ? 0x433b39 : 0x527a66);
    this.cutawayTargetOpen = state.interactions.B.active ? 1 : 0;
    this.quoteSlideTarget = state.interactions.C.active ? 0.24 : 0;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    const targetSc = 0.04 + this.ringRevealRatio * 0.96;
    this.ringScaleCurr += (targetSc - this.ringScaleCurr) * k;
    this.bloodRingGroup.scale.setScalar(this.ringScaleCurr);
    this.bloodRingGroup.visible = this.ringScaleCurr > 0.07;

    this.cutawayOpenRatio += (this.cutawayTargetOpen - this.cutawayOpenRatio) * k;
    // Slight baseline outward parting (0.24 rad) swinging wide open outward (1.62 rad) on activation
    const doorAng = 0.24 + this.cutawayOpenRatio * 1.38;
    this.coverLeft.rotation.y = -doorAng;
    this.coverRight.rotation.y = doorAng;

    this.quotePanel.position.y += (this.pageY(0) + 0.04 + this.quoteSlideTarget - this.quotePanel.position.y) * k;

    if (!reducedMotion) {
      if (this.bloodRingGroup.visible) {
        this.bloodRingGroup.rotation.z = elapsed * 0.16;
      }
      this.slurryPulse.position.x = 0.2 + ((elapsed * 0.45) % 0.78);
      this.extrudedSample.rotation.z = elapsed * 0.3;
      this.gorevault.animate(elapsed, true);
      this.ringthroat.animate(elapsed, true);
    }
    this.animateLevers(dt, reducedMotion);
  }
}

export class F06FolioWorld extends BaseFolioWorld {
  private chronoWheel!: THREE.Group;
  private wheelTargetRot = 0;
  private specimenRigs: DraxisRig[] = [];
  private activeCampaignIdx = 0;
  private setLossExpand!: (expand01: number) => void;
  private lossExpand = 0.2;
  private lossTargetExpand = 0.2;

  public build(state: FolioRuntimeState): void {
    this.buildApertureAndLevers(state);

    // Charcoal-slate & rust storm horizon arch
    const arch = this.buildIllustratedBackdropArch(4.55, 1.36, {
      topHex: '#1C1E26',
      bottomHex: '#33292D',
      cloudHex: '#46383D',
      accentHex: '#9E3E33',
      motif: 'storm',
      ridgeBackHex: 0x26262e,
      ridgeFrontHex: 0x3b3338,
    });
    arch.position.set(0, this.pageY(0) + 0.01, -1.76);
    this.root.add(arch);

    // [A] Geared Attrition Chronology Drum (Years 7-120)
    const chronoBaseY = this.pageY(-1.42) + 0.04;
    const chronoPad = this.buildLayeredTerrace([1.75], [1.75], 0.025, [0x2a2f36], 0xc2a25d);
    chronoPad.position.set(-1.42, this.pageY(-1.42), -0.24);
    this.root.add(chronoPad);

    this.chronoWheel = new THREE.Group();
    this.chronoWheel.position.set(-1.42, chronoBaseY + 0.03, -0.24);
    const gearRim = this.buildBrassGear(0.76, 16, 0.045, 0xc2a25d);
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.7, 0.055, 16),
      this.makePaperMat(0xe5dcc8),
    );
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.028, 6, 24),
      this.makePaperMat(0x9e322b, 0.5),
    );
    rim.rotation.x = Math.PI / 2;
    const spokeA = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.05), this.makePaperMat(0x20262e));
    const spokeB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 1.3), this.makePaperMat(0x20262e));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.075, 6), this.makePaperMat(0xc2a25d, 0.36, 0.78));
      stud.position.set(Math.cos(a) * 0.56, 0.01, Math.sin(a) * 0.56);
      this.chronoWheel.add(stud);
    }
    this.bindMechanismTarget(disc, 'A');
    this.bindMechanismTarget(gearRim, 'A');
    this.chronoWheel.add(gearRim, disc, rim, spokeA, spokeB);
    this.root.add(this.chronoWheel);

    const indexBridge = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.24, 3),
      this.makePaperMat(0x9e322b, 0.45),
    );
    indexBridge.rotation.x = -Math.PI / 2;
    indexBridge.position.set(-1.42, chronoBaseY + 0.09, 0.56);
    this.root.add(indexBridge);

    // [B] Source-verified 14 Campaign DRAXIS Pedestal Stage
    const specY = this.pageY(0.14);
    const specPedestal = this.buildLayeredTerrace(
      [1.48, 1.32],
      [1.48, 1.32],
      0.038,
      [0x262a30, 0x3b414c],
      0xc2a25d,
    );
    specPedestal.position.set(0.14, specY, -0.24);
    this.bindMechanismTarget(specPedestal, 'B');
    this.root.add(specPedestal);

    const ringFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.022, 6, 24),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    ringFrame.rotation.x = Math.PI / 2;
    ringFrame.position.set(0.14, specY + 0.082, -0.24);
    this.root.add(ringFrame);

    F06_CAMPAIGN_DRAXIS_IDS.forEach((dId, idx) => {
      const rig = buildDraxisModel(dId, this.paperBump);
      rig.group.position.set(0.14, specY + 0.088, -0.24);
      rig.group.scale.setScalar(0.98);
      rig.group.visible = idx === 0;
      this.bindMechanismTarget(rig.group, 'B');
      this.root.add(rig.group);
      this.specimenRigs.push(rig);
    });

    // [C] Real Z-pleated Cumulative Loss Record Accordion (no invented casualty totals)
    const accBaseY = this.pageY(1.56) + 0.02;
    const acc = this.buildAccordionStrip(6, 0.98, 0.24, 0x6e2420, 0xdcd3bf, 'C');
    this.setLossExpand = acc.setExpand;
    acc.root.position.set(1.56, accBaseY, -0.96);
    this.root.add(acc.root);

    const accLbl = this.makeCardLabel('CUMULATIVE LOSS', 'No Invented Totals', 1.08, 0.24, '#24272D', '#FAF4E6', 0.2);
    accLbl.position.set(1.56, accBaseY + 0.048, 0.72);
    this.bindMechanismTarget(accLbl, 'C');
    this.root.add(accLbl);

    const lbl = this.makeCardLabel('YEARS 7–120 · LONG ATTRITION', '14 Sourced Campaign Plates', 2.45, 0.28, '#FAF5E8', '#181C22', 0.2);
    lbl.position.set(0, this.pageY(0) + 0.055, 1.08);
    this.root.add(lbl);

    this.syncState(state, null);
  }

  public syncState(state: FolioRuntimeState, activeDraxisId: DraxisId | null): void {
    this.syncLevers(state);
    this.wheelTargetRot = -(state.interactions.A.step * Math.PI) / 2;
    const match = activeDraxisId ? F06_CAMPAIGN_DRAXIS_IDS.indexOf(activeDraxisId) : -1;
    this.activeCampaignIdx =
      match >= 0 ? match : state.selectedCampaignIndex % F06_CAMPAIGN_DRAXIS_IDS.length;
    this.specimenRigs.forEach((rig, idx) => {
      rig.group.visible = idx === this.activeCampaignIdx;
    });
    this.lossTargetExpand = state.interactions.C.active ? 1.0 : 0.22;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 10 : 5) * dt);
    this.chronoWheel.rotation.y += (this.wheelTargetRot - this.chronoWheel.rotation.y) * k;
    this.lossExpand += (this.lossTargetExpand - this.lossExpand) * k;
    this.setLossExpand(this.lossExpand);
    if (!reducedMotion) {
      const rig = this.specimenRigs[this.activeCampaignIdx];
      rig?.animate(elapsed, true);
    }
    this.animateLevers(dt, reducedMotion);
  }
}
