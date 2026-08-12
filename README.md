# GYM INFINIT

Sistema de gestión y control de asistencia para gimnasio, compuesto por:

- **`mobile/`** — App móvil para los socios (React Native + Expo).
  Perfil personal + botón verde para escanear el QR y marcar asistencia.
- **`admin/`** — Panel administrativo web para el dueño (React).
  Base de datos de socios, días habilitados, historial de asistencias.
- **`supabase/`** — Esquema de base de datos, autenticación y storage (PostgreSQL).
- **`assets/`** — Material visual del gimnasio (logo, paleta de colores, fotos, iconos).
- **`docs/`** — Documentación del proyecto (modelo de datos, seguridad, decisiones).

## Stack

| Capa | Tecnología |
|------|------------|
| App móvil | React Native + Expo |
| Panel admin | React (web) |
| Backend / DB / Auth / Storage | Supabase (PostgreSQL) |
| Control de asistencia | QR fijo en el gym + verificación por GPS |

## Cómo correr la app móvil (una vez configurada)

```bash
cd mobile
npm install
npx expo start
```

Escaneá el QR con la app **Expo Go** en tu celular para probarla.

## Estado

🚧 En desarrollo — Fase 0: esqueleto del proyecto.

Ver el plan completo y el avance en [`docs/plan.md`](docs/plan.md).
