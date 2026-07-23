
CREATE POLICY "Teachers manage own apostila files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'apostilas'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'apostilas'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Students read their teacher's apostila files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'apostilas'
    AND (storage.foldername(name))[1] = public.my_teacher_id()::text
  );
