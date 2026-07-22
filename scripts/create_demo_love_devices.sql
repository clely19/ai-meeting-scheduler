create table if not exists public.demo_love_devices (
  device_hash text primary key,
  created_at timestamptz not null default now()
);

alter table public.demo_love_devices enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'demo_love_devices'
      and policyname = 'Service role can manage demo love devices'
  ) then
    create policy "Service role can manage demo love devices"
      on public.demo_love_devices
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
