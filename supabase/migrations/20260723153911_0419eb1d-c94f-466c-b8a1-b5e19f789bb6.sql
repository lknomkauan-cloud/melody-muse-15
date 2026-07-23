
DROP TRIGGER IF EXISTS on_auth_user_created_grant_owner ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_owner ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
DROP FUNCTION IF EXISTS public.grant_admin_for_owner_email() CASCADE;
DELETE FROM public.user_roles WHERE role = 'admin';
DROP TABLE IF EXISTS public.announcements;
