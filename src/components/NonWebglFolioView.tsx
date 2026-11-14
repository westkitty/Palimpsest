import { ADMINISTRATION_SLOGAN, BOOK_IMPRINT_CUE, FOLIO_BY_WORLD } from '../story/historyManifest';
import { DRAXIS_BY_ID } from '../story/draxisCatalog';
import { AtlasSnapshot, FolioInteractionSlot } from '../types/atlas';

interface NonWebglFolioViewProps {
  snapshot: AtlasSnapshot;
  webglFallbackReason: string | null;
  onOpenBook: () => void;
  onTriggerInteraction: (slot: FolioInteractionSlot) => void;
}

function renderFolioSvg(snapshot: AtlasSnapshot) {
  const world = snapshot.activeWorld;
  const st = snapshot.worlds[world].interactions;
  const a = st.A.active;
  const aStep = st.A.step;
  const b = st.B.active;
  const bStep = st.B.step;
  const c = st.C.active;
  const cStep = st.C.step;
  const draxis = snapshot.activeDraxisId ? DRAXIS_BY_ID[snapshot.activeDraxisId] : null;

  const ink = '#1F2329';
  const slate = '#546170';
  const cyan = '#3D95B5';
  const crimson = '#8E282B';
  const brass = '#9D7F4C';

  switch (world) {
    case 0: // F01: The Initialization of Reality
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F01 Notebook Program Schematic">
          <circle cx="200" cy="145" r={a ? 88 : 54} fill="none" stroke={ink} strokeWidth="1.6" strokeDasharray={a ? 'none' : '4 4'} />
          <circle cx="200" cy="145" r={c ? 36 : 24} fill={c ? '#F7D786' : '#E7CA80'} stroke={ink} strokeWidth="1.5" />
          {/* Three nodes: Law, Memory, Rendering */}
          {[
            [200, b ? 58 : 35, 'LAW'],
            [b ? 124 : 96, b ? 192 : 210, 'MEMORY'],
            [b ? 276 : 304, b ? 192 : 210, 'RENDERING'],
          ].map(([nx, ny, lbl]) => (
            <g key={String(lbl)}>
              <line x1="200" y1="145" x2={Number(nx)} y2={Number(ny)} stroke={b ? cyan : slate} strokeWidth="2" />
              <circle cx={Number(nx)} cy={Number(ny)} r="15" fill="#F2EAD8" stroke={ink} strokeWidth="1.8" />
              <text x={Number(nx)} y={Number(ny) + 4} textAnchor="middle" fontSize="8" fill={ink} fontFamily="monospace">
                {String(lbl).slice(0, 3)}
              </text>
            </g>
          ))}
          <text x="200" y="276" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            {a ? 'VELLUM OVERLAY LIFTED' : 'CLOSED COVER DIAGRAM'} · {b ? 'COUPLED RECURSION' : 'UNCOUPLED'}
          </text>
        </svg>
      );

    case 1: // F02: Wordstreamer and the Shard-god
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F02 Pantheon Triptych Schematic">
          <g transform={`translate(${aStep === 1 ? 0 : 0}, 0)`}>
            <rect x="28" y="42" width="102" height="190" fill={aStep === 1 ? '#DFEEF3' : '#EFE7D4'} stroke={ink} strokeWidth="1.5" />
            <circle cx="79" cy="110" r="24" fill="#B2D9E6" stroke={cyan} strokeWidth="2" />
            <path d="M52,186 Q79,150 106,186" fill="none" stroke={ink} strokeWidth="2" />
            <text x="79" y="216" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">WORDSTREAMER</text>
          </g>
          <g>
            <rect x="149" y="42" width="102" height="190" fill={aStep === 2 ? '#F2DFDB' : '#EFE7D4'} stroke={ink} strokeWidth="1.5" />
            <polygon points="200,66 226,120 200,174 174,120" fill="#B67B6B" stroke={ink} strokeWidth="1.8" />
            <line x1="178" y1="120" x2="222" y2="120" stroke="#F6E5C2" strokeWidth="1.5" />
            <text x="200" y="216" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">THE SHARD-GOD</text>
          </g>
          <g>
            <rect x="270" y="42" width="102" height="190" fill={c ? '#E7DEC8' : '#EFE7D4'} stroke={ink} strokeWidth="1.5" />
            <polygon points="321,76 346,112 338,162 304,162 296,112" fill="#8C8375" stroke={ink} strokeWidth="1.8" />
            {c && (
              <>
                <line x1="305" y1="100" x2="338" y2="148" stroke={cyan} strokeWidth="2.2" />
                <line x1="336" y1="98" x2="306" y2="146" stroke={cyan} strokeWidth="1.6" />
              </>
            )}
            <text x="321" y="216" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">NI AL&apos;BU</text>
          </g>
          <text x="200" y="274" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            {b ? 'WORDSTREAMER DELETED BY CONSTRUCT' : 'PRE-SCHISM TRIPTYCH'} · GEODE: {c ? 'FRACTURED' : 'SEALED'}
          </text>
        </svg>
      );

    case 2: // F03: Mother, the Five Theses, and the Drakken Eggs
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F03 Mother and Drakken Theses">
          <circle cx="135" cy="140" r="64" fill="#2A465C" stroke={ink} strokeWidth="2" />
          <path d="M90,122 Q135,152 182,118" fill="none" stroke={cyan} strokeWidth={a ? 3.5 : 1.5} />
          <path d="M95,158 Q138,184 178,162" fill="none" stroke="#8CE0FA" strokeWidth={a ? 2.5 : 1} />
          <text x="135" y="226" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">MOTHER (PLANET)</text>

          <rect x="232" y="64" width="138" height="156" fill="#EDE4D0" stroke={ink} strokeWidth="1.4" />
          <text x="301" y="88" textAnchor="middle" fontSize="10" fontWeight="bold" fill={ink} fontFamily="monospace">
            {draxis ? `#${draxis.id} ${draxis.name}` : 'DRAXIS SPECIMEN'}
          </text>
          <text x="301" y="106" textAnchor="middle" fontSize="9" fill={slate} fontFamily="monospace">
            THESIS: {draxis?.thesis ?? 'Telluric'}
          </text>
          <polygon
            points={c ? '284,126 301,116 318,126 318,176 284,176' : '291,122 311,122 315,176 287,176'}
            fill="#474E5A"
            stroke={c ? cyan : ink}
            strokeWidth="2"
          />
          <text x="301" y="204" textAnchor="middle" fontSize="9" fill={ink} fontFamily="monospace">
            {c ? 'EGG HATCHED' : 'TEMPLE OBELISK'}
          </text>
        </svg>
      );

    case 3: // F04: Year 0 to Year 3
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F04 War Declaration Schematic">
          <rect x="34" y="42" width="144" height="190" fill="#ECE3CF" stroke={ink} strokeWidth="1.5" />
          <circle cx="106" cy="118" r="28" fill="#B5D7E4" stroke={cyan} strokeWidth="2" />
          {a && <path d="M72,95 L140,142" stroke={crimson} strokeWidth="2.5" />}
          <text x="106" y="180" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">YEAR 0 · INVASION</text>

          <rect x="222" y="42" width="144" height="190" fill="#ECE3CF" stroke={ink} strokeWidth="1.5" />
          <polygon points="294,76 314,132 294,166 274,132" fill="#A57263" stroke={ink} strokeWidth="1.6" />
          {b && <line x1="258" y1="88" x2="332" y2="88" stroke={crimson} strokeWidth="3" />}
          <text x="294" y="180" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            YEAR 3 · {c ? '40–60% LOST' : 'CRATER PLATE'}
          </text>
        </svg>
      );

    case 4: // F05: Gorevault, Ringthroat, and the Blood Ring
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F05 Blood Ring Cutaway">
          <ellipse cx="200" cy="82" rx="138" ry="26" fill="none" stroke={crimson} strokeWidth={b ? 10 : 5} />
          <ellipse cx="200" cy="82" rx="138" ry="26" fill="none" stroke="#E0B680" strokeWidth="1" strokeDasharray="3 4" />
          <rect x="64" y="156" width="96" height="58" fill="#513638" stroke={ink} strokeWidth="1.8" />
          <text x="112" y="189" textAnchor="middle" fontSize="10" fill="#F4ECDC" fontFamily="monospace">GOREVAULT #044</text>
          <path d={a ? 'M160,184 L232,184 L256,88' : 'M160,184 L232,184'} fill="none" stroke={crimson} strokeWidth="4" />
          <polygon points="236,214 276,214 264,126 248,126" fill="#462F33" stroke={ink} strokeWidth="1.8" />
          <text x="256" y="232" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">RINGTHROAT #029</text>
          <text x="200" y="274" textAnchor="middle" fontSize="10" fill={crimson} fontWeight="bold" fontFamily="monospace">
            {c ? '"Your sky is built from your dead."' : 'CUTAWAY EXTRUSION MODEL'}
          </text>
        </svg>
      );

    case 5: // F06: The Long Attrition (Years 7 to 120)
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F06 170-Year War Dial">
          <circle cx="122" cy="142" r="76" fill="#E8DFCA" stroke={ink} strokeWidth="2" />
          <line x1="122" y1="142" x2={122 + Math.cos(aStep * 1.3 - 1.2) * 58} y2={142 + Math.sin(aStep * 1.3 - 1.2) * 58} stroke={crimson} strokeWidth="3" />
          <text x="122" y="240" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">YEARS 7–120 · STEP {aStep}</text>

          <rect x="226" y="64" width="144" height="156" fill="#EDE4D0" stroke={ink} strokeWidth="1.5" />
          <text x="298" y="92" textAnchor="middle" fontSize="10" fontWeight="bold" fill={ink} fontFamily="monospace">
            ACTIVE CAMPAIGN STRAIN
          </text>
          <text x="298" y="132" textAnchor="middle" fontSize="12" fontWeight="bold" fill={crimson} fontFamily="monospace">
            #{draxis?.id ?? '003'} {draxis?.name ?? 'FAULT-TONGUE'}
          </text>
          <text x="298" y="156" textAnchor="middle" fontSize="9" fill={slate} fontFamily="monospace">
            {draxis?.thesis ?? 'Telluric'}
          </text>
          <text x="298" y="198" textAnchor="middle" fontSize="9" fill={ink} fontFamily="monospace">
            {c ? 'STABILITY: EXHAUSTED' : '14 CAMPAIGN STRAINS'}
          </text>
        </svg>
      );

    case 6: // F07: Codec and Marcel
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F07 Codec and Marcel Portraits">
          <rect x="38" y="48" width="144" height="186" fill="#ECE3CF" stroke={ink} strokeWidth="1.5" />
          <circle cx="110" cy="108" r="24" fill="#D4C7B2" stroke={ink} strokeWidth="1.5" />
          <circle cx="101" cy="106" r="3" fill={a ? cyan : ink} />
          <circle cx="119" cy="106" r="3" fill={a ? cyan : ink} />
          <text x="110" y="176" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">CODEC (PROSTHETIC)</text>

          <rect x="218" y="48" width="144" height="186" fill="#ECE3CF" stroke={ink} strokeWidth="1.5" />
          <circle cx="290" cy="108" r="24" fill="#D4C7B2" stroke={ink} strokeWidth="1.5" />
          {b && <path d="M276,120 Q290,148 304,120" fill="none" stroke={cyan} strokeWidth="2.5" />}
          <text x="290" y="176" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">MARCEL (SYNCHRONIZED)</text>
          <text x="200" y="274" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            {c ? 'YEAR 121 MUTINY SPLIT' : 'FIELD COMMAND PARTNERSHIP'}
          </text>
        </svg>
      );

    case 7: // F08: The Unspooling and the Year 121 Mutiny
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F08 Unspooling Schematic">
          <rect x="74" y="96" width="60" height="86" rx="8" fill="#5D646E" stroke={ink} strokeWidth="1.8" />
          <rect x="266" y="96" width="60" height="86" rx="8" fill="#5D646E" stroke={ink} strokeWidth="1.8" />
          <line x1="134" y1="139" x2="266" y2="139" stroke={a ? cyan : slate} strokeWidth={a ? 4 : 2} strokeDasharray={b ? '6 4' : 'none'} />
          {a && <circle cx="200" cy="139" r="14" fill="none" stroke={cyan} strokeWidth="2" />}
          <text x="200" y="218" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            {a ? 'MNEMONIC FILAMENT DRAWN' : 'STARSILK DRUM IDLE'} · {b ? 'RECRUITABLE' : 'UNMAPPED'}
          </text>
          <text x="200" y="246" textAnchor="middle" fontSize="9" fill={crimson} fontFamily="monospace">
            {c ? 'MUTINY ORDER ACCEPTED AT YEAR 121' : 'DOCTRINE THRESHOLD'}
          </text>
        </svg>
      );

    case 8: // F09: Year 170 — The Collapse of the Sun and Stars
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F09 Sacrificial Model Star">
          <rect x="44" y="42" width="312" height="196" fill={a ? '#111319' : '#EAE0CA'} stroke={ink} strokeWidth="1.8" />
          {!a ? (
            <>
              <circle cx="200" cy="136" r="44" fill="#E6B95E" stroke={ink} strokeWidth="2" />
              <text x="200" y="206" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
                MODEL STAR (INTACT)
              </text>
            </>
          ) : (
            <>
              <circle cx="200" cy="136" r="46" fill="none" stroke={crimson} strokeWidth="2.5" strokeDasharray="5 3" />
              <circle cx="200" cy="136" r="26" fill="#040507" stroke="#E0A55A" strokeWidth="1.5" />
              <text x="200" y="206" textAnchor="middle" fontSize="10" fill="#F3ECE0" fontFamily="monospace">
                COLLAPSED TO BLACK HOLE (IRREVERSIBLE)
              </text>
            </>
          )}
          <text x="200" y="272" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            CLUSTERS LOST: {bStep}/3 · SILHOUETTE: {c ? 'EXPOSED' : 'COVERED'}
          </text>
        </svg>
      );

    case 9: // F10: Kail, Syrin, and the Sky Beyond the Blood Ring
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F10 Horizon and Pitch-Black Sky">
          {!b ? (
            <>
              <rect x="52" y="46" width="296" height="186" fill="#EAE0CA" stroke={ink} strokeWidth="1.6" />
              <circle cx="155" cy="136" r="30" fill="#D5C8B2" stroke={ink} strokeWidth="1.6" />
              <circle cx="248" cy="136" r="30" fill="#D5C8B2" stroke={ink} strokeWidth="1.6" />
              <line x1="155" y1="136" x2="248" y2="136" stroke={cyan} strokeWidth={a ? 3 : 1} />
              <text x="200" y="210" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
                KAIL &amp; SYRIN · ARCHITECTURAL PLATE
              </text>
            </>
          ) : (
            <>
              <rect x="44" y="42" width="312" height="132" fill="#0B0D12" stroke={ink} strokeWidth="1.6" />
              {/* Solid pitch-black sky streak — NO wireframe grid */}
              <polygon points="44,108 356,92 356,112 44,124" fill="#000000" />
              <rect x="44" y="174" width="312" height="68" fill="#D6C9B1" stroke={ink} strokeWidth="1.6" />
              <circle cx="164" cy="174" r="10" fill={ink} />
              <circle cx="236" cy="174" r="10" fill={ink} />
              <text x="200" y="220" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
                PITCH-BLACK SKY STREAK · SILHOUETTES AT HORIZON
              </text>
            </>
          )}
          <text x="200" y="274" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            {c ? 'KAIL DISMISSED — WAR CONTINUES' : '170-YEAR VICTORY THRESHOLD'}
          </text>
        </svg>
      );

    case 10: // F11: Nacreous VI Level 3 (31 days post-war)
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F11 Nacreous VI Level 3">
          {/* Barren floor surrounding cylinder */}
          <rect x="44" y="46" width="312" height="190" fill="#D6CBB7" stroke={ink} strokeWidth="1.6" />
          <line x1="44" y1="196" x2="356" y2="196" stroke="#9B907E" strokeWidth="1.5" />
          {/* Forearm-sized glass loam cylinder */}
          <rect x="176" y="92" width="48" height="104" rx="6" fill="#DCECF0" stroke={ink} strokeWidth="2" opacity="0.85" />
          <rect x="180" y="160" width="40" height="34" fill="#46372C" />
          <line x1="200" y1="160" x2="200" y2={b ? 114 : 132} stroke="#889852" strokeWidth="2.5" />
          <text x="200" y="222" textAnchor="middle" fontSize="9" fill={ink} fontFamily="monospace">
            SURROUNDING FLOOR BARREN · 31 DAYS POST-WAR
          </text>
          <text x="200" y="274" textAnchor="middle" fontSize="10" fill={ink} fontFamily="monospace">
            {a ? 'PLAQUE: NACREOUS VI LEVEL 3' : 'ROTATED PLAQUE'} · {c ? 'SETTLED RESIDUE' : 'OBSERVATION'}
          </text>
        </svg>
      );

    default: // F12: The Unfinished Peace
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="F12 The Unfinished Peace">
          <rect x="48" y="48" width="136" height="176" fill="#E8DFCA" stroke={ink} strokeWidth="1.6" />
          <text x="116" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill={ink} fontFamily="monospace">
            SYRIN &amp; MARCEL
          </text>
          <rect x="92" y="132" width="48" height="36" fill={b ? '#6F7A82' : cyan} stroke={ink} strokeWidth="1.5" />
          <text x="116" y="192" textAnchor="middle" fontSize="9" fill={ink} fontFamily="monospace">
            {b ? 'STARSILK INERT (DEAD-SWITCH)' : 'STARSILK LIVE'}
          </text>

          <rect x="216" y="48" width="136" height="176" fill="#E8DFCA" stroke={ink} strokeWidth="1.6" />
          <text x="284" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill={ink} fontFamily="monospace">
            KAIL (PROSE MEMORIAL)
          </text>
          <text x="284" y="150" textAnchor="middle" fontSize="9" fill={slate} fontFamily="monospace">
            {c ? 'PAGE TURNED TO REPOSE' : 'UNFINISHED SETTLEMENT'}
          </text>
          <text x="200" y="274" textAnchor="middle" fontSize="10" fill={brass} fontFamily="monospace">
            {a ? 'PEACE PLAQUES DIVIDED' : 'TWO-PANEL PEACE RECORD'} · {ADMINISTRATION_SLOGAN}
          </text>
        </svg>
      );
  }
}

export function NonWebglFolioView({
  snapshot,
  webglFallbackReason,
  onOpenBook,
  onTriggerInteraction,
}: NonWebglFolioViewProps) {
  const activeWorld = snapshot.activeWorld;
  const manifest = FOLIO_BY_WORLD[activeWorld];
  const runtime = snapshot.worlds[activeWorld];

  if (snapshot.bookPhase === 'closed') {
    return (
      <section className="fixed inset-0 z-10 flex items-center justify-center bg-[#0E1116] p-4 pb-32 pt-20">
        <div className="flex w-full max-w-xl flex-col items-center rounded-lg border border-[#8CA6B8]/30 bg-[#151922] p-6 text-center shadow-2xl">
          <div className="aspect-4/3 w-full max-w-md rounded border border-[#2F3744] bg-[#21252C] p-6 flex flex-col items-center justify-center">
            <svg viewBox="0 0 240 180" className="h-36 w-48" role="img" aria-label="Palimpsest Closed Charcoal Linen Cover">
              <circle cx="120" cy="84" r="48" fill="none" stroke="#B89860" strokeWidth="1.4" />
              <circle cx="120" cy="84" r="32" fill="none" stroke="#B89860" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M56,120 A74,74 0 0,1 184,120" fill="none" stroke="#3D95B5" strokeWidth="2.5" />
              <polygon
                points="120,62 126,77 142,77 129,87 134,102 120,93 106,102 111,87 98,77 114,77"
                fill="none"
                stroke="#CBB17D"
                strokeWidth="1.4"
              />
            </svg>
            <p className="mt-2 font-display text-lg font-bold tracking-wide text-[#ECE4D4]">
              Palimpsest: An Illustrated History of the All
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
              {BOOK_IMPRINT_CUE.paragraphs[0]}
            </p>
          </div>
          {webglFallbackReason && (
            <p className="mt-3 text-xs text-[#E2C298]">{webglFallbackReason}</p>
          )}
          <button
            type="button"
            onClick={onOpenBook}
            className="mt-4 rounded-md border border-[#B89860]/70 bg-[#243242] px-5 py-2 text-xs font-semibold text-[#F3ECE0] hover:bg-[#2F4156] cursor-pointer"
          >
            Open Volume in 4:3 Schematic Mode
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={`${manifest.code} non-WebGL 4:3 instructional folio view`}
      className="fixed inset-0 z-10 atlas-scroll bg-[#0E1116] px-3 pt-20 pb-36 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {webglFallbackReason && (
          <div className="rounded border border-[#B89860]/40 bg-[#1B1D24] px-3 py-2 text-xs text-[#E2CEAA]">
            {webglFallbackReason}
          </div>
        )}

        {/* Centered 4:3 Cardstock Spread Container */}
        <div className="mx-auto w-full max-w-2xl rounded-lg border-4 border-[#303846] bg-[#EAE1CD] p-3 text-[#1F2329] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#1F2329]/20 pb-1.5 text-[11px] font-mono">
            <span className="font-bold">
              {manifest.code} · {manifest.title}
            </span>
            <span className="text-[#4E5A68]">{manifest.temporalMarker}</span>
          </div>

          <div className="mt-2 aspect-4/3 w-full rounded border border-[#1F2329]/25 bg-[#F3ECD9] p-2">
            {renderFolioSvg(snapshot)}
          </div>
        </div>

        {/* Interactive Text Equivalents & Mechanisms */}
        <div className="grid gap-3 sm:grid-cols-3">
          {manifest.interactions.map((def) => {
            const st = runtime.interactions[def.slot];
            return (
              <div
                key={def.id}
                className="flex flex-col justify-between rounded-md border border-[#8CA6B8]/30 bg-[#151A23] p-3 text-xs"
              >
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#8CA6B8]">
                    [{def.slot}] {def.type}
                  </span>
                  <h3 className="mt-0.5 font-semibold text-[#F3ECE0]">{def.label}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#C8C2B6]">
                    {def.textEquivalent}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onTriggerInteraction(def.slot)}
                  aria-pressed={st.active}
                  className={`mt-3 rounded border px-3 py-1.5 font-mono text-[11px] font-medium cursor-pointer ${
                    st.locked
                      ? 'border-[#B35D53] bg-[#361C1E] text-[#F3ECE0]'
                      : st.active
                        ? 'border-[#3D95B5] bg-[#1F3A4D] text-[#F3ECE0]'
                        : 'border-[#8CA6B8]/40 bg-[#1B222F] text-[#E6DFD0] hover:border-[#3D95B5]'
                  }`}
                >
                  {st.locked
                    ? 'Collapsed (Locked)'
                    : st.active
                      ? `Active (Step ${st.step}/${st.maxSteps})`
                      : `Operate [${def.slot}]`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Opening & Main Lesson Excerpt */}
        <div className="rounded-md border border-[#8CA6B8]/25 bg-[#141821] p-4 space-y-2 text-xs leading-relaxed text-[#E5DDD0]">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8CA6B8]">
            {manifest.code} Lesson Text
          </p>
          {manifest.cues.OPEN.paragraphs.map((p, idx) => (
            <p key={`o-${idx}`}>{p}</p>
          ))}
          {manifest.cues.LESSON.paragraphs.map((p, idx) => (
            <p key={`l-${idx}`}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
