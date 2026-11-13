import {
  ATLAS_PROLOGUE,
  CHRONICLE_SCRIPTS,
  DialogueTurn,
  MERIDIAN_FINALE_DIALOGUE,
} from '../story/chronicleScripts';
import { atlasStore } from '../state/atlasStore';
import { WorldId } from '../types/atlas';
import { soundEngine } from './SoundEngine';

export type GeminiNarratorVoiceId = 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr' | 'Puck';

export interface NarratorPersona {
  id: GeminiNarratorVoiceId;
  label: string;
  role: string;
  style: string;
}

export const NARRATOR_PERSONAS: NarratorPersona[] = [
  {
    id: 'Charon',
    label: 'Aldous · Elder Cartographer',
    role: 'Deep, warm baritone storyteller',
    style: 'Warm, resonant, measured antiquarian storyteller in a candlelit study',
  },
  {
    id: 'Kore',
    label: 'Lyra · Senior Archivist',
    role: 'Luminous, articulate chronicler',
    style: 'Warm, expressive, clear literary narrator with gentle wonder',
  },
  {
    id: 'Fenrir',
    label: 'Aldous · Sea-Worn Voyager',
    role: 'Gravelly, dramatic explorer',
    style: 'Rich, weathered adventurer recounting a perilous voyage by lantern light',
  },
  {
    id: 'Zephyr',
    label: 'Lyra · Astral Chronicler',
    role: 'Crisp, lyrical celestial tone',
    style: 'Airy, poetic storyteller filled with quiet awe and precision',
  },
  {
    id: 'Puck',
    label: 'Pip · Apprentice Binder',
    role: 'Lively, curious companion',
    style: 'Spirited, bright young apprentice marveling at living ink',
  },
];

interface QueuedNarrationBlock {
  text: string;
  lines: string[];
  lineSpeakers?: string[];
  label: string;
  worldId: WorldId;
  multiSpeaker?: {
    speakers: { speaker: string; voiceName: string }[];
    turns: DialogueTurn[];
  };
}

/**
 * Computes normalized cumulative progress breakpoints [0..1] for each sentence
 * inside a combined spoken paragraph so live subtitles track spoken audio cleanly
 * while requiring only ONE Gemini TTS synthesis call per chapter/block.
 */
function buildLineBreakpoints(lines: string[]): number[] {
  if (lines.length <= 1) return [1];
  const weights = lines.map((line) => Math.max(12, line.trim().length));
  const total = weights.reduce((acc, w) => acc + w, 0);
  const breaks: number[] = [];
  let running = 0;
  for (const w of weights) {
    running += w;
    breaks.push(running / total);
  }
  breaks[breaks.length - 1] = 1;
  return breaks;
}

/**
 * Gemini 3.8 TTS voiced narration client with paragraph-level synthesis
 * (conserving Free Tier RPM quota), client Blob caching, cooldown back-off,
 * ambient ducking, and synchronized sentence-by-sentence live captions.
 */
export class NarrationEngine {
  private queue: QueuedNarrationBlock[] = [];
  private cursor = 0;
  private subLineCursor = 0;
  private active = false;
  private paused = false;
  private selectedVoiceId: GeminiNarratorVoiceId =
    (NARRATOR_PERSONAS.some((p) => p.id === atlasStore.getSnapshot().narratorVoiceId)
      ? (atlasStore.getSnapshot().narratorVoiceId as GeminiNarratorVoiceId)
      : 'Charon');
  private playbackToken = 0;

  private activeAudio: HTMLAudioElement | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private rateLimitCooldownUntil = 0;

  // In-memory Blob URL cache keyed by persona/dialogue signature + deduped in-flight fetches
  private clipUrlCache = new Map<string, string>();
  private inFlightClips = new Map<string, Promise<string | null>>();

  public getPersonas(): NarratorPersona[] {
    return NARRATOR_PERSONAS;
  }

  public getSelectedVoiceId(): GeminiNarratorVoiceId {
    return this.selectedVoiceId;
  }

  public setSelectedVoiceId(voiceId: GeminiNarratorVoiceId): void {
    if (NARRATOR_PERSONAS.some((p) => p.id === voiceId)) {
      this.selectedVoiceId = voiceId;
      atlasStore.setNarratorVoiceId(voiceId);
    }
  }

  private getCurrentPersona(): NarratorPersona {
    return (
      NARRATOR_PERSONAS.find((p) => p.id === this.selectedVoiceId) ??
      NARRATOR_PERSONAS[0]
    );
  }

  public narratePrologueAndChapter(worldId: WorldId): void {
    const snap = atlasStore.getSnapshot();
    if (snap.audioMuted || !snap.narrationEnabled) return;
    const script = CHRONICLE_SCRIPTS[worldId];
    const items: QueuedNarrationBlock[] = [
      {
        text: ATLAS_PROLOGUE.join(' '),
        lines: ATLAS_PROLOGUE,
        label: 'Prologue · The Shattered Meridian',
        worldId,
      },
      {
        text: script.narrationLines.join(' '),
        lines: script.narrationLines,
        label: `Folio ${this.romanOf(worldId)} · ${script.motif}`,
        worldId,
      },
    ];
    this.playQueue(items, true);
  }

  public narrateChapter(worldId: WorldId, force = false): void {
    const snap = atlasStore.getSnapshot();
    if (snap.audioMuted) return;
    if (!force && !snap.narrationEnabled) return;
    const script = CHRONICLE_SCRIPTS[worldId];
    const items: QueuedNarrationBlock[] = [
      {
        text: script.narrationLines.join(' '),
        lines: script.narrationLines,
        label: `Folio ${this.romanOf(worldId)} · ${script.motif}`,
        worldId,
      },
    ];
    this.playQueue(items, true);
  }

  public narratePortalArrival(fromWorld: WorldId, toWorld: WorldId): void {
    const snap = atlasStore.getSnapshot();
    if (snap.audioMuted || !snap.narrationEnabled) return;
    const fromScript = CHRONICLE_SCRIPTS[fromWorld];
    const toScript = CHRONICLE_SCRIPTS[toWorld];
    const combinedLines = [fromScript.portalLine, ...toScript.narrationLines];
    const items: QueuedNarrationBlock[] = [
      {
        text: combinedLines.join(' '),
        lines: combinedLines,
        label: `Threshold · Folio ${this.romanOf(fromWorld)} → ${this.romanOf(toWorld)}`,
        worldId: toWorld,
      },
    ];
    this.playQueue(items, false);
  }

  public narrateStoryBeat(worldId: WorldId, kind: 'vault' | 'stars'): void {
    const snap = atlasStore.getSnapshot();
    if (snap.audioMuted || !snap.narrationEnabled) return;
    const script = CHRONICLE_SCRIPTS[worldId];

    if (kind === 'vault' && script.vaultDialogue.length >= 2) {
      const turns = script.vaultDialogue;
      const speakers = this.extractPairSpeakers(turns);
      this.playQueue(
        [
          {
            text: turns.map((t) => `${t.speaker}: ${t.text}`).join(' '),
            lines: turns.map((t) => t.text),
            lineSpeakers: turns.map((t) => `${t.speaker} · Vault Discovery · Folio ${this.romanOf(worldId)}`),
            label: `Vault Unsealed · Folio ${this.romanOf(worldId)}`,
            worldId,
            multiSpeaker: { speakers, turns },
          },
        ],
        false,
      );
      return;
    }

    const text = kind === 'vault' ? script.vaultLine : script.constellationLine;
    const label =
      kind === 'vault'
        ? `Vault Unsealed · Folio ${this.romanOf(worldId)}`
        : `Constellation Aligned · Folio ${this.romanOf(worldId)}`;
    this.playQueue([{ text, lines: [text], label, worldId }], false);
  }

  public narrateMeridianFinale(): void {
    const snap = atlasStore.getSnapshot();
    if (snap.audioMuted) return;
    const turns = MERIDIAN_FINALE_DIALOGUE;
    const speakers = this.extractPairSpeakers(turns);
    this.playQueue(
      [
        {
          text: turns.map((t) => `${t.speaker}: ${t.text}`).join(' '),
          lines: turns.map((t) => t.text),
          lineSpeakers: turns.map((t) => `${t.speaker} · The Restored Meridian`),
          label: 'The Final Binding · Folio X',
          worldId: 9,
          multiSpeaker: { speakers, turns },
        },
      ],
      true,
    );
  }

  private extractPairSpeakers(turns: DialogueTurn[]): { speaker: string; voiceName: string }[] {
    const seen = new Map<string, string>();
    for (const t of turns) {
      if (!seen.has(t.speaker)) {
        seen.set(t.speaker, t.voiceName);
      }
      if (seen.size === 2) break;
    }
    return Array.from(seen.entries()).map(([speaker, voiceName]) => ({ speaker, voiceName }));
  }

  public togglePlayPause(activeWorld: WorldId): void {
    const snap = atlasStore.getSnapshot();
    if (snap.audioMuted) {
      atlasStore.setAudioMuted(false);
      soundEngine.setMuted(false);
    }

    if (!this.active) {
      this.narrateChapter(activeWorld, true);
      return;
    }

    const current = this.queue[this.cursor];
    const progress = this.computeProgress(this.cursor, this.subLineCursor);
    const caption = current?.lines[this.subLineCursor] ?? current?.text ?? null;

    if (this.paused) {
      this.paused = false;
      soundEngine.setNarrationDucking(true);
      if (current) {
        atlasStore.setNarrationState('speaking', caption, current.label, progress);
      }
      if (this.activeAudio) {
        this.activeAudio.play().catch(() => {
          this.scheduleCaptionLineStep(this.playbackToken);
        });
      } else {
        this.scheduleCaptionLineStep(this.playbackToken);
      }
    } else {
      this.paused = true;
      if (this.fallbackTimer !== null) {
        globalThis.clearTimeout(this.fallbackTimer);
        this.fallbackTimer = null;
      }
      if (this.activeAudio && !this.activeAudio.paused) {
        this.activeAudio.pause();
      }
      soundEngine.setNarrationDucking(false);
      atlasStore.setNarrationState(
        'paused',
        caption,
        current?.label ?? null,
        current ? progress : null,
      );
    }
  }

  public stop(): void {
    this.playbackToken++;
    this.active = false;
    this.paused = false;
    this.queue = [];
    this.cursor = 0;
    this.subLineCursor = 0;

    if (this.fallbackTimer !== null) {
      globalThis.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.activeAudio) {
      this.activeAudio.onended = null;
      this.activeAudio.onerror = null;
      this.activeAudio.ontimeupdate = null;
      this.activeAudio.pause();
      this.activeAudio.src = '';
      this.activeAudio = null;
    }

    soundEngine.setNarrationDucking(false);
    atlasStore.setNarrationState('idle', null, null, null);
  }

  private playQueue(items: QueuedNarrationBlock[], playCue: boolean): void {
    this.stop();
    if (items.length === 0) return;

    this.queue = items;
    this.cursor = 0;
    this.subLineCursor = 0;
    this.active = true;
    this.paused = false;

    if (playCue) {
      soundEngine.playNarrationCue();
    }
    soundEngine.setNarrationDucking(true);
    void this.playCurrent();
  }

  private computeTotalLines(): number {
    return this.queue.reduce((acc, block) => acc + Math.max(1, block.lines.length), 0);
  }

  private computeProgress(blockIndex: number, subIndex: number): { line: number; total: number } {
    let prior = 0;
    for (let i = 0; i < blockIndex && i < this.queue.length; i++) {
      prior += Math.max(1, this.queue[i].lines.length);
    }
    return {
      line: prior + subIndex + 1,
      total: Math.max(1, this.computeTotalLines()),
    };
  }

  private async playCurrent(): Promise<void> {
    if (!this.active || this.paused) return;
    if (this.cursor >= this.queue.length) {
      this.stop();
      return;
    }

    const item = this.queue[this.cursor];
    this.subLineCursor = 0;
    const token = ++this.playbackToken;

    atlasStore.setNarrationState(
      'speaking',
      item.lines[0] ?? item.text,
      item.lineSpeakers?.[0] ?? item.label,
      this.computeProgress(this.cursor, 0),
    );

    if (typeof window === 'undefined' || typeof fetch !== 'function' || typeof Audio === 'undefined') {
      this.scheduleCaptionLineStep(token);
      return;
    }

    const clipUrl = await this.fetchOrGetClipUrl(item);
    if (token !== this.playbackToken || !this.active || this.paused) return;

    if (!clipUrl) {
      this.scheduleCaptionLineStep(token);
      return;
    }

    const audio = new Audio(clipUrl);
    audio.volume = 0.94;
    this.activeAudio = audio;

    const breakpoints = buildLineBreakpoints(item.lines);

    audio.ontimeupdate = () => {
      if (token !== this.playbackToken || !this.active || this.paused) return;
      const duration = audio.duration;
      if (!Number.isFinite(duration) || duration <= 0 || item.lines.length <= 1) return;

      const ratio = Math.min(0.999, Math.max(0, audio.currentTime / duration));
      let nextSub = breakpoints.findIndex((bp) => ratio < bp);
      if (nextSub === -1) nextSub = item.lines.length - 1;

      if (nextSub !== this.subLineCursor) {
        this.subLineCursor = nextSub;
        atlasStore.setNarrationState(
          'speaking',
          item.lines[nextSub] ?? item.text,
          item.lineSpeakers?.[nextSub] ?? item.label,
          this.computeProgress(this.cursor, nextSub),
        );
      }
    };

    const advanceBlock = () => {
      if (token !== this.playbackToken || !this.active || this.paused) return;
      if (this.activeAudio === audio) {
        this.activeAudio = null;
      }
      this.cursor++;
      this.subLineCursor = 0;
      void this.playCurrent();
    };

    audio.onended = advanceBlock;
    audio.onerror = () => {
      if (token !== this.playbackToken || !this.active || this.paused) return;
      this.scheduleCaptionLineStep(token);
    };

    try {
      await audio.play();
    } catch {
      if (token === this.playbackToken && this.active && !this.paused) {
        this.scheduleCaptionLineStep(token);
      }
    }
  }

  private fetchOrGetClipUrl(item: QueuedNarrationBlock): Promise<string | null> {
    const persona = this.getCurrentPersona();
    const isMulti = Boolean(item.multiSpeaker && item.multiSpeaker.speakers.length === 2);
    const cacheKey = isMulti
      ? `multi::${item.multiSpeaker!.speakers.map((s) => `${s.speaker}=${s.voiceName}`).join('|')}::${item.text}`
      : `${persona.id}::${item.text}`;

    const cached = this.clipUrlCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    // If the Free Tier RPM cooldown is active, fall back cleanly to timed captions
    if (Date.now() < this.rateLimitCooldownUntil) {
      return Promise.resolve(null);
    }

    const existing = this.inFlightClips.get(cacheKey);
    if (existing) return existing;

    const controller = new AbortController();
    this.abortController = controller;

    const task = (async (): Promise<string | null> => {
      try {
        const payload = isMulti
          ? {
              speakers: item.multiSpeaker!.speakers,
              turns: item.multiSpeaker!.turns.map((t) => ({
                speaker: t.speaker,
                text: t.text,
                style: t.style,
              })),
            }
          : {
              text: item.text,
              voiceName: persona.id,
              style: persona.style,
            };

        const res = await fetch('/api/narration/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (res.status === 204 || res.status === 429) {
          const retryHeader = res.headers.get('X-Retry-After') ?? res.headers.get('Retry-After');
          const parsedHeader = retryHeader ? Number.parseInt(retryHeader, 10) : NaN;
          let retrySec = Number.isFinite(parsedHeader) && parsedHeader > 0 ? parsedHeader : 25;
          if (res.status === 429) {
            try {
              const errBody = (await res.json()) as { retryAfterSeconds?: number };
              if (typeof errBody.retryAfterSeconds === 'number' && errBody.retryAfterSeconds > 0) {
                retrySec = errBody.retryAfterSeconds;
              }
            } catch {
              // Ignore non-JSON body
            }
          }
          this.rateLimitCooldownUntil = Date.now() + retrySec * 1000;
          return null;
        }
        if (!res.ok) return null;

        const blob = await res.blob();
        if (!blob || blob.size < 128) return null;
        const url = URL.createObjectURL(blob);
        this.clipUrlCache.set(cacheKey, url);
        return url;
      } catch {
        return null;
      } finally {
        this.inFlightClips.delete(cacheKey);
      }
    })();

    this.inFlightClips.set(cacheKey, task);
    return task;
  }

  private scheduleCaptionLineStep(token: number): void {
    if (this.fallbackTimer !== null) {
      globalThis.clearTimeout(this.fallbackTimer);
    }
    const block = this.queue[this.cursor];
    if (!block) {
      this.stop();
      return;
    }

    const lineText = block.lines[this.subLineCursor] ?? block.text;
    const words = Math.max(4, lineText.split(/\s+/).length);
    const delayMs = Math.min(8200, Math.max(3000, words * 330));

    this.fallbackTimer = globalThis.setTimeout(() => {
      this.fallbackTimer = null;
      if (token !== this.playbackToken || !this.active || this.paused) return;

      if (this.subLineCursor + 1 < block.lines.length) {
        this.subLineCursor++;
        atlasStore.setNarrationState(
          'speaking',
          block.lines[this.subLineCursor] ?? block.text,
          block.lineSpeakers?.[this.subLineCursor] ?? block.label,
          this.computeProgress(this.cursor, this.subLineCursor),
        );
        this.scheduleCaptionLineStep(token);
      } else {
        this.cursor++;
        this.subLineCursor = 0;
        void this.playCurrent();
      }
    }, delayMs);
  }

  private romanOf(worldId: WorldId): string {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[worldId] ?? 'I';
  }
}

export const narrationEngine = new NarrationEngine();
