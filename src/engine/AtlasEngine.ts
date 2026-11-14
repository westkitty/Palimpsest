import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { narrationEngine } from '../audio/NarrationEngine';
import { soundEngine } from '../audio/SoundEngine';
import { atlasStore } from '../state/atlasStore';
import { ADMINISTRATION_SLOGAN, FOLIO_BY_WORLD } from '../story/historyManifest';
import {
  CameraMode,
  FolioInteractionSlot,
  TOTAL_WORLDS,
  Vec2Point,
  WorldId,
} from '../types/atlas';
import { AtmosphereSystem } from './AtmosphereSystem';
import { AtmosphericPostShader } from './AtmosphericPostShader';
import { BOOK_BASE_Y, BOOK_PAGE_D, BOOK_SPREAD_W, BookAndDeskRig } from './BookAndDeskRig';
import { BaseFolioWorld } from './folios/BaseFolioWorld';
import { F10FolioWorld, F11FolioWorld, F12FolioWorld } from './folios/FoliosAftermath';
import { F01FolioWorld, F02FolioWorld, F03FolioWorld } from './folios/FoliosEarly';
import { F04FolioWorld, F05FolioWorld, F06FolioWorld } from './folios/FoliosWar1';
import { F07FolioWorld, F08FolioWorld, F09FolioWorld } from './folios/FoliosWar2';
import { createProceduralTextures, ProceduralTexturePack } from './proceduralTextures';

const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _hitPoint = new THREE.Vector3();
const _spreadPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BOOK_BASE_Y);
const _camTargetGoal = new THREE.Vector3();
const _camPosGoal = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _magGoal = new THREE.Vector3();
const _immersionStep = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _hoverWorldPos = new THREE.Vector3();
const _hoverProjPos = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class AtlasEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private textures: ProceduralTexturePack;
  private bookRig: BookAndDeskRig;
  private atmosphere: AtmosphereSystem;
  private composer: EffectComposer;
  private postPass: ShaderPass;
  private folios: BaseFolioWorld[];

  private magnifierMesh: THREE.Group;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;
  private pausedRendering = false;
  private clock = new THREE.Clock();
  private elapsed = 0;

  private bookOpenProgress = 0;
  private pageTurnActive = false;
  private pageTurnDirection: 1 | -1 = 1;
  private pageTurnTargetWorld: WorldId = 0;
  private pageTurnProgress = 0;
  private pageTurnDragging = false;
  private cornerHoverLift = 0;

  private lastHoverCheck = 0;
  private hoveredHighlight: {
    mesh: THREE.Mesh;
    origHex: number;
    origIntensity: number;
  } | null = null;
  private hasPlayedPrologue = false;

  private cameraPresetActive = true;
  private lastCameraMode: CameraMode = 'inspection';
  private keysPressed = new Set<string>();
  private draggingMagnifier = false;

  public onContextLost?: (lost: boolean) => void;

  constructor(private container: HTMLElement) {
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 0.85 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(
      Math.max(1, container.clientWidth),
      Math.max(1, container.clientHeight),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const initialAspect = Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(
      this.computeCameraFov(initialAspect),
      initialAspect,
      0.1,
      80,
    );
    this.camera.position.set(0.45, 5.2, 5.35);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.minDistance = 1.4;
    this.controls.maxDistance = 26;
    this.controls.target.set(0, 0.3, 0.28);

    this.controls.addEventListener('start', () => {
      this.cameraPresetActive = false;
    });

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    this.bookRig = new BookAndDeskRig(this.textures);
    this.scene.add(this.bookRig.root);

    this.atmosphere = new AtmosphereSystem(this.scene, this.isSoftwareGl);
    this.scene.add(this.atmosphere.root);

    // Instantiate all twelve historical folios F01..F12
    const snap = atlasStore.getSnapshot();
    const bump = this.textures.paperGrainBump;
    const shadow = this.textures.contactShadow;
    this.folios = [
      new F01FolioWorld(0, bump, shadow),
      new F02FolioWorld(1, bump, shadow),
      new F03FolioWorld(2, bump, shadow),
      new F04FolioWorld(3, bump, shadow),
      new F05FolioWorld(4, bump, shadow),
      new F06FolioWorld(5, bump, shadow),
      new F07FolioWorld(6, bump, shadow),
      new F08FolioWorld(7, bump, shadow),
      new F09FolioWorld(8, bump, shadow),
      new F10FolioWorld(9, bump, shadow),
      new F11FolioWorld(10, bump, shadow),
      new F12FolioWorld(11, bump, shadow),
    ];

    this.folios.forEach((f, idx) => {
      f.build(snap.worlds[idx]);
      f.setFoldFactor(idx === snap.activeWorld && snap.bookPhase === 'open' ? 1 : 0);
      this.scene.add(f.root);
    });

    this.magnifierMesh = this.buildMagnifierProp();
    this.magnifierMesh.visible = false;
    this.scene.add(this.magnifierMesh);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.postPass = new ShaderPass(AtmosphericPostShader);
    this.composer.addPass(this.postPass);
    this.composer.addPass(new OutputPass());
    this.applyQualitySettings();
    this.composer.setSize(
      Math.max(1, container.clientWidth),
      Math.max(1, container.clientHeight),
    );
    this.postPass.uniforms.uResolution.value.set(
      Math.max(1, container.clientWidth),
      Math.max(1, container.clientHeight),
    );

    this.bindEvents();
    this.applyCameraPreset('inspection');
    this.camera.position.copy(_camPosGoal);
    this.controls.target.copy(_camTargetGoal);
    this.controls.update();
    this.startLoop();
  }

  private buildMagnifierProp(): THREE.Group {
    const g = new THREE.Group();
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xbda166,
      roughness: 0.34,
      metalness: 0.88,
    });
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.52,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xeaf6fb,
      roughness: 0.06,
      transparent: true,
      opacity: 0.3,
      clearcoat: 1.0,
    });

    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.042, 12, 32), brassMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.castShadow = true;

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 28), lensMat);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.82, 10), handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, -0.02, 1.08);
    handle.castShadow = true;

    g.add(bezel, glass, handle);
    return g;
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private onVisibilityChange = () => {
    this.pausedRendering = document.hidden;
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.onContextLost?.(true);
  };

  private handleContextRestored = () => {
    this.onContextLost?.(false);
  };

  private computeCameraFov(aspect: number): number {
    if (aspect >= 1.15) return 40;
    return THREE.MathUtils.clamp(40 + (1.15 - aspect) * 32, 40, 62);
  }

  private onResize = () => {
    if (this.disposed) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = this.computeCameraFov(aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.applyQualitySettings();
    this.composer.setSize(w, h);
    this.postPass.uniforms.uResolution.value.set(w, h);
    if (this.cameraPresetActive) {
      this.applyCameraPreset(this.lastCameraMode);
    }
  };

  private applyQualitySettings(): void {
    const tier = atlasStore.getSnapshot().qualityTier;
    const dpr = window.devicePixelRatio || 1;
    const ratio = this.isSoftwareGl
      ? 0.85
      : tier === 'low'
        ? 1
        : tier === 'medium'
          ? Math.min(dpr, 1.5)
          : Math.min(dpr, 2);
    this.renderer.setPixelRatio(ratio);
    this.composer?.setPixelRatio(ratio);
  }

  public setRenderingPaused(paused: boolean): void {
    this.pausedRendering = paused;
    if (!paused && !this.disposed) {
      this.clock.getDelta();
      this.onResize();
      this.stepSimulation(0.016, 0.016);
      if (this.isSoftwareGl) {
        this.renderer.render(this.scene, this.camera);
      } else {
        this.composer.render();
      }
    }
  }

  public openBook(): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase !== 'closed') return;
    soundEngine.playBookOpen();
    atlasStore.setBookPhase('opening');
    this.applyCameraPreset('diorama');
    this.bookRig.setActiveWorldSpread(snap.activeWorld);
    this.syncWorld(snap.activeWorld);
    if (!this.hasPlayedPrologue) {
      this.hasPlayedPrologue = true;
      narrationEngine.playPrologueAndFolio(snap.activeWorld);
    } else {
      narrationEngine.playFolioCore(snap.activeWorld);
    }
  }

  public closeBook(): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase === 'closed') return;
    soundEngine.playPageTurn();
    narrationEngine.stop();
    atlasStore.setBookPhase('closed');
    this.applyCameraPreset('inspection');
  }

  public turnToWorld(targetWorld: WorldId): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase === 'closed') {
      atlasStore.setActiveWorld(targetWorld);
      this.bookRig.setActiveWorldSpread(targetWorld);
      this.syncWorld(targetWorld);
      this.openBook();
      return;
    }
    if (snap.bookPhase === 'opening') {
      this.bookOpenProgress = 1;
      this.bookRig.setBookOpenProgress(1);
      atlasStore.setBookPhase('open');
    }
    if (this.pageTurnActive) {
      const committed = this.pageTurnTargetWorld;
      this.pageTurnActive = false;
      this.pageTurnProgress = 0;
      atlasStore.setActiveWorld(committed);
      this.bookRig.setActiveWorldSpread(committed);
      this.syncWorld(committed);
      if (targetWorld === committed) return;
    } else if (targetWorld === snap.activeWorld) {
      return;
    }

    const currentWorld = atlasStore.getSnapshot().activeWorld;
    soundEngine.playPageTurn();
    this.pageTurnActive = true;
    this.pageTurnDragging = false;
    this.pageTurnDirection = targetWorld > currentWorld ? 1 : -1;
    this.pageTurnTargetWorld = targetWorld;
    this.pageTurnProgress = this.pageTurnDirection === 1 ? 0.02 : 0.98;
    atlasStore.setPageTurnState(targetWorld, this.pageTurnProgress);
    narrationEngine.playFolioCore(targetWorld);
  }

  public triggerInteraction(slot: FolioInteractionSlot, explicitWorld?: WorldId): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase === 'closed') {
      this.openBook();
      return;
    }
    const worldId = explicitWorld ?? snap.activeWorld;
    atlasStore.activateInteraction(worldId, slot);
    soundEngine.playInteractionCue(slot, worldId);
    narrationEngine.playInteractionCue(worldId, slot);
    this.syncWorld(worldId);
  }

  public syncWorld(worldId: WorldId): void {
    const snap = atlasStore.getSnapshot();
    const folio = this.folios[worldId];
    folio.syncState(snap.worlds[worldId], snap.activeDraxisId, this.elapsed);
  }

  public syncAllWorlds(): void {
    const snap = atlasStore.getSnapshot();
    this.folios.forEach((f, idx) => f.syncState(snap.worlds[idx], snap.activeDraxisId, this.elapsed));
    this.bookRig.setActiveWorldSpread(snap.activeWorld);
  }

  public applyCameraPreset(mode: CameraMode): void {
    this.lastCameraMode = mode;
    this.cameraPresetActive = true;
    const isClosed = atlasStore.getSnapshot().bookPhase === 'closed';
    const aspect = this.camera.aspect || 1;
    const nextFov = this.computeCameraFov(aspect);
    if (Math.abs(this.camera.fov - nextFov) > 0.05) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }

    if (isClosed && mode === 'inspection') {
      _camPosGoal.set(0.45, 5.2, 5.35);
      _camTargetGoal.set(0, 0.3, 0.28);
    } else if (mode === 'inspection') {
      _camPosGoal.set(0.45, 5.7, 7.6);
      _camTargetGoal.set(0, 0.22, 0.1);
    } else if (mode === 'diorama') {
      // Controlled 4:3 overhead instructional framing showing full book relief & A/B/C pull-tabs above dock
      _camPosGoal.set(0, 4.72, 4.65);
      _camTargetGoal.set(0, 0.25, 0.14);
    } else {
      // Close inspection view on active 4:3 model
      _camPosGoal.set(-0.25, 1.48, 2.38);
      _camTargetGoal.set(0, 0.44, -0.15);
    }

    // On narrow/portrait viewports, pull back proportionally along the view ray so the full book fits horizontally
    // and nudge the target forward so the spread rests cleanly in the window between top header and bottom dock.
    if (aspect < 1.15) {
      const portraitT = THREE.MathUtils.clamp((1.15 - aspect) / 0.72, 0, 1);
      let distScale = 1;
      if (isClosed && mode === 'inspection') {
        distScale = 1 + portraitT * 0.55;
        _camTargetGoal.z += portraitT * 0.45;
      } else if (mode === 'diorama') {
        distScale = 1 + portraitT * 1.85;
        _camTargetGoal.z += portraitT * 0.55;
      } else if (mode === 'inspection') {
        distScale = 1 + portraitT * 1.15;
        _camTargetGoal.z += portraitT * 0.45;
      } else {
        distScale = 1 + portraitT * 0.85;
      }
      _camPosGoal.sub(_camTargetGoal).multiplyScalar(distScale).add(_camTargetGoal);
    }
  }

  public nudgeImmersion(dx: number, dz: number): void {
    _moveDir.set(dx, 0, dz).multiplyScalar(0.42);
    this.camera.position.add(_moveDir);
    this.controls.target.add(_moveDir);
    this.cameraPresetActive = false;
  }

  public nudgeMagnifier(dx: number, dz: number): void {
    const p = atlasStore.getSnapshot().magnifierPos;
    const hadSecret = atlasStore.getSnapshot().activeSecret !== null;
    atlasStore.updateMagnifier({ x: p.x + dx, z: p.z + dz });
    const nowSecret = atlasStore.getSnapshot().activeSecret !== null;
    if (!hadSecret && nowSecret) soundEngine.playSecretReveal();
  }

  public restartSessionAndSync(): void {
    narrationEngine.stop();
    atlasStore.restartHistorySession();
    this.syncAllWorlds();
    soundEngine.playBookOpen();
  }

  public capturePlateSnapshotUrl(): string | null {
    if (this.disposed) return null;
    if (this.isSoftwareGl) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }

    const srcCanvas = this.renderer.domElement;
    const cardW = 1600;
    const cardH = 1120;
    const card = document.createElement('canvas');
    card.width = cardW;
    card.height = cardH;
    const ctx = card.getContext('2d');
    if (!ctx) return null;

    const snap = atlasStore.getSnapshot();
    const manifest = FOLIO_BY_WORLD[snap.activeWorld];

    // Archival cardstock plate matting
    ctx.fillStyle = '#EFE9DA';
    ctx.fillRect(0, 0, cardW, cardH);

    ctx.strokeStyle = '#20262E';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, cardW - 56, cardH - 56);

    const viewX = 64;
    const viewY = 60;
    const viewW = cardW - 128;
    const viewH = cardH - 224;
    const srcAspect = srcCanvas.width / Math.max(1, srcCanvas.height);
    const dstAspect = viewW / viewH;
    let sx = 0;
    let sy = 0;
    let sw = srcCanvas.width;
    let sh = srcCanvas.height;
    if (srcAspect > dstAspect) {
      sw = Math.floor(srcCanvas.height * dstAspect);
      sx = Math.floor((srcCanvas.width - sw) / 2);
    } else {
      sh = Math.floor(srcCanvas.width / dstAspect);
      sy = Math.floor((srcCanvas.height - sh) / 2);
    }

    ctx.fillStyle = '#0D1014';
    ctx.fillRect(viewX, viewY, viewW, viewH);
    ctx.drawImage(srcCanvas, sx, sy, sw, sh, viewX, viewY, viewW, viewH);

    ctx.fillStyle = '#20262E';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText(`PALIMPSEST · ${manifest.code}: ${manifest.title.toUpperCase()}`, 64, cardH - 102);

    ctx.font = '20px "Courier New", monospace';
    ctx.fillText(`${manifest.temporalMarker} · ${manifest.eraLabel}`, 64, cardH - 60);

    ctx.textAlign = 'right';
    ctx.fillText(`ADMINISTRATION RECONSTRUCTION · ${ADMINISTRATION_SLOGAN}`, cardW - 64, cardH - 60);
    ctx.textAlign = 'left';
    return card.toDataURL('image/png');
  }

  private updateNdc(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getSpreadIntersection(clientX: number, clientY: number): Vec2Point | null {
    this.updateNdc(clientX, clientY);
    _raycaster.setFromCamera(_ndc, this.camera);
    if (_raycaster.ray.intersectPlane(_spreadPlane, _hitPoint)) {
      if (
        Math.abs(_hitPoint.x) <= BOOK_SPREAD_W / 2 - 0.15 &&
        Math.abs(_hitPoint.z) <= BOOK_PAGE_D / 2 - 0.15
      ) {
        return { x: _hitPoint.x, z: _hitPoint.z };
      }
    }
    return null;
  }

  private findMechanismData(
    obj: THREE.Object3D | null,
  ): { interactionType: string; slot?: FolioInteractionSlot; worldId?: WorldId } | null {
    let curr: THREE.Object3D | null = obj;
    while (curr) {
      if (curr.userData?.interactionType) {
        return curr.userData as {
          interactionType: string;
          slot?: FolioInteractionSlot;
          worldId?: WorldId;
        };
      }
      curr = curr.parent;
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    soundEngine.unlock();
    const snap = atlasStore.getSnapshot();
    this.updateNdc(e.clientX, e.clientY);
    _raycaster.setFromCamera(_ndc, this.camera);

    // Inspection lens on slate desk
    const deskHits = _raycaster.intersectObjects(this.bookRig.deskInteractables, false);
    if (deskHits.length > 0 && snap.bookPhase === 'open') {
      if (deskHits[0].object.userData.interactionType === 'deskMagnifier') {
        atlasStore.setActiveTool(snap.activeTool === 'magnifier' ? 'explore' : 'magnifier');
        soundEngine.playPaperFold();
        return;
      }
    }

    if (snap.bookPhase === 'closed') {
      const hits = _raycaster.intersectObject(this.bookRig.claspHitMesh, false);
      if (hits.length > 0) {
        this.openBook();
      }
      return;
    }

    // Physical page corner turn
    if (snap.activeTool === 'explore' || snap.activeTool === 'pageTurn') {
      const cornerHits = _raycaster.intersectObjects(
        [this.bookRig.cornerRightHit, this.bookRig.cornerLeftHit],
        false,
      );
      if (cornerHits.length > 0) {
        const dir = cornerHits[0].object.userData.direction as 1 | -1;
        const target = ((snap.activeWorld + dir + TOTAL_WORLDS) % TOTAL_WORLDS) as WorldId;
        this.controls.enabled = false;
        this.pageTurnActive = true;
        this.pageTurnDragging = true;
        this.pageTurnDirection = dir;
        this.pageTurnTargetWorld = target;
        this.pageTurnProgress = dir === 1 ? 0.05 : 0.95;
        soundEngine.playPageTurn();
        return;
      }
    }

    if (snap.activeTool === 'magnifier') {
      const pt = this.getSpreadIntersection(e.clientX, e.clientY);
      if (pt) {
        this.controls.enabled = false;
        this.draggingMagnifier = true;
        atlasStore.updateMagnifier(pt);
        return;
      }
    }

    const activeFolio = this.folios[snap.activeWorld];
    const hits = _raycaster.intersectObjects(activeFolio.getInteractables(), true);
    if (hits.length > 0) {
      const info = this.findMechanismData(hits[0].object);
      if (info?.interactionType === 'folioMechanism' && info.slot) {
        this.triggerInteraction(info.slot, snap.activeWorld);
        return;
      }
    }
  };

  private clearHoverHighlight(): void {
    if (!this.hoveredHighlight) return;
    const mat = this.hoveredHighlight.mesh.material;
    if (mat instanceof THREE.MeshStandardMaterial) {
      mat.emissive.setHex(this.hoveredHighlight.origHex);
      mat.emissiveIntensity = this.hoveredHighlight.origIntensity;
    }
    this.hoveredHighlight = null;
  }

  private applyHoverHighlight(obj: THREE.Object3D): void {
    this.clearHoverHighlight();
    if (obj instanceof THREE.Mesh && obj.visible && obj.material instanceof THREE.MeshStandardMaterial) {
      this.hoveredHighlight = {
        mesh: obj,
        origHex: obj.material.emissive.getHex(),
        origIntensity: obj.material.emissiveIntensity,
      };
      obj.material.emissive.setHex(0x4ccae8);
      obj.material.emissiveIntensity = Math.max(0.45, obj.material.emissiveIntensity + 0.35);
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    const snap = atlasStore.getSnapshot();

    if (this.pageTurnDragging && this.pageTurnActive) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const normX = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0.05, 0.95);
      this.pageTurnProgress = 1 - normX;
      atlasStore.setPageTurnState(this.pageTurnTargetWorld, this.pageTurnProgress);
      return;
    }

    if (snap.bookPhase === 'open' && snap.activeTool === 'magnifier' && (this.draggingMagnifier || e.buttons === 0)) {
      const pt = this.getSpreadIntersection(e.clientX, e.clientY);
      if (pt) {
        const hadSecret = atlasStore.getSnapshot().activeSecret !== null;
        atlasStore.updateMagnifier(pt);
        const nowSecret = atlasStore.getSnapshot().activeSecret !== null;
        if (!hadSecret && nowSecret) soundEngine.playSecretReveal();
      }
      return;
    }

    if (e.target !== this.renderer.domElement) {
      this.cornerHoverLift = 0;
      if (this.hoveredHighlight || snap.hoveredProp) {
        this.clearHoverHighlight();
        atlasStore.setHoveredProp(null);
        this.renderer.domElement.style.cursor = 'default';
      }
      return;
    }

    this.updateNdc(e.clientX, e.clientY);
    _raycaster.setFromCamera(_ndc, this.camera);

    const isOpen = snap.bookPhase === 'open';
    const cornerHits = isOpen
      ? _raycaster.intersectObjects([this.bookRig.cornerRightHit], false)
      : [];
    this.cornerHoverLift = cornerHits.length > 0 ? 1 : 0;

    const now = performance.now();
    if (now - this.lastHoverCheck > 50 && !this.pageTurnActive) {
      this.lastHoverCheck = now;
      let chosen: THREE.Object3D | null = null;
      const activeFolio = this.folios[snap.activeWorld];

      if (isOpen) {
        const hits = _raycaster.intersectObjects(activeFolio.getInteractables(), true);
        if (hits.length > 0) chosen = hits[0].object;
      }

      if (!chosen && isOpen) {
        const deskHits = _raycaster.intersectObjects(this.bookRig.deskInteractables, false);
        if (deskHits.length > 0 && !snap.magnifierActive) chosen = deskHits[0].object;
      }

      if (!chosen && isOpen && cornerHits.length > 0) {
        chosen = cornerHits[0].object;
      }

      if (chosen) {
        const info = this.findMechanismData(chosen);
        const ud = (info as Record<string, unknown> | null) ?? chosen.userData;
        this.applyHoverHighlight(chosen);

        chosen.getWorldPosition(_hoverWorldPos);
        _hoverProjPos.copy(_hoverWorldPos).project(this.camera);
        const rect = this.renderer.domElement.getBoundingClientRect();
        const px = THREE.MathUtils.clamp(
          rect.left + (_hoverProjPos.x * 0.5 + 0.5) * rect.width,
          120,
          Math.max(120, rect.width - 120),
        );
        const py = THREE.MathUtils.clamp(
          rect.top + (-_hoverProjPos.y * 0.5 + 0.5) * rect.height - 24,
          76,
          Math.max(76, rect.height - 108),
        );

        atlasStore.setHoveredProp({
          id: `${ud.interactionType ?? 'prop'}-${ud.label ?? ''}`,
          label: String(ud.label ?? 'Diagram Control'),
          category: String(ud.category ?? 'Archival Folio'),
          hint: String(ud.hint ?? 'Click or press A / B / C'),
          x: px,
          y: py,
        });
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.clearHoverHighlight();
        atlasStore.setHoveredProp(null);
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  };

  private onPointerUp = () => {
    this.controls.enabled = true;
    if (this.pageTurnDragging && this.pageTurnActive) {
      this.pageTurnDragging = false;
      const shouldCommit =
        this.pageTurnDirection === 1 ? this.pageTurnProgress > 0.35 : this.pageTurnProgress < 0.65;
      if (!shouldCommit) {
        this.pageTurnTargetWorld = atlasStore.getSnapshot().activeWorld;
      } else {
        narrationEngine.playFolioCore(this.pageTurnTargetWorld);
      }
    }
    this.draggingMagnifier = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    this.keysPressed.add(e.code);
    const snap = atlasStore.getSnapshot();
    const k = e.key.toLowerCase();

    if (e.code === 'Space' || e.code === 'Enter') {
      if (document.activeElement instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (snap.bookPhase === 'closed') {
        this.openBook();
      } else if (snap.bookPhase === 'open') {
        const w = snap.worlds[snap.activeWorld];
        const nextSlot: FolioInteractionSlot = !w.interactions.A.active
          ? 'A'
          : !w.interactions.B.active
            ? 'B'
            : 'C';
        this.triggerInteraction(nextSlot);
      }
      return;
    }

    if (k === 'a' && !snap.magnifierActive && snap.cameraMode !== 'immersion') {
      this.triggerInteraction('A');
    } else if (k === 'b') {
      this.triggerInteraction('B');
    } else if (k === 'c') {
      // 'c' toggles Captions per contract unless Shift or inside dialog; keep mechanism A/B/C cleanly mapped to buttons 1/2/3 or letter keys:
      // Wait: C was mechanism C or Captions! Let's bind Digit1/2/3 for camera, A/B/C for mechanisms, and Shift+C or Caption button, OR check:
      // Let's make keys 'q','w'?? No: make Key1/2/3 = Camera? Let's bind:
      // Key 'a'/'s'/'d'? No: A/B/C mechanisms on Keys A / B / G? Wait: captions toggle = K or toggle button; OR mechanisms A/B/C when Shift is not held, and Captions = Shift+C / K?
      // Better yet: '1'/'2'/'3' camera views, 'a'/'b'/'c' trigger Mechanisms A/B/C directly, 't' toggles Transcript, 'k' toggles Captions (plus labeled header button), 'v' plays/pauses reading, 'f' toggles Inspection Lens, '['/']' turns pages, 'h' toggles bar, Escape closes panels.
      this.triggerInteraction('C');
    } else if (e.key === '1') {
      atlasStore.setCameraMode('inspection');
      this.applyCameraPreset('inspection');
    } else if (e.key === '2') {
      atlasStore.setCameraMode('diorama');
      this.applyCameraPreset('diorama');
    } else if (e.key === '3') {
      atlasStore.setCameraMode('immersion');
      this.applyCameraPreset('immersion');
    } else if (e.key === '[' || (e.key === 'ArrowLeft' && !snap.magnifierActive && snap.cameraMode !== 'immersion')) {
      if (snap.activeWorld > 0) {
        this.turnToWorld((snap.activeWorld - 1) as WorldId);
      }
    } else if (e.key === ']' || (e.key === 'ArrowRight' && !snap.magnifierActive && snap.cameraMode !== 'immersion')) {
      if (snap.activeWorld < TOTAL_WORLDS - 1) {
        this.turnToWorld((snap.activeWorld + 1) as WorldId);
      }
    } else if (k === 't') {
      if (snap.bookPhase !== 'closed') {
        atlasStore.setChronicleOpen(!snap.chronicleOpen);
      }
    } else if (k === 'k') {
      atlasStore.setCaptionsVisible(!snap.captionsVisible);
    } else if (k === 'f') {
      if (snap.bookPhase === 'open') {
        atlasStore.setActiveTool(snap.activeTool === 'magnifier' ? 'explore' : 'magnifier');
      }
    } else if (k === 'v') {
      if (snap.bookPhase !== 'closed') {
        narrationEngine.togglePlayPause(snap.activeWorld);
      }
    } else if (k === 'h') {
      atlasStore.setHudCollapsed(!snap.hudCollapsed);
    } else if (e.code === 'Escape') {
      if (snap.chronicleOpen) atlasStore.setChronicleOpen(false);
      if (snap.endcardOpen) atlasStore.setEndcardOpen(false);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const wallDt = Math.min(this.clock.getDelta(), 0.75);
      const rawDt = Math.min(wallDt, 0.12);
      if (!this.pausedRendering) {
        const snap = atlasStore.getSnapshot();
        const dt = snap.reducedMotion ? rawDt * 0.35 : rawDt;
        this.elapsed += dt;
        this.stepSimulation(dt, wallDt);

        if (this.isSoftwareGl) {
          this.renderer.render(this.scene, this.camera);
          this.afterDraw(tick);
          return;
        }
        this.composer.render();
      }
      this.frameId = requestAnimationFrame(tick);
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 16);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private stepSimulation(dt: number, wallDt: number): void {
    const snap = atlasStore.getSnapshot();
    const rawDt = Math.min(wallDt, 0.12);
    this.applyQualitySettings();

    const targetOpen = snap.bookPhase === 'closed' ? 0 : 1;
    const openSpeed = snap.reducedMotion ? 16 : 7.5;
    this.bookOpenProgress += (targetOpen - this.bookOpenProgress) * (1 - Math.exp(-openSpeed * wallDt));
    this.bookRig.setBookOpenProgress(this.bookOpenProgress);

    if (snap.bookPhase === 'opening' && this.bookOpenProgress > 0.94) {
      this.bookOpenProgress = 1;
      this.bookRig.setBookOpenProgress(1);
      atlasStore.setBookPhase('open');
    }

    if (this.pageTurnActive && !this.pageTurnDragging) {
      const targetProgress =
        this.pageTurnTargetWorld === snap.activeWorld
          ? this.pageTurnDirection === 1
            ? 0
            : 1
          : this.pageTurnDirection === 1
            ? 1
            : 0;
      const turnRate = snap.reducedMotion ? 12.0 : 3.4;
      const step = turnRate * wallDt;
      if (Math.abs(this.pageTurnProgress - targetProgress) <= Math.max(0.04, step)) {
        const finalWorld = this.pageTurnTargetWorld;
        this.pageTurnActive = false;
        this.pageTurnProgress = 0;
        atlasStore.setActiveWorld(finalWorld);
        this.bookRig.setActiveWorldSpread(finalWorld);
        this.syncWorld(finalWorld);
      } else {
        this.pageTurnProgress += Math.sign(targetProgress - this.pageTurnProgress) * step;
        this.pageTurnProgress = THREE.MathUtils.clamp(this.pageTurnProgress, 0, 1);
      }
    }

    this.folios.forEach((f, idx) => {
      if (this.bookOpenProgress < 0.35) {
        f.setFoldFactor(0);
        return;
      }
      const openPop = THREE.MathUtils.clamp((this.bookOpenProgress - 0.35) / 0.65, 0, 1);
      if (!this.pageTurnActive) {
        f.setFoldFactor(idx === snap.activeWorld ? openPop : 0);
      } else {
        const dist = this.pageTurnDirection === 1 ? this.pageTurnProgress : 1 - this.pageTurnProgress;
        if (idx === snap.activeWorld && this.pageTurnTargetWorld !== snap.activeWorld) {
          const outNorm = Math.min(1, dist / 0.52);
          f.setFoldFactor((0.5 + 0.5 * Math.cos(outNorm * Math.PI)) * openPop);
        } else if (idx === this.pageTurnTargetWorld) {
          const inNorm = Math.max(0, Math.min(1, (dist - 0.48) / 0.52));
          f.setFoldFactor((0.5 - 0.5 * Math.cos(inNorm * Math.PI)) * openPop);
        } else {
          f.setFoldFactor(0);
        }
      }
    });

    this.bookRig.setActiveWorldSpread(
      this.pageTurnActive && this.pageTurnProgress > 0.5 && this.pageTurnDirection === 1
        ? this.pageTurnTargetWorld
        : this.pageTurnActive && this.pageTurnProgress < 0.5 && this.pageTurnDirection === -1
          ? this.pageTurnTargetWorld
          : snap.activeWorld,
    );

    const frontLeafIdx = this.pageTurnActive
      ? this.pageTurnDirection === 1
        ? snap.activeWorld
        : this.pageTurnTargetWorld
      : snap.activeWorld;
    const backLeafIdx = this.pageTurnActive
      ? this.pageTurnDirection === 1
        ? this.pageTurnTargetWorld
        : snap.activeWorld
      : snap.activeWorld;

    this.bookRig.updateTurningLeaf(
      this.pageTurnActive,
      this.pageTurnProgress,
      this.cornerHoverLift,
      this.elapsed,
      snap.reducedMotion,
      frontLeafIdx,
      backLeafIdx,
    );

    const activeManifest = FOLIO_BY_WORLD[snap.activeWorld];
    const isBookOpen = this.bookOpenProgress > 0.5;
    this.atmosphere.update(
      this.elapsed,
      isBookOpen,
      activeManifest.periodPalette.ambientHex,
      snap.reducedMotion,
      snap.noFlashMode,
    );
    this.scene.environmentIntensity = isBookOpen ? 0.42 : 0.52;

    this.bookRig.setDeskPropStates({
      magnifierOnDesk: !(snap.bookPhase === 'open' && snap.magnifierActive),
    });

    const activeFolioState = snap.worlds[snap.activeWorld];
    this.bookRig.updateArchivalWear(
      this.elapsed,
      Math.max(snap.bookWearLevel * 0.65, activeFolioState.wearLevel),
      snap.activeWorld,
      activeManifest.periodPalette.accentHex,
    );

    this.camera.getWorldDirection(_camForward);
    soundEngine.updateSpatialBed(
      this.camera.position,
      _camForward,
      this.camera.up,
      snap.activeWorld,
      isBookOpen,
      this.elapsed,
      snap.audioMuted || snap.endcardOpen,
    );

    this.postPass.uniforms.uTime.value = this.elapsed;
    this.postPass.uniforms.uBookOpen.value = isBookOpen ? 1.0 : 0.0;
    this.postPass.uniforms.uReducedMotion.value = snap.reducedMotion ? 1.0 : 0.0;
    this.postPass.uniforms.uNoFlash.value = snap.noFlashMode ? 1.0 : 0.0;
    this.postPass.uniforms.uQuality.value =
      snap.qualityTier === 'high' ? 1.0 : snap.qualityTier === 'medium' ? 0.72 : 0.45;

    this.folios.forEach((f) => {
      if (f.root.visible) {
        f.update(dt, this.elapsed, snap.reducedMotion);
      }
    });

    const magOn = snap.bookPhase === 'open' && snap.magnifierActive;
    this.magnifierMesh.visible = magOn;
    this.bookRig.setMagnifierState(magOn, snap.magnifierPos.x, snap.magnifierPos.z);

    if (magOn) {
      let mx = snap.magnifierPos.x;
      let mz = snap.magnifierPos.z;
      let moved = false;
      if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) {
        mz -= dt * 2.2;
        moved = true;
      }
      if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) {
        mz += dt * 2.2;
        moved = true;
      }
      if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) {
        mx -= dt * 2.2;
        moved = true;
      }
      if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) {
        mx += dt * 2.2;
        moved = true;
      }
      if (moved) {
        atlasStore.updateMagnifier({ x: mx, z: mz });
      }
      const p = atlasStore.getSnapshot().magnifierPos;
      _magGoal.set(p.x, BOOK_BASE_Y + 0.42, p.z);
      this.magnifierMesh.position.lerp(_magGoal, 1 - Math.exp(-14 * rawDt));
    }

    if (snap.cameraMode !== this.lastCameraMode) {
      this.applyCameraPreset(snap.cameraMode);
    }

    if (snap.cameraMode === 'immersion' && !magOn) {
      const speed = 2.4 * rawDt;
      this.camera.getWorldDirection(_moveDir);
      _moveDir.y = 0;
      _moveDir.normalize();
      _camRight.crossVectors(_moveDir, this.camera.up).normalize();

      let deltaX = 0;
      let deltaZ = 0;
      if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) deltaZ += 1;
      if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) deltaZ -= 1;
      if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) deltaX -= 1;
      if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) deltaX += 1;

      if (deltaX !== 0 || deltaZ !== 0) {
        this.cameraPresetActive = false;
        _immersionStep
          .set(0, 0, 0)
          .addScaledVector(_moveDir, deltaZ * speed)
          .addScaledVector(_camRight, deltaX * speed);
        this.camera.position.add(_immersionStep);
        this.controls.target.add(_immersionStep);
      }
    }

    if (this.cameraPresetActive) {
      const camDamp = 1 - Math.exp(-5.0 * rawDt);
      this.camera.position.lerp(_camPosGoal, camDamp);
      this.controls.target.lerp(_camTargetGoal, camDamp);
      if (
        this.camera.position.distanceTo(_camPosGoal) < 0.03 &&
        this.controls.target.distanceTo(_camTargetGoal) < 0.03
      ) {
        this.cameraPresetActive = false;
      }
    }

    this.controls.update();
  }

  public dispose(): void {
    this.disposed = true;
    narrationEngine.stop();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.clearHoverHighlight();
    this.folios.forEach((f) => f.dispose());
    this.controls.dispose();
    this.composer.dispose();
    this.textures.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
