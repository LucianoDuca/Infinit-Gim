import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { diasRestantes } from '../lib/fechas';
import { useAuth } from '../context/AuthContext';
import AsistenciaTab from './tabs/AsistenciaTab';
import PerfilTab from './tabs/PerfilTab';
import CuotaTab from './tabs/CuotaTab';

const TABS = [
  { key: 'asistencia', label: 'Asistencia', icon: 'qr-code-outline' },
  { key: 'perfil', label: 'Mi perfil', icon: 'person-outline' },
  { key: 'cuota', label: 'Cuota', icon: 'card-outline' },
];

export default function HomeScreen() {
  const { session } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [gymAbierto, setGymAbierto] = useState(null);
  const [cuotaFin, setCuotaFin] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('asistencia');

  const cargarPerfil = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .select('nombre_completo, dni, edad, foto_url')
      .eq('id', session.user.id)
      .maybeSingle();
    setPerfil(data);
  }, [session]);

  const cargarGym = useCallback(async () => {
    const { data } = await supabase.from('config').select('gym_abierto').eq('id', 1).maybeSingle();
    setGymAbierto(data ? data.gym_abierto : null);
  }, []);

  const cargarCuota = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('memberships')
      .select('vigente_hasta')
      .eq('user_id', session.user.id)
      .eq('activa', true)
      .order('vigente_hasta', { ascending: false })
      .limit(1)
      .maybeSingle();
    setCuotaFin(data?.vigente_hasta ?? null);
  }, [session]);

  useEffect(() => {
    (async () => {
      await Promise.all([cargarPerfil(), cargarGym(), cargarCuota()]);
      setCargando(false);
    })();
  }, [cargarPerfil, cargarGym, cargarCuota]);

  const nombre = perfil?.nombre_completo || 'Socio';
  const diasCuota = diasRestantes(cuotaFin);

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header: bienvenida + estado del gimnasio */}
      <View style={styles.header}>
        <Text style={styles.hola}>¡Hola, {nombre}! 👋</Text>
        <View style={styles.estadoRow}>
          <Text style={styles.estadoLabel}>Estado del gim: </Text>
          <View style={styles.estadoPill}>
            <View
              style={[
                styles.dot,
                { backgroundColor: gymAbierto == null ? colors.textMuted : gymAbierto ? colors.primary : colors.error },
              ]}
            />
            <Text
              style={[
                styles.estadoValor,
                { color: gymAbierto == null ? colors.textMuted : gymAbierto ? colors.primary : colors.error },
              ]}
            >
              {gymAbierto == null ? '—' : gymAbierto ? 'Abierto' : 'Cerrado'}
            </Text>
          </View>
        </View>
      </View>

      {/* Contenido de la pestaña activa */}
      <View style={styles.content}>
        {tab === 'asistencia' && <AsistenciaTab gymAbierto={gymAbierto} diasCuota={diasCuota} />}
        {tab === 'perfil' && <PerfilTab perfil={perfil} onChange={cargarPerfil} diasCuota={diasCuota} />}
        {tab === 'cuota' && <CuotaTab diasCuota={diasCuota} vigenteHasta={cuotaFin} />}
      </View>

      {/* Navbar inferior blanco con íconos verdes */}
      <View style={styles.navbar}>
        {TABS.map((t) => {
          const activo = tab === t.key;
          return (
            <Pressable key={t.key} style={styles.navItem} onPress={() => setTab(t.key)}>
              <View style={[styles.navIcon, activo && styles.navIconActivo]}>
                <Ionicons name={t.icon} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.navLabel, activo && styles.navLabelActivo]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centro: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  hola: { color: colors.text, fontSize: 24, fontWeight: '800' },
  estadoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  estadoLabel: { color: colors.textMuted, fontSize: 15 },
  estadoPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  estadoValor: { fontSize: 15, fontWeight: '700' },
  content: { flex: 1 },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 20,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIcon: { padding: 4, borderRadius: 12 },
  navIconActivo: { backgroundColor: 'rgba(34,197,94,0.14)' },
  navLabel: { color: '#6B7280', fontSize: 11, fontWeight: '500' },
  navLabelActivo: { color: colors.primaryDark, fontWeight: '700' },
});
