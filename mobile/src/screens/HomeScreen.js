import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
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
  const inicial = nombre.trim().charAt(0).toUpperCase();
  const diasCuota = diasRestantes(cuotaFin);
  const estadoColor = gymAbierto == null ? '#9AA5B1' : gymAbierto ? colors.primary : colors.error;

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header: tarjeta blanca con foto + bienvenida + estado */}
      <View style={styles.headerWrap}>
        <View style={styles.headerCard}>
          <View style={styles.avatarMini}>
            {perfil?.foto_url ? (
              <Image source={{ uri: perfil.foto_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInicial}>{inicial}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.holaLabel}>Hola,</Text>
            <Text style={styles.holaNombre} numberOfLines={1}>{nombre}</Text>
          </View>
          <View style={styles.estadoBox}>
            <Text style={styles.estadoTitulo}>Estado del gim:</Text>
            <View style={styles.estadoPill}>
              <View style={[styles.dot, { backgroundColor: estadoColor }]} />
              <Text style={[styles.estadoValor, { color: estadoColor }]}>
                {gymAbierto == null ? '—' : gymAbierto ? 'Abierto' : 'Cerrado'}
              </Text>
            </View>
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
  headerWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 20, padding: 12, paddingRight: 14,
    shadowColor: colors.violet, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  avatarMini: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.violet,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarInicial: { color: '#fff', fontSize: 22, fontWeight: '800' },
  holaLabel: { color: '#6B7280', fontSize: 13 },
  holaNombre: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  estadoBox: { alignItems: 'flex-end', gap: 4 },
  estadoTitulo: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  estadoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  estadoValor: { fontSize: 13, fontWeight: '700' },
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
  navIconActivo: { backgroundColor: 'rgba(94,249,35,0.14)' },
  navLabel: { color: '#6B7280', fontSize: 11, fontWeight: '500' },
  navLabelActivo: { color: colors.primaryDark, fontWeight: '700' },
});
