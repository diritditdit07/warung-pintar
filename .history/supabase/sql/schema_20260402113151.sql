create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_users (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  full_name text not null,
  pin_hash text not null,
  pin_salt text not null,
  role text not null default 'cashier',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_users_role_check check (role in ('owner', 'admin', 'cashier'))
);

alter table public.store_users add column if not exists pin_salt text;

create unique index if not exists store_users_store_id_full_name_idx
  on public.store_users(store_id, full_name);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  store_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_store_id_idx on public.products(store_id);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  store_user_id uuid references public.store_users(id) on delete set null,
  total numeric(12, 2) not null default 0,
  day_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists sales_store_id_created_at_idx on public.sales(store_id, created_at desc);
create index if not exists sales_store_id_day_key_idx on public.sales(store_id, day_key);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(12, 2) not null default 0,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  store_user_id uuid references public.store_users(id) on delete set null,
  name text not null,
  amount numeric(12, 2) not null default 0,
  day_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_store_id_created_at_idx on public.expenses(store_id, created_at desc);
create index if not exists expenses_store_id_day_key_idx on public.expenses(store_id, day_key);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  store_user_id uuid not null references public.store_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists app_sessions_store_user_id_idx on public.app_sessions(store_user_id);
create index if not exists app_sessions_expires_at_idx on public.app_sessions(expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row
execute function public.set_updated_at();

drop trigger if exists store_users_set_updated_at on public.store_users;
create trigger store_users_set_updated_at
before update on public.store_users
for each row
execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row
execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create or replace function public.generate_pin_salt()
returns text
language sql
as $$
  select md5(random()::text || clock_timestamp()::text);
$$;

create or replace function public.hash_pin(raw_pin text, raw_salt text)
returns text
language sql
as $$
  select md5(raw_salt || ':' || raw_pin);
$$;

create or replace function public.verify_store_user_pin(input_store_code text, input_pin text)
returns table (
  store_id uuid,
  store_code text,
  store_name text,
  store_user_id uuid,
  full_name text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    stores.id,
    stores.code,
    stores.name,
    store_users.id,
    store_users.full_name,
    store_users.role
  from public.stores
  join public.store_users on store_users.store_id = stores.id
  where lower(stores.code) = lower(input_store_code)
    and stores.is_active = true
    and store_users.is_active = true
    and store_users.pin_hash = public.hash_pin(input_pin, store_users.pin_salt)
  limit 1;
$$;

revoke all on function public.verify_store_user_pin(text, text) from public;
grant execute on function public.verify_store_user_pin(text, text) to service_role;

alter table public.stores enable row level security;
alter table public.store_users enable row level security;
alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.app_sessions enable row level security;

comment on table public.app_sessions is 'Custom app sessions for code + PIN login. Access should go through Edge Functions only.';

insert into public.stores (code, name)
values ('WARUNG-DEMO', 'Warung Demo')
on conflict (code) do nothing;

with demo_store as (
  select id, name from public.stores where code = 'WARUNG-DEMO'
)
insert into public.store_settings (store_id, store_name)
select id, name from demo_store
on conflict (store_id) do nothing;

with demo_store as (
  select id from public.stores where code = 'WARUNG-DEMO'
),
demo_seed as (
  select id, public.generate_pin_salt() as demo_pin_salt from demo_store
)
insert into public.store_users (store_id, full_name, pin_hash, pin_salt, role)
select
  id,
  'Admin Demo',
  public.hash_pin('1234', demo_pin_salt),
  demo_pin_salt,
  'owner'
from demo_seed
where not exists (
  select 1
  from public.store_users
  where store_users.store_id = demo_seed.id
    and store_users.full_name = 'Admin Demo'
);

update public.store_users
set
  pin_salt = demo_seed.demo_pin_salt,
  pin_hash = public.hash_pin('1234', demo_seed.demo_pin_salt)
from (
  select stores.id as store_id, public.generate_pin_salt() as demo_pin_salt
  from public.stores
  where stores.code = 'WARUNG-DEMO'
) as demo_seed
where public.store_users.store_id = demo_seed.store_id
  and public.store_users.full_name = 'Admin Demo';
