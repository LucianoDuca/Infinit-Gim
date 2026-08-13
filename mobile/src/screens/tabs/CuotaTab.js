import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

function formatFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-');
  return `${d}/${m}/${y}`;
}

export default function CuotaTab({ diasCuota, vigenteHasta }) {
  const sinCuota = diasCuota === null || diasCuota === undefined;
  const vencida = !sinCuota && diasCuota < 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name={sinCuota ? 'card-outline' : vencida ? 'alert-circle-outline' : 'checkmark-circle-outline'}
          size={48}
          color={sinCuota ? colors.textMuted : vencida ? colors.error : colors.primary}
        />
        <Text style={styles.titulo}>Estado de la cuota</Text>

        {sinCuota ? (
          <Text style={styles.texto}>No tenés una cuota activa. Consultá en la recepción del gimnasio.</Text>
        ) : vencida ? (
          <>
            <Text style={[styles.dias, { color: colors.error }]}>Vencida</Text>
            <Text style={styles.texto}>Venció el {formatFecha(vigenteHasta)}</Text>
          </>
        ) : (
          <>
            <Text style={styles.dias}>{diasCuota === 0 ? 'Finaliza hoy' : `${diasCuota} días`}</Text>
            <Text style={styles.texto}>Válida hasta el {formatFecha(vigenteHasta)}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8,
  },
  titulo: { color: colors.text, fontSize: 18, fontWeight: '700' },
  dias: { color: colors.primary, fontSize: 30, fontWeight: '800', marginTop: 4 },
  texto: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
