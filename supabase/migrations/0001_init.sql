-- ---------------------------------------------------------------------------
-- Inboxly — initial schema
--
-- Run this in the Supabase SQL editor (or `supabase db push` with the CLI).
-- It is idempotent, so re-running it is safe.
-- ---------------------------------------------------------------------------

-- Plans are a domain concept, not free text: a typo should fail at write time.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_id') then
    create type public.plan_id as enum ('free', 'pro', 'team');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, created automatically by a trigger
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan public.plan_id not null default 'free',
  generations_used integer not null default 0 check (generations_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile and plan state for each authenticated user.';

-- ---------------------------------------------------------------------------
-- emails — generation history
-- ---------------------------------------------------------------------------
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null check (char_length(topic) between 1 and 2000),
  tone text not null,
  length text not null,
  language text not null default 'English',
  recipient text,
  subject text not null,
  body text not null,
  model text not null,
  created_at timestamptz not null default now()
);

-- The dashboard always reads "my emails, newest first".
create index if not exists emails_user_id_created_at_idx
  on public.emails (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security — every row is owned by exactly one user
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.emails enable row level security;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by their owner" on public.profiles;
create policy "Profiles are updatable by their owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert stays open to the owner as a fallback for the rare case where the
-- signup trigger has not fired yet by the time the client loads the profile.
drop policy if exists "Profiles are insertable by their owner" on public.profiles;
create policy "Profiles are insertable by their owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Emails are readable by their owner" on public.emails;
create policy "Emails are readable by their owner"
  on public.emails for select
  using (auth.uid() = user_id);

drop policy if exists "Emails are insertable by their owner" on public.emails;
create policy "Emails are insertable by their owner"
  on public.emails for insert
  with check (auth.uid() = user_id);

drop policy if exists "Emails are deletable by their owner" on public.emails;
create policy "Emails are deletable by their owner"
  on public.emails for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keep updated_at honest without trusting the client to send it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create the profile row as part of signup, inside the same transaction.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Quota accounting — called by the generation endpoint with the service role
-- ---------------------------------------------------------------------------
create or replace function public.increment_generations_used(target_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value integer;
begin
  update public.profiles
     set generations_used = generations_used + 1
   where id = target_user
  returning generations_used into next_value;

  return next_value;
end;
$$;
