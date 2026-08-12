import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { dniToEmail, normalizeDni } from '../lib/identity';

export default function LoginScreen() {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit() {
    const dniLimpio = normalizeDni(dni);
    if (!dniLimpio || !password) {
      Alert.alert('Faltan datos', 'Completá tu DNI y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: dniToEmail(dniLimpio),
        password,
      });
      if (error) {
        // Mensaje amable: no revelamos si el DNI existe o no.
        Alert.alert('No pudimos ingresar', 'DNI o contraseña incorrectos.');
      }
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Algo salió mal.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.logoGym}>GYM</Text>
            <Text style={styles.logoInfinit}>INFINIT</Text>
            <Text style={styles.tagline}>Ingresá con tu DNI</Text>
          </View>

          <View style={styles.campo}>
            <Text style={styles.campoLabel}>DNI</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              placeholder="30111222"
              value={dni}
              onChangeText={setDni}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.campo}>
            <Text style={styles.campoLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.boton, pressed && styles.botonPressed, cargando && styles.botonDisabled]}
            onPress={onSubmit}
            disabled={cargando}
          >
            {cargando
              ? <ActivityIndicator color="#06210F" />
              : <Text style={styles.botonText}>Ingresar</Text>}
          </Pressable>

          <Text style={styles.ayuda}>
            ¿No podés entrar? Consultá en la recepción del gimnasio.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, gap: 16, justifyContent: 'center', flexGrow: 1 },
  brand: { alignItems: 'center', marginBottom: 12 },
  logoGym: { color: colors.text, fontSize: 38, fontWeight: '800', letterSpacing: 5 },
  logoInfinit: { color: colors.primary, fontSize: 38, fontWeight: '800', letterSpacing: 5, marginTop: -6 },
  tagline: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  campo: { gap: 6 },
  campoLabel: { color: colors.textMuted, fontSize: 13, marginLeft: 2 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  botonPressed: { backgroundColor: colors.primaryDark },
  botonDisabled: { opacity: 0.7 },
  botonText: { color: '#06210F', fontSize: 16, fontWeight: '700' },
  ayuda: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
