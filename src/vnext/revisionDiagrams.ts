// Living-only non-WebGL editorial plates. Archive SVG and source copy remain independent.
const frame='<rect x="18" y="18" width="684" height="354" rx="10" fill="#172435" stroke="#b49a70" stroke-width="4"/>';
const caption=(x:number,y:number,copy:string)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#e8dbc1" font-size="17" font-family="Georgia, serif">${copy}</text>`;
export function revisionDiagram(index:number,active:boolean):string|undefined {
  if(index===7)return frame+`<circle cx="245" cy="166" r="95" fill="${active?'#285b72':'#152434'}" stroke="#86c3d0" stroke-width="12"/>`+
    (active?'<path d="M181 191Q296 71 321 153Q270 248 179 173" fill="none" stroke="#71e9ef" stroke-width="9"/>':'')+
    '<path d="M470 157v91m-25 0h50m-25-138v24" stroke="#cbbb96" stroke-width="14"/>'+caption(245,309,'CIRCULAR HOOKSHOT PORTAL')+caption(470,283,'MARCEL');
  if(index===8)return frame+
    '<path d="M359 57v246" stroke="#9b8160" stroke-width="4"/><g fill="#d1c3a4"><circle cx="479" cy="129" r="7"/><circle cx="571" cy="182" r="10"/><circle cx="514" cy="225" r="5"/></g>'+
    (active?
      '<path d="M90 133l90-54 103 21 44 94-63 61-111 10-83-46z" fill="#10131a" stroke="#5b5142" stroke-width="7"/><path d="M97 148l48 19-22 69 41-30 20 42 35-45 69 22-41-61 37-47-64 18-29-28-31 28z" fill="#7e7864"/><path d="M142 168l50-49 50 28 11 54-68 27-40-32z" fill="#07080b"/>'+
      caption(199,310,'DESTROYED MODEL AND MOUNT'):
      '<circle cx="199" cy="177" r="78" fill="none" stroke="#a59980" stroke-width="9"/><ellipse cx="199" cy="177" rx="93" ry="53" fill="none" stroke="#a59980" stroke-width="6" transform="rotate(-27 199 177)"/><circle cx="199" cy="177" r="43" fill="#9cd3cf"/>'+caption(199,310,'MODEL STAR'))+
    caption(523,310,'HISTORICAL WITNESS');
  if(index===10){
    const xs=[145,360,575], labels=['CODEC AT WORK','MARCEL · LIVING LOAM','PAPER JUNGLE · THEN TIGER'];
    return frame+xs.map((x,i)=>`<rect x="${x-101}" y="65" width="202" height="187" rx="8" fill="${i===2?'#254f48':'#433c36'}"/>`+caption(x,288,labels[i])).join('')+
      '<path d="M136 205v-58m225 48v-62m-27 69h55m136 27q20-65 52-112m-4 114q18-58 57-110" fill="none" stroke="#c4d09c" stroke-width="9"/>'+
      caption(360,329,'THEATRE OF POSSIBILITY · NOT PLANETARY RECOVERY');
  }
  if(index===11)return frame+
    '<rect x="71" y="87" width="137" height="118" fill="#304c62"/><rect x="231" y="87" width="137" height="118" fill="#553b48"/><rect x="409" y="62" width="231" height="187" fill="#344858" stroke="#d4bb8e" stroke-width="4"/><circle cx="525" cy="141" r="46" fill="none" stroke="#dcbe82" stroke-width="5"/>'+
    caption(139,246,'CONTAINMENT')+caption(299,246,'HARM')+caption(525,219,'SERVICE ROLES')+caption(525,291,'ADMINISTRATION ENDORSEMENT');
}
