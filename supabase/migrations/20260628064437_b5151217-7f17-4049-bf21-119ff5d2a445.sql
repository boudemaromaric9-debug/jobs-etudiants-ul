
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  url text NOT NULL,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Galerie lecture publique" ON public.gallery_items;
CREATE POLICY "Galerie lecture publique" ON public.gallery_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Galerie admin gere" ON public.gallery_items;
CREATE POLICY "Galerie admin gere" ON public.gallery_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER trg_gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS responsable_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS montant_etudiant numeric(10,2),
  ADD COLUMN IF NOT EXISTS montant_institution numeric(10,2);

CREATE OR REPLACE FUNCTION public.payments_split()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.montant_etudiant := ROUND(NEW.montant * 0.75, 2);
  NEW.montant_institution := ROUND(NEW.montant * 0.25, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_split ON public.payments;
CREATE TRIGGER trg_payments_split
  BEFORE INSERT OR UPDATE OF montant ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.payments_split();

UPDATE public.payments SET montant = montant WHERE montant_etudiant IS NULL;

CREATE OR REPLACE VIEW public.public_leaderboard AS
SELECT
  p.id,
  p.prenoms,
  LEFT(p.nom, 1) AS nom_initiale,
  p.faculte,
  COALESCE(SUM(r.heures_effectuees), 0)::numeric AS total_heures
FROM public.profiles p
LEFT JOIN public.registrations r
  ON r.user_id = p.id AND r.status = 'attended'
WHERE p.status = 'active'
GROUP BY p.id, p.prenoms, p.nom, p.faculte
ORDER BY total_heures DESC;

GRANT SELECT ON public.public_leaderboard TO anon, authenticated;
