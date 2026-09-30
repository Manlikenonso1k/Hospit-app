import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMe } from '@/api/hooks';
import { useLogout } from '@/api/auth';
import { AppHeader } from '@/components/AppHeader';
import { Button, Card, Loading } from '@/components/ui';
import { config } from '@/config';
import { colors } from '@/theme/colors';

export default function AccountScreen() {
  const me = useMe();
  const logout = useLogout();

  if (!me.data) return <View style={{ flex: 1, backgroundColor: colors.bg }}><Loading /></View>;

  const { user, tenant } = me.data;

  const doLogout = () =>
    logout.mutate(undefined, { onSettled: () => router.replace('/welcome') });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader me={me.data} subtitle="Settings" />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.roles}>{user.roles.join(' · ')}</Text>
          <View style={styles.divider} />
          <Row label="Business" value={tenant?.name ?? '—'} />
          {user.email ? <Row label="Email" value={user.email} /> : null}
          {user.phone ? <Row label="Phone" value={user.phone} /> : null}
          {user.department ? <Row label="Department" value={user.department} /> : null}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Connection</Text>
          <Row label="Environment" value={config.variant} />
          <Row label="API" value={config.apiBaseUrl} />
        </Card>

        <Button label="Log out" variant="danger" onPress={doLogout} loading={logout.isPending} />
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  roles: { fontSize: 14, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4, marginBottom: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 12 },
  rowLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
