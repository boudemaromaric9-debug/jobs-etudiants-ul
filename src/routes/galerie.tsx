import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UlLogo } from "@/components/ul-logo";
import { ArrowLeft, Image as ImageIcon, Film } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title: "Galerie — JOBS ÉTUDIANTS · Université de Lomé" },
      { name: "description", content: "Photos et vidéos des séances d'entretien du campus de l'Université de Lomé." },
      { property: "og:title", content: "Galerie — JOBS ÉTUDIANTS" },
    ],
  }),
  component: GaleriePage,
});

type Item = {
  id: string;
  titre: string;
  description: string | null;
  media_type: "image" | "video";
  url: string;
  created_at: string;
  activity_id: string | null;
  activities: { titre: string; date_activite: string; lieu: string } | null;
  signed?: string;
};

function GaleriePage() {
  const q = useQuery({
    queryKey: ["public-gallery"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_items" as any)
        .select("id,titre,description,media_type,url,created_at,activity_id,activities(titre,date_activite,lieu)")
        .order("created_at", { ascending: false })
        .limit(120);
      const items = (data ?? []) as unknown as Item[];
      // Generate signed URLs (1h)
      await Promise.all(items.map(async (it) => {
        if (!it.url) return;
        const { data: s } = await supabase.storage.from("gallery").createSignedUrl(it.url, 3600);
        it.signed = s?.signedUrl;
      }));
      return items;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center"><UlLogo variant="full" showTagline /></Link>
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Accueil</Link></Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Galerie publique</div>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Le campus en action</h1>
          <p className="mt-2 text-muted-foreground">Retrouvez les moments forts des séances de nettoyage, débroussaillage et plantation menées par les étudiants.</p>
        </div>

        {q.isLoading && <div className="text-sm text-muted-foreground">Chargement…</div>}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Aucun média publié pour le moment.</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.map((it) => (
            <Card key={it.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {it.media_type === "image" ? (
                  it.signed ? <img src={it.signed} alt={it.titre} className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                ) : (
                  it.signed ? <video src={it.signed} controls className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><Film className="h-8 w-8" /></div>
                )}
              </div>
              <div className="space-y-1 p-4">
                <div className="font-medium">{it.titre}</div>
                {it.activities && (
                  <div className="text-xs text-muted-foreground">{it.activities.titre} · {formatDate(it.activities.date_activite)} · {it.activities.lieu}</div>
                )}
                {it.description && <p className="text-sm text-muted-foreground">{it.description}</p>}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Université de Lomé — JOBS ÉTUDIANTS
      </footer>
    </div>
  );
}
