import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Nouveau mot de passe — JOBS CAMPUS UL" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Le client Supabase capte automatiquement le token "recovery" depuis l'URL
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm) { toast.error("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(translateAuthError(error.message)); return; }
    toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Définir un nouveau mot de passe</CardTitle>
            <CardDescription>
              Choisissez un mot de passe robuste (lettres, chiffres et symboles).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!ready ? (
              <div className="text-sm text-muted-foreground">
                Vérification du lien…
                <div className="mt-3"><Link to="/forgot-password" className="text-primary hover:underline">Renvoyer un lien</Link></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><Label>Nouveau mot de passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                <div><Label>Confirmer le mot de passe</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Mise à jour..." : "Mettre à jour"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
