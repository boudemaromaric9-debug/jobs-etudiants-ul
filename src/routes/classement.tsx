import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UlLogo } from "@/components/ul-logo";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { fcfa } from "@/lib/format";

export const Route = createFileRoute("/classement")({
  head: () => ({
    meta: [
      { title: "Classement — JOBS ÉTUDIANTS · Université de Lomé" },
      { name: "description", content: "Top des étudiants les plus engagés sur le programme JOBS ÉTUDIANTS de l'Université de Lomé." },
      { property: "og:title", content: "Classement — JOBS ÉTUDIANTS" },
    ],
  }),
  component: ClassementPage,
});

function ClassementPage() {
  const q = useQuery({
    queryKey: ["public-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase.from("public_leaderboard" as never).select("*").limit(50);
      return (data ?? []) as Array<{ id: string; prenoms: string; nom_initiale: string; faculte: string | null; total_heures: number | null }>;
    },
  });

  const podiumIcon = (i: number) => i === 0 ? <Trophy className="h-5 w-5 text-yellow-500" /> : i === 1 ? <Medal className="h-5 w-5 text-zinc-400" /> : i === 2 ? <Award className="h-5 w-5 text-amber-600" /> : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center"><UlLogo variant="full" showTagline /></Link>
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Accueil</Link></Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Classement public</div>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Les étudiants les plus engagés</h1>
          <p className="mt-2 text-muted-foreground">Mise à jour automatique après chaque séance validée.</p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Étudiant</th>
                  <th className="px-4 py-3">Faculté</th>
                  <th className="px-4 py-3 text-right">Heures</th>
                </tr>
              </thead>
              <tbody>
                {q.data?.map((p, i) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3"><div className="flex items-center gap-2 font-semibold">{podiumIcon(i)}{i + 1}</div></td>
                    <td className="px-4 py-3 font-medium">{p.prenoms} {p.nom_initiale}.</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.faculte ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{Number(p.total_heures ?? 0).toFixed(1)} h</td>
                  </tr>
                ))}
                {(q.data?.length ?? 0) === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Classement à venir.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Université de Lomé — JOBS ÉTUDIANTS
      </footer>
    </div>
  );
}
