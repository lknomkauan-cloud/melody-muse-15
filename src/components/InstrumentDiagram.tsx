import { cn } from "@/lib/utils";

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENHARMONIC: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B" };
const pc = (n: string) => CHROMATIC.indexOf(ENHARMONIC[n] ?? n);

export type InstrumentId = "violao" | "guitarra" | "baixo" | "piano" | "sax" | "violino" | "bateria";

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
      return <Piano rootPc={rootPc} pentPcs={pentPcs} />;
    case "sax":
      return <Sax rootPc={rootPc} pentPcs={pentPcs} />;
    case "bateria":
      return <Drums />;
  }
}

/* ---------- Fretboard (guitarra, violão, baixo, violino) ---------- */

function Fretboard({
  tuning,
  labels,
  frets,
  rootPc,
  pentPcs,
  fretless = false,
}: {
  tuning: number[]; // semitons de C para a nota solta (do agudo para o grave)
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
  const h = tuning.length * rowH + 22;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[520px]" role="img">
        {/* fretboard */}
        <rect x={nutX} y={10} width={w - nutX - 12} height={tuning.length * rowH} fill="hsl(var(--muted))" rx={4} />
        {/* nut */}
        <rect x={nutX - 4} y={10} width={4} height={tuning.length * rowH} fill="hsl(var(--foreground))" opacity={0.7} />
        {/* frets */}
        {!fretless &&
          Array.from({ length: frets }).map((_, i) => (
            <line
              key={i}
              x1={nutX + (i + 1) * fretW}
              x2={nutX + (i + 1) * fretW}
              y1={10}
              y2={10 + tuning.length * rowH}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
          ))}
        {/* inlays */}
        {[3, 5, 7, 9].map((f) =>
          f <= frets ? (
            <circle
              key={f}
              cx={nutX + f * fretW - fretW / 2}
              cy={10 + (tuning.length * rowH) / 2}
              r={4}
              fill="hsl(var(--foreground))"
              opacity={0.15}
            />
          ) : null,
        )}
        {12 <= frets && (
          <>
            <circle cx={nutX + 12 * fretW - fretW / 2} cy={10 + rowH * 0.7} r={4} fill="hsl(var(--foreground))" opacity={0.15} />
            <circle cx={nutX + 12 * fretW - fretW / 2} cy={10 + rowH * (tuning.length - 0.7)} r={4} fill="hsl(var(--foreground))" opacity={0.15} />
          </>
        )}
        {/* strings + notes */}
        {tuning.map((open, s) => {
          const y = 10 + s * rowH + rowH / 2;
          return (
            <g key={s}>
              <text x={4} y={y + 4} fontSize={11} fill="hsl(var(--muted-foreground))">
                {labels[s]}
              </text>
              <line x1={nutX} x2={w - 12} y1={y} y2={y} stroke="hsl(var(--foreground))" strokeWidth={0.8 + (tuning.length - s) * 0.2} opacity={0.5} />
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
                      fill={isRoot ? "hsl(var(--primary))" : "hsl(var(--background))"}
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.8}
                    />
                    <text
                      x={cx}
                      y={y + 3.5}
                      fontSize={9}
                      textAnchor="middle"
                      fill={isRoot ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))"}
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
        {/* fret numbers */}
        {Array.from({ length: frets }).map((_, i) => (
          <text
            key={i}
            x={nutX + i * fretW + fretW / 2}
            y={h - 4}
            fontSize={9}
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
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
  // 2 oitavas começando em C
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
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[520px]" role="img">
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
                fill={on ? (isRoot ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.25)") : "hsl(var(--background))"}
                stroke="hsl(var(--border))"
              />
              {on && (
                <text
                  x={k.x + (whiteW - 2) / 2}
                  y={10 + whiteH - 10}
                  fontSize={11}
                  textAnchor="middle"
                  fontWeight={700}
                  fill={isRoot ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))"}
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
                fill={on ? (isRoot ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.7)") : "hsl(var(--foreground))"}
                stroke="hsl(var(--border))"
              />
              {on && (
                <text
                  x={k.x + blackW / 2}
                  y={10 + blackH - 8}
                  fontSize={9}
                  textAnchor="middle"
                  fontWeight={700}
                  fill="hsl(var(--primary-foreground))"
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

/* ---------- Sax (esquemático das chaves) ---------- */

function Sax({ rootPc, pentPcs }: { rootPc: number; pentPcs: Set<number> }) {
  // Chaves principais do sax e a nota que produzem (concert pitch aproximado para referência visual)
  // Ordem descendente (grave -> agudo)
  const keys = [
    { label: "Si♭ grave", pc: pc("A#") },
    { label: "Si",        pc: pc("B") },
    { label: "Dó",        pc: pc("C") },
    { label: "Ré",        pc: pc("D") },
    { label: "Mi",        pc: pc("E") },
    { label: "Fá",        pc: pc("F") },
    { label: "Sol",       pc: pc("G") },
    { label: "Lá",        pc: pc("A") },
    { label: "Si agudo",  pc: pc("B") },
  ];
  const w = 260;
  const h = keys.length * 34 + 40;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[300px] mx-auto" role="img">
      {/* corpo do sax */}
      <path
        d={`M 60 15 Q 40 15 40 40 L 40 ${h - 60} Q 40 ${h - 20} 80 ${h - 20} L 180 ${h - 20} Q 220 ${h - 20} 220 ${h - 60} L 220 60 Q 220 40 200 40`}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth={2}
        opacity={0.4}
      />
      {/* bocal */}
      <rect x={130} y={5} width={20} height={16} rx={4} fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" opacity={0.5} />
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
              fill={on ? (isRoot ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)") : "hsl(var(--muted))"}
              stroke={on ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={1.5}
            />
            {on && (
              <text
                x={130}
                y={y + 4}
                fontSize={10}
                textAnchor="middle"
                fontWeight={700}
                fill={isRoot ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))"}
              >
                {CHROMATIC[k.pc]}
              </text>
            )}
            <text x={165} y={y + 4} fontSize={10} fill="hsl(var(--muted-foreground))">
              {k.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Bateria (informativa) ---------- */

function Drums() {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
      A bateria é um instrumento de percussão sem altura definida — não se aplicam pentatônicas.
      Use este módulo para praticar rudimentos e grooves que acompanhem a pulsação da tônica escolhida.
    </div>
  );
}

/* util para clsx externo */
export { cn };
