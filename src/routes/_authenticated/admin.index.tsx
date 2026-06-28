import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContent, PageHeader, StatCard } from "@/components/page-shell";
import { Users, ClipboardList, Wallet, Clock } from "lucide-react";
import { fcfa } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — JOBS ÉTUDIANTS" }] }),
  component: AdminHome,
});

function AdminHome() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, activities, regs, payments] = await Promise.all([
        supabase.from("profiles").select("id, status", { count: "exact" }),
        supabase.from("activities").select("id, status", { count: "exact" }),
        supabase.from("registrations").select("heures_effectuees, status"),
        supabase.from("payments").select("montant, status"),
      ]);
      const studentsActive = (profiles.data ?? []).filter((p) => p.status === "active").length;
      const studentsPending = (profiles.data ?? []).filter((p) => p.status === "pending").length;
      const activitiesOpen = (activities.data ?? []).filter((a) => a.status === "open").length;
      const totalHeures = (regs.data ?? []).reduce((s, r) => s + Number(r.heures_effectuees || 0), 0);
      const totalPaid = (payments.data ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.montant), 0);
      const totalPending = (payments.data ?? []).filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.montant), 0);
      return {
        studentsTotal: profiles.count ?? 0,
        studentsActive, studentsPending,
        activitiesTotal: activities.count ?? 0, activitiesOpen,
        totalHeures, totalPaid, totalPending,
      };
    },
  });

  const s = stats.data;

  return (
    <>
      <PageHeader title="Vue d'ensemble" description="Indicateurs clés du programme." />
      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Étudiants inscrits" value={s?.studentsTotal ?? "—"} icon={Users} hint={`${s?.studentsActive ?? 0} actifs · ${s?.studentsPending ?? 0} en attente`} />
          <StatCard label="Activités" value={s?.activitiesTotal ?? "—"} icon={ClipboardList} hint={`${s?.activitiesOpen ?? 0} ouvertes`} accent="accent" />
          <StatCard label="Heures travaillées" value={Number(s?.totalHeures ?? 0).toFixed(1)} icon={Clock} />
          <StatCard label="Montant distribué" value={fcfa(s?.totalPaid)} icon={Wallet} accent="success" hint={`${fcfa(s?.totalPending)} en attente`} />
        </div>

        <Card className="mt-8">
          <CardHeader><CardTitle>Bienvenue dans l'espace administrateur</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Utilisez le menu pour valider les inscriptions étudiantes, créer et gérer les activités, suivre les présences, générer les paiements et consulter les statistiques.
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
