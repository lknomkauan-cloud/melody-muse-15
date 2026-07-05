import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Music2, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { InstrumentDiagram } from "@/components/InstrumentDiagram";
import { EarCoach } from "@/components/EarCoach";

export const Route = createFileRoute("/escalas")({
  head: () => ({
    meta: [
      { title: "Escalas — Melodia" },
      { name: "description", content: "Consulta completa de escalas maiores, menores e modais com graus, notas e pentatônicas dos modos gregos para cada instrumento." },
      { property: "og:title", content: "Escalas — Melodia" },
      { property: "og:description", content: "Escalas, modos gregos e pentatônicas modais aplicadas a violão, guitarra, baixo, piano, sax e violino." },
    ],
  }),
  component: EscalasPage,
});

const TONALITIES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"] as const;

const SCALE_TYPES = [
  { name: "Maior", pattern: [2, 2, 1, 2, 2, 2, 1], hasModes: true },
  { name: "Menor Natural", pattern: [2, 1, 2, 2, 1, 2, 2], hasModes: false },
  { name: "Menor Harmônica", pattern: [2, 1, 2, 2, 1, 3, 1], hasModes: false },
  { name: "Menor Melódica", pattern: [2, 1, 2, 2, 2, 2, 1], hasModes: false },
  { name: "Pentatônica Maior", pattern: [2, 2, 3, 2, 3], hasModes: false },
  { name: "Pentatônica Menor", pattern: [3, 2, 2, 3, 2], hasModes: false },
];

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ENHARMONIC: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B" };

function normalize(n: string) {
  return ENHARMONIC[n] ?? n;
}

function transpose(root: string, semis: number) {
  const idx = CHROMATIC.indexOf(normalize(root));
  if (idx === -1) return root;
  return CHROMATIC[(idx + semis + 120) % 12];
}

function getScaleNotes(tonic: string, pattern: number[]) {
  const idx = CHROMATIC.indexOf(normalize(tonic));
  if (idx === -1) return [];
  const notes = [CHROMATIC[idx]];
  let pos = idx;
  for (const step of pattern.slice(0, -1)) {
    pos = (pos + step) % 12;
    notes.push(CHROMATIC[pos]);
  }
  return notes;
}

const DEGREE_NAMES = ["I", "II", "III", "IV", "V", "VI", "VII"];

// Modos gregos — offset em semitons da tônica da escala maior + pentatônica característica
type ModeInfo = {
  name: string;
  offset: number; // do tom maior pai
  pentSemis: number[]; // semitons a partir da tônica do modo
  pentDegrees: string[];
  vibe: string;
};

const GREEK_MODES: ModeInfo[] = [
  { name: "Jônio",      offset: 0,  pentSemis: [0,2,4,7,9],  pentDegrees: ["1","2","3","5","6"],   vibe: "Pentatônica Maior — alegre, resolutiva." },
  { name: "Dórico",     offset: 2,  pentSemis: [0,3,5,7,10], pentDegrees: ["1","b3","4","5","b7"], vibe: "Pentatônica Menor — menor com 6ª maior implícita, soa jazzístico." },
  { name: "Frígio",     offset: 4,  pentSemis: [0,1,3,5,10], pentDegrees: ["1","b2","b3","4","b7"],vibe: "Pentatônica Frígia (In-Sen) — sabor flamenco/oriental." },
  { name: "Lídio",      offset: 5,  pentSemis: [0,2,4,6,9],  pentDegrees: ["1","2","3","#4","6"],  vibe: "Pentatônica Lídia — brilhante, com trítono característico." },
  { name: "Mixolídio",  offset: 7,  pentSemis: [0,2,4,7,10], pentDegrees: ["1","2","3","5","b7"],  vibe: "Pentatônica Dominante — bluesy, ideal sobre acordes V7." },
  { name: "Eólio",      offset: 9,  pentSemis: [0,3,5,7,10], pentDegrees: ["1","b3","4","5","b7"], vibe: "Pentatônica Menor — base do rock e do blues." },
  { name: "Lócrio",     offset: 11, pentSemis: [0,3,5,6,10], pentDegrees: ["1","b3","4","b5","b7"],vibe: "Pentatônica Lócria — tensa, com quinta diminuta." },
];

const INSTRUMENTS = [
  { id: "violao", label: "Violão" },
  { id: "guitarra", label: "Guitarra" },
  { id: "baixo", label: "Baixo" },
  { id: "piano", label: "Piano" },
  { id: "sax", label: "Sax" },
  { id: "violino", label: "Violino" },
  { id: "bateria", label: "Bateria" },
] as const;
type InstrumentId = typeof INSTRUMENTS[number]["id"];

function instrumentTip(inst: InstrumentId, modeRoot: string, pentSemis: number[]): string {
  const intervals = pentSemis.map((s, i) => i === 0 ? "0" : `+${s}`).join(" · ");
  switch (inst) {
    case "violao":
    case "guitarra":
      return `Toque a tônica ${modeRoot} na 6ª corda (E grave) e use a fórmula em trastes ${intervals}. Ex.: dedo 1 = ${modeRoot}, sobe ${pentSemis[1]} trastes para a 2ª nota, e assim por diante. Transponha o mesmo desenho para a 5ª corda (A) somando 5 trastes.`;
    case "baixo":
      return `Posicione a tônica ${modeRoot} na 4ª corda (E) e replique o intervalo em trastes: ${intervals}. Use o desenho ‘box’ atravessando as cordas E-A-D-G para alcançar 2 oitavas sem deslocar a mão.`;
    case "piano": {
      const teclas = pentSemis.map((s) => transpose(modeRoot, s)).join(" – ");
      return `Teclas: ${teclas}. Dedilhado sugerido na mão direita: 1-2-3-1-2 subindo, 2-1-3-2-1 descendo. Comece com o polegar em ${modeRoot}.`;
    }
    case "sax": {
      const notas = pentSemis.map((s) => transpose(modeRoot, s)).join(" – ");
      return `Notas (concert): ${notas}. Lembre de transpor: sax alto soa uma 6ª maior abaixo (toque +9 semitons), sax tenor uma 9ª maior abaixo (toque +14). Use a chave de oitava nas notas agudas.`;
    }
    case "violino": {
      const notas = pentSemis.map((s) => transpose(modeRoot, s)).join(" – ");
      return `Notas: ${notas}. Em 1ª posição, escolha a corda cuja tônica fique acessível (G, D, A ou E). Use cordas soltas quando coincidirem com as notas da pentatônica e mantenha o arco firme entre cordas.`;
    }
    case "bateria":
      return `A bateria não produz alturas definidas. Use a tônica ${modeRoot} como referência de pulso: marque o tempo 1 no bumbo e crie levadas que ressaltem os graus ${intervals} através de acentos no prato de condução ou tom-tons.`;
  }
}

function EscalasPage() {
  const [selectedTonic, setSelectedTonic] = useState<string>("C");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<InstrumentId>("violao");

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            Referência
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Escalas Musicais</h1>
          <p className="mt-2 text-muted-foreground">Escolha a tônica, abra a escala e clique nos modos gregos para ver a pentatônica modal aplicada ao seu instrumento.</p>
        </div>

        {/* Seletor de tônica */}
        <div className="mb-4 rounded-2xl border border-border bg-card p-4">
          <label className="mb-3 block text-sm font-medium text-muted-foreground">Tônica</label>
          <div className="flex flex-wrap gap-2">
            {TONALITIES.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTonic(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
                  selectedTonic === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de instrumento */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-4">
          <label className="mb-3 block text-sm font-medium text-muted-foreground">Instrumento</label>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map((i) => (
              <button
                key={i.id}
                onClick={() => setInstrument(i.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
                  instrument === i.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

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
                    <span className="ml-2 text-xs text-muted-foreground">({scale.pattern.join("-")})</span>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 pb-5 pt-3">
                    <div className="flex flex-wrap gap-2">
                      {notes.map((note, i) => (
                        <div key={`${note}-${i}`} className="flex flex-col items-center rounded-xl bg-muted px-4 py-3 min-w-[60px]">
                          <span className="text-xs text-muted-foreground">{DEGREE_NAMES[i]}</span>
                          <span className="font-display text-lg font-bold text-primary">{note}</span>
                        </div>
                      ))}
                    </div>

                    {scale.hasModes && (
                      <div className="mt-5">
                        <div className="mb-2 flex items-center gap-2">
                          <Music2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Modos gregos — clique para ver a pentatônica em {INSTRUMENTS.find(i => i.id === instrument)?.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {GREEK_MODES.map((m) => {
                            const modeRoot = transpose(selectedTonic, m.offset);
                            const key = `${scale.name}-${m.name}`;
                            const active = activeMode === key;
                            return (
                              <button
                                key={m.name}
                                onClick={() => setActiveMode(active ? null : key)}
                                className={cn(
                                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                                  active
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "bg-secondary/50 text-secondary-foreground hover:bg-secondary",
                                )}
                              >
                                {m.name} <span className="opacity-70">({modeRoot})</span>
                              </button>
                            );
                          })}
                        </div>

                        {GREEK_MODES.map((m) => {
                          const key = `${scale.name}-${m.name}`;
                          if (activeMode !== key) return null;
                          const modeRoot = transpose(selectedTonic, m.offset);
                          const pentNotes = m.pentSemis.map((s) => transpose(modeRoot, s));
                          return (
                            <div key={m.name} className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                                <span className="font-display text-lg font-bold">{modeRoot} {m.name}</span>
                                <span className="text-xs text-muted-foreground">Pentatônica modal</span>
                              </div>
                              <p className="mb-3 text-sm text-muted-foreground">{m.vibe}</p>
                              <div className="mb-4 flex flex-wrap gap-2">
                                {pentNotes.map((n, i) => (
                                  <div key={i} className="flex flex-col items-center rounded-lg bg-background px-3 py-2 min-w-[56px] border border-border">
                                    <span className="text-[10px] text-muted-foreground">{m.pentDegrees[i]}</span>
                                    <span className="font-display text-base font-bold text-primary">{n}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mb-4 rounded-lg bg-card/60 p-3">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Desenho no {INSTRUMENTS.find(i => i.id === instrument)?.label}
                                </span>
                                <InstrumentDiagram instrument={instrument} root={modeRoot} pentSemis={m.pentSemis} />
                                <ModeVideoLinks modeName={m.name} modeRoot={modeRoot} instrumentLabel={INSTRUMENTS.find(i => i.id === instrument)?.label ?? ""} />
                                <EarCoach
                                  tonic={modeRoot}
                                  modeName={m.name}
                                  pentatonicNotes={pentNotes}
                                  instrumentLabel={INSTRUMENTS.find(i => i.id === instrument)?.label ?? ""}
                                />
                              </div>
                              <div className="rounded-lg bg-card/60 p-3 text-sm leading-relaxed">
                                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                  Como tocar no {INSTRUMENTS.find(i => i.id === instrument)?.label}
                                </span>
                                {instrumentTip(instrument, modeRoot, m.pentSemis)}
                              </div>
                            </div>
                          );
                        })}
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

function ModeVideoLinks({ modeName, modeRoot, instrumentLabel }: { modeName: string; modeRoot: string; instrumentLabel: string }) {
  const queries = [
    { label: `Modo ${modeName} no ${instrumentLabel}`, q: `modo ${modeName} ${instrumentLabel} tutorial` },
    { label: `Pentatônica ${modeName} — ${modeRoot}`, q: `pentatônica ${modeName} ${modeRoot} ${instrumentLabel} como tocar` },
    { label: `Aplicação prática no ${instrumentLabel}`, q: `improvisação modo ${modeName} ${instrumentLabel} aula` },
  ];
  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Youtube className="h-3.5 w-3.5 text-primary" />
        Videoaulas — abra no YouTube
      </div>
      <div className="flex flex-wrap gap-2">
        {queries.map((v) => (
          <a
            key={v.q}
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.q)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            <Youtube className="h-3.5 w-3.5" />
            {v.label}
          </a>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        As buscas já estão prontas com o modo, tônica e instrumento — clique para ver aulas em vídeo demonstrando a pentatônica em ação.
      </p>
    </div>
  );
}
