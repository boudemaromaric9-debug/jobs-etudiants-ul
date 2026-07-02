import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CRENEAU_LABEL, formatDate, formatTime } from "@/lib/format";
import { Users, Send, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/planification")({
  head: () => ({ meta: [{ title: "Planification — JOBS ÉTUDIANTS" }] }),
  component: PlanificationPage,
});

function PlanificationPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [creneau, setCreneau] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activityId, setActivityId] = useState<string>("");
  const [message, setMessage] = useState("");

  const dispoQ = useQuery({
    queryKey: ["dispo-day", date, creneau],
    queryFn: async () => {
      let q = supabase.from("availabilities").select("*, profiles(id, nom, prenoms, email, faculte, niveau)").eq("jour", date);
      if (creneau !== "all") q = q.eq("creneau", creneau as any);
      const { data } = await q.order("creneau");
      return data ?? [];
    },
  });

  const activitiesQ = useQuery({
    queryKey: ["activities-open"],
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("id, titre, date_activite, heure_debut, heure_fin, lieu, max_participants").in("status", ["draft", "open"]).order("date_activite");
      return data ?? [];
    },
  });

  const invitedQ = useQuery({
    queryKey: ["invited", activityId],
    enabled: !!activityId,
    queryFn: async () => {
      const { data } = await supabase.from("invitations_activite").select("user_id, status").eq("activity_id", activityId);
      return data ?? [];
    },
  });

  const invitedSet = useMemo(() => new Set((invitedQ.data ?? []).map((i) => i.user_id)), [invitedQ.data]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function sendInvitations() {
    if (!activityId) { toast.error("Choisissez une activité"); return; }
    if (selected.size === 0) { toast.error("Sélectionnez des étudiants"); return; }
    const rows = Array.from(selected)
      .filter((uid) => !invitedSet.has(uid))
      .map((uid) => ({ activity_id: activityId, user_id: uid, message: message || null }));
    if (rows.length === 0) { toast.error("Tous déjà invités"); return; }
    const { error } = await supabase.from("invitations_activite").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} invitation(s) envoyée(s)`);
    setSelected(new Set());
    setDialogOpen(false);
    setMessage("");
    qc.invalidateQueries({ queryKey: ["invited"] });
  }

  return (
    <>
      <PageHeader title="Planification" description="Croisez les disponibilités et invitez les étudiants aux activités." />
      <PageContent>
        <Card className="mb-6">
          <CardHeader><CardTitle>Filtres</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Créneau</label>
              <Select value={creneau} onValueChange={setCreneau}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="matin">Matin</SelectItem>
                  <SelectItem value="aprem">Après-midi</SelectItem>
                  <SelectItem value="soir">Soir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto">
              <Button disabled={selected.size === 0} onClick={() => setDialogOpen(true)}>
                <Send className="mr-1 h-4 w-4" /> Inviter la sélection ({selected.size})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Étudiants disponibles — {formatDate(date)}</CardTitle>
          </CardHeader>
          <CardContent>
            {dispoQ.isLoading ? <div className="text-sm text-muted-foreground">Chargement…</div> : null}
            {(dispoQ.data ?? []).length === 0 && !dispoQ.isLoading && (
              <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Aucune disponibilité pour cette date.</div>
            )}
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {(dispoQ.data ?? []).map((a: any) => {
                const p = a.profiles;
                if (!p) return null;
                const isSel = selected.has(p.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggle(p.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${isSel ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                  >
                    <div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${isSel ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                      {isSel && <CheckCheck className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.prenoms} {p.nom}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.faculte} · {p.niveau}</div>
                      <Badge variant="secondary" className="mt-1 text-[10px]">{CRENEAU_LABEL[a.creneau]}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Envoyer des invitations</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Activité</label>
                <Select value={activityId} onValueChange={setActivityId}>
                  <SelectTrigger><SelectValue placeholder="Choisir une activité" /></SelectTrigger>
                  <SelectContent>
                    {(activitiesQ.data ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.titre} — {formatDate(a.date_activite)} {formatTime(a.heure_debut)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Message (optionnel)</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Bonjour, nous souhaitons vous inviter..." />
              </div>
              <div className="text-xs text-muted-foreground">{selected.size} étudiant(s) sélectionné(s){invitedSet.size > 0 && ` · ${Array.from(selected).filter(u => invitedSet.has(u)).length} déjà invité(s)`}</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={sendInvitations}><Send className="mr-1 h-4 w-4" /> Envoyer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  );
}
