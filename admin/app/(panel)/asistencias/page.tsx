'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type Registro = {
  id: string;
  fecha_hora: string;
  resultado: string;
  profiles: { nombre_completo: string | null; dni: string | null } | null;
};

export default function AsistenciasPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [verQr, setVerQr] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: cfg } = await supabaseBrowser.from('config').select('qr_asistencia').eq('id', 1).maybeSingle();
      setQrValue(cfg?.qr_asistencia ?? null);

      const { data } = await supabaseBrowser
        .from('attendance')
        .select('id, fecha_hora, resultado, profiles(nombre_completo, dni)')
        .order('fecha_hora', { ascending: false })
        .limit(300);
      setRegistros((data as unknown as Registro[]) || []);
      setCargando(false);
    })();
  }, []);

  const hoyStr = new Date().toDateString();
  const hoyCount = registros.filter((r) => new Date(r.fecha_hora).toDateString() === hoyStr).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Asistencias</h1>
          <p className="text-muted text-sm">
            Hoy asistieron <span className="text-primary font-semibold">{hoyCount}</span> socios · {registros.length} registros recientes
          </p>
        </div>
        <button
          onClick={() => setVerQr((v) => !v)}
          className="bg-primary text-[#06210f] font-bold rounded-lg px-4 py-2.5 hover:bg-primary-dark transition"
        >
          {verQr ? 'Ocultar QR' : 'Ver QR para imprimir'}
        </button>
      </div>

      {verQr && qrValue && (
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={qrValue} size={180} level="M" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-1">QR de asistencia</h2>
            <p className="text-muted text-sm mb-3">
              Imprimí este QR y pegalo en la entrada del gimnasio. Los socios lo escanean desde la app
              para registrar su asistencia.
            </p>
            <button
              onClick={() => window.print()}
              className="border border-border rounded-lg px-4 py-2 text-sm hover:border-primary hover:text-primary transition"
            >
Imprimir
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        {cargando ? (
          <p className="text-muted p-6">Cargando…</p>
        ) : registros.length === 0 ? (
          <p className="text-muted p-6">Todavía no hay asistencias registradas.</p>
        ) : (
          <table className="w-full text-left min-w-[560px]">
            <thead className="text-muted text-sm border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha y hora</th>
                <th className="px-4 py-3 font-medium">Socio</th>
                <th className="px-4 py-3 font-medium">DNI</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-muted">{new Date(r.fecha_hora).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">{r.profiles?.nombre_completo || '—'}</td>
                  <td className="px-4 py-3 text-muted">{r.profiles?.dni || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
