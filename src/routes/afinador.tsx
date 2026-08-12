import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Radio, Info, Volume2 } from "lucide-react";
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
  return <div className="p-8">Afinador em construção...</div>;
}
