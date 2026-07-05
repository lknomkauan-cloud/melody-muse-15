import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Trash2, ShieldCheck, ShieldOff, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do Admin — Melodia" },
      { name: "description", content: "Painel administrativo restrito." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPanel,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  instrument: string | null;
  bio: string | null;
  created_at: string;
};

type RoleRow = { user_id: string; role: string };

function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, isAdmin, navigate]);

  const load = async () => {
    setBusy(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, instrument, bio, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p as ProfileRow[]) ?? []);
    setRoles((r as RoleRow[]) ?? []);
    setBusy(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loading || !user) {
    return <div className="mx-auto max-w-6xl p-8 text-muted-foreground">Carregando…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <p className="text-destructive">Acesso negado. Apenas administradores.</p>
      </div>
    );
  }

  const rolesByUser = new Map<string, string[]>();
  roles.forEach((r) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  });

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    setBusy(true);
    setMsg(null);
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      setMsg(error ? `Erro: ${error.message}` : "Admin concedido.");
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      setMsg(error ? `Erro: ${error.message}` : "Admin removido.");
    }
    await load();
  };

  const deleteProfile = async (userId: string) => {
    if (!confirm("Apagar este perfil? (a conta de login permanece)")) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    setMsg(error ? `Erro: ${error.message}` : "Perfil apagado.");
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Painel do Admin</h1>
          <p className="text-sm text-muted-foreground">Bem-vindo, {user.email}</p>
        </div>
        <button
          onClick={load}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      {msg && <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">{msg}</div>}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Usuários" value={profiles.length} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Admins" value={roles.filter((r) => r.role === "admin").length} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Papéis atribuídos" value={roles.length} />
      </div>

      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Usuários & papéis</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Instrumento</th>
                <th className="px-4 py-2">Papéis</th>
                <th className="px-4 py-2">Criado</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const userRoles = rolesByUser.get(p.id) ?? [];
                const isAdm = userRoles.includes("admin");
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2">{p.full_name || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2">{p.instrument || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {userRoles.length === 0 && <span className="text-muted-foreground">—</span>}
                        {userRoles.map((r) => (
                          <span key={r} className={`rounded px-1.5 py-0.5 text-xs ${r === "admin" ? "bg-primary/20 text-primary" : "bg-muted"}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        {isAdm ? (
                          <button
                            onClick={() => toggleAdmin(p.id, false)}
                            disabled={busy || p.id === user.id}
                            className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent disabled:opacity-40"
                            title={p.id === user.id ? "Você não pode remover a si mesmo" : "Remover admin"}
                          >
                            <ShieldOff className="h-3 w-3" /> Remover admin
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleAdmin(p.id, true)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                          >
                            <ShieldCheck className="h-3 w-3" /> Tornar admin
                          </button>
                        )}
                        <button
                          onClick={() => deleteProfile(p.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" /> Apagar perfil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum usuário ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Dica: também é possível gerenciar tudo no <Link to="/agentes-ia" className="underline">painel de backend</Link>.
      </p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
