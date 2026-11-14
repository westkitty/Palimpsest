import { X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  const rows = [
    ['Space / Enter', 'Open closed volume, or trigger next mechanism on the open folio'],
    ['A · B · C', 'Operate the folio’s three physical teaching demonstrations directly'],
    ['[ / ] · Left / Right', 'Turn across Folios F01 through F12 sequentially'],
    ['1 · 2 · 3', 'Camera presets: Slate Inspection · 4:3 Framing · Close Model View'],
    ['T', 'Open or close the Transcript, Mechanisms & Source Notes drawer'],
    ['K', 'Toggle optional bottom captions (off by default)'],
    ['V', 'Play or pause cue reader across folio text'],
    ['F', 'Toggle archival Inspection Lens (move with WASD / Arrow keys or pointer)'],
    ['H', 'Collapse or expand the bottom folio bar'],
    ['Escape', 'Close open drawers or dialogs'],
    ['Touch / Mouse', 'Drag corners to turn leaves, click mechanisms in 4:3 frame, or use Non-WebGL Diagram Mode'],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Controls and Accessibility Guide"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#090B0F]/80 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto atlas-scroll rounded-lg border border-[#8CA6B8]/35 bg-[#12161E] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#8CA6B8]/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-[#F3ECE0]">
            Volume Controls &amp; Accessibility
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close controls guide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#8CA6B8]/30 text-[#C8C2B6] hover:border-[#8CA6B8]/70 hover:text-[#F3ECE0] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#8CA6B8]/12">
          {rows.map(([key, desc]) => (
            <div key={key} className="flex items-baseline justify-between gap-4 py-2.5 text-xs">
              <span className="font-mono font-medium text-[#8CA6B8] whitespace-nowrap shrink-0">
                {key}
              </span>
              <span className="text-right text-[#D8D2C5]">{desc}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#8CA6B8]/45 bg-[#1F2A38] px-4 py-2 text-xs font-medium text-[#F3ECE0] hover:bg-[#29384B] cursor-pointer"
          >
            Return to Volume
          </button>
        </div>
      </div>
    </div>
  );
}
