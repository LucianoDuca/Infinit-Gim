'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Registro = {
  id: string;
  fecha_hora: string;
  resultado: string;
  motivo: string | null;
  profiles: { nombre_completo: string | null; dni: string | null } | null;
};

export default function AsistenciasPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser
        .from('attendance')
        .select('id, fecha_hora, resultado, motivo, profiles(nombre_completo, dni)')
        .order('fecha_hora', { ascending: false })
        .limit(200);
      setRegistros((data as unknown as Registro[]) || []);
      setCargando(false);
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Asistencias</h1>
        <p className="text-muted text-sm">Últimos registros de ingreso</p>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {cargando ? (
          <p className="text-muted p-6">Cargando…</p>
        ) : registros.length === 0 ? (
          <p className="text-muted p-6">Todavía no hay asistencias registradas.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-muted text-sm border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha y hora</th>
                <th className="px-4 py-3 font-medium">Socio</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-muted">
                    {new Date(r.fecha_hora).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    {r.profiles?.nombre_completo || '—'}
                    <span className="text-muted"> · {r.profiles?.dni || ''}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        r.resultado === 'permitido'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-error/20 text-error'
                      }`}
                    >
                      {r.resultado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">{r.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
