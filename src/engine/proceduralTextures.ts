import * as THREE from 'three';
import { WorldId } from '../types/atlas';

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
  pageEdgeColor: THREE.CanvasTexture;
  paperGrainBump: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  worldParchment: [THREE.CanvasTexture, THREE.CanvasTexture, THREE.CanvasTexture];
  worldSecretInk: [THREE.CanvasTexture, THREE.CanvasTexture, THREE.CanvasTexture];
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
  // Plank seams
  for (let p = 1; p < 4; p++) {
    const py = p * 128;
    wCtx.fillStyle = 'rgba(12, 7, 4, 0.75)';
    wCtx.fillRect(0, py - 1, 512, 3);
    wbCtx.fillStyle = '#202020';
    wbCtx.fillRect(0, py - 1, 512, 3);
  }
  // Subtle organic grain streaks
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

  // 3. Embossed Gold-Leaf Front Cover
  const [covC, cCtx] = createCanvas(1024, 1400);
  const [covB, cbCtx] = createCanvas(1024, 1400);
  cCtx.drawImage(leathC, 0, 0, 1024, 1400);
  cbCtx.drawImage(leathB, 0, 0, 1024, 1400);

  // Subtle dark burnished vignette
  const covGrad = cCtx.createRadialGradient(512, 700, 180, 512, 700, 760);
  covGrad.addColorStop(0, 'rgba(72, 39, 27, 0.25)');
  covGrad.addColorStop(1, 'rgba(18, 8, 5, 0.65)');
  cCtx.fillStyle = covGrad;
  cCtx.fillRect(0, 0, 1024, 1400);

  const drawGoldStroke = (fn: (ctx: CanvasRenderingContext2D, isBump: boolean) => void) => {
    fn(cCtx, false);
    fn(cbCtx, true);
  };

  drawGoldStroke((ctx, isBump) => {
    ctx.strokeStyle = isBump ? '#EAEAEA' : '#D4AF6E';
    ctx.lineWidth = 10;
    ctx.strokeRect(64, 64, 896, 1272);
    ctx.lineWidth = 3;
    ctx.strokeRect(88, 88, 848, 1224);
    ctx.strokeRect(106, 106, 812, 1188);

    // Corner filigree arcs
    const corners = [
      [106, 106, 0],
      [918, 106, Math.PI / 2],
      [918, 1294, Math.PI],
      [106, 1294, -Math.PI / 2],
    ];
    corners.forEach(([cx, cy, ang]) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI / 2);
      ctx.stroke();
      ctx.restore();
    });

    // Central Astrolabe & Compass Rose
    ctx.save();
    ctx.translate(512, 660);
    ctx.lineWidth = 4;
    for (const r of [250, 224, 168, 92]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 16 compass rays
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rIn = i % 2 === 0 ? 36 : 92;
      const rOut = i % 2 === 0 ? 224 : 168;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
      ctx.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
      ctx.stroke();
    }
    // Tilted orbital ellipses
    for (const rot of [-0.45, 0.45]) {
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 238, 86, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Cover Title & Subtitle
    ctx.fillStyle = isBump ? '#F4F4F4' : '#E2C285';
    ctx.textAlign = 'center';
    ctx.font = '700 84px Georgia, serif';
    ctx.fillText('PALIMPSEST', 512, 260);
    ctx.font = '600 32px Georgia, serif';
    ctx.fillText('THE IMPOSSIBLE LIVING ATLAS', 512, 318);
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText('Tome I · Three Folded Realms', 512, 1140);
  });

  const coverFrontColor = finalizeColorTexture(covC, aniso);
  const coverFrontBump = finalizeDataTexture(covB, aniso);

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

  // 7. World Parchment Maps + Secret UV-revealed Ink Layers
  const worldParchment: [THREE.CanvasTexture, THREE.CanvasTexture, THREE.CanvasTexture] = [
    buildWorldParchment(0, aniso),
    buildWorldParchment(1, aniso),
    buildWorldParchment(2, aniso),
  ];

  const worldSecretInk: [THREE.CanvasTexture, THREE.CanvasTexture, THREE.CanvasTexture] = [
    buildWorldSecretInk(0, aniso),
    buildWorldSecretInk(1, aniso),
    buildWorldSecretInk(2, aniso),
  ];

  allTextures.push(
    walnutColor,
    walnutBump,
    leatherColor,
    leatherBump,
    coverFrontColor,
    coverFrontBump,
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

function buildWorldParchment(worldId: WorldId, anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1536, 1024);

  // Warm aged ivory parchment base
  const baseGrad = ctx.createRadialGradient(768, 512, 120, 768, 512, 920);
  if (worldId === 0) {
    baseGrad.addColorStop(0, '#F3EBD8');
    baseGrad.addColorStop(0.75, '#E7DABF');
    baseGrad.addColorStop(1, '#D3C09E');
  } else if (worldId === 1) {
    baseGrad.addColorStop(0, '#EFE9DB');
    baseGrad.addColorStop(0.75, '#DFE0D2');
    baseGrad.addColorStop(1, '#C6C0AE');
  } else {
    baseGrad.addColorStop(0, '#F5E7CC');
    baseGrad.addColorStop(0.75, '#E9D3AD');
    baseGrad.addColorStop(1, '#D1B384');
  }
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1536, 1024);

  // Paper fiber mottling
  for (let i = 0; i < 4500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(130, 96, 54, 0.045)' : 'rgba(255, 250, 238, 0.06)';
    ctx.fillRect(Math.random() * 1536, Math.random() * 1024, 3 + Math.random() * 8, 2);
  }

  // Spine crease shadow down the middle
  const spineGrad = ctx.createLinearGradient(738, 0, 798, 0);
  spineGrad.addColorStop(0, 'rgba(62, 40, 20, 0)');
  spineGrad.addColorStop(0.5, 'rgba(42, 26, 12, 0.34)');
  spineGrad.addColorStop(1, 'rgba(62, 40, 20, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(738, 0, 60, 1024);

  // Metallic gold-leaf & ink borders around both pages
  const drawPageFrame = (ox: number, w: number) => {
    ctx.strokeStyle = '#B8924E';
    ctx.lineWidth = 4;
    ctx.strokeRect(ox + 26, 26, w - 52, 972);
    ctx.strokeStyle = 'rgba(72, 48, 28, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox + 38, 38, w - 76, 948);
  };
  drawPageFrame(0, 758);
  drawPageFrame(778, 758);

  // World-specific watercolor & ink cartography
  if (worldId === 0) {
    // Verdant Kingdom: soft moss & meadow washes + contour lines + village roads
    const meadow = ctx.createRadialGradient(540, 520, 40, 540, 520, 420);
    meadow.addColorStop(0, 'rgba(122, 158, 92, 0.35)');
    meadow.addColorStop(1, 'rgba(122, 158, 92, 0)');
    ctx.fillStyle = meadow;
    ctx.fillRect(0, 0, 1536, 1024);

    const grove = ctx.createRadialGradient(1080, 420, 30, 1080, 420, 360);
    grove.addColorStop(0, 'rgba(92, 134, 78, 0.32)');
    grove.addColorStop(1, 'rgba(92, 134, 78, 0)');
    ctx.fillStyle = grove;
    ctx.fillRect(0, 0, 1536, 1024);

    // Topographic ink contour loops
    ctx.strokeStyle = 'rgba(90, 72, 48, 0.22)';
    ctx.lineWidth = 1.4;
    for (let r = 60; r <= 260; r += 38) {
      ctx.beginPath();
      ctx.ellipse(380, 350, r * 1.25, r * 0.85, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (worldId === 1) {
    // Forgotten Harbor: maritime rhumb lines & bathymetry rings
    ctx.strokeStyle = 'rgba(54, 92, 114, 0.22)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(1060, 620);
      ctx.lineTo(1060 + Math.cos(a) * 900, 620 + Math.sin(a) * 900);
      ctx.stroke();
    }
    for (const r of [90, 160, 240, 340]) {
      ctx.beginPath();
      ctx.arc(1060, 620, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Celestial Desert: astronomical meridian circles & dune contour hatching
    ctx.strokeStyle = 'rgba(145, 102, 46, 0.28)';
    ctx.lineWidth = 1.5;
    for (const r of [120, 210, 310, 420]) {
      ctx.beginPath();
      ctx.arc(768, 512, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(60, 512);
    ctx.lineTo(1476, 512);
    ctx.stroke();
  }

  // Subtle corner folio calligraphy
  ctx.fillStyle = 'rgba(66, 44, 24, 0.72)';
  ctx.font = '600 22px Georgia, serif';
  ctx.textAlign = 'left';
  const titles = [
    'FOLIO I · THE VERDANT KINGDOM',
    'FOLIO II · THE FORGOTTEN HARBOR',
    'FOLIO III · THE CELESTIAL DESERT',
  ];
  ctx.fillText(titles[worldId], 56, 72);

  return finalizeColorTexture(canvas, anisotropy);
}

function buildWorldSecretInk(worldId: WorldId, anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1536, 1024);
  ctx.clearRect(0, 0, 1536, 1024);

  // Luminous golden-cyan alchemical ink only visible inside the Magical Magnifier shader
  ctx.strokeStyle = 'rgba(244, 206, 118, 0.92)';
  ctx.fillStyle = 'rgba(244, 206, 118, 0.92)';
  ctx.lineWidth = 2.5;

  // Fine astrological survey grid
  ctx.save();
  ctx.globalAlpha = 0.38;
  for (let x = 96; x < 1440; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, 964);
    ctx.stroke();
  }
  for (let y = 96; y < 960; y += 96) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(1476, y);
    ctx.stroke();
  }
  ctx.restore();

  // Secret coordinate rings & calligraphy notes at secret positions
  const spots =
    worldId === 0
      ? [
          { px: 430, py: 700, label: 'MYCELIUM NEXUS · VII' },
          { px: 1110, py: 380, label: 'MILLWRIGHT CIPHER · IV' },
        ]
      : worldId === 1
        ? [
            { px: 400, py: 350, label: 'FATHOM XIV · SUNKEN ASTROLABE' },
            { px: 1100, py: 690, label: 'SECRET COVE CHANNEL' },
          ]
        : [
            { px: 470, py: 340, label: 'ZENITH EQUATION · VII' },
            { px: 1120, py: 700, label: 'OASIS MIRAGE AQUEDUCT' },
          ];

  spots.forEach(({ px, py, label }) => {
    ctx.save();
    ctx.translate(px, py);
    for (const r of [24, 52, 84]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.lineTo(Math.cos(a) * 96, Math.sin(a) * 96);
      ctx.stroke();
    }
    ctx.font = 'italic 600 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 122);
    ctx.restore();
  });

  return finalizeColorTexture(canvas, anisotropy);
}
