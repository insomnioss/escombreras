-- Escombreras: esquema inicial para Supabase/PostgreSQL.
-- Ejecutar completo en Supabase > SQL Editor > New query.

create type public.app_role as enum ('admin', 'constructor', 'site');
create type public.site_status as enum ('open', 'limited', 'closed', 'maintenance', 'unavailable');
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default 'Usuario',
  company_name text,
  role public.app_role not null default 'constructor',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.construction_companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique not null references public.profiles(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  rut text,
  address text,
  region text,
  commune text,
  phone text,
  contact_name text,
  additional_info text,
  created_at timestamptz not null default now()
);

create table public.disposal_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique not null references public.profiles(id) on delete cascade,
  name text not null,
  legal_name text,
  rut text,
  address text,
  region text,
  commune text,
  latitude numeric,
  longitude numeric,
  phone text,
  contact_name text,
  description text,
  hours text,
  total_capacity numeric not null default 0 check (total_capacity >= 0),
  used_capacity numeric not null default 0 check (used_capacity >= 0),
  status public.site_status not null default 'unavailable',
  materials text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (used_capacity <= total_capacity)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.construction_companies(id) on delete cascade,
  name text not null,
  internal_code text,
  address text,
  region text,
  commune text,
  latitude numeric,
  longitude numeric,
  starts_on date,
  estimated_ends_on date,
  status text not null default 'active',
  project_type text,
  description text,
  created_at timestamptz not null default now()
);

create table public.disposal_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.construction_companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  site_id uuid not null references public.disposal_sites(id) on delete restrict,
  material text not null,
  estimated_quantity numeric not null check (estimated_quantity > 0),
  unit text not null default 'm³',
  estimated_date date,
  estimated_trips integer check (estimated_trips > 0),
  notes text,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, company_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Usuario'),
    new.raw_user_meta_data ->> 'company_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_profile();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute procedure public.touch_updated_at();
create trigger sites_updated before update on public.disposal_sites for each row execute procedure public.touch_updated_at();
create trigger requests_updated before update on public.disposal_requests for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.construction_companies enable row level security;
alter table public.disposal_sites enable row level security;
alter table public.projects enable row level security;
alter table public.disposal_requests enable row level security;

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and active);
$$;

create policy "profiles: own or administrator" on public.profiles for select using (id = auth.uid() or public.is_admin());
-- El permiso por columnas impide que una persona se autoasigne rol admin o active su cuenta.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, company_name) on public.profiles to authenticated;
create policy "profiles: own basic data" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "companies: own or administrator" on public.construction_companies for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "sites: visible to authenticated users" on public.disposal_sites for select using (auth.role() = 'authenticated');
create policy "sites: owner or administrator" on public.disposal_sites for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "projects: company owner or administrator" on public.projects for all using (exists(select 1 from public.construction_companies c where c.id = company_id and c.owner_id = auth.uid()) or public.is_admin()) with check (exists(select 1 from public.construction_companies c where c.id = company_id and c.owner_id = auth.uid()) or public.is_admin());
create policy "requests: related company/site or administrator" on public.disposal_requests for select using (public.is_admin() or exists(select 1 from public.construction_companies c where c.id = company_id and c.owner_id = auth.uid()) or exists(select 1 from public.disposal_sites s where s.id = site_id and s.owner_id = auth.uid()));
create policy "requests: constructor creates own" on public.disposal_requests for insert with check (exists(select 1 from public.construction_companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy "requests: related party updates" on public.disposal_requests for update using (public.is_admin() or exists(select 1 from public.construction_companies c where c.id = company_id and c.owner_id = auth.uid()) or exists(select 1 from public.disposal_sites s where s.id = site_id and s.owner_id = auth.uid()));

-- RPC restringido: la interfaz de administrador usa esta función para cambiar roles y accesos.
create or replace function public.admin_update_user(target_id uuid, new_role public.app_role, is_active boolean)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare result public.profiles;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  update public.profiles set role = new_role, active = is_active where id = target_id returning * into result;
  return result;
end;
$$;
grant execute on function public.admin_update_user(uuid, public.app_role, boolean) to authenticated;

-- DESPUÉS de registrarte en tu propia web, promociona la primera cuenta administradora.
-- Reemplaza el correo y ejecuta SOLO una vez:
-- update public.profiles set role = 'admin', active = true where email = 'tu-correo@ejemplo.cl';
