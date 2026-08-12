// Misma convención que la app móvil: el socio usa su DNI, por detrás es un email.
export const EMAIL_DOMAIN = 'gyminfinit.app';

export function normalizeDni(dni: string): string {
  return String(dni || '').replace(/\D/g, '');
}

export function dniToEmail(dni: string): string {
  return `${normalizeDni(dni)}@${EMAIL_DOMAIN}`;
}
