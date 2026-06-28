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

function PaiementsAdmin() {
  const qc = useQueryClient();
  const regs = useQuery({
    queryKey: ["admin-regs-payable"],
    queryFn: async () => {
      const { data } = await supabase
        .from("registrations")
        .select("*, profiles:profiles!registrations_user_id_fkey(nom, prenoms, faculte, niveau), activities(titre, date_activite, lieu)")
        .eq("status", "attended");
      return data ?? [];
    },
  });

  const payments = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, profiles:profiles!payments_user_id_fkey(nom, prenoms, faculte, niveau), activities(titre, date_activite, lieu)")
        .order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  const totalDue = (regs.data ?? []).reduce((s, r) => s + Number(r.montant_du || 0), 0);
  const paidList = (payments.data ?? []).filter((p) => p.status === "paid");
  const totalPaidStudent = paidList.reduce((s, p: any) => s + Number(p.montant_etudiant ?? p.montant * 0.75), 0);
  const totalInstitution = paidList.reduce((s, p: any) => s + Number(p.montant_institution ?? p.montant * 0.25), 0);

  async function generatePayment(reg: any) {
    const { error } = await supabase.from("payments").insert({
      user_id: reg.user_id, activity_id: reg.activity_id, registration_id: reg.id,
      montant: reg.montant_du, status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Bulletin de paie généré (75 % étudiant / 25 % institution)");
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  }

  async function markPaid(p: any) {
    const partEtud = Number(p.montant_etudiant ?? Math.round(p.montant * 0.75));
    if (!confirm(`Valider le virement de ${fcfa(partEtud)} à ${p.profiles?.prenoms} ${p.profiles?.nom} ?`)) return;
    const { error } = await supabase.from("payments").update({ status: "paid", date_paiement: new Date().toISOString() }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    const { data: prof } = await supabase.from("profiles").select("total_gains").eq("id", p.user_id).maybeSingle();
    if (prof) await supabase.from("profiles").update({ total_gains: Number(prof.total_gains) + partEtud }).eq("id", p.user_id);
    toast.success("Paiement validé");
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  }

  function printPayslip(p: any) {
    const part = Number(p.montant_etudiant ?? Math.round(p.montant * 0.75));
    const inst = Number(p.montant_institution ?? p.montant - part);
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
          <tr><td>Part étudiant·e (75 %)</td><td style="text-align:right"><strong>${fcfa(part)}</strong></td></tr>
          <tr><td>Part institution Université de Lomé (25 %)</td><td style="text-align:right">${fcfa(inst)}</td></tr>
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
    const rows = [["Étudiant", "Activité", "Montant brut", "Part étudiant (75%)", "Part institution (25%)", "Statut", "Date paiement"]];
    (payments.data ?? []).forEach((p: any) => {
      const part = p.montant_etudiant ?? Math.round(p.montant * 0.75);
      const inst = p.montant_institution ?? p.montant - part;
      rows.push([`${p.profiles?.nom} ${p.profiles?.prenoms}`, p.activities?.titre ?? "", String(p.montant), String(part), String(inst), p.status, p.date_paiement ?? ""]);
    });
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `paiements_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Paiements" description="Règle officielle : 75 % étudiant·e · 25 % institution. Bulletin auto et validation admin obligatoire avant virement." action={<Button variant="outline" onClick={exportCSV}><FileDown className="mr-1 h-4 w-4" />Export CSV</Button>} />
      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Présences à régler" value={fcfa(totalDue)} icon={Clock} accent="accent" />
          <StatCard label="Versé aux étudiants (75 %)" value={fcfa(totalPaidStudent)} icon={Wallet} accent="success" />
          <StatCard label="Quote-part institution (25 %)" value={fcfa(totalInstitution)} icon={Building2} />
          <StatCard label="Bulletins générés" value={payments.data?.length ?? 0} icon={CheckCircle2} />
        </div>

        <h2 className="mt-8 mb-3 font-display text-lg font-semibold">Présences validées · bulletin à générer</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="px-4 py-3">Étudiant</th><th className="px-4 py-3">Activité</th><th className="px-4 py-3">Heures</th><th className="px-4 py-3">Brut</th><th className="px-4 py-3">Part étudiant</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {regs.data?.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{r.profiles?.nom} {r.profiles?.prenoms}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.activities?.titre}<br /><span className="text-xs">{formatDate(r.activities?.date_activite)}</span></td>
                      <td className="px-4 py-3">{Number(r.heures_effectuees).toFixed(1)}</td>
                      <td className="px-4 py-3">{fcfa(r.montant_du)}</td>
                      <td className="px-4 py-3 font-semibold text-success">{fcfa(Math.round(Number(r.montant_du) * 0.75))}</td>
                      <td className="px-4 py-3 text-right"><Button size="sm" onClick={() => generatePayment(r)}>Générer bulletin</Button></td>
                    </tr>
                  ))}
                  {regs.data?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune présence en attente.</td></tr>}
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
                  <tr><th className="px-4 py-3">Étudiant</th><th className="px-4 py-3">Activité</th><th className="px-4 py-3">Brut</th><th className="px-4 py-3">75 %</th><th className="px-4 py-3">25 %</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {payments.data?.map((p: any) => {
                    const part = p.montant_etudiant ?? Math.round(p.montant * 0.75);
                    const inst = p.montant_institution ?? p.montant - part;
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{p.profiles?.nom} {p.profiles?.prenoms}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.activities?.titre ?? "—"}</td>
                        <td className="px-4 py-3">{fcfa(p.montant)}</td>
                        <td className="px-4 py-3 font-semibold text-success">{fcfa(part)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fcfa(inst)}</td>
                        <td className="px-4 py-3"><Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status === "paid" ? "Payé" : "En attente"}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => printPayslip(p)}><Printer className="mr-1 h-4 w-4" />Bulletin</Button>
                            {p.status === "pending" && <Button size="sm" variant="outline" onClick={() => markPaid(p)}>Valider virement</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {payments.data?.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun bulletin émis.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
