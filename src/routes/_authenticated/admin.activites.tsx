import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ACTIVITY_TYPES, ACTIVITY_STATUS_LABEL, fcfa, formatDate, formatTime } from "@/lib/format";
import { Plus, Users, Pencil, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/activites")({
  head: () => ({ meta: [{ title: "Activités — Admin" }] }),
  component: AdminActivites,
});

const empty = {
  titre: "", description: "", type: "nettoyage_amphi",
  date_activite: "", heure_debut: "08:00", heure_fin: "12:00",
  lieu: "", max_participants: 20, remuneration: 5000, responsable: "", responsable_id: "",
  split_etudiant: 0.75,
  type_remuneration: "fixe" as "fixe" | "horaire",
  montant_par_etudiant: 5000, montant_par_heure: 0,
  status: "draft" as "draft" | "open" | "closed" | "cancelled" | "completed",
};

function AdminActivites() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [open, setOpen] = useState(false);
  const [presencesAct, setPresencesAct] = useState<any>(null);

  const q = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*, registrations(count), responsable_user:profiles!activities_responsable_id_fkey(nom,prenoms)").order("date_activite", { ascending: false });
      return data ?? [];
    },
  });

  const staffQ = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,nom,prenoms,faculte").order("nom").limit(500);
      return data ?? [];
    },
  });

  function openCreate() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(a: any) {
    setEditing(a);
    setForm({
      titre: a.titre, description: a.description || "", type: a.type,
      date_activite: a.date_activite, heure_debut: a.heure_debut, heure_fin: a.heure_fin,
      lieu: a.lieu, max_participants: a.max_participants, remuneration: a.remuneration,
      responsable: a.responsable || "", responsable_id: a.responsable_id || "",
      split_etudiant: a.split_etudiant ?? 0.75,
      type_remuneration: a.type_remuneration ?? "fixe",
      montant_par_etudiant: a.montant_par_etudiant ?? 0,
      montant_par_heure: a.montant_par_heure ?? 0,
      status: a.status,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      ...form,
      max_participants: Number(form.max_participants),
      remuneration: Number(form.remuneration),
      split_etudiant: Math.min(1, Math.max(0, Number(form.split_etudiant))),
      montant_par_etudiant: Number(form.montant_par_etudiant) || 0,
      montant_par_heure: Number(form.montant_par_heure) || 0,
    };
    if (!payload.responsable_id) payload.responsable_id = null;
    if (editing) {
      const { error } = await supabase.from("activities").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Activité mise à jour");
    } else {
      const { error } = await supabase.from("activities").insert({ ...payload, created_by: user!.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Activité créée");
    }
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-activities"] });
  }

  return (
    <>
      <PageHeader
        title="Activités"
        description="Créez et gérez les missions d'entretien du campus."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Nouvelle activité</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editing ? "Modifier l'activité" : "Nouvelle activité"}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Titre</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required maxLength={150} /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(ACTIVITY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(ACTIVITY_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} /></div>
                <div><Label>Date</Label><Input type="date" value={form.date_activite} onChange={(e) => setForm({ ...form, date_activite: e.target.value })} required /></div>
                <div><Label>Lieu</Label><Input value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} required maxLength={150} /></div>
                <div><Label>Heure début</Label><Input type="time" value={form.heure_debut} onChange={(e) => setForm({ ...form, heure_debut: e.target.value })} required /></div>
                <div><Label>Heure fin</Label><Input type="time" value={form.heure_fin} onChange={(e) => setForm({ ...form, heure_fin: e.target.value })} required /></div>
                <div><Label>Participants max</Label><Input type="number" min="1" max="500" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} required /></div>
                <div><Label>Rémunération (FCFA)</Label><Input type="number" min="0" value={form.remuneration} onChange={(e) => setForm({ ...form, remuneration: e.target.value })} required /></div>
                <div><Label>Part étudiant (%)</Label><Input type="number" min="0" max="100" step="1" value={Math.round((form.split_etudiant ?? 0.75) * 100)} onChange={(e) => setForm({ ...form, split_etudiant: Number(e.target.value) / 100 })} required />
                  <p className="mt-1 text-[10px] text-muted-foreground">Le reste ({100 - Math.round((form.split_etudiant ?? 0.75) * 100)}%) revient à l'institution.</p>
                </div>
                <div><Label>Type de rémunération</Label>
                  <Select value={form.type_remuneration} onValueChange={(v) => setForm({ ...form, type_remuneration: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixe">Montant fixe par présent</SelectItem>
                      <SelectItem value="horaire">Taux horaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.type_remuneration === "fixe" ? (
                  <div><Label>Montant par étudiant (FCFA)</Label><Input type="number" min="0" value={form.montant_par_etudiant} onChange={(e) => setForm({ ...form, montant_par_etudiant: e.target.value })} /></div>
                ) : (
                  <div><Label>Montant par heure (FCFA)</Label><Input type="number" min="0" value={form.montant_par_heure} onChange={(e) => setForm({ ...form, montant_par_heure: e.target.value })} /></div>
                )}
                <div className="sm:col-span-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  💡 Quand vous passerez le statut à <b>Terminée</b>, chaque étudiant marqué présent recevra automatiquement sa rémunération et une notification.
                </div>
                <div className="sm:col-span-2"><Label>Responsable d'équipe (étudiant ou admin)</Label>
                  <Select value={form.responsable_id || "none"} onValueChange={(v) => setForm({ ...form, responsable_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Aucun —</SelectItem>
                      {staffQ.data?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.prenoms} {s.nom} · {s.faculte ?? ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2"><Label>Nom du responsable terrain (texte libre, optionnel)</Label><Input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} maxLength={150} /></div>
                <DialogFooter className="sm:col-span-2"><Button type="submit">{editing ? "Mettre à jour" : "Créer"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageContent>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Activité</th>
                    <th className="px-4 py-3">Date / heure</th>
                    <th className="px-4 py-3">Inscrits</th>
                    <th className="px-4 py-3">Rému.</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data?.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.titre}</div>
                        <div className="text-xs text-muted-foreground">{ACTIVITY_TYPES[a.type] ?? a.type} · {a.lieu}</div>
                        {((a as any).responsable_user || a.responsable) && <div className="text-[11px] mt-1 inline-block rounded bg-accent/15 px-1.5 py-0.5">Responsable&nbsp;: {(a as any).responsable_user ? `${(a as any).responsable_user.prenoms} ${(a as any).responsable_user.nom}` : a.responsable}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(a.date_activite)}<br /><span className="text-xs">{formatTime(a.heure_debut)}–{formatTime(a.heure_fin)}</span></td>
                      <td className="px-4 py-3">{a.registrations?.[0]?.count ?? 0} / {a.max_participants}</td>
                      <td className="px-4 py-3">{fcfa(a.remuneration)}</td>
                      <td className="px-4 py-3"><Badge variant={a.status === "open" ? "default" : "secondary"}>{ACTIVITY_STATUS_LABEL[a.status]}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setPresencesAct(a)}><Users className="mr-1 h-4 w-4" />Présences</Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {q.data?.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Aucune activité.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </PageContent>

      {presencesAct && <PresencesDialog activity={presencesAct} onClose={() => setPresencesAct(null)} />}
    </>
  );
}

function PresencesDialog({ activity, onClose }: { activity: any; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["regs-for-activity", activity.id],
    queryFn: async () => {
      const { data: regs, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("activity_id", activity.id);
      if (error) { toast.error(error.message); return []; }
      const ids = Array.from(new Set((regs ?? []).map((r: any) => r.user_id)));
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nom, prenoms, faculte")
        .in("id", ids);
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (regs ?? []).map((r: any) => ({ ...r, profiles: byId.get(r.user_id) }));
    },
  });

  async function update(id: string, patch: any) {
    const { error } = await supabase.from("registrations").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["regs-for-activity", activity.id] });
  }

  function computeHours(checkIn: string | null, checkOut: string | null) {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000);
  }

  async function checkIn(id: string) { await update(id, { check_in: new Date().toISOString(), status: "attended" }); }
  async function checkOut(reg: any) {
    const now = new Date().toISOString();
    const hours = computeHours(reg.check_in, now);
    await update(reg.id, { check_out: now, heures_effectuees: hours, status: "attended" });
  }
  async function markNoShow(id: string) { await update(id, { status: "no_show" }); }
  async function rate(id: string, field: string, val: number) {
    const patch: any = { [field]: val };
    await update(id, patch);
    // Update profile score average
    const reg = (q.data ?? []).find((r) => r.id === id);
    if (reg) {
      const newReg = { ...reg, [field]: val };
      const scores = [newReg.score_ponctualite, newReg.score_discipline, newReg.score_qualite].filter((x) => x != null);
      if (scores.length === 3) {
        const avg = scores.reduce((a, b) => a + b, 0) / 3;
        await supabase.rpc; // noop
        await supabase.from("profiles").update({ score: avg }).eq("id", reg.user_id);
      }
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Présences — {activity.titre}</DialogTitle></DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Étudiant</th>
                <th className="px-3 py-2">Arrivée</th>
                <th className="px-3 py-2">Départ</th>
                <th className="px-3 py-2">Heures</th>
                <th className="px-3 py-2">Notes (P/D/Q)</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2"><div className="font-medium">{r.profiles?.nom} {r.profiles?.prenoms}</div><div className="text-xs text-muted-foreground">{r.profiles?.faculte}</div></td>
                  <td className="px-3 py-2 text-xs">{r.check_in ? new Date(r.check_in).toLocaleTimeString("fr-FR") : "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.check_out ? new Date(r.check_out).toLocaleTimeString("fr-FR") : "—"}</td>
                  <td className="px-3 py-2">{Number(r.heures_effectuees).toFixed(1)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {(["score_ponctualite", "score_discipline", "score_qualite"] as const).map((f) => (
                        <Select key={f} value={r[f]?.toString() ?? ""} onValueChange={(v) => rate(r.id, f, Number(v))}>
                          <SelectTrigger className="h-7 w-14 text-xs"><SelectValue placeholder="–" /></SelectTrigger>
                          <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {!r.check_in && <Button size="sm" variant="outline" onClick={() => checkIn(r.id)}><ClipboardCheck className="mr-1 h-3.5 w-3.5" />Arrivée</Button>}
                      {r.check_in && !r.check_out && <Button size="sm" variant="outline" onClick={() => checkOut(r)}>Départ</Button>}
                      {r.status !== "no_show" && r.status !== "attended" && <Button size="sm" variant="ghost" onClick={() => markNoShow(r.id)}>Absent</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {q.data?.length === 0 && <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">Aucun inscrit.</td></tr>}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
