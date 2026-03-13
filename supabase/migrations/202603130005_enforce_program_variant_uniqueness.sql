do $$
begin
  if exists (
    select 1
    from public.programs
    group by lower(trim(regexp_replace(name, '\\s+', ' ', 'g'))),
             lower(trim(coalesce(nc_level, ''))),
             coalesce(duration_hours, 0)
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce program uniqueness yet: duplicate Name + NC Level + Duration rows exist in programs table.';
  end if;
end $$;

create unique index if not exists uq_programs_variant_normalized
on public.programs (
  lower(trim(regexp_replace(name, '\\s+', ' ', 'g'))),
  lower(trim(coalesce(nc_level, ''))),
  coalesce(duration_hours, 0)
);