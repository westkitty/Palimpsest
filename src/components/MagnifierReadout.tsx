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
      className="pointer-events-none fixed top-20 right-5 z-20 max-w-xs rounded-lg border border-[#D4AF6E]/45 bg-[#16100C]/94 px-4 py-3 shadow-xl"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-[#E2C996]">
        <Search className="h-3.5 w-3.5 text-[#D4AF6E]" />
        <span>{secret.title}</span>
      </div>
      <p className="mt-1.5 font-display text-sm italic leading-snug text-[#F4ECDC]">
        {secret.inscription}
      </p>
    </aside>
  );
}
