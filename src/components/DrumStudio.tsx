import { useCallback, useEffect, useRef, useState } from "react";
import { Drum, CircleDot, Square, Loader2, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeDrum } from "@/lib/analyze-drum.functions";
import { DrumPatternPlayer } from "@/components/DrumPatternPlayer";
import { cn } from "@/lib/utils";

/* -------- Modelo de linhas de bateria -------- */
const ROWS = [
  { id: "CY", label: "Crash", color: "bg-yellow-500" },
  { id: "RD", label: "Ride", color: "bg-amber-500" },
  { id: "HH", label: "Chimbal", color: "bg-orange-500" },
  { id: "SN", label: "Caixa", color: "bg-red-500" },
  { id: "T1", label: "Tom 1", color: "bg-fuchsia-500" },
  { id: "T2", label: "Tom 2", color: "bg-purple-500" },
  { id: "FT", label: "Surdo", color: "bg-indigo-500" },
  { id: "BD", label: "Bumbo", color: "bg-emerald-500" },
] as const;
type RowId = typeof ROWS[number]["id"];

// Cada padrão tem 16 semicolcheias (4 tempos × 4 subdivisões). "x" = toque, "o" = acento, "." = silêncio.
type Pattern = Record<RowId, string>; // 16 chars

const G = (bd: string, sn: string, hh: string, extra: Partial<Pattern> = {}): Pattern => ({
  CY: ".".repeat(16),
  RD: ".".repeat(16),
  HH: hh,
  SN: sn,
  T1: ".".repeat(16),
  T2: ".".repeat(16),
  FT: ".".repeat(16),
  BD: bd,
  ...extra,
});

type Fill = {
  id: string;
  name: string;
  bpm: string;
  feel: string;
  tip: string;
  groove: Pattern;
  fill: Pattern;
  fillTip: string;
};

const FILLS: Fill[] = [
  {
    id: "rock",
    name: "Rock (Backbeat)",
    bpm: "100–140",
    feel: "Bumbo em 1 e 3, caixa em 2 e 4, chimbal em colcheias.",
    tip: "Deixe caixa 'atrás' do tempo por 5–10 ms — dá peso. Bonham, Grohl, Peart.",
    groove: G(
      "x...x.......x...",
      "....x.......x...",
      "x.x.x.x.x.x.x.x.",
    ),
    fill: G(
      "x...............",
      "xx..............",
      "................",
      {
        SN: "xx..............",
        T1: "....xx..........",
        T2: "........xx......",
        FT: "............xx..",
        CY: "...............x", // fecha no crash do próximo compasso
      },
    ),
    fillTip: "Virada 'em cascata' descendo caixa→tom1→tom2→surdo em duplas de semicolcheias, fechando no crash do 1.",
  },
  {
    id: "funk",
    name: "Funk Americano",
    bpm: "90–110",
    feel: "Ghost notes densas na caixa entre 2 e 4, bumbo sincopado, chimbal em 16 avos.",
    tip: "Clyde Stubblefield, Zigaboo Modeliste, Bernard Purdie. Precisão de 16 é tudo.",
    groove: G(
      "x..x.x..x..x.x..",
      "..o.x.o...o.x.o.",
      "xxxxxxxxxxxxxxxx",
    ),
    fill: G(
      "x.......x.......",
      "x...............",
      "................",
      {
        SN: "x.xxo.x.xxo.x.xx",
        HH: "x.x.x.x.x.x.x.x.",
        CY: "...............x",
      },
    ),
    fillTip: "Virada linear na caixa com ghost notes: alternar mão-mão-pé com acentos no 2 e 4, encerrando no crash + bumbo no 1.",
  },
  {
    id: "blues",
    name: "Blues Shuffle",
    bpm: "70–120",
    feel: "Shuffle em tercinas: 1-(2)-3 na condução. Sinta o 'lay back'.",
    tip: "Fred Below, Chris Layton (SRV). Cada tempo = 3 subdivisões; a nota do meio é omitida.",
    groove: G(
      "x...x.......x...",
      "....x.......x...",
      "x.xx.xx.xx.xx.xx", // shuffle no chimbal (representação simplificada em 16)
    ),
    fill: G(
      "x...............",
      "................",
      "................",
      {
        SN: "x.xx.xx.xx......",
        T1: ".........xx.....",
        FT: "...........xx...",
        CY: "...............x",
      },
    ),
    fillTip: "Virada em tercinas mantendo o shuffle: 3 toques na caixa por tempo, transitando para tom e surdo nos 2 últimos tempos.",
  },
  {
    id: "jazz",
    name: "Jazz Swing",
    bpm: "120–240",
    feel: "Condução no ride: ding-ding-a-ding. Chimbal com pé em 2 e 4.",
    tip: "Elvin Jones, Philly Joe, Tony Williams. Ted Reed 'Syncopation' + John Riley 'Bop Drumming'.",
    groove: G(
      "................",
      "................",
      "....x.......x...", // chimbal com o pé em 2 e 4
      {
        RD: "x..xx..xx..xx..x", // ride swing
        SN: "..x...x...x...x.", // comping suave
      },
    ),
    fill: G(
      "................",
      "................",
      "....x.......x...",
      {
        RD: "x..x............",
        SN: "....xx.xx.......",
        T1: "........xx......",
        FT: "..........xx..x.",
        CY: "...............x",
      },
    ),
    fillTip: "Trading: mantenha ride nos primeiros 2 tempos e faça comping caixa→tom→surdo em tercinas nos 2 últimos, resolvendo no crash + ride.",
  },
  {
    id: "samba",
    name: "Samba",
    bpm: "90–130",
    feel: "Bumbo em semicolcheias '1 e-a 2 e-a', caixa/chimbal em telecoteco.",
    tip: "Milton Banana, Edison Machado ('samba no prato'), Robertinho Silva.",
    groove: G(
      "x..xx..xx..xx..x",
      "..x..x.x..x..x.x",
      "x.xxx.xxx.xxx.xx",
    ),
    fill: G(
      "x..xx..xx..xx..x",
      "................",
      "................",
      {
        SN: "xxxxxxxxxxxxxxxx", // rufado curto
        T1: "................",
        FT: "...............x",
        CY: "...............x",
      },
    ),
    fillTip: "Rufado de caixa em semicolcheias mantendo o bumbo do samba, terminando com toque no surdo + crash no '1'.",
  },
  {
    id: "bossa",
    name: "Bossa Nova",
    bpm: "120–160",
    feel: "Vassourinha ou baqueta leve, clave brasileira na caixa.",
    tip: "Menos é mais. Toque como o violão do João. Estude Milton Banana e Dom Um.",
    groove: G(
      "x...x.x.x...x.x.",
      "x..x..x.x..x..x.", // clave na caixa (rim/cross-stick)
      "x.x.x.x.x.x.x.x.",
    ),
    fill: G(
      "x...x.x.x.......",
      "x..x..x.........",
      "x.x.x.x.........",
      {
        T1: ".........x.x....",
        FT: "............x.x.",
        CY: "...............x",
      },
    ),
    fillTip: "Virada delicada: mantenha a clave, entre com toms em colcheias nos últimos 2 tempos. Nada de estourar — bossa é intimista.",
  },
  {
    id: "reggae",
    name: "Reggae (One Drop)",
    bpm: "60–90",
    feel: "Bumbo e caixa juntos no 3 (não no 1!). Toque atrás do tempo.",
    tip: "Sly Dunbar, Carlton Barrett (Bob Marley), Style Scott.",
    groove: G(
      "........x.......",
      "........x.......",
      "x.x.x.x.x.x.x.x.",
    ),
    fill: G(
      "........x.......",
      "................",
      "x.x.x.x.........",
      {
        SN: "........x.xxxxxx",
        FT: "................",
        CY: "...............x",
      },
    ),
    fillTip: "Virada curta só na caixa após o 'one drop' do 3, resolvendo com crash + bumbo/caixa no 3 do próximo compasso.",
  },
  {
    id: "frevo",
    name: "Frevo",
    bpm: "120–160",
    feel: "Caixa em colcheias contínuas com acentos no 1 e 3, bumbo em 1 e 3.",
    tip: "Nilton Freitas, Cassiano Costa. Braço solto — é resistência de 40 min.",
    groove: G(
      "x...x...x...x...",
      "o.x.x.x.o.x.x.x.",
      "................",
      { CY: "x...............", RD: "x.x.x.x.x.x.x.x." },
    ),
    fill: G(
      "x...x...x.......",
      "................",
      "................",
      {
        SN: "xoxoxoxoxoxoxxxx",
        CY: "...............x",
      },
    ),
    fillTip: "Rufado acentuado na caixa cruzando com surdo respondendo, quebra no crash + bumbo do 1.",
  },
  {
    id: "salsa",
    name: "Salsa (Clave 2-3)",
    bpm: "150–220",
    feel: "Clave 2-3 é a lei. Cascara no aro do tom, campana no bumbo.",
    tip: "Tito Puente, Giovanni Hidalgo, Horacio 'El Negro'.",
    groove: G(
      "x.....x.x.......",
      "....x.......x...",
      "x.xxx.xxx.xxx.xx", // cascara
      { T1: "..x.....x.....x." }, // clave 2-3 no aro do tom
    ),
    fill: G(
      "x.....x.x.......",
      "................",
      "................",
      {
        SN: "xxxxxxxxxxxx....",
        T1: "............xx..",
        FT: "..............x.",
        CY: "...............x",
      },
    ),
    fillTip: "Abanico: rufado de caixa em 32 avos por 2 tempos, cai no tom + surdo e crash no 1, sempre respeitando a clave.",
  },
  {
    id: "trap",
    name: "Trap / Hip-Hop",
    bpm: "70 (140 double)",
    feel: "Bumbo 808 sincopado, caixa/clap no 3, chimbal em rolls de 16, 32, tercinas.",
    tip: "Aaron Spears, Anika Nilles. Metrônomo em 8ª nota + subdivisão mental.",
    groove: G(
      "x......xx.......",
      "........x.......",
      "x.x.x.x.xxxxxxxx", // roll no chimbal na segunda metade
    ),
    fill: G(
      "x......xx.......",
      "................",
      "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".slice(0, 16), // hi-hat roll contínuo
      {
        SN: "........x...x.xx",
        CY: "...............x",
      },
    ),
    fillTip: "Hi-hat roll acelerando (16 → 32 avos) na segunda metade, caixa dobrada no final e crash + bumbo 808 no 1.",
  },
];

/* -------- Componente de grid -------- */
function PatternGrid({ pattern }: { pattern: Pattern }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Cabeçalho dos tempos */}
        <div className="mb-1 grid grid-cols-[80px_repeat(16,minmax(0,1fr))] gap-0.5 text-[10px] text-muted-foreground">
          <div />
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={cn(
              "text-center",
              i % 4 === 0 && "text-primary font-bold",
            )}>
              {i % 4 === 0 ? Math.floor(i / 4) + 1 : "·"}
            </div>
          ))}
        </div>

        {ROWS.map((row) => {
          const hits = pattern[row.id] || ".".repeat(16);
          return (
            <div key={row.id} className="grid grid-cols-[80px_repeat(16,minmax(0,1fr))] gap-0.5 mb-0.5 items-center">
              <div className="text-[11px] font-semibold text-muted-foreground pr-1 truncate">{row.label}</div>
              {Array.from({ length: 16 }).map((_, i) => {
                const ch = hits[i] || ".";
                const isHit = ch === "x" || ch === "o";
                const isAccent = ch === "o";
                return (
                  <div
                    key={i}
                    className={cn(
                      "h-6 rounded-sm border transition-all",
                      i % 4 === 0 ? "border-primary/40" : "border-border/40",
                      isHit ? `${row.color} border-transparent` : "bg-background/40",
                      isAccent && "ring-1 ring-white/70",
                    )}
                    title={isHit ? row.label + (isAccent ? " (acento)" : "") : ""}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Coach de ouvido para bateria (IA) -------- */
function DrumEarCoach({ genre, bpm, pattern, focus }: {
  genre: string; bpm: string; pattern: string; focus: "groove" | "fill";
}) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyze = useServerFn(analyzeDrum);

  const start = useCallback(async () => {
    setError(null); setFeedback(null); setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao acessar o microfone");
    }
  }, [audioUrl]);

  const stop = useCallback(() => { recorderRef.current?.stop(); setRecording(false); }, []);

  const send = useCallback(async () => {
    if (!audioBlob) return;
    if (audioBlob.size < 3000) { setError("Gravação muito curta. Toque por alguns segundos."); return; }
    setLoading(true); setError(null); setFeedback(null);
    try {
      const arr = new Uint8Array(await audioBlob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
      const b64 = btoa(bin);
      const type = audioBlob.type;
      const format: "webm" | "mp4" | "wav" | "mp3" | "m4a" | "ogg" =
        type.includes("mp4") ? "mp4" :
        type.includes("wav") ? "wav" :
        type.includes("mpeg") ? "mp3" :
        type.includes("ogg") ? "ogg" : "webm";
      const res = await analyze({ data: { audioBase64: b64, format, genre, bpm, pattern, focus } });
      setFeedback(res.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao analisar áudio");
    } finally {
      setLoading(false);
    }
  }, [audioBlob, analyze, genre, bpm, pattern, focus]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  return (
    <div className="mt-4 rounded-lg border border-primary/30 bg-background/60 p-3">
      <p className="mb-2 text-xs font-semibold text-primary">Coach de ouvido — grave sua {focus === "fill" ? "virada" : "levada"}</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Toque 4–8 compassos do padrão acima com metrônomo em {bpm} BPM. A IA vai avaliar pulso, colocação e estilo.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {!recording ? (
          <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <CircleDot className="h-4 w-4" /> Gravar
          </button>
        ) : (
          <button onClick={stop} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground animate-pulse">
            <Square className="h-4 w-4" /> Parar
          </button>
        )}
        {audioBlob && !recording && (
          <button onClick={send} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analisando…" : "Analisar com IA"}
          </button>
        )}
      </div>
      {audioUrl && <audio controls src={audioUrl} className="mt-2 w-full" />}
      {error && <p className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
      {feedback && (
        <div className="mt-3 rounded-lg border border-primary/30 bg-background/70 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {feedback}
        </div>
      )}
    </div>
  );
}

/* -------- Componente principal -------- */
export function DrumStudio() {
  const [openId, setOpenId] = useState<string>(FILLS[0].id);
  const [view, setView] = useState<"groove" | "fill">("groove");

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
        <div className="mb-1 flex items-center gap-2">
          <Drum className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Estúdio de Bateria — Levadas & Viradas</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Escolha um gênero, veja o desenho da levada e da virada nota por nota (16 semicolcheias no compasso 4/4), e grave sua execução para o coach avaliar.
        </p>
      </div>

      {FILLS.map((f) => {
        const isOpen = openId === f.id;
        return (
          <div key={f.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? "" : f.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <span className="font-display text-base font-bold">{f.name}</span>
                <span className="ml-2 text-xs font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{f.bpm} BPM</span>
                <p className="mt-1 text-xs text-muted-foreground">{f.feel}</p>
              </div>
              <span className="text-primary text-xs">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="border-t border-border px-5 pb-5 pt-3 space-y-4">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setView("groove")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      view === "groove" ? "bg-primary text-primary-foreground shadow" : "bg-secondary/50 text-secondary-foreground hover:bg-secondary",
                    )}
                  >
                    Levada base
                  </button>
                  <button
                    onClick={() => setView("fill")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      view === "fill" ? "bg-primary text-primary-foreground shadow" : "bg-secondary/50 text-secondary-foreground hover:bg-secondary",
                    )}
                  >
                    Virada (fill)
                  </button>
                </div>

                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                      {view === "groove" ? "Levada base — 1 compasso" : "Virada — 1 compasso"}
                    </span>
                    <DrumPatternPlayer
                      pattern={view === "groove" ? f.groove : f.fill}
                      bpm={parseInt(f.bpm.match(/\d+/)?.[0] ?? "100", 10)}
                      label={view === "groove" ? "Ouvir levada" : "Ouvir virada"}
                    />
                  </div>
                  <PatternGrid pattern={view === "groove" ? f.groove : f.fill} />
                  <p className="mt-3 text-xs text-muted-foreground italic">
                    {view === "groove" ? f.tip : f.fillTip}
                  </p>
                </div>

                <DrumEarCoach
                  genre={f.name}
                  bpm={f.bpm}
                  pattern={view === "groove" ? "levada base" : "virada"}
                  focus={view}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
