import { useState } from "react";
import { Guitar, Music, Piano, Mic2, Drum, Music4, Zap, Target, Repeat, Ear, Layers, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type InstrumentId = "violao" | "guitarra" | "baixo" | "piano" | "sax" | "violino" | "bateria";

type Section = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
};

type InstrumentMethod = {
  id: InstrumentId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  sections: Section[];
};

/* ---------------- Princípios universais ---------------- */

function UniversalPrinciples() {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <p>
        Improvisar é <strong>compor em tempo real</strong>. Não é tocar escalas de baixo para cima — é criar frases com começo, meio e fim, respirar entre elas e reagir à harmonia. Antes de sair correndo pelo braço, absorva estes 5 princípios que valem pra qualquer instrumento:
      </p>

      <PrincipleCard icon={Target} title="1. Toque a harmonia, não a escala">
        A pentatônica é uma <em>paleta</em>, não uma sequência. Em cada acorde há 1–2 notas-alvo (chord tones: fundamental, 3ª, 5ª, 7ª). Faça as frases pousarem nelas — as demais notas viram passagem, tensão ou aproximação.
      </PrincipleCard>

      <PrincipleCard icon={Music4} title="2. Motivo &gt; escala">
        Escolha uma célula de 3–5 notas (motivo) e desenvolva: repita, transponha, inverta, aumente/diminua o ritmo. Uma frase curta bem trabalhada vale mais que 32 notas sem direção. Charlie Parker, B.B. King, Miles Davis — todos são reconhecíveis por motivos, não por escalas.
      </PrincipleCard>

      <PrincipleCard icon={Repeat} title="3. Chame e responda">
        Toque uma pergunta (frase ascendente, aberta). Depois responda (frase descendente, resolutiva). É a base retórica de todo solo. Deixe silêncio no meio — o ouvinte precisa processar.
      </PrincipleCard>

      <PrincipleCard icon={Ear} title="4. Roube com os ouvidos">
        90% do seu vocabulário vem de <strong>tirar de ouvido</strong> solos que você ama. Escolha uma frase de 4 compassos, tire, aprenda em 12 tons, aplique em contextos diferentes. Essa é a diferença entre estudante e improvisador.
      </PrincipleCard>

      <PrincipleCard icon={Layers} title="5. Dinâmica é 50% da mensagem">
        Comece piano, cresça, tenha um clímax, resolva. Um solo inteiro no mesmo volume é ruído. Trabalhe articulação (staccato/legato), timbre e intensidade tanto quanto notas.
      </PrincipleCard>
    </div>
  );
}

function PrincipleCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="font-display font-bold">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

/* ---------------- Metodologias por instrumento ---------------- */

const METHODS: InstrumentMethod[] = [
  {
    id: "guitarra",
    label: "Guitarra",
    Icon: Guitar,
    tagline: "CAGED, target notes, bending com intenção e vocabulário blues → jazz.",
    sections: [
      {
        title: "1. Domine as 5 caixas (CAGED)",
        icon: Layers,
        content: (
          <ul className="space-y-2">
            <li><strong>Passo 1 —</strong> aprenda a pentatônica menor no Box 1 (E-shape) em 12 tonalidades diferentes. Toque ascendente e descendente, metrônomo em 60 BPM, 8ª notas.</li>
            <li><strong>Passo 2 —</strong> conecte Box 1 ao Box 2 pela corda G (a "corda de transição"). Suba pela caixa 1, atravesse na G, desça pela caixa 2.</li>
            <li><strong>Passo 3 —</strong> improvise 4 compassos em cada box sobre um backing de blues em Am. Só pentatônica menor. Foco na tônica.</li>
            <li><strong>Passo 4 —</strong> adicione a "blue note" (b5 = trítono). Só em passagem, nunca parada.</li>
          </ul>
        ),
      },
      {
        title: "2. Target notes sobre a harmonia",
        icon: Target,
        content: (
          <>
            <p>Em progressão I-IV-V (ex: A7-D7-E7), mire nos chord tones:</p>
            <ul className="mt-2 space-y-1">
              <li>• Sobre <strong>A7</strong>: pouse em A, C# ou G</li>
              <li>• Sobre <strong>D7</strong>: pouse em D, F# ou C</li>
              <li>• Sobre <strong>E7</strong>: pouse em E, G# ou D</li>
            </ul>
            <p className="mt-2">Aproximação cromática: 1 semitom abaixo do target, resolvendo <em>no tempo forte</em>. Ex: G→G# resolvendo em A no tempo 1.</p>
          </>
        ),
      },
      {
        title: "3. Articulação — o que separa amador de músico",
        icon: Zap,
        content: (
          <ul className="space-y-2">
            <li><strong>Bend:</strong> sempre chegue afinado. Meia-tom (b3→3), tom inteiro (2→3). Estude com afinador.</li>
            <li><strong>Vibrato:</strong> nunca vibrato sem controle. Comece devagar, largura consistente.</li>
            <li><strong>Slide:</strong> conecta frases, quebra o padrão "notinha-notinha".</li>
            <li><strong>Hammer-on / pull-off:</strong> legato = fluidez. Não abuse; alterne com palhetada.</li>
            <li><strong>Palm mute:</strong> muda a energia. Use em partes B, deixe corda solta na parte A.</li>
          </ul>
        ),
      },
      {
        title: "4. Vocabulário essencial (licks para tirar)",
        icon: Ear,
        content: (
          <ul className="space-y-1.5">
            <li>• <strong>Blues:</strong> B.B. King (box 2), Stevie Ray Vaughan (Texas shuffle), Eric Clapton (Cream era)</li>
            <li>• <strong>Rock:</strong> Slash, Angus Young, David Gilmour (bending expressivo)</li>
            <li>• <strong>Fusion/Jazz:</strong> Larry Carlton, Robben Ford, Wes Montgomery (oitavas)</li>
            <li>• <strong>Brasil:</strong> Toninho Horta, Yamandu Costa, Pepeu Gomes</li>
            <li>Método: tire 4 compassos, aprenda em 12 tons, use no seu solo.</li>
          </ul>
        ),
      },
      {
        title: "5. Rotina diária (30 min)",
        icon: Repeat,
        content: (
          <ol className="space-y-1 list-decimal list-inside">
            <li>5 min — pentatônica em 2 tons novos (metrônomo)</li>
            <li>5 min — bending e vibrato afinados</li>
            <li>10 min — tirar/repetir 1 lick de referência</li>
            <li>10 min — improvisar sobre backing track (grave e ouça depois)</li>
          </ol>
        ),
      },
    ],
  },

  {
    id: "violao",
    label: "Violão",
    Icon: Guitar,
    tagline: "Dedilhado + linha melódica na mesma mão. Fluência com harmonia.",
    sections: [
      {
        title: "1. Solo dentro do acorde",
        icon: Layers,
        content: (
          <p>
            No violão, o solo raramente fica isolado — você toca <strong>baixo + acorde + melodia</strong> simultaneamente. Estude "chord melody": pegue uma música (ex: <em>Garota de Ipanema</em>) e coloque a melodia na 1ª ou 2ª corda enquanto o polegar mantém o baixo.
          </p>
        ),
      },
      {
        title: "2. Técnica de mão direita",
        icon: Zap,
        content: (
          <ul className="space-y-2">
            <li><strong>PIMA:</strong> polegar (P) faz baixos, indicador (I), médio (M), anular (A) fazem a melodia e harmonia.</li>
            <li><strong>Rest stroke (apoyando):</strong> dedo apoia na corda seguinte após tocar. Som forte, ideal pra solo.</li>
            <li><strong>Free stroke (tirando):</strong> dedo levanta. Ideal pra arpejo e acompanhamento.</li>
            <li>Unhas curtas mas polidas: som mais brilhante e controle preciso.</li>
          </ul>
        ),
      },
      {
        title: "3. Improvisação em choro e bossa",
        icon: Music4,
        content: (
          <ul className="space-y-1.5">
            <li>• <strong>Choro:</strong> pentatônica + cromatismos ligando I-IV-V. Muito legato, pouca palhetada seca.</li>
            <li>• <strong>Bossa Nova:</strong> improvise <em>com espaço</em>. Notas longas, dinâmica suave, síncopes no baixo.</li>
            <li>• <strong>Samba-jazz:</strong> pentatônica maior + 6ª. Muitos ghost notes com o polegar.</li>
            <li>Referências: Baden Powell, Toninho Horta, Guinga, Yamandu Costa.</li>
          </ul>
        ),
      },
      {
        title: "4. Conectando pentatônica com harmonia",
        icon: Target,
        content: (
          <p>Em um IIm7-V7-Imaj7 (Dm7-G7-Cmaj7), toque a <strong>pentatônica maior de C</strong> em todo o ciclo — funciona porque contém a 9ª de Dm7, a 13ª de G7 e a fundamental de Cmaj7. Depois experimente pentatônica maior de <strong>G</strong> em cima de Cmaj7: gera 3-5-6-9-13, uma sonoridade lídica.</p>
        ),
      },
    ],
  },

  {
    id: "baixo",
    label: "Baixo",
    Icon: Music,
    tagline: "Groove primeiro. Solo é temperar sem perder a função rítmica.",
    sections: [
      {
        title: "1. Antes do solo: o groove é sagrado",
        icon: Repeat,
        content: (
          <p>
            Baixo não é guitarra com 4 cordas. Sua função primária é <strong>ligar bateria e harmonia</strong>. Um baixista que solo demais atrapalha a banda. Regra: aprenda 100 grooves antes de aprender 10 licks.
          </p>
        ),
      },
      {
        title: "2. Walking bass — a base da improvisação",
        icon: Layers,
        content: (
          <ul className="space-y-2">
            <li><strong>Tempo 1:</strong> fundamental do acorde.</li>
            <li><strong>Tempo 2:</strong> chord tone (3ª, 5ª, 7ª) ou nota de passagem diatônica.</li>
            <li><strong>Tempo 3:</strong> outro chord tone.</li>
            <li><strong>Tempo 4:</strong> <em>approach note</em> — 1 semitom acima ou abaixo da fundamental do próximo acorde.</li>
            <li>Isso já é 90% da improvisação de baixo em jazz. Domine em blues antes de tocar em standards.</li>
          </ul>
        ),
      },
      {
        title: "3. Solo com pentatônica no baixo",
        icon: Music4,
        content: (
          <ul className="space-y-2">
            <li>• Suba a pentatônica <strong>cruzando as 4 cordas</strong> sem deslocar a mão — é o "box" do baixo.</li>
            <li>• Use <strong>ghost notes</strong> (nota abafada com a mão esquerda) pra manter groove enquanto solo.</li>
            <li>• Slap &amp; pop: tônica no polegar, oitava com o indicador. Muito eficaz em pentatônica menor.</li>
            <li>• Toque na região aguda (12ª casa pra cima) pra o solo se destacar do bumbo.</li>
          </ul>
        ),
      },
      {
        title: "4. Referências obrigatórias",
        icon: Ear,
        content: (
          <ul className="space-y-1.5">
            <li>• <strong>Jaco Pastorius</strong> — pai do baixo moderno, pentatônica + harmônicos.</li>
            <li>• <strong>Marcus Miller</strong> — slap com groove impecável.</li>
            <li>• <strong>Arthur Maia, Alberto Continentino, Nico Assumpção</strong> — baixistas brasileiros de referência.</li>
            <li>• <strong>Victor Wooten</strong> — técnica extrema, mas sempre a serviço do groove.</li>
          </ul>
        ),
      },
      {
        title: "5. Trocando solo com a bateria",
        icon: Target,
        content: (
          <p>"Trading fours": você toca 4 compassos, baterista toca 4. Ao improvisar, cite ritmicamente o que ele acabou de tocar — mesmo com notas diferentes. Isso cria diálogo real.</p>
        ),
      },
    ],
  },

  {
    id: "piano",
    label: "Piano / Teclado",
    Icon: Piano,
    tagline: "Duas mãos, dois papéis: harmonia + melodia dialogando.",
    sections: [
      {
        title: "1. Separação de mãos",
        icon: Layers,
        content: (
          <ul className="space-y-2">
            <li><strong>Mão esquerda:</strong> voicings de 3ª+7ª (as guide tones). Ex: em Cmaj7 → E+B; em Dm7 → F+C. Simples e rico.</li>
            <li><strong>Mão direita:</strong> solo com pentatônica + chord tones + tensões (9, 11, 13).</li>
            <li>A esquerda toca em <em>colcheias sincopadas</em>, a direita fica livre pra frasear.</li>
          </ul>
        ),
      },
      {
        title: "2. Vocabulário de voicings",
        icon: Music4,
        content: (
          <ul className="space-y-1.5">
            <li>• <strong>Rootless (Bill Evans):</strong> 3-5-7-9 na esquerda, sem fundamental (o baixo faz).</li>
            <li>• <strong>Quartais (McCoy Tyner):</strong> 4ªs empilhadas, sonoridade modal aberta.</li>
            <li>• <strong>Drop 2:</strong> pegue a 2ª voz de cima e leve uma oitava abaixo. Voicing largo e brilhante.</li>
            <li>• <strong>Shell:</strong> só fundamental+7ª ou fundamental+3ª. Espaço pra melodia respirar.</li>
          </ul>
        ),
      },
      {
        title: "3. Improviso com pentatônica no piano",
        icon: Target,
        content: (
          <>
            <p>Dedilhado da pentatônica maior de C (subindo): <strong>1-2-3 - 1-2</strong> (polegar passa por baixo do dedo 3), oitava acima repete. Descendo: <strong>2-1 - 3-2-1</strong>.</p>
            <p className="mt-2">Explore <em>side-slipping</em>: toque pentatônica meio-tom acima/abaixo por 1 compasso e volte. Cria tensão e resolução instantânea.</p>
          </>
        ),
      },
      {
        title: "4. Comping para si mesmo",
        icon: Repeat,
        content: (
          <p>Deixe frases da mão direita e responda com um "kick" (acorde curto) da mão esquerda no espaço. É como conversar sozinho. Herbie Hancock e Chick Corea são mestres nisso.</p>
        ),
      },
      {
        title: "5. Referências",
        icon: Ear,
        content: (
          <p><strong>Bill Evans</strong> (lirismo), <strong>Herbie Hancock</strong> (modal), <strong>Chick Corea</strong> (motívico), <strong>Oscar Peterson</strong> (bebop), <strong>César Camargo Mariano</strong> e <strong>Amilton Godoy</strong> (piano brasileiro).</p>
        ),
      },
    ],
  },

  {
    id: "sax",
    label: "Saxofone",
    Icon: Mic2,
    tagline: "Linguagem bebop, sopro contínuo e articulação são a alma do solo.",
    sections: [
      {
        title: "1. Sopro antes de nota",
        icon: Zap,
        content: (
          <p>
            No sax, <strong>som &gt; velocidade</strong>. Trabalhe long tones diariamente (10 min): uma nota, respiração diafragmática, sustente 20 segundos. Depois notas longas com crescendo/decrescendo. Isso é o que separa um sax bonito de um "sax de igreja gritando".
          </p>
        ),
      },
      {
        title: "2. Articulação — a língua faz música",
        icon: Music4,
        content: (
          <ul className="space-y-2">
            <li><strong>Tonguing simples ("tu"):</strong> ataque limpo, cada nota.</li>
            <li><strong>Legato:</strong> só a primeira atacada, as seguintes ligadas — som "cantável".</li>
            <li><strong>Ghost notes:</strong> ataque sem pressão de língua, dá o "hup" característico do bebop.</li>
            <li><strong>Growl:</strong> cantar dentro do bocal enquanto toca. Uso pontual, muito expressivo.</li>
            <li><strong>Falls, doits, scoops:</strong> "temperos" do sax — glissandos rápidos que só o sax faz.</li>
          </ul>
        ),
      },
      {
        title: "3. Linguagem bebop (Charlie Parker)",
        icon: Ear,
        content: (
          <ul className="space-y-1.5">
            <li>• <strong>Enclosure:</strong> aproxime a target note por 2 notas — 1 acima diatônica, 1 abaixo cromática, resolve.</li>
            <li>• <strong>Bebop scale:</strong> escala mixolídia + b7 → 7 (nota cromática) — 8 notas, encaixa perfeito em colcheias.</li>
            <li>• Tire solos de Parker (<em>Confirmation</em>, <em>Now's The Time</em>), aprenda 4 compassos de cada por semana em 12 tons.</li>
          </ul>
        ),
      },
      {
        title: "4. Pentatônica no sax — não é só bebop",
        icon: Target,
        content: (
          <p>
            Pentatônica funciona demais em modal, funk, fusion. Michael Brecker construiu carreira em cima disso. Use pentatônica menor da <strong>relativa menor</strong> ou pentatônica menor <strong>1 tom acima da tônica</strong> (dá sonoridade dórica).
          </p>
        ),
      },
      {
        title: "5. Sax é transpositor — cuidado",
        icon: Layers,
        content: (
          <ul className="space-y-1.5">
            <li>• <strong>Sax alto (Eb):</strong> pra soar em C, você toca em A (+9 semitons).</li>
            <li>• <strong>Sax tenor (Bb):</strong> pra soar em C, você toca em D (+14 semitons = +2 semitons na oitava seguinte).</li>
            <li>• Ao ler cifras: transponha antes de escolher a escala. Um Cmaj7 no lead-sheet vira Amaj7 no alto e Dmaj7 no tenor.</li>
          </ul>
        ),
      },
      {
        title: "6. Referências",
        icon: Ear,
        content: (
          <p><strong>Cannonball Adderley</strong>, <strong>Charlie Parker</strong>, <strong>John Coltrane</strong>, <strong>Michael Brecker</strong>, <strong>Kenny Garrett</strong>. Brasil: <strong>Léo Gandelman</strong>, <strong>Zé Canuto</strong>, <strong>Nailor "Proveta"</strong>.</p>
        ),
      },
    ],
  },

  {
    id: "violino",
    label: "Violino",
    Icon: Music4,
    tagline: "Arco expressivo, ornamentação e mudanças de posição fluidas.",
    sections: [
      {
        title: "1. Arco = sopro",
        icon: Zap,
        content: (
          <p>
            O arco é sua "respiração". Um solo bonito no violino não é sobre notas rápidas, é sobre <strong>distribuição do arco</strong>: notas longas usam o arco todo; notas curtas usam a ponta ou o talão; frases legatas mantêm direção do arco.
          </p>
        ),
      },
      {
        title: "2. Ornamentação (essencial no violino)",
        icon: Music4,
        content: (
          <ul className="space-y-2">
            <li><strong>Trill:</strong> alternância rápida entre a nota e a superior diatônica.</li>
            <li><strong>Grace note (apojatura):</strong> nota curtíssima antes do tempo forte.</li>
            <li><strong>Glissando:</strong> deslize suave entre notas — essencial em jazz e música brasileira.</li>
            <li><strong>Vibrato:</strong> comece de nota longa, largura moderada. Sem vibrato = som "duro".</li>
            <li><strong>Pizzicato:</strong> mão direita beliscando corda, som percussivo.</li>
          </ul>
        ),
      },
      {
        title: "3. Mudança de posição",
        icon: Layers,
        content: (
          <p>
            Solar só em 1ª posição limita muito. Aprenda 2ª, 3ª e 5ª posições. A troca é feita <em>durante uma nota</em>, geralmente com glissando disfarçado ou em corda solta (E, A, D, G). Estude escalas em 3 oitavas subindo por posição.
          </p>
        ),
      },
      {
        title: "4. Improvisação em choro, jazz manouche e clássico moderno",
        icon: Music4,
        content: (
          <ul className="space-y-1.5">
            <li>• <strong>Choro:</strong> use ornamento constante (trill, mordente), pentatônica + notas cromáticas.</li>
            <li>• <strong>Jazz manouche (Stéphane Grappelli):</strong> pentatônica + arpejos + swing forte.</li>
            <li>• <strong>Fusion:</strong> Jean-Luc Ponty, Jerry Goodman — pentatônica com pedal de efeito.</li>
            <li>• Referências brasileiras: Ricardo Herz, Nicolas Krassik.</li>
          </ul>
        ),
      },
      {
        title: "5. Cordas duplas",
        icon: Target,
        content: (
          <p>Toque 2 cordas simultaneamente — a inferior segura a tônica ou 5ª (pedal), a superior faz melodia. Recurso poderoso pra "acompanhar-se" durante o solo.</p>
        ),
      },
    ],
  },

  {
    id: "bateria",
    label: "Bateria",
    Icon: Drum,
    tagline: "Solo de bateria conta história rítmica. Não é sobre velocidade, é sobre forma.",
    sections: [
      {
        title: "1. Solo sobre a forma (essencial)",
        icon: Target,
        content: (
          <p>
            Baterista de verdade improvisa <strong>dentro da forma da música</strong>. Se a música tem 32 compassos (AABA), seu solo tem 32 compassos. Marque o "um" mental de cada compasso, faça breaks nos finais de seção. Nunca perca o pulso.
          </p>
        ),
      },
      {
        title: "2. Rudimentos aplicados",
        icon: Layers,
        content: (
          <ul className="space-y-2">
            <li><strong>Single stroke (RLRL):</strong> a base de tudo. Pratique com metrônomo, do lento ao rápido.</li>
            <li><strong>Double stroke (RRLL):</strong> essencial para preencher tempo.</li>
            <li><strong>Paradiddle (RLRR LRLL):</strong> desloca acento, cria groove.</li>
            <li><strong>Flam:</strong> ataque com "chuveirinho" — engrossa a batida.</li>
            <li>Aplique rudimentos <em>orquestrados</em> nos tambores diferentes (caixa → tom → surdão).</li>
          </ul>
        ),
      },
      {
        title: "3. Dinâmica e textura",
        icon: Zap,
        content: (
          <ul className="space-y-1.5">
            <li>• Comece o solo <strong>piano</strong> — só bumbo e caixa em ghost notes.</li>
            <li>• Cresça adicionando pratos (chimbal fechado → aberto → crash).</li>
            <li>• Clímax: toms, surdão e crash.</li>
            <li>• Encerre voltando ao groove — o resto da banda entra e a música continua.</li>
          </ul>
        ),
      },
      {
        title: "4. Trading (4/4 e 8/8)",
        icon: Repeat,
        content: (
          <p>Trading fours = 4 compassos de solo de instrumento, 4 de bateria, alternando. Ouça <strong>o que o solista tocou</strong> e responda ritmicamente — mesmo groove, mesmas subdivisões. Isso mostra escuta e conexão.</p>
        ),
      },
      {
        title: "5. Solar em pentatônica? Como assim?",
        icon: Music4,
        content: (
          <p>
            A bateria não tem altura definida, mas pode <em>sugerir</em> uma sonoridade. Tom-tons afinados em intervalos da pentatônica (ex: A-C-D-E-G) permitem melodia percussiva. Steve Gadd, Vinnie Colaiuta e Jojo Mayer usam isso. Explore com afinação criativa.
          </p>
        ),
      },
      {
        title: "6. Referências",
        icon: Ear,
        content: (
          <p><strong>Elvin Jones</strong> (polirritmia), <strong>Tony Williams</strong> (jazz moderno), <strong>Steve Gadd</strong> (groove), <strong>Vinnie Colaiuta</strong> (fusion), <strong>Jojo Mayer</strong> (drum'n'bass). Brasil: <strong>Zé Eduardo Nazário</strong>, <strong>Robertinho Silva</strong>, <strong>Kiko Freitas</strong>.</p>
        ),
      },
    ],
  },
];

/* ---------------- Componente principal ---------------- */

export function ImprovisationMethodology() {
  const [selected, setSelected] = useState<InstrumentId | "universal">("universal");
  const active = selected === "universal" ? null : METHODS.find((m) => m.id === selected);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Como Improvisar
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha "Princípios universais" para a base que serve a qualquer músico, ou clique no seu instrumento para a metodologia específica: técnica, vocabulário, licks-referência e rotina de estudo.
        </p>
      </div>

      {/* Seletor */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelected("universal")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              selected === "universal" ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <Layers className="h-4 w-4" /> Princípios universais
          </button>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                selected === m.id ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              <m.Icon className="h-4 w-4" /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {selected === "universal" ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-xl font-bold">5 princípios que valem pra qualquer instrumento</h3>
          <UniversalPrinciples />
        </div>
      ) : active ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
            <active.Icon className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-display text-xl font-bold">Improvisação — {active.label}</h3>
              <p className="text-xs text-muted-foreground">{active.tagline}</p>
            </div>
          </div>

          <div className="space-y-5">
            {active.sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" />
                  <h4 className="font-display font-bold">{s.title}</h4>
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_em]:text-foreground/90">
                  {s.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-primary/10 border border-primary/30 p-3 text-xs flex items-start gap-2">
            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Aplique agora:</strong> volte para a aba "Escalas &amp; Modos", escolha uma tonalidade, abra um modo grego e improvise sobre a pentatônica modal usando os conceitos acima. Grave 2 minutos, ouça, ajuste. Repita.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
