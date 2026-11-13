import * as THREE from 'three';
import { TOTAL_WORLDS, WORLD_METADATA, WorldId } from '../types/atlas';

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
  walnutColor: THREE.CanvasTexture;
  walnutBump: THREE.CanvasTexture;
  leatherColor: THREE.CanvasTexture;
  leatherBump: THREE.CanvasTexture;
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

  // 1. Aged Walnut Desk
  const [walnutC, wCtx] = createCanvas(512, 512);
  const [walnutB, wbCtx] = createCanvas(512, 512);
  wCtx.fillStyle = '#2A1B12';
  wCtx.fillRect(0, 0, 512, 512);
  wbCtx.fillStyle = '#808080';
  wbCtx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y++) {
    const wave = Math.sin(y * 0.045) * 14 + Math.sin(y * 0.13) * 6;
    const shade = 0.78 + 0.22 * Math.sin(y * 0.09 + Math.cos(y * 0.02) * 3);
    wCtx.fillStyle = `rgb(${Math.round(54 * shade)}, ${Math.round(33 * shade)}, ${Math.round(21 * shade)})`;
    wCtx.fillRect(0, y, 512, 1);

    const g = Math.round(115 + 30 * Math.sin(y * 0.11 + wave * 0.05));
    wbCtx.fillStyle = `rgb(${g},${g},${g})`;
    wbCtx.fillRect(0, y, 512, 1);
  }
  for (let p = 1; p < 4; p++) {
    const py = p * 128;
    wCtx.fillStyle = 'rgba(12, 7, 4, 0.75)';
    wCtx.fillRect(0, py - 1, 512, 3);
    wbCtx.fillStyle = '#202020';
    wbCtx.fillRect(0, py - 1, 512, 3);
  }
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 30 + Math.random() * 140;
    wCtx.fillStyle = Math.random() > 0.5 ? 'rgba(20,10,5,0.2)' : 'rgba(92,58,34,0.14)';
    wCtx.fillRect(x, y, len, 1.5);
  }

  const walnutColor = finalizeColorTexture(walnutC, aniso, 2, 2);
  const walnutBump = finalizeDataTexture(walnutB, aniso, 2, 2);

  // 2. Pebbled Antiquarian Leather
  const [leathC, lCtx] = createCanvas(512, 512);
  const [leathB, lbCtx] = createCanvas(512, 512);
  lCtx.fillStyle = '#331B14';
  lCtx.fillRect(0, 0, 512, 512);
  lbCtx.fillStyle = '#7A7A7A';
  lbCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 5200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1.5 + Math.random() * 3.5;
    const dark = Math.random() > 0.5;
    lCtx.fillStyle = dark ? 'rgba(28, 13, 9, 0.32)' : 'rgba(84, 46, 32, 0.24)';
    lCtx.beginPath();
    lCtx.arc(x, y, r, 0, Math.PI * 2);
    lCtx.fill();

    const bv = dark ? 92 : 168;
    lbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.35)`;
    lbCtx.beginPath();
    lbCtx.arc(x, y, r, 0, Math.PI * 2);
    lbCtx.fill();
  }
  const leatherColor = finalizeColorTexture(leathC, aniso, 2, 2);
  const leatherBump = finalizeDataTexture(leathB, aniso, 2, 2);

  // 3. Hand-Tooled Antiquarian Leather & 24k Gold-Leaf Embossed Front Cover
  const [covC, cCtx] = createCanvas(1024, 1400);
  const [covB, cbCtx] = createCanvas(1024, 1400);
  const [covM, cmCtx] = createCanvas(1024, 1400);
  const [covR, crCtx] = createCanvas(1024, 1400);

  // Tile pebbled leather base cleanly across the 1024x1400 folio board
  for (let tx = 0; tx < 2; tx++) {
    for (let ty = 0; ty < 3; ty++) {
      cCtx.drawImage(leathC, tx * 512, ty * 512, 512, 512);
      cbCtx.drawImage(leathB, tx * 512, ty * 512, 512, 512);
    }
  }

  // Deep burnished cordovan-walnut patina & worn edge vignetting
  const covGrad = cCtx.createRadialGradient(512, 680, 140, 512, 700, 820);
  covGrad.addColorStop(0, 'rgba(96, 46, 31, 0.34)');
  covGrad.addColorStop(0.62, 'rgba(42, 18, 12, 0.38)');
  covGrad.addColorStop(1, 'rgba(14, 6, 4, 0.78)');
  cCtx.fillStyle = covGrad;
  cCtx.fillRect(0, 0, 1024, 1400);

  // Spine-hinge creasing band on the left edge (X = 0..105)
  const hingeGrad = cCtx.createLinearGradient(0, 0, 115, 0);
  hingeGrad.addColorStop(0, 'rgba(12, 5, 3, 0.65)');
  hingeGrad.addColorStop(0.55, 'rgba(66, 33, 21, 0.25)');
  hingeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  cCtx.fillStyle = hingeGrad;
  cCtx.fillRect(0, 0, 120, 1400);

  // Base leather metalness (matte ~0.04) & roughness (~0.66 with edge burnishing ~0.52)
  cmCtx.fillStyle = 'rgb(10, 10, 10)';
  cmCtx.fillRect(0, 0, 1024, 1400);
  crCtx.fillStyle = 'rgb(172, 172, 172)';
  crCtx.fillRect(0, 0, 1024, 1400);

  // Blind-tooled recessed leather panel border (subtle debossed shadow in color & bump)
  cCtx.strokeStyle = 'rgba(12, 5, 3, 0.85)';
  cCtx.lineWidth = 14;
  cCtx.strokeRect(54, 54, 916, 1292);
  cbCtx.strokeStyle = '#383838';
  cbCtx.lineWidth = 14;
  cbCtx.strokeRect(54, 54, 916, 1292);

  // Inner dark recessed central medallion tablet
  cCtx.fillStyle = 'rgba(20, 9, 6, 0.42)';
  cCtx.fillRect(114, 114, 796, 1172);

  type FoilRole = 'color' | 'bump' | 'metal' | 'rough';
  const drawGoldLeaf = (fn: (ctx: CanvasRenderingContext2D, role: FoilRole) => void) => {
    fn(cCtx, 'color');
    fn(cbCtx, 'bump');
    fn(cmCtx, 'metal');
    fn(crCtx, 'rough');
  };

  drawGoldLeaf((ctx, role) => {
    const strokeTone =
      role === 'color'
        ? '#E6C478'
        : role === 'bump'
          ? '#F0F0F0'
          : role === 'metal'
            ? '#ECECEC'
            : '#3A3A3A';
    const brightTone =
      role === 'color'
        ? '#F4DC9E'
        : role === 'bump'
          ? '#FFFFFF'
          : role === 'metal'
            ? '#F6F6F6'
            : '#2C2C2C';

    // 1. Concentric gold fillet framing rules
    ctx.strokeStyle = strokeTone;
    ctx.lineWidth = 8;
    ctx.strokeRect(72, 72, 880, 1256);

    ctx.strokeStyle = brightTone;
    ctx.lineWidth = 3;
    ctx.strokeRect(92, 92, 840, 1216);
    ctx.strokeRect(114, 114, 796, 1172);

    // Subtle dotted pearl beading along the outer rule
    ctx.fillStyle = strokeTone;
    for (let x = 132; x <= 892; x += 28) {
      ctx.beginPath();
      ctx.arc(x, 103, 2.6, 0, Math.PI * 2);
      ctx.arc(x, 1297, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let y = 132; y <= 1268; y += 28) {
      ctx.beginPath();
      ctx.arc(103, y, 2.6, 0, Math.PI * 2);
      ctx.arc(921, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Decorative corner filigree arches & rosette eyelets
    const corners: [number, number, number][] = [
      [114, 114, 0],
      [910, 114, Math.PI / 2],
      [910, 1286, Math.PI],
      [114, 1286, -Math.PI / 2],
    ];
    corners.forEach(([cx, cy, ang]) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 118, 0, Math.PI / 2);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 88, 0, Math.PI / 2);
      ctx.stroke();
      for (let k = 1; k <= 4; k++) {
        const a = (k / 5) * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 58, Math.sin(a) * 58);
        ctx.lineTo(Math.cos(a) * 116, Math.sin(a) * 116);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. Top Header Engraving Rule + Title Cartouche
    ctx.strokeStyle = brightTone;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(190, 214);
    ctx.lineTo(834, 214);
    ctx.moveTo(220, 386);
    ctx.lineTo(804, 386);
    ctx.stroke();

    ctx.textAlign = 'center';
    if (role === 'color') {
      ctx.fillStyle = 'rgba(10, 4, 2, 0.72)';
      ctx.font = '700 84px Georgia, serif';
      ctx.fillText('PALIMPSEST', 515, 294);
    }
    ctx.fillStyle = brightTone;
    ctx.font = '700 84px Georgia, serif';
    ctx.fillText('PALIMPSEST', 512, 290);

    ctx.fillStyle = strokeTone;
    ctx.font = '600 28px Georgia, serif';
    ctx.fillText('THE IMPOSSIBLE LIVING ATLAS', 512, 348);

    // 4. Central Engraved Meridian Astrolabe & Compass Rose (cy = 700)
    ctx.save();
    ctx.translate(512, 700);
    ctx.strokeStyle = strokeTone;
    for (const [r, lw] of [
      [284, 5],
      [256, 2.5],
      [226, 3.5],
      [172, 2.2],
      [112, 3],
      [58, 2.5],
    ] as const) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Graduated 72 meridian degree ticks
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const major = i % 6 === 0;
      const rIn = major ? 226 : 240;
      ctx.lineWidth = major ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
      ctx.lineTo(Math.cos(a) * 256, Math.sin(a) * 256);
      ctx.stroke();
    }

    // Interlocking celestial orbital rings
    ctx.strokeStyle = brightTone;
    ctx.lineWidth = 2.8;
    for (const rot of [-0.52, 0.52]) {
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 266, 98, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 16-ray compass rose needles
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const isCardinal = i % 4 === 0;
      const rOut = isCardinal ? 224 : i % 2 === 0 ? 172 : 128;
      ctx.lineWidth = isCardinal ? 3.8 : 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 58, Math.sin(a) * 58);
      ctx.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
      ctx.stroke();
    }

    // Cardinal runes & Ten Realms Roman ring
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    ctx.fillStyle = brightTone;
    ctx.font = '600 20px Georgia, serif';
    numerals.forEach((num, idx) => {
      const a = (idx / numerals.length) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.translate(Math.cos(a) * 200, Math.sin(a) * 200);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(num, 0, 7);
      ctx.restore();
    });
    ctx.restore();

    // 5. Lower Illuminated Colophon Banner
    ctx.strokeStyle = strokeTone;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(210, 1068);
    ctx.lineTo(814, 1068);
    ctx.moveTo(270, 1218);
    ctx.lineTo(754, 1218);
    ctx.stroke();

    ctx.fillStyle = brightTone;
    ctx.font = '600 27px Georgia, serif';
    ctx.fillText('FOLIO OF THE UNBOUND MERIDIAN', 512, 1126);
    ctx.fillStyle = strokeTone;
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('Ten Folded Worlds · Bound by Master Aldous', 512, 1178);
  });

  const coverFrontColor = finalizeColorTexture(covC, aniso);
  const coverFrontBump = finalizeDataTexture(covB, aniso);
  const coverFrontMetalness = finalizeDataTexture(covM, aniso);
  const coverFrontRoughness = finalizeDataTexture(covR, aniso);

  // 4. Stacked Gilt Page Edges
  const [edgeC, eCtx] = createCanvas(256, 256);
  eCtx.fillStyle = '#DFD1B4';
  eCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const tone = 205 + Math.round(Math.sin(y * 0.7) * 18 + Math.random() * 14);
    eCtx.fillStyle = `rgb(${tone}, ${Math.round(tone * 0.92)}, ${Math.round(tone * 0.76)})`;
    eCtx.fillRect(0, y, 256, 1.5);
  }
  const pageEdgeColor = finalizeColorTexture(edgeC, aniso, 2, 1);

  // 5. Fine Cotton Paper Grain Bump
  const [pgC, pgCtx] = createCanvas(512, 512);
  pgCtx.fillStyle = '#808080';
  pgCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = 110 + Math.floor(Math.random() * 44);
    pgCtx.fillStyle = `rgb(${v},${v},${v})`;
    pgCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 1);
  }
  const paperGrainBump = finalizeDataTexture(pgC, aniso, 3, 2);

  // 6. Soft Radial Contact Shadow
  const [csC, csCtx] = createCanvas(256, 256);
  const csGrad = csCtx.createRadialGradient(128, 128, 12, 128, 128, 126);
  csGrad.addColorStop(0, 'rgba(8, 5, 3, 0.85)');
  csGrad.addColorStop(0.5, 'rgba(8, 5, 3, 0.38)');
  csGrad.addColorStop(1, 'rgba(8, 5, 3, 0)');
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 256, 256);
  const contactShadow = finalizeColorTexture(csC, aniso);

  // 7. 10 Unique World Parchment Maps + Secret Ink Layers
  const worldParchment: THREE.CanvasTexture[] = [];
  const worldSecretInk: THREE.CanvasTexture[] = [];
  for (let i = 0; i < TOTAL_WORLDS; i++) {
    const wId = i as WorldId;
    worldParchment.push(buildWorldParchment(wId, aniso));
    worldSecretInk.push(buildWorldSecretInk(wId, aniso));
  }

  allTextures.push(
    walnutColor,
    walnutBump,
    leatherColor,
    leatherBump,
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
    walnutColor,
    walnutBump,
    leatherColor,
    leatherBump,
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

const WORLD_PALETTES: Record<
  WorldId,
  { inner: string; mid: string; edge: string; wash: string; line: string; text: string }
> = {
  0: { inner: '#F3EBD8', mid: '#E7DABF', edge: '#D3C09E', wash: 'rgba(104, 148, 86, 0.28)', line: 'rgba(86, 70, 44, 0.24)', text: 'rgba(66, 44, 24, 0.78)' },
  1: { inner: '#EFE9DB', mid: '#DFE0D2', edge: '#C6C0AE', wash: 'rgba(62, 114, 142, 0.24)', line: 'rgba(54, 92, 114, 0.24)', text: 'rgba(42, 58, 72, 0.8)' },
  2: { inner: '#F5E7CC', mid: '#E9D3AD', edge: '#D1B384', wash: 'rgba(196, 140, 62, 0.26)', line: 'rgba(145, 102, 46, 0.28)', text: 'rgba(88, 56, 24, 0.82)' },
  3: { inner: '#EFF4F8', mid: '#DCE6EE', edge: '#BCCAD8', wash: 'rgba(116, 168, 206, 0.26)', line: 'rgba(72, 106, 134, 0.26)', text: 'rgba(44, 68, 92, 0.82)' },
  4: { inner: '#DCEAE7', mid: '#C1D8D6', edge: '#9BB8BA', wash: 'rgba(46, 134, 132, 0.28)', line: 'rgba(38, 92, 96, 0.28)', text: 'rgba(26, 62, 68, 0.84)' },
  5: { inner: '#E9DDD2', mid: '#D4BFAF', edge: '#B49582', wash: 'rgba(198, 88, 46, 0.26)', line: 'rgba(122, 54, 34, 0.28)', text: 'rgba(74, 32, 22, 0.85)' },
  6: { inner: '#F4F0E6', mid: '#E3DEC9', edge: '#C7BEA5', wash: 'rgba(182, 152, 88, 0.22)', line: 'rgba(104, 88, 62, 0.25)', text: 'rgba(66, 54, 36, 0.8)' },
  7: { inner: '#DFD6E8', mid: '#C5B8D4', edge: '#A392B8', wash: 'rgba(106, 78, 156, 0.26)', line: 'rgba(74, 52, 112, 0.28)', text: 'rgba(48, 30, 74, 0.84)' },
  8: { inner: '#F0ECF4', mid: '#DFD8EA', edge: '#C3B7D4', wash: 'rgba(146, 128, 198, 0.24)', line: 'rgba(98, 86, 140, 0.26)', text: 'rgba(58, 48, 86, 0.82)' },
  9: { inner: '#F4E9CF', mid: '#E5CFA2', edge: '#C9AA70', wash: 'rgba(212, 175, 110, 0.30)', line: 'rgba(136, 98, 38, 0.32)', text: 'rgba(78, 52, 18, 0.88)' },
};

function buildWorldParchment(worldId: WorldId, anisotropy: number): THREE.CanvasTexture {
  const W = 1024;
  const H = 682;
  const [canvas, ctx] = createCanvas(W, H);
  const pal = WORLD_PALETTES[worldId];

  const baseGrad = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 620);
  baseGrad.addColorStop(0, pal.inner);
  baseGrad.addColorStop(0.74, pal.mid);
  baseGrad.addColorStop(1, pal.edge);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(120, 88, 48, 0.04)' : 'rgba(255, 252, 244, 0.05)';
    ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 6, 1.5);
  }

  // Spine fold shadow
  const spineGrad = ctx.createLinearGradient(W / 2 - 22, 0, W / 2 + 22, 0);
  spineGrad.addColorStop(0, 'rgba(42, 26, 12, 0)');
  spineGrad.addColorStop(0.5, 'rgba(32, 20, 10, 0.36)');
  spineGrad.addColorStop(1, 'rgba(42, 26, 12, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(W / 2 - 22, 0, 44, H);

  // Gilt page borders
  const drawFrame = (ox: number, w: number) => {
    ctx.strokeStyle = '#B8924E';
    ctx.lineWidth = 3;
    ctx.strokeRect(ox + 18, 18, w - 36, H - 36);
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(ox + 26, 26, w - 52, H - 52);
  };
  drawFrame(0, W / 2 - 6);
  drawFrame(W / 2 + 6, W / 2 - 6);

  // World-specific watercolor wash & cartographic geometry
  const washGrad = ctx.createRadialGradient(W * 0.35, H * 0.5, 20, W * 0.35, H * 0.5, 320);
  washGrad.addColorStop(0, pal.wash);
  washGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = washGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = pal.line;
  ctx.lineWidth = 1.2;

  if (worldId % 3 === 0) {
    // Topographic contours & compass rings
    for (let r = 42; r <= 200; r += 32) {
      ctx.beginPath();
      ctx.ellipse(W * 0.28, H * 0.42, r * 1.25, r * 0.85, 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(W * 0.72, H * 0.58, r * 1.1, r * 0.75, -0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (worldId % 3 === 1) {
    // Maritime rhumb lines & concentric survey rings
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.68, H * 0.54);
      ctx.lineTo(W * 0.68 + Math.cos(a) * 600, H * 0.54 + Math.sin(a) * 600);
      ctx.stroke();
    }
    for (const r of [60, 120, 190, 260]) {
      ctx.beginPath();
      ctx.arc(W * 0.68, H * 0.54, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Celestial meridian circles & mandala axes
    for (const r of [80, 150, 225, 300]) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(40, H / 2);
    ctx.lineTo(W - 40, H / 2);
    ctx.stroke();
  }

  // Folio title & chapter engraving
  const meta = WORLD_METADATA[worldId];
  ctx.fillStyle = pal.text;
  ctx.font = '600 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`FOLIO ${meta.roman} · ${meta.title.toUpperCase()}`, 38, 48);
  ctx.font = 'italic 13px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(meta.chapterTitle, W - 38, 48);

  return finalizeColorTexture(canvas, anisotropy);
}

function buildWorldSecretInk(worldId: WorldId, anisotropy: number): THREE.CanvasTexture {
  const W = 1024;
  const H = 682;
  const [canvas, ctx] = createCanvas(W, H);
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(246, 212, 124, 0.94)';
  ctx.fillStyle = 'rgba(246, 212, 124, 0.94)';
  ctx.lineWidth = 2;

  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let x = 64; x < W - 40; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, H - 40);
    ctx.stroke();
  }
  for (let y = 64; y < H - 40; y += 64) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();
  }
  ctx.restore();

  const meta = WORLD_METADATA[worldId];
  const spots = [
    { px: 280, py: 460, label: `SHARD ${meta.roman}-A` },
    { px: 740, py: 245, label: `CIPHER ${meta.roman}-B` },
  ];

  spots.forEach(({ px, py, label }) => {
    ctx.save();
    ctx.translate(px, py);
    for (const r of [18, 38, 60]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a) * 68, Math.sin(a) * 68);
      ctx.stroke();
    }
    ctx.font = 'italic 600 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 86);
    ctx.restore();
  });

  return finalizeColorTexture(canvas, anisotropy);
}
