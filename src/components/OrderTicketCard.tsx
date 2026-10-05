import { ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Order, OrderItem } from '@/api/types';
import { useExpediteOrder, useNudgeOrder } from '@/api/hooks';
import { AMBER_URGENT_THRESHOLD, colors, fonts, type } from '@/theme';
import { departmentLabel } from '@/lib/roles';
import { formatClock, formatElapsedLong, minutesSince } from '@/lib/format';
import { useOverduePulse, useTick } from '@/lib/clock';

type Kind = 'overdue' | 'amber-urgent' | 'amber-fresh' | 'green' | 'grey' | 'declined';

function kindOf(order: Order, elapsedSecs: number): Kind {
  if (order.status === 'declined') return 'declined';
  if (order.status_colour === 'red') return 'overdue';
  if (order.status_colour === 'amber') {
    const pct = order.target_minutes > 0 ? (elapsedSecs / (order.target_minutes * 60)) * 100 : 0;
    return pct >= AMBER_URGENT_THRESHOLD ? 'amber-urgent' : 'amber-fresh';
  }
  if (order.status_colour === 'green') return 'green';
  return 'grey';
}

const EDGE: Record<Kind, string> = {
  overdue: colors.cardEdgeRed,
  declined: colors.cardEdgeRed,
  'amber-urgent': colors.amberEdge,
  'amber-fresh': colors.amberEdge,
  green: colors.greenEdge,
  grey: colors.greyLate,
};

function location(order: Order): string | null {
  if (order.guest_ref) return order.guest_ref;
  if (order.table_id) return `Table ${order.table_id}`;
  return null;
}

export function OrderTicketCard({
  order,
  actions,
  suppressActions,
  onOpenDetail,
  onToast,
}: {
  order: Order;
  actions?: ReactNode;
  suppressActions?: boolean;
  onOpenDetail?: (order: Order) => void;
  onToast?: (orderId: number) => void;
}) {
  const now = useTick();
  const placedMs = order.placed_at ? new Date(order.placed_at).getTime() : now;
  const elapsedSecs = Math.max(0, Math.floor((now - placedMs) / 1000));
  const targetSecs = Math.max(1, order.target_minutes * 60);
  const kind = kindOf(order, elapsedSecs);
  const isActive = kind === 'overdue' || kind === 'amber-urgent' || kind === 'amber-fresh';

  return (
    <Pressable style={styles.card} onPress={() => onOpenDetail?.(order)} accessibilityRole="button">
      <View style={[styles.edge, { backgroundColor: EDGE[kind] }]} />

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.line1}>
            <Text style={styles.orderId}>#{order.id}</Text>
            {location(order) ? <Text style={styles.locText}>{' • '}{location(order)}</Text> : null}
            <DeptBadge order={order} kind={kind} />
          </View>
          <Text style={styles.line2} numberOfLines={1}>
            {order.completed_at
              ? `Taken by: Server ${order.placed_by ?? '-'}`
              : `Server: ${order.placed_by ?? '-'} (${minutesSince(order.placed_at, now)}m ago)`}
          </Text>
        </View>

        <TimerColumn order={order} kind={kind} elapsedSecs={elapsedSecs} targetSecs={targetSecs} />
      </View>

      {isActive ? (
        <>
          <ItemsBox items={order.items ?? []} />
          <ProgressBlock kind={kind} elapsedSecs={elapsedSecs} targetSecs={targetSecs} />
        </>
      ) : null}

      {kind === 'declined' && order.decline_reason ? (
        <Text style={styles.declineReason}>Declined: {order.decline_reason}</Text>
      ) : null}

      <ActionRow order={order} kind={kind} actions={actions} suppressActions={suppressActions} onOpenDetail={onOpenDetail} onToast={onToast} />
    </Pressable>
  );
}

function DeptBadge({ order, kind }: { order: Order; kind: Kind }) {
  const palette =
    kind === 'overdue' || kind === 'declined'
      ? { bg: colors.overdueTint, fg: colors.overdueTintText }
      : kind === 'amber-urgent'
        ? { bg: colors.amberTint, fg: colors.amberBadgeText }
        : kind === 'amber-fresh'
          ? { bg: colors.fillHighest, fg: colors.inkSecondary }
          : { bg: colors.greenChip, fg: colors.greenDark };

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{departmentLabel(order.department)}</Text>
    </View>
  );
}

function TimerColumn({
  order,
  kind,
  elapsedSecs,
  targetSecs,
}: {
  order: Order;
  kind: Kind;
  elapsedSecs: number;
  targetSecs: number;
}) {
  const pulse = useOverduePulse();

  if (kind === 'green' || kind === 'grey') {
    const late = kind === 'grey';
    return (
      <View style={styles.timerCol}>
        <MaterialIcons name="check-circle" size={26} color={late ? colors.greyLate : colors.greenIcon} />
        <Text style={[styles.timerLabel, { color: late ? colors.greyLate : colors.greenLabel }]}>
          {late ? 'DELIVERED LATE' : 'DELIVERED'}
        </Text>
      </View>
    );
  }

  if (kind === 'declined') {
    return (
      <View style={styles.timerCol}>
        <MaterialIcons name="cancel" size={26} color={colors.overdue} />
        <Text style={[styles.timerLabel, { color: colors.overdue }]}>DECLINED</Text>
      </View>
    );
  }

  if (kind === 'overdue') {
    const overtime = Math.max(0, elapsedSecs - targetSecs);
    return (
      <View style={styles.timerCol}>
        <View style={styles.timerRow}>
          <Animated.View style={{ opacity: pulse }}>
            <MaterialIcons name="priority-high" size={20} color={colors.overdue} />
          </Animated.View>
          <Text style={[styles.timerValue, { color: colors.overdue }]}>{formatClock(overtime)}</Text>
        </View>
        <Text style={[styles.timerLabel, { color: colors.overdue }]}>OVERDUE</Text>
      </View>
    );
  }

  // amber (urgent or fresh)
  const remaining = Math.max(0, targetSecs - elapsedSecs);
  return (
    <View style={styles.timerCol}>
      <Text style={[styles.timerValue, { color: colors.amberTimer }]}>{formatClock(remaining)}</Text>
      <Text style={[styles.timerLabel, { color: colors.amberTimer }]}>LEFT</Text>
    </View>
  );
}

function ItemsBox({ items }: { items: OrderItem[] }) {
  return (
    <View style={styles.itemsBox}>
      {items.map((item) => {
        const note = item.notes ?? '';
        const flag = /spic|allerg/i.test(note);
        return (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity}{'× '}{item.name}
            </Text>
            {note ? (
              <Text style={[styles.itemNote, flag && styles.itemNoteFlag]} numberOfLines={1}>
                {note}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function ProgressBlock({
  kind,
  elapsedSecs,
  targetSecs,
}: {
  kind: Kind;
  elapsedSecs: number;
  targetSecs: number;
}) {
  const pct = Math.min(100, (elapsedSecs / targetSecs) * 100);
  const track =
    kind === 'overdue' ? colors.overdueTint : kind === 'amber-urgent' ? colors.amberTint : colors.fillHigh;
  const fill = kind === 'overdue' ? colors.overdue : colors.amberEdge;
  const textColor =
    kind === 'overdue' ? colors.overdue : kind === 'amber-urgent' ? colors.amberText : colors.inkSecondary;
  const targetMin = Math.round(targetSecs / 60);

  return (
    <View style={styles.progressBlock}>
      <View style={[styles.progressTrack, { backgroundColor: track }]}>
        <View style={[styles.progressFill, { width: `${kind === 'overdue' ? 100 : pct}%`, backgroundColor: fill }]} />
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressTarget, { color: textColor }]}>Target: {targetMin}m</Text>
        <Text style={[styles.progressElapsed, { color: textColor }]}>Elapsed: {formatElapsedLong(elapsedSecs)}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  order,
  kind,
  actions,
  suppressActions,
  onOpenDetail,
  onToast,
}: {
  order: Order;
  kind: Kind;
  actions?: ReactNode;
  suppressActions?: boolean;
  onOpenDetail?: (order: Order) => void;
  onToast?: (orderId: number) => void;
}) {
  // Completed cards always show the footer strip and never buttons — regardless
  // of whether a screen supplied its own actions.
  if (kind === 'green' || kind === 'grey') {
    const late = kind === 'grey';
    const mins =
      order.completed_at && order.placed_at
        ? Math.max(0, Math.round((new Date(order.completed_at).getTime() - new Date(order.placed_at).getTime()) / 60000))
        : 0;
    return (
      <View style={[styles.strip, { backgroundColor: late ? colors.greyLateBg : colors.greenTint }]}>
        <View style={styles.stripLeft}>
          <MaterialIcons name="schedule" size={18} color={late ? colors.greyLate : colors.greenIcon} />
          <Text style={[styles.stripText, { color: late ? colors.greyLate : colors.greenDark }]}>
            {late ? 'Delivered late' : 'Delivered on time'} ({mins}m / {order.target_minutes}m target)
          </Text>
        </View>
        <View style={[styles.stripPill, { backgroundColor: late ? colors.fillHigh : 'rgba(167,243,208,0.6)' }]}>
          <Text style={[styles.stripPillText, { color: late ? colors.greyLate : colors.greenLabel }]}>{mins}m</Text>
        </View>
      </View>
    );
  }

  // A screen that passes its own actions (e.g. the chef queue: Accept / Decline /
  // Mark ready) replaces the manager buttons entirely.
  if (actions) {
    return <View style={styles.actionRow}>{actions}</View>;
  }

  // Read-only contexts (e.g. the waitress My Orders) hide the manager buttons.
  if (suppressActions) {
    return null;
  }

  if (kind === 'overdue') {
    return <OverdueActions order={order} onOpenDetail={onOpenDetail} onToast={onToast} />;
  }
  if (kind === 'amber-urgent') {
    return <ExpediteButton order={order} />;
  }
  if (kind === 'amber-fresh') {
    return (
      <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => onOpenDetail?.(order)}>
        <MaterialIcons name="receipt-long" size={20} color={colors.navy} />
        <Text style={[styles.btnLabel, { color: colors.navy }]}>VIEW DETAILS</Text>
      </Pressable>
    );
  }
  return null; // declined: reason shown above, no action
}

function Spinner() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <MaterialIcons name="refresh" size={20} color="#fff" />
    </Animated.View>
  );
}

function OverdueActions({
  order,
  onOpenDetail,
  onToast,
}: {
  order: Order;
  onOpenDetail?: (order: Order) => void;
  onToast?: (orderId: number) => void;
}) {
  const nudge = useNudgeOrder();
  const [phase, setPhase] = useState<'idle' | 'nudging' | 'paged'>(order.last_nudged_at ? 'paged' : 'idle');
  const label = order.department === 'main_kitchen' ? 'NUDGE KITCHEN' : 'NUDGE STATION';

  const onNudge = () => {
    if (phase !== 'idle') return;
    setPhase('nudging');
    nudge.mutate(order.id, {
      onSuccess: () => onToast?.(order.id),
      onError: () => setPhase('idle'),
    });
    setTimeout(() => setPhase((p) => (p === 'nudging' ? 'paged' : p)), 450);
  };

  const paged = phase === 'paged';

  return (
    <View style={styles.actionRow}>
      <Pressable
        style={[styles.btn, { flex: 1, backgroundColor: paged ? colors.navy : colors.overdue }]}
        onPress={onNudge}
        disabled={phase !== 'idle'}
      >
        {phase === 'nudging' ? (
          <>
            <Spinner />
            <Text style={styles.btnLabel}>NUDGING...</Text>
          </>
        ) : paged ? (
          <>
            <MaterialIcons name="done-all" size={20} color="#fff" />
            <Text style={styles.btnLabel}>PAGED STATIONS</Text>
          </>
        ) : (
          <>
            <MaterialIcons name="notifications-active" size={20} color="#fff" />
            <Text style={styles.btnLabel}>{label}</Text>
          </>
        )}
      </Pressable>

      {/* No server phone in the payload, so this opens the detail sheet (spec fallback). */}
      <Pressable style={styles.squareBtn} onPress={() => onOpenDetail?.(order)}>
        <MaterialIcons name="more-vert" size={22} color={colors.navy} />
      </Pressable>
    </View>
  );
}

function ExpediteButton({ order }: { order: Order }) {
  const expedite = useExpediteOrder();
  const [done, setDone] = useState(!!order.expedited_at);

  return (
    <Pressable
      style={[styles.btn, { backgroundColor: colors.navy }]}
      disabled={done || expedite.isPending}
      onPress={() => expedite.mutate(order.id, { onSuccess: () => setDone(true) })}
    >
      {expedite.isPending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <MaterialIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.btnLabel}>{done ? 'EXPEDITED' : 'MARK EXPEDITED'}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    paddingLeft: 18,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerLeft: { flexShrink: 1, gap: 2 },
  line1: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  orderId: { ...type.headlineSm, fontFamily: fonts.bold, color: colors.deepNavy },
  locText: { ...type.headlineSm, color: colors.ink },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { ...type.labelSm, fontFamily: fonts.extrabold },
  line2: { ...type.bodyMd, color: colors.inkSecondary, marginTop: 2 },
  timerCol: { alignItems: 'flex-end', flexShrink: 0, gap: 2 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  timerValue: { ...type.timer },
  timerLabel: { ...type.labelSm },
  itemsBox: { backgroundColor: colors.fillLow, borderRadius: 8, padding: 12, marginVertical: 8, gap: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  itemName: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy, flexShrink: 1 },
  itemNote: { ...type.labelMd, color: colors.outline, flexShrink: 1, textAlign: 'right' },
  itemNoteFlag: { color: colors.overdue, fontFamily: fonts.semibold },
  progressBlock: { marginTop: 4, marginBottom: 12, gap: 6 },
  progressTrack: { height: 12, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 12, borderRadius: 999 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTarget: { ...type.labelMd, fontFamily: fonts.semibold },
  progressElapsed: { ...type.labelMd, fontFamily: fonts.bold },
  declineReason: { ...type.bodyMd, color: colors.overdue, fontFamily: fonts.semibold },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  btnSecondary: { backgroundColor: colors.fillHigh },
  btnLabel: { ...type.labelLg, color: '#fff', textTransform: 'uppercase' },
  squareBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.fillHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  stripText: { ...type.labelMd, fontFamily: fonts.bold, flexShrink: 1 },
  stripPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  stripPillText: { ...type.labelSm, fontFamily: fonts.extrabold },
});
