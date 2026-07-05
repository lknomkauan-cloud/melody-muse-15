
-- Explicit write policies for user_roles: block all client writes; only service_role (used by triggers/admin code) can mutate.
-- The handle_new_user() trigger is SECURITY DEFINER and bypasses RLS, so signup still works.

DROP POLICY IF EXISTS "No client inserts on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No client updates on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No client deletes on user_roles" ON public.user_roles;

CREATE POLICY "No client inserts on user_roles"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No client updates on user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "No client deletes on user_roles"
ON public.user_roles
FOR DELETE
TO authenticated, anon
USING (false);
