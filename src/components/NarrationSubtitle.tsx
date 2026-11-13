import { Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { AtlasSnapshot } from '../types/atlas';

interface NarrationSubtitleProps {
  snapshot: AtlasSnapshot;
  onTogglePlayPause: () => void;
  onReplay: () => void;
  onStop: () => void;
}

export function NarrationSubtitle({
  snapshot,
  onTogglePlayPause,
  onReplay,
  onStop,
}: NarrationSubtitleProps) {
  if (
    snapshot.bookPhase === 'closed' ||
    snapshot.narrationStatus === 'idle' ||
    !snapshot.narrationCaption
  ) {
    return null;
  }

  const bottomOffset = snapshot.hoveredPortal
    ? snapshot.hudCollapsed
      ? 'bottom-28'
      : 'bottom-44'
    : snapshot.hudCollapsed
      ? 'bottom-14'
      : 'bottom-32';

  const isPaused = snapshot.narrationStatus === 'paused';

  return (
    <aside
      aria-live="polite"
      className={`fixed left-1/2 z-20 w-[min(640px,92vw)] -translate-x-1/2 rounded-lg border border-[#D4AF6E]/35 bg-[#16100C]/92 px-4 py-2.5 shadow-2xl transition-all duration-200 ${bottomOffset}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#D4AF6E]/15 pb-1.5">
        <div className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D4AF6E]">
          <Volume2
            className={`h-3 w-3 shrink-0 ${
              isPaused ? 'text-[#A89A84]' : 'animate-pulse text-[#D4AF6E]'
            }`}
          />
          <span className="truncate">
            {snapshot.narrationSpeakerLabel ?? 'Cartographer Aldous'}
          </span>
          {snapshot.narrationProgress && (
            <span className="font-mono text-[#A89A84] shrink-0">
              {snapshot.narrationProgress.line}/{snapshot.narrationProgress.total}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-label={isPaused ? 'Resume narration' : 'Pause narration'}
            title={isPaused ? 'Resume narration (V)' : 'Pause narration (V)'}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#D4AF6E]/25 bg-[#211812] text-[#E2C996] hover:border-[#D4AF6E]/60 cursor-pointer"
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={onReplay}
            aria-label="Replay chapter narration"
            title="Replay chapter narration"
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#D4AF6E]/25 bg-[#211812] text-[#E2C996] hover:border-[#D4AF6E]/60 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop narration"
            title="Dismiss voice narration"
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#D4AF6E]/25 bg-[#211812] text-[#C8BBA4] hover:border-[#D4AF6E]/60 hover:text-[#F4ECDC] cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <p className="mt-1.5 font-display text-sm sm:text-[15px] italic leading-relaxed text-[#F4ECDC]">
        &ldquo;{snapshot.narrationCaption}&rdquo;
      </p>
    </aside>
  );
}
