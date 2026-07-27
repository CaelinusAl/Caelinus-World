/**
 * Procedural ortam sesi — rüzgâr + yaprak hışırtısı + ara ara uzak kuşlar.
 * Web Audio ile sentezlenir: dosya yok, kusursuz döngü, çok hafif.
 * Mevcut su/doğa m4a katmanlarının ÜSTÜNE çalar (kutsal yer hissi).
 */
export type Ambience = { resume: () => void; setMuted: (m: boolean) => void; dispose: () => void };

export function createAmbience(): Ambience {
  const Ctx: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // 2 sn pembe-gürültü tamponu (döngü dikişsiz)
  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.05;
  }

  // RÜZGÂR — alçak geçiren + yavaş esinti LFO + cutoff süpürme
  const wind = ctx.createBufferSource(); wind.buffer = buf; wind.loop = true;
  const wlp = ctx.createBiquadFilter(); wlp.type = "lowpass"; wlp.frequency.value = 420;
  const wg = ctx.createGain(); wg.gain.value = 0.5;
  wind.connect(wlp); wlp.connect(wg); wg.connect(master);
  const wlfo = ctx.createOscillator(); wlfo.frequency.value = 0.06;
  const wlfoG = ctx.createGain(); wlfoG.gain.value = 0.32; wlfo.connect(wlfoG); wlfoG.connect(wg.gain);
  const clfo = ctx.createOscillator(); clfo.frequency.value = 0.04;
  const clfoG = ctx.createGain(); clfoG.gain.value = 240; clfo.connect(clfoG); clfoG.connect(wlp.frequency);

  // YAPRAK HIŞIRTISI — bant geçiren tiz + hızlı tremolo, kısık
  const leaf = ctx.createBufferSource(); leaf.buffer = buf; leaf.loop = true;
  const lbp = ctx.createBiquadFilter(); lbp.type = "bandpass"; lbp.frequency.value = 3200; lbp.Q.value = 0.7;
  const lg = ctx.createGain(); lg.gain.value = 0.1;
  leaf.connect(lbp); lbp.connect(lg); lg.connect(master);
  const llfo = ctx.createOscillator(); llfo.frequency.value = 0.5;
  const llfoG = ctx.createGain(); llfoG.gain.value = 0.07; llfo.connect(llfoG); llfoG.connect(lg.gain);

  wind.start(); leaf.start(); wlfo.start(); clfo.start(); llfo.start();

  // UZAK KUŞLAR — rastgele aralıklı kısa cıvıltılar
  let stopped = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const chirp = () => {
    if (stopped) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sine";
    const g = ctx.createGain(); g.gain.value = 0;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const base = 1800 + Math.random() * 1400;
    o.frequency.setValueAtTime(base, now);
    const notes = 2 + Math.floor(Math.random() * 3);
    let t = now;
    for (let i = 0; i < notes; i++) {
      const f = base * (0.8 + Math.random() * 0.6);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.12);
      t += 0.14 + Math.random() * 0.1;
    }
    o.connect(g);
    if (pan) { pan.pan.value = Math.random() * 2 - 1; g.connect(pan); pan.connect(master); } else { g.connect(master); }
    o.start(now); o.stop(t + 0.2);
    timers.push(setTimeout(chirp, 2500 + Math.random() * 6500));
  };
  timers.push(setTimeout(chirp, 1500 + Math.random() * 3000));

  // KURBAĞALAR — ara ara alçak vırak (nehir kıyısı)
  const croak = () => {
    if (stopped) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sawtooth";
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480;
    const g = ctx.createGain(); g.gain.value = 0;
    const base = 95 + Math.random() * 55;
    const pulses = 2 + Math.floor(Math.random() * 3); let t = now;
    for (let i = 0; i < pulses; i++) {
      o.frequency.setValueAtTime(base * (0.92 + Math.random() * 0.16), t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0006, t + 0.16);
      t += 0.2 + Math.random() * 0.08;
    }
    o.connect(lp); lp.connect(g);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(master); } else { g.connect(master); }
    o.start(now); o.stop(t + 0.2);
    timers.push(setTimeout(croak, 4000 + Math.random() * 9000));
  };
  timers.push(setTimeout(croak, 3000 + Math.random() * 5000));

  // yumuşak açılış
  master.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 3);

  return {
    resume: () => { if (ctx.state === "suspended") void ctx.resume(); },
    setMuted: (m: boolean) => {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(m ? 0 : 0.6, ctx.currentTime + 0.4);
    },
    dispose: () => { stopped = true; timers.forEach(clearTimeout); try { void ctx.close(); } catch { /* yoksay */ } },
  };
}

/**
 * Temple entrance score: two seconds of actual silence, one breath, a distant
 * bird and a short wind passage that resolves to silence before the interior.
 * All timing is scheduled on the audio clock, independent from rendering.
 */
export function createTempleEntranceSound(): Ambience {
  const Ctx: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.62;
  master.connect(ctx.destination);

  const length = Math.floor(ctx.sampleRate * 3);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let smooth = 0;
  for (let index = 0; index < length; index++) {
    smooth = smooth * 0.985 + (Math.random() * 2 - 1) * 0.015;
    data[index] = smooth;
  }

  const now = ctx.currentTime;

  // One filtered exhale at t+2.0s.
  const breath = ctx.createBufferSource();
  breath.buffer = buffer;
  const breathFilter = ctx.createBiquadFilter();
  breathFilter.type = "bandpass";
  breathFilter.frequency.value = 760;
  breathFilter.Q.value = 0.5;
  const breathGain = ctx.createGain();
  breathGain.gain.setValueAtTime(0.0001, now);
  breathGain.gain.setValueAtTime(0.0001, now + 1.95);
  breathGain.gain.linearRampToValueAtTime(0.2, now + 2.25);
  breathGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.05);
  breath.connect(breathFilter);
  breathFilter.connect(breathGain);
  breathGain.connect(master);
  breath.start(now + 1.9);
  breath.stop(now + 3.1);

  // One very distant two-note bird at t+3.15s.
  const bird = ctx.createOscillator();
  bird.type = "sine";
  const birdGain = ctx.createGain();
  bird.frequency.setValueAtTime(1760, now + 3.1);
  bird.frequency.exponentialRampToValueAtTime(2320, now + 3.28);
  bird.frequency.exponentialRampToValueAtTime(1940, now + 3.52);
  birdGain.gain.setValueAtTime(0.0001, now);
  birdGain.gain.setValueAtTime(0.0001, now + 3.08);
  birdGain.gain.linearRampToValueAtTime(0.026, now + 3.18);
  birdGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.62);
  bird.connect(birdGain);
  birdGain.connect(master);
  bird.start(now + 3.08);
  bird.stop(now + 3.7);

  // Wind arrives after the bird and dies before the camera reaches the book.
  const wind = ctx.createBufferSource();
  wind.buffer = buffer;
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "lowpass";
  windFilter.frequency.value = 520;
  windFilter.Q.value = 0.3;
  const windGain = ctx.createGain();
  windGain.gain.setValueAtTime(0.0001, now);
  windGain.gain.setValueAtTime(0.0001, now + 3.45);
  windGain.gain.linearRampToValueAtTime(0.34, now + 4.7);
  windGain.gain.linearRampToValueAtTime(0.2, now + 5.8);
  windGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.85);
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  wind.start(now);

  return {
    resume: () => { if (ctx.state === "suspended") void ctx.resume(); },
    setMuted: (muted: boolean) => {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.62, ctx.currentTime + 0.35);
    },
    dispose: () => { try { void ctx.close(); } catch { /* yoksay */ } },
  };
}

/** Quiet interior room tone that persists while the Living Book layout stays mounted. */
export function createCodexRoomTone(): Ambience {
  const Ctx: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let low = 0;
  for (let index = 0; index < length; index++) {
    low = low * 0.992 + (Math.random() * 2 - 1) * 0.008;
    data[index] = low;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 310;
  const gain = ctx.createGain();
  gain.gain.value = 0.32;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start();
  master.gain.linearRampToValueAtTime(0.34, ctx.currentTime + 1.8);

  return {
    resume: () => { if (ctx.state === "suspended") void ctx.resume(); },
    setMuted: (muted: boolean) => {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.34, ctx.currentTime + 0.4);
    },
    dispose: () => { try { void ctx.close(); } catch { /* yoksay */ } },
  };
}
