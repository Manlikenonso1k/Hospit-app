import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  useCreateMeal,
  useManagedMeals,
  useMe,
  useUpdateMeal,
  useUploadMealImage,
} from '@/api/hooks';
import { ApiError } from '@/api/client';
import type { Department, Meal } from '@/api/types';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { KITCHEN_DEPARTMENTS, departmentLabel } from '@/lib/roles';
import { formatNaira } from '@/lib/format';
import { colors, fonts, type } from '@/theme';

type Picked = { base64: string; mime: string } | null;

export default function MenuScreen() {
  const me = useMe();
  const kitchens = useMemo<Department[]>(() => {
    const enabled = me.data?.tenant?.enabled_departments ?? [];
    const list = KITCHEN_DEPARTMENTS.filter((k) => enabled.includes(k));
    return list.length ? list : KITCHEN_DEPARTMENTS;
  }, [me.data]);

  const [dept, setDept] = useState<Department | null>(null);
  const activeDept = dept ?? kitchens[0] ?? 'main_kitchen';
  const meals = useManagedMeals(activeDept);

  const [editing, setEditing] = useState<Meal | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (meal: Meal) => {
    setEditing(meal);
    setFormOpen(true);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Menu & Prices</Text>
          <Pressable onPress={openAdd} hitSlop={10} style={styles.addIcon}>
            <MaterialIcons name="add" size={26} color={colors.navy} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptBar}>
          {kitchens.map((k) => {
            const on = k === activeDept;
            return (
              <Pressable key={k} onPress={() => setDept(k)} style={[styles.deptChip, on && styles.deptChipOn]}>
                <Text style={[styles.deptChipText, on && { color: '#fff' }]}>{departmentLabel(k)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.list}>
        {meals.isLoading ? (
          <Loading label="Loading menu…" />
        ) : meals.isError ? (
          <ErrorState message="Could not load the menu." onRetry={() => meals.refetch()} />
        ) : (meals.data?.data ?? []).length === 0 ? (
          <EmptyState title="No meals yet" subtitle="Tap + to add your first product." />
        ) : (
          (meals.data?.data ?? []).map((meal) => <MealRow key={meal.id} meal={meal} onEdit={() => openEdit(meal)} />)
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={openAdd}>
        <MaterialIcons name="add" size={22} color="#fff" />
        <Text style={styles.fabText}>Add meal</Text>
      </Pressable>

      {formOpen ? (
        <MealForm
          meal={editing}
          department={activeDept}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
    </View>
  );
}

function MealRow({ meal, onEdit }: { meal: Meal; onEdit: () => void }) {
  const update = useUpdateMeal();
  return (
    <Pressable style={styles.row} onPress={onEdit}>
      <View style={styles.thumb}>
        {meal.image_url ? (
          <Image source={{ uri: meal.image_url }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <MaterialIcons name="restaurant" size={24} color={colors.outline} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.rowMeta}>{formatNaira(meal.price)} · {meal.prep_time_minutes} min</Text>
      </View>
      <Switch
        value={meal.is_available}
        onValueChange={(v) => update.mutate({ id: meal.id, is_available: v })}
        trackColor={{ true: colors.green, false: colors.border }}
        thumbColor="#fff"
      />
    </Pressable>
  );
}

function MealForm({ meal, department, onClose }: { meal: Meal | null; department: Department; onClose: () => void }) {
  const create = useCreateMeal();
  const update = useUpdateMeal();
  const uploadImage = useUploadMealImage();

  const [name, setName] = useState(meal?.name ?? '');
  const [category, setCategory] = useState(meal?.category ?? '');
  const [price, setPrice] = useState(meal ? String(meal.price / 100) : '');
  const [prep, setPrep] = useState(meal ? String(meal.prep_time_minutes) : '');
  const [available, setAvailable] = useState(meal?.is_available ?? true);
  const [picked, setPicked] = useState<Picked>(null);
  const [preview, setPreview] = useState<string | null>(meal?.image_url ?? null);
  const [error, setError] = useState<string | null>(null);

  const busy = create.isPending || update.isPending || uploadImage.isPending;

  const pick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (res.canceled || !res.assets?.[0]?.base64) return;
      const a = res.assets[0];
      setPicked({ base64: a.base64!, mime: a.mimeType ?? 'image/jpeg' });
      setPreview(a.uri);
    } catch {
      // ignore picker errors
    }
  };

  const save = async () => {
    setError(null);
    const priceNaira = Number(price);
    const prepMin = Number(prep);
    if (!name.trim() || Number.isNaN(priceNaira) || priceNaira < 0 || Number.isNaN(prepMin) || prepMin < 1) {
      setError('Enter a name, a price, and a prep time of at least 1 minute.');
      return;
    }

    try {
      let mealId = meal?.id;
      if (meal) {
        await update.mutateAsync({
          id: meal.id,
          name: name.trim(),
          category: category.trim() || null,
          price_naira: priceNaira,
          prep_time_minutes: prepMin,
          is_available: available,
        });
      } else {
        const created = await create.mutateAsync({
          department,
          name: name.trim(),
          category: category.trim() || null,
          price_naira: priceNaira,
          prep_time_minutes: prepMin,
          is_available: available,
        });
        mealId = created.data.id;
      }

      if (picked && mealId) {
        await uploadImage.mutateAsync({ id: mealId, image_base64: picked.base64, mime: picked.mime });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.firstError() ?? e.message : 'Could not save the meal.');
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>
            {meal ? 'Edit meal' : `Add meal · ${departmentLabel(department)}`}
          </Text>

          <Pressable style={styles.photo} onPress={pick}>
            {preview ? (
              <Image source={{ uri: preview }} style={styles.photoImg} resizeMode="cover" />
            ) : (
              <View style={styles.photoEmpty}>
                <MaterialIcons name="add-a-photo" size={28} color={colors.navy} />
                <Text style={styles.photoText}>Add product photo</Text>
              </View>
            )}
          </Pressable>

          <Field label="Name"><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Grilled Tilapia" placeholderTextColor={colors.outline} /></Field>
          <Field label="Category (optional)"><TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Grill" placeholderTextColor={colors.outline} /></Field>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Price (₦)"><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="8500" placeholderTextColor={colors.outline} /></Field></View>
            <View style={{ flex: 1 }}><Field label="Prep (min)"><TextInput style={styles.input} value={prep} onChangeText={setPrep} keyboardType="numeric" placeholder="25" placeholderTextColor={colors.outline} /></Field></View>
          </View>
          <View style={styles.availRow}>
            <Text style={styles.availLabel}>Available to order</Text>
            <Switch value={available} onValueChange={setAvailable} trackColor={{ true: colors.green, false: colors.border }} thumbColor="#fff" />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <View style={{ flex: 1 }}><Button label="Cancel" variant="secondary" onPress={onClose} /></View>
            <View style={{ flex: 1.4 }}><Button label={meal ? 'Save changes' : 'Add meal'} onPress={save} loading={busy} /></View>
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
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.headlineSm, color: colors.deepNavy },
  deptBar: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  deptChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.fillHigh },
  deptChipOn: { backgroundColor: colors.navy },
  deptChipText: { ...type.labelMd, fontFamily: fonts.bold, color: colors.inkSecondary },
  list: { padding: 16, gap: 10, paddingBottom: 96, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.fillLow, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImg: { width: 56, height: 56 },
  rowName: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy },
  rowMeta: { ...type.bodyMd, color: colors.inkSecondary, marginTop: 2 },
  fab: { position: 'absolute', right: 16, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: 999, paddingHorizontal: 18, height: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText: { ...type.labelLg, color: '#fff' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', paddingHorizontal: 20, paddingBottom: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginVertical: 10 },
  sheetTitle: { ...type.headlineSm, color: colors.deepNavy, marginBottom: 4 },
  photo: { height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.fillLow, borderWidth: 1, borderColor: colors.border },
  photoImg: { width: '100%', height: 150 },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoText: { ...type.labelMd, color: colors.navy, fontFamily: fonts.bold },
  fieldLabel: { ...type.labelMd, color: colors.inkSecondary, fontFamily: fonts.bold },
  input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 16, color: colors.text },
  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  availLabel: { ...type.bodyLg, color: colors.text },
  error: { ...type.bodyMd, color: colors.red, fontFamily: fonts.semibold },
});
