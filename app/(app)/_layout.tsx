import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMe } from '@/api/hooks';
import { useAuthStore } from '@/store/authStore';
import { usePushRegistration } from '@/lib/push';
import { homeForRoles } from '@/lib/roles';
import { Loading } from '@/components/ui';
import { colors, fonts } from '@/theme';

type TabName = 'board' | 'order' | 'kitchen' | 'revenue' | 'hosts' | 'account' | 'menu' | 'myorders' | 'staff' | 'tables';

/** Which tabs each home surfaces. Manager matches spec J's five-tab bar. */
const TABS_BY_HOME: Record<string, TabName[]> = {
  manager: ['board', 'order', 'kitchen', 'revenue', 'account'],
  waitress: ['myorders', 'order', 'account'],
  chef: ['kitchen', 'account'],
  ceo: ['board', 'revenue', 'account'],
  host: ['hosts', 'account'],
};

// Spec J glyphs. 'skillet' is not a MaterialIcons name → substituted with
// 'soup-kitchen' (nearest MaterialIcons glyph).
const ICONS: Record<TabName, keyof typeof MaterialIcons.glyphMap> = {
  board: 'local-fire-department',
  order: 'add-circle',
  kitchen: 'soup-kitchen',
  revenue: 'bar-chart',
  hosts: 'bed',
  account: 'tune',
  menu: 'restaurant-menu',
  myorders: 'receipt-long',
  staff: 'people',
  tables: 'deck',
};

const LABELS: Record<TabName, string> = {
  board: 'Orders',
  order: 'Take Order',
  kitchen: 'Kitchen',
  revenue: 'Ops',
  hosts: 'Hosts',
  account: 'Settings',
  menu: 'Menu',
  myorders: 'My Orders',
  staff: 'Staff',
  tables: 'Tables',
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
  // 'menu' is a navigable route (manager menu management), never a tab.
  const allTabs: TabName[] = ['board', 'order', 'kitchen', 'revenue', 'hosts', 'account', 'menu', 'myorders', 'staff', 'tables'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.inkSecondary,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
      }}
    >
      {allTabs.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: LABELS[name],
            href: visible.has(name) ? undefined : null,
            tabBarIcon: ({ color }) => <MaterialIcons name={ICONS[name]} size={24} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
