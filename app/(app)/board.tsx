import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBoard, useCompleteOrder, useMe, POLL } from '@/api/hooks';
import type { Order } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { OrderTicketCard } from '@/components/OrderTicketCard';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { colors } from '@/theme/colors';

export default function BoardScreen() {
  const me = useMe();
  const board = useBoard(undefined, POLL.managerBoard);
  const complete = useCompleteOrder();

  const orders = board.data?.data ?? [];
  const overdue = useMemo(() => orders.filter((o) => o.status_colour === 'red' && !o.completed_at), [orders]);
  const active = useMemo(
    () => orders.filter((o) => !o.completed_at && o.status !== 'cancelled' && o.status !== 'declined'),
    [orders],
  );

  const state: 'clear' | 'peak' | 'rush' =
    overdue.length === 0 ? 'clear' : overdue.length <= 2 ? 'peak' : 'rush';

  if (!me.data) return <ScreenLoading />;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader me={me.data} subtitle="Order Board" overdueCount={overdue.length} />
      </SafeAreaView>

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <StateBar state={state} />
            <StatusBanner state={state} overdue={overdue.length} active={active.length} />
          </View>
        }
        renderItem={({ item }) => (
          <OrderTicketCard order={item} actions={<BoardActions order={item} onComplete={() => complete.mutate(item.id)} pending={complete.isPending} />} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          board.isLoading ? (
            <Loading label="Loading the board…" />
          ) : board.isError ? (
            <ErrorState message="Could not load the order board." onRetry={() => board.refetch()} />
          ) : (
            <EmptyState title="No active orders" subtitle="New orders appear here the moment they're placed." />
          )
        }
      />
    </View>
  );
}

function BoardActions({ order, onComplete, pending }: { order: Order; onComplete: () => void; pending: boolean }) {
  if (order.status === 'ready') {
    return <View style={{ flex: 1 }}><Button label="Complete order" onPress={onComplete} loading={pending} /></View>;
  }
  return null;
}

function StateBar({ state }: { state: 'clear' | 'peak' | 'rush' }) {
  const items: { key: typeof state; label: string; dot: string }[] = [
    { key: 'clear', label: '1. ALL CLEAR', dot: colors.green },
    { key: 'peak', label: '2. PEAK FLOW', dot: colors.amber },
    { key: 'rush', label: '3. RUSH OVERDUE', dot: colors.red },
  ];
  return (
    <View style={styles.stateBar}>
      {items.map((it) => {
        const active = it.key === state;
        return (
          <View key={it.key} style={[styles.stateChip, active && styles.stateChipActive]}>
            <View style={[styles.stateDot, { backgroundColor: it.dot }]} />
            <Text style={[styles.stateLabel, active && styles.stateLabelActive]} numberOfLines={2}>
              {it.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StatusBanner({ state, overdue, active }: { state: 'clear' | 'peak' | 'rush'; overdue: number; active: number }) {
  const bg = state === 'clear' ? colors.green : state === 'peak' ? colors.amber : colors.red;
  const title =
    state === 'clear' ? `ALL CLEAR — ${overdue} Overdue` : `${overdue} Overdue Order${overdue === 1 ? '' : 's'}`;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>{title}</Text>
        <Text style={styles.bannerSub}>{active} active ticket{active === 1 ? '' : 's'} on the floor</Text>
      </View>
      <View style={styles.pace}>
        <Text style={styles.paceText}>{active === 0 ? '—' : `${Math.max(0, 100 - overdue * 10)}%`}</Text>
      </View>
    </View>
  );
}

function ScreenLoading() {
  return (
    <View style={styles.root}>
      <Loading />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  stateBar: { flexDirection: 'row', gap: 8 },
  stateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  stateChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  stateDot: { width: 8, height: 8, borderRadius: 4 },
  stateLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, flexShrink: 1 },
  stateLabelActive: { color: '#fff' },
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, gap: 12 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontWeight: '600' },
  pace: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  paceText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
