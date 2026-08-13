import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function CuotaTab() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="card-outline" size={40} color={colors.primary} />
        <Text style={styles.titulo}>Estado de la cuota</Text>
        <Text style={styles.texto}>
          Acá vas a ver el estado de tu cuota y su vencimiento.
        </Text>
        <Text style={styles.pronto}>Próximamente</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 10,
  },
  titulo: { color: colors.text, fontSize: 18, fontWeight: '700' },
  texto: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  pronto: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 4 },
});
