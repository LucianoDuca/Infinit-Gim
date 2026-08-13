import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import CuotaBanner from '../../components/CuotaBanner';
import ScannerModal from '../../components/ScannerModal';

export default function AsistenciaTab({ gymAbierto, diasCuota }) {
  const [scanner, setScanner] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.bannerWrap}>
        <CuotaBanner dias={diasCuota} />
      </View>
      <Pressable
        style={({ pressed }) => [styles.qrButton, pressed && styles.qrButtonPressed]}
        onPress={() => setScanner(true)}
      >
        <Ionicons name="qr-code-outline" size={64} color="#06210f" />
        <Text style={styles.qrText}>Marcar asistencia</Text>
      </Pressable>
      <Text style={styles.hint}>Escaneá el QR del gimnasio para registrar tu entrada</Text>

      <ScannerModal visible={scanner} onClose={() => setScanner(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 },
  bannerWrap: { position: 'absolute', top: 16, left: 24, right: 24 },
  qrButton: {
    backgroundColor: colors.primary,
    width: 220,
    height: 220,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  qrButtonPressed: { backgroundColor: colors.primaryDark, transform: [{ scale: 0.97 }] },
  qrText: { color: '#06210f', fontSize: 18, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 260 },
});
