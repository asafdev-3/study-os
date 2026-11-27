create table public.studyos_growth_events (
 event_id uuid primary key default gen_random_uuid(),
 event_day date not null default ((now() at time zone 'America/Sao_Paulo')::date),
 event_name text not null check (event_name in ('app_open','screen_view','demo_open','account_open')),
 screen text not null check (screen in ('landing','login','dashboard','kira','enem','notes','reminders','focus','settings','profile','upgrade','nfc','other')),
 entry_source text not null default 'unknown' check (entry_source in ('qr','nfc','direct','unknown'))
);
alter table public.studyos_growth_events enable row level security;
revoke all on public.studyos_growth_events from public, anon, authenticated;
grant insert (event_name,screen,entry_source) on public.studyos_growth_events to anon;
create policy studyos_growth_insert_only on public.studyos_growth_events for insert to anon with check (true);
create index studyos_growth_events_day_idx on public.studyos_growth_events(event_day);
comment on table public.studyos_growth_events is 'Opt-in coarse product metrics. No user, device, IP, conversation or session identifiers; not for individual marketing.';
