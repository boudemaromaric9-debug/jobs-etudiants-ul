
CREATE POLICY "Gallery read all" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Gallery admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Gallery admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Gallery admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));
