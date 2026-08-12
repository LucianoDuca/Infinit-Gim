-- ============================================================
-- GYM INFINIT — Esquema de base de datos (Supabase / PostgreSQL)
-- Borrador Fase 1. Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- ---------- Tabla: gyms (sedes del gimnasio) ----------
create table if not exists public.gyms (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  direccion    text,
  lat          double precision,
  lng          double precision,
  radio_metros integer not null default 150,
  qr_token     text unique not null,
  creado_en    timestamptz not null default now()
);

-- ---------- Tabla: profiles (datos del socio) ----------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  dni             text unique,
  nombre_completo text,
  usuario         text unique,
  edad            integer,
  foto_url        text,
  rol             text not null default 'socio' check (rol in ('socio','admin')),
  creado_en       timestamptz not null default now()
);

-- ---------- Tabla: memberships (planes y días habilitados) ----------
create table if not exists public.memberships (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  plan             text,
  dias_habilitados integer[] not null default '{}',  -- 0=Dom ... 6=Sáb
  vigente_desde    date not null default current_date,
  vigente_hasta    date,
  activa           boolean not null default true,
  creado_en        timestamptz not null default now()
);

-- ---------- Tabla: attendance (registro de asistencias) ----------
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  gym_id     uuid references public.gyms(id),
  fecha_hora timestamptz not null default now(),
  resultado  text not null check (resultado in ('permitido','denegado')),
  motivo     text,
  lat        double precision,
  lng        double precision
);

create index if not exists idx_attendance_user on public.attendance(user_id);
create index if not exists idx_membership_user on public.memberships(user_id);

-- ============================================================
-- Seguridad a nivel de fila (RLS)
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.memberships enable row level security;
alter table public.attendance  enable row level security;
alter table public.gyms        enable row level security;

-- Helper: ¿el usuario actual es admin?
create or replace function public.es_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  );
$$;

-- profiles: el socio ve/edita lo suyo; el admin ve/edita todo.
create policy "profiles_select_propio_o_admin" on public.profiles
  for select using (id = auth.uid() or public.es_admin());
create policy "profiles_update_propio_o_admin" on public.profiles
  for update using (id = auth.uid() or public.es_admin());
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.es_admin() or id = auth.uid());

-- memberships: el socio ve lo suyo; solo el admin edita.
create policy "memberships_select_propio_o_admin" on public.memberships
  for select using (user_id = auth.uid() or public.es_admin());
create policy "memberships_admin_write" on public.memberships
  for all using (public.es_admin()) with check (public.es_admin());

-- attendance: el socio ve lo suyo; el admin ve todo.
create policy "attendance_select_propio_o_admin" on public.attendance
  for select using (user_id = auth.uid() or public.es_admin());

-- gyms: cualquiera autenticado puede leer; solo admin escribe.
create policy "gyms_select_auth" on public.gyms
  for select using (auth.role() = 'authenticated');
create policy "gyms_admin_write" on public.gyms
  for all using (public.es_admin()) with check (public.es_admin());

-- ============================================================
-- Función del servidor: marcar asistencia (valida todo el flujo)
-- El socio NO inserta directo en attendance: llama a esta función.
-- ============================================================
create or replace function public.marcar_asistencia(
  p_qr_token text,
  p_lat double precision,
  p_lng double precision
) returns public.attendance
language plpgsql security definer as $$
declare
  v_gym       public.gyms;
  v_dist_m    double precision;
  v_membership public.memberships;
  v_dow       integer := extract(dow from now());  -- 0=Dom ... 6=Sáb
  v_resultado text := 'denegado';
  v_motivo    text;
  v_row       public.attendance;
begin
  -- 1) Gym válido según el QR
  select * into v_gym from public.gyms where qr_token = p_qr_token;
  if v_gym.id is null then
    v_motivo := 'QR inválido';
  else
    -- 2) Distancia por GPS (fórmula de Haversine, en metros)
    v_dist_m := 6371000 * acos(
      least(1, greatest(-1,
        cos(radians(v_gym.lat)) * cos(radians(p_lat)) *
        cos(radians(p_lng) - radians(v_gym.lng)) +
        sin(radians(v_gym.lat)) * sin(radians(p_lat))
      ))
    );
    if v_dist_m > v_gym.radio_metros then
      v_motivo := 'Estás demasiado lejos del gimnasio';
    else
      -- 3) Membresía activa y vigente
      select * into v_membership from public.memberships
      where user_id = auth.uid()
        and activa
        and current_date >= vigente_desde
        and (vigente_hasta is null or current_date <= vigente_hasta)
      order by vigente_desde desc limit 1;

      if v_membership.id is null then
        v_motivo := 'No tenés una membresía activa';
      elsif not (v_dow = any (v_membership.dias_habilitados)) then
        v_motivo := 'Hoy no es un día habilitado en tu plan';
      else
        v_resultado := 'permitido';
      end if;
    end if;
  end if;

  insert into public.attendance (user_id, gym_id, resultado, motivo, lat, lng)
  values (auth.uid(), v_gym.id, v_resultado, v_motivo, p_lat, p_lng)
  returning * into v_row;

  return v_row;
end;
$$;
