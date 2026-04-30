import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "tutor" | "candidate";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: subscribe BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer DB query
        setTimeout(() => fetchRole(sess.user.id), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchRole(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (uid: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .order("role", { ascending: true }) // admin first alphabetically
      .limit(1)
      .maybeSingle();
    // Prefer admin > tutor > candidate
    const { data: all } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (all && all.length > 0) {
      const roles = all.map((r) => r.role) as AppRole[];
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("tutor")) setRole("tutor");
      else setRole("candidate");
    } else {
      setRole((data?.role as AppRole) ?? null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    window.location.href = "/";
  };

  return (
    <Ctx.Provider value={{ user, session, role, loading, signOut }}>{children}</Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
