import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Sliders,
  BookOpen,
  Youtube,
  Mic,
  Play,
  Pause,
  Square,
  Trash2,
  Download,
  ExternalLink,
  Volume2,
  Radio,
  Waves,
  Music2,
  Layers,
  Zap,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/mixagem")({
  head: () => ({
    meta: [
      { title: "Mixagem — Solando" },
      {
        name: "description",
        content:
          "Aprenda mixagem musical: EQ, compressão, reverb, panorâmica, isole instrumentos de músicas do YouTube e grave suas próprias faixas.",
      },
      { property: "og:title", content: "Estúdio de Mixagem — Solando" },
      {
        property: "og:description",
        content:
          "Estude mixagem, remova vocais ou instrumentos de qualquer música e grave suas próprias faixas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MixagemPage,
});

type Tab = "teoria" | "estudio";

function MixagemPage() {
  const [tab, setTab] = useState<Tab>("teoria");

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mixagem</h1>
              <p className="text-sm text-muted-foreground">
                Aprenda a mixar, isole instrumentos e grave suas próprias faixas.
              </p>
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-1">
          <TabButton active={tab === "teoria"} onClick={() => setTab("teoria")} icon={<BookOpen className="h-4 w-4" />}>
            Teoria & Guia
          </TabButton>
          <TabButton active={tab === "estudio"} onClick={() => setTab("estudio")} icon={<Layers className="h-4 w-4" />}>
            Estúdio (isolar + gravar)
          </TabButton>
        </div>

        {tab === "teoria" ? <TeoriaPanel /> : <EstudioPanel />}
      </div>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ============================== TEORIA ============================== */

function TeoriaPanel() {
  return (
    <div className="space-y-6">
      <Section
        icon={<Info className="h-5 w-5" />}
        title="O que é mixagem?"
        color="from-blue-500/20 to-transparent"
      >
        <p>
          Mixagem é o processo de equilibrar todas as faixas de uma música (vocais, bateria, baixo, guitarras, teclados,
          etc.) para que soem <b>claras, coesas e emocionantes</b>. É onde a música ganha profundidade, punch e
          personalidade — antes da masterização.
        </p>
        <p className="mt-3">
          Um bom mix se resume a controlar 4 dimensões:
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <li className="rounded-md border border-border bg-muted/30 p-3"><b>Volume</b> — o que é mais importante fica mais alto.</li>
          <li className="rounded-md border border-border bg-muted/30 p-3"><b>Frequência (EQ)</b> — cada instrumento tem seu espaço no espectro.</li>
          <li className="rounded-md border border-border bg-muted/30 p-3"><b>Espaço (pan/reverb)</b> — onde o som está no estéreo e na sala.</li>
          <li className="rounded-md border border-border bg-muted/30 p-3"><b>Dinâmica (compressão)</b> — controle da variação de volume.</li>
        </ul>
      </Section>

      <Section icon={<Volume2 className="h-5 w-5" />} title="1. Ganho e balanço (gain staging)" color="from-emerald-500/20 to-transparent">
        <p>Antes de qualquer plugin, ajuste o volume bruto de cada faixa para picos entre <b>-18 e -12 dBFS</b>. Isso preserva headroom, evita clipping e faz os plugins soarem melhor.</p>
        <p className="mt-2">Comece o balanço pela <b>bateria (kick e caixa)</b>, adicione <b>baixo</b>, depois <b>vocal</b>, e por último os instrumentos harmônicos. Se um elemento não é ouvido, <i>abaixe os outros antes de aumentá-lo</i>.</p>
      </Section>

      <Section icon={<Waves className="h-5 w-5" />} title="2. Equalização (EQ)" color="from-purple-500/20 to-transparent">
        <p>EQ ajusta as frequências de cada instrumento. Regra de ouro: <b>corte para limpar, realce para colorir</b>.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Faixa</th>
                <th className="py-2 pr-4">Onde vive</th>
                <th className="py-2">Cortes/realces típicos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <EqRow name="Kick" range="40 – 100 Hz (peso) / 3 – 5 kHz (batida)" tips="Corte 300–500 Hz para tirar 'papelão'" />
              <EqRow name="Caixa" range="150 – 250 Hz (corpo) / 5 – 8 kHz (brilho)" tips="Realce em 200 Hz e 6 kHz" />
              <EqRow name="Baixo" range="60 – 120 Hz (sub) / 700 Hz – 2 kHz (ataque)" tips="Corte abaixo de 40 Hz" />
              <EqRow name="Guitarra" range="200 Hz – 4 kHz" tips="Corte 300 Hz (barro), realce 2–3 kHz" />
              <EqRow name="Vocal" range="80 Hz – 12 kHz" tips="Corta abaixo de 100 Hz, presença em 3–5 kHz, ar em 10–12 kHz" />
              <EqRow name="Teclado/Pad" range="200 Hz – 8 kHz" tips="Corte médios graves para não brigar com voz" />
            </tbody>
          </table>
        </div>
      </Section>

      <Section icon={<Zap className="h-5 w-5" />} title="3. Compressão" color="from-amber-500/20 to-transparent">
        <p>Comprime as partes mais altas e/ou realça as mais baixas, deixando o som mais <b>estável e presente</b>.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card title="Parâmetros essenciais">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Threshold</b>: a partir de que volume começa a comprimir.</li>
              <li><b>Ratio</b>: quanto comprime (4:1 vocal, 2:1 mix, 10:1 percussão).</li>
              <li><b>Attack</b>: rápido = mata transiente; lento = deixa ataque.</li>
              <li><b>Release</b>: como volta ao normal (sincronize com o groove).</li>
              <li><b>Makeup</b>: recupera o volume perdido.</li>
            </ul>
          </Card>
          <Card title="Preset inicial por faixa">
            <ul className="list-disc pl-5 space-y-1">
              <li>Vocal: ratio 3:1, atk 10ms, rel 100ms, GR 3–6dB</li>
              <li>Kick: ratio 4:1, atk 20ms, rel 80ms</li>
              <li>Bass: ratio 4:1, atk 15ms, rel 150ms</li>
              <li>Bus mix: ratio 2:1, atk 30ms, rel auto, GR 1–2dB (glue)</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section icon={<Radio className="h-5 w-5" />} title="4. Reverb, delay e profundidade" color="from-cyan-500/20 to-transparent">
        <p>Reverb coloca o som em uma <b>sala virtual</b>. Delay cria repetições que dão espaço sem borrar.</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><b>Plate</b>: brilhante, ótimo em vocais e caixas.</li>
          <li><b>Hall</b>: longo, romântico, ótimo para pads e orquestra.</li>
          <li><b>Room</b>: curto, natural, ótimo para bateria e guitarra.</li>
          <li><b>Delay 1/4 ou 1/8</b>: sincronizado ao BPM para preencher espaços.</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">Dica: envie vários instrumentos ao <b>mesmo bus</b> de reverb para todos "morarem na mesma sala".</p>
      </Section>

      <Section icon={<Music2 className="h-5 w-5" />} title="5. Panorâmica (pan) e imagem estéreo" color="from-pink-500/20 to-transparent">
        <p>Distribua os instrumentos no campo estéreo para eliminar disputas:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><b>Centro</b>: kick, snare, baixo, vocal principal.</li>
          <li><b>Laterais</b>: overheads, guitarras rítmicas (100% L/R), backing vocals.</li>
          <li><b>Levemente pan</b>: teclados, percussão, hi-hat (~30–50%).</li>
        </ul>
      </Section>

      <Section icon={<Layers className="h-5 w-5" />} title="6. Ordem sugerida da cadeia" color="from-indigo-500/20 to-transparent">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Gate/limpeza (remove ruído/vazamento)</li>
          <li>EQ corretiva (tira o feio)</li>
          <li>Compressor (controle dinâmico)</li>
          <li>EQ criativa (dá caráter)</li>
          <li>Saturação (harmônicos, calor)</li>
          <li>Sends: reverb, delay</li>
          <li>Bus master: compressor de cola + EQ leve + limiter</li>
        </ol>
      </Section>

      <Section icon={<BookOpen className="h-5 w-5" />} title="Checklist final antes de exportar" color="from-orange-500/20 to-transparent">
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Vocal está claro e à frente?",
            "Kick e baixo se encaixam sem embolar?",
            "Nada distorce (picos abaixo de -1 dBFS)?",
            "Testou em fone, celular e caixinha?",
            "Comparou com uma faixa profissional (referência)?",
            "Deixou headroom pra masterização (-6 dB)?",
            "Balanço estéreo natural (não pesa pra um lado)?",
            "Mix soa bem em volume baixo?",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
              <span className="mt-0.5 text-primary">✓</span> {t}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function EqRow({ name, range, tips }: { name: string; range: string; tips: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 font-medium text-foreground">{name}</td>
      <td className="py-2 pr-4 text-muted-foreground">{range}</td>
      <td className="py-2 text-muted-foreground">{tips}</td>
    </tr>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-border bg-gradient-to-br ${color} bg-card p-6`}>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
    </section>
  );
}

/* ============================== ESTÚDIO ============================== */

function EstudioPanel() {
  return (
    <div className="space-y-6">
      <StemSeparator />
      <MultiTrackRecorder />
    </div>
  );
}

/* -------- Stem separator (YouTube) -------- */

function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/embed\/([^/?]+)/);
    if (m) return m[1];
    return null;
  } catch {
    return null;
  }
}

const STEMS = [
  { id: "vocals", label: "Vocal / Microfone", emoji: "🎤" },
  { id: "drums", label: "Bateria", emoji: "🥁" },
  { id: "bass", label: "Baixo", emoji: "🎸" },
  { id: "guitar", label: "Guitarra", emoji: "🎸" },
  { id: "piano", label: "Piano / Teclado", emoji: "🎹" },
  { id: "other", label: "Outros instrumentos", emoji: "🎶" },
];

function StemSeparator() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  const handleLoad = () => {
    const id = parseYouTubeId(url);
    setVideoId(id);
  };

  const removed = Object.entries(active).filter(([, v]) => v).map(([k]) => k);

  const openExternal = (service: "moises" | "vocalremover" | "lalal") => {
    const map = {
      moises: "https://moises.ai/",
      vocalremover: "https://vocalremover.org/",
      lalal: "https://www.lalal.ai/",
    };
    window.open(map[service], "_blank", "noopener");
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Youtube className="h-5 w-5 text-red-500" /> Isolar instrumentos de uma música do YouTube
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Cole o link da música, escolha o que quer <b>tirar</b> (vocal, bateria, etc.) e estude tocando por cima.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleLoad}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Carregar
        </button>
      </div>

      {videoId && (
        <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-border bg-black">
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube player"
          />
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Selecione o que quer remover:</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STEMS.map((s) => {
            const on = !!active[s.id];
            return (
              <button
                key={s.id}
                onClick={() => setActive({ ...active, [s.id]: !on })}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                  on
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{s.emoji}</span>
                  {s.label}
                </span>
                <span className={`text-xs font-semibold ${on ? "text-primary" : ""}`}>
                  {on ? "REMOVER" : "manter"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
        <p className="mb-2 flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
          <Info className="h-4 w-4" /> Como o Solando gera as stems
        </p>
        <p className="text-muted-foreground">
          A separação de faixas usa IA (modelos como <b>Demucs / Spleeter</b>) e não roda dentro do navegador de forma
          rápida. Escolhemos os melhores serviços gratuitos/pagos para você processar o áudio e voltar aqui para
          estudar:
        </p>
        {removed.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Selecionado para remover: <b className="text-foreground">{removed.map((r) => STEMS.find((s) => s.id === r)?.label).join(", ")}</b>
          </p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <ExternalBtn onClick={() => openExternal("moises")} title="Moises.ai" desc="Melhor qualidade, 5 músicas grátis/mês" />
          <ExternalBtn onClick={() => openExternal("vocalremover")} title="Vocal Remover" desc="Grátis, remove vocal, bateria, baixo" />
          <ExternalBtn onClick={() => openExternal("lalal")} title="LALAL.AI" desc="Alta fidelidade, várias stems" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Fluxo: baixe o áudio da música → envie no serviço acima → escolha as stems → volte aqui e toque em cima usando
          o gravador logo abaixo.
        </p>
      </div>
    </section>
  );
}

function ExternalBtn({ onClick, title, desc }: { onClick: () => void; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2 rounded-md border border-border bg-background p-3 text-left hover:border-primary"
    >
      <ExternalLink className="mt-0.5 h-4 w-4 text-primary shrink-0" />
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

/* -------- Multi-track recorder / mixer -------- */

type Track = {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  volume: number;
  pan: number;
  muted: boolean;
};

function MultiTrackRecorder() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    return () => {
      tracks.forEach((t) => URL.revokeObjectURL(t.url));
      audioCtxRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setTracks((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: `Faixa ${prev.length + 1}`,
            blob,
            url,
            volume: 0.9,
            pan: 0,
            muted: false,
          },
        ]);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch (err) {
      alert("Não foi possível acessar o microfone: " + (err as Error).message);
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const removeTrack = (id: string) => {
    const t = tracks.find((x) => x.id === id);
    if (t) URL.revokeObjectURL(t.url);
    setTracks((prev) => prev.filter((x) => x.id !== id));
  };

  const updateTrack = (id: string, patch: Partial<Track>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const playAll = async () => {
    if (tracks.length === 0) return;
    stopAll();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const buffers = await Promise.all(
      tracks.map(async (t) => ctx.decodeAudioData(await t.blob.arrayBuffer())),
    );

    const startAt = ctx.currentTime + 0.1;
    const srcs: AudioBufferSourceNode[] = [];
    let maxDuration = 0;

    tracks.forEach((t, i) => {
      if (t.muted) return;
      const src = ctx.createBufferSource();
      src.buffer = buffers[i];
      const gain = ctx.createGain();
      gain.gain.value = t.volume;
      const panner = ctx.createStereoPanner();
      panner.pan.value = t.pan;
      src.connect(gain).connect(panner).connect(ctx.destination);
      src.start(startAt);
      srcs.push(src);
      maxDuration = Math.max(maxDuration, buffers[i].duration);
    });

    sourcesRef.current = srcs;
    setPlaying(true);
    setTimeout(() => setPlaying(false), (maxDuration + 0.2) * 1000);
  };

  const stopAll = () => {
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    sourcesRef.current = [];
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setPlaying(false);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Mic className="h-5 w-5 text-primary" /> Grave suas faixas e mixe
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Toque por cima da música (com o vídeo do YouTube acima) e grave. Cada gravação vira uma faixa com volume,
        panorâmica e mute — igual a uma mesa de som.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {!recording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            <Mic className="h-4 w-4" /> Gravar nova faixa
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-md bg-red-500/90 px-4 py-2 text-sm font-medium text-white animate-pulse"
          >
            <Square className="h-4 w-4" /> Parar gravação
          </button>
        )}

        <button
          onClick={playing ? stopAll : playAll}
          disabled={tracks.length === 0}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pausar mix" : "Tocar mix completo"}
        </button>

        {tracks.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {tracks.length} faixa{tracks.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Nenhuma faixa ainda. Clique em <b>Gravar nova faixa</b> para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((t) => (
            <TrackRow key={t.id} track={t} onChange={(p) => updateTrack(t.id, p)} onDelete={() => removeTrack(t.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function TrackRow({
  track,
  onChange,
  onDelete,
}: {
  track: Track;
  onChange: (p: Partial<Track>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={track.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-40 rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
        <audio controls src={track.url} className="h-8 flex-1 min-w-[200px]" />
        <a
          href={track.url}
          download={`${track.name}.webm`}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Baixar"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          onClick={onDelete}
          className="rounded-md p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          title="Excluir faixa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-3.5 w-3.5" /> Volume {Math.round(track.volume * 100)}%
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.01}
            value={track.volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
            className="flex-1 accent-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Pan {track.pan === 0 ? "C" : track.pan < 0 ? `${Math.round(track.pan * -100)}L` : `${Math.round(track.pan * 100)}R`}
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={track.pan}
            onChange={(e) => onChange({ pan: parseFloat(e.target.value) })}
            className="flex-1 accent-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={track.muted}
            onChange={(e) => onChange({ muted: e.target.checked })}
            className="accent-primary"
          />
          <span className={track.muted ? "text-red-500 font-semibold" : "text-muted-foreground"}>Mudo</span>
        </label>
      </div>
    </div>
  );
}
