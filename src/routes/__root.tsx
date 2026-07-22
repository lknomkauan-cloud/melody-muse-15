import { useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Music, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const { user, isAdmin, profile } = useAuth();
  const navItems = [
    { to: "/", label: "Início" },
    ...(isAdmin ? [{ to: "/admin", label: "Painel do Adm" }] : []),
    { to: "/estudar", label: "Estudar" },
    { to: "/professor", label: "Professor" },
    { to: "/quiz", label: "Quiz" },
    { to: "/escalas", label: "Escalas" },
    { to: "/acordes", label: "Acordes" },
    { to: "/metronomo", label: "Metrônomo" },
    { to: "/afinador", label: "Afinador" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <Music className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold">Solando</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-primary bg-primary/10" }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <div className="ml-2 flex items-center gap-1.5 border-l border-border pl-3">
              <Link
                to="/conta"
                activeProps={{ className: "ring-2 ring-primary" }}
                className="group flex items-center gap-2 rounded-full bg-muted/40 pl-1 pr-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                title="Minha conta"
              >
                <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials || <UserIcon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="hidden md:inline max-w-[100px] truncate">{displayName}</span>
              </Link>
              <button onClick={handleSignOut} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="ml-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Entrar
            </Link>
          )}
        </nav>
        <MobileNav navItems={navItems} user={user} onSignOut={handleSignOut} avatarUrl={profile?.avatar_url ?? null} initials={initials} />
      </div>
    </header>
  );
}

function MobileNav({ navItems, user, onSignOut, avatarUrl, initials }: { navItems: { to: string; label: string }[]; user: ReturnType<typeof useAuth>["user"]; onSignOut: () => void; avatarUrl: string | null; initials: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-2 text-foreground hover:bg-muted"
        aria-label="Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-16 border-t border-border glass">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              {user ? (
                <>
                  <Link to="/conta" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (initials || <UserIcon className="h-3.5 w-3.5" />)}
                    </span>
                    Minha conta
                  </Link>
                  <button onClick={() => { onSignOut(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                  Entrar / Criar conta
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Solando" },
      { name: "description", content: "App completo para estudar teoria musical, praticar com quizzes e usar ferramentas como metrônomo." },
      { property: "og:title", content: "Solando" },
      { property: "og:description", content: "App completo para estudar teoria musical, praticar com quizzes e usar ferramentas como metrônomo." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Solando" },
      { name: "twitter:description", content: "App completo para estudar teoria musical, praticar com quizzes e usar ferramentas como metrônomo." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b039dd2f-2fe6-4d1b-b5cf-cfcabafd91fa/id-preview-525a281c--266fafba-352b-44c0-b421-3dfd740bb333.lovable.app-1782534620845.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b039dd2f-2fe6-4d1b-b5cf-cfcabafd91fa/id-preview-525a281c--266fafba-352b-44c0-b421-3dfd740bb333.lovable.app-1782534620845.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <AnnouncementBanner />
      <div className="pt-16">
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}

