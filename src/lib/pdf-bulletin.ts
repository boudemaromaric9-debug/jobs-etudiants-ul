import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fcfa, formatDate } from "@/lib/format";

type Payment = {
  montant: number;
  montant_etudiant?: number | null;
  montant_institution?: number | null;
  status: string;
  date_paiement?: string | null;
  created_at?: string;
  activities?: { titre?: string | null; date_activite?: string | null; lieu?: string | null } | null;
  profiles?: { nom?: string | null; prenoms?: string | null; faculte?: string | null; niveau?: string | null } | null;
};

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("JOBS ÉTUDIANTS — Université de Lomé", 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text("Programme officiel d'assainissement du campus", 40, 58);
  doc.setDrawColor(200); doc.line(40, 68, 555, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text(title, 40, 92);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(subtitle, 40, 108);
  }
}

export function downloadStudentBulletin(student: { nom?: string; prenoms?: string; faculte?: string; niveau?: string }, payments: Payment[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const fullName = `${student.prenoms ?? ""} ${student.nom ?? ""}`.trim() || "Étudiant·e";
  header(doc, "Bulletin de rémunération étudiant·e", `${fullName} · ${student.faculte ?? "—"} · ${student.niveau ?? "—"}`);

  const rows = payments.map((p) => {
    const part = Number(p.montant_etudiant ?? Math.round(p.montant * 0.75));
    return [
      p.activities?.date_activite ? formatDate(p.activities.date_activite) : "—",
      p.activities?.titre ?? "—",
      p.activities?.lieu ?? "—",
      fcfa(p.montant),
      fcfa(part),
      p.status === "paid" ? "Payé" : "En attente",
    ];
  });

  autoTable(doc, {
    startY: 130,
    head: [["Date", "Activité", "Lieu", "Brut", "Part 75 %", "Statut"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const totalBrut = payments.reduce((s, p) => s + Number(p.montant || 0), 0);
  const totalPart = payments.reduce((s, p) => s + Number(p.montant_etudiant ?? Math.round(p.montant * 0.75)), 0);
  const totalPaye = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.montant_etudiant ?? Math.round(p.montant * 0.75)), 0);
  const finalY = (doc as any).lastAutoTable?.finalY ?? 150;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total brut : ${fcfa(totalBrut)}`, 40, finalY + 30);
  doc.text(`Total part étudiant·e (75 %) : ${fcfa(totalPart)}`, 40, finalY + 48);
  doc.setTextColor(20, 120, 60);
  doc.text(`Déjà versé : ${fcfa(totalPaye)}`, 40, finalY + 66);
  doc.setTextColor(180, 60, 20);
  doc.text(`Reste à percevoir : ${fcfa(totalPart - totalPaye)}`, 40, finalY + 84);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Édité le ${formatDate(new Date().toISOString())} — Document officiel Université de Lomé`, 40, 800);

  doc.save(`bulletin_${(student.nom ?? "etudiant").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadAdminPaymentsPdf(payments: Payment[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  header(doc, "Registre des paiements", `${payments.length} bulletin·s — 75 % étudiant·e / 25 % institution`);

  const rows = payments.map((p) => {
    const part = Number(p.montant_etudiant ?? Math.round(p.montant * 0.75));
    const inst = Number(p.montant_institution ?? p.montant - part);
    return [
      `${p.profiles?.nom ?? ""} ${p.profiles?.prenoms ?? ""}`.trim(),
      p.profiles?.faculte ?? "—",
      p.activities?.titre ?? "—",
      p.activities?.date_activite ? formatDate(p.activities.date_activite) : "—",
      fcfa(p.montant),
      fcfa(part),
      fcfa(inst),
      p.status === "paid" ? "Payé" : "En attente",
      p.date_paiement ? formatDate(p.date_paiement) : "—",
    ];
  });

  autoTable(doc, {
    startY: 130,
    head: [["Étudiant·e", "Faculté", "Activité", "Date", "Brut", "75 %", "25 %", "Statut", "Payé le"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const totalBrut = payments.reduce((s, p) => s + Number(p.montant || 0), 0);
  const totalEt = payments.reduce((s, p) => s + Number(p.montant_etudiant ?? Math.round(p.montant * 0.75)), 0);
  const totalInst = totalBrut - totalEt;
  const finalY = (doc as any).lastAutoTable?.finalY ?? 150;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Brut : ${fcfa(totalBrut)}   ·   Étudiants (75 %) : ${fcfa(totalEt)}   ·   Institution (25 %) : ${fcfa(totalInst)}`, 40, finalY + 28);

  doc.save(`registre_paiements_${new Date().toISOString().slice(0, 10)}.pdf`);
}
