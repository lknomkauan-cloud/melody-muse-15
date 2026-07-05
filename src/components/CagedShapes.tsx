const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENHARMONIC: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B" };
const pc = (n: string) => CHROMATIC.indexOf(ENHARMONIC[n] ?? n);
const noteAt = (openPc: number, fret: number) => CHROMATIC[(openPc + fret + 120) % 12];

const C = {
  primary: "var(--primary)",
  primaryFg: "var(--primary-foreground)",
  bg: "var(--background)",
  fg: "var(--foreground)",
  muted: "var(--muted)",
  mutedFg: "var(--muted-foreground)",
  border: "var(--border)",
  primarySoft: "color-mix(in oklch, var(--primary) 25%, transparent)",
};

// Afinação padrão da guitarra/violão (grave → agudo, para desenhar de cima para baixo em graves)
// Ordem visual: e B G D A E (aguda em cima)
const TUNING = [4, 11, 7, 2, 9, 4]; // e, B, G, D, A, E (pitch classes)
const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];

/**
 * Boxes CAGED da pentatônica MENOR relativos à tônica na 6ª corda (E grave).
 * Cada box começa em um offset (número de casas) a partir da tônica na corda mais grave.
 * Duração em casas segue os padrões clássicos.
 */
type CagedBox = {
  shape: "E" | "D" | "C" | "A" | "G";
  label: string;
  offset: number; // deslocamento em casas a partir da tônica no 6º par
  span: number; // quantas casas cobre
  anchor: string; // descrição do acorde âncora
};

const MINOR_PENT_BOXES: CagedBox[] = [
  { shape: "E", label: "Box 1 · E-shape", offset: 0, span: 4, anchor: "Acorde Em / âncora na tônica da 6ª corda" },
  { shape: "D", label: "Box 2 · D-shape", offset: 3, span: 4, anchor: "Acorde Dm / âncora na tônica da 4ª corda" },
  { shape: "C", label: "Box 3 · C-shape", offset: 5, span: 4, anchor: "Acorde Cm / âncora na tônica da 5ª corda" },
  { shape: "A", label: "Box 4 · A-shape", offset: 7, span: 4, anchor: "Acorde Am / âncora na tônica da 5ª corda" },
  { shape: "G", label: "Box 5 · G-shape", offset: 10, span: 4, anchor: "Acorde Gm / conecta com o Box 1 uma oitava acima" },
];

const MAJOR_PENT_BOXES: CagedBox[] = [
  { shape: "C", label: "Box 1 · C-shape", offset: -3, span: 4, anchor: "Acorde C / âncora na tônica da 5ª corda" },
  { shape: "A", label: "Box 2 · A-shape", offset: -1, span: 4, anchor: "Acorde A / âncora na tônica da 5ª corda" },
  { shape: "G", label: "Box 3 · G-shape", offset: 2, span: 4, anchor: "Acorde G / âncora na tônica da 6ª corda" },
  { shape: "E", label: "Box 4 · E-shape", offset: 4, span: 4, anchor: "Acorde E / âncora na tônica da 6ª corda" },
  { shape: "D", label: "Box 5 · D-shape", offset: 7, span: 4, anchor: "Acorde D / âncora na tônica da 4ª corda" },
];

type Props = {
  root: string;
  pentSemis: number[];
  instrument: "guitarra" | "violao" | "baixo";
};

export function CagedShapes({ root, pentSemis, instrument }: Props) {
  const rootPc = pc(root);
  if (rootPc < 0) return null;

  // Detecta se a pentatônica é predominantemente maior (contém 3ª maior=4) ou menor (contém 3ª menor=3)
  const isMinor = pentSemis.includes(3);
  const boxes = isMinor ? MINOR_PENT_BOXES : MAJOR_PENT_BOXES;

  // Ancoragem: casa da tônica na 6ª corda (E, pitch class 4)
  const rootFretOnLowE = (rootPc - 4 + 24) % 12; // 0..11
  const pentPcs = new Set(pentSemis.map((s) => (rootPc + s + 120) % 12));

  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-display text-base font-bold">Método CAGED — {root} {isMinor ? "menor" : "maior"} pentatônica</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            5 posições conectadas pelo braço, cada uma ancorada em um formato de acorde: <span className="font-semibold">C · A · G · E · D</span>.
          </p>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
          Tônica na 6ª corda: casa {rootFretOnLowE}{rootFretOnLowE === 0 ? " (solta)" : ""}
        </span>
      </div>

      <div className="mb-4 rounded-lg bg-card/60 p-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Como usar o CAGED:</strong> cada acorde aberto (C, A, G, E, D) vira um "molde" que você desliza pelo braço. A pentatônica desenhada em volta de cada molde é uma <em>caixa</em>. Toque a mesma escala em qualquer posição — muda o desenho, não muda a nota. Conecte os boxes tocando notas comuns na fronteira entre eles.
      </div>

      {instrument === "baixo" && (
        <p className="mb-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-2 text-[11px] text-yellow-700 dark:text-yellow-400">
          CAGED é tradicionalmente de guitarra/violão. No baixo os padrões são análogos, mas use as 4 cordas mais graves como referência.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {boxes.map((box) => {
          const startFret = ((rootFretOnLowE + box.offset) + 24) % 24;
          return (
            <CagedBoxDiagram
              key={box.shape}
              box={box}
              startFret={startFret}
              rootPc={rootPc}
              pentPcs={pentPcs}
            />
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-card/60 p-3 text-xs leading-relaxed">
        <strong className="text-foreground">Dica de prática:</strong> comece pelo Box 1, memorize a posição da tônica (círculo cheio). Depois toque o mesmo licks em Box 2, 3, 4 e 5. Faça a "escala do horizonte" subindo pelo braço: 2 notas por corda em cada box, conectando um ao outro.
      </div>
    </div>
  );
}

function CagedBoxDiagram({
  box,
  startFret,
  rootPc,
  pentPcs,
}: {
  box: CagedBox;
  startFret: number;
  rootPc: number;
  pentPcs: Set<number>;
}) {
  const frets = box.span; // ex: 4 casas
  const w = 200;
  const nutX = 30;
  const rowH = 18;
  const fretW = (w - nutX - 10) / frets;
  const h = TUNING.length * rowH + 28;
  const showNut = startFret === 0;

  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-display text-sm font-bold text-primary">{box.label}</span>
        <span className="text-[10px] text-muted-foreground">casas {startFret + 1}–{startFret + frets}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={box.label}>
        {/* fundo do braço */}
        <rect x={nutX} y={8} width={w - nutX - 10} height={TUNING.length * rowH} fill={C.muted} rx={3} />
        {/* pestana ou indicador da casa inicial */}
        {showNut ? (
          <rect x={nutX - 4} y={8} width={4} height={TUNING.length * rowH} fill={C.fg} opacity={0.8} />
        ) : (
          <text x={nutX - 8} y={h / 2 + 4} fontSize={10} fill={C.mutedFg} textAnchor="end" fontWeight={700}>
            {startFret + 1}fr
          </text>
        )}
        {/* trastes */}
        {Array.from({ length: frets }).map((_, i) => (
          <line
            key={i}
            x1={nutX + (i + 1) * fretW}
            y1={8}
            x2={nutX + (i + 1) * fretW}
            y2={8 + TUNING.length * rowH}
            stroke={C.border}
            strokeWidth={1}
          />
        ))}
        {/* cordas */}
        {TUNING.map((_, s) => (
          <line
            key={s}
            x1={nutX}
            y1={8 + rowH * s + rowH / 2}
            x2={w - 10}
            y2={8 + rowH * s + rowH / 2}
            stroke={C.fg}
            strokeOpacity={0.4}
            strokeWidth={0.8}
          />
        ))}
        {/* marcadores de casa (bolinhas) */}
        {[3, 5, 7, 9].map((markerFret) => {
          const relFret = markerFret - startFret;
          if (relFret < 1 || relFret > frets) return null;
          return (
            <circle
              key={markerFret}
              cx={nutX + (relFret - 0.5) * fretW}
              cy={h - 12}
              r={2.5}
              fill={C.mutedFg}
              opacity={0.5}
            />
          );
        })}
        {/* notas */}
        {TUNING.map((openPc, sIdx) =>
          Array.from({ length: frets }).map((_, fIdx) => {
            const fret = startFret + fIdx + 1;
            const note = noteAt(openPc, fret);
            const notePc = pc(note);
            if (!pentPcs.has(notePc)) return null;
            const isRoot = notePc === rootPc;
            const cx = nutX + (fIdx + 0.5) * fretW;
            const cy = 8 + rowH * sIdx + rowH / 2;
            return (
              <g key={`${sIdx}-${fIdx}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill={isRoot ? C.primary : C.bg}
                  stroke={C.primary}
                  strokeWidth={isRoot ? 0 : 1.5}
                />
                <text
                  x={cx}
                  y={cy + 3}
                  fontSize={8}
                  fontWeight={700}
                  fill={isRoot ? C.primaryFg : C.primary}
                  textAnchor="middle"
                >
                  {note}
                </text>
              </g>
            );
          }),
        )}
        {/* labels das cordas à esquerda */}
        {STRING_LABELS.map((lbl, s) => (
          <text key={lbl + s} x={4} y={8 + rowH * s + rowH / 2 + 3} fontSize={9} fill={C.mutedFg} fontWeight={600}>
            {lbl}
          </text>
        ))}
      </svg>
      <p className="mt-2 text-[10px] leading-tight text-muted-foreground">{box.anchor}</p>
    </div>
  );
}
