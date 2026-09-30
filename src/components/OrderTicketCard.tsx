import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Order } from '@/api/types';
import { colors, statusHex } from '@/theme/colors';
import { departmentLabel } from '@/lib/roles';
import { formatCountdown } from '@/lib/format';
import { useCountdown } from '@/lib/useCountdown';

function locationLabel(order: Order): string {
  if (order.guest_ref) return order.guest_ref;
  if (order.table_id) return `Table ${order.table_id}`;
  return 'Walk-up';
}

function timerLabel(order: Order, seconds: number): string {
  if (order.completed_at) return 'DONE';
  if (order.status === 'declined') return 'DECLINED';
  return seconds < 0 ? 'OVERDUE' : 'LEFT';
}

/**
 * The core order ticket. The left accent, timer badge and progress bar all key
 * off the SERVER's status_colour — the app never recomputes the traffic light.
 * Footer actions are passed in so the same card serves manager, chef and runner.
 */
export function OrderTicketCard({ order, actions }: { order: Order; actions?: ReactNode }) {
  const seconds = useCountdown(order.seconds_remaining);
  const accent = statusHex(order.status_colour);
  const showAccent = order.status_colour === 'red' || order.status_colour === 'amber';

  const totalSecs = Math.max(1, order.target_minutes * 60);
  const elapsed = totalSecs - seconds;
  const progress = Math.max(0, Math.min(1, elapsed / totalSecs));

  return (
    <View style={[styles.card, showAccent && { borderLeftWidth: 6, borderLeftColor: accent }]}>
      <View style={styles.headerRow}>
        <Text style={styles.location} numberOfLines={2}>
          {locationLabel(order)}
        </Text>
        <View style={styles.headerRight}>
          <View style={styles.idPill}>
            <Text style={styles.idText}>#{order.id}</Text>
          </View>
          <View style={[styles.timer, { backgroundColor: accent + '22' }]}>
            <Text style={[styles.timerValue, { color: accent }]}>
              {order.completed_at ? '✓' : formatCountdown(seconds)}
            </Text>
            <Text style={[styles.timerLabel, { color: accent }]}>{timerLabel(order, seconds)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.items}>
        {(order.items ?? []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemMain}>
              <Text style={styles.qty}>{item.quantity}× </Text>
              {item.name}
            </Text>
            <Text style={styles.itemMeta}>{departmentLabel(order.department)}</Text>
          </View>
        ))}
        {order.items?.some((i) => i.notes) &&
          order.items
            .filter((i) => i.notes)
            .map((i) => (
              <Text key={`note-${i.id}`} style={styles.note}>
                {i.notes}
              </Text>
            ))}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
      </View>

      {order.status === 'declined' && order.decline_reason ? (
        <Text style={styles.declineReason}>Declined: {order.decline_reason}</Text>
      ) : null}

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  location: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, flexShrink: 1 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  idPill: { backgroundColor: colors.muted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  idText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  timer: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 84 },
  timerValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  items: { gap: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemMain: { fontSize: 16, fontWeight: '500', color: colors.text, flexShrink: 1 },
  qty: { fontWeight: '800', color: colors.navy },
  itemMeta: { fontSize: 13, color: colors.textMuted },
  note: { fontSize: 14, fontStyle: 'italic', color: colors.textMuted },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: colors.muted, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 999 },
  declineReason: { fontSize: 13, color: colors.red, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
});
