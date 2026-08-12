'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Email o contraseña incorrectos.');

      // Verificar que sea admin
      const { data: perfil } = await supabaseBrowser
        .from('profiles')
        .select('rol')
        .eq('id', data.user.id)
        .maybeSingle();

      if (perfil?.rol !== 'admin') {
        await supabaseBrowser.auth.signOut();
        throw new Error('Esta cuenta no tiene permisos de administrador.');
      }

      router.replace('/socios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5"
      >
        <div className="text-center">
          <div className="text-3xl font-extrabold tracking-widest">
            GYM<span className="text-primary">INFINIT</span>
          </div>
          <p className="text-muted text-sm mt-2">Panel administrativo</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            placeholder="dueno@email.com"
            autoComplete="email"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="bg-primary text-[#06210f] font-bold rounded-lg py-2.5 hover:bg-primary-dark transition disabled:opacity-60"
        >
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
