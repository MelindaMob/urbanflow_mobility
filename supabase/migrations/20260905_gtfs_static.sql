-- Référentiel GTFS statique TBM (lignes + arrêts).
-- Peuplé par scripts/import-gtfs.ts (cron quotidien).
-- Lu par lib/adapters/fetchTransitDataFromDb.ts.

create table if not exists public.gtfs_lines (
  route_id text primary key,
  route_short_name text,
  route_long_name text,
  route_type integer
);

create table if not exists public.gtfs_stops (
  stop_id text primary key,
  stop_name text,
  lat double precision,
  lng double precision,
  route_ids text[] not null default '{}'
);

create index if not exists gtfs_stops_route_ids_idx
  on public.gtfs_stops using gin (route_ids);

alter table public.gtfs_lines enable row level security;
alter table public.gtfs_stops enable row level security;

drop policy if exists "gtfs_lines_select_public" on public.gtfs_lines;
create policy "gtfs_lines_select_public"
  on public.gtfs_lines
  for select
  to anon, authenticated
  using (true);

drop policy if exists "gtfs_stops_select_public" on public.gtfs_stops;
create policy "gtfs_stops_select_public"
  on public.gtfs_stops
  for select
  to anon, authenticated
  using (true);

grant select on public.gtfs_lines to anon, authenticated;
grant select on public.gtfs_stops to anon, authenticated;
