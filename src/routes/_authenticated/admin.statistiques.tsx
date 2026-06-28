import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { ACTIVITY_TYPES, fcfa } from "@/lib/format";
import { FileDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/statistiques")({
  head: () => ({ meta: [{ title: "Statistiques — Admin" }] }),
  component: StatsAdmin,
});

function StatsAdmin() {
  const q = useQuery({
    queryKey: ["admin-stats-full"],
    queryFn: async () => {
      const [acts, regs, profs, pays] = await Promise.all([
        supabase.from("activities").select("id, type, date_activite, status"),
        supabase.from("registrations").select("id, status, heures_effectuees, created_at, activity_id, user_id"),
        supabase.from("profiles").select("id, faculte, status, created_at"),
        supabase.from("payments").select("montant, status, date_paiement"),
      ]);
      return { acts: acts.data ?? [], regs: regs.data ?? [], profs: profs.data ?? [], pays: pays.data ?? [] };
    },
  });
  if (!q.data) return <><PageHeader title="Statistiques" /><PageContent><div>Chargement...</div></PageContent></>;
  const d = q.data;

  // Activités par mois (12 derniers)
  const months: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = dt.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    months[k] = 0;
  }
  d.acts.forEach((a) => {
    const dt = new Date(a.date_activite);
    const k = dt.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    if (k in months) months[k]++;
  });
  const monthData = Object.entries(months).map(([month, count]) => ({ month, activites: count }));

  // Répartition par faculté
  const byFaculte: Record<string, number> = {};
  d.profs.forEach((p) => { const f = p.faculte || "Non renseigné"; byFaculte[f] = (byFaculte[f] || 0) + 1; });
  const facData = Object.entries(byFaculte).map(([name, value]) => ({ name, value }));
  const COLORS = ["oklch(0.42 0.16 255)", "oklch(0.62 0.16 155)", "oklch(0.78 0.16 75)", "oklch(0.55 0.12 290)", "oklch(0.58 0.22 25)", "oklch(0.5 0.1 200)"];

  // Répartition par type
  const byType: Record<string, number> = {};
  d.acts.forEach((a) => { const t = ACTIVITY_TYPES[a.type] || a.type; byType[t] = (byType[t] || 0) + 1; });
  const typeData = Object.entries(byType).map(([name, count]) => ({ name, count }));

  const totalHeures = d.regs.reduce((s, r) => s + Number(r.heures_effectuees || 0), 0);
  const totalPaye = d.pays.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.montant), 0);

  function exportCSV() {
    const rows = [["Indicateur", "Valeur"],
      ["Étudiants inscrits", String(d.profs.length)],
      ["Étudiants actifs", String(d.profs.filter((p) => p.status === "active").length)],
      ["Activités totales", String(d.acts.length)],
      ["Inscriptions totales", String(d.regs.length)],
      ["Heures travaillées", totalHeures.toFixed(1)],
      ["Montant distribué", String(totalPaye)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "statistiques.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Statistiques" description="Indicateurs et tendances du programme." action={<Button variant="outline" onClick={exportCSV}><FileDown className="mr-1 h-4 w-4" />Export CSV</Button>} />
      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Étudiants" value={d.profs.length} />
          <Kpi label="Activités" value={d.acts.length} />
          <Kpi label="Heures totales" value={totalHeures.toFixed(1)} />
          <Kpi label="Montant distribué" value={fcfa(totalPaye)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Activités par mois</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="activites" fill="oklch(0.42 0.16 255)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Répartition par faculté</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={facData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {facData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Activités par type</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={180} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(0.62 0.16 155)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
