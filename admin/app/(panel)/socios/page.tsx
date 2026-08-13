'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Socio = {
  id: string;
  dni: string | null;
  nombre_completo: string | null;
  edad: number | null;
};

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargar() {
    const { data } = await supabaseBrowser
      .from('profiles')
      .select('id, dni, nombre_completo, edad')
      .eq('rol', 'socio')
      .order('nombre_completo', { ascending: true });
    setSocios(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = socios.filter((s) => {
    const q = busqueda.toLowerCase();
    return (
      (s.nombre_completo || '').toLowerCase().includes(q) ||
      (s.dni || '').includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Socios</h1>
          <p className="text-muted text-sm">{socios.length} registrados</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
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
                  <td className="px-4 py-3 text-muted">{s.edad ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <NuevoSocioModal
          onClose={() => setModalAbierto(false)}
          onCreado={() => {
            setModalAbierto(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nuevo socio</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground text-xl leading-none">
            ✕
          </button>
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-border text-muted hover:bg-surface-2 transition"
          >
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
