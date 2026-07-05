import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Film } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/espace-galerie")({
  head: () => ({ meta: [{ title: "Galerie — JOBS ÉTUDIANTS UL" }] }),
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
    queryKey: ["authenticated-gallery"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_items" as any)
        .select("id,titre,description,media_type,url,created_at,activity_id,activities(titre,date_activite,lieu)")
        .order("created_at", { ascending: false })
        .limit(120);
      const items = (data ?? []) as unknown as Item[];
      await Promise.all(items.map(async (it) => {
        if (!it.url) return;
        const { data: s } = await supabase.storage.from("gallery").createSignedUrl(it.url, 3600);
        it.signed = s?.signedUrl;
      }));
      return items;
    },
  });

  return (
    <>
      <PageHeader
        title="Galerie"
        description="Retrouvez les moments forts des séances de nettoyage, débroussaillage et plantation."
      />
      <PageContent>
        {q.isLoading && <div className="text-sm text-muted-foreground">Chargement…</div>}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Aucun média publié pour le moment.
          </div>
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
      </PageContent>
    </>
  );
}