import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mostrar la notificación aunque la app esté abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PREF_KEY = 'notif_cuota_on';
const ID_KEY = 'notif_cuota_id';

export async function getPrefNotif() {
  return (await AsyncStorage.getItem(PREF_KEY)) === '1';
}

// Activa/desactiva el aviso "1 día antes" según la fecha de fin de cuota (YYYY-MM-DD).
// Devuelve { ok, motivo } para poder avisar en la UI.
export async function setPrefNotif(activar, vigenteHasta) {
  await AsyncStorage.setItem(PREF_KEY, activar ? '1' : '0');

  // Cancelar cualquier aviso previo.
  const prevId = await AsyncStorage.getItem(ID_KEY);
  if (prevId) {
    try { await Notifications.cancelScheduledNotificationAsync(prevId); } catch {}
    await AsyncStorage.removeItem(ID_KEY);
  }

  if (!activar) return { ok: true };
  if (!vigenteHasta) return { ok: false, motivo: 'No tenés una cuota activa.' };

  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return { ok: false, motivo: 'Necesitamos permiso de notificaciones.' };

  // Un día antes del vencimiento, a las 10:00.
  const [y, m, d] = vigenteHasta.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setDate(fecha.getDate() - 1);
  fecha.setHours(10, 0, 0, 0);

  if (fecha.getTime() <= Date.now()) {
    return { ok: false, motivo: 'La cuota vence muy pronto para programar el aviso.' };
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'GYM INFINIT',
      body: 'Tu cuota termina mañana. ¡No te olvides de renovarla!',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha },
  });
  await AsyncStorage.setItem(ID_KEY, id);
  return { ok: true };
}
