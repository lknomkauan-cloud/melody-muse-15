import { useMemo, useState } from "react";
import { GraduationCap, Loader2, Sparkles, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askInstrumentCoach } from "@/lib/instrument-coach.functions";
import { cn } from "@/lib/utils";

type CoachTopic = { id: string; label: string; topic: string; context?: string };

type CoachConfig = {
  title: string;
  tagline: string;
  groups: Array<{ heading: string; topics: CoachTopic[] }>;
};

const CONFIGS: Record<string, CoachConfig> = {
  sax: {
    title: "Professor de Sax (IA)",
    tagline: "Embocadura, palhetas, articulação e afinação — pergunte ou escolha um tópico.",
    groups: [
      {
        heading: "Técnica",
        topics: [
          { id: "emb", label: "Embocadura correta", topic: "Embocadura correta para não estourar nem oitavar sem querer" },
          { id: "art", label: "Articulação (tonguing)", topic: "Articulação com a língua: staccato, legato e ghost notes" },
          { id: "long", label: "Long tones diários", topic: "Rotina de long tones de 10 minutos para som encorpado" },
          { id: "resp", label: "Respiração diafragmática", topic: "Respiração diafragmática e sustentação da coluna de ar" },
        ],
      },
      {
        heading: "Afinação e som",
        topics: [
          { id: "afin", label: "Como afinar o sax", topic: "Como afinar o sax (bocal, altura da coluna de ar) e o que causa nota alta/baixa" },
          { id: "pal", label: "Escolher palheta certa", topic: "Como escolher dureza de palheta (1.5 a 4) e marcas para iniciante/intermediário/avançado" },
          { id: "cor", label: "Corrigir nota desafinada", topic: "Como corrigir uma nota que soa consistentemente flat ou sharp no sax" },
        ],
      },
      {
        heading: "Estilos",
        topics: [
          { id: "jazz", label: "Fraseado jazz", topic: "Como construir fraseado bebop com escalas bebop e enclosures", context: "sax alto/tenor no jazz" },
          { id: "gospel", label: "Sax em worship/gospel", topic: "Timbre e fraseado de sax em worship/gospel brasileiro" },
          { id: "sertanejo", label: "Sax em MPB/sertanejo", topic: "Como tocar sax em MPB e sertanejo universitário sem soar 'jazzístico demais'" },
        ],
      },
    ],
  },
  violino: {
    title: "Professor de Violino (IA)",
    tagline: "Postura de arco, afinação, mudanças de posição e vibrato.",
    groups: [
      {
        heading: "Postura e arco",
        topics: [
          { id: "arco", label: "Segurar o arco (Franco-Belga)", topic: "Como segurar o arco corretamente (escola Franco-Belga) sem tensão no polegar" },
          { id: "peso", label: "Distribuição de peso do arco", topic: "Distribuição de peso do braço no arco: talão, meio e ponta" },
          { id: "post", label: "Postura do corpo e ombro", topic: "Postura do corpo, uso da espaleira e queixeira para evitar tensão cervical" },
        ],
      },
      {
        heading: "Afinação",
        topics: [
          { id: "afin", label: "Afinar as cordas (G-D-A-E)", topic: "Como afinar as 4 cordas G-D-A-E com quintas puras usando o próprio arco" },
          { id: "ouv", label: "Treinar ouvido para 5ª pura", topic: "Como treinar o ouvido para reconhecer quintas puras vs temperadas" },
          { id: "int", label: "Colocação exata dos dedos", topic: "Referências táteis e visuais para colocar 1º, 2º, 3º e 4º dedos afinados na primeira posição" },
        ],
      },
      {
        heading: "Expressão",
        topics: [
          { id: "vib", label: "Vibrato de braço", topic: "Como começar o vibrato de braço em 4 estágios (do lento ao rápido)" },
          { id: "pos", label: "Mudança de posição", topic: "Mudança de 1ª para 3ª posição sem glissando indesejado" },
          { id: "dup", label: "Cordas duplas afinadas", topic: "Como afinar cordas duplas (terças, sextas e oitavas)" },
        ],
      },
    ],
  },
  teclado: {
    title: "Professor de Teclado + VSTs (IA)",
    tagline: "Notas, dedilhado, misturar sons do teclado, montar patches em VSTs (Kontakt, Arturia, Omnisphere) para cada estilo.",
    groups: [
      {
        heading: "Técnica ao teclado",
        topics: [
          { id: "ded", label: "Dedilhado correto", topic: "Dedilhado correto para escalas maiores e menores nas duas mãos" },
          { id: "pad", label: "Uso do pedal de sustain", topic: "Como usar o pedal de sustain sem embolar a harmonia (troca no baixo)" },
          { id: "voz", label: "Condução de vozes", topic: "Condução de vozes ao harmonizar acordes em piano/teclado" },
        ],
      },
      {
        heading: "Misturar bibliotecas do teclado",
        topics: [
          { id: "layer", label: "Layer piano + strings", topic: "Como fazer layer de piano acústico + strings sem embolar (níveis, EQ, curva de velocity)" },
          { id: "split", label: "Split baixo + lead", topic: "Como configurar split de baixo na mão esquerda + lead/pad na direita" },
          { id: "orgao", label: "Combinar órgão + piano elétrico", topic: "Combinar órgão B3 + Rhodes/Wurlitzer em worship, gospel e soul" },
          { id: "sync", label: "Programar arpejador/split zones", topic: "Programar arpejador, split zones e velocity switches em teclados workstation (Nord, Kurzweil, Roland Fantom)" },
        ],
      },
      {
        heading: "Controladora + VSTs (Kontakt, Arturia, Omnisphere)",
        topics: [
          { id: "cadeia", label: "Cadeia de plugins na DAW", topic: "Cadeia de plugins ideal para teclas ao vivo com controladora MIDI: instrument → EQ → compressor → reverb → limiter", context: "Ableton Live / Logic / MainStage / Cantabile" },
          { id: "kontakt", label: "Multi patches no Kontakt", topic: "Como montar um multi no Kontakt combinando piano acústico + strings + pad + EP e mapear cada um em zonas do teclado" },
          { id: "arturia", label: "Presets Arturia V Collection", topic: "Melhores instrumentos e presets da Arturia V Collection para pop, rock, worship e retro synth" },
          { id: "omni", label: "Omnisphere para pads épicos", topic: "Como fatiar patches do Omnisphere para pads épicos e cinemáticos (layer + granular + FX)" },
          { id: "latency", label: "Baixar latência (buffer + driver)", topic: "Como baixar latência ao usar VSTs ao vivo (buffer size, driver ASIO/Core Audio, sample rate)" },
        ],
      },
      {
        heading: "Timbres por estilo musical",
        topics: [
          { id: "rock", label: "Timbre para Rock", topic: "Timbres de teclado para rock clássico e moderno: órgão B3 saturado, piano brilhante, Moog lead — plugins e presets", context: "rock" },
          { id: "reggae", label: "Timbre para Reggae", topic: "Timbre de órgão bubble e clavinet skank para reggae — configuração de plugin e EQ", context: "reggae" },
          { id: "bossa", label: "Timbre para Bossa Nova", topic: "Timbre de piano acústico intimista para bossa nova (Ivory, Keyscape) — EQ, dinâmica e reverb curto", context: "bossa nova" },
          { id: "worship", label: "Timbre para Worship", topic: "Patch clássico de worship: piano warm + pad + strings + swell — receita completa em Ableton/MainStage com Kontakt e Omnisphere", context: "worship contemporâneo" },
          { id: "jazz", label: "Timbre para Jazz", topic: "Timbres jazzísticos: Rhodes MK1, Wurlitzer, piano acústico Steinway, órgão B3 — plugins/samples de referência", context: "jazz" },
          { id: "blues", label: "Timbre para Blues", topic: "Piano elétrico Wurlitzer e órgão B3 com drive para blues — plugins, drive e Leslie", context: "blues" },
          { id: "trap", label: "Timbre para Trap/Pop", topic: "Sound design de leads e plucks para trap/pop atual em Serum, Vital e Omnisphere", context: "trap/pop" },
          { id: "gospel", label: "Timbre para Gospel Brasil", topic: "Timbres para gospel brasileiro: piano gospel bright, strings largas, pad ambiente, brass sessions — plugins e presets", context: "gospel BR" },
        ],
      },
    ],
  },
  piano: {
    title: "Professor de Piano (IA)",
    tagline: "Dedilhado, dinâmica, pedal e leitura para piano acústico.",
    groups: [
      {
        heading: "Técnica",
        topics: [
          { id: "ded", label: "Dedilhado de escalas", topic: "Dedilhado padrão para todas as escalas maiores nas duas mãos" },
          { id: "arp", label: "Arpejos de acorde", topic: "Arpejos de acorde em 4 oitavas com dedilhado correto" },
          { id: "din", label: "Controle de dinâmica", topic: "Como controlar dinâmica de pp a ff sem tensão no pulso" },
        ],
      },
      {
        heading: "Musicalidade",
        topics: [
          { id: "ped", label: "Pedal legato e sincopado", topic: "Uso de pedal legato e sincopado sem borrar a harmonia" },
          { id: "voz", label: "Vozes independentes", topic: "Fazer melodia na direita cantar acima do acompanhamento" },
          { id: "leit", label: "Leitura à primeira vista", topic: "Rotina de 10 minutos por dia para melhorar leitura à primeira vista" },
        ],
      },
    ],
  },
  guitarra: {
    title: "Professor de Timbre de Guitarra (IA)",
    tagline: "Regulagem de amp, EQ, cadeia de pedais e receitas de timbre por gênero.",
    groups: [
      {
        heading: "Regulagem do amp",
        topics: [
          { id: "eq", label: "EQ do amp (bass/mid/treble/presence)", topic: "Como regular bass, mid, treble e presence de um amp valvulado do zero, com valores 0–10 e razão de cada knob" },
          { id: "gain", label: "Ajustar gain sem embolar", topic: "Como ajustar gain para ter distorção definida sem perder ataque e clareza" },
          { id: "mast", label: "Master volume e sag valvular", topic: "Como usar master volume para tirar o 'sweet spot' das válvulas em volume baixo" },
        ],
      },
      {
        heading: "Cadeia de pedais",
        topics: [
          { id: "ordem", label: "Ordem correta dos pedais", topic: "Ordem correta da cadeia de pedais: afinador → wah → comp → drive/dist → modulação → delay → reverb, e o que muda o loop de efeitos" },
          { id: "comp", label: "Ajustar compressor", topic: "Ajuste de compressor (attack, release, ratio, sustain) para clean funky e limpo country" },
          { id: "delay", label: "Delay musical (tempo BPM)", topic: "Como calcular delay em ms a partir do BPM (colcheia, semínima pontuada) e usar delay pontuado estilo The Edge" },
        ],
      },
      {
        heading: "Timbres por gênero",
        topics: [
          { id: "rock", label: "Timbre Rock clássico", topic: "Receita de timbre rock clássico (Marshall Plexi/JCM800 style): EQ, gain, guitarra, palheta, pedais" },
          { id: "blues", label: "Timbre Blues", topic: "Timbre blues Stevie Ray/Clapton: Strat/Les Paul + Fender Bassman/Twin, gain, EQ, tube screamer" },
          { id: "jazz", label: "Timbre Jazz", topic: "Timbre jazz limpo e warm: guitarra semi-acústica, amp Polytone/Fender, EQ e captação" },
          { id: "worship", label: "Timbre Worship", topic: "Timbre worship moderno (Hillsong/Bethel): delays em camadas, reverb ambient, drive transparente, volume swell" },
          { id: "reggae", label: "Timbre Reggae skank", topic: "Timbre de skank reggae: guitarra, amp clean, EQ com médios cortados, palhetada e mute" },
          { id: "funk", label: "Timbre Funk", topic: "Timbre funk (Nile Rodgers style): Strat single coil, amp clean, compressor forte, EQ com brilho" },
          { id: "metal", label: "Timbre Metal moderno", topic: "Timbre metal moderno (djent/prog): amp high gain (5150/Rectifier), noise gate, EQ scoop ou não, tight low end, humbuckers ativos" },
          { id: "country", label: "Timbre Country", topic: "Timbre country twang: Tele, amp Fender, compressor, delay slap, chicken pickin" },
          { id: "indie", label: "Timbre Indie/Shoegaze", topic: "Timbre indie/shoegaze com reverb, fuzz, tremolo e delays em série" },
        ],
      },
      {
        heading: "Regulagem física",
        topics: [
          { id: "setup", label: "Setup: ação, oitavação, tensor", topic: "Setup básico da guitarra: altura da ação, ajuste do tensor (truss rod), oitavação e altura dos captadores" },
          { id: "cord", label: "Escolha de cordas", topic: "Como escolher calibre de cordas (.009 a .012) por estilo e afinação" },
        ],
      },
    ],
  },
};

// Map dos instrument ids do app pros configs
const INSTRUMENT_MAP: Record<string, keyof typeof CONFIGS> = {
  sax: "sax",
  saxofone: "sax",
  violino: "violino",
  teclado: "teclado",
  piano: "piano",
  guitarra: "guitarra",
};

export function InstrumentCoach({ instrumentId, instrumentLabel }: { instrumentId: string; instrumentLabel: string }) {
  const configKey = INSTRUMENT_MAP[instrumentId];
  const config = configKey ? CONFIGS[configKey] : null;

  const [selected, setSelected] = useState<CoachTopic | null>(null);
  const [customQ, setCustomQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ask = useServerFn(askInstrumentCoach);

  const activeContext = useMemo(() => selected?.context, [selected]);

  if (!config) return null;

  const send = async (topic: CoachTopic | null, question?: string) => {
    setLoading(true); setError(null); setAnswer(null);
    try {
      const res = await ask({ data: {
        instrument: instrumentLabel,
        topic: topic?.topic ?? question ?? "Ajuda geral",
        question: question?.trim() || undefined,
        context: activeContext,
      } });
      setAnswer(res.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao consultar o professor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
      <div className="mb-1 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold">{config.title}</h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{config.tagline}</p>

      <div className="space-y-4">
        {config.groups.map((group) => (
          <div key={group.heading}>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary/80">{group.heading}</div>
            <div className="flex flex-wrap gap-1.5">
              {group.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); send(t); }}
                  disabled={loading}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-60",
                    selected?.id === t.id
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : "border-border bg-background/60 text-foreground hover:border-primary/50 hover:bg-primary/10",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background/60 p-3">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Ou faça uma pergunta específica</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customQ}
            onChange={(e) => setCustomQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && customQ.trim() && !loading) send(null, customQ); }}
            placeholder={`Ex: "como regular um Boss DS-1 no meu Marshall pra rock?"`}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => customQ.trim() && send(null, customQ)}
            disabled={loading || !customQ.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Perguntar
          </button>
        </div>
      </div>

      {loading && !answer && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-background/60 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Professor pensando…
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
      )}

      {answer && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Resposta do professor
          </div>
          <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
