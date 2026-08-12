// Cliente de Supabase para GYM INFINIT.
// Las claves se leen de variables de entorno (ver .env.example).
// NUNCA pongas la service_role key acá: solo la "anon key" pública.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[GYM INFINIT] Falta configurar EXPO_PUBLIC_SUPABASE_URL y ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY en el archivo .env (ver .env.example).'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
