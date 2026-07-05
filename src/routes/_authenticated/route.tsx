import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAvatarUrl } from "@/hooks/use-avatar-url";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, Calendar, ClipboardList, User, ShieldCheck, LogOut, Menu, Megaphone, Users, Wallet, BarChart3, Search, Bell, X, CheckCheck, Inbox, Image as ImageIcon, ScanLine, CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ulLogo from "@/assets/ul-logo.jpg";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAdmin, isSubAdmin, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("photo_url,nom,prenoms").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const avatarUrl = useAvatarUrl(profileQ.data?.photo_url);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // AJOUT : "Galerie" manquait dans la nav étudiant
  const studentNav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    { to: "/activites", icon: ClipboardList, label: "Activités" },
    { to: "/disponibilites", icon: Calendar, label: "Disponibilités" },
    { to: "/galerie", icon: ImageIcon, label: "Galerie" },
    { to: "/profil", icon: User, label: "Mon profil" },
  ];

  const adminNav = [
    { to: "/admin", icon: ShieldCheck, label: "Vue d'ensemble" },
    { to: "/admin/etudiants", icon: Users, label: "Étudiants" },
    { to: "/admin/activites", icon: ClipboardList, label: "Activités" },
    { to: "/admin/planification", icon: CalendarClock, label: "Planification" },
    { to: "/admin/paiements", icon: Wallet, label: "Paiements" },
    { to: "/admin/galerie", icon: ImageIcon, label: "Galerie" },
    { to: "/admin/annonces", icon: Megaphone, label: "Annonces" },
    { to: "/admin/sous-admins", icon: ShieldCheck, label: "Sous-admins" },
    { to: "/admin/statistiques", icon: BarChart3, label: "Statistiques" },
  ];

  const initials = ((profileQ.data?.prenoms?.[0] || "") + (profileQ.data?.nom?.[0] || "")) || (user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-white/20">
                <img src={ulLogo} alt="Logo Université de Lomé" className="h-full w-full object-contain p-0.5" />
              </div>
              <div className="font-display text-sm font-bold leading-tight min-w-0">
                JOBS ÉTUDIANTS
                <div className="truncate text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/60">Université de Lomé</div>
              </div>
            </Link>
            <Button size="icon" variant="ghost" className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">Étudiant</div>
            <div className="flex flex-col gap-0.5">
              {studentNav.map((item) => (
                <NavItem key={item.to} item={item} pathname={pathname} onClick={() => setMobileOpen(false)} />
              ))}
            </div>
            {(isAdmin || isSubAdmin) && (
              <>
                <div className="mt-5 px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent/90">Terrain</div>
                <div className="flex flex-col gap-0.5">
                  <NavItem item={{ to: "/scanner", icon: ScanLine, label: "Scanner QR" }} pathname={pathname} onClick={() => setMobileOpen(false)} />
                </div>
              </>
            )}
            {isAdmin && (
              <>
                <div className="mt-5 px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent/90">Administration</div>
                <div className="flex flex-col gap-0.5">
                  {adminNav.map((item) => (
                    <NavItem key={item.to} item={item} pathname={pathname} onClick={() => setMobileOpen(false)} />
                  ))}
                </div>
              </>
            )}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/40 p-2.5">
              <Avatar className="h-9 w-9">
                {avatarUrl.data && <AvatarImage src={avatarUrl.data} />}
                <AvatarFallback className="bg-gradient-accent text-xs font-bold text-primary-foreground">{initials.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{user?.email}</div>
                <div className="text-[10px] text-sidebar-foreground/60">{isAdmin ? "Administrateur" : isSubAdmin ? "Sous-administrateur" : "Étudiant"}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={handleSignOut} className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" title="Se déconnecter">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}

        <main className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden flex-1 max-w-md md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Rechercher une activité, un étudiant…"
                className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <Avatar className="h-9 w-9 hidden md:flex">
                {avatarUrl.data && <AvatarImage src={avatarUrl.data} />}
                <AvatarFallback className="bg-gradient-accent text-xs font-bold text-primary-foreground">{initials.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* AJOUT : pb-20 md:pb-0 pour laisser la place à la nav mobile en bas */}
          <div className="flex-1 pb-20 md:pb-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AJOUT : navigation mobile en bas de page, absente de l'ancien fichier */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {studentNav.slice(0, 5).map((item) => {
          const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_var(--color-primary)]")} />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavItem({ item, pathname, onClick }: { item: { to: string; icon: any; label: string }; pathname: string; onClick: () => void }) {
  const active = pathname === item.to || (item.to !== "/dashboard" && item.to !== "/admin" && pathname.startsWith(item.to));
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-primary/20 to-primary/5 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary shadow-[0_0_8px_var(--color-primary)]" />}
      <Icon className={cn("h-4 w-4 transition-colors", active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground")} />
      <span>{item.label}</span>
    </Link>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const items = q.data ?? [];
  const unread = items.filter((n) => !n.read).length;
  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  async function markAllRead() {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  }

  async function toggleRead(e: React.MouseEvent, n: typeof items[number]) {
    e.stopPropagation();
    await supabase.from("notifications").update({ read: !n.read }).eq("id", n.id);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  }

  async function openItem(n: typeof items[number]) {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
    }
    setOpen(false);
    if (n.link) navigate({ to: n.link });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="font-semibold text-sm">Notifications</div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Tout marquer comme lu
            </Button>
          )}
        </div>
        <div className="flex gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
          <button
            onClick={() => setFilter("all")}
            className={cn("flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Toutes ({items.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn("flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              filter === "unread" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Non lues ({unread})
          </button>
        </div>
        <ScrollArea className="max-h-96">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-50" />
              {filter === "unread" ? "Aucune notification non lue." : "Aucune notification pour le moment."}
            </div>
          ) : (
            <div>
              {visible.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group flex items-start gap-2 border-b border-border px-3 py-3 transition-colors hover:bg-muted/40",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => toggleRead(e, n)}
                    title={n.read ? "Marquer comme non lu" : "Marquer comme lu"}
                    className="mt-1 grid h-4 w-4 shrink-0 place-items-center"
                  >
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all",
                      n.read ? "border border-muted-foreground/40 group-hover:border-primary" : "bg-primary shadow-[0_0_6px_var(--color-primary)]"
                    )} />
                  </button>
                  <button onClick={() => openItem(n)} className="min-w-0 flex-1 text-left">
                    <div className={cn("text-sm leading-tight", n.read ? "font-normal text-muted-foreground" : "font-semibold")}>
                      {n.title}
                    </div>
                    {n.body && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}