import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';

export default function ScannerModal({ visible, onClose, onRegistrado }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [procesando, setProcesando] = useState(false);
  const yaEscaneado = useRef(false);

  async function onBarcodeScanned({ data }) {
    if (yaEscaneado.current || procesando) return;
    yaEscaneado.current = true;
    setProcesando(true);
    try {
      const { data: res, error } = await supabase.rpc('registrar_asistencia', { p_token: data });
      if (error) throw error;
      const ok = res?.ok;
      const mensaje = (res?.mensaje ?? 'Sin respuesta.')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '')
        .trim();
      Alert.alert(ok ? 'Listo' : 'No se pudo', mensaje, [
        {
          text: 'OK',
          onPress: () => {
            onRegistrado?.();
            cerrar();
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo registrar la asistencia.', [{ text: 'OK', onPress: cerrar }]);
    } finally {
      setProcesando(false);
    }
  }

  function cerrar() {
    yaEscaneado.current = false;
    setProcesando(false);
    onClose?.();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={styles.container}>
        {!permission ? (
          <Centro><ActivityIndicator color={colors.primary} /></Centro>
        ) : !permission.granted ? (
          <Centro>
            <Ionicons name="camera-outline" size={56} color={colors.textMuted} />
            <Text style={styles.msg}>Necesitamos acceso a la cámara para escanear el QR.</Text>
            <Pressable style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Permitir cámara</Text>
            </Pressable>
          </Centro>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onBarcodeScanned}
            />
            {/* Marco de guía */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.frame} />
              <Text style={styles.hint}>Apuntá al QR del gimnasio</Text>
            </View>
            {procesando && (
              <View style={styles.procesando}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.procesandoText}>Registrando…</Text>
              </View>
            )}
          </>
        )}

        <Pressable style={styles.cerrar} onPress={cerrar} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

function Centro({ children }) {
  return <View style={styles.centro}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: colors.background },
  msg: { color: colors.text, fontSize: 15, textAlign: 'center' },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  btnText: { color: '#06210f', fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 20 },
  frame: {
    width: 240, height: 240, borderRadius: 24,
    borderWidth: 3, borderColor: colors.primary, backgroundColor: 'transparent',
  },
  hint: { color: '#fff', fontSize: 16, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 6 },
  procesando: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  procesandoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cerrar: {
    position: 'absolute', top: 50, right: 20,
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
});
