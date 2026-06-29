import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import QrScanner from "qr-scanner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, CheckCircle2, XCircle, AlertTriangle, LogIn, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/scanner/$activityId")({
  component: ScannerPage,
});

type ScanState = {
  kind: "idle" | "success" | "already" | "rejected" | "error";
  message: string;
  name?: string;
  at?: string;
};

const QR_PREFIX = "JOBS-ETUDIANTS-UL|";

function parsePayload(raw: string): string | null {
  if (!raw) return null;
  const txt = raw.trim();
  if (txt.startsWith(QR_PREFIX)) {
    const id = txt.slice(QR_PREFIX.length).trim();
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  }
  return /^[0-9a-f-]{36}$/i.test(txt) ? txt : null;
}

function ScannerPage() {
  const { activityId } = Route.useParams();
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"check_in" | "check_out">("check_in");
  const [lastScan, setLastScan] = useState<ScanState>({ kind: "idle", message: "En attente d'un QR code…" });
  const processingRef = useRef<string | null>(null);

  const activity = useQuery({
    queryKey: ["scanner", "activity", activityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, titre, date_activite, heure_debut, heure_fin, lieu")
        .eq("id", activityId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const regs = useQuery({
    queryKey: ["scanner", "regs", activityId],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("registrations")
        .select("id, user_id, status, check_in, check_out, heures_effectuees")
        .eq("activity_id", activityId);
      if (error) throw error;
      const ids = (r ?? []).map((x) => x.user_id);
      const profMap = new Map<string, { nom: string | null; prenoms: string | null; faculte: string | null }>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, nom, prenoms, faculte")
          .in("id", ids);
        (profs ?? []).forEach((p) => profMap.set(p.id, { nom: p.nom, prenoms: p.prenoms, faculte: p.faculte }));
      }
      return (r ?? []).map((row) => ({ ...row, profile: profMap.get(row.user_id) }));
    },
  });

  const byUser = useMemo(() => {
    const m = new Map<string, NonNullable<typeof regs.data>[number]>();
    (regs.data ?? []).forEach((r) => m.set(r.user_id, r));
    return m;
  }, [regs.data]);

  async function handleScan(studentId: string, raw: string) {
    const reg = byUser.get(studentId);
    const prof = reg?.profile;
    const displayName = prof ? `${prof.prenoms ?? ""} ${prof.nom ?? ""}`.trim() || "Étudiant" : "Étudiant inconnu";
    const now = new Date().toISOString();

    if (!reg) {
      setLastScan({ kind: "rejected", message: "Non inscrit à cette activité", name: displayName, at: now });
      toast.error(`❌ ${displayName} : non inscrit`);
      await supabase.from("qr_scan_logs").insert({
        activity_id: activityId,
        scanned_by: (await supabase.auth.getUser()).data.user!.id,
        student_id: studentId,
        scan_kind: mode,
        scan_result: "not_enrolled",
        raw_payload: raw,
      });
      return;
    }

    if (mode === "check_in" && reg.check_in) {
      setLastScan({ kind: "already", message: "Présence déjà enregistrée", name: displayName, at: reg.check_in });
      toast.warning(`⚠️ ${displayName} : déjà pointé`);
      return;
    }

    if (mode === "check_out" && !reg.check_in) {
      setLastScan({ kind: "rejected", message: "Pas de check-in préalable", name: displayName, at: now });
      toast.error(`❌ ${displayName} : aucun check-in`);
      return;
    }

    if (mode === "check_out" && reg.check_out) {
      setLastScan({ kind: "already", message: "Sortie déjà enregistrée", name: displayName, at: reg.check_out });
      toast.warning(`⚠️ ${displayName} : déjà sorti`);
      return;
    }

    const inT = reg.check_in ? new Date(reg.check_in).getTime() : null;
    const outT = new Date(now).getTime();
    const patch = mode === "check_in"
      ? { check_in: now, status: "attended" as const }
      : {
          check_out: now,
          heures_effectuees: inT ? Math.max(0, Math.round(((outT - inT) / 3_600_000) * 100) / 100) : 0,
          status: "attended" as const,
        };

    const { error } = await supabase.from("registrations").update(patch).eq("id", reg.id);
    if (error) {
      setLastScan({ kind: "error", message: error.message, name: displayName, at: now });
      toast.error(error.message);
      return;
    }

    await supabase.from("qr_scan_logs").insert({
      activity_id: activityId,
      scanned_by: (await supabase.auth.getUser()).data.user!.id,
      student_id: studentId,
      scan_kind: mode,
      scan_result: "success",
      raw_payload: raw,
    });

    setLastScan({ kind: "success", message: mode === "check_in" ? "Présence enregistrée" : "Sortie enregistrée", name: displayName, at: now });
    toast.success(`✅ ${displayName} : ${mode === "check_in" ? "check-in" : "check-out"}`);
    qc.invalidateQueries({ queryKey: ["scanner", "regs", activityId] });
  }

  async function start() {
    if (running || !videoRef.current) return;
    try {
      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          const decoded = result.data;
          if (processingRef.current === decoded) return;
          processingRef.current = decoded;
          setTimeout(() => { if (processingRef.current === decoded) processingRef.current = null; }, 2500);
          const id = parsePayload(decoded);
          if (!id) {
            setLastScan({ kind: "rejected", message: "QR code invalide", at: new Date().toISOString() });
            toast.error("QR code invalide");
            return;
          }
          await handleScan(id, decoded);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      scannerRef.current = scanner;
      await scanner.start();
      setRunning(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Impossible d'accéder à la caméra. Vérifiez les autorisations.");
    }
  }

  async function stop() {
    const s = scannerRef.current;
    if (!s) return;
    s.stop();
    s.destroy();
    scannerRef.current = null;
    setRunning(false);
  }

  useEffect(() => {
    return () => { stop(); };
  }, []);

  const counters = useMemo(() => {
    const list = regs.data ?? [];
    return {
      total: list.length,
      checkedIn: list.filter((r) => r.check_in).length,
      checkedOut: list.filter((r) => r.check_out).length,
    };
  }, [regs.data]);

  const stateColor = {
    idle: "bg-muted text-muted-foreground",
    success: "bg-green-500/15 text-green-600 border-green-500/40",
    already: "bg-amber-500/15 text-amber-600 border-amber-500/40",
    rejected: "bg-red-500/15 text-red-600 border-red-500/40",
    error: "bg-red-500/15 text-red-600 border-red-500/40",
  }[lastScan.kind];

  const Icon = lastScan.kind === "success" ? CheckCircle2
    : lastScan.kind === "already" ? AlertTriangle
    : lastScan.kind === "rejected" || lastScan.kind === "error" ? XCircle
    : Camera;

  return (
    <div className="container mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/scanner"><ArrowLeft className="mr-1 h-4 w-4" />Activités</Link>
        </Button>
      </div>

      <header className="space-y-1">
        <h1 className="font-display text-xl font-bold md:text-2xl">{activity.data?.titre ?? "…"}</h1>
        <p className="text-xs text-muted-foreground">{activity.data?.lieu} · {activity.data?.date_activite}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base flex-1">Caméra</CardTitle>
              <Button size="sm" variant={mode === "check_in" ? "default" : "outline"} onClick={() => setMode("check_in")}>
                <LogIn className="mr-1 h-4 w-4" />Check-in
              </Button>
              <Button size="sm" variant={mode === "check_out" ? "default" : "outline"} onClick={() => setMode("check_out")}>
                <LogOut className="mr-1 h-4 w-4" />Check-out
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/90">
              <video ref={videoRef} className="h-full w-full object-cover" />
            </div>
            <div className="flex gap-2">
              {!running ? (
                <Button onClick={start} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />Démarrer le scanner
                </Button>
              ) : (
                <Button onClick={stop} variant="destructive" className="flex-1">Arrêter</Button>
              )}
            </div>
            <div className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors", stateColor)}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{lastScan.message}</div>
                {lastScan.name && <div className="text-xs opacity-80">{lastScan.name}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Inscrits</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => regs.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-muted p-2"><div className="text-lg font-bold">{counters.total}</div>Inscrits</div>
              <div className="rounded-md bg-green-500/10 p-2 text-green-700"><div className="text-lg font-bold">{counters.checkedIn}</div>Présents</div>
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-700"><div className="text-lg font-bold">{counters.checkedOut}</div>Sortis</div>
            </div>
            <div className="max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
              {(regs.data ?? []).map((r) => {
                const name = `${r.profile?.prenoms ?? ""} ${r.profile?.nom ?? ""}`.trim() || "—";
                const state = r.check_out ? "out" : r.check_in ? "in" : "wait";
                return (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{r.profile?.faculte ?? ""}</div>
                    </div>
                    <Badge variant={state === "out" ? "secondary" : state === "in" ? "default" : "outline"}>
                      {state === "out" ? "Sorti" : state === "in" ? "Présent" : "Attente"}
                    </Badge>
                  </div>
                );
              })}
              {(regs.data ?? []).length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">Aucun inscrit.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}