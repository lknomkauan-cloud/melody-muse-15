import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  GraduationCap, Music, Loader2, Camera, Save, LogOut,
  BookOpen, Trophy, Users, Sparkles, Mic2, PenLine,
} from "lucide-react";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Solando" },
      { name: "description", content: "Gerencie seu perfil, avatar e informações da sua conta no Solando." },
    ],
  }),
  component: ContaPage,
});

function ContaPage() {
  const navigate = useNavigate();
  const { user, role, profile, loading, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [instrument, setInstrument] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setInstrument(profile.instrument ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        instrument: instrument.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado!");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const isTeacher = role === "teacher";
  const displayName = fullName || user.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = isAdmin && isTeacher ? "Professor e administrador" : isAdmin ? "Administrador" : isTeacher ? "Professor" : "Aluno";
  const RoleIcon = isAdmin ? Sparkles : isTeacher ? Music : GraduationCap;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Capa + avatar */}
        <div className="relative mb-16 h-40 rounded-3xl bg-gradient-to-br from-primary/30 via-primary/10 to-transparent border border-border overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, hsl(var(--primary)/0.4), transparent 40%), radial-gradient(circle at 80% 60%, hsl(var(--primary)/0.2), transparent 45%)",
          }} />
          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            <div className="relative h-24 w-24 rounded-2xl border-4 border-background bg-card overflow-hidden shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/20 text-2xl font-bold text-primary">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cabeçalho */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 px-2">
          <div>
            <h1 className="font-display text-3xl font-bold">{displayName}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <RoleIcon className="h-4 w-4 text-primary" />
              {roleLabel}
              <span className="mx-1">·</span>
              <span>{user.email}</span>
            </div>
            {instrument && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Mic2 className="h-3 w-3" /> {instrument}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <PenLine className="h-3.5 w-3.5" /> Sobre
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{bio}</p>
          </div>
        )}

        {/* Estatísticas por papel */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {isTeacher ? (
            <>
              <StatCard icon={Users} label="Alunos" value="—" hint="Em breve" />
              <StatCard icon={BookOpen} label="Aulas publicadas" value="—" hint="Em breve" />
              <StatCard icon={Trophy} label="Avaliações" value="—" hint="Em breve" />
            </>
          ) : (
            <>
              <StatCard icon={BookOpen} label="Lições estudadas" value="—" hint="Em breve" />
              <StatCard icon={Trophy} label="Quizzes concluídos" value="—" hint="Em breve" />
              <StatCard icon={Sparkles} label="Sequência" value="—" hint="Dias seguidos" />
            </>
          )}
        </div>

        {/* Editor de perfil */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold mb-1">Editar perfil</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isTeacher
              ? "Complete seu perfil profissional para os alunos te encontrarem."
              : "Personalize sua conta e conte um pouco sobre seus estudos."}
          </p>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="avatar">URL do avatar</Label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..." className="pl-9" />
              </div>
              <p className="text-xs text-muted-foreground">Cole o link de uma imagem sua.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome" maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrument">
                {isTeacher ? "Instrumento(s) que ensina" : "Instrumento que estuda"}
              </Label>
              <Input id="instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)}
                placeholder={isTeacher ? "Ex: Violão, Piano, Sax" : "Ex: Guitarra"} maxLength={80} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">
                {isTeacher ? "Bio profissional" : "Sobre você"}
              </Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder={isTeacher
                  ? "Formação, experiência, estilos que ensina..."
                  : "Seus estilos favoritos, objetivos musicais..."
                }
                rows={5} maxLength={500} />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof BookOpen; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
