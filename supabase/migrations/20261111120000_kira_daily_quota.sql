create table public.kira_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  requests integer not null check (requests between 1 and 10),
  primary key (user_id, study_date)
);

alter table public.kira_daily_usage enable row level security;
revoke all on public.kira_daily_usage from public, anon, authenticated;
grant select, insert, update on public.kira_daily_usage to service_role;

create function public.kira_daily_quota(p_user_id uuid, p_consume boolean)
returns table (allowed boolean, remaining integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (statement_timestamp() at time zone 'America/Sao_Paulo')::date;
  used integer;
begin
  if p_consume then
    insert into public.kira_daily_usage as usage (user_id, study_date, requests)
    values (p_user_id, today, 1)
    on conflict (user_id, study_date) do update
      set requests = usage.requests + 1
      where usage.requests < 10
    returning usage.requests into used;

    return query select used is not null, 10 - coalesce(used, 10);
  else
    select usage.requests into used
    from public.kira_daily_usage as usage
    where usage.user_id = p_user_id and usage.study_date = today;

    return query select coalesce(used, 0) < 10, 10 - coalesce(used, 0);
  end if;
end;
$$;

revoke execute on function public.kira_daily_quota(uuid, boolean) from public, anon, authenticated;
grant execute on function public.kira_daily_quota(uuid, boolean) to service_role;
