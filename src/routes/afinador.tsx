import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/afinador")({
  head: () => ({
    meta: [
      { title: "Afinador Cromático — Solando" },
      { name: "description", content: "Afinador cromático com microfone para violão, guitarra, baixo, violino, sax, flauta doce, banjo e sanfona." },
      { property: "og:title", content: "Afinador Cromático — Solando" },
      { property: "og:description", content: "Afine seu instrumento pelo microfone, no celular ou no computador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Afinador Cromático — Solando" },
      { name: "twitter:description", content: "Afine seu instrumento pelo microfone, no celular ou no computador." },
    ],
  }),
  component: AfinadorPage,
});

type Nota = { nome: string; freq: number; nota: string; oitava: number; rotulo?: string };
type Instrumento = { id: string; label: string; descricao: string; notas: Nota[] };

const A4 = 440;
const NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENARMONICOS: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
};

function n(nome: string, rotulo?: string): Nota {
  const match = nome.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) throw new Error(`nota inválida: ${nome}`);
  const [, rawPitch, octStr] = match;
  const pitch = ENARMONICOS[rawPitch] ?? rawPitch;
  const idx = NOTAS.indexOf(pitch);
  const oct = parseInt(octStr, 10);
  const midi = (oct + 1) * 12 + idx;
  return { nome, freq: A4 * Math.pow(2, (midi - 69) / 12), nota: pitch, oitava: oct, rotulo };
}

const INSTRUMENTOS: Instrumento[] = [
  { id: "violao", label: "Violão", descricao: "E A D G B E (padrão)", notas: [n("E2"), n("A2"), n("D3"), n("G3"), n("B3"), n("E4")] },
  { id: "guitarra", label: "Guitarra", descricao: "E A D G B E (padrão)", notas: [n("E2"), n("A2"), n("D3"), n("G3"), n("B3"), n("E4")] },
  { id: "baixo", label: "Baixo", descricao: "E A D G (4 cordas)", notas: [n("E1"), n("A1"), n("D2"), n("G2")] },
  { id: "violino", label: "Violino", descricao: "G D A E (quintas)", notas: [n("G3"), n("D4"), n("A4"), n("E5")] },
  { id: "sax", label: "Saxofone", descricao: "Notas de referência (Bb / Eb)", notas: [n("Bb3"), n("D4"), n("G4"), n("C5")] },
  { id: "flauta", label: "Flauta Doce", descricao: "Soprano em Dó", notas: [n("C5"), n("D5"), n("E5"), n("F5"), n("G5"), n("A5"), n("B5"), n("C6")] },
  { id: "banjo", label: "Banjo", descricao: "G D G B D (5 cordas)", notas: [n("G4"), n("D3"), n("G3"), n("B3"), n("D4")] },
  { id: "sanfona", label: "Sanfona", descricao: "Notas de referência", notas: [n("C3"), n("C4"), n("G4"), n("C5")] },
  {
    id: "bateria",
    label: "Bateria",
    descricao: "Afinação de peles — bata no centro da pele e compare a nota fundamental de cada peça",
    notas: [
      n("F1", "Bumbo 22\""),
      n("A1", "Surdo 16\""),
      n("C2", "Tom 3 (14\")"),
      n("F2", "Tom 2 (12\")"),
      n("A2", "Tom 1 (10\")"),
      n("D3", "Caixa 14\""),
    ],
  },
  { id: "cromatico", label: "Cromático", descricao: "Qualquer nota (A4 = 440 Hz)", notas: [n("C3"), n("E3"), n("G3"), n("C4"), n("E4"), n("G4"), n("C5")] },
];

/* ---------- detecção de pitch (autocorrelação normalizada) ---------- */
function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1; // silêncio

  // remove offset DC
  let mean = 0;
  for (let i = 0; i < SIZE; i++) mean += buf[i];
  mean /= SIZE;

  const minLag = Math.floor(sampleRate / 1300); // ~1300 Hz
  const maxLag = Math.floor(sampleRate / 30); // ~30 Hz
  let bestLag = -1;
  let bestCorr = 0;
  let lastCorr = 1;
  for (let lag = minLag; lag < Math.min(maxLag, SIZE - 1); lag++) {
    let corr = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      const a = buf[i] - mean;
      const b = buf[i + lag] - mean;
      corr += a * b;
      norm1 += a * a;
      norm2 += b * b;
    }
    corr /= Math.sqrt(norm1 * norm2) || 1;
    if (corr > 0.9 && corr > lastCorr) {
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    } else if (bestLag > -1 && corr < lastCorr && bestCorr > 0.9) {
      break;
    }
    lastCorr = corr;
  }
  if (bestLag < 0 || bestCorr < 0.9) return -1;
  return sampleRate / bestLag;
}

function freqToNota(freq: number) {
  const midi = 69 + 12 * Math.log2(freq / A4);
  const midiRound = Math.round(midi);
  const cents = Math.round((midi - midiRound) * 100);
  return {
    nome: NOTAS[((midiRound % 12) + 12) % 12],
    oitava: Math.floor(midiRound / 12) - 1,
    cents,
  };
}

function AfinadorPage() {
  const [selectedInst, setSelectedInst] = useState<Instrumento>(INSTRUMENTOS[0]);
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [freq, setFreq] = useState(0);
  const [detectada, setDetectada] = useState<{ nome: string; oitava: number; cents: number } | null>(null);
  const [tocando, setTocando] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const oscRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const centsSmooth = useRef<number | null>(null);

  const getCtx = useCallback(async () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const AC: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const parar = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    centsSmooth.current = null;
    setAtivo(false);
    setDetectada(null);
    setFreq(0);
  }, []);

  const iniciar = useCallback(async () => {
    setErro(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErro("Este dispositivo/navegador não expõe o microfone. No celular use o app instalado ou um navegador atualizado (HTTPS).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      const ctx = await getCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      src.connect(analyser);
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
      setAtivo(true);

      const loop = () => {
        const a = analyserRef.current;
        const buf = bufRef.current;
        const c = ctxRef.current;
        if (!a || !buf || !c) return;
        a.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, c.sampleRate);
        if (f > 0) {
          const info = freqToNota(f);
          centsSmooth.current =
            centsSmooth.current === null ? info.cents : centsSmooth.current * 0.7 + info.cents * 0.3;
          setFreq(f);
          setDetectada({ ...info, cents: Math.round(centsSmooth.current) });
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const err = e as { name?: string };
      if (err.name === "NotAllowedError") setErro("Permissão do microfone negada. Libere o microfone nas configurações do app/navegador.");
      else if (err.name === "NotFoundError") setErro("Nenhum microfone encontrado neste dispositivo.");
      else setErro("Não foi possível acessar o microfone. Tente novamente.");
      parar();
    }
  }, [getCtx, parar]);

  const tocarNota = useCallback(
    async (nota: Nota) => {
      const ctx = await getCtx();
      if (oscRef.current) {
        try {
          oscRef.current.osc.stop();
        } catch {
          /* já parado */
        }
        oscRef.current = null;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = nota.freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.9);
      oscRef.current = { osc, gain };
      setTocando(nota.nome);
      osc.onended = () => setTocando((t) => (t === nota.nome ? null : t));
    },
    [getCtx],
  );

  useEffect(() => () => parar(), [parar]);

  const cents = detectada?.cents ?? 0;
  const afinado = detectada && Math.abs(cents) <= 5;
  const alvo = detectada
    ? selectedInst.notas.find((x) => x.nota === detectada.nome && x.oitava === detectada.oitava) ??
      selectedInst.notas.find((x) => x.nota === detectada.nome)
    : undefined;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Afinador Cromático</h1>
      <p className="text-muted-foreground mb-6">Toque uma nota por vez, perto do microfone, em ambiente silencioso.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {INSTRUMENTOS.map((inst) => (
          <button
            key={inst.id}
            onClick={() => setSelectedInst(inst)}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm transition-all",
              selectedInst.id === inst.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-accent",
            )}
          >
            {inst.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="mb-4 text-center text-muted-foreground">{selectedInst.descricao}</div>

        <div className="flex justify-center gap-3 flex-wrap mb-8">
          {selectedInst.notas.map((nota) => (
            <button
              key={`${selectedInst.id}-${nota.nome}`}
              onClick={() => tocarNota(nota)}
              className={cn(
                "w-20 h-20 rounded-full border-2 px-1 text-center flex flex-col items-center justify-center font-bold transition-colors",
                tocando === nota.nome ? "border-primary bg-primary/15" : "border-primary/25 hover:bg-primary/5",
                alvo?.nome === nota.nome && afinado && "border-emerald-500 bg-emerald-500/15",
              )}
            >
              <span className="text-lg">{nota.nome}</span>
              <span className="text-[10px] text-muted-foreground">{nota.freq.toFixed(1)}Hz</span>
              {nota.rotulo && (
                <span className="text-[9px] leading-tight text-muted-foreground">{nota.rotulo}</span>
              )}
            </button>
          ))}
        </div>

        {/* Mostrador */}
        <div className="border-t border-border pt-8">
          <div className="text-center">
            <div className={cn("text-6xl font-black tabular-nums", afinado ? "text-emerald-500" : "text-foreground")}>
              {detectada ? `${detectada.nome}${detectada.oitava}` : "--"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {freq > 0 ? `${freq.toFixed(1)} Hz` : ativo ? "Ouvindo..." : "Microfone desligado"}
            </div>

            {/* barra de cents */}
            <div className="relative h-10 mt-6 mx-auto max-w-md">
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
              <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-primary/50" />
              <div
                className={cn(
                  "absolute top-1/2 h-6 w-3 -translate-y-1/2 rounded-full transition-all duration-100",
                  afinado ? "bg-emerald-500" : "bg-amber-500",
                )}
                style={{ left: `calc(50% + ${Math.max(-50, Math.min(50, cents))}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between max-w-md mx-auto text-xs text-muted-foreground mt-1">
              <span>-50¢ grave</span>
              <span className={cn("font-semibold", afinado && "text-emerald-500")}>
                {detectada ? (afinado ? "Afinado" : `${cents > 0 ? "+" : ""}${cents}¢`) : "—"}
              </span>
              <span>agudo +50¢</span>
            </div>

            <button
              onClick={() => (ativo ? parar() : iniciar())}
              className={cn(
                "mt-8 px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto",
                ativo ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              {ativo ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {ativo ? "Parar Microfone" : "Iniciar Microfone"}
            </button>

            {erro && (
              <p className="mt-4 text-sm text-destructive max-w-md mx-auto">{erro}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3 bg-muted/40 border border-border rounded-xl p-4 text-sm text-muted-foreground">
          <Volume2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Toque nos círculos para ouvir a nota de referência e afinar de ouvido.</span>
        </div>
        <div className="flex gap-3 bg-muted/40 border border-border rounded-xl p-4 text-sm text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>No celular, use fones para o som de referência não interferir na captação do microfone.</span>
        </div>
      </div>
    </div>
  );
}
