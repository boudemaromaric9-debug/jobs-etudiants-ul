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
import { Calendar, MapPin, Users, ClipboardCheck, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/activites")({
  head: () => ({ meta: [{ title: "Activités — JOBS ÉTUDIANTS" }] }),
  component: ActivitesPage,
});

function ActivitesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const activitiesQ = useQuery({
    queryKey: ["activities-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*, registrations(count)")
        .in("status", ["open", "closed", "completed"])
        .order("date_activite", { ascending: true });
      return data ?? [];
    },
  });

  const myRegsQ = useQuery({
    queryKey: ["my-regs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("registrations").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const myRegByAct = new Map((myRegsQ.data ?? []).map((r) => [r.activity_id, r]));

  async function register(activityId: string, remuneration: number) {
    const { error } = await supabase.from("registrations").insert({
      activity_id: activityId, user_id: user!.id, status: "registered", montant_du: remuneration,
    });
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
  }

  const filtered = (activitiesQ.data ?? []).filter((a) => {
    const matchSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase()) || a.lieu.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <>
      <PageHeader title="Activités" description="Inscrivez-vous aux missions ouvertes du campus." />
      <PageContent>
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

        {activitiesQ.isLoading ? <div className="text-sm text-muted-foreground">Chargement...</div> : null}
        {filtered.length === 0 && !activitiesQ.isLoading && (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Aucune activité disponible.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => {
            const reg = myRegByAct.get(a.id);
            const isRegistered = reg && reg.status !== "cancelled";
            const participantCount = a.registrations?.[0]?.count ?? 0;
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
                    <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {formatDate(a.date_activite)} · {formatTime(a.heure_debut)}–{formatTime(a.heure_fin)}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {a.lieu}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> {participantCount} / {a.max_participants} inscrits</div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Rémunération</div>
                      <div className="font-display text-lg font-bold text-success">{fcfa(a.remuneration)}</div>
                    </div>
                    {isRegistered ? (
                      <Button size="sm" variant="outline" onClick={() => unregister(reg!.id)}><X className="mr-1 h-4 w-4" /> Se désister</Button>
                    ) : a.status !== "open" || isPast ? (
                      <Button size="sm" disabled>{isPast ? "Passée" : a.status === "completed" ? "Terminée" : "Fermée"}</Button>
                    ) : isFull ? (
                      <Button size="sm" disabled>Complet</Button>
                    ) : (
                      <Button size="sm" onClick={() => register(a.id, Number(a.remuneration))}><ClipboardCheck className="mr-1 h-4 w-4" /> S'inscrire</Button>
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
