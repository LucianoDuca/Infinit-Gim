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
  const password = String(body.password || '');
  const usuario = body.usuario ? String(body.usuario).trim() : null;
  const edad = body.edad ? Number(body.edad) : null;
  const dias_habilitados: number[] = Array.isArray(body.dias_habilitados)
    ? body.dias_habilitados.map(Number)
    : [];
  const plan = body.plan ? String(body.plan).trim() : null;

  if (!dni || !nombre_completo || password.length < 6) {
    return NextResponse.json(
      { error: 'Faltan datos: DNI, nombre y contraseña (mín. 6 caracteres).' },
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
    usuario,
    edad,
    rol: 'socio',
  });
  if (perfilError) {
    // Rollback: si falla el perfil, borramos el usuario de auth para no dejar huérfanos
    await admin.auth.admin.deleteUser(userId);
    const msg = /duplicate key/i.test(perfilError.message)
      ? 'Ese DNI o usuario ya está en uso.'
      : perfilError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 5) Membresía inicial (si se enviaron días habilitados)
  if (dias_habilitados.length > 0) {
    await admin.from('memberships').insert({
      user_id: userId,
      plan,
      dias_habilitados,
      activa: true,
    });
  }

  return NextResponse.json({ ok: true, id: userId }, { status: 201 });
}
