import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Wallet, ShieldCheck, Leaf, TreePine, Trash2, Brush } from "lucide-react";
import heroCampus from "@/assets/hero-campus.jpg";
import { UlLogo } from "@/components/ul-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JOBS ÉTUDIANTS — Université de Lomé" },
      { name: "description", content: "Étudier, servir son campus et gagner dignement un revenu. La plateforme officielle de jobs étudiants d'assainissement de l'Université de Lomé." },
      { property: "og:title", content: "JOBS ÉTUDIANTS — Université de Lomé" },
      { property: "og:description", content: "Un campus propre, des étudiants actifs, un avenir responsable." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center">
            <UlLogo variant="full" showTagline />
          </Link>
          <nav className="hidden gap-7 text-sm font-medium md:flex">
            <a href="#programme" className="text-muted-foreground transition-colors hover:text-foreground">Le programme</a>
            <Link to="/galerie" className="text-muted-foreground transition-colors hover:text-foreground">Galerie</Link>
            <Link to="/classement" className="text-muted-foreground transition-colors hover:text-foreground">Classement</Link>
            <a href="#fonctionnement" className="text-muted-foreground transition-colors hover:text-foreground">Fonctionnement</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Se connecter</Link></Button>
            <Button asChild size="sm" className="shadow-elegant"><Link to="/auth" search={{ mode: "signup" } as never}>S'inscrire <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 left-10 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Programme officiel — Université de Lomé
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl">
                Étudier, servir son campus,{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">gagner dignement</span>.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                JOBS ÉTUDIANTS met en relation les étudiants de l'Université de Lomé et les
                activités rémunérées d'entretien du campus. Un campus propre, des étudiants actifs,
                un avenir responsable.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="shadow-elegant">
                  <Link to="/auth" search={{ mode: "signup" } as never}>Rejoindre le programme <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-border bg-card/50 backdrop-blur">
                  <a href="#programme">En savoir plus</a>
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
                <div><div className="font-display text-2xl font-bold md:text-3xl">2 000+</div><div className="mt-1 text-muted-foreground">étudiants éligibles</div></div>
                <div><div className="font-display text-2xl font-bold md:text-3xl">15 ha</div><div className="mt-1 text-muted-foreground">d'espaces verts</div></div>
                <div><div className="font-display text-2xl font-bold md:text-3xl">7j/7</div><div className="mt-1 text-muted-foreground">activités possibles</div></div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/30 via-accent/20 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-border shadow-elegant">
                <img
                  src={heroCampus}
                  alt="Étudiants de l'Université de Lomé entretenant le campus : balayage, plantation d'arbres et collecte des déchets"
                  width={1536}
                  height={1024}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent p-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold backdrop-blur">
                    <Leaf className="h-3.5 w-3.5 text-success" /> Campus propre · Université de Lomé
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Le programme</div>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Pensé pour la simplicité et la transparence.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Users, title: "Inscription simple", desc: "Créez votre profil étudiant en 2 minutes. Validation rapide par l'administration." },
            { icon: Wallet, title: "Rémunération transparente", desc: "Chaque activité a un montant clair. Suivez vos heures et vos gains en temps réel." },
            { icon: ShieldCheck, title: "Reconnaissance officielle", desc: "Téléchargez vos attestations de participation et construisez votre réputation campus." },
          ].map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40 hover:shadow-elegant">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-150" />
              <div className="relative mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="relative font-display text-lg font-semibold">{f.title}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Activités */}
      <section id="activites" className="border-y border-border bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Activités</div>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Six types d'activités sur le campus.</h2>
            <p className="mt-3 text-muted-foreground">Choisissez selon vos disponibilités et vos préférences.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Brush, t: "Nettoyage d'amphithéâtres" },
              { icon: Leaf, t: "Débroussaillage" },
              { icon: Brush, t: "Balayage des allées" },
              { icon: TreePine, t: "Plantation d'arbres" },
              { icon: Trash2, t: "Collecte de déchets" },
              { icon: Leaf, t: "Entretien des espaces verts" },
            ].map((a) => (
              <div key={a.t} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary"><a.icon className="h-5 w-5" /></div>
                <div className="font-medium">{a.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Fonctionnement</div>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Comment ça marche.</h2>
        </div>
        <ol className="grid gap-5 md:grid-cols-4">
          {[
            { n: 1, t: "Inscription", d: "Renseignez vos informations étudiantes." },
            { n: 2, t: "Validation", d: "L'administration valide votre profil." },
            { n: 3, t: "Participation", d: "Inscrivez-vous aux activités ouvertes." },
            { n: 4, t: "Rémunération", d: "Recevez vos paiements après chaque mission." },
          ].map((s) => (
            <li key={s.n} className="relative rounded-2xl border border-border bg-card p-6 pt-8">
              <div className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-gradient-accent font-display text-sm font-bold text-primary-foreground shadow-elegant">{s.n}</div>
              <div className="font-display font-semibold">{s.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-elegant md:p-16">
          <div className="absolute inset-0 bg-radial-glow opacity-80" />
          <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-balance md:text-5xl">Prêt à rejoindre le mouvement&nbsp;?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Un campus propre commence par vous. Inscrivez-vous et participez à la première mission qui vous correspond.</p>
            <Button asChild size="lg" className="mt-7 shadow-elegant">
              <Link to="/auth" search={{ mode: "signup" } as never}>Créer mon compte <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Université de Lomé — JOBS ÉTUDIANTS
      </footer>
    </div>
  );
}
