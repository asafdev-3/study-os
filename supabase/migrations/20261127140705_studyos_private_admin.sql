create schema studyos_admin_private;
revoke all on schema studyos_admin_private from public, anon, authenticated;
grant usage on schema studyos_admin_private to authenticated;
create table studyos_admin_private.owner (
 singleton boolean primary key default true check(singleton),
 user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table studyos_admin_private.owner enable row level security;
revoke all on studyos_admin_private.owner from public, anon, authenticated;
create function studyos_admin_private.snapshot(p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists (
  select 1 from studyos_admin_private.owner o
  join auth.users u on u.id=o.user_id
  join auth.sessions s on s.user_id=u.id
  where u.id=auth.uid() and s.id::text=auth.jwt()->>'session_id'
    and (s.not_after is null or s.not_after>now())
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    and coalesce(u.raw_app_meta_data->>'studyos_demo','false') <> 'true'
 ) then raise exception 'Access denied' using errcode='42501'; end if;
 select jsonb_build_object(
 'accounts', (select count(*) from auth.users u where not coalesce(u.is_anonymous,false) and coalesce(u.raw_app_meta_data->>'studyos_demo','false')<>'true'),
 'confirmed', (select count(*) from auth.users u where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and coalesce(u.raw_app_meta_data->>'studyos_demo','false')<>'true'),
 'new_today', (select count(*) from auth.users u where (u.created_at at time zone 'America/Sao_Paulo')::date=(now() at time zone 'America/Sao_Paulo')::date and not coalesce(u.is_anonymous,false) and coalesce(u.raw_app_meta_data->>'studyos_demo','false')<>'true'),
 'users', (select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select u.id,u.email,u.created_at,u.email_confirmed_at,u.last_sign_in_at from auth.users u where not coalesce(u.is_anonymous,false) and coalesce(u.raw_app_meta_data->>'studyos_demo','false')<>'true' order by u.created_at desc,u.id limit 100 offset greatest(0,least(coalesce(p_offset,0),100000))) t),
 'traffic', (select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select event_day,event_name,screen,entry_source,count(*) as total from public.studyos_growth_events where event_day >= (now() at time zone 'America/Sao_Paulo')::date-29 group by 1,2,3,4 order by 1 desc,2,3,4) t)
 ) into result;
 return result;
end $$;
revoke all on function studyos_admin_private.snapshot(integer) from public, anon, authenticated;
grant execute on function studyos_admin_private.snapshot(integer) to authenticated;
create function public.studyos_admin_snapshot(p_offset integer default 0) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select studyos_admin_private.snapshot(p_offset);
$$;
revoke all on function public.studyos_admin_snapshot(integer) from public, anon, authenticated;
grant execute on function public.studyos_admin_snapshot(integer) to authenticated;
