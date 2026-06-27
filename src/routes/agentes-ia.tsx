import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Music2, Bot, Search, ExternalLink, Sparkles, Mic, Brain, Code2,
  Image as ImageIcon, Video, FileText, GraduationCap, Headphones,
  Briefcase, Palette, MessageSquare, Wrench,
} from "lucide-react";

export const Route = createFileRoute("/agentes-ia")({
  component: AgentesIA,
  head: () => ({
    meta: [
      { title: "Agentes de IA — Melodia" },
      { name: "description", content: "Catálogo de agentes e ferramentas de IA — focados em música e além: composição, transcrição, mixagem, escrita, código, imagem, vídeo e mais." },
      { property: "og:title", content: "Agentes de IA — Melodia" },
      { property: "og:description", content: "Catálogo de agentes de IA para música, produtividade, criação, código e pesquisa." },
    ],
  }),
});

type Agent = {
  name: string;
  desc: string;
  url: string;
  tag: string; // "Música" | "Geral" etc
  free?: boolean;
};

type Category = {
  id: string;
  title: string;
  icon: typeof Bot;
  blurb: string;
  agents: Agent[];
};

const categories: Category[] = [
  {
    id: "musica-composicao",
    title: "Música • Composição & Geração",
    icon: Music2,
    blurb: "IA que cria músicas, letras, melodias, MIDI e arranjos completos.",
    agents: [
      { name: "Suno", desc: "Gera músicas completas (voz + instrumental) a partir de prompt.", url: "https://suno.com", tag: "Música" },
      { name: "Udio", desc: "Geração de música com alta fidelidade vocal e estilos diversos.", url: "https://www.udio.com", tag: "Música" },
      { name: "Stable Audio", desc: "Geração de áudio/loops por difusão (Stability AI).", url: "https://stableaudio.com", tag: "Música" },
      { name: "AIVA", desc: "Composição orquestral e cinematográfica assistida por IA.", url: "https://www.aiva.ai", tag: "Música" },
      { name: "Soundraw", desc: "Música royalty-free customizável por mood/tempo/gênero.", url: "https://soundraw.io", tag: "Música" },
      { name: "Mubert", desc: "Streaming/geração infinita por IA para criadores.", url: "https://mubert.com", tag: "Música" },
      { name: "Boomy", desc: "Cria faixas em segundos e publica em plataformas.", url: "https://boomy.com", tag: "Música" },
      { name: "Riffusion", desc: "Modelo de difusão que gera música via espectrogramas.", url: "https://www.riffusion.com", tag: "Música", free: true },
      { name: "Google MusicFX / MusicLM", desc: "Geração experimental de música do Google AI Test Kitchen.", url: "https://aitestkitchen.withgoogle.com/tools/music-fx", tag: "Música", free: true },
      { name: "Meta MusicGen", desc: "Modelo open-source para geração musical condicionada.", url: "https://huggingface.co/spaces/facebook/MusicGen", tag: "Música", free: true },
      { name: "Loudly", desc: "Gerador de trilhas e biblioteca AI para criadores.", url: "https://www.loudly.com", tag: "Música" },
      { name: "Beatoven.ai", desc: "Trilhas únicas por mood para vídeos e podcasts.", url: "https://www.beatoven.ai", tag: "Música" },
    ],
  },
  {
    id: "musica-pratica",
    title: "Música • Estudo, Prática & Transcrição",
    icon: GraduationCap,
    blurb: "Ferramentas para tirar de ouvido, treinar, transcrever e estudar teoria.",
    agents: [
      { name: "Moises.ai", desc: "Separação de stems (voz/bateria/baixo), mudança de tom/tempo.", url: "https://moises.ai", tag: "Música" },
      { name: "Klangio (Melody Scanner)", desc: "Transcrição automática áudio→partitura/MIDI.", url: "https://klang.io", tag: "Música" },
      { name: "Soundslice", desc: "Player/editor que sincroniza partitura e áudio com IA.", url: "https://www.soundslice.com", tag: "Música" },
      { name: "Chordify", desc: "Detecta acordes de qualquer música automaticamente.", url: "https://chordify.net", tag: "Música" },
      { name: "Yousician", desc: "Tutor de instrumento com escuta em tempo real.", url: "https://yousician.com", tag: "Música" },
      { name: "Simply Piano / Guitar", desc: "Aulas adaptativas com reconhecimento de áudio.", url: "https://www.joytunes.com", tag: "Música" },
      { name: "Spotify AI DJ", desc: "DJ pessoal com comentário e curadoria por IA.", url: "https://newsroom.spotify.com/2023-02-22/spotify-debuts-a-new-ai-dj-right-in-your-pocket/", tag: "Música" },
      { name: "Hookpad + Aria", desc: "Composição assistida por IA dentro do Hooktheory.", url: "https://www.hooktheory.com/hookpad-aria", tag: "Música" },
      { name: "Scaler 3", desc: "Plugin de teoria/harmonia com sugestões inteligentes.", url: "https://www.pluginboutique.com/products/8226", tag: "Música" },
    ],
  },
  {
    id: "musica-producao",
    title: "Música • Produção, Mix & Master",
    icon: Headphones,
    blurb: "IA aplicada à mixagem, masterização e remoção/limpeza de áudio.",
    agents: [
      { name: "LANDR", desc: "Masterização automática por IA, distribuição e samples.", url: "https://www.landr.com", tag: "Música" },
      { name: "iZotope Ozone / RX", desc: "Assistentes de mix, master e restauração de áudio.", url: "https://www.izotope.com", tag: "Música" },
      { name: "Adobe Enhance Speech", desc: "Limpa e melhora gravações de voz com IA.", url: "https://podcast.adobe.com/enhance", tag: "Música", free: true },
      { name: "Auphonic", desc: "Nivelamento, denoise e mastering para podcast/música.", url: "https://auphonic.com", tag: "Música" },
      { name: "Krisp", desc: "Cancelamento de ruído em tempo real por IA.", url: "https://krisp.ai", tag: "Geral" },
      { name: "Lalal.ai", desc: "Separação de stems de alta qualidade.", url: "https://www.lalal.ai", tag: "Música" },
    ],
  },
  {
    id: "voz",
    title: "Voz, Canto & Fala",
    icon: Mic,
    blurb: "Síntese vocal, clonagem, dublagem e covers com IA.",
    agents: [
      { name: "ElevenLabs", desc: "Texto-para-fala e clonagem vocal ultra-realistas.", url: "https://elevenlabs.io", tag: "Geral" },
      { name: "Murf.ai", desc: "Vozes profissionais para narração e vídeo.", url: "https://murf.ai", tag: "Geral" },
      { name: "Voicemod / Voice AI", desc: "Modificação de voz em tempo real.", url: "https://www.voicemod.net", tag: "Geral" },
      { name: "Kits.ai", desc: "Vozes/covers cantados com IA, treine seu modelo vocal.", url: "https://www.kits.ai", tag: "Música" },
      { name: "Synthesizer V", desc: "Vocaloid moderno com vozes hiper-realistas.", url: "https://dreamtonics.com/synthesizerv/", tag: "Música" },
      { name: "Vocaloid", desc: "Síntese vocal cantada da Yamaha.", url: "https://www.vocaloid.com", tag: "Música" },
      { name: "Descript", desc: "Editor de áudio/vídeo por texto com Overdub.", url: "https://www.descript.com", tag: "Geral" },
      { name: "Whisper (OpenAI)", desc: "Transcrição/tradução de fala open-source.", url: "https://github.com/openai/whisper", tag: "Geral", free: true },
    ],
  },
  {
    id: "chat",
    title: "Assistentes Conversacionais",
    icon: MessageSquare,
    blurb: "LLMs de uso geral para escrever, pesquisar, programar e raciocinar.",
    agents: [
      { name: "ChatGPT", desc: "Assistente da OpenAI (GPT-5), com voz, imagem e código.", url: "https://chat.openai.com", tag: "Geral" },
      { name: "Claude", desc: "Assistente da Anthropic, forte em raciocínio e texto longo.", url: "https://claude.ai", tag: "Geral" },
      { name: "Google Gemini", desc: "Assistente multimodal do Google integrado ao Workspace.", url: "https://gemini.google.com", tag: "Geral" },
      { name: "Microsoft Copilot", desc: "Copiloto da Microsoft em Windows/Office/Edge.", url: "https://copilot.microsoft.com", tag: "Geral" },
      { name: "Meta AI", desc: "Assistente integrado a WhatsApp/Instagram/Messenger.", url: "https://www.meta.ai", tag: "Geral", free: true },
      { name: "DeepSeek", desc: "LLMs open-weight com forte performance em raciocínio.", url: "https://chat.deepseek.com", tag: "Geral", free: true },
      { name: "Mistral Le Chat", desc: "Assistente francês baseado nos modelos Mistral.", url: "https://chat.mistral.ai", tag: "Geral" },
      { name: "xAI Grok", desc: "Assistente da xAI integrado ao X.", url: "https://grok.com", tag: "Geral" },
      { name: "Pi (Inflection)", desc: "IA conversacional focada em empatia e conversa natural.", url: "https://pi.ai", tag: "Geral", free: true },
      { name: "Qwen Chat", desc: "Modelos da Alibaba com fortes capacidades multilíngues.", url: "https://chat.qwen.ai", tag: "Geral", free: true },
    ],
  },
  {
    id: "pesquisa",
    title: "Pesquisa & Conhecimento",
    icon: Search,
    blurb: "Agentes que vasculham a web e produzem respostas com citações.",
    agents: [
      { name: "Perplexity", desc: "Buscador conversacional com citações em tempo real.", url: "https://perplexity.ai", tag: "Geral" },
      { name: "You.com", desc: "Busca + agentes especializados.", url: "https://you.com", tag: "Geral" },
      { name: "Phind", desc: "Buscador para devs, foco em código e docs.", url: "https://www.phind.com", tag: "Geral" },
      { name: "Elicit", desc: "Assistente de pesquisa acadêmica sobre artigos científicos.", url: "https://elicit.com", tag: "Geral" },
      { name: "Consensus", desc: "Busca respostas em papers revisados por pares.", url: "https://consensus.app", tag: "Geral" },
      { name: "NotebookLM", desc: "Caderno de IA do Google: estude seus próprios PDFs.", url: "https://notebooklm.google.com", tag: "Geral", free: true },
      { name: "ChatGPT Deep Research", desc: "Modo de pesquisa profunda com relatórios longos.", url: "https://openai.com/index/introducing-deep-research/", tag: "Geral" },
    ],
  },
  {
    id: "agentes-autonomos",
    title: "Agentes Autônomos & Automação",
    icon: Bot,
    blurb: "Agentes que executam tarefas, navegam, clicam e orquestram fluxos.",
    agents: [
      { name: "AutoGPT", desc: "Pioneiro open-source de agentes autônomos baseados em LLM.", url: "https://github.com/Significant-Gravitas/AutoGPT", tag: "Geral", free: true },
      { name: "BabyAGI", desc: "Framework minimalista de agentes com tarefas iterativas.", url: "https://github.com/yoheinakajima/babyagi", tag: "Geral", free: true },
      { name: "LangChain / LangGraph", desc: "Framework para construir agentes e fluxos com LLMs.", url: "https://www.langchain.com", tag: "Geral", free: true },
      { name: "CrewAI", desc: "Múltiplos agentes colaborando em papéis e tarefas.", url: "https://www.crewai.com", tag: "Geral" },
      { name: "AutoGen (Microsoft)", desc: "Framework multi-agente para conversação programável.", url: "https://github.com/microsoft/autogen", tag: "Geral", free: true },
      { name: "OpenAI Operator", desc: "Agente que navega na web e executa tarefas pelo usuário.", url: "https://openai.com/index/introducing-operator/", tag: "Geral" },
      { name: "Anthropic Computer Use", desc: "Claude controla o computador (clique, digitação, scroll).", url: "https://www.anthropic.com/news/3-5-models-and-computer-use", tag: "Geral" },
      { name: "Devin (Cognition)", desc: "Engenheiro de software autônomo.", url: "https://devin.ai", tag: "Código" },
      { name: "n8n", desc: "Automação visual com nós de IA integráveis.", url: "https://n8n.io", tag: "Geral", free: true },
      { name: "Zapier Agents", desc: "Agentes que conectam apps e executam ações.", url: "https://zapier.com/agents", tag: "Geral" },
      { name: "Manus", desc: "Agente autônomo generalista chinês.", url: "https://manus.im", tag: "Geral" },
    ],
  },
  {
    id: "codigo",
    title: "Código & Desenvolvimento",
    icon: Code2,
    blurb: "Copilotos e agentes para programar, refatorar e fazer code review.",
    agents: [
      { name: "GitHub Copilot", desc: "Sugestões inline e chat dentro do editor.", url: "https://github.com/features/copilot", tag: "Código" },
      { name: "Cursor", desc: "IDE com IA nativa para pair programming.", url: "https://cursor.com", tag: "Código" },
      { name: "Windsurf (Codeium)", desc: "IDE agente da Codeium.", url: "https://windsurf.com", tag: "Código" },
      { name: "Claude Code", desc: "Agente de codificação no terminal (Anthropic).", url: "https://www.anthropic.com/claude-code", tag: "Código" },
      { name: "OpenAI Codex CLI", desc: "Agente de código em linha de comando.", url: "https://github.com/openai/codex", tag: "Código", free: true },
      { name: "Lovable", desc: "Constrói apps full-stack a partir de prompts.", url: "https://lovable.dev", tag: "Código" },
      { name: "v0 (Vercel)", desc: "Gera UI React/Next a partir de prompts.", url: "https://v0.dev", tag: "Código" },
      { name: "Bolt.new", desc: "Builder full-stack no navegador.", url: "https://bolt.new", tag: "Código" },
      { name: "Replit Agent", desc: "Cria e roda apps direto no Replit.", url: "https://replit.com", tag: "Código" },
      { name: "Tabnine", desc: "Autocompletar de código privado.", url: "https://www.tabnine.com", tag: "Código" },
    ],
  },
  {
    id: "imagem",
    title: "Imagem & Arte",
    icon: ImageIcon,
    blurb: "Geração e edição de imagens com modelos de difusão e multimodais.",
    agents: [
      { name: "Midjourney", desc: "Geração artística de imagens, líder em qualidade estética.", url: "https://midjourney.com", tag: "Geral" },
      { name: "DALL·E 3", desc: "Imagens via ChatGPT/Bing com forte aderência ao prompt.", url: "https://openai.com/dall-e-3", tag: "Geral" },
      { name: "Stable Diffusion", desc: "Modelo open-source de difusão (Stability AI).", url: "https://stability.ai", tag: "Geral", free: true },
      { name: "Flux (Black Forest Labs)", desc: "Família moderna de modelos de imagem.", url: "https://blackforestlabs.ai", tag: "Geral" },
      { name: "Ideogram", desc: "Imagens com tipografia legível e cartazes.", url: "https://ideogram.ai", tag: "Geral" },
      { name: "Adobe Firefly", desc: "Suite generativa integrada ao Creative Cloud.", url: "https://firefly.adobe.com", tag: "Geral" },
      { name: "Leonardo.ai", desc: "Geração + ferramentas para game art e design.", url: "https://leonardo.ai", tag: "Geral" },
      { name: "Recraft", desc: "Vetores, ícones e imagens consistentes por estilo.", url: "https://recraft.ai", tag: "Geral" },
      { name: "Krea", desc: "Geração em tempo real e ferramentas criativas.", url: "https://krea.ai", tag: "Geral" },
    ],
  },
  {
    id: "video",
    title: "Vídeo & Animação",
    icon: Video,
    blurb: "Texto-para-vídeo, lip-sync, avatares e edição assistida.",
    agents: [
      { name: "Runway", desc: "Gen-3/Gen-4: texto/imagem para vídeo cinematográfico.", url: "https://runwayml.com", tag: "Geral" },
      { name: "OpenAI Sora", desc: "Vídeos realistas a partir de texto (OpenAI).", url: "https://sora.com", tag: "Geral" },
      { name: "Google Veo", desc: "Vídeo de alta qualidade do DeepMind.", url: "https://deepmind.google/technologies/veo/", tag: "Geral" },
      { name: "Pika", desc: "Vídeos curtos e efeitos divertidos por IA.", url: "https://pika.art", tag: "Geral" },
      { name: "Kling AI", desc: "Texto-para-vídeo de longa duração (Kuaishou).", url: "https://klingai.com", tag: "Geral" },
      { name: "Luma Dream Machine", desc: "Geração rápida de vídeo da Luma Labs.", url: "https://lumalabs.ai/dream-machine", tag: "Geral" },
      { name: "HeyGen", desc: "Avatares falantes e dublagem multilíngue.", url: "https://heygen.com", tag: "Geral" },
      { name: "Synthesia", desc: "Vídeos corporativos com avatares por IA.", url: "https://synthesia.io", tag: "Geral" },
      { name: "CapCut AI", desc: "Edição de vídeo com legendas, cortes e efeitos por IA.", url: "https://www.capcut.com", tag: "Geral" },
    ],
  },
  {
    id: "escrita",
    title: "Escrita & Produtividade",
    icon: FileText,
    blurb: "Assistentes para escrever, resumir, traduzir e organizar conhecimento.",
    agents: [
      { name: "Notion AI", desc: "IA dentro do Notion para escrever, resumir e gerenciar.", url: "https://www.notion.so/product/ai", tag: "Geral" },
      { name: "Grammarly", desc: "Revisão e reescrita de textos com IA.", url: "https://www.grammarly.com", tag: "Geral" },
      { name: "DeepL Write / Translate", desc: "Tradução e reescrita de alta qualidade.", url: "https://www.deepl.com", tag: "Geral" },
      { name: "Jasper", desc: "Plataforma de marketing e copywriting com IA.", url: "https://jasper.ai", tag: "Negócios" },
      { name: "Copy.ai", desc: "Geração de copy e fluxos GTM.", url: "https://copy.ai", tag: "Negócios" },
      { name: "Mem", desc: "Notas auto-organizadas por IA.", url: "https://mem.ai", tag: "Geral" },
      { name: "Reflect", desc: "Notas com IA integrada (GPT).", url: "https://reflect.app", tag: "Geral" },
    ],
  },
  {
    id: "negocios",
    title: "Negócios, Vendas & Suporte",
    icon: Briefcase,
    blurb: "Agentes verticais para vendas, atendimento, RH e analytics.",
    agents: [
      { name: "Salesforce Agentforce", desc: "Plataforma de agentes de IA para CRM.", url: "https://www.salesforce.com/agentforce/", tag: "Negócios" },
      { name: "HubSpot Breeze", desc: "Copilotos e agentes dentro do HubSpot.", url: "https://www.hubspot.com/products/artificial-intelligence", tag: "Negócios" },
      { name: "Intercom Fin", desc: "Agente de suporte ao cliente resolutivo.", url: "https://www.intercom.com/fin", tag: "Negócios" },
      { name: "Sierra", desc: "Agentes de atendimento conversacional para empresas.", url: "https://sierra.ai", tag: "Negócios" },
      { name: "Decagon", desc: "Agentes de IA para CX/atendimento.", url: "https://decagon.ai", tag: "Negócios" },
      { name: "Cognosys", desc: "Agentes que pesquisam e produzem relatórios.", url: "https://www.cognosys.ai", tag: "Negócios" },
      { name: "Lindy", desc: "Plataforma para criar agentes pessoais/empresariais.", url: "https://www.lindy.ai", tag: "Negócios" },
      { name: "11x", desc: "SDRs digitais autônomos para vendas.", url: "https://www.11x.ai", tag: "Negócios" },
    ],
  },
  {
    id: "design",
    title: "Design & UX",
    icon: Palette,
    blurb: "IA para protótipos, design systems e identidade visual.",
    agents: [
      { name: "Figma AI", desc: "Recursos de IA dentro do Figma (Make, Buzz).", url: "https://www.figma.com/ai/", tag: "Design" },
      { name: "Galileo AI (Stitch)", desc: "Gera designs de UI a partir de prompts (agora Google Stitch).", url: "https://stitch.withgoogle.com", tag: "Design" },
      { name: "Uizard", desc: "Wireframes/protótipos a partir de descrições ou rabiscos.", url: "https://uizard.io", tag: "Design" },
      { name: "Looka", desc: "Geração de logos e identidade de marca.", url: "https://looka.com", tag: "Design" },
      { name: "Magnific", desc: "Upscale e enriquecimento de imagens com IA.", url: "https://magnific.ai", tag: "Design" },
    ],
  },
  {
    id: "raciocinio",
    title: "Raciocínio, Ciência & Robótica",
    icon: Brain,
    blurb: "Modelos de fronteira focados em matemática, ciência e mundo físico.",
    agents: [
      { name: "OpenAI o-series", desc: "Modelos de raciocínio profundo (o1/o3).", url: "https://openai.com/index/introducing-openai-o1-preview/", tag: "Pesquisa" },
      { name: "DeepMind AlphaFold", desc: "Predição da estrutura 3D de proteínas.", url: "https://deepmind.google/technologies/alphafold/", tag: "Pesquisa", free: true },
      { name: "DeepMind AlphaProof", desc: "IA que prova teoremas de matemática olímpica.", url: "https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/", tag: "Pesquisa" },
      { name: "Wolfram Alpha + LLM", desc: "Motor de conhecimento computacional com IA.", url: "https://www.wolframalpha.com", tag: "Pesquisa" },
      { name: "Figure 02 / 1X Neo", desc: "Robôs humanoides controlados por modelos de IA.", url: "https://figure.ai", tag: "Robótica" },
      { name: "Tesla Optimus", desc: "Humanoide da Tesla com IA de visão e linguagem.", url: "https://www.tesla.com/AI", tag: "Robótica" },
    ],
  },
  {
    id: "infra",
    title: "Infra, Modelos & APIs",
    icon: Wrench,
    blurb: "Provedores de modelos, gateways e plataformas para construir agentes.",
    agents: [
      { name: "OpenAI Platform", desc: "API GPT/Realtime/Assistants/Responses.", url: "https://platform.openai.com", tag: "Infra" },
      { name: "Anthropic API", desc: "API dos modelos Claude.", url: "https://www.anthropic.com/api", tag: "Infra" },
      { name: "Google AI Studio / Vertex", desc: "Modelos Gemini via API.", url: "https://ai.google.dev", tag: "Infra" },
      { name: "Hugging Face", desc: "Hub de modelos open-source, Spaces e Inference.", url: "https://huggingface.co", tag: "Infra", free: true },
      { name: "Replicate", desc: "Roda modelos open-source via API.", url: "https://replicate.com", tag: "Infra" },
      { name: "Groq", desc: "Inferência ultra-rápida com LPUs.", url: "https://groq.com", tag: "Infra" },
      { name: "Together AI", desc: "Hospedagem e fine-tuning de modelos abertos.", url: "https://www.together.ai", tag: "Infra" },
      { name: "OpenRouter", desc: "Gateway unificado para dezenas de LLMs.", url: "https://openrouter.ai", tag: "Infra" },
      { name: "Ollama", desc: "Roda LLMs open-source localmente.", url: "https://ollama.com", tag: "Infra", free: true },
      { name: "LM Studio", desc: "Interface desktop para rodar LLMs locais.", url: "https://lmstudio.ai", tag: "Infra", free: true },
    ],
  },
];

function AgentesIA() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const totalAgents = useMemo(
    () => categories.reduce((sum, c) => sum + c.agents.length, 0),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => activeCat === "all" || c.id === activeCat)
      .map((c) => ({
        ...c,
        agents: c.agents.filter(
          (a) =>
            !q ||
            a.name.toLowerCase().includes(q) ||
            a.desc.toLowerCase().includes(q) ||
            a.tag.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.agents.length > 0);
  }, [query, activeCat]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Catálogo curado • {totalAgents}+ agentes de IA
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Agentes de IA do mundo
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Uma coleção dos principais agentes e ferramentas de IA — com foco em
          <span className="text-primary"> música</span> (composição, transcrição,
          mix, voz e estudo) e também os melhores fora do nosso nicho: chat,
          pesquisa, código, imagem, vídeo, negócios e infra.
        </p>
      </header>

      {/* Search + filter */}
      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar agente, descrição ou tag…"
              className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCat("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCat === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeCat === c.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.title.split("•")[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum agente encontrado para "{query}".
        </p>
      )}

      <div className="space-y-12">
        {filtered.map((cat) => {
          const Icon = cat.icon;
          return (
            <section key={cat.id} id={cat.id}>
              <div className="mb-5 flex items-start gap-3">
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    {cat.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{cat.blurb}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cat.agents.map((a) => (
                  <a
                    key={a.name}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-card/80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary">
                        {a.name}
                      </h3>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {a.desc}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {a.tag}
                      </span>
                      {a.free && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                          Grátis / Open
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-xs text-muted-foreground">
        Lista curada e em evolução. Links levam aos sites oficiais. Disponibilidade,
        preços e recursos podem mudar — verifique no provedor.
      </p>
    </main>
  );
}
