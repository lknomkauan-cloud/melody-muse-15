import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Guitar, Piano as PianoIcon, Music2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { InstrumentDiagram, type InstrumentId } from "@/components/InstrumentDiagram";
import { ChordDiagramCifra, hasCifraData } from "@/components/ChordDiagramCifra";
import { MusicalTraining } from "@/components/MusicalTraining";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";




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

type InstId = InstrumentId | "ukulele";
const INSTRUMENTS: { id: InstId; label: string }[] = [
  { id: "violao", label: "Violão" },
  { id: "guitarra", label: "Guitarra" },
  { id: "ukulele", label: "Ukulele" },
  { id: "baixo", label: "Baixo" },
  { id: "piano", label: "Piano/Teclado" },
  { id: "violino", label: "Violino" },
  { id: "sax", label: "Saxofone" },
  { id: "banjo", label: "Banjo" },
  { id: "flauta", label: "Flauta Doce" },
];


function AcordesPage() {
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedType, setSelectedType] = useState<ChordDef | null>(CHORD_TYPES[0]);
  const [instrument, setInstrument] = useState<InstId>("violao");

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            Estudo de Acordes
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Dicionário & Treino</h1>
          <p className="mt-2 text-muted-foreground">
            Aprenda a montar acordes em diversos instrumentos ou treine diretamente com suas músicas favoritas.
          </p>
        </div>

        <Tabs defaultValue="dicionario" className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dicionario" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Dicionário
            </TabsTrigger>
            <TabsTrigger value="treino" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Treino Musical
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dicionario" className="space-y-6">


        {/* Seletor de tônica */}
        <div className="mb-4 rounded-2xl border border-border bg-card p-4">
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
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHORD_TYPES.map((chord) => {
            const notes = getChordNotes(selectedRoot, chord.intervals);
            const fullName = `${selectedRoot}${chord.symbol}`;
            const isSelected = selectedType?.name === chord.name;

            return (
              <button
                key={chord.name}
                onClick={() => setSelectedType(chord)}
                className={cn(
                  "rounded-2xl border p-5 text-left transition-all hover:scale-[1.02]",
                  isSelected ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30" : `border-border bg-card ${chord.color}`,
                )}
              >
                <div className="font-display text-2xl font-bold">{fullName}</div>
                <div className="mt-1 text-xs text-muted-foreground">{chord.name}</div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {notes.map((n) => (
                    <span key={n} className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                      {n}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{chord.description}</div>
              </button>
            );
          })}
        </div>

        {/* Seletor de instrumento + diagrama */}
        {selectedType && (
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music2 className="h-4 w-4" />
                  Como tocar
                </div>
                <div className="font-display text-2xl font-bold">
                  {selectedRoot}
                  {selectedType.symbol}{" "}
                  <span className="text-sm font-normal text-muted-foreground">({selectedType.name})</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {getChordNotes(selectedRoot, selectedType.intervals).map((n) => (
                    <span key={n} className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {INSTRUMENTS.map((inst) => {
                const active = instrument === inst.id;
                const Icon = inst.id === "piano" ? PianoIcon : Guitar;
                return (
                  <button
                    key={inst.id}
                    onClick={() => setInstrument(inst.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {inst.label}
                  </button>
                );
              })}
            </div>

            {(instrument === "violao" || instrument === "guitarra" || instrument === "ukulele") ? (
              (() => {
                const dbKey = instrument === "ukulele" ? "ukulele" : "guitar";
                const has = hasCifraData(dbKey, selectedRoot, selectedType.name);
                if (has) {
                  return (
                    <ChordDiagramCifra
                      instrument={dbKey}
                      root={selectedRoot}
                      chordName={selectedType.name}
                    />
                  );
                }
                // fallback to neck highlight
                if (instrument === "ukulele") {
                  return (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Sem desenho cadastrado para este acorde no ukulele.
                    </div>
                  );
                }
                return (
                  <InstrumentDiagram
                    instrument={instrument}
                    root={selectedRoot}
                    pentSemis={selectedType.intervals}
                  />
                );
              })()
            ) : (
              <InstrumentDiagram
                instrument={instrument}
                root={selectedRoot}
                pentSemis={selectedType.intervals}
              />
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              {instrument === "violao" || instrument === "guitarra" || instrument === "ukulele"
                ? `Diagrama estilo Cifra Club: pontos = onde apertar, número = dedo, barra = pestana. X = corda abafada, O = corda solta. Use as setas para ver outras posições/pestanas.`
                : `Cada bolinha marca uma nota do acorde. O círculo preenchido é a tônica (${selectedRoot}).`}
            </p>

          </div>
        )}
      </div>
    </div>
  );
}

