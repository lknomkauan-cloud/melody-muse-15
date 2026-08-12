import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Music2,
  Waves,
  Layers,
  Sparkles,
  Target,
  Clock,
  Ear,
  Repeat,
  GitBranch,
  Piano,
  Guitar,
  Music4,
  Wind,
} from "lucide-react";
import { HarmonicField } from "@/components/HarmonicField";
import { useContentAccess } from "@/hooks/use-content-access";

type Section = {
  id: string;
  title: string;
  icon: typeof BookOpen;
  intro: string;
  blocks: { heading: string; body: string; bullets?: string[] }[];
};

type ApostilaData = {
  name: string;
  icon: typeof Guitar;
  tagline: string;
  applied: string;
  sections: Section[];
};

const baseSections: Section[] = [
  {
    id: "fundamentos",
    title: "1. Fundamentos da música",
    icon: BookOpen,
    intro: "Antes de qualquer escala ou acorde, você precisa dominar os tijolos: som, ritmo e leitura.",
    blocks: [
      {
        heading: "Parâmetros do som",
        body: "Toda nota musical possui quatro características fundamentais que definem como a ouvimos.",
        bullets: [
          "Altura (frequência): grave ou agudo — medida em Hertz (Hz).",
          "Duração: quanto tempo a nota soa (semibreve, mínima, semínima, colcheia…).",
          "Intensidade: o volume — do pianíssimo (pp) ao fortíssimo (ff).",
          "Timbre: a cor do som — o que diferencia um violino de uma flauta tocando a mesma nota.",
        ],
      },
      {
        heading: "Notas e cifras",
        body: "Usamos 12 notas no sistema temperado: 7 naturais (C D E F G A B) e 5 alteradas por sustenido (#) ou bemol (b).",
        bullets: [
          "Semitom: a menor distância (de Mi para Fá, ou de Dó para Dó#).",
          "Tom: dois semitons (Dó → Ré).",
        ],
      },
    ],
  },
  {
    id: "intervalos",
    title: "2. Intervalos",
    icon: Target,
    intro: "Intervalo é a distância entre duas notas. É a base de toda escala, acorde e melodia.",
    blocks: [
      {
        heading: "Classificação",
        body: "Cada intervalo tem um número (2ª, 3ª, 4ª…) e uma qualidade (justo, maior, menor, aumentado, diminuto).",
      },
    ],
  },
  {
    id: "modos",
    title: "3. Modos Gregos",
    icon: GitBranch,
    intro: "Cada modo é a escala maior começando de um grau diferente.",
    blocks: [
      {
        heading: "Os 7 modos",
        body: "Jônio, Dórico, Frígio, Lídio, Mixolídio, Eólio e Lócrio.",
      },
    ],
  },
  {
    id: "acordes",
    title: "4. Harmonia: Tríades e Tétrades",
    icon: Layers,
    intro: "A base da harmonia.",
    blocks: [
      {
        heading: "Tríades",
        body: "Acordes de 3 notas: Maior, Menor, Diminuta e Aumentada.",
      },
      {
        heading: "Tétrades",
        body: "Acordes de 4 notas (com sétima).",
      },
    ],
  },
  {
    id: "extra",
    title: "5. Empréstimo Modal e Escalas Menores",
    icon: Sparkles,
    intro: "Conceitos avançados para colorir sua música.",
    blocks: [
      {
        heading: "Menores",
        body: "Natural, Harmônica e Melódica.",
      },
    ],
  },
];

const instrumentApplied: Record<string, { name: string; icon: any; tagline: string; applied: string }> = {
  violao: {
    name: "Violão / Guitarra",
    icon: Guitar,
    tagline: "Cordas, casas e desenhos. Visualize o braço como um mapa de intervalos.",
    applied: "Use o sistema CAGED para visualizar acordes e escalas em todo o braço.",
  },
  piano: {
    name: "Piano / Teclado",
    icon: Piano,
    tagline: "Tudo é visível. Use isso a seu favor para enxergar harmonia.",
    applied: "Dedilhado correto é essencial. Pratique escalas com as duas mãos.",
  },
  sanfona: {
    name: "Sanfona / Acordeon",
    icon: Piano,
    tagline: "O pulmão do instrumento. Coordenação entre fole, teclado e baixos.",
    applied: "A sanfona exige coordenação tripla. O fole controla a dinâmica e o sustain; o teclado faz a melodia; e os baixos cuidam do ritmo.",
  },
};

export const Route = createFileRoute("/estudar/$instrumento")({
  loader: ({ params }) => {
    const data = instrumentApplied[params.instrumento as keyof typeof instrumentApplied];
    if (!data) throw new Error("Instrumento não encontrado");
    return { ...data, sections: baseSections, slug: params.instrumento };
  },
  component: ApostilaPage,
});

function ApostilaPage() {
  const data = Route.useLoaderData();
  const { locked, ready } = useContentAccess(data.slug);
  const Icon = data.icon;

  if (!ready) return <div className="p-8 text-center">Carregando...</div>;

  if (locked) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Conteúdo Restrito</h2>
          <p className="mt-2 text-muted-foreground">Seu professor ainda não liberou este material de estudo para você. Continue praticando o que já foi passado!</p>
          <Link to="/estudar" className="mt-6 inline-block text-primary hover:underline">Voltar para a biblioteca</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/estudar" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h1 className="font-display font-bold">{data.name}</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-12 text-center">
          <p className="text-lg text-muted-foreground">{data.tagline}</p>
          <div className="mt-6 rounded-2xl bg-primary/5 p-6 text-left border border-primary/10">
            <h3 className="mb-2 font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Dicas Aplicadas
            </h3>
            <p className="text-sm leading-relaxed">{data.applied}</p>
          </div>
        </div>

        <div className="space-y-12">
          {data.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <section.icon className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-bold">{section.title}</h2>
              </div>
              <p className="mb-8 text-muted-foreground">{section.intro}</p>
              
              <div className="grid gap-6">
                {section.blocks.map((block, idx) => (
                  <div key={idx} className="rounded-2xl border bg-card p-6 shadow-sm">
                    <h3 className="mb-3 text-lg font-bold">{block.heading}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
                    {block.bullets && (
                      <ul className="mt-4 space-y-2">
                        {block.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t pt-12">
          <h2 className="mb-6 font-display text-2xl font-bold">Campo Harmônico</h2>
          <HarmonicField instrument={data.slug as any} />
        </div>
      </main>
    </div>
  );
}
