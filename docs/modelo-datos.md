# Modelo de datos — GYM INFINIT

Base de datos PostgreSQL en Supabase. Diagrama lógico:

```
auth.users (manejado por Supabase Auth)
    │ 1─1
    ▼
profiles ─────────────┐
  id (uuid, = auth.users.id)
  dni (text, único)
  nombre_completo
  usuario (text, único)
  edad (int)
  foto_url
  rol ('socio' | 'admin')
  creado_en
                       │ 1─N
                       ▼
memberships
  id
  user_id  ── profiles.id
  plan (text)                     -- ej: "3 días semana", "Pase libre"
  dias_habilitados (int[])        -- 0=Dom ... 6=Sáb, ej: {1,3,5}
  vigente_desde (date)
  vigente_hasta (date)
  activa (bool)

attendance
  id
  user_id  ── profiles.id
  fecha_hora (timestamptz)
  resultado ('permitido' | 'denegado')
  motivo (text)                   -- por qué se denegó, si aplica
  lat, lng (para auditoría del GPS)

gyms
  id
  nombre
  direccion
  lat, lng
  radio_metros (int)              -- radio permitido para marcar asistencia
  qr_token (text)                 -- valor que codifica el QR impreso
```

## Regla del botón verde (marcar asistencia)

1. El socio abre la app y escanea el QR fijo del gym.
2. Se valida que el `qr_token` escaneado corresponda a un gym real.
3. Se valida por **GPS** que el celular esté dentro del `radio_metros` del gym.
4. Se busca la membresía **activa y vigente** del socio.
5. Se chequea que **hoy** (día de la semana) esté en `dias_habilitados`.
6. Si todo OK → `attendance` con `resultado = 'permitido'` y se muestra ✅.
   Si falla algo → `resultado = 'denegado'` con el `motivo` y se muestra ❌.

## Seguridad (RLS)

- Un **socio** solo puede leer su propio `profile`, sus `memberships` y sus `attendance`.
- Un **admin** puede leer y editar todo.
- La inserción de `attendance` se hace vía función del servidor para que el socio
  no pueda falsear el resultado.
