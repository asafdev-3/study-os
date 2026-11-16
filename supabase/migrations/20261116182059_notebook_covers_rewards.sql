-- Capas StudyOS: progresso verificado pelo servidor, desafio semanal, acervo permanente.
-- Requer public.annotations (studyos_schema.sql). Aplicar antes da Edge Function.
alter table public.annotations add column if not exists cover_id text;

create table if not exists public.cover_focus_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id uuid not null,
  study_date date not null,
  last_ping timestamptz
);
create table if not exists public.cover_study_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  seconds integer not null default 0 check (seconds between 0 and 86400),
  primary key(user_id, study_date)
);
create table if not exists public.cover_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  cover_id text not null check (cover_id ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}_[a-z0-9-]+$'),
  unlocked_at timestamptz not null default now(),
  primary key(user_id, cover_id)
);
create table if not exists public.cover_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  cover_id text not null,
  annotation_id uuid not null,
  question text not null,
  rubric text not null,
  status text not null default 'pending'
    check(status in ('pending','grading','passed','failed','review')),
  answer text,
  feedback text,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  primary key(user_id, week_start)
);

create index if not exists cover_study_days_recent on public.cover_study_days(user_id, study_date desc);
create index if not exists cover_unlocks_recent on public.cover_unlocks(user_id, unlocked_at desc);

alter table public.cover_focus_state enable row level security;
alter table public.cover_study_days enable row level security;
alter table public.cover_unlocks enable row level security;
alter table public.cover_challenges enable row level security;

revoke all on public.cover_focus_state, public.cover_study_days,
  public.cover_unlocks, public.cover_challenges from public, anon, authenticated;
grant select on public.cover_study_days, public.cover_unlocks to authenticated;
create policy cover_study_days_read_own on public.cover_study_days
  for select to authenticated using ((select auth.uid()) = user_id);
create policy cover_unlocks_read_own on public.cover_unlocks
  for select to authenticated using ((select auth.uid()) = user_id);
grant all on public.cover_focus_state, public.cover_study_days,
  public.cover_unlocks, public.cover_challenges to service_role;

-- Relógio do servidor: uma sessão ativa por usuário, sem tempo contado em background.
-- Pings acima de 45 segundos perdem o excesso, evitando crédito por aba suspensa.
create or replace function public.cover_focus_ping(p_session_id uuid, p_running boolean)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_now timestamptz := statement_timestamp();
  v_today date := (v_now at time zone 'America/Sao_Paulo')::date;
  v_state public.cover_focus_state%rowtype;
  v_delta integer := 0;
  v_total integer := 0;
begin
  if v_user is null or p_session_id is null or p_running is null then
    raise exception 'Sessão não autenticada ou inválida' using errcode = '22023';
  end if;
  if not p_running then
    update public.cover_focus_state set last_ping = null
    where user_id = v_user and session_id = p_session_id;
  else
    insert into public.cover_focus_state (user_id, session_id, study_date, last_ping)
    values (v_user, p_session_id, v_today, v_now)
    on conflict(user_id) do nothing;

    select * into v_state from public.cover_focus_state
    where user_id = v_user for update;

    if v_state.session_id = p_session_id and v_state.study_date = v_today
       and v_state.last_ping is not null then
      v_delta := least(45, greatest(0, floor(extract(epoch from v_now - v_state.last_ping))::integer));
    end if;

    update public.cover_focus_state
    set session_id = p_session_id, study_date = v_today, last_ping = v_now
    where user_id = v_user;

    if v_delta > 0 then
      insert into public.cover_study_days as tracked (user_id, study_date, seconds)
      values (v_user, v_today, v_delta)
      on conflict(user_id,study_date) do update
        set seconds = least(86400, tracked.seconds + excluded.seconds);
    end if;
  end if;

  select coalesce((select seconds from public.cover_study_days
    where user_id = v_user and study_date = v_today), 0) into v_total;
  return v_total;
end;
$$;
revoke all on function public.cover_focus_ping(uuid,boolean) from public, anon;
grant execute on function public.cover_focus_ping(uuid,boolean) to authenticated;

-- Não é possível aplicar capas que não estejam no acervo da própria conta.
create or replace function public.cover_guard_annotation()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.cover_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.cover_id is not distinct from old.cover_id then
    return new;
  end if;
  if not exists (
    select 1 from public.cover_unlocks owned
    where owned.user_id = new.user_id and owned.cover_id = new.cover_id
  ) then
    raise exception 'Capa indisponível nesta conta' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.cover_guard_annotation() from public, anon, authenticated;
drop trigger if exists trg_cover_guard_annotation on public.annotations;
create trigger trg_cover_guard_annotation before insert or update of cover_id
on public.annotations for each row execute function public.cover_guard_annotation();
