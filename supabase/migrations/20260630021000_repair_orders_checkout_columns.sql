alter table public.orders
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists payment_method text not null default 'cash',
  add column if not exists status text not null default 'completed',
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists notes text,
  add column if not exists synced_at timestamptz;

alter table public.orders
  alter column name drop not null,
  alter column cost_price drop not null,
  alter column selling_price drop not null,
  alter column measurement_unit drop not null,
  alter column package_type drop not null,
  alter column package_size drop not null,
  alter column stock_packages drop not null,
  alter column total_stock_base_unit drop not null,
  alter column stock_quantity drop not null,
  alter column unit drop not null,
  alter column is_active drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_store_id_invoice_number_key'
  ) then
    alter table public.orders
      add constraint orders_store_id_invoice_number_key unique (store_id, invoice_number);
  end if;
end $$;

notify pgrst, 'reload schema';
