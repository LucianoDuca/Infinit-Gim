'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const NAV = [
  { href: '/socios', label: 'Socios' },
  { href: '/asistencias', label: 'Asistencias' },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<'cargando' | 'ok'>('cargando');
  const [gymAbierto, setGymAbierto] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace('/login');
        return;
      }
      const { data: perfil } = await supabaseBrowser
        .from('profiles')
        .select('rol')
        .eq('id', session.user.id)
        .maybeSingle();
      if (perfil?.rol !== 'admin') {
        await supabaseBrowser.auth.signOut();
        router.replace('/login');
        return;
      }
      if (!activo) return;
      setEstado('ok');

      const { data: config } = await supabaseBrowser
        .from('config')
        .select('gym_abierto')
        .eq('id', 1)
        .maybeSingle();
      if (activo) setGymAbierto(config?.gym_abierto ?? false);
    })();
    return () => {
      activo = false;
    };
  }, [router]);

  async function toggleGym() {
    const nuevo = !gymAbierto;
    setGymAbierto(nuevo);
    const { error } = await supabaseBrowser.from('config').update({ gym_abierto: nuevo }).eq('id', 1);
    if (error) setGymAbierto(!nuevo); // revertir si falla
  }

  async function cerrarSesion() {
    await supabaseBrowser.auth.signOut();
    router.replace('/login');
  }

  if (estado === 'cargando') {
    return <div className="flex-1 flex items-center justify-center text-muted">Cargando…</div>;
  }

  return (
    <div className="flex-1 flex">
      <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="p-6 text-2xl font-extrabold tracking-widest">
          GYM<span className="text-primary">INFINIT</span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((item) => {
            const activo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  activo ? 'bg-primary text-[#06210f] font-semibold' : 'text-muted hover:bg-surface-2'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Estado del gimnasio */}
        <div className="mx-3 mt-6 p-3 rounded-lg bg-surface-2 border border-border">
          <p className="text-xs text-muted mb-2">Estado del gimnasio</p>
          <button
            onClick={toggleGym}
            disabled={gymAbierto === null}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold transition ${
              gymAbierto ? 'bg-primary text-[#06210f]' : 'bg-background text-muted border border-border'
            }`}
          >
            <span>{gymAbierto === null ? '…' : gymAbierto ? 'Abierto' : 'Cerrado'}</span>
            <span
              className={`inline-block w-9 h-5 rounded-full relative transition ${
                gymAbierto ? 'bg-[#06210f]/30' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  gymAbierto ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </div>

        <button
          onClick={cerrarSesion}
          className="mt-auto m-3 px-3 py-2 rounded-lg text-error hover:bg-surface-2 text-left text-sm"
        >
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
