import * as THREE from 'three';
import type { BaseFolioWorld } from '../engine/folios/BaseFolioWorld';
import { getOpenPageY } from '../engine/BookAndDeskRig';
import type { FolioRuntimeState } from '../types/atlas';

type WarIndex = 3 | 4 | 5;
type Art = {
  root: THREE.Group;
  update(state: FolioRuntimeState, dt: number, reduced: boolean): void;
  dispose(): void;
};
const near = (a: number, b: number) => Math.abs(a - b) < 0.001;
const at = (o: THREE.Object3D, x: number, z: number) => near(o.position.x, x) && near(o.position.z, z);
const mesh = (p: THREE.Object3D): p is THREE.Mesh => p instanceof THREE.Mesh;

export function createRevisionWar1Art(index: WarIndex, world: BaseFolioWorld): Art {
  const root = new THREE.Group();
  root.name = 'Living-only War I revised art F0' + (index + 1);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const externals: THREE.Object3D[] = [];
  const restore: Array<() => void> = [];
  const artMat = (color: number, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.84, side: THREE.DoubleSide });
    materials.add(m);
    return m;
  };
  const place = (group: THREE.Object3D, name: string, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    geometries.add(g);
    const o = new THREE.Mesh(g, m);
    o.name = name;
    o.position.set(x, y, z);
    o.castShadow = true;
    group.add(o);
    if (group !== root && !root.getObjectById(group.id)) externals.push(o);
    return o;
  };
  const box = (group: THREE.Object3D, name: string, w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) =>
    place(group, name, new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const paperInk = artMat(0x23272f);
  const gold = artMat(0xb29a62, 0.19);
  const vellum = artMat(0xd9c8a4);
  const slate = artMat(0x313d46);
  const scarlet = artMat(0x7f3430);
  const line = (group: THREE.Object3D, name: string, vs: Array<[number, number, number]>, color: number) => {
    const g = new THREE.BufferGeometry().setFromPoints(vs.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const m = new THREE.LineBasicMaterial({ color });
    geometries.add(g);
    materials.add(m);
    const o = new THREE.Line(g, m);
    o.name = name;
    group.add(o);
  };
  const print = (group: THREE.Object3D, name: string, lines: string[], w: number, h: number, x: number, y: number, z: number, mode: 'portrait' | 'page', muted = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = lines.length > 1 ? 178 : 91;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = muted ? '#2f3945' : '#ded4b7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = muted ? '#b7a477' : '#766847';
    ctx.lineWidth = 4;
    ctx.strokeRect(9, 7, canvas.width - 18, canvas.height - 14);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = muted ? '#f0dfb3' : '#262b31';
      ctx.font = i === 0 ? 'bold 53px Georgia, serif' : 'bold 32px system-ui, sans-serif';
      ctx.fillText(lines[i] ?? '', canvas.width / 2, (i + 1) * canvas.height / (lines.length + 1), 472);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.add(map);
    const material = new THREE.MeshStandardMaterial({ map, roughness: 0.86, side: THREE.DoubleSide });
    materials.add(material);
    const o = place(group, name, new THREE.PlaneGeometry(w, h), material, x, y, z);
    o.castShadow = false;
    if (mode === 'page') o.rotation.x = -Math.PI / 2;
    return o;
  };
  const disposal = () => {
    for (const o of externals) o.removeFromParent();
    root.removeFromParent();
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
    for (const f of restore) f();
  };

  if (index === 3) {
    // Exact F04 direct child: authored Codec stands at x 0, z –.78.
    // Retain ownership for the existing world's dispose, never edit archive classes.
    const codec = world.root.children.find((o) => o instanceof THREE.Group && at(o, 0, -0.78));
    if (codec) {
      const old = codec.visible;
      codec.visible = false;
      restore.push(() => { codec.visible = old; });
    }
    const station = new THREE.Group();
    station.name = 'F04 sequential planetary expansion teaching relief';
    station.position.set(0.22, getOpenPageY(0.22) + 0.12, -0.73);
    root.add(station);
    box(station, 'F04 page-attached expansion foundation', 1.78, 0.055, 0.52, slate);
    for (const end of [-0.73, 0.73]) {
      box(station, 'F04 paper relief buttress', 0.09, 0.4, 0.12, paperInk, end, 0.19, -0.07);
    }
    box(station, 'F04 raised paper route header', 1.78, 0.34, 0.035, paperInk, 0, 0.48, -0.105);
    print(station, 'F04 source lesson caption', ['EXPANSION · SCHEMATIC'], 1.45, 0.19, 0, 0.55, -0.086, 'portrait', true);
    const points: Array<[number, number, number]> = [[-0.64, 0.24, 0.01], [-0.31, 0.39, 0.025], [0, 0.24, 0.04], [0.33, 0.35, 0.02], [0.63, 0.24, 0.03]];
    line(station, 'F04 printed flow markers, not literal geography', points, 0xc2ad77);
    const planetMats = points.map(() => artMat(0x725d4d));
    const glow = new THREE.Color(0xf1ca78);
    const shadow = new THREE.Color(0x655643);
    for (let i = 0; i < points.length; i++) {
      const [x, y, z] = points[i]!;
      box(station, 'F04 pinned cardstock planet support', 0.031, y, 0.031, slate, x, y / 2, z);
      place(station, 'F04 anonymous planetary relief ' + (i + 1), new THREE.IcosahedronGeometry(0.088, 1), planetMats[i]!, x, y, z);
      const rim = place(station, 'F04 cut planetary paper rim', new THREE.TorusGeometry(0.091, 0.009, 4, 18), gold, x, y, z + 0.026);
      rim.rotation.z = i * 0.35;
    }
    // Build a genuinely perforated strip with separate apertures: a tab echoes
    // the planetary state, it is not an additional count or a replacement for the relief.
    const strip = new THREE.Group();
    strip.name = 'F04 perforated expansion register strip';
    strip.position.set(-1.55, getOpenPageY(-1.55) + 0.032, 0.72);
    root.add(strip);
    box(strip, 'Register backing', 1.48, 0.025, 0.19, paperInk);
    const windowXs = points.map((_, i) => (i - 2) * 0.25);
    for (const lane of [-0.066, 0.066]) box(strip, 'Register paper rim', 1.47, 0.026, 0.035, gold, 0, 0.019, lane);
    for (let k = 0; k < 6; k++) box(strip, 'Die-cut web between slots', 0.083, 0.025, 0.138, slate, (k - 2.5) * 0.25, 0.020, 0);
    windowXs.forEach((x, i) => box(strip, 'Echo aperture ' + (i + 1), 0.15, 0.008, 0.075, planetMats[i]!, x, 0.015, 0));
    const period = 0.41;
    let time = 0;
    let initialized = false;
    return {
      root,
      dispose: disposal,
      update(state, dt, reduced) {
        const running = state.interactions.B.active;
        // Restored active records start with the stable final plate. During a
        // fresh interaction the physical relief advances, pauses with B off,
        // and holds the final pattern without any blink, fade, or extra lights.
        if (!initialized) { initialized = true; if (running) time = points.length * period; }
        if (running) time = reduced ? points.length * period : Math.min(points.length * period, time + Math.min(dt, 0.1));
        const count = Math.min(points.length, Math.floor((time + 0.00001) / period));
        planetMats.forEach((m, i) => {
          const active = i < count;
          m.color.copy(active ? glow : shadow);
          m.emissive.copy(active ? glow : shadow);
          m.emissiveIntensity = active ? 0.29 : 0.015;
        });
        root.userData.litPlanets = count;
        root.userData.expansion = count === points.length ? 'complete' : running ? 'advancing' : 'held';
        root.userData.codecHidden = codec ? !codec.visible : false;
      },
    };
  }

  if (index === 4) {
    const globe = world.root.children.find((o) => mesh(o) && at(o, -1.42, -0.26) && o.geometry.type === 'IcosahedronGeometry') as THREE.Mesh | undefined;
    const ring = world.root.children.find((o) => o instanceof THREE.Group && at(o, -1.42, -0.26) && o.children.some((c) => mesh(c) && c.geometry.type === 'TorusGeometry'));
    const rigs = [-0.08, 1.26].map((x) => world.root.children.find((o) => o instanceof THREE.Group && at(o, x, -0.28))).filter((o): o is THREE.Object3D => Boolean(o));
    const restoration = [globe, ring, ...rigs].filter((o): o is THREE.Object3D => Boolean(o)).map((o) => [o, o.rotation.clone()] as const);
    restoration.forEach(([o, rotation]) => restore.push(() => o.rotation.copy(rotation)));
    const globePrinted = artMat(0x8d9c69);
    const globePrintedAlt = artMat(0x535a4b);
    if (globe) {
      // Unequal spherical patches are inked cutouts enabling the reader to see
      // axial rotation on a near-spherical model. They are not new geography.
      const patches = [[0.18, -0.23, 0.32, 0.22], [1.53, 0.27, 0.41, 0.26], [3.21, -0.21, 0.39, 0.29], [4.43, 0.35, 0.31, 0.32]];
      patches.forEach(([lon, lat, w, h], i) => {
        const r = 0.404;
        const xyz = (a: number, b: number) => new THREE.Vector3(r * Math.cos(b) * Math.cos(a), r * Math.sin(b), r * Math.cos(b) * Math.sin(a));
        // Ring contours indexed on a rounded irregular outline, via normalized
        // concentric subdivisions rather than a planar decal.
        const vs: number[] = [];
        for (let row = 0; row <= 3; row++) for (let k = 0; k < 12; k++) {
          const a = k * Math.PI / 6;
          const edge = 0.86 + 0.13 * Math.sin(a * 3 + i * 1.7) + 0.10 * Math.cos(a * 2 - i);
          const v = xyz(lon! + Math.cos(a) * w! * edge * row / 3, lat! + Math.sin(a) * h! * edge * row / 3);
          vs.push(v.x, v.y, v.z);
        }
        const tris: number[] = [];
        for (let y = 0; y < 3; y++) for (let k = 0; k < 12; k++) {
          const a = y * 12 + k; const b = y * 12 + (k + 1) % 12;
          tris.push(a, a + 12, b + 12, a, b + 12, b);
        }
        const g = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vs, 3)).setIndex(tris);
        g.computeVertexNormals();
        place(globe, 'F05 abstract surface printing ' + (i + 1), g, i % 2 ? globePrintedAlt : globePrinted);
      });
    }
    const orbitHighlight = artMat(0xc67861, 0.27);
    if (ring) {
      const highlight = place(ring, 'F05 subdued vitrified edge reflection', new THREE.TorusGeometry(0.682, 0.012, 5, 16, 0.66), orbitHighlight);
      highlight.rotation.z = 0.69;
    }
    const mount = new THREE.Group();
    mount.name = 'F05 fold-up orbit sight';
    mount.position.set(-1.61, getOpenPageY(-1.61) + 0.055, 0.68);
    root.add(mount);
    box(mount, 'F05 sight cardstock anchor', 0.57, 0.051, 0.28, slate);
    const hinge = new THREE.Group();
    hinge.name = 'F05 orbit sight crease';
    mount.add(hinge);
    const sight = place(hinge, 'F05 die-cut pupil', new THREE.TorusGeometry(0.133, 0.022, 4, 18), gold, 0, 0.136, 0.028);
    sight.scale.x = 1.28;
    for (const x of [-0.065, 0, 0.065]) box(hinge, 'F05 printed sight graduations', 0.012, 0.051, 0.018, x ? slate : vellum, x, 0.07, 0.052);
    box(hinge, 'F05 die-cut hinge shoulder', 0.305, 0.062, 0.031, paperInk, 0, 0.025, 0.028);
    const catchLight = box(hinge, 'F05 single moving reflection on sight', 0.046, 0.027, 0.018, orbitHighlight, 0, 0.144, 0.061);
    catchLight.castShadow = false;
    let time = 0;
    let opened = 0;
    return {
      root,
      dispose: disposal,
      update(state, dt, reduced) {
        const target = state.interactions.A.active ? 1 : 0;
        if (!reduced) time += Math.min(dt, 0.1);
        opened = reduced ? target : THREE.MathUtils.lerp(opened, target, 1 - Math.exp(-8 * dt));
        hinge.rotation.x = -1.2 * (1 - opened);
        // Axial spin on Y around fixed bearing; separate ring precession and
        // rotation on the orbital plane. Neither World actor parents the other.
        if (globe) globe.rotation.set(0.12, reduced ? 0.35 : time * 0.39 + 0.35, 0.11);
        if (ring) ring.rotation.set(Math.PI / 2 - 0.3, reduced ? 0.08 : 0.16 * Math.sin(time * 0.27), reduced ? 0.23 : time * 0.71);
        const lobe = reduced ? 0 : Math.pow(Math.max(0, Math.cos(time * 0.71 - 0.4)), 8);
        orbitHighlight.emissive.setHex(0xad4c39);
        orbitHighlight.emissiveIntensity = 0.11 * lobe * opened;
        catchLight.position.x = 0.132 * Math.sin(time * 0.71);
        catchLight.visible = !reduced && lobe > 0.18 && opened > 0.75;
        // Existing internal subject idles remain active. This additional small,
        // asynchronous relief weight shift does not move the globe or ring.
        rigs.forEach((r, i) => {
          r.rotation.y = reduced ? 0 : 0.023 * Math.sin(time * (1.14 + i * 0.37) + i * 1.4);
          r.rotation.z = reduced ? 0 : 0.011 * Math.sin(time * (0.90 + i * 0.25) + i * 1.7);
        });
        root.userData.planetAngle = globe?.rotation.y ?? null;
        root.userData.orbitAngle = ring?.rotation.z ?? null;
        root.userData.actorCount = rigs.length;
      },
    };
  }

  // Preserve the authoritative paper ledger and move only its root with a
  // small scoped bump; original panel-fold action and bound pickers stay live.
  const ledger = world.root.children.find((o) => o instanceof THREE.Group && at(o, 1.56, -0.96) && o.children.length === 6);
  const originalLedger = ledger?.position.clone();
  if (ledger && originalLedger) restore.push(() => ledger.position.copy(originalLedger));
  const phases = ['7–30', '31–60', '61–90', '91–120'] as const;
  const channel = new THREE.Group();
  channel.name = 'F06 visible era-index slip';
  channel.position.set(0.48, getOpenPageY(0.48) + 0.029, 0.72);
  root.add(channel);
  box(channel, 'F06 index slip channel', 0.99, 0.028, 0.28, slate);
  for (const side of [-1, 1]) box(channel, 'F06 index channel collar', 0.91, 0.024, 0.030, gold, 0, 0.019, side * 0.121);
  for (const side of [-1, 1]) box(channel, 'F06 index channel tabs', 0.045, 0.045, 0.247, scarlet, side * 0.46, 0.030, 0);
  const sliders = phases.map((era, i) => print(channel, 'F06 separate sliding archive heading ' + era, ['YEARS ' + era], 0.72, 0.176, 0, 0.037, 0, 'page', Boolean(i % 2)));
  const panel = ledger?.children[1];
  const record = panel ? phases.map((era) => print(panel, 'F06 era record labelled ' + era, ['YEARS ' + era, 'CASUALTY TOTAL: ______'], 0.78, 0.197, 0, 0.020, 0, 'page')) : [];
  if (ledger) {
    // Individual ledger entries share the source-backed documented categories
    // with no timeline-specific events or totals invented to vary a page.
    for (let i = 2; i <= 4; i++) {
      const leaf = ledger.children[i];
      if (leaf) print(leaf, 'F06 existing loss category print', ['CLIMATE', 'CRUST', 'INFRASTRUCTURE'].slice(i - 2, i - 1), 0.73, 0.128, 0, 0.019, 0.018, 'page', i % 2 === 0);
    }
  }
  let previous = -1;
  let jiggle = 0;
  return {
    root,
    dispose: disposal,
    update(state, dt, reduced) {
      const selected = THREE.MathUtils.clamp(Math.floor(state.interactions.A.step), 0, phases.length - 1);
      if (previous !== selected) {
        jiggle = previous < 0 || reduced ? 0 : 0.43;
        previous = selected;
      }
      if (reduced) jiggle = 0;
      else jiggle = Math.max(0, jiggle - Math.min(dt, 0.1));
      const signal = jiggle / 0.43;
      const ripple = 0.046 * signal * Math.sin((1 - signal) * 18);
      if (ledger && originalLedger) ledger.position.set(originalLedger.x + ripple * 0.34, originalLedger.y + Math.abs(ripple) * 0.78, originalLedger.z + ripple);
      sliders.forEach((p, i) => {
        if (!p) return;
        p.visible = selected === i;
        p.position.x = 0.086 * ripple / 0.046;
      });
      record.forEach((p, i) => { if (p) p.visible = selected === i; });
      root.userData.eraLabel = phases[selected];
      root.userData.ledgerOpen = state.interactions.C.active;
      root.userData.ledgerJiggle = ripple;
    },
  };
}
