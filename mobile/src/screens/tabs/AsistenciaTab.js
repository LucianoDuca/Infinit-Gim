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
      {/* Cuota */}
      <View style={styles.bannerWrap}>
        <CuotaBanner dias={diasCuota} />
      </View>

      {/* Logo en el centro (con glow violeta) */}
      <View style={styles.center}>
        <View style={styles.logoGlow}>
          {/* 📸 Cuando subas el logo a assets, reemplazá este bloque por:
              <Image source={require('../../../assets/logos/logo.png')} style={styles.logoImg} /> */}
          <Text style={styles.logoGym}>GYM</Text>
          <Text style={styles.logoInfinit}>INFINIT</Text>
        </View>
      </View>

      {/* Botón flotante verde (estilo WhatsApp) */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setScanner(true)}
      >
        <Ionicons name="qr-code" size={30} color="#06210f" />
      </Pressable>

      <ScannerModal visible={scanner} onClose={() => setScanner(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  bannerWrap: { marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  logoGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 40,
    borderRadius: 28,
    // glow violeta
    shadowColor: colors.violet,
    shadowOpacity: 0.9,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  logoImg: { width: 200, height: 200, resizeMode: 'contain' },
  logoGym: { color: colors.text, fontSize: 46, fontWeight: '900', letterSpacing: 6 },
  logoInfinit: {
    color: colors.violet, fontSize: 46, fontWeight: '900', letterSpacing: 6, marginTop: -10,
    textShadowColor: colors.violetGlow, textShadowRadius: 18,
  },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  fabPressed: { backgroundColor: colors.primaryDark, transform: [{ scale: 0.94 }] },
});
