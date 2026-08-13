import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { colors } from '../../theme/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CuotaBanner from '../../components/CuotaBanner';
import ScannerModal from '../../components/ScannerModal';

function localISO(dt) {
  const d = new Date(dt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AsistenciaTab({ gymAbierto, diasCuota }) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [scanner, setScanner] = useState(false);
  const [dias, setDias] = useState([]); // fechas asistidas 'YYYY-MM-DD'

  async function cargarAsistencias() {
    if (!userId) return;
    const { data } = await supabase
      .from('attendance')
      .select('fecha_hora')
      .eq('user_id', userId)
      .eq('resultado', 'permitido')
      .order('fecha_hora', { ascending: false })
      .limit(200);
    setDias([...new Set((data || []).map((a) => localISO(a.fecha_hora)))]);
  }

  useEffect(() => {
    cargarAsistencias();
  }, [userId]);

  const hoy = localISO(new Date());
  const marked = {};
  dias.forEach((d) => {
    marked[d] = {
      customStyles: {
        container: { backgroundColor: colors.primary, borderRadius: 8 },
        text: { color: '#06210f', fontWeight: '800' },
      },
    };
  });
  marked[hoy] = {
    customStyles: {
      container: { backgroundColor: colors.violet, borderRadius: 8 },
      text: { color: '#fff', fontWeight: '800' },
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <CuotaBanner dias={diasCuota} />

        {/* Logo con glow violeta */}
        <View style={styles.logoGlow}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImg} />
        </View>

        {/* Leyenda */}
        <View style={styles.leyenda}>
          <View style={styles.leyItem}>
            <View style={[styles.leyDot, { backgroundColor: colors.violet }]} />
            <Text style={styles.leyText}>Hoy</Text>
          </View>
          <View style={styles.leyItem}>
            <View style={[styles.leyDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.leyText}>Asististe</Text>
          </View>
        </View>

        {/* Calendario */}
        <View style={styles.calWrap}>
          <Calendar
            markingType="custom"
            markedDates={marked}
            firstDay={1}
            theme={{
              calendarBackground: colors.surface,
              dayTextColor: colors.text,
              monthTextColor: colors.text,
              textMonthFontWeight: '800',
              textSectionTitleColor: colors.textMuted,
              textDisabledColor: '#3B4654',
              arrowColor: colors.primary,
              todayTextColor: colors.violet,
            }}
          />
        </View>
      </ScrollView>

      {/* Botón flotante verde (estilo WhatsApp) */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setScanner(true)}
      >
        <Ionicons name="qr-code" size={30} color="#06210f" />
      </Pressable>

      <ScannerModal visible={scanner} onClose={() => { setScanner(false); cargarAsistencias(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 100, gap: 16 },

  logoGlow: {
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: '#000',
    marginVertical: 8,
    shadowColor: colors.violet, shadowOpacity: 0.9, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, elevation: 16,
  },
  logoImg: { width: 300, height: 150, resizeMode: 'contain', borderRadius: 18 },

  leyenda: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  leyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyDot: { width: 12, height: 12, borderRadius: 3 },
  leyText: { color: colors.textMuted, fontSize: 13 },

  calWrap: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },

  fab: {
    position: 'absolute', right: 22, bottom: 22, width: 66, height: 66, borderRadius: 33,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  fabPressed: { backgroundColor: colors.primaryDark, transform: [{ scale: 0.94 }] },
});
