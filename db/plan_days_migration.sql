-- Run this once in the Supabase SQL editor.
-- Backs plan-sync.js: one row per (plan, day_key), for train.html's
-- Push/Pull/Legs tabs (plan='train') and gym.html's day list (plan='gym').

create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan text not null check (plan in ('train', 'gym')),
  day_key text not null,
  name text not null,
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (plan, day_key)
);

alter table public.plan_days enable row level security;

-- This app has no per-user auth (single shared passcode gate in front of
-- the whole app -- see lib/auth.js -- not Supabase Auth), so there is no
-- user_id to scope by. This policy just requires holding the anon key,
-- exactly the trust model the existing app_state table already relies on
-- everywhere else in this project.
create policy "plan_days_anon_all" on public.plan_days
  for all
  to anon
  using (true)
  with check (true);

-- Enable Realtime for this table (adds it to the publication every
-- Supabase project ships with by default). Safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'plan_days'
  ) then
    alter publication supabase_realtime add table public.plan_days;
  end if;
end $$;
