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

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadUserData = async (u: User | null) => {
      if (!u) {
        if (!cancelled) {
          setIsAdmin(false);
          setRole(null);
          setProfile(null);
        }
        return;
      }
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.id),
        supabase.from("profiles").select("id, full_name, avatar_url, bio, instrument").eq("id", u.id).maybeSingle(),
      ]);
      if (cancelled) return;
      const rs = (roles ?? []).map((r) => r.role as AppRole);
      setIsAdmin(rs.includes("admin"));
      setRole(rs.includes("teacher") ? "teacher" : rs.includes("admin") ? "admin" : rs.includes("student") ? "student" : null);
      setProfile(prof ?? null);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      loadUserData(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      loadUserData(data.session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, role, profile, loading };
}

