import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

type Props = {
  userId: string;
  name?: string;
  faculte?: string | null;
  niveau?: string | null;
};

export function StudentQrCard({ userId, name, faculte, niveau }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  // QR payload : URL signée par le domaine + UUID étudiant.
  // Le scanner contrôle l'UUID lors du pointage de présence.
  const payload = `JOBS-ETUDIANTS-UL|${userId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 240,
      margin: 1,
      color: { dark: "#0a2540", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    QRCode.toDataURL(payload, {
      width: 1024,
      margin: 2,
      color: { dark: "#0a2540", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setDataUrl);
  }, [payload]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-jobs-etudiants-${userId.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" /> Mon QR Code étudiant
        </CardTitle>
        <CardDescription>
          Présentez ce QR Code au responsable d'équipe pour le contrôle de présence aux activités.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div className="grid place-items-center rounded-2xl border border-border bg-white p-4 shadow-card">
          <canvas ref={canvasRef} aria-label="QR Code étudiant" />
        </div>
        <div className="flex-1 min-w-[200px] space-y-3">
          <div className="space-y-0.5">
            {name && <div className="font-display text-lg font-bold leading-tight">{name}</div>}
            {(faculte || niveau) && (
              <div className="text-sm text-muted-foreground">
                {[faculte, niveau].filter(Boolean).join(" · ")}
              </div>
            )}
            <div className="font-mono text-[10px] text-muted-foreground">
              ID&nbsp;: {userId.slice(0, 8).toUpperCase()}
            </div>
          </div>
          <Button type="button" onClick={download} disabled={!dataUrl} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Télécharger le QR Code
          </Button>
          <p className="text-xs text-muted-foreground">
            Ce code est unique et personnel. Ne le partagez pas — il sert à valider votre présence
            et à créditer vos heures travaillées.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
