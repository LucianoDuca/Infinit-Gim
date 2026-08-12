# Plan de desarrollo — GYM INFINIT

## Fases

| Fase | Qué hacemos | Estado |
|------|-------------|--------|
| **0** | Esqueleto del proyecto: estructura, app Expo, configuración de Supabase | ✅ Hecho |
| **1** | Base de datos: tablas + reglas de seguridad (RLS) en Supabase | 🚧 Próxima |
| **2** | App móvil: login con DNI + perfil del socio | ✅ Hecho |
| **3** | App móvil: botón verde + escáner QR + GPS + marcar asistencia | ⏳ Pendiente |
| **4** | Panel admin web (Next.js): alta de socios, días habilitados, asistencias | 🚧 Construido, falta activar/deploy |
| **5** | Pulido: fotos, historial, diseño con la marca real | ⏳ Pendiente |

## Decisiones tomadas

- **App móvil:** React Native + Expo.
- **Backend:** Supabase (auth + PostgreSQL + storage).
- **QR:** fijo e impreso en la entrada del gimnasio; el socio lo escanea.
- **Anti-trampa:** verificación por GPS (el celular debe estar cerca del gym).

## Pendientes / a definir con el cliente (dueño del gym)

- Nombre real, dirección y coordenadas del gimnasio (para el chequeo GPS).
- Logo y paleta de colores definitivos.
- Planes/membresías reales (¿días fijos por semana? ¿pase libre? ¿mensual?).
- ¿Se cobra desde la app o el pago es aparte?
