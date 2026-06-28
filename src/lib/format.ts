export const fcfa = (n: number | null | undefined) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(n ?? 0)) + " FCFA";

export const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

export const formatTime = (t: string | null | undefined) => {
  if (!t) return "";
  return t.slice(0, 5);
};

export const FACULTES = [
  "FDS — Faculté des Sciences",
  "FASEG — Faculté des Sciences Économiques et de Gestion",
  "FDD — Faculté de Droit",
  "FLLA — Faculté des Lettres, Langues et Arts",
  "FSHS — Faculté des Sciences de l'Homme et de la Société",
  "FSS — Faculté des Sciences de la Santé",
  "FaSEF — Faculté des Sciences de l'Éducation et de la Formation",
  "ENSI — École Nationale Supérieure d'Ingénieurs",
  "ESA — École Supérieure d'Agronomie",
  "ESTBA — École Supérieure des Techniques Biologiques et Alimentaires",
  "IUT de Gestion",
  "INSE",
  "Autre",
];

export const NIVEAUX = ["L1", "L2", "L3", "M1", "M2", "Doctorat"];

export const ACTIVITY_TYPES: Record<string, string> = {
  nettoyage_amphi: "Nettoyage d'amphithéâtres",
  debroussaillage: "Débroussaillage",
  balayage: "Balayage",
  plantation: "Plantation d'arbres",
  collecte_dechets: "Collecte de déchets",
  espaces_verts: "Entretien espaces verts",
  autre: "Autre",
};

export const ACTIVITY_STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  open: "Inscriptions ouvertes",
  closed: "Inscriptions fermées",
  cancelled: "Annulée",
  completed: "Terminée",
};

export const CRENEAU_LABEL: Record<string, string> = {
  matin: "Matin",
  aprem: "Après-midi",
  soir: "Soir",
};
