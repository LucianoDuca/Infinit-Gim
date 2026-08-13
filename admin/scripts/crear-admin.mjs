// Crea el PRIMER usuario administrador de GYM INFINIT.
// Se usa una sola vez para arrancar (después los socios se crean desde el panel).
//
// Uso (parado en la carpeta admin/):
//   node --env-file=.env.local scripts/crear-admin.mjs <email> <contraseña>
//
// Requiere que .env.local tenga SUPABASE_SERVICE_ROLE_KEY completada.

import { createClient } from '@supabase/supabase-js';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Uso: node --env-file=.env.local scripts/crear-admin.mjs <email> <contraseña>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false } });

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error('Error creando el usuario:', error.message);
  process.exit(1);
}

const { error: perfilError } = await admin
  .from('profiles')
  .upsert({ id: data.user.id, rol: 'admin', nombre_completo: 'Administrador' });

if (perfilError) {
  console.error('Usuario creado pero falló el perfil:', perfilError.message);
  process.exit(1);
}

console.log('Administrador creado con éxito:', email);
console.log('   Ya podés entrar al panel con ese email y contraseña.');
