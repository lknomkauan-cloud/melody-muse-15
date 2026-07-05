import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Timer, Volume2, VolumeX, Hand } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/metronomo")({
  head: () => ({
    meta: [
      { title: "Metrônomo — Melodia" },
      { name: "description", content: "Metrônomo digital ajustável de 40 a 240 BPM para praticar com precisão." },
      { property: "og:title", content: "Metrônomo — Melodia" },
      { property: "og:description", content: "Metrônomo digital ajustável de 40 a 240 BPM." },
    ],
  }),
  component: MetronomoPage,
});

type Figura = {
  id: string;
  nome: string;
  simbolo: string;
  porBatida: number; // subdivisões por tempo (semínima = 1)
  descricao: string;
};

const FIGURAS: Figura[] = [
  { id: "minima", nome: "Mínima", simbolo: "𝅗𝅥", porBatida: 0.5, descricao: "2 tempos por nota" },
  { id: "seminima", nome: "Semínima", simbolo: "♩", porBatida: 1, descricao: "1 nota por tempo" },
  { id: "colcheia", nome: "Colcheia", simbolo: "♪", porBatida: 2, descricao: "2 notas por tempo" },
  { id: "semicolcheia", nome: "Semicolcheia", simbolo: "𝅘𝅥𝅯", porBatida: 4, descricao: "4 notas por tempo" },
  { id: "fusa", nome: "Fusa", simbolo: "𝅘𝅥𝅰", porBatida: 8, descricao: "8 notas por tempo" },
  { id: "trinado", nome: "Tercina", simbolo: "♪³", porBatida: 3, descricao: "3 notas por tempo" },
];

function MetronomoPage() {
  const [bpm, setBpm] = useState(100);
  const [figuraId, setFiguraId] = useState<string>("seminima");
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatCountRef = useRef(0);
  const tapsRef = useRef<number[]>([]);
  const [tapFlash, setTapFlash] = useState(false);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapsRef.current;
    // reset se o último tap foi há mais de 2s
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length >= 2) {
      const intervalos = taps.slice(1).map((t, i) => t - taps[i]);
      const media = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
      const novoBpm = Math.round(60000 / media);
      if (novoBpm >= 40 && novoBpm <= 240) setBpm(novoBpm);
    }
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 120);
  }, []);

  const figura = FIGURAS.find((f) => f.id === figuraId) ?? FIGURAS[1];
  const subdivisoesPorCompasso = Math.max(1, Math.round(4 * figura.porBatida));

  const playClick = useCallback(
    (accent: boolean) => {
      if (muted) return;
      try {
        const ctx = audioCtxRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = accent ? "triangle" : "sine";
        osc.frequency.value = accent ? 1000 : 800;
        gain.gain.setValueAtTime(accent ? 0.4 : 0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch {
        // Audio not available
      }
    },
    [muted],
  );

  const tick = useCallback(() => {
    beatCountRef.current = (beatCountRef.current + 1) % subdivisoesPorCompasso;
    setBeat(beatCountRef.current);
    playClick(beatCountRef.current === 0);
  }, [playClick, subdivisoesPorCompasso]);

  const intervaloMs = (60 / bpm) * 1000 / figura.porBatida;

  const start = useCallback(() => {
    if (intervalRef.current) return;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        // ignore
      }
    }
    beatCountRef.current = -1;
    tick();
    intervalRef.current = setInterval(tick, intervaloMs);
    setIsPlaying(true);
  }, [intervaloMs, tick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setBeat(0);
    beatCountRef.current = 0;
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, intervaloMs);
    }
  }, [intervaloMs, isPlaying, tick]);

  const presetTempos = [
    { label: "Largo", bpm: 50 },
    { label: "Adagio", bpm: 70 },
    { label: "Andante", bpm: 90 },
    { label: "Moderato", bpm: 110 },
    { label: "Allegro", bpm: 130 },
    { label: "Presto", bpm: 170 },
  ];

  const dots = Array.from({ length: Math.min(subdivisoesPorCompasso, 16) }, (_, i) => i);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <Timer className="h-4 w-4" />
            Ferramenta
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Metrônomo</h1>
          <p className="mt-2 text-muted-foreground">Mantenha o tempo perfeito enquanto pratica.</p>
        </div>

        {/* Display */}
        <div className="mb-6 rounded-3xl border border-border bg-card p-8 text-center">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            {dots.map((i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-150",
                  beat === i ? "bg-primary scale-125 glow-primary" : "bg-muted",
                )}
              />
            ))}
          </div>

          <div className="font-display text-7xl font-bold tabular-nums tracking-tight">
            {bpm}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            BPM · <span className="text-2xl align-middle">{figura.simbolo}</span> {figura.nome}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{figura.descricao}</div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={toggle}
              className={cn(
                "inline-flex h-16 w-16 items-center justify-center rounded-2xl transition-all",
                isPlaying
                  ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:glow-primary",
              )}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </button>
            <button
              onClick={() => setMuted(!muted)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={muted ? "Ativar som" : "Silenciar"}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Figuras rítmicas */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 text-sm font-medium text-muted-foreground">Figura rítmica (subdivisão)</div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {FIGURAS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiguraId(f.id)}
                className={cn(
                  "rounded-xl border px-2 py-3 text-center transition-all",
                  figuraId === f.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-card hover:bg-muted",
                )}
                title={f.descricao}
              >
                <div className="text-2xl leading-none">{f.simbolo}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{f.nome}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">40</span>
            <span className="text-sm font-medium text-muted-foreground">240</span>
          </div>
          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={() => setBpm(Math.max(40, bpm - 5))} className="rounded-md bg-muted px-3 py-1 text-sm font-medium hover:bg-muted/80">-5</button>
            <button onClick={() => setBpm(Math.max(40, bpm - 1))} className="rounded-md bg-muted px-3 py-1 text-sm font-medium hover:bg-muted/80">-1</button>
            <button onClick={() => setBpm(Math.min(240, bpm + 1))} className="rounded-md bg-muted px-3 py-1 text-sm font-medium hover:bg-muted/80">+1</button>
            <button onClick={() => setBpm(Math.min(240, bpm + 5))} className="rounded-md bg-muted px-3 py-1 text-sm font-medium hover:bg-muted/80">+5</button>
          </div>
        </div>

        {/* Tap tempo */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 text-center">
          <div className="mb-3 text-sm font-medium text-muted-foreground">
            Tap tempo — bata no ritmo desejado
          </div>
          <button
            onClick={handleTap}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                handleTap();
              }
            }}
            className={cn(
              "inline-flex h-20 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed font-display text-lg font-bold transition-all",
              tapFlash
                ? "border-primary bg-primary/20 scale-[0.98] glow-primary"
                : "border-border bg-muted/40 hover:bg-muted",
            )}
          >
            <Hand className="h-6 w-6" />
            TAP
          </button>
          <div className="mt-2 text-xs text-muted-foreground">
            Toque pelo menos 2 vezes. O BPM se ajusta automaticamente.
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {presetTempos.map((p) => (
            <button
              key={p.label}
              onClick={() => setBpm(p.bpm)}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition-all",
                bpm === p.bpm
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <div className="font-display text-sm font-bold">{p.bpm}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
