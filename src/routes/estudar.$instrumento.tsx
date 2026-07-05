import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
  Drum,
  Mic2,
  Music4,
  Wind,
} from "lucide-react";
import { HarmonicField } from "@/components/HarmonicField";

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
  applied: string; // applied tips for instrument
  sections: Section[];
};

// ---------- Conteúdo teórico compartilhado ----------
const baseSections: Section[] = [
  {
    id: "fundamentos",
    title: "1. Fundamentos da música",
    icon: BookOpen,
    intro:
      "Antes de qualquer escala ou acorde, você precisa dominar os tijolos: som, ritmo e leitura.",
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
        body: "Usamos 12 notas no sistema temperado: 7 naturais (C D E F G A B) e 5 alteradas por sustenido (#) ou bemol (b). No Brasil também se usa Dó Ré Mi Fá Sol Lá Si.",
        bullets: [
          "Semitom: a menor distância (de Mi para Fá, ou de Dó para Dó#).",
          "Tom: dois semitons (Dó → Ré).",
          "Enarmonia: F# = Gb (mesma altura, nomes diferentes).",
        ],
      },
      {
        heading: "Compasso e métrica",
        body: "O compasso organiza o tempo. O numerador indica quantos tempos cabem; o denominador, qual figura vale um tempo.",
        bullets: [
          "4/4 — quaternário simples (rock, pop, samba).",
          "3/4 — ternário (valsa).",
          "6/8 — composto, sensação de dois grupos de três.",
          "7/8, 5/4 — compassos irregulares (Take Five, Money).",
        ],
      },
    ],
  },
  {
    id: "intervalos",
    title: "2. Intervalos",
    icon: Target,
    intro:
      "Intervalo é a distância entre duas notas. É a base de toda escala, acorde e melodia.",
    blocks: [
      {
        heading: "Classificação",
        body: "Cada intervalo tem um número (2ª, 3ª, 4ª…) e uma qualidade (justo, maior, menor, aumentado, diminuto).",
        bullets: [
          "Justos: 1ª, 4ª, 5ª, 8ª.",
          "Maiores/Menores: 2ª, 3ª, 6ª, 7ª.",
          "Aumentado = justo/maior + ½ tom. Diminuto = justo/menor − ½ tom.",
        ],
      },
      {
        heading: "Tabela de referência (a partir de Dó)",
        body: "Memorize as distâncias em semitons — isso destrava acordes e escalas.",
        bullets: [
          "2ªm = 1 (C→Db) • 2ªM = 2 (C→D)",
          "3ªm = 3 (C→Eb) • 3ªM = 4 (C→E)",
          "4ªJ = 5 (C→F) • 4ªA / 5ªd = 6 (C→F#/Gb) — trítono",
          "5ªJ = 7 (C→G) • 6ªM = 9 (C→A)",
          "7ªm = 10 (C→Bb) • 7ªM = 11 (C→B) • 8ª = 12",
        ],
      },
      {
        heading: "Consonância e dissonância",
        body: "Intervalos consonantes (3ªs, 6ªs, 5ª, 8ª) soam estáveis; dissonantes (2ªs, 7ªs, trítono) pedem resolução.",
      },
    ],
  },
  {
    id: "escalas-maiores",
    title: "3. Escala maior e escalas menores",
    icon: Waves,
    intro: "A escala maior é a régua. Tudo se mede a partir dela.",
    blocks: [
      {
        heading: "Escala maior",
        body: "Fórmula em tons e semitons: T - T - S - T - T - T - S. Exemplo em Dó: C D E F G A B C.",
        bullets: [
          "Graus: I (tônica), II, III, IV (subdominante), V (dominante), VI, VII, VIII.",
          "Soa alegre, brilhante, resolutiva.",
        ],
      },
      {
        heading: "Escala menor natural",
        body: "Mesma sequência de notas do VI grau da maior relativa. Fórmula: T - S - T - T - S - T - T. Ex.: Am = A B C D E F G.",
      },
      {
        heading: "Menor harmônica",
        body: "Eleva-se o 7º grau, criando uma 2ª aumentada característica. Ex.: Am harmônica = A B C D E F G#. Gera a dominante V7 na menor.",
      },
      {
        heading: "Menor melódica",
        body: "Subindo: 6ª e 7ª aumentadas (A B C D E F# G#). Descendo (no clássico): igual à natural. No jazz, usa-se a forma ascendente em ambas direções — origem dos modos do jazz moderno.",
      },
    ],
  },
  {
    id: "modos",
    title: "4. Modos gregos",
    icon: GitBranch,
    intro:
      "Cada modo é a escala maior começando de um grau diferente. Cada um tem um caráter único.",
    blocks: [
      {
        heading: "Os 7 modos a partir de C maior",
        body: "Mesmas notas (C D E F G A B), tônica diferente.",
        bullets: [
          "I – Jônio (C D E F G A B) — maior puro, brilhante.",
          "II – Dórico (D E F G A B C) — menor com 6ª maior, cor de jazz/funk.",
          "III – Frígio (E F G A B C D) — menor com 2ª menor, exótico, flamenco.",
          "IV – Lídio (F G A B C D E) — maior com 4ª aumentada, sonho, cinema.",
          "V – Mixolídio (G A B C D E F) — maior com 7ª menor, blues, rock.",
          "VI – Eólio (A B C D E F G) — menor natural, melancólico.",
          "VII – Lócrio (B C D E F G A) — diminuto, instável.",
        ],
      },
      {
        heading: "Como usar",
        body: "Identifique o centro tonal (qual nota soa como tônica) e a 'nota característica' do modo — é ela que define a cor. Ex.: tocar dórico = enfatizar a 6ª maior (B em D dórico).",
      },
    ],
  },
  {
    id: "pentatonicas",
    title: "5. Pentatônicas e blues",
    icon: Waves,
    intro: "Cinco notas que sempre funcionam — a porta de entrada da improvisação.",
    blocks: [
      {
        heading: "Pentatônica maior",
        body: "Graus 1 2 3 5 6 da escala maior. Em C: C D E G A. Som country, gospel, pop.",
      },
      {
        heading: "Pentatônica menor",
        body: "Graus 1 b3 4 5 b7 da escala maior. Em A: A C D E G. Base do rock, blues e improvisação.",
      },
      {
        heading: "Escala blues",
        body: "Pentatônica menor + 'blue note' (b5). Em A: A C D Eb E G. A b5 é nota de passagem cromática.",
      },
      {
        heading: "Pentatônicas modais",
        body: "Cada modo tem sua pentatônica de cor: dórica (1 b3 4 5 6), frígia (1 b2 4 5 b7), lídia (1 2 3 #4 6), mixolídia (1 2 3 5 b7). Excelentes para improvisar dentro de um modo sem 'errar'.",
      },
    ],
  },
  {
    id: "triades",
    title: "6. Tríades",
    icon: Layers,
    intro: "Três notas empilhadas em terças — o esqueleto de qualquer acorde.",
    blocks: [
      {
        heading: "As quatro tríades",
        body: "Construídas pelos intervalos da fundamental.",
        bullets: [
          "Maior: 1 3 5 (C E G) — alegre.",
          "Menor: 1 b3 5 (C Eb G) — triste.",
          "Diminuta: 1 b3 b5 (C Eb Gb) — tensa.",
          "Aumentada: 1 3 #5 (C E G#) — flutuante.",
        ],
      },
      {
        heading: "Inversões",
        body: "Mesma tríade, baixo diferente. C/E (1ª inversão), C/G (2ª inversão). Usadas para suavizar o baixo e criar caminhadas.",
      },
    ],
  },
  {
    id: "tetrades",
    title: "7. Tétrades e tensões",
    icon: Layers,
    intro: "Adicionar a 7ª (e mais) transforma a tríade em harmonia adulta.",
    blocks: [
      {
        heading: "As cinco tétrades essenciais",
        body: "Empilhe a 4ª terça acima da tríade.",
        bullets: [
          "Maj7: 1 3 5 7 (Cmaj7 = C E G B) — repouso colorido.",
          "m7: 1 b3 5 b7 (Cm7 = C Eb G Bb) — menor jazzístico.",
          "7 (dominante): 1 3 5 b7 (C7 = C E G Bb) — tensão que resolve.",
          "m7b5 (meio-diminuto): 1 b3 b5 b7 (Cm7b5 = C Eb Gb Bb).",
          "dim7: 1 b3 b5 bb7 (Cdim7 = C Eb Gb A).",
        ],
      },
      {
        heading: "Tensões: 9, 11, 13",
        body: "São extensões além da 7ª. 9 = 2ª oitava acima; 11 = 4ª; 13 = 6ª. Podem ser naturais ou alteradas (b9, #9, #11, b13).",
        bullets: [
          "Em maj7: aceita 9, #11, 13.",
          "Em m7: aceita 9, 11, 13.",
          "Em 7 dominante: aceita TUDO — b9 #9 #11 b13 (acorde alterado).",
        ],
      },
    ],
  },
  {
    id: "campo-harmonico",
    title: "8. Campo harmônico",
    icon: Layers,
    intro:
      "Os acordes que nascem naturalmente de uma escala — o 'time' de cada tonalidade.",
    blocks: [
      {
        heading: "Campo harmônico maior (em C)",
        body: "Empilhando terças sobre cada grau da escala C maior.",
        bullets: [
          "I — Cmaj7 (tônica)",
          "ii — Dm7",
          "iii — Em7",
          "IV — Fmaj7 (subdominante)",
          "V — G7 (dominante)",
          "vi — Am7 (relativa menor)",
          "vii° — Bm7b5",
        ],
      },
      {
        heading: "Funções tonais",
        body: "Cada grau cumpre um papel.",
        bullets: [
          "Tônica (I, iii, vi): repouso.",
          "Subdominante (ii, IV): movimento, afastamento.",
          "Dominante (V, vii°): tensão que pede resolução à tônica.",
        ],
      },
      {
        heading: "Campo harmônico menor (em Am)",
        body: "Da menor harmônica obtém-se a dominante V7 verdadeira.",
        bullets: [
          "i — Am(maj7) ou Am7",
          "ii° — Bm7b5",
          "III+ — Cmaj7#5",
          "iv — Dm7",
          "V — E7 (dominante)",
          "VI — Fmaj7",
          "vii° — G#dim7",
        ],
      },
    ],
  },
  {
    id: "cadencias",
    title: "9. Cadências e progressões",
    icon: Repeat,
    intro: "Sequências harmônicas que criam expectativa e resolução.",
    blocks: [
      {
        heading: "Cadências clássicas",
        body: "Movimentos típicos do fim de frase.",
        bullets: [
          "Autêntica: V → I (G7 → C). Resolução forte.",
          "Plagal: IV → I (F → C). 'Amém'.",
          "Deceptiva: V → vi (G7 → Am). Surpresa.",
          "Suspensa: termina no V.",
        ],
      },
      {
        heading: "II-V-I — o pilar do jazz",
        body: "Dm7 → G7 → Cmaj7. Em menor: Bm7b5 → E7 → Am7. Domine essa progressão em todas as 12 tonalidades.",
      },
      {
        heading: "Progressões populares",
        body: "Estruturas que aparecem em milhares de músicas.",
        bullets: [
          "I–V–vi–IV (C–G–Am–F) — pop universal.",
          "vi–IV–I–V (Am–F–C–G) — emocional.",
          "12 compassos de blues: I–I–I–I–IV–IV–I–I–V–IV–I–V.",
          "Rhythm changes (I–vi–ii–V) — base de standards.",
        ],
      },
    ],
  },
  {
    id: "emprestimo-modal",
    title: "10. Empréstimo modal",
    icon: GitBranch,
    intro:
      "Pegar emprestado um acorde de outro modo paralelo — cor expressiva sem mudar de tom.",
    blocks: [
      {
        heading: "Como funciona",
        body: "Estando em C maior, você 'empresta' acordes do C menor (eólio, frígio, dórico…) para colorir a harmonia. A tônica continua sendo C.",
      },
      {
        heading: "Acordes emprestados mais usados (em C maior)",
        body: "Vindos do C menor natural e harmônica.",
        bullets: [
          "iv — Fm (a subdominante menor, super expressiva).",
          "bVII — Bb (mixolídio/eólio, som rock).",
          "bVI — Ab (cor cinemática).",
          "bIII — Eb.",
          "ii°7 — Dm7b5 (do frígio).",
          "V7/iv — C7 (dominante secundário).",
        ],
      },
      {
        heading: "Exemplos famosos",
        body: "Beatles ('Something' usa iv emprestado), Radiohead, Tom Jobim e MPB usam empréstimo o tempo todo.",
      },
    ],
  },
  {
    id: "dominantes",
    title: "11. Dominantes secundários e substituições",
    icon: Sparkles,
    intro: "Truques que adicionam tensão e direção à harmonia.",
    blocks: [
      {
        heading: "Dominante secundário",
        body: "Qualquer acorde maior/menor pode ter seu próprio V7 'momentâneo'. Notação: V7/X (lê-se 'cinco de X'). Em C: A7 (V7/ii) → Dm7.",
      },
      {
        heading: "Substituição por trítono (SubV)",
        body: "Troca-se um V7 pelo dominante a um trítono de distância. G7 (resolve em C) → Db7. Funciona porque ambos compartilham o trítono B–F.",
      },
      {
        heading: "Acorde diminuto de passagem",
        body: "#I°7, #II°7, #IV°7 conectam acordes diatônicos cromaticamente. Ex.: C – C#°7 – Dm7.",
      },
    ],
  },
  {
    id: "melodia",
    title: "12. Melodia e fraseado",
    icon: Music2,
    intro: "A linha de canto sobre a harmonia — onde mora a emoção.",
    blocks: [
      {
        heading: "Notas-alvo (chord tones)",
        body: "Em cada acorde, as notas 1, 3, 5 e 7 são âncoras. Cair nelas no tempo forte = melodia clara.",
      },
      {
        heading: "Notas de aproximação",
        body: "Cromáticas, diatônicas, enclosures (cercar a nota-alvo por cima e por baixo). É o vocabulário bebop.",
      },
      {
        heading: "Construção de frase",
        body: "Pense em pergunta e resposta, motivos curtos repetidos com variação, contorno (ascendente/descendente), uso do silêncio.",
      },
      {
        heading: "Tensão e resolução",
        body: "Use 9, #11, 13 sobre acordes para criar cor; resolva em chord tones para satisfazer o ouvido.",
      },
    ],
  },
  {
    id: "ritmo",
    title: "13. Ritmo, groove e leitura",
    icon: Clock,
    intro: "Sem ritmo, nada disso soa.",
    blocks: [
      {
        heading: "Subdivisão",
        body: "Sentir o pulso em colcheias, semicolcheias e tercinas. Praticar com metrônomo em 2 e 4 (clique no contratempo).",
      },
      {
        heading: "Síncope e antecipação",
        body: "Acentuar tempos fracos. Base do samba, funk, jazz, choro.",
      },
      {
        heading: "Polirritmia",
        body: "Dois ritmos sobrepostos. 3:2 (hemíola), 4:3. Treine batendo com as mãos.",
      },
    ],
  },
  {
    id: "percepcao",
    title: "14. Percepção auditiva",
    icon: Ear,
    intro: "Ouvir é o músculo mais importante.",
    blocks: [
      {
        heading: "Intervalos",
        body: "Associe cada intervalo a uma música conhecida. Ex.: 4ªJ = 'Parabéns'; 5ªJ = 'Star Wars'; 6ªM = 'My Bonnie'.",
      },
      {
        heading: "Acordes e cadências",
        body: "Treine reconhecer maj7, m7, 7, m7b5, dim. Depois, II–V–I, plagal, deceptiva.",
      },
      {
        heading: "Transcrição",
        body: "Tire músicas de ouvido — é o exercício que mais desenvolve o músico.",
      },
    ],
  },
  {
    id: "improvisacao",
    title: "15. Improvisação",
    icon: Sparkles,
    intro: "Aplicar tudo em tempo real.",
    blocks: [
      {
        heading: "Chord-scale theory",
        body: "Para cada acorde, uma (ou várias) escalas funcionam.",
        bullets: [
          "Cmaj7 → C jônio ou C lídio.",
          "Dm7 → D dórico.",
          "G7 → G mixolídio (ou alterada em contexto jazzístico).",
          "G7alt → escala alterada (7º modo da menor melódica).",
          "Bm7b5 → B lócrio.",
        ],
      },
      {
        heading: "Approach notes e enclosures",
        body: "Cerque a nota-alvo cromaticamente: B–D#–C# resolvendo em D. Vocabulário clássico de Charlie Parker.",
      },
      {
        heading: "Tocar 'over the changes'",
        body: "Não toque apenas escalas — toque a harmonia. Faça arpejos de cada acorde, conecte com graus comuns, marque a 3ª e 7ª (notas-guia).",
      },
    ],
  },
];

// ---------- Dicas aplicadas por instrumento ----------
const instrumentApplied: Record<string, { name: string; icon: typeof Guitar; tagline: string; applied: string }> = {
  violao: {
    name: "Violão / Guitarra",
    icon: Guitar,
    tagline: "Cordas, casas e desenhos. Visualize o braço como um mapa de intervalos.",
    applied:
      "Use o sistema CAGED para visualizar acordes e escalas em todo o braço. Pratique cada modo grego sobre um pedal (uma corda solta) para internalizar a cor. As pentatônicas em 5 desenhos cobrem o braço inteiro — domine os 5 antes de partir para escalas de 7 notas. Para harmonia, estude voicings tipo 'drop 2' e acordes com bordão (cordas soltas).",
  },
  piano: {
    name: "Piano / Teclado",
    icon: Piano,
    tagline: "Tudo é visível. Use isso a seu favor para enxergar harmonia.",
    applied:
      "No piano, intervalos e acordes são geométricos — memorize o desenho de cada tétrade. Pratique voicings de jazz: shell (1, 3, 7), rootless (3, 5, 7, 9), drop 2. Para improvisar, toque a melodia/escala na direita e a harmonia (shells) na esquerda. Comece II-V-I em todas as 12 tonalidades pelo ciclo de quintas.",
  },
  baixo: {
    name: "Baixo",
    icon: Music2,
    tagline: "Você é a ponte entre harmonia e ritmo.",
    applied:
      "Marque sempre a fundamental no tempo 1. Use 3ª e 7ª (notas-guia) para definir a qualidade do acorde. Walking bass: 1 → nota de aproximação → 1 do próximo acorde. Pratique arpejos das tétrades em todas as posições. Pentatônica menor é seu ouro para grooves de rock, funk e blues.",
  },
  bateria: {
    name: "Bateria",
    icon: Drum,
    tagline: "Sem altura definida — mas toda teoria de ritmo, forma e dinâmica se aplica.",
    applied:
      "Ainda que não toque notas, você precisa CONHECER a harmonia para fazer fills musicais e marcar mudanças. Estude forma (AABA, blues 12, 32 compassos), dinâmica e densidade. Trabalhe rudimentos diariamente (paradiddle, double stroke, flam) e independência com livros como Stick Control e Syncopation (Ted Reed).",
  },
  voz: {
    name: "Canto",
    icon: Mic2,
    tagline: "Seu instrumento é o corpo — afinação vem da audição interna.",
    applied:
      "Solfeje TUDO antes de cantar: escalas, arpejos, intervalos. Use o sistema de dó móvel (do-re-mi-fa-sol-la-ti) para ouvir graus. Pratique pentatônicas como vocalize. Para harmonia, ouça e cante cada voz de um II-V-I separadamente. Domine a notação para ler partituras de coro.",
  },
  violino: {
    name: "Violino",
    icon: Music4,
    tagline: "Afinação fina e arco — cada nota é uma decisão.",
    applied:
      "Pratique escalas de 3 oitavas com afinação perfeita (sem trastes, cada milímetro conta). Estude o sistema de Carl Flesch. Arpejos das tétrades em todas as posições. No fiddle/jazz, pentatônicas e blues são essenciais. Ornamentos (trinado, mordente) são parte do vocabulário melódico.",
  },
  sax: {
    name: "Saxofone",
    icon: Wind,
    tagline: "Instrumento transpositor — pense em duas tonalidades ao mesmo tempo.",
    applied:
      "Alto e barítono em Mib, tenor e soprano em Sib. Para tocar em C de concerto: alto toca em A (3ªm acima), tenor toca em D (2ªM acima). Domine escalas maiores, menores melódicas e modos em todas as 12 tonalidades — essencial para improvisar standards. Pratique padrões de bebop (1235, 5321, enclosures) sobre II-V-I. Trabalhe long tones diariamente para som e afinação.",
  },
};

export const Route = createFileRoute("/estudar/$instrumento")({
  head: ({ params }) => {
    const data = instrumentApplied[params.instrumento];
    const name = data?.name ?? "Apostila";
    return {
      meta: [
        { title: `Apostila completa de ${name} — Notes for Life` },
        {
          name: "description",
          content: `Apostila completa de teoria musical para ${name}: modos gregos, harmonia, campo harmônico, melodia, tríades, tétrades, empréstimo modal, escalas menores e mais.`,
        },
        { property: "og:title", content: `Apostila de ${name} — Notes for Life` },
      ],
    };
  },
  loader: ({ params }) => {
    if (!instrumentApplied[params.instrumento]) throw notFound();
    return { instrumento: params.instrumento };
  },
  notFoundComponent: () => (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Instrumento não encontrado
        </h1>
        <p className="mt-3 text-muted-foreground">
          Volte ao centro de estudos e escolha um instrumento disponível.
        </p>
        <Link
          to="/estudar"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </section>
    </main>
  ),
  errorComponent: ({ error, reset }) => (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Erro ao carregar a apostila
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  ),
  component: ApostilaPage,
});

function ApostilaPage() {
  const { instrumento } = Route.useLoaderData();
  const data = instrumentApplied[instrumento];
  const Icon = data.icon;

  const apostila: ApostilaData = {
    name: data.name,
    icon: data.icon,
    tagline: data.tagline,
    applied: data.applied,
    sections: baseSections,
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          to="/estudar"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao centro de estudos
        </Link>

        <header className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 glass">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/20 p-3">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <BookOpen className="h-3 w-3" /> Apostila completa
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                {apostila.name}
              </h1>
              <p className="mt-2 text-muted-foreground">{apostila.tagline}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-primary/20 bg-background/40 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-4 w-4" /> Aplicação no instrumento
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {apostila.applied}
            </p>
          </div>
        </header>

        {/* Sumário */}
        <nav className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Sumário
          </h2>
          <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {apostila.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <s.icon className="h-3.5 w-3.5 text-primary" />
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <HarmonicField instrument={instrumento as "violao" | "piano" | "baixo" | "bateria" | "voz" | "violino" | "sax"} />



        {/* Conteúdo */}
        <div className="mt-10 space-y-10">
          {apostila.sections.map((s) => {
            const SIcon = s.icon;
            return (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-8"
              >
                <header className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <SIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {s.title}
                  </h2>
                </header>
                <p className="mt-4 text-foreground/90">{s.intro}</p>

                <div className="mt-6 space-y-6">
                  {s.blocks.map((b) => (
                    <div key={b.heading}>
                      <h3 className="font-display text-base font-semibold text-primary">
                        {b.heading}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
                        {b.body}
                      </p>
                      {b.bullets && (
                        <ul className="mt-3 space-y-1.5">
                          {b.bullets.map((bl) => (
                            <li
                              key={bl}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                              <span>{bl}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="font-display text-xl font-semibold text-foreground">
            Chegou ao fim — agora pratique
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Teoria sem prática não cola. Use as ferramentas interativas.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/quiz" className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">Quiz de notas</Link>
            <Link to="/escalas" className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">Escalas</Link>
            <Link to="/acordes" className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">Acordes</Link>
            <Link to="/metronomo" className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">Metrônomo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
