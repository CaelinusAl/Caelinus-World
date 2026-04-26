"use client";

/**
 * <PlantVoice />
 *
 * Lets a Caelinus plant speak. Two-tier audio strategy:
 *
 *   1. Pre-generated MP3 (preferred) — /audio/plants/{id}.{lang}.mp3
 *      Produced by `scripts/generate-plant-audio.ts` via ElevenLabs.
 *      Browser plays the static asset; the API key never reaches the
 *      client.
 *
 *   2. Web Speech fallback (always available) — `speechSynthesis`.
 *      Works without any network call, robotic but functional. Used
 *      when the MP3 is missing or HEAD probe fails.
 *
 * Line-by-line transcript synchronization:
 *   - MP3 path  → linear time mapping (currentTime / duration → line index)
 *   - Speech    → SpeechSynthesisUtterance `boundary` events when
 *                 available; otherwise a graceful per-line linear timer.
 *
 * The component is fully self-contained: drop it on a page with a
 * `script` prop and it handles everything else.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fullScript,
  type PlantVoiceScript,
  type Lang,
} from "@/data/plant-voices";

type Source = "mp3" | "speech" | "none";

type Props = {
  script: PlantVoiceScript;
  /** Display language. Audio will try this language first. */
  lang?: Lang;
  /** Optional plant name for the header — purely cosmetic. */
  plantName?: string;
  /** Optional plant frequency badge — purely cosmetic. */
  frequency?: number;
  /** Hex tone for accent (defaults to soft gold). */
  tone?: string;
};

const PV_TEXT = {
  speaking:    { tr: "Bu bitki konuşuyor", en: "This plant is speaking" },
  source:      { tr: "Ses kaynağı",         en: "Audio source" },
  play:        { tr: "Sesi başlat",         en: "Play voice" },
  pause:       { tr: "Sesi durdur",         en: "Pause voice" },
  ariaSuffix:  { tr: "sesi",                en: "voice" },
  studioLabel: { tr: "♪ Stüdyo sesi",       en: "♪ Studio voice" },
  speechLabel: {
    tr: "◐ Yakında konuşacak · geçici ses",
    en: "◐ Coming soon · temporary voice",
  },
  fallbackNote: {
    tr: "Şimdilik geçici (Web Speech) ses çalıyor. Bu bitkinin gerçek stüdyo kaydı (ElevenLabs MP3) yüklendiği anda otomatik olarak gerçek sesine geçilecek — toprağın kendi tonu duyulacak.",
    en: "A temporary Web Speech voice is playing for now. The moment this plant's studio recording (ElevenLabs MP3) is uploaded, the page will switch to its true voice automatically — the soil's own tone will be heard.",
  },
} as const;

export default function PlantVoice({
  script,
  lang = "tr",
  plantName,
  frequency,
  tone = "#d4b78a",
}: Props) {
  const audioUrl = `/audio/plants/${script.id}.${lang}.mp3`;
  const utterance = useMemo(() => fullScript(script, lang), [script, lang]);

  // Pre-compute the char index where each line begins, so we can map
  // a SpeechSynthesis `boundary` charIndex back to a line.
  const lineOffsets = useMemo(() => {
    const offs: number[] = [];
    let acc = 0;
    for (const line of script.lines) {
      offs.push(acc);
      acc += line[lang].length + 1; // +1 for the space joiner
    }
    return offs;
  }, [script, lang]);

  const [source, setSource] = useState<Source>("none");
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [progress, setProgress] = useState(0); // 0..1

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  /* ───── Source resolution ───── */

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setCurrentLine(-1);
    setProgress(0);

    // Probe whether the MP3 exists. HEAD avoids downloading the body.
    (async () => {
      try {
        const res = await fetch(audioUrl, { method: "HEAD" });
        if (cancelled) return;
        if (res.ok) {
          setSource("mp3");
          setReady(true);
          return;
        }
        throw new Error(`status ${res.status}`);
      } catch {
        if (cancelled) return;
        // Web Speech availability check
        if (
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          setSource("speech");
          setReady(true);
        } else {
          setSource("none");
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  /* ───── Cleanup on unmount / source change ───── */

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setPlaying(false);
    setCurrentLine(-1);
    setProgress(0);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  /* ───── MP3 path ───── */

  useEffect(() => {
    if (source !== "mp3") return;
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      const ratio = audio.currentTime / audio.duration;
      setProgress(ratio);
      const idx = Math.min(
        script.lines.length - 1,
        Math.floor(ratio * script.lines.length),
      );
      setCurrentLine(idx);
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrentLine(-1);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [source, script.lines.length]);

  /* ───── Speech fallback ───── */

  const startSpeech = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(utterance);
    u.lang = lang === "tr" ? "tr-TR" : "en-US";
    u.rate = 0.92;
    u.pitch = 1;
    u.volume = 1;

    // Try to select a matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? voices[0];
    if (preferred) u.voice = preferred;

    let boundaryFired = false;
    u.onboundary = (ev) => {
      boundaryFired = true;
      const idx = lineOffsets.findIndex(
        (start, i) =>
          ev.charIndex >= start &&
          (i === lineOffsets.length - 1 || ev.charIndex < lineOffsets[i + 1]),
      );
      if (idx >= 0) {
        setCurrentLine(idx);
        setProgress((idx + 1) / script.lines.length);
      }
    };
    u.onend = () => {
      setPlaying(false);
      setCurrentLine(-1);
      setProgress(0);
      if (fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    utteranceRef.current = u;
    setPlaying(true);
    setCurrentLine(0);
    setProgress(1 / script.lines.length);
    window.speechSynthesis.speak(u);

    // Browsers that don't fire `boundary` (notably some Safari builds):
    // run a soft timer that walks the lines, starting after a short
    // delay so we don't fight a real boundary callback.
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
    }
    const walkLine = (i: number) => {
      if (boundaryFired) return; // boundary handler is in charge
      if (i >= script.lines.length) return;
      setCurrentLine(i);
      setProgress((i + 1) / script.lines.length);
      const wordsPerSecond = 2.4 * u.rate; // very rough Turkish pacing
      const seconds =
        Math.max(2.5, script.lines[i][lang].split(/\s+/).length / wordsPerSecond);
      fallbackTimerRef.current = window.setTimeout(
        () => walkLine(i + 1),
        seconds * 1000,
      );
    };
    fallbackTimerRef.current = window.setTimeout(() => walkLine(0), 1500);
  }, [utterance, lang, lineOffsets, script.lines]);

  /* ───── Play / pause ───── */

  const handlePlay = useCallback(() => {
    if (!ready) return;
    if (playing) {
      stopAll();
      return;
    }
    if (source === "mp3" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          // Autoplay/permissions block — fall back to speech
          setSource("speech");
          startSpeech();
        });
      return;
    }
    if (source === "speech") {
      startSpeech();
      return;
    }
  }, [ready, playing, source, stopAll, startSpeech]);

  /* ───── Render ───── */

  const sourceLabel =
    source === "mp3" ? PV_TEXT.studioLabel[lang] :
    source === "speech" ? PV_TEXT.speechLabel[lang] :
    "—";

  const sourceClass =
    source === "mp3" ? "is-studio" :
    source === "speech" ? "is-speech" :
    "is-none";

  return (
    <section
      className={`plant-voice ${playing ? "is-playing" : ""}`}
      style={{ ["--pv-tone" as string]: tone } as React.CSSProperties}
      aria-label={`${plantName ?? script.id} ${PV_TEXT.ariaSuffix[lang]}`}
    >
      {/* Hidden audio element — only used in MP3 path */}
      {source === "mp3" && (
        <audio ref={audioRef} preload="auto" src={audioUrl} />
      )}

      <header className="plant-voice-head">
        <div className="plant-voice-status">
          <span className="plant-voice-dot" aria-hidden="true" />
          <span>{PV_TEXT.speaking[lang]}</span>
        </div>
        <div
          className={`plant-voice-source ${sourceClass}`}
          title={PV_TEXT.source[lang]}
        >
          {sourceLabel}
        </div>
      </header>

      <div className="plant-voice-stage">
        {/* Play button — large, editorial */}
        <button
          type="button"
          className={`plant-voice-play ${playing ? "is-playing" : ""}`}
          onClick={handlePlay}
          disabled={!ready}
          aria-label={playing ? PV_TEXT.pause[lang] : PV_TEXT.play[lang]}
        >
          {playing ? (
            <span className="plant-voice-play-icon" aria-hidden="true">
              ❘❘
            </span>
          ) : (
            <span className="plant-voice-play-icon" aria-hidden="true">
              ▶
            </span>
          )}
        </button>

        {/* Frequency anchor */}
        {frequency != null && (
          <div className="plant-voice-hz">
            <span className="plant-voice-hz-num">{frequency}</span>
            <span className="plant-voice-hz-unit">Hz</span>
          </div>
        )}

        {/* Audio bars — animate while playing */}
        <div className="plant-voice-bars" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="plant-voice-bar"
              style={{
                animationDelay: `${(i % 7) * 0.08}s`,
                height: `${20 + ((i * 13) % 60)}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress thread */}
      <div className="plant-voice-progress" aria-hidden="true">
        <div
          className="plant-voice-progress-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Transcript */}
      <ol className="plant-voice-transcript">
        {script.lines.map((line, i) => (
          <li
            key={i}
            className={`plant-voice-line ${
              i === currentLine ? "is-current" : ""
            } ${i < currentLine ? "is-past" : ""}`}
          >
            <span className="plant-voice-line-mark" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="plant-voice-line-text">{line[lang]}</span>
          </li>
        ))}
      </ol>

      {source === "speech" && (
        <p className="plant-voice-note">{PV_TEXT.fallbackNote[lang]}</p>
      )}
    </section>
  );
}
