import * as THREE from 'three';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function finalizeTex(c: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeatX !== 1 || repeatY !== 1) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
  }
  t.needsUpdate = true;
  return t;
}

export interface SharedPapercraftTextures {
  barcodeStrip: THREE.CanvasTexture;
  motherSurface: THREE.CanvasTexture;
  glyphRibbon: THREE.CanvasTexture;
  alchemyGlass: THREE.CanvasTexture;
  prismRainbow: THREE.CanvasTexture;
  matrixTile: THREE.CanvasTexture;
  vellumAstrolabe: THREE.CanvasTexture;
  vellumTactical: THREE.CanvasTexture;
}

let cachedSharedTex: SharedPapercraftTextures | null = null;

export function getSharedPapercraftTextures(): SharedPapercraftTextures {
  if (cachedSharedTex) return cachedSharedTex;

  // 1. Starsilk / Egg / Fault-Tongue Azure Barcode Block Texture
  const [bcC, bc] = makeCanvas(512, 128);
  bc.fillStyle = '#0D131D';
  bc.fillRect(0, 0, 512, 128);
  const blockPattern = [18, 8, 28, 6, 12, 22, 6, 14, 34, 8, 10, 20, 6, 16, 26, 8];
  let bx = 0;
  let bi = 0;
  while (bx < 512) {
    const w = blockPattern[bi % blockPattern.length];
    if (bi % 2 === 0) {
      bc.fillStyle = '#50E4FF';
      bc.fillRect(bx, 10, w, 108);
      bc.fillStyle = '#9BF4FF';
      bc.fillRect(bx, 48, w, 32);
    } else {
      bc.fillStyle = '#122234';
      bc.fillRect(bx, 18, w, 92);
    }
    bx += w + 3;
    bi++;
  }
  bc.strokeStyle = '#38B8D8';
  bc.lineWidth = 4;
  bc.strokeRect(2, 6, 508, 116);
  const barcodeStrip = finalizeTex(bcC, 2, 1);

  // 2. Mother Living Homeworld Continent + Concentric Macro Hubs (P00 / Plate 060)
  const [mC, mc] = makeCanvas(1024, 512);
  mc.fillStyle = '#3D3554';
  mc.fillRect(0, 0, 1024, 512);
  // Tectonic lavender continent plates
  const plateColors = ['#5B4E7D', '#756699', '#4A3F68', '#8374A8'];
  for (let i = 0; i < 42; i++) {
    mc.fillStyle = plateColors[i % plateColors.length];
    const px = ((i * 197) % 1024);
    const py = 50 + ((i * 131) % 412);
    mc.beginPath();
    mc.moveTo(px - 60, py - 24);
    mc.lineTo(px + 20, py - 48);
    mc.lineTo(px + 72, py + 8);
    mc.lineTo(px + 12, py + 44);
    mc.lineTo(px - 54, py + 22);
    mc.closePath();
    mc.fill();
    mc.strokeStyle = 'rgba(26, 20, 40, 0.55)';
    mc.lineWidth = 3;
    mc.stroke();
  }
  // Glowing branching cyan tectonic fissure veins + 5 concentric macro-hubs
  const hubs = [
    [220, 230, 56],
    [512, 260, 74],
    [790, 210, 58],
    [360, 125, 42],
    [660, 385, 44],
  ];
  mc.strokeStyle = '#42E0FF';
  mc.lineWidth = 4;
  for (let i = 0; i < hubs.length; i++) {
    const [hx, hy] = hubs[i];
    const [nx, ny] = hubs[(i + 1) % hubs.length];
    mc.beginPath();
    mc.moveTo(hx, hy);
    mc.quadraticCurveTo((hx + nx) * 0.5, hy - 35, nx, ny);
    mc.stroke();
  }
  hubs.forEach(([hx, hy, hr]) => {
    mc.fillStyle = '#1E2C42';
    mc.beginPath();
    mc.arc(hx, hy, hr, 0, Math.PI * 2);
    mc.fill();
    for (const frac of [1.0, 0.72, 0.45, 0.2]) {
      mc.strokeStyle = frac === 0.2 ? '#B2F7FF' : '#4CE3FF';
      mc.lineWidth = frac === 0.72 ? 6 : 3.5;
      mc.beginPath();
      mc.arc(hx, hy, hr * frac, 0, Math.PI * 2);
      mc.stroke();
    }
    mc.fillStyle = '#9BF6FF';
    mc.beginPath();
    mc.arc(hx, hy, hr * 0.16, 0, Math.PI * 2);
    mc.fill();
  });
  const motherSurface = finalizeTex(mC);

  // 3. Lexiclast Royal-Blue Script Glyph Ribbon (Plate 045 / P10 / P13)
  const [glC, gl] = makeCanvas(512, 128);
  const gr = gl.createLinearGradient(0, 0, 512, 0);
  gr.addColorStop(0, '#1C4894');
  gr.addColorStop(0.5, '#2F72C8');
  gr.addColorStop(1, '#1C4894');
  gl.fillStyle = gr;
  gl.fillRect(0, 0, 512, 128);
  gl.strokeStyle = '#89D8FF';
  gl.lineWidth = 4;
  gl.strokeRect(0, 10, 512, 108);
  gl.fillStyle = '#B7EAFF';
  gl.strokeStyle = '#B7EAFF';
  gl.lineWidth = 5;
  for (let gx = 28; gx < 490; gx += 58) {
    gl.beginPath();
    gl.arc(gx + 16, 64, 18, 0.4, Math.PI * 1.6);
    gl.moveTo(gx + 8, 42);
    gl.lineTo(gx + 34, 86);
    gl.moveTo(gx + 26, 40);
    gl.lineTo(gx + 36, 40);
    gl.stroke();
    gl.fillRect(gx + 38, 48, 6, 32);
  }
  const glyphRibbon = finalizeTex(glC, 2, 1);

  // 4. Brinechoir Translucent Sea-Glass Alchemy Circle Texture (Plate 023 / U01)
  const [alC, al] = makeCanvas(512, 512);
  al.fillStyle = '#73BFB8';
  al.fillRect(0, 0, 512, 512);
  al.strokeStyle = 'rgba(235, 255, 252, 0.86)';
  al.lineWidth = 4;
  for (const [ax, ay, ar] of [
    [130, 150, 62],
    [350, 175, 76],
    [220, 355, 68],
    [400, 385, 50],
  ]) {
    al.beginPath();
    al.arc(ax, ay, ar, 0, Math.PI * 2);
    al.stroke();
    al.beginPath();
    al.arc(ax, ay, ar * 0.62, 0, Math.PI * 2);
    al.stroke();
    al.beginPath();
    al.moveTo(ax, ay - ar);
    al.lineTo(ax + ar * 0.86, ay + ar * 0.5);
    al.lineTo(ax - ar * 0.86, ay + ar * 0.5);
    al.closePath();
    al.stroke();
  }
  const alchemyGlass = finalizeTex(alC);

  // 5. Solnexus Prismatic Stained-Glass Crystal Texture (Plate 030 / P12)
  const [prC, pr] = makeCanvas(512, 512);
  const shardColors = ['#F2B84B', '#E5748A', '#7A6AD9', '#4CD4EE', '#F7E07B', '#B896EB'];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      pr.fillStyle = shardColors[(x * 3 + y * 5) % shardColors.length];
      pr.beginPath();
      pr.moveTo(x * 64, y * 64);
      pr.lineTo((x + 1) * 64, y * 64);
      pr.lineTo(x * 64 + 32, (y + 1) * 64);
      pr.closePath();
      pr.fill();
      pr.fillStyle = shardColors[(x * 5 + y * 2 + 1) % shardColors.length];
      pr.beginPath();
      pr.moveTo((x + 1) * 64, y * 64);
      pr.lineTo((x + 1) * 64, (y + 1) * 64);
      pr.lineTo(x * 64 + 32, (y + 1) * 64);
      pr.closePath();
      pr.fill();
    }
  }
  pr.strokeStyle = '#382C1E';
  pr.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    pr.beginPath();
    pr.moveTo(i, 0);
    pr.lineTo(i, 512);
    pr.moveTo(0, i);
    pr.lineTo(512, i);
    pr.stroke();
  }
  const prismRainbow = finalizeTex(prC);

  // 6. Singulararch Matrix Glyph Tile Texture (Plate 036 / P10)
  const [mxC, mx] = makeCanvas(256, 256);
  mx.fillStyle = '#D9DEE6';
  mx.fillRect(0, 0, 256, 256);
  mx.fillStyle = '#1B2432';
  mx.fillRect(14, 14, 228, 228);
  mx.strokeStyle = '#48DCFF';
  mx.lineWidth = 4;
  mx.strokeRect(26, 26, 204, 204);
  mx.fillStyle = '#48DCFF';
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 5; col++) {
      if ((r + col * 2) % 3 !== 0) {
        mx.fillRect(44 + col * 36, 44 + r * 36, 22, 22);
      }
    }
  }
  const matrixTile = finalizeTex(mxC);

  // 7. F01 Translucent Vellum Recursive Astrolabe Overlay
  const [vaC, va] = makeCanvas(1024, 640);
  va.fillStyle = 'rgba(247, 240, 222, 0.52)';
  va.fillRect(0, 0, 1024, 640);
  va.strokeStyle = 'rgba(34, 42, 52, 0.85)';
  va.lineWidth = 5;
  va.strokeRect(18, 18, 988, 604);
  va.strokeStyle = 'rgba(180, 138, 64, 0.82)';
  va.lineWidth = 3;
  for (const r of [88, 162, 238]) {
    va.beginPath();
    va.arc(512, 320, r, 0, Math.PI * 2);
    va.stroke();
  }
  va.strokeStyle = 'rgba(42, 168, 204, 0.85)';
  va.lineWidth = 2.5;
  va.beginPath();
  va.moveTo(512, 52);
  va.lineTo(754, 460);
  va.lineTo(270, 460);
  va.closePath();
  va.stroke();
  va.fillStyle = 'rgba(28, 34, 42, 0.9)';
  va.font = '700 26px "Courier New", monospace';
  va.textAlign = 'center';
  va.fillText('RECURSIVE ARCHITECTURE · INITIALIZATION SCHEMA', 512, 58);
  const vellumAstrolabe = finalizeTex(vaC);

  // 8. F07 Translucent Tactical Ruby Eclipse Star-Chart Vellum Overlay
  const [vtC, vt] = makeCanvas(1024, 640);
  vt.fillStyle = 'rgba(244, 236, 218, 0.44)';
  vt.fillRect(0, 0, 1024, 640);
  vt.strokeStyle = 'rgba(148, 36, 30, 0.88)';
  vt.lineWidth = 5;
  vt.strokeRect(16, 16, 992, 608);
  vt.setLineDash([14, 10]);
  vt.beginPath();
  vt.ellipse(512, 320, 340, 210, -0.18, 0, Math.PI * 2);
  vt.stroke();
  vt.setLineDash([]);
  vt.strokeStyle = 'rgba(32, 38, 46, 0.72)';
  vt.lineWidth = 2;
  for (let gx = 128; gx < 1024; gx += 128) {
    vt.beginPath();
    vt.moveTo(gx, 32);
    vt.lineTo(gx, 608);
    vt.stroke();
  }
  vt.fillStyle = 'rgba(130, 28, 24, 0.92)';
  vt.font = '700 28px "Courier New", monospace';
  vt.textAlign = 'center';
  vt.fillText('PHAROS NEBULA · SIEGE VECTOR OVERLAY (NOT TO SCALE)', 512, 62);
  const vellumTactical = finalizeTex(vtC);

  cachedSharedTex = {
    barcodeStrip,
    motherSurface,
    glyphRibbon,
    alchemyGlass,
    prismRainbow,
    matrixTile,
    vellumAstrolabe,
    vellumTactical,
  };
  return cachedSharedTex;
}

/**
 * Generates an illustrated die-cut cardstock pop-up backdrop texture matching the reference style
 * (layered paper clouds, stars, celestial crescents, nebulae, or landscapes on textured heavy paper).
 */
export function buildIllustratedSkyTexture(opts: {
  topHex: string;
  bottomHex: string;
  cloudHex: string;
  accentHex: string;
  motif: 'stars' | 'nebula' | 'storm' | 'sun' | 'citadel' | 'ash' | 'daylight';
}): THREE.CanvasTexture {
  const W = 1024;
  const H = 384;
  const [c, ctx] = makeCanvas(W, H);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, opts.topHex);
  g.addColorStop(1, opts.bottomHex);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Subtle paper fibers
  for (let i = 0; i < 650; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect((i * 73) % W, (i * 41) % H, 6, 1.5);
  }

  // Painted geometric nebula / wave clouds
  ctx.fillStyle = opts.cloudHex;
  for (let layer = 0; layer < 2; layer++) {
    ctx.globalAlpha = layer === 0 ? 0.32 : 0.48;
    ctx.beginPath();
    const baseY = H - 35 - layer * 55;
    ctx.moveTo(0, H);
    ctx.lineTo(0, baseY);
    for (let x = 0; x <= W; x += 64) {
      const wave = Math.sin(x * 0.012 + layer * 1.6) * 28 + Math.cos(x * 0.028) * 14;
      ctx.lineTo(x, baseY - Math.abs(wave));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (opts.motif === 'stars' || opts.motif === 'nebula') {
    // Crisp cream 4-point paper stars
    ctx.fillStyle = '#F6E8BE';
    for (let s = 0; s < 28; s++) {
      const sx = 42 + ((s * 179) % (W - 84));
      const sy = 28 + ((s * 97) % (H - 130));
      const sr = s % 5 === 0 ? 11 : 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy - sr);
      ctx.lineTo(sx + sr * 0.28, sy - sr * 0.28);
      ctx.lineTo(sx + sr, sy);
      ctx.lineTo(sx + sr * 0.28, sy + sr * 0.28);
      ctx.lineTo(sx, sy + sr);
      ctx.lineTo(sx - sr * 0.28, sy + sr * 0.28);
      ctx.lineTo(sx - sr, sy);
      ctx.lineTo(sx - sr * 0.28, sy - sr * 0.28);
      ctx.closePath();
      ctx.fill();
    }
    if (opts.motif === 'nebula') {
      ctx.strokeStyle = opts.accentHex;
      ctx.globalAlpha = 0.52;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(210, 160, 82, 0.2, Math.PI * 1.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(810, 150, 74, -0.6, Math.PI * 0.9);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  } else if (opts.motif === 'storm') {
    ctx.strokeStyle = opts.accentHex;
    ctx.lineWidth = 4;
    for (const bx of [190, 480, 790]) {
      ctx.beginPath();
      ctx.moveTo(bx, 24);
      ctx.lineTo(bx - 18, 95);
      ctx.lineTo(bx + 12, 130);
      ctx.lineTo(bx - 12, 220);
      ctx.stroke();
    }
  } else if (opts.motif === 'sun') {
    ctx.fillStyle = opts.accentHex;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.58, 128, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (opts.motif === 'citadel') {
    ctx.fillStyle = 'rgba(18, 22, 28, 0.72)';
    for (let tx = 40; tx < W - 40; tx += 52) {
      const th = 50 + ((tx * 37) % 110);
      ctx.fillRect(tx, H - th, 34, th);
    }
  }

  return finalizeTex(c);
}

/**
 * Builds a clean thin extruded cardstock polygon with crisp flat-shaded faceted paper bevels.
 */
export function buildCutCardShape(
  pts: [number, number][],
  depth: number,
  mat: THREE.Material,
  centerZ = true,
): THREE.Mesh {
  const shape = new THREE.Shape();
  pts.forEach(([x, y], idx) => {
    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
  });
  if (centerZ) {
    geo.translate(0, 0, -depth / 2);
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Builds a sculpted tapered origami tube along a 3D CatmullRom path (used for tails, ribbons, horns, crooks, wyrms).
 */
export function buildTaperedCurve(
  points: THREE.Vector3[],
  rStart: number,
  rEnd: number,
  tubularSegments: number,
  radialSegments: number,
  mat: THREE.Material,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, tubularSegments, 1, radialSegments, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const ringVerts = radialSegments + 1;
  for (let s = 0; s <= tubularSegments; s++) {
    const t = s / tubularSegments;
    const center = curve.getPointAt(t);
    const radius = THREE.MathUtils.lerp(rStart, rEnd, t);
    for (let r = 0; r < ringVerts; r++) {
      const idx = s * ringVerts + r;
      const vx = pos.getX(idx) - center.x;
      const vy = pos.getY(idx) - center.y;
      const vz = pos.getZ(idx) - center.z;
      pos.setXYZ(idx, center.x + vx * radius, center.y + vy * radius, center.z + vz * radius);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
