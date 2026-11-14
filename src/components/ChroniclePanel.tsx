import { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Flag,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Search,
  Volume2,
  X,
} from 'lucide-react';
import { DRAXIS_21_LIST, DRAXIS_BY_ID } from '../story/draxisCatalog';
import {
  ADMINISTRATION_SLOGAN,
  BOOK_ENDCARD_CUE,
  BOOK_IMPRINT_CUE,
  BOOK_PROLOGUE_CUE,
  BOOK_TITLE,
  FOLIO_BY_WORLD,
  FOLIO_MANIFESTS,
  MAGNIFIER_SECRETS,
} from '../story/historyManifest';
import {
  AtlasSnapshot,
  CueSlot,
  DraxisId,
  EvidenceKind,
  FolioInteractionSlot,
  TOTAL_WORLDS,
  WorldId,
} from '../types/atlas';

type ChronicleTab = 'transcript' | 'sources' | 'folios';

interface ChroniclePanelProps {
  snapshot: AtlasSnapshot;
  onClose: () => void;
  onSelectWorld: (world: WorldId) => void;
  onTriggerInteraction: (slot: FolioInteractionSlot) => void;
  onSelectDraxis: (id: DraxisId) => void;
  onPlayCueSlot: (world: WorldId, slot: CueSlot) => void;
  onToggleNarration: () => void;
  onToggleCaptions: () => void;
  onOpenEndcard: () => void;
  onRestartSession: () => void;
}

const CUE_ORDER: CueSlot[] = ['OPEN', 'LESSON', 'A', 'B', 'C', 'CLOSE'];

const EVIDENCE_STYLES: Record<EvidenceKind, { label: string; cls: string }> = {
  'source-fact': {
    label: 'Source Fact',
    cls: 'border-[#4E8096]/60 bg-[#1B2B38] text-[#A8D2E6]',
  },
  'historical-quotation': {
    label: 'Historical Quotation',
    cls: 'border-[#B89860]/60 bg-[#2A2319] text-[#E6CF9F]',
  },
  'editorial-illustration': {
    label: 'Editorial Illustration',
    cls: 'border-[#8CA6B8]/45 bg-[#1D222C] text-[#D0DAE6]',
  },
  demonstration: {
    label: 'Physical Model',
    cls: 'border-[#3D95B5]/60 bg-[#162B34] text-[#8CE0FA]',
  },
  uncertainty: {
    label: 'Archival Uncertainty',
    cls: 'border-[#B35D53]/60 bg-[#2E1A1A] text-[#E8ACA4]',
  },
};

export function ChroniclePanel({
  snapshot,
  onClose,
  onSelectWorld,
  onTriggerInteraction,
  onSelectDraxis,
  onPlayCueSlot,
  onToggleNarration,
  onToggleCaptions,
  onOpenEndcard,
  onRestartSession,
}: ChroniclePanelProps) {
  const [tab, setTab] = useState<ChronicleTab>('transcript');
  const [fullBookTranscript, setFullBookTranscript] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  if (!snapshot.chronicleOpen || snapshot.bookPhase === 'closed') return null;

  const activeId = snapshot.activeWorld;
  const manifest = FOLIO_BY_WORLD[activeId];
  const folioRuntime = snapshot.worlds[activeId];
  const activeDraxis = snapshot.activeDraxisId ? DRAXIS_BY_ID[snapshot.activeDraxisId] : null;
  const folioSecrets = MAGNIFIER_SECRETS.filter((s) => s.worldId === activeId);

  return (
    <aside
      role="dialog"
      aria-label="Transcript, Mechanisms, and Source Notes"
      className="fixed top-14 right-3 bottom-24 z-30 flex w-[min(460px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-[#8CA6B8]/35 bg-[#11151D]/97 shadow-2xl sm:right-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#8CA6B8]/20 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
            {BOOK_TITLE}
          </p>
          <h2 className="font-display text-lg font-bold text-[#F3ECE0] truncate">
            {manifest.code} · {manifest.title}
          </h2>
          <p className="text-[11px] text-[#9FA6B2]">{manifest.temporalMarker}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close transcript and sources drawer"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#8CA6B8]/25 text-[#C8C2B6] hover:border-[#8CA6B8]/65 hover:text-[#F3ECE0] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Archival reading sections"
        className="grid grid-cols-3 border-b border-[#8CA6B8]/18 bg-[#161B25] text-xs font-medium"
      >
        {(
          [
            ['transcript', 'Transcript (6+)', FileText],
            ['sources', 'Sources & DRAXIS', Layers],
            ['folios', 'F01–F12 Index', BookOpen],
          ] as const
        ).map(([id, label, Icon]) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 transition-colors cursor-pointer ${
                selected
                  ? 'border-[#3D95B5] bg-[#1C2432] text-[#F3ECE0]'
                  : 'border-transparent text-[#9FA6B2] hover:text-[#DDD6C6]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 atlas-scroll p-4 space-y-4">
        {tab === 'transcript' && (
          <>
            {/* Reading controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#8CA6B8]/25 bg-[#171C26] p-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleNarration}
                  className="inline-flex items-center gap-1.5 rounded border border-[#3D95B5]/55 bg-[#192D3B] px-2.5 py-1 text-[11px] font-medium text-[#F3ECE0] hover:bg-[#213B4D] cursor-pointer"
                >
                  {snapshot.narrationStatus === 'speaking' ? (
                    <Pause className="h-3 w-3 text-[#8CE0FA]" />
                  ) : (
                    <Play className="h-3 w-3 text-[#8CE0FA]" />
                  )}
                  <span>
                    {snapshot.narrationStatus === 'speaking'
                      ? 'Pause Reader'
                      : snapshot.narrationStatus === 'paused'
                        ? 'Resume Reader'
                        : 'Step Read Folio'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onToggleCaptions}
                  aria-pressed={snapshot.captionsVisible}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] cursor-pointer ${
                    snapshot.captionsVisible
                      ? 'border-[#3D95B5] bg-[#1F3142] text-[#F3ECE0]'
                      : 'border-[#8CA6B8]/30 bg-[#12161E] text-[#C8C2B6]'
                  }`}
                >
                  Captions: {snapshot.captionsVisible ? 'On' : 'Off'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setFullBookTranscript((v) => !v)}
                aria-pressed={fullBookTranscript}
                className="rounded border border-[#8CA6B8]/30 bg-[#12161E] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8CA6B8] hover:text-[#F3ECE0] cursor-pointer"
              >
                {fullBookTranscript ? 'Active Folio Only' : 'Read Full F01–F12'}
              </button>
            </div>

            <p className="text-[11px] text-[#9FA6B2]">
              {snapshot.narrationCapability === 'browser-speech'
                ? 'Speech synthesis available on this device; full verbatim script is always readable below.'
                : 'Transcript-first archival mode (no pre-recorded audio stems or third-party voice calls used).'}
            </p>

            {/* Imprint & Opening Prologue */}
            {(activeId === 0 || fullBookTranscript) && (
              <div className="space-y-2 rounded-md border border-[#8CA6B8]/25 bg-[#151A23] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
                  Inside-Front-Cover Imprint &amp; Prologue
                </p>
                {BOOK_IMPRINT_CUE.paragraphs.map((p, idx) => (
                  <p key={`imp-${idx}`} className="text-xs font-medium text-[#D8D0C0]">
                    {p}
                  </p>
                ))}
                <div className="border-t border-[#8CA6B8]/15 pt-2 space-y-1.5">
                  {BOOK_PROLOGUE_CUE.paragraphs.map((p, idx) => (
                    <p key={`pro-${idx}`} className="text-xs leading-relaxed text-[#E7DFCE]">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Verbatim Cue List */}
            {(fullBookTranscript ? FOLIO_MANIFESTS : [manifest]).map((fm) => (
              <section key={fm.id} className="space-y-2.5">
                {fullBookTranscript && (
                  <div className="flex items-center justify-between border-b border-[#8CA6B8]/25 pb-1 pt-2">
                    <h3 className="font-display text-base font-bold text-[#F3ECE0]">
                      {fm.code} · {fm.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onSelectWorld(fm.worldId)}
                      className="text-[11px] font-mono text-[#3D95B5] hover:underline cursor-pointer"
                    >
                      Open spread
                    </button>
                  </div>
                )}

                {CUE_ORDER.map((slot) => {
                  const seg = fm.cues[slot];
                  const isPlayingThis =
                    snapshot.narrationStatus !== 'idle' &&
                    snapshot.narrationCueId === seg.cueId;
                  return (
                    <article
                      key={seg.cueId}
                      className={`rounded-md border p-3 ${
                        isPlayingThis
                          ? 'border-[#3D95B5]/80 bg-[#182634]'
                          : 'border-[#8CA6B8]/20 bg-[#151A23]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8CA6B8]">
                          {seg.cueId} · {seg.heading}
                        </span>
                        <button
                          type="button"
                          onClick={() => onPlayCueSlot(fm.worldId, slot)}
                          className="inline-flex items-center gap-1 rounded border border-[#8CA6B8]/28 bg-[#12161E] px-2 py-0.5 text-[10px] text-[#DDD6C6] hover:border-[#3D95B5] cursor-pointer"
                          title={`Step highlight for ${seg.cueId}`}
                        >
                          <Volume2 className="h-3 w-3 text-[#8CA6B8]" />
                          <span>Cue</span>
                        </button>
                      </div>
                      <div className="mt-1.5 space-y-1.5">
                        {seg.paragraphs.map((line, i) => (
                          <p key={i} className="text-xs leading-relaxed text-[#EBE3D2]">
                            {line}
                          </p>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}

            {/* Closing Endcard Transcript */}
            {(activeId === TOTAL_WORLDS - 1 || fullBookTranscript) && (
              <div className="space-y-1.5 rounded-md border border-[#B89860]/35 bg-[#1B1A16] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B89860]">
                  Closing Endcard ({BOOK_ENDCARD_CUE.cueId})
                </p>
                {BOOK_ENDCARD_CUE.paragraphs.map((p, i) => (
                  <p key={i} className="text-xs leading-relaxed text-[#F3ECE0]">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'sources' && (
          <>
            {/* Three Interactive Teaching Mechanisms for Active Folio */}
            <section className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
                Three Interactive Teaching Demonstrations ({manifest.code})
              </p>
              {manifest.interactions.map((def) => {
                const st = folioRuntime.interactions[def.slot];
                return (
                  <div
                    key={def.id}
                    className={`rounded-md border p-3 ${
                      st.active
                        ? 'border-[#3D95B5]/65 bg-[#172532]'
                        : 'border-[#8CA6B8]/22 bg-[#151A23]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#8CA6B8]">
                          Mechanism {def.slot} ({def.keyboardLabel}) · {def.type}
                        </span>
                        <h3 className="text-sm font-semibold text-[#F3ECE0]">{def.label}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onTriggerInteraction(def.slot)}
                        className={`shrink-0 rounded border px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                          st.locked
                            ? 'border-[#B35D53]/70 bg-[#2E1A1A] text-[#F3ECE0]'
                            : st.active
                              ? 'border-[#3D95B5] bg-[#1F3A4D] text-[#F3ECE0]'
                              : 'border-[#8CA6B8]/40 bg-[#1C2330] text-[#E6DFD0] hover:border-[#3D95B5]'
                        }`}
                      >
                        {st.locked
                          ? 'Collapsed (Locked)'
                          : def.persistPolicy === 'stepped'
                            ? `Step ${st.step}/${st.maxSteps}`
                            : st.active
                              ? 'Active'
                              : 'Activate'}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-[#C8C2B6]">{def.description}</p>
                    <p className="mt-1 text-[11px] text-[#8CA6B8]">
                      <span className="font-semibold text-[#D8D2C5]">Output:</span>{' '}
                      {def.textEquivalent}
                    </p>
                  </div>
                );
              })}
            </section>

            {/* Evidence & Uncertainty Notes */}
            <section className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
                Historical Classification &amp; Editorial Notes
              </p>
              {manifest.sourceNotes.map((note) => {
                const badge = EVIDENCE_STYLES[note.kind];
                return (
                  <div
                    key={note.id}
                    className="rounded-md border border-[#8CA6B8]/20 bg-[#151A23] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      <span className="font-mono text-[10px] text-[#8B929E]">{note.sourceRef}</span>
                    </div>
                    <h4 className="mt-1.5 text-xs font-semibold text-[#F3ECE0]">{note.heading}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-[#D8D0C0]">{note.body}</p>
                  </div>
                );
              })}

              {manifest.uncertaintyNotes.length > 0 && (
                <div className="rounded-md border border-[#B35D53]/40 bg-[#22171A] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E8ACA4]">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Recorded Source Silences &amp; Limits</span>
                  </div>
                  <ul className="mt-1.5 list-disc pl-4 space-y-1 text-xs text-[#E2CBC5]">
                    {manifest.uncertaintyNotes.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chronology IDs & External Source Pointers */}
              <div className="rounded-md border border-[#8CA6B8]/20 bg-[#151A23] p-3 space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8CA6B8]">
                  Chronology Event IDs: {manifest.chronologyEventIds.join(', ')}
                </p>
                <p className="text-[11px] text-[#C8C2B6]">
                  <span className="font-semibold text-[#F3ECE0]">Actors:</span>{' '}
                  {manifest.historicalActors.join(' · ')}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {manifest.sourcePointers.map((ptr) => (
                    <a
                      key={ptr.url + ptr.label}
                      href={ptr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-[#8CA6B8]/30 bg-[#12161E] px-2 py-1 text-[10px] text-[#8CA6B8] hover:border-[#3D95B5] hover:text-[#F3ECE0]"
                    >
                      <span>{ptr.label}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* Archival Lens Records for active folio */}
            <section className="space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
                Lens Marginalia ({folioRuntime.discoveredSecrets.length}/{folioSecrets.length})
              </p>
              {folioSecrets.map((sec) => {
                const found = folioRuntime.discoveredSecrets.includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    className="rounded border border-[#8CA6B8]/18 bg-[#141821] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium text-[#F3ECE0]">
                        <Search className="h-3 w-3 text-[#8CA6B8]" />
                        {sec.title}
                      </span>
                      <span className="font-mono text-[10px] text-[#8CA6B8]">
                        {found ? 'Inspected' : 'Use Lens (F)'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#C8C2B6]">{sec.inscription}</p>
                  </div>
                );
              })}
            </section>

            {/* Complete 21-Subject DRAXIS Specimen Registry */}
            <section className="space-y-2 border-t border-[#8CA6B8]/20 pt-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
                  21 Original DRAXIS Subjects
                </p>
                <span className="font-mono text-[10px] text-[#3D95B5]">
                  Selected: #{snapshot.activeDraxisId ?? '060'}
                </span>
              </div>

              {activeDraxis && (
                <div className="rounded-md border border-[#3D95B5]/45 bg-[#16232F] p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F3ECE0]">
                      DRAXIS {activeDraxis.id} — {activeDraxis.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#8CE0FA]">
                      {activeDraxis.thesis}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#D8D2C5]">{activeDraxis.silhouetteNote}</p>
                  <p className="mt-1 text-[11px] text-[#9EB7C8]">
                    {activeDraxis.operationalRole}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {DRAXIS_21_LIST.map((item) => {
                  const selected = snapshot.activeDraxisId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectDraxis(item.id)}
                      className={`rounded border px-2 py-1.5 text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#3D95B5] bg-[#1D3244] text-[#F3ECE0]'
                          : 'border-[#8CA6B8]/20 bg-[#141821] text-[#C8C2B6] hover:border-[#8CA6B8]/55'
                      }`}
                    >
                      <div className="font-mono text-[9px] text-[#8CA6B8]">
                        {item.id} · {item.thesis}
                      </div>
                      <div className="truncate text-[11px] font-medium">{item.name}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {tab === 'folios' && (
          <>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={activeId === 0}
                onClick={() => onSelectWorld((activeId - 1) as WorldId)}
                className="inline-flex items-center gap-1 rounded border border-[#8CA6B8]/30 bg-[#171C26] px-2.5 py-1.5 text-xs text-[#DDD6C6] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev Folio
              </button>
              <span className="font-mono text-[11px] text-[#8CA6B8]">
                Visited {snapshot.visitedWorlds.length}/{TOTAL_WORLDS} · Studied{' '}
                {snapshot.completedFolios.length}/{TOTAL_WORLDS}
              </span>
              <button
                type="button"
                disabled={activeId === TOTAL_WORLDS - 1}
                onClick={() => onSelectWorld((activeId + 1) as WorldId)}
                className="inline-flex items-center gap-1 rounded border border-[#8CA6B8]/30 bg-[#171C26] px-2.5 py-1.5 text-xs text-[#DDD6C6] disabled:opacity-40 cursor-pointer"
              >
                Next Folio
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {FOLIO_MANIFESTS.map((fm) => {
                const isCurrent = fm.worldId === activeId;
                const runtime = snapshot.worlds[fm.worldId];
                const activeCount = (['A', 'B', 'C'] as const).filter(
                  (s) => runtime.interactions[s].active,
                ).length;

                return (
                  <button
                    key={fm.id}
                    type="button"
                    onClick={() => onSelectWorld(fm.worldId)}
                    className={`w-full rounded-md border px-3 py-2 text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border-[#3D95B5] bg-[#182836]'
                        : 'border-[#8CA6B8]/20 bg-[#151A23] hover:border-[#8CA6B8]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#F3ECE0]">
                        {fm.code} · {fm.title}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#8CA6B8]">
                        {activeCount === 3 && <Check className="h-3 w-3 text-[#3D95B5]" />}
                        {activeCount}/3 demos
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#9FA6B2]">
                      {fm.temporalMarker} — {fm.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 border-t border-[#8CA6B8]/20 pt-3">
              <button
                type="button"
                onClick={onOpenEndcard}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[#B89860]/55 bg-[#20242C] px-3 py-2 text-xs font-medium text-[#F3ECE0] hover:bg-[#2A303B] cursor-pointer"
              >
                <Flag className="h-3.5 w-3.5 text-[#B89860]" />
                <span>View Administration Closing Endcard</span>
              </button>

              {!confirmRestart ? (
                <button
                  type="button"
                  onClick={() => setConfirmRestart(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[#8CA6B8]/25 bg-[#151A23] px-3 py-2 text-xs text-[#C8C2B6] hover:border-[#B35D53]/60 hover:text-[#F3ECE0] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restart Reading Session</span>
                </button>
              ) : (
                <div className="rounded-md border border-[#B35D53]/55 bg-[#28181A] p-3 text-xs">
                  <p className="text-[#F3ECE0]">
                    Reset current session state back to F01? (Historical records remain intact;{' '}
                    {ADMINISTRATION_SLOGAN})
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmRestart(false);
                        onRestartSession();
                      }}
                      className="rounded border border-[#B35D53] bg-[#5E2825] px-3 py-1 font-medium text-[#F3ECE0] cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRestart(false)}
                      className="rounded border border-[#8CA6B8]/35 px-3 py-1 text-[#C8C2B6] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
