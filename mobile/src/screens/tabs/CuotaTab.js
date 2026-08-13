import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { getPrefNotif, setPrefNotif } from '../../lib/notificaciones';

function formatFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-');
  return `${d}/${m}/${y}`;
}

export default function CuotaTab({ diasCuota, vigenteHasta }) {
  const sinCuota = diasCuota === null || diasCuota === undefined;
  const vencida = !sinCuota && diasCuota < 0;

  const [notif, setNotif] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getPrefNotif().then(setNotif);
  }, []);

  async function toggleNotif(valor) {
    setGuardando(true);
    setNotif(valor);
    const res = await setPrefNotif(valor, vigenteHasta);
    if (!res.ok) {
      setNotif(false);
      if (res.motivo) Alert.alert('No se pudo activar', res.motivo);
    } else if (valor) {
      Alert.alert('Listo', 'Te vamos a avisar un día antes de que termine tu cuota. 🔔');
    }
    setGuardando(false);
  }

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

      {/* Switch de notificación */}
      <View style={styles.switchRow}>
        <View style={styles.switchTexto}>
          <Ionicons name="notifications-outline" size={20} color={colors.violet} />
          <Text style={styles.switchLabel}>Notificarme un día antes de que termine mi cuota</Text>
        </View>
        <Switch
          value={notif}
          onValueChange={toggleNotif}
          disabled={guardando}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 18 },
  card: {
    width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8,
  },
  titulo: { color: colors.text, fontSize: 18, fontWeight: '700' },
  dias: { color: colors.primary, fontSize: 30, fontWeight: '800', marginTop: 4 },
  texto: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

  switchRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  switchTexto: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '500' },
});
