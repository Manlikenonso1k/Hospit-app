import { useState } from 'react';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui';
import { colors } from '@/theme/colors';

const schema = z.object({
  login: z.string().min(1, 'Enter your email or phone'),
  password: z.string().min(1, 'Enter your password'),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const login = useLogin();
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  const onSubmit = (values: Form) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => router.replace('/'),
      onError: (e) => {
        const msg = e instanceof ApiError ? e.firstError() ?? e.message : 'Login failed';
        setFormError(msg);
      },
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.navy} />
            </Pressable>

            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Use the email or phone your manager set up.</Text>

            <View style={styles.form}>
              <Field label="Email or phone">
                <Controller
                  control={control}
                  name="login"
                  render={({ field: { value, onChange, onBlur }, fieldState }) => (
                    <>
                      <TextInput
                        style={[styles.input, fieldState.error && styles.inputError]}
                        placeholder="you@example.com or 0810…"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                      {fieldState.error && <Text style={styles.err}>{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </Field>

              <Field label="Password">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { value, onChange, onBlur }, fieldState }) => (
                    <>
                      <View style={[styles.input, styles.pwRow, fieldState.error && styles.inputError]}>
                        <TextInput
                          style={styles.pwInput}
                          placeholder="••••••••"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry={!showPw}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                        <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={12}>
                          <Ionicons
                            name={showPw ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      </View>
                      {fieldState.error && <Text style={styles.err}>{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </Field>

              {formError ? (
                <View style={styles.banner}>
                  <Ionicons name="alert-circle" size={18} color={colors.red} />
                  <Text style={styles.bannerText}>{formError}</Text>
                </View>
              ) : null}

              <Button
                label="Sign in"
                onPress={handleSubmit(onSubmit)}
                loading={login.isPending}
                disabled={!formState.isValid && formState.isSubmitted}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, gap: 8, flexGrow: 1 },
  back: { width: 40, height: 40, justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  form: { marginTop: 28, gap: 18 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: 0.2 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.red },
  pwRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  pwInput: { flex: 1, fontSize: 16, color: colors.text },
  err: { color: colors.red, fontSize: 13 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bannerText: { color: colors.red, flex: 1, fontSize: 14, fontWeight: '600' },
});
