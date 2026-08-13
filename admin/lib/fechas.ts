// Utilidades de fechas (trabajamos con fechas locales en formato YYYY-MM-DD).

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function hoyISO(): string {
  return toISO(new Date());
}

// Suma n meses a una fecha ISO (YYYY-MM-DD), en fecha local.
export function addMonthsISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toISO(new Date(y, m - 1 + n, d));
}

// Formatea YYYY-MM-DD -> DD/MM/YYYY
export function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Días de cuota restantes. Los DOMINGOS no cuentan (el gimnasio cierra).
// 0 = finaliza hoy · negativo = vencida (días de calendario pasados)
export function diasRestantes(finISO: string | null): number | null {
  if (!finISO) return null;
  const [y, m, d] = finISO.split('-').map(Number);
  const fin = new Date(y, m - 1, d);
  fin.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffCal = Math.round((fin.getTime() - hoy.getTime()) / 86400000);
  if (diffCal <= 0) return diffCal;

  let count = 0;
  const cur = new Date(hoy);
  for (let i = 0; i < diffCal; i++) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0) count++; // 0 = domingo
  }
  return count;
}
