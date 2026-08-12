# Seguridad del control de asistencia — GYM INFINIT

## El problema

Un QR fijo e impreso puede ser fotografiado. Sin defensas, cualquiera marcaría
asistencia desde su casa sin ir al gimnasio.

## Defensa elegida: GPS

Al escanear, la app obtiene la ubicación del celular y el servidor verifica que
esté dentro del `radio_metros` configurado alrededor de las coordenadas del gym.
Si el socio está lejos → asistencia denegada.

- **Ventaja:** sin hardware extra, barato, cubre el 95% de los casos.
- **Límite:** un usuario con conocimientos técnicos podría falsear el GPS (GPS
  spoofing). Para un gimnasio local es un riesgo aceptable.

## Mejoras futuras (si el cliente lo pide)

1. **QR rotativo:** mostrar el QR en una tablet/pantalla en recepción; el token
   cambia cada 30 s. Elimina el problema de la foto.
2. **Ventana horaria:** solo aceptar asistencias dentro del horario del gym.
3. **Anti-repetición:** una sola asistencia válida por día por socio.

## Nota sobre datos personales (DNI, foto)

El DNI y la foto son datos sensibles. Medidas mínimas:
- Storage de fotos privado en Supabase (URLs firmadas, no públicas).
- RLS estricto: cada socio ve solo lo suyo.
- No exponer el DNI en logs ni en URLs.
