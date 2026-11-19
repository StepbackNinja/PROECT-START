create table public.start_push_config (id boolean primary key default true check(id), value jsonb not null);
create table public.start_push_devices (
 id text primary key, subscription jsonb not null, timezone text not null,
 completed_day date, updated_at timestamptz not null default now(),
 last_test_at timestamptz
);
create table public.start_push_sent (
 device_id text references public.start_push_devices(id) on delete cascade,
 day date not null, slot integer not null check (slot in (10,18,23)),
 primary key(device_id, day, slot)
);
alter table public.start_push_config enable row level security;
alter table public.start_push_devices enable row level security;
alter table public.start_push_sent enable row level security;
revoke all on public.start_push_config, public.start_push_devices, public.start_push_sent from anon, authenticated;
grant all on public.start_push_config, public.start_push_devices, public.start_push_sent to service_role;
create function public.start_claim_push(p_now timestamptz default now())
returns table(device_id text, subscription jsonb, day date, slot integer)
language sql security invoker set search_path = '' as $$
 with due as (
 select d.id, (p_now at time zone d.timezone)::date as day, h.slot
 from public.start_push_devices d cross join (values(10),(18),(23)) h(slot)
 where d.updated_at > p_now - interval '120 days'
 and d.completed_day is distinct from (p_now at time zone d.timezone)::date
 and extract(hour from p_now at time zone d.timezone) = h.slot
 and extract(minute from p_now at time zone d.timezone) < 10
 and not exists(select 1 from public.start_push_sent s where s.device_id=d.id and s.day=(p_now at time zone d.timezone)::date and s.slot=h.slot)
 limit 200
 ), claimed as (
 insert into public.start_push_sent(device_id,day,slot)
 select id,day,slot from due on conflict do nothing
 returning device_id,day,slot
 )
 select c.device_id, d.subscription,c.day,c.slot from claimed c
 join public.start_push_devices d on d.id=c.device_id;
$$;
revoke all on function public.start_claim_push(timestamptz) from public,anon,authenticated;
grant execute on function public.start_claim_push(timestamptz) to service_role;
