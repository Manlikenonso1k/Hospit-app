import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useAcceptOrder,
  useCurrentShift,
  useDeclineOrder,
  useEndShift,
  useMarkAllRead,
  useMe,
  useOrders,
  useReadyOrder,
  useStartShift,
  useUnreadCount,
} from '@/api/hooks';
import type { Order } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { OrderTicketCard } from '@/components/OrderTicketCard';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { departmentLabel } from '@/lib/roles';
import { serverNow, useOverduePulse } from '@/lib/clock';
import { colors, fonts, type } from '@/theme';

// The chef polls faster than other roles so a manager nudge lands quickly.
const CHEF_POLL = 5000;
// A nudge stays "hot" (flashing banner) for this long after it fires.
const NUDGE_HOT_MS = 5 * 60_000;

function orderLocation(o: Order): string {
  if (o.guest_ref) return o.guest_ref;
  if (o.table_id) return `Table ${o.table_id}`;
  return 'a guest';
}

export default function KitchenScreen() {
  const me = useMe();
  const queue = useOrders({}, CHEF_POLL);
  const unread = useUnreadCount(CHEF_POLL);
  const markRead = useMarkAllRead();
  const accept = useAcceptOrder();
  const ready = useReadyOrder();
  const decline = useDeclineOrder();

  const [declineFor, setDeclineFor] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [nudgePopup, setNudgePopup] = useState<Order | null>(null);

  const orders = useMemo(
    () => (queue.data?.data ?? []).filter((o) => ['pending', 'accepted'].includes(o.status)),
    [queue.data],
  );

  // Detect a NEW manager nudge between polls and pop a loud alert.
  const seenNudges = useRef<Map<number, string>>(new Map());
  const seeded = useRef(false);
  useEffect(() => {
    const data = queue.data?.data ?? [];
    if (!seeded.current) {
      data.forEach((o) => o.last_nudged_at && seenNudges.current.set(o.id, o.last_nudged_at));
      seeded.current = true;
      return;
    }
    let fresh: Order | null = null;
    for (const o of data) {
      if (!o.last_nudged_at) continue;
      const prev = seenNudges.current.get(o.id);
      if (prev !== o.last_nudged_at) {
        seenNudges.current.set(o.id, o.last_nudged_at);
        if (['pending', 'accepted'].includes(o.status)) fresh = o;
      }
    }
    if (fresh) setNudgePopup(fresh);
  }, [queue.data]);

  const submitDecline = () => {
    if (!declineFor) return;
    if (reason.trim() === '') {
      setReasonError('A reason is required to decline.');
      return;
    }
    decline.mutate(
      { orderId: declineFor.id, reason: reason.trim() },
      { onSuccess: () => { setDeclineFor(null); setReason(''); setReasonError(null); } },
    );
  };

  if (!me.data) return <View style={styles.root}><Loading /></View>;

  const dept = me.data.user.department;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader
          me={me.data}
          subtitle={dept ? departmentLabel(dept) : 'Kitchen'}
          unreadCount={unread.data?.count ?? 0}
          online={!queue.isError}
          onOpenNotifications={() => markRead.mutate()}
        />
      </SafeAreaView>

      <ShiftBar department={dept} />

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <QueueItem order={item} accept={accept} ready={ready} onDecline={() => setDeclineFor(item)} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          queue.isLoading ? (
            <Loading label="Loading your queue…" />
          ) : queue.isError ? (
            <ErrorState message="Could not load the kitchen queue." onRetry={() => queue.refetch()} />
          ) : (
            <EmptyState title="Queue is clear" subtitle="New tickets for your kitchen land here." />
          )
        }
      />

      <NudgePopup order={nudgePopup} onDismiss={() => setNudgePopup(null)} />

      <Modal visible={!!declineFor} transparent animationType="slide" onRequestClose={() => setDeclineFor(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Decline order #{declineFor?.id}</Text>
            <Text style={styles.sheetSub}>A reason is required — the waitress and managers will see it.</Text>
            <TextInput
              style={[styles.reasonInput, reasonError && { borderColor: colors.red }]}
              placeholder="e.g. Out of snapper"
              placeholderTextColor={colors.textMuted}
              value={reason}
              onChangeText={(t) => { setReason(t); if (reasonError) setReasonError(null); }}
              multiline
            />
            {reasonError ? <Text style={styles.reasonErr}>{reasonError}</Text> : null}
            <View style={styles.sheetActions}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={() => { setDeclineFor(null); setReason(''); setReasonError(null); }} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Decline" variant="danger" onPress={submitDecline} loading={decline.isPending} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function QueueItem({
  order,
  accept,
  ready,
  onDecline,
}: {
  order: Order;
  accept: ReturnType<typeof useAcceptOrder>;
  ready: ReturnType<typeof useReadyOrder>;
  onDecline: () => void;
}) {
  const hot = !!order.last_nudged_at && serverNow() - new Date(order.last_nudged_at).getTime() < NUDGE_HOT_MS;

  return (
    <View>
      {hot ? <NudgeBanner /> : null}
      <OrderTicketCard
        order={order}
        actions={
          order.status === 'pending' ? (
            <>
              <View style={{ flex: 1 }}>
                <Button label="Accept" onPress={() => accept.mutate(order.id)} loading={accept.isPending} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Decline" variant="danger" onPress={onDecline} />
              </View>
            </>
          ) : (
            <View style={{ flex: 1 }}>
              <Button label="Mark ready" onPress={() => ready.mutate(order.id)} loading={ready.isPending} />
            </View>
          )
        }
      />
    </View>
  );
}

function NudgeBanner() {
  const pulse = useOverduePulse();
  return (
    <Animated.View style={[styles.nudgeBanner, { opacity: pulse }]}>
      <MaterialIcons name="notifications-active" size={18} color="#fff" />
      <Text style={styles.nudgeBannerText}>MANAGER NUDGE — HURRY THIS ORDER</Text>
    </Animated.View>
  );
}

function NudgePopup({ order, onDismiss }: { order: Order | null; onDismiss: () => void }) {
  return (
    <Modal visible={!!order} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.popupBackdrop}>
        <View style={styles.popupCard}>
          <View style={styles.popupIcon}>
            <MaterialIcons name="notifications-active" size={34} color="#fff" />
          </View>
          <Text style={styles.popupKicker}>MANAGER NUDGE</Text>
          <Text style={styles.popupTitle}>Order #{order?.id} needs attention now</Text>
          {order ? (
            <Text style={styles.popupBody}>
              {departmentLabel(order.department)} · {orderLocation(order)}. The manager is waiting on this one.
            </Text>
          ) : null}
          <Pressable style={styles.popupBtn} onPress={onDismiss}>
            <Text style={styles.popupBtnText}>ON IT</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ShiftBar({ department }: { department: string | null }) {
  const current = useCurrentShift();
  const start = useStartShift();
  const end = useEndShift();
  const shift = current.data?.data ?? null;
  const onShift = !!shift;

  return (
    <View style={styles.shiftBar}>
      <View style={styles.shiftLeft}>
        <View style={[styles.shiftDot, { backgroundColor: onShift ? colors.green : colors.grey }]} />
        <Text style={styles.shiftText}>
          {onShift ? `On shift • ${departmentLabel(shift!.department)}` : 'Off shift'}
        </Text>
      </View>
      <Pressable
        style={[styles.shiftBtn, { backgroundColor: onShift ? colors.muted : colors.navy }]}
        onPress={() => (onShift ? end.mutate() : start.mutate(department ?? undefined))}
        disabled={start.isPending || end.isPending}
        hitSlop={6}
      >
        <Text style={[styles.shiftBtnText, { color: onShift ? colors.navy : '#fff' }]}>
          {onShift ? 'End shift' : 'Start shift'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, flexGrow: 1 },
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.overdue,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: -4,
  },
  nudgeBannerText: { ...type.labelSm, color: '#fff', letterSpacing: 0.4 },
  popupBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  popupCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, width: '100%', maxWidth: 360 },
  popupIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.overdue, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  popupKicker: { ...type.labelSm, color: colors.overdue, letterSpacing: 1 },
  popupTitle: { ...type.headlineSm, color: colors.deepNavy, textAlign: 'center' },
  popupBody: { ...type.bodyMd, color: colors.inkSecondary, textAlign: 'center' },
  popupBtn: { marginTop: 12, height: 52, borderRadius: 12, backgroundColor: colors.overdue, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  popupBtnText: { ...type.labelLg, color: '#fff', fontFamily: fonts.extrabold },
  shiftBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shiftLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shiftDot: { width: 10, height: 10, borderRadius: 5 },
  shiftText: { fontSize: 14, fontWeight: '700', color: colors.text },
  shiftBtn: { minHeight: 36, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  shiftBtnText: { fontSize: 13, fontWeight: '800' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: 14, color: colors.textMuted },
  reasonInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, minHeight: 90, fontSize: 16, color: colors.text, textAlignVertical: 'top' },
  reasonErr: { color: colors.red, fontSize: 13 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
