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

drop policy if exists "demo lectura" on fichas;
create policy "demo lectura" on fichas for select to anon using (true);
drop policy if exists "demo escritura" on fichas;
create policy "demo escritura" on fichas for insert to anon with check (true);

drop policy if exists "demo lectura" on postulaciones;
create policy "demo lectura" on postulaciones for select to anon using (true);
drop policy if exists "demo escritura" on postulaciones;
create policy "demo escritura" on postulaciones for insert to anon with check (true);
