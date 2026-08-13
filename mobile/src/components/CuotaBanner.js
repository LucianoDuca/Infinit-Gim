import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Muestra "Tu cuota finalizará en X días" según los días restantes.
export default function CuotaBanner({ dias }) {
  if (dias === null || dias === undefined) return null;

  const vencida = dias < 0;
  const hoy = dias === 0;

  let texto;
  if (vencida) texto = `Tu cuota venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  else if (hoy) texto = 'Tu cuota finaliza hoy';
  else texto = `Tu cuota finalizará en ${dias} ${dias === 1 ? 'día' : 'días'}`;

  return (
    <View style={[styles.banner, vencida && styles.bannerVencida]}>
      <Ionicons
        name={vencida ? 'alert-circle-outline' : 'time-outline'}
        size={18}
        color={vencida ? colors.error : colors.primary}
      />
      <Text style={[styles.texto, vencida && styles.textoVencida]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerVencida: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: colors.error,
  },
  texto: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  textoVencida: { color: colors.error },
});
