import { useEffect, useRef } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  EyeOff,
  Monitor,
  Search,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { FOLIO_BY_WORLD, FOLIO_MANIFESTS } from '../story/historyManifest';
import {
  AtlasSnapshot,
  CameraMode,
  FolioInteractionSlot,
  QualityTier,
  TOTAL_WORLDS,
  WorldId,
} from '../types/atlas';

interface ControlDockProps {
  snapshot: AtlasSnapshot;
  onSelectWorld: (world: WorldId) => void;
  onTriggerInteraction: (slot: FolioInteractionSlot) => void;
  onSetCameraMode: (mode: CameraMode) => void;
  onToggleMagnifier: () => void;
  onToggleNonWebgl: () => void;
  onToggleReducedMotion: () => void;
  onToggleNoFlash: () => void;
  onSetQuality: (tier: QualityTier) => void;
  onToggleHud: () => void;
  onNudgeMagnifier: (dx: number, dz: number) => void;
  onNudgeImmersion: (dx: number, dz: number) => void;
}

export function ControlDock({
  snapshot,
  onSelectWorld,
  onTriggerInteraction,
  onSetCameraMode,
  onToggleMagnifier,
  onToggleNonWebgl,
  onToggleReducedMotion,
  onToggleNoFlash,
  onSetQuality,
  onToggleHud,
  onNudgeMagnifier,
  onNudgeImmersion,
}: ControlDockProps) {
  const activePillRef = useRef<HTMLButtonElement | null>(null);
  const activeWorld = snapshot.activeWorld;

  useEffect(() => {
    if (snapshot.bookPhase === 'closed' || snapshot.hudCollapsed) return;
    activePillRef.current?.scrollIntoView({
      behavior: snapshot.reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeWorld, snapshot.bookPhase, snapshot.hudCollapsed, snapshot.reducedMotion]);

  if (snapshot.bookPhase === 'closed') return null;

  const manifest = FOLIO_BY_WORLD[activeWorld];
  const runtime = snapshot.worlds[activeWorld];

  if (snapshot.hudCollapsed) {
    return (
      <div className="fixed bottom-3 left-1/2 z-20 -translate-x-1/2">
        <button
          type="button"
          onClick={onToggleHud}
          className="inline-flex items-center gap-2 rounded-full border border-[#8CA6B8]/40 bg-[#12161E]/95 px-4 py-1.5 text-xs font-medium text-[#ECE4D4] shadow-xl hover:border-[#3D95B5] cursor-pointer"
          title="Expand bottom folio controls (H)"
        >
          <ChevronUp className="h-3.5 w-3.5 text-[#8CA6B8]" />
          <span>
            {manifest.code} · {manifest.title}
          </span>
        </button>
      </div>
    );
  }

  return (
    <nav
      aria-label="Folio navigation and teaching mechanism controls"
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#8CA6B8]/25 bg-[#10141C]/95 px-2.5 py-1.5 backdrop-blur-xs sm:px-5 sm:py-2"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 sm:gap-2">
        {/* Top Row: Direct Folio Mechanisms [A] [B] [C] + Page Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Active Folio [A] [B] [C] mechanism buttons */}
          <div className="grid w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1.5">
            {manifest.interactions.map((def) => {
              const st = runtime.interactions[def.slot];
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => onTriggerInteraction(def.slot)}
                  aria-pressed={st.active}
                  title={`${def.description} (Key ${def.slot})`}
                  className={`inline-flex min-w-0 items-center justify-center sm:justify-start gap-1 sm:gap-1.5 rounded-md border px-1.5 py-1 sm:px-2.5 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3D95B5] ${
                    st.locked
                      ? 'border-[#B35D53]/75 bg-[#331B1C] text-[#F3ECE0]'
                      : st.active
                        ? 'border-[#3D95B5] bg-[#1B3345] text-[#F3ECE0]'
                        : 'border-[#8CA6B8]/30 bg-[#171D28] text-[#D8D0C0] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0]'
                  }`}
                >
                  <span className="shrink-0 rounded bg-[#0E1116] px-1 py-0.5 sm:px-1.5 font-mono text-[10px] font-semibold text-[#8CE0FA]">
                    {def.slot}
                  </span>
                  <span className="min-w-0 truncate sm:max-w-[180px]">{def.label}</span>
                  {def.persistPolicy === 'stepped' && (
                    <span className="shrink-0 font-mono text-[10px] text-[#8CA6B8]">
                      {st.step}/{st.maxSteps}
                    </span>
                  )}
                  {st.locked && (
                    <span className="shrink-0 font-mono text-[9px] uppercase text-[#E8ACA4]">Locked</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Prev / Folio Pills / Next */}
          <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:max-w-full">
            <button
              type="button"
              disabled={activeWorld === 0}
              onClick={() => onSelectWorld((activeWorld - 1) as WorldId)}
              aria-label="Previous folio"
              title="Previous Folio ([)"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#8CA6B8]/30 bg-[#171D28] text-[#DDD6C6] hover:border-[#8CA6B8]/65 disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex max-w-[calc(100%-4rem)] sm:max-w-[min(420px,62vw)] items-center gap-1 overflow-x-auto py-0.5">
              {FOLIO_MANIFESTS.map((fm) => {
                const current = fm.worldId === activeWorld;
                const visited = snapshot.visitedWorlds.includes(fm.worldId);
                return (
                  <button
                    key={fm.id}
                    ref={current ? activePillRef : undefined}
                    type="button"
                    onClick={() => onSelectWorld(fm.worldId)}
                    aria-current={current ? 'page' : undefined}
                    title={`${fm.code}: ${fm.title}`}
                    className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] transition-colors cursor-pointer ${
                      current
                        ? 'border-[#3D95B5] bg-[#1F3A4D] font-bold text-[#F3ECE0]'
                        : visited
                          ? 'border-[#8CA6B8]/35 bg-[#171D28] text-[#D8D0C0] hover:border-[#8CA6B8]/70'
                          : 'border-[#8CA6B8]/18 bg-[#12161E] text-[#8B929E] hover:text-[#D8D0C0]'
                    }`}
                  >
                    {fm.code}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={activeWorld === TOTAL_WORLDS - 1}
              onClick={() => onSelectWorld((activeWorld + 1) as WorldId)}
              aria-label="Next folio"
              title="Next Folio (])"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#8CA6B8]/30 bg-[#171D28] text-[#DDD6C6] hover:border-[#8CA6B8]/65 disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Status Hint + Accessibility, Camera, Lens, and Non-WebGL Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-[#8CA6B8]/15 pt-1 sm:pt-1.5 text-[11px]">
          <p
            className="sr-only sm:not-sr-only sm:max-w-[44%] sm:truncate text-[#B8B2A4]"
            title={snapshot.statusHint}
          >
            {snapshot.statusHint}
          </p>

          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {!snapshot.nonWebglMode && (
              <>
                <div className="inline-flex items-center overflow-hidden rounded border border-[#8CA6B8]/25 bg-[#151A23]">
                  <span className="px-1.5 text-[#8CA6B8]" aria-hidden="true">
                    <Camera className="h-3 w-3" />
                  </span>
                  {(
                    [
                      ['inspection', 'Slate'],
                      ['diorama', '4:3 Frame'],
                      ['immersion', 'Close'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSetCameraMode(mode)}
                      className={`px-2 py-0.5 text-[10px] cursor-pointer ${
                        snapshot.cameraMode === mode
                          ? 'bg-[#223548] text-[#F3ECE0] font-semibold'
                          : 'text-[#B8B2A4] hover:text-[#F3ECE0]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {snapshot.cameraMode === 'immersion' && !snapshot.magnifierActive && (
                  <div className="inline-flex items-center gap-0.5 rounded border border-[#8CA6B8]/25 bg-[#151A23] px-1 py-0.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => onNudgeImmersion(-1, 0)}
                      className="px-1 text-[#C8C2B6] hover:text-[#F3ECE0] cursor-pointer"
                      aria-label="Pan close view left"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      onClick={() => onNudgeImmersion(0, -1)}
                      className="px-1 text-[#C8C2B6] hover:text-[#F3ECE0] cursor-pointer"
                      aria-label="Pan close view forward"
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => onNudgeImmersion(0, 1)}
                      className="px-1 text-[#C8C2B6] hover:text-[#F3ECE0] cursor-pointer"
                      aria-label="Pan close view back"
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      onClick={() => onNudgeImmersion(1, 0)}
                      className="px-1 text-[#C8C2B6] hover:text-[#F3ECE0] cursor-pointer"
                      aria-label="Pan close view right"
                    >
                      &rarr;
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onToggleMagnifier}
                  aria-pressed={snapshot.magnifierActive}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] cursor-pointer ${
                    snapshot.magnifierActive
                      ? 'border-[#3D95B5] bg-[#1F3A4D] text-[#F3ECE0]'
                      : 'border-[#8CA6B8]/25 bg-[#151A23] text-[#C8C2B6] hover:text-[#F3ECE0]'
                  }`}
                  title="Inspect archival marginalia with brass lens (F)"
                >
                  <Search className="h-3 w-3" />
                  <span>Lens</span>
                </button>

                {snapshot.magnifierActive && (
                  <div className="inline-flex items-center gap-0.5 rounded border border-[#3D95B5]/40 bg-[#151A23] px-1 py-0.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => onNudgeMagnifier(-0.45, 0)}
                      className="px-1 text-[#8CE0FA] cursor-pointer"
                      aria-label="Move lens left"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      onClick={() => onNudgeMagnifier(0, -0.45)}
                      className="px-1 text-[#8CE0FA] cursor-pointer"
                      aria-label="Move lens up"
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => onNudgeMagnifier(0, 0.45)}
                      className="px-1 text-[#8CE0FA] cursor-pointer"
                      aria-label="Move lens down"
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      onClick={() => onNudgeMagnifier(0.45, 0)}
                      className="px-1 text-[#8CE0FA] cursor-pointer"
                      aria-label="Move lens right"
                    >
                      &rarr;
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onToggleNonWebgl}
              aria-pressed={snapshot.nonWebglMode}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] cursor-pointer ${
                snapshot.nonWebglMode
                  ? 'border-[#3D95B5] bg-[#1F3A4D] text-[#F3ECE0]'
                  : 'border-[#8CA6B8]/25 bg-[#151A23] text-[#C8C2B6] hover:text-[#F3ECE0]'
              }`}
              title="Toggle Non-WebGL 4:3 Schematic View"
            >
              <Monitor className="h-3 w-3" />
              <span>{snapshot.nonWebglMode ? '3D View' : '4:3 Schematic'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleReducedMotion}
              aria-pressed={snapshot.reducedMotion}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] cursor-pointer ${
                snapshot.reducedMotion
                  ? 'border-[#3D95B5] bg-[#1F3A4D] text-[#F3ECE0]'
                  : 'border-[#8CA6B8]/25 bg-[#151A23] text-[#C8C2B6] hover:text-[#F3ECE0]'
              }`}
              title="Reduce motion and page turn transitions"
            >
              <Sparkles className="h-3 w-3" />
              <span>Reduced Motion</span>
            </button>

            <button
              type="button"
              onClick={onToggleNoFlash}
              aria-pressed={snapshot.noFlashMode}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] cursor-pointer ${
                snapshot.noFlashMode
                  ? 'border-[#3D95B5] bg-[#1F3A4D] text-[#F3ECE0]'
                  : 'border-[#8CA6B8]/25 bg-[#151A23] text-[#C8C2B6] hover:text-[#F3ECE0]'
              }`}
              title="Disable film gate flicker and luminance shifts"
            >
              <EyeOff className="h-3 w-3" />
              <span>No Flash</span>
            </button>

            {!snapshot.nonWebglMode && (
              <button
                type="button"
                onClick={() => {
                  const next: QualityTier =
                    snapshot.qualityTier === 'high'
                      ? 'medium'
                      : snapshot.qualityTier === 'medium'
                        ? 'low'
                        : 'high';
                  onSetQuality(next);
                }}
                className="inline-flex items-center gap-1 rounded border border-[#8CA6B8]/25 bg-[#151A23] px-2 py-0.5 text-[10px] text-[#C8C2B6] hover:text-[#F3ECE0] cursor-pointer"
                title="Cycle 3D rendering quality tier"
              >
                <Sliders className="h-3 w-3" />
                <span className="capitalize">{snapshot.qualityTier}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleHud}
              aria-label="Hide bottom folio bar"
              title="Collapse dock (H)"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#8CA6B8]/25 bg-[#151A23] text-[#C8C2B6] hover:text-[#F3ECE0] cursor-pointer"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
