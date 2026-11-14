import { BookOpen, Monitor } from 'lucide-react';
import { ADMINISTRATION_SLOGAN, BOOK_IMPRINT_CUE, BOOK_TITLE } from '../story/historyManifest';

interface ClosedCoverOverlayProps {
  nonWebglMode: boolean;
  onOpenBook: () => void;
  onToggleNonWebgl: () => void;
}

export function ClosedCoverOverlay({
  nonWebglMode,
  onOpenBook,
  onToggleNonWebgl,
}: ClosedCoverOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex flex-col items-center justify-center px-4 text-center">
      <div className="pointer-events-auto flex w-full max-w-2xl flex-col items-center gap-3 rounded-lg border border-[#8CA6B8]/30 bg-[#12161E]/95 px-5 py-4 shadow-2xl sm:flex-row sm:justify-between sm:gap-6 sm:text-left">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8CA6B8]">
            {BOOK_IMPRINT_CUE.paragraphs[0]}
          </p>
          <p className="mt-0.5 font-display text-lg font-semibold tracking-wide text-[#F3ECE0] sm:text-xl">
            {BOOK_TITLE}
          </p>
          <p className="mt-1 text-xs text-[#C8C2B6]">
            F01–F12 · Twelve archival folios.{' '}
            <span className="italic text-[#D8D0C0]">{ADMINISTRATION_SLOGAN}</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onToggleNonWebgl}
            aria-pressed={nonWebglMode}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#8CA6B8]/35 bg-[#1B212D] px-3 py-2 text-xs font-medium text-[#D8D2C5] transition-colors hover:border-[#8CA6B8]/70 hover:text-[#F3ECE0] focus-visible:outline-2 focus-visible:outline-[#3D95B5] whitespace-nowrap cursor-pointer"
            title="Read diagrams and transcript without 3D WebGL"
          >
            <Monitor className="h-3.5 w-3.5 text-[#8CA6B8]" />
            <span>{nonWebglMode ? '3D Volume View' : '4:3 Diagram Mode'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenBook}
            className="inline-flex items-center gap-2 rounded-md border border-[#B89860]/70 bg-[#243242] px-5 py-2 text-xs font-semibold tracking-wide text-[#F3ECE0] transition-colors hover:bg-[#2E4054] focus-visible:outline-2 focus-visible:outline-[#3D95B5] whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-[#B89860]" />
            <span>Open Volume</span>
          </button>
        </div>
      </div>
    </div>
  );
}
