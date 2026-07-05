// Modules disponibles pour délégation aux sous-administrateurs.
// module_key doit rester stable — utilisé côté DB (sub_admin_permissions) et RLS.

export type ModuleKey =
  | "students"
  | "activities"
  | "planning"
  | "payments"
  | "gallery"
  | "announcements"
  | "statistics"
  | "qr_attendance";

export const MODULES: { key: ModuleKey; label: string; description: string }[] = [
  { key: "students", label: "Gestion des étudiants", description: "Voir, activer, suspendre les étudiants" },
  { key: "activities", label: "Gestion des activités", description: "Créer et gérer les activités" },
  { key: "planning", label: "Planification", description: "Planning et invitations aux activités" },
  { key: "payments", label: "Répartition des paiements", description: "Valider et éditer les paiements" },
  { key: "gallery", label: "Galerie", description: "Gérer les médias de la galerie" },
  { key: "announcements", label: "Annonces", description: "Diffuser des annonces" },
  { key: "statistics", label: "Statistiques", description: "Consulter les tableaux de bord" },
  { key: "qr_attendance", label: "Pointage QR code", description: "Scanner les QR codes de présence" },
];
