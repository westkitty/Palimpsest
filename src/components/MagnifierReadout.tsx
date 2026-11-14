import { Search } from 'lucide-react';
import { MagnifierDiscovery } from '../types/atlas';

interface MagnifierReadoutProps {
  secret: MagnifierDiscovery | null;
}

export function MagnifierReadout({ secret }: MagnifierReadoutProps) {
  if (!secret) return null;

  return (
    <aside
      aria-live="polite"
      className="pointer-events-none fixed top-20 right-5 z-20 max-w-xs rounded-lg border border-[#3D95B5]/45 bg-[#11151D]/95 px-4 py-3 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-[#3D95B5]">
        <span>Archival Lens Record</span>
        <span>{secret.sourceKind}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#F3ECE0]">
        <Search className="h-3.5 w-3.5 shrink-0 text-[#8CA6B8]" />
        <span>{secret.title}</span>
      </div>
      <p className="mt-1.5 font-display text-sm leading-snug text-[#DDD6C6]">
        {secret.inscription}
      </p>
    </aside>
  );
}
