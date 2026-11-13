import { WeatherPreset, WorldId } from '../types/atlas';

export interface WeatherAcousticProfile {
  rumbleFreq: number;
  rumbleGain: number;
  subGain: number;
  windFreq: number;
  windQ: number;
  windGain: number;
  hissFreq: number;
  hissGain: number;
  rainFreq: number;
  rainGain: number;
}

export function computeWeatherAcousticProfile(
  weather: WeatherPreset,
  world: WorldId,
  isOpen: boolean,
  elapsed: number,
): WeatherAcousticProfile {
  const openScale = isOpen ? 1 : 0.25;
  const isWaterWorld = world === 1 || world === 4 || world === 8;
  const isWindyWorld = world === 2 || world === 3 || world === 6;
  const isForgeWorld = world === 5;

  // Smooth organic gust LFOs for frequency and gain sweeps
  const slowWave = 0.5 + 0.5 * Math.sin(elapsed * 0.58 + Math.sin(elapsed * 0.23) * 0.8);
  const crispGust = 0.5 + 0.5 * Math.sin(elapsed * 1.12 + 1.4);

  let rumbleFreq = 82;
  let rumbleGain = isForgeWorld ? 0.065 : 0.012;
  let subGain = isForgeWorld ? 0.025 : 0;

  let windFreq = isWindyWorld ? 560 : isWaterWorld ? 350 : 410;
  let windQ = 2.0;
  let windGain = isWindyWorld || isWaterWorld ? 0.045 : 0.024;

  let hissFreq = 2900;
  let hissGain = 0.006;

  let rainFreq = 2200;
  let rainGain = isWaterWorld && isOpen ? 0.028 : 0.0;

  switch (weather) {
    case 'thunderstorm':
      rumbleFreq = 68 + slowWave * 52 + crispGust * 16;
      rumbleGain = 0.36 + slowWave * 0.08;
      subGain = 0.13 + slowWave * 0.05;
      windFreq = 420 + slowWave * 480 + (isWindyWorld ? 90 : 0);
      windQ = 2.8;
      windGain = 0.17 + crispGust * 0.09;
      hissFreq = 2500 + crispGust * 1450;
      hissGain = 0.11 + crispGust * 0.075;
      rainFreq = 1220 + crispGust * 260;
      rainGain = 0.25;
      break;

    case 'windy':
      rumbleFreq = 88 + slowWave * 28;
      rumbleGain = 0.05 + slowWave * 0.03;
      subGain = isForgeWorld ? 0.02 : 0;
      windFreq = 540 + slowWave * 640 + crispGust * 110;
      windQ = 3.2;
      windGain = 0.17 + slowWave * 0.11;
      hissFreq = 2950 + slowWave * 1350 + crispGust * 420;
      hissGain = 0.13 + crispGust * 0.095;
      rainFreq = 2400;
      rainGain = isWaterWorld && isOpen ? 0.022 : 0;
      break;

    case 'rain':
      rumbleFreq = 96 + slowWave * 24;
      rumbleGain = 0.12;
      subGain = 0.028;
      windFreq = 420 + slowWave * 130;
      windQ = 2.2;
      windGain = 0.075;
      hissFreq = 3400 + crispGust * 450;
      hissGain = 0.045;
      rainFreq = 1780 + slowWave * 240;
      rainGain = 0.18;
      break;

    case 'mist':
      rumbleFreq = 78 + slowWave * 14;
      rumbleGain = 0.045;
      subGain = 0.012;
      windFreq = 265 + slowWave * 70;
      windQ = 1.45;
      windGain = 0.08;
      hissFreq = 3100 + slowWave * 500;
      hissGain = 0.062;
      rainFreq = 2950;
      rainGain = 0.032;
      break;

    case 'overcast':
      rumbleFreq = 72 + slowWave * 16;
      rumbleGain = 0.065;
      subGain = 0.018;
      windFreq = 330 + slowWave * 85;
      windQ = 1.8;
      windGain = 0.055;
      hissFreq = 2650;
      hissGain = 0.014;
      rainFreq = 2200;
      rainGain = isWaterWorld && isOpen ? 0.02 : 0;
      break;

    case 'clear':
    default:
      windFreq += slowWave * 65;
      break;
  }

  return {
    rumbleFreq,
    rumbleGain: rumbleGain * openScale,
    subGain: subGain * openScale,
    windFreq,
    windQ,
    windGain: windGain * openScale,
    hissFreq,
    hissGain: hissGain * openScale,
    rainFreq,
    rainGain: rainGain * openScale,
  };
}

/**
 * 100% procedural multi-band Web Audio synthesizer for paper foley,
 * frequency-modulated weather soundscapes, and world-specific tactile feedback.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ambientGain: GainNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private rumbleSubOsc: OscillatorNode | null = null;
  private rumbleSubGain: GainNode | null = null;

  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  private hissFilter: BiquadFilterNode | null = null;
  private hissGain: GainNode | null = null;

  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;

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

  public setNarrationDucking(active: boolean): void {
    if (!this.ambientGain || !this.ctx) return;
    this.ambientGain.gain.setTargetAtTime(
      active ? 0.1 : 0.28,
      this.ctx.currentTime,
      active ? 0.35 : 0.6,
    );
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Warm multi-pole noise retaining rich sub-rumble AND crisp upper harmonics
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.26) * 0.125;
    }
    return buffer;
  }

  private setupAmbienceLayers(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.28;
    this.ambientGain.connect(this.masterGain);

    // 1. Low-frequency Storm Rumble (lowpass noise + sub-bass drone)
    const rumbleSrc = this.ctx.createBufferSource();
    rumbleSrc.buffer = this.noiseBuffer;
    rumbleSrc.loop = true;
    this.rumbleFilter = this.ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 82;
    this.rumbleFilter.Q.value = 1.6;
    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.value = 0.01;
    rumbleSrc.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.ambientGain);
    rumbleSrc.start();

    this.rumbleSubOsc = this.ctx.createOscillator();
    this.rumbleSubOsc.type = 'triangle';
    this.rumbleSubOsc.frequency.value = 52;
    this.rumbleSubGain = this.ctx.createGain();
    this.rumbleSubGain.gain.value = 0;
    this.rumbleSubOsc.connect(this.rumbleSubGain);
    this.rumbleSubGain.connect(this.ambientGain);
    this.rumbleSubOsc.start();

    // 2. Dynamic Mid-band Wind Layer
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 420;
    this.windFilter.Q.value = 2.4;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.03;
    windSrc.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambientGain);
    windSrc.start();

    // 3. High-frequency Air Hiss / Canopy Gust Sibilance
    const hissSrc = this.ctx.createBufferSource();
    hissSrc.buffer = this.noiseBuffer;
    hissSrc.loop = true;
    this.hissFilter = this.ctx.createBiquadFilter();
    this.hissFilter.type = 'highpass';
    this.hissFilter.frequency.value = 2900;
    this.hissFilter.Q.value = 1.1;
    this.hissGain = this.ctx.createGain();
    this.hissGain.gain.value = 0.005;
    hissSrc.connect(this.hissFilter);
    this.hissFilter.connect(this.hissGain);
    this.hissGain.connect(this.ambientGain);
    hissSrc.start();

    // 4. Rain & Water Droplet Layer
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = this.noiseBuffer;
    rainSrc.loop = true;
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'highpass';
    this.rainFilter.frequency.value = 1800;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;
    rainSrc.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambientGain);
    rainSrc.start();
  }

  public updateAtmosphere(
    weather: WeatherPreset,
    world: WorldId,
    isOpen: boolean,
    elapsed = 0,
  ): void {
    if (
      !this.ctx ||
      !this.started ||
      !this.rumbleFilter ||
      !this.rumbleGain ||
      !this.rumbleSubOsc ||
      !this.rumbleSubGain ||
      !this.windFilter ||
      !this.windGain ||
      !this.hissFilter ||
      !this.hissGain ||
      !this.rainFilter ||
      !this.rainGain
    ) {
      return;
    }

    const now = this.ctx.currentTime;
    const p = computeWeatherAcousticProfile(weather, world, isOpen, elapsed);

    this.rumbleFilter.frequency.setTargetAtTime(p.rumbleFreq, now, 0.35);
    this.rumbleGain.gain.setTargetAtTime(p.rumbleGain, now, 0.35);
    this.rumbleSubOsc.frequency.setTargetAtTime(
      46 + (p.rumbleFreq - 68) * 0.16,
      now,
      0.45,
    );
    this.rumbleSubGain.gain.setTargetAtTime(p.subGain, now, 0.4);

    this.windFilter.frequency.setTargetAtTime(p.windFreq, now, 0.32);
    this.windFilter.Q.setTargetAtTime(p.windQ, now, 0.4);
    this.windGain.gain.setTargetAtTime(p.windGain, now, 0.3);

    this.hissFilter.frequency.setTargetAtTime(p.hissFreq, now, 0.28);
    this.hissGain.gain.setTargetAtTime(p.hissGain, now, 0.28);

    this.rainFilter.frequency.setTargetAtTime(p.rainFreq, now, 0.35);
    this.rainGain.gain.setTargetAtTime(p.rainGain, now, 0.35);
  }

  public playBookOpen(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

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

  public playNarrationCue(): void {
    this.unlock();
    this.playChime([392.0, 587.33], 0.08);
  }

  public playPortalTransition(): void {
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const baseOsc = this.ctx.createOscillator();
    const baseGain = this.ctx.createGain();
    baseOsc.type = 'triangle';
    baseOsc.frequency.setValueAtTime(196.0, now);
    baseOsc.frequency.exponentialRampToValueAtTime(293.66, now + 0.65);
    baseGain.gain.setValueAtTime(0.001, now);
    baseGain.gain.linearRampToValueAtTime(0.2, now + 0.12);
    baseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    baseOsc.connect(baseGain);
    baseGain.connect(this.masterGain);
    baseOsc.start(now);
    baseOsc.stop(now + 1.0);

    this.playPaperRustle(0.6, 1180, 0.22);
    this.playChime([392.0, 493.88, 587.33, 783.99, 987.77], 0.13);
  }

  public playThunder(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + 1.6);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.58, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 1.9);
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
    if (this.rumbleSubOsc) {
      try {
        this.rumbleSubOsc.stop();
      } catch {
        // ignore
      }
      this.rumbleSubOsc = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
