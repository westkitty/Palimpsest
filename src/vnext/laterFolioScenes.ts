import * as THREE from 'three';
import type { FolioRuntimeState } from '../types/atlas';
import { FOLIO_BY_WORLD } from '../story/historyManifest';
import { F06_CAMPAIGN_DRAXIS_IDS } from '../story/draxisCatalog';
import { BaseFolioWorld } from '../engine/folios/BaseFolioWorld';
import { F04FolioWorld, F05FolioWorld, F06FolioWorld } from '../engine/folios/FoliosWar1';
import { F07FolioWorld, F08FolioWorld, F09FolioWorld } from '../engine/folios/FoliosWar2';
import { F10FolioWorld, F11FolioWorld, F12FolioWorld } from '../engine/folios/FoliosAftermath';
import type { LaterFolioIndex } from './laterFolioState';

/**
 * Reuses the actual nine authored physical worlds, not icon replacements.
 * The living stage owns one active folio and disposes it when turning pages.
 * The original AtlasEngine, historical state and narrator are never mounted.
 */
const classes = [
  F04FolioWorld, F05FolioWorld, F06FolioWorld,
  F07FolioWorld, F08FolioWorld, F09FolioWorld,
  F10FolioWorld, F11FolioWorld, F12FolioWorld,
] as const;

export function createLaterFolio(
  index: LaterFolioIndex,
  paper: THREE.Texture,
  shadow: THREE.Texture,
  state: FolioRuntimeState,
): BaseFolioWorld {
  const Class = classes[index - 3];
  const folio: BaseFolioWorld = new Class(index, paper, shadow);
  if (folio instanceof F12FolioWorld) folio.useLivingEdition();
  folio.build(state);
  folio.syncState(state, activeSpecimen(state), 0);
  return folio;
}

export function activeSpecimen(state: FolioRuntimeState) {
  return state.id === 5
    ? F06_CAMPAIGN_DRAXIS_IDS[state.selectedCampaignIndex % F06_CAMPAIGN_DRAXIS_IDS.length]
    : null;
}

export function getLaterCopy(index: LaterFolioIndex) {
  const m = FOLIO_BY_WORLD[index];
  return {
    title: m.code + ' — ' + m.title,
    subtitle: m.temporalMarker,
    description: m.sourceNotes.find(note => note.kind === 'source-fact')?.body ??
      m.interactions.map(action => action.textEquivalent).join(' '),
    actions: m.interactions.map(action => action.label),
    mechanicalDescriptions: m.interactions.map(action => action.textEquivalent),
    visuals: m.visualCues,
    sourcePointers: m.sourcePointers,
  };
}

export function makeContactShadow(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Shadow canvas unavailable');
  const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 63);
  gradient.addColorStop(0, 'rgba(0,0,0,0.65)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.23)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
