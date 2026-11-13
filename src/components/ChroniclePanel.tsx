import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { GeminiNarratorVoiceId, narrationEngine } from '../audio/NarrationEngine';
import { MAGNIFIER_SECRETS } from '../state/atlasStore';
import { CHRONICLE_SCRIPTS } from '../story/chronicleScripts';
import {
  AtlasSnapshot,
  TOTAL_WORLDS,
  WORLD_METADATA,
  WorldId,
} from '../types/atlas';

interface ChroniclePanelProps {
  snapshot: AtlasSnapshot;
  onClose: () => void;
  onSelectWorld: (world: WorldId) => void;
  onCrossPortal: () => void;
  onBlotMargins: () => void;
  onToggleNarration: () => void;
  onReplayNarration: () => void;
  onToggleAutoNarrate: () => void;
}

const WORLD_IDS: WorldId[] = Array.from(
  { length: TOTAL_WORLDS },
  (_, i) => i as WorldId,
);

export function ChroniclePanel({
  snapshot,
  onClose,
  onSelectWorld,
  onCrossPortal,
  onBlotMargins,
  onToggleNarration,
  onReplayNarration,
  onToggleAutoNarrate,
}: ChroniclePanelProps) {
  if (!snapshot.chronicleOpen || snapshot.bookPhase === 'closed') return null;

  const activeId = snapshot.activeWorld;
  const meta = WORLD_METADATA[activeId];
  const script = CHRONICLE_SCRIPTS[activeId];
  const portalTargetMeta = WORLD_METADATA[meta.portal.targetWorld];
  const worldState = snapshot.worlds[activeId];
  const personas = narrationEngine.getPersonas();

  const folioSecrets = MAGNIFIER_SECRETS.filter((s) => s.worldId === activeId);
  const discoveredFolioSecrets = folioSecrets.filter((s) =>
    worldState.discoveredSecrets.includes(s.id),
  );

  const totalConstellations = snapshot.worlds.filter(
    (w) => w.constellationComplete,
  ).length;
  const totalVaults = snapshot.worlds.filter((w) =>
    w.hiddenLayers.some((hl) => hl.revealed),
  ).length;
  const totalSecretsFound = snapshot.worlds.reduce(
    (acc, w) => acc + w.discoveredSecrets.length,
    0,
  );

  const vaultOpen = worldState.hiddenLayers.some((hl) => hl.revealed);

  return (
    <aside
      role="dialog"
      aria-label="Cartographer's Tenfold Chronicle"
      className="fixed top-16 right-4 bottom-24 z-30 flex w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-[#D4AF6E]/35 bg-[#16100C]/96 shadow-2xl sm:right-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#D4AF6E]/20 px-4 py-3.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4AF6E]">
            The Unbound Meridian
          </p>
          <h2 className="font-display text-xl font-bold text-[#F4ECDC]">
            Cartographer&rsquo;s Chronicle
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Chronicle"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D4AF6E]/25 bg-[#211812] text-[#C8BBA4] transition-colors hover:border-[#D4AF6E]/60 hover:text-[#F4ECDC] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Pilgrimage Summary Strip */}
      <div className="grid grid-cols-4 divide-x divide-[#D4AF6E]/15 border-b border-[#D4AF6E]/15 bg-[#120D0A] text-center">
        <div className="px-2 py-2">
          <div className="font-mono text-xs font-semibold tabular-nums text-[#E2C996]">
            {snapshot.visitedWorlds.length}/{TOTAL_WORLDS}
          </div>
          <div className="text-[10px] text-[#A89A84]">Folios</div>
        </div>
        <div className="px-2 py-2">
          <div className="font-mono text-xs font-semibold tabular-nums text-[#E2C996]">
            {totalConstellations}/{TOTAL_WORLDS}
          </div>
          <div className="text-[10px] text-[#A89A84]">Stars</div>
        </div>
        <div className="px-2 py-2">
          <div className="font-mono text-xs font-semibold tabular-nums text-[#E2C996]">
            {totalVaults}/{TOTAL_WORLDS}
          </div>
          <div className="text-[10px] text-[#A89A84]">Vaults</div>
        </div>
        <div className="px-2 py-2">
          <div className="font-mono text-xs font-semibold tabular-nums text-[#E2C996]">
            {totalSecretsFound}/{MAGNIFIER_SECRETS.length}
          </div>
          <div className="text-[10px] text-[#A89A84]">Notes</div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="atlas-scroll flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
        {/* Current Chapter Prose */}
        <section className="rounded-md border border-[#D4AF6E]/22 bg-[#1D1510] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#D4AF6E]">
            <span className="font-mono">{meta.folioCode}</span>
            <span>{meta.act}</span>
          </div>

          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-[#F4ECDC]">
            {meta.chapterTitle}
          </h3>

          <div className="mt-1 text-[11px] text-[#B8A98E]">
            <span>{meta.biome}</span>
          </div>

          <p className="mt-2 font-display text-[15px] italic leading-relaxed text-[#E9DEC8]">
            &ldquo;{meta.narrativeLead}&rdquo;
          </p>

          <p className="mt-2 text-xs leading-relaxed text-[#C8BBA4]">
            {meta.narrativeBody}
          </p>

          {/* Voiced Chapter Narration Bar */}
          <div className="mt-3 rounded border border-[#D4AF6E]/25 bg-[#140F0B] p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4AF6E]">
                  <Headphones className="h-3 w-3 shrink-0" />
                  <span>Voiced Reading &middot; {script.motif}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleNarration}
                  className="inline-flex items-center gap-1 rounded border border-[#D4AF6E]/45 bg-[#2A1D14] px-2.5 py-1 text-[11px] font-medium text-[#E2C996] hover:bg-[#3A281B] cursor-pointer"
                >
                  {snapshot.narrationStatus === 'speaking' ? (
                    <>
                      <Pause className="h-3 w-3" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      <span>
                        {snapshot.narrationStatus === 'paused' ? 'Resume' : 'Listen'}
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onReplayNarration}
                  aria-label="Replay voiced chapter reading"
                  title="Replay voiced chapter reading"
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#D4AF6E]/25 bg-[#211812] text-[#C8BBA4] hover:border-[#D4AF6E]/60 hover:text-[#F4ECDC] cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#D4AF6E]/12 pt-2 text-[11px]">
              <label className="inline-flex items-center gap-1.5 text-[#C8BBA4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapshot.narrationEnabled}
                  onChange={onToggleAutoNarrate}
                  className="accent-[#D4AF6E] cursor-pointer"
                />
                <span>Auto-narrate chapters on turn</span>
              </label>

              <select
                aria-label="Narrator voice persona"
                defaultValue={narrationEngine.getSelectedVoiceId()}
                onChange={(e) => {
                  narrationEngine.setSelectedVoiceId(e.target.value as GeminiNarratorVoiceId);
                  onReplayNarration();
                }}
                className="max-w-[200px] rounded border border-[#D4AF6E]/25 bg-[#1B140F] px-2 py-0.5 text-[10px] text-[#E2C996] cursor-pointer"
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bespoke Paper-Geometry Assets */}
          <div className="mt-3 border-t border-[#D4AF6E]/15 pt-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D4AF6E]">
              Paper-Geometry Landmarks
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#E2D6C1]">
              {meta.paperAssets.map((asset, i) => (
                <span key={asset}>
                  {i > 0 && <span className="mr-2 text-[#8C7A61]">&middot;</span>}
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* Dynamic Narrative Chronicle Beats */}
          <div className="mt-3 space-y-1.5 border-t border-[#D4AF6E]/15 pt-2.5 text-[11px]">
            <div className="flex items-start gap-2 text-[#E2C996]">
              <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF6E]" />
              <span>{meta.storyBeatCue}</span>
            </div>

            <div className="space-y-1 pt-1">
              <div className={vaultOpen ? 'text-[#E9DEC8]' : 'text-[#8B7D68]'}>
                <span className="font-mono mr-1.5">{vaultOpen ? '[✓]' : '[ ]'}</span>
                {vaultOpen ? meta.storyBeats.vault : 'Unseal the hidden subterranean vault to log its secret.'}
              </div>
              <div className={worldState.constellationComplete ? 'text-[#E9DEC8]' : 'text-[#8B7D68]'}>
                <span className="font-mono mr-1.5">{worldState.constellationComplete ? '[✓]' : '[ ]'}</span>
                {worldState.constellationComplete
                  ? meta.storyBeats.stars
                  : `Align all 5 star threads (${worldState.constellationEdges.length}/5) to unlock celestial lore.`}
              </div>
              <div className={discoveredFolioSecrets.length > 0 ? 'text-[#E9DEC8]' : 'text-[#8B7D68]'}>
                <span className="font-mono mr-1.5">{discoveredFolioSecrets.length > 0 ? '[✓]' : '[ ]'}</span>
                {discoveredFolioSecrets.length > 0
                  ? meta.storyBeats.notes
                  : 'Sweep the brass Magnifier to recover margin notes.'}
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
              <div
                className={`flex items-center gap-1 rounded border px-2 py-1 ${
                  worldState.constellationComplete
                    ? 'border-[#D4AF6E]/55 bg-[#2A1F16] text-[#F4ECDC]'
                    : 'border-[#D4AF6E]/15 bg-[#15100C] text-[#A89A84]'
                }`}
              >
                <Sparkles className="h-3 w-3 shrink-0 text-[#D4AF6E]" />
                <span className="truncate">
                  {worldState.constellationEdges.length}/5 Stars
                </span>
              </div>
              <div
                className={`flex items-center gap-1 rounded border px-2 py-1 ${
                  vaultOpen
                    ? 'border-[#D4AF6E]/55 bg-[#2A1F16] text-[#F4ECDC]'
                    : 'border-[#D4AF6E]/15 bg-[#15100C] text-[#A89A84]'
                }`}
              >
                <Eye className="h-3 w-3 shrink-0 text-[#D4AF6E]" />
                <span className="truncate">
                  {vaultOpen ? 'Vault Open' : 'Vault Sealed'}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 rounded border px-2 py-1 ${
                  discoveredFolioSecrets.length === folioSecrets.length
                    ? 'border-[#D4AF6E]/55 bg-[#2A1F16] text-[#F4ECDC]'
                    : 'border-[#D4AF6E]/15 bg-[#15100C] text-[#A89A84]'
                }`}
              >
                <Search className="h-3 w-3 shrink-0 text-[#D4AF6E]" />
                <span className="truncate">
                  {discoveredFolioSecrets.length}/{folioSecrets.length} Notes
                </span>
              </div>
            </div>
          </div>

          {/* Linked Portal Landmark Passage */}
          <div className="mt-3 rounded border border-[#D4AF6E]/30 bg-[#140F0B] p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4AF6E]">
                  Portal Threshold &middot; {meta.portal.label}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[#D6C8B0]">
                  {meta.portal.passageText}
                </p>
              </div>
              <button
                type="button"
                onClick={onCrossPortal}
                disabled={Boolean(snapshot.portalTransition?.active)}
                className="shrink-0 whitespace-nowrap rounded border border-[#D4AF6E]/55 bg-[#2A1D14] px-2.5 py-1 text-[11px] font-medium text-[#E2C996] hover:bg-[#3A281B] disabled:opacity-50 cursor-pointer"
              >
                Enter &rarr; {portalTargetMeta.roman}
              </button>
            </div>
          </div>

          {/* Archival Chronicle Staining / Margin Ink-Bleed */}
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded border border-[#D4AF6E]/18 bg-[#140F0B] px-2.5 py-2 text-[11px]">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4AF6E]">
                Chronicle Staining &middot; {Math.round(worldState.stainLevel * 100)}%
              </div>
              <div className="truncate text-[#A89A84]">
                {worldState.stainLevel > 0.65
                  ? 'Deep weather ink-bleed across folio borders'
                  : worldState.stainLevel > 0.28
                    ? 'Weathered ink tendrils creeping inward'
                    : 'Subtle archival patina along page margins'}
              </div>
            </div>
            <button
              type="button"
              onClick={onBlotMargins}
              disabled={worldState.stainLevel <= 0.08}
              className="shrink-0 whitespace-nowrap rounded border border-[#D4AF6E]/30 bg-[#211812] px-2 py-1 text-[10px] font-medium text-[#E2C996] hover:border-[#D4AF6E]/60 disabled:opacity-40 cursor-pointer"
            >
              Blot Margins
            </button>
          </div>

          {/* Chapter Turn Controls */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#D4AF6E]/15 pt-2.5">
            <button
              type="button"
              onClick={() =>
                onSelectWorld(
                  ((activeId + TOTAL_WORLDS - 1) % TOTAL_WORLDS) as WorldId,
                )
              }
              className="inline-flex items-center gap-1 rounded border border-[#D4AF6E]/25 bg-[#241A13] px-2.5 py-1 text-[11px] font-medium text-[#E2C996] hover:border-[#D4AF6E]/55 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev Chapter</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onSelectWorld(((activeId + 1) % TOTAL_WORLDS) as WorldId)
              }
              className="inline-flex items-center gap-1 rounded border border-[#D4AF6E]/25 bg-[#241A13] px-2.5 py-1 text-[11px] font-medium text-[#E2C996] hover:border-[#D4AF6E]/55 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Next Chapter</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        {/* Discovered Journal Marginalia for Active Folio */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D4AF6E]">
              Recovered Journal Marginalia
            </h4>
            <span className="font-mono text-[11px] text-[#A89A84]">
              {discoveredFolioSecrets.length}/{folioSecrets.length}
            </span>
          </div>

          {discoveredFolioSecrets.length > 0 ? (
            <div className="space-y-2">
              {discoveredFolioSecrets.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded border border-[#D4AF6E]/25 bg-[#1B140F] p-2.5"
                >
                  <div className="text-[11px] font-semibold text-[#E2C996]">
                    {sec.title}
                  </div>
                  <p className="mt-1 font-display text-sm italic leading-snug text-[#E9DEC8]">
                    {sec.inscription}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded border border-[#D4AF6E]/12 bg-[#120D0A] px-3 py-2 text-[11px] text-[#A89A84]">
              Sweep the brass Magnifier over Folio {meta.roman} to uncover hidden Cartographer inscriptions.
            </p>
          )}
        </section>

        {/* Tenfold Chapter Index */}
        <section className="space-y-1.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D4AF6E]">
            Atlas Folios I &ndash; X &middot; Ten Biomes
          </h4>
          <div className="divide-y divide-[#D4AF6E]/12 rounded-md border border-[#D4AF6E]/18 bg-[#120D0A]">
            {WORLD_IDS.map((wId) => {
              const item = WORLD_METADATA[wId];
              const isActive = wId === activeId;
              const visited = snapshot.visitedWorlds.includes(wId);
              const wState = snapshot.worlds[wId];
              const complete =
                wState.constellationComplete &&
                wState.hiddenLayers.some((h) => h.revealed);

              return (
                <button
                  key={wId}
                  type="button"
                  onClick={() => onSelectWorld(wId)}
                  className={`flex w-full items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2A1D15] text-[#F4ECDC]'
                      : 'hover:bg-[#1D1510] text-[#C8BBA4]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`inline-flex h-6 w-7 shrink-0 items-center justify-center rounded border font-mono text-[11px] font-semibold ${
                        isActive
                          ? 'border-[#D4AF6E]/70 bg-[#B8433E] text-[#FAF4E8]'
                          : 'border-[#D4AF6E]/20 bg-[#1B140F] text-[#D4AF6E]'
                      }`}
                    >
                      {item.roman}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-[#F4ECDC]">
                        {item.chapterTitle}
                      </div>
                      <div className="truncate text-[11px] text-[#A89A84]">
                        {item.biome}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-[10px]">
                    {complete ? (
                      <Check className="h-3.5 w-3.5 text-[#D4AF6E]" />
                    ) : visited ? (
                      <BookOpen className="h-3 w-3 text-[#A89A84]" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
