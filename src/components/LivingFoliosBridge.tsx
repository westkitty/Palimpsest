import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import type { WorldId } from '../types/atlas';

type OpeningFolio = 0 | 1 | 2;
interface BridgeMessage { channel?: string; action?: string; folio?: number }
interface LivingFoliosBridgeProps {
  initialFolio: OpeningFolio;
  onClose: () => void;
  onContinue: (world: WorldId) => void;
}
const FOLIOS = Array.from({ length: 12 }, (_, i) => i as WorldId);

/** Keeps the authored F01-F03 sculpture inside one navigable twelve-folio volume.
 * No secret discoveries, narration, or manuscript data cross the bridge.
 */
export function LivingFoliosBridge({ initialFolio, onClose, onContinue }: LivingFoliosBridgeProps) {
  const [folio, setFolio] = useState<OpeningFolio>(initialFolio);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const frameUrl = './folio-vnext.html?embedded=1&folio=' + (initialFolio + 1);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    const onMessage = (event: MessageEvent<BridgeMessage>) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.channel !== 'palimpsest-living') return;
      if (data.action === 'folio' && typeof data.folio === 'number' && Number.isInteger(data.folio) && data.folio >= 0 && data.folio <= 2) {
        setFolio(data.folio as OpeningFolio);
      } else if (data.action === 'continue' && data.folio === 3) {
        onContinue(3 as WorldId);
      } else if (data.action === 'exit') {
        onClose();
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (dialog?.open) dialog.close();
    };
  }, [onClose, onContinue]);

  const navigate = (world: WorldId) => {
    if (world > 2) {
      onContinue(world);
    } else {
      frameRef.current?.contentWindow?.postMessage(
        { channel: 'palimpsest-living', action: 'navigate', folio: world },
        window.location.origin,
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      aria-label="PALIMPSEST integrated twelve-folio volume"
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden border-0 bg-[#0D131C] p-0 text-[#F1E7D5] backdrop:bg-[#070B11]/90"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="z-10 shrink-0 border-b border-[#B89860]/40 bg-[#111B29] px-2 py-2 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-[#C4A871]" />
              <div>
                <p className="font-serif text-sm font-semibold tracking-[0.035em] text-[#F1E7D5] sm:text-lg">PALIMPSEST · THE LIVING VOLUME</p>
                <p className="font-mono text-[9px] tracking-[0.07em] text-[#A7BDCA] sm:text-[10px]">F01–F03 sculptural folios · F04–F12 archival continuation</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center gap-1.5 rounded border border-[#94ACBA]/50 bg-[#233247] px-3 py-2 text-xs font-semibold text-[#F3E9D7] hover:border-[#C5DAE3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#77DCFA]"
              aria-label="Return to the archival reader"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Archive
            </button>
          </div>
          <nav aria-label="Navigate all twelve PALIMPSEST folios" className="mt-2 flex gap-1 overflow-x-auto pb-0.5">
            {FOLIOS.map((world) => (
              <button
                key={world}
                type="button"
                onClick={() => navigate(world)}
                aria-current={world === folio ? 'page' : undefined}
                aria-label={'Folio ' + String(world + 1).padStart(2, '0') + (world < 3 ? ', sculptural edition' : ', archival continuation')}
                className={'min-h-9 min-w-[49px] shrink-0 rounded border px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] focus-visible:outline-2 focus-visible:outline-[#77DCFA] ' + (
                  world === folio
                    ? 'border-[#68DDF3] bg-[#1A3C4E] text-[#E4F8FD]'
                    : world < 3
                      ? 'border-[#758FA7]/55 bg-[#203047] text-[#DDEAF0] hover:border-[#68DDF3]'
                      : 'border-[#937F5F]/45 bg-[#242832] text-[#D1C6AF] hover:border-[#C5A46E]'
                )}
              >
                {'F' + String(world + 1).padStart(2, '0')}
              </button>
            ))}
          </nav>
        </header>
        <iframe
          ref={frameRef}
          title="F01–F03 sculptural folios: original papercraft figures, mechanisms and draggable instruments"
          src={frameUrl}
          className="block min-h-0 w-full flex-1 border-0 bg-[#101720]"
        />
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#B89860]/30 bg-[#111B29] px-3 py-1.5 font-mono text-[10px] text-[#B4C4CD]">
          <span>Hand-inked paper · Drag instrument panels by their handles</span>
          <button
            type="button"
            onClick={() => onContinue(3 as WorldId)}
            className="shrink-0 rounded border border-[#A9946B]/50 bg-[#283647] px-3 py-1.5 text-[#F1E7D5] hover:border-[#CDB987] focus-visible:outline-2 focus-visible:outline-[#77DCFA]"
          >
            Continue to F04 →
          </button>
        </footer>
      </div>
    </dialog>
  );
}
