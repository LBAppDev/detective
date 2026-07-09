/**
 * Shared feedback conventions: tiny synthesized sounds via WebAudio,
 * so every puzzle type gives consistent success/deny/click feedback
 * without shipping audio assets.
 */

export type SoundName = 'success' | 'deny' | 'click' | 'slide';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type ToneOptions = {
  freq: number;
  at?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** Optional frequency to glide toward over the duration. */
  glide?: number;
};

function tone(a: AudioContext, { freq, at = 0, dur = 0.15, type = 'sine', gain = 0.06, glide }: ToneOptions) {
  const osc = a.createOscillator();
  const g = a.createGain();
  const t0 = a.currentTime + at;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playSound(name: SoundName) {
  const a = audio();
  if (!a) return;
  switch (name) {
    case 'success':
      tone(a, { freq: 660, dur: 0.12 });
      tone(a, { freq: 880, at: 0.1, dur: 0.22 });
      break;
    case 'deny':
      tone(a, { freq: 170, dur: 0.18, type: 'square', gain: 0.045 });
      break;
    case 'click':
      tone(a, { freq: 700, dur: 0.05, type: 'triangle' });
      break;
    case 'slide':
      tone(a, { freq: 320, dur: 0.3, glide: 140, gain: 0.04 });
      break;
  }
}
