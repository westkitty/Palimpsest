import * as THREE from 'three';
import { F06_CAMPAIGN_DRAXIS_IDS } from '../../story/draxisCatalog';
import { DraxisId, FolioRuntimeState } from '../../types/atlas';
import { buildCodecFigure } from '../drakken/CharacterFigures';
import { buildDraxisModel, DraxisRig } from '../drakken/DraxisModels';
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

    // Subtle colonial-slate V-fold horizon backdrop arch
    const arch = this.buildBackdropArch(4.5, 1.35, 0x35403b, 0x9b824d);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    // Grounded stepped cardstock terraces under the three stations
    const leftPad = this.buildLayeredTerrace([1.68, 1.52], [1.62, 1.46], 0.024, [0xdfd5be, 0xc8bfa7]);
    leftPad.position.set(-1.46, this.pageY(-1.46), -0.24);
    const centerPad = this.buildLayeredTerrace([1.22], [1.72], 0.022, [0x2a2f36], 0x9b824d);
    centerPad.position.set(0, this.pageY(0), -0.26);
    const rightPad = this.buildLayeredTerrace([1.32], [1.72], 0.022, [0xe6decb]);
    rightPad.position.set(1.48, this.pageY(1.48), -0.24);
    this.root.add(leftPad, centerPad, rightPad);

    // [A] Brass-axle mounted Colonial Citadel: Green Terrace (top) / Charred Basalt Ruin (underside)
    const axleY = this.pageY(-1.46) + 0.18;
    const trunnionMat = this.makePaperMat(0xc2a25d, 0.36, 0.78);
    for (const sx of [-0.78, 0.78]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.1), trunnionMat);
      post.position.set(-1.46 + sx, this.pageY(-1.46) + 0.11, -0.24);
      post.castShadow = true;
      this.root.add(post);
    }

    this.colonyFlipPlate = new THREE.Group();
    this.colonyFlipPlate.position.set(-1.46, axleY, -0.24);
    const intactSide = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.055, 1.32),
      this.makePaperMat(0x5b7f62, 0.84),
    );
    intactSide.castShadow = true;
    intactSide.receiveShadow = true;

    const civicTower = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.42, 0.24),
      this.makePaperMat(0xeae2ce),
    );
    civicTower.position.set(-0.22, 0.24, -0.1);
    civicTower.castShadow = true;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      trunnionMat,
    );
    dome.position.set(-0.22, 0.45, -0.1);

    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.2, 0.26),
      this.makePaperMat(0xdcd3bf),
    );
    wing.position.set(0.24, 0.13, 0.18);
    wing.castShadow = true;

    // Charred basalt underside visible when flipped
    const scarredUnderside = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.05, 1.32),
      this.makePaperMat(0x3a2420, 0.9),
    );
    scarredUnderside.position.y = -0.05;
    scarredUnderside.castShadow = true;

    for (let c = 0; c < 3; c++) {
      const slag = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.24, 5),
        this.makePaperMat(0x6b221a, 0.72),
      );
      slag.rotation.x = Math.PI;
      slag.position.set(-0.34 + c * 0.34, -0.16, (c % 2 === 0 ? 1 : -1) * 0.22);
      this.colonyFlipPlate.add(slag);
    }

    this.bindMechanismTarget(intactSide, 'A');
    this.bindMechanismTarget(civicTower, 'A');
    this.bindMechanismTarget(scarredUnderside, 'A');
    this.colonyFlipPlate.add(intactSide, civicTower, dome, wing, scarredUnderside);
    this.root.add(this.colonyFlipPlate);

    // [B] Codec figure + slotted Administration Macro Response track
    const codec = buildCodecFigure(this.paperBump, 1.05);
    codec.position.set(0, this.pageY(0) + 0.03, -0.78);
    this.addGroundShadow(codec, 0.34, 0.36);
    this.root.add(codec);

    // Etched guide rails on central pad
    const railMat = this.makePaperMat(0xc2a25d, 0.4, 0.72);
    for (let i = 0; i < 3; i++) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.015, 0.04), railMat);
      rail.position.set(0, this.pageY(0) + 0.032, -0.32 + i * 0.3);
      this.root.add(rail);
    }

    this.responseArrows = new THREE.Group();
    this.responseArrows.position.set(-0.22, this.pageY(0) + 0.075, -0.02);
    const arrowMat = this.makePaperMat(0xc48f38, 0.42, 0.55);
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

    const logLbl = this.makeCardLabel('VERIFICATION', 'Logistics Record', 1.12, 0.24, '#EFE9DA', '#20262E', 0.14);
    logLbl.position.set(1.48, this.pageY(1.48) + 0.04, 0.72);
    this.bindMechanismTarget(logLbl, 'C');
    this.root.add(logLbl);

    const lbl = this.makeCardLabel('YEAR 0 · FIRST CONTACT', 'Macro Response & Verification', 2.45, 0.28, '#EFE9DA', '#20262E', 0.18);
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
  private bloodRingMesh!: THREE.Mesh;
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

    // Somber crimson-slate V-fold backdrop arch
    const arch = this.buildBackdropArch(4.55, 1.4, 0x2c2023, 0x6b2420);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
    this.root.add(arch);

    // Grounded stepped terraces for Globe Station (left) & Cutaway Factory (right)
    const globePad = this.buildLayeredTerrace([1.45, 1.25], [1.45, 1.25], 0.024, [0x2a2d34, 0x3b3533]);
    globePad.position.set(-1.42, this.pageY(-1.42), -0.26);
    const factoryPad = this.buildLayeredTerrace([2.58, 2.42], [1.46, 1.3], 0.024, [0x2a2d34, 0xd8ceb8], 0x6b2420);
    factoryPad.position.set(0.68, this.pageY(0.68), -0.26);
    this.root.add(globePad, factoryPad);

    // [A] Fallenstar Prime Globe on brass stand + SOLID NON-GLOWING Vitrified Crimson Physical Blood Ring
    const standPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.07, 0.42, 8),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    standPost.position.set(-1.42, this.pageY(-1.42) + 0.24, -0.26);
    this.root.add(standPost);

    this.globeMat = this.makePaperMat(0x527a66, 0.78, 0.05, 0x000000, 0, true);
    const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 2), this.globeMat);
    globe.position.set(-1.42, this.pageY(-1.42) + 0.56, -0.26);
    globe.castShadow = true;
    this.bindMechanismTarget(globe, 'A');
    this.root.add(globe);

    // Physical vitrified crimson material Blood Ring (zero emissive halo)
    this.bloodRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.072, 7, 28),
      this.makePaperMat(0x7c1f1a, 0.56, 0.16, 0x000000, 0),
    );
    this.bloodRingMesh.position.set(-1.42, this.pageY(-1.42) + 0.56, -0.26);
    this.bloodRingMesh.rotation.x = Math.PI / 2 - 0.3;
    this.bloodRingMesh.castShadow = true;
    this.bindMechanismTarget(this.bloodRingMesh, 'A');
    this.root.add(this.bloodRingMesh);

    // [B] Four-stage Cutaway Pipeline: Gorevault (044) -> Slurry Conduit -> Ringthroat (029) -> Extruded Slag Sample
    const fy = this.pageY(0.68) + 0.05;
    this.gorevault = buildDraxisModel('044', this.paperBump);
    this.gorevault.group.position.set(-0.08, fy, -0.26);
    this.gorevault.group.scale.setScalar(0.8);
    this.root.add(this.gorevault.group);

    this.ringthroat = buildDraxisModel('029', this.paperBump);
    this.ringthroat.group.position.set(1.26, fy, -0.26);
    this.ringthroat.group.scale.setScalar(0.8);
    this.root.add(this.ringthroat.group);

    const conduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.12, 8),
      this.makePaperMat(0x56201c, 0.65),
    );
    conduit.rotation.z = Math.PI / 2;
    conduit.position.set(0.58, fy + 0.22, -0.26);
    this.root.add(conduit);

    this.slurryPulse = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.08),
      this.makePaperMat(0x9e2720, 0.52),
    );
    this.slurryPulse.position.set(0.58, fy + 0.22, -0.26);
    this.root.add(this.slurryPulse);

    // Output physical Blood Ring segment sample leaving Ringthroat nozzle
    this.extrudedSample = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.036, 6, 16, Math.PI * 1.4),
      this.makePaperMat(0x7c1f1a, 0.55, 0.14),
    );
    this.extrudedSample.position.set(1.72, fy + 0.26, -0.26);
    this.extrudedSample.rotation.x = Math.PI / 2;
    this.root.add(this.extrudedSample);

    // Split outward-parting bi-fold shutter doors (ZERO clipping/occlusion when open!)
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.04, 0.06),
      this.makePaperMat(0xc2a25d, 0.36, 0.78),
    );
    rail.position.set(0.68, fy + 0.78, 0.36);
    this.root.add(rail);

    const shutterMat = this.makePaperMat(0xdcd3bf, 0.86);
    this.coverLeft = new THREE.Group();
    this.coverLeft.position.set(-0.52, fy, 0.36);
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.76, 0.045), shutterMat);
    doorL.position.set(0.59, 0.38, 0);
    doorL.castShadow = true;
    this.coverLeft.add(doorL);

    this.coverRight = new THREE.Group();
    this.coverRight.position.set(1.88, fy, 0.36);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.76, 0.045), shutterMat);
    doorR.position.set(-0.59, 0.38, 0);
    doorR.castShadow = true;
    this.coverRight.add(doorR);

    this.bindMechanismTarget(doorL, 'B');
    this.bindMechanismTarget(doorR, 'B');
    this.bindMechanismTarget(this.gorevault.group, 'B');
    this.bindMechanismTarget(this.ringthroat.group, 'B');
    this.root.add(this.coverLeft, this.coverRight);

    // [C] Doctrinal Inscription vs Verbatim Memorial Record on stepped easel
    this.quotePanel = new THREE.Group();
    this.quotePanel.position.set(0, this.pageY(0) + 0.04, 0.86);
    const doctrineCard = this.makeCardLabel(
      'DOCTRINAL RING INSCRIPTION',
      'Fallenstar Prime Monument',
      2.05,
      0.3,
      '#282C32',
      '#DED5C0',
      0.2,
    );
    doctrineCard.position.set(-1.12, 0.03, 0);
    const verbatimCard = this.makeCardLabel(
      'FACTUAL RECORD · YEAR 3',
      '"Your sky is built from your dead."',
      2.35,
      0.32,
      '#EFE8D6',
      '#6B1C18',
      0.2,
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
    this.bloodRingMesh.scale.setScalar(this.ringScaleCurr);
    this.bloodRingMesh.visible = this.ringScaleCurr > 0.07;

    this.cutawayOpenRatio += (this.cutawayTargetOpen - this.cutawayOpenRatio) * k;
    // Swing doors cleanly backward/outward (+/- 1.52 rad) away from front plaques
    this.coverLeft.rotation.y = this.cutawayOpenRatio * 1.52;
    this.coverRight.rotation.y = -this.cutawayOpenRatio * 1.52;

    this.quotePanel.position.y += (this.pageY(0) + 0.04 + this.quoteSlideTarget - this.quotePanel.position.y) * k;

    if (!reducedMotion) {
      if (this.bloodRingMesh.visible) {
        this.bloodRingMesh.rotation.z = elapsed * 0.16;
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

    // Charcoal-slate & rust V-fold horizon arch
    const arch = this.buildBackdropArch(4.5, 1.35, 0x262930, 0x8e3b2e);
    arch.position.set(0, this.pageY(0) + 0.01, -1.78);
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
      this.makePaperMat(0xdcd3bf),
    );
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.028, 6, 24),
      this.makePaperMat(0x9e322b, 0.5),
    );
    rim.rotation.x = Math.PI / 2;
    const spokeA = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.05), this.makePaperMat(0x20262e));
    const spokeB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 1.3), this.makePaperMat(0x20262e));
    this.bindMechanismTarget(disc, 'A');
    this.bindMechanismTarget(gearRim, 'A');
    this.chronoWheel.add(gearRim, disc, rim, spokeA, spokeB);
    this.root.add(this.chronoWheel);

    // Fixed stationary brass index pointer over chronology wheel
    const indexBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.09, 0.24),
      this.makePaperMat(0x9e322b, 0.45),
    );
    indexBridge.position.set(-1.42, chronoBaseY + 0.09, 0.54);
    this.root.add(indexBridge);

    // [B] Source-verified 14 Campaign DRAXIS Pedestal Stage
    const specY = this.pageY(0.14);
    const specPedestal = this.buildLayeredTerrace(
      [1.48, 1.32],
      [1.48, 1.32],
      0.038,
      [0x282c32, 0x3b4048],
      0xc2a25d,
    );
    specPedestal.position.set(0.14, specY, -0.24);
    this.bindMechanismTarget(specPedestal, 'B');
    this.root.add(specPedestal);

    F06_CAMPAIGN_DRAXIS_IDS.forEach((dId, idx) => {
      const rig = buildDraxisModel(dId, this.paperBump);
      rig.group.position.set(0.14, specY + 0.085, -0.24);
      rig.group.scale.setScalar(0.95);
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

    const accLbl = this.makeCardLabel('CUMULATIVE LOSS', 'No Invented Totals', 1.05, 0.22, '#24272D', '#EFE8D6', 0.14);
    accLbl.position.set(1.56, accBaseY + 0.03, 0.72);
    this.bindMechanismTarget(accLbl, 'C');
    this.root.add(accLbl);

    const lbl = this.makeCardLabel('YEARS 7–120 · LONG ATTRITION', '14 Sourced Campaign Plates', 2.45, 0.28, '#EFE9DA', '#20262E', 0.18);
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
