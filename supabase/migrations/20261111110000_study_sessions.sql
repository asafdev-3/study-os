create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('lc', 'ch', 'cn', 'mt', 'red')),
  duration_min integer not null default 25 check (duration_min > 0),
  score integer check (score between 0 and 1000),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.study_sessions enable row level security;
grant select, insert on public.study_sessions to authenticated;

drop policy if exists study_sessions_read_own on public.study_sessions;
drop policy if exists study_sessions_insert_own on public.study_sessions;

create policy study_sessions_read_own on public.study_sessions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy study_sessions_insert_own on public.study_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);

create index if not exists idx_study_sessions_user_activity
  on public.study_sessions (user_id, created_at desc, id);
