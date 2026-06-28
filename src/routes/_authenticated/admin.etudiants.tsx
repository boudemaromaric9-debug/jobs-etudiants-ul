import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContent, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Pause, Play, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/etudiants")({
  head: () => ({ meta: [{ title: "Étudiants — Admin" }] }),
  component: EtudiantsAdmin,
});

function EtudiantsAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const q = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function setStatus(id: string, status: "active" | "pending" | "suspended") {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Statut mis à jour");
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
  }

  const filtered = (q.data ?? []).filter((p) => {
    const matchSearch = !search || `${p.nom} ${p.prenoms} ${p.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <PageHeader title="Étudiants" description="Validez, suspendez ou consultez les profils étudiants." />
      <PageContent>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Étudiant</th>
                    <th className="px-4 py-3">Faculté · Niveau</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.nom} {p.prenoms}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.faculte || "—"} · {p.niveau || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.telephone || p.email || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === "active" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                          {p.status === "active" ? "Actif" : p.status === "pending" ? "En attente" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {p.status !== "active" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "active")}><CheckCircle2 className="mr-1 h-4 w-4" />Valider</Button>}
                          {p.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "suspended")}><Pause className="mr-1 h-4 w-4" />Suspendre</Button>}
                          {p.status === "suspended" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "active")}><Play className="mr-1 h-4 w-4" />Réactiver</Button>}
                          {p.status === "pending" && <Button size="sm" variant="ghost" onClick={() => setStatus(p.id, "suspended")}><XCircle className="mr-1 h-4 w-4" />Rejeter</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Aucun étudiant.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
