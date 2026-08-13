import { useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, Image, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { colors } from '../../theme/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CuotaBanner from '../../components/CuotaBanner';

export default function PerfilTab({ perfil, onChange, diasCuota }) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [subiendo, setSubiendo] = useState(false);
  const [total, setTotal] = useState(null);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { count } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('resultado', 'permitido');
      setTotal(count ?? 0);
      const { data } = await supabase
        .from('attendance')
        .select('fecha_hora')
        .eq('user_id', userId)
        .eq('resultado', 'permitido')
        .order('fecha_hora', { ascending: false })
        .limit(15);
      setHistorial(data || []);
    })();
  }, [userId]);

  const nombre = perfil?.nombre_completo || 'Socio';
  const inicial = nombre.trim().charAt(0).toUpperCase();

  async function cambiarFoto() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para cambiar la imagen de perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    setSubiendo(true);
    try {
      const base64 = result.assets[0].base64;
      const path = `${userId}/avatar.jpg`;
      const { error: upError } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });
      if (upError) throw upError;

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${pub.publicUrl}?t=${Date.now()}`; // cache-buster
      const { error: dbError } = await supabase.from('profiles').update({ foto_url: url }).eq('id', userId);
      if (dbError) throw dbError;

      await onChange?.();
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar la foto.');
    } finally {
      setSubiendo(false);
    }
  }

  function borrarFoto() {
    Alert.alert('Borrar foto', '¿Seguro que querés borrar tu foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setSubiendo(true);
          try {
            await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
            await supabase.from('profiles').update({ foto_url: null }).eq('id', userId);
            await onChange?.();
          } catch (e) {
            Alert.alert('Error', e.message ?? 'No se pudo borrar la foto.');
          } finally {
            setSubiendo(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {perfil?.foto_url ? (
          <Image source={{ uri: perfil.foto_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
        )}
        {subiendo && (
          <View style={styles.avatarLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </View>

      <Text style={styles.nombre}>{nombre}</Text>

      {/* Botones de foto */}
      <View style={styles.fotoBtns}>
        <Pressable style={styles.fotoBtn} onPress={cambiarFoto} disabled={subiendo}>
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
          <Text style={styles.fotoBtnText}>Cambiar foto</Text>
        </Pressable>
        {perfil?.foto_url ? (
          <Pressable style={styles.fotoBtn} onPress={borrarFoto} disabled={subiendo}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.fotoBtnText, { color: colors.error }]}>Borrar foto</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Cuota */}
      <View style={{ width: '100%' }}>
        <CuotaBanner dias={diasCuota} />
      </View>

      {/* Datos */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Mis datos</Text>
        <Dato label="DNI" valor={perfil?.dni} />
        <Dato label="Edad" valor={perfil?.edad ? String(perfil.edad) : null} />
      </View>

      {/* Historial de asistencias */}
      <View style={styles.card}>
        <View style={styles.histHeader}>
          <Text style={styles.cardTitulo}>Historial de asistencias</Text>
          {total !== null && (
            <Text style={styles.histTotal}>
              {total} {total === 1 ? 'vez' : 'veces'}
            </Text>
          )}
        </View>
        {historial.length === 0 ? (
          <Text style={styles.histVacio}>Todavía no marcaste ninguna asistencia.</Text>
        ) : (
          historial.map((a, i) => (
            <View key={i} style={styles.histFila}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.histTexto}>{formatFechaHora(a.fecha_hora)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Cerrar sesión */}
      <Pressable style={styles.logout} onPress={() => supabase.auth.signOut()}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function formatFechaHora(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}  ·  ${hh}:${mi} hs`;
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
  container: { padding: 24, alignItems: 'center', gap: 16 },
  avatarWrap: { marginTop: 8 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#06210f', fontSize: 48, fontWeight: '800' },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: { color: colors.text, fontSize: 22, fontWeight: '800' },
  fotoBtns: { flexDirection: 'row', gap: 12 },
  fotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  fotoBtnText: { color: colors.primary, fontWeight: '600' },
  card: {
    width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 18, gap: 10,
    borderWidth: 1, borderColor: colors.border, marginTop: 8,
  },
  cardTitulo: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histTotal: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  histVacio: { color: colors.textMuted, fontSize: 14 },
  histFila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  histTexto: { color: colors.text, fontSize: 14 },
  datoFila: { flexDirection: 'row', justifyContent: 'space-between' },
  datoLabel: { color: colors.textMuted, fontSize: 15 },
  datoValor: { color: colors.text, fontSize: 15, fontWeight: '600' },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, marginTop: 8 },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});
