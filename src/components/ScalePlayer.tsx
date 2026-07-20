import { useCallback, useRef, useState } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";

type InstrumentId =
  | "violao" | "guitarra" | "baixo" | "banjo"
  | "piano" | "teclado" | "sax" | "violino"
  | "flauta" | "bateria";

// URLs abaixo apontam APENAS para arquivos que existem no repo
// nbrosowsky/tonejs-instruments (verificado). Cs = C#, Ds = D#, etc.
const SAMPLER_CONFIG: Partial<Record<InstrumentId, { baseUrl: string; urls: Record<string, string>; octave: number }>> = {
  violao: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
    urls: { F3:"F3.mp3", A3:"A3.mp3", C4:"C4.mp3", "D#4":"Ds4.mp3", "F#4":"Fs4.mp3", A4:"A4.mp3", C5:"C5.mp3", "D#5":"Ds5.mp3", "F#5":"Fs5.mp3", A5:"A5.mp3", C6:"C6.mp3" },
    octave: 3,
  },
  guitarra: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/",
    urls: { E2:"E2.mp3", "F#2":"Fs2.mp3", A2:"A2.mp3", C3:"C3.mp3", "D#3":"Ds3.mp3", "F#3":"Fs3.mp3", A3:"A3.mp3", C4:"C4.mp3", "D#4":"Ds4.mp3", "F#4":"Fs4.mp3", A4:"A4.mp3", C5:"C5.mp3", "D#5":"Ds5.mp3", "F#5":"Fs5.mp3", A5:"A5.mp3" },
    octave: 3,
  },
  baixo: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/bass-electric/",
    urls: { E1:"E1.mp3", G1:"G1.mp3", C2:"C2.mp3", E2:"E2.mp3", G2:"G2.mp3", C3:"C3.mp3", E3:"E3.mp3", G3:"G3.mp3", C4:"C4.mp3" },
    octave: 2,
  },
  piano: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
    urls: { A3:"A3.mp3", C4:"C4.mp3", "D#4":"Ds4.mp3", "F#4":"Fs4.mp3", A4:"A4.mp3", C5:"C5.mp3", "D#5":"Ds5.mp3", "F#5":"Fs5.mp3", A5:"A5.mp3", C6:"C6.mp3" },
    octave: 4,
  },
  teclado: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
    urls: { A3:"A3.mp3", C4:"C4.mp3", "D#4":"Ds4.mp3", "F#4":"Fs4.mp3", A4:"A4.mp3", C5:"C5.mp3", "D#5":"Ds5.mp3", "F#5":"Fs5.mp3", A5:"A5.mp3", C6:"C6.mp3" },
    octave: 4,
  },
  violino: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
    urls: { G3:"G3.mp3", A3:"A3.mp3", C4:"C4.mp3", E4:"E4.mp3", G4:"G4.mp3", A4:"A4.mp3", C5:"C5.mp3", E5:"E5.mp3", G5:"G5.mp3", A5:"A5.mp3", C6:"C6.mp3", E6:"E6.mp3", G6:"G6.mp3", C7:"C7.mp3" },
    octave: 4,
  },
  sax: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/saxophone/",
    urls: { "D#3":"Ds3.mp3", F3:"F3.mp3", G3:"G3.mp3", A3:"A3.mp3", C4:"C4.mp3", "D#4":"Ds4.mp3", F4:"F4.mp3", G4:"G4.mp3", A4:"A4.mp3", C5:"C5.mp3", "D#5":"Ds5.mp3", F5:"F5.mp3", G5:"G5.mp3", A5:"A5.mp3", "D#6":"Ds6.mp3" },
    octave: 4,
  },
  banjo: {
    // usa samples de violão (mais brilhante que nada) — banjo real não existe no repo
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
    urls: { F3:"F3.mp3", A3:"A3.mp3", C4:"C4.mp3", "D#4":"Ds4.mp3", "F#4":"Fs4.mp3", A4:"A4.mp3", C5:"C5.mp3", "D#5":"Ds5.mp3", "F#5":"Fs5.mp3", A5:"A5.mp3" },
    octave: 4,
  },
  flauta: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/flute/",
    urls: { C4:"C4.mp3", E4:"E4.mp3", A4:"A4.mp3", C5:"C5.mp3", E5:"E5.mp3", A5:"A5.mp3", C6:"C6.mp3", E6:"E6.mp3", A6:"A6.mp3", C7:"C7.mp3", E7:"E7.mp3" },
    octave: 5,
  },
  bateria: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/xylophone/",
    urls: { G4:"G4.mp3", C5:"C5.mp3", G5:"G5.mp3", C6:"C6.mp3", G6:"G6.mp3", C7:"C7.mp3", G7:"G7.mp3", C8:"C8.mp3" },
    octave: 4,
  },
};

// cache global de samplers + promise de carregamento
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
      urls: cfg.urls,
      baseUrl: cfg.baseUrl,
      release: 1,
      onload: () => resolveReady(),
      onerror: (e) => rejectReady(e),
    }).toDestination();
    entry = { sampler, ready };
    samplerCache.set(inst, entry);
  }
  try {
    await entry.ready;
  } catch (e) {
    console.error(`Sampler load failed for ${inst}`, e);
    samplerCache.delete(inst);
    return null;
  }
  return entry.sampler;
}

function toToneNote(n: string, octave: number) {
  // n like "C", "C#", "Db"...
  return `${n}${octave}`;
}

export function ScalePlayer({ notes, instrument, className }: { notes: string[]; instrument: InstrumentId; className?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const stopRef = useRef<() => void>(() => {});

  const play = useCallback(async () => {
    if (state === "playing") { stopRef.current(); return; }
    setState("loading");
    try {
      await Tone.start();


      const sampler = await getSampler(instrument);
      const cfg = SAMPLER_CONFIG[instrument];
      const octBase = cfg?.octave ?? 4;

      // Sequência: sobe do I ao VII e volta ao I (sem repetir o VII)
      const now = Tone.now();
      const dt = 0.32;
      const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
      const enh: Record<string,string> = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#", Cb:"B" };
      const norm = (n: string) => enh[n] ?? n;

      // Ascendente: mantém oitava, incrementa só quando cruza (idx < prevIdx)
      const ascending: string[] = [];
      let oct = octBase;
      let prevIdx = -1;
      for (const n of notes) {
        const idx = CHROMATIC.indexOf(norm(n));
        if (prevIdx !== -1 && idx < prevIdx) oct++;
        prevIdx = idx;
        ascending.push(toToneNote(norm(n), oct));
      }
      // Descendente: mesmo caminho em ordem inversa, sem repetir o topo
      const descending = ascending.slice(0, -1).reverse();
      const combined = [...ascending, ...descending];

      const events: Array<{ note: string; t: number }> = [];
      let t = 0;
      for (const note of combined) {
        events.push({ note, t });
        t += dt;
      }

      if (sampler) {
        for (const e of events) sampler.triggerAttackRelease(e.note, dt * 0.9, now + e.t);
      } else {
        // fallback synth for flauta doce
        const synth = new Tone.PolySynth(Tone.Synth, { oscillator:{ type:"triangle" } }).toDestination();
        (synth.volume as Tone.Param<"decibels">).value = -6;
        for (const e of events) synth.triggerAttackRelease(e.note, dt * 0.9, now + e.t);
        setTimeout(() => synth.dispose(), (t + 1) * 1000);
      }

      setState("playing");
      const totalMs = t * 1000 + 300;
      const timer = setTimeout(() => setState("idle"), totalMs);
      stopRef.current = () => {
        clearTimeout(timer);
        sampler?.releaseAll();
        setState("idle");
      };
    } catch (err) {
      console.error("ScalePlayer error", err);
      setState("idle");
    }
  }, [instrument, notes, state]);

  return (
    <button
      type="button"
      onClick={play}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-60",
        className,
      )}
      disabled={state === "loading"}
    >
      {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
       state === "playing" ? <Square className="h-3.5 w-3.5" /> :
       <Play className="h-3.5 w-3.5" />}
      {state === "playing" ? "Parar" : state === "loading" ? "Carregando…" : "Ouvir escala"}
    </button>
  );
}
