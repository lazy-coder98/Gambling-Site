import { useRef, useState } from 'react';

export function useAudio() {
  const [muted, setMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('casino_muted');
    return saved ? JSON.parse(saved) : false;
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const toggleMute = () => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem('casino_muted', JSON.stringify(next));
      return next;
    });
  };

  const playClick = () => {
    if (muted) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  const playPlink = (pitch = 440) => {
    if (muted) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch / 2, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  const playWin = () => {
    if (muted) return;
    try {
      const ctx = initAudio();
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.06, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  const playLose = () => {
    if (muted) return;
    try {
      const ctx = initAudio();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.5);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      // Low pass filter to make it warmer/muffled
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  const playCrashTick = (multiplier: number) => {
    if (muted) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch increases as multiplier climbs
      const pitch = Math.min(220 + multiplier * 80, 1500);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  const playExplosion = () => {
    if (muted) return;
    try {
      const ctx = initAudio();
      const now = ctx.currentTime;
      
      // Noise buffer for explosion
      const bufferSize = ctx.sampleRate * 0.8; // 0.8 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(10, now + 0.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Add a low-frequency oscillator boom
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(80, now);
      boom.frequency.exponentialRampToValueAtTime(20, now + 0.6);
      
      boomGain.gain.setValueAtTime(0.25, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      boom.connect(boomGain);
      boomGain.connect(ctx.destination);

      noiseNode.start();
      boom.start();
      
      noiseNode.stop(now + 0.8);
      boom.stop(now + 0.8);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  return {
    muted,
    toggleMute,
    playClick,
    playPlink,
    playWin,
    playLose,
    playCrashTick,
    playExplosion,
    initAudio
  };
}
export type AudioSystem = ReturnType<typeof useAudio>;
