with liquor_categories(name, tax_rate) as (
  values
    ('Whisky', 18.0),
    ('Rum', 18.0),
    ('Vodka', 18.0),
    ('Gin', 18.0),
    ('Brandy', 18.0),
    ('Tequila', 18.0),
    ('Wine', 18.0),
    ('Beer', 18.0),
    ('Craft Beer', 18.0),
    ('Imported Beer', 18.0),
    ('Liqueurs', 18.0),
    ('Champagne & Sparkling Wine', 18.0),
    ('Ready-to-Drink', 18.0),
    ('Mixers & Soda', 12.0),
    ('Energy Drinks', 18.0),
    ('Water & Soft Drinks', 12.0),
    ('Tobacco & Cigarettes', 28.0),
    ('Bar Accessories', 18.0),
    ('Snacks', 12.0),
    ('Other', 18.0)
)
insert into public.categories (id, store_id, name, tax_rate)
select
  'cat_' || md5(stores.id || ':' || liquor_categories.name),
  stores.id,
  liquor_categories.name,
  liquor_categories.tax_rate
from public.stores
cross join liquor_categories
on conflict (store_id, name)
do update set
  tax_rate = excluded.tax_rate,
  updated_at = now();

with category_replacements(source_name, target_name) as (
  values
    ('Groceries', 'Snacks'),
    ('Dairy', 'Mixers & Soda'),
    ('Beverages', 'Water & Soft Drinks'),
    ('Personal Care', 'Bar Accessories'),
    ('Household', 'Bar Accessories'),
    ('Electronics', 'Other'),
    ('Clothing', 'Other'),
    ('Stationery', 'Other'),
    ('Whiskey', 'Whisky'),
    ('Cigarettes', 'Tobacco & Cigarettes'),
    ('Mixers', 'Mixers & Soda')
),
resolved_replacements as (
  select
    source.id as source_id,
    target.id as target_id,
    source.store_id
  from public.categories source
  join category_replacements replacement on replacement.source_name = source.name
  join public.categories target
    on target.store_id = source.store_id
   and target.name = replacement.target_name
)
update public.products products
set category_id = resolved_replacements.target_id,
    updated_at = now()
from resolved_replacements
where products.store_id = resolved_replacements.store_id
  and products.category_id = resolved_replacements.source_id;

delete from public.categories categories
using (
  values
    ('Groceries'),
    ('Dairy'),
    ('Beverages'),
    ('Personal Care'),
    ('Household'),
    ('Electronics'),
    ('Clothing'),
    ('Stationery'),
    ('Whiskey'),
    ('Cigarettes'),
    ('Mixers')
) as old_categories(name)
where categories.name = old_categories.name;

update public.store_settings
set categories_initialized = true,
    updated_at = now();
