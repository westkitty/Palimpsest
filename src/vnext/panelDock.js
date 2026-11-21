/**
 * PALIMPSEST floating instrumentation.
 * UI-only session layout; never touches the historical folio, audio or discovery state.
 * Pointer Events work for mouse, pen and touch. Keyboard: arrows, Shift+arrows, Home.
 */
const LAYOUT_KEY = 'palimpsest.folio.review.panel-layout.v1';
const root = document.getElementById('window-layer');
const panels = root ? [...root.querySelectorAll('[data-panel-id]')] : [];
const reset = document.getElementById('reset-panels');
const visibility = document.getElementById('toggle-panels');
const layoutTools = document.getElementById('layout-tools');
const active = new Map();
const minInset = 8;
let front = 30;
// A book-first arrival is intentional, including after reloads: panel positions
// persist, but panel visibility does not. The chevron is the only initial UI.
let hidden = true;
let stored = {};
try {
  const parsed = JSON.parse(sessionStorage.getItem(LAYOUT_KEY) || '{}');
  if (parsed && parsed.version === 1 && typeof parsed.panels === 'object' && parsed.panels !== null) {
    stored = parsed.panels;
  }
} catch { /* Private browsing and unavailable session storage are valid. */ }
function frame() {
  return root?.getBoundingClientRect() || { x: 0, y: 0, width: innerWidth, height: innerHeight };
}
function bound(value, min, max) {
  return Math.max(min, Math.min(Math.max(min, max), value));
}
function place(panel, x, y) {
  const r = frame();
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const maxX = Math.max(minInset, r.width - width - minInset);
  const maxY = Math.max(minInset, r.height - height - minInset);
  const left = bound(Math.round(x), minInset, maxX);
  const top = bound(Math.round(y), minInset, maxY);
  panel.style.left = left + 'px';
  panel.style.top = top + 'px';
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
  panel.dataset.moved = 'true';
}
function save() {
  const r = frame();
  const values = {};
  for (const panel of panels) {
    const id = panel.dataset.panelId;
    const box = panel.getBoundingClientRect();
    values[id] = {
      x: bound((box.left-r.left) / Math.max(1,r.width), 0, 1),
      y: bound((box.top-r.top) / Math.max(1,r.height), 0, 1),
      folded: panel.classList.contains('is-folded'),
    };
  }
  try { sessionStorage.setItem(LAYOUT_KEY, JSON.stringify({version:1,panels:values})); }
  catch { /* Never block controls for a storage refusal. */ }
}
function raise(panel) { panel.style.zIndex = String(++front); }
function fold(panel, yes, persist=true) {
  const body = panel.querySelector('[data-panel-content]');
  const trigger = panel.querySelector('[data-panel-fold]');
  if (!body || !trigger) return;
  panel.classList.toggle('is-folded', yes);
  body.hidden = yes;
  trigger.setAttribute('aria-expanded', String(!yes));
  trigger.setAttribute('aria-label', yes ? 'Expand this panel' : 'Collapse this panel');
  trigger.textContent = yes ? '+' : '\u2212';
  if (panel.dataset.moved === 'true') {
    const rect=panel.getBoundingClientRect(), r=frame();
    place(panel,rect.left-r.left,rect.top-r.top);
  }
  if (persist) save();
}
function defaultPlacement(panel) {
  panel.style.left = ''; panel.style.top = '';
  panel.style.right = ''; panel.style.bottom = '';
  delete panel.dataset.moved;
}
function restoreDefaults() {
  try { sessionStorage.removeItem(LAYOUT_KEY); } catch {}
  stored = {};
  for (const panel of panels) {
    defaultPlacement(panel);
    fold(panel, panel.dataset.mobileFold === 'true' && matchMedia('(max-width:700px)').matches, false);
    panel.style.zIndex = '';
  }
  front=30;
  for (const panel of panels) { // Convert CSS placement to clamped absolute pixel placement.
    const r=panel.getBoundingClientRect(), f=frame();
    place(panel,r.left-f.left,r.top-f.top);
  }
}
function setVisible(value) {
  hidden = !value;
  root?.classList.toggle('panels-hidden', hidden);
  layoutTools?.classList.toggle('controls-expanded', value);
  if (visibility) {
    visibility.setAttribute('aria-expanded', String(value));
    visibility.setAttribute('aria-label', value ? 'Collapse book controls' : 'Expand book controls');
    visibility.title = value ? 'Collapse book controls' : 'Expand book controls';
  }
  // Hidden panels are removed from keyboard navigation by display:none;
  // restore focus to the always-visible opener if collapse was requested.
  if (!value && root?.contains(document.activeElement)) visibility?.focus();
}
function moveKey(event, panel) {
  const delta = event.shiftKey ? 36 : 12;
  const direction = {ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]}[event.key];
  if (event.key === 'Home') {
    event.preventDefault(); event.stopPropagation();
    defaultPlacement(panel);
    const r=panel.getBoundingClientRect(), f=frame();
    place(panel,r.left-f.left,r.top-f.top);
    raise(panel); save(); return;
  }
  if (!direction) return;
  event.preventDefault(); event.stopPropagation();
  const rect=panel.getBoundingClientRect(), r=frame();
  place(panel, rect.left-r.left+direction[0], rect.top-r.top+direction[1]);
  raise(panel); save();
}
// Briefly measure normal panel geometry synchronously before hiding the UI.
// The HTML hides it before JS arrives; no browser paint occurs during this task.
root?.classList.remove('panels-hidden');
for (const panel of panels) {
  const handle=panel.querySelector('[data-panel-handle]');
  if (!handle) continue;
  handle.addEventListener('keydown', e=>moveKey(e,panel));
  panel.addEventListener('pointerdown',()=>raise(panel));
  const saved = stored[panel.dataset.panelId];
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    fold(panel, Boolean(saved.folded), false);
    place(panel, saved.x*frame().width, saved.y*frame().height);
  } else {
    fold(panel, panel.dataset.mobileFold==='true' && matchMedia('(max-width:700px)').matches, false);
    const initial=panel.getBoundingClientRect(), r=frame();
    place(panel,initial.left-r.left,initial.top-r.top);
  }
  panel.querySelector('[data-panel-fold]')?.addEventListener('click',()=> {
    raise(panel); fold(panel,!panel.classList.contains('is-folded'));
  });
  handle.addEventListener('pointerdown',event=>{
    if (event.button!==0 || active.has(panel)) return;
    event.preventDefault();event.stopPropagation();raise(panel);
    const box=panel.getBoundingClientRect(), r=frame();
    const track={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:box.left-r.left,y:box.top-r.top};
    active.set(panel,track);
    panel.classList.add('is-dragging');
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove',event=>{
    const drag=active.get(panel);if(!drag||drag.id!==event.pointerId)return;
    event.preventDefault();
    place(panel,drag.x+event.clientX-drag.startX,drag.y+event.clientY-drag.startY);
  });
  const stop=event=>{
    const drag=active.get(panel);if(!drag||drag.id!==event.pointerId)return;
    active.delete(panel);panel.classList.remove('is-dragging');
    try {if(handle.hasPointerCapture(drag.id))handle.releasePointerCapture(drag.id);}catch{}
    save();
  };
  handle.addEventListener('pointerup',stop);
  handle.addEventListener('pointercancel',stop);
  handle.addEventListener('lostpointercapture',stop);
}
reset?.addEventListener('click',()=>{setVisible(true);restoreDefaults();});
visibility?.addEventListener('click',()=>setVisible(hidden));
// Establish the book-only first frame even when old layout state was saved.
setVisible(false);
window.addEventListener('resize',()=>{
  const f=frame();
  for(const panel of panels){
    const r=panel.getBoundingClientRect();
    place(panel,r.left-f.left,r.top-f.top);
  }
});
window.addEventListener('pageshow',()=>{ // browser back/forward viewport may have changed
  const f=frame();
  for(const panel of panels){const r=panel.getBoundingClientRect();place(panel,r.left-f.left,r.top-f.top);}
});
export const panelLayout = { reset:restoreDefaults, hide:()=>setVisible(false), show:()=>setVisible(true) };
