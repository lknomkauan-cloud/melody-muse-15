import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "teacher" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instrument: string | null;
};

const ADMIN_EMAILS = new Set([
  "luan-kauan1@hotmail.com",
  "odamarasenganchidori@gmail.com",
]);

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applySession = (s: Session | null) => {
      if (cancelled) return;
      const nextUser = s?.user ?? null;
      setSession(s);
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setRole(null);
        setProfile(null);
      } else if (ADMIN_EMAILS.has(nextUser.email?.toLowerCase() ?? "")) {
        setIsAdmin(true);
        setRole("admin");
      }
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s);
    });
    supabase.auth.getSession()
      .then(({ data }) => applySession(data.session))
      .catch((error) => {
        console.error("Erro ao carregar sessão", error);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const emailIsAdmin = ADMIN_EMAILS.has(user.email?.toLowerCase() ?? "");

    setIsAdmin(emailIsAdmin);
    if (emailIsAdmin) setRole("admin");

    const loadUserData = async () => {
      try {
        const [{ data: roles, error: rolesError }, { data: prof, error: profileError }] = await Promise.race([
          Promise.all([
            supabase.from("user_roles").select("role").eq("user_id", user.id),
            supabase.from("profiles").select("id, full_name, avatar_url, bio, instrument").eq("id", user.id).maybeSingle(),
          ]),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("Tempo esgotado ao carregar dados da conta")), 7000);
          }),
        ]);

        if (cancelled) return;
        const rs = (roles ?? []).map((r: { role: string }) => r.role as AppRole);
        const admin = emailIsAdmin || rs.includes("admin");
        setIsAdmin(admin);
        setRole(admin ? "admin" : rs.includes("teacher") ? "teacher" : rs.includes("student") ? "student" : null);
        setProfile(prof ?? null);
        if (rolesError || profileError) {
          console.error("Erro ao carregar dados da conta", rolesError ?? profileError);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar dados da conta", error);
        }
      } finally {
      }
    };

    void loadUserData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { session, user, isAdmin, role, profile, loading };
}
