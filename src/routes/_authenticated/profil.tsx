import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAvatarUrl } from "@/hooks/use-avatar-url";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Trash2, Loader2, FileDown } from "lucide-react";
import { FACULTES, NIVEAUX } from "@/lib/format";
import { StudentQrCard } from "@/components/student-qr-card";
import { downloadStudentBulletin } from "@/lib/pdf-bulletin";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil — JOBS ÉTUDIANTS · Université de Lomé" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenoms: "", sexe: "" as "M" | "F" | "",
    faculte: "", niveau: "", telephone: "", email: "",
  });

  const q = useQuery({
    queryKey: ["profile-edit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const avatarUrl = useAvatarUrl(q.data?.photo_url);

  useEffect(() => {
    if (q.data) setForm({
      nom: q.data.nom || "", prenoms: q.data.prenoms || "",
      sexe: (q.data.sexe as any) || "", faculte: q.data.faculte || "",
      niveau: q.data.niveau || "", telephone: q.data.telephone || "",
      email: q.data.email || user?.email || "",
    });
  }, [q.data, user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      nom: form.nom, prenoms: form.prenoms,
      sexe: form.sexe || null, faculte: form.faculte || null,
      niveau: form.niveau || null, telephone: form.telephone || null,
      email: form.email || null,
    }).eq("id", user!.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil mis à jour");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Image trop volumineuse (max 3 Mo)."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Veuillez choisir une image."); return; }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    // supprimer l'ancien
    if (q.data?.photo_url) {
      await supabase.storage.from("avatars").remove([q.data.photo_url]);
    }

    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setUploading(false); toast.error("Échec de l'envoi : " + upErr.message); return; }

    const { error: dbErr } = await supabase.from("profiles").update({ photo_url: path }).eq("id", user.id);
    setUploading(false);
    if (dbErr) { toast.error(dbErr.message); return; }
    toast.success("Photo de profil mise à jour");
    qc.invalidateQueries({ queryKey: ["profile-edit", user.id] });
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    qc.invalidateQueries({ queryKey: ["avatar-url"] });
  }

  async function removePhoto() {
    if (!user || !q.data?.photo_url) return;
    setUploading(true);
    await supabase.storage.from("avatars").remove([q.data.photo_url]);
    await supabase.from("profiles").update({ photo_url: null }).eq("id", user.id);
    setUploading(false);
    toast.success("Photo retirée");
    qc.invalidateQueries({ queryKey: ["profile-edit", user.id] });
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    qc.invalidateQueries({ queryKey: ["avatar-url"] });
  }

  const initials = (form.prenoms?.[0] || "") + (form.nom?.[0] || "") || (user?.email?.[0] ?? "U").toUpperCase();

  return (
    <>
      <PageHeader title="Mon profil" description="Vos informations étudiantes." />
      <PageContent>
        <form onSubmit={save} className="max-w-3xl space-y-6">
          <Card>
            <CardHeader><CardTitle>Photo de profil</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-5">
              <Avatar className="h-24 w-24 ring-2 ring-primary/20">
                {avatarUrl.data && <AvatarImage src={avatarUrl.data} alt="Photo de profil" />}
                <AvatarFallback className="bg-gradient-accent text-primary-foreground text-xl font-bold">{initials.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                    {q.data?.photo_url ? "Changer la photo" : "Importer une photo"}
                  </Button>
                  {q.data?.photo_url && (
                    <Button type="button" variant="ghost" onClick={removePhoto} disabled={uploading}>
                      <Trash2 className="mr-2 h-4 w-4" /> Retirer
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG ou WebP — 3 Mo maximum. L'import est facultatif.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Identité</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>Nom</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={80} required /></div>
              <div><Label>Prénoms</Label><Input value={form.prenoms} onChange={(e) => setForm({ ...form, prenoms: e.target.value })} maxLength={120} required /></div>
              <div>
                <Label>Sexe</Label>
                <Select value={form.sexe} onValueChange={(v) => setForm({ ...form, sexe: v as any })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Niveau d'étude</Label>
                <Select value={form.niveau} onValueChange={(v) => setForm({ ...form, niveau: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{NIVEAUX.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Faculté / École</Label>
                <Select value={form.faculte} onValueChange={(v) => setForm({ ...form, faculte: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{FACULTES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>Téléphone</Label><Input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} maxLength={20} /></div>
              <div><Label>E-mail (facultatif)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </form>

        {user && (
          <div className="mt-8 max-w-3xl space-y-6">
            <StudentQrCard
              userId={user.id}
              name={[form.prenoms, form.nom].filter(Boolean).join(" ") || user.email || undefined}
              faculte={form.faculte}
              niveau={form.niveau}
            />
            <BulletinCard userId={user.id} student={{ nom: form.nom, prenoms: form.prenoms, faculte: form.faculte, niveau: form.niveau }} />
          </div>
        )}
      </PageContent>
    </>
  );
}

function BulletinCard({ userId, student }: { userId: string; student: { nom: string; prenoms: string; faculte: string; niveau: string } }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    const { data, error } = await supabase
      .from("payments")
      .select("montant,montant_etudiant,montant_institution,status,date_paiement,created_at,activities(titre,date_activite,lieu)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data || data.length === 0) { toast.info("Aucun bulletin disponible pour le moment."); return; }
    downloadStudentBulletin(student, data as any);
  }
  return (
    <Card>
      <CardHeader><CardTitle>Mon bulletin de rémunération</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Téléchargez le récapitulatif PDF officiel de vos rémunérations (part étudiant·e 75 %).</p>
        <Button onClick={download} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          Télécharger le PDF
        </Button>
      </CardContent>
    </Card>
  );
}
