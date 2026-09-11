-- Tablas para el panel admin (novedades, fichas, postulaciones).
-- Cómo usar: Supabase Dashboard -> SQL Editor -> pega todo -> Run.
-- Las políticas abiertas son SOLO para la demo. En producción se restringen.

create table if not exists novedades (
  id bigint generated always as identity primary key,
  titulo text not null,
  descripcion text not null,
  fecha text default '',
  etiqueta text default 'Noticia',
  created_at timestamptz default now()
);

create table if not exists fichas (
  id bigint generated always as identity primary key,
  numero text not null,
  programa text not null,
  jornada text not null,
  created_at timestamptz default now()
);

create table if not exists postulaciones (
  id bigint generated always as identity primary key,
  titulo text not null,
  descripcion text not null,
  cupos int not null default 1,
  fecha_cierre text default '',
  created_at timestamptz default now()
);

alter table novedades enable row level security;
alter table fichas enable row level security;
alter table postulaciones enable row level security;

drop policy if exists "demo lectura" on novedades;
create policy "demo lectura" on novedades for select to anon using (true);
drop policy if exists "demo escritura" on novedades;
create policy "demo escritura" on novedades for insert to anon with check (true);
drop policy if exists "demo borrado" on novedades;
create policy "demo borrado" on novedades for delete to anon using (true);

drop policy if exists "demo lectura" on fichas;
create policy "demo lectura" on fichas for select to anon using (true);
drop policy if exists "demo escritura" on fichas;
create policy "demo escritura" on fichas for insert to anon with check (true);
drop policy if exists "demo borrado" on fichas;
create policy "demo borrado" on fichas for delete to anon using (true);

drop policy if exists "demo lectura" on postulaciones;
create policy "demo lectura" on postulaciones for select to anon using (true);
drop policy if exists "demo escritura" on postulaciones;
create policy "demo escritura" on postulaciones for insert to anon with check (true);
drop policy if exists "demo borrado" on postulaciones;
create policy "demo borrado" on postulaciones for delete to anon using (true);

-- Bitácora por ficha (evidencias con fotos y visibilidad).
create table if not exists evidencias (
  id bigint generated always as identity primary key,
  ficha_numero text not null,
  titulo text not null,
  descripcion text not null default '',
  fecha text default '',
  tipo text default 'clase',
  imagenes text[] not null default '{}',
  visible boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists idx_evidencias_ficha on evidencias (ficha_numero);
create index if not exists idx_evidencias_visible on evidencias (visible);

alter table evidencias enable row level security;

drop policy if exists "demo lectura" on evidencias;
create policy "demo lectura" on evidencias for select to anon using (true);
drop policy if exists "demo escritura" on evidencias;
create policy "demo escritura" on evidencias for insert to anon with check (true);
drop policy if exists "demo borrado" on evidencias;
create policy "demo borrado" on evidencias for delete to anon using (true);

-- Bucket de imágenes (escalable: CDN + control de acceso).
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;

drop policy if exists "lectura publica evidencias" on storage.objects;
create policy "lectura publica evidencias" on storage.objects
for select to anon using (bucket_id = 'evidencias');

-- Programas (gestión completa desde el panel; compatible con el index).
create table if not exists programas (
  id bigint generated always as identity primary key,
  nombre text not null,
  codigo text not null default '',
  duracion text default '',
  nivel text default 'Técnico',
  area text default '',
  descripcion text not null default '',
  competencias text[] not null default '{}',
  modalidad text default 'Presencial',
  titulacion text default '',
  jornada text default 'diurna',
  url_sofia text default 'https://oferta.senasofiaplus.edu.co/',
  created_at timestamptz default now()
);
create unique index if not exists idx_programas_codigo on programas (codigo);

alter table programas enable row level security;

drop policy if exists "demo lectura" on programas;
create policy "demo lectura" on programas for select to anon using (true);
drop policy if exists "demo escritura" on programas;
create policy "demo escritura" on programas for insert to anon with check (true);
drop policy if exists "demo borrado" on programas;
create policy "demo borrado" on programas for delete to anon using (true);
