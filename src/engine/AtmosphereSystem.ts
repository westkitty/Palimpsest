import * as THREE from 'three';
import { QualityTier, WeatherPreset } from '../types/atlas';
import { BOOK_BASE_Y } from './BookAndDeskRig';

const _vec3 = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _euler = new THREE.Euler();

const _colA = new THREE.Color();
const _colB = new THREE.Color();

const SKY_NIGHT = new THREE.Color(0x0b101d);
const SKY_DAWN = new THREE.Color(0x3a2933);
const SKY_DAY = new THREE.Color(0x28211b); // warm atelier gallery twilight-day backdrop so candle & book pop
const SKY_DUSK = new THREE.Color(0x2e1c1a);
const SKY_OVERCAST = new THREE.Color(0x1f242b);
const SKY_STORM = new THREE.Color(0x11151d);

interface RainDropData {
  x: number;
  y: number;
  z: number;
  speed: number;
}

interface RippleData {
  x: number;
  z: number;
  phase: number;
  speed: number;
  active: boolean;
}

interface MistData {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  speed: number;
  phase: number;
}

export class AtmosphereSystem {
  public readonly root = new THREE.Group();

  public readonly keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private lightningLight: THREE.PointLight;

  private sunGroup = new THREE.Group();
  private moonGroup = new THREE.Group();
  private starsPoints: THREE.Points;
  private starsMat: THREE.PointsMaterial;

  // Weather meshes
  private rainMesh: THREE.InstancedMesh;
  private rainDrops: RainDropData[] = [];
  private rippleMesh: THREE.InstancedMesh;
  private ripples: RippleData[] = [];
  private cloudsGroup = new THREE.Group();
  private mistGroup = new THREE.Group();
  private mistItems: MistData[] = [];
  private windRibbonsGroup = new THREE.Group();
  private windRibbons: THREE.Mesh[] = [];

  private lightningTimer = 3.5;
  private lightningFlash = 0;
  public onThunder?: () => void;

  public nightFactor = 0; // 0 = noon, 1 = midnight
  public readonly sunWorldPos = new THREE.Vector3(0, 6, -3.8);
  public sunsetFactor = 0;
  public currentLightning = 0;

  constructor(private scene: THREE.Scene, isSoftwareGl: boolean) {
    // 1. Key Light (Sun / Moon)
    this.keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    this.keyLight.castShadow = !isSoftwareGl;
    this.keyLight.shadow.mapSize.set(isSoftwareGl ? 512 : 2048, isSoftwareGl ? 512 : 2048);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 32;
    const d = 9.5;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.root.add(this.keyLight);

    // 2. Cool/Warm Hemisphere Fill
    this.hemiLight = new THREE.HemisphereLight(0xaec6e8, 0x3b2718, 0.78);
    this.root.add(this.hemiLight);

    // 3. Subtle Rim Light to separate paper silhouettes from dark desk
    this.rimLight = new THREE.DirectionalLight(0xd4af6e, 0.55);
    this.rimLight.position.set(-6, 5, -7);
    this.root.add(this.rimLight);

    // 4. Lightning Flash Light
    this.lightningLight = new THREE.PointLight(0xcbe2ff, 0, 28, 1.4);
    this.lightningLight.position.set(0, 7, -2);
    this.root.add(this.lightningLight);

    // 5. Physical Miniature Paper & Brass Sun + Crescent Moon
    this.buildCelestialBodies();

    // 6. Starfield Dome
    const starCount = 320;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42;
      const r = 18 + Math.random() * 6;
      starPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      starPos[i * 3 + 1] = Math.cos(phi) * r + 1.2;
      starPos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starsMat = new THREE.PointsMaterial({
      color: 0xf7e7be,
      size: 0.14,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.starsPoints = new THREE.Points(starGeo, this.starsMat);
    this.root.add(this.starsPoints);

    // 7. Instanced Rain Streaks
    const rainCount = 260;
    const rainGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.36, 4);
    const rainMat = new THREE.MeshBasicMaterial({
      color: 0xb7d4ee,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.visible = false;
    for (let i = 0; i < rainCount; i++) {
      this.rainDrops.push({
        x: (Math.random() - 0.5) * 9.5,
        y: Math.random() * 6.5 + 0.5,
        z: (Math.random() - 0.5) * 6.5,
        speed: 6.5 + Math.random() * 3.5,
      });
    }
    this.root.add(this.rainMesh);

    // 8. Instanced Water Ripples
    const rippleCount = 36;
    const rippleGeo = new THREE.RingGeometry(0.08, 0.11, 20);
    rippleGeo.rotateX(-Math.PI / 2);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xdff2ff,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.rippleMesh = new THREE.InstancedMesh(rippleGeo, rippleMat, rippleCount);
    this.rippleMesh.frustumCulled = false;
    this.rippleMesh.visible = false;
    for (let i = 0; i < rippleCount; i++) {
      this.ripples.push({
        x: (Math.random() - 0.5) * 7.2,
        z: (Math.random() - 0.5) * 4.4,
        phase: Math.random(),
        speed: 0.9 + Math.random() * 0.7,
        active: true,
      });
    }
    this.root.add(this.rippleMesh);

    // 9. Layered Paper Cloud Canopy (Overcast / Rain / Storm)
    this.buildPaperClouds();
    this.root.add(this.cloudsGroup);

    // 10. Valley Mist Ribbons
    this.buildMistLayers();
    this.root.add(this.mistGroup);

    // 11. Wind Swirl Ribbons
    this.buildWindRibbons();
    this.root.add(this.windRibbonsGroup);

    scene.fog = new THREE.FogExp2(0x28211b, 0.022);
    scene.background = new THREE.Color(0x28211b);
  }

  private buildCelestialBodies(): void {
    // Sculpted paper/brass Sun
    const sunDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16),
      new THREE.MeshStandardMaterial({
        color: 0xf7cf74,
        emissive: 0xe69c38,
        emissiveIntensity: 0.85,
        roughness: 0.3,
        metalness: 0.6,
      }),
    );
    sunDisc.rotation.x = Math.PI / 2;
    this.sunGroup.add(sunDisc);

    const rayGeo = new THREE.ConeGeometry(0.09, 0.28, 4);
    const rayMat = new THREE.MeshStandardMaterial({
      color: 0xd4af6e,
      emissive: 0xc27f2a,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.75,
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0);
      ray.rotation.z = a - Math.PI / 2;
      this.sunGroup.add(ray);
    }
    this.root.add(this.sunGroup);

    // Sculpted Crescent Moon
    const moonShape = new THREE.Shape();
    moonShape.absarc(0, 0, 0.38, -Math.PI * 0.45, Math.PI * 0.45, false);
    moonShape.absarc(0.16, 0, 0.32, Math.PI * 0.4, -Math.PI * 0.4, true);
    const moonGeo = new THREE.ExtrudeGeometry(moonShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    moonGeo.center();
    const moonMesh = new THREE.Mesh(
      moonGeo,
      new THREE.MeshStandardMaterial({
        color: 0xe8effa,
        emissive: 0x89a8d8,
        emissiveIntensity: 0.75,
        roughness: 0.35,
        metalness: 0.25,
      }),
    );
    this.moonGroup.add(moonMesh);
    this.root.add(this.moonGroup);
  }

  private buildPaperClouds(): void {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xd8dce3,
      roughness: 0.92,
      metalness: 0.02,
      transparent: true,
      opacity: 0.86,
    });

    const positions = [
      [-2.8, 4.3, -1.8, 1.1],
      [0.4, 4.6, -2.4, 1.3],
      [3.0, 4.2, -1.2, 0.95],
      [-1.4, 4.5, 1.6, 1.0],
      [2.1, 4.4, 1.9, 1.1],
    ];

    positions.forEach(([x, y, z, sc]) => {
      const cluster = new THREE.Group();
      cluster.position.set(x, y, z);
      cluster.scale.setScalar(sc);

      const puffs = [
        [0, 0, 0, 0.65, 0.28, 0.45],
        [-0.45, -0.05, 0.1, 0.48, 0.22, 0.38],
        [0.48, -0.04, -0.08, 0.52, 0.24, 0.4],
      ];
      puffs.forEach(([px, py, pz, sx, sy, sz]) => {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), cloudMat);
        puff.position.set(px, py, pz);
        puff.scale.set(sx, sy, sz);
        puff.castShadow = true;
        cluster.add(puff);
      });
      this.cloudsGroup.add(cluster);
    });
    this.cloudsGroup.visible = false;
  }

  private buildMistLayers(): void {
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xdfe8ec,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 8; i++) {
      const w = 2.4 + (i % 3) * 0.9;
      const d = 1.1 + (i % 2) * 0.5;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mistMat);
      plane.rotation.x = -Math.PI / 2;
      const bx = ((i % 4) - 1.5) * 1.9;
      const bz = (Math.floor(i / 4) - 0.5) * 2.2;
      plane.position.set(bx, BOOK_BASE_Y + 0.18 + (i % 3) * 0.14, bz);
      this.mistGroup.add(plane);
      this.mistItems.push({
        mesh: plane,
        baseX: bx,
        baseZ: bz,
        speed: 0.28 + (i % 3) * 0.12,
        phase: i * 1.1,
      });
    }
    this.mistGroup.visible = false;
  }

  private buildWindRibbons(): void {
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0xf0e6d2,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 5; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4.2, 0.8 + i * 0.35, -1.8 + i * 0.85),
        new THREE.Vector3(-1.4, 1.05 + i * 0.35, -1.5 + i * 0.85),
        new THREE.Vector3(1.5, 0.78 + i * 0.35, -2.0 + i * 0.85),
        new THREE.Vector3(4.3, 1.15 + i * 0.35, -1.6 + i * 0.85),
      ]);
      const geo = new THREE.TubeGeometry(curve, 24, 0.016, 4, false);
      const mesh = new THREE.Mesh(geo, ribbonMat);
      this.windRibbonsGroup.add(mesh);
      this.windRibbons.push(mesh);
    }
    this.windRibbonsGroup.visible = false;
  }

  public update(
    dt: number,
    elapsed: number,
    timeOfDay: number,
    weather: WeatherPreset,
    quality: QualityTier,
    bookOpen: boolean,
    biomeHex?: string,
  ): void {
    // 1. Sun & Moon Orbital Arc
    // 6:00 = sunrise (angle 0), 12:00 = zenith (PI/2), 18:00 = sunset (PI)
    const sunAngle = ((timeOfDay - 6) / 24) * Math.PI * 2;
    const orbitRadius = 9.2;
    const sunX = Math.cos(sunAngle) * orbitRadius;
    const sunY = Math.sin(sunAngle) * orbitRadius * 0.85;
    const sunZ = -3.8;

    const moonX = -sunX;
    const moonY = -sunY;
    const moonZ = -3.8;

    const isDay = sunY > -0.35;
    const clampedSunY = Math.max(-2.5, sunY);
    this.sunGroup.position.set(sunX, clampedSunY, sunZ);
    this.sunWorldPos.set(sunX, clampedSunY, sunZ);
    this.sunGroup.visible = bookOpen && sunY > -1.2;
    this.sunGroup.rotation.z = elapsed * 0.25;

    this.moonGroup.position.set(moonX, Math.max(-2.5, moonY), moonZ);
    this.moonGroup.visible = bookOpen && moonY > -1.2;

    // Day/night blend factor (0 = midday, 1 = deep night)
    const sunElev = Math.sin(sunAngle);
    this.nightFactor = THREE.MathUtils.clamp(1 - (sunElev + 0.15) / 0.55, 0, 1);

    // Volumetric light shaft horizon factor: peaks at dawn & sunset
    const horizonBand =
      THREE.MathUtils.smoothstep(sunElev, -0.18, 0.08) *
      (1 - THREE.MathUtils.smoothstep(sunElev, 0.24, 0.62));
    const shaftWeatherScale =
      weather === 'thunderstorm'
        ? 0.18
        : weather === 'overcast'
          ? 0.3
          : weather === 'rain'
            ? 0.38
            : weather === 'mist'
              ? 0.92
              : 1.0;
    this.sunsetFactor = bookOpen ? horizonBand * shaftWeatherScale : 0;

    // Key light follows active celestial body
    if (isDay) {
      this.keyLight.position.set(sunX * 0.85, Math.max(2.2, sunY), sunZ + 2.5);
    } else {
      this.keyLight.position.set(moonX * 0.85, Math.max(2.6, moonY), moonZ + 2.5);
    }

    // 2. Sky, Fog & Light Colors
    if (sunElev > 0.25) {
      _colA.copy(SKY_DAY);
    } else if (sunElev > -0.1) {
      const t = (sunElev + 0.1) / 0.35;
      _colA.copy(timeOfDay < 12 ? SKY_DAWN : SKY_DUSK).lerp(SKY_DAY, t);
    } else {
      const t = THREE.MathUtils.clamp((sunElev + 0.45) / 0.35, 0, 1);
      _colA.copy(SKY_NIGHT).lerp(timeOfDay < 12 ? SKY_DAWN : SKY_DUSK, t);
    }

    if (biomeHex && bookOpen) {
      _colB.set(biomeHex);
      _colA.lerp(_colB, 0.26 * (1 - this.nightFactor * 0.45));
    }

    // Weather atmospheric tint
    if (weather === 'overcast' || weather === 'rain' || weather === 'mist') {
      _colA.lerp(SKY_OVERCAST, 0.55);
    } else if (weather === 'thunderstorm') {
      _colA.lerp(SKY_STORM, 0.78);
    }

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(_colA);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(_colA);
      const baseDensity = weather === 'mist' ? 0.036 : weather === 'thunderstorm' ? 0.03 : 0.02;
      this.scene.fog.density = baseDensity;
    }

    // Key light intensity & color
    const weatherDim =
      weather === 'thunderstorm'
        ? 0.42
        : weather === 'rain' || weather === 'overcast'
          ? 0.62
          : weather === 'mist'
            ? 0.72
            : 1.0;

    if (isDay) {
      const golden = 1 - THREE.MathUtils.clamp(sunElev / 0.45, 0, 1);
      _colB.setHex(0xfff2d8).lerp(new THREE.Color(0xff9a52), golden * 0.75);
      this.keyLight.color.copy(_colB);
      this.keyLight.intensity = (1.35 + sunElev * 1.45) * weatherDim;
      this.hemiLight.color.setHex(0x9fc0e6).lerp(new THREE.Color(0xd69f74), golden * 0.45);
      this.hemiLight.intensity = (0.7 + sunElev * 0.25) * weatherDim;
    } else {
      this.keyLight.color.setHex(0x8bb0e8);
      this.keyLight.intensity = (0.65 + this.nightFactor * 0.35) * weatherDim;
      this.hemiLight.color.setHex(0x3a4d75);
      this.hemiLight.intensity = 0.48 * weatherDim;
    }

    // Starfield opacity
    const starVis =
      weather === 'thunderstorm' || weather === 'overcast'
        ? 0.15
        : 1.0;
    this.starsMat.opacity = this.nightFactor * 0.85 * starVis;
    this.starsPoints.rotation.y = elapsed * 0.008;

    // 3. Weather Systems
    this.updateWeatherFX(dt, elapsed, weather, quality, bookOpen);
  }

  private updateWeatherFX(
    dt: number,
    elapsed: number,
    weather: WeatherPreset,
    quality: QualityTier,
    bookOpen: boolean,
  ): void {
    const isRain = weather === 'rain' || weather === 'thunderstorm';
    const isWindy = weather === 'windy' || weather === 'thunderstorm';

    // Clouds
    this.cloudsGroup.visible =
      bookOpen && (weather === 'overcast' || weather === 'rain' || weather === 'thunderstorm');
    if (this.cloudsGroup.visible) {
      this.cloudsGroup.children.forEach((c, idx) => {
        c.position.x += Math.sin(elapsed * 0.25 + idx) * dt * 0.14;
      });
    }

    // Rain & Ripples
    this.rainMesh.visible = isRain;
    this.rippleMesh.visible = bookOpen && isRain;
    const activeDropRatio = quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : 1;

    if (isRain) {
      const slant = weather === 'thunderstorm' ? -0.26 : -0.06;
      const limit = Math.floor(this.rainDrops.length * activeDropRatio);
      for (let i = 0; i < this.rainDrops.length; i++) {
        if (i >= limit) {
          _scale.set(0, 0, 0);
          _mat4.compose(_vec3.set(0, -10, 0), _quat.identity(), _scale);
          this.rainMesh.setMatrixAt(i, _mat4);
          continue;
        }
        const drop = this.rainDrops[i];
        drop.y -= drop.speed * dt;
        drop.x += slant * drop.speed * dt;
        if (drop.y < BOOK_BASE_Y) {
          drop.y = 6.2 + Math.random() * 1.4;
          drop.x = (Math.random() - 0.5) * 9.5;
          drop.z = (Math.random() - 0.5) * 6.2;
        }
        _vec3.set(drop.x, drop.y, drop.z);
        _euler.set(0, 0, -slant);
        _quat.setFromEuler(_euler);
        _scale.set(1, weather === 'thunderstorm' ? 1.35 : 1, 1);
        _mat4.compose(_vec3, _quat, _scale);
        this.rainMesh.setMatrixAt(i, _mat4);
      }
      this.rainMesh.instanceMatrix.needsUpdate = true;

      if (this.rippleMesh.visible) {
        for (let i = 0; i < this.ripples.length; i++) {
          const r = this.ripples[i];
          r.phase += dt * r.speed;
          if (r.phase > 1) {
            r.phase = 0;
            r.x = (Math.random() - 0.5) * 7.2;
            r.z = (Math.random() - 0.5) * 4.4;
          }
          const s = 0.4 + r.phase * 2.2;
          _vec3.set(r.x, BOOK_BASE_Y + 0.032, r.z);
          _quat.identity();
          _scale.set(s, 1, s * (1 - r.phase * 0.25));
          _mat4.compose(_vec3, _quat, _scale);
          this.rippleMesh.setMatrixAt(i, _mat4);
        }
        this.rippleMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // Thunder & Lightning
    if (weather === 'thunderstorm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningFlash = 1.0;
        this.lightningTimer = 3.2 + Math.random() * 5.0;
        this.onThunder?.();
      }
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.8);
      this.lightningLight.intensity = this.lightningFlash * 18;
      if (this.lightningFlash > 0.15 && this.scene.background instanceof THREE.Color) {
        this.scene.background.lerp(new THREE.Color(0x52698a), this.lightningFlash * 0.45);
      }
    } else {
      this.lightningFlash = 0;
      this.lightningLight.intensity = 0;
    }
    this.currentLightning = this.lightningFlash;

    // Mist
    this.mistGroup.visible = bookOpen && weather === 'mist';
    if (this.mistGroup.visible) {
      this.mistItems.forEach((m) => {
        m.mesh.position.x = m.baseX + Math.sin(elapsed * m.speed + m.phase) * 0.95;
        m.mesh.position.z = m.baseZ + Math.cos(elapsed * m.speed * 0.7 + m.phase) * 0.45;
      });
    }

    // Wind Ribbons
    this.windRibbonsGroup.visible = bookOpen && isWindy;
    if (this.windRibbonsGroup.visible) {
      this.windRibbons.forEach((rib, idx) => {
        const cycle = ((elapsed * 1.4 + idx * 0.35) % 2.0) - 1.0;
        rib.position.x = cycle * 1.2;
        rib.position.y = Math.sin(elapsed * 2.2 + idx) * 0.12;
      });
    }
  }
}
