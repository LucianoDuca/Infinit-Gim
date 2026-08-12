// Cliente de Supabase para el navegador (panel admin).
// Usa la clave PÚBLICA. La sesión del admin se guarda en el navegador.
import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
