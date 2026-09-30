import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMe } from '@/api/hooks';
import { useAuthStore } from '@/store/authStore';
import { usePushRegistration } from '@/lib/push';
import { homeForRoles } from '@/lib/roles';
import { Loading } from '@/components/ui';
import { colors } from '@/theme/colors';

type TabName = 'board' | 'order' | 'kitchen' | 'revenue' | 'hosts' | 'account';

/** Which tabs each home surfaces. Account is always present (profile + logout). */
const TABS_BY_HOME: Record<string, TabName[]> = {
  manager: ['board', 'order', 'kitchen', 'account'],
  waitress: ['order', 'account'],
  chef: ['kitchen', 'account'],
  ceo: ['revenue', 'account'],
  host: ['hosts', 'account'],
};

const ICONS: Record<TabName, keyof typeof Ionicons.glyphMap> = {
  board: 'flame',
  order: 'add-circle',
  kitchen: 'restaurant',
  revenue: 'bar-chart',
  hosts: 'bed',
  account: 'settings',
};

const LABELS: Record<TabName, string> = {
  board: 'Orders',
  order: 'Take Order',
  kitchen: 'Kitchen',
  revenue: 'Revenue',
  hosts: 'Hosts',
  account: 'Settings',
};

export default function AppLayout() {
  const token = useAuthStore((s) => s.token);
  const me = useMe();

  usePushRegistration(!!token && !!me.data);

  if (!token) return <Redirect href="/welcome" />;

  if (me.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading label="Loading your workspace…" />
      </View>
    );
  }

  if (me.isError || !me.data) return <Redirect href="/welcome" />;

  const home = homeForRoles(me.data.user.roles);
  const visible = new Set(TABS_BY_HOME[home] ?? ['account']);
  const allTabs: TabName[] = ['board', 'order', 'kitchen', 'revenue', 'hosts', 'account'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 88,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      {allTabs.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: LABELS[name],
            href: visible.has(name) ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={ICONS[name]} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
