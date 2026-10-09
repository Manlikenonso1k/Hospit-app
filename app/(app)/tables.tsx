import { useState } from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCreateTable, useTables, useUpdateTable } from '@/api/hooks';
import { ApiError } from '@/api/client';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { colors, fonts, type } from '@/theme';

export default function TablesScreen() {
  const tables = useTables(true);
  const update = useUpdateTable();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.icon}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Tables</Text>
          <Pressable onPress={() => setFormOpen(true)} hitSlop={10} style={styles.icon}>
            <MaterialIcons name="add" size={26} color={colors.navy} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.list}>
        {tables.isLoading ? (
          <Loading label="Loading tables…" />
        ) : tables.isError ? (
          <ErrorState message="Could not load tables." onRetry={() => tables.refetch()} />
        ) : (tables.data?.data ?? []).length === 0 ? (
          <EmptyState title="No tables yet" subtitle="Add tables, cabanas or sunbeds guests order to." />
        ) : (
          (tables.data?.data ?? []).map((t) => (
            <View key={t.id} style={styles.row}>
              <View style={styles.tIcon}><MaterialIcons name="deck" size={22} color={colors.navy} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t.name}</Text>
                {t.zone ? <Text style={styles.meta}>{t.zone}</Text> : null}
              </View>
              <Switch
                value={t.is_active}
                onValueChange={(v) => update.mutate({ id: t.id, is_active: v })}
                trackColor={{ true: colors.green, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setFormOpen(true)}>
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.fabText}>Add table</Text>
      </Pressable>

      {formOpen ? <TableForm onClose={() => setFormOpen(false)} /> : null}
    </View>
  );
}

function TableForm({ onClose }: { onClose: () => void }) {
  const create = useCreateTable();
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    if (!name.trim()) {
      setError('Enter a table name.');
      return;
    }
    create.mutate(
      { name: name.trim(), zone: zone.trim() || undefined },
      {
        onSuccess: onClose,
        onError: (e) => setError(e instanceof ApiError ? e.firstError() ?? e.message : 'Could not add the table.'),
      },
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Add table</Text>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Cabana 04" placeholderTextColor={colors.outline} />
        <Text style={styles.fieldLabel}>Zone (optional)</Text>
        <TextInput style={styles.input} value={zone} onChangeText={setZone} placeholder="e.g. Poolside Deck" placeholderTextColor={colors.outline} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <View style={{ flex: 1 }}><Button label="Cancel" variant="secondary" onPress={onClose} /></View>
          <View style={{ flex: 1.4 }}><Button label="Add table" onPress={save} loading={create.isPending} /></View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.headlineSm, color: colors.deepNavy },
  list: { padding: 16, gap: 10, paddingBottom: 96, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  tIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.navyTint, alignItems: 'center', justifyContent: 'center' },
  name: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy },
  meta: { ...type.bodyMd, color: colors.inkSecondary, marginTop: 1 },
  fab: { position: 'absolute', right: 16, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: 999, paddingHorizontal: 18, height: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText: { ...type.labelLg, color: '#fff' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginVertical: 10 },
  sheetTitle: { ...type.headlineSm, color: colors.deepNavy, marginBottom: 4 },
  fieldLabel: { ...type.labelMd, color: colors.inkSecondary, fontFamily: fonts.bold, marginTop: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 16, color: colors.text },
  error: { ...type.bodyMd, color: colors.red, fontFamily: fonts.semibold, marginTop: 6 },
});
