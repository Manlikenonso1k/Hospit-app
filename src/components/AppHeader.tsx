import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Me } from '@/api/types';
import { colors, type } from '@/theme';

/**
 * White-label sticky header (spec C). Logo + business name from /api/me (never
 * hardcoded); the dot is a real connection indicator (green when the last poll
 * succeeded, grey when failing); the bell shows the real unread count.
 */
export function AppHeader({
  me,
  subtitle = 'Order Board',
  unreadCount = 0,
  online = true,
  onOpenAccount,
  onOpenNotifications,
}: {
  me: Me;
  subtitle?: string;
  unreadCount?: number;
  online?: boolean;
  onOpenAccount?: () => void;
  onOpenNotifications?: () => void;
}) {
  const tenant = me.tenant;
  const role = (me.user.roles[0] ?? 'Staff').toUpperCase();

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.logoWell}>
          {tenant?.logo_url ? (
            <Image source={{ uri: tenant.logo_url }} style={styles.logo} resizeMode="contain" />
          ) : (
            <MaterialIcons name="storefront" size={20} color={colors.navy} />
          )}
        </View>

        <View style={{ flexShrink: 1 }}>
          <View style={styles.brandRow}>
            <Text style={styles.brand} numberOfLines={1}>
              {tenant?.name ?? 'Hospi Sales'}
            </Text>
            <View style={[styles.connDot, { backgroundColor: online ? colors.onlineDot : colors.offlineDot }]} />
          </View>

          <View style={styles.row2}>
            <Pressable style={styles.rolePill} onPress={onOpenAccount} hitSlop={6}>
              <View style={styles.roleDot} />
              <Text style={styles.roleText}>{role}</Text>
              <MaterialIcons name="expand-more" size={14} color={colors.text} />
            </Pressable>
            <Text style={styles.subtitle} numberOfLines={1}>
              {'  • '}{subtitle}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Pressable style={styles.bell} onPress={onOpenNotifications} hitSlop={4}>
          <MaterialIcons name="notifications-none" size={24} color={colors.text} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable style={styles.avatar} onPress={onOpenAccount} hitSlop={6}>
          <MaterialIcons name="person" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logoWell: {
    height: 32,
    minWidth: 32,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.fillLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { height: 32, width: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { ...type.headlineSm, color: colors.deepNavy, flexShrink: 1 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  row2: { flexDirection: 'row', alignItems: 'center', marginTop: 3, flexShrink: 1 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.fillHigh,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.navy },
  roleText: { ...type.labelSm, color: colors.text },
  subtitle: { ...type.labelMd, color: colors.outline, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.overdue,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...type.labelSm, color: '#fff', fontSize: 10, letterSpacing: 0 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
