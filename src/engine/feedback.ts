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

/* ------------------------------------------------------------------ */
/* Ambient room tone — lamp hum + ticking clock, synthesized like       */
/* everything else so no audio assets are shipped.                      */
/* ------------------------------------------------------------------ */

type Ambience = {
  master: GainNode;
  stop: () => void;
};

let ambience: Ambience | null = null;

/**
 * Start the looping room tone. Must be called from a user gesture
 * (the title-screen button) so the AudioContext is allowed to run.
 * Safe to call repeatedly — it's a no-op while already playing.
 */
export function startAmbience() {
  const a = audio();
  if (!a || ambience) return;

  const master = a.createGain();
  master.gain.value = 1;
  master.connect(a.destination);

  // Lamp hum: low sine + faint octave, rolled off so it sits under everything.
  const hum = a.createGain();
  hum.gain.value = 0.014;
  const humFilter = a.createBiquadFilter();
  humFilter.type = 'lowpass';
  humFilter.frequency.value = 220;
  hum.connect(humFilter);
  humFilter.connect(master);
  const humOscs = [
    { freq: 55, level: 1 },
    { freq: 110, level: 0.35 },
  ].map(({ freq, level }) => {
    const osc = a.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = a.createGain();
    g.gain.value = level;
    osc.connect(g).connect(hum);
    osc.start();
    return osc;
  });

  // Clock: one soft tick per second, scheduled on the audio clock
  // (lookahead loop, so setInterval jitter never drifts the beat).
  const tickAt = (t: number, tock: boolean) => {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = 'triangle';
    osc.frequency.value = tock ? 1180 : 1560; // tick / tock alternation
    g.gain.setValueAtTime(0.018, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.05);
  };
  let nextTick = Math.ceil(a.currentTime) + 0.5;
  const timer = window.setInterval(() => {
    while (nextTick < a.currentTime + 0.6) {
      tickAt(nextTick, Math.round(nextTick) % 2 === 0);
      nextTick += 1;
    }
  }, 250);

  ambience = {
    master,
    stop: () => {
      window.clearInterval(timer);
      humOscs.forEach((osc) => osc.stop());
      master.disconnect();
      ambience = null;
    },
  };
}

export function stopAmbience() {
  ambience?.stop();
}

/** Scale the room tone (e.g. quieter at night). Eased to avoid zipper noise. */
export function setAmbienceLevel(level: number) {
  const a = ctx;
  if (!a || !ambience) return;
  ambience.master.gain.setTargetAtTime(Math.max(0, level), a.currentTime, 0.25);
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
