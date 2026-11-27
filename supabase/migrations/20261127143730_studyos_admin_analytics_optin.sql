-- StudyOS: consent-based activity analytics and protected admin reporting.
-- Emails are returned only for accounts with an explicit marketing opt-in.

create table if not exists public.studyos_tracking_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  analytics_consent boolean not null default false,
  marketing_consent boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint marketing_requires_analytics check (not marketing_consent or analytics_consent)
);

create table if not exists public.studyos_daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default (now() at time zone 'America/Sao_Paulo')::date,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create index if not exists studyos_daily_activity_date_idx on public.studyos_daily_activity(activity_date);
alter table public.studyos_tracking_consents enable row level security;
alter table public.studyos_daily_activity enable row level security;

revoke all on public.studyos_tracking_consents from anon, authenticated;
revoke all on public.studyos_daily_activity from anon, authenticated;

create or replace function public.studyos_my_consents()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'analytics_consent', c.analytics_consent,
    'marketing_consent', c.marketing_consent
  )
  from public.studyos_tracking_consents c
  where c.user_id = auth.uid();
$$;

create or replace function public.studyos_set_my_consents(p_analytics boolean, p_marketing boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_marketing and not p_analytics then raise exception 'marketing consent requires analytics consent'; end if;
  insert into public.studyos_tracking_consents(user_id, analytics_consent, marketing_consent, updated_at)
  values (auth.uid(), p_analytics, p_marketing, now())
  on conflict (user_id) do update set
    analytics_consent = excluded.analytics_consent,
    marketing_consent = excluded.marketing_consent,
    updated_at = now();
  if not p_analytics then
    delete from public.studyos_daily_activity where user_id = auth.uid();
  end if;
end;
$$;

create or replace function public.studyos_track_visit()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.studyos_daily_activity(user_id, activity_date)
  select auth.uid(), (now() at time zone 'America/Sao_Paulo')::date
  from public.studyos_tracking_consents c
  where c.user_id = auth.uid() and c.analytics_consent
  on conflict (user_id, activity_date) do nothing;
end;
$$;

create or replace function public.studyos_admin_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 7), 90);
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from studyos_admin_private.owner o
    join auth.users owner_user on owner_user.id = o.user_id
    join auth.sessions current_session on current_session.user_id = owner_user.id
    where owner_user.id = auth.uid()
      and current_session.id::text = auth.jwt() ->> 'session_id'
      and (current_session.not_after is null or current_session.not_after > now())
      and owner_user.email_confirmed_at is not null
      and not coalesce(owner_user.is_anonymous, false)
      and coalesce(owner_user.raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true'
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'totals', jsonb_build_object(
      'accounts', (select count(*) from auth.users where not coalesce(is_anonymous, false) and coalesce(raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true'),
      'confirmed', (select count(*) from auth.users where email_confirmed_at is not null and not coalesce(is_anonymous, false) and coalesce(raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true'),
      'active_users', (select count(distinct a.user_id) from public.studyos_daily_activity a join auth.users u on u.id = a.user_id where a.activity_date >= v_today - (v_days - 1) and not coalesce(u.is_anonymous, false) and coalesce(u.raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true'),
      'marketing_contacts', (select count(*) from public.studyos_tracking_consents c join auth.users u on u.id = c.user_id where c.marketing_consent and not coalesce(u.is_anonymous, false) and coalesce(u.raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true'),
      'today', (select count(*) from public.studyos_daily_activity a join auth.users u on u.id = a.user_id where a.activity_date = v_today and not coalesce(u.is_anonymous, false) and coalesce(u.raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true')
    ),
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object('date', d.day::date, 'visitors', coalesce(a.visitors, 0)) order by d.day)
      from generate_series(v_today - (v_days - 1), v_today, interval '1 day') d(day)
      left join (
        select a.activity_date, count(distinct a.user_id)::integer as visitors
        from public.studyos_daily_activity a join auth.users u on u.id = a.user_id
        where a.activity_date >= v_today - (v_days - 1) and not coalesce(u.is_anonymous, false) and coalesce(u.raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true'
        group by activity_date
      ) a on a.activity_date = d.day::date
    ), '[]'::jsonb),
    'traffic', coalesce((
      select jsonb_agg(jsonb_build_object('event_name', event_name, 'screen', screen, 'entry_source', entry_source, 'total', total) order by total desc)
      from (
        select event_name, screen, entry_source, count(*)::integer as total
        from public.studyos_growth_events
        where event_day >= (now() at time zone 'America/Sao_Paulo')::date - 29
        group by event_name, screen, entry_source
      ) grouped_events
    ), '[]'::jsonb),
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'name', coalesce(p.nome, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
        'created_at', u.created_at,
        'active_days', coalesce(a.active_days, 0),
        'last_seen', a.last_seen
      ) order by u.created_at desc)
      from auth.users u
      join public.studyos_tracking_consents c on c.user_id = u.id and c.marketing_consent
      left join public.profiles p on p.id = u.id
      left join (
        select user_id, count(*)::integer as active_days, max(activity_date) as last_seen
        from public.studyos_daily_activity
        group by user_id
      ) a on a.user_id = u.id
      where not coalesce(u.is_anonymous, false) and coalesce(u.raw_app_meta_data ->> 'studyos_demo', 'false') <> 'true'
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.studyos_my_consents() from public, anon;
revoke all on function public.studyos_set_my_consents(boolean, boolean) from public, anon;
revoke all on function public.studyos_track_visit() from public, anon;
revoke all on function public.studyos_admin_dashboard(integer) from public, anon, authenticated;
grant execute on function public.studyos_my_consents() to authenticated;
grant execute on function public.studyos_set_my_consents(boolean, boolean) to authenticated;
grant execute on function public.studyos_track_visit() to authenticated;
grant execute on function public.studyos_admin_dashboard(integer) to authenticated;
