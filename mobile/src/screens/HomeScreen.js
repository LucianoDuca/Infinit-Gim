import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert, ScrollView, RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { session } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('nombre_completo, usuario, dni, edad, foto_url')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setPerfil(data);
    }
    setCargando(false);
  }, [session]);

  useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

  const nombre = perfil?.nombre_completo || 'Socio';
  const inicial = nombre.trim().charAt(0).toUpperCase();

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  function marcarAsistencia() {
    // Fase 3: acá abrirá el escáner de QR + GPS.
    Alert.alert('Próximamente', 'Acá se abrirá la cámara para escanear el QR del gimnasio.');
  }

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={false} onRefresh={cargarPerfil} tintColor={colors.primary} />}
      >
        {/* Encabezado con perfil */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hola}>¡Hola,</Text>
            <Text style={styles.nombre}>{nombre}!</Text>
            {perfil?.usuario ? <Text style={styles.usuario}>@{perfil.usuario}</Text> : null}
          </View>
        </View>

        {/* Botón verde de asistencia */}
        <View style={styles.centroBoton}>
          <Pressable
            style={({ pressed }) => [styles.qrButton, pressed && styles.qrButtonPressed]}
            onPress={marcarAsistencia}
          >
            <Text style={styles.qrIcon}>⟦▢⟧</Text>
            <Text style={styles.qrButtonText}>Marcar asistencia</Text>
          </Pressable>
          <Text style={styles.hint}>Escaneá el QR del gimnasio para registrar tu entrada</Text>
        </View>

        {/* Datos del socio */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Mis datos</Text>
          <Dato label="DNI" valor={perfil?.dni} />
          <Dato label="Edad" valor={perfil?.edad ? String(perfil.edad) : null} />
          <Dato label="Usuario" valor={perfil?.usuario ? '@' + perfil.usuario : null} />
        </View>

        <Pressable onPress={cerrarSesion} hitSlop={10} style={styles.logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Dato({ label, valor }) {
  return (
    <View style={styles.datoFila}>
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValor}>{valor || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centro: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, gap: 28 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#06210F', fontSize: 28, fontWeight: '800' },
  hola: { color: colors.textMuted, fontSize: 18 },
  nombre: { color: colors.text, fontSize: 24, fontWeight: '800' },
  usuario: { color: colors.primary, fontSize: 14, marginTop: 2 },
  centroBoton: { alignItems: 'center', gap: 14 },
  qrButton: {
    backgroundColor: colors.primary, width: 210, height: 210, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  qrButtonPressed: { backgroundColor: colors.primaryDark, transform: [{ scale: 0.97 }] },
  qrIcon: { fontSize: 52, color: '#06210F' },
  qrButtonText: { color: '#06210F', fontSize: 18, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 260 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 18, gap: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTitulo: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  datoFila: { flexDirection: 'row', justifyContent: 'space-between' },
  datoLabel: { color: colors.textMuted, fontSize: 15 },
  datoValor: { color: colors.text, fontSize: 15, fontWeight: '600' },
  logout: { alignItems: 'center', paddingVertical: 8 },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});
