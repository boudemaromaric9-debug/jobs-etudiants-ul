import { createFileRoute } from "@tanstack/react-router";
import { requireAdminModule } from "@/lib/admin-guard";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, UserPlus, ShieldCheck, Loader2, Copy, MailWarning } from "lucide-react";
import { MODULES, type ModuleKey } from "@/lib/modules";
import { createSubAdmin, revokeSubAdmin } from "@/lib/sub-admins.functions";

export const Route = createFileRoute("/_authenticated/admin/sous-admins")({
  ssr: false,
  beforeLoad: () => requireAdminModule(null),
  head: () => ({ meta: [{ title: "Sous-administrateurs — Admin" }] }),
  component: SubAdminsPage,
});

type SubAdminRow = {
  id: string;
  nom: string | null;
  prenoms: string | null;
  email: string | null;
  status: string | null;
};

function SubAdminsPage() {
  const qc = useQueryClient();
  const createFn = useServerFn(createSubAdmin);
  const revokeFn = useServerFn(revokeSubAdmin);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", nom: "", prenoms: "" });
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string; emailSent: boolean } | null>(null);

  const subAdminsQ = useQuery({
    queryKey: ["sub-admins-list"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "sub_admin");
      if (rolesErr) throw rolesErr;
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [] as SubAdminRow[];
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, nom, prenoms, email, status")
        .in("id", ids);
      if (profErr) throw profErr;
      return (profiles ?? []) as SubAdminRow[];
    },
  });

  const permsQ = useQuery({
    queryKey: ["sub-admins-perms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_admin_permissions")
        .select("user_id, module_key, is_active");
      if (error) throw error;
      return data ?? [];
    },
  });

  const permsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    (permsQ.data ?? []).forEach((p) => {
      if (!p.is_active) return;
      if (!map.has(p.user_id)) map.set(p.user_id, new Set());
      map.get(p.user_id)!.add(p.module_key);
    });
    return map;
  }, [permsQ.data]);

  async function toggleModule(userId: string, moduleKey: ModuleKey, enabled: boolean) {
    if (enabled) {
      const { data: authUser } = await supabase.auth.getUser();
      const { error } = await supabase.from("sub_admin_permissions").upsert(
        {
          user_id: userId,
          module_key: moduleKey,
          is_active: true,
          granted_by: authUser.user?.id ?? null,
        },
        { onConflict: "user_id,module_key" },
      );
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("sub_admin_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("module_key", moduleKey);
      if (error) return toast.error(error.message);
    }
    toast.success("Permission mise à jour");
    qc.invalidateQueries({ queryKey: ["sub-admins-perms"] });
  }

  async function handleCreate() {
    if (!form.email || !form.nom || !form.prenoms) {
      return toast.error("Tous les champs sont requis");
    }
    setSubmitting(true);
    try {
      const res = await createFn({ data: form });
      toast.success("Sous-administrateur créé");
      setCredentials({ email: res.email, password: res.temp_password, emailSent: res.email_sent });
      setForm({ email: "", nom: "", prenoms: "" });
      setCreating(false);
      qc.invalidateQueries({ queryKey: ["sub-admins-list"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;
    const text = `Bonjour,\n\nVotre compte sous-administrateur JOBS ÉTUDIANTS a été créé.\n\nEmail : ${credentials.email}\nMot de passe temporaire : ${credentials.password}\n\nConnexion : ${window.location.origin}/auth\nMerci de changer votre mot de passe à la première connexion (Profil > Mot de passe).`;
    await navigator.clipboard.writeText(text);
    toast.success("Identifiants copiés — collez-les à l'utilisateur");
  }

  async function handleRevoke(userId: string, name: string) {
    if (!confirm(`Retirer le rôle sous-administrateur à ${name} ?`)) return;
    try {
      await revokeFn({ data: { user_id: userId } });
      toast.success("Sous-administrateur retiré");
      qc.invalidateQueries({ queryKey: ["sub-admins-list"] });
      qc.invalidateQueries({ queryKey: ["sub-admins-perms"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  }

  const subAdmins = subAdminsQ.data ?? [];

  return (
    <>
      <PageHeader
        title="Sous-administrateurs"
        description="Gérez les comptes délégués et leurs permissions par module."
        action={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Nouveau sous-admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un sous-administrateur</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="prenoms">Prénoms</Label>
                    <Input id="prenoms" value={form.prenoms} onChange={(e) => setForm({ ...form, prenoms: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  Un mot de passe temporaire sécurisé sera généré automatiquement. Il vous sera affiché après la création pour le communiquer à la personne (l'envoi automatique par email sera activé dès qu'un domaine d'envoi sera configuré).
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreating(false)} disabled={submitting}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le compte
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <PageContent>
        {subAdminsQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Chargement…</div>
        ) : subAdmins.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
              <div className="text-sm text-muted-foreground">
                Aucun sous-administrateur. Cliquez sur « Nouveau sous-admin » pour en créer un.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {subAdmins.map((sa) => {
              const perms = permsMap.get(sa.id) ?? new Set<string>();
              const fullName = `${sa.prenoms ?? ""} ${sa.nom ?? ""}`.trim() || sa.email || "Sans nom";
              return (
                <Card key={sa.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{fullName}</CardTitle>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{sa.email}</span>
                        <Badge variant="secondary">{perms.size} module{perms.size > 1 ? "s" : ""}</Badge>
                        {sa.status && <Badge variant="outline">{sa.status}</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(sa.id, fullName)}
                      title="Retirer le rôle sous-admin"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {MODULES.map((m) => {
                        const active = perms.has(m.key);
                        return (
                          <label
                            key={m.key}
                            className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 transition-colors hover:border-primary/40"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{m.label}</div>
                              <div className="text-xs text-muted-foreground">{m.description}</div>
                            </div>
                            <Switch
                              checked={active}
                              onCheckedChange={(v) => toggleModule(sa.id, m.key, v)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageContent>

      <Dialog open={!!credentials} onOpenChange={(o) => !o && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Identifiants du sous-administrateur</DialogTitle>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              {!credentials.emailSent && (
                <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <MailWarning className="h-4 w-4 shrink-0" />
                  <div>
                    L'envoi automatique par email n'est pas encore actif (domaine d'envoi non configuré).
                    Copiez ces identifiants et transmettez-les à la personne par un canal sécurisé.
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Email</Label>
                  <div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">{credentials.email}</div>
                </div>
                <div>
                  <Label className="text-xs">Mot de passe temporaire</Label>
                  <div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">{credentials.password}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCredentials(null)}>Fermer</Button>
                <Button onClick={copyCredentials}>
                  <Copy className="mr-2 h-4 w-4" /> Copier le message complet
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
