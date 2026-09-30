import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAcceptOrder,
  useDeclineOrder,
  useMe,
  useOrders,
  useReadyOrder,
  POLL,
} from '@/api/hooks';
import type { Order } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { OrderTicketCard } from '@/components/OrderTicketCard';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { departmentLabel } from '@/lib/roles';
import { colors } from '@/theme/colors';

export default function KitchenScreen() {
  const me = useMe();
  const queue = useOrders({}, POLL.chefQueue);
  const accept = useAcceptOrder();
  const ready = useReadyOrder();
  const decline = useDeclineOrder();

  const [declineFor, setDeclineFor] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const orders = useMemo(
    () => (queue.data?.data ?? []).filter((o) => ['pending', 'accepted'].includes(o.status)),
    [queue.data],
  );

  const submitDecline = () => {
    if (!declineFor) return;
    if (reason.trim() === '') {
      setReasonError('A reason is required to decline.');
      return;
    }
    decline.mutate(
      { orderId: declineFor.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setDeclineFor(null);
          setReason('');
          setReasonError(null);
        },
      },
    );
  };

  if (!me.data) return <View style={styles.root}><Loading /></View>;

  const dept = me.data.user.department;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader me={me.data} subtitle={dept ? departmentLabel(dept) : 'Kitchen'} />
      </SafeAreaView>

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <OrderTicketCard
            order={item}
            actions={
              item.status === 'pending' ? (
                <>
                  <View style={{ flex: 1 }}>
                    <Button label="Accept" onPress={() => accept.mutate(item.id)} loading={accept.isPending} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Decline" variant="danger" onPress={() => setDeclineFor(item)} />
                  </View>
                </>
              ) : (
                <View style={{ flex: 1 }}>
                  <Button label="Mark ready" onPress={() => ready.mutate(item.id)} loading={ready.isPending} />
                </View>
              )
            }
          />
        )}
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
              onChangeText={(t) => {
                setReason(t);
                if (reasonError) setReasonError(null);
              }}
              multiline
            />
            {reasonError ? <Text style={styles.reasonErr}>{reasonError}</Text> : null}
            <View style={styles.sheetActions}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setDeclineFor(null);
                    setReason('');
                    setReasonError(null);
                  }}
                />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, flexGrow: 1 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: 14, color: colors.textMuted },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  reasonErr: { color: colors.red, fontSize: 13 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
