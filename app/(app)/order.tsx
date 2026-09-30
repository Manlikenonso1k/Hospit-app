import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMe, useMeals, usePlaceOrder } from '@/api/hooks';
import { ApiError } from '@/api/client';
import type { Department, Meal } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { departmentLabel } from '@/lib/roles';
import { formatNaira } from '@/lib/format';
import { colors } from '@/theme/colors';

const KITCHENS: Department[] = ['main_kitchen', 'barbecue', 'ice_cream'];

export default function OrderScreen() {
  const me = useMe();
  const kitchens = useMemo<Department[]>(() => {
    const enabled = me.data?.tenant?.enabled_departments ?? [];
    const list = KITCHENS.filter((k) => enabled.includes(k));
    return list.length ? list : KITCHENS;
  }, [me.data]);

  const [dept, setDept] = useState<Department | null>(null);
  const activeDept = dept ?? kitchens[0] ?? null;

  const meals = useMeals(activeDept ?? undefined);
  const place = usePlaceOrder();

  const [cart, setCart] = useState<Record<number, number>>({});
  const [guestRef, setGuestRef] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const mealList = meals.data?.data ?? [];
  const total = useMemo(
    () => mealList.reduce((sum, m) => sum + (cart[m.id] ?? 0) * m.price, 0),
    [mealList, cart],
  );
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const setQty = (mealId: number, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[mealId] ?? 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[mealId];
      else copy[mealId] = next;
      return copy;
    });

  const submit = () => {
    if (!activeDept || itemCount === 0) return;
    setFeedback(null);
    const items = Object.entries(cart).map(([mealId, qty]) => ({ meal_id: Number(mealId), quantity: qty }));
    place.mutate(
      { department: activeDept, guest_ref: guestRef.trim() || null, items },
      {
        onSuccess: () => {
          setCart({});
          setGuestRef('');
          setFeedback({ kind: 'ok', text: 'Order sent to the kitchen.' });
        },
        onError: (e) => {
          const msg = e instanceof ApiError ? e.firstError() ?? e.message : 'Could not send order';
          setFeedback({ kind: 'err', text: msg });
        },
      },
    );
  };

  if (!me.data) return <View style={styles.root}><Loading /></View>;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader me={me.data} subtitle="Take Order" />
      </SafeAreaView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptBarWrap} contentContainerStyle={styles.deptBar}>
        {kitchens.map((k) => {
          const active = k === activeDept;
          return (
            <Pressable key={k} onPress={() => { setDept(k); setCart({}); }} style={[styles.deptChip, active && styles.deptChipActive]}>
              <Text style={[styles.deptChipText, active && styles.deptChipTextActive]}>{departmentLabel(k)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.guestRow}>
        <Ionicons name="location-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.guestInput}
          placeholder="Table / cabana / guest (e.g. Cabana 04)"
          placeholderTextColor={colors.textMuted}
          value={guestRef}
          onChangeText={setGuestRef}
        />
      </View>

      <FlatList
        data={mealList}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <MealRow meal={item} qty={cart[item.id] ?? 0} onChange={(d) => setQty(item.id, d)} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          meals.isLoading ? (
            <Loading label="Loading menu…" />
          ) : meals.isError ? (
            <ErrorState message="Could not load the menu." onRetry={() => meals.refetch()} />
          ) : (
            <EmptyState title="No meals yet" subtitle="This kitchen has no items on its menu." />
          )
        }
      />

      {feedback ? (
        <View style={[styles.feedback, { backgroundColor: feedback.kind === 'ok' ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={{ color: feedback.kind === 'ok' ? colors.green : colors.red, fontWeight: '700' }}>
            {feedback.text}
          </Text>
        </View>
      ) : null}

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.totalLabel}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
          <Text style={styles.totalValue}>{formatNaira(total)}</Text>
        </View>
        <View style={{ flex: 1.4 }}>
          <Button label="Send order" onPress={submit} disabled={itemCount === 0} loading={place.isPending} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function MealRow({ meal, qty, onChange }: { meal: Meal; qty: number; onChange: (delta: number) => void }) {
  return (
    <View style={[styles.mealCard, qty > 0 && styles.mealCardActive]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealMeta}>
          {formatNaira(meal.price)} · {meal.prep_time_minutes} min
        </Text>
      </View>
      <View style={styles.stepper}>
        <Pressable onPress={() => onChange(-1)} style={styles.stepBtn} hitSlop={8} disabled={qty === 0}>
          <Ionicons name="remove" size={22} color={qty === 0 ? colors.border : colors.navy} />
        </Pressable>
        <Text style={styles.stepQty}>{qty}</Text>
        <Pressable onPress={() => onChange(1)} style={styles.stepBtn} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.navy} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  deptBarWrap: { maxHeight: 60, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  deptBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  deptChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.muted },
  deptChipActive: { backgroundColor: colors.navy },
  deptChipText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  deptChipTextActive: { color: '#fff' },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  guestInput: { flex: 1, fontSize: 16, color: colors.text },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  mealCardActive: { borderColor: colors.navy },
  mealName: { fontSize: 16, fontWeight: '700', color: colors.text },
  mealMeta: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: { minWidth: 26, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },
  feedback: { marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12, alignItems: 'center' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.text },
});
