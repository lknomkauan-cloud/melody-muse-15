import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Sliders,
  BookOpen,
  
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
          "Aprenda mixagem musical: EQ, compressão, reverb, panorâmica e grave suas próprias faixas em uma DAW no navegador.",

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

      <Section icon={<Download className="h-5 w-5" />} title="Apostilas em PDF para baixar" color="from-rose-500/20 to-transparent">
        <p>
          Selecionamos guias completos e gratuitos de mixagem para você baixar e estudar off-line. Clique para abrir o
          PDF em uma nova aba e salvar no seu dispositivo.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PdfLink
            href="https://www.izotope.com/en/learn/mixing-guides.html"
            title="iZotope — Mixing Guides (completo)"
            desc="Coletânea profissional cobrindo EQ, compressão, reverb, panorâmica e masterização (EN)."
          />
          <PdfLink
            href="https://cdn.shopify.com/s/files/1/0270/1499/files/The_Ultimate_Mixing_Guide.pdf"
            title="The Ultimate Mixing Guide (PDF)"
            desc="Manual didático em PDF com passo a passo do mix profissional (EN)."
          />
          <PdfLink
            href="https://www.soundonsound.com/techniques/mixing-essentials"
            title="Sound on Sound — Mixing Essentials"
            desc="Série clássica de artigos técnicos usada em faculdades de áudio (EN)."
          />
          <PdfLink
            href="https://producaomusical.com.br/wp-content/uploads/apostila-mixagem.pdf"
            title="Apostila de Mixagem (PT-BR)"
            desc="Guia em português com fundamentos, cadeia de sinal e dicas práticas."
          />
        </div>
      </Section>
    </div>
  );
}

function PdfLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-primary/5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-500">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {title}
          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </a>
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

/* ============================== ESTÚDIO (DAW skin) ============================== */


type Track = {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  buffer?: AudioBuffer;
  duration: number;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  low: number;   // dB -12..+12 (low shelf ~120Hz)
  mid: number;   // dB -12..+12 (peaking ~1kHz)
  high: number;  // dB -12..+12 (high shelf ~8kHz)
  reverb: number; // 0..1 send amount
};

const TRACK_COLORS = [
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#f472b6", // pink
  "#facc15", // amber
  "#34d399", // emerald
  "#fb923c", // orange
  "#60a5fa", // blue
  "#f87171", // red
];

function EstudioPanel() {
  // DAW state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [masterVol, setMasterVol] = useState(0.9);
  const [masterLow, setMasterLow] = useState(0);
  const [masterMid, setMasterMid] = useState(0);
  const [masterHigh, setMasterHigh] = useState(0);
  const [masterReverb, setMasterReverb] = useState(0.15);
  const [bpm, setBpm] = useState(120);
  const [source, setSource] = useState<"mic" | "system" | "both">("mic");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Max timeline duration (min 30s)
  const maxDur = Math.max(30, ...tracks.map((t) => t.duration || 0));

  useEffect(() => {
    return () => {
      tracks.forEach((t) => URL.revokeObjectURL(t.url));
      audioCtxRef.current?.close().catch(() => {});
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const startRecording = async () => {
    try {
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      };

      let micStream: MediaStream | null = null;
      let sysStream: MediaStream | null = null;

      if (source === "mic" || source === "both") {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      }
      if (source === "system" || source === "both") {
        // Captura áudio do sistema/aba (Chrome/Edge desktop: escolher "Compartilhar áudio")
        const gdm = (navigator.mediaDevices as any).getDisplayMedia;
        if (!gdm) throw new Error("Seu navegador não suporta captura de áudio do sistema. Use Chrome/Edge no desktop.");
        sysStream = await gdm.call(navigator.mediaDevices, {
          video: true, // exigido por alguns navegadores; descartamos o vídeo
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        const audioTracks = sysStream!.getAudioTracks();
        if (audioTracks.length === 0) {
          sysStream!.getTracks().forEach((t) => t.stop());
          throw new Error("Nenhum áudio do sistema detectado. Marque 'Compartilhar áudio da aba/tela' na janela do navegador.");
        }
        // descarta vídeo (só queremos áudio)
        sysStream!.getVideoTracks().forEach((t) => t.stop());
      }

      // Mistura streams se necessário (mic + sistema)
      let finalStream: MediaStream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = ctx.createMediaStreamDestination();
      const attach = (s: MediaStream | null) => {
        if (!s || s.getAudioTracks().length === 0) return;
        const src = ctx.createMediaStreamSource(new MediaStream(s.getAudioTracks()));
        src.connect(dest);
      };
      attach(micStream);
      attach(sysStream);
      finalStream = dest.stream;

      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(finalStream, { mimeType: mime });
      const srcLabel = source === "mic" ? "Mic" : source === "system" ? "Sistema" : "Mic+Sistema";
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        const decCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        let buffer: AudioBuffer | undefined;
        let duration = 0;
        try {
          buffer = await decCtx.decodeAudioData(await blob.arrayBuffer());
          duration = buffer.duration;
        } catch {}
        decCtx.close().catch(() => {});
        setTracks((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: `${srcLabel} ${prev.length + 1}`,
            blob,
            url,
            buffer,
            duration,
            color: TRACK_COLORS[prev.length % TRACK_COLORS.length],
            volume: 0.9,
            pan: 0,
            muted: false,
            solo: false,
            low: 0,
            mid: 0,
            high: 0,
            reverb: 0,
          },
        ]);
        micStream?.getTracks().forEach((t) => t.stop());
        sysStream?.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch (err) {
      alert("Não foi possível iniciar a gravação: " + (err as Error).message);
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

  const stopAll = () => {
    sourcesRef.current.forEach((s) => {
      try { s.stop(); } catch {}
    });
    sourcesRef.current = [];
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
    setElapsed(0);
  };

  const playAll = async () => {
    if (tracks.length === 0) return;
    stopAll();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const anySolo = tracks.some((t) => t.solo);

    // Master chain: busIn -> mLow -> mMid -> mHigh -> masterGain -> destination
    const busIn = ctx.createGain();
    const mLow = ctx.createBiquadFilter();
    mLow.type = "lowshelf"; mLow.frequency.value = 120; mLow.gain.value = masterLow;
    const mMid = ctx.createBiquadFilter();
    mMid.type = "peaking"; mMid.frequency.value = 1000; mMid.Q.value = 0.9; mMid.gain.value = masterMid;
    const mHigh = ctx.createBiquadFilter();
    mHigh.type = "highshelf"; mHigh.frequency.value = 8000; mHigh.gain.value = masterHigh;
    const master = ctx.createGain();
    master.gain.value = masterVol;
    busIn.connect(mLow).connect(mMid).connect(mHigh).connect(master).connect(ctx.destination);

    // Shared reverb bus (generated impulse response) + master reverb amount
    const convolver = ctx.createConvolver();
    convolver.buffer = makeImpulseResponse(ctx, 2.5, 2.2);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = masterReverb;
    convolver.connect(reverbReturn).connect(busIn);

    const buffers = await Promise.all(
      tracks.map(async (t) => t.buffer ?? ctx.decodeAudioData(await t.blob.arrayBuffer())),
    );

    const startAt = ctx.currentTime + 0.1;
    startTimeRef.current = startAt;
    const srcs: AudioBufferSourceNode[] = [];
    let maxDuration = 0;

    tracks.forEach((t, i) => {
      const shouldPlay = anySolo ? t.solo && !t.muted : !t.muted;
      if (!shouldPlay) return;
      const src = ctx.createBufferSource();
      src.buffer = buffers[i];

      // 3-band EQ: low shelf → peaking mid → high shelf
      const low = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 120;
      low.gain.value = t.low;
      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 0.9;
      mid.gain.value = t.mid;
      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 8000;
      high.gain.value = t.high;

      const gain = ctx.createGain();
      gain.gain.value = t.volume;
      const panner = ctx.createStereoPanner();
      panner.pan.value = t.pan;

      src.connect(low).connect(mid).connect(high).connect(gain).connect(panner).connect(busIn);

      // Reverb send (post-fader)
      if (t.reverb > 0) {
        const send = ctx.createGain();
        send.gain.value = t.reverb;
        panner.connect(send).connect(convolver);
      }

      src.start(startAt);
      srcs.push(src);
      maxDuration = Math.max(maxDuration, buffers[i].duration);
    });

    sourcesRef.current = srcs;
    setPlaying(true);

    const tick = () => {
      if (!audioCtxRef.current) return;
      const e = audioCtxRef.current.currentTime - startTimeRef.current;
      setElapsed(Math.max(0, e));
      if (e >= maxDuration) {
        stopAll();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  

  const mmss = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    const ms = Math.floor((s % 1) * 1000).toString().padStart(3, "0");
    return `${m}:${sec}:${ms}`;
  };

  return (
    <div className="space-y-6">
      {/* ============================ DAW ============================ */}
      <div className="overflow-hidden rounded-xl border border-black/70 bg-[#1e1e1e] text-neutral-200 shadow-2xl ring-1 ring-white/5">
        {/* Transport bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-black/80 bg-gradient-to-b from-[#3a3a3a] to-[#252525] px-4 py-2">
          <div className="flex items-center gap-1">
            <TransportBtn onClick={stopAll} title="Parar">
              <Square className="h-4 w-4 fill-current" />
            </TransportBtn>
            <TransportBtn onClick={playing ? stopAll : playAll} disabled={tracks.length === 0} title={playing ? "Pausar" : "Tocar"} accent="emerald">
              {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </TransportBtn>
            <TransportBtn
              onClick={recording ? stopRecording : startRecording}
              title={recording ? "Parar gravação" : `Gravar (${source === "mic" ? "microfone" : source === "system" ? "áudio do sistema" : "mic + sistema"})`}
              accent={recording ? "recording" : "red"}
            >
              <Mic className="h-4 w-4" />
            </TransportBtn>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-black/70 bg-[#0d0d0d] px-2 py-1 text-[10px] text-neutral-400 shadow-inner">
            <span className="mr-1 uppercase tracking-wider">Fonte</span>
            {(["mic", "system", "both"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => !recording && setSource(s)}
                disabled={recording}
                className={`rounded px-2 py-0.5 font-semibold uppercase transition ${
                  source === s
                    ? "bg-emerald-500/80 text-black"
                    : "text-neutral-400 hover:text-neutral-100"
                } ${recording ? "opacity-50" : ""}`}
                title={
                  s === "mic"
                    ? "Microfone"
                    : s === "system"
                      ? "Áudio do sistema/aba (Chrome/Edge desktop — marque 'Compartilhar áudio')"
                      : "Microfone + áudio do sistema (mixado)"
                }
              >
                {s === "mic" ? "Mic" : s === "system" ? "Sistema" : "Mic+Sis"}
              </button>
            ))}
          </div>


          <div className="ml-2 rounded-md border border-black/70 bg-[#0d0d0d] px-3 py-1 font-mono text-lg tracking-widest text-emerald-400 shadow-inner">
            {mmss(elapsed)}
          </div>

          <div className="flex items-center gap-2 rounded-md border border-black/70 bg-[#0d0d0d] px-3 py-1 text-xs text-neutral-400 shadow-inner">
            <span>BPM</span>
            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
              className="w-14 bg-transparent font-mono text-sm text-neutral-100 outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-neutral-400">
            <Sliders className="h-3.5 w-3.5" />
            <span>Solando DAW</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              {recording ? "REC" : playing ? "PLAY" : "IDLE"}
            </span>
          </div>
        </div>

        {/* Arrangement view: track headers + timeline lanes */}
        <div className="grid grid-cols-[220px_1fr] border-b border-black/80">
          {/* Ruler row */}
          <div className="border-b border-r border-black/70 bg-[#2a2a2a] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Faixas
          </div>
          <TimelineRuler duration={maxDur} />

          {/* Empty state */}
          {tracks.length === 0 && (
            <>
              <div className="col-span-2 border-b border-black/70 bg-[#1a1a1a] py-10 text-center text-xs text-neutral-500">
                Nenhuma faixa. Clique no <Mic className="inline h-3 w-3" /> vermelho na barra de transporte para gravar sua primeira faixa.
              </div>
            </>
          )}

          {/* Tracks */}
          {tracks.map((t) => (
            <TrackLane
              key={t.id}
              track={t}
              duration={maxDur}
              elapsed={elapsed}
              onChange={(p) => updateTrack(t.id, p)}
              onDelete={() => removeTrack(t.id)}
            />
          ))}
        </div>

        {/* Mixer console */}
        <div className="overflow-x-auto bg-[#161616]">
          <div className="flex min-w-full items-stretch gap-1 p-3">
            {tracks.map((t) => (
              <MixerStrip key={t.id} track={t} onChange={(p) => updateTrack(t.id, p)} />
            ))}
            <MasterStrip
              volume={masterVol}
              onVolume={setMasterVol}
              low={masterLow}
              mid={masterMid}
              high={masterHigh}
              reverb={masterReverb}
              onLow={setMasterLow}
              onMid={setMasterMid}
              onHigh={setMasterHigh}
              onReverb={setMasterReverb}
            />
          </div>
        </div>
      </div>

    </div>
  );
}


/* ---------- DAW sub-components ---------- */

function TransportBtn({
  children,
  onClick,
  disabled,
  title,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  accent?: "emerald" | "red" | "recording";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-400 hover:bg-emerald-500/10"
      : accent === "red"
        ? "text-red-400 hover:bg-red-500/10"
        : accent === "recording"
          ? "bg-red-500/20 text-red-400 ring-1 ring-red-500 animate-pulse"
          : "text-neutral-300 hover:bg-white/5";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-md border border-black/60 bg-[#1a1a1a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors disabled:opacity-30 ${accentClass}`}
    >
      {children}
    </button>
  );
}

function TimelineRuler({ duration }: { duration: number }) {
  const step = duration > 60 ? 10 : duration > 30 ? 5 : 2;
  const marks: number[] = [];
  for (let s = 0; s <= duration; s += step) marks.push(s);
  return (
    <div className="relative h-6 border-b border-black/70 bg-[#2a2a2a]">
      {marks.map((s) => (
        <div
          key={s}
          className="absolute top-0 h-full border-l border-neutral-600/60 pl-1 text-[10px] font-mono text-neutral-500"
          style={{ left: `${(s / duration) * 100}%` }}
        >
          {s}s
        </div>
      ))}
    </div>
  );
}

function TrackLane({
  track,
  duration,
  elapsed,
  onChange,
  onDelete,
}: {
  track: Track;
  duration: number;
  elapsed: number;
  onChange: (p: Partial<Track>) => void;
  onDelete: () => void;
}) {
  const clipWidth = duration > 0 ? (track.duration / duration) * 100 : 0;
  const playheadPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const hasPlayhead = elapsed > 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-r border-black/70 bg-[#252525] px-2 py-2">
        <div className="h-8 w-1 shrink-0 rounded" style={{ background: track.color }} />
        <input
          value={track.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-xs font-semibold text-neutral-100 outline-none hover:bg-white/5 focus:bg-white/10"
        />
        <button
          onClick={() => onChange({ muted: !track.muted })}
          title="Mute"
          className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${
            track.muted ? "bg-red-500 text-white" : "bg-black/40 text-neutral-400 hover:text-white"
          }`}
        >
          M
        </button>
        <button
          onClick={() => onChange({ solo: !track.solo })}
          title="Solo"
          className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${
            track.solo ? "bg-yellow-400 text-black" : "bg-black/40 text-neutral-400 hover:text-white"
          }`}
        >
          S
        </button>
        <a
          href={track.url}
          download={`${track.name}.webm`}
          title="Baixar"
          className="flex h-6 w-6 items-center justify-center rounded bg-black/40 text-neutral-400 hover:text-white"
        >
          <Download className="h-3 w-3" />
        </a>
        <button
          onClick={onDelete}
          title="Excluir"
          className="flex h-6 w-6 items-center justify-center rounded bg-black/40 text-neutral-400 hover:bg-red-500/30 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Lane */}
      <div className="relative h-16 border-b border-black/70 bg-[repeating-linear-gradient(90deg,#1a1a1a_0,#1a1a1a_39px,#222_39px,#222_40px)]">
        {/* clip */}
        <div
          className="absolute top-1 bottom-1 overflow-hidden rounded"
          style={{
            left: 0,
            width: `${clipWidth}%`,
            background: `linear-gradient(180deg, ${track.color}66, ${track.color}22)`,
            border: `1px solid ${track.color}`,
            opacity: track.muted ? 0.3 : 1,
          }}
        >
          <FakeWaveform color={track.color} />
          <div className="absolute left-1 top-1 text-[10px] font-semibold text-white/90 mix-blend-screen">
            {track.name}
          </div>
        </div>
        {/* playhead */}
        {hasPlayhead && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            style={{ left: `${playheadPct}%` }}
          />
        )}
      </div>
    </>
  );
}

function FakeWaveform({ color }: { color: string }) {
  // deterministic pseudo-waveform bars
  const bars = 60;
  return (
    <svg className="h-full w-full" viewBox={`0 0 ${bars} 20`} preserveAspectRatio="none">
      {Array.from({ length: bars }).map((_, i) => {
        const h = 4 + Math.abs(Math.sin(i * 0.7) * 8 + Math.cos(i * 1.3) * 6);
        return (
          <rect
            key={i}
            x={i + 0.2}
            y={(20 - h) / 2}
            width={0.6}
            height={h}
            fill={color}
            opacity={0.75}
          />
        );
      })}
    </svg>
  );
}

function makeImpulseResponse(ctx: AudioContext, duration = 2.5, decay = 2.2): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * duration));
  const impulse = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return impulse;
}

function RotaryKnob({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  color = "#a3a3a3",
  size = 34,
  format,
  centerDetent = false,
  resetValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  size?: number;
  format?: (v: number) => string;
  centerDetent?: boolean;
  resetValue?: number;
}) {
  const range = max - min;
  const norm = (value - min) / range;
  const angle = -135 + norm * 270;
  const startRef = React.useRef<{ y: number; v: number } | null>(null);

  const clampStep = (n: number) => {
    const s = Math.min(max, Math.max(min, n));
    return Math.round(s / step) * step;
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { y: e.clientY, v: value };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const dy = startRef.current.y - e.clientY;
    const sensitivity = e.shiftKey ? 400 : 150;
    onChange(clampStep(startRef.current.v + (dy / sensitivity) * range));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    startRef.current = null;
  };
  const onDoubleClick = () => {
    onChange(resetValue ?? (centerDetent ? (min + max) / 2 : min));
  };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const dir = e.deltaY < 0 ? 1 : -1;
    const inc = (range / 100) * (e.shiftKey ? 0.25 : 1) * dir;
    onChange(clampStep(value + inc));
  };

  const r = size / 2;
  const cx = r;
  const cy = r;
  const trackR = r - 3;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const arcStart = { x: cx + trackR * Math.cos(rad(-135 - 90)), y: cy + trackR * Math.sin(rad(-135 - 90)) };
  const arcEnd = { x: cx + trackR * Math.cos(rad(angle - 90)), y: cy + trackR * Math.sin(rad(angle - 90)) };
  const largeArc = norm > 0.5 ? 1 : 0;
  const gradId = `knob-bg-${label}-${size}`;

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        style={{ width: size, height: size, touchAction: "none", cursor: "ns-resize" }}
        title={`${label}: ${format ? format(value) : value.toFixed(2)} — arraste ↑↓ · duplo-clique reseta · scroll ajusta`}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <radialGradient id={gradId} cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#3a3a3a" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={trackR} fill="none" stroke="#000" strokeWidth={2} opacity={0.6} />
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${trackR} ${trackR} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={r - 6} fill={`url(#${gradId})`} stroke="#000" strokeWidth={1} />
          <g transform={`rotate(${angle} ${cx} ${cy})`}>
            <line x1={cx} y1={cy - (r - 8)} x2={cx} y2={cy - (r - 14)} stroke={color} strokeWidth={2} strokeLinecap="round" />
          </g>
        </svg>
      </div>
      <span className="font-mono text-[8px] text-neutral-400">{format ? format(value) : value.toFixed(2)}</span>
    </div>
  );
}

function EqKnob({
  label,
  value,
  onChange,
  color = "#a3a3a3",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <RotaryKnob
      label={label}
      value={value}
      min={-12}
      max={12}
      step={0.5}
      onChange={onChange}
      color={color}
      centerDetent
      resetValue={0}
      format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}`}
    />
  );
}

function MixerStrip({ track, onChange }: { track: Track; onChange: (p: Partial<Track>) => void }) {
  return (
    <div className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-md border border-black/70 bg-gradient-to-b from-[#2a2a2a] to-[#1c1c1c] p-2 shadow-inner">
      <div className="h-1.5 w-full rounded" style={{ background: track.color }} />
      <div className="w-full truncate text-center text-[10px] font-semibold text-neutral-200" title={track.name}>
        {track.name}
      </div>

      {/* EQ 3-band */}
      <div className="flex w-full flex-col items-center gap-1 rounded border border-black/60 bg-black/30 p-1">
        <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-500">EQ</span>
        <EqKnob label="Hi" value={track.high} onChange={(v) => onChange({ high: v })} color="#22d3ee" />
        <EqKnob label="Md" value={track.mid} onChange={(v) => onChange({ mid: v })} color="#facc15" />
        <EqKnob label="Lo" value={track.low} onChange={(v) => onChange({ low: v })} color="#f87171" />
      </div>

      {/* Reverb send + Pan (knobs) */}
      <div className="flex w-full items-start justify-around rounded border border-black/60 bg-black/30 p-1">
        <RotaryKnob
          label="Rev"
          value={track.reverb}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onChange({ reverb: v })}
          color="#c084fc"
          format={(v) => `${Math.round(v * 100)}%`}
          resetValue={0}
        />
        <RotaryKnob
          label="Pan"
          value={track.pan}
          min={-1}
          max={1}
          step={0.02}
          onChange={(v) => onChange({ pan: v })}
          color="#e5e5e5"
          centerDetent
          resetValue={0}
          format={(v) => (Math.abs(v) < 0.02 ? "C" : v < 0 ? `${Math.round(v * -100)}L` : `${Math.round(v * 100)}R`)}
        />
      </div>


      {/* Fader */}
      <div className="relative flex h-32 w-full items-center justify-center rounded bg-black/50">
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={track.volume}
          onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
          className="h-28 w-2 rotate-0 appearance-none rounded bg-neutral-700 accent-emerald-400"
          // vertical range
          style={{ writingMode: "vertical-lr" as any, direction: "rtl" as any }}
        />
      </div>
      <span className="font-mono text-[10px] text-neutral-400">
        {(20 * Math.log10(Math.max(0.001, track.volume))).toFixed(1)} dB
      </span>

      <div className="flex w-full gap-1">
        <button
          onClick={() => onChange({ muted: !track.muted })}
          className={`flex-1 rounded py-0.5 text-[9px] font-bold ${
            track.muted ? "bg-red-500 text-white" : "bg-black/40 text-neutral-400 hover:text-white"
          }`}
        >
          M
        </button>
        <button
          onClick={() => onChange({ solo: !track.solo })}
          className={`flex-1 rounded py-0.5 text-[9px] font-bold ${
            track.solo ? "bg-yellow-400 text-black" : "bg-black/40 text-neutral-400 hover:text-white"
          }`}
        >
          S
        </button>
      </div>

      {/* Playback preview */}
      <audio controls src={track.url} className="h-6 w-full" />
    </div>
  );
}

function MasterStrip({
  volume,
  onVolume,
  low,
  mid,
  high,
  reverb,
  onLow,
  onMid,
  onHigh,
  onReverb,
}: {
  volume: number;
  onVolume: (v: number) => void;
  low: number;
  mid: number;
  high: number;
  reverb: number;
  onLow: (v: number) => void;
  onMid: (v: number) => void;
  onHigh: (v: number) => void;
  onReverb: (v: number) => void;
}) {
  return (
    <div className="ml-2 flex w-28 shrink-0 flex-col items-center gap-1.5 rounded-md border border-emerald-900/60 bg-gradient-to-b from-[#1e2a24] to-[#0f1a15] p-2 shadow-inner ring-1 ring-emerald-500/20">
      <div className="h-1.5 w-full rounded bg-emerald-400" />
      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Master</div>

      {/* Master EQ */}
      <div className="flex w-full flex-col items-center gap-1 rounded border border-emerald-900/60 bg-black/40 p-1">
        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500/80">EQ</span>
        <EqKnob label="Hi" value={high} onChange={onHigh} color="#22d3ee" />
        <EqKnob label="Md" value={mid} onChange={onMid} color="#facc15" />
        <EqKnob label="Lo" value={low} onChange={onLow} color="#f87171" />
      </div>

      {/* Master Reverb return */}
      <div className="flex w-full items-center justify-center rounded border border-emerald-900/60 bg-black/40 p-1">
        <RotaryKnob
          label="Rev"
          value={reverb}
          min={0}
          max={1}
          step={0.01}
          onChange={onReverb}
          color="#c084fc"
          size={38}
          format={(v) => `${Math.round(v * 100)}%`}
          resetValue={0}
        />
      </div>


      {/* Master Fader */}
      <div className="relative flex h-32 w-full items-center justify-center rounded bg-black/60">
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={volume}
          onChange={(e) => onVolume(parseFloat(e.target.value))}
          className="h-28 w-2 appearance-none rounded bg-neutral-700 accent-emerald-400"
          style={{ writingMode: "vertical-lr" as any, direction: "rtl" as any }}
        />
      </div>
      <span className="font-mono text-[10px] text-emerald-400">
        {(20 * Math.log10(Math.max(0.001, volume))).toFixed(1)} dB
      </span>
      <div className="mt-auto text-[9px] uppercase text-neutral-500">Out</div>
    </div>
  );
}

