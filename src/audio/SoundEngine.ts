import { FolioInteractionSlot, WorldId } from '../types/atlas';

export const LANDMARK_POSITIONS: Record<WorldId, [number, number, number]> = {
  0: [0.0, 0.52, -0.35],
  1: [0.0, 0.65, -0.3],
  2: [0.2, 0.72, -0.4],
  3: [-0.4, 0.62, -0.25],
  4: [0.15, 0.75, -0.3],
  5: [0.0, 0.58, -0.35],
  6: [0.0, 0.64, -0.35],
  7: [0.2, 0.68, -0.4],
  8: [0.0, 0.78, -0.35],
  9: [0.0, 0.66, -0.4],
  10: [-0.2, 0.52, -0.2],
  11: [0.0, 0.48, -0.3],
};

const LANDMARK_TONE_HZ: Record<WorldId, number> = {
  0: 261.63, // C4
  1: 246.94, // B3
  2: 293.66, // D4
  3: 220.0,  // A3
  4: 196.0,  // G3
  5: 174.61, // F3
  6: 185.0,  // F#3
  7: 164.81, // E3
  8: 146.83, // D3
  9: 155.56, // D#3
  10: 220.0, // A3
  11: 233.08,// Bb3
};

/**
 * 1954-61 Administration instructional film procedural audio bed:
 * subtle warm mechanical projector hum, paper/cardstock handling,
 * dial detent ticks, restrained vibraphone/woodwind confirmation intervals,
 * and intentional silence at grave historical closes.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ambientGain: GainNode | null = null;
  private projectorHumOsc: OscillatorNode | null = null;
  private projectorHumGain: GainNode | null = null;
  private filmWhirFilter: BiquadFilterNode | null = null;
  private filmWhirGain: GainNode | null = null;

  private landmarkPanner: PannerNode | null = null;
  private landmarkOsc: OscillatorNode | null = null;
  private landmarkFilter: BiquadFilterNode | null = null;
  private landmarkGain: GainNode | null = null;

  private muted = false;
  private started = false;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.36;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      this.setupProjectorBed();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.started = true;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.36, this.ctx.currentTime, 0.08);
    }
  }

  public setNarrationDucking(active: boolean): void {
    if (!this.ambientGain || !this.ctx) return;
    this.ambientGain.gain.setTargetAtTime(
      active ? 0.08 : 0.22,
      this.ctx.currentTime,
      active ? 0.3 : 0.5,
    );
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.08;
      b1 = 0.92 * b1 + white * 0.22;
      data[i] = (b0 + b1 + white * 0.14) * 0.14;
    }
    return buffer;
  }

  private setupProjectorBed(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.22;
    this.ambientGain.connect(this.masterGain);

    // Subtle 16mm projector motor resonance (low warm sine)
    this.projectorHumOsc = this.ctx.createOscillator();
    this.projectorHumOsc.type = 'sine';
    this.projectorHumOsc.frequency.value = 64;
    this.projectorHumGain = this.ctx.createGain();
    this.projectorHumGain.gain.value = 0.0;
    this.projectorHumOsc.connect(this.projectorHumGain);
    this.projectorHumGain.connect(this.ambientGain);
    this.projectorHumOsc.start();

    // Very soft film reel transport air hiss
    const whirSrc = this.ctx.createBufferSource();
    whirSrc.buffer = this.noiseBuffer;
    whirSrc.loop = true;
    this.filmWhirFilter = this.ctx.createBiquadFilter();
    this.filmWhirFilter.type = 'bandpass';
    this.filmWhirFilter.frequency.value = 640;
    this.filmWhirFilter.Q.value = 2.8;
    this.filmWhirGain = this.ctx.createGain();
    this.filmWhirGain.gain.value = 0.0;
    whirSrc.connect(this.filmWhirFilter);
    this.filmWhirFilter.connect(this.filmWhirGain);
    this.filmWhirGain.connect(this.ambientGain);
    whirSrc.start();

    if (typeof this.ctx.createPanner === 'function') {
      this.landmarkPanner = this.ctx.createPanner();
      this.landmarkPanner.panningModel = 'HRTF';
      this.landmarkPanner.distanceModel = 'inverse';
      this.landmarkPanner.refDistance = 2.5;
      this.landmarkPanner.maxDistance = 18;
      this.landmarkPanner.rolloffFactor = 1.0;

      this.landmarkOsc = this.ctx.createOscillator();
      this.landmarkOsc.type = 'triangle';
      this.landmarkOsc.frequency.value = LANDMARK_TONE_HZ[0];

      this.landmarkFilter = this.ctx.createBiquadFilter();
      this.landmarkFilter.type = 'lowpass';
      this.landmarkFilter.frequency.value = 390;
      this.landmarkFilter.Q.value = 1.8;

      this.landmarkGain = this.ctx.createGain();
      this.landmarkGain.gain.value = 0.0;

      this.landmarkOsc.connect(this.landmarkFilter);
      this.landmarkFilter.connect(this.landmarkGain);
      this.landmarkGain.connect(this.landmarkPanner);
      this.landmarkPanner.connect(this.ambientGain);
      this.landmarkOsc.start();
    }
  }

  public updateSpatialBed(
    camPos: { x: number; y: number; z: number },
    camForward: { x: number; y: number; z: number },
    camUp: { x: number; y: number; z: number },
    world: WorldId,
    isOpen: boolean,
    elapsed: number,
    quietMode: boolean,
  ): void {
    if (!this.ctx || !this.started) return;
    const now = this.ctx.currentTime;

    const listener = this.ctx.listener;
    if (listener) {
      if (listener.positionX) {
        listener.positionX.setTargetAtTime(camPos.x, now, 0.06);
        listener.positionY.setTargetAtTime(camPos.y, now, 0.06);
        listener.positionZ.setTargetAtTime(camPos.z, now, 0.06);
        listener.forwardX.setTargetAtTime(camForward.x, now, 0.06);
        listener.forwardY.setTargetAtTime(camForward.y, now, 0.06);
        listener.forwardZ.setTargetAtTime(camForward.z, now, 0.06);
        listener.upX.setTargetAtTime(camUp.x, now, 0.06);
        listener.upY.setTargetAtTime(camUp.y, now, 0.06);
        listener.upZ.setTargetAtTime(camUp.z, now, 0.06);
      }
    }

    const activeScale = isOpen && !quietMode ? 1 : 0;
    if (this.projectorHumGain && this.filmWhirGain) {
      this.projectorHumGain.gain.setTargetAtTime(0.016 * activeScale, now, 0.4);
      this.filmWhirGain.gain.setTargetAtTime(0.014 * activeScale, now, 0.4);
    }

    if (this.landmarkPanner && this.landmarkOsc && this.landmarkGain) {
      const [lx, ly, lz] = LANDMARK_POSITIONS[world];
      if (this.landmarkPanner.positionX) {
        this.landmarkPanner.positionX.setTargetAtTime(lx, now, 0.25);
        this.landmarkPanner.positionY.setTargetAtTime(ly, now, 0.25);
        this.landmarkPanner.positionZ.setTargetAtTime(lz, now, 0.25);
      }
      const baseHz = LANDMARK_TONE_HZ[world];
      const slowDrift = Math.sin(elapsed * 0.7) * 0.8;
      this.landmarkOsc.frequency.setTargetAtTime(baseHz + slowDrift, now, 0.35);

      // Intentional silence / minimal tone in late somber folios F09-F12
      const quietFolioScale = world >= 10 ? 0.35 : world >= 8 ? 0.55 : 1.0;
      const gain = isOpen && !quietMode ? 0.018 * quietFolioScale : 0;
      this.landmarkGain.gain.setTargetAtTime(gain, now, 0.35);
    }
  }

  public playBookOpen(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.055);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
    this.playPaperRustle(0.45, 540, 0.18);
  }

  public playPageTurn(): void {
    this.unlock();
    this.playPaperRustle(0.38, 860, 0.2);
  }

  public playPaperFold(): void {
    this.unlock();
    this.playPaperRustle(0.2, 1220, 0.14);
  }

  public playProjectorBell(): void {
    this.unlock();
    // Classic 1950s filmstrip advance chime (restrained fifth)
    this.playVibraphone([440.0, 659.25], 0.09);
  }

  public playSecretReveal(): void {
    this.unlock();
    this.playVibraphone([587.33, 880.0], 0.09);
  }

  public playInteractionCue(slot: FolioInteractionSlot, worldId: WorldId): void {
    this.unlock();
    this.playPaperRustle(0.16, 1080, 0.11);

    // Special understated sub-bass implosion thump for F09_A / F09_B collapse
    if (worldId === 8 && (slot === 'A' || slot === 'B')) {
      this.playStarCollapse();
      return;
    }

    const freqSets: Record<FolioInteractionSlot, number[]> = {
      A: [392.0, 493.88],
      B: [440.0, 523.25],
      C: [493.88, 659.25],
    };
    this.playVibraphone(freqSets[slot], 0.11);
  }

  public playStarCollapse(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.45);
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  private playPaperRustle(duration: number, centerFreq: number, volume: number): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq * 0.75, now);
    filter.frequency.exponentialRampToValueAtTime(centerFreq * 1.25, now + duration * 0.6);
    filter.Q.value = 1.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + duration + 0.04);
  }

  private playVibraphone(freqs: number[], volume: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t0 = now + idx * 0.07;
      osc.frequency.setValueAtTime(f, t0);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.52);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  }

  public dispose(): void {
    if (this.projectorHumOsc) {
      try {
        this.projectorHumOsc.stop();
      } catch {
        // ignore
      }
      this.projectorHumOsc = null;
    }
    if (this.landmarkOsc) {
      try {
        this.landmarkOsc.stop();
      } catch {
        // ignore
      }
      this.landmarkOsc = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
