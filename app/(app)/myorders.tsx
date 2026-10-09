import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useCompleteOrder,
  useMarkAllRead,
  useMe,
  useOrders,
  useUnreadCount,
} from '@/api/hooks';
import type { Order } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { OrderTicketCard } from '@/components/OrderTicketCard';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { departmentLabel } from '@/lib/roles';
import { playAlert } from '@/lib/alert';
import { useOverduePulse } from '@/lib/clock';
import { IncomingTransfers, SendTransferButton } from '@/components/transfers';
import { colors, fonts, type } from '@/theme';

const POLL = 5000; // snappy so "ready" alerts land quickly

function orderLocation(o: Order): string {
  if (o.guest_ref) return o.guest_ref;
  if (o.table_id) return `Table ${o.table_id}`;
  return 'a guest';
}

const STATUS_RANK: Record<string, number> = { ready: 0, accepted: 1, pending: 2, completed: 3, declined: 4, cancelled: 5 };

export default function MyOrdersScreen() {
  const me = useMe();
  const mine = useOrders({}, POLL); // server scopes a waitress to her own orders
  const unread = useUnreadCount(POLL);
  const markRead = useMarkAllRead();
  const complete = useCompleteOrder();

  const [readyPopup, setReadyPopup] = useState<Order | null>(null);

  const orders = useMemo(() => {
    const data = (mine.data?.data ?? []).filter((o) => o.status !== 'cancelled');
    return [...data].sort((a, b) => {
      const r = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      if (r !== 0) return r;
      return new Date(b.placed_at ?? '').getTime() - new Date(a.placed_at ?? '').getTime();
    });
  }, [mine.data]);

  // Pop a loud alert the moment one of my orders becomes ready.
  const seenReady = useRef<Map<number, string>>(new Map());
  const seeded = useRef(false);
  useEffect(() => {
    const data = mine.data?.data ?? [];
    if (!seeded.current) {
      data.forEach((o) => o.ready_at && seenReady.current.set(o.id, o.ready_at));
      seeded.current = true;
      return;
    }
    let fresh: Order | null = null;
    for (const o of data) {
      if (!o.ready_at) continue;
      if (seenReady.current.get(o.id) !== o.ready_at) {
        seenReady.current.set(o.id, o.ready_at);
        if (o.status === 'ready') fresh = o;
      }
    }
    if (fresh) {
      setReadyPopup(fresh);
      void playAlert();
    }
  }, [mine.data]);

  if (!me.data) return <View style={styles.root}><Loading /></View>;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader
          me={me.data}
          subtitle="My Orders"
          unreadCount={unread.data?.count ?? 0}
          online={!mine.isError}
          onOpenNotifications={() => markRead.mutate()}
        />
      </SafeAreaView>

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View>
            {item.status === 'ready' ? <ReadyBanner /> : null}
            <OrderTicketCard
              order={item}
              suppressActions
              actions={
                item.status === 'ready' ? (
                  <>
                    <View style={{ flex: 1 }}>
                      <Button label="Mark served" onPress={() => complete.mutate(item.id)} loading={complete.isPending} />
                    </View>
                    <SendTransferButton order={item} />
                  </>
                ) : ['pending', 'accepted'].includes(item.status) ? (
                  <SendTransferButton order={item} />
                ) : undefined
              }
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          mine.isLoading ? (
            <Loading label="Loading your orders…" />
          ) : mine.isError ? (
            <ErrorState message="Could not load your orders." onRetry={() => mine.refetch()} />
          ) : (
            <EmptyState title="No orders yet" subtitle="Orders you place show up here — you'll be alerted when each is ready." />
          )
        }
      />

      <ReadyPopup order={readyPopup} onDismiss={() => setReadyPopup(null)} />
      <IncomingTransfers />
    </View>
  );
}

function ReadyBanner() {
  const pulse = useOverduePulse();
  return (
    <Animated.View style={[styles.readyBanner, { opacity: pulse }]}>
      <MaterialIcons name="room-service" size={18} color="#fff" />
      <Text style={styles.readyBannerText}>READY — PICK UP & SERVE</Text>
    </Animated.View>
  );
}

function ReadyPopup({ order, onDismiss }: { order: Order | null; onDismiss: () => void }) {
  return (
    <Modal visible={!!order} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.popupBackdrop}>
        <View style={styles.popupCard}>
          <View style={styles.popupIcon}>
            <MaterialIcons name="room-service" size={34} color="#fff" />
          </View>
          <Text style={styles.popupKicker}>ORDER READY</Text>
          <Text style={styles.popupTitle}>Order #{order?.id} is ready to serve</Text>
          {order ? (
            <Text style={styles.popupBody}>
              Pick it up from {departmentLabel(order.department)} for {orderLocation(order)}.
            </Text>
          ) : null}
          <Pressable style={styles.popupBtn} onPress={onDismiss}>
            <Text style={styles.popupBtnText}>ON MY WAY</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, flexGrow: 1 },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.greenEdge,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: -4,
  },
  readyBannerText: { ...type.labelSm, color: '#fff', letterSpacing: 0.4 },
  popupBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  popupCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, width: '100%', maxWidth: 360 },
  popupIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.greenEdge, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  popupKicker: { ...type.labelSm, color: colors.greenLabel, letterSpacing: 1 },
  popupTitle: { ...type.headlineSm, color: colors.deepNavy, textAlign: 'center' },
  popupBody: { ...type.bodyMd, color: colors.inkSecondary, textAlign: 'center' },
  popupBtn: { marginTop: 12, height: 52, borderRadius: 12, backgroundColor: colors.greenEdge, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  popupBtnText: { ...type.labelLg, color: '#fff', fontFamily: fonts.extrabold },
});
