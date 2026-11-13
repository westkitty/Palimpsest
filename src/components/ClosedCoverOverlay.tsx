import { BookOpen } from 'lucide-react';

interface ClosedCoverOverlayProps {
  onOpenBook: () => void;
}

export function ClosedCoverOverlay({ onOpenBook }: ClosedCoverOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex flex-col items-center justify-center px-4 text-center">
      <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-lg border border-[#D4AF6E]/30 bg-[#16100C]/94 px-6 py-4 shadow-2xl">
        <p className="font-display text-lg font-semibold tracking-wide text-[#F4ECDC] sm:text-xl">
          An Unsealed Relic Awaits
        </p>
        <p className="max-w-md text-xs text-[#C8BBA4]">
          Click the brass clasp on the leather tome, or open the atlas below to unfold ten living chapters of the Cartographer&rsquo;s pilgrimage.
        </p>
        <button
          type="button"
          onClick={onOpenBook}
          className="mt-1 inline-flex items-center gap-2 rounded-md border border-[#D4AF6E]/60 bg-[#B8433E] px-5 py-2.5 text-xs font-semibold tracking-wide text-[#FAF4E8] transition-all hover:bg-[#CA4D47] focus-visible:outline-2 focus-visible:outline-[#D4AF6E] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BookOpen className="h-4 w-4" />
          <span>Unclasp &amp; Open Atlas</span>
        </button>
      </div>
    </div>
  );
}
