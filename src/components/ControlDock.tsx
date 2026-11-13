import { useState } from 'react';
import {
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  CloudLightning,
  CloudRain,
  Compass,
  Eye,
  GitBranch,
  Layers,
  Pause,
  Play,
  Search,
  Sparkles,
  Sprout,
  Sun,
  Trees,
  Waves,
  Wind,
} from 'lucide-react';
import {
  AtlasSnapshot,
  CameraMode,
  INTERACTION_TOOLS,
  InteractionTool,
  QualityTier,
  WORLD_METADATA,
  WeatherPreset,
  WorldId,
} from '../types/atlas';

type DockTab = 'tools' | 'atmosphere' | 'camera';

interface ControlDockProps {
  snapshot: AtlasSnapshot;
  onSelectWorld: (world: WorldId) => void;
  onSelectTool: (tool: InteractionTool) => void;
  onSetTime: (hours: number) => void;
  onToggleAutoTime: () => void;
  onSetWeather: (weather: WeatherPreset) => void;
  onSetCameraMode: (mode: CameraMode) => void;
  onToggleHud: () => void;
  onSetQuality: (tier: QualityTier) => void;
  onToggleReducedMotion: () => void;
  onTogglePopup: (popupId: string) => void;
  onToggleBridge: (bridgeId: string) => void;
  onPlantQuickSeed: () => void;
  onConnectNextStar: () => void;
  onToggleCreature: (creatureId: string) => void;
  onToggleHiddenLayer: (layerId: string) => void;
  onNudgeMagnifier: (dx: number, dz: number) => void;
  onNudgeImmersion: (dx: number, dz: number) => void;
  onNudgeRiver: (dx: number, dz: number) => void;
}

const TOOL_ICONS: Record<InteractionTool, typeof Compass> = {
  explore: Compass,
  pageTurn: BookOpen,
  popup: Layers,
  river: Waves,
  bridge: GitBranch,
  trees: Trees,
  sailing: Anchor,
  constellation: Sparkles,
  creature: Sprout,
  hiddenLayer: Eye,
  magnifier: Search,
};

const WEATHER_OPTIONS: { id: WeatherPreset; label: string; icon: typeof Sun }[] = [
  { id: 'clear', label: 'Clear', icon: Sun },
  { id: 'overcast', label: 'Overcast', icon: Cloud },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'thunderstorm', label: 'Storm', icon: CloudLightning },
  { id: 'windy', label: 'Windy', icon: Wind },
  { id: 'mist', label: 'Mist', icon: Waves },
];

function formatClock(hours: number): string {
  const totalMins = Math.floor(((hours % 24) + 24) % 24 * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function ControlDock(props: ControlDockProps) {
  const { snapshot } = props;
  const [tab, setTab] = useState<DockTab>('tools');

  if (snapshot.bookPhase === 'closed') return null;

  const activeWorldState = snapshot.worlds[snapshot.activeWorld];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex flex-col items-center px-3 sm:bottom-4">
      {/* Collapse / Expand Handle */}
      <button
        type="button"
        onClick={props.onToggleHud}
        className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-[#D4AF6E]/30 bg-[#16100C]/94 px-3 py-1 text-[11px] font-medium text-[#E2C996] transition-colors hover:text-[#F4ECDC] focus-visible:outline-2 focus-visible:outline-[#D4AF6E] cursor-pointer"
        title="Toggle controls dock (H)"
      >
        {snapshot.hudCollapsed ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {!snapshot.hudCollapsed && (
        <div className="pointer-events-auto w-full max-w-[min(960px,96vw)] rounded-lg border border-[#D4AF6E]/28 bg-[#16100C]/94 px-3 py-2.5 shadow-2xl sm:px-4">
          {/* Top Slim Row: Folio Turning + Section Tabs + Camera Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4AF6E]/15 pb-2">
            {/* World Folio Switcher */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  props.onSelectWorld(((snapshot.activeWorld + 2) % 3) as WorldId)
                }
                aria-label="Turn to previous folio"
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#D4AF6E]/25 bg-[#211812] text-[#E2C996] hover:border-[#D4AF6E]/55 cursor-pointer"
                title="Previous world ([)"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {([0, 1, 2] as WorldId[]).map((wId) => {
                const active = snapshot.activeWorld === wId;
                return (
                  <button
                    key={wId}
                    type="button"
                    onClick={() => props.onSelectWorld(wId)}
                    className={`h-7 rounded px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'border border-[#D4AF6E]/60 bg-[#B8433E] text-[#FAF4E8]'
                        : 'border border-[#D4AF6E]/15 bg-[#211812] text-[#C8BBA4] hover:text-[#F4ECDC]'
                    }`}
                  >
                    {WORLD_METADATA[wId].roman}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  props.onSelectWorld(((snapshot.activeWorld + 1) % 3) as WorldId)
                }
                aria-label="Turn to next folio"
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#D4AF6E]/25 bg-[#211812] text-[#E2C996] hover:border-[#D4AF6E]/55 cursor-pointer"
                title="Next world (])"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Dock Section Segmented Tabs */}
            <div className="flex items-center gap-1 rounded-md border border-[#D4AF6E]/15 bg-[#110C09] p-0.5">
              {(
                [
                  ['tools', 'Paper Tools'],
                  ['atmosphere', 'Sky & Weather'],
                  ['camera', 'View & Quality'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    tab === id
                      ? 'bg-[#2C2017] text-[#F4ECDC]'
                      : 'text-[#B4A690] hover:text-[#F4ECDC]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Camera Presets */}
            <div className="hidden md:flex items-center gap-1">
              {(
                [
                  ['inspection', 'Desk'],
                  ['diorama', 'Diorama'],
                  ['immersion', 'Immerse'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => props.onSetCameraMode(mode)}
                  className={`h-7 rounded px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    snapshot.cameraMode === mode
                      ? 'border border-[#D4AF6E]/60 bg-[#2C2017] text-[#E2C996]'
                      : 'border border-transparent text-[#B4A690] hover:text-[#F4ECDC]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {tab === 'tools' && (
            <div className="pt-2">
              <div className="atlas-scroll flex items-center gap-1.5 overflow-x-auto pb-1">
                {INTERACTION_TOOLS.map((tool) => {
                  const Icon = TOOL_ICONS[tool.id];
                  const active = snapshot.activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => props.onSelectTool(tool.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'border-[#D4AF6E]/70 bg-[#2E2118] text-[#F4ECDC]'
                          : 'border-[#D4AF6E]/15 bg-[#1D1510] text-[#C8BBA4] hover:border-[#D4AF6E]/40 hover:text-[#F4ECDC]'
                      }`}
                      title={`${tool.label} (${tool.shortcut})`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#D4AF6E]' : 'text-[#A89A84]'}`} />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Touch / Keyboard Quick Triggers for Active Tool */}
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C8BBA4]">
                <span className="truncate max-w-full sm:max-w-[54%]">{snapshot.statusHint}</span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {snapshot.activeTool === 'popup' &&
                    activeWorldState.popups.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => props.onTogglePopup(p.id)}
                        className="rounded border border-[#D4AF6E]/35 bg-[#241A13] px-2 py-0.5 text-[11px] text-[#E2C996] hover:bg-[#32241A] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {p.pullRatio > 0.5 ? `Fold ${p.label}` : `Raise ${p.label}`}
                      </button>
                    ))}

                  {snapshot.activeTool === 'river' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => props.onNudgeRiver(-0.35, 0.25)}
                        className="rounded border border-[#D4AF6E]/35 bg-[#241A13] px-2 py-0.5 text-[11px] text-[#E2C996] hover:bg-[#32241A] cursor-pointer"
                      >
                        Bend West
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onNudgeRiver(0.35, -0.25)}
                        className="rounded border border-[#D4AF6E]/35 bg-[#241A13] px-2 py-0.5 text-[11px] text-[#E2C996] hover:bg-[#32241A] cursor-pointer"
                      >
                        Bend East
                      </button>
                    </div>
                  )}

                  {snapshot.activeTool === 'bridge' &&
                    activeWorldState.bridges.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => props.onToggleBridge(b.id)}
                        className="rounded border border-[#D4AF6E]/35 bg-[#241A13] px-2 py-0.5 text-[11px] text-[#E2C996] hover:bg-[#32241A] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {b.unfolded ? `Fold ${b.label}` : `Unfold ${b.label}`}
                      </button>
                    ))}

                  {snapshot.activeTool === 'trees' && (
                    <button
                      type="button"
                      onClick={props.onPlantQuickSeed}
                      className="rounded border border-[#D4AF6E]/45 bg-[#241A13] px-2.5 py-0.5 text-[11px] text-[#E2C996] hover:bg-[#32241A] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + Plant Ink Seed
                    </button>
                  )}

                  {snapshot.activeTool === 'constellation' && (
                    <button
                      type="button"
                      onClick={props.onConnectNextStar}
                      className="rounded border border-[#D4AF6E]/45 bg-[#241A13] px-2.5 py-0.5 text-[11px] text-[#E2C996] hover:bg-[#32241A] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + Connect Star Thread ({activeWorldState.constellationEdges.length}/5)
                    </button>
                  )}

                  {snapshot.activeTool === 'creature' &&
                    activeWorldState.creatures.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => props.onToggleCreature(c.id)}
                        className={`rounded border px-2 py-0.5 text-[11px] whitespace-nowrap shrink-0 cursor-pointer ${
                          c.summoned
                            ? 'border-[#D4AF6E]/60 bg-[#3B261C] text-[#F4ECDC]'
                            : 'border-[#D4AF6E]/30 bg-[#241A13] text-[#C8BBA4]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}

                  {snapshot.activeTool === 'hiddenLayer' &&
                    activeWorldState.hiddenLayers.map((hl) => (
                      <button
                        key={hl.id}
                        type="button"
                        onClick={() => props.onToggleHiddenLayer(hl.id)}
                        className="rounded border border-[#D4AF6E]/45 bg-[#241A13] px-2.5 py-0.5 text-[11px] text-[#E2C996] hover:bg-[#32241A] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {hl.revealed ? `Close ${hl.label}` : `Lift ${hl.label}`}
                      </button>
                    ))}

                  {snapshot.activeTool === 'magnifier' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => props.onNudgeMagnifier(-0.55, 0)}
                        aria-label="Move magnifier left"
                        className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onNudgeMagnifier(0, -0.55)}
                        aria-label="Move magnifier up"
                        className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onNudgeMagnifier(0, 0.55)}
                        aria-label="Move magnifier down"
                        className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onNudgeMagnifier(0.55, 0)}
                        aria-label="Move magnifier right"
                        className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'atmosphere' && (
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={props.onToggleAutoTime}
                  className="inline-flex h-7 items-center gap-1.5 rounded border border-[#D4AF6E]/35 bg-[#241A13] px-2.5 text-xs font-medium text-[#E2C996] hover:border-[#D4AF6E]/60 cursor-pointer"
                >
                  {snapshot.autoTime ? (
                    <>
                      <Pause className="h-3 w-3" />
                      <span>Auto</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      <span>Manual</span>
                    </>
                  )}
                </button>

                <div className="flex flex-1 items-center gap-2.5 min-w-[160px]">
                  <span className="font-mono text-xs tabular-nums text-[#E2C996]">
                    {formatClock(snapshot.timeOfDay)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={23.95}
                    step={0.05}
                    value={snapshot.timeOfDay}
                    onChange={(e) => props.onSetTime(parseFloat(e.target.value))}
                    aria-label="24-hour time of day"
                    className="atlas-slider w-full"
                  />
                </div>

                <div className="hidden sm:flex items-center gap-1">
                  {(
                    [
                      ['Dawn', 6.2],
                      ['Noon', 12.5],
                      ['Dusk', 18.2],
                      ['Night', 22.5],
                    ] as const
                  ).map(([label, hr]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => props.onSetTime(hr)}
                      className="rounded border border-[#D4AF6E]/20 bg-[#1D1510] px-2 py-1 text-[11px] text-[#C8BBA4] hover:border-[#D4AF6E]/50 hover:text-[#F4ECDC] cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="atlas-scroll flex items-center gap-1.5 overflow-x-auto">
                {WEATHER_OPTIONS.map((w) => {
                  const Icon = w.icon;
                  const active = snapshot.weather === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => props.onSetWeather(w.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'border-[#D4AF6E]/70 bg-[#2E2118] text-[#F4ECDC]'
                          : 'border-[#D4AF6E]/15 bg-[#1D1510] text-[#C8BBA4] hover:border-[#D4AF6E]/40'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#D4AF6E]' : 'text-[#A89A84]'}`} />
                      <span>{w.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'camera' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    ['inspection', 'Desk Inspection (1)'],
                    ['diorama', 'Diorama Close-Up (2)'],
                    ['immersion', 'Miniature Immersion (3)'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => props.onSetCameraMode(mode)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      snapshot.cameraMode === mode
                        ? 'border-[#D4AF6E]/70 bg-[#2E2118] text-[#F4ECDC]'
                        : 'border-[#D4AF6E]/15 bg-[#1D1510] text-[#C8BBA4] hover:border-[#D4AF6E]/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {snapshot.cameraMode === 'immersion' && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[#C8BBA4] mr-1">Walk:</span>
                  <button
                    type="button"
                    onClick={() => props.onNudgeImmersion(-1, 0)}
                    aria-label="Walk left"
                    className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onNudgeImmersion(0, -1)}
                    aria-label="Walk forward"
                    className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onNudgeImmersion(0, 1)}
                    aria-label="Walk back"
                    className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onNudgeImmersion(1, 0)}
                    aria-label="Walk right"
                    className="rounded border border-[#D4AF6E]/30 bg-[#241A13] p-1 text-[#E2C996] cursor-pointer"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded border border-[#D4AF6E]/15 bg-[#110C09] p-0.5">
                  {(['high', 'medium', 'low'] as QualityTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => props.onSetQuality(tier)}
                      className={`rounded px-2 py-0.5 text-[11px] capitalize cursor-pointer ${
                        snapshot.qualityTier === tier
                          ? 'bg-[#2C2017] text-[#E2C996]'
                          : 'text-[#A89A84] hover:text-[#F4ECDC]'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={props.onToggleReducedMotion}
                  className={`rounded border px-2.5 py-1 text-[11px] whitespace-nowrap shrink-0 cursor-pointer ${
                    snapshot.reducedMotion
                      ? 'border-[#D4AF6E]/60 bg-[#2E2118] text-[#E2C996]'
                      : 'border-[#D4AF6E]/20 bg-[#1D1510] text-[#C8BBA4]'
                  }`}
                >
                  {snapshot.reducedMotion ? 'Motion: Reduced' : 'Motion: Full'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
