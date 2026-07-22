import { useState } from "react";
import { cn } from "@/lib/utils";
import { Flame, Music2 } from "lucide-react";

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
type InstId = typeof INSTRUMENTS[number]["id"];

type Section = { title: string; body: string; bullets?: string[] };
type Content = {
  vibe: string;
  scales: string[];
  chords: string[];
  rhythm: string;
  sections: Section[];
  references: { artist: string; tune: string }[];
};

const CONTENT: Record<InstId, Content> = {
  guitarra: {
    vibe: "Acordes soltos, tensões (9, 11, 13), slides curtos e ghost notes. Pense em Isaiah Sharkey, Mateus Asato, Melanie Faye e Cory Wong (funk-gospel).",
    scales: ["Pentatônica menor com blue note (b5)", "Dórica (menor com 6ª maior)", "Mixolídia (dominante gospel)", "Pentatônica maior sobre IV e V"],
    chords: ["m9, m11, 7#9, 13, maj9", "Voicings drop-2 nas cordas 5-4-3-2", "Passagens cromáticas entre II-V-I"],
    rhythm: "16 avos com swing leve (55–60%). Deixe espaços — não preencha tudo. Ghost strums abafados com a palma somando percussão.",
    sections: [
      {
        title: "Comping neo soul (16 avos)",
        body: "Segure o acorde base e adicione hammer-ons/pull-offs nas tensões (9→b3, 11→3). Muteie com a base da mão para criar textura percussiva entre os acordes.",
        bullets: [
          "Use acordes com 4 notas no máximo — deixe respirar",
          "Adicione slides de meio tom entrando no acorde (do bVII para I)",
          "Trabalhe double-stops nas cordas 3-2 com bends de 1/4 de tom",
        ],
      },
      {
        title: "Improviso lick vocabulary",
        body: "Sobreponha pentatônica menor da tônica + pentatônica menor 1 tom acima (ex.: Am + Bm sobre A7). Isso cria a sonoridade 'dominante alterada' típica do gospel.",
        bullets: [
          "Bends de 1/4 (blue note) na b5 e b3",
          "Legato: hammer + slide + pull no mesmo compasso",
          "Frase e respire — deixe o baterista responder",
        ],
      },
      {
        title: "Groove Kirk Franklin / Fred Hammond",
        body: "Sequência clássica: Im9 – IVm9 – bVII13 – III7#9. Toque em 16 avos com muting no 'e' e 'a' de cada tempo.",
      },
    ],
    references: [
      { artist: "Isaiah Sharkey", tune: "com John Mayer / D'Angelo" },
      { artist: "Melanie Faye", tune: "Miss Understood" },
      { artist: "Mateus Asato", tune: "Live improvisations" },
      { artist: "Cory Wong", tune: "Cosmic Sans" },
    ],
  },
  violao: {
    vibe: "Neo soul acústico à la Daniel Caesar, Tom Misch. Fingerstyle com bass alternado + acordes com tensões abertas.",
    scales: ["Dórica", "Pentatônica menor + blue note", "Maior com 4# (Lídia) em passagens"],
    chords: ["maj7, m7, m9, 6/9, sus2", "Formas com cordas soltas (drone) na 1ª e 2ª"],
    rhythm: "Fingerstyle p-i-m-a com swing 16. Percussão no tampo entre acordes (slap com o polegar).",
    sections: [
      {
        title: "Fingerstyle groovado",
        body: "Polegar mantém a tônica em semínimas; i-m-a fazem contratempo em 16 avos. Adicione hammer-on da 9 para 3 dentro de cada acorde.",
      },
      {
        title: "Voicings preferidos",
        body: "Use cordas soltas como pedal — ex.: Cmaj9 (x32030), Am11 (x02010), Fmaj7#11 (x03210). Menos dedos, mais espaço.",
      },
    ],
    references: [
      { artist: "Daniel Caesar", tune: "Best Part" },
      { artist: "Tom Misch", tune: "Movie" },
      { artist: "Jorja Smith / Preditah", tune: "On My Mind" },
    ],
  },
  baixo: {
    vibe: "Groove é rei. Pense Pino Palladino (D'Angelo Voodoo), Sharay Reed (Kirk Franklin), MonoNeon, Thundercat. Notas atrasadas de propósito (behind the beat).",
    scales: ["Pentatônica menor", "Dórica", "Blues híbrido (com b5 e maj3)"],
    chords: ["Arpejos de m7, m9 e 13", "Aproximações cromáticas para a tônica"],
    rhythm: "Slap opcional. O segredo é o pocket: toque o 'e' do 2 e o 'a' do 4 atrás do tempo. Ghost notes constantes.",
    sections: [
      {
        title: "Pocket 'behind the beat'",
        body: "Coloque a tônica no 1 exatamente no click. As notas dos tempos 2, 3 e 4 saem 15–30ms depois do metronomo. Sensação de 'peso' — nunca corra.",
      },
      {
        title: "Linhas gospel (walking modal)",
        body: "Sobre Im9 – IVm9: toque tônica – 5ª – b7 – 8ª e desça cromaticamente para a IV. Use ghost notes (dedo mão direita batendo abafado) entre as notas reais.",
      },
      {
        title: "Slap tasteful",
        body: "Slap no 1, pop no 'e' do 2. Não exagere. Kirk Franklin usa slap como acento, não como base.",
      },
    ],
    references: [
      { artist: "Pino Palladino (D'Angelo)", tune: "Untitled (How Does It Feel)" },
      { artist: "Sharay Reed", tune: "com Kirk Franklin" },
      { artist: "MonoNeon", tune: "com Prince" },
      { artist: "Thundercat", tune: "Them Changes" },
    ],
  },
  banjo: {
    vibe: "Uso raro no gospel americano moderno, mas incrível em fusões folk-gospel. Rolls Scruggs sobre acordes m9 criam textura única.",
    scales: ["Pentatônica menor em G", "Modal (dórica em Am, Dm)"],
    chords: ["m7, maj7, 7 com cordas soltas", "Drones abertos (G, D)"],
    rhythm: "Rolls forward (T-I-M-T-I-M) sobre acordes espaçados. Deixe a 5ª corda como drone.",
    sections: [
      {
        title: "Roll gospel-folk",
        body: "Use forward roll sobre Am9 – Dm9 – G7 – Cmaj7. Deixe a 5ª corda soar como pedal — cria a sensação de trance típica do gospel contemplativo.",
      },
    ],
    references: [
      { artist: "Béla Fleck", tune: "gospel-jazz crossover" },
      { artist: "Rhiannon Giddens", tune: "spirituals modernos" },
    ],
  },
  piano: {
    vibe: "Coração do gospel/neo soul. Cory Henry, Jonathan McReynolds, Robert Glasper, D'Angelo. Voicings de 4ª empilhadas, gospel chops e passing chords.",
    scales: ["Dórica", "Mixolídia b6", "Blues", "Lídia b7 (para dominantes)"],
    chords: ["m9, m11, 13, 7alt, maj7#11, sus4", "Passing chords diminutos entre I e ii"],
    rhythm: "Left-hand toca 1 e 3, right-hand comping em 16 avos. Muito uso de tercinas contra 4 (polirritmo 3:4).",
    sections: [
      {
        title: "Voicings gospel (mão direita)",
        body: "Quartas empilhadas: sobre Cm9 toque G-C-F-Bb (em vez de C-Eb-G-Bb). Cria a sonoridade 'moderna' de Herbie Hancock/Robert Glasper.",
        bullets: [
          "Sempre inclua a 9 e a 11",
          "Passe cromaticamente de baixo para cima (chord planing)",
          "Use grace notes de meio tom antes de cada acorde",
        ],
      },
      {
        title: "Gospel chops",
        body: "Padrão clássico: I – IV/I – bVII/I – I. Toque o baixo pedal com a mão esquerda e mova acordes triádicos com passing diminutos na direita.",
      },
      {
        title: "Kirk Franklin sequence",
        body: "Cm9 – Fm9 – Bb13 – Ebmaj9 – Ab13 – G7#9 – Cm9. Ritmo em 16 com anticipações do 'e' de 4 para o 1.",
      },
    ],
    references: [
      { artist: "Cory Henry", tune: "Naaman" },
      { artist: "Robert Glasper", tune: "Cherish The Day" },
      { artist: "Jonathan McReynolds", tune: "Cycles" },
      { artist: "D'Angelo (Voodoo)", tune: "Send It On" },
    ],
  },
  teclado: {
    vibe: "Rhodes elétrico é o timbre padrão. Adicione chorus + tremolo suave. Wurlitzer para gospel mais roots. Synth pad no fundo.",
    scales: ["Dórica", "Mixolídia b6", "Blues"],
    chords: ["m9, m11, 13, sus4", "Voicings em quartas"],
    rhythm: "Comping em 16 avos com espaço. Deixe o baixo e a bateria respirarem.",
    sections: [
      {
        title: "Rhodes tone setup",
        body: "Rhodes MK1 com bell suave (velocity ~90). Chorus stereo (rate 0.5Hz, depth 30%). Reverb plate curto (1.2s). Compressor 2:1 para colar o groove.",
      },
      {
        title: "Layers gospel",
        body: "Camada 1: Rhodes fazendo acordes. Camada 2: Pad string vindo do 'e' de 3 para o 1 (swells). Camada 3: Órgão Hammond B3 para clímax (drawbars 88 8000 000).",
      },
    ],
    references: [
      { artist: "Cory Henry (Hammond)", tune: "Snarky Puppy - Lingus" },
      { artist: "James Poyser", tune: "com Erykah Badu / The Roots" },
    ],
  },
  sax: {
    vibe: "Kirk Whalum, Kenny Garrett, Kamasi Washington gospel-jazz. Frases vocais, growls, bends e altissimo emotivo.",
    scales: ["Blues", "Dórica", "Pentatônica menor + blue note", "Bebop menor para passagens"],
    chords: ["Improviso sobre m9, 13, 7alt"],
    rhythm: "Frases começam atrás do tempo. Termine com vibrato largo e crescendo. Silêncio entre frases é parte da mensagem.",
    sections: [
      {
        title: "Vocabulário gospel-sax",
        body: "Comece frases na b3, suba para a 5 com bend, resolva na 8ª com growl. Copie fraseado vocal: cante a frase antes de tocar.",
      },
      {
        title: "Efeitos expressivos",
        body: "Growl (cantarolar enquanto sopra), altissimo (notas acima do fá agudo com harmônicos), bend de meio tom subindo em finais de frase.",
      },
    ],
    references: [
      { artist: "Kirk Whalum", tune: "The Gospel According to Jazz" },
      { artist: "Kenny Garrett", tune: "Sing a Song of Song" },
      { artist: "Kamasi Washington", tune: "Truth" },
    ],
  },
  violino: {
    vibe: "Menos comum mas poderoso — pense em Damien Escobar, Miri Ben-Ari (hip-hop/gospel). Uso de pizzicato groovado e legato com muito vibrato.",
    scales: ["Pentatônica menor", "Blues", "Dórica"],
    chords: ["Double stops em 3ªs e 6ªs"],
    rhythm: "Pizzicato em 16 avos como se fosse guitarra rítmica. Arco para clímax vocal.",
    sections: [
      {
        title: "Pizz groove",
        body: "Segure o violino como bandolim/ukulele para pizz rítmico. Alterne pizz com arco para dinâmica.",
      },
      {
        title: "Solo emotivo",
        body: "Comece na região média, suba gradualmente. Use portamento (glissando lento) entre notas — imita voz gospel.",
      },
    ],
    references: [
      { artist: "Damien Escobar", tune: "Freedom" },
      { artist: "Miri Ben-Ari", tune: "Symphony of Brotherhood" },
    ],
  },
  flauta: {
    vibe: "Instrumento pouco tradicional no gospel, mas funciona lindo em intros contemplativas e camadas orquestrais.",
    scales: ["Pentatônica menor", "Dórica", "Blues (para cor)"],
    chords: ["Melodias sobre m9, maj9"],
    rhythm: "Frases longas e legato. Use como contramelodia da voz.",
    sections: [
      {
        title: "Uso em arranjo",
        body: "Toque a melodia principal uma oitava acima da voz nas seções de refrão. Nas estrofes, faça respostas curtas nos espaços vocais.",
      },
    ],
    references: [
      { artist: "Hubert Laws", tune: "gospel-jazz flute" },
      { artist: "Bobbi Humphrey", tune: "Harlem River Drive" },
    ],
  },
  bateria: {
    vibe: "Coração do gospel groove. Chris Coleman, Aaron Spears, Calvin Rodgers, Tony Royster Jr., Nate Smith (neo soul). Linguagem baseada em ghost notes, hi-hat picado e bumbo sincopado.",
    scales: [],
    chords: [],
    rhythm: "Groove em 16 avos com swing 55–58%. Bumbo pisa no 1 e no 'a' do 2 ou 'e' do 3. Caixa no 2 e 4 com ghost notes entre.",
    sections: [
      {
        title: "Gospel chops groove (base)",
        body: "Hi-hat em 16 avos com abertura no 'e' de cada tempo. Caixa forte no 2 e 4. Ghost notes de caixa nos 'e' e 'a'. Bumbo: 1, +2e, 3, +4a (sincopado).",
        bullets: [
          "Toque a caixa deslocada 5–15ms atrás do click (behind the beat)",
          "Hi-hat com pé abrindo no 'a' de cada tempo (chick)",
          "Bumbo duplo ocasional no 'e-a' do 4 para conduzir ao 1",
        ],
      },
      {
        title: "Linked fills (Aaron Spears)",
        body: "Divida a virada em sextinas ou 32 avos, alternando mãos entre tons + caixa + prato china. Termine sempre no 1 com crash + bumbo.",
      },
      {
        title: "Pocket D'Angelo (drunk feel)",
        body: "Estilo Questlove em Voodoo: caixa muito atrás do tempo, bumbo em cima, hi-hat exatamente no click. Cria a sensação 'tropeço controlado'.",
      },
      {
        title: "Kirk Franklin worship groove",
        body: "Meio tempo (half-time). Caixa apenas no 3. Bumbo em colcheias com síncope no 'a' do 2. Muito ghost note. Reserve as viradas para transições de seção.",
      },
    ],
    references: [
      { artist: "Chris Coleman", tune: "com Kirk Franklin - Imagine Me" },
      { artist: "Aaron Spears", tune: "com Usher / gospel clinics" },
      { artist: "Calvin Rodgers", tune: "com Fred Hammond" },
      { artist: "Questlove", tune: "D'Angelo - Voodoo album inteiro" },
      { artist: "Nate Smith", tune: "Pocket Change" },
    ],
  },
};

export function NeoSoulGospelPanel() {
  const [inst, setInst] = useState<InstId>("piano");
  const c = CONTENT[inst];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
          <Flame className="h-3.5 w-3.5" /> Groove Neo Soul • Black Music • Gospel Americano
        </div>
        <h2 className="font-display text-2xl font-bold">Dinâmica de execução</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Como tocar com o feel de Kirk Franklin, Fred Hammond, D'Angelo, Cory Henry, Robert Glasper, Tye Tribbett e a geração gospel/neo soul americana. Selecione seu instrumento.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className="mb-3 block text-sm font-medium text-muted-foreground">Instrumento</label>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENTS.map((i) => (
            <button
              key={i.id}
              onClick={() => setInst(i.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                inst === i.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Music2 className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xl font-bold">{INSTRUMENTS.find(i => i.id === inst)?.label}</h3>
        </div>

        <div className="mb-5 rounded-xl bg-muted/40 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Vibe geral</div>
          <p className="text-sm leading-relaxed">{c.vibe}</p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {c.scales.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escalas</div>
              <ul className="space-y-1 text-sm">
                {c.scales.map((s) => <li key={s}>• {s}</li>)}
              </ul>
            </div>
          )}
          {c.chords.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acordes / harmonia</div>
              <ul className="space-y-1 text-sm">
                {c.chords.map((s) => <li key={s}>• {s}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Ritmo & feel</div>
          <p className="text-sm leading-relaxed">{c.rhythm}</p>
        </div>

        <div className="space-y-3">
          {c.sections.map((s) => (
            <div key={s.title} className="rounded-xl border border-border p-4">
              <div className="mb-2 font-semibold">{s.title}</div>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              {s.bullets && (
                <ul className="mt-2 space-y-1 text-sm">
                  {s.bullets.map((b) => <li key={b}>→ {b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-muted/40 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referências para estudar</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {c.references.map((r) => (
              <a
                key={r.artist + r.tune}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(r.artist + " " + r.tune)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-sm hover:bg-primary/10"
              >
                <span><span className="font-semibold">{r.artist}</span> — <span className="text-muted-foreground">{r.tune}</span></span>
                <span className="text-xs text-primary">YouTube ↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-bold">Progressões gospel/neo soul clássicas</h3>
        <div className="space-y-2 text-sm">
          <div className="rounded-lg bg-muted/40 p-3"><span className="font-semibold text-primary">Kirk Franklin loop:</span> Im9 – IVm9 – bVII13 – bIIImaj9</div>
          <div className="rounded-lg bg-muted/40 p-3"><span className="font-semibold text-primary">D'Angelo Voodoo:</span> Im7 – bIIImaj7 – IVm7 – bVII7 (com anticipações)</div>
          <div className="rounded-lg bg-muted/40 p-3"><span className="font-semibold text-primary">Fred Hammond worship:</span> I – iii – IV – I/V – vi – IV – V (com passing dim)</div>
          <div className="rounded-lg bg-muted/40 p-3"><span className="font-semibold text-primary">Neo soul II-V-I:</span> iim11 – V13(b9) – Imaj9#11</div>
          <div className="rounded-lg bg-muted/40 p-3"><span className="font-semibold text-primary">Tye Tribbett shout:</span> I – bVII – IV – I (up-tempo, 16 avos com quebras)</div>
        </div>
      </div>
    </div>
  );
}
