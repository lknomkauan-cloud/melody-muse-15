import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, FileText, PenSquare, LayoutList, Upload, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/apostilas/")({
  head: () => ({
    meta: [
      { title: "Apostilas do meu professor — Solando" },
      { name: "description", content: "Acesse os materiais de estudo criados pelo seu professor no Solando." },
    ],
  }),
  component: ApostilasIndex,
});

type Item = {
  id: string;
  title: string;
  description: string | null;
  instrument: string | null;
  source: "editor" | "blocos" | "upload";
  created_at: string;
};

function ApostilasIndex() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoadingList(true);
      const { data, error } = await supabase.from("apostilas")
        .select("id, title, description, instrument, source, created_at")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      if (!cancelled) { setItems((data as Item[]) ?? []); setLoadingList(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return null;

  if (!profile?.teacher_id) {
    return (
      <main className="min-h-[calc(100vh-4rem)] px-4 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Você ainda não escolheu um professor</h1>
          <p className="mt-2 text-sm text-muted-foreground">As apostilas são criadas por professores do Solando. Escolha um professor para ver os materiais dele.</p>
          <Link to="/escolher-professor" className="mt-4 inline-block">
            <Button>Escolher professor</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-bold">Apostilas</h1>
        <p className="text-sm text-muted-foreground">Materiais criados pelo seu professor.</p>

        {loadingList ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Seu professor ainda não publicou apostilas.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {items.map((a) => {
              const Icon = a.source === "editor" ? PenSquare : a.source === "blocos" ? LayoutList : Upload;
              return (
                <Link key={a.id} to="/apostilas/$id" params={{ id: a.id }}
                  className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition block">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <div className="font-display font-bold truncate">{a.title}</div>
                  </div>
                  {a.instrument && <div className="text-xs text-muted-foreground mt-1">{a.instrument}</div>}
                  {a.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{a.description}</p>}
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                    <BookOpen className="h-3 w-3" /> Abrir apostila
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
