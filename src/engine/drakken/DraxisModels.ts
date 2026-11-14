import * as THREE from 'three';
import { DraxisId } from '../../types/atlas';
import {
  buildCutCardShape,
  buildTaperedCurve,
  getSharedPapercraftTextures,
} from './papercraftArt';

export interface DraxisRig {
  id: DraxisId;
  group: THREE.Group;
  animate: (elapsed: number, active?: boolean) => void;
}

class LocalMatPalette {
  private cache = new Map<string, THREE.MeshStandardMaterial>();
  constructor(private paperBump: THREE.Texture) {}

  get(
    color: number,
    opts?: {
      emissive?: number;
      emissiveIntensity?: number;
      roughness?: number;
      metalness?: number;
      transparent?: boolean;
      opacity?: number;
      map?: THREE.Texture;
      flatShading?: boolean;
    },
  ): THREE.MeshStandardMaterial {
    const r = opts?.roughness ?? 0.82;
    const m = opts?.metalness ?? 0.08;
    const e = opts?.emissive ?? 0x000000;
    const ei = opts?.emissiveIntensity ?? 0;
    const t = opts?.transparent ? 1 : 0;
    const op = opts?.opacity ?? 1;
    const mapId = opts?.map?.uuid ?? 'none';
    const fs = opts?.flatShading === false ? 0 : 1;
    const key = `${color}_${r}_${m}_${e}_${ei}_${t}_${op}_${mapId}_${fs}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const mat = new THREE.MeshStandardMaterial({
      color,
      map: opts?.map ?? null,
      bumpMap: this.paperBump,
      bumpScale: 0.008,
      roughness: r,
      metalness: m,
      flatShading: fs === 1,
      emissive: e,
      emissiveIntensity: ei,
      transparent: opts?.transparent ?? false,
      opacity: op,
      side: THREE.DoubleSide,
    });
    this.cache.set(key, mat);
    return mat;
  }
}

/**
 * Reconstructed modular 3D papercraft assemblies for all 21 DRAXIS specimens (plates 001..060),
 * matching the original DRAXIS plates and accepted/repaired papercraft studies P00-U01.
 */
export function buildDraxisModel(id: DraxisId, paperBump: THREE.Texture): DraxisRig {
  const g = new THREE.Group();
  const pal = new LocalMatPalette(paperBump);
  const tex = getSharedPapercraftTextures();

  const basaltInk = pal.get(0x1f232c, { roughness: 0.74, metalness: 0.16 });
  const slateArmor = pal.get(0x454f5e, { roughness: 0.68, metalness: 0.22 });
  const warmCream = pal.get(0xf0e7d3, { roughness: 0.86, metalness: 0.03 });
  const ivoryBone = pal.get(0xeadec4, { roughness: 0.82, metalness: 0.04 });
  const bronzeMat = pal.get(0x7c5c44, { roughness: 0.56, metalness: 0.34 });
  const brassMat = pal.get(0xd0a858, { roughness: 0.36, metalness: 0.74 });
  const cyanMat = pal.get(0x50e2ff, { emissive: 0x1680a4, emissiveIntensity: 0.62, roughness: 0.3 });
  const barcodeMat = pal.get(0xffffff, {
    map: tex.barcodeStrip,
    emissive: 0x165e78,
    emissiveIntensity: 0.38,
    roughness: 0.38,
  });
  const magentaSlice = pal.get(0xee4cb8, { emissive: 0x8a1c64, emissiveIntensity: 0.55, roughness: 0.32 });
  const crimsonMat = pal.get(0x9a2420, { emissive: 0x450b09, emissiveIntensity: 0.28, roughness: 0.52 });
  const amberMagma = pal.get(0xf07a24, { emissive: 0xa43408, emissiveIntensity: 0.68, roughness: 0.36 });
  const limeBio = pal.get(0x94e046, { emissive: 0x407a12, emissiveIntensity: 0.55, roughness: 0.4 });

  const spinParts: { obj: THREE.Object3D; axis: 'x' | 'y' | 'z'; speed: number }[] = [];
  const orbitParts: { obj: THREE.Object3D; radius: number; phase: number; speed: number; y: number }[] = [];
  const waveParts: { obj: THREE.Object3D; baseY: number; amp: number; speed: number; phase: number }[] = [];

  switch (id) {
    case '001': {
      // MAGMA PLEURON (Plate 001 / P12): Arched articulated basalt centipede of convex curved dorsal carapace arches,
      // glowing orange magma joints, 3 axial cyan dorsal data-stripes, jointed curved legs, & 4-mandible shovel head.
      const spineGroup = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const z = -0.54 + t * 1.08;
        const archY = 0.22 + Math.sin(t * Math.PI * 0.9) * 0.25;
        const scale = 1 - Math.abs(t - 0.36) * 0.44;
        const pitch = Math.cos(t * Math.PI * 0.9) * -0.4;

        // Convex arched carapace hood (half-cylinder arch)
        const arch = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18 * scale, 0.2 * scale, 0.11, 7, 1, false, -Math.PI * 0.46, Math.PI * 0.92),
          basaltInk,
        );
        arch.rotation.set(Math.PI / 2 + pitch, 0, Math.PI / 2);
        arch.scale.set(0.76, 1, 1.28);
        arch.position.set(0, archY, z);
        arch.castShadow = true;
        spineGroup.add(arch);

        // Glowing orange magma seam beneath/between carapace shells
        if (i < 8) {
          const seam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.155 * scale, 0.155 * scale, 0.055, 7),
            amberMagma,
          );
          seam.rotation.x = Math.PI / 2 + pitch;
          seam.scale.set(1.18, 1, 0.72);
          seam.position.set(0, archY - 0.01, z + 0.068);
          spineGroup.add(seam);
        }

        // Triple axial cyan dorsal telemetry bars on ridge
        for (const sx of [-0.045, 0, 0.045]) {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02 * scale, 0.024, 0.085), cyanMat);
          stripe.position.set(sx * scale, archY + 0.135 * scale, z);
          stripe.rotation.x = pitch;
          spineGroup.add(stripe);
        }

        // Two-segment curved armored centipede legs
        for (const sx of [-1, 1]) {
          const leg = buildTaperedCurve(
            [
              new THREE.Vector3(sx * 0.17 * scale, archY - 0.02, z),
              new THREE.Vector3(sx * 0.28 * scale, archY - 0.08, z + 0.02),
              new THREE.Vector3(sx * 0.25 * scale, 0.015, z + 0.05),
            ],
            0.026 * scale,
            0.011 * scale,
            5,
            4,
            slateArmor,
          );
          spineGroup.add(leg);
        }
      }
      // Flat armored shovel-head + 4 forward mandibles + glowing orange eye slits
      const shovelHead = buildCutCardShape(
        [
          [-0.14, -0.06],
          [0.14, -0.06],
          [0.1, 0.1],
          [-0.1, 0.1],
        ],
        0.09,
        basaltInk,
      );
      shovelHead.rotation.x = Math.PI / 2 + 0.25;
      shovelHead.position.set(0, 0.24, 0.56);
      const eyeBar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.04), amberMagma);
      eyeBar.position.set(0, 0.24, 0.62);
      spineGroup.add(shovelHead, eyeBar);
      for (const [mx, sc] of [[-0.09, 1], [-0.035, 0.85], [0.035, 0.85], [0.09, 1]]) {
        const mand = new THREE.Mesh(new THREE.ConeGeometry(0.02 * sc, 0.19 * sc, 4), basaltInk);
        mand.position.set(mx, 0.18, 0.68);
        mand.rotation.set(Math.PI / 2 + 0.2, 0, -Math.sign(mx) * 0.24);
        spineGroup.add(mand);
      }
      g.add(spineGroup);
      waveParts.push({ obj: spineGroup, baseY: 0, amp: 0.02, speed: 1.5, phase: 0 });
      break;
    }

    case '003': {
      // FAULT-TONGUE (Plate 003 / P11): Armored sinuous seismic wyrm with barcode hull bands & dorsal fins,
      // splitting into SIDEWAYS/HORIZONTALLY opening armored jaws revealing an inner glowing CYAN RINGED TURBINE.
      const bodyCurve = new THREE.Group();
      const spinePts = [
        new THREE.Vector3(-0.08, 0.12, -0.58),
        new THREE.Vector3(0.12, 0.24, -0.32),
        new THREE.Vector3(-0.08, 0.26, -0.04),
        new THREE.Vector3(0.05, 0.24, 0.22),
        new THREE.Vector3(0, 0.25, 0.42),
      ];
      const bodyTube = buildTaperedCurve(spinePts, 0.08, 0.165, 16, 8, slateArmor);
      bodyCurve.add(bodyTube);

      // Barcode hull collar rings & dorsal blade fins
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const pt = new THREE.CatmullRomCurve3(spinePts).getPointAt(t);
        const r = THREE.MathUtils.lerp(0.085, 0.168, t);
        const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.016, 5, 12), barcodeMat);
        band.position.copy(pt);
        const fin = buildCutCardShape(
          [
            [-0.04, 0],
            [0.05, 0],
            [0.01, 0.13 + t * 0.04],
          ],
          0.018,
          basaltInk,
        );
        fin.rotation.y = Math.PI / 2;
        fin.position.set(pt.x, pt.y + r * 0.85, pt.z);
        bodyCurve.add(band, fin);
      }

      // Twin horizontally-opening armored side jaws flanking glowing ringed cyan resonance turbine
      const headPivot = new THREE.Group();
      headPivot.position.set(0, 0.25, 0.44);
      for (const sx of [-1, 1]) {
        const jaw = buildCutCardShape(
          [
            [0, -0.11],
            [0.34, -0.05],
            [0.4, 0],
            [0.34, 0.05],
            [0, 0.11],
          ],
          0.11,
          basaltInk,
        );
        jaw.rotation.y = -Math.PI / 2 + sx * 0.36;
        jaw.position.set(sx * 0.13, 0, 0.04);
        headPivot.add(jaw);
      }
      // Inner concentric glowing cyan seismic resonance turbine rings + crescent wave arcs
      const coreTube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.24, 12), cyanMat);
      coreTube.rotation.x = Math.PI / 2;
      coreTube.position.z = 0.08;
      headPivot.add(coreTube);
      const turbSpinner = new THREE.Group();
      turbSpinner.position.z = 0.18;
      for (const [tr, tz] of [
        [0.145, 0.0],
        [0.11, 0.07],
        [0.075, 0.13],
      ]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(tr, 0.014, 6, 16), cyanMat);
        ring.position.z = tz;
        turbSpinner.add(ring);
      }
      headPivot.add(turbSpinner);
      bodyCurve.add(headPivot);
      g.add(bodyCurve);
      spinParts.push({ obj: turbSpinner, axis: 'z', speed: 2.2 });
      break;
    }

    case '004': {
      // OBSIDIAN GUL (Plate 004 / P11): Wingless fierce volcanic-glass shard quadruped
      // bristling with backward-swept black obsidian crystal plates over glowing orange molten seams.
      const coreGlow = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), amberMagma);
      coreGlow.scale.set(0.9, 0.78, 2.2);
      coreGlow.position.set(0, 0.26, -0.02);
      g.add(coreGlow);

      // Swept backward overlapping black obsidian crystal shards along shoulders, flanks, back, and rump
      const shardSpecs: [number, number, number, number, number, number, number][] = [
        [0, 0.38, 0.18, -0.68, 0, 0, 0.26],
        [-0.12, 0.35, 0.14, -0.65, -0.3, -0.45, 0.24],
        [0.12, 0.35, 0.14, -0.65, 0.3, 0.45, 0.24],
        [-0.13, 0.31, -0.06, -0.82, -0.25, -0.5, 0.28],
        [0.13, 0.31, -0.06, -0.82, 0.25, 0.5, 0.28],
        [0, 0.38, -0.1, -0.88, 0, 0, 0.29],
        [-0.09, 0.27, -0.25, -0.95, -0.2, -0.3, 0.24],
        [0.09, 0.27, -0.25, -0.95, 0.2, 0.3, 0.24],
      ];
      for (const [x, y, z, rx, ry, rz, h] of shardSpecs) {
        const plate = new THREE.Mesh(new THREE.ConeGeometry(0.085, h, 4), basaltInk);
        plate.position.set(x, y, z);
        plate.rotation.set(rx, ry, rz);
        plate.castShadow = true;
        g.add(plate);
      }

      // Fierce horned obsidian skull & fiery orange gullet maw
      const skull = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.28, 4), basaltInk);
      skull.rotation.x = Math.PI / 2 + 0.15;
      skull.position.set(0, 0.34, 0.42);
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.18, 4), basaltInk);
      hornL.position.set(-0.075, 0.42, 0.32);
      hornL.rotation.set(-0.85, 0, 0.35);
      const hornR = hornL.clone();
      hornR.position.x = 0.075;
      hornR.rotation.z = -0.35;
      const mawGlow = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.032, 0.09), amberMagma);
      mawGlow.position.set(0, 0.31, 0.46);
      g.add(skull, hornL, hornR, mawGlow);

      // 4 clawed obsidian shard legs + serrated tail
      for (const [lx, lz, rx] of [
        [-0.145, 0.22, -0.22],
        [0.145, 0.22, -0.22],
        [-0.135, -0.24, 0.28],
        [0.135, -0.24, 0.28],
      ]) {
        const leg = buildTaperedCurve(
          [
            new THREE.Vector3(lx * 0.85, 0.26, lz),
            new THREE.Vector3(lx * 1.15, 0.14, lz - rx * 0.12),
            new THREE.Vector3(lx, 0.015, lz + 0.04),
          ],
          0.048,
          0.025,
          6,
          4,
          basaltInk,
        );
        g.add(leg);
      }
      const tail = buildTaperedCurve(
        [
          new THREE.Vector3(0, 0.28, -0.28),
          new THREE.Vector3(0.05, 0.34, -0.46),
          new THREE.Vector3(0.14, 0.46, -0.56),
        ],
        0.046,
        0.01,
        8,
        4,
        basaltInk,
      );
      g.add(tail);
      break;
    }

    case '005': {
      // TREMORHOUND (Plate 005 / P12): Low crouching dark-indigo layered origami wolf on concentric cyan rune discs,
      // glowing cyan diamond forehead sigil, cyan flank lightning bolts, and glowing cyan foreclaws.
      const discOuter = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.015, 5, 24), cyanMat);
      discOuter.rotation.x = Math.PI / 2;
      discOuter.position.y = 0.016;
      const discInner = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.014, 5, 20), cyanMat);
      discInner.rotation.x = Math.PI / 2;
      discInner.position.y = 0.016;
      const crackPad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.02, 8), basaltInk);
      crackPad.position.y = 0.01;
      g.add(crackPad, discOuter, discInner);

      const wolfIndigo = pal.get(0x20273a, { roughness: 0.76, metalness: 0.12 });
      const torsoPts = [
        new THREE.Vector2(0.08, 0),
        new THREE.Vector2(0.1, 0.18),
        new THREE.Vector2(0.135, 0.42),
        new THREE.Vector2(0.06, 0.56),
      ];
      const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 6), wolfIndigo);
      torso.rotation.x = Math.PI / 2 + 0.14;
      torso.scale.set(0.88, 1, 0.92);
      torso.position.set(0, 0.27, -0.26);
      torso.castShadow = true;
      g.add(torso);

      // Layered backward-swept jagged hackle shards on ruff + cyan flank bolts
      for (let i = 0; i < 4; i++) {
        const hackle = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22 - i * 0.02, 4), slateArmor);
        hackle.rotation.x = -0.92;
        hackle.position.set(0, 0.37 - i * 0.02, 0.2 - i * 0.12);
        g.add(hackle);
      }
      for (const sx of [-0.115, 0.115]) {
        const bolt = buildCutCardShape(
          [
            [-0.18, 0.01],
            [-0.04, 0.04],
            [0.02, -0.01],
            [0.16, 0.02],
            [0.04, -0.04],
            [-0.02, 0.01],
          ],
          0.02,
          cyanMat,
        );
        bolt.rotation.y = Math.PI / 2;
        bolt.position.set(sx, 0.24, 0);
        g.add(bolt);
      }

      // Low crouching wolf skull + ears + glowing cyan diamond forehead rune
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 5), wolfIndigo);
      head.rotation.x = Math.PI / 2 + 0.18;
      head.position.set(0, 0.31, 0.44);
      const sigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), cyanMat);
      sigil.scale.set(0.75, 0.28, 1.35);
      sigil.position.set(0, 0.37, 0.39);
      for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.12, 3), wolfIndigo);
        ear.position.set(sx * 0.055, 0.41, 0.33);
        ear.rotation.set(-0.25, 0, -sx * 0.22);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 5), cyanMat);
        eye.position.set(sx * 0.048, 0.32, 0.46);
        g.add(ear, eye);
      }

      // Crouching muscular legs + glowing cyan ground claws
      for (const [lx, lz, kneeZ] of [
        [-0.15, 0.22, 0.06],
        [0.15, 0.22, 0.06],
        [-0.14, -0.25, -0.08],
        [0.14, -0.25, -0.08],
      ]) {
        const leg = buildTaperedCurve(
          [
            new THREE.Vector3(lx * 0.8, 0.25, lz),
            new THREE.Vector3(lx * 1.12, 0.14, lz + kneeZ),
            new THREE.Vector3(lx, 0.025, lz + 0.04),
          ],
          0.042,
          0.024,
          6,
          5,
          wolfIndigo,
        );
        const pawGlow = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.075, 3), cyanMat);
        pawGlow.rotation.x = Math.PI / 2;
        pawGlow.position.set(lx, 0.03, lz + 0.085);
        g.add(leg, pawGlow);
      }
      const tail = buildTaperedCurve(
        [
          new THREE.Vector3(0, 0.26, -0.32),
          new THREE.Vector3(0, 0.22, -0.52),
          new THREE.Vector3(-0.04, 0.16, -0.64),
        ],
        0.045,
        0.014,
        6,
        5,
        slateArmor,
      );
      g.add(head, sigil, tail);
      break;
    }

    case '008': {
      // AEROKARST (Plate 008 / U01): Strictly HEADLESS atmospheric engine:
      // nested wind-vortex sphere core, vertical polar stack of orbs/discs, orbited symmetrically by 8 arc brackets.
      const eyeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), warmCream);
      eyeCore.position.y = 0.52;
      const perforatedShell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.19, 1),
        pal.get(0x303b4a, { roughness: 0.6, metalness: 0.25, transparent: true, opacity: 0.86 }),
      );
      perforatedShell.position.y = 0.52;
      const equatorHalo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.016, 6, 18), cyanMat);
      equatorHalo.rotation.x = Math.PI / 2;
      equatorHalo.position.y = 0.52;
      g.add(eyeCore, perforatedShell, equatorHalo);

      // Vertical stack of polar stone-metal spheres and disc nodes above and below
      for (const [dy, rad] of [
        [-0.36, 0.05],
        [-0.25, 0.085],
        [0.25, 0.085],
        [0.37, 0.055],
        [0.46, 0.03],
      ]) {
        const node = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.85, rad, 0.065, 8), slateArmor);
        node.position.y = 0.52 + dy;
        g.add(node);
      }

      // 8 curved segmented arc brackets orbiting core
      const orbitRig = new THREE.Group();
      orbitRig.position.y = 0.52;
      for (let i = 0; i < 8; i++) {
        const r = i < 4 ? 0.34 : 0.47;
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(r, 0.032, 5, 10, Math.PI * 0.42),
          i % 2 === 0 ? basaltInk : slateArmor,
        );
        arc.rotation.y = (i / 4) * Math.PI * 2 + (i >= 4 ? 0.4 : 0);
        arc.rotation.z = i % 2 === 0 ? 0.48 : -0.42;
        arc.castShadow = true;
        orbitRig.add(arc);
      }
      g.add(orbitRig);
      spinParts.push({ obj: orbitRig, axis: 'y', speed: 0.8 });
      break;
    }

    case '009': {
      // CLOUDMAW (Plate 009 / P11): Massive coiled billowing storm-cloud sea-serpent laced with gold lightning,
      // horned icy/storm jaws roaring downward above swirling spiral ocean/rain funnel waves.
      const oceanWaveMat = pal.get(0x4f92ad, { roughness: 0.48 });
      const stormCloudMat = pal.get(0xd7e3ee, { roughness: 0.88 });
      const darkStormMat = pal.get(0x3a485e, { roughness: 0.78 });

      const vortexFunnel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.06, 0.36, 12, 1, true),
        pal.get(0x7fb4cc, { transparent: true, opacity: 0.5 }),
      );
      vortexFunnel.position.y = 0.18;
      const baseWave = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 5, 14, Math.PI * 1.6), oceanWaveMat);
      baseWave.rotation.x = Math.PI / 2;
      baseWave.position.y = 0.05;
      g.add(vortexFunnel, baseWave);

      const coilGroup = new THREE.Group();
      const coilPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const a = t * Math.PI * 2.15;
        const r = THREE.MathUtils.lerp(0.36, 0.18, t);
        coilPts.push(new THREE.Vector3(Math.cos(a) * r, 0.16 + t * 0.56, Math.sin(a) * r));
      }
      const serpentBody = buildTaperedCurve(coilPts, 0.06, 0.145, 22, 7, darkStormMat);
      coilGroup.add(serpentBody);

      // Sculpted paper cloud puffs & golden lightning fins along storm serpent coils
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const pt = new THREE.CatmullRomCurve3(coilPts).getPointAt(t);
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.095 - t * 0.015, 0), stormCloudMat);
        puff.position.set(pt.x * 1.15, pt.y + 0.04, pt.z * 1.15);
        const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), brassMat);
        spark.position.set(pt.x * 0.88, pt.y + 0.09, pt.z * 0.88);
        coilGroup.add(puff, spark);
      }

      // Sculpted open storm-dragon jaws & glowing gold/cyan maw
      const headGroup = new THREE.Group();
      headGroup.position.set(0.14, 0.74, 0.1);
      headGroup.rotation.y = -0.5;
      const upperJaw = new THREE.Mesh(new THREE.ConeGeometry(0.125, 0.28, 5), stormCloudMat);
      upperJaw.rotation.x = Math.PI / 2 - 0.18;
      upperJaw.position.set(0, 0.04, 0.1);
      const lowerJaw = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), darkStormMat);
      lowerJaw.rotation.x = Math.PI / 2 + 0.35;
      lowerJaw.position.set(0, -0.05, 0.08);
      const mawCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.072, 0), cyanMat);
      mawCore.position.set(0, 0, 0.08);
      headGroup.add(upperJaw, lowerJaw, mawCore);
      coilGroup.add(headGroup);
      g.add(coilGroup);
      spinParts.push({ obj: coilGroup, axis: 'y', speed: 0.55 });
      break;
    }

    case '012': {
      // VORTENBRAY (Plate 012 / P11): Inverted vortex tornado of concentric upper gold-lit rings
      // spiraling downward into an INVERTED FLOATING SPIRE CITADEL (NO wings/dragon head).
      const spireCitadel = new THREE.Group();
      spireCitadel.position.y = 0.28;
      // Inverted pyramidal floating island rock & upright golden towers on top
      const rockCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.26, 7), slateArmor);
      rockCone.rotation.x = Math.PI;
      rockCone.position.y = -0.1;
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.27, 0.04, 8), warmCream);
      spireCitadel.add(rockCone, deck);
      for (const [tx, tz, th] of [
        [0, 0, 0.24],
        [-0.12, 0.08, 0.15],
        [0.14, -0.06, 0.17],
        [-0.08, -0.12, 0.13],
      ]) {
        const tower = new THREE.Mesh(new THREE.ConeGeometry(0.036, th, 4), brassMat);
        tower.position.set(tx, th / 2 + 0.02, tz);
        spireCitadel.add(tower);
      }
      g.add(spireCitadel);

      // Spiraling inverted funnel helix ascending into wide golden concentric sky rings
      const funnel = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const r = THREE.MathUtils.lerp(0.16, 0.52, t);
        const y = THREE.MathUtils.lerp(0.32, 0.9, t);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(r, 0.024, 5, 22, Math.PI * 1.55),
          i % 2 === 0 ? brassMat : slateArmor,
        );
        ring.position.y = y;
        ring.rotation.x = Math.PI / 2 + (i % 2 === 0 ? 0.16 : -0.14);
        ring.rotation.z = i * 0.9;
        ring.castShadow = true;
        funnel.add(ring);
      }
      // Ascending spiral gold-cyan conduit ribbon
      const helixPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const a = t * Math.PI * 3.2;
        const r = THREE.MathUtils.lerp(0.1, 0.42, t);
        helixPts.push(new THREE.Vector3(Math.cos(a) * r, 0.3 + t * 0.6, Math.sin(a) * r));
      }
      const helix = buildTaperedCurve(helixPts, 0.015, 0.032, 24, 5, brassMat);
      funnel.add(helix);
      g.add(funnel);
      spinParts.push({ obj: funnel, axis: 'y', speed: 0.95 });
      break;
    }

    case '015': {
      // VERDGORGE (Plate 015 / U01): Forest titan quadruped with exposed wooden/ivory RIBCAGE, bark pillar legs,
      // tiered emerald leaf canopy, pink spore mushrooms, and sweeping branched STAG-ANTLER BOUGHS.
      const foliage = pal.get(0x4c8248, { roughness: 0.86 });
      const brightLeaf = pal.get(0x6da652, { roughness: 0.84 });
      const sporePink = pal.get(0xee8cbf, { emissive: 0x7a2654, emissiveIntensity: 0.36 });

      for (const [lx, lz] of [
        [-0.22, 0.24],
        [0.22, 0.24],
        [-0.22, -0.24],
        [0.22, -0.24],
      ]) {
        const leg = buildTaperedCurve(
          [
            new THREE.Vector3(lx * 0.85, 0.44, lz),
            new THREE.Vector3(lx * 1.04, 0.22, lz),
            new THREE.Vector3(lx * 1.15, 0.015, lz),
          ],
          0.072,
          0.105,
          6,
          6,
          bronzeMat,
        );
        g.add(leg);
      }
      // Exposed curved wooden ribcage arches + glowing inner moss spine
      const spine = buildTaperedCurve(
        [new THREE.Vector3(0, 0.52, -0.34), new THREE.Vector3(0, 0.58, 0.32)],
        0.075,
        0.095,
        6,
        6,
        bronzeMat,
      );
      g.add(spine);
      for (let r = -2; r <= 2; r++) {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(0.22 - Math.abs(r) * 0.02, 0.022, 5, 12, Math.PI * 1.25),
          ivoryBone,
        );
        rib.position.set(0, 0.44, r * 0.095);
        rib.rotation.z = Math.PI * 0.88;
        g.add(rib);
      }
      // Tiered origami canopy foliage & pink spore mushroom caps
      for (const [cx, cy, cz, cr, col] of [
        [0, 0.72, -0.08, 0.24, foliage],
        [-0.18, 0.65, -0.18, 0.16, brightLeaf],
        [0.18, 0.64, -0.14, 0.17, brightLeaf],
        [0, 0.68, 0.16, 0.14, foliage],
      ] as const) {
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 0), col);
        bush.position.set(cx, cy, cz);
        bush.castShadow = true;
        g.add(bush);
      }
      // Sweeping branched wooden stag antlers adorned with pink spore blossoms
      for (const sx of [-1, 1]) {
        const mainAntler = buildTaperedCurve(
          [
            new THREE.Vector3(sx * 0.08, 0.62, 0.28),
            new THREE.Vector3(sx * 0.24, 0.78, 0.32),
            new THREE.Vector3(sx * 0.32, 0.96, 0.22),
          ],
          0.032,
          0.012,
          8,
          5,
          bronzeMat,
        );
        const browTine = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.18, 4), bronzeMat);
        browTine.position.set(sx * 0.22, 0.82, 0.42);
        browTine.rotation.set(0.6, 0, -sx * 0.45);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.04, 6), sporePink);
        cap.position.set(sx * 0.28, 0.92, 0.25);
        g.add(mainAntler, browTine, cap);
      }
      break;
    }

    case '019': {
      // TERRAGULLET (Plate 019 / P12): Jawless colossal bronze tunneling worm
      // fronted by a SPINNING CONICAL HELICAL AUGER DRILL NOSE, slatted bio-compost bays glowing LIME GREEN.
      for (let s = 0; s < 5; s++) {
        const z = -0.44 + s * 0.17;
        const hull = new THREE.Mesh(
          new THREE.CylinderGeometry(0.225, 0.225, 0.11, 10),
          s % 2 === 0 ? bronzeMat : slateArmor,
        );
        hull.rotation.x = Math.PI / 2;
        hull.position.set(0, 0.24, z);
        hull.castShadow = true;
        g.add(hull);
        if (s > 0) {
          const bioCore = new THREE.Mesh(new THREE.SphereGeometry(0.185, 8, 8), limeBio);
          bioCore.position.set(0, 0.24, z - 0.085);
          g.add(bioCore);
        }
      }
      // Conical multi-tiered helical rotary stone-grinder nose (NO jaws!)
      const drillGroup = new THREE.Group();
      drillGroup.position.set(0, 0.24, 0.34);
      for (let d = 0; d < 4; d++) {
        const r = 0.21 - d * 0.042;
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, 0.075, 8), d % 2 === 0 ? brassMat : bronzeMat);
        disc.rotation.x = Math.PI / 2;
        disc.position.z = d * 0.068;
        drillGroup.add(disc);
      }
      const drillTip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.14, 6), limeBio);
      drillTip.rotation.x = Math.PI / 2;
      drillTip.position.z = 0.31;
      drillGroup.add(drillTip);
      g.add(drillGroup);
      spinParts.push({ obj: drillGroup, axis: 'z', speed: 2.6 });
      break;
    }

    case '023': {
      // BRINECHOIR (Plate 023 / U01): Translucent sea-glass turquoise crystalline leviathan
      // etched with glowing alchemy circles, serrated jaw snout, trailing sweeping layered ribbon-fins.
      const seaGlass = pal.get(0x8be2dc, {
        map: tex.alchemyGlass,
        transparent: true,
        opacity: 0.78,
        roughness: 0.25,
        metalness: 0.1,
        emissive: 0x1a6864,
        emissiveIntensity: 0.35,
      });
      const leviBody = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.62, 6), seaGlass);
      leviBody.rotation.x = Math.PI / 2;
      leviBody.scale.set(1.22, 0.72, 1);
      leviBody.position.set(0, 0.26, 0.18);
      leviBody.castShadow = true;
      g.add(leviBody);

      // Serrated lower crystal jaw + white crystal teeth
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 5), warmCream);
      snout.rotation.x = Math.PI / 2 + 0.12;
      snout.scale.set(1.1, 0.55, 1);
      snout.position.set(0, 0.2, 0.34);
      g.add(snout);

      // 6 swept curved translucent alchemy ribbon-fins arcing cleanly backward
      for (let i = 0; i < 6; i++) {
        const sx = i % 2 === 0 ? -1 : 1;
        const tier = Math.floor(i / 2);
        const fin = buildCutCardShape(
          [
            [0, 0],
            [0.08, 0.18],
            [-0.48, 0.28],
            [-0.64, 0.1],
            [-0.22, -0.02],
          ],
          0.016,
          seaGlass,
        );
        fin.position.set(sx * (0.12 + tier * 0.06), 0.26 + tier * 0.08, 0.12 - tier * 0.1);
        fin.rotation.y = sx * (Math.PI / 2 + 0.35);
        fin.rotation.z = sx * 0.25;
        g.add(fin);
      }
      break;
    }

    case '026': {
      // GLACIERTHROAT (Plate 026 / U01): Pale-blue fenestrated/perforated arching neck & predatory jaw
      // pouring a crystal ice torrent onto ice cliffs, backed by VAST FAN-RIBBED WHITE ORIGAMI SAIL WINGS.
      const iceBlue = pal.get(0x88cde8, { roughness: 0.36, metalness: 0.12 });
      const frostSail = pal.get(0xf4f8fc, { transparent: true, opacity: 0.88, roughness: 0.65 });

      const iceCliffs = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.14, 6), iceBlue);
      iceCliffs.position.y = 0.07;
      const archNeck = buildTaperedCurve(
        [
          new THREE.Vector3(0, 0.12, -0.24),
          new THREE.Vector3(0, 0.44, -0.18),
          new THREE.Vector3(0, 0.66, 0.04),
          new THREE.Vector3(0, 0.6, 0.24),
        ],
        0.15,
        0.09,
        10,
        6,
        iceBlue,
      );
      const jawUpper = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 5), iceBlue);
      jawUpper.rotation.x = Math.PI / 2 + 0.45;
      jawUpper.position.set(0, 0.59, 0.34);
      const frostStream = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.48, 5), cyanMat);
      frostStream.position.set(0, 0.34, 0.28);
      g.add(iceCliffs, archNeck, jawUpper, frostStream);

      // Pair of wide fan-ribbed white origami pressure-sail wings
      for (const sx of [-1, 1]) {
        const wingSail = buildCutCardShape(
          [
            [0, 0],
            [sx * 0.26, 0.44],
            [sx * 0.56, 0.36],
            [sx * 0.62, 0.08],
            [sx * 0.18, -0.1],
          ],
          0.018,
          frostSail,
        );
        wingSail.position.set(sx * 0.06, 0.56, -0.06);
        wingSail.rotation.y = -sx * 0.28;
        g.add(wingSail);
        // Dark ice-blue structural wing ribs
        for (const [rx, ry] of [
          [0.24, 0.42],
          [0.52, 0.34],
          [0.58, 0.08],
        ]) {
          const rib = buildTaperedCurve(
            [new THREE.Vector3(sx * 0.06, 0.56, -0.05), new THREE.Vector3(sx * (0.06 + rx), 0.56 + ry, -0.15)],
            0.014,
            0.008,
            4,
            4,
            iceBlue,
          );
          g.add(rib);
        }
      }
      break;
    }

    case '029': {
      // RINGTHROAT (Plate 029 / U01): 4-legged splayed bronze gantry tripod holding column-neck with exposed
      // glowing red-black belly core behind ribs, flared nozzle with 3 glowing cyan containment rings & crimson slurry column.
      const ringGroup = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const strut = buildTaperedCurve(
          [
            new THREE.Vector3(Math.cos(a) * 0.14, 0.38, Math.sin(a) * 0.14),
            new THREE.Vector3(Math.cos(a) * 0.32, 0.24, Math.sin(a) * 0.32),
            new THREE.Vector3(Math.cos(a) * 0.42, 0.015, Math.sin(a) * 0.42),
          ],
          0.048,
          0.055,
          5,
          5,
          bronzeMat,
        );
        ringGroup.add(strut);
      }
      // Glowing distended red-black pressure belly caged inside vertical ribs
      const belly = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 1), crimsonMat);
      belly.scale.set(0.95, 1.25, 0.95);
      belly.position.y = 0.38;
      for (let r = 0; r < 6; r++) {
        const a = (r / 6) * Math.PI * 2;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.34, 0.035), basaltInk);
        rib.position.set(Math.cos(a) * 0.16, 0.38, Math.sin(a) * 0.16);
        ringGroup.add(rib);
      }
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.165, 0.36, 8), slateArmor);
      shaft.position.y = 0.64;
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.105, 0.16, 10), bronzeMat);
      bell.position.y = 0.88;
      // Triple glowing cyan containment rings around extruding crimson plume
      const haloGroup = new THREE.Group();
      haloGroup.position.y = 0.98;
      for (const [ry, rr] of [
        [0, 0.25],
        [0.06, 0.27],
        [0.12, 0.24],
      ]) {
        const cRing = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.01, 5, 18), cyanMat);
        cRing.rotation.x = Math.PI / 2;
        cRing.position.y = ry;
        haloGroup.add(cRing);
      }
      const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.135, 0.28, 8), crimsonMat);
      plume.position.y = 1.04;
      ringGroup.add(belly, shaft, bell, haloGroup, plume);
      g.add(ringGroup);
      spinParts.push({ obj: haloGroup, axis: 'y', speed: 1.4 });
      break;
    }

    case '030': {
      // SOLNEXUS (Plate 030 / P12): Braided gold serpent coil studded with dorsal gravity spire masts
      // looping around a glowing faceted golden star, flanked by RAINBOW-PRISMATIC STAINED-GLASS WINGS.
      const prismMat = pal.get(0xffffff, {
        map: tex.prismRainbow,
        emissive: 0x332244,
        emissiveIntensity: 0.24,
        roughness: 0.32,
        metalness: 0.18,
      });
      const sunCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.175, 1), amberMagma);
      sunCore.position.y = 0.48;
      g.add(sunCore);

      const coilGroup = new THREE.Group();
      coilGroup.position.y = 0.48;
      const spiralPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const a = t * Math.PI * 2.3;
        spiralPts.push(new THREE.Vector3(Math.cos(a) * 0.33, (t - 0.5) * 0.36, Math.sin(a) * 0.33));
      }
      const coilBody = buildTaperedCurve(spiralPts, 0.018, 0.044, 24, 6, brassMat);
      coilGroup.add(coilBody);
      // Gravity spire masts radiating outward along spiral body
      for (let i = 2; i < 14; i += 2) {
        const pt = spiralPts[i];
        const mast = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.15, 4), warmCream);
        mast.position.copy(pt).multiplyScalar(1.25);
        mast.lookAt(pt.clone().multiplyScalar(2));
        mast.rotateX(Math.PI / 2);
        coilGroup.add(mast);
      }
      // Twin rainbow-prismatic triangular stained-glass crystal wings
      for (const sx of [-1, 1]) {
        const wing = buildCutCardShape(
          [
            [0, 0],
            [sx * 0.26, 0.28],
            [sx * 0.44, 0.14],
            [sx * 0.34, -0.08],
          ],
          0.02,
          prismMat,
        );
        wing.position.set(sx * 0.24, 0.08, 0);
        wing.rotation.y = -sx * 0.22;
        coilGroup.add(wing);
      }
      g.add(coilGroup);
      spinParts.push({ obj: coilGroup, axis: 'y', speed: 0.85 });
      break;
    }

    case '032': {
      // LYRIBORIS (Plate 032 / P12): Completely HEADLESS undulating turquoise-and-cream striped sky-ribbon
      // studded with upright U-SHAPED TWO-PRONGED TUNING FORK ANTENNAE above parabolic radar dishes!
      const wyrm = new THREE.Group();
      const ribbonPts = [
        new THREE.Vector3(-0.52, 0.3, 0.12),
        new THREE.Vector3(-0.24, 0.52, -0.1),
        new THREE.Vector3(0.06, 0.34, 0.16),
        new THREE.Vector3(0.32, 0.54, -0.08),
        new THREE.Vector3(0.56, 0.38, 0.08),
      ];
      const curve = new THREE.CatmullRomCurve3(ribbonPts);
      for (let i = 0; i < 11; i++) {
        const t = i / 10;
        const pt = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(0.115, 0.032, 0.17),
          i % 2 === 0 ? cyanMat : warmCream,
        );
        plate.position.copy(pt);
        plate.rotation.y = Math.atan2(tangent.z, tangent.x);
        plate.rotation.z = tangent.y * 0.9;
        plate.castShadow = true;
        wyrm.add(plate);

        // Two-pronged U-shaped tuning-fork antenna mast along spine
        if (i % 2 === 0) {
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 5), brassMat);
          stem.position.set(pt.x, pt.y + 0.08, pt.z);
          const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.014, 0.014), brassMat);
          crossbar.position.set(pt.x, pt.y + 0.15, pt.z);
          wyrm.add(stem, crossbar);
          for (const px of [-0.026, 0.026]) {
            const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 5), warmCream);
            prong.position.set(pt.x + px, pt.y + 0.21, pt.z);
            wyrm.add(prong);
          }
        }
      }
      // Concrete/slate parabolic ground radar dish receivers below
      for (const [dx, dz] of [
        [-0.26, 0.18],
        [0.18, -0.14],
      ]) {
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.14, 6), slateArmor);
        pedestal.position.set(dx, 0.07, dz);
        const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.08, 10, 1, true), warmCream);
        bowl.position.set(dx, 0.16, dz);
        bowl.rotation.set(-Math.PI * 0.72, 0, 0.25);
        g.add(pedestal, bowl);
      }
      g.add(wyrm);
      waveParts.push({ obj: wyrm, baseY: 0, amp: 0.028, speed: 1.45, phase: 0.4 });
      break;
    }

    case '036': {
      // SINGULARARCH (Plate 036 / P10 / P13): Fractured white-and-slate curved origami sphere
      // parted cleanly to expose a concentric SQUARE DIAMOND MATRIX FRACTAL CORE + orbiting flying glyph tiles!
      const tileMat = pal.get(0xffffff, {
        map: tex.matrixTile,
        emissive: 0x10405a,
        emissiveIntensity: 0.35,
        roughness: 0.45,
      });
      // Concentric glowing nested square diamond core inside
      for (const [sz, col] of [
        [0.2, cyanMat],
        [0.13, warmCream],
        [0.07, cyanMat],
      ] as const) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), col);
        box.position.y = 0.5;
        box.rotation.set(Math.PI / 4, Math.PI / 4, 0);
        g.add(box);
      }
      // Fractured curved white origami armor shell arcs & equator slotted ring
      const shellsGroup = new THREE.Group();
      shellsGroup.position.y = 0.5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const panel = buildCutCardShape(
          [
            [-0.14, -0.16],
            [0.14, -0.12],
            [0.16, 0.16],
            [-0.12, 0.14],
          ],
          0.022,
          i % 2 === 0 ? warmCream : slateArmor,
        );
        panel.position.set(Math.cos(a) * 0.28, Math.sin(i * 1.3) * 0.12, Math.sin(a) * 0.28);
        panel.lookAt(0, 0, 0);
        shellsGroup.add(panel);
      }
      const eqRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.026, 5, 18, Math.PI * 1.4), warmCream);
      eqRing.rotation.x = Math.PI / 2 + 0.25;
      shellsGroup.add(eqRing);
      g.add(shellsGroup);
      spinParts.push({ obj: shellsGroup, axis: 'y', speed: 0.65 });

      for (let i = 0; i < 6; i++) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.17, 0.022), tileMat);
        tile.castShadow = true;
        g.add(tile);
        orbitParts.push({
          obj: tile,
          radius: 0.46,
          phase: (i / 6) * Math.PI * 2,
          speed: 0.8,
          y: 0.5 + (i % 2 === 0 ? 0.1 : -0.1),
        });
      }
      break;
    }

    case '037': {
      // IRONCANT (Plate 037 / P10 / P13): Bull-shouldered slag-black iron furnace knight/colossus
      // with glowing vertical orange furnace grate chest, riveted gauntlets & twin smokestack horns puffing smoke.
      const legs = new THREE.Group();
      for (const sx of [-0.15, 0.15]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.32, 6), basaltInk);
        leg.position.set(sx, 0.16, 0);
        leg.castShadow = true;
        legs.add(leg);
      }
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.36, 6), slateArmor);
      torso.scale.set(1.2, 1, 0.78);
      torso.position.y = 0.48;
      torso.castShadow = true;
      const chestFire = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.06), amberMagma);
      chestFire.position.set(0, 0.48, 0.145);
      // 4 dark iron vertical furnace grate bars across glowing core
      for (let r = -1.5; r <= 1.5; r += 1) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.22, 0.028), basaltInk);
        bar.position.set(r * 0.055, 0.48, 0.175);
        g.add(bar);
      }
      // Broad sloped angular bull pauldrons + heavy articulated gauntlets + twin smokestack horns
      for (const sx of [-1, 1]) {
        const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 5), basaltInk);
        pauldron.position.set(sx * 0.25, 0.61, 0);
        pauldron.rotation.z = -sx * 0.9;
        const arm = buildTaperedCurve(
          [
            new THREE.Vector3(sx * 0.26, 0.56, 0),
            new THREE.Vector3(sx * 0.32, 0.38, 0.04),
            new THREE.Vector3(sx * 0.3, 0.22, 0.09),
          ],
          0.075,
          0.088,
          6,
          6,
          slateArmor,
        );
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.056, 0.25, 7), basaltInk);
        stack.position.set(sx * 0.15, 0.81, -0.02);
        stack.rotation.z = -sx * 0.26;
        const smoke = new THREE.Mesh(new THREE.DodecahedronGeometry(0.062, 0), warmCream);
        smoke.position.set(sx * 0.19, 0.96, -0.02);
        g.add(pauldron, arm, stack, smoke);
      }
      const helm = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 5), basaltInk);
      helm.position.set(0, 0.72, 0.04);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.024, 0.05), amberMagma);
      visor.position.set(0, 0.7, 0.095);
      g.add(legs, torso, chestFire, helm, visor);
      break;
    }

    case '044': {
      // GOREVAULT (Plate 044 / P10 / P13): Colossal hunched armored bioforge hulk with big clawed forelimbs,
      // dorsal smokestack silo towers, glowing side arches & 6 hanging translucent CRIMSON/AMBER RESERVOIR FLASKS.
      const hullArch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.26, 0.68, 8, 1, false, 0, Math.PI),
        basaltInk,
      );
      hullArch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      hullArch.position.set(0, 0.42, 0);
      hullArch.castShadow = true;
      g.add(hullArch);

      // 4 dorsal furnace silo towers
      for (const sz of [-0.24, -0.08, 0.08, 0.24]) {
        const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.2, 7), slateArmor);
        silo.position.set(0, 0.68, sz);
        const glowRim = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 7), cyanMat);
        glowRim.position.set(0, 0.74, sz);
        g.add(silo, glowRim);
      }
      // 6 hanging glowing crimson/amber biomass reservoir flasks under belly
      for (const sx of [-0.145, 0.145]) {
        for (const bz of [-0.18, 0, 0.18]) {
          const flask = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.1, 4, 7), amberMagma);
          flask.position.set(sx, 0.25, bz);
          const coreDrop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), crimsonMat);
          coreDrop.position.set(sx, 0.22, bz);
          g.add(flask, coreDrop);
        }
      }
      // Massive front clawed excavator forelimbs & 4 rear crawler legs
      for (const sx of [-1, 1]) {
        const foreArm = buildTaperedCurve(
          [
            new THREE.Vector3(sx * 0.2, 0.44, 0.28),
            new THREE.Vector3(sx * 0.28, 0.26, 0.42),
            new THREE.Vector3(sx * 0.22, 0.05, 0.48),
          ],
          0.072,
          0.045,
          6,
          5,
          slateArmor,
        );
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), ivoryBone);
        claw.rotation.x = Math.PI * 0.62;
        claw.position.set(sx * 0.22, 0.04, 0.56);
        g.add(foreArm, claw);
        for (const lz of [-0.08, -0.3]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.08), slateArmor);
          leg.position.set(sx * 0.26, 0.17, lz);
          leg.rotation.z = sx * 0.24;
          g.add(leg);
        }
      }
      // Arched armored scythe head
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 5), basaltInk);
      head.rotation.x = Math.PI / 2 + 0.35;
      head.position.set(0, 0.4, 0.42);
      g.add(head);
      break;
    }

    case '045': {
      // LEXICLAST (Plate 045 / P10 / P13): Towering hollow IVORY BONE RIBCAGE COLOSSUS with perforated
      // multi-cavity skull maw spewing 3 waving ROYAL-BLUE SCRIPT GLYPH RIBBONS & orbiting vowel glyphs!
      const ribbonMat = pal.get(0xffffff, {
        map: tex.glyphRibbon,
        emissive: 0x163868,
        emissiveIntensity: 0.42,
        roughness: 0.48,
      });
      const ribCage = new THREE.Group();
      for (let r = 0; r < 5; r++) {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(0.24 - r * 0.025, 0.024, 5, 14, Math.PI * 1.45),
          ivoryBone,
        );
        rib.position.y = 0.16 + r * 0.11;
        rib.rotation.x = Math.PI / 2 + 0.32;
        rib.rotation.z = Math.PI * 0.78;
        rib.castShadow = true;
        ribCage.add(rib);
      }
      // Sculpted perforated horned skull with dark vocal throat cavities
      const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), ivoryBone);
      skull.scale.set(0.95, 1.05, 1.32);
      skull.position.set(0, 0.68, 0.1);
      skull.castShadow = true;
      ribCage.add(skull);
      for (const [vx, vy, vr] of [
        [-0.065, 0.72, 0.048],
        [0.065, 0.72, 0.048],
        [0, 0.62, 0.062],
        [-0.08, 0.63, 0.036],
        [0.08, 0.63, 0.036],
      ]) {
        const socket = new THREE.Mesh(new THREE.SphereGeometry(vr, 6, 6), basaltInk);
        socket.position.set(vx, vy, 0.24);
        ribCage.add(socket);
      }
      // Orbiting skull glyph crescents
      for (const sx of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.18, 4), ivoryBone);
        horn.position.set(sx * 0.16, 0.8, 0.02);
        horn.rotation.z = -sx * 0.6;
        ribCage.add(horn);
      }
      // 3 billowing wave-curved royal-blue glyph ribbons pouring from jaw
      for (let i = -1; i <= 1; i++) {
        const ribPts = [
          new THREE.Vector3(i * 0.04, 0.61, 0.24),
          new THREE.Vector3(i * 0.14, 0.45, 0.42),
          new THREE.Vector3(i * 0.2, 0.26, 0.56),
          new THREE.Vector3(i * 0.24, 0.08, 0.7),
        ];
        const ribbon = buildTaperedCurve(ribPts, 0.032, 0.024, 10, 4, ribbonMat);
        ribbon.scale.set(1.8, 0.38, 1);
        ribCage.add(ribbon);
      }
      g.add(ribCage);
      break;
    }

    case '055': {
      // FOLDHOWL (Plate 055 / P10 / P13): Sleek predatory dark faceted origami wolf
      // cleanly sliced into offset chunks by razor-sharp HORIZONTAL GLOWING CYAN & MAGENTA GLITCH PLANES.
      const legs = [
        [-0.14, 0.24],
        [0.14, 0.24],
        [-0.13, -0.25],
        [0.13, -0.25],
      ];
      for (const [lx, lz] of legs) {
        const leg = buildTaperedCurve(
          [
            new THREE.Vector3(lx, 0.34, lz),
            new THREE.Vector3(lx * 1.1, 0.17, lz),
            new THREE.Vector3(lx, 0.02, lz + 0.04),
          ],
          0.048,
          0.024,
          6,
          4,
          basaltInk,
        );
        g.add(leg);
      }
      // Offset faceted wolf torso slabs + pointed wolf snout & ears + glowing cyan eyes
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.13, 0.56), slateArmor);
      lowerBody.position.set(-0.045, 0.34, -0.02);
      const upperBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.52), basaltInk);
      upperBody.position.set(0.055, 0.49, 0.01);
      upperBody.castShadow = true;

      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 4), basaltInk);
      snout.rotation.x = Math.PI / 2 + 0.1;
      snout.position.set(0.05, 0.57, 0.38);
      for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.15, 3), basaltInk);
        ear.position.set(0.05 + sx * 0.06, 0.68, 0.26);
        ear.rotation.z = -sx * 0.2;
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), cyanMat);
        eye.position.set(0.05 + sx * 0.055, 0.585, 0.42);
        g.add(ear, eye);
      }
      const tail = buildTaperedCurve(
        [
          new THREE.Vector3(0.02, 0.46, -0.26),
          new THREE.Vector3(-0.08, 0.38, -0.48),
          new THREE.Vector3(-0.14, 0.26, -0.62),
        ],
        0.065,
        0.018,
        6,
        4,
        basaltInk,
      );

      // Stark horizontal glowing magenta & cyan spatial-tear ribbon strips slicing wolf cleanly
      for (const [sy, mat, ox, oz] of [
        [0.415, magentaSlice, 0.08, 0.04],
        [0.54, cyanMat, -0.08, -0.02],
        [0.25, cyanMat, 0.06, 0.08],
        [0.62, magentaSlice, 0.09, 0.26],
      ] as const) {
        const slicePlane = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.52), mat);
        slicePlane.position.set(ox, sy, oz);
        g.add(slicePlane);
      }
      g.add(lowerBody, upperBody, snout, tail);
      break;
    }

    case '059': {
      // DRAKKEN EGG (Plate 059 / P01): Point-down vertical faceted dark-obsidian geode
      // with glowing cyan barcode fracture seams + cutaway cavity showing nested spiral barcode rings around diamond core.
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.065, 6), warmCream);
      base.position.y = 0.032;
      g.add(base);

      const eggBody = new THREE.Group();
      eggBody.position.y = 0.56;
      // Back & left faceted obsidian shell halves framing an exposed glowing interior window
      const backLower = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.46, 6, 1, false, Math.PI * 0.25, Math.PI * 1.45),
        basaltInk,
      );
      backLower.rotation.x = Math.PI;
      backLower.position.y = -0.23;
      const backUpper = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.46, 6, 1, false, Math.PI * 0.25, Math.PI * 1.45),
        basaltInk,
      );
      backUpper.position.y = 0.23;
      // Radiant faceted cyan diamond core + 3 inner barcode rings inside cutaway
      const coreDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.115, 0), cyanMat);
      coreDiamond.scale.set(0.8, 1.45, 0.8);
      eggBody.add(backLower, backUpper, coreDiamond);
      for (const cy of [-0.14, 0, 0.14]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17 - Math.abs(cy) * 0.25, 0.018, 5, 16), barcodeMat);
        ring.rotation.x = Math.PI / 2 + cy * 0.6;
        ring.position.y = cy;
        eggBody.add(ring);
      }
      g.add(eggBody);
      waveParts.push({ obj: eggBody, baseY: 0.56, amp: 0.022, speed: 1.5, phase: 0 });
      break;
    }

    case '060':
    default: {
      // MOTHER (Plate 060 / P00_060_MOTHER_papercraft_accepted.png):
      // Purple/lavender continent-plated living planet etched with concentric cyan glyph hubs & branching veins,
      // wrapped in folded white/cream faceted paper cloud ribbons, orbited by fine gold wire ring with 7 mini-Egg geodes!
      const planetMat = pal.get(0xffffff, {
        map: tex.motherSurface,
        roughness: 0.76,
        metalness: 0.06,
      });
      const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), planetMat);
      globe.position.y = 0.5;
      globe.castShadow = true;
      g.add(globe);

      // Sculpted layered faceted cream-white paper cloud ribbons curving diagonally around globe
      for (const [ry, rz, tiltX, rad] of [
        [0.42, 0.35, 1.15, 0.465],
        [0.58, -0.45, -1.05, 0.475],
      ]) {
        const cloud = new THREE.Mesh(
          new THREE.TorusGeometry(rad, 0.036, 4, 16, Math.PI * 1.25),
          warmCream,
        );
        cloud.position.y = ry;
        cloud.rotation.set(tiltX, 0.25, rz);
        cloud.castShadow = true;
        g.add(cloud);
      }

      // Inclined fine gold wire orbital ring bearing 7 miniature faceted obsidian-and-cyan Egg geodes!
      const eggHalo = new THREE.Group();
      eggHalo.position.y = 0.52;
      eggHalo.rotation.set(0.28, 0, -0.22);
      const wireRing = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.008, 5, 32), brassMat);
      wireRing.rotation.x = Math.PI / 2;
      eggHalo.add(wireRing);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const miniEgg = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), basaltInk);
        miniEgg.scale.set(0.7, 1.45, 0.7);
        miniEgg.position.set(Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56);
        const miniCrack = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.007, 4, 8), cyanMat);
        miniCrack.rotation.x = Math.PI / 2;
        miniCrack.position.copy(miniEgg.position);
        eggHalo.add(miniEgg, miniCrack);
      }
      g.add(eggHalo);
      spinParts.push({ obj: globe, axis: 'y', speed: 0.14 }, { obj: eggHalo, axis: 'y', speed: 0.22 });
      break;
    }
  }

  return {
    id,
    group: g,
    animate: (elapsed: number, active = true) => {
      if (!active) return;
      for (const s of spinParts) {
        s.obj.rotation[s.axis] = elapsed * s.speed;
      }
      for (const o of orbitParts) {
        const a = o.phase + elapsed * o.speed;
        o.obj.position.set(Math.cos(a) * o.radius, o.y + Math.sin(elapsed * 2 + o.phase) * 0.03, Math.sin(a) * o.radius);
        o.obj.rotation.y = -a;
      }
      for (const w of waveParts) {
        w.obj.position.y = w.baseY + Math.sin(elapsed * w.speed + w.phase) * w.amp;
      }
    },
  };
}
