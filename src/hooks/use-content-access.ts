import { useAuth } from "./use-auth";

// Normaliza texto (remove acentos, minúsculas, espaços) para comparar instrumentos
export function normalizeInstrument(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Aliases para casar variações escritas pelo usuário no perfil
const ALIASES: Record<string, string[]> = {
  guitarra: ["guitarra", "guitar"],
  violao: ["violao", "viola"],
  baixo: ["baixo", "bass"],
  teclado: ["teclado", "piano", "keyboard"],
  bateria: ["bateria", "drums", "drum"],
  sax: ["sax", "saxofone", "saxophone"],
  violino: ["violino", "violin"],
  flautadoce: ["flautadoce", "flauta", "recorder"],
  banjo: ["banjo"],
  ukulele: ["ukulele", "uke"],
  sanfona: ["sanfona", "acordeon", "accordion"],
};

function slugMatchesAlias(slug: string, value: string): boolean {
  const nSlug = normalizeInstrument(slug);
  const nVal = normalizeInstrument(value);
  if (!nSlug || !nVal) return false;
  if (nSlug === nVal) return true;
  const aliases = ALIASES[nSlug] ?? [nSlug];
  return aliases.some((a) => nVal.includes(a) || a.includes(nVal));
}

/**
 * Retorna se o usuário atual pode acessar o conteúdo daquele instrumento.
 * - Sem sessão / carregando: liberado (UI decide bloquear se preciso).
 * - Admin ou professor: liberado.
 * - Aluno SEM professor vinculado: liberado (ainda escolhendo caminho).
 * - Aluno COM professor: só o instrumento do perfil + unlocked_instruments.
 */
const OWNER_EMAILS = new Set(["luan-kauan1@hotmail.com", "odamarasenganchidori@gmail.com"]);

export function useContentAccess(instrumentSlug?: string) {
  const { user, role, isAdmin, profile, loading } = useAuth();

  if (!instrumentSlug) return { locked: false, ready: !loading };
  if (loading || !user) return { locked: false, ready: !loading };
  if (OWNER_EMAILS.has(user.email?.toLowerCase() ?? "")) return { locked: false, ready: true };
  if (isAdmin || role === "teacher") return { locked: false, ready: true };
  if (!profile || !profile.teacher_id) return { locked: false, ready: true };

  const main = profile.instrument ?? "";
  const unlocked = profile.unlocked_instruments ?? [];
  const allowed = [main, ...unlocked].filter(Boolean);
  const ok = allowed.some((a) => slugMatchesAlias(instrumentSlug, a));
  return { locked: !ok, ready: true };
}

export const ALL_INSTRUMENTS = [
  { slug: "guitarra", label: "Guitarra" },
  { slug: "violao", label: "Violão" },
  { slug: "baixo", label: "Baixo" },
  { slug: "teclado", label: "Teclado / Piano" },
  { slug: "bateria", label: "Bateria" },
  { slug: "sax", label: "Saxofone" },
  { slug: "violino", label: "Violino" },
  { slug: "flautadoce", label: "Flauta doce" },
  { slug: "banjo", label: "Banjo" },
  { slug: "ukulele", label: "Ukulele" },
  { slug: "sanfona", label: "Sanfona" },
] as const;
