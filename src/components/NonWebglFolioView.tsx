import { ADMINISTRATION_SLOGAN, BOOK_IMPRINT_CUE, FOLIO_BY_WORLD } from '../story/historyManifest';
import { DRAXIS_BY_ID } from '../story/draxisCatalog';
import { AtlasSnapshot, FolioInteractionSlot } from '../types/atlas';

interface NonWebglFolioViewProps {
  snapshot: AtlasSnapshot;
  webglFallbackReason: string | null;
  onOpenBook: () => void;
  onTriggerInteraction: (slot: FolioInteractionSlot) => void;
}

/* PALIMPSEST P0: manuscript-grounded non-WebGL SVG, F01-F12.
 * Replace only renderFolioSvg (and its added status helper) in the pinned file.
 * Uses the original imports: ADMINISTRATION_SLOGAN, FOLIO_BY_WORLD,
 * DRAXIS_BY_ID, and type AtlasSnapshot. No independent interaction state.
 */
function getFolioVisualStatus(snapshot: AtlasSnapshot): string {
  const w = snapshot.activeWorld;
  const st = snapshot.worlds[w].interactions;
  const a = st.A.active;
  const b = st.B.active;
  const c = st.C.active;
  const bs = st.B.step;
  const as = st.A.step;
  const f03 = ['Pyric / Magma Pleuron 001', 'Aqueous / Brinechoir 023', 'Telluric / Terragullet 019', 'Aeric / Aerokarst 008', 'Umbral / Lyriboris 032'];
  const f06 = ['Years 7-30','Years 31-60','Years 61-90','Years 91-120'];
  const tri = (left: string, right: string, on: boolean) => on ? right : left;
  const states: [string,string,string][] = [
    [tri('Vellum covers instruction grid','Vellum lifted, instruction grid exposed',a), `Recursion dial position ${bs+1} of 4`, tri('Law, Memory and Rendering separated','Law, Memory and Rendering converged',c)],
    [tri('Triarchic wings folded','Triarchic wings unfolded, three principles visible',a), tri('Redaction covers Starsilk murder evidence','Redaction moved, cyan Starsilk traces exposed',b), tri('Digital Geode sealed','Digital Geode cutaway shows NiAlBu imprisoned alive',c)],
    [tri('Drakken Egg sealed','Egg cutaway: Descent, Activation, Ecological Rewrite',a), `Ecological thesis ${f03[bs % 5]}`, tri('Temple facade covers the terrain','Temple lifted; ecological rewriting shown underneath',c)],
    [tri('Colony before first contact','Colony after first contact, fractured terrain',a), tri('Counter-Macro outposts unconnected','Counter-Macro response arrows deployed',b), tri('Institutional logistics strip folded','Logistics: Observe, Verify, Deploy, Record',c)],
    [tri('Fallenstar Prime before the Blood Ring','Physical vitrified crimson Blood Ring encircles Fallenstar Prime',a), b ? `Manufacturing stage ${((bs+3)%4)+1} of 4` : 'Manufacturing cutaway closed', tri('Perpetrator doctrine visible','Archival process record visible',c)],
    [`Chronology: ${f06[as % 4]}`, `Campaign specimen selection ${bs+1} of 7`, tri('Cumulative-loss ledger closed','Cumulative-loss ledger open; unknown totals blank',c)],
    [tri('Pharos tactical planning overlay folded','Pharos tactical planning overlay visible, not to scale',a), tri('Clean siege maneuver projections','Attrition markers show stalled siege conditions',b), tri('Support-route inspection closed','Support-route strain exposed, unknown losses blank',c)],
    [tri('Aureal Gate shields closed','Aureal Gate opened, weaponized Starsilk vulnerability exposed',a), tri('Divine invincibility assumed','Divine invincibility assumption fractured',b), tri('Conquered-world tray closed','Retreat arrow and 20 nongeographic conquered-world markers displayed',c)],
    [tri('Nonhistorical model star intact','Nonhistorical model star irreversibly collapsed to a black hole',a), `Hal'Ven cluster collapse wave ${bs} of 3`, tri('Containment plan folded','Singularity enclosure plan exposed',c)],
    [tri('Siege Wall boundary at rest','Siege Wall containment boundary raised',a), tri('Engineering schematic of the Siege Wall','Inhabited horizon with one pitch-black sky streak',b), tri('Postwar Protocols sheet closed','Prohibited heliocide replication decree open',c)],
    [tri('Forearm-sized glass loam cylinder in barren crater','Cylinder inspection inset shows loam and wheat; crater remains barren',a), tri('Wartime Macro weapon schematic','Life-preserving loam arrangement schematic',b), tri('Attributed confrontation record closed','Full attributed Shard-god to Codec quotation visible',c)],
    [tri('Containment and continuing harm overlaid','Containment achieved and harm not ended separated',a), tri('Starsilk circuit active','Starsilk circuit inert under symbolic Syrin-blood condition',b), tri('Syrin 4 archive leaf sealed','Syrin 4 archive leaf unsealed, Kail identified as surviving initiate',c)],
  ];
  return `A: ${states[w][0]}. B: ${states[w][1]}. C: ${states[w][2]}.`;
}

/* Source-catalog-derived abstract marks, not anatomical model replacements. */
function sourceSpecimenMark(id: string, x: number, y: number) {
  let mark = <polygon points="-22,-28 22,-28 33,14 -33,14" fill="#596675" stroke="#1F2329" strokeWidth="2"/>;
  switch (id) {
    case '001': // MAGMA PLEURON: wide armored mantle, side vents, central core.
      mark = <g><path d="M-51,0 L-34,-22 L-7,-14 L0,-26 L7,-14 L34,-22 L51,0 L24,18 L-24,18 Z" fill="#565867" stroke="#1F2329" strokeWidth="2"/><circle cx="0" cy="-1" r="10" fill="#9F4E32"/>{[-34,34].map(k=><rect key={k} x={k-5} y="-4" width="10" height="4" fill="#923B32"/>)}</g>;
      break;
    case '023': // BRINECHOIR: tiered bell columns and saline siphon pipes.
      mark = <g>{[-20,0,20].map((k,i)=><g key={k}><path d={`M${k-8},${-18+i*7} L${k+8},${-18+i*7} L${k+13},${4+i*4} L${k-13},${4+i*4} Z`} fill="#71818B" stroke="#1F2329" strokeWidth="1.5"/><line x1={k} y1="-28" x2={k} y2={-18+i*7} stroke="#3D95B5" strokeWidth="3"/></g>)}</g>;
      break;
    case '019': // TERRAGULLET: long boring cylinder and twin grinder drums.
      mark = <g><rect x="-35" y="-14" width="51" height="28" rx="7" fill="#53616D" stroke="#1F2329" strokeWidth="2"/>{[25,43].map(k=><g key={k}><circle cx={k-12} cy="-5" r="13" fill="#3A434F" stroke="#1F2329" strokeWidth="2"/><path d={`M${k-22},-5 L${k-2},-5 M${k-12},-15 L${k-12},5`} stroke="#D2B96E" strokeWidth="2"/></g>)}</g>;
      break;
    case '008': // AEROKARST: headless central sphere with floating armor baffles.
      mark = <g><circle r="16" fill="#6B7D8C" stroke="#1F2329" strokeWidth="2"/>{[-38,32].map(k=><polygon key={k} points={`${k},-22 ${k+13},-16 ${k+9},8 ${k-5},13`} fill="#CDD0C1" stroke="#1F2329" strokeWidth="1.5"/>)}<path d="M-15,-31 Q0,-38 15,-31 M-14,28 Q0,37 14,28" fill="none" stroke="#3D95B5" strokeWidth="2"/></g>;
      break;
    case '032': // LYRIBORIS: twin structural arches, vertical filaments.
      mark = <g><path d="M-35,25 Q-52,-17 -17,-33 M35,25 Q52,-17 17,-33" fill="none" stroke="#5C6676" strokeWidth="9" strokeLinecap="round"/>{[-12,0,12].map(k=><line key={k} x1={k} y1="-32" x2={k} y2="24" stroke="#3D95B5" strokeWidth="2"/>)}</g>;
      break;
    case '003': // FAULT-TONGUE: articulated rib-spine, serrated trenching tongue.
      mark = <g><path d="M-45,-12 Q-12,-35 30,-4" fill="none" stroke="#53616D" strokeWidth="12"/>{[-36,-23,-10,3,16].map(k=><line key={k} x1={k} y1="-27" x2={k+4} y2="-1" stroke="#1F2329" strokeWidth="3"/>)}<path d="M28,-4 L54,10 L30,18 L45,24 L20,17" fill="none" stroke="#9F4E32" strokeWidth="5"/></g>;
      break;
    case '004': // OBSIDIAN GUL: parted basalt hull around central intake.
      mark = <g><path d="M-43,18 L-37,-30 L-7,-22 L-4,13 Z M43,18 L37,-30 L7,-22 L4,13 Z" fill="#3D4753" stroke="#1F2329" strokeWidth="2"/><ellipse cx="0" cy="-2" rx="10" ry="24" fill="#101417" stroke="#9F4E32" strokeWidth="2"/></g>;
      break;
    case '009': // CLOUDMAW: upward vortex collar, radial intake vanes.
      mark = <g><path d="M-36,-19 L36,-19 L13,27 L-13,27 Z" fill="#5E6F81" stroke="#1F2329" strokeWidth="2"/><ellipse cx="0" cy="-20" rx="35" ry="10" fill="#18232B" stroke="#3D95B5" strokeWidth="3"/>{[-22,0,22].map(k=><path key={k} d={`M${k},-31 L${k/3},-12`} stroke="#BEC4C7" strokeWidth="3"/>)}</g>;
      break;
    case '012': // VORTENBRAY: stacked gyro rings around hollow bore.
      mark = <g>{[-15,0,15].map((k,i)=><ellipse key={i} cx="0" cy={k} rx={34-i*5} ry="10" fill="none" stroke={i===1?'#3D95B5':'#546575'} strokeWidth="5"/>)}<line x1="0" y1="-32" x2="0" y2="32" stroke="#1F2329" strokeWidth="6"/></g>;
      break;
    case '030': // SOLNEXUS: crescent collectors and central fusion node.
      mark = <g><circle r="13" fill="#C79658" stroke="#1F2329" strokeWidth="2"/><path d="M-23,-28 Q-47,0 -23,28 M23,-28 Q47,0 23,28" fill="none" stroke="#60596A" strokeWidth="8"/><path d="M-12,-37 Q0,-41 12,-37 M-12,37 Q0,41 12,37" fill="none" stroke="#A38753" strokeWidth="4"/></g>;
      break;
  }
  return <g transform={`translate(${x},${y})`}>{mark}</g>;
}

function renderFolioSvg(snapshot: AtlasSnapshot) {
  const world = snapshot.activeWorld;
  const st = snapshot.worlds[world].interactions;
  const a = st.A.active;
  const b = st.B.active;
  const c = st.C.active;
  const aStep = st.A.step;
  const bStep = st.B.step;
  // Existing stepped-store behavior: first activation changes step 0 to 1.
  // Map steps 1,2,3,0 to manufacture stages 1,2,3,4 without changing store state.
  const f05Bay = b ? (bStep+3)%4 : -1;
  const ink = '#1F2329';
  const slate = '#536274';
  const cyan = '#3D95B5';
  const crimson = '#8E282B';
  const brass = '#9D7F4C';
  const paper = '#EEE4D2';
  const pale = '#F8F1E4';
  const dark = '#272E3A';
  const manifest = FOLIO_BY_WORLD[world];
  const status = getFolioVisualStatus(snapshot);
  const f03Names = ['001 MAGMA PLEURON / PYRIC','023 BRINECHOIR / AQUEOUS','019 TERRAGULLET / TELLURIC','008 AEROKARST / AERIC','032 LYRIBORIS / UMBRAL'];
  const f06Periods = ['7-30','31-60','61-90','91-120'];
  const manufacture = ['INPUT','GOREVAULT 044','RINGTHROAT 029','VITRIFIED RING'];
  const f06Id = snapshot.activeDraxisId;
  const f06Name = f06Id && DRAXIS_BY_ID[f06Id] ? `${f06Id} ${DRAXIS_BY_ID[f06Id].name}` : 'SOURCE PLATE';
  let drawing = <g/>;
  switch (world) {
    case 0: // Notebook Program: vellum, dial, three convergence arms.
      drawing = <g>
        <rect x="42" y="42" width="316" height="203" fill={pale} stroke={ink}/>
        {[0,1,2,3].map(i => <circle key={i} cx="200" cy="135" r={42+i*15} fill="none" stroke={i===bStep ? cyan : brass} strokeWidth={i===bStep ? 3 : 1.3} strokeDasharray={i===bStep?'none':'4 5'}/>)}
        <line x1="200" y1="135" x2={200+Math.sin(bStep*Math.PI/2)*92} y2={135-Math.cos(bStep*Math.PI/2)*92} stroke={crimson} strokeWidth="3"/>
        {[{x:200,y:60,n:'LAW'},{x:116,y:195,n:'MEMORY'},{x:284,y:195,n:'RENDERING'}].map(({x,y,n},i)=>{
          const tx=c ? 200+(x-200)*0.25 : x, ty=c ? 135+(y-135)*0.25:y;
          return <g key={n}><line x1={tx} y1={ty} x2="200" y2="135" stroke={cyan} strokeWidth="2"/><circle cx={tx} cy={ty} r="15" fill={paper} stroke={ink}/><text x={tx} y={ty+3} textAnchor="middle" fontSize="8" fill={ink}>{n.slice(0,3)}</text></g>;
        })}
        <polygon points="200,111 225,135 200,159 175,135" fill={c?'#DABF64':'#C9C0A5'} stroke={ink}/>
        {!a && <g><rect x="55" y="48" width="288" height="185" fill="#D4CFBFA8" stroke={slate} strokeDasharray="5 4"/><text x="200" y="103" textAnchor="middle" fill={ink} fontSize="12">TRANSLUCENT VELLUM</text><text x="200" y="226" textAnchor="middle" fill={ink} fontSize="10">LIFT A TO EXPOSE INSTRUCTIONS</text></g>}
        {a && <text x="200" y="224" textAnchor="middle" fill={ink} fontSize="10">NOTEBOOK RECURSION GRID EXPOSED</text>}
        <text x="200" y="263" textAnchor="middle" fill={ink} fontSize="10">RECURSION DIAL {bStep+1}/4 | TRIAD {c?'ALIGNED':'SEPARATE'}</text>
      </g>; break;
    case 1: // Three principles, redaction, living captivity.
      drawing = <g>
        <rect x="44" y="45" width="312" height="192" fill={paper} stroke={ink}/>
        {[78,200,322].map((cx,i)=><g key={i}>
          <rect x={cx-47} y="67" width="94" height="138" fill={a ? pale : '#B9B3A9'} stroke={ink} strokeWidth="1.7"/>
          {a ? <g><circle cx={cx} cy="111" r="25" fill={i===1?dark:'#A7C2CD'} stroke={ink}/><text x={cx} y="174" textAnchor="middle" fill={ink} fontSize="10">{['WORDSTREAMER','SHARD-GOD','NiAlBu'][i]}</text></g> : <text x={cx} y="134" textAnchor="middle" fill={ink} fontSize="9">FOLDED PANEL {i+1}</text>}
        </g>)}
        {!b && <g><rect x="38" y="54" width="324" height="25" fill={dark}/><text x="200" y="71" textAnchor="middle" fontSize="10" fill={pale}>ADMINISTRATION REDACTION</text></g>}
        {b && <g><path d="M45,88 L100,111 L150,80 L205,113 L255,89 L354,113" fill="none" stroke={cyan} strokeWidth="4"/><text x="200" y="228" textAnchor="middle" fill={ink} fontSize="9">CYAN STARSILK TRACE / WORDSTREAMER MURDER</text></g>}
        {c && <g><rect x="265" y="76" width="108" height="137" fill="#2A3045" stroke={brass}/><path d="M319,86 L319,191" stroke={cyan} strokeWidth="2"/><polygon points="319,100 335,129 319,147 303,129" fill="#7272A1"/><path d="M293,110 L319,148 L345,110" stroke={cyan} strokeWidth="2" fill="none"/><text x="319" y="193" textAnchor="middle" fontSize="8" fill={pale}>LIVING CAPTIVE</text></g>}
        <text x="200" y="267" textAnchor="middle" fill={ink} fontSize="10">TRIPTYCH {a?'OPEN':'CLOSED'} | REDACTION {b?'REMOVED':'IN PLACE'}</text>
      </g>; break;
    case 2: // Egg is not the temple; five theses are a separate selection.
      drawing = <g>
        <circle cx="100" cy="118" r="59" fill="#284760" stroke={ink} strokeWidth="2"/>
        <path d="M58,123 Q103,153 145,108 M68,158 Q103,171 135,153" stroke={cyan} strokeWidth="3" fill="none"/>
        <text x="100" y="198" textAnchor="middle" fill={ink} fontSize="10">MOTHER / HOMEWORLD</text>
        <polygon points="218,57 264,96 252,196 211,214 170,196 158,96" fill={a?'#C4B7A4':dark} stroke={brass} strokeWidth="2"/>
        {!a ? <text x="211" y="142" textAnchor="middle" fontSize="10" fill={pale}>EGG SEALED</text> : <g><rect x="184" y="93" width="53" height="21" fill={pale}/><rect x="184" y="119" width="53" height="21" fill={pale}/><rect x="184" y="145" width="53" height="21" fill={pale}/><text x="210" y="107" textAnchor="middle" fontSize="8">DESCENT</text><text x="210" y="133" textAnchor="middle" fontSize="8">ACTIVATE</text><text x="210" y="159" textAnchor="middle" fontSize="8">REWRITE</text></g>}
        <rect x="271" y="67" width="110" height="126" fill={paper} stroke={ink}/>
        {sourceSpecimenMark(['001','023','019','008','032'][bStep%5],326,128)}
        <text x="326" y="182" textAnchor="middle" fontSize="8" fill={ink}>THESIS {bStep+1}/5</text>
        <text x="326" y="207" textAnchor="middle" fontSize="8" fill={ink}>{f03Names[bStep%5].split(' / ')[0]}</text>
        <text x="326" y="219" textAnchor="middle" fontSize="8" fill={ink}>{f03Names[bStep%5].split(' / ')[1]}</text>
        <rect x="40" y="228" width="340" height="44" fill={c?'#5B3D3C':paper} stroke={ink}/>
        {c ? <g><path d="M52,256 L76,242 L101,262 L127,242 L147,262" fill="none" stroke="#D5A8A0" strokeWidth="4"/><text x="260" y="246" textAnchor="middle" fontSize="10" fill={pale}>ECOLOGICAL REWRITE</text><text x="260" y="260" textAnchor="middle" fontSize="9" fill={pale}>UNDER TEMPLE</text></g> : <g><path d="M53,243 L144,243 L132,236 L64,236 Z" fill={brass}/>{[66,91,116,141].map(x=><rect key={x} x={x} y="244" width="8" height="18" fill={slate}/>)}<text x="260" y="246" textAnchor="middle" fontSize="10" fill={ink}>MORTAL TEMPLE FACADE</text><text x="260" y="260" textAnchor="middle" fontSize="9" fill={ink}>REWRITE OBSCURED</text></g>}
      </g>; break;
    case 3: // Year 0 only: settlement, response routes, logistics stages.
      drawing = <g>
        <rect x="28" y="38" width="344" height="202" fill={pale} stroke={ink}/>
        <text x="200" y="58" textAnchor="middle" fill={ink} fontSize="12">YEAR 0 / FIRST CONTACT</text>
        {a ? <g><path d="M46,157 L82,133 L109,184 L148,143 L190,195 L236,148 L280,181 L350,144" fill="none" stroke={dark} strokeWidth="8"/><path d="M51,193 L138,132 L220,188 L315,153" fill="none" stroke={crimson} strokeWidth="3"/><text x="200" y="223" textAnchor="middle" fontSize="10" fill={ink}>FRACTURED POST-CONTACT TERRAIN</text></g> : <g>{[64,121,178,235,292].map((x,i)=><g key={i}><rect x={x} y={i%2?129:146} width="27" height="31" fill="#A6B69A" stroke={ink}/><path d={`M${x-5},${i%2?129:146} l18,-16 18,16`} fill="none" stroke={brass} strokeWidth="2"/></g>)}<line x1="40" y1="179" x2="360" y2="179" stroke="#879A83" strokeWidth="6"/><text x="200" y="223" textAnchor="middle" fontSize="10" fill={ink}>INTACT REPRESENTATIVE COLONY</text></g>}
        {b && <g>{[[56,95,160,115],[160,115,272,104],[272,104,335,139]].map(([x1,y1,x2,y2],i)=><g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cyan} strokeWidth="3"/><polygon points={`${x2},${y2} ${x2-10},${y2-6} ${x2-10},${y2+6}`} fill={cyan}/></g>)}</g>}
        <rect x="28" y="247" width="344" height="35" fill={c?paper:'#A6A39B'} stroke={ink}/>
        {c ? ['OBSERVE','VERIFY','DEPLOY','RECORD'].map((step,i)=><g key={i}><rect x={35+i*84} y="254" width="78" height="21" fill={pale} stroke={ink}/><text x={74+i*84} y="268" textAnchor="middle" fontSize="9" fill={ink}>{step}</text></g>) : <text x="200" y="268" textAnchor="middle" fontSize="10" fill={ink}>FOLDED CODEC LOGISTICS STRIP</text>}
      </g>; break;
    case 4: // Blood Ring is matter; manufacturer stages are four distinct states.
      drawing = <g>
        <rect x="30" y="38" width="340" height="216" fill={paper} stroke={ink}/>
        <circle cx="100" cy="119" r="43" fill="#73938A" stroke={ink} strokeWidth="2"/>
        {a && <ellipse cx="100" cy="119" rx="62" ry="20" fill="none" stroke={crimson} strokeWidth="10"/>}
        <text x="100" y="182" textAnchor="middle" fontSize="9" fill={ink}>FALLENSTAR PRIME</text>
        <text x="100" y="195" textAnchor="middle" fontSize="8" fill={ink}>{a?'SOLID VITRIFIED RING':'PRE-CONQUEST'}</text>
        {b ? <g>
          {manufacture.map((label,i)=><g key={i}>
            <rect x={177+i*45} y="72" width="40" height="125" fill={i===f05Bay?(i===3?'#78312D':'#ACBFC8'):pale} stroke={ink} strokeWidth={i===f05Bay?2.5:1}/>
            <g transform={`translate(${197+i*45},128)`}>
              {i===0 && <g>{[-13,-3,7].map((x,k)=><rect key={k} x={x} y={-18+k*9} width="9" height="10" fill={dark}/>)}</g>}
              {i===1 && <path d="M-5,-30 L-15,-13 L4,3 L-13,23" stroke={crimson} strokeWidth="4" fill="none"/>}
              {i===2 && <g><path d="M0,29 L0,-24" stroke={crimson} strokeWidth="7"/><polygon points="-9,-21 0,-38 9,-21" fill={crimson}/></g>}
              {i===3 && <ellipse cx="0" cy="0" rx="14" ry="9" fill="none" stroke={crimson} strokeWidth="6"/>}
            </g>
            <text x={197+i*45} y="210" textAnchor="middle" fontSize="9" fill={ink}>{i===0?'IN':i===1?'GORE':i===2?'RING':'ORBIT'}</text>
          </g>)}
          <text x="262" y="235" textAnchor="middle" fontSize="9" fill={ink}>STAGE {f05Bay+1}/4: {manufacture[f05Bay]}</text>
        </g> : <g>
          <rect x="176" y="73" width="178" height="151" fill="#B9B4A9" stroke={ink} strokeWidth="2"/>
          <path d="M180,126 L350,126 M180,168 L350,168" stroke={brass} strokeWidth="4"/>
          <text x="265" y="146" textAnchor="middle" fill={ink} fontSize="11">CUTAWAY CLOSED</text>
          <text x="265" y="188" textAnchor="middle" fill={ink} fontSize="9">OPERATE B TO INSPECT</text>
        </g>}
        <rect x="37" y="260" width="326" height="29" fill={c?pale:dark} stroke={brass}/>
        <text x="200" y="278" textAnchor="middle" fontSize="10" fill={c?ink:pale}>{c?'ARCHIVE: DOCUMENTED PHYSICAL MANUFACTURE':'DRAKKEN: "Your sky is built from your dead."'}</text>
      </g>; break;
    case 5: // Long attrition: four periods, seven source-defined B steps, blank loss boxes.
      drawing = <g>
        <rect x="26" y="38" width="348" height="235" fill={pale} stroke={ink}/>
        <circle cx="101" cy="132" r="67" fill={paper} stroke={ink} strokeWidth="2"/>
        {f06Periods.map((per,i)=><g key={per}><line x1="101" y1="132" x2={101+Math.sin(i*Math.PI/2)*58} y2={132-Math.cos(i*Math.PI/2)*58} stroke={i===aStep?crimson:brass} strokeWidth={i===aStep?4:1.5}/></g>)}
        <text x="101" y="217" textAnchor="middle" fill={ink} fontSize="9">YEARS {f06Periods[aStep%4]}</text>
        <rect x="193" y="57" width="160" height="142" fill={paper} stroke={ink}/>
        {sourceSpecimenMark(f06Id || '003',273,125)}
        <text x="273" y="185" textAnchor="middle" fill={ink} fontSize="9">SPECIMEN {bStep+1}/7</text>
        <text x="273" y="211" textAnchor="middle" fill={ink} fontSize="9">{f06Name}</text>
        <rect x="35" y="232" width="326" height="33" fill={c?paper:'#C4C0B7'} stroke={ink}/>
        {c ? <g>{['BIOSPHERE','INFRASTRUCTURE','DEATH TOTAL'].map((v,i)=><g key={v}><text x={38+i*108} y="245" fontSize="8" fill={ink}>{v}</text><rect x={38+i*108} y="248" width="99" height="11" fill={pale} stroke={slate}/></g>)}</g> : <text x="200" y="251" textAnchor="middle" fontSize="10" fill={ink}>CUMULATIVE-LOSS RECORD / FOLDED</text>}
      </g>; break;
    case 6: // Pharos Nebula siege, not portraits or mutiny.
      drawing = <g>
        <rect x="30" y="39" width="340" height="230" fill={pale} stroke={ink}/>
        <text x="200" y="59" textAnchor="middle" fontSize="12" fill={ink}>YEAR 121 / PHAROS NEBULA</text>
        {[82,159,237,315].map((x,i)=><circle key={i} cx={x} cy={i%2?148:112} r="14" fill={paper} stroke={ink}/>)}
        {a && <g><path d="M69,121 L145,145 L222,119 L306,145" fill="none" stroke={cyan} strokeWidth="4"/><polygon points="306,145 295,137 295,149" fill={cyan}/><text x="200" y="88" textAnchor="middle" fill={ink} fontSize="9">TACTICAL OVERLAY / NOT TO SCALE</text></g>}
        {b && <g>{[0,1,2,3,4,5].map(i=><g key={i}><rect x={84+i*37} y={170+(i%2)*12} width="18" height="23" fill={crimson}/><line x1={84+i*37} y1="163" x2={100+i*37} y2="193" stroke={dark} strokeWidth="2"/></g>)}<text x="200" y="218" textAnchor="middle" fill={crimson} fontSize="10">ATTRITION / STALLED SIEGE</text></g>}
        {c && <g><rect x="48" y="226" width="304" height="38" fill={paper} stroke={brass}/><path d="M56,257 L130,248 L206,257 L283,248 L335,255" fill="none" stroke={crimson} strokeWidth="1.7"/><text x="200" y="240" textAnchor="middle" fill={ink} fontSize="9">SUPPORT ROUTES / LOSSES UNRECORDED</text></g>}
        {!c && <text x="200" y="254" textAnchor="middle" fill={ink} fontSize="10">SUPPORT ROUTE PLATE CLOSED</text>}
      </g>; break;
    case 7: // Year 170 Aureal Gate, vulnerability, retreat; twenty nongeographic markers.
      drawing = <g>
        <rect x="28" y="37" width="344" height="228" fill={pale} stroke={ink}/>
        <text x="200" y="57" textAnchor="middle" fontSize="12" fill={ink}>YEAR 170 / AUREAL GATE</text>
        <path d={a?'M66,177 L66,90 L122,90 M278,90 L334,90 L334,177':'M66,177 L66,90 L334,90 L334,177'} stroke={dark} strokeWidth="16" fill="none"/>
        <polygon points="200,89 228,135 200,175 172,135" fill={dark} stroke={brass} strokeWidth="2"/>
        {a && <g><path d="M79,145 L320,145" stroke={cyan} strokeWidth="4"/><polygon points="315,145 303,137 303,153" fill={cyan}/><text x="200" y="194" textAnchor="middle" fill={ink} fontSize="9">WEAPONIZED STARSILK / VULNERABILITY</text></g>}
        {b ? <g><path d="M151,135 A49 49 0 0 0 174 175 M221,175 A49 49 0 0 0 249 130" fill="none" stroke={crimson} strokeWidth="5"/><text x="200" y="214" textAnchor="middle" fill={ink} fontSize="9">DIVINE IMMUNITY ASSUMPTION FRACTURED</text></g> : <g><circle cx="200" cy="135" r="50" stroke={brass} strokeWidth="4" fill="none"/><text x="200" y="214" textAnchor="middle" fill={ink} fontSize="9">INVINCIBILITY ASSUMED</text></g>}
        {c && <g><rect x="30" y="225" width="340" height="58" fill={paper} stroke={ink}/><path d="M42,252 L78,252" stroke={cyan} strokeWidth="3"/><polygon points="42,252 54,245 54,259" fill={cyan}/>{Array.from({length:20},(_,i)=><g key={i}><circle cx={102+(i%10)*25} cy={238+Math.floor(i/10)*21} r="7" fill={dark} stroke={crimson} strokeWidth="2"/></g>)}<text x="199" y="278" textAnchor="middle" fill={ink} fontSize="8">20 CONQUERED WORLDS / NON-GEOGRAPHIC</text></g>}
      </g>; break;
    case 8: // Model star, three cluster waves, boundary. Never historical actor.
      drawing = <g>
        <rect x="31" y="38" width="338" height="234" fill={pale} stroke={ink}/>
        <text x="130" y="58" textAnchor="middle" fill={ink} fontSize="10">NONHISTORICAL MODEL STAR</text>
        {a ? <g><circle cx="130" cy="131" r="33" fill="#050609" stroke={brass} strokeWidth="1"/><text x="130" y="184" textAnchor="middle" fontSize="9">BLACK HOLE / LOCKED</text></g> : <g><circle cx="130" cy="131" r="35" fill="#E8C36A" stroke={brass} strokeWidth="2"/><path d="M166,131 L205,131" stroke={cyan} strokeWidth="4"/><circle cx="207" cy="131" r="10" fill="none" stroke={cyan} strokeWidth="3"/><text x="130" y="184" textAnchor="middle" fontSize="9">INTACT STAR + FILAMENT</text></g>}
        {[0,1,2].map((i)=><g key={i}><circle cx={244+i*47} cy="114" r="17" fill={i < bStep?'#050609':'#E9C96A'} stroke={ink} strokeWidth="1.5"/><text x={244+i*47} y="147" textAnchor="middle" fontSize="8">WAVE {i+1}</text></g>)}
        <text x="284" y="177" textAnchor="middle" fontSize="9" fill={ink}>CLUSTER STAGES {bStep}/3</text>
        {c && <g><ellipse cx="202" cy="231" rx="139" ry="23" fill="none" stroke={dark} strokeWidth="4"/>{[0,1,2,3,4,5].map(i=><circle key={i} cx={74+i*52} cy={231+(i%2)*10} r="5" fill="#080A0B"/>)}<text x="200" y="262" textAnchor="middle" fontSize="9" fill={ink}>SINGULARITY CONTAINMENT BOUNDARY</text></g>}
        {!c && <text x="200" y="261" textAnchor="middle" fontSize="9" fill={ink}>FOLDED CONTAINMENT PLAN</text>}
      </g>; break;
    case 9: // A engineering boundary; B inhabited-world sky; C protocols.
      drawing = <g>
        {b ? <g><rect x="30" y="39" width="340" height="142" fill="#0B0D12" stroke={ink}/>{[[76,67],[153,75],[250,58],[326,76],[90,154],[290,146]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.9" fill="#C7CDD4"/>)}<polygon points="30,103 370,90 370,115 30,127" fill="#000000"/><path d="M30,196 Q200,157 370,196 L370,234 L30,234 Z" fill="#B9B4A7" stroke={ink}/><text x="200" y="218" textAnchor="middle" fill={ink} fontSize="11">INHABITED HORIZON</text><text x="200" y="251" textAnchor="middle" fill={ink} fontSize="10">PITCH-BLACK SKY STREAK / SOLID DARK ABSENCE</text></g> : <g><rect x="30" y="39" width="340" height="213" fill={paper} stroke={ink}/><text x="200" y="59" textAnchor="middle" fontSize="11" fill={ink}>SIEGE WALL / ENGINEERING SCHEMATIC</text><path d="M70,206 Q200,80 330,206" fill="none" stroke={a?dark:brass} strokeWidth={a?12:6}/>{[0,1,2,3,4,5,6,7].map(i=><circle key={i} cx={70+i*37} cy={206-Math.sin(i/7*Math.PI)*86} r="5" fill="#070909"/>)}<text x="200" y="236" textAnchor="middle" fontSize="9" fill={ink}>CONTAINED INTERIOR / QUARANTINE EXTERIOR</text></g>}
        {c && <g><rect x="60" y="259" width="280" height="31" fill={pale} stroke={crimson} strokeWidth="2"/><text x="200" y="272" textAnchor="middle" fill={crimson} fontSize="10">POSTWAR PROTOCOLS / PROHIBITED</text><text x="200" y="283" textAnchor="middle" fill={ink} fontSize="8">HELIOCIDE REPLICATION & STUDY</text></g>}
      </g>; break;
    case 10: // Tiny life contained; inspect without greening crater or enlarging living specimen.
      drawing = <g>
        <rect x="30" y="38" width="340" height="228" fill="#C4B9A5" stroke={ink}/>
        <path d="M35,216 L115,192 L186,223 L252,187 L367,219" fill="none" stroke="#6C645E" strokeWidth="7"/>
        <rect x="172" y="120" width="56" height="93" rx="9" fill="#D1E4E5" stroke={ink} strokeWidth="2" opacity="0.9"/>
        <rect x="179" y="184" width="42" height="26" fill="#42392F"/>
        <path d="M201,183 L201,162 M201,173 Q193,163 188,167 M201,170 Q210,161 216,164" stroke="#889553" strokeWidth="2.5" fill="none"/>
        <text x="200" y="236" textAnchor="middle" fill={ink} fontSize="9">NACREOUS VI / BARREN OUTSIDE GLASS</text>
        {a && <g><rect x="34" y="45" width="122" height="125" fill={pale} stroke={brass} strokeWidth="2.5"/><text x="95" y="60" textAnchor="middle" fill={ink} fontSize="9">OPTICAL INSET</text><rect x="55" y="106" width="80" height="47" fill="#463B31"/><path d="M98,107 L98,75 M98,93 Q80,81 74,85 M98,86 Q112,72 120,78" stroke="#7D954B" strokeWidth="4" fill="none"/><path d="M156,157 L176,151" stroke={brass} strokeWidth="2" strokeDasharray="3 3"/></g>}
        <rect x="33" y="246" width="334" height="39" fill={paper} stroke={ink}/>
        {b ? <g><text x="200" y="260" textAnchor="middle" fontSize="9">PRESERVATION MACRO / FILTERED LOAM</text><path d="M76,269 L324,269" stroke="#8E9E6E" strokeWidth="3"/><circle cx="200" cy="269" r="7" fill="#76965E"/></g> : <g><text x="200" y="260" textAnchor="middle" fontSize="9">WARTIME MACRO / WEAPON ARRAY</text><path d="M76,269 L130,263 L184,278 L238,261 L324,269" stroke={crimson} strokeWidth="3" fill="none"/></g>}
        {c && <g><rect x="25" y="80" width="350" height="125" fill={pale} stroke={brass} strokeWidth="2"/><text x="200" y="96" textAnchor="middle" fontSize="9">SHARD-GOD TO CODEC / ATTRIBUTED SOURCE</text><text x="200" y="119" textAnchor="middle" fontSize="10">Your private discomfort with the shape</text><text x="200" y="136" textAnchor="middle" fontSize="10">of survival is not a license to revise</text><text x="200" y="153" textAnchor="middle" fontSize="10">the settlement.</text></g>}
      </g>; break;
    default: // F12 archival leaf, no invented dates or numbers.
      drawing = <g>
        <rect x="30" y="38" width="340" height="231" fill={pale} stroke={ink}/>
        <rect x={a?39:89} y="57" width="168" height="45" fill={paper} stroke={brass}/>
        <rect x={a?192:145} y="93" width="174" height="45" fill="#4B535E" stroke={ink}/>
        <text x={a?123:173} y="76" textAnchor="middle" fontSize="9" fill={ink}>CONTAINMENT ACHIEVED</text>
        <text x={a?279:232} y="112" textAnchor="middle" fontSize="9" fill={pale}>HARM NOT ENDED</text>
        <rect x="58" y="155" width="106" height="68" fill={paper} stroke={ink}/>
        <path d="M73,183 Q100,162 127,183 Q101,207 73,183" fill="none" stroke={b?slate:cyan} strokeWidth="5"/>
        <rect x="116" y="176" width="25" height="13" fill={crimson} stroke={ink}/>
        <text x="111" y="215" textAnchor="middle" fontSize="9" fill={ink}>STARSILK {b?'INERT':'ACTIVE'}</text>
        {c ? <g><rect x="174" y="153" width="187" height="88" fill={paper} stroke={brass} strokeWidth="2"/><text x="266" y="169" textAnchor="middle" fontSize="10" fill={ink}>SYRIN 4 / ARCHIVAL RECORD</text><text x="266" y="188" textAnchor="middle" fontSize="9" fill={ink}>DESTRUCTION DOCUMENTED</text><text x="266" y="204" textAnchor="middle" fontSize="9" fill={ink}>KAIL / LAST SURVIVING INITIATE</text><text x="266" y="222" textAnchor="middle" fontSize="8" fill={slate}>DATES & TOTALS: UNRECORDED</text></g> : <g><rect x="180" y="160" width="170" height="78" fill="#BAC2C6" stroke={ink}/><text x="265" y="199" textAnchor="middle" fontSize="10" fill={ink}>ARCHIVAL LEAF SEALED</text></g>}
        <text x="200" y="264" textAnchor="middle" fontSize="9" fill={ink}>{ADMINISTRATION_SLOGAN}</text>
      </g>;
  }
  return <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label={`${manifest.code}: ${status}`}>
    <title>{`${manifest.code} - ${manifest.title} - historical teaching schematic`}</title>
    <desc>{status}</desc>
    <rect width="400" height="300" fill="#F3ECD9" />
    {drawing}
  </svg>;
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
          <p className="mt-2 text-[10px] leading-relaxed text-[#364657]" role="status" aria-live="polite" aria-atomic="true">
            {getFolioVisualStatus(snapshot)}
          </p>
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
