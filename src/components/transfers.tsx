import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Order } from '@/api/types';
import { useIncomingTransfers, useRespondTransfer, useSendTransfer, useTransferTargets } from '@/api/hooks';
import { Button } from '@/components/ui';
import { departmentLabel } from '@/lib/roles';
import { colors, fonts, type } from '@/theme';

/**
 * A "Send" button for an order card. Opens a sheet of eligible teammates
 * (waitresses for a waiter, same-station chefs for a chef) and offers the order
 * to the one picked; they then accept or decline.
 */
export function SendTransferButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const targets = useTransferTargets(open ? order.id : null);
  const send = useSendTransfer();
  const [note, setNote] = useState<string | null>(null);

  const offer = (toUserId: number) => {
    setNote(null);
    send.mutate(
      { orderId: order.id, toUserId },
      {
        onSuccess: () => {
          setNote('Sent — waiting for them to accept.');
          setTimeout(() => setOpen(false), 900);
        },
        onError: () => setNote('Could not send — try again.'),
      },
    );
  };

  return (
    <>
      <Pressable style={styles.sendBtn} onPress={() => setOpen(true)}>
        <MaterialIcons name="send" size={18} color={colors.navy} />
        <Text style={styles.sendText}>Send</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Send order #{order.id}</Text>
          <Text style={styles.sheetSub}>Pick a teammate to hand this order to.</Text>

          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
            {targets.isLoading ? (
              <Text style={styles.muted}>Loading teammates…</Text>
            ) : targets.isError ? (
              <Text style={styles.muted}>Couldn&apos;t load teammates. Pull to retry.</Text>
            ) : (targets.data?.data ?? []).length === 0 ? (
              <Text style={styles.muted}>
                No one to send this to yet. Add more staff in Settings → Team, then try again.
              </Text>
            ) : (
              (targets.data?.data ?? []).map((t) => (
                <Pressable key={t.id} style={styles.target} onPress={() => offer(t.id)} disabled={send.isPending}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{(t.name?.[0] ?? '?').toUpperCase()}</Text></View>
                  <Text style={styles.targetName}>{t.name}</Text>
                  <MaterialIcons name="send" size={18} color={colors.navy} />
                </Pressable>
              ))
            )}
          </ScrollView>

          {note ? <Text style={styles.note}>{note}</Text> : null}
          <Button label="Close" variant="secondary" onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </>
  );
}

/**
 * Drop this on any staff screen. Polls for transfers offered to the signed-in
 * user and pops an accept/decline prompt — the receiving half of a hand-off.
 */
export function IncomingTransfers() {
  const incoming = useIncomingTransfers(5000);
  const respond = useRespondTransfer();
  const current = incoming.data?.data?.[0] ?? null;

  if (!current) return null;

  const items = current.order?.items ?? [];

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.popupBackdrop}>
        <View style={styles.popupCard}>
          <View style={styles.popupIcon}><MaterialIcons name="move-to-inbox" size={32} color="#fff" /></View>
          <Text style={styles.popupKicker}>ORDER SENT TO YOU</Text>
          <Text style={styles.popupTitle}>Order #{current.order_id} from {current.from ?? 'a teammate'}</Text>
          {current.order ? (
            <Text style={styles.popupBody}>
              {departmentLabel(current.order.department)}
              {current.order.guest_ref ? ` · ${current.order.guest_ref}` : ''}
              {items.length ? `\n${items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}` : ''}
            </Text>
          ) : null}
          <View style={styles.popupActions}>
            <View style={{ flex: 1 }}>
              <Button label="Decline" variant="danger" onPress={() => respond.mutate({ id: current.id, action: 'decline' })} loading={respond.isPending} />
            </View>
            <View style={{ flex: 1.2 }}>
              <Button label="Accept" onPress={() => respond.mutate({ id: current.id, action: 'accept' })} loading={respond.isPending} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sendBtn: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.fillHigh, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  sendText: { ...type.labelLg, color: colors.navy, textTransform: 'uppercase' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 8 },
  sheetTitle: { ...type.headlineSm, color: colors.deepNavy },
  sheetSub: { ...type.bodyMd, color: colors.inkSecondary },
  muted: { ...type.bodyMd, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  target: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.fillLow, borderRadius: 12, padding: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  targetName: { ...type.bodyLg, fontFamily: fonts.bold, color: colors.deepNavy, flex: 1 },
  note: { ...type.bodyMd, color: colors.greenLabel, fontFamily: fonts.semibold, textAlign: 'center' },
  popupBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  popupCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, width: '100%', maxWidth: 380 },
  popupIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  popupKicker: { ...type.labelSm, color: colors.navy, letterSpacing: 1 },
  popupTitle: { ...type.headlineSm, color: colors.deepNavy, textAlign: 'center' },
  popupBody: { ...type.bodyMd, color: colors.inkSecondary, textAlign: 'center' },
  popupActions: { flexDirection: 'row', gap: 10, marginTop: 14, alignSelf: 'stretch' },
});
