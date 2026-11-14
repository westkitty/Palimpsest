import * as THREE from 'three';

function celMat(
  color: number,
  paperBump: THREE.Texture,
  opts?: { emissive?: number; emissiveIntensity?: number; transparent?: boolean; opacity?: number; roughness?: number },
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    bumpMap: paperBump,
    bumpScale: 0.008,
    roughness: opts?.roughness ?? 0.8,
    metalness: 0.08,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    side: THREE.DoubleSide,
  });
}

/**
 * The Shard-god (character_source_sheets/1000190389.png):
 * Obsidian-black digitigrade dragonoid predator with icy-cyan dorsal crystal spines,
 * cyan fissure veins across torso, and single sweeping muscular tail.
 */
export function buildShardGodFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const obsidian = celMat(0x161920, paperBump);
  const cyanCrystal = celMat(0x5ae4ff, paperBump, { emissive: 0x1688a8, emissiveIntensity: 0.65, roughness: 0.35 });

  // Muscular arched torso & shoulders
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.085, 0.3, 6), obsidian);
  chest.position.set(0, 0.44, 0.02);
  chest.rotation.x = 0.22;
  chest.castShadow = true;

  // Cyan chest fissure vein
  const fissure = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.02), cyanCrystal);
  fissure.position.set(0, 0.45, 0.12);

  // Sculpted reptilian head & jaw
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.22, 5), obsidian);
  head.rotation.x = Math.PI / 2 + 0.12;
  head.position.set(0, 0.65, 0.12);
  head.castShadow = true;

  // Claws / arms
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.24, 0.06), obsidian);
    arm.position.set(sx * 0.14, 0.4, 0.08);
    arm.rotation.z = sx * 0.28;
    arm.rotation.x = -0.35;
    g.add(arm);

    // Shoulder crystal spines
    const shCrystal = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.14, 4), cyanCrystal);
    shCrystal.position.set(sx * 0.13, 0.56, -0.02);
    shCrystal.rotation.z = -sx * 0.65;
    g.add(shCrystal);

    // Digitigrade legs
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.2, 0.08), obsidian);
    thigh.position.set(sx * 0.075, 0.23, 0.02);
    thigh.rotation.x = -0.38;
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.055), obsidian);
    shin.position.set(sx * 0.075, 0.09, -0.03);
    shin.rotation.x = 0.3;
    g.add(thigh, shin);
  }

  // Single sweeping tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.48, 5), obsidian);
  tail.rotation.x = -Math.PI / 2.4;
  tail.position.set(0, 0.2, -0.22);
  tail.castShadow = true;

  // Jagged icy-cyan crystal crest down skull, back, and tail
  for (let i = 0; i < 6; i++) {
    const spine = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.16 - i * 0.014, 4), cyanCrystal);
    spine.rotation.x = -0.65 - i * 0.1;
    spine.position.set(0, 0.69 - i * 0.09, 0.01 - i * 0.05);
    g.add(spine);
  }

  g.add(chest, fissure, head, tail);
  g.scale.setScalar(scale);
  return g;
}

/**
 * Wordstreamer (character_source_sheets/1000190435.png):
 * Tall fractured dark-slate shell entity with glowing cyan star-core & hairline skin fractures,
 * flowing starlight hair, tattered asymmetric garment & crystal-tipped Wordstream staff.
 */
export function buildWordstreamerFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const darkShell = celMat(0x212732, paperBump);
  const cloth = celMat(0x2d3542, paperBump);
  const cyanCore = celMat(0x4be0ff, paperBump, { emissive: 0x1682a4, emissiveIntensity: 0.68, roughness: 0.32 });

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.3, 6), darkShell);
  legs.position.y = 0.15;

  // Tattered asymmetric waist garment
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 7, 1, true), cloth);
  skirt.position.set(0, 0.22, -0.02);
  skirt.rotation.x = 0.08;
  skirt.castShadow = true;

  // Fractured shell torso + glowing cyan chest star-core
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.065, 0.26, 6), darkShell);
  torso.position.y = 0.42;
  torso.castShadow = true;
  const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), cyanCore);
  starCore.position.set(0, 0.45, 0.075);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), darkShell);
  head.position.y = 0.62;

  // Flowing blue-tipped starlight hair waves
  for (let h = -1; h <= 1; h++) {
    const hairStrand = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.34, 4), cyanCore);
    hairStrand.position.set(h * 0.055, 0.57, -0.09);
    hairStrand.rotation.x = -1.15;
    hairStrand.rotation.z = h * 0.25;
    g.add(hairStrand);
  }

  // Faceted Crystal Wordstream Staff
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.82, 6), darkShell);
  staff.position.set(0.18, 0.41, 0.04);
  staff.castShadow = true;
  const crystalHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), cyanCore);
  crystalHead.scale.set(0.75, 1.5, 0.75);
  crystalHead.position.set(0.18, 0.85, 0.04);

  g.add(legs, skirt, torso, starCore, head, staff, crystalHead);
  g.scale.setScalar(scale);
  return g;
}

/**
 * NiAlBu (character_source_sheets/1000188759.png):
 * Deep indigo ethereal witness with branched coral-horn crown framing glowing crest,
 * tapering liquid lower silhouette & golden binding rings, inverted inside a translucent faceted Digital Geode.
 */
export function buildNiAlBuGeode(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const hullMat = celMat(0x4b5c73, paperBump, { transparent: true, opacity: 0.44, roughness: 0.28 });
  const rimMat = celMat(0x283240, paperBump);
  const indigoBody = celMat(0x203554, paperBump, { emissive: 0x0c1e38, emissiveIntensity: 0.3 });
  const cyanCrest = celMat(0x68e4ff, paperBump, { emissive: 0x1e8cb0, emissiveIntensity: 0.65 });
  const bindGold = celMat(0xe29b58, paperBump, { emissive: 0x6e3a10, emissiveIntensity: 0.35 });

  // Outer faceted crystal geode pedestal & open translucent cage columns so inverted NiAlBu is clearly visible!
  const geodeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 6), rimMat);
  geodeBase.position.y = 0.03;
  const crystalShell = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.56, 6), hullMat);
  crystalShell.position.y = 0.34;
  crystalShell.castShadow = true;

  // Inverted inner witness figure (head pointing DOWN inside geode)
  const fig = new THREE.Group();
  fig.position.y = 0.36;
  fig.rotation.z = Math.PI;
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), indigoBody);
  body.rotation.x = Math.PI;
  body.position.y = -0.02;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), indigoBody);
  head.position.y = 0.14;
  const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), cyanCrest);
  crown.position.y = 0.22;
  // Twin coral horns
  for (const sx of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.14, 4), indigoBody);
    horn.position.set(sx * 0.06, 0.22, 0);
    horn.rotation.z = -sx * 0.45;
    fig.add(horn);
  }
  // Golden binding rings around NiAlBu
  for (const ry of [0.02, 0.1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 5, 16), bindGold);
    ring.rotation.x = Math.PI / 2 + 0.25;
    ring.position.y = ry;
    fig.add(ring);
  }
  fig.add(body, head, crown);

  g.add(geodeBase, crystalShell, fig);
  g.scale.setScalar(scale);
  return g;
}

/**
 * Codec (character_source_sheets/1000190380.png):
 * Bearded warrior-analyst in charcoal suit, crimson pauldrons/gauntlets/boots,
 * asymmetrical crimson chest strap with bright cyan circular core, and dark crimson cape.
 */
export function buildCodecFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const charcoal = celMat(0x282c34, paperBump);
  const crimsonArmor = celMat(0x9b2d26, paperBump);
  const capeMat = celMat(0x681f1c, paperBump);
  const skinMat = celMat(0xdcb498, paperBump);
  const hairBeard = celMat(0x3a2a20, paperBump);
  const cyanCore = celMat(0x52e0ff, paperBump, { emissive: 0x1680a0, emissiveIntensity: 0.7 });

  for (const sx of [-0.06, 0.06]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.24, 6), charcoal);
    leg.position.set(sx, 0.14, 0);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.08), crimsonArmor);
    boot.position.set(sx, 0.05, 0.01);
    g.add(leg, boot);
  }

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.25, 0.13), charcoal);
  torso.position.y = 0.37;
  torso.castShadow = true;

  // Crimson chest strap + circular glowing cyan chest core
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.14), crimsonArmor);
  chestPlate.position.y = 0.42;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), cyanCore);
  core.rotation.x = Math.PI / 2;
  core.position.set(0.03, 0.42, 0.072);

  // Pauldrons & arms with crimson gauntlets
  for (const sx of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.14), crimsonArmor);
    pauldron.position.set(sx * 0.13, 0.47, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.18, 6), charcoal);
    arm.position.set(sx * 0.14, 0.36, 0.01);
    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.065), crimsonArmor);
    gauntlet.position.set(sx * 0.14, 0.25, 0.02);
    g.add(pauldron, arm, gauntlet);
  }

  // Sweeping dark-crimson cape
  const cape = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.02), capeMat);
  cape.position.set(0, 0.28, -0.09);
  cape.rotation.x = 0.14;
  cape.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
  head.position.y = 0.56;
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), hairBeard);
  hair.position.set(0, 0.61, -0.01);
  const beard = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.055, 0.06), hairBeard);
  beard.position.set(0, 0.525, 0.035);

  g.add(torso, chestPlate, core, cape, head, hair, beard);
  g.scale.setScalar(scale);
  return g;
}

/**
 * Marcel (character_source_sheets/1000190286.png):
 * Youthful slim olive-skinned figure in forest-green sleeveless vest over cream sleeveless shirt,
 * cropped green trousers, leather cuffs, and plain crooked wooden shepherd's staff (zero magic glow).
 */
export function buildMarcelFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const creamShirt = celMat(0xefe6d2, paperBump);
  const greenVest = celMat(0x3a5b3e, paperBump);
  const skinOlive = celMat(0xcfa078, paperBump);
  const darkHair = celMat(0x28211c, paperBump);
  const wood = celMat(0x634832, paperBump);

  for (const sx of [-0.048, 0.048]) {
    const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.24, 6), greenVest);
    pant.position.set(sx, 0.13, 0);
    g.add(pant);
  }
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.23, 0.1), creamShirt);
  shirt.position.y = 0.35;
  const vestL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.115), greenVest);
  vestL.position.set(-0.055, 0.35, 0);
  vestL.castShadow = true;
  const vestR = vestL.clone();
  vestR.position.x = 0.055;

  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.2, 5), skinOlive);
    arm.position.set(sx * 0.1, 0.35, 0);
    g.add(arm);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), skinOlive);
  head.position.y = 0.54;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.066, 8, 6), darkHair);
  hair.position.set(0, 0.56, -0.01);

  // Plain non-magical crooked wood staff
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.62, 6), wood);
  staff.position.set(0.15, 0.31, 0.04);
  const crook = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.013, 5, 10, Math.PI * 1.4), wood);
  crook.position.set(0.11, 0.62, 0.04);

  g.add(shirt, vestL, vestR, head, hair, staff, crook);
  g.scale.setScalar(scale);
  return g;
}

/**
 * Kail (Syrin survivor initiate figure): modest archival cream-and-amber paper figure.
 */
export function buildKailFigure(paperBump: THREE.Texture, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const cloak = celMat(0xe5dac2, paperBump);
  const accent = celMat(0xa88446, paperBump);

  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.44, 6), cloak);
  robe.position.y = 0.22;
  robe.castShadow = true;
  const shawl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.12, 6), accent);
  shawl.position.y = 0.34;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), cloak);
  head.position.y = 0.49;

  g.add(robe, shawl, head);
  g.scale.setScalar(scale);
  return g;
}
