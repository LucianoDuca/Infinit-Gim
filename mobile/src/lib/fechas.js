// Días restantes hasta una fecha ISO (YYYY-MM-DD). Negativo si ya venció.
export function diasRestantes(finISO) {
  if (!finISO) return null;
  const [y, m, d] = String(finISO).split('-').map(Number);
  const fin = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((fin.getTime() - hoy.getTime()) / 86400000);
}
