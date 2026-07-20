import { useCallback, useRef, useState } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";

type Pattern = Record<string, string>; // 16 chars per row

const ROW_KEYS = ["CY","RD","HH","SN","T1","T2","FT","BD"] as const;

// Bateria sintética (acústica) usando Tone
function createKit() {
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } }).toDestination();
  const snare = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination();
  const snareTone = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.13, sustain: 0 } }).toDestination();
  (snareTone.volume as Tone.Param<"decibels">).value = -8;
  const hh = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05, release: 0.01 } as never, harmonicity: 5.1, resonance: 4000, octaves: 1.5 }).toDestination();
  (hh.volume as Tone.Param<"decibels">).value = -20;
  const hhOpen = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.25, release: 0.05 } as never, harmonicity: 5.1, resonance: 3500, octaves: 1.5 }).toDestination();
  (hhOpen.volume as Tone.Param<"decibels">).value = -18;
  const ride = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.5, release: 0.1 } as never, harmonicity: 3.1, resonance: 6000, octaves: 1.2 }).toDestination();
  (ride.volume as Tone.Param<"decibels">).value = -16;
  const crash = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 1.2, release: 0.5 } as never, harmonicity: 5.1, resonance: 2000, octaves: 2 }).toDestination();
  (crash.volume as Tone.Param<"decibels">).value = -14;
  const tom1 = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 4 }).toDestination();
  const tom2 = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 4 }).toDestination();
  const ft = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 3 }).toDestination();
  return { kick, snare, snareTone, hh, hhOpen, ride, crash, tom1, tom2, ft };
}

export function DrumPatternPlayer({ pattern, bpm, className, label = "Ouvir" }: { pattern: Pattern; bpm: number; className?: string; label?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const stopRef = useRef<() => void>(() => {});

  const play = useCallback(async () => {
    if (state === "playing") { stopRef.current(); return; }
    setState("loading");
    try {
      await Tone.start();
      const kit = createKit();
      const spb = 60 / bpm; // seconds per beat
      const step = spb / 4; // 16th note
      const now = Tone.now() + 0.1;
      const loops = 2;

      const trigger = (row: string, when: number, accent: boolean) => {
        const vel = accent ? 1 : 0.7;
        switch (row) {
          case "BD": kit.kick.triggerAttackRelease("C1", "8n", when, vel); break;
          case "SN":
            kit.snare.triggerAttackRelease("16n", when, vel);
            kit.snareTone.triggerAttackRelease("D2", "16n", when, vel);
            break;
          case "HH": kit.hh.triggerAttackRelease("C6", "32n", when, vel * 0.7); break;
          case "RD": kit.ride.triggerAttackRelease("C6", "8n", when, vel * 0.7); break;
          case "CY": kit.crash.triggerAttackRelease("C5", "2n", when, vel); break;
          case "T1": kit.tom1.triggerAttackRelease("A3", "8n", when, vel); break;
          case "T2": kit.tom2.triggerAttackRelease("F3", "8n", when, vel); break;
          case "FT": kit.ft.triggerAttackRelease("C3", "8n", when, vel); break;
        }
      };

      for (let loop = 0; loop < loops; loop++) {
        for (let i = 0; i < 16; i++) {
          const t = now + (loop * 16 + i) * step;
          for (const row of ROW_KEYS) {
            const ch = pattern[row]?.[i];
            if (ch === "x" || ch === "o") trigger(row, t, ch === "o");
          }
        }
      }

      setState("playing");
      const totalMs = loops * 16 * step * 1000 + 400;
      const timer = setTimeout(() => {
        setState("idle");
        Object.values(kit).forEach((n) => n.dispose());
      }, totalMs);
      stopRef.current = () => {
        clearTimeout(timer);
        Object.values(kit).forEach((n) => n.dispose());
        setState("idle");
      };
    } catch (err) {
      console.error("DrumPatternPlayer error", err);
      setState("idle");
    }
  }, [pattern, bpm, state]);

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
      {state === "playing" ? "Parar" : state === "loading" ? "…" : label}
    </button>
  );
}
