import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Radio, Info, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/afinador")({
  head: () => ({
    meta: [
      { title: "Afinador — Melodia" },
      { name: "description", content: "Afinador cromático com reconhecimento de voz para violão, guitarra, baixo, violino, sax e bateria." },
      { property: "og:title", content: "Afinador — Melodia" },
      { property: "og:description", content: "Afinador cromático com microfone para vários instrumentos." },
    ],
  }),
  component: AfinadorPage,
});

// ============================================================================
// Referências de afinação por instrumento
// ============================================================================

type Nota = { nome: string; freq: number; nota: string; oitava: number; dica?: string };
type Variacao = { id: string; label: string; notas: Nota[]; descricao?: string };
type Instrumento = {
  id: string;
  label: string;
  descricao: string;
  notas: Nota[];
  variacoes?: Variacao[];
  dicaGeral?: string;
};

// A4 = 440 Hz
const A4 = 440;
const NOTAS_CROMATICAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiParaFreq(midi: number) {
  return A4 * Math.pow(2, (midi - 69) / 12);
}
function freqParaMidi(freq: number) {
  return 12 * Math.log2(freq / A4) + 69;
}
function midiParaNota(midi: number): { nota: string; oitava: number } {
  const rounded = Math.round(midi);
  const oitava = Math.floor(rounded / 12) - 1;
  const nota = NOTAS_CROMATICAS[((rounded % 12) + 12) % 12];
  return { nota, oitava };
}

// Helper: cria nota a partir de nome tipo "E2"
function n(nome: string, dica?: string): Nota {
  const match = nome.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) throw new Error(`nota inválida: ${nome}`);
  const [, pitch, octStr] = match;
  const idx = NOTAS_CROMATICAS.indexOf(pitch);
  const oct = parseInt(octStr, 10);
  const midi = (oct + 1) * 12 + idx;
  return { nome, freq: midiParaFreq(midi), nota: pitch, oitava: oct, dica };
}

const INSTRUMENTOS: Instrumento[] = [
  {
    id: "violao",
    label: "Violão",
    descricao: "Afinação padrão E A D G B E (6ª à 1ª corda)",
    dicaGeral: "Aperte a tarraxa devagar. Toque a corda solta e deixe a nota soar por 2s.",
    notas: [
      n("E2", "6ª corda (mais grave)"),
      n("A2", "5ª corda"),
      n("D3", "4ª corda"),
      n("G3", "3ª corda"),
      n("B3", "2ª corda"),
      n("E4", "1ª corda (mais aguda)"),
    ],
    variacoes: [
      {
        id: "padrao",
        label: "Padrão (6 cordas)",
        descricao: "E A D G B E — afinação universal",
        notas: [
          n("E2", "6ª corda"), n("A2", "5ª corda"), n("D3", "4ª corda"),
          n("G3", "3ª corda"), n("B3", "2ª corda"), n("E4", "1ª corda"),
        ],
      },
      {
        id: "drop-d",
        label: "Drop D",
        descricao: "6ª corda um tom abaixo — usada em rock, metal e MPB",
        notas: [
          n("D2", "6ª corda (Drop D)"), n("A2", "5ª corda"), n("D3", "4ª corda"),
          n("G3", "3ª corda"), n("B3", "2ª corda"), n("E4", "1ª corda"),
        ],
      },
      {
        id: "dadgad",
        label: "DADGAD",
        descricao: "Afinação modal — folk, celta e fingerstyle",
        notas: [
          n("D2", "6ª corda"), n("A2", "5ª corda"), n("D3", "4ª corda"),
          n("G3", "3ª corda"), n("A3", "2ª corda"), n("D4", "1ª corda"),
        ],
      },
      {
        id: "meio-tom",
        label: "Meio tom abaixo (Eb)",
        descricao: "Eb Ab Db Gb Bb Eb — usada por Hendrix, SRV, Guns N' Roses",
        notas: [
          n("D#2", "6ª"), n("G#2", "5ª"), n("C#3", "4ª"),
          n("F#3", "3ª"), n("A#3", "2ª"), n("D#4", "1ª"),
        ],
      },
      {
        id: "7-cordas",
        label: "7 cordas",
        descricao: "Padrão brasileiro (samba/choro): C E A D G B E — 7ª corda em Dó grave",
        notas: [
          n("C2", "7ª corda (Dó grave — samba/choro)"),
          n("E2", "6ª corda"), n("A2", "5ª corda"), n("D3", "4ª corda"),
          n("G3", "3ª corda"), n("B3", "2ª corda"), n("E4", "1ª corda"),
        ],
      },
      {
        id: "12-cordas",
        label: "12 cordas",
        descricao: "Cada corda tem uma dupla — as 4 mais graves em oitava, as 2 agudas em uníssono",
        notas: [
          n("E2", "6ª (grave)"), n("E3", "6ª (oitava aguda)"),
          n("A2", "5ª (grave)"), n("A3", "5ª (oitava aguda)"),
          n("D3", "4ª (grave)"), n("D4", "4ª (oitava aguda)"),
          n("G3", "3ª (grave)"), n("G4", "3ª (oitava aguda)"),
          n("B3", "2ª (uníssono)"), n("B3", "2ª (uníssono)"),
          n("E4", "1ª (uníssono)"), n("E4", "1ª (uníssono)"),
        ],
      },
      {
        id: "nashville",
        label: "Nashville (high-strung)",
        descricao: "Igual às cordas agudas do 12 cordas — usada em gravações country/pop",
        notas: [
          n("E3", "6ª aguda"), n("A3", "5ª aguda"), n("D4", "4ª aguda"),
          n("G4", "3ª aguda"), n("B3", "2ª"), n("E4", "1ª"),
        ],
      },
      {
        id: "open-g",
        label: "Open G",
        descricao: "D G D G B D — Keith Richards, slide, blues",
        notas: [
          n("D2", "6ª"), n("G2", "5ª"), n("D3", "4ª"),
          n("G3", "3ª"), n("B3", "2ª"), n("D4", "1ª"),
        ],
      },
      {
        id: "open-d",
        label: "Open D",
        descricao: "D A D F# A D — slide, blues, folk",
        notas: [
          n("D2", "6ª"), n("A2", "5ª"), n("D3", "4ª"),
          n("F#3", "3ª"), n("A3", "2ª"), n("D4", "1ª"),
        ],
      },
    ],
  },
  {
    id: "guitarra",
    label: "Guitarra",
    descricao: "Padrão E A D G B E — várias afinações usadas em estilos diferentes",
    dicaGeral: "Use o captador da ponte com volume médio. Evite palhetada muito forte.",
    notas: [
      n("E2", "6ª corda"),
      n("A2", "5ª corda"),
      n("D3", "4ª corda"),
      n("G3", "3ª corda"),
      n("B3", "2ª corda"),
      n("E4", "1ª corda"),
    ],
    variacoes: [
      {
        id: "padrao",
        label: "Padrão (6 cordas)",
        descricao: "E A D G B E",
        notas: [
          n("E2", "6ª"), n("A2", "5ª"), n("D3", "4ª"),
          n("G3", "3ª"), n("B3", "2ª"), n("E4", "1ª"),
        ],
      },
      {
        id: "drop-d",
        label: "Drop D",
        descricao: "6ª em Ré — rock, grunge",
        notas: [
          n("D2", "6ª (Drop D)"), n("A2", "5ª"), n("D3", "4ª"),
          n("G3", "3ª"), n("B3", "2ª"), n("E4", "1ª"),
        ],
      },
      {
        id: "drop-c",
        label: "Drop C",
        descricao: "C G C F A D — metal moderno",
        notas: [
          n("C2", "6ª"), n("G2", "5ª"), n("C3", "4ª"),
          n("F3", "3ª"), n("A3", "2ª"), n("D4", "1ª"),
        ],
      },
      {
        id: "eb",
        label: "Meio tom abaixo (Eb)",
        descricao: "Eb Ab Db Gb Bb Eb",
        notas: [
          n("D#2", "6ª"), n("G#2", "5ª"), n("C#3", "4ª"),
          n("F#3", "3ª"), n("A#3", "2ª"), n("D#4", "1ª"),
        ],
      },
      {
        id: "d-standard",
        label: "D Standard",
        descricao: "Um tom abaixo — hard rock, doom",
        notas: [
          n("D2", "6ª"), n("G2", "5ª"), n("C3", "4ª"),
          n("F3", "3ª"), n("A3", "2ª"), n("D4", "1ª"),
        ],
      },
      {
        id: "7-cordas",
        label: "7 cordas",
        descricao: "B E A D G B E — Steve Vai, metal progressivo",
        notas: [
          n("B1", "7ª corda (Si grave)"),
          n("E2", "6ª"), n("A2", "5ª"), n("D3", "4ª"),
          n("G3", "3ª"), n("B3", "2ª"), n("E4", "1ª"),
        ],
      },
      {
        id: "8-cordas",
        label: "8 cordas",
        descricao: "F# B E A D G B E — djent, metal extremo",
        notas: [
          n("F#1", "8ª corda"), n("B1", "7ª"),
          n("E2", "6ª"), n("A2", "5ª"), n("D3", "4ª"),
          n("G3", "3ª"), n("B3", "2ª"), n("E4", "1ª"),
        ],
      },
      {
        id: "open-e",
        label: "Open E",
        descricao: "E B E G# B E — slide blues",
        notas: [
          n("E2", "6ª"), n("B2", "5ª"), n("E3", "4ª"),
          n("G#3", "3ª"), n("B3", "2ª"), n("E4", "1ª"),
        ],
      },
    ],
  },
  {
    id: "baixo",
    label: "Baixo",
    descricao: "Variações de 4, 5 e 6 cordas + afinações alternativas",
    dicaGeral: "Toque próximo ao captador do braço para som mais limpo pro afinador.",
    notas: [
      n("E1", "4ª corda"), n("A1", "3ª corda"),
      n("D2", "2ª corda"), n("G2", "1ª corda"),
    ],
    variacoes: [
      {
        id: "4-cordas",
        label: "4 cordas (padrão)",
        descricao: "E A D G — afinação universal",
        notas: [
          n("E1", "4ª corda (mais grave)"),
          n("A1", "3ª corda"),
          n("D2", "2ª corda"),
          n("G2", "1ª corda (mais aguda)"),
        ],
      },
      {
        id: "5-cordas",
        label: "5 cordas",
        descricao: "B E A D G — Si grave extra, muito usado no gospel, jazz, funk",
        notas: [
          n("B0", "5ª corda (Si grave)"),
          n("E1", "4ª"), n("A1", "3ª"),
          n("D2", "2ª"), n("G2", "1ª"),
        ],
      },
      {
        id: "6-cordas",
        label: "6 cordas",
        descricao: "B E A D G C — extensão aguda extra",
        notas: [
          n("B0", "6ª (Si grave)"),
          n("E1", "5ª"), n("A1", "4ª"),
          n("D2", "3ª"), n("G2", "2ª"),
          n("C3", "1ª (Dó agudo)"),
        ],
      },
      {
        id: "drop-d",
        label: "Drop D (4c)",
        descricao: "D A D G — rock, metal",
        notas: [
          n("D1", "4ª (Drop D)"),
          n("A1", "3ª"), n("D2", "2ª"), n("G2", "1ª"),
        ],
      },
      {
        id: "meio-tom",
        label: "Meio tom abaixo (Eb)",
        descricao: "Eb Ab Db Gb — combina com guitarra em Eb",
        notas: [
          n("D#1", "4ª"), n("G#1", "3ª"),
          n("C#2", "2ª"), n("F#2", "1ª"),
        ],
      },
      {
        id: "tenor",
        label: "Baixo Tenor",
        descricao: "A D G C — uma quarta acima do padrão, som mais brilhante",
        notas: [
          n("A1", "4ª"), n("D2", "3ª"),
          n("G2", "2ª"), n("C3", "1ª"),
        ],
      },
      {
        id: "fretless",
        label: "Fretless (4c)",
        descricao: "Mesma afinação padrão — ouça bem cada nota, sem trastes é preciso",
        notas: [
          n("E1", "4ª"), n("A1", "3ª"),
          n("D2", "2ª"), n("G2", "1ª"),
        ],
      },
      {
        id: "contra",
        label: "Contrabaixo acústico",
        descricao: "E A D G — mesma afinação em oitava, notação em clave de Fá",
        notas: [
          n("E1", "4ª"), n("A1", "3ª"),
          n("D2", "2ª"), n("G2", "1ª"),
        ],
      },
    ],
  },
  {
    id: "violino",
    label: "Violino",
    descricao: "Afinação em quintas: G3 D4 A4 E5",
    dicaGeral: "Comece pelo Lá (A4 = 440 Hz), depois afine as outras cordas por quintas.",
    notas: [
      n("G3", "Sol — 4ª corda (grave)"),
      n("D4", "Ré — 3ª corda"),
      n("A4", "Lá — 2ª corda (referência 440 Hz)"),
      n("E5", "Mi — 1ª corda (aguda)"),
    ],
  },
  {
    id: "sax",
    label: "Saxofone",
    descricao: "Afinação da boquilha e nota de referência",
    dicaGeral: "Sax é transpositor. As notas mostradas são em ALTURA CONCERTO (o que sai de fato).",
    notas: [
      n("A4", "Lá 440 — referência universal"),
      n("C5", "Boquilha do sax alto (Eb) — nota concerto aproximada"),
      n("F#4", "Boquilha do sax tenor (Bb) — nota concerto aproximada"),
      n("A4", "Boquilha do sax soprano — tende ao Lá concerto"),
      n("C4", "Dó central para checar embocadura"),
    ],
  },
  {
    id: "bateria",
    label: "Bateria",
    descricao: "Alturas típicas para cada tambor (aproximadas)",
    dicaGeral:
      "Bata no centro do tambor a ~2cm da borda. Ajuste as porcas em cruz para equalizar. As notas são referência — cada baterista escolhe seu timbre.",
    notas: [
      n("G2", "Bumbo 22\" — grave e cheio"),
      n("E3", "Tom 12\" — médio-agudo"),
      n("C3", "Tom 13\" — médio"),
      n("A2", "Surdo 16\" — médio-grave"),
      n("F2", "Surdo 18\" — grave"),
      n("D3", "Caixa (aro batedeira) — brilhante"),
      n("G3", "Caixa (aro esteira) — corte agudo"),
    ],
  },
];

// ============================================================================
// Autocorrelação para detecção de pitch (Web Audio)
// ============================================================================

function detectarPitch(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // silêncio

  // trimming
  let r1 = 0, r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
  const buf = buffer.slice(r1, r2);
  const newSize = buf.length;

  const c = new Array<number>(newSize).fill(0);
  for (let i = 0; i < newSize; i++)
    for (let j = 0; j < newSize - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxVal = -1, maxPos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
  }
  let T0 = maxPos;
  if (T0 <= 0) return null;
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

// ============================================================================
// UI
// ============================================================================

function AfinadorPage() {
  const [instrumentoId, setInstrumentoId] = useState<string>("violao");
  const instrumentoBase = INSTRUMENTOS.find((i) => i.id === instrumentoId) ?? INSTRUMENTOS[0];
  const [variacaoId, setVariacaoId] = useState<string | null>(null);
  const variacao = instrumentoBase.variacoes?.find((v) => v.id === variacaoId)
    ?? instrumentoBase.variacoes?.[0]
    ?? null;
  const notasAtivas = variacao?.notas ?? instrumentoBase.notas;
  const instrumento = { ...instrumentoBase, notas: notasAtivas };

  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [freqAtual, setFreqAtual] = useState<number | null>(null);
  const [notaAlvoIdx, setNotaAlvoIdx] = useState<number | null>(null); // "auto" quando null

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const parar = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setAtivo(false);
    setFreqAtual(null);
  }, []);

  const iniciar = useCallback(async () => {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      setAtivo(true);

      const buffer = new Float32Array(analyser.fftSize);
      const loop = () => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const pitch = detectarPitch(buffer, audioCtxRef.current.sampleRate);
        setFreqAtual(pitch);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível acessar o microfone");
      setAtivo(false);
    }
  }, []);

  useEffect(() => () => parar(), [parar]);

  // Reset target ao trocar instrumento
  useEffect(() => { setNotaAlvoIdx(null); setVariacaoId(null); }, [instrumentoId]);
  useEffect(() => { setNotaAlvoIdx(null); }, [variacaoId]);

  // Tocador de referência (oscilador)
  const tomCtxRef = useRef<AudioContext | null>(null);
  const tocarReferencia = useCallback((freq: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!tomCtxRef.current) tomCtxRef.current = new AudioCtx();
      const ctx = tomCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      // envelope suave
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.setValueAtTime(0.25, now + 1.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.05);
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => () => { tomCtxRef.current?.close(); }, []);

  // Determina a nota mais próxima da freq atual dentro do instrumento (modo auto)
  const alvo = useMemo(() => {
    if (notaAlvoIdx !== null) return instrumento.notas[notaAlvoIdx];
    if (freqAtual == null) return null;
    const midiAtual = freqParaMidi(freqAtual);
    let melhor = instrumento.notas[0];
    let melhorDiff = Infinity;
    for (const nota of instrumento.notas) {
      const midiN = freqParaMidi(nota.freq);
      const diff = Math.abs(midiN - midiAtual);
      if (diff < melhorDiff) { melhorDiff = diff; melhor = nota; }
    }
    return melhor;
  }, [freqAtual, instrumento, notaAlvoIdx]);

  const cents = useMemo(() => {
    if (freqAtual == null || !alvo) return null;
    return Math.round(1200 * Math.log2(freqAtual / alvo.freq));
  }, [freqAtual, alvo]);

  const notaCromaticaAtual = useMemo(() => {
    if (freqAtual == null) return null;
    const midi = freqParaMidi(freqAtual);
    const { nota, oitava } = midiParaNota(midi);
    return `${nota}${oitava}`;
  }, [freqAtual]);

  const emAfinacao = cents !== null && Math.abs(cents) <= 5;
  const status: "grave" | "certo" | "agudo" | "aguarde" =
    cents === null ? "aguarde" : emAfinacao ? "certo" : cents < 0 ? "grave" : "agudo";

  const agulhaOffset = cents === null ? 0 : Math.max(-50, Math.min(50, cents));

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <Radio className="h-4 w-4" />
            Ferramenta
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Afinador</h1>
          <p className="mt-2 text-muted-foreground">
            Reconhecimento de voz pelo microfone — escolha seu instrumento e afine com precisão.
          </p>
        </div>

        {/* Sub-abas de instrumentos */}
        <div className="mb-6 flex flex-wrap gap-2">
          {INSTRUMENTOS.map((i) => (
            <button
              key={i.id}
              onClick={() => setInstrumentoId(i.id)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                instrumentoId === i.id
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>

        {/* Descrição do instrumento */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-medium">{instrumento.descricao}</div>
          {instrumento.dicaGeral && (
            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{instrumento.dicaGeral}</span>
            </div>
          )}
        </div>

        {/* Display do afinador */}
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 text-center">
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            {alvo ? `Referência: ${alvo.nome} · ${alvo.freq.toFixed(1)} Hz` : "Aguardando som..."}
          </div>
          {alvo?.dica && (
            <div className="mb-4 text-xs text-primary">{alvo.dica}</div>
          )}

          <div className="my-4 font-display text-6xl font-bold tabular-nums">
            {notaCromaticaAtual ?? "—"}
          </div>
          <div className="text-sm text-muted-foreground">
            {freqAtual ? `${freqAtual.toFixed(1)} Hz` : "sem sinal"}
            {cents !== null && (
              <>
                {" · "}
                <span className={cn(
                  emAfinacao ? "text-emerald-400" : "text-amber-400",
                )}>
                  {cents > 0 ? "+" : ""}{cents} cents
                </span>
              </>
            )}
          </div>

          {/* Agulha */}
          <div className="mt-6 relative h-16 rounded-2xl bg-muted/40 overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-400/60" />
            {[-40, -20, 20, 40].map((v) => (
              <div key={v} className="absolute inset-y-3 w-px bg-border" style={{ left: `${50 + v}%` }} />
            ))}
            <div
              className={cn(
                "absolute top-2 bottom-2 w-1 rounded-full transition-all duration-100",
                status === "certo" ? "bg-emerald-400 glow-primary" :
                status === "grave" ? "bg-sky-400" :
                status === "agudo" ? "bg-rose-400" : "bg-muted-foreground/40",
              )}
              style={{ left: `calc(${50 + agulhaOffset}% - 2px)` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>♭ grave</span>
            <span className={emAfinacao ? "text-emerald-400 font-bold" : ""}>
              {emAfinacao ? "AFINADO" : "centro"}
            </span>
            <span>agudo ♯</span>
          </div>

          {/* Controles */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={ativo ? parar : iniciar}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-medium transition-all",
                ativo
                  ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:glow-primary",
              )}
            >
              {ativo ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {ativo ? "Parar microfone" : "Ativar microfone"}
            </button>
          </div>
          {erro && <div className="mt-3 text-xs text-rose-400">{erro}</div>}
        </div>

        {/* Lista de notas / cordas / tambores */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 text-sm font-medium text-muted-foreground">
            Referências de afinação — toque para travar a nota alvo
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              onClick={() => setNotaAlvoIdx(null)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-all",
                notaAlvoIdx === null
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <div className="font-display text-sm font-bold">Auto</div>
              <div className="text-[10px] text-muted-foreground">detecta a nota mais próxima</div>
            </button>
            {instrumento.notas.map((nota, idx) => (
              <button
                key={idx}
                onClick={() => setNotaAlvoIdx(idx)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-all",
                  notaAlvoIdx === idx
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg font-bold">{nota.nome}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{nota.freq.toFixed(1)}Hz</span>
                </div>
                {nota.dica && <div className="mt-0.5 text-[10px] text-muted-foreground">{nota.dica}</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
