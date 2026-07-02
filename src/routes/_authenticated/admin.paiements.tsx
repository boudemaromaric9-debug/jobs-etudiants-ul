import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContent, PageHeader, StatCard } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fcfa, formatDate } from "@/lib/format";
import { Wallet, Clock, CheckCircle2, FileDown, Printer, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/paiements")({
  head: () => ({ meta: [{ title: "Paiements — Admin" }] }),
  component: PaiementsAdmin,
});

// ✅ Helper partagé : normalise split_etudiant en float quoi qu'il arrive en base
// Gère les deux cas : ancienne valeur float (0.75) ou entier accidentel (75)
function toFloat(val: any, fallback = 0.75): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return n > 1 ? n / 100 : n; // 75 → 0.75 | 0.75 → 0.75
}

function PaiementsAdmin() {
  const qc = useQueryClient();

  const regs = useQuery({
    queryKey: ["admin-regs-payable"],
    queryFn: async () => {
      const { data: regList } = await supabase
        .from("registrations")
        .select("*")
        .eq("status", "attended");
      if (!regList || regList.length === 0) return [];

      const userIds = [...new Set(regList.map((r) => r.user_id))];
      const actIds = [...new Set(regList.map((r) => r.activity_id))];

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nom, prenoms, faculte, niveau")
        .in("id", userIds);

      const { data: acts } = await supabase
        .from("activities")
        .select("id, titre, date_activite, lieu, split_etudiant")
        .in("id", actIds);

      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const actMap = new Map((acts ?? []).map((a) => [a.id, a]));

      return regList.map((r) => ({
        ...r,
        profiles: profMap.get(r.user_id) ?? null,
        activities: actMap.get(r.activity_id) ?? null,
        // ✅ toFloat normalise 75 → 0.75 et 0.75 → 0.75
        split_etudiant: toFloat((actMap.get(r.activity_id) as any)?.split_etudiant),
      }));
    },
  });

  const payments = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data: payList } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!payList || payList.length === 0) return [];

      const userIds = [...new Set(payList.map((p) => p.user_id))];
      const actIds = [...new Set(payList.map((p) => p.activity_id))];

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nom, prenoms, faculte, niveau")
        .in("id", userIds);

      const { data: acts } = await supabase
        .from("activities")
        .select("id, titre, date_activite, lieu, split_etudiant")
        .in("id", actIds);

      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const actMap = new Map((acts ?? []).map((a) => [a.id, a]));

      return payList.map((p) => ({
        ...p,
        profiles: profMap.get(p.user_id) ?? null,
        activities: actMap.get(p.activity_id) ?? null,
        // ✅ toFloat normalise 75 → 0.75 et 0.75 → 0.75
        split_etudiant: toFloat((actMap.get(p.activity_id) as any)?.split_etudiant),
      }));
    },
  });

  const totalDue = (regs.data ?? []).reduce((s, r: any) => s + Number(r.montant_du || 0), 0);
  const paidList = (payments.data ?? []).filter((p: any) => p.status === "paid");

  const totalPaidStudent = paidList.reduce((s, p: any) => {
    const split = toFloat(p.split_etudiant);
    return s + Number(p.montant_etudiant ?? Math.round(p.montant * split));
  }, 0);

  const totalInstitution = paidList.reduce((s, p: any) => {
    const split = toFloat(p.split_etudiant);
    return s + Number(p.montant_institution ?? Math.round(p.montant * (1 - split)));
  }, 0);

  async function generatePayment(reg: any) {
    const split = toFloat(reg.split_etudiant); // ✅ toujours float
    const montantEtudiant = Math.round(Number(reg.montant_du) * split);
    const montantInstitution = Math.round(Number(reg.montant_du) * (1 - split));
    const { error } = await supabase.from("payments").insert({
      user_id: reg.user_id,
      activity_id: reg.activity_id,
      registration_id: reg.id,
      montant: reg.montant_du,
      montant_etudiant: montantEtudiant,
      montant_institution: montantInstitution,
      split_etudiant: split, // ✅ stocké en float dans payments aussi
      status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Bulletin généré — ${Math.round(split * 100)}% étudiant / ${Math.round((1 - split) * 100)}% institution`);
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  }

  async function markPaid(p: any) {
    const split = toFloat(p.split_etudiant); // ✅ toujours float
    const partEtud = Number(p.montant_etudiant ?? Math.round(p.montant * split));
    if (!confirm(`Valider le virement de ${fcfa(partEtud)} à ${p.profiles?.prenoms} ${p.profiles?.nom} ?`)) return;
    const { error } = await supabase
      .from("payments")
      .update({ status: "paid", date_paiement: new Date().toISOString() })
      .eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    const { data: prof } = await supabase
      .from("profiles")
      .select("total_gains")
      .eq("id", p.user_id)
      .maybeSingle();
    if (prof) {
      await supabase
        .from("profiles")
        .update({ total_gains: Number(prof.total_gains) + partEtud })
        .eq("id", p.user_id);
    }
    toast.success("Paiement validé");
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  }

  function printPayslip(p: any) {
    const split = toFloat(p.split_etudiant); // ✅ toujours float
    const splitPct = Math.round(split * 100);
    const instPct = 100 - splitPct;
    const part = Number(p.montant_etudiant ?? Math.round(p.montant * split));
    const inst = Number(p.montant_institution ?? Math.round(p.montant * (1 - split)));
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Bulletin de paie</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:40px;color:#111;max-width:720px;margin:auto}
        h1{font-size:22px;margin:0 0 4px}
        .sub{color:#555;font-size:13px}
        .card{border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:16px}
        table{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}
        td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}
        .row{display:flex;justify-content:space-between;margin:4px 0}
        .total{font-weight:700;font-size:18px}
        .stamp{margin-top:48px;display:flex;justify-content:space-between;font-size:12px;color:#555}
      </style></head><body>
      <h1>BULLETIN DE PAIE — JOBS ÉTUDIANTS</h1>
      <div class="sub">Université de Lomé · Programme officiel d'assainissement du campus</div>
      <div class="card">
        <div class="row"><span>Étudiant·e</span><strong>${p.profiles?.prenoms ?? ""} ${p.profiles?.nom ?? ""}</strong></div>
        <div class="row"><span>Faculté / Niveau</span><span>${p.profiles?.faculte ?? "—"} · ${p.profiles?.niveau ?? "—"}</span></div>
        <div class="row"><span>Activité</span><span>${p.activities?.titre ?? "—"}</span></div>
        <div class="row"><span>Date / Lieu</span><span>${p.activities?.date_activite ? formatDate(p.activities.date_activite) : "—"} · ${p.activities?.lieu ?? ""}</span></div>
      </div>
      <div class="card">
        <table>
          <tr><th>Désignation</th><th style="text-align:right">Montant</th></tr>
          <tr><td>Rémunération brute de la séance</td><td style="text-align:right">${fcfa(p.montant)}</td></tr>
          <tr><td>Part étudiant·e (${splitPct} %)</td><td style="text-align:right"><strong>${fcfa(part)}</strong></td></tr>
          <tr><td>Part institution Université de Lomé (${instPct} %)</td><td style="text-align:right">${fcfa(inst)}</td></tr>
          <tr><td class="total">NET À PAYER</td><td class="total" style="text-align:right">${fcfa(part)}</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="row"><span>Statut</span><strong>${p.status === "paid" ? "Validé et payé le " + formatDate(p.date_paiement) : "En attente de validation administrative"}</strong></div>
      </div>
      <div class="stamp">
        <div>Signature étudiant·e<br/><br/>____________________</div>
        <div>Visa Administration UL<br/><br/>____________________</div>
      </div>
      <script>window.print()</script>
      </body></html>`);
    w.document.close();
  }

  function exportCSV() {
    const rows = [["Étudiant", "Activité", "Montant brut", "Part étudiant", "Part institution", "% étudiant", "Statut", "Date paiement"]];
    (payments.data ?? []).forEach((p: any) => {
      const split = toFloat(p.split_etudiant); // ✅ toujours float
      const part = p.montant_etudiant ?? Math.round(p.montant * split);
      const inst = p.montant_institution ?? Math.round(p.montant * (1 - split));
      rows.push([
        `${p.profiles?.prenoms ?? ""} ${p.profiles?.nom ?? ""}`,
        p.activities?.titre ?? "",
        String(p.montant),
        String(part),
        String(inst),
        `${Math.round(split * 100)}%`,
        p.status,
        p.date_paiement ?? "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Paiements"
        description="La répartition étudiant·e / institution est définie par activité. Validation admin obligatoire avant virement."
        action={
          <Button variant="outline" onClick={exportCSV}>
            <FileDown className="mr-1 h-4 w-4" />Export CSV
          </Button>
        }
      />
      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Présences à régler" value={fcfa(totalDue)} icon={Clock} accent="accent" />
          <StatCard label="Versé aux étudiants" value={fcfa(totalPaidStudent)} icon={Wallet} accent="success" />
          <StatCard label="Quote-part institution" value={fcfa(totalInstitution)} icon={Building2} />
          <StatCard label="Bulletins générés" value={payments.data?.length ?? 0} icon={CheckCircle2} />
        </div>

        <h2 className="mt-8 mb-3 font-display text-lg font-semibold">Présences validées · bulletin à générer</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Étudiant</th>
                    <th className="px-4 py-3">Activité</th>
                    <th className="px-4 py-3">Heures</th>
                    <th className="px-4 py-3">Brut</th>
                    <th className="px-4 py-3">Part étudiant</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {regs.data?.map((r: any) => {
                    const split = toFloat(r.split_etudiant); // ✅ toujours float
                    const splitPct = Math.round(split * 100);
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{r.profiles?.prenoms} {r.profiles?.nom}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.activities?.titre}<br />
                          <span className="text-xs">{formatDate(r.activities?.date_activite)}</span>
                        </td>
                        <td className="px-4 py-3">{Number(r.heures_effectuees).toFixed(1)}</td>
                        <td className="px-4 py-3">{fcfa(r.montant_du)}</td>
                        <td className="px-4 py-3 font-semibold">
                          {fcfa(Math.round(Number(r.montant_du) * split))}
                          <span className="ml-1 text-xs text-muted-foreground">({splitPct}%)</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" onClick={() => generatePayment(r)}>Générer bulletin</Button>
                        </td>
                      </tr>
                    );
                  })}
                  {regs.data?.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune présence en attente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <h2 className="mt-8 mb-3 font-display text-lg font-semibold">Bulletins & virements</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Étudiant</th>
                    <th className="px-4 py-3">Activité</th>
                    <th className="px-4 py-3">Brut</th>
                    <th className="px-4 py-3">Part étudiant</th>
                    <th className="px-4 py-3">Part institution</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.data?.map((p: any) => {
                    const split = toFloat(p.split_etudiant); // ✅ toujours float
                    const splitPct = Math.round(split * 100);
                    const instPct = 100 - splitPct;
                    const part = p.montant_etudiant ?? Math.round(p.montant * split);
                    const inst = p.montant_institution ?? Math.round(p.montant * (1 - split));
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{p.profiles?.prenoms} {p.profiles?.nom}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.activities?.titre ?? "—"}</td>
                        <td className="px-4 py-3">{fcfa(p.montant)}</td>
                        <td className="px-4 py-3 font-semibold">
                          {fcfa(part)}
                          <span className="ml-1 text-xs text-muted-foreground">({splitPct}%)</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {fcfa(inst)}
                          <span className="ml-1 text-xs">({instPct}%)</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                            {p.status === "paid" ? "Payé" : "En attente"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => printPayslip(p)}>
                              <Printer className="mr-1 h-4 w-4" />Bulletin
                            </Button>
                            {p.status === "pending" && (
                              <Button size="sm" variant="outline" onClick={() => markPaid(p)}>
                                Valider virement
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {payments.data?.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun bulletin émis.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}