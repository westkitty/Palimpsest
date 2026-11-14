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
  // Contract lock: Captions remain strictly OFF by default until user opts in.
  if (
    !snapshot.captionsVisible ||
    snapshot.bookPhase === 'closed' ||
    snapshot.narrationStatus === 'idle' ||
    !snapshot.narrationCaption
  ) {
    return null;
  }

  const bottomOffset = snapshot.hudCollapsed ? 'bottom-14' : 'bottom-44 sm:bottom-28';
  const isPaused = snapshot.narrationStatus === 'paused';

  return (
    <aside
      aria-live="polite"
      className={`fixed left-1/2 z-20 w-[min(660px,92vw)] -translate-x-1/2 rounded-lg border border-[#8CA6B8]/35 bg-[#101318]/94 px-4 py-2.5 shadow-2xl ${bottomOffset}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#8CA6B8]/18 pb-1.5">
        <div className="flex min-w-0 items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-[#8CA6B8]">
          <Volume2
            className={`h-3 w-3 shrink-0 ${
              isPaused ? 'text-[#8B929E]' : 'text-[#3D95B5]'
            }`}
          />
          <span className="truncate">
            {snapshot.narrationSpeakerLabel ?? 'Administration Reader'}
          </span>
          {snapshot.narrationProgress && (
            <span className="text-[#9FA6B2] shrink-0">
              {snapshot.narrationProgress.line}/{snapshot.narrationProgress.total}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-label={isPaused ? 'Resume cue' : 'Pause cue'}
            title={isPaused ? 'Resume cue (V)' : 'Pause cue (V)'}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#8CA6B8]/30 bg-[#181D26] text-[#DDD6C6] hover:border-[#8CA6B8]/65 cursor-pointer"
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={onReplay}
            aria-label="Replay folio lesson cues"
            title="Replay folio lesson cues"
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#8CA6B8]/30 bg-[#181D26] text-[#DDD6C6] hover:border-[#8CA6B8]/65 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onStop}
            aria-label="Dismiss caption bar"
            title="Stop active cue"
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#8CA6B8]/30 bg-[#181D26] text-[#A9B0BC] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0] cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <p className="mt-1.5 font-display text-sm sm:text-[15px] leading-relaxed text-[#F3ECE0]">
        {snapshot.narrationCaption}
      </p>
    </aside>
  );
}
