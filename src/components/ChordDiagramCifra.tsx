import guitar from "@tombatossals/chords-db/lib/guitar.json";
import ukulele from "@tombatossals/chords-db/lib/ukulele.json";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Position = {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  capo?: boolean;
};

type ChordEntry = { key: string; suffix: string; positions: Position[] };

type DB = {
  main: { strings: number; fretsOnChord: number; name: string; numberOfChords: number };
  tunings: Record<string, string[]>;
  chords: Record<string, ChordEntry[]>;
};

const DBS: Record<string, DB> = {
  guitar: guitar as unknown as DB,
  ukulele: ukulele as unknown as DB,
};

// Map "C#" -> "Csharp", "Ab" -> "Ab" etc (db uses "Csharp"/"Fsharp" for sharps, flat names for the rest)
const KEY_MAP: Record<string, string> = {
  C: "C", "C#": "Csharp", Db: "Csharp",
  D: "D", "D#": "Eb", Eb: "Eb",
  E: "E",
  F: "F", "F#": "Fsharp", Gb: "Fsharp",
  G: "G", "G#": "Ab", Ab: "Ab",
  A: "A", "A#": "Bb", Bb: "Bb",
  B: "B",
};

// Map user chord type -> db suffix
export const SUFFIX_MAP: Record<string, string> = {
  Maior: "major",
  Menor: "minor",
  Diminuto: "dim",
  Aumentado: "aug",
  "Sétima Maior": "maj7",
  "Sétima Menor": "7",
  "Menor com 7ª": "m7",
  "Meio-Diminuto": "m7b5",
};

export function hasCifraData(instrument: "guitar" | "ukulele", root: string, chordName: string) {
  const db = DBS[instrument];
  const key = KEY_MAP[root];
  const suffix = SUFFIX_MAP[chordName];
  if (!db || !key || !suffix) return false;
  const arr = db.chords[key] || [];
  return arr.some((c) => c.suffix === suffix);
}

export function ChordDiagramCifra({
  instrument,
  root,
  chordName,
}: {
  instrument: "guitar" | "ukulele";
  root: string;
  chordName: string;
}) {
  const [posIdx, setPosIdx] = useState(0);
  const db = DBS[instrument];
  const key = KEY_MAP[root];
  const suffix = SUFFIX_MAP[chordName];
  const entry = db?.chords[key]?.find((c) => c.suffix === suffix);
  const positions = entry?.positions ?? [];

  if (!entry || positions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Não temos um desenho cadastrado para este acorde neste instrumento.
      </div>
    );
  }

  const idx = Math.min(posIdx, positions.length - 1);
  const pos = positions[idx];
  const strings = db.main.strings;
  const tuning = db.tunings.standard;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPosIdx((i) => (i - 1 + positions.length) % positions.length)}
          disabled={positions.length < 2}
          className="rounded-md border border-border p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Posição anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          Posição {idx + 1} de {positions.length}
        </span>
        <button
          onClick={() => setPosIdx((i) => (i + 1) % positions.length)}
          disabled={positions.length < 2}
          className="rounded-md border border-border p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Próxima posição"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <ChordSvg pos={pos} strings={strings} tuning={tuning} />
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span><span className="font-mono">X</span> = não toque</span>
        <span><span className="font-mono">O</span> = solta</span>
        <span>Números = dedos (1=indicador, 2=médio, 3=anelar, 4=mindinho)</span>
        <span>Barra grossa = pestana</span>
      </div>
    </div>
  );
}

function ChordSvg({ pos, strings, tuning }: { pos: Position; strings: number; tuning: string[] }) {
  const framesToShow = 5;
  const padTop = 40;
  const padLeft = 30;
  const padRight = 20;
  const stringGap = 26;
  const fretGap = 34;
  const w = padLeft + (strings - 1) * stringGap + padRight;
  const h = padTop + framesToShow * fretGap + 30;

  const displayed = pos.frets.slice(); // db order matches tuning order (low->high for guitar/ukulele)
  // Cifra Club shows LOW string on left. Guitar tuning ["E","A","D","G","B","E"] already low->high left->right. Good.

  // Barré detection: pos.barres = list of fret numbers (relative to baseFret) that are barred.
  const barres = pos.barres ?? [];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      className="max-w-[260px]"
      role="img"
      aria-label="Diagrama de acorde estilo Cifra Club"
    >
      {/* base fret label */}
      {pos.baseFret > 1 && (
        <text
          x={padLeft - 8}
          y={padTop + fretGap / 2 + 4}
          fontSize={12}
          textAnchor="end"
          fill="var(--muted-foreground)"
          fontWeight={600}
        >
          {pos.baseFret}ª
        </text>
      )}

      {/* nut */}
      {pos.baseFret === 1 && (
        <rect
          x={padLeft - 1}
          y={padTop - 6}
          width={(strings - 1) * stringGap + 2}
          height={6}
          fill="var(--foreground)"
        />
      )}

      {/* frets */}
      {Array.from({ length: framesToShow + 1 }).map((_, i) => (
        <line
          key={i}
          x1={padLeft}
          x2={padLeft + (strings - 1) * stringGap}
          y1={padTop + i * fretGap}
          y2={padTop + i * fretGap}
          stroke="var(--foreground)"
          strokeWidth={i === 0 && pos.baseFret === 1 ? 0 : 1.5}
          opacity={0.6}
        />
      ))}

      {/* strings */}
      {Array.from({ length: strings }).map((_, s) => (
        <line
          key={s}
          x1={padLeft + s * stringGap}
          x2={padLeft + s * stringGap}
          y1={padTop}
          y2={padTop + framesToShow * fretGap}
          stroke="var(--foreground)"
          strokeWidth={1}
          opacity={0.7}
        />
      ))}

      {/* tuning labels top */}
      {tuning.map((t, s) => (
        <text
          key={s}
          x={padLeft + s * stringGap}
          y={padTop + framesToShow * fretGap + 20}
          fontSize={10}
          textAnchor="middle"
          fill="var(--muted-foreground)"
        >
          {t}
        </text>
      ))}

      {/* X / O on top */}
      {displayed.map((f, s) => {
        const cx = padLeft + s * stringGap;
        if (f === -1) {
          return (
            <text key={`x-${s}`} x={cx} y={padTop - 10} fontSize={14} textAnchor="middle" fill="var(--muted-foreground)" fontWeight={700}>
              X
            </text>
          );
        }
        if (f === 0) {
          return (
            <circle key={`o-${s}`} cx={cx} cy={padTop - 14} r={6} fill="none" stroke="var(--foreground)" strokeWidth={1.5} />
          );
        }
        return null;
      })}

      {/* Barres — draw thick bar covering strings that share the barre fret */}
      {barres.map((barreFret) => {
        // Determine range of strings that press this fret
        const stringIdxs: number[] = [];
        displayed.forEach((f, s) => {
          if (f === barreFret) stringIdxs.push(s);
        });
        if (stringIdxs.length < 2) return null;
        const from = Math.min(...stringIdxs);
        const to = Math.max(...stringIdxs);
        const y = padTop + (barreFret - 0.5) * fretGap;
        return (
          <rect
            key={`barre-${barreFret}`}
            x={padLeft + from * stringGap - 10}
            y={y - 9}
            width={(to - from) * stringGap + 20}
            height={18}
            rx={9}
            fill="var(--primary)"
            opacity={0.9}
          />
        );
      })}

      {/* Finger dots */}
      {displayed.map((f, s) => {
        if (f <= 0) return null;
        const cx = padLeft + s * stringGap;
        const cy = padTop + (f - 0.5) * fretGap;
        const finger = pos.fingers[s];
        const onBarre = barres.includes(f);
        return (
          <g key={`d-${s}`}>
            {!onBarre && (
              <circle cx={cx} cy={cy} r={11} fill="var(--primary)" stroke="var(--primary)" strokeWidth={1.5} />
            )}
            {finger > 0 && (
              <text
                x={cx}
                y={cy + 4}
                fontSize={11}
                textAnchor="middle"
                fill="var(--primary-foreground)"
                fontWeight={700}
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
