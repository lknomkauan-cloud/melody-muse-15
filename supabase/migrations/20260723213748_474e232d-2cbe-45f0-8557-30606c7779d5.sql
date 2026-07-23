
CREATE TABLE public.plugin_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entry_path TEXT,
  is_native BOOLEAN NOT NULL DEFAULT false,
  file_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_bundles TO authenticated;
GRANT ALL ON public.plugin_bundles TO service_role;
ALTER TABLE public.plugin_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bundles select" ON public.plugin_bundles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own bundles insert" ON public.plugin_bundles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bundles update" ON public.plugin_bundles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bundles delete" ON public.plugin_bundles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user-plugins read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-plugins' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user-plugins insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-plugins' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user-plugins update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-plugins' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user-plugins delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-plugins' AND (storage.foldername(name))[1] = auth.uid()::text);
