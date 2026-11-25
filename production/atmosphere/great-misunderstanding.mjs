export const misunderstandingTitle = 'The Great Misunderstanding';
export const misunderstandingActions = ['Open the Egg', 'Raise the Temple', 'Lift the Roof'];
export const misunderstandingDescription = 'A dark Egg lands above a paper world. A temple rises around it. Lift its roof to examine a cross-section of the changing ground.';

export const misunderstandingFallback = `<article id="misunderstanding-fallback" hidden>
  <h3>F04 · The Great Misunderstanding</h3>
  <p>A dark Egg lands. The temple represents the inhabitants’ response to its arrival.</p>
  <svg viewBox="0 0 400 180" role="img" aria-labelledby="misunderstanding-diagram-title" style="height:auto;max-height:12rem">
    <title id="misunderstanding-diagram-title">Paper teaching plate showing the Egg, the temple and the cross-section under its roof.</title>
    <path fill="#bca67c" d="M20 125 200 85 380 125 200 163Z"/>
    <g id="misunderstanding-diagram-soil" style="display:none">
      <path fill="#68433d" d="M115 120H285V147H115Z"/>
      <path fill="none" stroke="#d59065" stroke-width="3" d="M117 134Q151 148 201 121Q241 150 283 132"/>
    </g>
    <g id="misunderstanding-diagram-egg" style="display:none"><ellipse fill="#302d35" cx="200" cy="103" rx="17" ry="24"/></g>
    <g id="misunderstanding-diagram-temple" style="display:none">
      <path fill="#9a6551" d="M119 124V76H133V124ZM162 124V76H174V124ZM226 124V76H238V124ZM267 124V76H281V124Z"/>
      <path id="misunderstanding-diagram-roof" fill="#546761" d="m109 79 91-34 91 34z"/>
    </g>
  </svg>
  <p id="misunderstanding-fallback-state"></p>
</article>`;

// Uses the same book-local coordinates and tracked paper-label textures as the source spreads.
export function createMisunderstandingScene(T, page, label) {
  function stock(color) {
    return new T.Material({color, roughness: .94, side: 2});
  }
  const vellum = stock(0xe4d4ab);
  const exposedEdge = stock(0xc9a673);
  const clay = stock(0xa2624b);
  const moss = stock(0x5d7363);
  const seam = stock(0xc48761);
  const eggInk = stock(0x25242c);
  const baseInk = stock(0x583c36);
  const ground = stock(0x886049);
  const toolInk = stock(0x263e43);
  const terrace = stock(0xa7a482);
  const terrainInk = stock(0x737b62);
  const cutShadow = stock(0x473d39);
  const scoreInk = stock(0xb39770);

  function hinge(parent, name, x, y, z) {
    const group = new T.Group();
    group.name = name;
    group.position.set(x,y,z);
    parent.add(group);
    return group;
  }

  function piece(parent, geometry, material, x, y, z) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function block(parent, material, width, height, depth, x, y, z) {
    return piece(parent,new T.Box(width,height,depth),material,x,y,z);
  }

  const root = hinge(page,'F04 · The Great Misunderstanding',0,.3,0);
  for (let layer = 0; layer < 5; layer++) {
    block(root, layer % 2 ? exposedEdge : vellum, 6.35-layer*.18, .037, 3.25-layer*.1, 0, layer*.037, -.5);
  }
  for (const x of [-2.65,-2.24,2.24,2.65]) {
    const fields = block(root,moss,.15,.018,2.36,x,.19,-.56);
    fields.rotation.y = x*.12;
  }
  // A layered circular world plate makes the landing legible from the book's
  // resting camera without depicting any unapproved life or geography.
  for (let layer = 0; layer < 5; layer++) {
    const disc = piece(root,new T.Sphere(1,32,12),
      [cutShadow,exposedEdge,moss,terrace,vellum][layer],0,.16+layer*.026,-.52);
    disc.scale.set(1.09-layer*.075,.015,1.09-layer*.075);
  }
  for (let arc = 0; arc < 18; arc++) {
    const angle = arc*Math.PI/9;
    const meridian = block(root,scoreInk,.016,.012,.26,
      Math.cos(angle)*.78,.31,Math.sin(angle)*.78-.52);
    meridian.rotation.y = -angle;
  }
  for (const side of [-1,1]) {
    const relief = hinge(root,'Stacked die-cut contour lines',side*2.15,.19,-.94);
    relief.rotation.y = side*.24;
    for (let layer=0; layer<5; layer++) {
      const die = new T.Shape();
      const outline = [[-.68,.38],[-.55,-.25],[-.27,-.56],[.14,-.6],[.57,-.29],[.65,.1],[.35,.44],[-.19,.51]];
      outline.forEach(([x,y],index)=>die[index?'lineTo':'moveTo'](x,y));
      die.closePath();
      const contour = piece(relief,new T.Paper(die),layer%2?terrainInk:terrace,0,.018+layer*.03,0);
      contour.rotation.x = -Math.PI/2;
      contour.scale.setScalar(1-layer*.14);
    }
  }
  const soil = hinge(root,'Die-cut earth cross-section',0,.23,.28);
  for (let layer=0; layer<6; layer++) {
    const cut = block(soil,[ground,exposedEdge,baseInk,clay,ground,moss][layer],3.25-layer*.065,.074,1.06,0,.074*layer,0);
    cut.rotation.y = (layer-2)*.013;
  }
  // The roof reveals a tangible cut through stacked stock. Pale scored seams
  // and dark openings remain attached to the same soil block as it rises.
  for (let seamIndex=0; seamIndex<4; seamIndex++) {
    const height=.12+seamIndex*.073;
    const seamLine=block(soil,seam,.022,.015,1.09,
      -.92+seamIndex*.61,height,.56);
    seamLine.rotation.z=(seamIndex%2?1:-1)*.28;
    block(soil,cutShadow,.14,.054,.033,
      -.63+seamIndex*.45,height+.055,.57);
  }
  const groundCover = hinge(root,'Hinged upper ground veneer',0,.68,-.25);
  block(groundCover,moss,3.5,.045,1.31,0,0,.56);
  block(groundCover,exposedEdge,3.5,.035,.09,0,-.033,1.18);
  for (let score=0; score<9; score++) {
    block(groundCover,terrainInk,.015,.012,.4,-1.46+score*.36,.031,.61);
  }
  for (const x of [-1.42,1.42]) {
    block(root,clay,.18,.08,1.23,x,.2,.33);
    block(root,exposedEdge,.11,.45,.11,x,.46,-.24);
  }
  for (let line=0; line<11; line++) {
    const cut = block(soil,line%3===0?seam:baseInk,.039,.23+line%3*.09,.027,-1.36+line*.26,.22,.55);
    cut.rotation.z = (line%2 ? 1 : -1)*(.28+line*.025);
  }

  const egg = hinge(root,'Unmarked dark Egg on a folding landing arm',0,.17,-1.43);
  const arm = block(egg,exposedEdge,.13,.1,1.31,0,0,.58);
  arm.rotation.x = -.3;
  const globe = piece(egg,new T.Sphere(.38,20,14),eggInk,0,.5,1.05);
  globe.scale.set(.83,1.32,.85);
  for (const side of [-1,1]) {
    const support=block(egg,exposedEdge,.075,.52,.075,side*.32,.25,1.07);
    support.rotation.z=side*.35;
    block(egg,clay,.31,.038,.15,side*.25,.035,1.08);
  }

  const walls = [];
  for (const side of [-1,1]) {
    const wall = hinge(root,'Creased temple wall',side*1.56,.23,-.34);
    walls.push(wall);
    const footing = block(root,clay,.26,.05,1.65,side*1.56,.19,-.34);
    footing.castShadow = false;
    for (const z of [-.66,0,.66]) {
      block(wall,exposedEdge,.15,.85,.18,0,.42,z);
      block(wall,vellum,.26,.085,.3,0,.77,z);
      block(wall,clay,.21,.09,.24,0,.075,z);
    }
    for (const z of [-.88,.88]) {
      const corner=block(wall,vellum,.15,.59,.08,0,.43,z);
      corner.rotation.x=z<0?-.13:.13;
    }
    block(wall,clay,.19,.13,1.7,0,.82,0);
    block(wall,vellum,.25,.04,1.79,0,.92,0);
  }

  const roof = hinge(root,'Liftable folded roof on rear paper hinge',0,1.16,-1.16);
  for (const side of [-1,1]) {
    const panel = hinge(roof,'Scored roof leaf',0,.3,.85);
    panel.rotation.z = -side*.19;
    block(panel,moss,1.78,.067,1.89,side*.84,0,0);
    block(panel,exposedEdge,1.78,.034,.065,side*.84,-.035,.955);
    for (let rib=0;rib<8;rib++) block(panel,seam,.018,.025,1.82,side*(.12+rib*.201),.039,0);
  }
  block(roof,clay,.075,.095,1.92,0,.31,.85);
  for (const side of [-1,1]) {
    const hingePin=block(roof,exposedEdge,.18,.09,.11,side*1.4,.08,.02);
    hingePin.rotation.z=side*.18;
  }
  const braces = [-1,1].map(side=>{
    const brace = hinge(root,'Roof lifting paper brace',side*1.46,.22,-1.09);
    block(brace,vellum,.1,1.08,.12,0,.52,0);
    return brace;
  });

  label(page,'THE GREAT',-2.02,.25,2.24,2.48,true);
  label(page,'MISUNDERSTANDING',2.02,.25,2.24,2.48,true);
  const targets = ['A','B','C'].map((slot,index)=>{
    const x = (index-1)*1.78;
    const target = block(root,toolInk,1.5,.085,.47,x,.06,1.51);
    target.userData.slot = slot;
    label(root,['A · EGG','B · TEMPLE','C · ROOF'][index],x,.111,1.51,1.46,true);
    return target;
  });
  let position = [0,0,0];
  return {
    root,
    targets,
    update(state, dt, reduce) {
      const aims = [Number(state.eggLanded),Number(state.templeRaised),Number(state.roofLifted)];
      const weight = reduce ? 1 : 1-Math.exp(-Math.min(dt,.07)*7);
      position = position.map((current,index)=>current+(aims[index]-current)*weight);
      const [landing,temple,lift] = position;
      egg.rotation.x = -1.12*(1-landing);
      egg.scale.setScalar(.02+.98*landing);
      walls.forEach((wall,index)=>{wall.rotation.z=(index===0?1:-1)*1.49*(1-temple);});
      roof.visible = temple>.07;
      roof.scale.setScalar(Math.max(.02,temple));
      roof.position.y = .24+.92*temple;
      roof.rotation.x = -1.03*lift;
      soil.scale.y = .02+.98*lift;
      groundCover.rotation.x = -.92*lift;
      braces.forEach(brace=>{brace.rotation.x=-1.42*(1-lift);brace.visible=temple>.1;});
    },
  };
}
