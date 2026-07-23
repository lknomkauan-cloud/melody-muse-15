import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Shield, Megaphone, Users, Trash2, Plus, Save, ShieldOff, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do Administrador — Solando" },
      { name: "description", content: "Painel restrito de administração do Solando." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "anuncios" | "usuarios";

function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("anuncios");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-2xl border border-border bg-card p-8">
          <ShieldOff className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Acesso negado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é restrita a administradores.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: "anuncios", label: "Anúncios", icon: Megaphone },
    { id: "usuarios", label: "Usuários", icon: Users },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/15 p-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Painel do Administrador</h1>
              <p className="text-xs text-muted-foreground">Controle sobre anúncios e usuários.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> ADM
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "anuncios" && <AnnouncementsManager />}
        {tab === "usuarios" && <UsersManager />}
      </div>
    </div>
  );
}

type Announcement = {
  id: string;
  title: string;
  message: string;
  kind: "info" | "warning" | "success";
  active: boolean;
  created_at: string;
};

function AnnouncementsManager() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<Announcement["kind"]>("info");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, message, kind, active, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Announcement[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!title.trim() || !message.trim()) return toast.error("Preencha título e mensagem");
    setSaving(true);
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(), message: message.trim(), kind, active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Anúncio publicado");
    setTitle(""); setMessage(""); setKind("info");
    void load();
  };

  const toggle = async (a: Announcement) => {
    const { error } = await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    if (error) return toast.error(error.message);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este anúncio?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo anúncio
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex: Nova aba disponível" />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select value={kind} onChange={(e) => setKind(e.target.value as Announcement["kind"])}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="info">Info (azul)</option>
              <option value="success">Sucesso (verde)</option>
              <option value="warning">Aviso (amarelo)</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={400} />
          </div>
        </div>
        <Button onClick={create} disabled={saving} className="mt-4">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Publicar
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold mb-4">Anúncios ({items.length})</h2>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anúncio ainda.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${a.active ? "bg-green-500" : "bg-muted-foreground"}`} />
                    <span className="font-semibold">{a.title}</span>
                    <span className="text-xs uppercase text-muted-foreground">{a.kind}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggle(a)}>
                    {a.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type UserRow = {
  id: string;
  full_name: string | null;
  instrument: string | null;
  roles: AppRole[];
};

function UsersManager() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, instrument"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr || rErr) toast.error((pErr ?? rErr)!.message);
    const map = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r) => {
      const list = map.get(r.user_id) ?? [];
      list.push(r.role as AppRole);
      map.set(r.user_id, list);
    });
    setRows(((profiles ?? []) as { id: string; full_name: string | null; instrument: string | null }[]).map((p) => ({
      ...p,
      roles: map.get(p.id) ?? [],
    })));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const setRole = async (userId: string, role: AppRole, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    void load();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-bold mb-4">Usuários ({rows.length})</h2>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Instrumento</th>
                <th className="py-2 pr-4">Papéis</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const roles: AppRole[] = ["student", "teacher", "admin"];
                return (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{r.full_name || "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.instrument || "—"}</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {r.roles.length === 0 ? <span className="text-xs text-muted-foreground">nenhum</span> : r.roles.map((role) => (
                          <span key={role} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{role}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {roles.map((role) => {
                          const has = r.roles.includes(role);
                          return (
                            <Button key={role} size="sm" variant={has ? "default" : "outline"} onClick={() => setRole(r.id, role, has)}>
                              {has ? "− " : "+ "}{role}
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
