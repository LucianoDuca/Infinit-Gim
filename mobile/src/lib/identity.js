// Convención compartida entre la app y el panel admin.
// El socio inicia sesión con su DNI; por detrás usamos un email "fantasma"
// para Supabase Auth. El panel administrativo DEBE crear los usuarios con
// esta misma convención.

export const EMAIL_DOMAIN = 'gyminfinit.app';

// Deja solo los dígitos del DNI (acepta "30.111.222" o "30111222").
export function normalizeDni(dni) {
  return String(dni || '').replace(/\D/g, '');
}

// DNI -> email interno para Supabase Auth.
export function dniToEmail(dni) {
  return `${normalizeDni(dni)}@${EMAIL_DOMAIN}`;
}
