/**
 * Gaia Yolculuğu — prosedürel ses (WebAudio, asset yok).
 * - Kalp atışı (iki-vuruş, yaklaştıkça hızlanır + yükselir)
 * - 432Hz ambient pad (sıcak drone)
 * - Yumuşak rüzgâr gürültüsü
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
  let pad: OscillatorNode[] = [];
  let windSrc: AudioBufferSourceNode | null = null;
  let beatTimer: number | undefined;
  let intensity = 0;

  const ensure = () => {
    if (ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // 432Hz tabanlı sıcak pad (oktav + beşli)
    [108, 216, 324, 432].forEach((f, i) => {
      const o = ctx!.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx!.createGain();
      g.gain.value = 0.07 / (i + 1);
      o.connect(g);
      g.connect(master!);
      o.start();
      pad.push(o);
    });

    // yumuşak rüzgâr (filtrelenmiş gürültü)
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    windSrc = ctx.createBufferSource();
    windSrc.buffer = buf;
    windSrc.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const wg = ctx.createGain();
    wg.gain.value = 0.05;
    windSrc.connect(lp);
    lp.connect(wg);
    wg.connect(master);
    windSrc.start();
  };

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
    const vol = 0.18 + intensity * 0.7; // yaklaştıkça yükselir
    thump(now, vol);
    thump(now + 0.24, vol * 0.65);
    const interval = 1.55 - intensity * 0.6; // yaklaştıkça hızlanır (~1.55s → ~0.95s)
    beatTimer = window.setTimeout(beat, interval * 1000);
  };

  return {
    start() {
      ensure();
      if (ctx?.state === "suspended") void ctx.resume();
      if (master && ctx) master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);
      if (beatTimer === undefined) beat();
    },
    setIntensity(v: number) {
      intensity = Math.max(0, Math.min(1, v));
      if (master && ctx) master.gain.setTargetAtTime(0.32 + intensity * 0.5, ctx.currentTime, 0.6);
    },
    stop() {
      if (beatTimer) clearTimeout(beatTimer);
      pad.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      });
      try {
        windSrc?.stop();
      } catch {
        /* noop */
      }
      void ctx?.close();
      ctx = null;
      master = null;
      pad = [];
      windSrc = null;
      beatTimer = undefined;
    },
  };
}
