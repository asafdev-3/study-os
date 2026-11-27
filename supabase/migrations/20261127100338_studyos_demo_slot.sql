
create schema if not exists studyos_private;
revoke all on schema studyos_private from public, anon, authenticated;
grant usage on schema studyos_private to authenticated, service_role;
create table studyos_private.demo_slot (
  singleton boolean primary key default true check(singleton),
  reservation uuid,
  user_id uuid,
  expires_at timestamptz not null default '-infinity'
);
alter table studyos_private.demo_slot enable row level security;
revoke all on studyos_private.demo_slot from public, anon, authenticated;
grant select, update, insert on studyos_private.demo_slot to service_role;
insert into studyos_private.demo_slot(singleton) values(true);
create function public.studyos_demo_reserve(p_reservation uuid)
returns timestamptz language sql security invoker set search_path='' as $$
  update studyos_private.demo_slot set reservation=p_reservation,user_id=null,expires_at=clock_timestamp()+interval '2 minutes'
  where singleton and expires_at<=clock_timestamp() returning expires_at;
$$;
create function public.studyos_demo_activate(p_reservation uuid,p_user_id uuid)
returns timestamptz language sql security invoker set search_path='' as $$
  update studyos_private.demo_slot set user_id=p_user_id,expires_at=clock_timestamp()+interval '45 minutes'
  where singleton and reservation=p_reservation and user_id is null and expires_at>clock_timestamp() returning expires_at;
$$;
create function public.studyos_demo_release(p_reservation uuid,p_user_id uuid)
returns boolean language sql security invoker set search_path='' as $$
  with released as (update studyos_private.demo_slot set reservation=null,user_id=null,expires_at='-infinity'
  where singleton and ((p_reservation is not null and reservation=p_reservation) or (p_user_id is not null and user_id=p_user_id)) returning 1)
  select exists(select 1 from released);
$$;
revoke execute on function public.studyos_demo_reserve(uuid),public.studyos_demo_activate(uuid,uuid),public.studyos_demo_release(uuid,uuid) from public,anon,authenticated;
grant execute on function public.studyos_demo_reserve(uuid),public.studyos_demo_activate(uuid,uuid),public.studyos_demo_release(uuid,uuid) to service_role;
create function studyos_private.demo_allowed()
returns boolean language sql stable security definer set search_path='' as $$
  select case when auth.uid() is null then false
    when coalesce(auth.jwt()->'app_metadata'->>'studyos_demo','false')<>'true' then true
    else exists(select 1 from studyos_private.demo_slot where singleton and user_id=auth.uid() and expires_at>statement_timestamp()) end;
$$;
revoke execute on function studyos_private.demo_allowed() from public,anon;
grant execute on function studyos_private.demo_allowed() to authenticated;
do $$ declare t text; begin
  foreach t in array array['profiles','annotations','goals','enem_scores','study_sessions'] loop
    execute format('create policy studyos_demo_active on public.%I as restrictive for all to authenticated using ((select studyos_private.demo_allowed())) with check ((select studyos_private.demo_allowed()))',t);
  end loop;
end $$;
create function studyos_private.kira_allowed(p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users u where u.id=p_user_id and
    (coalesce(u.raw_app_meta_data->>'studyos_demo','false')<>'true' or exists(
      select 1 from studyos_private.demo_slot s where s.singleton and s.user_id=p_user_id and s.expires_at>statement_timestamp())));
$$;
revoke execute on function studyos_private.kira_allowed(uuid) from public,anon,authenticated;
grant execute on function studyos_private.kira_allowed(uuid) to service_role;
create or replace function public.kira_daily_quota(p_user_id uuid,p_consume boolean)
returns table(allowed boolean,remaining integer) language plpgsql security invoker set search_path='' as $$
declare today date := (statement_timestamp() at time zone 'America/Sao_Paulo')::date; used integer;
begin
  if not studyos_private.kira_allowed(p_user_id) then
    return query select false,0; return;
  end if;
  if p_consume then
    insert into public.kira_daily_usage as usage(user_id,study_date,requests) values(p_user_id,today,1)
    on conflict(user_id,study_date) do update set requests=usage.requests+1 where usage.requests<10 returning usage.requests into used;
    return query select used is not null,10-coalesce(used,10);
  else
    select usage.requests into used from public.kira_daily_usage as usage where usage.user_id=p_user_id and usage.study_date=today;
    return query select coalesce(used,0)<10,10-coalesce(used,0);
  end if;
end $$;

