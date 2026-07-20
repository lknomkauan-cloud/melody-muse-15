import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Music2, Youtube, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { InstrumentDiagram } from "@/components/InstrumentDiagram";
import { EarCoach } from "@/components/EarCoach";
import { InstrumentCoach } from "@/components/InstrumentCoach";
import { DrumStudio } from "@/components/DrumStudio";
import { CagedShapes } from "@/components/CagedShapes";
import { ImprovisationMethodology } from "@/components/ImprovisationMethodology";
import { ScalePlayer } from "@/components/ScalePlayer";

export const Route = createFileRoute("/escalas")({
  head: () => ({
    meta: [
      { title: "Escalas — Solando" },
      { name: "description", content: "Consulta completa de escalas maiores, menores e modais com graus, notas e pentatônicas dos modos gregos para cada instrumento." },
      { property: "og:title", content: "Escalas — Solando" },
      { property: "og:description", content: "Escalas, modos gregos e pentatônicas modais aplicadas a violão, guitarra, baixo, piano, sax e violino." },
    ],
  }),
  component: EscalasPage,
});

const TONALITIES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"] as const;

type ScaleType = {
  name: string;
  pattern: number[];
  hasModes: boolean;
  origin?: string;
  vibe?: string;
};

const SCALE_TYPES: ScaleType[] = [
  { name: "Maior", pattern: [2, 2, 1, 2, 2, 2, 1], hasModes: true },
  { name: "Menor Natural", pattern: [2, 1, 2, 2, 1, 2, 2], hasModes: false },
  { name: "Menor Harmônica", pattern: [2, 1, 2, 2, 1, 3, 1], hasModes: false },
  { name: "Menor Melódica", pattern: [2, 1, 2, 2, 2, 2, 1], hasModes: false },
  { name: "Pentatônica Maior", pattern: [2, 2, 3, 2, 3], hasModes: false },
  { name: "Pentatônica Menor", pattern: [3, 2, 2, 3, 2], hasModes: false },
  { name: "Blues", pattern: [3, 2, 1, 1, 3, 2], hasModes: false, origin: "EUA / África", vibe: "Pentatônica menor + blue note (b5). Base do blues, rock e jazz." },
  // Árabe / Oriente Médio
  { name: "Árabe (Byzantina / Duplo Harmônica)", pattern: [1, 3, 1, 2, 1, 3, 1], hasModes: false, origin: "Árabe / Bizantino", vibe: "Duas 2ªs aumentadas — sonoridade do Oriente Médio e do flamenco." },
  { name: "Frígia Dominante (Espanhola)", pattern: [1, 3, 1, 2, 1, 2, 2], hasModes: false, origin: "Espanha / Árabe", vibe: "5º modo da menor harmônica. Flamenco, klezmer, metal neoclássico." },
  { name: "Cigana Húngara (Hungarian Minor)", pattern: [2, 1, 3, 1, 1, 3, 1], hasModes: false, origin: "Hungria / Roma", vibe: "Menor com 4ª aumentada e 7ª maior. Csárdás, música cigana do leste europeu." },
  { name: "Persa", pattern: [1, 3, 1, 1, 2, 3, 1], hasModes: false, origin: "Pérsia / Irã", vibe: "Escala misteriosa e melancólica usada em maqam persa." },
  { name: "Egípcia (Suspensa)", pattern: [2, 3, 2, 3, 2], hasModes: false, origin: "Egito", vibe: "Pentatônica suspensa — 2º modo da pentatônica maior, som ancestral." },
  // Ásia
  { name: "Chinesa Maior", pattern: [4, 2, 1, 4, 1], hasModes: false, origin: "China", vibe: "Pentatônica com trítono — som tradicional do teatro chinês." },
  { name: "Mongol / Chinesa Pentatônica", pattern: [2, 2, 3, 2, 3], hasModes: false, origin: "Ásia Oriental", vibe: "Pentatônica maior — base da música chinesa, mongol e coreana." },
  { name: "Japonesa Hirajoshi", pattern: [2, 1, 4, 1, 4], hasModes: false, origin: "Japão", vibe: "Pentatônica do koto e shamisen — som contemplativo japonês." },
  { name: "Japonesa In Sen", pattern: [1, 4, 2, 3, 2], hasModes: false, origin: "Japão", vibe: "Pentatônica sombria usada em música tradicional e trilhas de anime." },
  { name: "Ryukyu (Okinawa)", pattern: [4, 1, 2, 4, 1], hasModes: false, origin: "Okinawa", vibe: "Pentatônica maior com 4ª e 7ª — som característico de Okinawa." },
  { name: "Balinês (Pelog)", pattern: [1, 2, 4, 1, 4], hasModes: false, origin: "Bali / Indonésia", vibe: "Aproximação do sistema pelog do gamelão balinês." },
  { name: "Indiana (Raga Todi)", pattern: [1, 2, 3, 1, 1, 3, 1], hasModes: false, origin: "Índia", vibe: "Raga do período da manhã — melancólico e introspectivo." },
  // Outras
  { name: "Enigmática", pattern: [1, 3, 2, 2, 2, 1, 1], hasModes: false, origin: "Itália (Verdi)", vibe: "Escala experimental criada por Verdi — combina notas árabes e ocidentais." },
  { name: "Tons Inteiros", pattern: [2, 2, 2, 2, 2, 2], hasModes: false, origin: "França (Debussy)", vibe: "Sem semitons — som flutuante impressionista." },
  { name: "Diminuta (Semitom-Tom)", pattern: [1, 2, 1, 2, 1, 2, 1, 2], hasModes: false, origin: "Jazz", vibe: "Octatônica simétrica — usada em improvisação sobre dominantes." },
];

// 3 músicas de exemplo por tipo de escala (para treinar ouvido/aplicação real)
const SCALE_SONGS: Record<string, { title: string; artist: string }[]> = {
  "Maior": [
    { title: "Let It Be", artist: "The Beatles" },
    { title: "Someone Like You", artist: "Adele" },
    { title: "Wonderful Tonight", artist: "Eric Clapton" },
  ],
  "Menor Natural": [
    { title: "Losing My Religion", artist: "R.E.M." },
    { title: "Stairway to Heaven (intro)", artist: "Led Zeppelin" },
    { title: "Smells Like Teen Spirit", artist: "Nirvana" },
  ],
  "Menor Harmônica": [
    { title: "Sultans of Swing (solo)", artist: "Dire Straits" },
    { title: "Hava Nagila", artist: "Tradicional" },
    { title: "Remember Tomorrow", artist: "Iron Maiden" },
  ],
  "Menor Melódica": [
    { title: "Yesterday (ponte)", artist: "The Beatles" },
    { title: "'Round Midnight", artist: "Thelonious Monk" },
    { title: "Blue in Green", artist: "Miles Davis" },
  ],
  "Pentatônica Maior": [
    { title: "My Girl", artist: "The Temptations" },
    { title: "Amazing Grace", artist: "Tradicional" },
    { title: "Sweet Home Alabama (solo)", artist: "Lynyrd Skynyrd" },
  ],
  "Pentatônica Menor": [
    { title: "Back in Black (solo)", artist: "AC/DC" },
    { title: "Sunshine of Your Love", artist: "Cream" },
    { title: "Black Magic Woman", artist: "Santana" },
  ],
  "Blues": [
    { title: "The Thrill Is Gone", artist: "B.B. King" },
    { title: "Pride and Joy", artist: "Stevie Ray Vaughan" },
    { title: "Crossroads", artist: "Robert Johnson / Cream" },
  ],
  "Árabe (Byzantina / Duplo Harmônica)": [
    { title: "Misirlou", artist: "Dick Dale" },
    { title: "Hava Nagila", artist: "Tradicional" },
    { title: "Sandstorm (motivo)", artist: "Darude" },
  ],
  "Frígia Dominante (Espanhola)": [
    { title: "Entre Dos Aguas", artist: "Paco de Lucía" },
    { title: "Malagueña", artist: "Ernesto Lecuona" },
    { title: "Killing in the Name (riff)", artist: "Rage Against the Machine" },
  ],
  "Cigana Húngara (Hungarian Minor)": [
    { title: "Csárdás", artist: "Vittorio Monti" },
    { title: "Hungarian Dance Nº 5", artist: "Johannes Brahms" },
    { title: "Gypsy", artist: "Dick Dale" },
  ],
  "Persa": [
    { title: "Kashmir", artist: "Led Zeppelin" },
    { title: "Caravan", artist: "Duke Ellington" },
    { title: "Prince Ali (Aladdin)", artist: "Alan Menken" },
  ],
  "Egípcia (Suspensa)": [
    { title: "Walk Like an Egyptian", artist: "The Bangles" },
    { title: "Tutankhamun", artist: "Nile" },
    { title: "Desert Rose", artist: "Sting" },
  ],
  "Chinesa Maior": [
    { title: "Mo Li Hua (Jasmine Flower)", artist: "Tradicional" },
    { title: "Turandot — Nessun Dorma (motivo)", artist: "Puccini" },
    { title: "Kung Fu Panda (tema)", artist: "Hans Zimmer" },
  ],
  "Mongol / Chinesa Pentatônica": [
    { title: "Mo Li Hua", artist: "Tradicional Chinesa" },
    { title: "Auld Lang Syne", artist: "Tradicional" },
    { title: "Mulan — Reflection", artist: "Matthew Wilder" },
  ],
  "Japonesa Hirajoshi": [
    { title: "Sakura Sakura", artist: "Tradicional Japonesa" },
    { title: "Tenkū no Shiro Laputa (tema)", artist: "Joe Hisaishi" },
    { title: "Rocky Mountain Way (intro)", artist: "Joe Walsh" },
  ],
  "Japonesa In Sen": [
    { title: "Kimigayo", artist: "Hino Nacional Japonês" },
    { title: "Naruto Main Theme", artist: "Toshio Masuda" },
    { title: "Tokyo Drift (motivo)", artist: "Teriyaki Boyz" },
  ],
  "Ryukyu (Okinawa)": [
    { title: "Asadoya Yunta", artist: "Tradicional de Okinawa" },
    { title: "Shima Uta", artist: "The Boom" },
    { title: "Tinsagu nu Hana", artist: "Tradicional" },
  ],
  "Balinês (Pelog)": [
    { title: "Baris (gamelão)", artist: "Tradicional Balinês" },
    { title: "Kecak", artist: "Tradicional Balinês" },
    { title: "Tabuh Telu", artist: "Gamelão Gong Kebyar" },
  ],
  "Indiana (Raga Todi)": [
    { title: "Raga Todi", artist: "Ravi Shankar" },
    { title: "Within You Without You", artist: "The Beatles" },
    { title: "Slumdog Millionaire — Jai Ho", artist: "A.R. Rahman" },
  ],
  "Enigmática": [
    { title: "Ave Maria (versão Verdi)", artist: "Giuseppe Verdi" },
    { title: "Enigma Variations", artist: "Edward Elgar" },
    { title: "Not to Touch the Earth", artist: "The Doors" },
  ],
  "Tons Inteiros": [
    { title: "Voiles (Prélude)", artist: "Claude Debussy" },
    { title: "Juju", artist: "Wayne Shorter" },
    { title: "You Are the Sunshine of My Life (intro)", artist: "Stevie Wonder" },
  ],
  "Diminuta (Semitom-Tom)": [
    { title: "Giant Steps (frases)", artist: "John Coltrane" },
    { title: "Blue Monk (solos)", artist: "Thelonious Monk" },
    { title: "Symphony Nº 4 (motivo)", artist: "Stravinsky" },
  ],
};

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

const DEGREE_NAMES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

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
  { id: "banjo", label: "Banjo" },
  { id: "piano", label: "Piano" },
  { id: "teclado", label: "Teclado" },
  { id: "sax", label: "Sax" },
  { id: "violino", label: "Violino" },
  { id: "flauta", label: "Flauta Doce" },
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
    case "piano":
    case "teclado": {
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
    case "banjo": {
      const notas = pentSemis.map((s) => transpose(modeRoot, s)).join(" – ");
      return `Afinação padrão open G (g D B G D). Localize ${modeRoot} na 4ª corda (D) ou 3ª (G) e use trastes ${intervals}. Use rolls (Scruggs: T-I-M-T-M-T-I-M) para embalar as notas ${notas}; a 5ª corda (g drone) funciona como pedal quando o modo estiver em G ou tônicas próximas.`;
    }
    case "flauta": {
      const notas = pentSemis.map((s) => transpose(modeRoot, s)).join(" – ");
      return `Flauta doce soprano (dedilhado barroco). Notas: ${notas}. Cubra o polegar (T) e os furos frontais conforme o diagrama. Use ar leve nas notas graves (dó/ré) e vent o polegar (◐) para subir de oitava. Ataque com "tu" nas separações e "du" nas ligaduras.`;
    }
  }
}

function EscalasPage() {
  const [selectedTonic, setSelectedTonic] = useState<string>("C");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<InstrumentId>("violao");
  const [tab, setTab] = useState<"escalas" | "improvisar">("escalas");

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            Referência
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Escalas Musicais</h1>
          <p className="mt-2 text-muted-foreground">Escolha a tônica, abra a escala e clique nos modos gregos para ver a pentatônica modal aplicada ao seu instrumento.</p>
        </div>

        {/* Tabs principais */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
          <button
            onClick={() => setTab("escalas")}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all -mb-px",
              tab === "escalas" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <BookOpen className="h-4 w-4" /> Escalas &amp; Modos
          </button>
          <button
            onClick={() => setTab("improvisar")}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all -mb-px",
              tab === "improvisar" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Zap className="h-4 w-4" /> Como Improvisar
          </button>
        </div>

        {tab === "improvisar" ? (
          <ImprovisationMethodology />
        ) : (
          <EscalasContent
            selectedTonic={selectedTonic}
            setSelectedTonic={setSelectedTonic}
            instrument={instrument}
            setInstrument={setInstrument}
            expanded={expanded}
            setExpanded={setExpanded}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
          />
        )}
      </div>
    </div>
  );
}

type EscalasContentProps = {
  selectedTonic: string;
  setSelectedTonic: (v: string) => void;
  instrument: InstrumentId;
  setInstrument: (v: InstrumentId) => void;
  expanded: Set<number>;
  setExpanded: (v: Set<number>) => void;
  activeMode: string | null;
  setActiveMode: (v: string | null) => void;
};

function EscalasContent({
  selectedTonic, setSelectedTonic, instrument, setInstrument,
  expanded, setExpanded, activeMode, setActiveMode,
}: EscalasContentProps) {
  return (
    <>
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

        <InstrumentCoach
          instrumentId={instrument}
          instrumentLabel={INSTRUMENTS.find(i => i.id === instrument)?.label ?? instrument}
        />

        {instrument === "bateria" ? (
          <DrumStudio />
        ) : (
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
                    {scale.origin && <span className="ml-2 text-[10px] uppercase tracking-wide text-primary/80">{scale.origin}</span>}
                    {scale.vibe && <p className="mt-1 text-xs text-muted-foreground">{scale.vibe}</p>}
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 pb-5 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {notes.map((note, i) => (
                        <div key={`${note}-${i}`} className="flex flex-col items-center rounded-xl bg-muted px-4 py-3 min-w-[60px]">
                          <span className="text-xs text-muted-foreground">{DEGREE_NAMES[i]}</span>
                          <span className="font-display text-lg font-bold text-primary">{note}</span>
                        </div>
                      ))}
                      <ScalePlayer notes={notes} instrument={instrument} className="ml-2" />
                    </div>

                    {/* Pentatônicas: mostra CAGED direto (sem precisar abrir modos gregos) */}
                    {(scale.name === "Pentatônica Maior" || scale.name === "Pentatônica Menor") &&
                      (instrument === "guitarra" || instrument === "violao" || instrument === "baixo") && (
                        <div className="mt-4 rounded-lg bg-card/60 p-3">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Desenho no {INSTRUMENTS.find(i => i.id === instrument)?.label}
                          </span>
                          <InstrumentDiagram instrument={instrument} root={selectedTonic} pentSemis={scale.pattern.reduce<number[]>((acc, step) => { acc.push((acc[acc.length - 1] ?? 0) + step); return acc; }, [0]).slice(0, -1)} />
                          <CagedShapes
                            root={selectedTonic}
                            pentSemis={scale.pattern.reduce<number[]>((acc, step) => { acc.push((acc[acc.length - 1] ?? 0) + step); return acc; }, [0]).slice(0, -1)}
                            instrument={instrument as "guitarra" | "violao" | "baixo"}
                          />
                        </div>
                    )}


                    {scale.hasModes && instrument !== "sax" && (
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
                              <div className="mb-4 flex flex-wrap items-center gap-2">
                                {pentNotes.map((n, i) => (
                                  <div key={i} className="flex flex-col items-center rounded-lg bg-background px-3 py-2 min-w-[56px] border border-border">
                                    <span className="text-[10px] text-muted-foreground">{m.pentDegrees[i]}</span>
                                    <span className="font-display text-base font-bold text-primary">{n}</span>
                                  </div>
                                ))}
                                <ScalePlayer notes={pentNotes} instrument={instrument} className="ml-1" />
                              </div>
                              <div className="mb-4 rounded-lg bg-card/60 p-3">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Desenho no {INSTRUMENTS.find(i => i.id === instrument)?.label}
                                </span>
                                <InstrumentDiagram instrument={instrument} root={modeRoot} pentSemis={m.pentSemis} />
                                {(instrument === "guitarra" || instrument === "violao" || instrument === "baixo") && (
                                  <CagedShapes
                                    root={modeRoot}
                                    pentSemis={m.pentSemis}
                                    instrument={instrument as "guitarra" | "violao" | "baixo"}
                                  />
                                )}
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
        )}
    </>

  );
}


type VideoLink = { id: string; title: string; channel: string };

// Biblioteca curada de vídeos reais (IDs verificados no YouTube)
const GENERAL_MODES_VIDEOS: VideoLink[] = [
  { id: "M3I63u_eUYY", title: "Modos Gregos usando o Campo Harmônico (sem 49 shapes)", channel: "Antonio Colangelo" },
  { id: "LYc7hi2BURc", title: "Modos Gregos — Lídio (curso Cifra Club)", channel: "Cifra Club" },
  { id: "bXDczAgJEjE", title: "Modos Gregos — Modo Frígio (piano)", channel: "Aprenda Piano Online" },
];

const MODE_VIDEOS: Record<string, VideoLink[]> = {
  Jônio: [
    { id: "M3I63u_eUYY", title: "Modos Gregos pelo Campo Harmônico", channel: "Antonio Colangelo" },
    { id: "FEsu-0EAiGg", title: "Domine a Pentatônica", channel: "Vil Margos Bert" },
  ],
  Dórico: [
    { id: "M3I63u_eUYY", title: "Modos Gregos — inclui Dórico", channel: "Antonio Colangelo" },
    { id: "FEsu-0EAiGg", title: "Pentatônica aplicada (base dórica)", channel: "Vil Margos Bert" },
  ],
  Frígio: [
    { id: "bXDczAgJEjE", title: "Modo Frígio — visualização no piano", channel: "Aprenda Piano Online" },
    { id: "M3I63u_eUYY", title: "Modos Gregos — inclui Frígio", channel: "Antonio Colangelo" },
  ],
  Lídio: [
    { id: "LYc7hi2BURc", title: "Modo Lídio — aula completa", channel: "Cifra Club" },
    { id: "M3I63u_eUYY", title: "Modos Gregos pelo Campo Harmônico", channel: "Antonio Colangelo" },
  ],
  Mixolídio: [
    { id: "M3I63u_eUYY", title: "Modos Gregos — inclui Mixolídio", channel: "Antonio Colangelo" },
    { id: "FEsu-0EAiGg", title: "Pentatônica dominante (Mixolídio)", channel: "Vil Margos Bert" },
  ],
  Eólio: [
    { id: "FEsu-0EAiGg", title: "Domine a Pentatônica Menor", channel: "Vil Margos Bert" },
    { id: "M3I63u_eUYY", title: "Modos Gregos — inclui Eólio", channel: "Antonio Colangelo" },
  ],
  Lócrio: [
    { id: "M3I63u_eUYY", title: "Modos Gregos — inclui Lócrio", channel: "Antonio Colangelo" },
    { id: "LYc7hi2BURc", title: "Curso de Modos Gregos (Cifra Club)", channel: "Cifra Club" },
  ],
};

const INSTRUMENT_VIDEOS: Record<string, VideoLink[]> = {
  guitarra: [
    { id: "FEsu-0EAiGg", title: "Domine a Pentatônica na Guitarra", channel: "Vil Margos Bert" },
    { id: "PWILH0sKAWQ", title: "Patterns de Pentatônica — Ricardo Marins", channel: "NIG Strings" },
  ],
  violao: [
    { id: "FEsu-0EAiGg", title: "Pentatônica no violão/guitarra", channel: "Vil Margos Bert" },
    { id: "M3I63u_eUYY", title: "Modos gregos no violão", channel: "Antonio Colangelo" },
  ],
  baixo: [
    { id: "TvfRusBup4M", title: "Domine QUALQUER Escala no Baixo", channel: "ToqueMaisBaixo — Duvalle" },
    { id: "7lFa9SmzitE", title: "Harmonia no Contrabaixo — Tétrades", channel: "Ronaldo Lobo" },
  ],
  piano: [
    { id: "bXDczAgJEjE", title: "Escalas & Modos no piano", channel: "Aprenda Piano Online" },
    { id: "SUprqEn-JSQ", title: "Segredos de Harmonia Avançada (teclado)", channel: "Caio Vinicius" },
  ],
  teclado: [
    { id: "bXDczAgJEjE", title: "Escalas & Modos no teclado", channel: "Aprenda Piano Online" },
    { id: "SUprqEn-JSQ", title: "Harmonia Avançada no teclado", channel: "Caio Vinicius" },
  ],
  sax: [
    { id: "97mBDIM-9Oc", title: "Saxofonese 008 — Escalas", channel: "Otávio DelleVedove" },
    { id: "435GgZSHWOg", title: "Tocar de Ouvido no Sax", channel: "Digital Mix Sax" },
  ],
  saxofone: [
    { id: "97mBDIM-9Oc", title: "Saxofonese 008 — Escalas", channel: "Otávio DelleVedove" },
    { id: "435GgZSHWOg", title: "Tocar de Ouvido no Sax", channel: "Digital Mix Sax" },
  ],
  bateria: [
    { id: "M3I63u_eUYY", title: "Modos e teoria — útil pra baterista também", channel: "Antonio Colangelo" },
  ],
  violino: [
    { id: "M3I63u_eUYY", title: "Modos Gregos — base teórica", channel: "Antonio Colangelo" },
    { id: "FEsu-0EAiGg", title: "Pentatônica — conceito universal", channel: "Vil Margos Bert" },
  ],
  banjo: [
    { id: "9K5Vf_dQXY0", title: "Banjo 5-string — pentatônica e rolls", channel: "Banjo Ben Clark" },
    { id: "M3I63u_eUYY", title: "Modos Gregos — teoria aplicável ao banjo", channel: "Antonio Colangelo" },
  ],
  "flauta doce": [
    { id: "iKY3sJ7uZ2E", title: "Escalas na flauta doce soprano", channel: "Flauta Doce Brasil" },
    { id: "bXDczAgJEjE", title: "Escalas & Modos (teoria)", channel: "Aprenda Piano Online" },
  ],
  flauta: [
    { id: "iKY3sJ7uZ2E", title: "Escalas na flauta doce soprano", channel: "Flauta Doce Brasil" },
    { id: "bXDczAgJEjE", title: "Escalas & Modos (teoria)", channel: "Aprenda Piano Online" },
  ],
};

function ModeVideoLinks({ modeName, modeRoot, instrumentLabel }: { modeName: string; modeRoot: string; instrumentLabel: string }) {
  const instrumentKey = instrumentLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const modeVids = MODE_VIDEOS[modeName] ?? GENERAL_MODES_VIDEOS;
  const instVids = INSTRUMENT_VIDEOS[instrumentKey] ?? [];
  // Deduplica por id
  const seen = new Set<string>();
  const videos = [...modeVids, ...instVids].filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true))).slice(0, 4);

  const fallbackSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`pentatônica ${modeName} ${modeRoot} ${instrumentLabel} aula`)}`;

  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Youtube className="h-3.5 w-3.5 text-primary" />
        Videoaulas recomendadas
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {videos.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 rounded-lg border border-border bg-background/60 p-2 transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="relative flex-shrink-0 overflow-hidden rounded-md">
              <img
                src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                alt={v.title}
                loading="lazy"
                className="h-16 w-28 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <Youtube className="h-6 w-6 text-white drop-shadow-lg" fill="red" />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground group-hover:text-primary">
                {v.title}
              </span>
              <span className="mt-1 truncate text-[10px] text-muted-foreground">{v.channel}</span>
            </div>
          </a>
        ))}
      </div>
      <a
        href={fallbackSearch}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
      >
        Buscar mais no YouTube para {modeRoot} {modeName} no {instrumentLabel} →
      </a>
    </div>
  );
}

