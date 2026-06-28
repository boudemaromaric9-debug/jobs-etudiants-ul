
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Profils visibles pour classement') THEN
    CREATE POLICY "Profils visibles pour classement" ON public.profiles
      FOR SELECT TO anon USING (status = 'active');
  END IF;
END $$;

GRANT SELECT ON public.profiles TO anon;
