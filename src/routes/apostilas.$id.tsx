import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportContentAsPdf, renderApostilaAsHtml } from "@/lib/apostila-export";

export const Route = createFileRoute("/apostilas/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Apostila ${params.id} — Solando` },
      { name: "description", content: "Leia a apostila criada pelo seu professor no Solando." },
    ],
  }),
  component: ApostilaDetail,
});

type Apostila = {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  instrument: string | null;
  content: { html?: string; blocks?: unknown[] };
  pdf_url: string | null;
  source: "editor" | "blocos" | "upload";
  created_at: string;
};

function ApostilaDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [item, setItem] = useState<Apostila | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingItem(true);
      const { data, error } = await supabase.from("apostilas").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (error || !data) { setItem(null); setLoadingItem(false); return; }
      const ap = data as unknown as Apostila;
      setItem(ap);
      if (ap.source === "upload" && ap.pdf_url) {
        const { data: sig } = await supabase.storage.from("apostilas").createSignedUrl(ap.pdf_url, 3600);
        if (!cancelled) setPdfSignedUrl(sig?.signedUrl ?? null);
      }
      setLoadingItem(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const download = async () => {
    if (!item) return;
    setDownloading(true);
    try {
      if (item.source === "upload" && pdfSignedUrl) {
        window.open(pdfSignedUrl, "_blank");
      } else {
        // reconstruct with full Apostila shape
        await exportContentAsPdf({
          ...item,
          content: item.content as { html?: string; blocks?: never },
        } as never);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao baixar";
      toast.error(msg);
    } finally { setDownloading(false); }
  };

  if (loading || loadingItem) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!item) {
    return (
      <main className="min-h-[calc(100vh-4rem)] px-4 py-10">
        <div className="mx-auto max-w-xl text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Apostila não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">Talvez você não tenha acesso a este material.</p>
          <Link to="/apostilas" className="mt-4 inline-block"><Button variant="outline">Voltar</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/apostilas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="mt-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6">
          <h1 className="font-display text-3xl font-bold">{item.title}</h1>
          {item.instrument && <div className="mt-1 text-xs text-muted-foreground">{item.instrument}</div>}
          {item.description && <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>}
          <div className="mt-4">
            <Button onClick={download} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" /> Baixar PDF</>}
            </Button>
          </div>
        </header>

        <article className="mt-6 rounded-2xl border border-border bg-card p-6">
          {item.source === "upload" && pdfSignedUrl ? (
            <iframe src={pdfSignedUrl} className="w-full h-[80vh] rounded-lg border border-border" title={item.title} />
          ) : (
            <div className="prose prose-invert max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: renderApostilaAsHtml(item as never) }} />
          )}
        </article>
      </div>
    </main>
  );
}
