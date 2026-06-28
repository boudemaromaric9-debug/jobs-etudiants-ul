import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Génère une URL signée pour un avatar stocké dans le bucket privé `avatars`.
// `path` doit être de la forme `<user_id>/<filename>`.
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30, // 30 min
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60); // 1h
      if (error) return null;
      return data.signedUrl;
    },
  });
}
