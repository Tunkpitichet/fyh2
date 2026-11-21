import { WeatherType } from '../types/world';

/**
 * Procedural Web Audio API atmospheric soundscape synthesizer.
 * Generates soft wind, rain noise, and warm harmonic pads without external MP3 assets.
 */
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private started = false;

  private ensureContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public start(volume = 0.4, muted = false) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    if (this.started) {
      this.setVolume(volume, muted);
      return;
    }

    // Create 3-second seamless noise buffer for wind & rain
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, sampleRate * 3, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      // Pink-ish smoothing
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 2.2;
    }

    // Wind channel
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = buffer;
    windSrc.loop = true;
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 320;
    this.windFilter.Q.value = 1.4;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.22;
    windSrc.connect(this.windFilter).connect(this.windGain).connect(this.masterGain);
    windSrc.start();

    // Rain channel
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = buffer;
    rainSrc.loop = true;
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'highpass';
    this.rainFilter.frequency.value = 1400;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.001;
    rainSrc.connect(this.rainFilter).connect(this.rainGain).connect(this.masterGain);
    rainSrc.start();

    // Subtle warm harmonic pad (C2 + G2)
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.05;
    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 260;

    [65.41, 98.0, 146.83].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(droneFilter);
      osc.start();
    });
    droneFilter.connect(this.droneGain).connect(this.masterGain);

    this.started = true;
    this.setVolume(volume, muted);
  }

  public setVolume(volume: number, muted: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const target = muted ? 0.0001 : Math.max(0.0001, Math.min(0.65, volume * 0.55));
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.35);
  }

  public updateAtmosphere(weather: WeatherType, windSpeed: number, timeOfDay: number) {
    if (!this.ctx || !this.started) return;
    const now = this.ctx.currentTime;

    if (this.windFilter && this.windGain) {
      this.windFilter.frequency.setTargetAtTime(220 + windSpeed * 240, now, 0.5);
      this.windGain.gain.setTargetAtTime(0.14 + windSpeed * 0.16, now, 0.5);
    }
    if (this.rainGain) {
      const targetRain = weather === 'storm' ? 0.42 : weather === 'rain' ? 0.28 : 0.001;
      this.rainGain.gain.setTargetAtTime(targetRain, now, 0.6);
    }
    if (this.droneGain) {
      const isNight = timeOfDay < 6 || timeOfDay > 19.5;
      this.droneGain.gain.setTargetAtTime(isNight ? 0.065 : 0.035, now, 0.8);
    }
  }

  public playPortalWhoosh() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.7);
    osc.frequency.exponentialRampToValueAtTime(85, now + 1.5);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.65);
  }

  public stop() {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  }
}

export const audioService = new AmbientAudioEngine();
