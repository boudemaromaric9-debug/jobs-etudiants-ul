import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-warning/10 p-4">
        <ShieldAlert className="h-10 w-10 text-warning" />
      </div>
      <h2 className="text-xl font-bold">Profil en attente de validation</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Votre profil doit être validé par un administrateur avant d'accéder à cette fonctionnalité. 
        Complétez votre profil et patientez la validation.
      </p>
      <Button asChild variant="outline">
        <Link to="/profil">Compléter mon profil</Link>
      </Button>
    </div>
  );
}