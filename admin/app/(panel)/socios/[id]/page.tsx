'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const DIAS = [
  { n: 1, label: 'Lun' }, { n: 2, label: 'Mar' }, { n: 3, label: 'Mié' },
  { n: 4, label: 'Jue' }, { n: 5, label: 'Vie' }, { n: 6, label: 'Sáb' }, { n: 0, label: 'Dom' },
];

export default function EditarSocioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [usuario, setUsuario] = useState('');
  const [dni, setDni] = useState('');
  const [dias, setDias] = useState<number[]>([]);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: perfil } = await supabaseBrowser
        .from('profiles')
        .select('dni, nombre_completo, usuario, edad')
        .eq('id', id)
        .maybeSingle();
      if (perfil) {
        setDni(perfil.dni || '');
        setNombre(perfil.nombre_completo || '');
        setUsuario(perfil.usuario || '');
        setEdad(perfil.edad ? String(perfil.edad) : '');
      }
      const { data: mem } = await supabaseBrowser
        .from('memberships')
        .select('id, dias_habilitados')
        .eq('user_id', id)
        .eq('activa', true)
        .order('vigente_desde', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mem) {
        setMembershipId(mem.id);
        setDias(mem.dias_habilitados || []);
      }
      setCargando(false);
    })();
  }, [id]);

  function toggleDia(n: number) {
    setDias((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));
  }

  async function guardar() {
    setGuardando(true);
    setMsg(null);
    try {
      const { error: e1 } = await supabaseBrowser
        .from('profiles')
        .update({
          nombre_completo: nombre,
          usuario: usuario || null,
          edad: edad ? Number(edad) : null,
        })
        .eq('id', id);
      if (e1) throw e1;

      if (membershipId) {
        const { error: e2 } = await supabaseBrowser
          .from('memberships')
          .update({ dias_habilitados: dias })
          .eq('id', membershipId);
        if (e2) throw e2;
      } else {
        const { data, error: e3 } = await supabaseBrowser
          .from('memberships')
          .insert({ user_id: id, dias_habilitados: dias, activa: true })
          .select('id')
          .maybeSingle();
        if (e3) throw e3;
        if (data) setMembershipId(data.id);
      }
      setMsg('Cambios guardados ✅');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div>
        <Link href="/socios" className="text-muted text-sm hover:text-primary">← Volver a socios</Link>
        <h1 className="text-2xl font-bold mt-2">{nombre || 'Socio'}</h1>
        <p className="text-muted text-sm">DNI {dni || '—'}</p>
      </div>

      <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Nombre completo</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Edad</span>
            <input type="number" value={edad} onChange={(e) => setEdad(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Usuario</span>
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary" />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">Días habilitados para ingresar</span>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <button type="button" key={d.n} onClick={() => toggleDia(d.n)}
                className={`px-3 py-2 rounded-lg border transition ${
                  dias.includes(d.n)
                    ? 'bg-primary text-[#06210f] border-primary font-semibold'
                    : 'border-border text-muted hover:border-primary'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {msg && <p className={msg.includes('✅') ? 'text-primary text-sm' : 'text-error text-sm'}>{msg}</p>}

        <button onClick={guardar} disabled={guardando}
          className="bg-primary text-[#06210f] font-bold rounded-lg py-2.5 hover:bg-primary-dark transition disabled:opacity-60 mt-2">
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
