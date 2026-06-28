import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageContent, PageHeader, StatCard } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Wallet, Calendar, Trophy, ArrowRight, Megaphone } from "lucide-react";
import { ACTIVITY_TYPES, fcfa, formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — JOBS CAMPUS UL" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

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

  return (
    <>
      <PageHeader
        title={`Bonjour ${p?.prenoms || ""} 👋`}
        description="Voici un aperçu de votre activité campus."
      />
      <PageContent>
        {p?.status === "pending" && (
          <div className="mb-6 rounded-xl border border-warning/40 bg-warning/15 p-4 text-sm">
            <strong>Profil en attente de validation.</strong> Complétez votre profil et patientez la validation de l'administration pour vous inscrire aux activités.
            <Button asChild size="sm" variant="link"><Link to="/profil">Compléter mon profil →</Link></Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Heures effectuées" value={Number(p?.total_heures ?? 0).toFixed(1)} icon={Clock} hint="cumulé" />
          <StatCard label="Gains cumulés" value={fcfa(p?.total_gains)} icon={Wallet} accent="success" />
          <StatCard label="Score qualité" value={Number(p?.score ?? 0).toFixed(1) + " / 5"} icon={Trophy} accent="accent" />
          <StatCard label="Statut" value={p?.status === "active" ? "Actif" : p?.status === "suspended" ? "Suspendu" : "En attente"} icon={Calendar} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activités ouvertes</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link to="/activites">Voir tout <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activitiesQ.isLoading && <div className="text-sm text-muted-foreground">Chargement...</div>}
              {activitiesQ.data?.length === 0 && <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Aucune activité ouverte pour le moment.</div>}
              {activitiesQ.data?.map((a) => (
                <Link key={a.id} to="/activites" className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{a.titre}</div>
                      <div className="text-xs text-muted-foreground">{ACTIVITY_TYPES[a.type] ?? a.type} · {a.lieu}</div>
                    </div>
                    <Badge variant="secondary">{fcfa(a.remuneration)}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{formatDate(a.date_activite)} · {formatTime(a.heure_debut)}–{formatTime(a.heure_fin)}</div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Annonces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcementsQ.data?.length === 0 && <div className="text-sm text-muted-foreground">Aucune annonce.</div>}
              {announcementsQ.data?.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="font-medium text-sm">{n.titre}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-3">{n.contenu}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.created_at)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
