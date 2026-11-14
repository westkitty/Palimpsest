import * as THREE from 'three';
import { DraxisId } from '../../types/atlas';

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
    },
  ): THREE.MeshStandardMaterial {
    const r = opts?.roughness ?? 0.8;
    const m = opts?.metalness ?? 0.1;
    const e = opts?.emissive ?? 0x000000;
    const ei = opts?.emissiveIntensity ?? 0;
    const t = opts?.transparent ? 1 : 0;
    const op = opts?.opacity ?? 1;
    const key = `${color}_${r}_${m}_${e}_${ei}_${t}_${op}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const mat = new THREE.MeshStandardMaterial({
      color,
      bumpMap: this.paperBump,
      bumpScale: 0.008,
      roughness: r,
      metalness: m,
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
 * Source-grounded modular 3D reconstructions of all 21 DRAXIS specimens (plates 001..060),
 * faithful to the original plate silhouettes, paper-craft facets, and functional mechanics.
 */
export function buildDraxisModel(id: DraxisId, paperBump: THREE.Texture): DraxisRig {
  const g = new THREE.Group();
  const pal = new LocalMatPalette(paperBump);

  const basaltInk = pal.get(0x232730, { roughness: 0.72, metalness: 0.18 });
  const slateArmor = pal.get(0x46505e, { roughness: 0.68, metalness: 0.24 });
  const warmCream = pal.get(0xece2cc, { roughness: 0.85, metalness: 0.04 });
  const bronzeMat = pal.get(0x7c5c44, { roughness: 0.56, metalness: 0.35 });
  const brassMat = pal.get(0xc6a35c, { roughness: 0.36, metalness: 0.76 });
  const cyanMat = pal.get(0x48d2f0, { emissive: 0x15708a, emissiveIntensity: 0.52, roughness: 0.32 });
  const magentaSlice = pal.get(0xd94ea8, { emissive: 0x6e1a50, emissiveIntensity: 0.45, roughness: 0.35 });
  const crimsonMat = pal.get(0x8e2420, { roughness: 0.58, metalness: 0.12 });
  const amberMagma = pal.get(0xe57628, { emissive: 0x8c310a, emissiveIntensity: 0.56, roughness: 0.42 });
  const limeBio = pal.get(0x8ad643, { emissive: 0x3b6e12, emissiveIntensity: 0.45, roughness: 0.45 });

  const spinParts: { obj: THREE.Object3D; axis: 'x' | 'y' | 'z'; speed: number; base?: number }[] = [];
  const orbitParts: { obj: THREE.Object3D; radius: number; phase: number; speed: number; y: number }[] = [];
  const waveParts: { obj: THREE.Object3D; baseY: number; amp: number; speed: number; phase: number; axis?: 'y' | 'z' }[] = [];

  switch (id) {
    case '001': {
      // MAGMA PLEURON: Arched articulated basalt centipede with orange magma fissures, side legs & blue dorsal telemetry bars
      const spineGroup = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const z = -0.52 + t * 1.04;
        const archY = 0.2 + Math.sin(t * Math.PI * 0.92) * 0.26;
        const scale = 1 - Math.abs(t - 0.35) * 0.42;

        // Basalt plate
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(0.32 * scale, 0.16 * scale, 0.12),
          basaltInk,
        );
        seg.position.set(0, archY, z);
        seg.rotation.x = Math.cos(t * Math.PI * 0.92) * -0.45;
        seg.castShadow = true;
        spineGroup.add(seg);

        // Glowing orange magma fissure between carapace plates
        if (i < 7) {
          const fissure = new THREE.Mesh(
            new THREE.BoxGeometry(0.28 * scale, 0.12 * scale, 0.045),
            amberMagma,
          );
          fissure.position.set(0, archY - 0.01, z + 0.068);
          spineGroup.add(fissure);
        }

        // Blue dorsal telemetry blocks
        const tele = new THREE.Mesh(
          new THREE.BoxGeometry(0.08 * scale, 0.045, 0.075),
          cyanMat,
        );
        tele.position.set(0, archY + 0.095 * scale, z);
        spineGroup.add(tele);

        // Articulated left/right basalt legs
        for (const sx of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.24 * scale, 0.045), slateArmor);
          leg.position.set(sx * 0.21 * scale, archY - 0.11, z);
          leg.rotation.z = sx * 0.45;
          spineGroup.add(leg);
        }
      }
      // Twin curved front mandibles
      for (const sx of [-1, 1]) {
        const mand = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.24, 4), basaltInk);
        mand.position.set(sx * 0.11, 0.2, 0.62);
        mand.rotation.x = Math.PI / 2 + 0.2;
        mand.rotation.z = -sx * 0.32;
        spineGroup.add(mand);
      }
      g.add(spineGroup);
      waveParts.push({ obj: spineGroup, baseY: 0, amp: 0.022, speed: 1.6, phase: 0 });
      break;
    }

    case '003': {
      // FAULT-TONGUE: Sinuous armored seismic wyrm with barcode ribs, dorsal fins & circular glowing cyan turbine mouth
      const bodyCurve = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const z = -0.5 + t * 0.92;
        const x = Math.sin(t * Math.PI * 1.4) * 0.14;
        const y = 0.18 + Math.sin(t * Math.PI) * 0.12;
        const rad = 0.09 + t * 0.1;

        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(rad, rad * 0.92, 0.13, 8),
          i % 2 === 0 ? slateArmor : basaltInk,
        );
        seg.rotation.x = Math.PI / 2;
        seg.position.set(x, y, z);
        seg.castShadow = true;
        bodyCurve.add(seg);

        // Dorsal seismic fin
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.14, 3), brassMat);
        fin.position.set(x, y + rad + 0.05, z);
        fin.rotation.x = -0.35;
        bodyCurve.add(fin);
      }
      // Open circular acoustic projector head with glowing cyan concentric turbine rings
      const headCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.24, 10, 1, true), basaltInk);
      headCowl.rotation.x = Math.PI / 2;
      headCowl.position.set(0, 0.24, 0.52);
      headCowl.castShadow = true;
      const cyanCore = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), cyanMat);
      cyanCore.position.set(0, 0.24, 0.5);
      const turbineRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 14), cyanMat);
      turbineRing.position.set(0, 0.24, 0.62);
      bodyCurve.add(headCowl, cyanCore, turbineRing);
      g.add(bodyCurve);
      spinParts.push({ obj: turbineRing, axis: 'z', speed: 2.0 });
      break;
    }

    case '004': {
      // OBSIDIAN GUL: Jagged wingless predator made of fractured obsidian shards around glowing orange magma seams
      const coreGlow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.58), amberMagma);
      coreGlow.position.set(0, 0.28, 0.02);
      g.add(coreGlow);

      // Floating angular obsidian armor shards around the molten core
      const shardPos: [number, number, number, number, number][] = [
        [-0.14, 0.34, 0.16, 0.3, 0.25],
        [0.14, 0.34, 0.16, -0.3, -0.25],
        [0, 0.42, 0.04, 0, 0.18],
        [-0.12, 0.28, -0.18, 0.2, -0.15],
        [0.12, 0.28, -0.18, -0.2, 0.15],
        [0, 0.38, -0.28, 0, -0.3],
      ];
      shardPos.forEach(([sx, sy, sz, rz, rx]) => {
        const shard = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 4), basaltInk);
        shard.position.set(sx, sy, sz);
        shard.rotation.set(rx + Math.PI / 2, 0, rz);
        shard.castShadow = true;
        g.add(shard);
      });
      // Sculpted obsidian head + jaw
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 4), basaltInk);
      head.rotation.x = Math.PI / 2;
      head.position.set(0, 0.35, 0.44);
      const eyeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.08), amberMagma);
      eyeGlow.position.set(0, 0.36, 0.46);
      // Tail + four clawed shard legs
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.44, 4), basaltInk);
      tail.rotation.x = -1.1;
      tail.position.set(0, 0.38, -0.46);
      for (const [lx, lz] of [[-0.16, 0.22], [0.16, 0.22], [-0.15, -0.22], [0.15, -0.22]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.26, 0.08), basaltInk);
        leg.position.set(lx, 0.13, lz);
        leg.rotation.x = lz > 0 ? -0.2 : 0.2;
        g.add(leg);
      }
      g.add(head, eyeGlow, tail);
      break;
    }

    case '005': {
      // TREMORHOUND: Low-slung crouching dark-slate wolf with cyan forehead sigil, cyan flank streaks & ground seismic rings
      const groundRipple1 = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.014, 5, 24), cyanMat);
      groundRipple1.rotation.x = Math.PI / 2;
      groundRipple1.position.y = 0.018;
      const groundRipple2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 5, 20), cyanMat);
      groundRipple2.rotation.x = Math.PI / 2;
      groundRipple2.position.y = 0.018;
      g.add(groundRipple1, groundRipple2);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.64), basaltInk);
      torso.position.set(0, 0.24, -0.02);
      torso.rotation.x = 0.14;
      torso.castShadow = true;

      // Shoulder ruff spikes & cyan flank streaks
      for (const sx of [-0.13, 0.13]) {
        const streak = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.42), cyanMat);
        streak.position.set(sx, 0.25, 0);
        g.add(streak);
      }
      const neck = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 5), slateArmor);
      neck.rotation.x = Math.PI / 2 - 0.35;
      neck.position.set(0, 0.29, 0.32);
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 4), basaltInk);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 0.28, 0.5);
      // Glowing cyan forehead diamond sigil
      const sigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), cyanMat);
      sigil.scale.set(0.8, 0.35, 1.3);
      sigil.position.set(0, 0.36, 0.42);
      // Crouching forelegs & hindlegs with cyan claws
      for (const [lx, lz, rotX] of [[-0.16, 0.24, -0.25], [0.16, 0.24, -0.25], [-0.15, -0.26, 0.3], [0.15, -0.26, 0.3]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.085), basaltInk);
        leg.position.set(lx, 0.12, lz);
        leg.rotation.x = rotX;
        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.09), cyanMat);
        claw.position.set(lx, 0.02, lz + 0.05);
        g.add(leg, claw);
      }
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.34, 5), slateArmor);
      tail.rotation.x = -1.25;
      tail.position.set(0, 0.28, -0.44);
      g.add(torso, neck, snout, sigil, tail);
      break;
    }

    case '008': {
      // AEROKARST: Vertical axis core orb + nested upper/lower disk satellites + 6 curved crescent stone ribs
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), cyanMat);
      core.position.y = 0.52;
      core.castShadow = true;
      g.add(core);

      // Vertical satellite domes above and below core
      for (const dy of [-0.34, -0.22, 0.22, 0.34]) {
        const disk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11 - Math.abs(dy) * 0.15, 0.13 - Math.abs(dy) * 0.15, 0.06, 8),
          slateArmor,
        );
        disk.position.y = 0.52 + dy;
        g.add(disk);
      }

      // Orbiting curved concave basaltic karst shell crescents
      const ringGroup = new THREE.Group();
      ringGroup.position.y = 0.52;
      for (let i = 0; i < 6; i++) {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(0.38 + (i % 2) * 0.1, 0.038, 5, 10, Math.PI * 0.55),
          i % 2 === 0 ? basaltInk : slateArmor,
        );
        arc.rotation.y = (i / 6) * Math.PI * 2;
        arc.rotation.z = (i % 2 === 0 ? 0.55 : -0.45);
        arc.castShadow = true;
        ringGroup.add(arc);
      }
      g.add(ringGroup);
      spinParts.push({ obj: ringGroup, axis: 'y', speed: 0.75 });
      break;
    }

    case '009': {
      // CLOUDMAW: Coiled boiling storm-cloud dragon plates + glowing plasma maw + swirling rain column
      const vortex = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.08, 0.34, 10, 1, true),
        pal.get(0x88b4cc, { transparent: true, opacity: 0.45 }),
      );
      vortex.position.y = 0.17;
      g.add(vortex);

      const coilGroup = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const a = t * Math.PI * 1.85;
        const r = 0.34 - t * 0.12;
        const cloud = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.14 - t * 0.03, 0),
          i % 2 === 0 ? slateArmor : warmCream,
        );
        cloud.position.set(Math.cos(a) * r, 0.24 + t * 0.44, Math.sin(a) * r);
        cloud.castShadow = true;
        coilGroup.add(cloud);
      }
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 5), basaltInk);
      head.rotation.x = Math.PI / 2;
      head.position.set(0.18, 0.72, 0.12);
      const maw = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), amberMagma);
      maw.position.set(0.18, 0.7, 0.26);
      coilGroup.add(head, maw);
      g.add(coilGroup);
      spinParts.push({ obj: coilGroup, axis: 'y', speed: 0.55 });
      break;
    }

    case '012': {
      // VORTENBRAY: Inverted spiraling orbital funnel of concentric upper rings + downward golden-and-steel vortex ribbons
      const baseCity = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.08, 8), warmCream);
      baseCity.position.y = 0.04;
      g.add(baseCity);

      const funnelGroup = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const radius = THREE.MathUtils.lerp(0.14, 0.48, t);
        const y = THREE.MathUtils.lerp(0.18, 0.84, t);
        const track = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.024, 6, 20, Math.PI * 1.65),
          i % 2 === 0 ? brassMat : slateArmor,
        );
        track.position.y = y;
        track.rotation.x = Math.PI / 2 + (i % 2 === 0 ? 0.18 : -0.16);
        track.rotation.z = i * 0.85;
        track.castShadow = true;
        funnelGroup.add(track);
      }
      // Central spiral golden conduit spine
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.72, 6, 1, true), cyanMat);
      spire.rotation.x = Math.PI;
      spire.position.y = 0.48;
      spire.scale.set(0.5, 1, 0.5);
      funnelGroup.add(spire);
      g.add(funnelGroup);
      spinParts.push({ obj: funnelGroup, axis: 'y', speed: 1.05 });
      break;
    }

    case '015': {
      // VERDGORGE: Mossy root-and-ribcage forest titan quadruped + branched stag-antler canopy crown
      const bark = bronzeMat;
      const foliage = pal.get(0x4c7c4e, { roughness: 0.88 });
      const spore = pal.get(0xe28ab4, { emissive: 0x6e284c, emissiveIntensity: 0.3 });

      for (const [lx, lz] of [[-0.22, 0.22], [0.22, 0.22], [-0.22, -0.22], [0.22, -0.22]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.11, 0.42, 6), bark);
        leg.position.set(lx, 0.21, lz);
        leg.castShadow = true;
        g.add(leg);
      }
      // Open ribcage chest beams
      for (let r = -2; r <= 2; r++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 5, 10, Math.PI * 1.25), warmCream);
        rib.position.set(0, 0.42, r * 0.09);
        rib.rotation.z = Math.PI * 0.88;
        g.add(rib);
      }
      // Canopy cluster back
      const canopyA = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), foliage);
      canopyA.position.set(-0.08, 0.66, -0.05);
      const canopyB = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), foliage);
      canopyB.position.set(0.12, 0.62, -0.14);
      // Stag-antler crown
      for (const sx of [-1, 1]) {
        const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.036, 0.34, 5), bark);
        antler.position.set(sx * 0.16, 0.72, 0.28);
        antler.rotation.z = -sx * 0.55;
        const blossom = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), spore);
        blossom.position.set(sx * 0.28, 0.85, 0.3);
        g.add(antler, blossom);
      }
      g.add(canopyA, canopyB);
      break;
    }

    case '019': {
      // TERRAGULLET: Segmented armored bronze worm + glowing lime bio-compost bays + twin serrated nose grinders
      for (let s = 0; s < 5; s++) {
        const z = -0.34 + s * 0.16;
        const hull = new THREE.Mesh(
          new THREE.CylinderGeometry(0.21, 0.21, 0.11, 10),
          s % 2 === 0 ? bronzeMat : basaltInk,
        );
        hull.rotation.x = Math.PI / 2;
        hull.position.set(0, 0.24, z);
        hull.castShadow = true;
        g.add(hull);

        if (s > 0 && s < 4) {
          // Open cutaway bay glowing lime-green spheres
          const pod = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), limeBio);
          pod.position.set(0, 0.24, z + 0.08);
          g.add(pod);
        }
      }
      // Twin serrated rotary grinder cones at front
      const noseL = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 7), brassMat);
      noseL.rotation.x = Math.PI / 2;
      noseL.position.set(-0.09, 0.24, 0.48);
      const noseR = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 7), limeBio);
      noseR.rotation.x = Math.PI / 2;
      noseR.position.set(0.09, 0.24, 0.48);
      g.add(noseL, noseR);
      spinParts.push({ obj: noseL, axis: 'z', speed: 2.2 }, { obj: noseR, axis: 'z', speed: -2.2 });
      break;
    }

    case '023': {
      // BRINECHOIR: Broad-bodied crystalline salt leviathan trailing translucent pale-mint glyph ribbon fins
      const mintCrystal = pal.get(0x9bd6cf, { roughness: 0.38, metalness: 0.15 });
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 5), mintCrystal);
      head.rotation.x = Math.PI / 2;
      head.scale.set(1.25, 0.72, 1);
      head.position.set(0, 0.28, 0.24);
      head.castShadow = true;
      g.add(head);

      // Sweeping translucent ribbon fins & dorsal salt spines
      for (let i = 0; i < 6; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.18, 0.46 - i * 0.03), cyanMat);
        const side = i % 2 === 0 ? -1 : 1;
        fin.position.set(side * (0.14 + Math.floor(i / 2) * 0.08), 0.3 + i * 0.04, -0.05 - i * 0.08);
        fin.rotation.y = side * 0.35;
        fin.rotation.x = 0.24;
        g.add(fin);
      }
      for (let c = 0; c < 4; c++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), warmCream);
        spike.position.set(0, 0.42 - c * 0.03, 0.2 - c * 0.18);
        spike.rotation.x = -0.35;
        g.add(spike);
      }
      break;
    }

    case '026': {
      // GLACIERTHROAT: Pale-blue fenestrated serpentine neck/skull fanning wide white pressure-sail wings over ice cliffs
      const iceBlue = pal.get(0x88c9e4, { roughness: 0.38, metalness: 0.1 });
      const iceBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.14, 6), iceBlue);
      iceBase.position.y = 0.07;

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.56, 6), iceBlue);
      neck.position.set(0, 0.38, -0.06);
      neck.rotation.x = 0.28;
      neck.castShadow = true;

      const skull = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 5), cyanMat);
      skull.rotation.x = Math.PI / 2 + 0.4;
      skull.position.set(0, 0.62, 0.14);

      // Wide sweeping pressure-sail crest wings
      for (const sx of [-1, 1]) {
        const sail = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.03), warmCream);
        sail.position.set(sx * 0.26, 0.58, -0.04);
        sail.rotation.z = sx * 0.35;
        sail.rotation.y = -sx * 0.28;
        sail.castShadow = true;
        g.add(sail);
      }
      g.add(iceBase, neck, skull);
      break;
    }

    case '029': {
      // RINGTHROAT: Colossal 4-legged gantry extruder tower, distended glowing red-black belly core & upper vitrified bell nozzle
      const ringGroup = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.1), basaltInk);
        strut.position.set(Math.cos(a) * 0.28, 0.2, Math.sin(a) * 0.28);
        strut.rotation.z = Math.cos(a) * 0.46;
        strut.rotation.x = -Math.sin(a) * 0.46;
        strut.castShadow = true;
        ringGroup.add(strut);
      }
      // Distended red-black reactor core belly
      const belly = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), crimsonMat);
      belly.position.y = 0.34;
      // Armored shaft & flared bell nozzle
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.19, 0.46, 8), slateArmor);
      shaft.position.y = 0.56;
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.11, 0.18, 10), basaltInk);
      nozzle.position.y = 0.84;
      // Containment cyan torus & extruded dark crimson slurry ring segment above
      const contain = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.015, 6, 20), cyanMat);
      contain.rotation.x = Math.PI / 2;
      contain.position.y = 0.94;
      const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 0.26, 8), crimsonMat);
      plume.position.y = 1.02;
      ringGroup.add(belly, shaft, nozzle, contain, plume);
      g.add(ringGroup);
      spinParts.push({ obj: contain, axis: 'z', speed: 1.4 });
      break;
    }

    case '030': {
      // SOLNEXUS: Radiant coiled serpent + gravitational spires around a blazing golden sun + prismatic wings
      const sun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), amberMagma);
      sun.position.y = 0.48;
      g.add(sun);

      const coil = new THREE.Group();
      coil.position.y = 0.48;
      const arcA = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.032, 6, 20, Math.PI * 1.45), brassMat);
      arcA.rotation.x = 0.48;
      const arcB = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 6, 20, Math.PI * 1.3), cyanMat);
      arcB.rotation.set(-0.52, 0.8, 0.2);
      // Wing crystal fins
      for (const sx of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.44, 4), brassMat);
        wing.position.set(sx * 0.42, 0.08, 0);
        wing.rotation.z = -sx * 1.1;
        coil.add(wing);
      }
      coil.add(arcA, arcB);
      g.add(coil);
      spinParts.push({ obj: coil, axis: 'y', speed: 0.9 });
      break;
    }

    case '032': {
      // LYRIBORIS: Undulating sinuous turquoise-and-brass sky-ribbon serpent lined with dorsal tuning-fork antenna masts
      const wyrm = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = -0.48 + t * 0.96;
        const y = 0.36 + Math.sin(t * Math.PI * 1.5) * 0.16;
        const z = Math.cos(t * Math.PI * 1.5) * 0.18;

        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.16), i % 2 === 0 ? cyanMat : warmCream);
        plate.position.set(x, y, z);
        plate.rotation.z = Math.cos(t * Math.PI * 1.5) * 0.32;
        plate.castShadow = true;
        wyrm.add(plate);

        // Vertical tuning-fork antenna mast on spine
        if (i % 2 === 0) {
          const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.24, 5), brassMat);
          mast.position.set(x, y + 0.14, z);
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), cyanMat);
          tip.position.set(x, y + 0.27, z);
          wyrm.add(mast, tip);
        }
      }
      // Small dish receiver base below
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.04, 0.1, 8), slateArmor);
      dish.position.set(-0.22, 0.08, 0.15);
      g.add(wyrm, dish);
      waveParts.push({ obj: wyrm, baseY: 0, amp: 0.03, speed: 1.5, phase: 0.4 });
      break;
    }

    case '036': {
      // SINGULARARCH: Segmented fractal mirror-core sphere + orbiting detached rectangular matrix glyph tiles
      const centerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), cyanMat);
      centerCore.position.y = 0.5;
      const shellA = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.042, 5, 16, Math.PI * 1.2), warmCream);
      shellA.position.y = 0.5;
      shellA.rotation.x = 0.5;
      const shellB = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 5, 16, Math.PI * 1.25), basaltInk);
      shellB.position.y = 0.5;
      shellB.rotation.set(-0.6, 0.9, 0.3);
      g.add(centerCore, shellA, shellB);
      spinParts.push({ obj: shellA, axis: 'y', speed: 0.7 }, { obj: shellB, axis: 'x', speed: -0.6 });

      for (let i = 0; i < 6; i++) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.025), i % 2 === 0 ? slateArmor : warmCream);
        tile.castShadow = true;
        g.add(tile);
        orbitParts.push({ obj: tile, radius: 0.46, phase: (i / 6) * Math.PI * 2, speed: 0.85, y: 0.5 + (i % 2 === 0 ? 0.08 : -0.08) });
      }
      break;
    }

    case '037': {
      // IRONCANT: Bull-shouldered slag-black iron foundry titan with horned smokestacks & glowing furnace chest ribs
      const legs = new THREE.Group();
      for (const sx of [-0.14, 0.14]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.14), basaltInk);
        leg.position.set(sx, 0.16, 0);
        leg.castShadow = true;
        legs.add(leg);
      }
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.24), slateArmor);
      torso.position.y = 0.48;
      torso.castShadow = true;
      // Glowing vertical furnace grate ribs in chest
      for (let r = -1; r <= 1; r++) {
        const grate = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.22, 0.04), amberMagma);
        grate.position.set(r * 0.075, 0.48, 0.125);
        g.add(grate);
      }
      // Pauldrons + twin curved horn smokestacks
      for (const sx of [-1, 1]) {
        const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.26), basaltInk);
        pauldron.position.set(sx * 0.24, 0.62, 0);
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.24, 6), basaltInk);
        stack.position.set(sx * 0.16, 0.82, -0.02);
        stack.rotation.z = -sx * 0.28;
        const ember = new THREE.Mesh(new THREE.SphereGeometry(0.042, 6, 6), amberMagma);
        ember.position.set(sx * 0.2, 0.94, -0.02);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.14), slateArmor);
        arm.position.set(sx * 0.28, 0.4, 0.04);
        g.add(pauldron, stack, ember, arm);
      }
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), basaltInk);
      head.position.set(0, 0.7, 0.04);
      g.add(legs, torso, head);
      break;
    }

    case '044': {
      // GOREVAULT: Colossal 6-legged armored bioforge crawler + front pincers + dorsal silos + crimson reservoir sacs
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.68), basaltInk);
      chassis.position.set(0, 0.44, 0);
      chassis.castShadow = true;
      g.add(chassis);

      // 3 Dorsal pressure silos
      for (let s = -1; s <= 1; s++) {
        const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.22, 8), slateArmor);
        silo.position.set(0, 0.65, s * 0.2);
        g.add(silo);
      }
      // 4 hanging crimson organic biomass reservoir sacs under belly
      for (const [bx, bz] of [[-0.12, 0.1], [0.12, 0.1], [-0.12, -0.14], [0.12, -0.14]]) {
        const sac = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), crimsonMat);
        sac.scale.set(0.85, 1.35, 0.85);
        sac.position.set(bx, 0.26, bz);
        g.add(sac);
      }
      // Twin massive curved front pincer jaws
      for (const sx of [-1, 1]) {
        const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 4), slateArmor);
        jaw.position.set(sx * 0.16, 0.36, 0.44);
        jaw.rotation.x = Math.PI / 2 + 0.3;
        jaw.rotation.z = sx * 0.28;
        g.add(jaw);
      }
      // 6 jointed crawler legs
      for (let l = -1; l <= 1; l++) {
        for (const sx of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.36, 0.07), slateArmor);
          leg.position.set(sx * 0.3, 0.2, l * 0.22);
          leg.rotation.z = sx * 0.32;
          leg.castShadow = true;
          g.add(leg);
        }
      }
      break;
    }

    case '045': {
      // LEXICLAST: Ivory skeletal multi-throated cantor with perforated skull, halo glyphs & trailing cobalt script ribbons
      const ribGroup = new THREE.Group();
      for (let r = 0; r < 4; r++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.24 - r * 0.03, 0.022, 5, 12, Math.PI * 1.4), warmCream);
        rib.position.y = 0.2 + r * 0.11;
        rib.rotation.x = Math.PI / 2 + 0.35;
        rib.rotation.z = Math.PI * 0.8;
        ribGroup.add(rib);
      }
      // Perforated skull with dark vocal throat sockets
      const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), warmCream);
      skull.position.set(0, 0.68, 0.05);
      skull.castShadow = true;
      for (const [vx, vy] of [[-0.06, 0.7], [0.06, 0.7], [0, 0.62]]) {
        const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), basaltInk);
        cavity.position.set(vx, vy, 0.18);
        ribGroup.add(cavity);
      }
      // Flowing azure-blue script ribbons spilling forward/downward
      for (let i = -1; i <= 1; i++) {
        const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.42, 0.02), cyanMat);
        ribbon.position.set(i * 0.11, 0.36, 0.22 + Math.abs(i) * 0.06);
        ribbon.rotation.x = -0.58;
        ribbon.rotation.z = i * 0.22;
        ribGroup.add(ribbon);
      }
      g.add(ribGroup);
      break;
    }

    case '055': {
      // FOLDHOWL: Glitch-sliced lupine predator fragmented by horizontal offset slabs + sharp cyan/magenta scan planes
      const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.16), basaltInk);
      backLeg.position.set(0, 0.15, -0.22);
      const frontLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.16), basaltInk);
      frontLeg.position.set(0.04, 0.16, 0.2);

      const torsoLower = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.52), slateArmor);
      torsoLower.position.set(-0.04, 0.32, -0.02);
      const torsoUpper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.48), basaltInk);
      torsoUpper.position.set(0.06, 0.47, 0.02);
      torsoUpper.castShadow = true;

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 4), basaltInk);
      head.rotation.x = Math.PI / 2;
      head.position.set(0.05, 0.56, 0.36);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), cyanMat);
      eye.position.set(0.1, 0.58, 0.42);

      // Sharp horizontal magenta & cyan glitch slice planes
      for (const [sy, mat, ox] of [
        [0.4, magentaSlice, 0.08],
        [0.52, cyanMat, -0.06],
        [0.24, cyanMat, 0.04],
      ] as const) {
        const plane = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.018, 0.48), mat);
        plane.position.set(ox, sy, 0);
        g.add(plane);
      }
      g.add(backLeg, frontLeg, torsoLower, torsoUpper, head, eye);
      break;
    }

    case '059': {
      // DRAKKEN EGG: Faceted dark obsidian bipyramid obelisk hovering point-down over stepped crater, etched with cyan circuitry seams
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.08, 6), warmCream);
      base.position.y = 0.04;
      const lowerCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.46, 6), basaltInk);
      lowerCone.rotation.x = Math.PI;
      lowerCone.position.y = 0.35;
      lowerCone.castShadow = true;
      const upperCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.46, 6), basaltInk);
      upperCone.position.y = 0.81;
      upperCone.castShadow = true;

      const circuitBelt = new THREE.Mesh(new THREE.TorusGeometry(0.242, 0.016, 5, 6), cyanMat);
      circuitBelt.rotation.x = Math.PI / 2;
      circuitBelt.position.y = 0.58;
      const coreBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), cyanMat);
      coreBeacon.position.y = 0.58;
      g.add(base, lowerCone, upperCone, circuitBelt, coreBeacon);
      waveParts.push({ obj: lowerCone, baseY: 0.35, amp: 0.018, speed: 1.5, phase: 0 });
      waveParts.push({ obj: upperCone, baseY: 0.81, amp: 0.018, speed: 1.5, phase: 0 });
      break;
    }

    case '060':
    default: {
      // MOTHER: Living planetary homeworld in Aureal Nebula — purplish-slate sphere, glowing cyan macro-node seals, layered paper cloud belts
      const planetMat = pal.get(0x4b4263, { roughness: 0.78, metalness: 0.08 });
      const cloudMat = pal.get(0xdad2e3, { roughness: 0.88 });
      const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), planetMat);
      globe.position.y = 0.48;
      globe.castShadow = true;

      // Embedded cyan circuit macro-nodes across crust
      for (const [nx, ny, nz, rx, ry] of [
        [0, 0.48, 0.41, 0, 0],
        [0.36, 0.62, 0.16, -0.4, 1.1],
        [-0.35, 0.38, 0.22, 0.3, -1.0],
      ]) {
        const node = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 5, 16), cyanMat);
        node.position.set(nx, ny, nz);
        node.rotation.set(rx, ry, 0);
        g.add(node);
      }

      // Layered curved cream-lavender paper cloud ribbons wrapping globe
      const cloudA = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.032, 5, 22, Math.PI * 1.4), cloudMat);
      cloudA.position.y = 0.48;
      cloudA.rotation.set(1.2, 0.4, 0);
      const cloudB = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.025, 5, 22, Math.PI * 1.15), cloudMat);
      cloudB.position.y = 0.48;
      cloudB.rotation.set(-1.1, -0.5, 0.4);

      g.add(globe, cloudA, cloudB);
      spinParts.push({ obj: g, axis: 'y', speed: 0.16 });
      break;
    }
  }

  return {
    id,
    group: g,
    animate: (elapsed: number, active = true) => {
      if (!active) return;
      for (const s of spinParts) {
        s.obj.rotation[s.axis] = (s.base ?? 0) + elapsed * s.speed;
      }
      for (const o of orbitParts) {
        const a = o.phase + elapsed * o.speed;
        o.obj.position.set(Math.cos(a) * o.radius, o.y, Math.sin(a) * o.radius);
        o.obj.rotation.y = -a;
      }
      for (const w of waveParts) {
        w.obj.position.y = w.baseY + Math.sin(elapsed * w.speed + w.phase) * w.amp;
      }
    },
  };
}
