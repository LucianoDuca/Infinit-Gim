import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verificarAdmin } from '@/lib/supabaseServer';
import { dniToEmail, normalizeDni } from '@/lib/identity';

// POST /api/socios  → crea un socio (usuario de auth + perfil + membresía opcional)
export async function POST(req: NextRequest) {
  // 1) Autorización: el que llama debe ser un admin
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const adminId = await verificarAdmin(token);
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2) Datos del formulario
  const body = await req.json();
  const dni = normalizeDni(body.dni);
  const nombre_completo = String(body.nombre_completo || '').trim();
  const edad = body.edad ? Number(body.edad) : null;
  // La contraseña inicial del socio es su DNI (puede cambiarla después).
  const password = String(body.password || '') || dni;

  if (!dni || !nombre_completo) {
    return NextResponse.json({ error: 'Faltan datos: nombre completo y DNI.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'El DNI debe tener al menos 6 dígitos para usarse como contraseña inicial.' },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  // 3) Crear el usuario de auth (email fantasma desde el DNI, ya confirmado)
  const { data: creado, error: authError } = await admin.auth.admin.createUser({
    email: dniToEmail(dni),
    password,
    email_confirm: true,
    user_metadata: { nombre_completo, dni },
  });
  if (authError || !creado.user) {
    const msg = /already been registered/i.test(authError?.message || '')
      ? 'Ya existe un socio con ese DNI.'
      : authError?.message || 'No se pudo crear el usuario.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = creado.user.id;

  // 4) Crear el perfil
  const { error: perfilError } = await admin.from('profiles').insert({
    id: userId,
    dni,
    nombre_completo,
    edad,
    rol: 'socio',
  });
  if (perfilError) {
    // Rollback: si falla el perfil, borramos el usuario de auth para no dejar huérfanos
    await admin.auth.admin.deleteUser(userId);
    const msg = /duplicate key/i.test(perfilError.message)
      ? 'Ya existe un socio con ese DNI.'
      : perfilError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: userId }, { status: 201 });
}
