import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ALL_INSTRUMENTS, normalizeInstrument } from "@/hooks/use-content-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, Users, BookOpen, Plus, Trash2, FileText, Upload, LayoutList, PenSquare,
  Download, Lock, Unlock, Music, ArrowLeft, Bold, Italic, Heading1, List, Save,
import { exportContentAsPdf } from "@/lib/apostila-export";

export const Route = createFileRoute("/regencia")({
  head: () => ({
    meta: [
      { title: "Regência — Sala do Professor — Solando" },
      { name: "description", content: "Painel do professor: gerencie alunos, crie apostilas de estudo e libere conteúdo do app." },
    ],
  }),
  component: RegenciaPage,
});

type Student = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  instrument: string | null;
  unlocked_instruments: string[] | null;
};

type Apostila = {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  instrument: string | null;
  content: { html?: string; blocks?: Block[] };
  pdf_url: string | null;
  source: "editor" | "blocos" | "upload";
  created_at: string;
};

type Block =
  | { kind: "texto"; text: string }
  | { kind: "acorde"; name: string; note: string }
  | { kind: "escala"; tonalidade: string; nome: string }
  | { kind: "ritmo"; bpm: number; descricao: string };

function RegenciaPage() {
  const navigate = useNavigate();
  const { user, role, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const canAccess = isAdmin || role === "teacher";

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!canAccess) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Área do professor</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta sala é exclusiva de professores. Se você é professor, atualize seu papel na aba minha conta.
          </p>
          <Link to="/conta" className="mt-4 inline-block text-primary hover:underline">Ir para minha conta</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-primary/20 p-3">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Regência</h1>
            <p className="text-sm text-muted-foreground">Sala do professor — gerencie seus alunos e apostilas.</p>
          </div>
        </div>

        <Tabs defaultValue="alunos">
          <TabsList>
            <TabsTrigger value="alunos"><Users className="h-4 w-4 mr-1.5" /> Meus alunos</TabsTrigger>
            <TabsTrigger value="apostilas"><BookOpen className="h-4 w-4 mr-1.5" /> Apostilas</TabsTrigger>
          </TabsList>

          <TabsContent value="alunos" className="mt-6">
            <StudentsPanel teacherId={user.id} />
          </TabsContent>

          <TabsContent value="apostilas" className="mt-6">
            <ApostilasPanel teacherId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

/* ---------------- Alunos ---------------- */
function StudentsPanel({ teacherId }: { teacherId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, instrument, unlocked_instruments")
      .eq("teacher_id", teacherId);
    if (error) toast.error(error.message);
    setStudents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [teacherId]);

  const toggle = async (student: Student, slug: string) => {
    const current = new Set(student.unlocked_instruments ?? []);
    if (current.has(slug)) current.delete(slug); else current.add(slug);
    const next = Array.from(current);
    setBusy(student.id + slug);
    const { error } = await supabase.rpc("teacher_set_unlocked", {
      _student_id: student.id, _instruments: next,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, unlocked_instruments: next } : s));
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 font-display text-lg font-bold">Nenhum aluno ainda</h2>
        <p className="mt-1 text-sm text-muted-foreground">Quando um aluno escolher você durante o cadastro, ele aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((s) => {
        const mainSlug = ALL_INSTRUMENTS.find((i) => normalizeInstrument(i.slug) === normalizeInstrument(s.instrument ?? ""))?.slug ?? s.instrument;
        return (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold">
                {s.avatar_url ? <img src={s.avatar_url} alt="" className="h-full w-full object-cover" /> : (s.full_name ?? "?").slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold truncate">{s.full_name ?? "Aluno"}</div>
                <div className="text-xs text-muted-foreground">Instrumento principal: <strong className="text-foreground">{s.instrument ?? "—"}</strong></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Instrumentos liberados</div>
              <div className="flex flex-wrap gap-2">
                {ALL_INSTRUMENTS.map((i) => {
                  const isMain = normalizeInstrument(i.slug) === normalizeInstrument(mainSlug ?? "");
                  const on = isMain || (s.unlocked_instruments ?? []).includes(i.slug);
                  return (
                    <button
                      key={i.slug}
                      disabled={isMain || busy === s.id + i.slug}
                      onClick={() => toggle(s, i.slug)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        on
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground hover:text-foreground"
                      } ${isMain ? "opacity-70 cursor-not-allowed" : ""}`}
                      title={isMain ? "Instrumento principal (sempre liberado)" : on ? "Clique para trancar" : "Clique para liberar"}
                    >
                      {on ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Apostilas ---------------- */
function ApostilasPanel({ teacherId }: { teacherId: string }) {
  const [items, setItems] = useState<Apostila[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("apostilas")
      .select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as unknown as Apostila[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [teacherId]);

  const remove = async (id: string) => {
    if (!confirm("Apagar essa apostila?")) return;
    const { error } = await supabase.from("apostilas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Apostila apagada.");
    void load();
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Materiais visíveis para todos os seus alunos.</p>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nova apostila</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova apostila</DialogTitle></DialogHeader>
            <NewApostilaForm teacherId={teacherId} onDone={() => { setShowCreate(false); void load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg font-bold">Nenhuma apostila ainda</h2>
          <p className="mt-1 text-sm text-muted-foreground">Crie a primeira com o editor de texto, montando por blocos ou enviando um PDF.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((a) => (
            <ApostilaCard key={a.id} apostila={a} onDelete={() => remove(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApostilaCard({ apostila, onDelete }: { apostila: Apostila; onDelete: () => void }) {
  const icon = apostila.source === "editor" ? PenSquare : apostila.source === "blocos" ? LayoutList : Upload;
  const Icon = icon;
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      if (apostila.source === "upload" && apostila.pdf_url) {
        const { data, error } = await supabase.storage.from("apostilas").createSignedUrl(apostila.pdf_url, 60);
        if (error || !data) throw error;
        window.open(data.signedUrl, "_blank");
      } else {
        await exportContentAsPdf(apostila);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao baixar";
      toast.error(msg);
    } finally { setDownloading(false); }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold truncate">{apostila.title}</div>
            {apostila.instrument && <div className="text-xs text-muted-foreground truncate">{apostila.instrument}</div>}
          </div>
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1" aria-label="Apagar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {apostila.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{apostila.description}</p>}
      <div className="mt-4 flex gap-2">
        <Link to="/apostilas/$id" params={{ id: apostila.id }} className="flex-1">
          <Button variant="outline" className="w-full"><BookOpen className="h-4 w-4 mr-1" /> Abrir</Button>
        </Link>
        <Button onClick={download} disabled={downloading} className="flex-1">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" /> PDF</>}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Nova apostila ---------------- */
function NewApostilaForm({ teacherId, onDone }: { teacherId: string; onDone: () => void }) {
  const [mode, setMode] = useState<"editor" | "blocos" | "upload">("editor");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instrument, setInstrument] = useState<string>("");
  const [html, setHtml] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const cmd = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setHtml(editorRef.current?.innerHTML ?? "");
  };

  const addBlock = (kind: Block["kind"]) => {
    const nb: Block = kind === "texto" ? { kind, text: "" }
      : kind === "acorde" ? { kind, name: "", note: "" }
      : kind === "escala" ? { kind, tonalidade: "C", nome: "Maior" }
      : { kind: "ritmo", bpm: 100, descricao: "" };
    setBlocks((b) => [...b, nb]);
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Informe um título");
    setSaving(true);
    try {
      let pdf_url: string | null = null;
      if (mode === "upload") {
        if (!file) throw new Error("Selecione um PDF");
        if (file.type !== "application/pdf") throw new Error("Somente arquivos PDF");
        const path = `${teacherId}/${crypto.randomUUID()}.pdf`;
        const { error: upErr } = await supabase.storage.from("apostilas").upload(path, file);
        if (upErr) throw upErr;
        pdf_url = path;
      }
      const content = mode === "editor" ? { html } : mode === "blocos" ? { blocks } : {};
      const { error } = await supabase.from("apostilas").insert({
        teacher_id: teacherId,
        title: title.trim(),
        description: description.trim() || null,
        instrument: instrument || null,
        content,
        pdf_url,
        source: mode,
      });
      if (error) throw error;
      toast.success("Apostila criada!");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao salvar";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <ModeButton active={mode === "editor"} onClick={() => setMode("editor")} icon={PenSquare} label="Editor de texto" />
        <ModeButton active={mode === "blocos"} onClick={() => setMode("blocos")} icon={LayoutList} label="Blocos musicais" />
        <ModeButton active={mode === "upload"} onClick={() => setMode("upload")} icon={Upload} label="PDF pronto" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ap-title">Título</Label>
          <Input id="ap-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ap-inst">Instrumento (opcional)</Label>
          <select id="ap-inst" value={instrument} onChange={(e) => setInstrument(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Geral / todos</option>
            {ALL_INSTRUMENTS.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ap-desc">Descrição curta (opcional)</Label>
        <Textarea id="ap-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={280} />
      </div>

      {mode === "editor" && (
        <div className="space-y-2">
          <Label>Conteúdo</Label>
          <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/30 p-1">
            <ToolBtn onClick={() => cmd("bold")} icon={Bold} />
            <ToolBtn onClick={() => cmd("italic")} icon={Italic} />
            <ToolBtn onClick={() => cmd("formatBlock", "<h2>")} icon={Heading1} />
            <ToolBtn onClick={() => cmd("insertUnorderedList")} icon={List} />
            <Button size="sm" variant="ghost" onClick={() => {
              const url = prompt("URL da imagem:");
              if (url) cmd("insertImage", url);
            }}>Imagem</Button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
            className="min-h-[240px] rounded-md border border-input bg-background px-4 py-3 text-sm prose prose-invert max-w-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {mode === "blocos" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => addBlock("texto")}>+ Texto</Button>
            <Button size="sm" variant="outline" onClick={() => addBlock("acorde")}>+ Acorde</Button>
            <Button size="sm" variant="outline" onClick={() => addBlock("escala")}>+ Escala</Button>
            <Button size="sm" variant="outline" onClick={() => addBlock("ritmo")}>+ Ritmo</Button>
          </div>
          <div className="space-y-2">
            {blocks.map((b, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase text-primary font-semibold">{b.kind}</span>
                  <button onClick={() => setBlocks(blocks.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <BlockEditor block={b} onChange={(nb) => setBlocks(blocks.map((x, i) => i === idx ? nb : x))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-2">
          <Label htmlFor="ap-file">Arquivo PDF</Label>
          <Input id="ap-file" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file && <p className="text-xs text-muted-foreground">{file.name} — {(file.size / 1024).toFixed(0)} KB</p>}
        </div>
      )}

      <DialogFooter>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar apostila</>}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof PenSquare; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition ${
        active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
      }`}>
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function ToolBtn({ onClick, icon: Icon }: { onClick: () => void; icon: typeof Bold }) {
  return (
    <Button size="sm" variant="ghost" type="button" onClick={onClick} className="h-8 w-8 p-0">
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  if (block.kind === "texto") {
    return <Textarea value={block.text} onChange={(e) => onChange({ kind: "texto", text: e.target.value })} rows={3} placeholder="Explique o conceito..." />;
  }
  if (block.kind === "acorde") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={block.name} onChange={(e) => onChange({ kind: "acorde", name: e.target.value, note: block.note })} placeholder="Nome (Ex: Cmaj7)" />
        <Input value={block.note} onChange={(e) => onChange({ kind: "acorde", name: block.name, note: e.target.value })} placeholder="Anotações (Ex: pestana na casa 3)" />
      </div>
    );
  }
  if (block.kind === "escala") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={block.tonalidade} onChange={(e) => onChange({ kind: "escala", tonalidade: e.target.value, nome: block.nome })} placeholder="Tonalidade (Ex: C)" />
        <Input value={block.nome} onChange={(e) => onChange({ kind: "escala", tonalidade: block.tonalidade, nome: e.target.value })} placeholder="Nome (Ex: Menor melódica)" />
      </div>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Input type="number" value={block.bpm} onChange={(e) => onChange({ kind: "ritmo", bpm: Number(e.target.value), descricao: block.descricao })} placeholder="BPM" />
      <Input value={block.descricao} onChange={(e) => onChange({ kind: "ritmo", bpm: block.bpm, descricao: e.target.value })} placeholder="Descrição do ritmo" />
    </div>
  );
}

/* ---------------- Exportar PDF (editor/blocos) ---------------- */
export async function exportContentAsPdf(apostila: Apostila) {
  const { default: jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-99999px";
  holder.style.top = "0";
  holder.style.width = "780px";
  holder.style.background = "#ffffff";
  holder.style.color = "#111111";
  holder.style.padding = "40px";
  holder.style.fontFamily = "'DM Sans', system-ui, sans-serif";
  holder.innerHTML = renderApostilaAsHtml(apostila);
  document.body.appendChild(holder);
  try {
    const canvas = await html2canvas(holder, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = 0;
    while (y < imgH) {
      pdf.addImage(canvas, "PNG", 0, -y, imgW, imgH);
      y += pageH;
      if (y < imgH) pdf.addPage();
    }
    pdf.save(`${apostila.title || "apostila"}.pdf`);
  } finally {
    document.body.removeChild(holder);
  }
}

export function renderApostilaAsHtml(a: Apostila): string {
  const header = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:28px;margin:0 0 8px;color:#111">${escapeHtml(a.title)}</h1>
    ${a.description ? `<p style="color:#555;margin:0 0 20px">${escapeHtml(a.description)}</p>` : ""}
    <hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />
  `;
  if (a.source === "editor") {
    return header + `<div style="line-height:1.6">${a.content.html ?? ""}</div>`;
  }
  if (a.source === "blocos") {
    const blocks = (a.content.blocks ?? []).map((b) => {
      if (b.kind === "texto") return `<p style="margin:12px 0;line-height:1.6">${escapeHtml(b.text)}</p>`;
      if (b.kind === "acorde") return `<div style="margin:12px 0;padding:10px 14px;border-left:3px solid #4f46e5;background:#f5f4ff"><strong>Acorde:</strong> ${escapeHtml(b.name)}<br/><span style="color:#555">${escapeHtml(b.note)}</span></div>`;
      if (b.kind === "escala") return `<div style="margin:12px 0;padding:10px 14px;border-left:3px solid #0ea5e9;background:#f0f9ff"><strong>Escala:</strong> ${escapeHtml(b.nome)} em ${escapeHtml(b.tonalidade)}</div>`;
      return `<div style="margin:12px 0;padding:10px 14px;border-left:3px solid #f59e0b;background:#fffbeb"><strong>Ritmo:</strong> ${b.bpm} BPM — ${escapeHtml(b.descricao)}</div>`;
    }).join("");
    return header + blocks;
  }
  return header + "<p><em>Este material é um PDF anexo.</em></p>";
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
