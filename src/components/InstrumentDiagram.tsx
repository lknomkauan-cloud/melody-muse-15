const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENHARMONIC: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B" };
const pc = (n: string) => CHROMATIC.indexOf(ENHARMONIC[n] ?? n);

// Tokens do design system (Tailwind v4 / oklch) usados como cores CSS diretas em SVG
const C = {
  primary: "var(--primary)",
  primaryFg: "var(--primary-foreground)",
  bg: "var(--background)",
  fg: "var(--foreground)",
  muted: "var(--muted)",
  mutedFg: "var(--muted-foreground)",
  border: "var(--border)",
  primarySoft: "color-mix(in oklch, var(--primary) 25%, transparent)",
  primaryMid: "color-mix(in oklch, var(--primary) 65%, transparent)",
  fgSoft: "color-mix(in oklch, var(--foreground) 15%, transparent)",
};

export type InstrumentId = "violao" | "guitarra" | "baixo" | "piano" | "teclado" | "sax" | "violino" | "bateria";

type Props = {
  instrument: InstrumentId;
  root: string;
  pentSemis: number[];
};

export function InstrumentDiagram({ instrument, root, pentSemis }: Props) {
  const rootPc = pc(root);
  if (rootPc < 0) return null;
  const pentPcs = new Set(pentSemis.map((s) => (rootPc + s + 120) % 12));

  switch (instrument) {
    case "violao":
    case "guitarra":
      return <Fretboard tuning={[4, 11, 7, 2, 9, 4]} labels={["e", "B", "G", "D", "A", "E"]} frets={13} rootPc={rootPc} pentPcs={pentPcs} />;
    case "baixo":
      return <Fretboard tuning={[7, 2, 9, 4]} labels={["G", "D", "A", "E"]} frets={13} rootPc={rootPc} pentPcs={pentPcs} />;
    case "violino":
      return <Fretboard tuning={[4, 9, 2, 7]} labels={["E", "A", "D", "G"]} frets={8} rootPc={rootPc} pentPcs={pentPcs} fretless />;
    case "piano":
    case "teclado":
      return <Piano rootPc={rootPc} pentPcs={pentPcs} />;
    case "sax":
      return <Sax rootPc={rootPc} pentPcs={pentPcs} />;
    case "bateria":
      return <Drums />;
  }
}

/* ---------- Fretboard ---------- */

function Fretboard({
  tuning,
  labels,
  frets,
  rootPc,
  pentPcs,
  fretless = false,
}: {
  tuning: number[];
  labels: string[];
  frets: number;
  rootPc: number;
  pentPcs: Set<number>;
  fretless?: boolean;
}) {
  const w = 640;
  const nutX = 34;
  const rowH = 28;
  const fretW = (w - nutX - 12) / frets;
  const h = tuning.length * rowH + 28;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[520px]" role="img" aria-label="Diagrama do braço do instrumento">
        <rect x={nutX} y={10} width={w - nutX - 12} height={tuning.length * rowH} fill={C.muted} rx={4} />
        <rect x={nutX - 4} y={10} width={4} height={tuning.length * rowH} fill={C.fg} opacity={0.7} />
        {!fretless &&
          Array.from({ length: frets }).map((_, i) => (
            <line
              key={i}
              x1={nutX + (i + 1) * fretW}
              x2={nutX + (i + 1) * fretW}
              y1={10}
              y2={10 + tuning.length * rowH}
              stroke={C.border}
              strokeWidth={1}
            />
          ))}
        {[3, 5, 7, 9].map((f) =>
          f <= frets ? (
            <circle
              key={f}
              cx={nutX + f * fretW - fretW / 2}
              cy={10 + (tuning.length * rowH) / 2}
              r={4}
              fill={C.fgSoft}
            />
          ) : null,
        )}
        {12 <= frets && (
          <>
            <circle cx={nutX + 12 * fretW - fretW / 2} cy={10 + rowH * 0.7} r={4} fill={C.fgSoft} />
            <circle cx={nutX + 12 * fretW - fretW / 2} cy={10 + rowH * (tuning.length - 0.7)} r={4} fill={C.fgSoft} />
          </>
        )}
        {tuning.map((open, s) => {
          const y = 10 + s * rowH + rowH / 2;
          return (
            <g key={s}>
              <text x={4} y={y + 4} fontSize={11} fill={C.mutedFg}>
                {labels[s]}
              </text>
              <line
                x1={nutX}
                x2={w - 12}
                y1={y}
                y2={y}
                stroke={C.fg}
                strokeWidth={0.8 + (tuning.length - s) * 0.2}
                opacity={0.5}
              />
              {Array.from({ length: frets + 1 }).map((_, f) => {
                const note = (open + f) % 12;
                if (!pentPcs.has(note)) return null;
                const isRoot = note === rootPc;
                const cx = f === 0 ? nutX - 14 : nutX + f * fretW - fretW / 2;
                return (
                  <g key={f}>
                    <circle
                      cx={cx}
                      cy={y}
                      r={10}
                      fill={isRoot ? C.primary : C.bg}
                      stroke={C.primary}
                      strokeWidth={1.8}
                    />
                    <text
                      x={cx}
                      y={y + 3.5}
                      fontSize={9}
                      textAnchor="middle"
                      fill={isRoot ? C.primaryFg : C.primary}
                      fontWeight={700}
                    >
                      {CHROMATIC[note]}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {Array.from({ length: frets }).map((_, i) => (
          <text
            key={i}
            x={nutX + i * fretW + fretW / 2}
            y={h - 6}
            fontSize={9}
            textAnchor="middle"
            fill={C.mutedFg}
          >
            {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ---------- Piano ---------- */

function Piano({ rootPc, pentPcs }: { rootPc: number; pentPcs: Set<number> }) {
  const whiteOrder = [0, 2, 4, 5, 7, 9, 11];
  const blackAfter: Record<number, number> = { 0: 1, 2: 3, 5: 6, 7: 8, 9: 10 };
  const whiteW = 34;
  const whiteH = 130;
  const blackW = 22;
  const blackH = 82;
  const octaves = 2;
  const totalWhites = 7 * octaves + 1;
  const w = totalWhites * whiteW + 4;
  const h = whiteH + 20;

  const whites: { x: number; pc: number }[] = [];
  const blacks: { x: number; pc: number }[] = [];
  let x = 2;
  for (let o = 0; o < octaves; o++) {
    for (const pcW of whiteOrder) {
      whites.push({ x, pc: pcW });
      if (blackAfter[pcW] !== undefined) {
        blacks.push({ x: x + whiteW - blackW / 2, pc: blackAfter[pcW] });
      }
      x += whiteW;
    }
  }
  whites.push({ x, pc: 0 });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[520px]" role="img" aria-label="Teclado do piano">
        {whites.map((k, i) => {
          const on = pentPcs.has(k.pc);
          const isRoot = k.pc === rootPc;
          return (
            <g key={`w-${i}`}>
              <rect
                x={k.x}
                y={10}
                width={whiteW - 2}
                height={whiteH}
                rx={3}
                fill={on ? (isRoot ? C.primary : C.primarySoft) : "#ffffff"}
                stroke={C.border}
              />
              {on && (
                <text
                  x={k.x + (whiteW - 2) / 2}
                  y={10 + whiteH - 10}
                  fontSize={11}
                  textAnchor="middle"
                  fontWeight={700}
                  fill={isRoot ? C.primaryFg : C.primary}
                >
                  {CHROMATIC[k.pc]}
                </text>
              )}
            </g>
          );
        })}
        {blacks.map((k, i) => {
          const on = pentPcs.has(k.pc);
          const isRoot = k.pc === rootPc;
          return (
            <g key={`b-${i}`}>
              <rect
                x={k.x}
                y={10}
                width={blackW}
                height={blackH}
                rx={2}
                fill={on ? (isRoot ? C.primary : C.primaryMid) : "#111"}
                stroke={C.border}
              />
              {on && (
                <text
                  x={k.x + blackW / 2}
                  y={10 + blackH - 8}
                  fontSize={9}
                  textAnchor="middle"
                  fontWeight={700}
                  fill={C.primaryFg}
                >
                  {CHROMATIC[k.pc]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Sax ---------- */

function Sax({ rootPc, pentPcs }: { rootPc: number; pentPcs: Set<number> }) {
  const keys = [
    { label: "Si♭ grave", pc: pc("A#") },
    { label: "Si", pc: pc("B") },
    { label: "Dó", pc: pc("C") },
    { label: "Ré", pc: pc("D") },
    { label: "Mi", pc: pc("E") },
    { label: "Fá", pc: pc("F") },
    { label: "Sol", pc: pc("G") },
    { label: "Lá", pc: pc("A") },
    { label: "Si agudo", pc: pc("B") },
  ];
  const w = 260;
  const h = keys.length * 34 + 40;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[300px] mx-auto" role="img" aria-label="Chaves do saxofone">
      <path
        d={`M 60 15 Q 40 15 40 40 L 40 ${h - 60} Q 40 ${h - 20} 80 ${h - 20} L 180 ${h - 20} Q 220 ${h - 20} 220 ${h - 60} L 220 60 Q 220 40 200 40`}
        fill="none"
        stroke={C.fg}
        strokeWidth={2}
        opacity={0.4}
      />
      <rect x={130} y={5} width={20} height={16} rx={4} fill={C.muted} stroke={C.fg} opacity={0.5} />
      {keys.map((k, i) => {
        const y = 35 + i * 32;
        const on = pentPcs.has(k.pc);
        const isRoot = k.pc === rootPc;
        return (
          <g key={i}>
            <circle
              cx={130}
              cy={y}
              r={12}
              fill={on ? (isRoot ? C.primary : C.primarySoft) : C.muted}
              stroke={on ? C.primary : C.border}
              strokeWidth={1.5}
            />
            {on && (
              <text
                x={130}
                y={y + 4}
                fontSize={10}
                textAnchor="middle"
                fontWeight={700}
                fill={isRoot ? C.primaryFg : C.primary}
              >
                {CHROMATIC[k.pc]}
              </text>
            )}
            <text x={165} y={y + 4} fontSize={10} fill={C.mutedFg}>
              {k.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Bateria ---------- */

function Drums() {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
      A bateria é um instrumento de percussão sem altura definida — não se aplicam pentatônicas.
      Use este módulo para praticar rudimentos e grooves que acompanhem a pulsação da tônica escolhida.
    </div>
  );
}
