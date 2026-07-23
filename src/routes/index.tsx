import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  BookOpen,
  Guitar,
  Timer,
  ArrowRight,
  Music2,
  Piano,
  Music,
  Settings,
} from "lucide-react";
import heroImage from "../assets/hero-music.png";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solando" },
      { name: "description", content: "App completo para estudar teoria musical, praticar com quizzes e usar ferramentas como metrônomo." },
      { property: "og:title", content: "Solando" },
      { property: "og:description", content: "App completo para estudar teoria musical, praticar com quizzes e usar ferramentas como metrônomo." },
    ],
  }),
  component: HomePage,
});

const features = [
  {
    icon: GraduationCap,
    title: "Quiz de Notas",
    description: "Teste seus conhecimentos identificando notas, intervalos e acordes em tempo real.",
    to: "/quiz",
    color: "text-primary",
  },
  {
    icon: BookOpen,
    title: "Escalas",
    description: "Consulta completa de escalas maiores, menores e modais com graus e notas.",
    to: "/escalas",
    color: "text-accent",
  },
  {
    icon: Guitar,
    title: "Acordes",
    description: "Referência visual de triades, tétrades e inversões para qualquer tonalidade.",
    to: "/acordes",
    color: "text-primary",
  },
  {
    icon: Timer,
    title: "Metrônomo",
    description: "Mantenha o ritmo com o metrônomo integrado, ajustável de 40 a 240 BPM.",
    to: "/metronomo",
    color: "text-accent",
  },
];

function HomePage() {
  const { isAdmin } = useAuth();
  return (
    <div className="min-h-screen">
      {isAdmin && (
        <Link
          to="/admin"
          title="Painel do Administrador"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-display text-sm font-bold text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-primary/50 transition-all hover:scale-105 hover:bg-primary/90"
        >
          <Settings className="h-5 w-5" />
          Painel ADM
        </Link>
      )}
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover opacity-40"
            width={1280}
            height={640}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 backdrop-blur-sm">
            <Music2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Seu companheiro de estudo musical</span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Domine a{" "}
            <span className="text-gradient-primary">música</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Teoria, prática e ferramentas em um só lugar. Aprenda notas, escalas, acordes e ritmo com um app feito para músicos de verdade.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:glow-primary"
            >
              Começar Quiz
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/escalas"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-display font-semibold text-foreground transition-all hover:bg-muted"
            >
              <BookOpen className="h-4 w-4" />
              Explorar Escalas
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Tudo que você precisa para estudar</h2>
            <p className="mt-3 text-muted-foreground">Teoria interativa, quizzes e ferramentas de prática.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Link
                key={f.to}
                to={f.to}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-card/80"
              >
                <div className="mb-4 inline-flex rounded-xl bg-muted p-3">
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div>
              <Piano className="mx-auto h-8 w-8 text-primary mb-3" />
              <div className="font-display text-3xl font-bold">12</div>
              <div className="text-sm text-muted-foreground mt-1">Notas musicais</div>
            </div>
            <div>
              <Music2 className="mx-auto h-8 w-8 text-accent mb-3" />
              <div className="font-display text-3xl font-bold">24</div>
              <div className="text-sm text-muted-foreground mt-1">Escalas principais</div>
            </div>
            <div>
              <Guitar className="mx-auto h-8 w-8 text-primary mb-3" />
              <div className="font-display text-3xl font-bold">48+</div>
              <div className="text-sm text-muted-foreground mt-1">Acordes catalogados</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-gradient-to-br from-secondary/40 to-muted/20 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Pronto para evoluir?</h2>
          <p className="mt-3 text-muted-foreground">Escolha uma ferramenta e comece a praticar agora mesmo.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              <GraduationCap className="h-4 w-4" />
              Quiz de Notas
            </Link>
            <Link
              to="/metronomo"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 font-display font-semibold text-foreground transition-all hover:bg-muted"
            >
              <Timer className="h-4 w-4" />
              Metrônomo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-foreground">Solando</span>
          </div>
          <p className="text-sm text-muted-foreground">Feito para músicos que querem ir além.</p>
        </div>
      </footer>
    </div>
  );
}
