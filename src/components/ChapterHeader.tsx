import { BookOpen, Camera, Headphones, HelpCircle, Pause, ScrollText, Volume2, VolumeX } from 'lucide-react';
import { WORLD_METADATA, AtlasSnapshot } from '../types/atlas';

interface ChapterHeaderProps {
  snapshot: AtlasSnapshot;
  onToggleMute: () => void;
  onToggleNarration: () => void;
  onCloseBook: () => void;
  onToggleChronicle: () => void;
  onExportPostcard: () => void;
  onOpenHelp: () => void;
}

function formatClock(hours: number): string {
  const totalMins = Math.floor(((hours % 24) + 24) % 24 * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function ChapterHeader({
  snapshot,
  onToggleMute,
  onToggleNarration,
  onCloseBook,
  onToggleChronicle,
  onExportPostcard,
  onOpenHelp,
}: ChapterHeaderProps) {
  const meta = WORLD_METADATA[snapshot.activeWorld];
  const isOpen = snapshot.bookPhase !== 'closed';

  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-start justify-between px-5 pt-4 sm:px-7 sm:pt-5">
      <div className="pointer-events-auto flex max-w-[min(640px,70vw)] flex-col gap-0.5">
        <div className="flex items-center gap-2.5 text-[#F4ECDC]">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px] text-balance">
            Palimpsest
          </h1>
          <span className="text-[#D4AF6E]/60" aria-hidden="true">
            ·
          </span>
          <span className="truncate text-sm font-medium text-[#E2C996]">
            {isOpen ? meta.title : 'The Impossible Living Atlas'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#C8BBA4]">
          <span>{isOpen ? meta.folioCode : 'Antiquarian Folio'}</span>
          <span aria-hidden="true">·</span>
          <span>{isOpen ? meta.chapterTitle : 'Tenfold Paper-Engineered Odyssey'}</span>
          {isOpen && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#E2C996]">
                {formatClock(snapshot.timeOfDay)}
              </span>
            </>
          )}
        </div>

        {isOpen && (
          <p className="hidden sm:block truncate text-[11px] italic text-[#C8BBA4]/85">
            {meta.narrativeLead}
          </p>
        )}
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {isOpen && (
          <>
            <button
              type="button"
              onClick={onToggleNarration}
              aria-pressed={snapshot.narrationStatus === 'speaking'}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                snapshot.narrationStatus === 'speaking'
                  ? 'border-[#D4AF6E]/75 bg-[#3A2218] text-[#F4ECDC]'
                  : 'border-[#D4AF6E]/25 bg-[#16100C]/92 text-[#E9DEC8] hover:border-[#D4AF6E]/55 hover:text-[#F4ECDC]'
              }`}
              title="Listen to voiced chapter narration (V)"
            >
              {snapshot.narrationStatus === 'speaking' ? (
                <Pause className="h-3.5 w-3.5 text-[#D4AF6E]" />
              ) : (
                <Headphones className="h-3.5 w-3.5 text-[#D4AF6E]" />
              )}
              <span className="hidden sm:inline">
                {snapshot.narrationStatus === 'speaking'
                  ? 'Pause Voice'
                  : snapshot.narrationStatus === 'paused'
                    ? 'Resume Voice'
                    : 'Narrate'}
              </span>
            </button>
            <button
              type="button"
              onClick={onToggleChronicle}
              aria-pressed={snapshot.chronicleOpen}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                snapshot.chronicleOpen
                  ? 'border-[#D4AF6E]/75 bg-[#2E2118] text-[#F4ECDC]'
                  : 'border-[#D4AF6E]/25 bg-[#16100C]/92 text-[#E9DEC8] hover:border-[#D4AF6E]/55 hover:text-[#F4ECDC]'
              }`}
              title="Open Cartographer's Chronicle (N)"
            >
              <ScrollText className="h-3.5 w-3.5 text-[#D4AF6E]" />
              <span>Chronicle</span>
            </button>
            <button
              type="button"
              onClick={onExportPostcard}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#D4AF6E]/25 bg-[#16100C]/92 px-2.5 py-1.5 text-xs font-medium text-[#E9DEC8] transition-colors hover:border-[#D4AF6E]/55 hover:text-[#F4ECDC] focus-visible:outline-2 focus-visible:outline-[#D4AF6E] whitespace-nowrap shrink-0 cursor-pointer"
              title="Export gilded archival postcard PNG of active folio"
            >
              <Camera className="h-3.5 w-3.5 text-[#D4AF6E]" />
              <span>Postcard</span>
            </button>
            <button
              type="button"
              onClick={onCloseBook}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#D4AF6E]/25 bg-[#16100C]/92 px-3 py-1.5 text-xs font-medium text-[#E9DEC8] transition-colors hover:border-[#D4AF6E]/55 hover:text-[#F4ECDC] focus-visible:outline-2 focus-visible:outline-[#D4AF6E] whitespace-nowrap shrink-0 cursor-pointer"
              title="Close the atlas cover"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#D4AF6E]" />
              <span>Close Tome</span>
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={snapshot.audioMuted ? 'Unmute audio' : 'Mute audio'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D4AF6E]/25 bg-[#16100C]/92 text-[#E9DEC8] transition-colors hover:border-[#D4AF6E]/55 hover:text-[#F4ECDC] focus-visible:outline-2 focus-visible:outline-[#D4AF6E] cursor-pointer"
          title={snapshot.audioMuted ? 'Unmute procedural soundscapes' : 'Mute soundscapes'}
        >
          {snapshot.audioMuted ? (
            <VolumeX className="h-4 w-4 text-[#C8BBA4]" />
          ) : (
            <Volume2 className="h-4 w-4 text-[#D4AF6E]" />
          )}
        </button>
        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Keyboard and touch controls guide"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D4AF6E]/25 bg-[#16100C]/92 text-[#E9DEC8] transition-colors hover:border-[#D4AF6E]/55 hover:text-[#F4ECDC] focus-visible:outline-2 focus-visible:outline-[#D4AF6E] cursor-pointer"
          title="Controls & Gestures Guide"
        >
          <HelpCircle className="h-4 w-4 text-[#D4AF6E]" />
        </button>
      </div>
    </header>
  );
}
