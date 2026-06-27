import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/escalas")({
  head: () => ({
    meta: [
      { title: "Escalas — Melodia" },
      { name: "description", content: "Consulta completa de escalas maiores, menores e modais com graus e notas para cada tonalidade." },
      { property: "og:title", content: "Escalas — Melodia" },
      { property: "og:description", content: "Consulta completa de escalas maiores, menores e modais com graus e notas." },
    ],
  }),
  component: EscalasPage,
});

const TONALITIES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"] as const;

const SCALE_TYPES = [
  {
    name: "Maior",
    pattern: [2, 2, 1, 2, 2, 2, 1],
    modes: ["Jônio", "Dórico", "Frígio", "Lídio", "Mixolídio", "Eólio", "Lócrio"],
  },
  {
    name: "Menor Natural",
    pattern: [2, 1, 2, 2, 1, 2, 2],
    modes: [],
  },
  {
    name: "Menor Harmônica",
    pattern: [2, 1, 2, 2, 1, 3, 1],
    modes: [],
  },
  {
    name: "Menor Melódica",
    pattern: [2, 1, 2, 2, 2, 2, 1],
    modes: [],
  },
  {
    name: "Pentatônica Maior",
    pattern: [2, 2, 3, 2, 3],
    modes: [],
  },
  {
    name: "Pentatônica Menor",
    pattern: [3, 2, 2, 3, 2],
    modes: [],
  },
];

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getScaleNotes(tonic: string, pattern: number[]) {
  const idx = CHROMATIC.indexOf(tonic);
  if (idx === -1) return [];
  const notes = [tonic];
  let pos = idx;
  for (const step of pattern.slice(0, -1)) {
    pos = (pos + step) % 12;
    notes.push(CHROMATIC[pos]);
  }
  return notes;
}

const DEGREE_NAMES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function EscalasPage() {
  const [selectedTonic, setSelectedTonic] = useState<string>("C");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            Referência
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Escalas Musicais</h1>
          <p className="mt-2 text-muted-foreground">Escolha a tônica e explore as escalas com seus graus e notas.</p>
        </div>

        {/* Seletor de tônica */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-4">
          <label className="mb-3 block text-sm font-medium text-muted-foreground">Tônica</label>
          <div className="flex flex-wrap gap-2">
            {TONALITIES.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTonic(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
                  selectedTonic === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de escalas */}
        <div className="space-y-3">
          {SCALE_TYPES.map((scale, idx) => {
            const notes = getScaleNotes(selectedTonic, scale.pattern);
            const isOpen = expanded.has(idx);

            return (
              <div key={scale.name} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => {
                    const next = new Set(expanded);
                    if (next.has(idx)) next.delete(idx);
                    else next.add(idx);
                    setExpanded(next);
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <span className="font-display text-lg font-bold">{selectedTonic} {scale.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({scale.pattern.join("-")})
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 pb-5 pt-3">
                    <div className="flex flex-wrap gap-2">
                      {notes.map((note, i) => (
                        <div
                          key={`${note}-${i}`}
                          className="flex flex-col items-center rounded-xl bg-muted px-4 py-3 min-w-[60px]"
                        >
                          <span className="text-xs text-muted-foreground">{DEGREE_NAMES[i]}</span>
                          <span className="font-display text-lg font-bold text-primary">{note}</span>
                        </div>
                      ))}
                    </div>
                    {scale.modes.length > 0 && (
                      <div className="mt-4">
                        <span className="text-xs font-medium text-muted-foreground">Modos:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {scale.modes.map((mode) => (
                            <span key={mode} className="rounded-md bg-secondary/40 px-2 py-1 text-xs text-secondary-foreground">
                              {mode}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
