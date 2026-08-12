'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const DIAS = [
  { n: 1, label: 'Lun' },
  { n: 2, label: 'Mar' },
  { n: 3, label: 'Mié' },
  { n: 4, label: 'Jue' },
  { n: 5, label: 'Vie' },
  { n: 6, label: 'Sáb' },
  { n: 0, label: 'Dom' },
];

export default function NuevoSocioPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre_completo: '',
    dni: '',
    edad: '',
    usuario: '',
    password: '',
    plan: '',
  });
  const [dias, setDias] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function toggleDia(n: number) {
    setDias((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));
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
        body: JSON.stringify({ ...form, dias_habilitados: dias }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo crear el socio.');

      router.push('/socios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div>
        <Link href="/socios" className="text-muted text-sm hover:text-primary">
          ← Volver a socios
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nuevo socio</h1>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6">
        <Field label="Nombre completo" value={form.nombre_completo} onChange={(v) => set('nombre_completo', v)} placeholder="Juan Pérez" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="DNI" value={form.dni} onChange={(v) => set('dni', v)} placeholder="30111222" />
          <Field label="Edad" value={form.edad} onChange={(v) => set('edad', v)} placeholder="25" type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Usuario (opcional)" value={form.usuario} onChange={(v) => set('usuario', v)} placeholder="juanp" />
          <Field label="Plan (opcional)" value={form.plan} onChange={(v) => set('plan', v)} placeholder="3 días/semana" />
        </div>
        <Field label="Contraseña inicial" value={form.password} onChange={(v) => set('password', v)} placeholder="mín. 6 caracteres" type="password" />

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">Días habilitados para ingresar</span>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <button
                type="button"
                key={d.n}
                onClick={() => toggleDia(d.n)}
                className={`px-3 py-2 rounded-lg border transition ${
                  dias.includes(d.n)
                    ? 'bg-primary text-[#06210f] border-primary font-semibold'
                    : 'border-border text-muted hover:border-primary'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="bg-primary text-[#06210f] font-bold rounded-lg py-2.5 hover:bg-primary-dark transition disabled:opacity-60 mt-2"
        >
          {cargando ? 'Creando…' : 'Crear socio'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
      />
    </label>
  );
}
