import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Order } from '@/api/types';
import { useMe, useReassignOrder, useStaff } from '@/api/hooks';
import { colors, fonts, statusHex, type } from '@/theme';
import { departmentLabel } from '@/lib/roles';
import { formatNaira, minutesSince } from '@/lib/format';
import { serverNow } from '@/lib/clock';

type PickerKind = 'server' | 'chef' | null;

/**
 * Order detail sheet. Read-only for most, but a manager can reassign the order's
 * waitress and/or chef straight from here (manager authority — no accept step).
 */
export function OrderDetailSheet({
  order,
  visible,
  onClose,
}: {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
}) {
  const me = useMe();
  const isManager = (me.data?.user.roles ?? []).some((r) => ['Manager', 'Super Admin', 'Admin'].includes(r));
  const staff = useStaff();
  const reassign = useReassignOrder();
  const [picker, setPicker] = useState<PickerKind>(null);

  const close = () => {
    setPicker(null);
    onClose();
  };

  const candidates = (() => {
    if (!order || !picker) return [];
    const all = staff.data?.data ?? [];
    return picker === 'server'
      ? all.filter((s) => s.roles.includes('Waiter'))
      : all.filter((s) => s.roles.includes('Chef') && s.department === order.department);
  })();

  const pick = (userId: number) => {
    if (!order) return;
    reassign.mutate(
      { orderId: order.id, ...(picker === 'server' ? { server_user_id: userId } : { chef_user_id: userId }) },
      { onSuccess: close },
    );
  };

  return (
    <Modal visible={visible && !!order} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {order && picker ? (
          <ScrollView contentContainerStyle={styles.body}>
            <Pressable style={styles.back} onPress={() => setPicker(null)}>
              <MaterialIcons name="arrow-back" size={22} color={colors.navy} />
              <Text style={styles.backText}>Choose {picker === 'server' ? 'waitress' : 'chef'}</Text>
            </Pressable>
            {candidates.length === 0 ? (
              <Text style={styles.empty}>No eligible {picker === 'server' ? 'waitress' : 'chef'} to assign.</Text>
            ) : (
              candidates.map((c) => (
                <Pressable key={c.id} style={styles.candidate} onPress={() => pick(c.id)} disabled={reassign.isPending}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{(c.name?.[0] ?? '?').toUpperCase()}</Text></View>
                  <Text style={styles.candidateName}>{c.name}</Text>
                  <MaterialIcons name="check-circle-outline" size={20} color={colors.navy} />
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : order ? (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>#{order.id}</Text>
              <View style={[styles.statusDot, { backgroundColor: statusHex(order.status_colour) }]} />
              <Text style={styles.status}>{order.status.toUpperCase()}</Text>
            </View>

            <Text style={styles.sub}>
              {order.guest_ref ?? (order.table_id ? `Table ${order.table_id}` : 'Walk-up')}
              {'  •  '}
              {departmentLabel(order.department)}
            </Text>

            <AssignRow
              label="Server"
              value={`${order.placed_by ?? '-'} (${minutesSince(order.placed_at, serverNow())}m ago)`}
              canChange={isManager}
              onChange={() => setPicker('server')}
            />
            <AssignRow
              label="Chef"
              value={order.chef ?? 'Unassigned'}
              canChange={isManager}
              onChange={() => setPicker('chef')}
            />

            <View style={styles.divider} />

            {(order.items ?? []).map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.quantity}{'× '}{item.name}</Text>
                <Text style={styles.itemPrice}>{formatNaira(item.unit_price * item.quantity)}</Text>
              </View>
            ))}
            {(order.items ?? []).some((i) => i.notes) ? (
              <View style={styles.notes}>
                {(order.items ?? []).filter((i) => i.notes).map((i) => (
                  <Text key={`n-${i.id}`} style={styles.note}>{i.name}: {i.notes}</Text>
                ))}
              </View>
            ) : null}

            <View style={styles.divider} />

            <Row label="Target" value={`${order.target_minutes} min`} />
            {order.decline_reason ? <Row label="Decline reason" value={order.decline_reason} /> : null}
            <Row label="Total" value={formatNaira(order.total_amount)} />

            <Pressable style={styles.closeBtn} onPress={close}>
              <MaterialIcons name="close" size={20} color="#fff" />
              <Text style={styles.closeLabel}>CLOSE</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

function AssignRow({ label, value, canChange, onChange }: { label: string; value: string; canChange: boolean; onChange: () => void }) {
  return (
    <View style={styles.assignRow}>
      <Text style={styles.meta} numberOfLines={1}>{label}: {value}</Text>
      {canChange ? (
        <Pressable style={styles.changeBtn} onPress={onChange} hitSlop={6}>
          <MaterialIcons name="swap-horiz" size={16} color={colors.navy} />
          <Text style={styles.changeText}>Change</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '82%', paddingHorizontal: 24, paddingBottom: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 10 },
  body: { paddingVertical: 16, gap: 6, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...type.timer, color: colors.deepNavy },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  status: { ...type.labelSm, color: colors.inkSecondary },
  sub: { ...type.headlineSm, color: colors.ink, marginTop: 4, marginBottom: 2 },
  meta: { ...type.bodyMd, color: colors.inkSecondary, flexShrink: 1 },
  assignRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 2 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.fillHigh, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  changeText: { ...type.labelSm, color: colors.navy, letterSpacing: 0 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  backText: { ...type.headlineSm, color: colors.deepNavy },
  empty: { ...type.bodyMd, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  candidate: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.fillLow, borderRadius: 12, padding: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  candidateName: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy, flex: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 4, gap: 8 },
  itemName: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy, flexShrink: 1 },
  itemPrice: { ...type.bodyMd, color: colors.inkSecondary },
  notes: { marginTop: 6, gap: 4 },
  note: { ...type.bodyMd, fontStyle: 'italic', color: colors.outline },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 },
  kvLabel: { ...type.bodyMd, color: colors.inkSecondary },
  kvValue: { ...type.bodyMd, fontFamily: fonts.bold, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  closeBtn: { marginTop: 20, minHeight: 48, borderRadius: 12, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  closeLabel: { ...type.labelLg, color: '#fff' },
});
