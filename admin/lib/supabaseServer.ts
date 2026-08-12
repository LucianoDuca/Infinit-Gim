// Cliente de Supabase para el SERVIDOR (solo dentro de rutas /api).
// Usa la clave SECRETA (service_role) → control total, salta RLS.
// NUNCA importar esto en un componente de cliente.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function supabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Verifica que el token que manda el navegador sea de un admin real.
// Devuelve el user id del admin, o null si no está autorizado.
export async function verificarAdmin(accessToken: string | null): Promise<string | null> {
  if (!accessToken) return null;
  const admin = supabaseAdmin();

  const { data: userData, error } = await admin.auth.getUser(accessToken);
  if (error || !userData.user) return null;

  const { data: perfil } = await admin
    .from('profiles')
    .select('rol')
    .eq('id', userData.user.id)
    .maybeSingle();

  return perfil?.rol === 'admin' ? userData.user.id : null;
}
