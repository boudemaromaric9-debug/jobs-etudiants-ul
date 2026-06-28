// Traduit les messages d'erreur Supabase Auth en français
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return "Une erreur est survenue. Veuillez réessayer.";
  const m = message.toLowerCase();

  if (m.includes("password is known to be weak") || m.includes("pwned") || m.includes("weak"))
    return "Ce mot de passe est trop faible ou trop courant. Choisissez-en un plus complexe (mélange de lettres, chiffres et symboles).";
  if (m.includes("password should be at least") || m.includes("password is too short"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("invalid login credentials") || m.includes("invalid email or password"))
    return "Adresse e-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Votre adresse e-mail n'a pas encore été confirmée.";
  if (m.includes("user already registered") || m.includes("already registered") || m.includes("already exists"))
    return "Un compte existe déjà avec cette adresse e-mail.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "L'adresse e-mail saisie n'est pas valide.";
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.";
  if (m.includes("network") || m.includes("failed to fetch"))
    return "Problème de connexion réseau. Vérifiez votre connexion internet.";
  if (m.includes("signup is disabled") || m.includes("signups not allowed"))
    return "Les inscriptions sont actuellement désactivées.";
  if (m.includes("user not found"))
    return "Aucun compte n'est associé à cette adresse e-mail.";
  if (m.includes("same password") || m.includes("new password should be different"))
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (m.includes("token") && (m.includes("expired") || m.includes("invalid")))
    return "Le lien est invalide ou a expiré. Veuillez recommencer la procédure.";
  if (m.includes("unsupported provider"))
    return "Ce mode de connexion n'est pas activé. Contactez l'administrateur.";

  // Fallback
  return message;
}
