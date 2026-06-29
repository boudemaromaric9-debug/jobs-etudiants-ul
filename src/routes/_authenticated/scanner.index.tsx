import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Camera, Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scanner/")({
  component: ScannerHub,
});

function ScannerHub() {
  const q = useQuery({
    queryKey: ["scanner", "open-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, titre, date_activite, heure_debut, heure_fin, lieu, status, max_participants")
        .in("status", ["open", "closed"])
        .order("date_activite", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Scanner de présence</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez l'activité à pointer. La caméra de votre téléphone sera utilisée pour scanner les QR codes étudiants.
        </p>
      </header>

      {q.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (q.data?.length ?? 0) === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Aucune activité ouverte ou en cours.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {q.data!.map((a) => (
            <Link
              key={a.id}
              to="/scanner/$activityId"
              params={{ activityId: a.id }}
              className="group"
            >
              <Card className="transition-all hover:border-primary hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{a.titre}</CardTitle>
                    <Badge variant={a.status === "open" ? "default" : "secondary"}>{a.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{a.date_activite} · {a.heure_debut?.slice(0,5)} → {a.heure_fin?.slice(0,5)}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{a.lieu}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-primary"><Camera className="h-3.5 w-3.5" /> Lancer le scanner</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
