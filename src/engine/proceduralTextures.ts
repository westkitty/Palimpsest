import * as THREE from 'three';
import { FOLIO_MANIFESTS } from '../story/historyManifest';
import { TOTAL_WORLDS, WorldId } from '../types/atlas';

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralTexturePack {
  slateColor: THREE.CanvasTexture;
  slateBump: THREE.CanvasTexture;
  linenColor: THREE.CanvasTexture;
  linenBump: THREE.CanvasTexture;
  coverFrontColor: THREE.CanvasTexture;
  coverFrontBump: THREE.CanvasTexture;
  coverFrontMetalness: THREE.CanvasTexture;
  coverFrontRoughness: THREE.CanvasTexture;
  pageEdgeColor: THREE.CanvasTexture;
  paperGrainBump: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  worldParchment: THREE.CanvasTexture[];
  worldSecretInk: THREE.CanvasTexture[];
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTexturePack {
  const aniso = Math.min(maxAnisotropy || 4, 8);
  const allTextures: THREE.Texture[] = [];

  // 1. Matte Mineral Black Slate Tabletop (with fine irregular pale mineral veins & micro-cleavage)
  const [slateC, sCtx] = createCanvas(1024, 1024);
  const [slateB, sbCtx] = createCanvas(1024, 1024);
  sCtx.fillStyle = '#14171C';
  sCtx.fillRect(0, 0, 1024, 1024);
  sbCtx.fillStyle = '#808080';
  sbCtx.fillRect(0, 0, 1024, 1024);

  // Broad slate mineral tonal stratification
  for (let i = 0; i < 48; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 90 + Math.random() * 240;
    const grad = sCtx.createRadialGradient(x, y, 8, x, y, r);
    const v = 16 + Math.floor(Math.random() * 16);
    grad.addColorStop(0, `rgba(${v}, ${v + 3}, ${v + 7}, 0.28)`);
    grad.addColorStop(1, 'rgba(20, 23, 28, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 1024, 1024);

    const bVal = 112 + Math.floor(Math.random() * 32);
    sbCtx.fillStyle = `rgba(${bVal},${bVal},${bVal},0.16)`;
    sbCtx.beginPath();
    sbCtx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    sbCtx.fill();
  }

  // Fine mineral grain & matte slate cleavage pit flecks
  for (let i = 0; i < 8500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const shade = Math.random() > 0.5 ? 'rgba(38, 43, 52, 0.28)' : 'rgba(10, 12, 16, 0.34)';
    sCtx.fillStyle = shade;
    sCtx.fillRect(x, y, 1 + Math.random() * 3.5, 1 + Math.random() * 2);
    const bv = Math.random() > 0.5 ? 142 : 104;
    sbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.3)`;
    sbCtx.fillRect(x, y, 2, 2);
  }

  // Irregular pale calcite/quartz mineral veins across the black slate
  for (let v = 0; v < 9; v++) {
    let vx = Math.random() * 1024;
    let vy = Math.random() * 1024;
    let angle = -0.35 + (Math.random() - 0.5) * 0.9;
    sCtx.strokeStyle = 'rgba(168, 178, 192, 0.16)';
    sCtx.lineWidth = 0.8 + Math.random() * 1.4;
    sbCtx.strokeStyle = 'rgba(176, 176, 176, 0.28)';
    sbCtx.lineWidth = 1.4;
    sCtx.beginPath();
    sbCtx.beginPath();
    sCtx.moveTo(vx, vy);
    sbCtx.moveTo(vx, vy);
    const segs = 14 + Math.floor(Math.random() * 12);
    for (let s = 0; s < segs; s++) {
      angle += (Math.random() - 0.5) * 0.65;
      vx += Math.cos(angle) * (18 + Math.random() * 34);
      vy += Math.sin(angle) * (18 + Math.random() * 34);
      sCtx.lineTo(vx, vy);
      sbCtx.lineTo(vx, vy);
    }
    sCtx.stroke();
    sbCtx.stroke();
  }

  const slateColor = finalizeColorTexture(slateC, aniso, 2, 2);
  const slateBump = finalizeDataTexture(slateB, aniso, 2, 2);

  // 2. Charcoal Archival Linen Binding
  const [linenC, lCtx] = createCanvas(512, 512);
  const [linenB, lbCtx] = createCanvas(512, 512);
  lCtx.fillStyle = '#252930';
  lCtx.fillRect(0, 0, 512, 512);
  lbCtx.fillStyle = '#7E7E7E';
  lbCtx.fillRect(0, 0, 512, 512);

  // Crosshatch bookbinder linen warp & weft
  for (let i = 0; i < 512; i += 3) {
    const lShade = 32 + Math.floor((i % 6) * 1.4);
    lCtx.fillStyle = `rgba(${lShade}, ${lShade + 4}, ${lShade + 10}, 0.34)`;
    lCtx.fillRect(i, 0, 1.5, 512);
    lCtx.fillRect(0, i, 512, 1.5);

    const bShade = i % 6 === 0 ? 156 : 112;
    lbCtx.fillStyle = `rgba(${bShade},${bShade},${bShade},0.42)`;
    lbCtx.fillRect(i, 0, 1.5, 512);
    lbCtx.fillRect(0, i, 512, 1.5);
  }
  for (let i = 0; i < 1600; i++) {
    lCtx.fillStyle = Math.random() > 0.5 ? 'rgba(55,62,72,0.18)' : 'rgba(18,20,24,0.22)';
    lCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const linenColor = finalizeColorTexture(linenC, aniso, 2, 2);
  const linenBump = finalizeDataTexture(linenB, aniso, 2, 2);

  // 3. Broad Charcoal Linen Front Cover with Sober Administration Titling & Technical Emblem
  // Locks: Title, Administration Instructional Edition, star, cyan Starsilk filament, concentric rings, interrupted orbit line, negligible crimson
  const [covC, cCtx] = createCanvas(1024, 1400);
  const [covB, cbCtx] = createCanvas(1024, 1400);
  const [covM, cmCtx] = createCanvas(1024, 1400);
  const [covR, crCtx] = createCanvas(1024, 1400);

  for (let tx = 0; tx < 2; tx++) {
    for (let ty = 0; ty < 3; ty++) {
      cCtx.drawImage(linenC, tx * 512, ty * 512, 512, 512);
      cbCtx.drawImage(linenB, tx * 512, ty * 512, 512, 512);
    }
  }

  const covVignette = cCtx.createRadialGradient(512, 680, 140, 512, 700, 820);
  covVignette.addColorStop(0, 'rgba(46, 52, 62, 0.24)');
  covVignette.addColorStop(0.7, 'rgba(26, 30, 36, 0.36)');
  covVignette.addColorStop(1, 'rgba(12, 14, 18, 0.72)');
  cCtx.fillStyle = covVignette;
  cCtx.fillRect(0, 0, 1024, 1400);

  // Spine crease channel
  const hingeGrad = cCtx.createLinearGradient(0, 0, 96, 0);
  hingeGrad.addColorStop(0, 'rgba(10, 12, 15, 0.7)');
  hingeGrad.addColorStop(0.65, 'rgba(42, 47, 54, 0.25)');
  hingeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  cCtx.fillStyle = hingeGrad;
  cCtx.fillRect(0, 0, 100, 1400);

  // Matte charcoal linen metalness & roughness
  cmCtx.fillStyle = 'rgb(8, 8, 8)';
  cmCtx.fillRect(0, 0, 1024, 1400);
  crCtx.fillStyle = 'rgb(206, 206, 206)';
  crCtx.fillRect(0, 0, 1024, 1400);

  type FoilRole = 'color' | 'bump' | 'metal' | 'rough';
  const drawStamped = (fn: (ctx: CanvasRenderingContext2D, role: FoilRole) => void) => {
    fn(cCtx, 'color');
    fn(cbCtx, 'bump');
    fn(cmCtx, 'metal');
    fn(crCtx, 'rough');
  };

  drawStamped((ctx, role) => {
    const goldTone =
      role === 'color'
        ? '#C2A86E' // restrained tarnished gold
        : role === 'bump'
          ? '#ECECEC'
          : role === 'metal'
            ? '#DCDCDC'
            : '#525252';
    const inkRule =
      role === 'color'
        ? '#9E895B'
        : role === 'bump'
          ? '#D8D8D8'
          : role === 'metal'
            ? '#C8C8C8'
            : '#686868';
    const cyanFilament =
      role === 'color'
        ? '#4CCAE8' // crisp Starsilk cyan filament
        : role === 'bump'
          ? '#F6F6F6'
          : role === 'metal'
            ? '#707070'
            : '#464646';

    // Mid-century technical perimeter hairline border
    ctx.strokeStyle = inkRule;
    ctx.lineWidth = 4;
    ctx.strokeRect(78, 78, 868, 1244);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(94, 94, 836, 1212);

    // Subtle alignment ticks on frame corners
    ctx.strokeStyle = goldTone;
    ctx.lineWidth = 2.5;
    for (const [cx, cy] of [
      [94, 94],
      [930, 94],
      [94, 1306],
      [930, 1306],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.lineTo(cx + 12, cy);
      ctx.moveTo(cx, cy - 12);
      ctx.lineTo(cx, cy + 12);
      ctx.stroke();
    }

    // Header rules + Sober Administration titling
    ctx.textAlign = 'center';
    ctx.fillStyle = inkRule;
    ctx.font = '600 20px "Courier New", monospace';
    ctx.fillText('ADMINISTRATION INSTRUCTIONAL EDITION', 512, 176);

    ctx.strokeStyle = inkRule;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(204, 204);
    ctx.lineTo(820, 204);
    ctx.moveTo(204, 374);
    ctx.lineTo(820, 374);
    ctx.stroke();

    ctx.fillStyle = goldTone;
    ctx.font = '700 84px Georgia, serif';
    ctx.fillText('PALIMPSEST', 512, 286);

    ctx.fillStyle = goldTone;
    ctx.font = '600 27px Georgia, serif';
    ctx.fillText('AN ILLUSTRATED HISTORY OF THE ALL', 512, 342);

    // Central Embossed Technical Emblem (cy = 700)
    // Includes: 1 central star, concentric astronomical rings, 1 interrupted orbit line, 1 cyan filament
    ctx.save();
    ctx.translate(512, 700);

    // Concentric astronomical rings
    ctx.strokeStyle = inkRule;
    for (const [r, lw] of [
      [256, 3.2],
      [212, 2.0],
      [158, 2.2],
      [98, 2.0],
    ] as const) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Interrupted orbital line (dashed with clear sector break — War/Siege Wall reference)
    ctx.save();
    ctx.rotate(-0.34);
    ctx.strokeStyle = goldTone;
    ctx.lineWidth = 3.0;
    ctx.setLineDash([28, 16]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 294, 118, 0, 0.28, Math.PI * 1.78);
    ctx.stroke();
    ctx.restore();

    // Fine astronomical crosshair axes
    ctx.strokeStyle = inkRule;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-278, 0);
    ctx.lineTo(-104, 0);
    ctx.moveTo(104, 0);
    ctx.lineTo(278, 0);
    ctx.moveTo(0, -278);
    ctx.lineTo(0, -104);
    ctx.moveTo(0, 104);
    ctx.lineTo(0, 278);
    ctx.stroke();

    // One sharp Cyan Starsilk Filament passing cleanly through the emblem
    ctx.strokeStyle = cyanFilament;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(-252, 86);
    ctx.bezierCurveTo(-96, -34, 84, 38, 252, -88);
    ctx.stroke();

    // Central Model Star (8-point sharp technical brass star)
    ctx.fillStyle = goldTone;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? 52 : 17;
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Twelve sober folio division ticks around the outer technical ring
    ctx.fillStyle = goldTone;
    ctx.font = '600 17px "Courier New", monospace';
    for (let f = 0; f < 12; f++) {
      const a = (f / 12) * Math.PI * 2 - Math.PI / 2;
      const label = `F${String(f + 1).padStart(2, '0')}`;
      ctx.fillText(label, Math.cos(a) * 234, Math.sin(a) * 234 + 6);
    }

    ctx.restore();

    // Lower Colophon
    ctx.strokeStyle = inkRule;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(220, 1106);
    ctx.lineTo(804, 1106);
    ctx.moveTo(260, 1230);
    ctx.lineTo(764, 1230);
    ctx.stroke();

    ctx.fillStyle = goldTone;
    ctx.font = '600 26px Georgia, serif';
    ctx.fillText('TWELVE FOLIOS · F01 – F12', 512, 1156);
    ctx.fillStyle = inkRule;
    ctx.font = '500 20px "Courier New", monospace';
    ctx.fillText('EDITORIAL RECONSTRUCTION · SERIES 1954–61', 512, 1200);
  });

  const coverFrontColor = finalizeColorTexture(covC, aniso);
  const coverFrontBump = finalizeDataTexture(covB, aniso);
  const coverFrontMetalness = finalizeDataTexture(covM, aniso);
  const coverFrontRoughness = finalizeDataTexture(covR, aniso);

  // 4. Stacked Cream Cardstock Page Edges
  const [edgeC, eCtx] = createCanvas(256, 256);
  eCtx.fillStyle = '#E4DBC6';
  eCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const tone = 212 + Math.round(Math.sin(y * 0.65) * 12 + Math.random() * 10);
    eCtx.fillStyle = `rgb(${tone}, ${Math.round(tone * 0.95)}, ${Math.round(tone * 0.86)})`;
    eCtx.fillRect(0, y, 256, 1.5);
  }
  const pageEdgeColor = finalizeColorTexture(edgeC, aniso, 2, 1);

  // 5. Fine Heavy Cotton Cardstock Grain Bump
  const [pgC, pgCtx] = createCanvas(512, 512);
  pgCtx.fillStyle = '#808080';
  pgCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8500; i++) {
    const v = 114 + Math.floor(Math.random() * 38);
    pgCtx.fillStyle = `rgb(${v},${v},${v})`;
    pgCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 1);
  }
  const paperGrainBump = finalizeDataTexture(pgC, aniso, 3, 2);

  // 6. Soft Contact Shadow
  const [csC, csCtx] = createCanvas(256, 256);
  const csGrad = csCtx.createRadialGradient(128, 128, 12, 128, 128, 126);
  csGrad.addColorStop(0, 'rgba(6, 7, 10, 0.85)');
  csGrad.addColorStop(0.55, 'rgba(6, 7, 10, 0.36)');
  csGrad.addColorStop(1, 'rgba(6, 7, 10, 0)');
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 256, 256);
  const contactShadow = finalizeColorTexture(csC, aniso);

  // 7. 12 Archival Cardstock Spreads + Marginalia Lens Layers
  const worldParchment: THREE.CanvasTexture[] = [];
  const worldSecretInk: THREE.CanvasTexture[] = [];
  for (let i = 0; i < TOTAL_WORLDS; i++) {
    const wId = i as WorldId;
    worldParchment.push(buildFolioSpreadTexture(wId, aniso));
    worldSecretInk.push(buildFolioMarginaliaTexture(wId, aniso));
  }

  allTextures.push(
    slateColor,
    slateBump,
    linenColor,
    linenBump,
    coverFrontColor,
    coverFrontBump,
    coverFrontMetalness,
    coverFrontRoughness,
    pageEdgeColor,
    paperGrainBump,
    contactShadow,
    ...worldParchment,
    ...worldSecretInk,
  );

  return {
    slateColor,
    slateBump,
    linenColor,
    linenBump,
    coverFrontColor,
    coverFrontBump,
    coverFrontMetalness,
    coverFrontRoughness,
    pageEdgeColor,
    paperGrainBump,
    contactShadow,
    worldParchment,
    worldSecretInk,
    dispose: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}

/**
 * Generates each folio's layered cream cardstock spread with an interior 4:3 classroom film frame,
 * subtle registration corners, ruled margins, and period-specific archival ink wash.
 */
function buildFolioSpreadTexture(worldId: WorldId, anisotropy: number): THREE.CanvasTexture {
  const W = 1200;
  const H = 800; // Matches 8.4 : 5.6 (1.5 : 1) open book spread cleanly
  const [canvas, ctx] = createCanvas(W, H);
  const manifest = FOLIO_MANIFESTS[worldId];
  const pal = manifest.periodPalette;

  // Base cream archival cardstock gradient
  const baseGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 720);
  baseGrad.addColorStop(0, pal.paperInner);
  baseGrad.addColorStop(0.75, pal.paperMid);
  baseGrad.addColorStop(1, pal.paperEdge);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle archival fiber grain
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle =
      Math.random() > 0.5 ? 'rgba(60, 56, 48, 0.032)' : 'rgba(255, 254, 248, 0.045)';
    ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 1.2);
  }

  // Spine crease shadow down the center gutter
  const spineGrad = ctx.createLinearGradient(W / 2 - 26, 0, W / 2 + 26, 0);
  spineGrad.addColorStop(0, 'rgba(30, 28, 24, 0)');
  spineGrad.addColorStop(0.5, 'rgba(22, 20, 18, 0.34)');
  spineGrad.addColorStop(1, 'rgba(30, 28, 24, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(W / 2 - 26, 0, 52, H);

  // Outer folio page borders
  ctx.strokeStyle = pal.lineRgba;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(20, 20, W / 2 - 30, H - 40);
  ctx.strokeRect(W / 2 + 10, 20, W / 2 - 30, H - 40);

  // Interior Contained 4:3 Instructional Film Aperture (exact 4:3 rectangle centered across the spread)
  // H_frame = 612px -> W_frame = 816px (4:3 = 1.3333)
  const frameW = 816;
  const frameH = 612;
  const frameX = (W - frameW) / 2;
  const frameY = (H - frameH) / 2 + 6;

  // Soft projector illumination wash inside 4:3 frame
  const projWash = ctx.createRadialGradient(
    W / 2,
    H / 2 + 6,
    40,
    W / 2,
    H / 2 + 6,
    frameW * 0.62,
  );
  projWash.addColorStop(0, 'rgba(255, 252, 242, 0.34)');
  projWash.addColorStop(0.7, pal.washRgba);
  projWash.addColorStop(1, 'rgba(32, 34, 38, 0.08)');
  ctx.fillStyle = projWash;
  ctx.fillRect(frameX, frameY, frameW, frameH);

  // Clean 4:3 black archival aperture hairline & gate corner registration marks
  ctx.strokeStyle = pal.inkHex;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // Inner technical rule inside 4:3 gate
  ctx.strokeStyle = pal.lineRgba;
  ctx.lineWidth = 1;
  ctx.strokeRect(frameX + 8, frameY + 8, frameW - 16, frameH - 16);

  // Projector gate sprocket registration crosshairs along top/bottom of 4:3 aperture
  ctx.strokeStyle = pal.inkHex;
  ctx.lineWidth = 1.5;
  for (const cx of [frameX + 16, W / 2, frameX + frameW - 16]) {
    ctx.beginPath();
    ctx.moveTo(cx - 8, frameY - 8);
    ctx.lineTo(cx + 8, frameY - 8);
    ctx.moveTo(cx, frameY - 14);
    ctx.lineTo(cx, frameY - 2);
    ctx.moveTo(cx - 8, frameY + frameH + 8);
    ctx.lineTo(cx + 8, frameY + frameH + 8);
    ctx.moveTo(cx, frameY + frameH + 2);
    ctx.lineTo(cx, frameY + frameH + 14);
    ctx.stroke();
  }

  // Scientific diagram grid inside 4:3 frame (adapted per folio phase)
  ctx.strokeStyle = pal.lineRgba;
  ctx.lineWidth = 1;
  for (let gx = frameX + 68; gx < frameX + frameW; gx += 68) {
    ctx.beginPath();
    ctx.moveTo(gx, frameY + 12);
    ctx.lineTo(gx, frameY + frameH - 12);
    ctx.stroke();
  }
  for (let gy = frameY + 68; gy < frameY + frameH; gy += 68) {
    ctx.beginPath();
    ctx.moveTo(frameX + 12, gy);
    ctx.lineTo(frameX + frameW - 12, gy);
    ctx.stroke();
  }

  // Geometric focal diagram traces on spread card below 3D models
  ctx.strokeStyle = pal.accentHex;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.6;
  if (worldId === 8 || worldId === 9) {
    // Hal'Ven / Siege Wall concentric boundary ellipses
    for (const r of [90, 165, 240]) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2 + 6, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 + 6, 175, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Folio header typography outside the central 3D model footprint (safe margins)
  ctx.fillStyle = pal.inkHex;
  ctx.font = '700 17px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${manifest.code} · ${manifest.title.toUpperCase()}`, 36, 48);

  ctx.font = '500 13px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${manifest.temporalMarker.toUpperCase()}`, W - 36, 48);

  // Subtle bottom archival footer
  ctx.font = '500 12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`ADMINISTRATION ARCHIVE · ${manifest.eraLabel.toUpperCase()}`, 36, H - 28);
  ctx.textAlign = 'right';
  ctx.fillText('4:3 INSTRUCTIONAL APERTURE · REVERSIBLE STUDY PLATE', W - 36, H - 28);

  return finalizeColorTexture(canvas, anisotropy);
}

function buildFolioMarginaliaTexture(worldId: WorldId, anisotropy: number): THREE.CanvasTexture {
  const W = 1200;
  const H = 800;
  const [canvas, ctx] = createCanvas(W, H);
  ctx.clearRect(0, 0, W, H);

  const manifest = FOLIO_MANIFESTS[worldId];
  ctx.strokeStyle = 'rgba(72, 202, 232, 0.92)';
  ctx.fillStyle = 'rgba(72, 202, 232, 0.92)';
  ctx.lineWidth = 1.8;

  // Fine photogrammetric calibration ticks revealed under the brass lens
  ctx.save();
  ctx.globalAlpha = 0.4;
  for (let x = 192; x <= W - 192; x += 68) {
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x, H - 100);
    ctx.stroke();
  }
  for (let y = 100; y <= H - 100; y += 68) {
    ctx.beginPath();
    ctx.moveTo(192, y);
    ctx.lineTo(W - 192, y);
    ctx.stroke();
  }
  ctx.restore();

  const spots = [
    { px: 270, py: 220, label: `REF ${manifest.code}-A` },
    { px: 930, py: 580, label: `REF ${manifest.code}-B` },
  ];

  spots.forEach(({ px, py, label }) => {
    ctx.save();
    ctx.translate(px, py);
    for (const r of [16, 34, 52]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.font = '600 15px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 72);
    ctx.restore();
  });

  return finalizeColorTexture(canvas, anisotropy);
}
