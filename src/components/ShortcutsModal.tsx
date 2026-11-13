import { X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  const rows = [
    ['Space', 'Open book / activate focused bridge, seal, or hidden layer'],
    ['Enter', 'Cross the active folio’s 3D portal landmark to its linked chapter'],
    ['[  /  ]', 'Turn physically across all 10 world folios (I through X)'],
    ['N', 'Open or close the Cartographer’s Chronicle narrative'],
    ['V', 'Play or pause voiced Cartographer narration'],
    ['1  ·  2  ·  3', 'Switch camera: Desk Inspection · Diorama · Miniature Immersion'],
    ['W A S D / Arrows', 'Navigate inside Immersion view or glide Magical Magnifier'],
    ['T', 'Pause or resume 24-hour celestial time progression'],
    ['H', 'Pin or hide the bottom menu bar (also reveals on bottom hover or tap)'],
    ['Atelier Desk Props', 'Click Candle (light), Quill (blot ink), Wax Stamp (seal folio), Dividers (camera), Lens'],
    ['Touch / Mouse', 'Click portal gates, drag corners to turn pages, pull tabs, draw routes'],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Controls and Gestures Guide"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B0806]/75 p-4"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#D4AF6E]/35 bg-[#16100C] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#D4AF6E]/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-[#F4ECDC]">
            Atlas Controls &amp; Gestures
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close controls guide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D4AF6E]/25 text-[#C8BBA4] hover:border-[#D4AF6E]/60 hover:text-[#F4ECDC] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#D4AF6E]/12">
          {rows.map(([key, desc]) => (
            <div key={key} className="flex items-baseline justify-between gap-4 py-2.5 text-xs">
              <span className="font-mono font-medium text-[#E2C996] whitespace-nowrap shrink-0">
                {key}
              </span>
              <span className="text-right text-[#C8BBA4]">{desc}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#D4AF6E]/50 bg-[#251B14] px-4 py-2 text-xs font-medium text-[#F4ECDC] hover:bg-[#31241B] cursor-pointer"
          >
            Return to Atlas
          </button>
        </div>
      </div>
    </div>
  );
}
