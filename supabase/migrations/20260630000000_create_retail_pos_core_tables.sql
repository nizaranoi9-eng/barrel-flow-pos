create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.stores (
  id text primary key,
  name text not null default 'RetailFlow Store',
  phone text,
  address text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  employee_pin text,
  name text,
  phone text,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  name text not null,
  tax_rate numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, name)
);

create table if not exists public.products (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  sku text,
  barcode text,
  cost_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  measurement_unit text not null default 'piece',
  package_type text not null default 'unit',
  package_size numeric(12,3) not null default 1,
  stock_packages integer not null default 0,
  total_stock_base_unit numeric(12,3) not null default 0,
  brand text,
  abv numeric(5,2),
  bottle_size text,
  mrp numeric(12,2),
  batch_number text,
  expiry_date date,
  supplier text,
  stock_quantity integer not null default 0,
  unit text not null default 'piece',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, sku),
  unique (store_id, barcode)
);

create table if not exists public.customers (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  total_orders integer not null default 0,
  total_spent numeric(12,2) not null default 0,
  last_order timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  cashier_id text references public.app_users(id) on delete set null,
  invoice_number text not null,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  discount_type text,
  discount_value numeric(12,2),
  total_amount numeric(12,2) not null default 0,
  payment_method text not null default 'cash',
  status text not null default 'completed',
  customer_email text,
  customer_phone text,
  notes text,
  created_at timestamptz not null default now(),
  synced_at timestamptz,
  unique (store_id, invoice_number)
);

create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  store_id text not null references public.stores(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(8,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  store_id text not null references public.stores(id) on delete cascade,
  payment_method text not null default 'cash',
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  old_quantity integer,
  new_quantity integer,
  quantity_delta integer not null default 0,
  reason text not null default 'manual_adjustment',
  order_id text references public.orders(id) on delete set null,
  created_by text references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id text primary key,
  store_id text not null unique references public.stores(id) on delete cascade,
  default_tax_rate numeric(8,2) not null default 8.5,
  max_discount_percent numeric(8,2) not null default 20,
  return_window_hours integer not null default 24,
  low_stock_threshold integer not null default 10,
  receipt_header text,
  receipt_footer text,
  currency_symbol text not null default '$',
  accent_color text not null default '#D97706',
  enable_age_verification boolean not null default false,
  min_legal_age integer not null default 21,
  require_dob_before_checkout boolean not null default false,
  card_theme_mode text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_store_id_idx on public.app_users(store_id);
create index if not exists categories_store_id_idx on public.categories(store_id);
create index if not exists products_store_id_idx on public.products(store_id);
create index if not exists products_store_barcode_idx on public.products(store_id, barcode);
create index if not exists customers_store_id_idx on public.customers(store_id);
create index if not exists orders_store_created_at_idx on public.orders(store_id, created_at desc);
create index if not exists order_items_store_order_idx on public.order_items(store_id, order_id);
create index if not exists payments_store_order_idx on public.payments(store_id, order_id);
create index if not exists inventory_movements_store_product_idx on public.inventory_movements(store_id, product_id, created_at desc);

create or replace trigger set_stores_updated_at before update on public.stores for each row execute function public.set_updated_at();
create or replace trigger set_app_users_updated_at before update on public.app_users for each row execute function public.set_updated_at();
create or replace trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create or replace trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create or replace trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create or replace trigger set_store_settings_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

alter table public.stores enable row level security;
alter table public.app_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.store_settings enable row level security;

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
    execute format('create policy "retail_app_server_routes_all" on public.%I for all to anon using (true) with check (true)', table_name);
    execute format('grant select, insert, update, delete on public.%I to anon', table_name);
  end loop;
end $$;
