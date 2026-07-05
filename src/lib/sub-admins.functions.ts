import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Génère un mot de passe temporaire lisible (12 caractères, base32 sans caractères ambigus).
 */
function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out.slice(0, 4) + "-" + out.slice(4, 8) + "-" + out.slice(8, 12);
}

async function assertCallerIsAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Response("Forbidden", { status: 403 });
}

/**
 * Crée un sous-administrateur. Le mot de passe temporaire est généré côté serveur
 * et renvoyé dans la réponse pour être transmis à l'utilisateur (ou envoyé par email
 * quand le domaine d'envoi sera configuré).
 * Réservé aux administrateurs (vérifié côté serveur).
 */
export const createSubAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().email(),
        nom: z.string().min(1).max(80),
        prenoms: z.string().min(1).max(120),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tempPassword = generateTempPassword();

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nom: data.nom, prenoms: data.prenoms },
    });
    if (createErr) throw new Error(createErr.message);
    const newId = created.user!.id;

    // Le trigger handle_new_user crée profil + rôle 'student'. On ajoute sub_admin.
    const { error: roleInsertErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newId, role: "sub_admin" }, { onConflict: "user_id,role" });
    if (roleInsertErr) throw new Error(roleInsertErr.message);

    // TODO(email): une fois le domaine d'envoi configuré, envoyer ici un email
    // d'invitation avec `tempPassword` et un lien vers /auth. Pour l'instant,
    // on renvoie le mot de passe pour affichage à l'administrateur.
    return {
      user_id: newId,
      email: data.email,
      temp_password: tempPassword,
      email_sent: false as const,
    };
  });

/**
 * Retire le rôle sous-administrateur et ses permissions. Le compte auth reste actif.
 */
export const revokeSubAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ user_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sub_admin_permissions").delete().eq("user_id", data.user_id);
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", "sub_admin");
    return { ok: true };
  });
