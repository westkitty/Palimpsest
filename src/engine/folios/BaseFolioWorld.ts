import * as THREE from 'three';
import { FOLIO_BY_WORLD } from '../../story/historyManifest';
import { DraxisId, FolioInteractionSlot, FolioRuntimeState, WorldId } from '../../types/atlas';
import { buildCutCardShape, buildIllustratedSkyTexture } from '../drakken/papercraftArt';
import { BOOK_BASE_Y, getOpenPageY } from '../BookAndDeskRig';

// Interior 4:3 teaching aperture bounds inside the open book spread
export const APERTURE_HALF_W = 2.72; // total 5.44
export const APERTURE_HALF_D = 2.04; // total 4.08 -> 5.44 / 4.08 = 4:3 exact

export interface MechanismLeverRig {
  slot: FolioInteractionSlot;
  tabGroup: THREE.Group;
  sliderThumb: THREE.Group;
  puckMat: THREE.MeshStandardMaterial;
  hitMesh: THREE.Mesh;
  activeRatio: number;
  targetRatio: number;
}

export interface AccordionRib {
  panel: THREE.Group;
  index: number;
}

/**
 * Shared reusable physical pop-up book engineering scaffolding for every folio F01-F12:
 * curved page-arch grounding, sharp archival plaques, sliding brass/cardstock A/B/C pull-tabs,
 * illustrated multi-layered pop-up backdrops, folded terrain ridges, accordion bellows, and clean GPU disposal.
 */
export abstract class BaseFolioWorld {
  public readonly root = new THREE.Group();
  public readonly interactables: THREE.Object3D[] = [];

  protected levers: MechanismLeverRig[] = [];
  protected ownedTextures: THREE.Texture[] = [];
  protected matCache = new Map<string, THREE.MeshStandardMaterial>();
  protected foldFactor = 1;

  constructor(
    public readonly worldId: WorldId,
    protected readonly paperBump: THREE.Texture,
    protected readonly contactShadowTex: THREE.Texture,
  ) {
    this.root.position.set(0, BOOK_BASE_Y, 0);
  }

  public abstract build(state: FolioRuntimeState): void;
  public abstract syncState(
    state: FolioRuntimeState,
    activeDraxisId: DraxisId | null,
    elapsed: number,
  ): void;
  public abstract update(dt: number, elapsed: number, reducedMotion: boolean): void;

  public setFoldFactor(factor: number): void {
    this.foldFactor = Math.max(0.01, Math.min(1, factor));
    this.root.position.set(0, BOOK_BASE_Y, 0);
    this.root.scale.set(1, this.foldFactor, 1);
    this.root.visible = factor > 0.02;
  }

  public getInteractables(): THREE.Object3D[] {
    return this.interactables;
  }

  protected pageY(x: number): number {
    return getOpenPageY(x);
  }

  /**
   * Returns a cached MeshStandardMaterial for identical visual parameters, reducing shader churn.
   * Pass `dynamic = true` if the caller will mutate material color or emissive properties at runtime.
   */
  protected makePaperMat(
    color: number,
    roughness = 0.84,
    metalness = 0.04,
    emissive = 0x000000,
    emissiveIntensity = 0,
    dynamic = false,
    flatShading = false,
  ): THREE.MeshStandardMaterial {
    const key = `${color}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}_${flatShading ? 1 : 0}`;
    if (!dynamic) {
      const existing = this.matCache.get(key);
      if (existing) return existing;
    }
    const mat = new THREE.MeshStandardMaterial({
      color,
      bumpMap: this.paperBump,
      bumpScale: 0.008,
      roughness,
      metalness,
      emissive,
      emissiveIntensity,
      flatShading,
      side: THREE.DoubleSide,
    });
    if (!dynamic) {
      this.matCache.set(key, mat);
    }
    return mat;
  }

  /**
   * Builds a high-DPI 1024x288 physical cardstock plaque with cut-edge thickness, corner brass dots,
   * crisp legible typography, and a tiny rear paper easel kick-foot for tactile overhead clarity.
   */
  protected makeCardLabel(
    title: string,
    subtitle: string,
    w = 1.6,
    h = 0.42,
    bgColor = '#FAF5E8',
    inkColor = '#181C22',
    tiltX = 0.22,
  ): THREE.Group {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 288;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, c.width, c.height);

    // Delicate paper deckle shading band along lower edge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, c.height - 16, c.width, 16);

    // Double mid-century archival border
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 7;
    ctx.strokeRect(10, 10, c.width - 20, c.height - 20);
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(24, 24, c.width - 48, c.height - 48);
    ctx.globalAlpha = 1;

    // Corner registration rivets
    ctx.fillStyle = '#C2A25D';
    for (const [rx, ry] of [
      [34, 34],
      [c.width - 34, 34],
      [34, c.height - 34],
      [c.width - 34, c.height - 34],
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = inkColor;
    ctx.font = '700 56px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), c.width / 2, 114, c.width - 92);

    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(76, 142);
    ctx.lineTo(c.width - 76, 142);
    ctx.stroke();
    ctx.globalAlpha = 0.96;
    ctx.font = '700 43px Georgia, serif';
    ctx.fillText(subtitle, c.width / 2, 212, c.width - 92);
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    this.ownedTextures.push(tex);

    const group = new THREE.Group();
    const cardThickness = 0.024;
    const bgLower = bgColor.toLowerCase();
    const isCrimson = bgLower.startsWith('#6') || bgLower.startsWith('#7');
    const isDark = bgLower.startsWith('#2') || bgLower.startsWith('#1') || isCrimson;
    const backingMat = this.makePaperMat(
      isCrimson ? 0x4c1411 : isDark ? 0x171b21 : 0xcbc0a8,
      0.86,
      0.03,
    );
    const tiltHolder = new THREE.Group();
    const backing = new THREE.Mesh(new THREE.BoxGeometry(w, cardThickness, h), backingMat);
    backing.castShadow = true;
    backing.receiveShadow = true;

    const topPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.012, h - 0.012),
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.82,
        metalness: 0.02,
      }),
    );
    topPlate.rotation.x = -Math.PI / 2;
    topPlate.position.y = cardThickness / 2 + 0.002;
    topPlate.receiveShadow = true;

    tiltHolder.add(backing, topPlate);

    if (tiltX !== 0) {
      tiltHolder.rotation.x = tiltX;
      const liftY = (h / 2 + 0.028) * Math.sin(Math.abs(tiltX)) + cardThickness * 0.5;
      tiltHolder.position.y = liftY;

      // Grounded cardstock kickstand wedge resting flush on y=0 under rear edge
      if (tiltX > 0.06) {
        const standH = Math.max(0.022, liftY + Math.sin(tiltX) * (h * 0.28));
        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.54, standH, 0.028),
          backingMat,
        );
        foot.position.set(0, standH * 0.5, -h * 0.34);
        group.add(foot);
      }
    }

    group.add(tiltHolder);
    return group;
  }

  protected addGroundShadow(parent: THREE.Object3D, radius: number, opacity = 0.34, y = 0.006): void {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, radius * 2),
      new THREE.MeshBasicMaterial({
        map: this.contactShadowTex,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = y;
    parent.add(shadow);
  }

  /**
   * Builds a multi-tiered folded cardstock terrain platform with visible beveled cut rims.
   */
  protected buildLayeredTerrace(
    widths: number[],
    depths: number[],
    stepH: number,
    colors: number[],
    edgeHex = 0x3a342a,
  ): THREE.Group {
    const g = new THREE.Group();
    for (let i = 0; i < widths.length; i++) {
      const w = widths[i];
      const d = depths[i];
      const col = colors[i] ?? colors[colors.length - 1];
      const y = stepH * (i + 0.5);

      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.025, stepH * 0.45, d + 0.025),
        this.makePaperMat(edgeHex, 0.88),
      );
      trim.position.y = stepH * i + stepH * 0.22;

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w, stepH, d),
        this.makePaperMat(col, 0.86),
      );
      slab.position.y = y;
      slab.castShadow = true;
      slab.receiveShadow = true;
      g.add(trim, slab);
    }
    return g;
  }

  /**
   * Builds multi-layered die-cut papercraft foothills/mountains/waves (used in P00-inspired backdrops and folios).
   */
  protected buildPaperRidgeCluster(
    totalW: number,
    layers: number,
    backHex: number,
    frontHex: number,
    maxH = 0.42,
    depthStep = 0.06,
  ): THREE.Group {
    const g = new THREE.Group();
    const backC = new THREE.Color(backHex);
    const frontC = new THREE.Color(frontHex);
    const hw = totalW / 2;

    for (let l = 0; l < layers; l++) {
      const t = layers > 1 ? l / (layers - 1) : 1;
      const col = backC.clone().lerp(frontC, t).getHex();
      const mat = this.makePaperMat(col, 0.86, 0.02, 0, 0, false, true);
      const pts: [number, number][] = [[-hw, 0]];
      const peaks = 5 + (l % 2);
      const layerH = maxH * (1 - t * 0.36);
      for (let p = 0; p <= peaks; p++) {
        const px = THREE.MathUtils.lerp(-hw, hw, p / peaks);
        const crest =
          p === 0 || p === peaks
            ? layerH * 0.14
            : layerH * (0.45 + 0.55 * Math.abs(Math.sin(p * 1.9 + l * 1.4)));
        pts.push([px, crest]);
      }
      pts.push([hw, 0]);
      const cut = buildCutCardShape(pts, 0.022, mat);
      cut.position.set(0, 0, l * depthStep);
      g.add(cut);
    }
    return g;
  }

  /**
   * Builds a richly illustrated die-cut pop-up theater backdrop arch with:
   * - cream/tarnished-brass cardstock cutaway proscenium border
   * - custom painted Canvas sky/horizon illustration (stars, nebula, storm, sun, citadel, ash, daylight)
   * - foreground stepped paper mountain/cloud wings & V-fold ground braces
   */
  protected buildIllustratedBackdropArch(
    w: number,
    h: number,
    opts: {
      topHex: string;
      bottomHex: string;
      cloudHex: string;
      accentHex: string;
      motif: 'stars' | 'nebula' | 'storm' | 'sun' | 'citadel' | 'ash' | 'daylight';
      frameColor?: number;
      ridgeBackHex?: number;
      ridgeFrontHex?: number;
    },
  ): THREE.Group {
    const archH = h * 0.88;
    const g = new THREE.Group();
    const hw = w / 2;
    const frameColor = opts.frameColor ?? 0xd8ceb8;

    // Outer cream cardstock arch frame
    const shape = new THREE.Shape();
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, archH * 0.56);
    shape.lineTo(-hw * 0.72, archH * 0.84);
    shape.lineTo(-hw * 0.28, archH * 0.96);
    shape.lineTo(0, archH);
    shape.lineTo(hw * 0.28, archH * 0.96);
    shape.lineTo(hw * 0.72, archH * 0.84);
    shape.lineTo(hw, archH * 0.56);
    shape.lineTo(hw, 0);
    shape.closePath();

    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 0.026,
      bevelEnabled: false,
      curveSegments: 1,
    });
    const frameCard = new THREE.Mesh(extrude, this.makePaperMat(frameColor, 0.88));
    frameCard.position.z = -0.022;
    frameCard.castShadow = true;
    frameCard.receiveShadow = true;

    // Painted illustrated sky cutout mounted neatly inside the frame with matching arch silhouette
    const skyTex = buildIllustratedSkyTexture({
      topHex: opts.topHex,
      bottomHex: opts.bottomHex,
      cloudHex: opts.cloudHex,
      accentHex: opts.accentHex,
      motif: opts.motif,
    });
    this.ownedTextures.push(skyTex);

    const innerShape = new THREE.Shape();
    const ihw = hw - 0.08;
    const iArchH = archH - 0.06;
    innerShape.moveTo(-ihw, 0.02);
    innerShape.lineTo(-ihw, iArchH * 0.56);
    innerShape.lineTo(-ihw * 0.72, iArchH * 0.84);
    innerShape.lineTo(-ihw * 0.28, iArchH * 0.96);
    innerShape.lineTo(0, iArchH);
    innerShape.lineTo(ihw * 0.28, iArchH * 0.96);
    innerShape.lineTo(ihw * 0.72, iArchH * 0.84);
    innerShape.lineTo(ihw, iArchH * 0.56);
    innerShape.lineTo(ihw, 0.02);
    innerShape.closePath();

    const innerGeo = new THREE.ShapeGeometry(innerShape, 1);
    const uvAttr = innerGeo.attributes.uv as THREE.BufferAttribute;
    const posAttr = innerGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      uvAttr.setXY(
        i,
        (posAttr.getX(i) + ihw) / (ihw * 2),
        posAttr.getY(i) / iArchH,
      );
    }
    uvAttr.needsUpdate = true;

    const skyPanel = new THREE.Mesh(
      innerGeo,
      new THREE.MeshStandardMaterial({
        map: skyTex,
        roughness: 0.84,
        metalness: 0.02,
      }),
    );
    skyPanel.position.z = 0.008;
    skyPanel.receiveShadow = true;

    // Stepped cardstock foothill/cloud wings grounded at bottom edge of arch
    const ridge = this.buildPaperRidgeCluster(
      w * 0.94,
      2,
      opts.ridgeBackHex ?? 0x262c36,
      opts.ridgeFrontHex ?? 0x3b4352,
      archH * 0.34,
      0.038,
    );
    ridge.position.set(0, 0.012, 0.024);

    // Cream cardstock hinge base rail anchoring cleanly onto spread page
    const footRail = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.04, 0.042, 0.14),
      this.makePaperMat(frameColor, 0.86),
    );
    footRail.position.set(0, 0.02, 0.01);

    // Visible rear triangular cardstock V-braces
    for (const sx of [-hw * 0.62, hw * 0.62]) {
      const strut = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, archH * 0.45, 3),
        this.makePaperMat(frameColor, 0.85),
      );
      strut.position.set(sx, archH * 0.22, -0.11);
      strut.scale.set(0.32, 1, 1.15);
      g.add(strut);
    }

    g.add(frameCard, skyPanel, ridge, footRail);
    return g;
  }

  /**
   * Legacy signature retained for safe fallback; wraps illustrated arch cleanly.
   */
  protected buildBackdropArch(
    w: number,
    h: number,
    faceColor: number,
    trimColor: number,
  ): THREE.Group {
    const c = '#' + faceColor.toString(16).padStart(6, '0');
    const a = '#' + trimColor.toString(16).padStart(6, '0');
    return this.buildIllustratedBackdropArch(w, h, {
      topHex: c,
      bottomHex: '#1A2029',
      cloudHex: c,
      accentHex: a,
      motif: 'stars',
      ridgeBackHex: faceColor,
      ridgeFrontHex: trimColor,
    });
  }

  /**
   * Builds a notched brass clockwork gear wheel for instructional mechanical linkages.
   */
  protected buildBrassGear(radius: number, teeth: number, thickness = 0.036, color = 0xc2a25d): THREE.Group {
    const g = new THREE.Group();
    const mat = this.makePaperMat(color, 0.36, 0.78);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, teeth), mat);
    disc.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.32, radius * 0.32, thickness * 1.4, 10), this.makePaperMat(0x282d35, 0.6, 0.4));
    g.add(disc, hub);
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 0.16, thickness * 0.9, radius * 0.22),
        mat,
      );
      tooth.position.set(Math.cos(a) * (radius + radius * 0.06), 0, Math.sin(a) * (radius + radius * 0.06));
      tooth.rotation.y = -a;
      g.add(tooth);
    }
    return g;
  }

  /**
   * Builds a real Z-folded accordion pleat strip whose fold angles open/close smoothly with `expand01`.
   */
  protected buildAccordionStrip(
    foldCount: number,
    panelW: number,
    panelD: number,
    colorA: number,
    colorB: number,
    targetSlot?: FolioInteractionSlot,
  ): { root: THREE.Group; setExpand: (expand01: number) => void } {
    const root = new THREE.Group();
    const ribs: THREE.Mesh[] = [];
    const ruleMat = this.makePaperMat(0x2b2620, 0.88);
    const stampMat = this.makePaperMat(0x8e2c26, 0.72);
    for (let i = 0; i < foldCount; i++) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelW, 0.02, panelD),
        this.makePaperMat(i % 2 === 0 ? colorA : colorB, 0.85),
      );
      const topRule = new THREE.Mesh(
        new THREE.BoxGeometry(panelW * 0.82, 0.004, 0.014),
        ruleMat,
      );
      topRule.position.set(0, 0.011, -panelD * 0.2);
      const stamp = new THREE.Mesh(
        new THREE.BoxGeometry(panelW * 0.24, 0.004, 0.026),
        i % 2 === 0 ? stampMat : ruleMat,
      );
      stamp.position.set(-panelW * 0.26, 0.011, panelD * 0.14);
      panel.add(topRule, stamp);
      panel.castShadow = true;
      panel.receiveShadow = true;
      if (targetSlot) this.bindMechanismTarget(panel, targetSlot);
      root.add(panel);
      ribs.push(panel);
    }
    const setExpand = (expand01: number) => {
      const e = THREE.MathUtils.clamp(expand01, 0.08, 1);
      const angle = THREE.MathUtils.lerp(1.18, 0.16, e);
      const stepZ = Math.cos(angle) * panelD * 0.94;
      const liftY = Math.sin(angle) * (panelD * 0.5);
      ribs.forEach((p, idx) => {
        p.rotation.x = idx % 2 === 0 ? -angle : angle;
        p.position.set(0, liftY + 0.015, idx * stepZ + stepZ * 0.5);
      });
    };
    setExpand(0.2);
    return { root, setExpand };
  }

  /**
   * Adds subtle 4:3 cardstock aperture corner brackets + three visible sliding brass/cardstock A/B/C pull-tabs.
   */
  protected buildApertureAndLevers(
    state: FolioRuntimeState,
    positions?: Partial<Record<FolioInteractionSlot, [number, number]>>,
  ): void {
    const manifest = FOLIO_BY_WORLD[this.worldId];
    const inkMat = this.makePaperMat(0x22272f, 0.72, 0.12);
    const brassMat = this.makePaperMat(0xc4a462, 0.36, 0.78);

    const corners: [number, number, number, number][] = [
      [-APERTURE_HALF_W, -APERTURE_HALF_D, 1, 1],
      [APERTURE_HALF_W, -APERTURE_HALF_D, -1, 1],
      [-APERTURE_HALF_W, APERTURE_HALF_D, 1, -1],
      [APERTURE_HALF_W, APERTURE_HALF_D, -1, -1],
    ];
    for (const [cx, cz, sx, sz] of corners) {
      const y = this.pageY(cx) + 0.01;
      const hArm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.016, 0.032), inkMat);
      hArm.position.set(cx + sx * 0.21, y, cz);
      const vArm = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.016, 0.42), inkMat);
      vArm.position.set(cx, y, cz + sz * 0.21);
      const brad = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 8), brassMat);
      brad.position.set(cx, y + 0.004, cz);
      this.root.add(hArm, vArm, brad);
    }

    const defaultCoords: Record<FolioInteractionSlot, [number, number]> = {
      A: [-1.72, 1.82],
      B: [0.0, 1.82],
      C: [1.72, 1.82],
    };

    (['A', 'B', 'C'] as FolioInteractionSlot[]).forEach((slot, idx) => {
      const def = manifest.interactions[idx];
      const [lx, lz] = positions?.[slot] ?? defaultCoords[slot];
      const baseY = this.pageY(lx) + 0.016;
      const tabGroup = new THREE.Group();
      tabGroup.position.set(lx, baseY, lz);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 0.028, 0.36),
        this.makePaperMat(0xdfd6c1, 0.85),
      );
      base.castShadow = true;
      base.receiveShadow = true;

      const slotTrack = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.014, 0.068),
        inkMat,
      );
      slotTrack.position.set(-0.46, 0.015, 0);

      const sliderThumb = new THREE.Group();
      const activeInit = state.interactions[slot].active ? 1 : 0;
      sliderThumb.position.set(THREE.MathUtils.lerp(-0.55, -0.37, activeInit), 0.032, 0);

      const puckMat = this.makePaperMat(
        state.interactions[slot].locked ? 0x9e322b : state.interactions[slot].active ? 0x42c2e0 : 0xc4a462,
        0.36,
        0.65,
        0,
        0,
        true,
      );
      const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.038, 12), puckMat);
      puck.castShadow = true;
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.056, 8), inkMat);
      const pullEye = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.012, 6, 14), brassMat);
      pullEye.rotation.x = Math.PI / 2;
      pullEye.position.set(-0.07, 0.012, 0);
      sliderThumb.add(puck, pin, pullEye);

      const labelCard = this.makeCardLabel(
        `LEVER [${slot}]`,
        def.label.slice(0, 24),
        0.94,
        0.26,
        '#FAF5E8',
        '#181C22',
        0.18,
      );
      labelCard.position.set(0.18, 0.034, 0);

      const hitMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.46, 0.24, 0.44),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hitMesh.position.y = 0.06;
      hitMesh.userData = {
        interactionType: 'folioMechanism',
        worldId: this.worldId,
        slot,
        label: `[${slot}] ${def.label}`,
        category: `Mechanism ${slot}`,
        hint: `${def.keyboardLabel} or click directly`,
      };

      tabGroup.add(base, slotTrack, sliderThumb, labelCard, hitMesh);
      this.root.add(tabGroup);
      this.interactables.push(hitMesh);

      this.levers.push({
        slot,
        tabGroup,
        sliderThumb,
        puckMat,
        hitMesh,
        activeRatio: activeInit,
        targetRatio: activeInit,
      });
    });
  }

  /**
   * Registers an interactive 3D diagram element inside the 4:3 aperture to trigger slot A, B, or C.
   */
  protected bindMechanismTarget(obj: THREE.Object3D, slot: FolioInteractionSlot): void {
    const manifest = FOLIO_BY_WORLD[this.worldId];
    const def = manifest.interactions[slot === 'A' ? 0 : slot === 'B' ? 1 : 2];
    obj.userData = {
      interactionType: 'folioMechanism',
      worldId: this.worldId,
      slot,
      label: `[${slot}] ${def.label}`,
      category: `Folio ${manifest.code} · Mechanism ${slot}`,
      hint: def.visualInput,
    };
    this.interactables.push(obj);
  }

  protected syncLevers(state: FolioRuntimeState): void {
    for (const lev of this.levers) {
      const st = state.interactions[lev.slot];
      lev.puckMat.color.setHex(
        st.locked ? 0x9e322b : st.active ? 0x42c2e0 : 0xc4a462,
      );
      lev.targetRatio = st.active ? 1 : 0;
    }
  }

  protected animateLevers(dt: number, reducedMotion: boolean): void {
    const k = 1 - Math.exp(-(reducedMotion ? 16 : 9) * dt);
    for (const lev of this.levers) {
      lev.activeRatio += (lev.targetRatio - lev.activeRatio) * k;
      lev.sliderThumb.position.x = THREE.MathUtils.lerp(-0.55, -0.37, lev.activeRatio);
    }
  }

  public dispose(): void {
    this.ownedTextures.forEach((t) => t.dispose());
    this.ownedTextures = [];
    this.matCache.forEach((m) => m.dispose());
    this.matCache.clear();
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }
}
