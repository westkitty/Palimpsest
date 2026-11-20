/**
 * Accessible schematic plates for the nine existing later folios.
 * These are editorial diagrams of their known scenes, not new canon or assets.
 * No user-provided markup is interpolated; all SVG remains local and deterministic.
 */
const border = `<rect x="18" y="18" width="684" height="354" rx="9" fill="#182331" stroke="#b8a071" stroke-width="4"/>
<path d="M360 28V362" stroke="#b8a071" stroke-width="7"/>
<path d="M30 44H690M30 348H690" stroke="#9e906f" stroke-width="2" opacity=".55"/>`;
const labels = (left: string, right: string) =>
  `<text x="180" y="330" text-anchor="middle" fill="#f0e4c7" font-size="16" font-family="Georgia,serif">${left}</text><text x="539" y="330" text-anchor="middle" fill="#f0e4c7" font-size="16" font-family="Georgia,serif">${right}</text>`;

const art: Record<number, string> = {
  3: `<g fill="#4d806e" stroke="#cbba91" stroke-width="3">
    <path d="M55 230L120 185L183 224L252 177L307 235V291H55Z"/>
    <path d="M90 228V171H126V228M145 204V134H189V204M217 208V160H258V208" fill="#d9d0b3"/>
    </g><g stroke="#bdb09a" stroke-width="3" fill="#342e2e">
    <path d="M395 280L434 245L462 272L511 207L548 266L591 215L670 292H395Z"/>
    <path d="M430 238L461 211L485 232M520 242L546 193L570 233" stroke="#b75042"/>
    </g><path d="M312 170L396 170" stroke="#6ad6ed" stroke-width="7" stroke-dasharray="11 8"/>
    <text x="360" y="152" text-anchor="middle" fill="#f8dfac" font-size="15">YEAR 0</text>${labels('COLONY BEFORE','COUNTER-MACRO RESPONSE')}`,
  4: `<circle cx="160" cy="184" r="74" fill="#456d6d" stroke="#e0cd9a" stroke-width="6"/>
    <path d="M103 156Q170 127 205 193M102 198Q169 218 219 170" stroke="#91bca6" stroke-width="16" fill="none"/>
    <ellipse cx="160" cy="184" rx="116" ry="38" fill="none" stroke="#ad3d46" stroke-width="10" transform="rotate(-18 160 184)"/>
    <path d="M402 227L455 227L488 182L548 182L580 130L643 130" stroke="#d5bb8f" stroke-width="15" fill="none"/>
    <g fill="#9b3940" stroke="#d8c2a8" stroke-width="2"><rect x="398" y="205" width="51" height="45"/><rect x="483" y="159" width="52" height="45"/><rect x="580" y="109" width="63" height="44"/></g>
    <path d="M411 262H654" stroke="#ba4146" stroke-width="8" stroke-dasharray="17 7"/>
    ${labels('FALLENSTAR PRIME','GATHER · REFINE · EXTRUDE')}`,
  5: `<g fill="#2d3e53" stroke="#bda574" stroke-width="4">
    <circle cx="176" cy="176" r="107"/><circle cx="176" cy="176" r="70"/><circle cx="176" cy="176" r="34"/>
    </g><path d="M176 69V282M68 176H284" stroke="#779bb4" stroke-width="3"/>
    <g fill="#b44443" stroke="#b99b71" stroke-width="2">
    <rect x="410" y="89" width="37" height="165"/><rect x="467" y="129" width="37" height="125"/><rect x="524" y="99" width="37" height="155"/><rect x="581" y="164" width="37" height="90"/>
    </g><g stroke="#91cadd" stroke-width="3" fill="none"><path d="M421 76L610 76"/><path d="M428 267L642 267"/></g>
    <text x="529" y="294" text-anchor="middle" fill="#c7c0b0" font-size="13">TOTALS: UNKNOWN</text>
    ${labels('CAMPAIGN DRUM','113 YEARS OF ATTRITION')}`,
  6: `<circle cx="187" cy="167" r="85" fill="#171725" stroke="#a47f99" stroke-width="11"/>
    <path d="M103 169A85 85 0 0 0 271 169" stroke="#b65f63" stroke-width="10" fill="none"/>
    <path d="M99 240L183 185L267 240" stroke="#d9c6a1" stroke-width="8" fill="none"/>
    <path d="M400 95L641 258M421 274L610 111" stroke="#b8535a" stroke-width="8" stroke-dasharray="15 12"/>
    <g fill="#d2bc93"><circle cx="428" cy="118" r="15"/><circle cx="504" cy="160" r="14"/><circle cx="575" cy="215" r="12"/></g>
    <rect x="440" y="265" width="165" height="27" fill="#4a3542" stroke="#c7b88e" stroke-width="3"/>
    ${labels('PHAROS · YEAR 121','PLAN / ATTRITION')}`,
  7: `<path d="M67 269L150 81L254 269Z" fill="#354659" stroke="#a9c2cf" stroke-width="7"/>
    <path d="M109 236L151 112L199 236" fill="none" stroke="#69d7e9" stroke-width="12"/>
    <path d="M244 152L405 235" stroke="#5de2f2" stroke-width="11" stroke-dasharray="10 9"/>
    <g fill="#922f43" stroke="#d6afa8" stroke-width="2">${Array.from({length:20},(_,i)=>{const x=414+(i%5)*50,y=98+Math.floor(i/5)*54;return `<circle cx="${x}" cy="${y}" r="14"/><ellipse cx="${x}" cy="${y}" rx="20" ry="6" fill="none" stroke="#b64c58" stroke-width="3"/>`}).join('')}</g>
    ${labels('AUREAL GATE · YEAR 170','TWENTY CONQUERED WORLDS')}`,
  8: `<g fill="#efd7a5"><circle cx="146" cy="182" r="55"/><circle cx="249" cy="140" r="25"/></g>
    <path d="M171 182Q264 205 357 182" stroke="#69dcf1" stroke-width="6" stroke-dasharray="12 8" fill="none"/>
    <g fill="#070d17" stroke="#8797ab" stroke-width="6"><circle cx="451" cy="181" r="42"/><circle cx="552" cy="131" r="25"/><circle cx="608" cy="223" r="22"/></g>
    <g stroke="#626f85" stroke-width="4" stroke-dasharray="8 5"><path d="M444 138L546 111L610 199L458 225Z" fill="none"/></g>
    <path d="M362 88V280" stroke="#c7a471" stroke-width="3" stroke-dasharray="7 7"/>
    ${labels('MODEL STAR · BEFORE PULL','COLLAPSE / CONTAINMENT')}`,
  9: `<g fill="#080f19" stroke="#798ba5" stroke-width="7"><circle cx="126" cy="114" r="25"/><circle cx="251" cy="104" r="25"/><circle cx="126" cy="248" r="25"/><circle cx="251" cy="245" r="25"/></g>
    <g stroke="#66778e" stroke-width="5" fill="none"><path d="M126 114L251 104L251 245L126 248Z"/></g>
    <rect x="381" y="91" width="275" height="195" fill="#1d283b" stroke="#b8a889" stroke-width="5"/>
    <g fill="#b6bbc2"><circle cx="416" cy="136" r="2"/><circle cx="610" cy="136" r="2"/><circle cx="560" cy="240" r="3"/></g>
    <path d="M400 225L640 142" stroke="#03070d" stroke-width="29" stroke-linecap="round"/>
    ${labels('SIEGE WALL SCHEMATIC','INHABITED-SKY VIEW')}`,
  10: `<path d="M49 274L103 232L171 252L221 212L308 268H49Z" fill="#7b7971" stroke="#b7ae9c" stroke-width="4"/>
    <path d="M70 210L120 188L172 215L235 189L288 205" stroke="#9c9686" fill="none" stroke-width="4"/>
    <g stroke="#c4d5cf" stroke-width="5" fill="#a3b4ae"><path d="M474 118V275Q474 299 500 299H567Q593 299 593 275V118"/><ellipse cx="533" cy="118" rx="59" ry="14"/></g>
    <path d="M480 262Q535 242 588 260V281H480Z" fill="#36352e"/>
    <path d="M531 255V212M532 228L519 217M533 243L549 229" stroke="#72a56b" stroke-width="5" stroke-linecap="round"/>
    ${labels('NACREOUS VI · LEVEL 3','GLASS CYLINDER / WHEAT')}`,
  11: `<rect x="75" y="105" width="219" height="140" fill="#243445" stroke="#bda374" stroke-width="5"/>
    <path d="M93 148H272M93 190H272" stroke="#70cfdf" stroke-width="6" stroke-dasharray="18 13"/>
    <path d="M180 105V244" stroke="#aa4248" stroke-width="12"/>
    <path d="M392 185H470L505 122L544 255L584 185H659" stroke="#5bbbd6" stroke-width="8" fill="none"/>
    <path d="M531 124L531 254" stroke="#a9cebe" stroke-width="17" stroke-linecap="round"/>
    <path d="M398 271H658" stroke="#b89d76" stroke-width="3"/>
    ${labels('CONTAINMENT / HARM','SYRIN-BLOOD DEAD-SWITCH')}`,
};

export function getLaterDiagram(index: number): string {
  if (!Number.isInteger(index) || index < 3 || index > 11) throw new RangeError('not a later folio');
  return border + art[index];
}
