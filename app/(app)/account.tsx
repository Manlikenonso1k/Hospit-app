import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useMe, useUpdateTenant } from '@/api/hooks';
import { useLogout } from '@/api/auth';
import { AppHeader } from '@/components/AppHeader';
import { Button, Card, Loading } from '@/components/ui';
import { KITCHEN_DEPARTMENTS, SERVICE_DEPARTMENTS, departmentLabel } from '@/lib/roles';
import { useSettingsStore } from '@/store/settingsStore';
import { playAlert } from '@/lib/alert';
import { config } from '@/config';
import { colors } from '@/theme/colors';

export default function AccountScreen() {
  const me = useMe();
  const logout = useLogout();

  if (!me.data) return <View style={{ flex: 1, backgroundColor: colors.bg }}><Loading /></View>;

  const { user, tenant } = me.data;
  const isManager = user.roles.some((r) => ['Manager', 'Super Admin', 'Admin'].includes(r));
  const isStaffCreator = user.roles.some((r) => ['Manager', 'CEO', 'Super Admin', 'Admin'].includes(r));

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

        {isStaffCreator ? (
          <Card>
            <Text style={styles.sectionTitle}>Manage</Text>
            <LinkRow
              icon="people"
              title="Staff"
              sub={isManager ? 'Create waiters, chefs & hosts' : 'Create manager accounts'}
              onPress={() => router.push('/(app)/staff' as never)}
            />
            {isManager ? (
              <>
                <LinkRow icon="restaurant-menu" title="Menu & prices" sub="Add products, set prices, upload photos" onPress={() => router.push('/(app)/menu' as never)} />
                <LinkRow icon="deck" title="Tables" sub="Tables, cabanas & sunbeds" onPress={() => router.push('/(app)/tables' as never)} />
              </>
            ) : null}
          </Card>
        ) : null}

        <NotificationsCard />

        {isManager && tenant ? (
          <DepartmentsCard key={(tenant.enabled_departments ?? []).join(',')} enabled={tenant.enabled_departments ?? []} />
        ) : null}

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

/**
 * Onboarding / white-label setup: the manager chooses which stations this
 * business runs. enabled_departments flows through /api/me, so toggling here
 * reshapes the waitress kitchen picker and the manager board for everyone.
 */
function DepartmentsCard({ enabled }: { enabled: string[] }) {
  const update = useUpdateTenant();
  const [selected, setSelected] = useState<string[]>(enabled);

  const toggle = (dept: string) =>
    setSelected((cur) => (cur.includes(dept) ? cur.filter((d) => d !== dept) : [...cur, dept]));

  const changed = useMemo(
    () => [...selected].sort().join(',') !== [...enabled].sort().join(','),
    [selected, enabled],
  );
  const canSave = changed && selected.length > 0 && !update.isPending;

  return (
    <Card>
      <Text style={styles.sectionTitle}>Business setup · Departments</Text>
      <Text style={styles.hint}>
        Turn on the stations this business runs. Waiters can take orders for any enabled kitchen.
      </Text>

      <Text style={styles.groupLabel}>Kitchens</Text>
      {KITCHEN_DEPARTMENTS.map((d) => (
        <ToggleRow key={d} label={departmentLabel(d)} on={selected.includes(d)} onToggle={() => toggle(d)} />
      ))}

      <Text style={styles.groupLabel}>Other stations</Text>
      {SERVICE_DEPARTMENTS.map((d) => (
        <ToggleRow key={d} label={departmentLabel(d)} on={selected.includes(d)} onToggle={() => toggle(d)} />
      ))}

      {selected.length === 0 ? (
        <Text style={styles.warn}>Enable at least one station.</Text>
      ) : null}

      <View style={{ marginTop: 12 }}>
        <Button
          label="Save departments"
          onPress={() => update.mutate({ enabled_departments: selected })}
          disabled={!canSave}
          loading={update.isPending}
        />
      </View>
    </Card>
  );
}

/**
 * Alerts the app raises in the foreground (new order, manager nudge, order
 * ready) flash on screen; this adds an audible chime + haptic buzz so they're
 * noticed on a busy floor. Toggling it on plays the sound once as a preview.
 */
function NotificationsCard() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);

  return (
    <Card>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <Text style={styles.hint}>Play a chime and vibrate when a new order, nudge or "ready" alert pops up.</Text>
      <ToggleRow
        label="Alert sounds"
        on={soundEnabled}
        onToggle={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          if (next) void playAlert();
        }}
      />
    </Card>
  );
}

function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={on}
        onValueChange={onToggle}
        trackColor={{ true: colors.navy, false: colors.border }}
        thumbColor="#fff"
      />
    </View>
  );
}

function LinkRow({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <View style={styles.linkLeft}>
        <MaterialIcons name={icon} size={22} color={colors.navy} />
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.linkTitle}>{title}</Text>
          <Text style={styles.linkSub}>{sub}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
    </Pressable>
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
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4, marginBottom: 6, textTransform: 'uppercase' },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  groupLabel: { fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 2, letterSpacing: 0.3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 12 },
  rowLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  toggleLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  warn: { fontSize: 13, color: colors.red, marginTop: 8, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  linkSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
