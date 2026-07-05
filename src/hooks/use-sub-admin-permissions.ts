import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ModuleKey } from "@/lib/modules";

/**
 * Récupère les modules actifs autorisés pour le sous-admin connecté.
 * - Admin principal : renvoie `true` pour toutes les permissions (bypass).
 * - Sub-admin : lit ses propres lignes via RLS (SELECT where user_id = auth.uid()).
 * - Autre : aucune permission.
 */
export function useSubAdminPermissions() {
  const { user, isAdmin, isSubAdmin, loading: authLoading } = useAuth();

  const q = useQuery({
    queryKey: ["sub-admin-permissions", user?.id],
    enabled: !!user && isSubAdmin && !isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_admin_permissions")
        .select("module_key, is_active")
        .eq("user_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []).map((r) => r.module_key as ModuleKey);
    },
  });

  const modules = new Set<ModuleKey>(q.data ?? []);

  function hasModule(key: ModuleKey): boolean {
    if (isAdmin) return true;
    if (!isSubAdmin) return false;
    return modules.has(key);
  }

  return {
    loading: authLoading || q.isLoading,
    isAdmin,
    isSubAdmin,
    modules,
    hasModule,
  };
}
