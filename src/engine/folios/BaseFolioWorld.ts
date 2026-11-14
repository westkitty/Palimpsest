import * as THREE from 'three';
import { FOLIO_BY_WORLD } from '../../story/historyManifest';
import { DraxisId, FolioInteractionSlot, FolioRuntimeState, WorldId } from '../../types/atlas';
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
 * curved page-arch grounding, 1024px sharp archival plaques, sliding brass/cardstock A/B/C pull-tabs,
 * reusable V-fold backdrops, accordion bellows, stepped terrain pads, and clean GPU disposal.
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
  ): THREE.MeshStandardMaterial {
    const key = `${color}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}`;
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
      side: THREE.DoubleSide,
    });
    if (!dynamic) {
      this.matCache.set(key, mat);
    }
    return mat;
  }

  /**
   * Builds a high-DPI 1024x288 physical cardstock plaque with cut-edge thickness, subtle ink frame,
   * corner brass pins, and optional easel tilt for crisp readability in 4:3 overhead and Slate views.
   */
  protected makeCardLabel(
    title: string,
    subtitle: string,
    w = 1.6,
    h = 0.42,
    bgColor = '#EFE9DA',
    inkColor = '#20262E',
    tiltX = 0.16,
  ): THREE.Group {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 288;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, c.width, c.height);

    // Double mid-century archival border
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, c.width - 20, c.height - 20);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, c.width - 44, c.height - 44);
    ctx.globalAlpha = 1;

    ctx.fillStyle = inkColor;
    ctx.font = '700 46px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), c.width / 2, 114);

    ctx.font = '600 34px Georgia, serif';
    ctx.fillText(subtitle, c.width / 2, 198);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    this.ownedTextures.push(tex);

    const group = new THREE.Group();
    const cardThickness = 0.022;
    const backingMat = this.makePaperMat(
      bgColor.toLowerCase().startsWith('#2') ? 0x1a1e24 : 0xcbc0a8,
      0.86,
      0.03,
    );
    const backing = new THREE.Mesh(new THREE.BoxGeometry(w, cardThickness, h), backingMat);
    backing.castShadow = true;
    backing.receiveShadow = true;

    const topPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.01, h - 0.01),
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.84,
        metalness: 0.02,
      }),
    );
    topPlate.rotation.x = -Math.PI / 2;
    topPlate.position.y = cardThickness / 2 + 0.002;
    topPlate.receiveShadow = true;

    group.add(backing, topPlate);
    if (tiltX !== 0) {
      group.rotation.x = tiltX;
    }
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
   * Builds a V-fold die-cut cardstock horizon arch anchored at the rear gutter with triangular paper braces.
   */
  protected buildBackdropArch(
    w: number,
    h: number,
    faceColor: number,
    trimColor: number,
  ): THREE.Group {
    const archH = h * 0.78;
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    const hw = w / 2;
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, archH * 0.58);
    shape.lineTo(-hw * 0.65, archH * 0.86);
    shape.lineTo(-hw * 0.22, archH * 0.96);
    shape.lineTo(0, archH);
    shape.lineTo(hw * 0.22, archH * 0.96);
    shape.lineTo(hw * 0.65, archH * 0.86);
    shape.lineTo(hw, archH * 0.58);
    shape.lineTo(hw, 0);
    shape.closePath();

    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 0.026,
      bevelEnabled: false,
    });
    const backCard = new THREE.Mesh(extrude, this.makePaperMat(faceColor, 0.88));
    backCard.position.z = -0.013;
    backCard.castShadow = true;
    backCard.receiveShadow = true;

    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.04, 0.04, 0.08),
      this.makePaperMat(trimColor, 0.72),
    );
    rim.position.y = 0.02;

    // Two visible rear triangle paper V-struts behind the backplate grounding it to the spread
    for (const sx of [-hw * 0.6, hw * 0.6]) {
      const strut = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.36, 3),
        this.makePaperMat(trimColor, 0.85),
      );
      strut.position.set(sx, 0.18, -0.1);
      strut.scale.set(0.35, 1, 1.1);
      g.add(strut);
    }

    g.add(backCard, rim);
    return g;
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
    for (let i = 0; i < foldCount; i++) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelW, 0.02, panelD),
        this.makePaperMat(i % 2 === 0 ? colorA : colorB, 0.85),
      );
      panel.castShadow = true;
      panel.receiveShadow = true;
      if (targetSlot) this.bindMechanismTarget(panel, targetSlot);
      root.add(panel);
      ribs.push(panel);
    }
    const setExpand = (expand01: number) => {
      const e = THREE.MathUtils.clamp(expand01, 0.08, 1);
      // Tilt ranges from near-vertical stacked (when compressed) to low flat zigzag (when extended)
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
    const inkMat = this.makePaperMat(0x282d35, 0.72, 0.12);
    const brassMat = this.makePaperMat(0xc4a462, 0.36, 0.78);

    // Subtle 4:3 cardstock frame corner brackets + small brass corner registration brads
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

    // Positioned neatly on the bottom cream spread margin INSIDE camera view (clear of HUD dock)
    const defaultCoords: Record<FolioInteractionSlot, [number, number]> = {
      A: [-1.72, 1.84],
      B: [0.0, 1.84],
      C: [1.72, 1.84],
    };

    (['A', 'B', 'C'] as FolioInteractionSlot[]).forEach((slot, idx) => {
      const def = manifest.interactions[idx];
      const [lx, lz] = positions?.[slot] ?? defaultCoords[slot];
      const baseY = this.pageY(lx) + 0.016;
      const tabGroup = new THREE.Group();
      tabGroup.position.set(lx, baseY, lz);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.36, 0.028, 0.34),
        this.makePaperMat(0xdfd6c1, 0.85),
      );
      base.castShadow = true;
      base.receiveShadow = true;

      // Dark slotted channel rail
      const slotTrack = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.012, 0.065),
        inkMat,
      );
      slotTrack.position.set(-0.43, 0.014, 0);

      // Sliding brass thumb knob inside the slot
      const sliderThumb = new THREE.Group();
      const activeInit = state.interactions[slot].active ? 1 : 0;
      sliderThumb.position.set(THREE.MathUtils.lerp(-0.52, -0.34, activeInit), 0.03, 0);

      const puckMat = this.makePaperMat(
        state.interactions[slot].locked ? 0x9e322b : state.interactions[slot].active ? 0x42c2e0 : 0xc4a462,
        0.36,
        0.65,
        0,
        0,
        true,
      );
      const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.036, 12), puckMat);
      puck.castShadow = true;
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.052, 8), inkMat);
      sliderThumb.add(puck, pin);

      const labelCard = this.makeCardLabel(
        `[${slot}]`,
        def.label.slice(0, 22),
        0.88,
        0.24,
        '#F4EFE2',
        '#1D2229',
        0.04,
      );
      labelCard.position.set(0.18, 0.022, 0);

      const hitMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 0.24, 0.44),
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
      lev.sliderThumb.position.x = THREE.MathUtils.lerp(-0.52, -0.34, lev.activeRatio);
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
