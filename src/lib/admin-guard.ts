import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { ModuleKey } from "@/lib/modules";

/**
 * Garde côté route pour les sous-pages admin.
 * - `admin` : accès total.
 * - `sub_admin` : accès seulement si la permission `moduleKey` est active.
 * - Autres : redirigés vers /dashboard.
 *
 * À appeler dans le `beforeLoad` des routes /_authenticated/admin.<...>.
 * Doit rester en SSR:false (car dépend de la session client).
 */
export async function requireAdminModule(moduleKey: ModuleKey | null) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw redirect({ to: "/auth" });

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", u.user.id);
  const roleSet = new Set((roles ?? []).map((r) => r.role));

  if (roleSet.has("admin")) return; // admin passe partout
  if (!roleSet.has("sub_admin")) throw redirect({ to: "/dashboard" });

  // Sub-admin : vérifier la permission module (lecture directe, protégée par RLS —
  // la policy sur sub_admin_permissions ne renvoie que les lignes user_id = auth.uid()).
  if (moduleKey === null) throw redirect({ to: "/admin" }); // module non délégable
  const { data: perm, error } = await supabase
    .from("sub_admin_permissions")
    .select("is_active")
    .eq("user_id", u.user.id)
    .eq("module_key", moduleKey)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !perm) throw redirect({ to: "/admin" });
}