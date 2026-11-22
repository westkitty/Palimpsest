// Living-only spread stock from the selected Blender references (sRGB).
// Loose evidence cards, mechanisms, scenery, covers and Archive keep their own ink.
type PaperStock = Readonly<{face:number; edge:number; cut:number}>;
const ivory = { face:0xf0e6d2, edge:0xfaf0db, cut:0xc7baa1 };
const vellum = { face:0xf6f3ea, edge:0xfaf7ee, cut:0xc7c3b6 };
const soaked = { face:0x181c22, edge:0x252b34, cut:0x13171e };
const dyed = (face:number,edge:number,cut:number):PaperStock=>({face,edge,cut});
const stock:readonly PaperStock[] = [
  ivory, vellum,
  dyed(0x1f2430,0x373d4a,0x171b24), // F03 Notebook
  dyed(0x22292f,0x373f46,0x191e23), // F04 Contact
  dyed(0x191619,0x392a32,0x151015), // F05 Conquest
  dyed(0x242932,0x3c414d,0x1b202a), // F06 Attrition
  dyed(0x362c33,0x44383f,0x22292f), // F07 Ruby Eclipse
  dyed(0x191d22,0x35414b,0x13171d), // F08 Aureal Gate
  dyed(0x24282f,0x3a4552,0x191e26), // F09 Heliocide
  dyed(0x22292f,0x36424c,0x171d23), // F10 Siege Wall
  dyed(0x1d1d1e,0x393536,0x161617), // F11 First Dirt
  dyed(0x292b30,0x3a4049,0x1d2027), // F12 Unfinished Peace
  dyed(0x292b30,0x3a4049,0x1d2027), // ivory imprint on the same binding stock
];
export const folioStock=(index:number,f02Soaked=false):PaperStock=>
  index===1&&f02Soaked?soaked:(stock[index]??ivory);
export const isDarkStock=(paper:PaperStock):boolean=>paper.face<0x808080;
export const cssStock=(color:number):string=>'#'+color.toString(16).padStart(6,'0');
