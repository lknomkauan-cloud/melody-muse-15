
-- 1. Profiles extension
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unlocked_instruments text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS profiles_teacher_id_idx ON public.profiles(teacher_id);

-- 2. Helper: get current user's teacher id (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.my_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 3. Extra profile policies (students see their teacher, teachers see their students, everyone sees teacher directory)
DROP POLICY IF EXISTS "Students can view their teacher profile" ON public.profiles;
CREATE POLICY "Students can view their teacher profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = public.my_teacher_id());

DROP POLICY IF EXISTS "Teachers can view their students profiles" ON public.profiles;
CREATE POLICY "Teachers can view their students profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view teacher directory" ON public.profiles;
CREATE POLICY "Anyone can view teacher directory"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (public.has_role(id, 'teacher'::public.app_role));

-- 4. RPC for teacher to set a student's unlocked_instruments and teacher_id linking
CREATE OR REPLACE FUNCTION public.teacher_set_unlocked(_student_id uuid, _instruments text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'teacher'::public.app_role)
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
     SET unlocked_instruments = COALESCE(_instruments, '{}'),
         updated_at = now()
   WHERE id = _student_id
     AND (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
END;
$$;

REVOKE ALL ON FUNCTION public.teacher_set_unlocked(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.teacher_set_unlocked(uuid, text[]) TO authenticated;

-- 5. RPC for student to pick their teacher
CREATE OR REPLACE FUNCTION public.set_my_teacher(_teacher_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _teacher_id IS NOT NULL
     AND NOT public.has_role(_teacher_id, 'teacher'::public.app_role) THEN
    RAISE EXCEPTION 'Target user is not a teacher';
  END IF;

  UPDATE public.profiles
     SET teacher_id = _teacher_id,
         updated_at = now()
   WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_teacher(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_teacher(uuid) TO authenticated;

-- 6. Apostilas table
CREATE TABLE IF NOT EXISTS public.apostilas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  instrument text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_url text,
  source text NOT NULL CHECK (source IN ('editor','blocos','upload')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apostilas TO authenticated;
GRANT ALL ON public.apostilas TO service_role;

ALTER TABLE public.apostilas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their own apostilas"
  ON public.apostilas FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Students view their teacher's apostilas"
  ON public.apostilas FOR SELECT
  TO authenticated
  USING (teacher_id = public.my_teacher_id());

CREATE TRIGGER apostilas_set_updated_at
  BEFORE UPDATE ON public.apostilas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS apostilas_teacher_idx ON public.apostilas(teacher_id);
