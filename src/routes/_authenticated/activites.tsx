import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVITY_TYPES, fcfa, formatDate, formatTime } from "@/lib/format";
import { Calendar, MapPin, Users, ClipboardCheck, X, Mail, Check } from "lucide-react";
import { ProfileGuard } from "@/components/profile-guard";

export const Route = createFileRoute("/_authenticated/activites")({
  head: () => ({ meta: [{ title: "Activités — JOBS ÉTUDIANTS" }] }),
  component: ActivitesPage,
});

function ActivitesPage() {
  const { user, isProfileActive } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const activitiesQ = useQuery({
    queryKey: ["activities-all"],
    enabled: isProfileActive,
    queryFn: async () => {
      const { data: acts } = await supabase
        .from("activities")
        .select("*")
        .in("status", ["open", "closed", "completed"])
        .order("date_activite", { ascending: true });
      if (!acts || acts.length === 0) return [];

      // Compter les inscrits actifs (hors annulés) pour chaque activité
      const counts = await Promise.all(
        acts.map(async (a) => {
          const { count } = await supabase
            .from("registrations")
            .select("*", { count: "exact", head: true })
            .eq("activity_id", a.id)
            .neq("status", "cancelled");
          return { id: a.id, count: count ?? 0 };
        })
      );

      const countMap = new Map(counts.map((c) => [c.id, c.count]));
      return acts.map((a) => ({ ...a, activeCount: countMap.get(a.id) ?? 0 }));
    },
  });

  const myRegsQ = useQuery({
    queryKey: ["my-regs", user?.id],
    enabled: !!user && isProfileActive,
    queryFn: async () => {
      const { data } = await supabase.from("registrations").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const invitationsQ = useQuery({
    queryKey: ["my-invitations", user?.id],
    enabled: !!user && isProfileActive,
    queryFn: async () => {
      const { data } = await supabase
        .from("invitations_activite")
        .select("*, activities(titre, date_activite, heure_debut, heure_fin, lieu, type)")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const myRegByAct = new Map((myRegsQ.data ?? []).map((r) => [r.activity_id, r]));

  async function respondInvitation(id: string, status: "accepted" | "refused") {
    const { error } = await supabase.from("invitations_activite").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "accepted" ? "Invitation acceptée !" : "Invitation refusée.");
    qc.invalidateQueries({ queryKey: ["my-invitations"] });
    qc.invalidateQueries({ queryKey: ["my-regs"] });
    qc.invalidateQueries({ queryKey: ["activities-all"] });
  }

  async function register(activityId: string, remuneration: number) {
    // Upsert au lieu d'un simple insert : si une ligne existe déjà pour ce
    // couple (activity_id, user_id) — ex: une ancienne désinscription
    // ("cancelled") — elle est réactivée au lieu de provoquer une violation
    // de la contrainte unique registrations_activity_id_user_id_key.
    const { error } = await supabase.from("registrations").upsert(
      {
        activity_id: activityId,
        user_id: user!.id,
        status: "registered",
        montant_du: remuneration,
        // Réinitialisation des champs pour éviter d'hériter de données
        // d'une inscription précédente (check-in, scores, etc.)
        // NB: heures_effectuees et montant_du sont NOT NULL en base.
        check_in: null,
        check_out: null,
        heures_effectuees: 0,
        score_ponctualite: null,
        score_discipline: null,
        score_qualite: null,
        note: null,
        montant_gagne: 0,
      },
      { onConflict: "activity_id,user_id" }
    );
    if (error) { toast.error(error.message); return; }
    toast.success("Inscription confirmée !");
    qc.invalidateQueries({ queryKey: ["my-regs"] });
    qc.invalidateQueries({ queryKey: ["activities-all"] });
  }

  async function unregister(regId: string) {
    const { error } = await supabase.from("registrations").update({ status: "cancelled" }).eq("id", regId);
    if (error) { toast.error(error.message); return; }
    toast.success("Désistement enregistré.");
    qc.invalidateQueries({ queryKey: ["my-regs"] });
    qc.invalidateQueries({ queryKey: ["activities-all"] });
  }

  if (!isProfileActive) {
    return (
      <>
        <PageHeader title="Activités" description="Inscrivez-vous aux missions ouvertes du campus." />
        <PageContent><ProfileGuard /></PageContent>
      </>
    );
  }

  const filtered = (activitiesQ.data ?? []).filter((a: any) => {
    const matchSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase()) || a.lieu.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <>
      <PageHeader title="Activités" description="Inscrivez-vous aux missions ouvertes du campus." />
      <PageContent>
        {(invitationsQ.data ?? []).length > 0 && (
          <div className="mb-6 rounded-2xl border border-accent/40 bg-accent/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
              <Mail className="h-4 w-4" /> Invitations en attente ({invitationsQ.data!.length})
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {invitationsQ.data!.map((inv: any) => (
                <div key={inv.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-1 text-sm font-semibold">{inv.activities?.titre ?? "Activité"}</div>
                  <div className="text-xs text-muted-foreground">
                    {inv.activities && (<>{formatDate(inv.activities.date_activite)} · {formatTime(inv.activities.heure_debut)}–{formatTime(inv.activities.heure_fin)} · {inv.activities.lieu}</>)}
                  </div>
                  {inv.message && <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs italic text-muted-foreground">« {inv.message} »</div>}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => respondInvitation(inv.id, "accepted")}><Check className="mr-1 h-3.5 w-3.5" /> Accepter</Button>
                    <Button size="sm" variant="outline" onClick={() => respondInvitation(inv.id, "refused")}><X className="mr-1 h-3.5 w-3.5" /> Refuser</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-3">
          <Input placeholder="Rechercher un titre, un lieu..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(ACTIVITY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {activitiesQ.isLoading && <div className="text-sm text-muted-foreground">Chargement...</div>}
        {filtered.length === 0 && !activitiesQ.isLoading && (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Aucune activité disponible.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a: any) => {
            const reg = myRegByAct.get(a.id);
            const isRegistered = reg && reg.status !== "cancelled";
            const participantCount = a.activeCount ?? 0;
            const isFull = participantCount >= a.max_participants;
            const isPast = new Date(a.date_activite) < new Date(new Date().toDateString());
            return (
              <Card key={a.id} className="overflow-hidden">
                <div className="bg-gradient-hero p-4 text-primary-foreground">
                  <Badge className="bg-white/20 text-white">{ACTIVITY_TYPES[a.type] ?? a.type}</Badge>
                  <h3 className="mt-2 font-display text-lg font-bold leading-tight">{a.titre}</h3>
                </div>
                <CardContent className="space-y-3 p-4">
                  {a.description && <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> {formatDate(a.date_activite)} · {formatTime(a.heure_debut)}–{formatTime(a.heure_fin)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {a.lieu}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" /> {participantCount} / {a.max_participants} inscrits
                      {isFull && <Badge variant="destructive" className="ml-1 text-[10px]">Complet</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Rémunération</div>
                      <div className="font-display text-lg font-bold text-success">{fcfa(a.remuneration)}</div>
                    </div>
                    {isRegistered ? (
                      <Button size="sm" variant="outline" onClick={() => unregister(reg!.id)}>
                        <X className="mr-1 h-4 w-4" /> Se désister
                      </Button>
                    ) : isPast ? (
                      <Button size="sm" disabled>Passée</Button>
                    ) : a.status === "completed" ? (
                      <Button size="sm" disabled>Terminée</Button>
                    ) : isFull || a.status === "closed" ? (
                      <Button size="sm" disabled>Complet</Button>
                    ) : a.status !== "open" ? (
                      <Button size="sm" disabled>Fermée</Button>
                    ) : (
                      <Button size="sm" onClick={() => register(a.id, Number(a.remuneration))}>
                        <ClipboardCheck className="mr-1 h-4 w-4" /> S'inscrire
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageContent>
    </>
  );
}