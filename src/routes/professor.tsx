import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GraduationCap, Mic, Square, Volume2, RotateCcw, CheckCircle2, Circle, Info, Lightbulb, Music } from "lucide-react";
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
  sanfona: { baseUrl: `${GM}/accordion-mp3/`, urls: { C3:"C3.mp3", C4:"C4.mp3", E4:"E4.mp3", G4:"G4.mp3", C5:"C5.mp3", E5:"E5.mp3", C6:"C6.mp3" } },
};

const INSTRUMENT_OCTAVE: Record<InstrumentId, number> = {
  violao: 3, guitarra: 3, baixo: 2, piano: 4, teclado: 4, violino: 4, sax: 4, banjo: 4, flauta: 5, bateria: 4, sanfona: 4,
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

type ChordKind = { id: string; label: string; suffix: string; intervals: number[]; family: "triad" | "tetrad" | "scale" };

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

const SCALES: ChordKind[] = [
  { id: "maj_scale", label: "Maior", suffix: " (Escala)", intervals: [0, 2, 4, 5, 7, 9, 11, 12], family: "scale" },
  { id: "min_scale", label: "Menor Natural", suffix: "m (Escala)", intervals: [0, 2, 3, 5, 7, 8, 10, 12], family: "scale" },
  { id: "min_mel_scale", label: "Menor Melódica", suffix: "m (Melódica)", intervals: [0, 2, 3, 5, 7, 9, 11, 12], family: "scale" },
  { id: "min_harm_scale", label: "Menor Harmônica", suffix: "m (Harmônica)", intervals: [0, 2, 3, 5, 7, 8, 11, 12], family: "scale" },
];

const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const INSTRUMENTS: { id: InstrumentId; label: string; beginnerTip: string; startingNotes: string[]; curio: string; challenge: string }[] = [
  { 
    id: "violao", 
    label: "Violão", 
    beginnerTip: "Comece com acordes abertos (dedos livres). Foque em pressionar firme e perto do traste.", 
    startingNotes: ["E", "A", "D", "G", "B", "E"],
    curio: "O violão moderno evoluiu da vihuela e do alaúde, ganhando sua forma atual na Espanha no século XIX.",
    challenge: "Tente tocar o acorde de C maior e garantir que todas as cordas soem limpas, sem 'trastejar'."
  },
  { 
    id: "guitarra", 
    label: "Guitarra", 
    beginnerTip: "Postura relaxada, palheta com pouca força. Treine trocas de acorde antes de solar.", 
    startingNotes: ["E", "A", "D", "G", "B", "E"],
    curio: "A primeira guitarra elétrica de corpo sólido comercialmente bem-sucedida foi a Fender Telecaster, lançada em 1950.",
    challenge: "Pratique um 'bend' de meio tom na nota G e tente manter a afinação estável."
  },
  { 
    id: "baixo", 
    label: "Baixo", 
    beginnerTip: "Alterne indicador e médio. Treine escalas cromáticas para precisão rítmica.", 
    startingNotes: ["E", "A", "D", "G"],
    curio: "Antes do baixo elétrico, os músicos usavam o contrabaixo acústico, que era enorme e difícil de transportar em turnês.",
    challenge: "Mantenha um ritmo de colcheias constante a 80 BPM usando apenas a nota E solta."
  },
  { 
    id: "piano", 
    label: "Piano", 
    beginnerTip: "Postura das mãos redondas, pulsos soltos. Comece pela dedilhação 1-2-3-1-2-3-4-5 em C.", 
    startingNotes: ["C", "D", "E", "F", "G", "A", "B"],
    curio: "O nome original era 'pianoforte' porque, ao contrário do cravo, ele podia tocar tanto sons suaves quanto fortes.",
    challenge: "Toque a escala de C maior subindo com a mão direita e descendo com a esquerda simultaneamente."
  },
  { 
    id: "teclado", 
    label: "Teclado", 
    beginnerTip: "Explore os timbres, mas estude sempre com som de piano acústico primeiro.", 
    startingNotes: ["C", "D", "E", "F", "G", "A", "B"],
    curio: "Sintetizadores revolucionaram a música nos anos 70 e 80, permitindo criar sons que não existem na natureza.",
    challenge: "Encontre um timbre de 'Pad' e toque uma tríade de C maior mantendo as notas por 4 tempos."
  },
  { 
    id: "violino", 
    label: "Violino", 
    beginnerTip: "Segure o arco corretamente. Treine notas longas, uma de cada vez, mantendo o som limpo.", 
    startingNotes: ["G", "D", "A", "E"],
    curio: "As cordas do violino eram feitas originalmente de tripas de carneiro. Hoje, a maioria usa metal ou materiais sintéticos.",
    challenge: "Tente manter o arco perfeitamente perpendicular às cordas durante uma nota longa de 4 segundos."
  },
  { 
    id: "sax", 
    label: "Saxofone", 
    beginnerTip: "Foque na embocadura e na respiração diafragmática. Toque notas longas com estabilidade.", 
    startingNotes: ["C", "D", "E", "F", "G"],
    curio: "O saxofone foi inventado por Adolphe Sax em 1840, buscando um instrumento que unisse a força dos metais e a agilidade das madeiras.",
    challenge: "Toque a nota G e tente mantê-la estável sem oscilar a afinação por 5 segundos."
  },
  { 
    id: "banjo", 
    label: "Banjo", 
    beginnerTip: "Use dedeiras. Comece com o rolo alternado (T-I-M-T-I-M).", 
    startingNotes: ["D", "G", "B", "D"],
    curio: "O banjo tem raízes africanas e foi levado para as Américas por pessoas escravizadas antes de se tornar central no Bluegrass.",
    challenge: "Pratique o 'forward roll' (polegar-indicador-médio) repetidamente buscando clareza em cada nota."
  },
  { 
    id: "flauta", 
    label: "Flauta Doce", 
    beginnerTip: "Sopro leve e constante para evitar ruídos. Cubra os furos totalmente com as polpas dos dedos.", 
    startingNotes: ["C", "D", "E", "F", "G"],
    curio: "A flauta doce era um dos instrumentos mais populares na era Barroca, sendo usada por compositores como Bach e Vivaldi.",
    challenge: "Toque a nota C grave soprando o mais suavemente possível para que ela não 'suba' de oitava."
  },
  {
    id: "sanfona",
    label: "Sanfona",
    beginnerTip: "Trabalhe a coordenação entre o fole, o teclado e os baixos. Comece com ritmos simples como valsa ou xote.",
    startingNotes: ["C", "D", "E", "F", "G"],
    curio: "A sanfona (ou acordeon) é um instrumento de palheta livre, onde o som é produzido pela passagem do ar pelo fole.",
    challenge: "Tente manter uma nota no teclado enquanto abre e fecha o fole de forma suave, sem variar o volume bruscamente."
  },
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
    
    // Para instrumentos melódicos, garantimos que não haja sobreposição de notas
    const isMelodic = instrument === "sax" || instrument === "violino" || instrument === "flauta" || instrument === "baixo";
    
    if (sampler) {
      if (isMelodic) {
        sampler.releaseAll();
      }
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
    
    // Para instrumentos melódicos, garantimos que cada nota pare antes da próxima
    const isMelodic = instrument === "sax" || instrument === "violino" || instrument === "flauta" || instrument === "baixo" || instrument === "sanfona";

    pcs.forEach((semi, i) => {
      const pc = (rootPc + semi) % 12;
      if (prevPc !== -1 && pc <= prevPc) oct++;
      prevPc = pc;
      const noteName = `${nameOfPc(pc)}${oct}`;
      
      const startTime = now + i * 0.5;
      
      if (sampler) {
        if (isMelodic) {
          sampler.triggerAttackRelease(noteName, durationMs / 1000, startTime);
          if (i > 0) {
            sampler.triggerRelease(now + (i - 0.05) * 0.5);
          }
        } else {
          sampler.triggerAttackRelease(noteName, durationMs / 1000, startTime);
        }
      } else {
        const synth = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
        synth.triggerAttackRelease(noteName, durationMs / 1000, startTime);
        setTimeout(() => synth.dispose(), (i * 500) + durationMs + 400);
      }
    });
  } catch (e) { console.error("playMelodySequence", e); }
}



/* ---------- Harmonização: campo harmônico da escala em tríades e tétrades ---------- */

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

function findKind(list: ChordKind[], intervals: number[]): ChordKind | null {
  const key = intervals.join(",");
  return list.find((c) => c.intervals.join(",") === key) ?? null;
}

type Degree = {
  roman: string;
  rootName: string;
  triad: ChordKind;
  tetrad: ChordKind;
};

function harmonizeScale(scale: ChordKind, rootNote: string): Degree[] {
  const pcs = scale.intervals.slice(0, 7);
  const rootPc = pcOf(rootNote);
  return pcs.map((base, i) => {
    const rel = (n: number) => ((n - base) % 12 + 12) % 12;
    const t3 = rel(pcs[(i + 2) % 7]);
    const t5 = rel(pcs[(i + 4) % 7]);
    const t7 = rel(pcs[(i + 6) % 7]);
    const triadInts = [0, t3, t5];
    const tetradInts = [0, t3, t5, t7];
    const degName = nameOfPc(rootPc + base);
    const triad = findKind(TRIADS, triadInts) ?? { id: `deg${i}-tri`, label: "Alterada", suffix: "alt", intervals: triadInts, family: "triad" as const };
    const tetrad = findKind(TETRADS, tetradInts) ?? { id: `deg${i}-tet`, label: "Alterada", suffix: "alt7", intervals: tetradInts, family: "tetrad" as const };
    let roman = ROMAN[i];
    if (t3 === 3) roman = roman.toLowerCase();
    if (t5 === 6) roman += "°";
    if (t5 === 8) roman += "+";
    return { roman, rootName: degName, triad, tetrad };
  });
}

/* ---------- Página ---------- */

function ProfessorPage() {
  const [instrumentId, setInstrumentId] = useState<InstrumentId>("violao");
  const [root, setRoot] = useState<string>("C");
  const [chord, setChord] = useState<ChordKind>(SCALES[0]);

  // Reset chord to first scale if switching to melodic instrument, or back to triad if harmonic
  useEffect(() => {
    const isMelodic = instrumentId === "sax" || instrumentId === "violino" || instrumentId === "flauta" || instrumentId === "baixo" || instrumentId === "bateria";
    if (isMelodic) {
      setChord(SCALES[0]);
    } else {
      setChord(TRIADS[0]);
    }
  }, [instrumentId]);

  const instrument = INSTRUMENTS.find((i) => i.id === instrumentId)!;
  const isMelodic = instrumentId === "sax" || instrumentId === "violino" || instrumentId === "flauta" || instrumentId === "baixo" || instrumentId === "bateria";
  const isScale = chord.family === "scale";

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

        {/* Construção dos acordes / Escala Completa / Sequências Melódicas */}
        <section className="mb-5 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 font-display text-lg font-semibold">
            {isMelodic ? "2. Escala e Arpejos" : "2. Construção de acordes"}
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {isMelodic 
              ? "Para instrumentos melódicos, praticamos a escala completa e os arpejos. O diagrama mostra a posição de cada nota no seu instrumento."
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
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Escalas maiores e menores — todos os 12 tons
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SCALES.map((c) => (
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
            <p className="mt-2 text-[11px] text-muted-foreground">
              Escolha qualquer tom acima e a escala aqui: o diagrama e o áudio mostram a escala completa de {root} no {instrument.label}.
            </p>
          </div>

          {/* Escala montada em acordes: tríades e tétrades de cada grau */}
          <div className="mb-4 rounded-lg border border-border bg-background/40 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Escala montada em acordes — {root} {scaleForField.label}
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Cada grau da escala vira um acorde. Clique para ver o desenho no {instrument.label} e ouvir.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {degrees.map((d, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-2 text-center">
                  <div className="text-[11px] font-bold text-primary">{d.roman}</div>
                  <button
                    onClick={() => { setRoot(d.rootName); setChord(d.triad); playChord(d.triad.intervals, d.rootName, instrumentId); }}
                    className="mt-1 w-full rounded-md border border-primary/30 bg-primary/10 px-1 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                    title="Tríade"
                  >
                    {d.rootName}{d.triad.suffix || ""}
                  </button>
                  <button
                    onClick={() => { setRoot(d.rootName); setChord(d.tetrad); playChord(d.tetrad.intervals, d.rootName, instrumentId); }}
                    className="mt-1 w-full rounded-md border border-border bg-secondary px-1 py-1 text-[11px] font-medium hover:bg-secondary/70"
                    title="Tétrade"
                  >
                    {d.rootName}{d.tetrad.suffix}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {!isMelodic && (
            <>
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
            </>
          )}

          <div className="rounded-lg border border-primary/30 bg-background/40 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-muted-foreground">{isScale ? "Escala selecionada" : "Acorde selecionado"}</span>
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
                onClick={() => (isScale ? playMelodySequence(chord.intervals, root, instrumentId) : playChord(chord.intervals, root, instrumentId))}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Volume2 className="h-4 w-4" /> {isScale ? "Ouvir escala" : "Ouvir o acorde"}
              </button>
            </div>

            <div className="mt-3">
              <InstrumentDiagram instrument={instrumentId} root={root} pentSemis={chord.intervals} />
            </div>
          </div>
        </section>

        {/* Professor IA — Complemento para Instrumentos Melódicos ou Feedback para Harmônicos */}
        {isMelodic ? (
          <section className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-4">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
              <Lightbulb className="h-5 w-5 text-primary" /> 3. Dicas de Performance e Expressão
            </h2>
            <div className="mt-3 space-y-4">
              <div className="rounded-lg bg-background/60 p-3 border border-border">
                <h4 className="text-sm font-bold text-primary mb-1">Foco na Articulação</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para instrumentos de sopro e cordas friccionadas, a forma como você inicia e termina a nota é fundamental. 
                  Experimente ataques suaves e use o vibrato apenas no final de notas longas para dar mais emoção.
                </p>
              </div>
              <div className="rounded-lg bg-background/60 p-3 border border-border">
                <h4 className="text-sm font-bold text-primary mb-1">Controle de Dinâmica</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tente tocar a mesma escala crescendo (aumentando o volume) ao subir e diminuindo ao descer. 
                  O domínio do volume é o que separa um iniciante de um músico expressivo.
                </p>
              </div>
              <div className="rounded-lg bg-background/60 p-3 border border-border">
                <h4 className="text-sm font-bold text-primary mb-1">Prática Sugerida</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use o metrônomo do app para garantir que cada nota da sequência tenha exatamente a mesma duração. 
                  A precisão rítmica é o alicerce para qualquer melodia.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-4">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
              <Mic className="h-5 w-5 text-primary" /> 3. Feedback e Análise em Tempo Real
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Toque as notas do acorde {root}{chord.suffix} individualmente. O Professor valida a execução correta da harmonia.
            </p>
            <ChordListener chord={chord} root={root} instrument={instrumentId} />
          </section>
        )}

        {/* Seção Complementar: Curiosidades e Desafios */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-blue-500">
              <Info className="h-5 w-5" />
              <h3 className="font-display font-semibold">Você sabia?</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{instrument.curio}</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-500">
              <Lightbulb className="h-5 w-5" />
              <h3 className="font-display font-semibold">Desafio do Professor</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{instrument.challenge}</p>
          </div>
        </section>

        {/* Guia de Próximos Passos */}
        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Music className="h-5 w-5" />
            <h3 className="font-display font-semibold">Próximos Passos Sugeridos</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Teoria</div>
              <p className="text-xs">Estude o Campo Harmônico em 'Estudar'</p>
            </div>
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Técnica</div>
              <p className="text-xs">Pratique Pentatônicas na aba 'Escalas'</p>
            </div>
            <div className="rounded-lg bg-background/50 p-3 text-center">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ouvido</div>
              <p className="text-xs">Tente tirar uma música simples de 2 acordes</p>
            </div>
          </div>
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
