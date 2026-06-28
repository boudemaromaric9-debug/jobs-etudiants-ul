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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon, Film } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/galerie")({
  head: () => ({ meta: [{ title: "Galerie — Admin" }] }),
  component: AdminGalerie,
});

function AdminGalerie() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [activityId, setActivityId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const activitiesQ = useQuery({
    queryKey: ["activities-for-gallery"],
    queryFn: async () => {
      const { data } = await supabase.from("activities" as any).select("id,titre,date_activite").order("date_activite", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const itemsQ = useQuery({
    queryFn: async () => {
  const { data } = await supabase.from("gallery_items" as any).select("*, activities(titre,date_activite)").order("created_at", { ascending: false });
  const items = data ?? [];
  items.forEach((it: any) => {
    if (it.url) {
      it.signed = `https://fusdsccsbshurstsvwmv.supabase.co/storage/v1/object/public/gallery/${it.url}`;
    }
  });
  return items;
},
  });

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !titre) { toast.error("Titre et fichier requis"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
      if (upErr) throw upErr;
      const media_type = file.type.startsWith("video") ? "video" : "image";
      const { error: insErr } = await supabase.from("gallery_items" as any).insert({
        titre, description: description || null,
        activity_id: activityId || null,
        media_type, url: path, uploaded_by: user!.id,
      } as any);
      if (insErr) throw insErr;
      toast.success("Média publié");
      setOpen(false); setTitre(""); setDescription(""); setActivityId(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally { setUploading(false); }
  }

  async function remove(item: any) {
    if (!confirm("Supprimer ce média ?")) return;
    await supabase.storage.from("gallery").remove([item.url]);
    await supabase.from("gallery_items" as any).delete().eq("id", item.id);
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
  }

  return (
    <>
      <PageHeader
        title="Galerie"
        description="Publiez les photos et vidéos des séances pour la galerie publique."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Ajouter un média</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau média</DialogTitle></DialogHeader>
              <form onSubmit={upload} className="space-y-4">
                <div><Label>Titre</Label><Input value={titre} onChange={(e) => setTitre(e.target.value)} required maxLength={120} /></div>
                <div><Label>Activité (optionnel)</Label>
                  <Select value={activityId} onValueChange={setActivityId}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{activitiesQ.data?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.titre} — {formatDate(a.date_activite)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} /></div>
                <div><Label>Fichier (image ou vidéo, max 50 Mo)</Label><Input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></div>
                <DialogFooter><Button type="submit" disabled={uploading}>{uploading ? "Téléversement…" : "Publier"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itemsQ.data?.map((it: any) => (
            <Card key={it.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {it.media_type === "image" ? (
                  it.signed ? <img src={it.signed} alt={it.titre} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                ) : (
                  it.signed ? <video src={it.signed} controls className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><Film className="h-8 w-8" /></div>
                )}
              </div>
              <CardContent className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{it.titre}</div>
                    {it.activities && <div className="text-xs text-muted-foreground">{it.activities.titre} · {formatDate(it.activities.date_activite)}</div>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(it)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(itemsQ.data?.length ?? 0) === 0 && <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Aucun média. Ajoutez la première photo de séance.</div>}
        </div>
      </PageContent>
    </>
  );
}
