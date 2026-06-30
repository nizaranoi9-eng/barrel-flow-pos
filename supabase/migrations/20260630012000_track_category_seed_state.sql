alter table public.store_settings
  add column if not exists categories_initialized boolean not null default false;

update public.store_settings settings
set categories_initialized = true
where exists (
  select 1
  from public.categories categories
  where categories.store_id = settings.store_id
);
