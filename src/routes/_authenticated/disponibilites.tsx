import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CRENEAU_LABEL } from "@/lib/format";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ProfileGuard } from "@/components/profile-guard";

export const Route = createFileRoute("/_authenticated/disponibilites")({
  head: () => ({ meta: [{ title: "Disponibilités — JOBS CAMPUS UL" }] }),
  component: DispoPage,
});

function DispoPage() {
  const { user, isProfileActive } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState("");

  const q = useQuery({
    queryKey: ["availabilities", user?.id],
    enabled: !!user && isProfileActive,
    queryFn: async () => {
      const { data } = await supabase.from("availabilities").select("*").eq("user_id", user!.id).order("jour");
      return data ?? [];
    },
  });

  async function add(creneau: "matin" | "aprem" | "soir") {
    if (!date) { toast.error("Choisissez une date"); return; }
    const { error } = await supabase.from("availabilities").insert({ user_id: user!.id, jour: date, creneau });
    if (error) { if (error.code === "23505") toast.error("Ce créneau existe déjà"); else toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["availabilities"] });
    toast.success("Disponibilité ajoutée");
  }

  async function remove(id: string) {
    await supabase.from("availabilities").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["availabilities"] });
  }

  const groupedByDate = (q.data ?? []).reduce<Record<string, typeof q.data>>((acc, a) => {
    (acc[a.jour] ||= [] as any).push(a);
    return acc;
  }, {});

  if (!isProfileActive) {
    return (
      <>
        <PageHeader title="Mes disponibilités" description="Indiquez quand vous êtes disponible pour participer." />
        <PageContent><ProfileGuard /></PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Mes disponibilités" description="Indiquez quand vous êtes disponible pour participer." />
      <PageContent>
        <Card className="mb-6">
          <CardHeader><CardTitle>Ajouter une disponibilité</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => add("matin")} variant="outline"><Plus className="mr-1 h-4 w-4" /> Matin</Button>
              <Button onClick={() => add("aprem")} variant="outline"><Plus className="mr-1 h-4 w-4" /> Après-midi</Button>
              <Button onClick={() => add("soir")} variant="outline"><Plus className="mr-1 h-4 w-4" /> Soir</Button>
            </div>
          </CardContent>
        </Card>

        {Object.keys(groupedByDate).length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Aucune disponibilité déclarée.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedByDate).map(([jour, items]) => (
              <Card key={jour}>
                <CardHeader><CardTitle className="text-base">{new Date(jour).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {items!.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {CRENEAU_LABEL[a.creneau]}
                      <button onClick={() => remove(a.id)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}