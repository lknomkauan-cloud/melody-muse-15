-- Add birthday to profiles
alter table public.profiles add column if not exists birthday date;

-- Function to notify birthdays
create or replace function public.notify_birthdays()
returns void as $$
declare
    profile_record record;
    device_token record;
begin
    -- Find users who have birthday today or tomorrow
    for profile_record in 
        select id, full_name 
        from public.profiles 
        where (to_char(birthday, 'MM-DD') = to_char(now(), 'MM-DD')
           or to_char(birthday, 'MM-DD') = to_char(now() + interval '1 day', 'MM-DD'))
    loop
        -- Find device tokens for these users
        for device_token in 
            select token 
            from public.device_tokens 
            where user_id = profile_record.id
        loop
            -- In a real scenario, this would call an HTTP endpoint (Edge Function)
            -- For now we log it or insert into push_notifications log
            insert into public.push_notifications (title, body, data)
            values (
                'Parabéns, ' || coalesce(profile_record.full_name, 'Músico') || '!',
                'O Solando te deseja um ótimo dia de muita música!',
                jsonb_build_object('url', '/')
            );
        end loop;
    end loop;
end;
$$ language plpgsql security definer;
