import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";

// ---------- Music theory helpers ----------
const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const KEYS: { name: string; useFlat: boolean }[] = [
  { name: "C", useFlat: false },
  { name: "G", useFlat: false },
  { name: "D", useFlat: false },
  { name: "A", useFlat: false },
  { name: "E", useFlat: false },
  { name: "B", useFlat: false },
  { name: "F", useFlat: true },
  { name: "Bb", useFlat: true },
  { name: "Eb", useFlat: true },
  { name: "Ab", useFlat: true },
  { name: "Db", useFlat: true },
  { name: "Gb", useFlat: true },
];

function noteName(pc: number, useFlat: boolean) {
  return (useFlat ? NOTES_FLAT : NOTES_SHARP)[((pc % 12) + 12) % 12];
}

function pcOf(noteName: string): number {
  const map: Record<string, number> = {
    C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
    "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
  };
  return map[noteName];
}

// Major scale intervals (semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
// Quality labels for diatonic chords (I ii iii IV V vi vii)
const ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const TRIAD_SUFFIX = ["", "m", "m", "", "", "m", "°"];
const TETRAD_SUFFIX = ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"];

// Build a diatonic chord on degree i (0..6) of given root pc
function buildChord(rootPc: number, degree: number, kind: "triad" | "tetrad"): number[] {
  // pc of the chord root
  const chordRoot = (rootPc + MAJOR_SCALE[degree]) % 12;
  // pick scale notes stacked in thirds from degree
  const indices = kind === "triad" ? [0, 2, 4] : [0, 2, 4, 6];
  return indices.map((step) => {
    const idx = (degree + step) % 7;
    const octaveAdd = Math.floor((degree + step) / 7) * 12;
    return (rootPc + MAJOR_SCALE[idx] + octaveAdd) % 12;
    // chordRoot deliberately unused here; first element equals chordRoot
  }).map((n, i) => (i === 0 ? chordRoot : n));
}

// ---------- Fretboard diagram (guitar/bass) ----------
type FretboardProps = {
  tuning: number[]; // pcs of open strings, low → high
  stringNames: string[];
  notes: number[]; // chord notes (pcs)
  rootPc: number;
  useFlat: boolean;
  frets?: number;
};

function Fretboard({ tuning, stringNames, notes, rootPc, useFlat, frets = 5 }: FretboardProps) {
  const stringCount = tuning.length;
  const width = 220;
  const height = 24 + stringCount * 18;
  const left = 34;
  const right = 14;
  const fretW = (width - left - right) / frets;
  const topPad = 14;
  const stringSpace = 18;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* fret lines */}
      {Array.from({ length: frets + 1 }).map((_, i) => (
        <line
          key={i}
          x1={left + i * fretW}
          y1={topPad}
          x2={left + i * fretW}
          y2={topPad + (stringCount - 1) * stringSpace}
          stroke={i === 0 ? "currentColor" : "rgba(148,163,184,0.4)"}
          strokeWidth={i === 0 ? 2.5 : 1}
        />
      ))}
      {/* strings */}
      {tuning.map((_, i) => (
        <line
          key={i}
          x1={left}
          y1={topPad + i * stringSpace}
          x2={width - right}
          y2={topPad + i * stringSpace}
          stroke="rgba(148,163,184,0.5)"
          strokeWidth={0.8}
        />
      ))}
      {/* fret numbers */}
      {Array.from({ length: frets }).map((_, i) => (
        <text
          key={i}
          x={left + i * fretW + fretW / 2}
          y={topPad + stringCount * stringSpace + 4}
          textAnchor="middle"
          fontSize="8"
          fill="rgba(148,163,184,0.7)"
        >
          {i + 1}
        </text>
      ))}
      {/* string labels */}
      {stringNames.map((n, i) => (
        <text
          key={i}
          x={left - 6}
          y={topPad + (stringCount - 1 - i) * stringSpace + 3}
          textAnchor="end"
          fontSize="9"
          fill="rgba(148,163,184,0.8)"
        >
          {n}
        </text>
      ))}
      {/* notes */}
      {tuning.map((openPc, sIdx) => {
        const dots: JSX.Element[] = [];
        for (let f = 0; f <= frets; f++) {
          const pc = (openPc + f) % 12;
          if (notes.includes(pc)) {
            const isRoot = pc === rootPc;
            const cx =
              f === 0 ? left - 14 : left + (f - 1) * fretW + fretW / 2;
            const cy = topPad + (stringCount - 1 - sIdx) * stringSpace;
            dots.push(
              <g key={`${sIdx}-${f}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill={isRoot ? "hsl(var(--primary))" : "rgba(99,102,241,0.85)"}
                  stroke={isRoot ? "white" : "rgba(255,255,255,0.4)"}
                  strokeWidth={isRoot ? 1.2 : 0.6}
                />
                <text
                  x={cx}
                  y={cy + 2.5}
                  textAnchor="middle"
                  fontSize="7"
                  fill="white"
                  fontWeight={isRoot ? 700 : 500}
                >
                  {noteName(pc, useFlat)}
                </text>
              </g>
            );
          }
        }
        return dots;
      })}
    </svg>
  );
}

// ---------- Piano diagram ----------
function Piano({ notes, rootPc, useFlat }: { notes: number[]; rootPc: number; useFlat: boolean }) {
  // 2 octaves starting C
  const whiteIdx = [0, 2, 4, 5, 7, 9, 11];
  const blackIdx = [1, 3, 6, 8, 10];
  const blackPos: Record<number, number> = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
  const whitesPerOctave = 7;
  const octaves = 2;
  const whiteW = 18;
  const whiteH = 70;
  const blackW = 11;
  const blackH = 44;
  const width = whitesPerOctave * octaves * whiteW;
  const height = whiteH + 16;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* white keys */}
      {Array.from({ length: whitesPerOctave * octaves }).map((_, i) => {
        const pc = whiteIdx[i % whitesPerOctave];
        const active = notes.includes(pc);
        const isRoot = pc === rootPc;
        return (
          <g key={`w${i}`}>
            <rect
              x={i * whiteW}
              y={0}
              width={whiteW - 1}
              height={whiteH}
              fill={active ? (isRoot ? "hsl(var(--primary))" : "rgba(99,102,241,0.65)") : "white"}
              stroke="rgba(15,23,42,0.6)"
              strokeWidth={0.6}
            />
            {active && (
              <text
                x={i * whiteW + (whiteW - 1) / 2}
                y={whiteH - 6}
                textAnchor="middle"
                fontSize="8"
                fill="white"
                fontWeight={isRoot ? 700 : 500}
              >
                {noteName(pc, useFlat)}
              </text>
            )}
          </g>
        );
      })}
      {/* black keys */}
      {Array.from({ length: octaves }).flatMap((_, oct) =>
        blackIdx.map((pc) => {
          const x = oct * whitesPerOctave * whiteW + (blackPos[pc] + 1) * whiteW - blackW / 2;
          const active = notes.includes(pc);
          const isRoot = pc === rootPc;
          return (
            <g key={`b${oct}-${pc}`}>
              <rect
                x={x}
                y={0}
                width={blackW}
                height={blackH}
                fill={active ? (isRoot ? "hsl(var(--primary))" : "rgba(99,102,241,0.85)") : "rgb(15,23,42)"}
                stroke="black"
                strokeWidth={0.4}
              />
              {active && (
                <text
                  x={x + blackW / 2}
                  y={blackH - 5}
                  textAnchor="middle"
                  fontSize="7"
                  fill="white"
                  fontWeight={isRoot ? 700 : 500}
                >
                  {noteName(pc, useFlat)}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

// ---------- Note card (sax / violin / voz / bateria) ----------
function NoteCard({ notes, rootPc, useFlat, transpose }: { notes: number[]; rootPc: number; useFlat: boolean; transpose?: { label: string; semitones: number }[] }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex flex-wrap gap-1.5">
        {notes.map((pc, i) => (
          <span
            key={i}
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              pc === rootPc
                ? "bg-primary text-primary-foreground"
                : "bg-primary/15 text-primary"
            }`}
          >
            {noteName(pc, useFlat)}
          </span>
        ))}
      </div>
      {transpose && (
        <div className="mt-2 space-y-0.5 border-t border-border/60 pt-2">
          {transpose.map((t) => (
            <div key={t.label} className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-medium uppercase tracking-wide">{t.label}:</span>
              <span className="flex flex-wrap gap-1">
                {notes.map((pc, i) => (
                  <span key={i} className="rounded bg-muted/40 px-1.5 py-0.5">
                    {noteName(pc + t.semitones, useFlat)}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Main ----------
type Instrument = "violao" | "piano" | "baixo" | "bateria" | "voz" | "violino" | "sax";

function ChordDiagram({ instrument, notes, rootPc, useFlat }: { instrument: Instrument; notes: number[]; rootPc: number; useFlat: boolean }) {
  switch (instrument) {
    case "violao":
      return (
        <Fretboard
          tuning={[pcOf("E"), pcOf("A"), pcOf("D"), pcOf("G"), pcOf("B"), pcOf("E")]}
          stringNames={["E", "A", "D", "G", "B", "e"]}
          notes={notes}
          rootPc={rootPc}
          useFlat={useFlat}
        />
      );
    case "baixo":
      return (
        <Fretboard
          tuning={[pcOf("E"), pcOf("A"), pcOf("D"), pcOf("G")]}
          stringNames={["E", "A", "D", "G"]}
          notes={notes}
          rootPc={rootPc}
          useFlat={useFlat}
          frets={5}
        />
      );
    case "violino":
      return (
        <Fretboard
          tuning={[pcOf("G"), pcOf("D"), pcOf("A"), pcOf("E")]}
          stringNames={["G", "D", "A", "E"]}
          notes={notes}
          rootPc={rootPc}
          useFlat={useFlat}
          frets={5}
        />
      );
    case "piano":
      return <Piano notes={notes} rootPc={rootPc} useFlat={useFlat} />;
    case "sax":
      return (
        <NoteCard
          notes={notes}
          rootPc={rootPc}
          useFlat={useFlat}
          transpose={[
            { label: "Alto (Mib) escrito", semitones: 9 },
            { label: "Tenor (Sib) escrito", semitones: 2 },
          ]}
        />
      );
    case "voz":
    case "bateria":
    default:
      return <NoteCard notes={notes} rootPc={rootPc} useFlat={useFlat} />;
  }
}

export function HarmonicField({ instrument }: { instrument: Instrument }) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState("C");
  const [mode, setMode] = useState<"triad" | "tetrad">("triad");

  const key = KEYS.find((k) => k.name === activeKey)!;
  const rootPc = pcOf(key.name);

  const chords = Array.from({ length: 7 }).map((_, deg) => {
    const notes = buildChord(rootPc, deg, mode);
    const chordRootPc = notes[0];
    const baseName = noteName(chordRootPc, key.useFlat);
    const suffix = mode === "triad" ? TRIAD_SUFFIX[deg] : TETRAD_SUFFIX[deg];
    return {
      degree: ROMAN[deg],
      name: `${baseName}${suffix}`,
      notes,
      rootPc: chordRootPc,
    };
  });

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-primary/30 bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-primary/5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/15 p-2">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Campo harmônico visual — todas as tonalidades
            </h3>
            <p className="text-xs text-muted-foreground">
              Clique para abrir os desenhos de cada tríade e tétrade nas 12 tonalidades.
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-primary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border p-5">
          {/* key tabs */}
          <div className="flex flex-wrap gap-1.5">
            {KEYS.map((k) => (
              <button
                key={k.name}
                onClick={() => setActiveKey(k.name)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeKey === k.name
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {k.name}
              </button>
            ))}
          </div>

          {/* triad / tetrad toggle */}
          <div className="mt-4 inline-flex rounded-lg border border-border bg-background p-1">
            {(["triad", "tetrad"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "triad" ? "Tríades" : "Tétrades"}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Campo harmônico de <span className="font-semibold text-foreground">{key.name} maior</span> —{" "}
            {mode === "triad" ? "tríades diatônicas" : "tétrades diatônicas"}. A nota destacada é a fundamental.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {chords.map((c) => (
              <div
                key={c.degree}
                className="rounded-xl border border-border bg-background/60 p-3"
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-display text-base font-semibold text-foreground">
                    {c.name}
                  </span>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {c.degree}
                  </span>
                </div>
                <ChordDiagram
                  instrument={instrument}
                  notes={c.notes}
                  rootPc={c.rootPc}
                  useFlat={key.useFlat}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
