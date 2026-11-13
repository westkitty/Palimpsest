import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/SoundEngine';
import { atlasStore } from '../state/atlasStore';
import {
  CameraMode,
  PlantedTreeState,
  PortalLink,
  TOTAL_WORLDS,
  Vec2Point,
  WORLD_METADATA,
  WorldId,
} from '../types/atlas';
import { AtmosphereSystem } from './AtmosphereSystem';
import { BOOK_BASE_Y, BOOK_PAGE_D, BOOK_SPREAD_W, BookAndDeskRig } from './BookAndDeskRig';
import { createProceduralTextures, ProceduralTexturePack } from './proceduralTextures';
import { BaseWorld } from './worlds/BaseWorld';
import { CelestialDesertWorld } from './worlds/CelestialDesertWorld';
import { ForgottenHarborWorld } from './worlds/ForgottenHarborWorld';
import {
  ClockworkSkyWorld,
  EmberFoundryWorld,
  FrostboundSpireWorld,
  SunkenAthenaeumWorld,
} from './worlds/NorthernAndAbyssWorlds';
import {
  GlassArchipelagoWorld,
  MeridianHeartWorld,
  WhisperingMyceliumWorld,
} from './worlds/TwilightAndZenithWorlds';
import { VerdantKingdomWorld } from './worlds/VerdantKingdomWorld';

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
  private worlds: BaseWorld[];

  // Physical 3D Magical Magnifier prop
  private magnifierMesh: THREE.Group;

  // Sailing route live preview line
  private drawingRoutePoints: Vec2Point[] = [];
  private drawingRouteLine: THREE.Line;

  // Loop & software WebGL pacing
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;
  private clock = new THREE.Clock();
  private elapsed = 0;

  // Animation states
  private bookOpenProgress = 0; // 0..1
  private pageTurnActive = false;
  private pageTurnDirection: 1 | -1 = 1;
  private pageTurnTargetWorld: WorldId = 0;
  private pageTurnProgress = 0;
  private pageTurnDragging = false;
  private cornerHoverLift = 0;

  // Portal landmark origami fold transition
  private portalTransition: {
    active: boolean;
    fromWorld: WorldId;
    toWorld: WorldId;
    progress: number;
    swapped: boolean;
    portal: PortalLink;
  } | null = null;
  private lastHoverCheck = 0;

  // Camera transition state
  private cameraPresetActive = true;
  private lastCameraMode: CameraMode = 'inspection';
  private keysPressed = new Set<string>();

  // Pointer drag state
  private draggingBead: { worldId: WorldId; index: number } | null = null;
  private draggingPopup: {
    worldId: WorldId;
    popupId: string;
    startX: number;
    baseRatio: number;
    isLeftTab: boolean;
  } | null = null;
  private drawingSailing = false;
  private draggingMagnifier = false;

  // Context loss callback
  public onContextLost?: (lost: boolean) => void;

  constructor(private container: HTMLElement) {
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // Mandatory studio environment map via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(
      42,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      80,
    );
    this.camera.position.set(0.4, 5.8, 7.6);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.minDistance = 1.4;
    this.controls.maxDistance = 15.5;
    this.controls.target.set(0, 0.2, 0);

    // Cancel scripted camera transitions as soon as user grabs controls
    this.controls.addEventListener('start', () => {
      this.cameraPresetActive = false;
    });

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    this.bookRig = new BookAndDeskRig(this.textures);
    this.scene.add(this.bookRig.root);

    this.atmosphere = new AtmosphereSystem(this.scene, this.isSoftwareGl);
    this.atmosphere.onThunder = () => soundEngine.playThunder();
    this.scene.add(this.atmosphere.root);

    // Build all ten living worlds
    const snap = atlasStore.getSnapshot();
    const bump = this.textures.paperGrainBump;
    const shadow = this.textures.contactShadow;
    this.worlds = [
      new VerdantKingdomWorld(bump, shadow),
      new ForgottenHarborWorld(bump, shadow),
      new CelestialDesertWorld(bump, shadow),
      new FrostboundSpireWorld(bump, shadow),
      new SunkenAthenaeumWorld(bump, shadow),
      new EmberFoundryWorld(bump, shadow),
      new ClockworkSkyWorld(bump, shadow),
      new WhisperingMyceliumWorld(bump, shadow),
      new GlassArchipelagoWorld(bump, shadow),
      new MeridianHeartWorld(bump, shadow),
    ];

    this.worlds.forEach((w, idx) => {
      w.build(snap.worlds[idx]);
      w.setFoldFactor(idx === snap.activeWorld && snap.bookPhase === 'open' ? 1 : 0);
      this.scene.add(w.root);
    });

    // Build 3D Brass Magical Magnifier
    this.magnifierMesh = this.buildMagnifierProp();
    this.magnifierMesh.visible = false;
    this.scene.add(this.magnifierMesh);

    // Drawing route preview line
    this.drawingRouteLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xf4cc6e, transparent: true, opacity: 0.9 }),
    );
    this.drawingRouteLine.visible = false;
    this.scene.add(this.drawingRouteLine);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.applyCameraPreset('inspection');
    this.startLoop();
  }

  private buildMagnifierProp(): THREE.Group {
    const g = new THREE.Group();
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af6e,
      roughness: 0.24,
      metalness: 0.88,
    });
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x4b2416,
      roughness: 0.45,
      metalness: 0.1,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff5d8,
      roughness: 0.05,
      metalness: 0.0,
      transparent: true,
      opacity: 0.28,
      clearcoat: 1.0,
      ior: 1.55,
    });

    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 12, 32), brassMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.castShadow = true;

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 28), lensMat);

    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 10), brassMat);
    ferrule.rotation.x = Math.PI / 2;
    ferrule.position.set(0, 0, 0.72);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.78, 10), handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, -0.02, 1.18);
    handle.castShadow = true;

    g.add(bezel, glass, ferrule, handle);
    return g;
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.onContextLost?.(true);
  };

  private handleContextRestored = () => {
    this.onContextLost?.(false);
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.applyQualitySettings();
  };

  private applyQualitySettings(): void {
    const tier = atlasStore.getSnapshot().qualityTier;
    const dpr = window.devicePixelRatio || 1;
    const ratio = this.isSoftwareGl
      ? 1
      : tier === 'low'
        ? 1
        : tier === 'medium'
          ? Math.min(dpr, 1.5)
          : Math.min(dpr, 2);
    this.renderer.setPixelRatio(ratio);
  }

  public openBook(): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase !== 'closed') return;
    soundEngine.playBookOpen();
    atlasStore.setBookPhase('opening');
    this.applyCameraPreset('diorama');
  }

  public closeBook(): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase === 'closed') return;
    soundEngine.playPageTurn();
    atlasStore.setBookPhase('closed');
    this.applyCameraPreset('inspection');
  }

  public turnToWorld(targetWorld: WorldId): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase === 'closed') {
      this.openBook();
    }
    if (
      targetWorld === snap.activeWorld ||
      this.pageTurnActive ||
      this.portalTransition?.active
    ) {
      return;
    }

    soundEngine.playPageTurn();
    this.pageTurnActive = true;
    this.pageTurnDragging = false;
    this.pageTurnDirection = targetWorld > snap.activeWorld ? 1 : -1;
    this.pageTurnTargetWorld = targetWorld;
    this.pageTurnProgress = this.pageTurnDirection === 1 ? 0.02 : 0.98;
    atlasStore.setPageTurnState(targetWorld, this.pageTurnProgress);
  }

  public crossPortal(targetWorld?: WorldId): void {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase === 'closed') {
      this.openBook();
    }
    if (this.pageTurnActive || this.portalTransition?.active) return;

    const basePortal = WORLD_METADATA[snap.activeWorld].portal;
    const portal: PortalLink =
      targetWorld !== undefined && targetWorld !== basePortal.targetWorld
        ? { ...basePortal, targetWorld }
        : basePortal;

    if (portal.targetWorld === snap.activeWorld) return;

    soundEngine.unlock();
    soundEngine.playPortalTransition();

    this.portalTransition = {
      active: true,
      fromWorld: snap.activeWorld,
      toWorld: portal.targetWorld,
      progress: 0,
      swapped: false,
      portal,
    };

    this.worlds[snap.activeWorld].setPortalHovered(null);
    atlasStore.setHoveredPortal(null);
    atlasStore.setPortalTransitionState({
      active: true,
      fromWorld: snap.activeWorld,
      toWorld: portal.targetWorld,
      progress: 0,
      portalLabel: portal.label,
    });
  }

  public applyCameraPreset(mode: CameraMode): void {
    this.lastCameraMode = mode;
    this.cameraPresetActive = true;
    if (mode === 'inspection') {
      _camPosGoal.set(0.5, 5.9, 7.8);
      _camTargetGoal.set(0, 0.2, 0);
    } else if (mode === 'diorama') {
      _camPosGoal.set(0, 3.85, 5.1);
      _camTargetGoal.set(0, 0.38, 0.15);
    } else {
      // Immersive miniature world navigation
      _camPosGoal.set(-0.6, 1.25, 2.55);
      _camTargetGoal.set(0.1, 0.65, -0.35);
    }
  }

  public nudgeImmersion(dx: number, dz: number): void {
    _moveDir.set(dx, 0, dz).multiplyScalar(0.45);
    this.camera.position.add(_moveDir);
    this.controls.target.add(_moveDir);
    this.cameraPresetActive = false;
  }

  public syncWorld(worldId: WorldId): void {
    const snap = atlasStore.getSnapshot();
    const world = this.worlds[worldId];
    world.syncState(snap.worlds[worldId], this.elapsed);
    world.updateRiverPoints(snap.worlds[worldId].riverControlPoints);
    if (snap.worlds[worldId].shipRoutes[0]) {
      world.updateShipRoute(
        snap.worlds[worldId].shipRoutes[0].shipId,
        snap.worlds[worldId].shipRoutes[0].points,
      );
    }
  }

  public plantQuickSeed(): void {
    const snap = atlasStore.getSnapshot();
    const speciesPool: Record<WorldId, PlantedTreeState['species'][]> = {
      0: ['pine', 'oak', 'blossom'],
      1: ['cypress', 'pine'],
      2: ['palm', 'crystal'],
      3: ['icepine', 'pine'],
      4: ['coral', 'crystal'],
      5: ['emberfern', 'crystal'],
      6: ['skybloom', 'cypress'],
      7: ['mushroom', 'blossom'],
      8: ['prism', 'crystal'],
      9: ['goldlotus', 'blossom'],
    };
    const pool = speciesPool[snap.activeWorld];
    const species = pool[Math.floor(Math.random() * pool.length)];
    const x = (Math.random() - 0.5) * 5.8;
    const z = (Math.random() - 0.5) * 3.8;
    atlasStore.addPlantedTree(snap.activeWorld, {
      id: `tree-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x,
      z,
      species,
      scale: 0.9 + Math.random() * 0.3,
      rotation: Math.random() * Math.PI * 2,
      plantedAt: this.elapsed,
    });
    this.syncWorld(snap.activeWorld);
    soundEngine.playSeedSprout();
  }

  public connectNextStarEdge(): void {
    const snap = atlasStore.getSnapshot();
    const wState = snap.worlds[snap.activeWorld];
    const nextIdx = wState.constellationEdges.length;
    if (nextIdx < 5) {
      atlasStore.toggleConstellationEdge(snap.activeWorld, nextIdx, (nextIdx + 1) % 6);
      this.syncWorld(snap.activeWorld);
      soundEngine.playStarChime(nextIdx);
    }
  }

  public nudgeMagnifier(dx: number, dz: number): void {
    const p = atlasStore.getSnapshot().magnifierPos;
    const hadSecret = atlasStore.getSnapshot().activeSecret !== null;
    atlasStore.updateMagnifier({ x: p.x + dx, z: p.z + dz });
    const nowSecret = atlasStore.getSnapshot().activeSecret !== null;
    if (!hadSecret && nowSecret) soundEngine.playSecretReveal();
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

  private onPointerDown = (e: PointerEvent) => {
    soundEngine.unlock();
    const snap = atlasStore.getSnapshot();
    this.updateNdc(e.clientX, e.clientY);
    _raycaster.setFromCamera(_ndc, this.camera);

    // 1. If book is closed, clicking the book/clasp opens it
    if (snap.bookPhase === 'closed') {
      const hits = _raycaster.intersectObject(this.bookRig.claspHitMesh, false);
      if (hits.length > 0) {
        this.openBook();
      }
      return;
    }

    const activeWorld = this.worlds[snap.activeWorld];

    // 2. Check Physical Page Corner Drag
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

    // 3. Tool-specific spread interactions
    if (snap.activeTool === 'trees') {
      const pt = this.getSpreadIntersection(e.clientX, e.clientY);
      if (pt) {
        const speciesPool: Record<WorldId, PlantedTreeState['species'][]> = {
          0: ['pine', 'oak', 'blossom'],
          1: ['cypress', 'pine'],
          2: ['palm', 'crystal'],
          3: ['icepine', 'pine'],
          4: ['coral', 'crystal'],
          5: ['emberfern', 'crystal'],
          6: ['skybloom', 'cypress'],
          7: ['mushroom', 'blossom'],
          8: ['prism', 'crystal'],
          9: ['goldlotus', 'blossom'],
        };
        const options = speciesPool[snap.activeWorld];
        const species = options[Math.floor(Math.random() * options.length)];
        atlasStore.addPlantedTree(snap.activeWorld, {
          id: `tree-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: pt.x,
          z: pt.z,
          species,
          scale: 0.85 + Math.random() * 0.35,
          rotation: Math.random() * Math.PI * 2,
          plantedAt: this.elapsed,
        });
        activeWorld.syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
        soundEngine.playSeedSprout();
        return;
      }
    }

    if (snap.activeTool === 'sailing') {
      const pt = this.getSpreadIntersection(e.clientX, e.clientY);
      if (pt) {
        this.controls.enabled = false;
        this.drawingSailing = true;
        this.drawingRoutePoints = [pt];
        this.drawingRouteLine.visible = true;
        soundEngine.playWaterRipple();
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

    // 4. Raycast against all interactive 3D props in the active world
    const hits = _raycaster.intersectObjects(activeWorld.getInteractables(), false);
    if (hits.length > 0) {
      const hitObj = hits[0].object;
      const data = hitObj.userData;

      if (data.interactionType === 'popupTab') {
        if (snap.activeTool === 'popup' || snap.activeTool === 'explore') {
          this.controls.enabled = false;
          const popupState = snap.worlds[snap.activeWorld].popups.find(
            (p) => p.id === data.popupId,
          );
          this.draggingPopup = {
            worldId: snap.activeWorld,
            popupId: data.popupId,
            startX: e.clientX,
            baseRatio: popupState?.pullRatio ?? 1,
            isLeftTab: hits[0].point.x < 0,
          };
          soundEngine.playPaperFold();
          return;
        }
      }

      if (data.interactionType === 'riverBead') {
        if (snap.activeTool === 'river' || snap.activeTool === 'explore') {
          this.controls.enabled = false;
          this.draggingBead = { worldId: snap.activeWorld, index: data.beadIndex };
          soundEngine.playWaterRipple();
          return;
        }
      }

      if (data.interactionType === 'bridgeSeal') {
        atlasStore.toggleBridge(snap.activeWorld, data.bridgeId);
        activeWorld.syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
        soundEngine.playPaperFold();
        return;
      }

      if (data.interactionType === 'starNode') {
        const starIndex = data.starIndex as number;
        const prev = activeWorld.getSelectedStarIndex();
        if (prev === null) {
          activeWorld.setSelectedStarIndex(starIndex);
          soundEngine.playStarChime(starIndex);
          atlasStore.setStatusHint('Star pinned — click another star to weave a constellation thread.');
        } else if (prev === starIndex) {
          activeWorld.setSelectedStarIndex(null);
        } else {
          atlasStore.toggleConstellationEdge(snap.activeWorld, prev, starIndex);
          activeWorld.setSelectedStarIndex(starIndex);
          activeWorld.syncConstellationEdges(atlasStore.getSnapshot().worlds[snap.activeWorld]);
          soundEngine.playStarChime(starIndex + 2);
        }
        return;
      }

      if (data.interactionType === 'creatureSeal') {
        atlasStore.toggleCreature(snap.activeWorld, data.creatureId);
        activeWorld.syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
        soundEngine.playSealSummon();
        return;
      }

      if (data.interactionType === 'hiddenLayer') {
        atlasStore.toggleHiddenLayer(snap.activeWorld, data.layerId);
        activeWorld.syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
        soundEngine.playPaperFold();
        return;
      }

      if (data.interactionType === 'portalLandmark') {
        this.crossPortal(data.targetWorld as WorldId);
        return;
      }
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const snap = atlasStore.getSnapshot();
    if (snap.bookPhase !== 'open') return;

    // Physical Page Turn Drag
    if (this.pageTurnDragging && this.pageTurnActive) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const normX = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0.05, 0.95);
      // Dragging from right to left increases progress 0 -> 1
      this.pageTurnProgress = 1 - normX;
      atlasStore.setPageTurnState(this.pageTurnTargetWorld, this.pageTurnProgress);
      return;
    }

    // River Bead Drag
    if (this.draggingBead) {
      const pt = this.getSpreadIntersection(e.clientX, e.clientY);
      if (pt) {
        atlasStore.updateRiverPoint(this.draggingBead.worldId, this.draggingBead.index, pt);
        const w = this.worlds[this.draggingBead.worldId];
        w.updateRiverPoints(atlasStore.getSnapshot().worlds[this.draggingBead.worldId].riverControlPoints);
      }
      return;
    }

    // Pop-up Margin Tab Drag
    if (this.draggingPopup) {
      const deltaX = (e.clientX - this.draggingPopup.startX) / 110;
      const signed = this.draggingPopup.isLeftTab ? -deltaX : deltaX;
      const nextRatio = THREE.MathUtils.clamp(this.draggingPopup.baseRatio + signed, 0.05, 1);
      atlasStore.updatePopupRatio(this.draggingPopup.worldId, this.draggingPopup.popupId, nextRatio);
      this.worlds[this.draggingPopup.worldId].syncState(
        atlasStore.getSnapshot().worlds[this.draggingPopup.worldId],
        this.elapsed,
      );
      return;
    }

    // Sailing Route Drawing
    if (this.drawingSailing) {
      const pt = this.getSpreadIntersection(e.clientX, e.clientY);
      if (pt) {
        const last = this.drawingRoutePoints[this.drawingRoutePoints.length - 1];
        if (!last || Math.hypot(pt.x - last.x, pt.z - last.z) > 0.26) {
          this.drawingRoutePoints.push(pt);
          const pts3 = this.drawingRoutePoints.map((p) => new THREE.Vector3(p.x, BOOK_BASE_Y + 0.08, p.z));
          this.drawingRouteLine.geometry.dispose();
          this.drawingRouteLine.geometry = new THREE.BufferGeometry().setFromPoints(pts3);
        }
      }
      return;
    }

    // Magical Magnifier Hover / Drag
    if (snap.activeTool === 'magnifier' && (this.draggingMagnifier || e.buttons === 0)) {
      const pt = this.getSpreadIntersection(e.clientX, e.clientY);
      if (pt) {
        const hadSecret = atlasStore.getSnapshot().activeSecret !== null;
        atlasStore.updateMagnifier(pt);
        const nowSecret = atlasStore.getSnapshot().activeSecret !== null;
        if (!hadSecret && nowSecret) soundEngine.playSecretReveal();
      }
      return;
    }

    // Subtle corner lift hover feedback & throttled portal landmark hover detection
    this.updateNdc(e.clientX, e.clientY);
    _raycaster.setFromCamera(_ndc, this.camera);
    const cornerHits = _raycaster.intersectObjects([this.bookRig.cornerRightHit], false);
    this.cornerHoverLift = cornerHits.length > 0 ? 1 : 0;

    const now = performance.now();
    if (now - this.lastHoverCheck > 45 && !this.portalTransition?.active && !this.pageTurnActive) {
      this.lastHoverCheck = now;
      const activeWorld = this.worlds[snap.activeWorld];
      const portalHits = _raycaster.intersectObjects(activeWorld.getPortalInteractables(), false);
      const hitPortal =
        portalHits.length > 0 ? ((portalHits[0].object.userData.portal as PortalLink) ?? null) : null;
      activeWorld.setPortalHovered(hitPortal?.id ?? null);
      atlasStore.setHoveredPortal(hitPortal);
      this.renderer.domElement.style.cursor =
        hitPortal || cornerHits.length > 0 ? 'pointer' : 'default';
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.controls.enabled = true;

    if (this.pageTurnDragging && this.pageTurnActive) {
      this.pageTurnDragging = false;
      const shouldCommit =
        this.pageTurnDirection === 1
          ? this.pageTurnProgress > 0.35
          : this.pageTurnProgress < 0.65;
      if (!shouldCommit) {
        // Snap back to original world
        this.pageTurnTargetWorld = atlasStore.getSnapshot().activeWorld;
      }
    }

    if (this.draggingPopup) {
      // If it was a quick click (< 6px drag), toggle cleanly between raised and folded
      if (Math.abs(e.clientX - this.draggingPopup.startX) < 6) {
        atlasStore.togglePopup(this.draggingPopup.worldId, this.draggingPopup.popupId);
        this.worlds[this.draggingPopup.worldId].syncState(
          atlasStore.getSnapshot().worlds[this.draggingPopup.worldId],
          this.elapsed,
        );
      }
      this.draggingPopup = null;
    }

    if (this.drawingSailing) {
      this.drawingSailing = false;
      this.drawingRouteLine.visible = false;
      if (this.drawingRoutePoints.length >= 2) {
        const snap = atlasStore.getSnapshot();
        const shipId =
          snap.worlds[snap.activeWorld].shipRoutes[0]?.shipId ?? 'ship-0';
        atlasStore.setShipRoute(snap.activeWorld, shipId, [...this.drawingRoutePoints]);
        this.worlds[snap.activeWorld].updateShipRoute(shipId, this.drawingRoutePoints);
        soundEngine.playWaterRipple();
      }
      this.drawingRoutePoints = [];
    }

    this.draggingBead = null;
    this.draggingMagnifier = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    this.keysPressed.add(e.code);

    const snap = atlasStore.getSnapshot();
    if (e.code === 'Space') {
      e.preventDefault();
      if (snap.bookPhase === 'closed') {
        this.openBook();
      } else if (snap.activeTool === 'bridge') {
        const first = snap.worlds[snap.activeWorld].bridges[0];
        if (first) {
          atlasStore.toggleBridge(snap.activeWorld, first.id);
          this.worlds[snap.activeWorld].syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
          soundEngine.playPaperFold();
        }
      } else if (snap.activeTool === 'hiddenLayer') {
        const first = snap.worlds[snap.activeWorld].hiddenLayers[0];
        if (first) {
          atlasStore.toggleHiddenLayer(snap.activeWorld, first.id);
          this.worlds[snap.activeWorld].syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
          soundEngine.playPaperFold();
        }
      } else if (snap.activeTool === 'popup') {
        const first = snap.worlds[snap.activeWorld].popups[0];
        if (first) {
          atlasStore.togglePopup(snap.activeWorld, first.id);
          this.worlds[snap.activeWorld].syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
          soundEngine.playPaperFold();
        }
      } else if (snap.activeTool === 'creature') {
        const nextC = snap.worlds[snap.activeWorld].creatures.find((c) => !c.summoned) ??
          snap.worlds[snap.activeWorld].creatures[0];
        if (nextC) {
          atlasStore.toggleCreature(snap.activeWorld, nextC.id);
          this.worlds[snap.activeWorld].syncState(atlasStore.getSnapshot().worlds[snap.activeWorld], this.elapsed);
          soundEngine.playSealSummon();
        }
      }
    }

    if (e.key === '1') {
      atlasStore.setCameraMode('inspection');
      this.applyCameraPreset('inspection');
    } else if (e.key === '2') {
      atlasStore.setCameraMode('diorama');
      this.applyCameraPreset('diorama');
    } else if (e.key === '3') {
      atlasStore.setCameraMode('immersion');
      this.applyCameraPreset('immersion');
    } else if (e.key === '[') {
      this.turnToWorld(((snap.activeWorld + TOTAL_WORLDS - 1) % TOTAL_WORLDS) as WorldId);
    } else if (e.key === ']') {
      this.turnToWorld(((snap.activeWorld + 1) % TOTAL_WORLDS) as WorldId);
    } else if (e.key.toLowerCase() === 'h') {
      atlasStore.setHudCollapsed(!snap.hudCollapsed);
    } else if (e.key.toLowerCase() === 'n') {
      if (snap.bookPhase !== 'closed') {
        atlasStore.setChronicleOpen(!snap.chronicleOpen);
      }
    } else if (e.key.toLowerCase() === 't') {
      atlasStore.setAutoTime(!snap.autoTime);
    } else if (e.code === 'Enter' && snap.bookPhase === 'open') {
      e.preventDefault();
      this.crossPortal();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const rawDt = Math.min(this.clock.getDelta(), 0.1);
      const snap = atlasStore.getSnapshot();
      const dt = snap.reducedMotion ? rawDt * 0.35 : rawDt;
      this.elapsed += dt;

      this.stepSimulation(dt, rawDt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
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
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private stepSimulation(dt: number, rawDt: number): void {
    const snap = atlasStore.getSnapshot();

    // 1. Quality sync
    this.applyQualitySettings();

    // 2. Book open/close hinge progression
    const targetOpen = snap.bookPhase === 'closed' ? 0 : 1;
    const openSpeed = snap.reducedMotion ? 8 : 3.2;
    this.bookOpenProgress += (targetOpen - this.bookOpenProgress) * (1 - Math.exp(-openSpeed * rawDt));
    this.bookRig.setBookOpenProgress(this.bookOpenProgress);

    if (snap.bookPhase === 'opening' && this.bookOpenProgress > 0.96) {
      this.bookOpenProgress = 1;
      atlasStore.setBookPhase('open');
    }

    // 3. Portal Morph OR Physical Page Turn Progress & Continuous World Cross-Folding
    if (this.portalTransition?.active) {
      const pt = this.portalTransition;
      const morphRate = snap.reducedMotion ? 1.85 : 0.72;
      pt.progress = Math.min(1, pt.progress + rawDt * morphRate);

      const destMeta = WORLD_METADATA[pt.toWorld];
      const destPortal = destMeta.portal;

      if (pt.progress < 0.48) {
        const tOut = pt.progress / 0.48;
        this.worlds.forEach((w, idx) => {
          if (idx === pt.fromWorld) {
            w.setPortalMorph(tOut, 'outgoing', pt.portal.x, pt.portal.z);
          } else {
            w.setFoldFactor(0);
          }
        });
        this.cameraPresetActive = true;
        _camPosGoal.set(pt.portal.x * 0.45, 2.35, pt.portal.z * 0.45 + 2.85);
        _camTargetGoal.set(pt.portal.x * 0.8, 0.45, pt.portal.z * 0.8);
        this.bookRig.setActiveWorldSpread(pt.fromWorld);
        this.bookRig.updateTurningLeaf(
          true,
          tOut,
          0,
          this.elapsed,
          snap.weather,
          pt.fromWorld,
        );
        this.bookRig.updatePortalRing(
          true,
          pt.progress,
          pt.portal.x,
          pt.portal.z,
          destMeta.accentHex,
        );
      } else {
        if (!pt.swapped) {
          pt.swapped = true;
          atlasStore.setActiveWorld(pt.toWorld);
          this.bookRig.setActiveWorldSpread(pt.toWorld);
          this.worlds[pt.fromWorld].setPortalHovered(null);
          atlasStore.setHoveredPortal(null);
          this.applyCameraPreset(atlasStore.getSnapshot().cameraMode);
        }

        const tIn = (pt.progress - 0.48) / 0.52;
        this.worlds.forEach((w, idx) => {
          if (idx === pt.toWorld) {
            w.setPortalMorph(tIn, 'incoming', destPortal.x, destPortal.z);
          } else {
            w.setFoldFactor(0);
          }
        });
        this.bookRig.setActiveWorldSpread(pt.toWorld);
        this.bookRig.updateTurningLeaf(
          false,
          0,
          0,
          this.elapsed,
          snap.weather,
          pt.toWorld,
        );
        this.bookRig.updatePortalRing(
          true,
          pt.progress,
          destPortal.x,
          destPortal.z,
          destMeta.accentHex,
        );
      }

      if (pt.progress >= 1) {
        this.worlds[pt.fromWorld].setFoldFactor(0);
        this.worlds[pt.toWorld].setPortalMorph(1, 'idle', 0, 0);
        this.bookRig.updatePortalRing(false, 0, 0, 0, destMeta.accentHex);
        this.portalTransition = null;
        atlasStore.setPortalTransitionState(null);
      }
    } else {
      if (this.pageTurnActive && !this.pageTurnDragging) {
        const targetProgress =
          this.pageTurnTargetWorld === snap.activeWorld
            ? this.pageTurnDirection === 1
              ? 0
              : 1
            : this.pageTurnDirection === 1
              ? 1
              : 0;
        const turnRate = snap.reducedMotion ? 5.0 : 1.85;
        if (Math.abs(this.pageTurnProgress - targetProgress) < 0.025) {
          const finalWorld = this.pageTurnTargetWorld;
          this.pageTurnActive = false;
          this.pageTurnProgress = 0;
          atlasStore.setActiveWorld(finalWorld);
          this.bookRig.setActiveWorldSpread(finalWorld);
        } else {
          this.pageTurnProgress += Math.sign(targetProgress - this.pageTurnProgress) * turnRate * rawDt;
          this.pageTurnProgress = THREE.MathUtils.clamp(this.pageTurnProgress, 0, 1);
        }
      }

      // Fold outgoing world down as page turns across spine, unfold incoming world
      this.worlds.forEach((w, idx) => {
        if (this.bookOpenProgress < 0.35) {
          w.setFoldFactor(0);
          return;
        }
        const openPop = THREE.MathUtils.clamp((this.bookOpenProgress - 0.35) / 0.65, 0, 1);
        if (!this.pageTurnActive) {
          w.setFoldFactor(idx === snap.activeWorld ? openPop : 0);
        } else {
          const dist = this.pageTurnDirection === 1 ? this.pageTurnProgress : 1 - this.pageTurnProgress;
          if (idx === snap.activeWorld && this.pageTurnTargetWorld !== snap.activeWorld) {
            w.setFoldFactor(Math.max(0, 1 - dist * 1.9) * openPop);
          } else if (idx === this.pageTurnTargetWorld) {
            w.setFoldFactor(Math.max(0, (dist - 0.48) * 1.92) * openPop);
          } else {
            w.setFoldFactor(0);
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

      this.bookRig.updateTurningLeaf(
        this.pageTurnActive,
        this.pageTurnProgress,
        this.cornerHoverLift,
        this.elapsed,
        snap.weather,
        snap.activeWorld,
      );
      this.bookRig.updatePortalRing(false, 0, 0, 0, '#D4AF6E');
    }

    // 4. 24-Hour Day/Night Auto-Progression
    if (snap.autoTime && snap.bookPhase !== 'closed') {
      atlasStore.advanceTimeQuietly(snap.timeOfDay + dt * 0.22); // 1 full day ~109s
      if (Math.floor(this.elapsed * 4) !== Math.floor((this.elapsed - dt) * 4)) {
        atlasStore.notify();
      }
    }

    // 5. Atmosphere, Sun/Moon, Weather & Candle Flicker
    const currentSnap = atlasStore.getSnapshot();
    const activeAmbientHex = WORLD_METADATA[currentSnap.activeWorld].ambientHex;
    this.atmosphere.update(
      dt,
      this.elapsed,
      currentSnap.timeOfDay,
      currentSnap.weather,
      currentSnap.qualityTier,
      this.bookOpenProgress > 0.5,
      activeAmbientHex,
    );
    this.bookRig.updateCandle(this.elapsed, this.atmosphere.nightFactor, currentSnap.weather);
    soundEngine.updateAtmosphere(
      currentSnap.weather,
      currentSnap.activeWorld,
      currentSnap.bookPhase !== 'closed',
    );

    // 6. Active World Updates
    this.worlds.forEach((w) => {
      if (w.root.visible) {
        w.update(
          dt,
          this.elapsed,
          this.atmosphere.nightFactor,
          currentSnap.weather,
          currentSnap.activeTool === 'constellation',
        );
      }
    });

    // 7. Magical Magnifier 3D Prop & Keyboard Nudging
    const magOn = currentSnap.bookPhase === 'open' && currentSnap.magnifierActive;
    this.magnifierMesh.visible = magOn;
    this.bookRig.setMagnifierState(magOn, currentSnap.magnifierPos.x, currentSnap.magnifierPos.z);

    if (magOn) {
      let mx = currentSnap.magnifierPos.x;
      let mz = currentSnap.magnifierPos.z;
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

    // 8. Camera Mode Transitions & Immersion Navigation (WASD / Arrow Keys)
    if (currentSnap.cameraMode !== this.lastCameraMode) {
      this.applyCameraPreset(currentSnap.cameraMode);
    }

    if (currentSnap.cameraMode === 'immersion' && !magOn) {
      const speed = 2.6 * rawDt;
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
      const camDamp = 1 - Math.exp(-4.8 * rawDt);
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
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.controls.dispose();
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
