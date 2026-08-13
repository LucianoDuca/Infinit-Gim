-- ============================================================
-- GYM INFINIT — Cambios 01
-- Estado del gimnasio (abierto/cerrado) + storage de fotos de perfil.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- ============================================================

-- ---------- Config global (una sola fila) ----------
create table if not exists public.config (
  id          integer primary key default 1,
  gym_abierto boolean not null default false,
  constraint config_single_row check (id = 1)
);

insert into public.config (id, gym_abierto)
values (1, false)
on conflict (id) do nothing;

alter table public.config enable row level security;

-- Cualquier usuario autenticado puede leer el estado; solo el admin lo cambia.
drop policy if exists "config_select_auth" on public.config;
create policy "config_select_auth" on public.config
  for select using (auth.role() = 'authenticated');

drop policy if exists "config_admin_update" on public.config;
create policy "config_admin_update" on public.config
  for update using (public.es_admin()) with check (public.es_admin());

-- ---------- Storage: bucket público para fotos de perfil ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Lectura pública de las fotos.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Cada socio sube/reemplaza/borra SOLO su propia foto.
-- La foto se guarda como "<user_id>/avatar.jpg", así el primer segmento
-- del path debe coincidir con el uid del usuario.
drop policy if exists "avatars_insert_propio" on storage.objects;
create policy "avatars_insert_propio" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_propio" on storage.objects;
create policy "avatars_update_propio" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_propio" on storage.objects;
create policy "avatars_delete_propio" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
