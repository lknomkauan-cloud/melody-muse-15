import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import AgentesIAView from "@/components/AgentesIAView";
import {
  Shield, Users, Trash2, ShieldCheck, ShieldOff, RefreshCw,
  LayoutDashboard, Bot, Megaphone, Settings as SettingsIcon,
  Plus, Eye, EyeOff, Pencil,
} from "lucide-react";

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
type Announcement = {
  id: string;
  title: string;
  message: string;
  kind: "info" | "warning" | "success";
  active: boolean;
  created_at: string;
};

type TabId = "dashboard" | "users" | "agentes" | "announcements" | "settings";

const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Usuários", icon: Users },
  { id: "agentes", label: "Agentes IA", icon: Bot },
  { id: "announcements", label: "Anúncios", icon: Megaphone },
  { id: "settings", label: "Configurações", icon: SettingsIcon },
];

function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("dashboard");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/auth" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user) {
    return <div className="mx-auto max-w-6xl p-8 text-muted-foreground">Carregando…</div>;
  }
  if (!isAdmin) {
    return <div className="mx-auto max-w-6xl p-8 text-destructive">Acesso negado.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Painel do Admin</h1>
          <p className="text-sm text-muted-foreground">Logado como {user.email}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard" && <DashboardTab userEmail={user.email ?? ""} />}
      {tab === "users" && <UsersTab currentUserId={user.id} />}
      {tab === "agentes" && (
        <div className="-mx-4 sm:-mx-6">
          <AgentesIAView />
        </div>
      )}
      {tab === "announcements" && <AnnouncementsTab userId={user.id} />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

/* ────────── Dashboard ────────── */
function DashboardTab({ userEmail }: { userEmail: string }) {
  const [stats, setStats] = useState({ users: 0, admins: 0, announcements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: admins }, { count: announcements }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
      ]);
      setStats({ users: users ?? 0, admins: admins ?? 0, announcements: announcements ?? 0 });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Usuários" value={stats.users} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Admins" value={stats.admins} />
        <StatCard icon={<Megaphone className="h-4 w-4" />} label="Anúncios" value={stats.announcements} />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-2 font-semibold">Bem-vindo ao painel</h3>
        <p className="text-sm text-muted-foreground">
          Olá, <span className="text-foreground">{userEmail}</span>. Aqui você gerencia usuários,
          publica anúncios globais no site, acessa o catálogo de Agentes de IA e ajusta configurações.
        </p>
        {loading && <p className="mt-2 text-xs text-muted-foreground">Carregando estatísticas…</p>}
      </div>
    </div>
  );
}

/* ────────── Usuários ────────── */
function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  const rolesByUser = new Map<string, string[]>();
  roles.forEach((r) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  });

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    setBusy(true); setMsg(null);
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
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={load}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Atualizar
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
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
                        <span key={r} className={`rounded px-1.5 py-0.5 text-xs ${r === "admin" ? "bg-primary/20 text-primary" : "bg-muted"}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex gap-1">
                      {isAdm ? (
                        <button
                          onClick={() => toggleAdmin(p.id, false)}
                          disabled={busy || p.id === currentUserId}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent disabled:opacity-40"
                          title={p.id === currentUserId ? "Você não pode remover a si mesmo" : "Remover admin"}
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
                        <Trash2 className="h-3 w-3" /> Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ────────── Anúncios ────────── */
function AnnouncementsTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<Announcement["kind"]>("info");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setItems((data as Announcement[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setTitle(""); setMessage(""); setKind("info"); setEditingId(null); };

  const submit = async () => {
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    if (editingId) {
      await supabase.from("announcements").update({ title, message, kind }).eq("id", editingId);
    } else {
      await supabase.from("announcements").insert({ title, message, kind, active: true, created_by: userId });
    }
    reset(); await load(); setBusy(false);
  };

  const toggleActive = async (a: Announcement) => {
    await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Apagar este anúncio?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    await load();
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id); setTitle(a.title); setMessage(a.message); setKind(a.kind);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">{editingId ? "Editar anúncio" : "Novo anúncio"}</h3>
        <div className="space-y-3">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Título" maxLength={80}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensagem exibida no topo do site" rows={4} maxLength={400}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={kind} onChange={(e) => setKind(e.target.value as Announcement["kind"])}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="info">Info (azul)</option>
            <option value="success">Sucesso (verde)</option>
            <option value="warning">Aviso (amarelo)</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={submit} disabled={busy || !title.trim() || !message.trim()}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {editingId ? "Salvar" : "Publicar"}
            </button>
            {editingId && (
              <button onClick={reset} className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">Cancelar</button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum anúncio ainda. Crie um ao lado.
          </p>
        )}
        {items.map((a) => (
          <div key={a.id} className={`rounded-lg border p-3 ${a.active ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-70"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                    a.kind === "warning" ? "bg-yellow-500/20 text-yellow-600" :
                    a.kind === "success" ? "bg-green-500/20 text-green-600" :
                    "bg-blue-500/20 text-blue-600"
                  }`}>{a.kind}</span>
                  <h4 className="truncate font-semibold text-sm">{a.title}</h4>
                </div>
                <p className="mt-1 text-sm text-muted-foreground break-words">{a.message}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => toggleActive(a)} title={a.active ? "Desativar" : "Ativar"}
                  className="rounded-md border border-input p-1.5 hover:bg-accent">
                  {a.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => startEdit(a)} className="rounded-md border border-input p-1.5 hover:bg-accent">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(a.id)} className="rounded-md border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────── Configurações ────────── */
function SettingsTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-2 font-semibold">Ações rápidas</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/escalas" className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">Abrir Escalas</Link>
          <Link to="/quiz" className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">Abrir Quiz</Link>
          <Link to="/acordes" className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">Abrir Acordes</Link>
          <Link to="/metronomo" className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">Abrir Metrônomo</Link>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-2 font-semibold">Sobre o painel</h3>
        <p className="text-sm text-muted-foreground">
          Este painel é visível apenas para administradores. As permissões são aplicadas no backend
          por políticas de segurança — mesmo que alguém tente acessar a URL diretamente sem ser admin,
          as ações são bloqueadas.
        </p>
      </div>
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
