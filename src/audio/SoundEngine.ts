import { WeatherPreset, WorldId } from '../types/atlas';

/**
 * 100% procedural Web Audio synthesizer for paper foley, weather soundscapes,
 * and world-specific tactile feedback. Zero external MP3/OGG dependencies.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ambientGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

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
      this.masterGain.gain.value = this.muted ? 0 : 0.45;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      this.setupAmbienceLayers();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.started = true;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.08);
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Pink-ish noise for warm paper & rain texture
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }
    return buffer;
  }

  private setupAmbienceLayers(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.25;
    this.ambientGain.connect(this.masterGain);

    // Wind layer
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 420;
    this.windFilter.Q.value = 2.4;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.04;
    windSrc.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambientGain);
    windSrc.start();

    // Rain / Water layer
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = this.noiseBuffer;
    rainSrc.loop = true;
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1800;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;
    rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambientGain);
    rainSrc.start();
  }

  public updateAtmosphere(weather: WeatherPreset, world: WorldId, isOpen: boolean): void {
    if (!this.ctx || !this.started || !this.windGain || !this.rainGain || !this.windFilter) return;
    const now = this.ctx.currentTime;
    const baseOpen = isOpen ? 1 : 0.2;

    const windTarget =
      weather === 'windy'
        ? 0.22
        : weather === 'thunderstorm'
          ? 0.18
          : weather === 'mist'
            ? 0.07
            : world === 1
              ? 0.08
              : 0.04;

    const rainTarget =
      weather === 'rain'
        ? 0.16
        : weather === 'thunderstorm'
          ? 0.24
          : world === 1 && isOpen
            ? 0.03
            : 0.0;

    const windFreq = world === 2 ? 620 : world === 1 ? 360 : 480;
    this.windFilter.frequency.setTargetAtTime(windFreq, now, 0.5);
    this.windGain.gain.setTargetAtTime(windTarget * baseOpen, now, 0.4);
    this.rainGain.gain.setTargetAtTime(rainTarget * baseOpen, now, 0.4);
  }

  public playBookOpen(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Brass clasp click
    const osc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);
    clickGain.gain.setValueAtTime(0.25, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(clickGain);
    clickGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);

    // Heavy leather cover settle + parchment unfurl
    this.playPaperRustle(0.55, 580, 0.22);
  }

  public playPageTurn(): void {
    this.unlock();
    this.playPaperRustle(0.45, 920, 0.26);
  }

  public playPaperFold(): void {
    this.unlock();
    this.playPaperRustle(0.22, 1350, 0.18);
  }

  public playSeedSprout(): void {
    this.unlock();
    this.playChime([523.25, 659.25, 783.99], 0.14);
    this.playPaperRustle(0.25, 1100, 0.12);
  }

  public playWaterRipple(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.14);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playStarChime(step = 0): void {
    this.unlock();
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = scale[step % scale.length];
    this.playChime([freq, freq * 1.5], 0.18);
  }

  public playSealSummon(): void {
    this.unlock();
    this.playChime([392.0, 493.88, 587.33], 0.16);
    this.playPaperRustle(0.18, 860, 0.14);
  }

  public playSecretReveal(): void {
    this.unlock();
    this.playChime([659.25, 987.77, 1318.5], 0.14);
  }

  public playThunder(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(65, now + 1.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 1.75);
  }

  private playPaperRustle(duration: number, centerFreq: number, volume: number): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq * 0.7, now);
    filter.frequency.exponentialRampToValueAtTime(centerFreq * 1.4, now + duration * 0.6);
    filter.Q.value = 1.6;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + duration + 0.05);
  }

  private playChime(freqs: number[], volume: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t0 = now + idx * 0.055;
      osc.frequency.setValueAtTime(f, t0);
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    });
  }

  public dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
