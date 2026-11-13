import { useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/SoundEngine';
import { ChapterHeader } from './components/ChapterHeader';
import { ClosedCoverOverlay } from './components/ClosedCoverOverlay';
import { ControlDock } from './components/ControlDock';
import { MagnifierReadout } from './components/MagnifierReadout';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AtlasEngine } from './engine/AtlasEngine';
import { atlasStore } from './state/atlasStore';
import { AtlasSnapshot, WorldId } from './types/atlas';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<AtlasEngine | null>(null);

  const [snapshot, setSnapshot] = useState<AtlasSnapshot>(() => atlasStore.getSnapshot());
  const [contextLost, setContextLost] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const unsub = atlasStore.subscribe((next) => setSnapshot(next));

    if (mountRef.current && !engineRef.current) {
      const engine = new AtlasEngine(mountRef.current);
      engine.onContextLost = (lost) => setContextLost(lost);
      engineRef.current = engine;
    }

    return () => {
      unsub();
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      soundEngine.dispose();
    };
  }, []);

  const handleOpenBook = () => {
    engineRef.current?.openBook();
  };

  const handleCloseBook = () => {
    engineRef.current?.closeBook();
  };

  const handleToggleMute = () => {
    const next = !snapshot.audioMuted;
    atlasStore.setAudioMuted(next);
    soundEngine.setMuted(next);
  };

  const handleSelectWorld = (world: WorldId) => {
    engineRef.current?.turnToWorld(world);
  };

  const handleTogglePopup = (popupId: string) => {
    atlasStore.togglePopup(snapshot.activeWorld, popupId);
    engineRef.current?.syncWorld(snapshot.activeWorld);
    soundEngine.playPaperFold();
  };

  const handleToggleBridge = (bridgeId: string) => {
    atlasStore.toggleBridge(snapshot.activeWorld, bridgeId);
    engineRef.current?.syncWorld(snapshot.activeWorld);
    soundEngine.playPaperFold();
  };

  const handleToggleCreature = (creatureId: string) => {
    atlasStore.toggleCreature(snapshot.activeWorld, creatureId);
    engineRef.current?.syncWorld(snapshot.activeWorld);
    soundEngine.playSealSummon();
  };

  const handleToggleHiddenLayer = (layerId: string) => {
    atlasStore.toggleHiddenLayer(snapshot.activeWorld, layerId);
    engineRef.current?.syncWorld(snapshot.activeWorld);
    soundEngine.playPaperFold();
  };

  const handleNudgeRiver = (dx: number, dz: number) => {
    const pts = snapshot.worlds[snapshot.activeWorld].riverControlPoints;
    const mid = pts[2] ?? pts[1];
    if (!mid) return;
    atlasStore.updateRiverPoint(snapshot.activeWorld, 2, {
      x: mid.x + dx,
      z: mid.z + dz,
    });
    engineRef.current?.syncWorld(snapshot.activeWorld);
    soundEngine.playWaterRipple();
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#120D0A]">
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={mountRef}
        className="fixed inset-0 h-full w-full"
        aria-label="Interactive 3D living atlas canvas"
      />

      {/* Graceful fallback if WebGL context is lost */}
      {contextLost && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#120D0A]/95 p-6 text-center">
          <div className="max-w-md rounded-lg border border-[#D4AF6E]/35 bg-[#16100C] p-6">
            <h2 className="font-display text-2xl font-bold text-[#F4ECDC]">
              Restoring the Atlas Canvas
            </h2>
            <p className="mt-2 text-xs text-[#C8BBA4]">
              The 3D graphics context was interrupted. Reload the window if the living pages do not automatically resume.
            </p>
          </div>
        </div>
      )}

      {/* Unboxed editorial top chapter header */}
      <ChapterHeader
        snapshot={snapshot}
        onToggleMute={handleToggleMute}
        onCloseBook={handleCloseBook}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Closed book arrival overlay */}
      {snapshot.bookPhase === 'closed' && (
        <ClosedCoverOverlay onOpenBook={handleOpenBook} />
      )}

      {/* Secret ink discovery readout for Magical Magnifier */}
      {snapshot.bookPhase === 'open' && snapshot.magnifierActive && (
        <MagnifierReadout secret={snapshot.activeSecret} />
      )}

      {/* Unified collapsible bottom control dock */}
      <ControlDock
        snapshot={snapshot}
        onSelectWorld={handleSelectWorld}
        onSelectTool={(tool) => atlasStore.setActiveTool(tool)}
        onSetTime={(hrs) => {
          atlasStore.setAutoTime(false);
          atlasStore.setTimeOfDay(hrs);
        }}
        onToggleAutoTime={() => atlasStore.setAutoTime(!snapshot.autoTime)}
        onSetWeather={(w) => atlasStore.setWeather(w)}
        onSetCameraMode={(mode) => {
          atlasStore.setCameraMode(mode);
          engineRef.current?.applyCameraPreset(mode);
        }}
        onToggleHud={() => atlasStore.setHudCollapsed(!snapshot.hudCollapsed)}
        onSetQuality={(tier) => atlasStore.setQualityTier(tier)}
        onToggleReducedMotion={() => atlasStore.setReducedMotion(!snapshot.reducedMotion)}
        onTogglePopup={handleTogglePopup}
        onToggleBridge={handleToggleBridge}
        onPlantQuickSeed={() => engineRef.current?.plantQuickSeed()}
        onConnectNextStar={() => engineRef.current?.connectNextStarEdge()}
        onToggleCreature={handleToggleCreature}
        onToggleHiddenLayer={handleToggleHiddenLayer}
        onNudgeMagnifier={(dx, dz) => engineRef.current?.nudgeMagnifier(dx, dz)}
        onNudgeImmersion={(dx, dz) => engineRef.current?.nudgeImmersion(dx, dz)}
        onNudgeRiver={handleNudgeRiver}
      />

      {/* On-demand keyboard & touch shortcuts reference */}
      <ShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
