import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageContent, PageHeader, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Wallet, Calendar, Trophy, ArrowRight, Megaphone, Lock } from "lucide-react";
import { ACTIVITY_TYPES, fcfa, formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — JOBS ÉTUDIANTS UL" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`profile-live-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["profile", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const activitiesQ = useQuery({
    queryKey: ["activities-open"],
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*").eq("status", "open").order("date_activite").limit(4);
      return data ?? [];
    },
  });

  const announcementsQ = useQuery({
    queryKey: ["announcements-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  const p = profileQ.data;

  // ✅ true si le profil N'EST PAS encore validé par l'admin
  const isPending = !p || p.status === "pending";

  return (
    <>
      <PageHeader
        title={`Bonjour ${p?.prenoms || ""} 👋`}
        description="Voici un aperçu de votre activité campus."
      />
      <PageContent>

        {/* ✅ Bannière d'avertissement si profil en attente */}
        {isPending && (
          <div className="mb-6 rounded-xl border border-warning/40 bg-warning/15 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Lock className="h-4 w-4" />
              Profil en attente de validation.
            </div>
            <p className="text-muted-foreground">
              Votre profil est en cours de vérification par l'administration. 
              Toutes les fonctionnalités seront débloquées dès que votre compte sera validé.
            </p>
            <Button asChild size="sm" variant="link" className="mt-1 px-0">
              <Link to="/profil">Compléter mon profil →</Link>
            </Button>
          </div>
        )}

        {/* Statistiques — toujours visibles */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Heures effectuées" value={Number(p?.total_heures ?? 0).toFixed(1)} icon={Clock} hint="cumulé" />
          <StatCard label="Gains cumulés" value={fcfa(p?.total_gains)} icon={Wallet} accent="success" />
          <StatCard label="Score qualité" value={Number(p?.score ?? 0).toFixed(1) + " / 5"} icon={Trophy} accent="accent" />
          <StatCard label="Statut" value={p?.status === "active" ? "Actif" : p?.status === "suspended" ? "Suspendu" : "En attente"} icon={Calendar} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* ✅ Activités ouvertes — bloquées si profil en attente */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activités ouvertes</CardTitle>
              {/* ✅ Bouton "Voir tout" masqué si profil en attente */}
              {!isPending && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/activites">Voir tout <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* ✅ Overlay de blocage si profil en attente */}
              {isPending ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted p-10 text-center gap-3">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Accès aux activités verrouillé
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Cette fonctionnalité sera disponible une fois votre profil validé par l'administration.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activitiesQ.isLoading && <div className="text-sm text-muted-foreground">Chargement...</div>}
                  {activitiesQ.data?.length === 0 && (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Aucune activité ouverte pour le moment.
                    </div>
                  )}
                  {activitiesQ.data?.map((a) => (
                    <Link key={a.id} to="/activites" className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">{a.titre}</div>
                          <div className="text-xs text-muted-foreground">{ACTIVITY_TYPES[a.type] ?? a.type} · {a.lieu}</div>
                        </div>
                        <Badge variant="secondary">{fcfa(a.remuneration)}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDate(a.date_activite)} · {formatTime(a.heure_debut)}–{formatTime(a.heure_fin)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ Annonces — bloquées si profil en attente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> Annonces
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted p-6 text-center gap-3">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Disponible après validation de votre profil.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcementsQ.data?.length === 0 && (
                    <div className="text-sm text-muted-foreground">Aucune annonce.</div>
                  )}
                  {announcementsQ.data?.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border p-3">
                      <div className="font-medium text-sm">{n.titre}</div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-3">{n.contenu}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </PageContent>
    </>
  );
}