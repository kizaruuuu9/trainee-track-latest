alter table if exists public.programs
  add column if not exists competencies text[] default '{}'::text[];

create index if not exists idx_programs_name on public.programs(name);