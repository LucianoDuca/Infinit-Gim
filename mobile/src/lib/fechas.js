// Días de cuota restantes hasta una fecha ISO (YYYY-MM-DD).
// Los DOMINGOS no cuentan (el gimnasio cierra, no se descuenta cuota).
// Devuelve: 0 = finaliza hoy · negativo = vencida (días de calendario pasados)
export function diasRestantes(finISO) {
  if (!finISO) return null;
  const [y, m, d] = String(finISO).split('-').map(Number);
  const fin = new Date(y, m - 1, d);
  fin.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffCal = Math.round((fin.getTime() - hoy.getTime()) / 86400000);
  if (diffCal <= 0) return diffCal; // hoy (0) o vencida (negativo)

  // Cuenta los días no-domingo entre mañana y la fecha de fin (inclusive).
  let count = 0;
  const cur = new Date(hoy);
  for (let i = 0; i < diffCal; i++) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0) count++; // 0 = domingo
  }
  return count;
}
