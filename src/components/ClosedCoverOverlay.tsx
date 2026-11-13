import { BookOpen } from 'lucide-react';

interface ClosedCoverOverlayProps {
  onOpenBook: () => void;
}

export function ClosedCoverOverlay({ onOpenBook }: ClosedCoverOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex flex-col items-center justify-center px-4 text-center">
      <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-lg border border-[#D4AF6E]/35 bg-[#16100C]/94 px-6 py-3.5 shadow-2xl sm:flex-row sm:gap-5 sm:text-left">
        <div>
          <p className="font-display text-base font-semibold tracking-wide text-[#F4ECDC] sm:text-lg">
            Palimpsest · Folio I–X
          </p>
          <p className="max-w-sm text-xs text-[#C8BBA4]">
            Click the brass clasp on the leather tome or unseal below to unfold ten living realms.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenBook}
          className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6E]/65 bg-[#B8433E] px-5 py-2.5 text-xs font-semibold tracking-wide text-[#FAF4E8] transition-all hover:bg-[#CA4D47] focus-visible:outline-2 focus-visible:outline-[#D4AF6E] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BookOpen className="h-4 w-4" />
          <span>Open Book</span>
        </button>
      </div>
    </div>
  );
}
