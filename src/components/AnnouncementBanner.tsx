import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Announcement = {
  id: string;
  title: string;
  message: string;
  kind: "info" | "warning" | "success";
  active: boolean;
};

const DISMISSED_KEY = "melodia:dismissed-announcements";

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {}
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, message, kind, active")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      setItems((data as Announcement[]) ?? []);
    })();
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])); } catch {}
  };

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 space-y-1 px-3 pt-2">
      {visible.map((a) => {
        const tone =
          a.kind === "warning" ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
          : a.kind === "success" ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300"
          : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300";
        return (
          <div key={a.id} className={`mx-auto flex max-w-4xl items-start gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm backdrop-blur ${tone}`}>
            <div className="min-w-0 flex-1">
              <span className="font-semibold">{a.title}</span>
              <span className="ml-2 text-current/80">{a.message}</span>
            </div>
            <button onClick={() => dismiss(a.id)} className="shrink-0 rounded p-1 hover:bg-current/10" aria-label="Fechar">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
