import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Garde principale de /admin/*. Autorise :
 *   - les utilisateurs avec rôle `admin` (accès total),
 *   - les utilisateurs avec rôle `sub_admin` (accès filtré ensuite par module
 *     dans le beforeLoad de chaque sous-page).
 * Les autres sont renvoyés vers /dashboard.
 */
export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .in("role", ["admin", "sub_admin"]);
    const roles = (data ?? []).map((r) => r.role);
    if (roles.length === 0) throw redirect({ to: "/dashboard" });
    return { adminRoles: roles as ("admin" | "sub_admin")[] };
  },
  component: () => <Outlet />,
});
