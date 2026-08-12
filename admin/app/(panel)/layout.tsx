'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const NAV = [
  { href: '/socios', label: 'Socios', icon: '👥' },
  { href: '/asistencias', label: 'Asistencias', icon: '📋' },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<'cargando' | 'ok'>('cargando');

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
      if (activo) setEstado('ok');
    })();
    return () => {
      activo = false;
    };
  }, [router]);

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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  activo ? 'bg-primary text-[#06210f] font-semibold' : 'text-muted hover:bg-surface-2'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
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
