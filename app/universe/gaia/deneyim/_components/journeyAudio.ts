/**
 * Gaia Yolculuğu — prosedürel canlı atmosfer (WebAudio, asset yok).
 * Gaia'nın gücü görüntü değil, SES. Katmanlar:
 *  - Gece rüzgârı (filtrelenmiş gürültü, yavaş soluk)
 *  - Yaprak hışırtısı (rastgele kısa bandpass patlamaları)
 *  - Uzak su (yumuşak şırıltı, yavaş LFO)
 *  - Çok hafif kadın korosu (formant-filtreli detune küme + vibrato + swell)
 *  - Böcek katmanı (gece cırcırı, rastgele)
 *  - Kalp atışı (yaklaştıkça hızlanır + yükselir)
 * İlk kullanıcı jestinde start() ile başlar (autoplay politikası).
 */

export type JourneyAudio = {
  start: () => void;
  setIntensity: (v: number) => void;
  stop: () => void;
};

export function createJourneyAudio(): JourneyAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let intensity = 0;
  const nodes: { stop?: () => void }[] = [];
  const timers: number[] = [];
  let beatTimer: number | undefined;

  const noiseBuffer = (seconds: number) => {
    const len = ctx!.sampleRate * seconds;
    const buf = ctx!.createBuffer(1, len, ctx!.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  };

  const ensure = () => {
    if (ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // ── Gece rüzgârı ──
    {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(3);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 480;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      // yavaş soluk
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.025;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      src.connect(lp);
      lp.connect(g);
      g.connect(master);
      src.start();
      lfo.start();
      nodes.push({ stop: () => { try { src.stop(); lfo.stop(); } catch {} } });
    }

    // ── Uzak su (yumuşak şırıltı) ──
    {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(3);
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.value = 0.018;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.9;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 320;
      lfo.connect(lfoGain);
      lfoGain.connect(bp.frequency);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start();
      lfo.start();
      nodes.push({ stop: () => { try { src.stop(); lfo.stop(); } catch {} } });
    }

    // ── Çok hafif kadın korosu (formant-filtreli detune küme) ──
    {
      const choir = ctx.createGain();
      choir.gain.value = 0.0;
      // "ah" sesini ima eden formant bandpass
      const formant = ctx.createBiquadFilter();
      formant.type = "bandpass";
      formant.frequency.value = 820;
      formant.Q.value = 4;
      formant.connect(choir);
      choir.connect(master);
      // A minör his: A3, C4, E4 + bir oktav üst hayalet
      [220, 261.6, 329.6, 440].forEach((f, i) => {
        const o = ctx!.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const og = ctx!.createGain();
        og.gain.value = (i === 3 ? 0.06 : 0.16) / 4;
        // hafif vibrato
        const vib = ctx!.createOscillator();
        vib.frequency.value = 4.5 + i * 0.3;
        const vibg = ctx!.createGain();
        vibg.gain.value = 1.6;
        vib.connect(vibg);
        vibg.connect(o.frequency);
        o.connect(og);
        og.connect(formant);
        o.start();
        vib.start();
        nodes.push({ stop: () => { try { o.stop(); vib.stop(); } catch {} } });
      });
      // yavaş swell
      const swell = ctx.createOscillator();
      swell.frequency.value = 0.05;
      const swellG = ctx.createGain();
      swellG.gain.value = 0.05;
      const swellBase = ctx.createConstantSource();
      swellBase.offset.value = 0.06;
      swell.connect(swellG);
      swellG.connect(choir.gain);
      swellBase.connect(choir.gain);
      swell.start();
      swellBase.start();
      nodes.push({ stop: () => { try { swell.stop(); swellBase.stop(); } catch {} } });
    }
  };

  // ── Yaprak hışırtısı (rastgele kısa patlamalar) ──
  const rustle = () => {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600 + Math.random() * 1800;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    const peak = 0.03 + Math.random() * 0.03;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + Math.random() * 0.3);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(now);
    src.stop(now + 0.9);
    timers.push(window.setTimeout(rustle, 2500 + Math.random() * 5000));
  };

  // ── Böcek katmanı (gece cırcırı) ──
  const insects = () => {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const chirps = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < chirps; i++) {
      const t = now + i * 0.08;
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = 4200 + Math.random() * 600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.012, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g);
      g.connect(master!);
      o.start(t);
      o.stop(t + 0.06);
    }
    timers.push(window.setTimeout(insects, 2200 + Math.random() * 4000));
  };

  // ── Kalp atışı ──
  const beat = () => {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const thump = (t: number, gain: number) => {
      const o = ctx!.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(72, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.13);
      const g = ctx!.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      g.connect(master!);
      o.start(t);
      o.stop(t + 0.25);
    };
    const vol = 0.14 + intensity * 0.62; // yaklaştıkça yükselir
    thump(now, vol);
    thump(now + 0.24, vol * 0.65);
    const interval = 1.6 - intensity * 0.62; // yaklaştıkça hızlanır
    beatTimer = window.setTimeout(beat, interval * 1000);
  };

  return {
    start() {
      ensure();
      if (ctx?.state === "suspended") void ctx.resume();
      if (master && ctx) master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);
      if (beatTimer === undefined) {
        beat();
        rustle();
        insects();
      }
    },
    setIntensity(v: number) {
      intensity = Math.max(0, Math.min(1, v));
      if (master && ctx) master.gain.setTargetAtTime(0.4 + intensity * 0.45, ctx.currentTime, 0.6);
    },
    stop() {
      if (beatTimer) clearTimeout(beatTimer);
      timers.forEach((t) => clearTimeout(t));
      nodes.forEach((n) => n.stop?.());
      void ctx?.close();
      ctx = null;
      master = null;
      beatTimer = undefined;
      timers.length = 0;
      nodes.length = 0;
    },
  };
}
