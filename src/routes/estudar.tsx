import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Guitar,
  Piano,
  Mic2,
  Drum,
  Music2,
  Music4,
  Wind,
  BookOpen,
  Waves,
  Layers,
  Target,
  Clock,
  Ear,
  Sparkles,
  ChevronRight,
  FileText,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/estudar")({
  head: () => ({
    meta: [
      { title: "Estudar — Melodia" },
      {
        name: "description",
        content:
          "Centro de estudos musicais: escolha seu instrumento e explore teoria, técnica, harmonia, ritmo, percepção auditiva e improvisação.",
      },
      { property: "og:title", content: "Estudar — Melodia" },
      {
        property: "og:description",
        content:
          "Escolha seu instrumento e acesse trilhas completas de estudo musical.",
      },
    ],
  }),
  component: EstudarPage,
});

type Resource = {
  title: string;
  type: "Apostila PDF" | "Acordes" | "Pentatônica" | "Escalas" | "Método" | "Vídeo";
  url: string;
  source: string;
};

type Instrument = {
  id: string;
  name: string;
  icon: typeof Guitar;
  description: string;
  specifics: string[];
  resources: Resource[];
};

const instruments: Instrument[] = [
  {
    id: "violao",
    name: "Violão / Guitarra",
    icon: Guitar,
    description: "Cordas dedilhadas e palhetadas — acordes, riffs e solos.",
    specifics: [
      "Postura, mão direita e mão esquerda",
      "Acordes abertos, com pestana e dissonantes",
      "Escalas em todas as posições do braço",
      "CAGED e visualização do braço",
      "Técnicas: hammer-on, pull-off, slide, bending, tapping",
      "Leitura de cifras, tablaturas e partitura",
    ],
    resources: [
      { title: "Curso básico de violão popular (PDF)", type: "Apostila PDF", url: "https://www.ibel.org.br/download/ApostilaDeViolao.pdf", source: "IBEL" },
      { title: "Apostila de Violão — Igreja nas Casas (PDF)", type: "Apostila PDF", url: "https://igrejanascasas.com/wp-content/uploads/2017/07/ApostilaViolao-1.pdf", source: "Igreja nas Casas" },
      { title: "Escala Pentatônica — exercícios (PDF)", type: "Pentatônica", url: "https://www.cliqueapostilas.com.br/violao/escala-pentatonica", source: "Clique Apostilas" },
      { title: "Violão e Guitarra: As Ferramentas do Aprendiz", type: "Método", url: "https://pdfcoffee.com/violao-pdf-free.html", source: "Domínio da Música" },
      { title: "Manual Básico do Violão — Leandro Kasan", type: "Apostila PDF", url: "https://pt.scribd.com/document/551273751/Manual-Basico-do-Violao-Leandro-Kasan-2", source: "Scribd" },
    ],
  },
  {
    id: "piano",
    name: "Piano / Teclado",
    icon: Piano,
    description: "Harmonia visual, independência de mãos e voicings ricos.",
    specifics: [
      "Postura e independência das mãos",
      "Dedilhado clássico das escalas e arpejos",
      "Voicings de jazz (shells, drop 2, rootless)",
      "Comping e condução de vozes",
      "Leitura de partitura nas duas claves",
      "Sight reading e harmonização de melodias",
    ],
    resources: [
      { title: "Apostila Piano e Teclado — Eduardo Torres (PDF)", type: "Apostila PDF", url: "https://pdfcoffee.com/download/apostila-de-piano-e-teclado-19-pdf-free.html", source: "Piano Educato" },
      { title: "Curso de Teclado completo (PDF)", type: "Apostila PDF", url: "http://www.conbcd.com.br/documents/CursodeTeclado.pdf", source: "CONBCD" },
      { title: "Escalas e Acordes Fundamentais (PDF)", type: "Escalas", url: "https://epage.pub/doc/escalas-e-acordes-fundamentais-no-teclado-e-piano-y9l1klnnny", source: "ePage" },
      { title: "Acordes no Piano/Teclado (PDF)", type: "Acordes", url: "https://www.cliqueapostilas.com.br/teoria-musical/acordes-no-piano-teclado", source: "Clique Apostilas" },
      { title: "Pentatônicas no piano — guia visual", type: "Pentatônica", url: "https://www.pianoscales.org/pentatonic.html", source: "PianoScales" },
    ],
  },
  {
    id: "baixo",
    name: "Baixo",
    icon: Music2,
    description: "Base rítmica e harmônica — groove e fundamento.",
    specifics: [
      "Walking bass e construção de linhas",
      "Slap, pop e técnica de palhetada",
      "Groove em diferentes estilos (funk, samba, rock)",
      "Relação com bateria e harmonia",
      "Arpejos e modos sobre cifras",
    ],
    resources: [
      { title: "Apostila de Baixo — Projeto São Tiago (PDF)", type: "Apostila PDF", url: "https://www.projetosaotiago.ong.br/assets/uploads/diversos/99/Apostila%20de%20Baixo%20-%2027.01.pdf", source: "Projeto São Tiago" },
      { title: "Apostilas de Baixo (coletânea)", type: "Apostila PDF", url: "https://www.cliqueapostilas.com.br/baixo", source: "Clique Apostilas" },
      { title: "Pentatônicas no Baixo — Studybass", type: "Pentatônica", url: "https://www.studybass.com/lessons/pentatonic-bass-patterns/the-minor-pentatonic-scale/", source: "Studybass" },
      { title: "Acordes e arpejos no contrabaixo", type: "Acordes", url: "https://www.cifraclub.com.br/aulas/baixo/", source: "Cifra Club" },
    ],
  },
  {
    id: "bateria",
    name: "Bateria",
    icon: Drum,
    description: "Pulso, subdivisão e independência de membros.",
    specifics: [
      "Rudimentos (single stroke, double, paradiddle, flam)",
      "Independência entre membros",
      "Levadas: rock, samba, jazz, funk, bossa",
      "Viradas e fills criativos",
      "Leitura rítmica e clave",
    ],
    resources: [
      { title: "Apostila de Bateria (PDF)", type: "Apostila PDF", url: "https://pt.slideshare.net/slideshow/apostila-bateria/59477189", source: "Slideshare" },
      { title: "40 Rudimentos PAS (PDF oficial)", type: "Método", url: "https://www.pas.org/docs/default-source/standards-files/pas-international-drum-rudiments.pdf", source: "PAS" },
      { title: "Apostilas de Bateria (coletânea)", type: "Apostila PDF", url: "https://www.cliqueapostilas.com.br/bateria", source: "Clique Apostilas" },
      { title: "Leitura rítmica — Stick Control (referência)", type: "Método", url: "https://archive.org/details/stick-control-for-the-snare-drummer", source: "Archive.org" },
    ],
  },
  {
    id: "voz",
    name: "Canto",
    icon: Mic2,
    description: "Técnica vocal, afinação e expressão.",
    specifics: [
      "Respiração diafragmática e apoio",
      "Aquecimento e vocalizes",
      "Registros: peito, mista, cabeça, belting",
      "Afinação e percepção interválica",
      "Dicção, fraseado e interpretação",
    ],
    resources: [
      { title: "Apostila de Canto — Cássia Cotrim (PDF)", type: "Apostila PDF", url: "https://pdfcoffee.com/apostila-de-canto-pdf-free.html", source: "PDFCoffee" },
      { title: "Apostila de Canto Popular Básico (PDF)", type: "Apostila PDF", url: "https://pt.scribd.com/document/375184579/Apostila-Canto-Popular-Nivel-Basico-Val-Klay-pdf", source: "Scribd" },
      { title: "Vocalizes e aquecimento — pentatônicas", type: "Pentatônica", url: "https://www.cliqueapostilas.com.br/canto", source: "Clique Apostilas" },
    ],
  },
  {
    id: "violino",
    name: "Violino",
    icon: Music4,
    description: "Arco, afinação fina e expressividade.",
    specifics: [
      "Postura, empunhadura do arco",
      "Posições no braço (1ª à 7ª)",
      "Vibrato, staccato, legato, spiccato",
      "Escalas e arpejos em todas as tonalidades",
      "Leitura de partitura e ornamentos",
    ],
    resources: [
      { title: "Estudando Violino em Casa — Lyrio Bernardi Jr. (PDF)", type: "Apostila PDF", url: "https://www.cliqueapostilas.com.br/violino/estudando-violino-em-casa", source: "Clique Apostilas" },
      { title: "Suzuki Violin Method Vol. 1 (referência)", type: "Método", url: "https://archive.org/details/suzuki-violin-method-vol-01", source: "Archive.org" },
      { title: "Escalas e arpejos — Carl Flesch (referência)", type: "Escalas", url: "https://imslp.org/wiki/Scale_System_(Flesch%2C_Carl)", source: "IMSLP" },
      { title: "Pentatônicas no violino — guia", type: "Pentatônica", url: "https://violinspiration.com/violin-scales/", source: "Violinspiration" },
    ],
  },
  {
    id: "sax",
    name: "Saxofone",
    icon: Wind,
    description: "Sopro expressivo — embocadura, articulação e fraseado.",
    specifics: [
      "Embocadura, respiração e apoio diafragmático",
      "Tipos: soprano, alto, tenor e barítono (transposição)",
      "Articulação: staccato, legato, ghost notes, growl",
      "Escalas maiores, menores e modos em todas as tonalidades",
      "Pentatônicas e blues para improvisação",
      "Fraseado jazzístico e vocabulário bebop",
    ],
    resources: [
      { title: "Método de Iniciação ao Saxofone — Ivan Meyer Vol.1 (PDF)", type: "Apostila PDF", url: "https://pt.scribd.com/document/43805404/Ivan-Meyer-Metodo-de-Iniciacao-Ao-Saxofone-Vol-1", source: "Scribd" },
      { title: "Apostila de Saxofone — Ivan Meyer (104 págs.)", type: "Apostila PDF", url: "https://www.cliqueapostilas.com.br/saxofone/apostila-de-saxofone", source: "Clique Apostilas" },
      { title: "Método de Iniciação de Sax (PDF curto)", type: "Método", url: "https://www.cliqueapostilas.com.br/saxofone/metodo-de-iniciacao-de-sax", source: "Clique Apostilas" },
      { title: "Escalas Pentatônicas para Saxofone — L. E. López", type: "Pentatônica", url: "https://pdfcoffee.com/escalas-para-improvisar-escalas-pentatonicas-lelt-pdf-free.html", source: "PDFCoffee" },
      { title: "Escalas para Saxofone (gráfico PDF)", type: "Escalas", url: "https://tomplay.com/pt/tools/scales/saxophone", source: "Tomplay" },
      { title: "Acordes e arpejos para sax — referência", type: "Acordes", url: "https://www.saxstation.com/saxophone-scales.html", source: "Sax Station" },
    ],
  },
];


type Topic = {
  id: string;
  title: string;
  icon: typeof BookOpen;
  level: "Iniciante" | "Intermediário" | "Avançado";
  lessons: string[];
};

const topics: Topic[] = [
  {
    id: "fundamentos",
    title: "Fundamentos da Música",
    icon: BookOpen,
    level: "Iniciante",
    lessons: [
      "Som, altura, duração, intensidade e timbre",
      "Pauta, claves (sol, fá, dó) e notas",
      "Figuras e pausas — valores rítmicos",
      "Compassos simples e compostos",
      "Ligadura, ponto de aumento e quiáltera",
      "Dinâmicas e articulações",
    ],
  },
  {
    id: "intervalos",
    title: "Intervalos",
    icon: Target,
    level: "Iniciante",
    lessons: [
      "Classificação numérica (2ª, 3ª, 4ª…)",
      "Qualidade: justo, maior, menor, aumentado, diminuto",
      "Inversão de intervalos",
      "Intervalos consonantes e dissonantes",
      "Reconhecimento auditivo de intervalos",
    ],
  },
  {
    id: "escalas",
    title: "Escalas e Modos",
    icon: Waves,
    level: "Intermediário",
    lessons: [
      "Escala maior e menor (natural, harmônica, melódica)",
      "Modos gregos (jônio, dórico, frígio, lídio, mixolídio, eólio, lócrio)",
      "Pentatônicas maior e menor",
      "Escala blues",
      "Escalas simétricas: tons inteiros, diminuta, cromática",
      "Modos da menor melódica (lídio b7, alterada)",
    ],
  },
  {
    id: "acordes",
    title: "Acordes e Harmonia",
    icon: Layers,
    level: "Intermediário",
    lessons: [
      "Tríades: maior, menor, diminuta, aumentada",
      "Tétrades: maj7, m7, 7, m7b5, dim7",
      "Tensões: 9, 11, 13 e alterações",
      "Inversões e voicings",
      "Campo harmônico maior e menor",
      "Substituições e dominantes secundários",
      "Modulação e progressões II-V-I",
    ],
  },
  {
    id: "ritmo",
    title: "Ritmo e Métrica",
    icon: Clock,
    level: "Iniciante",
    lessons: [
      "Pulso, andamento e subdivisão",
      "Compassos irregulares (5/4, 7/8, 11/8)",
      "Polirritmia e poliritmia",
      "Síncope e contratempo",
      "Ritmos brasileiros: samba, baião, frevo, maracatu",
      "Grooves do mundo: clave, swing, shuffle",
    ],
  },
  {
    id: "percepcao",
    title: "Percepção Auditiva",
    icon: Ear,
    level: "Intermediário",
    lessons: [
      "Reconhecimento de intervalos melódicos e harmônicos",
      "Identificação de acordes e qualidades",
      "Ditado melódico e rítmico",
      "Transcrição de solos",
      "Reconhecimento de cadências e progressões",
    ],
  },
  {
    id: "improvisacao",
    title: "Improvisação",
    icon: Sparkles,
    level: "Avançado",
    lessons: [
      "Acorde-escala (chord-scale theory)",
      "Targeting, enclosures e approach notes",
      "Frases bebop e vocabulário jazzístico",
      "Motivos e desenvolvimento temático",
      "Improvisação modal vs tonal",
      "Tocar over changes (II-V-I, blues, rhythm changes)",
    ],
  },
  {
    id: "leitura",
    title: "Leitura e Escrita Musical",
    icon: BookOpen,
    level: "Intermediário",
    lessons: [
      "Leitura à primeira vista",
      "Cifras americanas e cifragem brasileira",
      "Notação rítmica avançada",
      "Lead sheets e partituras orquestrais",
      "Tablatura e notação específica de instrumento",
    ],
  },
];

const levelColor: Record<Topic["level"], string> = {
  Iniciante: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Intermediário: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Avançado: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function EstudarPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const current = useMemo(
    () => instruments.find((i) => i.id === selected) ?? null,
    [selected]
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Centro de estudos
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Estude tudo, no seu instrumento
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Escolha seu instrumento e mergulhe em trilhas de teoria, harmonia,
            ritmo, percepção e improvisação — do fundamento ao avançado.
          </p>
        </div>

        {/* Instrument picker */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">
            1. Escolha seu instrumento
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {instruments.map((inst) => {
              const Icon = inst.icon;
              const active = selected === inst.id;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelected(inst.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    active
                      ? "border-primary bg-primary/10 shadow-[0_0_30px_-10px_hsl(var(--primary))]"
                      : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                  }`}
                >
                  <Icon
                    className={`h-7 w-7 transition-colors ${
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {inst.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Instrument-specific panel */}
        {current && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 glass">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/15 p-3">
                <current.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Trilha específica — {current.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {current.description}
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {current.specifics.map((s) => (
                    <li
                      key={s}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Universal study topics */}
        <div className="mt-14">
          <h2 className="font-display text-xl font-semibold text-foreground">
            2. Conteúdo de estudo musical
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vale para qualquer instrumento — base teórica e prática completa.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {topics.map((t) => {
              const Icon = t.icon;
              return (
                <article
                  key={t.id}
                  className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_-15px_hsl(var(--primary))]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {t.title}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${levelColor[t.level]}`}
                    >
                      {t.level}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {t.lessons.map((l) => (
                      <li
                        key={l}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>

        {/* Quick tools */}
        <div className="mt-14 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold text-foreground">
            3. Pratique agora
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ferramentas interativas para colocar a teoria em prática.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: "/quiz", label: "Quiz de Notas", icon: Target },
              { to: "/escalas", label: "Escalas", icon: Waves },
              { to: "/acordes", label: "Acordes", icon: Layers },
              { to: "/metronomo", label: "Metrônomo", icon: Clock },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
