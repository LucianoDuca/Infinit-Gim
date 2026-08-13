'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { hoyISO, addMonthsISO, formatFecha, diasRestantes } from '@/lib/fechas';

type Socio = {
  id: string;
  dni: string | null;
  nombre_completo: string | null;
  edad: number | null;
};

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cuotas, setCuotas] = useState<Record<string, string>>({}); // user_id -> vigente_hasta
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [renovar, setRenovar] = useState<Socio | null>(null);

  async function cargar() {
    const { data: perfiles } = await supabaseBrowser
      .from('profiles')
      .select('id, dni, nombre_completo, edad')
      .eq('rol', 'socio')
      .order('nombre_completo', { ascending: true });
    setSocios(perfiles || []);

    const { data: mems } = await supabaseBrowser
      .from('memberships')
      .select('user_id, vigente_hasta')
      .eq('activa', true);
    const map: Record<string, string> = {};
    (mems || []).forEach((m) => {
      if (m.vigente_hasta && (!map[m.user_id] || m.vigente_hasta > map[m.user_id])) {
        map[m.user_id] = m.vigente_hasta;
      }
    });
    setCuotas(map);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = socios.filter((s) => {
    const q = busqueda.toLowerCase();
    return (s.nombre_completo || '').toLowerCase().includes(q) || (s.dni || '').includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Socios</h1>
          <p className="text-muted text-sm">{socios.length} registrados</p>
        </div>
        <button
          onClick={() => setNuevoAbierto(true)}
          className="bg-primary text-[#06210f] font-bold rounded-lg px-4 py-2.5 hover:bg-primary-dark transition"
        >
          + Nuevo socio
        </button>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o DNI…"
        className="bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary max-w-md"
      />

      <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        {cargando ? (
          <p className="text-muted p-6">Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-muted p-6">
            {socios.length === 0 ? 'Todavía no hay socios. Creá el primero con “+ Nuevo socio”.' : 'Sin resultados.'}
          </p>
        ) : (
          <table className="w-full text-left min-w-[640px]">
            <thead className="text-muted text-sm border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Edad</th>
                <th className="px-4 py-3 font-medium">Cuota</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => {
                const fin = cuotas[s.id] || null;
                const dias = diasRestantes(fin);
                return (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/socios/${s.id}`} className="hover:text-primary font-medium">
                        {s.nombre_completo || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{s.dni || '—'}</td>
                    <td className="px-4 py-3 text-muted">{s.edad ?? '—'}</td>
                    <td className="px-4 py-3">
                      <EstadoCuota fin={fin} dias={dias} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRenovar(s)}
                        className="bg-primary/15 text-primary font-semibold rounded-lg px-3 py-1.5 text-sm hover:bg-primary/25 transition whitespace-nowrap"
                      >
                        Renovar cuota
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {nuevoAbierto && (
        <NuevoSocioModal
          onClose={() => setNuevoAbierto(false)}
          onCreado={() => {
            setNuevoAbierto(false);
            cargar();
          }}
        />
      )}

      {renovar && (
        <RenovarCuotaModal
          socio={renovar}
          onClose={() => setRenovar(null)}
          onGuardado={() => {
            setRenovar(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}

function EstadoCuota({ fin, dias }: { fin: string | null; dias: number | null }) {
  if (!fin || dias === null) return <span className="text-muted text-sm">Sin cuota</span>;
  if (dias < 0) return <span className="text-error text-sm font-semibold">Vencida</span>;
  return (
    <span className="text-sm">
      <span className="text-primary font-semibold">{dias} días</span>{' '}
      <span className="text-muted">(hasta {formatFecha(fin)})</span>
    </span>
  );
}

/* ---------------- Modal: Renovar cuota ---------------- */
function RenovarCuotaModal({
  socio, onClose, onGuardado,
}: {
  socio: Socio; onClose: () => void; onGuardado: () => void;
}) {
  const [inicio, setInicio] = useState(hoyISO());
  const [fin, setFin] = useState(addMonthsISO(hoyISO(), 1));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function aplicarMeses(n: number) {
    const hoy = hoyISO();
    setInicio(hoy);
    setFin(addMonthsISO(hoy, n));
  }

  async function habilitarDias() {
    setError(null);
    if (fin < inicio) {
      setError('La fecha de finalización no puede ser anterior a la de inicio.');
      return;
    }
    setGuardando(true);
    try {
      // Desactivamos cuotas anteriores y creamos la nueva vigente.
      await supabaseBrowser.from('memberships').update({ activa: false }).eq('user_id', socio.id).eq('activa', true);
      const { error: insError } = await supabaseBrowser.from('memberships').insert({
        user_id: socio.id,
        vigente_desde: inicio,
        vigente_hasta: fin,
        activa: true,
      });
      if (insError) throw insError;
      onGuardado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la cuota.');
    } finally {
      setGuardando(false);
    }
  }

  const dias = diasRestantes(fin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Renovar cuota</h2>
            <p className="text-muted text-sm">{socio.nombre_completo}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground text-2xl leading-none">×</button>
        </div>

        {/* Botones rápidos */}
        <div>
          <p className="text-sm text-muted mb-2">Rápido (desde hoy)</p>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => aplicarMeses(n)}
                className="flex-1 border border-border rounded-lg py-2 text-sm hover:border-primary hover:text-primary transition"
              >
                {n} {n === 1 ? 'mes' : 'meses'}
              </button>
            ))}
          </div>
        </div>

        {/* Calendarios */}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Fecha de inicio</span>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary [color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Fecha de finalización</span>
            <input
              type="date"
              value={fin}
              min={inicio}
              onChange={(e) => setFin(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary [color-scheme:dark]"
            />
          </label>
        </div>

        {dias !== null && dias >= 0 && (
          <p className="text-sm text-muted">
            El socio quedará habilitado por <span className="text-primary font-semibold">{dias} días</span>.
          </p>
        )}

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          onClick={habilitarDias}
          disabled={guardando}
          className="bg-primary text-[#06210f] font-bold rounded-lg py-3 hover:bg-primary-dark transition disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Habilitar días'}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Modal: Nuevo socio ---------------- */
function NuevoSocioModal({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const [form, setForm] = useState({ nombre_completo: '', dni: '', edad: '' });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sesión expirada, volvé a entrar.');

      const res = await fetch('/api/socios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'No se pudo crear el socio.');

      onCreado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nuevo socio</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground text-2xl leading-none">×</button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Nombre completo</span>
          <input
            value={form.nombre_completo}
            onChange={(e) => set('nombre_completo', e.target.value)}
            placeholder="Juan Pérez"
            autoFocus
            className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">DNI</span>
            <input
              value={form.dni}
              onChange={(e) => set('dni', e.target.value)}
              placeholder="30111222"
              className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Edad</span>
            <input
              type="number"
              value={form.edad}
              onChange={(e) => set('edad', e.target.value)}
              placeholder="25"
              className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        </div>

        <p className="text-xs text-muted">
          La contraseña inicial del socio será su <strong>DNI</strong> (puede cambiarla después).
        </p>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex gap-3 justify-end mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-muted hover:bg-surface-2 transition">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="bg-primary text-[#06210f] font-bold rounded-lg px-4 py-2.5 hover:bg-primary-dark transition disabled:opacity-60"
          >
            {cargando ? 'Creando…' : 'Crear socio'}
          </button>
        </div>
      </form>
    </div>
  );
}
