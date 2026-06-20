/**
 * Kalıcı 3D Dünya — per-taş ses motoru (WebAudio).
 * Ambient yatak (gece rüzgârı + hafif koro) + her Hafıza Taşına özel davranış:
 *  - Hatırlama: derin nefes → uzaktan kadın sesi
 *  - Nehir: akan su → ses
 *  - Dönüş: faint kalp atışı (yaklaşınca yükselir) → ses
 *  - Sessizlik: tüm ses 0'a → 2sn mutlak sessizlik → ses (kuru)
 * Kadın sesleri ElevenLabs TTS mp3 (public/universe/voice/*), reverb'le "uzaktan".
 */

export type WorldAudio = {
  start: () => void;
  enter: (id: string | null) => void;
  stop: () => void;
};

const VOICES: Record<string, string> = {
  hatirlama: "/universe/voice/hatirlama.mp3",
  nehir: "/universe/voice/nehir.mp3",
  donus: "/universe/voice/donus.mp3",
  sessizlik: "/universe/voice/sessizlik.mp3",
};

export function createWorldAudio(): WorldAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let ambient: GainNode | null = null;
  let voiceIn: GainNode | null = null;
  const buffers: Record<string, AudioBuffer> = {};
  const timers: number[] = [];
  let current: string | null = null;

  let heartGain: GainNode | null = null;
  let heartTimer: number | undefined;
  let water: { gain: GainNode; stop: () => void } | null = null;
  let voiceSrc: AudioBufferSourceNode | null = null;

  const noise = (sec: number) => {
    const len = ctx!.sampleRate * sec;
    const b = ctx!.createBuffer(1, len, ctx!.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  };

  const ensure = () => {
    if (ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    ambient = ctx.createGain();
    ambient.gain.value = 0.5;
    ambient.connect(master);

    // uzaktan kadın sesi zinciri: lowpass + delay reverb
    voiceIn = ctx.createGain();
    voiceIn.gain.value = 1;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    const dry = ctx.createGain();
    dry.gain.value = 0.85;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.19;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    voiceIn.connect(lp);
    lp.connect(dry);
    dry.connect(master);
    lp.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    // gece rüzgârı
    {
      const src = ctx.createBufferSource();
      src.buffer = noise(3);
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 460;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lg = ctx.createGain();
      lg.gain.value = 0.025;
      lfo.connect(lg);
      lg.connect(g.gain);
      src.connect(f);
      f.connect(g);
      g.connect(ambient);
      src.start();
      lfo.start();
    }
    // hafif koro (432Hz)
    [216, 324, 432].forEach((fr, i) => {
      const o = ctx!.createOscillator();
      o.type = "sine";
      o.frequency.value = fr;
      const g = ctx!.createGain();
      g.gain.value = 0.03 / (i + 1);
      o.connect(g);
      g.connect(ambient!);
      o.start();
    });
    // Dönüş kalp atışı (faint, her zaman uzakta)
    heartGain = ctx.createGain();
    heartGain.gain.value = 0.12;
    heartGain.connect(master);
    startHeart();
  };

  const startHeart = () => {
    if (!ctx || !heartGain) return;
    const beat = () => {
      if (!ctx || !heartGain) return;
      const now = ctx.currentTime;
      const thump = (t: number, gain: number) => {
        const o = ctx!.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(70, t);
        o.frequency.exponentialRampToValueAtTime(38, t + 0.13);
        const g = ctx!.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g);
        g.connect(heartGain!);
        o.start(t);
        o.stop(t + 0.25);
      };
      thump(now, 0.9);
      thump(now + 0.26, 0.6);
      heartTimer = window.setTimeout(beat, 1500);
    };
    beat();
  };

  const loadVoices = () => {
    Object.entries(VOICES).forEach(([id, url]) => {
      fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((ab) => ctx!.decodeAudioData(ab))
        .then((buf) => {
          buffers[id] = buf;
        })
        .catch(() => {
          /* ses henüz yoksa sessiz geç */
        });
    });
  };

  const playVoice = (id: string, dry = false) => {
    if (!ctx || !buffers[id]) return;
    try {
      voiceSrc?.stop();
    } catch {
      /* noop */
    }
    const src = ctx.createBufferSource();
    src.buffer = buffers[id];
    if (dry) {
      const g = ctx.createGain();
      g.gain.value = 0.95;
      src.connect(g);
      g.connect(master!);
    } else {
      src.connect(voiceIn!);
    }
    src.start();
    voiceSrc = src;
  };

  const breath = () => {
    if (!ctx || !ambient) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise(2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 600;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.9);
    g.gain.linearRampToValueAtTime(0.0001, now + 2.1);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(now);
    src.stop(now + 2.2);
  };

  const startWater = () => {
    if (!ctx || !ambient) return;
    const src = ctx.createBufferSource();
    src.buffer = noise(3);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 950;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1.1;
    const lg = ctx.createGain();
    lg.gain.value = 360;
    lfo.connect(lg);
    lg.connect(bp.frequency);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start();
    lfo.start();
    water = {
      gain: g,
      stop: () => {
        try {
          g.gain.linearRampToValueAtTime(0.0001, ctx!.currentTime + 0.6);
          src.stop(ctx!.currentTime + 0.7);
          lfo.stop(ctx!.currentTime + 0.7);
        } catch {
          /* noop */
        }
      },
    };
  };

  const clearTimers = () => {
    timers.forEach((t) => clearTimeout(t));
    timers.length = 0;
  };

  const setAmbient = (v: number, ramp = 0.5) => {
    if (ambient && ctx) ambient.gain.setTargetAtTime(v, ctx.currentTime, ramp);
  };
  const setHeart = (v: number) => {
    if (heartGain && ctx) heartGain.gain.setTargetAtTime(v, ctx.currentTime, 0.5);
  };

  return {
    start() {
      ensure();
      if (ctx?.state === "suspended") void ctx.resume();
      if (master && ctx) master.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 2.5);
      loadVoices();
    },
    enter(id: string | null) {
      if (!ctx) return;
      if (id === current) return;
      // önceki geçici katmanları temizle
      clearTimers();
      water?.stop();
      water = null;
      setHeart(0.12);
      current = id;

      if (!id) {
        setAmbient(0.5);
        return;
      }
      if (id === "sessizlik") {
        // tüm ses 0'a → 2sn mutlak sessizlik → kuru ses
        setAmbient(0.0001, 0.2);
        setHeart(0.0001);
        timers.push(window.setTimeout(() => playVoice("sessizlik", true), 2400));
        return;
      }
      setAmbient(0.45);
      if (id === "hatirlama") {
        breath();
        timers.push(window.setTimeout(() => playVoice("hatirlama"), 1500));
      } else if (id === "nehir") {
        startWater();
        timers.push(window.setTimeout(() => playVoice("nehir"), 1000));
      } else if (id === "donus") {
        setHeart(0.5);
        timers.push(window.setTimeout(() => playVoice("donus"), 1200));
      }
    },
    stop() {
      clearTimers();
      if (heartTimer) clearTimeout(heartTimer);
      water?.stop();
      try {
        voiceSrc?.stop();
      } catch {
        /* noop */
      }
      void ctx?.close();
      ctx = null;
      master = null;
      ambient = null;
      heartGain = null;
      current = null;
    },
  };
}
