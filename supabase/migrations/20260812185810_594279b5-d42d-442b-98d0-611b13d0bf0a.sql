-- Create device_tokens table
create table if not exists public.device_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    token text unique not null,
    platform text not null,
    created_at timestamp with time zone default now()
);

-- Grant access
grant select, insert, update, delete on public.device_tokens to authenticated;
grant all on public.device_tokens to service_role;

-- Enable RLS
alter table public.device_tokens enable row level security;

-- Policies for device_tokens
create policy "Users can manage their own device tokens"
on public.device_tokens
for all
to authenticated
using (auth.uid() = user_id);

-- Create push_notifications table
create table if not exists public.push_notifications (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    body text not null,
    sender_id uuid references public.profiles(id) on delete set null,
    status text default 'pending',
    data jsonb default '{}',
    created_at timestamp with time zone default now()
);

-- Grant access
grant select, insert, update on public.push_notifications to authenticated;
grant all on public.push_notifications to service_role;

-- Enable RLS
alter table public.push_notifications enable row level security;

-- Policies for push_notifications
create policy "Admins can manage push notifications"
on public.push_notifications
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Users can see notifications history"
on public.push_notifications
for select
to authenticated
using (true);
