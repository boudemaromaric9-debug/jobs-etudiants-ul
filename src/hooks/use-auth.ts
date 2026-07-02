import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "student" | "sub_admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => fetchRolesAndProfile(s.user!.id), 0);
      } else {
        setRoles([]);
        setProfileStatus(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchRolesAndProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    async function fetchRolesAndProfile(uid: string) {
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("status").eq("id", uid).maybeSingle(),
      ]);
      if (mounted) {
        setRoles((roleData ?? []).map((r) => r.role as AppRole));
        setProfileStatus(profileData?.status ?? null);
      }
    }

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = roles.includes("admin");
  const isSubAdmin = roles.includes("sub_admin");

  return {
    session,
    user,
    roles,
    profileStatus,
    isAdmin,
    isStudent: roles.includes("student"),
    isSubAdmin,
    isProfileActive: isAdmin || isSubAdmin || profileStatus === "active",
    loading,
  };
}