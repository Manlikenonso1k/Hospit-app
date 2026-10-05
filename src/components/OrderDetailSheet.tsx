import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Order } from '@/api/types';
import { colors, fonts, statusHex, type } from '@/theme';
import { departmentLabel } from '@/lib/roles';
import { formatNaira, minutesSince } from '@/lib/format';
import { serverNow } from '@/lib/clock';

/**
 * Order detail sheet (the order_board_states_detail_sheet design), shown as a
 * bottom Modal. Read-only breakdown of one order; the board card opens it.
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
  return (
    <Modal visible={visible && !!order} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {order ? (
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
            <Text style={styles.meta}>
              Server: {order.placed_by ?? '-'} ({minutesSince(order.placed_at, serverNow())}m ago)
            </Text>
            <Text style={styles.meta}>
              Chef: {order.chef ?? 'Unassigned'}
            </Text>

            <View style={styles.divider} />

            {(order.items ?? []).map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity}{'× '}{item.name}
                </Text>
                <Text style={styles.itemPrice}>{formatNaira(item.unit_price * item.quantity)}</Text>
              </View>
            ))}
            {(order.items ?? []).some((i) => i.notes) ? (
              <View style={styles.notes}>
                {(order.items ?? [])
                  .filter((i) => i.notes)
                  .map((i) => (
                    <Text key={`n-${i.id}`} style={styles.note}>
                      {i.name}: {i.notes}
                    </Text>
                  ))}
              </View>
            ) : null}

            <View style={styles.divider} />

            <Row label="Target" value={`${order.target_minutes} min`} />
            {order.decline_reason ? <Row label="Decline reason" value={order.decline_reason} /> : null}
            <Row label="Total" value={formatNaira(order.total_amount)} />

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color="#fff" />
              <Text style={styles.closeLabel}>CLOSE</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
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
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 10 },
  body: { paddingVertical: 16, gap: 6, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...type.timer, color: colors.deepNavy },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  status: { ...type.labelSm, color: colors.inkSecondary },
  sub: { ...type.headlineSm, color: colors.ink, marginTop: 4 },
  meta: { ...type.bodyMd, color: colors.inkSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 4, gap: 8 },
  itemName: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy, flexShrink: 1 },
  itemPrice: { ...type.bodyMd, color: colors.inkSecondary },
  notes: { marginTop: 6, gap: 4 },
  note: { ...type.bodyMd, fontStyle: 'italic', color: colors.outline },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 },
  kvLabel: { ...type.bodyMd, color: colors.inkSecondary },
  kvValue: { ...type.bodyMd, fontFamily: fonts.bold, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  closeBtn: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeLabel: { ...type.labelLg, color: '#fff' },
});
