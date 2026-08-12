'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Socio = {
  id: string;
  dni: string | null;
  nombre_completo: string | null;
  usuario: string | null;
  edad: number | null;
};

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser
        .from('profiles')
        .select('id, dni, nombre_completo, usuario, edad')
        .eq('rol', 'socio')
        .order('nombre_completo', { ascending: true });
      setSocios(data || []);
      setCargando(false);
    })();
  }, []);

  const filtrados = socios.filter((s) => {
    const q = busqueda.toLowerCase();
    return (
      (s.nombre_completo || '').toLowerCase().includes(q) ||
      (s.dni || '').includes(q) ||
      (s.usuario || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Socios</h1>
          <p className="text-muted text-sm">{socios.length} registrados</p>
        </div>
        <Link
          href="/socios/nuevo"
          className="bg-primary text-[#06210f] font-bold rounded-lg px-4 py-2.5 hover:bg-primary-dark transition"
        >
          + Nuevo socio
        </Link>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, DNI o usuario…"
        className="bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary max-w-md"
      />

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {cargando ? (
          <p className="text-muted p-6">Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-muted p-6">
            {socios.length === 0 ? 'Todavía no hay socios. Creá el primero con “+ Nuevo socio”.' : 'Sin resultados.'}
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-muted text-sm border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Edad</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link href={`/socios/${s.id}`} className="hover:text-primary font-medium">
                      {s.nombre_completo || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.dni || '—'}</td>
                  <td className="px-4 py-3 text-muted">{s.usuario ? '@' + s.usuario : '—'}</td>
                  <td className="px-4 py-3 text-muted">{s.edad ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
