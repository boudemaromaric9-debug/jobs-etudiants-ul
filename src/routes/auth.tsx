import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UlLogo } from "@/components/ul-logo";
import { ArrowLeft } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Connexion — JOBS ÉTUDIANTS · Université de Lomé" },
      { name: "description", content: "Connectez-vous ou créez votre compte JOBS ÉTUDIANTS de l'Université de Lomé." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nom, prenoms },
      },
    });
    setLoading(false);
    if (error) { toast.error(translateAuthError(error.message)); return; }
    toast.success("Compte créé ! Complétez votre profil.");
    navigate({ to: "/profil" });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(translateAuthError(error.message)); return; }
    toast.success("Bienvenue !");
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) toast.error("Connexion Google impossible : " + error.message);
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" /> Retour à l'accueil</Link>
          </Button>
        </div>
        <Link to="/" className="mb-6 flex items-center justify-center">
          <div className="rounded-2xl bg-white/95 px-4 py-3 shadow-elegant">
            <UlLogo variant="full" showTagline />
          </div>
        </Link>
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button onClick={() => setTab("signin")} className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "signin" ? "bg-card shadow" : "text-muted-foreground"}`}>Connexion</button>
              <button onClick={() => setTab("signup")} className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "signup" ? "bg-card shadow" : "text-muted-foreground"}`}>Inscription</button>
            </div>
            <CardTitle className="mt-4">{tab === "signin" ? "Bon retour" : "Créer un compte"}</CardTitle>
            <CardDescription>
              {tab === "signin" ? "Accédez à votre tableau de bord étudiant." : "Rejoignez le programme campus propre."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Continuer avec Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou par e-mail</span></div>
            </div>
            {tab === "signup" ? (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nom</Label><Input value={nom} onChange={(e) => setNom(e.target.value)} required maxLength={80} /></div>
                  <div><Label>Prénoms</Label><Input value={prenoms} onChange={(e) => setPrenoms(e.target.value)} required maxLength={120} /></div>
                </div>
                <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div>
                  <Label>Mot de passe</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  <p className="mt-1 text-xs text-muted-foreground">Minimum 6 caractères. Évitez les mots de passe trop courants (ex&nbsp;: 123456, azerty).</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Création..." : "Créer mon compte"}</Button>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Mot de passe</Label>
                    <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Mot de passe oublié ?</Link>
                  </div>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}