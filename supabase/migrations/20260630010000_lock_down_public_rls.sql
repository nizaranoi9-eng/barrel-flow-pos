-- Lock down direct public access to POS tables.
-- The Next.js backend should use SUPABASE_SERVICE_ROLE_KEY for database access.
-- Users are still isolated by store_id in the application API routes.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'stores',
    'app_users',
    'categories',
    'products',
    'customers',
    'orders',
    'order_items',
    'payments',
    'inventory_movements',
    'store_settings'
  ]
  loop
    execute format('drop policy if exists "retail_app_server_routes_all" on public.%I', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    execute format('revoke all on public.%I from authenticated', table_name);
  end loop;
end $$;
