-- ============================================================
-- GYM INFINIT — Cambios 02
-- Registro de asistencia por QR (analítico).
-- Ejecutar una vez en el SQL Editor de Supabase.
-- (Requiere haber corrido antes schema.sql y cambios-01.sql)
-- ============================================================

-- Token que codifica el QR impreso en la entrada del gimnasio.
alter table public.config add column if not exists qr_asistencia text;
update public.config set qr_asistencia = coalesce(qr_asistencia, 'GYMINFINIT-ASISTENCIA') where id = 1;

-- Cualquier autenticado ya puede leer config (política de cambios-01).

-- ------------------------------------------------------------
-- Función: registrar_asistencia(token)
-- El socio la llama al escanear el QR. Valida el token y registra
-- UNA asistencia por día. No controla cuota ni GPS (es solo analítico).
-- ------------------------------------------------------------
create or replace function public.registrar_asistencia(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_token text;
  v_ya    integer;
  v_tz    text := 'America/Argentina/Buenos_Aires';
begin
  select qr_asistencia into v_token from public.config where id = 1;

  if v_token is null or p_token is distinct from v_token then
    return jsonb_build_object('ok', false, 'mensaje', 'QR inválido. Escaneá el QR del gimnasio.');
  end if;

  select count(*) into v_ya
  from public.attendance
  where user_id = auth.uid()
    and (fecha_hora at time zone v_tz)::date = (now() at time zone v_tz)::date;

  if v_ya > 0 then
    return jsonb_build_object('ok', true, 'mensaje', 'Ya registraste tu asistencia hoy. ¡Buen entrenamiento! 💪');
  end if;

  insert into public.attendance (user_id, resultado, fecha_hora)
  values (auth.uid(), 'permitido', now());

  return jsonb_build_object('ok', true, 'mensaje', '¡Asistencia registrada! 🟢');
end;
$$;

grant execute on function public.registrar_asistencia(text) to authenticated;
