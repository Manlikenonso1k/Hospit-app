import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useMe, useMeals, usePlaceOrder } from '@/api/hooks';
import { ApiError } from '@/api/client';
import type { Department, Meal } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { Loading } from '@/components/ui';
import { KITCHEN_DEPARTMENTS, departmentLabel } from '@/lib/roles';
import { formatNaira } from '@/lib/format';
import { colors, fonts, type } from '@/theme';

type CartItem = { qty: number; note: string };
type Category = 'all' | Department;

export default function OrderScreen() {
  const me = useMe();
  const meals = useMeals(''); // all available meals, filtered client-side
  const place = usePlaceOrder();

  const kitchens = useMemo<Department[]>(() => {
    const enabled = me.data?.tenant?.enabled_departments ?? [];
    const list = KITCHEN_DEPARTMENTS.filter((k) => enabled.includes(k));
    return list.length ? list : KITCHEN_DEPARTMENTS;
  }, [me.data]);

  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [destination, setDestination] = useState('');
  const [destOpen, setDestOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const allMeals = meals.data?.data ?? [];
  const mealById = useMemo(() => new Map(allMeals.map((m) => [m.id, m])), [allMeals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allMeals.filter(
      (m) =>
        (category === 'all' || m.department === category) &&
        (q === '' || m.name.toLowerCase().includes(q)),
    );
  }, [allMeals, category, search]);

  const setQty = (id: number, delta: number) =>
    setCart((c) => {
      const cur = c[id]?.qty ?? 0;
      const next = Math.max(0, cur + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = { qty: next, note: c[id]?.note ?? '' };
      return copy;
    });

  const setNote = (id: number, note: string) =>
    setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], note } } : c));

  const selectedIds = Object.keys(cart).map(Number);
  const itemCount = selectedIds.reduce((n, id) => n + cart[id].qty, 0);
  const totalKobo = selectedIds.reduce((sum, id) => sum + (mealById.get(id)?.price ?? 0) * cart[id].qty, 0);
  const estMins = selectedIds.reduce((max, id) => Math.max(max, mealById.get(id)?.prep_time_minutes ?? 0), 0);

  const fire = () => {
    if (itemCount === 0) return;
    setFeedback(null);

    // Group the cart by kitchen — one order per department so each station
    // gets only its own items (the server stamps each order's due_at).
    const byDept = new Map<string, { meal_id: number; quantity: number; notes?: string }[]>();
    for (const id of selectedIds) {
      const meal = mealById.get(id);
      if (!meal) continue;
      const line = { meal_id: id, quantity: cart[id].qty, notes: cart[id].note || undefined };
      byDept.set(meal.department, [...(byDept.get(meal.department) ?? []), line]);
    }

    const groups = [...byDept.entries()];
    Promise.all(
      groups.map(([department, items]) =>
        place.mutateAsync({ department, guest_ref: destination.trim() || null, items }),
      ),
    )
      .then(() => {
        setCart({});
        setFeedback({ kind: 'ok', text: `Fired ${groups.length} order${groups.length > 1 ? 's' : ''} to the kitchen.` });
      })
      .catch((e) => {
        const msg = e instanceof ApiError ? e.firstError() ?? e.message : 'Could not fire the order';
        setFeedback({ kind: 'err', text: msg });
      });
  };

  if (!me.data) return <View style={styles.root}><Loading /></View>;

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: 'All Items' },
    ...kitchens.map((k) => ({ key: k as Category, label: departmentLabel(k) })),
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader me={me.data} subtitle="New Order" />
      </SafeAreaView>

      <View style={styles.stickyTop}>
        <StepIndicator hasDestination={destination.trim().length > 0} itemCount={itemCount} />
        <DestinationBanner value={destination} onChange={() => setDestOpen(true)} />
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={22} color={colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meals or drinks…"
            placeholderTextColor={colors.outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catBar}>
          {categories.map((c) => {
            const on = c.key === category;
            return (
              <Pressable key={c.key} onPress={() => setCategory(c.key)} style={[styles.catChip, on && styles.catChipOn]}>
                <Text style={[styles.catChipText, on && { color: '#fff' }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MealCard
            meal={item}
            entry={cart[item.id]}
            onAdd={() => setQty(item.id, 1)}
            onInc={() => setQty(item.id, 1)}
            onDec={() => setQty(item.id, -1)}
            onNote={() => setNoteFor(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          meals.isLoading ? <Loading label="Loading menu…" /> : (
            <View style={styles.empty}>
              <MaterialIcons name="restaurant" size={32} color={colors.outline} />
              <Text style={styles.emptyText}>No meals here yet.</Text>
            </View>
          )
        }
      />

      {feedback ? (
        <View style={[styles.feedback, { backgroundColor: feedback.kind === 'ok' ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={{ color: feedback.kind === 'ok' ? colors.greenLabel : colors.red, fontFamily: fonts.bold }}>
            {feedback.text}
          </Text>
        </View>
      ) : null}

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomSummary}>
          <View style={styles.bottomLeft}>
            <Text style={styles.bottomItems}>{itemCount} Item{itemCount === 1 ? '' : 's'} Selected</Text>
            <View style={styles.bottomDot} />
            <Text style={styles.bottomTotal}>{formatNaira(totalKobo)}</Text>
          </View>
          {estMins > 0 ? (
            <View style={styles.estPill}>
              <MaterialIcons name="schedule" size={14} color={colors.amberBadgeText} />
              <Text style={styles.estText}>Est: {estMins} mins</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.notice}>
          <MaterialIcons name="verified" size={13} color={colors.greenIcon} /> Target starts on firing · relayed to each kitchen
        </Text>
        <Pressable
          style={[styles.fireBtn, itemCount === 0 && { opacity: 0.5 }]}
          onPress={fire}
          disabled={itemCount === 0 || place.isPending}
        >
          <View style={styles.fireLeft}>
            <MaterialIcons name="restaurant" size={22} color="#fff" />
            <Text style={styles.fireText}>{place.isPending ? 'Firing…' : `Review & Fire Order (${itemCount})`}</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color="#fff" />
        </Pressable>
      </SafeAreaView>

      <DestinationModal
        open={destOpen}
        value={destination}
        onSave={(v) => {
          setDestination(v);
          setDestOpen(false);
        }}
        onClose={() => setDestOpen(false)}
      />
      <NoteModal
        open={noteFor != null}
        value={noteFor != null ? cart[noteFor]?.note ?? '' : ''}
        onSave={(v) => {
          if (noteFor != null) setNote(noteFor, v);
          setNoteFor(null);
        }}
        onClose={() => setNoteFor(null)}
      />
    </View>
  );
}

function StepIndicator({ hasDestination, itemCount }: { hasDestination: boolean; itemCount: number }) {
  return (
    <View style={styles.steps}>
      <Step n={1} label="Table" done={hasDestination} active={!hasDestination} />
      <View style={styles.stepLine} />
      <Step n={2} label="Pick Meals" done={false} active={hasDestination} />
      <View style={styles.stepLine} />
      <Step n={3} label="Review" done={false} active={itemCount > 0} dim />
    </View>
  );
}

function Step({ n, label, done, active, dim }: { n: number; label: string; done: boolean; active: boolean; dim?: boolean }) {
  const bg = active ? colors.navy : done ? colors.navy : colors.fillHigh;
  const fg = active || done ? '#fff' : colors.inkSecondary;
  return (
    <View style={[styles.step, dim && !active && { opacity: 0.6 }]}>
      <View style={[styles.stepBubble, { backgroundColor: bg }]}>
        {done ? <MaterialIcons name="check" size={14} color="#fff" /> : <Text style={[styles.stepNum, { color: fg }]}>{n}</Text>}
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

function DestinationBanner({ value, onChange }: { value: string; onChange: () => void }) {
  return (
    <View style={styles.destBanner}>
      <View style={styles.destLeft}>
        <View style={styles.destIcon}>
          <MaterialIcons name="deck" size={22} color="#fff" />
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.destLabel}>DESTINATION</Text>
          <Text style={styles.destValue} numberOfLines={1}>{value.trim() || 'Set table / cabana'}</Text>
        </View>
      </View>
      <Pressable style={styles.changeBtn} onPress={onChange} hitSlop={8}>
        <MaterialIcons name="edit" size={16} color={colors.navy} />
        <Text style={styles.changeText}>{value.trim() ? 'Change' : 'Set'}</Text>
      </Pressable>
    </View>
  );
}

function MealCard({
  meal,
  entry,
  onAdd,
  onInc,
  onDec,
  onNote,
}: {
  meal: Meal;
  entry: CartItem | undefined;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
  onNote: () => void;
}) {
  const fast = meal.prep_time_minutes <= 15;
  const selected = !!entry;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardImg}>
          {meal.image_url ? (
            <Image source={{ uri: meal.image_url }} style={styles.cardImgInner} resizeMode="cover" />
          ) : (
            <MaterialIcons name="restaurant" size={28} color={colors.outline} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.cardHeadRow}>
            <View style={[styles.prepBadge, { backgroundColor: fast ? '#DCFCE7' : colors.amberTint }]}>
              <MaterialIcons name="timer" size={12} color={fast ? colors.greenLabel : colors.amberBadgeText} />
              <Text style={[styles.prepText, { color: fast ? colors.greenLabel : colors.amberBadgeText }]}>
                {meal.prep_time_minutes}m target
              </Text>
            </View>
            <Text style={styles.cardDept}>{departmentLabel(meal.department)}</Text>
          </View>
          <Text style={styles.cardName} numberOfLines={2}>{meal.name}</Text>
          <View style={styles.cardPriceRow}>
            <Text style={styles.cardPrice}>{formatNaira(meal.price)}</Text>
            {!selected ? (
              <Pressable style={styles.addBtn} onPress={onAdd}>
                <MaterialIcons name="add" size={20} color={colors.navy} />
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {selected ? (
        <>
          {entry!.note ? (
            <Pressable style={styles.noteBox} onPress={onNote}>
              <MaterialIcons name="sticky-note-2" size={16} color={colors.amberBadgeText} />
              <Text style={styles.noteText} numberOfLines={1}>"{entry!.note}"</Text>
              <MaterialIcons name="edit" size={16} color={colors.amberBadgeText} />
            </Pressable>
          ) : (
            <Pressable style={styles.addNote} onPress={onNote}>
              <MaterialIcons name="sticky-note-2" size={16} color={colors.outline} />
              <Text style={styles.addNoteText}>Add kitchen note</Text>
            </Pressable>
          )}
          <View style={styles.stepperRow}>
            <Text style={styles.subtotal}>
              Subtotal: <Text style={styles.subtotalStrong}>{formatNaira(meal.price * entry!.qty)}</Text>
            </Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={onDec} hitSlop={6}>
                <MaterialIcons name="remove" size={20} color={colors.navy} />
              </Pressable>
              <Text style={styles.stepQty}>{entry!.qty}</Text>
              <Pressable style={styles.stepBtn} onPress={onInc} hitSlop={6}>
                <MaterialIcons name="add" size={20} color={colors.navy} />
              </Pressable>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

function DestinationModal({ open, value, onSave, onClose }: { open: boolean; value: string; onSave: (v: string) => void; onClose: () => void }) {
  const [v, setV] = useState(value);
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.inputSheet}>
        <View style={styles.handle} />
        <Text style={styles.inputSheetTitle}>Destination</Text>
        <Text style={styles.inputSheetSub}>Table, cabana, sunbed or room this order goes to.</Text>
        <TextInput style={styles.sheetInput} value={v} onChangeText={setV} autoFocus placeholder="e.g. Cabana 04" placeholderTextColor={colors.outline} />
        <Pressable style={styles.sheetSave} onPress={() => onSave(v)}>
          <Text style={styles.sheetSaveText}>Save</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function NoteModal({ open, value, onSave, onClose }: { open: boolean; value: string; onSave: (v: string) => void; onClose: () => void }) {
  const [v, setV] = useState(value);
  // Re-seed when a different item opens.
  useEffect(() => {
    if (open) setV(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.inputSheet}>
        <View style={styles.handle} />
        <Text style={styles.inputSheetTitle}>Kitchen note</Text>
        <Text style={styles.inputSheetSub}>e.g. "Extra pepper, pack sauce separately".</Text>
        <TextInput style={[styles.sheetInput, { height: 80, textAlignVertical: 'top' }]} value={v} onChangeText={setV} autoFocus multiline placeholder="Note for the kitchen" placeholderTextColor={colors.outline} />
        <Pressable style={styles.sheetSave} onPress={() => onSave(v)}>
          <Text style={styles.sheetSaveText}>Save note</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  stickyTop: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  steps: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, gap: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBubble: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum: { ...type.labelSm, letterSpacing: 0 },
  stepLabel: { ...type.labelSm, color: colors.ink, letterSpacing: 0, textTransform: 'none' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.fillHighest, borderRadius: 2, marginHorizontal: 4 },
  destBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: colors.fillLow, gap: 10 },
  destLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  destIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  destLabel: { ...type.labelSm, color: colors.inkSecondary },
  destValue: { ...type.headlineSm, color: colors.deepNavy },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  changeText: { ...type.labelMd, fontFamily: fonts.bold, color: colors.navy },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, height: 48, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  catBar: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catChipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  catChipText: { ...type.labelMd, fontFamily: fonts.bold, color: colors.inkSecondary },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyText: { ...type.bodyMd, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 12, gap: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardImg: { width: 88, height: 88, borderRadius: 10, backgroundColor: colors.fillLow, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImgInner: { width: 88, height: 88 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  prepBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  prepText: { ...type.labelSm, letterSpacing: 0 },
  cardDept: { ...type.labelSm, color: colors.outline },
  cardName: { ...type.headlineSm, color: colors.deepNavy, marginTop: 4 },
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice: { ...type.timer, color: colors.navy },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.fillHigh, borderRadius: 10, paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  addText: { ...type.labelLg, color: colors.navy },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10 },
  noteText: { ...type.bodyMd, color: colors.amberText, fontStyle: 'italic', flex: 1 },
  addNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  addNoteText: { ...type.labelMd, color: colors.outline, fontFamily: fonts.semibold },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.fillLow, borderRadius: 10, padding: 6 },
  subtotal: { ...type.labelMd, color: colors.inkSecondary, paddingLeft: 6 },
  subtotalStrong: { fontFamily: fonts.bold, color: colors.navy },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10 },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepQty: { minWidth: 28, textAlign: 'center', ...type.timer, color: colors.navy },
  feedback: { marginHorizontal: 16, marginBottom: 6, padding: 10, borderRadius: 10, alignItems: 'center' },
  bottomBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 10, gap: 6, shadowColor: '#0F172A', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  bottomSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottomItems: { ...type.labelLg, color: colors.navy },
  bottomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.outline },
  bottomTotal: { ...type.headlineSm, fontFamily: fonts.extrabold, color: colors.navy },
  estPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.amberTint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  estText: { ...type.labelSm, color: colors.amberBadgeText, letterSpacing: 0 },
  notice: { ...type.labelSm, color: colors.inkSecondary, letterSpacing: 0, textTransform: 'none' },
  fireBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, borderRadius: 14, backgroundColor: colors.navy, paddingHorizontal: 20, marginTop: 2 },
  fireLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fireText: { ...type.labelLg, color: '#fff', textTransform: 'uppercase' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  inputSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 8 },
  inputSheetTitle: { ...type.headlineSm, color: colors.deepNavy },
  inputSheetSub: { ...type.bodyMd, color: colors.inkSecondary },
  sheetInput: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, fontSize: 16, color: colors.text },
  sheetSave: { height: 52, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sheetSaveText: { ...type.labelLg, color: '#fff' },
});
