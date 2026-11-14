import * as THREE from 'three';

const STUDIO_BG = new THREE.Color(0x0c0f14);
const _tintCol = new THREE.Color();
const _bgCol = new THREE.Color();

/**
 * Calm studio black slate lighting and 1954-61 overhead classroom projector wash.
 * Replaces fantasy sun/moon orbit, storm clouds, lightning flashes, and weather confetti.
 */
export class AtmosphereSystem {
  public readonly root = new THREE.Group();

  public readonly keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private projectorWashLight: THREE.SpotLight;

  constructor(private scene: THREE.Scene, isSoftwareGl: boolean) {
    // Overhead soft architectural key light
    this.keyLight = new THREE.DirectionalLight(0xfff4e0, 1.12);
    this.keyLight.position.set(3.2, 8.2, 4.4);
    this.keyLight.castShadow = !isSoftwareGl;
    this.keyLight.shadow.mapSize.set(isSoftwareGl ? 512 : 2048, isSoftwareGl ? 512 : 2048);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 28;
    const d = 8.5;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.root.add(this.keyLight);

    // Subtle cool ambient fill balancing slate shadows
    this.hemiLight = new THREE.HemisphereLight(0xb8cde4, 0x161b22, 0.46);
    this.root.add(this.hemiLight);

    // Clean top-rear rim separation for layered cream cardstock against matte black slate
    this.rimLight = new THREE.DirectionalLight(0xd7e4f2, 0.48);
    this.rimLight.position.set(-5.0, 5.2, -6.5);
    this.root.add(this.rimLight);

    // Controlled 4:3 classroom projector wash onto the open book spread
    this.projectorWashLight = new THREE.SpotLight(0xfff0d4, 10.0, 18, Math.PI / 4.2, 0.62, 1.4);
    this.projectorWashLight.position.set(0, 7.6, 0.8);
    this.projectorWashLight.target.position.set(0, 0.24, 0);
    this.root.add(this.projectorWashLight);
    this.root.add(this.projectorWashLight.target);

    scene.fog = new THREE.FogExp2(0x0c0f14, 0.018);
    scene.background = new THREE.Color(0x0c0f14);
  }

  public update(
    elapsed: number,
    bookOpen: boolean,
    ambientHex: string,
    reducedMotion: boolean,
    noFlashMode: boolean,
  ): void {
    _tintCol.set(ambientHex);
    _bgCol.copy(STUDIO_BG).lerp(_tintCol, bookOpen ? 0.22 : 0.06);

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(_bgCol);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(_bgCol);
    }

    // Controlled imperceptible exposure breathing (completely disabled in reducedMotion or noFlashMode)
    const breathe =
      reducedMotion || noFlashMode ? 0 : Math.sin(elapsed * 2.1) * 0.02 + Math.sin(elapsed * 5.7) * 0.008;

    this.keyLight.intensity = 1.12 + breathe;
    this.projectorWashLight.intensity = bookOpen ? 10.5 + breathe * 6 : 4.2;
    this.projectorWashLight.color
      .setHex(0xfff1d8)
      .lerp(_tintCol, 0.14);
  }
}
