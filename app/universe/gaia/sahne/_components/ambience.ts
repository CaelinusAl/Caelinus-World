/**
 * Gaia ambient ses — prosedürel (WebAudio), asset gerektirmez.
 *
 * Katmanlar:
 *   • Rüzgâr/su yatağı  — lowpass'tan geçen yumuşak gürültü
 *   • Su pırıltısı      — bandpass + yavaş LFO modülasyonlu gürültü
 *   • Kutsal pad        — 3 hafif detune sinüs (A2/E3/A3)
 *   • Kuş cıvıltıları   — rastgele zamanlı kısa frekans-zarflı sinüs
 *
 * Tarayıcı autoplay politikası: ilk kullanıcı jesti içinde start() çağrılmalı.
 * Singleton — sahne boyunca tek graf.
 */

type Ctx = AudioContext & { _gaia?: GaiaGraph };

interface GaiaGraph {
  ctx: AudioContext;
  master: GainNode;
  birdTimer: number | null;
  stopped: boolean;
}

let graph: GaiaGraph | null = null;

function makeNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    // basit pembe-gürültü yumuşatma
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

function chirp(ctx: AudioContext, master: GainNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  const base = 1700 + Math.random() * 900;
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.06);
  osc.frequency.exponentialRampToValueAtTime(base * 1.1, now + 0.13);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(g).connect(master);
  osc.start(now);
  osc.stop(now + 0.2);
}

export function startAmbience(): boolean {
  if (graph && !graph.stopped) {
    graph.ctx.resume().catch(() => {});
    return true;
  }
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor() as Ctx;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    // yumuşak fade-in
    master.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 2.5);

    const noiseBuf = makeNoiseBuffer(ctx);

    // rüzgâr/su yatağı
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuf;
    wind.loop = true;
    const windLP = ctx.createBiquadFilter();
    windLP.type = "lowpass";
    windLP.frequency.value = 480;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.5;
    wind.connect(windLP).connect(windGain).connect(master);
    wind.start();

    // su pırıltısı (bandpass + LFO)
    const shimmer = ctx.createBufferSource();
    shimmer.buffer = noiseBuf;
    shimmer.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 0.8;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.12;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(shimmerGain.gain);
    shimmer.connect(bp).connect(shimmerGain).connect(master);
    shimmer.start();
    lfo.start();

    // kutsal pad
    const padGain = ctx.createGain();
    padGain.gain.value = 0.06;
    padGain.connect(master);
    [110, 164.81, 220].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * (1 + (i - 1) * 0.002); // hafif detune
      o.connect(padGain);
      o.start();
    });

    // kuş cıvıltıları — rastgele
    const scheduleBird = () => {
      if (!graph || graph.stopped) return;
      if (Math.random() < 0.7) chirp(ctx, master);
      if (Math.random() < 0.3) setTimeout(() => chirp(ctx, master), 180); // ikili öttürme
      graph.birdTimer = window.setTimeout(scheduleBird, 1800 + Math.random() * 3500);
    };

    graph = { ctx, master, birdTimer: null, stopped: false };
    ctx._gaia = graph;
    scheduleBird();
    ctx.resume().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function setAmbienceMuted(muted: boolean) {
  if (!graph) return;
  const t = graph.ctx.currentTime;
  graph.master.gain.cancelScheduledValues(t);
  graph.master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.6, t + 0.6);
}

export function stopAmbience() {
  if (!graph) return;
  graph.stopped = true;
  if (graph.birdTimer) clearTimeout(graph.birdTimer);
  graph.ctx.close().catch(() => {});
  graph = null;
}
