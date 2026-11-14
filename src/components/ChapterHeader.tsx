import {
  BookOpen,
  Camera,
  Captions,
  FileText,
  Flag,
  Headphones,
  HelpCircle,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BOOK_SUBTITLE, BOOK_TITLE, FOLIO_BY_WORLD } from '../story/historyManifest';
import { AtlasSnapshot } from '../types/atlas';

interface ChapterHeaderProps {
  snapshot: AtlasSnapshot;
  onToggleMute: () => void;
  onToggleNarration: () => void;
  onToggleCaptions: () => void;
  onCloseBook: () => void;
  onToggleChronicle: () => void;
  onExportPostcard: () => void;
  onOpenEndcard: () => void;
  onOpenHelp: () => void;
}

export function ChapterHeader({
  snapshot,
  onToggleMute,
  onToggleNarration,
  onToggleCaptions,
  onCloseBook,
  onToggleChronicle,
  onExportPostcard,
  onOpenEndcard,
  onOpenHelp,
}: ChapterHeaderProps) {
  const manifest = FOLIO_BY_WORLD[snapshot.activeWorld];
  const isOpen = snapshot.bookPhase !== 'closed';

  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex flex-col gap-2 px-3 pt-2.5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-4">
      <div className="pointer-events-auto flex w-full sm:w-auto sm:max-w-[min(580px,56vw)] flex-col gap-0.5 rounded-md border border-[#8CA6B8]/20 bg-[#10141C]/86 px-3 py-1.5 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-[#F3ECE0]">
          <h1 className="font-display text-base font-bold tracking-tight sm:text-2xl truncate">
            {isOpen ? `${manifest.code} · ${manifest.title}` : BOOK_TITLE}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-[#C8C2B6]">
          <span className="font-mono text-[#8CA6B8]">
            {isOpen ? manifest.eraLabel : BOOK_SUBTITLE}
          </span>
          {isOpen && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate text-[#DDD6C6]">{manifest.temporalMarker}</span>
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-start sm:justify-end gap-1.5">
        {isOpen && (
          <>
            <button
              type="button"
              onClick={onToggleChronicle}
              aria-pressed={snapshot.chronicleOpen}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3D95B5] ${
                snapshot.chronicleOpen
                  ? 'border-[#3D95B5] bg-[#1F3142] text-[#F3ECE0]'
                  : 'border-[#8CA6B8]/28 bg-[#12161E]/92 text-[#DDD6C6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0]'
              }`}
              title="Open full Transcript, Mechanisms & Source Notes (T)"
            >
              <FileText className="h-3.5 w-3.5 text-[#8CA6B8]" />
              <span>Transcript &amp; Sources</span>
            </button>

            <button
              type="button"
              onClick={onToggleCaptions}
              aria-pressed={snapshot.captionsVisible}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3D95B5] ${
                snapshot.captionsVisible
                  ? 'border-[#3D95B5] bg-[#1F3142] text-[#F3ECE0]'
                  : 'border-[#8CA6B8]/28 bg-[#12161E]/92 text-[#DDD6C6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0]'
              }`}
              title="Toggle optional projection captions (K)"
            >
              <Captions className="h-3.5 w-3.5 text-[#8CA6B8]" />
              <span className="hidden md:inline">
                Captions: {snapshot.captionsVisible ? 'On' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleNarration}
              aria-pressed={snapshot.narrationStatus === 'speaking'}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3D95B5] ${
                snapshot.narrationStatus === 'speaking'
                  ? 'border-[#B89860]/75 bg-[#2A261E] text-[#F3ECE0]'
                  : 'border-[#8CA6B8]/28 bg-[#12161E]/92 text-[#DDD6C6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0]'
              }`}
              title={
                snapshot.narrationCapability === 'browser-speech'
                  ? 'Play or pause spoken narration & reading cues (V)'
                  : 'Step reading cues at transcript pace — no system voice detected (V)'
              }
            >
              {snapshot.narrationStatus === 'speaking' ? (
                <Pause className="h-3.5 w-3.5 text-[#B89860]" />
              ) : (
                <Headphones className="h-3.5 w-3.5 text-[#8CA6B8]" />
              )}
              <span className="hidden sm:inline">
                {snapshot.narrationStatus === 'speaking'
                  ? 'Pause Cue'
                  : snapshot.narrationStatus === 'paused'
                    ? 'Resume'
                    : 'Read Cue'}
              </span>
            </button>

            {snapshot.activeWorld === 11 && (
              <button
                type="button"
                onClick={onOpenEndcard}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#B89860]/60 bg-[#212A36] px-2.5 py-1.5 text-xs font-medium text-[#F3ECE0] hover:bg-[#2B3746] focus-visible:outline-2 focus-visible:outline-[#3D95B5] whitespace-nowrap shrink-0 cursor-pointer"
                title="View Administration Closing Endcard"
              >
                <Flag className="h-3.5 w-3.5 text-[#B89860]" />
                <span>Endcard</span>
              </button>
            )}

            {!snapshot.nonWebglMode && (
              <button
                type="button"
                onClick={onExportPostcard}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-md border border-[#8CA6B8]/28 bg-[#12161E]/92 px-2.5 py-1.5 text-xs font-medium text-[#DDD6C6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0] focus-visible:outline-2 focus-visible:outline-[#3D95B5] whitespace-nowrap shrink-0 cursor-pointer"
                title="Save 4:3 archival snapshot PNG"
              >
                <Camera className="h-3.5 w-3.5 text-[#8CA6B8]" />
                <span>Plate PNG</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCloseBook}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#8CA6B8]/28 bg-[#12161E]/92 px-2.5 py-1.5 text-xs font-medium text-[#DDD6C6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0] focus-visible:outline-2 focus-visible:outline-[#3D95B5] whitespace-nowrap shrink-0 cursor-pointer"
              title="Close volume back onto slate"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#8CA6B8]" />
              <span>Close</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={snapshot.audioMuted ? 'Unmute audio' : 'Mute audio'}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#8CA6B8]/28 bg-[#12161E]/92 text-[#DDD6C6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0] focus-visible:outline-2 focus-visible:outline-[#3D95B5] cursor-pointer"
          title={snapshot.audioMuted ? 'Unmute projector & chime bed' : 'Mute sound'}
        >
          {snapshot.audioMuted ? (
            <VolumeX className="h-4 w-4 text-[#8B929E]" />
          ) : (
            <Volume2 className="h-4 w-4 text-[#8CA6B8]" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Controls and Accessibility Guide"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#8CA6B8]/28 bg-[#12161E]/92 text-[#DDD6C6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0] focus-visible:outline-2 focus-visible:outline-[#3D95B5] cursor-pointer"
          title="Controls & Keyboard Shortcuts"
        >
          <HelpCircle className="h-4 w-4 text-[#8CA6B8]" />
        </button>
      </div>
    </header>
  );
}
