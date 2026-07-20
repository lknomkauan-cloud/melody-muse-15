import { useCallback, useRef, useState } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";

type InstrumentId =
  | "violao" | "guitarra" | "baixo" | "banjo"
  | "piano" | "teclado" | "sax" | "violino"
  | "flauta" | "bateria";

const SAMPLER_CONFIG: Partial<Record<InstrumentId, { baseUrl: string; urls: Record<string, string>; octave: number }>> = {
  violao: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
    urls: { A2:"A2.mp3", A3:"A3.mp3", A4:"A4.mp3", "C#3":"Cs3.mp3", "C#4":"Cs4.mp3", E2:"E2.mp3", E3:"E3.mp3", E4:"E4.mp3", "G#3":"Gs3.mp3", "G#4":"Gs4.mp3" },
    octave: 3,
  },
  guitarra: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/",
    urls: { A2:"A2.mp3", A3:"A3.mp3", A4:"A4.mp3", A5:"A5.mp3", "C#3":"Cs3.mp3", "C#4":"Cs4.mp3", "C#5":"Cs5.mp3", E2:"E2.mp3", E3:"E3.mp3", E4:"E4.mp3", E5:"E5.mp3" },
    octave: 3,
  },
  baixo: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/bass-electric/",
    urls: { "C#1":"Cs1.mp3", E1:"E1.mp3", G1:"G1.mp3", "A#1":"As1.mp3", "C#2":"Cs2.mp3", E2:"E2.mp3", G2:"G2.mp3", "A#2":"As2.mp3", "C#3":"Cs3.mp3", E3:"E3.mp3" },
    octave: 2,
  },
  piano: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
    urls: { A3:"A3.mp3", A4:"A4.mp3", A5:"A5.mp3", "C#4":"Cs4.mp3", "C#5":"Cs5.mp3", E4:"E4.mp3", E5:"E5.mp3" },
    octave: 4,
  },
  teclado: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
    urls: { A3:"A3.mp3", A4:"A4.mp3", A5:"A5.mp3", "C#4":"Cs4.mp3", "C#5":"Cs5.mp3", E4:"E4.mp3", E5:"E5.mp3" },
    octave: 4,
  },
  violino: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
    urls: { A3:"A3.mp3", A4:"A4.mp3", A5:"A5.mp3", C4:"C4.mp3", C5:"C5.mp3", E4:"E4.mp3", E5:"E5.mp3", G3:"G3.mp3", G4:"G4.mp3" },
    octave: 4,
  },
  sax: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/saxophone/",
    urls: { A3:"A3.mp3", A4:"A4.mp3", "C#3":"Cs3.mp3", "C#4":"Cs4.mp3", "C#5":"Cs5.mp3", E3:"E3.mp3", E4:"E4.mp3", "G#3":"Gs3.mp3", "G#4":"Gs4.mp3" },
    octave: 4,
  },
  banjo: {
    baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
    urls: { A3:"A3.mp3", A4:"A4.mp3", "C#4":"Cs4.mp3", E3:"E3.mp3", E4:"E4.mp3" },
    octave: 4,
  },
};

// cache global de samplers
const samplerCache = new Map<InstrumentId, Tone.Sampler>();

async function getSampler(inst: InstrumentId): Promise<Tone.Sampler | null> {
  const cfg = SAMPLER_CONFIG[inst];
  if (!cfg) return null;
  let s = samplerCache.get(inst);
  if (!s) {
    s = new Tone.Sampler({ urls: cfg.urls, baseUrl: cfg.baseUrl, release: 1 }).toDestination();
    samplerCache.set(inst, s);
  }
  await Tone.loaded();
  return s;
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

      // Bateria: sequência percussiva simples ascendente
      if (instrument === "bateria") {
        const kick = new Tone.MembraneSynth().toDestination();
        const snare = new Tone.NoiseSynth({ noise:{ type:"white" }, envelope:{ attack:0.001, decay:0.15, sustain:0 } }).toDestination();
        const hh = new Tone.MetalSynth({ envelope:{ attack:0.001, decay:0.08, release:0.01 } as never, harmonicity: 5.1, resonance: 4000, octaves: 1.5 }).toDestination();
        (hh.volume as Tone.Param<"decibels">).value = -18;
        const seq: Array<() => void> = [
          () => kick.triggerAttackRelease("C2","8n"),
          () => hh.triggerAttackRelease("C6","16n"),
          () => snare.triggerAttackRelease("8n"),
          () => hh.triggerAttackRelease("C6","16n"),
        ];
        setState("playing");
        let i = 0;
        const stopped = { v: false };
        const now = Tone.now();
        const interval = 0.25;
        for (let k = 0; k < 8; k++) {
          Tone.getTransport().scheduleOnce(() => { if (!stopped.v) seq[k % 4](); }, now + k * interval);
        }
        Tone.getTransport().start();
        const timer = setTimeout(() => { setState("idle"); Tone.getTransport().stop(); kick.dispose(); snare.dispose(); hh.dispose(); }, 8 * interval * 1000 + 200);
        stopRef.current = () => { stopped.v = true; clearTimeout(timer); Tone.getTransport().stop(); kick.dispose(); snare.dispose(); hh.dispose(); setState("idle"); };
        return;
      }

      const sampler = await getSampler(instrument);
      const cfg = SAMPLER_CONFIG[instrument];
      const octBase = cfg?.octave ?? 4;

      // Sequência ascendente + descendente com detecção de oitava
      const now = Tone.now();
      const dt = 0.32;
      let oct = octBase;
      let prevIdx = -1;
      const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
      const enh: Record<string,string> = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#", Cb:"B" };
      const norm = (n: string) => enh[n] ?? n;

      const seq = [...notes, ...notes.slice().reverse().slice(1)];
      const events: Array<{ note: string; t: number }> = [];
      let t = 0;
      for (const n of seq) {
        const idx = CHROMATIC.indexOf(norm(n));
        if (prevIdx !== -1 && idx <= prevIdx) oct++;
        prevIdx = idx;
        events.push({ note: toToneNote(norm(n), oct), t });
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
