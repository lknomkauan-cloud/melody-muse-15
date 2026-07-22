import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Play, RotateCcw, Sparkles, CircleDot, GraduationCap, Volume2, ArrowRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeSolo } from "@/lib/analyze-solo.functions";
import { cn } from "@/lib/utils";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function freqToNote(freq: number) {
  if (!freq || freq < 20 || freq > 5000) return null;
  const midi = 69 + 12 * Math.log2(freq / 440);
  const midiRound = Math.round(midi);
  const cents = Math.round((midi - midiRound) * 100);
  const name = NOTE_NAMES[((midiRound % 12) + 12) % 12];
  const octave = Math.floor(midiRound / 12) - 1;
  return { name, octave, cents, midi: midiRound };
}

// YIN-style autocorrelation (simplified, fast, monofônico)
function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return 0; // muito baixo

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const trimmed = buf.slice(r1, r2);
  const T = trimmed.length;
  const c = new Array(T).fill(0);
  for (let i = 0; i < T; i++) for (let j = 0; j < T - i; j++) c[i] += trimmed[j] * trimmed[j + i];

  let d = 0;
  while (d < T - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < T; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  if (maxpos <= 0) return 0;

  let T0 = maxpos;
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export function EarCoach({
  tonic,
  modeName,
  pentatonicNotes,
  instrumentLabel,
}: {
  tonic: string;
  modeName: string;
  pentatonicNotes: string[];
  instrumentLabel: string;
}) {
  const [tab, setTab] = useState<"beginner" | "tuner" | "exercise" | "ai">("beginner");
  return (
    <div className="mt-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Coach de Ouvido — {modeName} ({tonic})</span>
        </div>
        <MicPermissionButton />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { id: "beginner", label: "👨‍🏫 Professor IA (iniciante)" },
          { id: "tuner", label: "Afinador ao vivo" },
          { id: "exercise", label: "Exercício guiado" },
          { id: "ai", label: "Analisar solo (IA)" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              tab === t.id ? "bg-primary text-primary-foreground shadow" : "bg-secondary/50 text-secondary-foreground hover:bg-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "beginner" && <BeginnerProfessor pentatonicNotes={pentatonicNotes} tonic={tonic} instrumentLabel={instrumentLabel} />}
      {tab === "tuner" && <LiveTuner pentatonicNotes={pentatonicNotes} tonic={tonic} />}
      {tab === "exercise" && <GuidedExercise pentatonicNotes={pentatonicNotes} tonic={tonic} />}
      {tab === "ai" && (
        <AiAnalyzer
          tonic={tonic}
          modeName={modeName}
          pentatonicNotes={pentatonicNotes}
          instrumentLabel={instrumentLabel}
        />
      )}
    </div>
  );
}

/* -------------------- 0) Professor IA — Iniciante -------------------- */
const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

function noteToFreq(name: string, octave: number): number {
  const semi = NOTE_TO_SEMITONE[name] ?? 0;
  const midi = (octave + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playReferenceTone(name: string, octave = 4, durationMs = 900) {
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = noteToFreq(name, octave);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
    setTimeout(() => ctx.close().catch(() => {}), durationMs + 200);
  } catch { /* noop */ }
}

function BeginnerProfessor({ pentatonicNotes, tonic, instrumentLabel }: { pentatonicNotes: string[]; tonic: string; instrumentLabel: string }) {
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<"waiting" | "close" | "correct">("waiting");
  const [hint, setHint] = useState<string>("");
  const { pitch, error, on, start, stop } = usePitchEngine();
  const sustainRef = useRef<{ name: string | null; since: number }>({ name: null, since: 0 });
  const target = pentatonicNotes[idx % pentatonicNotes.length];

  useEffect(() => { setStatus("waiting"); setHint(""); sustainRef.current = { name: null, since: 0 }; }, [idx]);

  useEffect(() => {
    if (!on || !pitch?.note) return;
    const now = performance.now();
    const heard = pitch.note.name;
    if (sustainRef.current.name !== heard) {
      sustainRef.current = { name: heard, since: now };
    }
    const heldFor = now - sustainRef.current.since;
    if (heard === target && Math.abs(pitch.note.cents) < 35 && heldFor >= 900) {
      setStatus("correct");
      setHint("🎉 Perfeito! Você tocou a nota certa e afinada.");
    } else if (heard === target && heldFor >= 500) {
      setStatus("close");
      const cents = pitch.note.cents;
      setHint(cents > 15 ? "Nota certa, mas um pouco AGUDA. Afrouxe um pouco." : cents < -15 ? "Nota certa, mas um pouco GRAVE. Ajuste a afinação." : "Nota certa! Segure firme mais um instante…");
    } else if (heard !== target && heldFor >= 500) {
      setStatus("waiting");
      // dica de direção
      const targetSemi = NOTE_TO_SEMITONE[target] ?? 0;
      const heardSemi = NOTE_TO_SEMITONE[heard] ?? 0;
      let diff = targetSemi - heardSemi;
      if (diff > 6) diff -= 12;
      if (diff < -6) diff += 12;
      setHint(`Você tocou ${heard}. Alvo: ${target}. ${diff > 0 ? "Suba" : "Desça"} ${Math.abs(diff)} semitom(ns).`);
    }
  }, [pitch, on, target]);

  const next = () => setIdx((i) => i + 1);
  const reset = () => { setIdx(0); setStatus("waiting"); setHint(""); };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-background/60 p-3">
        <GraduationCap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          Aula para iniciantes no <span className="font-semibold text-foreground">{instrumentLabel}</span>. Toque a nota que o Professor pedir. Ele ouve o microfone e diz se está certo, se está fora ou como corrigir a afinação. Comece pela tônica <span className="font-semibold text-primary">{tonic}</span>.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={on ? stop : start}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            on ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {on ? <><Square className="h-4 w-4" /> Parar aula</> : <><Mic className="h-4 w-4" /> Começar aula</>}
        </button>
        <button
          onClick={() => playReferenceTone(target, 4)}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20"
        >
          <Volume2 className="h-3.5 w-3.5" /> Ouvir a nota
        </button>
        <button
          onClick={next}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs font-medium hover:bg-secondary"
        >
          <ArrowRight className="h-3.5 w-3.5" /> Próxima nota
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs font-medium hover:bg-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className={cn(
        "rounded-xl border-2 p-5 text-center transition-colors",
        status === "correct" ? "border-emerald-500/70 bg-emerald-500/10" :
        status === "close" ? "border-amber-500/70 bg-amber-500/10" :
        "border-border bg-background/40",
      )}>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Toque esta nota</div>
        <div className={cn(
          "font-display text-6xl font-bold",
          status === "correct" ? "text-emerald-500" : status === "close" ? "text-amber-500" : "text-primary",
        )}>{target}</div>
        <div className="mt-2 text-sm text-muted-foreground">
          {on && pitch?.note ? <>Você tocou: <span className="font-semibold text-foreground">{pitch.note.name}{pitch.note.octave}</span> ({pitch.freq.toFixed(1)} Hz, {pitch.note.cents > 0 ? "+" : ""}{pitch.note.cents} cents)</> : on ? "Ouvindo… toque a nota." : "Clique em Começar aula e libere o microfone."}
        </div>
        {hint && <div className="mt-3 rounded-md bg-background/70 px-3 py-2 text-sm">{hint}</div>}
        {status === "correct" && (
          <button onClick={next} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <ArrowRight className="h-4 w-4" /> Próxima nota da pentatônica
          </button>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {pentatonicNotes.map((n, i) => (
          <button
            key={n}
            onClick={() => setIdx(i)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-semibold transition-all",
              i === idx % pentatonicNotes.length ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/60 text-muted-foreground hover:bg-secondary",
            )}
          >{n}</button>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Permissão do microfone (Android/APK) -------------------- */
function MicPermissionButton() {
  const [state, setState] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Permissions API pode não existir no WebView antigo
        const perms = (navigator as Navigator & { permissions?: { query: (d: { name: PermissionName }) => Promise<PermissionStatus> } }).permissions;
        if (perms?.query) {
          const s = await perms.query({ name: "microphone" as PermissionName });
          if (!cancelled) setState(s.state as typeof state);
          s.onchange = () => { if (!cancelled) setState(s.state as typeof state); };
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const request = async () => {
    setMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setState("granted");
      setMsg("Microfone liberado ✅");
    } catch (e) {
      setState("denied");
      setMsg(describeMicError(e));
    }
  };

  if (state === "granted") {
    return <span className="text-xs text-emerald-500 font-medium">🎤 Mic ok</span>;
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={request}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
      >
        <Mic className="h-3.5 w-3.5" />
        {state === "denied" ? "Mic bloqueado — tentar de novo" : "Permitir microfone"}
      </button>
      {msg && <span className="max-w-[240px] text-right text-[10px] text-muted-foreground whitespace-pre-wrap">{msg}</span>}
    </div>
  );
}

/* -------------------- 1) Afinador ao vivo -------------------- */
type PitchState = { freq: number; note: ReturnType<typeof freqToNote> } | null;

function isAndroidWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua) && /(; wv\)|Version\/[\d.]+ Chrome\/[\d.]+ Mobile)/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
}

function describeMicError(e: unknown): string {
  const apkHint = isAndroidWebView()
    ? "\n\nNo APK: verifique se o app tem a permissão de microfone ligada em Configurações → Apps → (este app) → Permissões → Microfone. O APK também precisa ter RECORD_AUDIO no AndroidManifest e liberar RESOURCE_AUDIO_CAPTURE no onPermissionRequest do WebView."
    : "";
  if (e instanceof Error) {
    if (e.name === "NotAllowedError" || e.name === "SecurityError")
      return "Permissão do microfone negada." + (isAndroidWebView() ? apkHint : " Toque no cadeado ao lado do endereço e permita o microfone.");
    if (e.name === "NotFoundError") return "Nenhum microfone encontrado no dispositivo." + apkHint;
    if (e.name === "NotReadableError") return "Microfone em uso por outro app. Feche e tente novamente." + apkHint;
    if (e.name === "OverconstrainedError") return "Microfone não suporta as configurações pedidas.";
    return (e.message || "Erro ao acessar o microfone") + apkHint;
  }
  return "Erro ao acessar o microfone" + apkHint;
}


function usePitchEngine() {
  const [pitch, setPitch] = useState<PitchState>(null);
  const [error, setError] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) { clearTimeout(rafRef.current); cancelAnimationFrame(rafRef.current); }
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setPitch(null);
    setOn(false);
  }, []);

  // IMPORTANTE: chamar SEM await antes — precisa estar direto no gesto do usuário (iOS Safari).
  const start = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este navegador não suporta microfone. Tente Chrome ou Safari atualizados.");
        return;
      }
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) { setError("AudioContext indisponível neste navegador."); return; }
      // Cria o AudioContext SÍNCRONO dentro do gesto (obrigatório no iOS)
      const ctx = new AC();
      ctxRef.current = ctx;
      // Pede o microfone imediatamente (a Promise é aceita como parte do gesto)
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      // Resume o contexto (necessário no iOS/Chrome mobile)
      try { await ctx.resume(); } catch { /* noop */ }
      const stream = await streamPromise;
      streamRef.current = stream;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096; // janela maior = leitura mais estável
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      // Estabilização: precisa ver a mesma nota várias vezes seguidas
      // antes de confirmar, e segura o valor por um tempo mínimo.
      const STABLE_FRAMES = 7;      // exige mais leituras iguais para confirmar
      const HOLD_MS = 1500;         // segura a nota exibida por 1,5s
      const SAMPLE_MS = 120;        // amostra mais espaçada, ~120ms
      let candidateName: string | null = null;
      let candidateCount = 0;
      let lastCommit: { name: string; at: number } | null = null;
      let freqSmooth = 0;

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, ctx.sampleRate);
        const note = freqToNote(f);
        const now = performance.now();

        if (f && note) {
          // suaviza a frequência exibida
          freqSmooth = freqSmooth ? freqSmooth * 0.7 + f * 0.3 : f;
          if (note.name === candidateName) {
            candidateCount++;
          } else {
            candidateName = note.name;
            candidateCount = 1;
          }
          if (candidateCount >= STABLE_FRAMES) {
            lastCommit = { name: note.name, at: now };
            setPitch({ freq: freqSmooth, note });
          } else if (lastCommit && now - lastCommit.at < HOLD_MS) {
            // mantém a nota anterior estável enquanto acumula confiança
          } else if (!lastCommit) {
            // nada ainda — não pisca
          }
        } else {
          candidateName = null;
          candidateCount = 0;
          if (!lastCommit || now - lastCommit.at > HOLD_MS) {
            lastCommit = null;
            freqSmooth = 0;
            setPitch(null);
          }
        }
        rafRef.current = window.setTimeout(tick, SAMPLE_MS) as unknown as number;
      };
      setOn(true);
      tick();
    } catch (e) {
      setError(describeMicError(e));
      stop();
    }
  }, [stop]);

  useEffect(() => () => { stop(); }, [stop]);

  return { pitch, error, on, start, stop };
}

function LiveTuner({ pentatonicNotes, tonic }: { pentatonicNotes: string[]; tonic: string }) {
  const { pitch, error, on, start, stop } = usePitchEngine();
  const inScale = pitch?.note ? pentatonicNotes.includes(pitch.note.name) : false;
  const isTonic = pitch?.note?.name === tonic;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={on ? stop : start}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            on ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {on ? <><Square className="h-4 w-4" /> Parar</> : <><Mic className="h-4 w-4" /> Ligar microfone</>}
        </button>
        <span className="text-xs text-muted-foreground">Toque uma nota por vez</span>
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <div className={cn(
        "rounded-xl border p-4 text-center transition-colors",
        !on ? "border-border bg-background/40" :
        !pitch?.note ? "border-border bg-background/40" :
        inScale ? "border-emerald-500/60 bg-emerald-500/10" : "border-red-500/60 bg-red-500/10",
      )}>
        {!on && <p className="text-sm text-muted-foreground">Clique em "Ligar microfone" e comece a tocar.</p>}
        {on && !pitch?.note && <p className="text-sm text-muted-foreground">Ouvindo…</p>}
        {on && pitch?.note && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-center gap-2">
              <span className={cn("font-display text-5xl font-bold", isTonic ? "text-primary" : inScale ? "text-emerald-500" : "text-red-500")}>
                {pitch.note.name}
              </span>
              <span className="text-lg text-muted-foreground">{pitch.note.octave}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {pitch.freq.toFixed(1)} Hz · {pitch.note.cents > 0 ? "+" : ""}{pitch.note.cents} cents
            </div>
            <div className="text-sm font-medium">
              {isTonic ? "🎯 Tônica!" : inScale ? "✅ Dentro da pentatônica" : "⚠️ Fora da pentatônica"}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {pentatonicNotes.map((n) => (
          <span key={n} className={cn(
            "rounded-md border px-2 py-1 text-xs font-semibold",
            pitch?.note?.name === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/60 text-muted-foreground",
          )}>{n}</span>
        ))}
      </div>
    </div>
  );
}


/* -------------------- 2) Exercício guiado -------------------- */
function GuidedExercise({ pentatonicNotes, tonic }: { pentatonicNotes: string[]; tonic: string }) {
  const sequence = [...pentatonicNotes, pentatonicNotes[0]]; // sobe até oitava
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState<Array<"ok" | "off">>([]);
  const { pitch, error, on, start, stop } = usePitchEngine();
  const lastMatchRef = useRef<number>(0);
  const sustainRef = useRef<{ name: string | null; since: number }>({ name: null, since: 0 });

  useEffect(() => {
    if (!on || !pitch?.note) { sustainRef.current = { name: null, since: 0 }; return; }
    const target = sequence[idx];
    const now = performance.now();
    // exige que a nota seja sustentada por pelo menos 1,5s antes de contar
    const SUSTAIN_MS = 1500;
    const COOLDOWN_MS = 1000;
    if (sustainRef.current.name !== pitch.note.name) {
      sustainRef.current = { name: pitch.note.name, since: now };
      return;
    }
    const heldFor = now - sustainRef.current.since;
    if (now - lastMatchRef.current < COOLDOWN_MS) return;
    if (pitch.note.name === target && Math.abs(pitch.note.cents) < 40 && heldFor >= SUSTAIN_MS) {
      lastMatchRef.current = now;
      sustainRef.current = { name: null, since: 0 };
      setHits((h) => [...h, "ok"]);
      setIdx((i) => Math.min(i + 1, sequence.length));
    } else if (pentatonicNotes.includes(pitch.note.name) === false && Math.abs(pitch.note.cents) < 40 && heldFor >= SUSTAIN_MS) {
      // nota completamente fora, sustentada — marca erro leve mas não avança
      if (now - lastMatchRef.current > 1200) {
        lastMatchRef.current = now;
        setHits((h) => (h[h.length - 1] === "off" ? h : [...h, "off"]));
      }
    }
  }, [pitch, on, idx, sequence, pentatonicNotes]);

  const done = idx >= sequence.length;
  const okCount = hits.filter((h) => h === "ok").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={on ? stop : start}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            on ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {on ? <><Square className="h-4 w-4" /> Parar</> : <><Play className="h-4 w-4" /> Iniciar exercício</>}
        </button>
        <button
          onClick={() => { setIdx(0); setHits([]); }}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs font-medium hover:bg-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <p className="mb-2 text-xs text-muted-foreground">
        Toque a pentatônica de <span className="font-semibold text-foreground">{tonic}</span> ascendente. Quando acertar cada nota, o app avança.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {sequence.map((n, i) => (
          <div key={i} className={cn(
            "flex min-w-[44px] flex-col items-center rounded-lg border px-2 py-1.5 text-center transition-all",
            i < idx ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-500" :
            i === idx ? "border-primary bg-primary/20 text-primary animate-pulse" :
            "border-border bg-background/40 text-muted-foreground",
          )}>
            <span className="text-[10px] opacity-70">{i + 1}</span>
            <span className="font-display text-sm font-bold">{n}</span>
          </div>
        ))}
      </div>

      {done && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/40 p-3 text-sm">
          🎉 Concluído! Acertos: {okCount}/{sequence.length}
          {hits.filter((h) => h === "off").length > 0 && (
            <span className="block text-xs text-muted-foreground mt-1">
              Notas fora detectadas: {hits.filter((h) => h === "off").length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------- 3) Analisar solo com IA -------------------- */
function AiAnalyzer({ tonic, modeName, pentatonicNotes, instrumentLabel }: {
  tonic: string; modeName: string; pentatonicNotes: string[]; instrumentLabel: string;
}) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyze = useServerFn(analyzeSolo);

  const start = useCallback(async () => {
    setError(null); setFeedback(null); setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao acessar o microfone");
    }
  }, [audioUrl]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const send = useCallback(async () => {
    if (!audioBlob) return;
    if (audioBlob.size < 3000) { setError("Gravação muito curta. Toque por alguns segundos."); return; }
    setLoading(true); setError(null); setFeedback(null);
    try {
      const arr = new Uint8Array(await audioBlob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
      const b64 = btoa(bin);
      const type = audioBlob.type;
      const format: "webm" | "mp4" | "wav" | "mp3" | "m4a" | "ogg" =
        type.includes("mp4") ? "mp4" :
        type.includes("wav") ? "wav" :
        type.includes("mpeg") ? "mp3" :
        type.includes("ogg") ? "ogg" : "webm";
      const res = await analyze({ data: {
        audioBase64: b64, format,
        tonic, modeName, pentatonicNotes, instrument: instrumentLabel,
      } });
      setFeedback(res.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao analisar áudio");
    } finally {
      setLoading(false);
    }
  }, [audioBlob, analyze, tonic, modeName, pentatonicNotes, instrumentLabel]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Grave 5–15 segundos tocando a pentatônica e a IA vai dizer se você tocou dentro da escala, se está afinado e o que corrigir.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {!recording ? (
          <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <CircleDot className="h-4 w-4" /> Gravar
          </button>
        ) : (
          <button onClick={stop} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground animate-pulse">
            <Square className="h-4 w-4" /> Parar gravação
          </button>
        )}
        {audioBlob && !recording && (
          <button onClick={send} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analisando…" : "Analisar com IA"}
          </button>
        )}
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full" />
      )}

      {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}

      {feedback && (
        <div className="rounded-lg border border-primary/30 bg-background/60 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {feedback}
        </div>
      )}
    </div>
  );
}
