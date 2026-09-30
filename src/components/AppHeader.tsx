import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Me } from '@/api/types';
import { colors } from '@/theme/colors';

/**
 * White-label sticky header: tenant logo + business name (from /api/me, never
 * hardcoded), the current role, and an optional overdue count on the bell.
 */
export function AppHeader({
  me,
  subtitle,
  overdueCount = 0,
}: {
  me: Me;
  subtitle?: string;
  overdueCount?: number;
}) {
  const tenant = me.tenant;
  const role = me.user.roles[0] ?? 'Staff';
  const initial = (me.user.name?.[0] ?? '?').toUpperCase();

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.logoWell}>
          {tenant?.logo_url ? (
            <Image source={{ uri: tenant.logo_url }} style={styles.logo} resizeMode="contain" />
          ) : (
            <Ionicons name="business" size={18} color={colors.navy} />
          )}
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.brand} numberOfLines={1}>
            {tenant?.name ?? 'Hospi Sales'}
          </Text>
          <View style={styles.roleRow}>
            <View style={styles.roleDot} />
            <Text style={styles.role}>{role.toUpperCase()}</Text>
            {subtitle ? <Text style={styles.subtitle}> · {subtitle}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <View>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {overdueCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{overdueCount > 9 ? '9+' : overdueCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logoWell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 28, height: 28 },
  brand: { fontSize: 16, fontWeight: '800', color: colors.text },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  roleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green, marginRight: 5 },
  role: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  subtitle: { fontSize: 11, color: colors.textMuted },
  right: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.red,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
