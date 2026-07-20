import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Guitar, Piano as PianoIcon, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { InstrumentDiagram, type InstrumentId } from "@/components/InstrumentDiagram";


export const Route = createFileRoute("/acordes")({
  head: () => ({
    meta: [
      { title: "Acordes — Solando" },
      { name: "description", content: "Referência visual de acordes: triades maiores, menores, diminutas e aumentadas para todas as tonalidades." },
      { property: "og:title", content: "Acordes — Solando" },
      { property: "og:description", content: "Referência visual de triades, tétrades e inversões para qualquer tonalidade." },
    ],
  }),
  component: AcordesPage,
});

const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface ChordDef {
  name: string;
  symbol: string;
  intervals: number[];
  description: string;
  color: string;
}

const CHORD_TYPES: ChordDef[] = [
  { name: "Maior", symbol: "", intervals: [0, 4, 7], description: "Alegre, estável", color: "border-emerald-500/30 bg-emerald-500/5" },
  { name: "Menor", symbol: "m", intervals: [0, 3, 7], description: "Triste, melancólico", color: "border-amber-500/30 bg-amber-500/5" },
  { name: "Diminuto", symbol: "dim", intervals: [0, 3, 6], description: "Tensionado, instável", color: "border-rose-500/30 bg-rose-500/5" },
  { name: "Aumentado", symbol: "aug", intervals: [0, 4, 8], description: "Suspenso, misterioso", color: "border-violet-500/30 bg-violet-500/5" },
  { name: "Sétima Maior", symbol: "maj7", intervals: [0, 4, 7, 11], description: "Suave, sofisticado", color: "border-sky-500/30 bg-sky-500/5" },
  { name: "Sétima Menor", symbol: "7", intervals: [0, 4, 7, 10], description: "Blues, jazzy", color: "border-primary/30 bg-primary/5" },
  { name: "Menor com 7ª", symbol: "m7", intervals: [0, 3, 7, 10], description: "Suave, melancólico", color: "border-amber-500/30 bg-amber-500/5" },
  { name: "Meio-Diminuto", symbol: "m7b5", intervals: [0, 3, 6, 10], description: "Tensionado, jazzy", color: "border-rose-500/30 bg-rose-500/5" },
];

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getChordNotes(root: string, intervals: number[]) {
  const idx = CHROMATIC.indexOf(root);
  return intervals.map((int) => CHROMATIC[(idx + int) % 12]);
}

function AcordesPage() {
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedType, setSelectedType] = useState<ChordDef | null>(null);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            Referência
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Acordes</h1>
          <p className="mt-2 text-muted-foreground">Consulte as notas que compõem cada tipo de acorde em qualquer tonalidade.</p>
        </div>

        {/* Seletor de tônica */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <label className="mb-3 block text-sm font-medium text-muted-foreground">Tônica</label>
          <div className="flex flex-wrap gap-2">
            {ROOTS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRoot(r)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
                  selectedRoot === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de acordes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHORD_TYPES.map((chord) => {
            const notes = getChordNotes(selectedRoot, chord.intervals);
            const fullName = `${selectedRoot}${chord.symbol}`;
            const isSelected = selectedType?.name === chord.name;

            return (
              <button
                key={chord.name}
                onClick={() => setSelectedType(isSelected ? null : chord)}
                className={cn(
                  "rounded-2xl border p-5 text-left transition-all hover:scale-[1.02]",
                  isSelected ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30" : `border-border bg-card ${chord.color}`,
                )}
              >
                <div className="font-display text-2xl font-bold">{fullName}</div>
                <div className="mt-1 text-xs text-muted-foreground">{chord.name}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {notes.map((n) => (
                    <span key={n} className="rounded-md bg-background px-2 py-1 text-sm font-semibold text-foreground">
                      {n}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{chord.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
