import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import FLStudio from "@/components/FLStudio";
import {
  Sliders,
  BookOpen,
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
      <div className={tab === "estudio" ? "mx-auto max-w-[1600px] px-2 sm:px-4" : "mx-auto max-w-6xl px-4 sm:px-6"}>
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mixagem</h1>
              <p className="text-sm text-muted-foreground">
                Aprenda a mixar e produza no estúdio estilo FL Studio: Channel Rack, Piano Roll, Playlist e Mixer.
              </p>
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-1">
          <TabButton active={tab === "teoria"} onClick={() => setTab("teoria")} icon={<BookOpen className="h-4 w-4" />}>
            Teoria & Guia
          </TabButton>
          <TabButton active={tab === "estudio"} onClick={() => setTab("estudio")} icon={<Layers className="h-4 w-4" />}>
            Estúdio (FL Style)
          </TabButton>
        </div>

        {tab === "teoria" ? <TeoriaPanel /> : <FLStudio />}
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


