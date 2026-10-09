import { useState } from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCreateStaff, useMe, useStaff } from '@/api/hooks';
import { ApiError } from '@/api/client';
import { KITCHEN_DEPARTMENTS, departmentLabel } from '@/lib/roles';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { colors, fonts, type } from '@/theme';

export default function StaffScreen() {
  const me = useMe();
  const staff = useStaff();
  const [formOpen, setFormOpen] = useState(false);

  const assignable = staff.data?.assignable_roles ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.icon}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Staff</Text>
          <Pressable onPress={() => setFormOpen(true)} hitSlop={10} style={styles.icon}>
            <MaterialIcons name="person-add" size={24} color={colors.navy} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.list}>
        {staff.isLoading ? (
          <Loading label="Loading staff…" />
        ) : staff.isError ? (
          <ErrorState message="Could not load staff." onRetry={() => staff.refetch()} />
        ) : (staff.data?.data ?? []).length === 0 ? (
          <EmptyState title="No staff yet" subtitle="Tap the add icon to create an account." />
        ) : (
          (staff.data?.data ?? []).map((s) => (
            <View key={s.id} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(s.name?.[0] ?? '?').toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {s.roles.join(', ')}{s.department ? ` · ${departmentLabel(s.department)}` : ''}
                </Text>
                <Text style={styles.contact} numberOfLines={1}>{s.email ?? s.phone ?? '—'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setFormOpen(true)}>
        <MaterialIcons name="person-add" size={20} color="#fff" />
        <Text style={styles.fabText}>Add staff</Text>
      </Pressable>

      {formOpen && me.data ? (
        <StaffForm assignable={assignable} onClose={() => setFormOpen(false)} />
      ) : null}
    </View>
  );
}

function StaffForm({ assignable, onClose }: { assignable: string[]; onClose: () => void }) {
  const create = useCreateStaff();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(assignable[0] ?? '');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    if (!name.trim() || password.length < 6 || !role) {
      setError('Enter a name, a password (6+ chars) and a role.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Enter an email or a phone number.');
      return;
    }
    if (role === 'Chef' && !department) {
      setError('Pick a kitchen station for the chef.');
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        role,
        department: role === 'Chef' ? department : undefined,
      },
      {
        onSuccess: onClose,
        onError: (e) => setError(e instanceof ApiError ? e.firstError() ?? e.message : 'Could not create the account.'),
      },
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>New staff account</Text>

          <Field label="Full name"><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Ada Obi" placeholderTextColor={colors.outline} /></Field>
          <Field label="Email (optional)"><TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="name@business.com" placeholderTextColor={colors.outline} /></Field>
          <Field label="Phone (optional)"><TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0810…" placeholderTextColor={colors.outline} /></Field>
          <Field label="Temporary password"><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.outline} /></Field>

          <Field label="Role">
            <View style={styles.chips}>
              {assignable.map((r) => (
                <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, role === r && styles.chipOn]}>
                  <Text style={[styles.chipText, role === r && { color: '#fff' }]}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          {role === 'Chef' ? (
            <Field label="Kitchen station">
              <View style={styles.chips}>
                {KITCHEN_DEPARTMENTS.map((d) => (
                  <Pressable key={d} onPress={() => setDepartment(d)} style={[styles.chip, department === d && styles.chipOn]}>
                    <Text style={[styles.chipText, department === d && { color: '#fff' }]}>{departmentLabel(d)}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <View style={{ flex: 1 }}><Button label="Cancel" variant="secondary" onPress={onClose} /></View>
            <View style={{ flex: 1.4 }}><Button label="Create account" onPress={save} loading={create.isPending} /></View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.headlineSm, color: colors.deepNavy },
  list: { padding: 16, gap: 10, paddingBottom: 96, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  name: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy },
  meta: { ...type.bodyMd, color: colors.inkSecondary, marginTop: 1 },
  contact: { ...type.labelMd, color: colors.outline, marginTop: 1 },
  fab: { position: 'absolute', right: 16, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: 999, paddingHorizontal: 18, height: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText: { ...type.labelLg, color: '#fff' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingHorizontal: 20, paddingBottom: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginVertical: 10 },
  sheetTitle: { ...type.headlineSm, color: colors.deepNavy, marginBottom: 4 },
  fieldLabel: { ...type.labelMd, color: colors.inkSecondary, fontFamily: fonts.bold },
  input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 16, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.fillHigh },
  chipOn: { backgroundColor: colors.navy },
  chipText: { ...type.labelMd, fontFamily: fonts.bold, color: colors.inkSecondary },
  error: { ...type.bodyMd, color: colors.red, fontFamily: fonts.semibold },
});
