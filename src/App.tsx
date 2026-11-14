import { useCallback, useEffect, useRef, useState } from 'react';
import { narrationEngine } from './audio/NarrationEngine';
import { soundEngine } from './audio/SoundEngine';
import { ChapterHeader } from './components/ChapterHeader';
import { ChroniclePanel } from './components/ChroniclePanel';
import { ClosedCoverOverlay } from './components/ClosedCoverOverlay';
import { ControlDock } from './components/ControlDock';
import { MagnifierReadout } from './components/MagnifierReadout';
import { NarrationSubtitle } from './components/NarrationSubtitle';
import { NonWebglFolioView } from './components/NonWebglFolioView';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AtlasEngine } from './engine/AtlasEngine';
import { atlasStore } from './state/atlasStore';
import { BOOK_ENDCARD_CUE, BOOK_TITLE, FOLIO_BY_WORLD } from './story/historyManifest';
import {
  AtlasSnapshot,
  CueSlot,
  DraxisId,
  FolioInteractionSlot,
  TOTAL_WORLDS,
  WorldId,
} from './types/atlas';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<AtlasEngine | null>(null);

  const [snapshot, setSnapshot] = useState<AtlasSnapshot>(() => atlasStore.getSnapshot());
  const [contextLost, setContextLost] = useState(false);
  const [webglFallbackReason, setWebglFallbackReason] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const useNonWebgl = snapshot.nonWebglMode || contextLost;

  useEffect(() => {
    const unsub = atlasStore.subscribe((next) => setSnapshot(next));

    if (mountRef.current && !engineRef.current && !atlasStore.getSnapshot().nonWebglMode) {
      try {
        const engine = new AtlasEngine(mountRef.current);
        engine.onContextLost = (lost) => {
          setContextLost(lost);
          if (lost) {
            setWebglFallbackReason(
              'The WebGL graphics context was interrupted. Switched cleanly to the 4:3 Schematic & Reading View.',
            );
          } else {
            setWebglFallbackReason(null);
          }
        };
        engineRef.current = engine;
      } catch {
        setWebglFallbackReason(
          'WebGL acceleration is unavailable in this environment. Displaying the full 4:3 Schematic & Reading View.',
        );
        atlasStore.setNonWebglMode(true);
      }
    }

    return () => {
      unsub();
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      narrationEngine.stop();
      soundEngine.dispose();
    };
  }, []);

  // Pause WebGL RAF loop automatically while Non-WebGL mode is toggled on
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setRenderingPaused(useNonWebgl);
      if (!useNonWebgl) {
        engineRef.current.syncAllWorlds();
      }
    }
  }, [useNonWebgl]);

  const handleOpenBook = useCallback(() => {
    if (engineRef.current && !useNonWebgl) {
      engineRef.current.openBook();
      return;
    }
    const snap = atlasStore.getSnapshot();
    soundEngine.playBookOpen();
    atlasStore.setBookPhase('open');
    narrationEngine.playPrologueAndFolio(snap.activeWorld);
  }, [useNonWebgl]);

  const handleCloseBook = useCallback(() => {
    atlasStore.setEndcardOpen(false);
    if (engineRef.current && !useNonWebgl) {
      engineRef.current.closeBook();
      return;
    }
    narrationEngine.stop();
    atlasStore.setBookPhase('closed');
  }, [useNonWebgl]);

  const handleSelectWorld = useCallback(
    (world: WorldId) => {
      if (engineRef.current && !useNonWebgl) {
        engineRef.current.turnToWorld(world);
        return;
      }
      soundEngine.playPageTurn();
      if (atlasStore.getSnapshot().bookPhase === 'closed') {
        atlasStore.setBookPhase('open');
      }
      atlasStore.setActiveWorld(world);
      narrationEngine.playFolioCore(world);
    },
    [useNonWebgl],
  );

  const handleTriggerInteraction = useCallback(
    (slot: FolioInteractionSlot) => {
      if (engineRef.current && !useNonWebgl) {
        engineRef.current.triggerInteraction(slot);
        return;
      }
      const snap = atlasStore.getSnapshot();
      if (snap.bookPhase === 'closed') {
        handleOpenBook();
        return;
      }
      atlasStore.activateInteraction(snap.activeWorld, slot);
      soundEngine.playInteractionCue(slot, snap.activeWorld);
      narrationEngine.playInteractionCue(snap.activeWorld, slot);
    },
    [useNonWebgl, handleOpenBook],
  );

  // Ensure keyboard shortcuts still operate identically in Non-WebGL Fallback mode
  useEffect(() => {
    if (!useNonWebgl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const snap = atlasStore.getSnapshot();
      const k = e.key.toLowerCase();
      if (e.code === 'Space' || e.code === 'Enter') {
        if (document.activeElement instanceof HTMLButtonElement) return;
        e.preventDefault();
        if (snap.bookPhase === 'closed') {
          handleOpenBook();
        } else {
          const w = snap.worlds[snap.activeWorld];
          const nextSlot: FolioInteractionSlot = !w.interactions.A.active
            ? 'A'
            : !w.interactions.B.active
              ? 'B'
              : 'C';
          handleTriggerInteraction(nextSlot);
        }
      } else if (k === 'a') {
        handleTriggerInteraction('A');
      } else if (k === 'b') {
        handleTriggerInteraction('B');
      } else if (k === 'c') {
        handleTriggerInteraction('C');
      } else if (e.key === '[' || e.key === 'ArrowLeft') {
        if (snap.activeWorld > 0) handleSelectWorld((snap.activeWorld - 1) as WorldId);
      } else if (e.key === ']' || e.key === 'ArrowRight') {
        if (snap.activeWorld < TOTAL_WORLDS - 1) handleSelectWorld((snap.activeWorld + 1) as WorldId);
      } else if (k === 't' && snap.bookPhase !== 'closed') {
        atlasStore.setChronicleOpen(!snap.chronicleOpen);
      } else if (k === 'k') {
        atlasStore.setCaptionsVisible(!snap.captionsVisible);
      } else if (k === 'v' && snap.bookPhase !== 'closed') {
        narrationEngine.togglePlayPause(snap.activeWorld);
      } else if (k === 'h') {
        atlasStore.setHudCollapsed(!snap.hudCollapsed);
      } else if (e.code === 'Escape') {
        if (snap.chronicleOpen) atlasStore.setChronicleOpen(false);
        if (snap.endcardOpen) atlasStore.setEndcardOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [useNonWebgl, handleOpenBook, handleSelectWorld, handleTriggerInteraction]);

  const handleToggleMute = () => {
    const next = !snapshot.audioMuted;
    atlasStore.setAudioMuted(next);
    soundEngine.setMuted(next);
    if (next) narrationEngine.stop();
  };

  const handleToggleNarration = () => {
    narrationEngine.togglePlayPause(snapshot.activeWorld);
  };

  const handleReplayNarration = () => {
    if (snapshot.audioMuted) {
      atlasStore.setAudioMuted(false);
      soundEngine.setMuted(false);
    }
    narrationEngine.playFolioCore(snapshot.activeWorld, true);
  };

  const handleToggleCaptions = () => {
    atlasStore.setCaptionsVisible(!snapshot.captionsVisible);
  };

  const handleSelectDraxis = (id: DraxisId) => {
    atlasStore.selectDraxisSpecimen(id);
    if (engineRef.current && !useNonWebgl) {
      engineRef.current.syncWorld(snapshot.activeWorld);
    }
    soundEngine.playPaperFold();
  };

  const handlePlayCueSlot = (worldId: WorldId, slot: CueSlot) => {
    if (snapshot.audioMuted) {
      atlasStore.setAudioMuted(false);
      soundEngine.setMuted(false);
    }
    narrationEngine.playCueSlot(worldId, slot, true);
  };

  const handleExportPostcard = () => {
    const dataUrl = engineRef.current?.capturePlateSnapshotUrl();
    if (!dataUrl) return;
    const code = FOLIO_BY_WORLD[snapshot.activeWorld].id;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `palimpsest-${code}-plate.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    atlasStore.setStatusHint(`Saved 4:3 archival snapshot PNG for ${FOLIO_BY_WORLD[snapshot.activeWorld].code}.`);
    soundEngine.playPaperFold();
  };

  const handleOpenEndcard = () => {
    atlasStore.setChronicleOpen(false);
    atlasStore.setEndcardOpen(true);
    narrationEngine.playEndcard();
  };

  const handleRestartSession = () => {
    if (engineRef.current) {
      engineRef.current.restartSessionAndSync();
    } else {
      narrationEngine.stop();
      atlasStore.restartHistorySession();
    }
  };

  const totalDemosActive = snapshot.worlds.reduce(
    (acc, w) => acc + (['A', 'B', 'C'] as const).filter((s) => w.interactions[s].active).length,
    0,
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0E1116]">
      {/* Dedicated WebGL canvas container (matte black slate stage) */}
      <div
        ref={mountRef}
        className={`fixed inset-0 h-full w-full ${useNonWebgl ? 'pointer-events-none opacity-0' : ''}`}
        aria-label="Interactive 3D twelve-folio instructional book canvas"
        aria-hidden={useNonWebgl}
      />

      {/* Accessible Non-WebGL 4:3 Schematic & Reading Fallback */}
      {useNonWebgl && (
        <NonWebglFolioView
          snapshot={snapshot}
          webglFallbackReason={webglFallbackReason}
          onOpenBook={handleOpenBook}
          onTriggerInteraction={handleTriggerInteraction}
        />
      )}

      {/* Compact archival header */}
      <ChapterHeader
        snapshot={snapshot}
        onToggleMute={handleToggleMute}
        onToggleNarration={handleToggleNarration}
        onToggleCaptions={handleToggleCaptions}
        onCloseBook={handleCloseBook}
        onToggleChronicle={() => atlasStore.setChronicleOpen(!snapshot.chronicleOpen)}
        onExportPostcard={handleExportPostcard}
        onOpenEndcard={handleOpenEndcard}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Full DOM Transcript, Mechanisms & 21 DRAXIS Source Drawer */}
      <ChroniclePanel
        snapshot={snapshot}
        onClose={() => atlasStore.setChronicleOpen(false)}
        onSelectWorld={handleSelectWorld}
        onTriggerInteraction={handleTriggerInteraction}
        onSelectDraxis={handleSelectDraxis}
        onPlayCueSlot={handlePlayCueSlot}
        onToggleNarration={handleToggleNarration}
        onToggleCaptions={handleToggleCaptions}
        onOpenEndcard={handleOpenEndcard}
        onRestartSession={handleRestartSession}
      />

      {/* Opt-in Bottom Captions (strictly OFF by default until toggled) */}
      <NarrationSubtitle
        snapshot={snapshot}
        onTogglePlayPause={handleToggleNarration}
        onReplay={handleReplayNarration}
        onStop={() => narrationEngine.stop()}
      />

      {/* Closed charcoal-linen volume arrival overlay */}
      {snapshot.bookPhase === 'closed' && (
        <ClosedCoverOverlay
          nonWebglMode={snapshot.nonWebglMode}
          onOpenBook={handleOpenBook}
          onToggleNonWebgl={() => atlasStore.setNonWebglMode(!snapshot.nonWebglMode)}
        />
      )}

      {/* Inspection lens marginalia readout */}
      {!useNonWebgl && snapshot.bookPhase === 'open' && snapshot.magnifierActive && (
        <MagnifierReadout secret={snapshot.activeSecret} />
      )}

      {/* Hover callout tooltip inside 3D volume */}
      {!useNonWebgl && snapshot.hoveredProp && (
        <div
          style={{
            left: `${snapshot.hoveredProp.x}px`,
            top: `${snapshot.hoveredProp.y}px`,
          }}
          className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-full rounded border border-[#8CA6B8]/45 bg-[#10141C]/95 px-2.5 py-1.5 text-center shadow-xl"
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8CA6B8]">
            {snapshot.hoveredProp.category}
          </div>
          <div className="text-xs font-medium text-[#F3ECE0]">{snapshot.hoveredProp.label}</div>
          <div className="text-[10px] text-[#B8B2A4]">{snapshot.hoveredProp.hint}</div>
        </div>
      )}

      {/* Administration Closing Endcard (zero points/ranks/scores) */}
      {snapshot.endcardOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Closing Endcard"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#090B0F]/85 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#B89860]/50 bg-[#12161E] p-6 text-center shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8CA6B8]">
              Closing Archival Imprint
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-[#F3ECE0]">{BOOK_TITLE}</h2>

            <div className="mt-4 space-y-2 rounded border border-[#8CA6B8]/25 bg-[#171C26] p-4 text-sm leading-relaxed text-[#EBE3D2]">
              {BOOK_ENDCARD_CUE.paragraphs.map((line, i) => (
                <p key={i} className={i === 1 ? 'font-semibold text-[#F3ECE0]' : ''}>
                  {line}
                </p>
              ))}
            </div>

            <p className="mt-3 font-mono text-[11px] text-[#9FA6B2]">
              Folios consulted: {snapshot.visitedWorlds.length}/{TOTAL_WORLDS} · Demonstrations
              operated: {totalDemosActive}/36
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => atlasStore.setEndcardOpen(false)}
                className="rounded border border-[#8CA6B8]/40 bg-[#1B222F] px-4 py-2 text-xs font-medium text-[#F3ECE0] hover:border-[#3D95B5] cursor-pointer"
              >
                Return to Folio XII
              </button>
              <button
                type="button"
                onClick={handleCloseBook}
                className="rounded border border-[#B89860]/55 bg-[#243242] px-4 py-2 text-xs font-medium text-[#F3ECE0] hover:bg-[#2F4156] cursor-pointer"
              >
                Close Volume
              </button>
              <button
                type="button"
                onClick={handleRestartSession}
                className="rounded border border-[#8CA6B8]/30 bg-[#141821] px-4 py-2 text-xs text-[#C8C2B6] hover:border-[#B35D53]/60 hover:text-[#F3ECE0] cursor-pointer"
              >
                Restart Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible bottom dock with direct A/B/C teaching triggers & F01-F12 selector */}
      <ControlDock
        snapshot={snapshot}
        onSelectWorld={handleSelectWorld}
        onTriggerInteraction={handleTriggerInteraction}
        onSetCameraMode={(mode) => {
          atlasStore.setCameraMode(mode);
          engineRef.current?.applyCameraPreset(mode);
        }}
        onToggleMagnifier={() =>
          atlasStore.setActiveTool(snapshot.activeTool === 'magnifier' ? 'explore' : 'magnifier')
        }
        onToggleNonWebgl={() => atlasStore.setNonWebglMode(!snapshot.nonWebglMode)}
        onToggleReducedMotion={() => atlasStore.setReducedMotion(!snapshot.reducedMotion)}
        onToggleNoFlash={() => atlasStore.setNoFlashMode(!snapshot.noFlashMode)}
        onSetQuality={(tier) => atlasStore.setQualityTier(tier)}
        onToggleHud={() => atlasStore.setHudCollapsed(!snapshot.hudCollapsed)}
        onNudgeMagnifier={(dx, dz) => engineRef.current?.nudgeMagnifier(dx, dz)}
        onNudgeImmersion={(dx, dz) => engineRef.current?.nudgeImmersion(dx, dz)}
      />

      {/* Keyboard & Touch Shortcuts modal */}
      <ShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}
