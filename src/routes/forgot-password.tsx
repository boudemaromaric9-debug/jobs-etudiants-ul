import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Mot de passe oublié — JOBS CAMPUS UL" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(translateAuthError(error.message)); return; }
    setSent(true);
    toast.success("E-mail de réinitialisation envoyé.");
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Link to="/auth" className="mb-6 inline-flex items-center gap-2 text-sm text-primary-foreground/90 hover:text-primary-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour à la connexion
        </Link>
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Mot de passe oublié</CardTitle>
            <CardDescription>
              Saisissez votre adresse e-mail. Vous recevrez un lien pour définir un nouveau mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium text-success">
                  <MailCheck className="h-4 w-4" /> E-mail envoyé
                </div>
                <p className="mt-2 text-muted-foreground">
                  Si un compte existe avec <strong>{email}</strong>, vous recevrez un message dans quelques instants.
                  Vérifiez votre boîte de réception et vos spams.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label>Adresse e-mail</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
