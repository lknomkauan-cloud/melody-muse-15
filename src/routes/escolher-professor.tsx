import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ALL_INSTRUMENTS, normalizeInstrument } from "@/hooks/use-content-access";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Music, GraduationCap, Check, SkipForward } from "lucide-react";

const searchSchema = z.object({ instrumento: z.string().optional() });

export const Route = createFileRoute("/escolher-professor")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Escolha seu professor — Solando" },
      { name: "description", content: "Selecione o professor que vai guiar seus estudos no Solando." },
    ],
  }),
  component: EscolherProfessorPage,
});

type Teacher = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instrument: string | null;
};

function EscolherProfessorPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { instrumento } = Route.useSearch();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const targetInstrument = instrumento ?? profile?.instrument ?? "";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      // Busca papéis de professor
      const { data: teacherRoles } = await supabase
        .from("user_roles").select("user_id").eq("role", "teacher");
      const ids = (teacherRoles ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        if (!cancelled) { setTeachers([]); setLoadingList(false); }
        return;
      }
      const { data: profs } = await supabase
        .from("profiles").select("id, full_name, avatar_url, bio, instrument")
        .in("id", ids);
      const filtered = (profs ?? []).filter((p) => {
        if (!targetInstrument) return true;
        const n1 = normalizeInstrument(p.instrument);
        const n2 = normalizeInstrument(targetInstrument);
        return !n1 || !n2 || n1.includes(n2) || n2.includes(n1);
      });
      if (!cancelled) { setTeachers(filtered); setLoadingList(false); }
    })();
    return () => { cancelled = true; };
  }, [targetInstrument]);

  const pick = async (teacherId: string | null) => {
    if (!user) return;
    setSaving(teacherId ?? "skip");
    // Garante instrumento salvo
    if (targetInstrument) {
      await supabase.from("profiles").upsert({ id: user.id, instrument: targetInstrument });
    }
    const { error } = await supabase.rpc("set_my_teacher", { _teacher_id: teacherId as string });
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success(teacherId ? "Professor vinculado!" : "Você pode escolher um professor depois.");
    navigate({ to: "/" });
  };

  const instrumentLabel = ALL_INSTRUMENTS.find((i) => i.slug === targetInstrument)?.label ?? targetInstrument;

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            Passo final
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Escolha seu professor</h1>
          <p className="mt-2 text-muted-foreground">
            Instrumento escolhido: <strong className="text-foreground">{instrumentLabel || "não definido"}</strong>.
            O professor libera o conteúdo dos outros instrumentos conforme você avança.
          </p>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Music className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-display text-lg font-bold">Ainda não há professores de {instrumentLabel}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Você pode continuar sem professor e escolher um mais tarde na sua conta.</p>
            <Button className="mt-4" onClick={() => pick(null)} disabled={saving === "skip"}>
              {saving === "skip" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar sem professor"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {teachers.map((t) => {
              const initials = (t.full_name ?? "?").slice(0, 2).toUpperCase();
              return (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold">
                      {t.avatar_url ? <img src={t.avatar_url} alt="" className="h-full w-full object-cover" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold truncate">{t.full_name ?? "Professor"}</div>
                      {t.instrument && <div className="text-xs text-muted-foreground truncate">{t.instrument}</div>}
                    </div>
                  </div>
                  {t.bio && <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{t.bio}</p>}
                  <Button className="mt-4" onClick={() => pick(t.id)} disabled={saving === t.id}>
                    {saving === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Estudar com este professor</>}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {teachers.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => pick(null)} disabled={saving === "skip"}>
              <SkipForward className="h-4 w-4 mr-1" /> Pular por enquanto
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
