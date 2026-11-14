import { atlasStore } from '../state/atlasStore';
import {
  BOOK_ENDCARD_CUE,
  BOOK_PROLOGUE_CUE,
  FOLIO_BY_WORLD,
} from '../story/historyManifest';
import { CueId, CueSlot, FolioInteractionSlot, WorldId } from '../types/atlas';
import { soundEngine } from './SoundEngine';

interface QueuedNarrationBlock {
  cueId: CueId;
  lines: string[];
  label: string;
  worldId: WorldId;
  silentHoldMs?: number;
}

/**
 * Clean client-only instructional narrator engine (zero paid API calls or fabricated stems).
 * Drives synchronized verbatim cue state and optional browser-local SpeechSynthesis when available.
 */
export class NarrationEngine {
  private queue: QueuedNarrationBlock[] = [];
  private cursor = 0;
  private lineCursor = 0;
  private active = false;
  private paused = false;
  private playbackToken = 0;
  private stepTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const sy = window.speechSynthesis;
      const syncVoices = () => atlasStore.refreshNarrationCapability();
      if (typeof sy.addEventListener === 'function') {
        sy.addEventListener('voiceschanged', syncVoices);
      }
    }
  }

  public playPrologueAndFolio(worldId: WorldId): void {
    const manifest = FOLIO_BY_WORLD[worldId];
    const items: QueuedNarrationBlock[] = [
      {
        cueId: BOOK_PROLOGUE_CUE.cueId,
        lines: BOOK_PROLOGUE_CUE.paragraphs,
        label: 'Opening Prologue · Administration Instructional Edition',
        worldId,
      },
      {
        cueId: manifest.cues.OPEN.cueId,
        lines: manifest.cues.OPEN.paragraphs,
        label: `${manifest.code} · ${manifest.title} — Opening`,
        worldId,
      },
      {
        cueId: manifest.cues.LESSON.cueId,
        lines: manifest.cues.LESSON.paragraphs,
        label: `${manifest.code} · ${manifest.title} — Main Lesson`,
        worldId,
      },
    ];
    this.startQueue(items, true);
  }

  public playFolioCore(worldId: WorldId, force = false): void {
    const snap = atlasStore.getSnapshot();
    if (!force && !snap.narrationEnabled) return;
    const manifest = FOLIO_BY_WORLD[worldId];
    const items: QueuedNarrationBlock[] = [
      {
        cueId: manifest.cues.OPEN.cueId,
        lines: manifest.cues.OPEN.paragraphs,
        label: `${manifest.code} · ${manifest.title} — Opening`,
        worldId,
      },
      {
        cueId: manifest.cues.LESSON.cueId,
        lines: manifest.cues.LESSON.paragraphs,
        label: `${manifest.code} · ${manifest.title} — Main Lesson`,
        worldId,
      },
    ];
    this.startQueue(items, false);
  }

  public playCueSlot(worldId: WorldId, slot: CueSlot, force = true): void {
    const snap = atlasStore.getSnapshot();
    if (!force && !snap.narrationEnabled) return;
    const manifest = FOLIO_BY_WORLD[worldId];
    const seg = manifest.cues[slot];
    const isSilentClosing = slot === 'CLOSE' && (worldId === 10 || worldId === 11);
    this.startQueue(
      [
        {
          cueId: seg.cueId,
          lines: seg.paragraphs,
          label: `${manifest.code} · ${seg.heading}`,
          worldId,
          silentHoldMs: isSilentClosing ? 1400 : 0,
        },
      ],
      false,
    );
  }

  public playInteractionCue(worldId: WorldId, slot: FolioInteractionSlot): void {
    const manifest = FOLIO_BY_WORLD[worldId];
    const seg = manifest.cues[slot];
    const items: QueuedNarrationBlock[] = [
      {
        cueId: seg.cueId,
        lines: seg.paragraphs,
        label: `${manifest.code} [${slot}] · ${seg.heading}`,
        worldId,
      },
    ];
    // For F12 close follow-up we leave CLOSE separate so user triggers Close Volume / Endcard cleanly.
    this.startQueue(items, false);
  }

  public playClosingCue(worldId: WorldId): void {
    this.playCueSlot(worldId, 'CLOSE', true);
  }

  public playEndcard(): void {
    this.startQueue(
      [
        {
          cueId: BOOK_ENDCARD_CUE.cueId,
          lines: BOOK_ENDCARD_CUE.paragraphs,
          label: 'Closing Imprint · Administration Archival Edition',
          worldId: 11,
          silentHoldMs: 1800,
        },
      ],
      false,
    );
  }

  public togglePlayPause(activeWorld: WorldId): void {
    if (!this.active) {
      this.playFolioCore(activeWorld, true);
      return;
    }

    const current = this.queue[this.cursor];
    const progress = this.computeProgress(this.cursor, this.lineCursor);
    const caption = current?.lines[this.lineCursor] ?? null;

    if (this.paused) {
      this.paused = false;
      soundEngine.setNarrationDucking(true);
      if (current) {
        atlasStore.setNarrationState('speaking', current.cueId, caption, current.label, progress);
        this.scheduleOrSpeakCurrent(this.playbackToken);
      }
    } else {
      this.paused = true;
      this.clearTimersAndSpeech();
      soundEngine.setNarrationDucking(false);
      atlasStore.setNarrationState(
        'paused',
        current?.cueId ?? null,
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
    this.lineCursor = 0;
    this.clearTimersAndSpeech();
    soundEngine.setNarrationDucking(false);
    atlasStore.setNarrationState('idle', null, null, null, null);
  }

  private clearTimersAndSpeech(): void {
    if (this.stepTimer !== null) {
      globalThis.clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private startQueue(items: QueuedNarrationBlock[], playIntroTone: boolean): void {
    this.stop();
    if (items.length === 0) return;

    this.queue = items;
    this.cursor = 0;
    this.lineCursor = 0;
    this.active = true;
    this.paused = false;

    if (playIntroTone) {
      soundEngine.playProjectorBell();
    }
    soundEngine.setNarrationDucking(true);
    this.advanceBlock();
  }

  private computeTotalLines(): number {
    return this.queue.reduce((acc, b) => acc + Math.max(1, b.lines.length), 0);
  }

  private computeProgress(blockIndex: number, lineIndex: number): { line: number; total: number } {
    let prior = 0;
    for (let i = 0; i < blockIndex && i < this.queue.length; i++) {
      prior += Math.max(1, this.queue[i].lines.length);
    }
    return {
      line: prior + lineIndex + 1,
      total: Math.max(1, this.computeTotalLines()),
    };
  }

  private advanceBlock(): void {
    if (!this.active || this.paused) return;
    if (this.cursor >= this.queue.length) {
      this.stop();
      return;
    }

    const block = this.queue[this.cursor];
    this.lineCursor = 0;
    const token = ++this.playbackToken;
    const firstLine = block.lines[0] ?? '';

    atlasStore.setNarrationState(
      'speaking',
      block.cueId,
      firstLine,
      block.label,
      this.computeProgress(this.cursor, 0),
    );
    this.scheduleOrSpeakCurrent(token);
  }

  private scheduleOrSpeakCurrent(token: number): void {
    if (this.stepTimer !== null) {
      globalThis.clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    if (token !== this.playbackToken || !this.active || this.paused) return;

    const block = this.queue[this.cursor];
    if (!block) {
      this.stop();
      return;
    }

    const lineText = block.lines[this.lineCursor] ?? '';
    const snap = atlasStore.getSnapshot();
    const canSpeak =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      !snap.audioMuted &&
      snap.narrationEnabled &&
      (window.speechSynthesis.getVoices?.().length ?? 0) > 0;

    const cleanSpeechText = lineText.replace(/\*/g, '');
    const wordCount = Math.max(5, cleanSpeechText.split(/\s+/).length);
    const readingMs = Math.min(9500, Math.max(2800, wordCount * 420));

    const moveToNext = () => {
      if (token !== this.playbackToken || !this.active || this.paused) return;
      if (this.lineCursor + 1 < block.lines.length) {
        this.lineCursor++;
        const nextLine = block.lines[this.lineCursor] ?? '';
        atlasStore.setNarrationState(
          'speaking',
          block.cueId,
          nextLine,
          block.label,
          this.computeProgress(this.cursor, this.lineCursor),
        );
        this.scheduleOrSpeakCurrent(token);
      } else {
        const holdMs = block.silentHoldMs ?? 0;
        if (holdMs > 0) {
          this.stepTimer = globalThis.setTimeout(() => {
            this.stepTimer = null;
            if (token !== this.playbackToken || !this.active || this.paused) return;
            this.cursor++;
            this.lineCursor = 0;
            this.advanceBlock();
          }, holdMs);
        } else {
          this.cursor++;
          this.lineCursor = 0;
          this.advanceBlock();
        }
      }
    };

    if (canSpeak) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(cleanSpeechText);
        utter.rate = 0.92;
        utter.pitch = 0.95;
        utter.volume = 0.85;
        let finished = false;
        const finishOnce = () => {
          if (finished) return;
          finished = true;
          if (this.stepTimer !== null) {
            globalThis.clearTimeout(this.stepTimer);
            this.stepTimer = null;
          }
          moveToNext();
        };
        utter.onend = finishOnce;
        utter.onerror = finishOnce;
        window.speechSynthesis.speak(utter);
        // Safety deadline in case a headless browser stalls speechSynthesis callbacks
        this.stepTimer = globalThis.setTimeout(finishOnce, readingMs + 2500);
        return;
      } catch {
        // Fall through cleanly to reading-pace stepping
      }
    }

    this.stepTimer = globalThis.setTimeout(() => {
      this.stepTimer = null;
      moveToNext();
    }, readingMs);
  }
}

export const narrationEngine = new NarrationEngine();
