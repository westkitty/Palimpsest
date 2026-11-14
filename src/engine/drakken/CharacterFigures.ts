import * as THREE from 'three';
import {
  buildCutCardShape,
  buildTaperedCurve,
  getSharedPapercraftTextures,
} from './papercraftArt';

function paperMat(
  color: number,
  paperBump: THREE.Texture,
  opts?: {
    emissive?: number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
    roughness?: number;
    metalness?: number;
    map?: THREE.Texture;
  },
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    map: opts?.map ?? null,
    bumpMap: paperBump,
    bumpScale: 0.008,
    roughness: opts?.roughness ?? 0.84,
    metalness: opts?.metalness ?? 0.05,
    flatShading: true,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    side: THREE.DoubleSide,
  });
}

/**
 * The Shard-god (character_source_sheets/1000190389.png):
 * Obsidian-black digitigrade jaguar-dragonoid predator with fangs, glowing cyan eyes,
 * branched cyan fissure veins, swept icy-cyan dorsal crystalline shards down skull/neck/shoulders/back,
 * and a single sweeping crested tail.
 */
export function buildShardGodFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const tex = getSharedPapercraftTextures();
  const obsidian = paperMat(0x161a22, paperBump, { roughness: 0.72, metalness: 0.14 });
  const darkPlate = paperMat(0x232934, paperBump, { roughness: 0.76, metalness: 0.12 });
  const cyanCrystal = paperMat(0x6aeaff, paperBump, {
    emissive: 0x1a98bc,
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });
  const veinMat = paperMat(0x4be0ff, paperBump, {
    map: tex.barcodeStrip,
    emissive: 0x1680a0,
    emissiveIntensity: 0.5,
    roughness: 0.35,
  });
  const fangMat = paperMat(0xf0eadb, paperBump, { roughness: 0.65 });

  // Sculpted predator torso profile (narrow waist -> broad ribbed chest)
  const torsoPts = [
    new THREE.Vector2(0.055, 0.0),
    new THREE.Vector2(0.088, 0.06),
    new THREE.Vector2(0.072, 0.14),
    new THREE.Vector2(0.135, 0.27),
    new THREE.Vector2(0.115, 0.34),
    new THREE.Vector2(0.04, 0.36),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 7), obsidian);
  torso.position.set(0, 0.27, -0.02);
  torso.rotation.x = 0.24;
  torso.scale.set(1.12, 1, 0.85);
  torso.castShadow = true;
  g.add(torso);

  // Cyan branched torso fissure markings
  const sternumVein = buildCutCardShape(
    [
      [0, -0.11],
      [0.014, -0.04],
      [0.052, 0.05],
      [0.036, 0.068],
      [0, 0.015],
      [-0.036, 0.068],
      [-0.052, 0.05],
      [-0.014, -0.04],
    ],
    0.02,
    veinMat,
  );
  sternumVein.position.set(0, 0.46, 0.115);
  sternumVein.rotation.x = 0.22;
  g.add(sternumVein);

  // Sculpted angular neck & feline-dragonoid skull with fangs and glowing cyan slit eyes
  const neck = buildTaperedCurve(
    [new THREE.Vector3(0, 0.56, 0.02), new THREE.Vector3(0, 0.65, 0.09)],
    0.075,
    0.058,
    4,
    6,
    darkPlate,
  );
  g.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.68, 0.12);
  const skull = buildCutCardShape(
    [
      [-0.072, -0.04],
      [-0.085, 0.04],
      [-0.04, 0.09],
      [0.04, 0.09],
      [0.085, 0.04],
      [0.072, -0.04],
    ],
    0.16,
    obsidian,
  );
  skull.rotation.x = Math.PI / 2 - 0.15;
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.15, 5), obsidian);
  snout.rotation.x = Math.PI / 2 + 0.18;
  snout.scale.set(1, 1, 0.65);
  snout.position.set(0, -0.015, 0.1);
  const lowerJaw = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.12, 4), darkPlate);
  lowerJaw.rotation.x = Math.PI / 2 + 0.48;
  lowerJaw.position.set(0, -0.055, 0.08);
  headGroup.add(skull, snout, lowerJaw);

  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.02), cyanCrystal);
    eye.position.set(sx * 0.042, 0.015, 0.1);
    eye.rotation.z = -sx * 0.3;
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.032, 3), fangMat);
    fang.rotation.x = Math.PI;
    fang.position.set(sx * 0.026, -0.032, 0.145);
    const earHorn = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.11, 4), obsidian);
    earHorn.position.set(sx * 0.056, 0.065, -0.02);
    earHorn.rotation.set(-0.7, 0, -sx * 0.35);
    headGroup.add(eye, fang, earHorn);
  }
  g.add(headGroup);

  // Arms & Digitigrade Hind Legs with claws
  for (const sx of [-1, 1]) {
    const armUpper = buildTaperedCurve(
      [
        new THREE.Vector3(sx * 0.125, 0.54, 0.02),
        new THREE.Vector3(sx * 0.175, 0.42, 0.06),
        new THREE.Vector3(sx * 0.145, 0.31, 0.14),
      ],
      0.044,
      0.03,
      6,
      5,
      obsidian,
    );
    g.add(armUpper);
    for (let c = -1; c <= 1; c++) {
      const talon = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.05, 3), cyanCrystal);
      talon.position.set(sx * 0.14 + c * 0.015, 0.28, 0.165);
      talon.rotation.x = Math.PI * 0.72;
      g.add(talon);
    }

    // Sweeping shoulder crystal cluster (fan of 3 shards)
    for (let k = 0; k < 3; k++) {
      const shShard = new THREE.Mesh(
        new THREE.ConeGeometry(0.028 - k * 0.005, 0.18 - k * 0.035, 4),
        cyanCrystal,
      );
      shShard.position.set(sx * (0.12 + k * 0.026), 0.58 - k * 0.02, -0.02 - k * 0.03);
      shShard.rotation.set(-0.55 - k * 0.15, 0, -sx * (0.52 + k * 0.22));
      g.add(shShard);
    }

    // Sculpted digitigrade leg: thigh -> angled hock -> clawed foot
    const leg = buildTaperedCurve(
      [
        new THREE.Vector3(sx * 0.08, 0.29, -0.02),
        new THREE.Vector3(sx * 0.095, 0.19, 0.06),
        new THREE.Vector3(sx * 0.088, 0.11, -0.045),
        new THREE.Vector3(sx * 0.085, 0.022, 0.03),
      ],
      0.056,
      0.032,
      8,
      5,
      obsidian,
    );
    const footPad = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.09, 4), darkPlate);
    footPad.rotation.x = Math.PI / 2;
    footPad.scale.set(1, 1, 0.5);
    footPad.position.set(sx * 0.085, 0.022, 0.055);
    g.add(leg, footPad);
  }

  // SINGLE sweeping muscular curved tail + icy-cyan dorsal crystal spine sweep from brow to tail tip
  const tailCurvePts = [
    new THREE.Vector3(0, 0.29, -0.06),
    new THREE.Vector3(0, 0.21, -0.22),
    new THREE.Vector3(0.08, 0.17, -0.39),
    new THREE.Vector3(0.22, 0.26, -0.49),
    new THREE.Vector3(0.28, 0.4, -0.44),
  ];
  const tail = buildTaperedCurve(tailCurvePts, 0.048, 0.012, 12, 5, obsidian);
  g.add(tail);

  // Dorsal crystalline shard ridge (head crown -> spine -> single curved tail)
  const crestCoords: [number, number, number, number, number, number][] = [
    [0, 0.74, 0.08, -0.55, 0, 0.14],
    [0, 0.7, 0.0, -0.75, 0, 0.19],
    [0, 0.62, -0.07, -0.92, 0, 0.21],
    [0, 0.51, -0.1, -1.05, 0, 0.19],
    [0, 0.4, -0.1, -1.15, 0, 0.16],
    [0, 0.3, -0.12, -1.25, 0, 0.14],
    [0.02, 0.23, -0.24, -1.35, -0.2, 0.12],
    [0.12, 0.21, -0.4, -1.2, -0.45, 0.11],
    [0.24, 0.32, -0.48, -0.75, -0.45, 0.1],
  ];
  for (const [cx, cy, cz, rx, ry, h] of crestCoords) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.024, h, 4), cyanCrystal);
    shard.position.set(cx, cy, cz);
    shard.rotation.set(rx, ry, 0);
    shard.castShadow = true;
    g.add(shard);
  }

  g.scale.setScalar(scale);
  return g;
}

/**
 * Wordstreamer (character_source_sheets/1000190435.png):
 * Fractured midnight-obsidian Starsilk entity with glowing cyan star-burst chest core,
 * glowing cyan fracture seams across shell limbs, wind-swept starlight hair waves,
 * tattered asymmetric hip-wrap skirt, and faceted diamond crystal Wordstream Staff.
 */
export function buildWordstreamerFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const tex = getSharedPapercraftTextures();
  const obsidianShell = paperMat(0x1e2430, paperBump, { roughness: 0.72, metalness: 0.16 });
  const skirtIndigo = paperMat(0x283244, paperBump, { roughness: 0.85 });
  const cyanCore = paperMat(0x52e6ff, paperBump, {
    emissive: 0x1990b8,
    emissiveIntensity: 0.72,
    roughness: 0.28,
  });
  const crackShell = paperMat(0x23384d, paperBump, {
    map: tex.barcodeStrip,
    emissive: 0x105570,
    emissiveIntensity: 0.38,
    roughness: 0.45,
  });
  const hairBlue = paperMat(0x3a84bd, paperBump, {
    emissive: 0x123e62,
    emissiveIntensity: 0.32,
    roughness: 0.68,
  });

  // Slender faceted legs & heeled boots
  for (const sx of [-0.048, 0.048]) {
    const leg = buildTaperedCurve(
      [new THREE.Vector3(sx, 0.02, 0), new THREE.Vector3(sx * 0.9, 0.3, 0)],
      0.028,
      0.042,
      5,
      6,
      obsidianShell,
    );
    const fissureStrip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.015), crackShell);
    fissureStrip.position.set(sx, 0.16, 0.028);
    g.add(leg, fissureStrip);
  }

  // Asymmetric layered tattered wrap skirt (overlapping angled origami petals)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const petalLen = i % 2 === 0 ? 0.28 : 0.21;
    const flap = buildCutCardShape(
      [
        [-0.055, 0],
        [0.055, 0],
        [0.082, -petalLen],
        [0, -petalLen * 1.15],
        [-0.075, -petalLen * 0.88],
      ],
      0.014,
      i % 2 === 0 ? skirtIndigo : obsidianShell,
    );
    flap.position.set(Math.sin(a) * 0.068, 0.34, Math.cos(a) * 0.058);
    flap.rotation.y = a;
    flap.rotation.x = -0.22;
    g.add(flap);
  }

  // Sculpted hourglass obsidian torso with glowing cyan chest star-burst & shoulder cracks
  const torsoPts = [
    new THREE.Vector2(0.052, 0.0),
    new THREE.Vector2(0.046, 0.08),
    new THREE.Vector2(0.086, 0.19),
    new THREE.Vector2(0.072, 0.25),
    new THREE.Vector2(0.032, 0.27),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 7), obsidianShell);
  torso.position.y = 0.33;
  torso.castShadow = true;
  g.add(torso);

  // 8-point cyan star-core chest emblem
  const starPts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 0.048 : 0.016;
    const ang = (i / 8) * Math.PI * 2;
    starPts.push([Math.cos(ang) * r, Math.sin(ang) * r]);
  }
  const chestStar = buildCutCardShape(starPts, 0.018, cyanCore);
  chestStar.position.set(0, 0.48, 0.078);
  g.add(chestStar);

  // Slender fractured arms (right arm extended outward holding Wordstream Staff)
  const armL = buildTaperedCurve(
    [
      new THREE.Vector3(-0.09, 0.55, 0),
      new THREE.Vector3(-0.135, 0.43, 0.02),
      new THREE.Vector3(-0.125, 0.31, 0.05),
    ],
    0.026,
    0.018,
    5,
    5,
    obsidianShell,
  );
  const armR = buildTaperedCurve(
    [
      new THREE.Vector3(0.09, 0.55, 0),
      new THREE.Vector3(0.15, 0.48, 0.03),
      new THREE.Vector3(0.19, 0.45, 0.06),
    ],
    0.026,
    0.018,
    5,
    5,
    obsidianShell,
  );
  g.add(armL, armR);

  // Sculpted obsidian head + glowing eyes & sweeping starlight hair waves
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.062, 1), obsidianShell);
  head.scale.set(0.9, 1.12, 0.95);
  head.position.set(0, 0.67, 0);
  head.castShadow = true;
  const cheekCrack = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.012, 0.09), cyanCore);
  cheekCrack.position.set(0, 0.675, 0.022);
  g.add(head, cheekCrack);

  for (let h = -2; h <= 2; h++) {
    const ribbon = buildCutCardShape(
      [
        [-0.025, 0],
        [0.025, 0],
        [0.045, -0.22],
        [0, -0.34],
        [-0.032, -0.2],
      ],
      0.012,
      h % 2 === 0 ? hairBlue : cyanCore,
    );
    ribbon.position.set(h * 0.028, 0.72, -0.045);
    ribbon.rotation.x = 0.72 + Math.abs(h) * 0.1;
    ribbon.rotation.z = h * 0.24;
    g.add(ribbon);
  }

  // Tall Faceted Diamond Crystal Wordstream Staff
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.88, 6), obsidianShell);
  staff.position.set(0.195, 0.44, 0.06);
  staff.castShadow = true;
  const cradleRing = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.008, 5, 12), obsidianShell);
  cradleRing.position.set(0.195, 0.89, 0.06);
  const crystalHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.062, 0), cyanCore);
  crystalHead.scale.set(0.7, 1.65, 0.7);
  crystalHead.position.set(0.195, 0.93, 0.06);
  g.add(staff, cradleRing, crystalHead);

  g.scale.setScalar(scale);
  return g;
}

/**
 * NiAlBu (character_source_sheets/1000188759.png):
 * Inverted suspended inside an open cutaway crystalline slate-blue Digital Geode:
 * Legless tapering midnight-indigo silhouette, 3-4 thin copper-orange binding rings,
 * elongated 4-fingered clawed hands, glowing cyan spine fissures & cranium flame plume,
 * flanked by branching coral-antler crown.
 */
export function buildNiAlBuGeode(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const slateGeo = paperMat(0x2d3a4c, paperBump, { roughness: 0.65, metalness: 0.18 });
  const rimGeo = paperMat(0x4f6885, paperBump, { roughness: 0.48, metalness: 0.2 });
  const glassEdge = paperMat(0x6fb8d6, paperBump, {
    transparent: true,
    opacity: 0.3,
    roughness: 0.22,
  });
  const indigoBody = paperMat(0x2d4368, paperBump, {
    emissive: 0x0d1f3d,
    emissiveIntensity: 0.34,
    roughness: 0.72,
  });
  const cyanFlame = paperMat(0x6ae8ff, paperBump, {
    emissive: 0x1ea0c8,
    emissiveIntensity: 0.75,
    roughness: 0.25,
  });
  const copperRing = paperMat(0xde8d46, paperBump, {
    emissive: 0x5c2d08,
    emissiveIntensity: 0.32,
    roughness: 0.36,
    metalness: 0.7,
  });

  // Open cutaway crystalline geode pedestal + 5 rear/side crystal spires (open in front so NiAlBu reads clearly!)
  const geodeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.32, 0.065, 7), slateGeo);
  geodeBase.position.y = 0.032;
  geodeBase.castShadow = true;
  g.add(geodeBase);

  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 0.45 + (i / 4) * Math.PI * 1.1; // Rear semi-circle only!
    const h = 0.56 + (i === 2 ? 0.1 : 0);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, h, 5), slateGeo);
    pillar.position.set(Math.cos(a) * 0.22, h / 2 + 0.04, Math.sin(a) * 0.22);
    pillar.rotation.z = Math.cos(a) * 0.08;
    pillar.castShadow = true;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.082, 0.14, 5), rimGeo);
    tip.position.set(Math.cos(a) * 0.22, h + 0.1, Math.sin(a) * 0.22);
    g.add(pillar, tip);
  }
  // Translucent faceted side shards framing the cutaway opening
  for (const sx of [-1, 1]) {
    const facet = buildCutCardShape(
      [
        [0, 0],
        [0.14, 0.06],
        [0.11, 0.54],
        [0, 0.62],
      ],
      0.018,
      glassEdge,
    );
    facet.position.set(sx * 0.24, 0.06, 0.04);
    facet.rotation.y = sx * 0.55;
    g.add(facet);
  }

  // Inverted suspended NiAlBu figure (head pointing downward inside open crystal alcove)
  const fig = new THREE.Group();
  fig.position.set(0, 0.42, 0.075);
  fig.rotation.z = Math.PI;

  // Legless tapering ragged lower silhouette curving gracefully upward (toward top of geode)
  const torsoAndTail = buildTaperedCurve(
    [
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(0, 0.0, 0),
      new THREE.Vector3(0.015, -0.14, -0.02),
      new THREE.Vector3(-0.01, -0.28, -0.01),
    ],
    0.072,
    0.012,
    10,
    6,
    indigoBody,
  );
  fig.add(torsoAndTail);

  // Cyan spine / fissure chest vein
  const chestFissure = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.18, 0.095), cyanFlame);
  chestFissure.position.set(0, 0.03, 0.015);
  fig.add(chestFissure);

  // Sculpted head + glowing cyan cranium plume + twin multi-branched coral/antler horns
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.056, 1), indigoBody);
  head.position.set(0, 0.18, 0.01);
  const craniumGlow = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.14, 5), cyanFlame);
  craniumGlow.position.set(0, 0.27, 0.01);
  fig.add(head, craniumGlow);

  for (const sx of [-1, 1]) {
    // Main coral antler trunk + outer fork tine
    const antler = buildTaperedCurve(
      [
        new THREE.Vector3(sx * 0.045, 0.2, 0),
        new THREE.Vector3(sx * 0.09, 0.27, 0),
        new THREE.Vector3(sx * 0.08, 0.34, 0.02),
      ],
      0.018,
      0.008,
      6,
      5,
      indigoBody,
    );
    const tine = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.08, 4), indigoBody);
    tine.position.set(sx * 0.11, 0.29, 0);
    tine.rotation.z = -sx * 0.72;

    // Elongated arms + 4-fingered clawed hands
    const arm = buildTaperedCurve(
      [
        new THREE.Vector3(sx * 0.07, 0.1, 0),
        new THREE.Vector3(sx * 0.125, 0.03, 0.03),
        new THREE.Vector3(sx * 0.11, -0.05, 0.06),
      ],
      0.024,
      0.016,
      6,
      5,
      indigoBody,
    );
    fig.add(antler, tine, arm);
    for (let f = -1.5; f <= 1.5; f += 1) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.034, 3), cyanFlame);
      claw.position.set(sx * 0.11 + f * 0.008, -0.07, 0.065);
      claw.rotation.x = Math.PI;
      fig.add(claw);
    }
  }

  // 4 thin tilted copper-orange binding rings
  for (const [ry, rx, rz, rad] of [
    [-0.14, 0.25, 0.18, 0.095],
    [-0.02, -0.22, -0.16, 0.135],
    [0.09, 0.3, -0.2, 0.145],
    [0.2, -0.18, 0.22, 0.12],
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.0075, 5, 18), copperRing);
    ring.rotation.set(Math.PI / 2 + rx, rz, 0);
    ring.position.y = ry;
    fig.add(ring);
  }

  g.add(fig);
  g.scale.setScalar(scale);
  return g;
}

/**
 * Codec (character_source_sheets/1000190380.png):
 * Stocky bearded commander in matte-charcoal suit, sculpted crimson pauldrons/gauntlets/greaves,
 * asymmetric crimson shoulder-to-waist chest strap with bright glowing CYAN SUNBURST CORE ON LEFT CHEST,
 * and sweeping knee-length pleated dark-crimson cape.
 */
export function buildCodecFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const charcoal = paperMat(0x262b34, paperBump, { roughness: 0.78 });
  const crimsonArmor = paperMat(0xa32e26, paperBump, { roughness: 0.62, metalness: 0.16 });
  const capeCrimson = paperMat(0x6a1c19, paperBump, { roughness: 0.86 });
  const skinMat = paperMat(0xd9b092, paperBump, { roughness: 0.8 });
  const beardHair = paperMat(0x30221a, paperBump, { roughness: 0.88 });
  const cyanCore = paperMat(0x52e6ff, paperBump, {
    emissive: 0x1b96bc,
    emissiveIntensity: 0.75,
    roughness: 0.26,
  });

  // Grounded boots, crimson shin greaves & charcoal combat thighs
  for (const sx of [-0.062, 0.062]) {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.14, 6), charcoal);
    thigh.position.set(sx, 0.22, 0);
    const greave = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.038, 0.13, 6), crimsonArmor);
    greave.position.set(sx, 0.1, 0.005);
    const boot = buildCutCardShape(
      [
        [-0.036, 0],
        [0.036, 0],
        [0.04, 0.04],
        [-0.032, 0.045],
      ],
      0.095,
      crimsonArmor,
    );
    boot.rotation.y = Math.PI / 2;
    boot.position.set(sx, 0.0, 0.015);
    g.add(thigh, greave, boot);
  }

  // Broad commander torso + asymmetric crimson diagonal chest band
  const torsoPts = [
    new THREE.Vector2(0.092, 0),
    new THREE.Vector2(0.115, 0.14),
    new THREE.Vector2(0.135, 0.24),
    new THREE.Vector2(0.075, 0.27),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 6), charcoal);
  torso.scale.set(1.12, 1, 0.72);
  torso.position.y = 0.27;
  torso.castShadow = true;
  g.add(torso);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.15), crimsonArmor);
  belt.position.y = 0.29;
  const diagStrap = buildCutCardShape(
    [
      [-0.09, -0.11],
      [-0.04, -0.11],
      [0.095, 0.11],
      [0.045, 0.11],
    ],
    0.155,
    crimsonArmor,
  );
  diagStrap.position.set(0, 0.42, 0.005);
  g.add(belt, diagStrap);

  // Glowing blue-cyan sunburst core emblem strictly on character's LEFT chest (+x facing viewer)
  const coreHalo = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.018, 8), cyanCore);
  coreHalo.rotation.x = Math.PI / 2;
  coreHalo.position.set(0.042, 0.455, 0.088);
  const coreStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.028, 0), cyanCore);
  coreStar.position.set(0.042, 0.455, 0.096);
  g.add(coreHalo, coreStar);

  // Sculpted angular crimson pauldrons + charcoal arms + crimson gauntlets
  for (const sx of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.12, 5), crimsonArmor);
    pauldron.position.set(sx * 0.145, 0.505, 0);
    pauldron.rotation.z = -sx * 0.85;
    pauldron.scale.set(1, 1, 1.15);
    pauldron.castShadow = true;

    const arm = buildTaperedCurve(
      [
        new THREE.Vector3(sx * 0.14, 0.48, 0),
        new THREE.Vector3(sx * 0.165, 0.36, 0.02),
        new THREE.Vector3(sx * 0.16, 0.25, 0.04),
      ],
      0.036,
      0.032,
      5,
      6,
      charcoal,
    );
    const gauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.12, 6), crimsonArmor);
    gauntlet.position.set(sx * 0.16, 0.27, 0.035);
    g.add(pauldron, arm, gauntlet);
  }

  // Sweeping pleated dark-crimson knee-length cape
  for (let c = -1; c <= 1; c++) {
    const pleat = buildCutCardShape(
      [
        [-0.065, 0],
        [0.065, 0],
        [0.09, -0.42],
        [-0.09, -0.42],
      ],
      0.014,
      capeCrimson,
    );
    pleat.position.set(c * 0.078, 0.51, -0.085);
    pleat.rotation.set(0.18, c * 0.22, c * -0.08);
    g.add(pleat);
  }

  // Sculpted head + full beard/moustache + tousled dark hair
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.066, 1), skinMat);
  head.scale.set(0.95, 1.08, 0.96);
  head.position.set(0, 0.605, 0);
  const beard = buildCutCardShape(
    [
      [-0.056, 0.015],
      [0.056, 0.015],
      [0.042, -0.055],
      [0, -0.072],
      [-0.042, -0.055],
    ],
    0.055,
    beardHair,
  );
  beard.position.set(0, 0.575, 0.034);
  const hair = new THREE.Mesh(new THREE.DodecahedronGeometry(0.072, 0), beardHair);
  hair.scale.set(1.02, 0.72, 1.05);
  hair.position.set(0, 0.645, -0.008);
  g.add(head, beard, hair);

  g.scale.setScalar(scale);
  return g;
}

/**
 * Marcel (character_source_sheets/1000190286.png):
 * Youthful slim olive-skinned traveler with tousled dark hair & widow's peak,
 * sleeveless dark olive-green vest over cream V-neck undershirt, cropped trousers,
 * leather wrist cuffs, boots, and plain curved wooden shepherd's crook (ZERO glow).
 */
export function buildMarcelFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const creamShirt = paperMat(0xf0e7d4, paperBump, { roughness: 0.88 });
  const oliveVest = paperMat(0x3a5b3e, paperBump, { roughness: 0.84 });
  const darkPants = paperMat(0x28322c, paperBump, { roughness: 0.88 });
  const skinOlive = paperMat(0xcda077, paperBump, { roughness: 0.8 });
  const darkHair = paperMat(0x27201b, paperBump, { roughness: 0.86 });
  const woodLeather = paperMat(0x694830, paperBump, { roughness: 0.82 });

  // Boots + cropped dark olive trousers
  for (const sx of [-0.048, 0.048]) {
    const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.18, 6), darkPants);
    pant.position.set(sx, 0.17, 0);
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.1, 6), woodLeather);
    boot.position.set(sx, 0.05, 0.006);
    g.add(pant, boot);
  }

  // Waist sash
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.082, 0.055, 7), woodLeather);
  sash.scale.set(1.1, 1, 0.78);
  sash.position.y = 0.27;
  g.add(sash);

  // Cream sleeveless undershirt + sculpted sleeveless olive vest wings with collar lapels
  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.068, 0.24, 6), creamShirt);
  shirt.scale.set(1.12, 1, 0.72);
  shirt.position.y = 0.39;
  g.add(shirt);

  for (const sx of [-1, 1]) {
    const vestPanel = buildCutCardShape(
      [
        [0, 0],
        [sx * 0.068, 0],
        [sx * 0.074, 0.25],
        [sx * 0.025, 0.25],
        [0, 0.17],
      ],
      0.112,
      oliveVest,
    );
    vestPanel.position.set(sx * 0.015, 0.275, 0);
    vestPanel.castShadow = true;

    const arm = buildTaperedCurve(
      [
        new THREE.Vector3(sx * 0.095, 0.49, 0),
        new THREE.Vector3(sx * 0.12, 0.38, 0.015),
        new THREE.Vector3(sx * 0.125, 0.29, 0.035),
      ],
      0.026,
      0.02,
      5,
      5,
      skinOlive,
    );
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 6), woodLeather);
    cuff.position.set(sx * 0.123, 0.31, 0.03);
    g.add(vestPanel, arm, cuff);
  }

  // Sculpted face + tousled dark hair with widow's peak
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), skinOlive);
  head.scale.set(0.92, 1.06, 0.96);
  head.position.set(0, 0.575, 0);
  const hairCap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.066, 0), darkHair);
  hairCap.scale.set(1.04, 0.85, 1.06);
  hairCap.position.set(0, 0.605, -0.012);
  const widowPeak = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.055, 3), darkHair);
  widowPeak.rotation.x = Math.PI;
  widowPeak.position.set(0, 0.605, 0.052);
  g.add(head, hairCap, widowPeak);

  // Plain natural wood shepherd's crook staff (strictly zero emissive/magic)
  const crook = buildTaperedCurve(
    [
      new THREE.Vector3(0.145, 0.01, 0.04),
      new THREE.Vector3(0.145, 0.35, 0.04),
      new THREE.Vector3(0.145, 0.6, 0.04),
      new THREE.Vector3(0.125, 0.68, 0.04),
      new THREE.Vector3(0.075, 0.675, 0.04),
      new THREE.Vector3(0.068, 0.625, 0.04),
    ],
    0.016,
    0.012,
    14,
    6,
    woodLeather,
  );
  g.add(crook);

  g.scale.setScalar(scale);
  return g;
}

/**
 * Kail (canon lock: kail.body.html + invariants.json):
 * Young Syrin survivor in black tactical/travel suit, short spiky medium-blue hair (#3F92C7),
 * and a prominent RED SCARF (#C83E49) permanently covering his mouth and throat in every view
 * (zero exposed speaking mouth).
 */
export function buildKailFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const blackSuit = paperMat(0x1a1e26, paperBump, { roughness: 0.78, metalness: 0.1 });
  const trimGray = paperMat(0x323a46, paperBump, { roughness: 0.7 });
  const redScarf = paperMat(0xc83e49, paperBump, { roughness: 0.84 });
  const blueHair = paperMat(0x3f92c7, paperBump, { roughness: 0.74 });
  const skinMat = paperMat(0xe5c9b2, paperBump, { roughness: 0.82 });

  // Grounded tactical boots & fitted black combat trousers
  for (const sx of [-0.048, 0.048]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.24, 6), blackSuit);
    leg.position.set(sx, 0.13, 0);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.08, 0.075), trimGray);
    boot.position.set(sx, 0.04, 0.01);
    g.add(leg, boot);
  }

  // Fitted black tactical jacket torso
  const torsoPts = [
    new THREE.Vector2(0.068, 0),
    new THREE.Vector2(0.062, 0.08),
    new THREE.Vector2(0.088, 0.21),
    new THREE.Vector2(0.052, 0.24),
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 6), blackSuit);
  torso.scale.set(1.12, 1, 0.75);
  torso.position.y = 0.24;
  torso.castShadow = true;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.03, 0.115), trimGray);
  belt.position.y = 0.255;
  g.add(torso, belt);

  for (const sx of [-1, 1]) {
    const arm = buildTaperedCurve(
      [
        new THREE.Vector3(sx * 0.092, 0.45, 0),
        new THREE.Vector3(sx * 0.112, 0.35, 0.015),
        new THREE.Vector3(sx * 0.108, 0.26, 0.03),
      ],
      0.025,
      0.019,
      5,
      5,
      blackSuit,
    );
    g.add(arm);
  }

  // Sculpted head + eyes ONLY visible above the high mouth-covering red scarf
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.058, 1), skinMat);
  head.scale.set(0.92, 1.04, 0.96);
  head.position.set(0, 0.545, 0);
  g.add(head);

  // Signature RED SCARF covering throat AND lower face/mouth permanently
  const scarfCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.078, 0.095, 8), redScarf);
  scarfCollar.position.set(0, 0.505, 0.008);
  scarfCollar.castShadow = true;
  const scarfWrap = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.026, 6, 12), redScarf);
  scarfWrap.rotation.x = Math.PI / 2;
  scarfWrap.position.set(0, 0.532, 0.01);
  // Trailing red scarf tail fluttering cleanly off left shoulder
  const scarfTail = buildCutCardShape(
    [
      [-0.025, 0],
      [0.028, 0],
      [0.045, -0.22],
      [0.01, -0.27],
      [-0.03, -0.2],
    ],
    0.015,
    redScarf,
  );
  scarfTail.position.set(-0.078, 0.49, -0.035);
  scarfTail.rotation.set(0.22, -0.2, 0.34);
  g.add(scarfCollar, scarfWrap, scarfTail);

  // Spiky layered origami medium-blue hair
  const hairBase = new THREE.Mesh(new THREE.DodecahedronGeometry(0.062, 0), blueHair);
  hairBase.position.set(0, 0.578, -0.01);
  g.add(hairBase);
  const spikeSpecs: [number, number, number, number, number, number][] = [
    [0, 0.645, -0.01, -0.2, 0, 0.08],
    [-0.045, 0.625, 0.01, 0.1, 0.45, 0.075],
    [0.045, 0.625, 0.01, 0.1, -0.45, 0.075],
    [-0.032, 0.615, -0.045, -0.65, 0.35, 0.08],
    [0.032, 0.615, -0.045, -0.65, -0.35, 0.08],
    [0, 0.612, 0.042, 0.72, 0, 0.068],
  ];
  for (const [sx, sy, sz, rx, rz, h] of spikeSpecs) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.024, h, 4), blueHair);
    spike.position.set(sx, sy, sz);
    spike.rotation.set(rx, 0, rz);
    g.add(spike);
  }

  g.scale.setScalar(scale);
  return g;
}
