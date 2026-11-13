create type public.app_role as enum ('alumno','profesor','local','admin');
create type public.nivel_musical as enum ('inicial','intermedio','avanzado');
create type public.dia_semana as enum ('lunes','martes','miercoles','jueves','viernes','sabado','domingo');
create type public.franja_horaria as enum ('manana','tarde','noche');

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  foto_url text,
  zona text,
  ciudad text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.perfiles to anon;
grant select, insert, update on public.perfiles to authenticated;
grant all on public.perfiles to service_role;
alter table public.perfiles enable row level security;
create policy "Perfiles visibles" on public.perfiles for select to anon, authenticated using (true);
create policy "Insertar propio perfil" on public.perfiles for insert to authenticated with check (auth.uid() = id);
create policy "Editar propio perfil" on public.perfiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Ver propios roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.instrumentos (
  id serial primary key,
  nombre text not null unique
);
grant select on public.instrumentos to anon, authenticated;
grant all on public.instrumentos to service_role;
alter table public.instrumentos enable row level security;
create policy "Catalogo instrumentos" on public.instrumentos for select to anon, authenticated using (true);

create table public.estilos (
  id serial primary key,
  nombre text not null unique
);
grant select on public.estilos to anon, authenticated;
grant all on public.estilos to service_role;
alter table public.estilos enable row level security;
create policy "Catalogo estilos" on public.estilos for select to anon, authenticated using (true);

create table public.perfil_instrumentos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  instrumento_id int not null references public.instrumentos(id),
  nivel public.nivel_musical not null default 'inicial',
  anios_tocando int not null default 0,
  unique (perfil_id, instrumento_id)
);
grant select on public.perfil_instrumentos to anon;
grant select, insert, update, delete on public.perfil_instrumentos to authenticated;
grant all on public.perfil_instrumentos to service_role;
alter table public.perfil_instrumentos enable row level security;
create policy "Ver instrumentos perfil" on public.perfil_instrumentos for select to anon, authenticated using (true);
create policy "Gestionar mis instrumentos" on public.perfil_instrumentos for all to authenticated using (auth.uid() = perfil_id) with check (auth.uid() = perfil_id);

create table public.perfil_estilos (
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  estilo_id int not null references public.estilos(id),
  primary key (perfil_id, estilo_id)
);
grant select on public.perfil_estilos to anon;
grant select, insert, delete on public.perfil_estilos to authenticated;
grant all on public.perfil_estilos to service_role;
alter table public.perfil_estilos enable row level security;
create policy "Ver estilos perfil" on public.perfil_estilos for select to anon, authenticated using (true);
create policy "Gestionar mis estilos" on public.perfil_estilos for all to authenticated using (auth.uid() = perfil_id) with check (auth.uid() = perfil_id);

create table public.disponibilidad (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  dia public.dia_semana not null,
  franja public.franja_horaria not null,
  unique (perfil_id, dia, franja)
);
grant select on public.disponibilidad to anon;
grant select, insert, delete on public.disponibilidad to authenticated;
grant all on public.disponibilidad to service_role;
alter table public.disponibilidad enable row level security;
create policy "Ver disponibilidad" on public.disponibilidad for select to anon, authenticated using (true);
create policy "Gestionar mi disponibilidad" on public.disponibilidad for all to authenticated using (auth.uid() = perfil_id) with check (auth.uid() = perfil_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare r text;
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  r := coalesce(new.raw_user_meta_data->>'rol', 'alumno');
  if r not in ('alumno','profesor','local') then r := 'alumno'; end if;
  insert into public.user_roles (user_id, role) values (new.id, r::public.app_role);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.instrumentos (nombre) values
('Guitarra'),('Guitarra eléctrica'),('Bajo'),('Batería'),('Voz'),('Piano'),('Teclado'),('Violín'),('Saxofón'),('Trompeta'),('Ukelele'),('Percusión'),('DJ / Producción');
insert into public.estilos (nombre) values
('Rock'),('Pop'),('Indie'),('Punk'),('Metal'),('Blues'),('Jazz'),('Funk'),('Soul'),('Reggae'),('Hip hop'),('Electrónica'),('Flamenco'),('Folk'),('Latino'),('Clásica');