import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useBoard, useMarkAllRead, useMe, useUnreadCount, POLL } from '@/api/hooks';
import type { Department, Order } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { OrderTicketCard } from '@/components/OrderTicketCard';
import { OrderDetailSheet } from '@/components/OrderDetailSheet';
import { EmptyState, ErrorState } from '@/components/ui';
import { colors, fonts, type } from '@/theme';
import { departmentLabel } from '@/lib/roles';
import { serverNow, syncServerTime } from '@/lib/clock';

type Filter = 'all' | 'overdue' | 'pending' | 'completed';

const isOverdue = (o: Order) => o.status_colour === 'red';
const isPending = (o: Order) => o.status_colour === 'amber';
const isDone = (o: Order) => o.status_colour === 'green' || o.status_colour === 'grey';

export default function BoardScreen() {
  const me = useMe();
  const board = useBoard(undefined, POLL.managerBoard); // fetch ALL; filter client-side
  const unread = useUnreadCount();
  const markRead = useMarkAllRead();

  const [station, setStation] = useState<Department | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [stationOpen, setStationOpen] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);
  const [toastId, setToastId] = useState<number | null>(null);

  const all = board.data?.data ?? [];
  const online = !board.isError && board.failureCount === 0;

  useEffect(() => {
    syncServerTime(board.data?.server_time);
  }, [board.data?.server_time]);

  // Banner counts overdue across ALL departments, never hidden by the station filter.
  const bannerOverdue = useMemo(() => all.filter(isOverdue).length, [all]);

  // Everything else reflects the current station filter.
  const stationOrders = useMemo(
    () => (station ? all.filter((o) => o.department === station) : all),
    [all, station],
  );

  const counts = useMemo(
    () => ({
      overdue: stationOrders.filter(isOverdue).length,
      pending: stationOrders.filter(isPending).length,
      completed: stationOrders.filter(isDone).length,
    }),
    [stationOrders],
  );
  const allCount = counts.overdue + counts.pending + counts.completed;

  const visible = useMemo(() => {
    const picked =
      filter === 'overdue'
        ? stationOrders.filter(isOverdue)
        : filter === 'pending'
          ? stationOrders.filter(isPending)
          : filter === 'completed'
            ? stationOrders.filter(isDone)
            : stationOrders;
    return sortBoard(picked);
  }, [stationOrders, filter]);

  const stations = useMemo(() => {
    const enabled = me.data?.tenant?.enabled_departments ?? [];
    const withQueue = new Set(all.map((o) => o.department));
    return enabled.filter((d) => withQueue.has(d));
  }, [me.data, all]);

  const onToast = (id: number) => {
    setToastId(id);
    setTimeout(() => setToastId((cur) => (cur === id ? null : cur)), 2500);
  };

  if (!me.data) {
    return <View style={styles.root}><SkeletonList /></View>;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader
          me={me.data}
          subtitle="Order Board"
          unreadCount={unread.data?.count ?? 0}
          online={online}
          onOpenAccount={() => router.push('/(app)/account' as never)}
          onOpenNotifications={() => markRead.mutate()}
        />
      </SafeAreaView>

      {/* Sticky block — pinned above the scrolling list */}
      <View>
        {bannerOverdue > 0 ? (
          <RedBanner count={bannerOverdue} onResolve={() => setFilter('overdue')} />
        ) : null}
        <SummaryRow overdue={counts.overdue} onTrack={counts.pending} done={counts.completed} />
        <FilterPills filter={filter} counts={{ ...counts, all: allCount }} onChange={setFilter} />
        <StationRow label={station ? departmentLabel(station) : 'All Departments'} onPress={() => setStationOpen(true)} />
      </View>

      <FlatList
        data={board.isLoading ? [] : visible}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <OrderTicketCard order={item} onOpenDetail={setDetail} onToast={onToast} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={board.isRefetching && !board.isLoading} onRefresh={() => board.refetch()} tintColor={colors.navy} />
        }
        ListEmptyComponent={
          board.isLoading ? (
            <SkeletonList />
          ) : board.isError ? (
            <ErrorState message="Could not load the order board." onRetry={() => board.refetch()} />
          ) : (
            <EmptyState title="No active orders" subtitle="New orders appear here the moment they're placed." />
          )
        }
      />

      <StationModal
        open={stationOpen}
        stations={stations}
        selected={station}
        onSelect={(d) => {
          setStation(d);
          setStationOpen(false);
        }}
        onClose={() => setStationOpen(false)}
      />

      <OrderDetailSheet order={detail} visible={!!detail} onClose={() => setDetail(null)} />

      {toastId != null ? <Toast orderId={toastId} /> : null}
    </View>
  );
}

/** red first (most overdue on top), then amber (closest to due), then done (most recent). */
function sortBoard(orders: Order[]): Order[] {
  const now = serverNow();
  const overtime = (o: Order) => now - new Date(o.due_at ?? o.placed_at ?? '').getTime();
  const remaining = (o: Order) => new Date(o.due_at ?? '').getTime() - now;
  const completedAt = (o: Order) => new Date(o.completed_at ?? o.placed_at ?? '').getTime();

  const reds = orders.filter(isOverdue).sort((a, b) => overtime(b) - overtime(a));
  const ambers = orders.filter(isPending).sort((a, b) => remaining(a) - remaining(b));
  const dones = orders.filter(isDone).sort((a, b) => completedAt(b) - completedAt(a));
  const others = orders.filter((o) => !isOverdue(o) && !isPending(o) && !isDone(o));
  return [...reds, ...ambers, ...dones, ...others];
}

function RedBanner({ count, onResolve }: { count: number; onResolve: () => void }) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerLeft}>
        <MaterialIcons name="error" size={24} color="#fff" />
        <Text style={styles.bannerText} numberOfLines={1}>
          {count} ORDERS OVERDUE {'—'} IMMEDIATE ATTENTION
        </Text>
      </View>
      <Pressable style={styles.resolvePill} onPress={onResolve} hitSlop={8}>
        <Text style={styles.resolveText}>RESOLVE</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

function SummaryRow({ overdue, onTrack, done }: { overdue: number; onTrack: number; done: number }) {
  return (
    <View style={styles.summaryRow}>
      <SummaryPill icon="warning" label={`${overdue} Overdue`} bg={colors.overdueTint} fg={colors.overdueTintText} />
      <SummaryPill icon="timelapse" label={`${onTrack} On Track`} bg={colors.amberTint} fg={colors.amberBadgeText} />
      <SummaryPill icon="verified" label={`${done} Done`} bg={colors.greenChip} fg={colors.greenDark} />
    </View>
  );
}

function SummaryPill({ icon, label, bg, fg }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.summaryPill, { backgroundColor: bg }]}>
      <MaterialIcons name={icon} size={18} color={fg} />
      <Text style={[styles.summaryPillText, { color: fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function FilterPills({
  filter,
  counts,
  onChange,
}: {
  filter: Filter;
  counts: { all: number; overdue: number; pending: number; completed: number };
  onChange: (f: Filter) => void;
}) {
  const pills: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'overdue', label: `Overdue (${counts.overdue})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterWrap} contentContainerStyle={styles.filterBar}>
      {pills.map((p) => {
        const selected = filter === p.key;
        const overdueUnselected = p.key === 'overdue' && !selected;
        return (
          <Pressable
            key={p.key}
            onPress={() => onChange(p.key)}
            style={[
              styles.filterPill,
              selected && styles.filterPillSelected,
              overdueUnselected && { backgroundColor: colors.overdueTint },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selected && { color: '#fff' },
                overdueUnselected && { color: colors.overdueTintText },
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function StationRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.stationRow}>
      <View style={styles.stationLeft}>
        <MaterialIcons name="storefront" size={18} color={colors.outline} />
        <Text style={styles.stationLabel}>STATION VIEW:</Text>
      </View>
      <Pressable style={styles.stationPill} onPress={onPress} hitSlop={8}>
        <Text style={styles.stationPillText}>{label}</Text>
        <MaterialIcons name="arrow-drop-down" size={18} color={colors.navy} />
      </Pressable>
    </View>
  );
}

function StationModal({
  open,
  stations,
  selected,
  onSelect,
  onClose,
}: {
  open: boolean;
  stations: Department[];
  selected: Department | null;
  onSelect: (d: Department | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.handle} />
        <Text style={styles.modalTitle}>Station view</Text>
        <StationOption label="All Departments" active={selected === null} onPress={() => onSelect(null)} />
        {stations.map((d) => (
          <StationOption key={d} label={departmentLabel(d)} active={selected === d} onPress={() => onSelect(d)} />
        ))}
      </View>
    </Modal>
  );
}

function StationOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.stationOption} onPress={onPress}>
      <Text style={[styles.stationOptionText, active && { color: colors.navy, fontFamily: fonts.bold }]}>{label}</Text>
      {active ? <MaterialIcons name="check" size={20} color={colors.navy} /> : null}
    </Pressable>
  );
}

function Toast({ orderId }: { orderId: number }) {
  return (
    <View style={styles.toast} pointerEvents="none">
      <MaterialIcons name="check-circle" size={20} color={colors.toastCheck} />
      <Text style={styles.toastText}>Order #{orderId} {'—'} Chef Paged!</Text>
      <Text style={styles.toastAck}>ACKNOWLEDGED</Text>
    </View>
  );
}

function SkeletonList() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeleton} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, flexGrow: 1 },

  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.overdue, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  bannerText: { ...type.headlineSm, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 1 },
  resolvePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  resolveText: { ...type.labelSm, color: '#fff' },

  summaryRow: { flexDirection: 'row', gap: 4, backgroundColor: colors.fillLow, paddingHorizontal: 16, paddingVertical: 8 },
  summaryPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, borderRadius: 8, paddingHorizontal: 8 },
  summaryPillText: { ...type.labelLg, flexShrink: 1 },

  filterWrap: { backgroundColor: colors.surface },
  filterBar: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterPill: { minHeight: 40, justifyContent: 'center', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.fillHigh },
  filterPillSelected: { backgroundColor: colors.navy, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  filterPillText: { ...type.labelMd, fontFamily: fonts.bold, color: colors.inkSecondary },

  stationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, paddingHorizontal: 16, paddingBottom: 10 },
  stationLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stationLabel: { ...type.labelSm, color: colors.outline, fontFamily: fonts.semibold },
  stationPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.fillLow, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  stationPillText: { ...type.labelMd, fontFamily: fonts.bold, color: colors.navy },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 10, marginBottom: 8 },
  modalTitle: { ...type.headlineSm, color: colors.deepNavy, marginBottom: 8 },
  stationOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  stationOptionText: { ...type.bodyLg, color: colors.ink },

  toast: { position: 'absolute', left: 16, right: 16, bottom: 80, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.toastBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  toastText: { ...type.bodyMd, fontFamily: fonts.bold, color: '#fff', flex: 1 },
  toastAck: { ...type.labelSm, color: colors.toastAccent },

  skeleton: { height: 150, borderRadius: 12, backgroundColor: colors.fillHigh },
});
