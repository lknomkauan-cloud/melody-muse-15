-- Fix security for handle_new_user
revoke execute on function public.handle_new_user() from public;
alter function public.handle_new_user() set search_path = public;

-- Fix security for has_role
revoke execute on function public.has_role(uuid, app_role) from public;
alter function public.has_role(uuid, app_role) set search_path = public;

-- Fix security for my_teacher_id
revoke execute on function public.my_teacher_id() from public;
alter function public.my_teacher_id() set search_path = public;

-- Fix security for set_my_teacher
revoke execute on function public.set_my_teacher(uuid) from public;
alter function public.set_my_teacher(uuid) set search_path = public;

-- Fix security for teacher_set_unlocked
revoke execute on function public.teacher_set_unlocked(uuid, text[]) from public;
alter function public.teacher_set_unlocked(uuid, text[]) set search_path = public;

-- Fix security for notify_birthdays
revoke execute on function public.notify_birthdays() from public;
alter function public.notify_birthdays() set search_path = public;

-- Re-grant to authenticated for functions that need it
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.my_teacher_id() to authenticated;
grant execute on function public.set_my_teacher(uuid) to authenticated;
grant execute on function public.teacher_set_unlocked(uuid, text[]) to authenticated;
