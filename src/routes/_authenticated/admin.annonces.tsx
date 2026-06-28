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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/annonces")({
  head: () => ({ meta: [{ title: "Annonces — Admin" }] }),
  component: AnnoncesAdmin,
});

function AnnoncesAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titre: "", contenu: "" });

  const q = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("announcements").insert({ ...form, created_by: user!.id });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setForm({ titre: "", contenu: "" });
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    qc.invalidateQueries({ queryKey: ["announcements-recent"] });
    toast.success("Annonce publiée");
  }

  async function remove(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  }

  return (
    <>
      <PageHeader title="Annonces" description="Communiquez avec les étudiants." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Nouvelle annonce</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Publier une annonce</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div><Label>Titre</Label><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required maxLength={150} /></div>
              <div><Label>Contenu</Label><Textarea value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} required maxLength={2000} rows={6} /></div>
              <DialogFooter><Button type="submit">Publier</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <PageContent>
        <div className="space-y-3">
          {q.data?.map((n) => (
            <Card key={n.id}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex-1">
                  <h3 className="font-display font-semibold">{n.titre}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.contenu}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{formatDate(n.created_at)}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
          {q.data?.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Aucune annonce.</div>}
        </div>
      </PageContent>
    </>
  );
}
