import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Radio, Info, Volume2, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/afinador")({
  head: () => ({
    meta: [
      { title: "Afinador — Solando" },
      { name: "description", content: "Afinador cromático para vários instrumentos." },
    ],
  }),
  component: AfinadorPage,
});

type Nota = { nome: string; freq: number; nota: string; oitava: number; dica?: string };
type Instrumento = {
  id: string;
  label: string;
  descricao: string;
  notas: Nota[];
};

const A4 = 440;
const NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function n(nome: string, dica?: string): Nota {
  const match = nome.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) throw new Error("nota inválida");
  const [, pitch, octStr] = match;
  const idx = NOTAS.indexOf(pitch);
  const oct = parseInt(octStr, 10);
  const midi = (oct + 1) * 12 + idx;
  return { nome, freq: A4 * Math.pow(2, (midi - 69) / 12), nota: pitch, oitava: oct, dica };
}

const INSTRUMENTOS: Instrumento[] = [
  {
    id: "violao",
    label: "Violão",
    descricao: "E A D G B E",
    notas: [n("E2"), n("A2"), n("D3"), n("G3"), n("B3"), n("E4")],
  },
  {
    id: "sanfona",
    label: "Sanfona",
    descricao: "Notas de referência",
    notas: [n("C3"), n("C4"), n("G4"), n("C5")],
  }
];

function AfinadorPage() {
  const [selectedInst, setSelectedInst] = useState(INSTRUMENTOS[0]);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Afinador</h1>
      
      <div className="flex gap-2 mb-8">
        {INSTRUMENTOS.map(inst => (
          <button
            key={inst.id}
            onClick={() => setSelectedInst(inst)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-all",
              selectedInst.id === inst.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
            )}
          >
            {inst.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="mb-4 text-muted-foreground">{selectedInst.descricao}</div>
        <div className="flex justify-center gap-4 flex-wrap">
          {selectedInst.notas.map(nota => (
            <button
              key={nota.nome}
              className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center font-bold text-xl hover:bg-primary/5 transition-colors"
            >
              {nota.nome}
            </button>
          ))}
        </div>
        
        <div className="mt-12 py-8 border-t border-border">
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto">
            <Mic className="w-5 h-5" /> Iniciar Microfone
          </button>
          <p className="mt-4 text-sm text-muted-foreground italic">
            O afinador real está sendo calibrado para a Sanfona e outros instrumentos...
          </p>
        </div>
      </div>
    </div>
  );
}
