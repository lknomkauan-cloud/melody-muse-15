import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GraduationCap, Mic, Square, Volume2, RotateCcw, CheckCircle2, Circle } from "lucide-react";
import * as Tone from "tone";
import { InstrumentDiagram, type InstrumentId } from "@/components/InstrumentDiagram";
import { cn } from "@/lib/utils";

/* ---------- Samples reais por instrumento (FluidR3_GM soundfont) ---------- */
const GM = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM";
const SAMPLER_CONFIG: Record<InstrumentId, { baseUrl: string; urls: Record<string, string> }> = {
  violao: { baseUrl: `${GM}/acoustic_guitar_nylon-mp3/`, urls: { E2:"E2.mp3", A2:"A2.mp3", D3:"D3.mp3", G3:"G3.mp3", B3:"B3.mp3", E4:"E4.mp3", A4:"A4.mp3", D5:"D5.mp3" } },
  guitarra: { baseUrl: `${GM}/electric_guitar_clean-mp3/`, urls: { E2:"E2.mp3", A2:"A2.mp3", D3:"D3.mp3", G3:"G3.mp3", B3:"B3.mp3", E4:"E4.mp3", A4:"A4.mp3", D5:"D5.mp3" } },
  baixo: { baseUrl: `${GM}/electric_bass_finger-mp3/`, urls: { E1:"E1.mp3", A1:"A1.mp3", D2:"D2.mp3", G2:"G2.mp3", C3:"C3.mp3", E3:"E3.mp3", A3:"A3.mp3" } },
  piano: { baseUrl: `${GM}/acoustic_grand_piano-mp3/`, urls: { C3:"C3.mp3", C4:"C4.mp3", E4:"E4.mp3", G4:"G4.mp3", C5:"C5.mp3", E5:"E5.mp3", G5:"G5.mp3", C6:"C6.mp3" } },
  teclado: { baseUrl: `${GM}/electric_piano_1-mp3/`, urls: { C3:"C3.mp3", C4:"C4.mp3", E4:"E4.mp3", G4:"G4.mp3", C5:"C5.mp3", E5:"E5.mp3", C6:"C6.mp3" } },
  violino: { baseUrl: `${GM}/violin-mp3/`, urls: { G3:"G3.mp3", D4:"D4.mp3", A4:"A4.mp3", E5:"E5.mp3", A5:"A5.mp3", E6:"E6.mp3" } },
  sax: { baseUrl: `${GM}/alto_sax-mp3/`, urls: { C4:"C4.mp3", E4:"E4.mp3", G4:"G4.mp3", C5:"C5.mp3", E5:"E5.mp3", G5:"G5.mp3" } },
  banjo: { baseUrl: `${GM}/banjo-mp3/`, urls: { G3:"G3.mp3", C4:"C4.mp3", E4:"E4.mp3", G4:"G4.mp3", C5:"C5.mp3", E5:"E5.mp3" } },
  flauta: { baseUrl: `${GM}/recorder-mp3/`, urls: { C4:"C4.mp3", E4:"E4.mp3", G4:"G4.mp3", C5:"C5.mp3", E5:"E5.mp3", G5:"G5.mp3", C6:"C6.mp3" } },
  bateria: { baseUrl: `${GM}/xylophone-mp3/`, urls: { C4:"C4.mp3", G4:"G4.mp3", C5:"C5.mp3", G5:"G5.mp3", C6:"C6.mp3" } },
};

const INSTRUMENT_OCTAVE: Record<InstrumentId, number> = {
  violao: 3, guitarra: 3, baixo: 2, piano: 4, teclado: 4, violino: 4, sax: 4, banjo: 4, flauta: 5, bateria: 4,
};

const samplerCache = new Map<InstrumentId, { sampler: Tone.Sampler; ready: Promise<void> }>();
async function getSampler(inst: InstrumentId): Promise<Tone.Sampler | null> {
  const cfg = SAMPLER_CONFIG[inst];
  if (!cfg) return null;
  let entry = samplerCache.get(inst);
  if (!entry) {
    let resolveReady!: () => void;
    let rejectReady!: (e: unknown) => void;
    const ready = new Promise<void>((res, rej) => { resolveReady = res; rejectReady = rej; });
    const sampler = new Tone.Sampler({
      urls: cfg.urls, baseUrl: cfg.baseUrl, release: 1,
      onload: () => resolveReady(), onerror: (e) => rejectReady(e),
    }).toDestination();
    entry = { sampler, ready };
    samplerCache.set(inst, entry);
  }
  try { await entry.ready; } catch (e) {
    console.error(`Sampler load failed for ${inst}`, e);
    samplerCache.delete(inst);
    return null;
  }
  return entry.sampler;
}

export const Route = createFileRoute("/professor")({
  head: () => ({
    meta: [
      { title: "Professor Iniciante — Solando" },
      { name: "description", content: "Aprenda do zero: notas básicas, tríades e tétrades em todos os instrumentos com um professor de IA que ouve e corrige sua execução em tempo real." },
      { property: "og:title", content: "Professor Iniciante — Solando" },
      { property: "og:description", content: "Aula do zero em todos os instrumentos com correção por IA através do microfone." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Professor Iniciante — Solando" },
      { name: "twitter:description", content: "Aula do zero com correção por IA em tempo real." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfessorPage,
});

/* ---------- Teoria: nomes de notas e acordes ---------- */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};
const pcOf = (n: string) => NOTE_TO_SEMITONE[n] ?? 0;
const nameOfPc = (pc: number) => NOTE_NAMES[((pc % 12) + 12) % 12];

type ChordKind = { id: string; label: string; suffix: string; intervals: number[]; family: "triad" | "tetrad" };

const TRIADS: ChordKind[] = [
  { id: "maj", label: "Maior", suffix: "", intervals: [0, 4, 7], family: "triad" },
  { id: "min", label: "Menor", suffix: "m", intervals: [0, 3, 7], family: "triad" },
  { id: "dim", label: "Diminuta", suffix: "°", intervals: [0, 3, 6], family: "triad" },
  { id: "aug", label: "Aumentada", suffix: "+", intervals: [0, 4, 8], family: "triad" },
  { id: "sus2", label: "Sus2", suffix: "sus2", intervals: [0, 2, 7], family: "triad" },
  { id: "sus4", label: "Sus4", suffix: "sus4", intervals: [0, 5, 7], family: "triad" },
];

const TETRADS: ChordKind[] = [
  { id: "maj7", label: "Maior 7", suffix: "maj7", intervals: [0, 4, 7, 11], family: "tetrad" },
  { id: "7", label: "Dominante 7", suffix: "7", intervals: [0, 4, 7, 10], family: "tetrad" },
  { id: "m7", label: "Menor 7", suffix: "m7", intervals: [0, 3, 7, 10], family: "tetrad" },
  { id: "m7b5", label: "Meio-diminuto", suffix: "m7b5", intervals: [0, 3, 6, 10], family: "tetrad" },
  { id: "dim7", label: "Diminuto 7", suffix: "°7", intervals: [0, 3, 6, 9], family: "tetrad" },
  { id: "mMaj7", label: "Menor Maior 7", suffix: "mMaj7", intervals: [0, 3, 7, 11], family: "tetrad" },
];

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"];

const INSTRUMENTS: { id: InstrumentId; label: string; beginnerTip: string; startingNotes: string[] }[] = [
  { id: "violao", label: "Violão", beginnerTip: "Comece com acordes abertos (dedos livres). Foque em pressionar firme e perto do traste.", startingNotes: ["E", "A", "D", "G", "B", "E"] },
  { id: "guitarra", label: "Guitarra", beginnerTip: "Postura relaxada, palheta com pouca força. Treine trocas de acorde antes de solar.", startingNotes: ["E", "A", "D", "G", "B", "E"] },
  { id: "baixo", label: "Baixo", beginnerTip: "Alterne indicador e médio. Treine escalas cromáticas para precisão rítmica.", startingNotes: ["E", "A", "D", "G"] },
  { id: "piano", label: "Piano", beginnerTip: "Postura das mãos redondas, pulsos soltos. Comece pela dedilhação 1-2-3-1-2-3-4-5 em C.", startingNotes: ["C", "D", "E", "F", "G", "A", "B"] },
  { id: "teclado", label: "Teclado", beginnerTip: "Explore os timbres, mas estude sempre com som de piano acústico primeiro.", startingNotes: ["C", "D", "E", "F", "G", "A", "B"] },
  { id: "violino", label: "Violino", beginnerTip: "Segure o arco corretamente. Treine notas longas, uma de cada vez, mantendo o som limpo.", startingNotes: ["G", "D", "A", "E"] },
  { id: "sax", label: "Saxofone", beginnerTip: "Foque na embocadura e na respiração diafragmática. Toque notas longas com estabilidade.", startingNotes: ["C", "D", "E", "F", "G"] },
  { id: "banjo", label: "Banjo", beginnerTip: "Use dedeiras. Comece com o rolo alternado (T-I-M-T-I-M).", startingNotes: ["D", "G", "B", "D"] },
  { id: "flauta", label: "Flauta Doce", beginnerTip: "Sopro leve e constante para evitar ruídos. Cubra os furos totalmente com as polpas dos dedos.", startingNotes: ["C", "D", "E", "F", "G"] },
];

/* ---------- Detecção de altura (autocorrelação simples) ---------- */

function freqToNote(freq: number) {
  if (!freq || freq < 20 || freq > 5000) return null;
  const midi = 69 + 12 * Math.log2(freq / 440);
  const midiRound = Math.round(midi);
  const cents = Math.round((midi - midiRound) * 100);
  const name = NOTE_NAMES[((midiRound % 12) + 12) % 12];
  const octave = Math.floor(midiRound / 12) - 1;
  return { name, octave, cents, midi: midiRound };
}

function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return 0;
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const trimmed = buf.slice(r1, r2);
  const T = trimmed.length;
  const c = new Array(T).fill(0);
  for (let i = 0; i < T; i++) for (let j = 0; j < T - i; j++) c[i] += trimmed[j] * trimmed[j + i];
  let d = 0;
  while (d < T - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < T; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  if (maxpos <= 0) return 0;
  let T0 = maxpos;
  const x1 = c[T0 - 1] ?? 0, x2 = c[T0], x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

type PitchState = { freq: number; note: NonNullable<ReturnType<typeof freqToNote>> } | null;

function usePitchEngine() {
  const [pitch, setPitch] = useState<PitchState>(null);
  const [error, setError] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const timerRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setPitch(null);
    setOn(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) { setError("AudioContext indisponível."); return; }
      const ctx = new AC();
      ctxRef.current = ctx;
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      try { await ctx.resume(); } catch { /* noop */ }
      const stream = await streamPromise;
      streamRef.current = stream;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      const SAMPLE_MS = 120;
      const STABLE_FRAMES = 5;
      const HOLD_MS = 1200;
      let candidate: string | null = null;
      let count = 0;
      let lastCommit: { name: string; at: number } | null = null;
      let smooth = 0;

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, ctx.sampleRate);
        const note = freqToNote(f);
        const now = performance.now();
        if (f && note) {
          smooth = smooth ? smooth * 0.7 + f * 0.3 : f;
          if (note.name === candidate) count++;
          else { candidate = note.name; count = 1; }
          if (count >= STABLE_FRAMES) {
            lastCommit = { name: note.name, at: now };
            setPitch({ freq: smooth, note });
          }
        } else {
          candidate = null; count = 0;
          if (!lastCommit || now - lastCommit.at > HOLD_MS) { lastCommit = null; smooth = 0; setPitch(null); }
        }
        timerRef.current = window.setTimeout(tick, SAMPLE_MS) as unknown as number;
      };
      setOn(true);
      tick();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao acessar o microfone");
      stop();
    }
  }, [stop]);

  useEffect(() => () => { stop(); }, [stop]);
  return { pitch, error, on, start, stop };
}

/* ---------- Áudio: som real do instrumento ---------- */


async function playTone(name: string, octave = 4, durationMs = 900, instrument: InstrumentId = "piano") {
  try {
    await Tone.start();
    const sampler = await getSampler(instrument);
    const noteName = `${name}${octave}`;
    if (sampler) {
      sampler.triggerAttackRelease(noteName, durationMs / 1000);
      return;
    }
    // fallback synth
    const synth = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
    synth.triggerAttackRelease(noteName, durationMs / 1000);
    setTimeout(() => synth.dispose(), durationMs + 400);
  } catch (e) { console.error("playTone", e); }
}

async function playChord(pcs: number[], root: string, instrument: InstrumentId = "piano", durationMs = 1600) {
  try {
    await Tone.start();
    const sampler = await getSampler(instrument);
    const octBase = INSTRUMENT_OCTAVE[instrument] ?? 4;
    const rootPc = pcOf(root);
    const notes: string[] = [];
    let prevPc = -1;
    let oct = octBase;
    for (const semi of pcs) {
      const pc = (rootPc + semi) % 12;
      if (prevPc !== -1 && pc <= prevPc) oct++;
      prevPc = pc;
      notes.push(`${nameOfPc(pc)}${oct}`);
    }
    if (sampler) {
      const now = Tone.now();
      // strum-like: cordas em arpejo rápido; teclas/sopros: bloco
      const isString = instrument === "violao" || instrument === "guitarra" || instrument === "banjo" || instrument === "baixo" || instrument === "ukulele" as InstrumentId;
      const step = isString ? 0.06 : 0;
      notes.forEach((n, i) => sampler.triggerAttackRelease(n, durationMs / 1000, now + i * step));
      return;
    }
    const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } }).toDestination();
    (synth.volume as Tone.Param<"decibels">).value = -8;
    synth.triggerAttackRelease(notes, durationMs / 1000);
    setTimeout(() => synth.dispose(), durationMs + 400);
  } catch (e) { console.error("playChord", e); }
}

async function playMelodySequence(pcs: number[], root: string, instrument: InstrumentId = "piano", durationMs = 600) {
  try {
    await Tone.start();
    const sampler = await getSampler(instrument);
    const octBase = INSTRUMENT_OCTAVE[instrument] ?? 4;
    const rootPc = pcOf(root);
    const now = Tone.now();

    let prevPc = -1;
    let oct = octBase;
    
    pcs.forEach((semi, i) => {
      const pc = (rootPc + semi) % 12;
      if (prevPc !== -1 && pc <= prevPc) oct++;
      prevPc = pc;
      const noteName = `${nameOfPc(pc)}${oct}`;
      
      if (sampler) {
        sampler.triggerAttackRelease(noteName, durationMs / 1000, now + i * 0.5);
      } else {
        const synth = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
        synth.triggerAttackRelease(noteName, durationMs / 1000, now + i * 0.5);
        setTimeout(() => synth.dispose(), (i * 500) + durationMs + 400);
      }
    });
  } catch (e) { console.error("playMelodySequence", e); }
}



/* ---------- Página ---------- */

function ProfessorPage() {
  const [instrumentId, setInstrumentId] = useState<InstrumentId>("violao");
  const [root, setRoot] = useState<string>("C");
  const [chord, setChord] = useState<ChordKind>(TRIADS[0]);

  const instrument = INSTRUMENTS.find((i) => i.id === instrumentId)!;
  const isMelodic = instrumentId === "sax" || instrumentId === "violino" || instrumentId === "flauta" || instrumentId === "baixo";

  const chordPcs = useMemo(() => new Set(chord.intervals.map((s) => (pcOf(root) + s + 120) % 12)), [chord, root]);
  const chordNoteNames = useMemo(() => chord.intervals.map((s) => nameOfPc(pcOf(root) + s)), [chord, root]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <header className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-3">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Professor Iniciante</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Aula do zero em todos os instrumentos: notas básicas e fundamentos musicais com correção por IA em tempo real.
            </p>
          </div>
        </header>

        {/* Seletor de instrumento */}
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Escolha o instrumento</h2>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map((i) => (
              <button
                key={i.id}
                onClick={() => setInstrumentId(i.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                  i.id === instrumentId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary",
                )}
              >
                {i.label}
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            💡 <span className="font-medium text-foreground">Dica para {instrument.label}:</span> {instrument.beginnerTip}
          </p>
        </section>

        {/* Notas iniciantes */}
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 font-display text-lg font-semibold">1. Notas para começar</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Toque cada nota abaixo e ouça o som de referência. Depois ligue o microfone e o Professor confere.
          </p>
          <div className="flex flex-wrap gap-2">
            {instrument.startingNotes.map((n, i) => (
              <button
                key={`${n}-${i}`}
                onClick={() => playTone(n, INSTRUMENT_OCTAVE[instrumentId], 900, instrumentId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
                title="Ouvir referência"
              >
                <Volume2 className="h-3.5 w-3.5" /> {n}
              </button>
            ))}
          </div>
          <NoteListener notes={instrument.startingNotes} />
        </section>

        {/* Construção dos acordes / Sequências Melódicas */}
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 font-display text-lg font-semibold">
            {isMelodic ? "2. Sequências e Arpejos" : "2. Construção de acordes"}
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {isMelodic 
              ? "Para instrumentos melódicos, praticamos as notas de uma harmonia uma por vez. O diagrama mostra a posição de cada nota no seu instrumento."
              : "Escolha a nota fundamental e o tipo do acorde. O diagrama mostra onde cada nota fica no seu instrumento."}
          </p>

          <div className="mb-3">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fundamental / Tom</div>
            <div className="flex flex-wrap gap-1.5">
              {ROOTS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoot(r)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-semibold transition-all",
                    r === root ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary",
                  )}
                >{r}</button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tríades (3 notas)</div>
            <div className="flex flex-wrap gap-1.5">
              {TRIADS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChord(c)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                    c.id === chord.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary",
                  )}
                >
                  {root}{c.suffix} · {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tétrades (4 notas)</div>
            <div className="flex flex-wrap gap-1.5">
              {TETRADS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChord(c)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                    c.id === chord.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary",
                  )}
                >
                  {root}{c.suffix} · {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-primary/30 bg-background/40 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-muted-foreground">{isMelodic ? "Sequência selecionada" : "Acorde selecionado"}</span>
                <div className="font-display text-2xl font-bold text-primary">
                  {root}{chord.suffix} <span className="text-sm font-normal text-muted-foreground">({chord.label})</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {chordNoteNames.map((n, i) => (
                    <span key={i} className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {i + 1}. {n}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => isMelodic ? playMelodySequence(chord.intervals, root, instrumentId) : playChord(chord.intervals, root, instrumentId)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Volume2 className="h-4 w-4" /> {isMelodic ? "Ouvir sequência" : "Ouvir o acorde"}
              </button>
            </div>

            <div className="mt-3">
              <InstrumentDiagram instrument={instrumentId} root={root} pentSemis={chord.intervals} />
            </div>
          </div>
        </section>

        {/* Professor IA — escuta e corrige */}
        <section className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-4">
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
            <Mic className="h-5 w-5 text-primary" /> 3. Professor IA — ouça, toque e receba correção
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {isMelodic
              ? `Toque as notas da sequência de ${root}${chord.suffix} uma por uma. O Professor confere sua afinação e precisão.`
              : `Toque as notas do acorde ${root}${chord.suffix} uma por uma. O Professor marca cada nota conforme você acerta.`}
          </p>
          <ChordListener chord={chord} root={root} instrument={instrumentId} />
        </section>
      </div>
    </div>
  );
}

/* ---------- Componente: escuta lista de notas soltas ---------- */
function NoteListener({ notes }: { notes: string[] }) {
  const [hit, setHit] = useState<Set<string>>(new Set());
  const { pitch, error, on, start, stop } = usePitchEngine();

  useEffect(() => {
    if (!on || !pitch?.note) return;
    if (notes.includes(pitch.note.name) && Math.abs(pitch.note.cents) < 35) {
      setHit((prev) => {
        if (prev.has(pitch.note.name)) return prev;
        const n = new Set(prev); n.add(pitch.note.name); return n;
      });
    }
  }, [pitch, on, notes]);

  const reset = () => setHit(new Set());

  return (
    <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          onClick={on ? stop : start}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium",
            on ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {on ? <><Square className="h-3.5 w-3.5" /> Parar</> : <><Mic className="h-3.5 w-3.5" /> Ligar microfone</>}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
          <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
        </button>
        {on && pitch?.note && (
          <span className="text-xs text-muted-foreground">
            Detectando: <span className="font-semibold text-foreground">{pitch.note.name}{pitch.note.octave}</span>
            {" "}({pitch.note.cents > 0 ? "+" : ""}{pitch.note.cents}c)
          </span>
        )}
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-1.5">
        {notes.map((n, i) => {
          const ok = hit.has(n);
          return (
            <span key={`${n}-${i}`} className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold",
              ok ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-500" : "border-border bg-background text-muted-foreground",
            )}>
              {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />} {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Componente: escuta e valida um acorde por partes ---------- */
function ChordListener({ chord, root, instrument }: { chord: ChordKind; root: string; instrument: InstrumentId }) {
  const targetPcs = useMemo(() => chord.intervals.map((s) => (pcOf(root) + s + 120) % 12), [chord, root]);
  const targetNames = useMemo(() => targetPcs.map(nameOfPc), [targetPcs]);
  const [hit, setHit] = useState<Set<number>>(new Set());
  const [hint, setHint] = useState<string>("");
  const { pitch, error, on, start, stop } = usePitchEngine();

  useEffect(() => { setHit(new Set()); setHint(""); }, [chord, root]);

  useEffect(() => {
    if (!on || !pitch?.note) return;
    const heardPc = pcOf(pitch.note.name);
    const targetIdx = targetPcs.indexOf(heardPc);
    if (targetIdx >= 0 && Math.abs(pitch.note.cents) < 40) {
      setHit((prev) => {
        if (prev.has(targetIdx)) return prev;
        const n = new Set(prev); n.add(targetIdx); return n;
      });
      setHint(`✅ Você tocou ${pitch.note.name} — nota ${targetIdx + 1} do acorde.`);
    } else {
      // dica: qual nota faltante está mais perto
      const missing = targetPcs.map((pc, i) => ({ pc, i })).filter(({ i }) => !hit.has(i));
      if (missing.length === 0) return;
      let best = missing[0];
      let bestDiff = 999;
      for (const m of missing) {
        let d = m.pc - heardPc;
        if (d > 6) d -= 12;
        if (d < -6) d += 12;
        if (Math.abs(d) < Math.abs(bestDiff)) { bestDiff = d; best = m; }
      }
      const dir = bestDiff > 0 ? "suba" : "desça";
      setHint(`Você tocou ${pitch.note.name}. Falta ${nameOfPc(best.pc)} — ${dir} ${Math.abs(bestDiff)} semitom(ns).`);
    }
  }, [pitch, on, targetPcs, hit]);

  const done = hit.size === targetPcs.length;
  const reset = () => { setHit(new Set()); setHint(""); };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={on ? stop : start}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            on ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {on ? <><Square className="h-4 w-4" /> Parar aula</> : <><Mic className="h-4 w-4" /> Iniciar aula</>}
        </button>
        <button onClick={() => playChord(chord.intervals, root, instrument)} className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20">
          <Volume2 className="h-3.5 w-3.5" /> Ouvir referência
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary">
          <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {targetNames.map((n, i) => {
          const ok = hit.has(i);
          return (
            <div key={i} className={cn(
              "flex items-center gap-2 rounded-lg border-2 p-3 transition-all",
              ok ? "border-emerald-500/70 bg-emerald-500/10" : "border-border bg-background/40",
            )}>
              {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Nota {i + 1}</div>
                <div className={cn("font-display text-xl font-bold", ok ? "text-emerald-500" : "text-foreground")}>{n}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn(
        "rounded-lg border p-3 text-sm",
        done ? "border-emerald-500/60 bg-emerald-500/10" : "border-border bg-background/40",
      )}>
        {done ? (
          <div className="font-medium text-emerald-500">🎉 Parabéns! Você tocou todas as {targetPcs.length} notas do acorde {root}{chord.suffix}.</div>
        ) : (
          <>
            {on && pitch?.note && (
              <div className="mb-1 text-xs text-muted-foreground">
                Escutando: <span className="font-semibold text-foreground">{pitch.note.name}{pitch.note.octave}</span> ({pitch.freq.toFixed(1)} Hz, {pitch.note.cents > 0 ? "+" : ""}{pitch.note.cents}c)
              </div>
            )}
            <div>{hint || (on ? "Toque uma nota do acorde…" : "Ligue o microfone e comece pela fundamental.")}</div>
          </>
        )}
      </div>
    </div>
  );
}
