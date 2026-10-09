import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMe, useRevenue } from '@/api/hooks';
import type { Department, DepartmentRevenue, RevenuePeriod } from '@/api/types';
import { AppHeader } from '@/components/AppHeader';
import { ErrorState, Loading } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import { departmentLabel } from '@/lib/roles';
import { colors, fonts, type } from '@/theme';

const PERIODS: { key: RevenuePeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const DEPT_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  main_kitchen: 'restaurant',
  grill_kitchen: 'outdoor-grill',
  barbecue: 'local-fire-department',
  ice_cream: 'icecream',
  gate_sales: 'confirmation-number',
  hosts: 'people',
  front_desk: 'room-service',
};

// A stable accent per department card, cycled by revenue rank.
const DEPT_ACCENTS = [colors.navy, colors.amber, colors.green, colors.grey];

export default function RevenueScreen() {
  const me = useMe();
  const [period, setPeriod] = useState<RevenuePeriod>('today');
  const [manualRefresh, setManualRefresh] = useState(false);
  const dash = useRevenue(period);

  const onRefresh = async () => {
    setManualRefresh(true);
    try {
      await dash.refetch();
    } finally {
      setManualRefresh(false);
    }
  };

  if (!me.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading />
      </View>
    );
  }

  const canStaff = me.data.user.roles.some((r) =>
    ['CEO', 'Manager', 'Super Admin', 'Admin'].includes(r),
  );
  const d = dash.data;
  const firstLoad = !d && dash.isLoading;
  // keepPreviousData means `d` can still be the previous period while the new
  // one loads — that's the signal we're mid-switch.
  const switching = !!d && d.period !== period;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader me={me.data} subtitle="Operations" />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={manualRefresh} onRefresh={onRefresh} tintColor={colors.navy} />
        }
      >
        {/* Period switcher */}
        <View style={styles.switcher}>
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[styles.switchTab, active && styles.switchTabActive]}
              >
                <View style={styles.switchInner}>
                  <Text style={[styles.switchText, active && styles.switchTextActive]}>{p.label}</Text>
                  {active && switching ? <ActivityIndicator size="small" color={colors.navy} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {firstLoad ? (
          <RevenueSkeleton />
        ) : dash.isError && !d ? (
          <View style={{ paddingTop: 48 }}>
            <ErrorState message="Could not load the dashboard." onRetry={() => dash.refetch()} />
          </View>
        ) : !d ? null : (
          <>
            {/* Critical overdue alert */}
            {d.overdue_count > 0 && (
              <View style={styles.alert}>
                <View style={styles.alertIcon}>
                  <MaterialIcons name="warning" size={22} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {d.overdue_count} Overdue {d.overdue_count === 1 ? 'Ticket' : 'Tickets'}
                  </Text>
                  <Text style={styles.alertSub}>Avg delay {d.avg_delay_minutes}m across stations</Text>
                </View>
                <Pressable style={styles.alertBtn} onPress={() => router.push('/(app)/board')}>
                  <Text style={styles.alertBtnText}>Triage</Text>
                </Pressable>
              </View>
            )}

            {/* Master revenue hero */}
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>TOTAL GROSS REVENUE</Text>
              <Text style={styles.heroValue}>{formatNaira(d.total_gross)}</Text>
              <Text style={styles.heroMeta}>
                {d.orders_fulfilled} {d.orders_fulfilled === 1 ? 'order' : 'orders'} fulfilled ·{' '}
                {PERIODS.find((p) => p.key === period)?.label.toLowerCase()}
              </Text>
            </View>

            {/* KPI mini-grid */}
            <View style={styles.kpiRow}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>AVERAGE TICKET</Text>
                <Text style={styles.kpiValue}>{formatNaira(d.avg_ticket)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>ORDERS FULFILLED</Text>
                <Text style={styles.kpiValue}>{d.orders_fulfilled}</Text>
              </View>
            </View>

            {/* Department breakdown */}
            <Text style={styles.section}>Department Revenue</Text>
            {d.departments.length === 0 ? (
              <Text style={styles.empty}>No orders in this period yet.</Text>
            ) : (
              d.departments.map((dept, i) => (
                <DepartmentCard key={dept.department} dept={dept} accent={DEPT_ACCENTS[i % DEPT_ACCENTS.length]} />
              ))
            )}

            {/* Delay accountability */}
            <Text style={styles.section}>Who's Delaying Orders</Text>
            <View style={styles.delayCard}>
              <DelayList
                title="Kitchen (cook delays)"
                icon="soup-kitchen"
                entries={d.delays.chefs}
                emptyText="No cook delays — every station on time."
                unit="late"
              />
              <View style={styles.delayDivider} />
              <DelayList
                title="Waitresses (slow pickup)"
                icon="room-service"
                entries={d.delays.waitresses}
                emptyText="No slow pickups — orders collected promptly."
                unit="slow"
              />
            </View>

            {canStaff && (
              <Pressable style={styles.staffBtn} onPress={() => router.push('/(app)/staff')}>
                <MaterialIcons name="group-add" size={20} color={colors.navy} />
                <Text style={styles.staffBtnText}>Team & accounts</Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
              </Pressable>
            )}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DepartmentCard({ dept, accent }: { dept: DepartmentRevenue; accent: string }) {
  const icon = DEPT_ICON[dept.department as Department] ?? 'storefront';
  return (
    <View style={styles.deptCard}>
      <View style={styles.deptTop}>
        <View style={[styles.deptIcon, { backgroundColor: accent + '1A' }]}>
          <MaterialIcons name={icon} size={22} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deptName}>{departmentLabel(dept.department)}</Text>
          <Text style={styles.deptSub}>
            {dept.tickets} {dept.tickets === 1 ? 'ticket' : 'tickets'}
            {dept.avg_prep_minutes != null ? ` · avg prep ${dept.avg_prep_minutes}m` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.deptRevenue}>{formatNaira(dept.revenue)}</Text>
          <Text style={styles.deptShare}>{dept.share}%</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, dept.share)}%`, backgroundColor: accent }]} />
      </View>

      {dept.overdue > 0 ? (
        <View style={styles.deptOverdue}>
          <MaterialIcons name="error-outline" size={14} color={colors.red} />
          <Text style={styles.deptOverdueText}>
            {dept.overdue} overdue now
          </Text>
        </View>
      ) : (
        <View style={styles.deptOverdue}>
          <MaterialIcons name="check-circle" size={14} color={colors.green} />
          <Text style={[styles.deptOverdueText, { color: colors.greenLabel }]}>On time</Text>
        </View>
      )}
    </View>
  );
}

function DelayList({
  title,
  icon,
  entries,
  emptyText,
  unit,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  entries: { name: string; count: number }[];
  emptyText: string;
  unit: string;
}) {
  return (
    <View>
      <View style={styles.delayHead}>
        <MaterialIcons name={icon} size={18} color={colors.navy} />
        <Text style={styles.delayTitle}>{title}</Text>
      </View>
      {entries.length === 0 ? (
        <Text style={styles.delayEmpty}>{emptyText}</Text>
      ) : (
        entries.map((e) => (
          <View key={e.name} style={styles.delayRow}>
            <Text style={styles.delayName} numberOfLines={1}>
              {e.name}
            </Text>
            <View style={styles.delayCount}>
              <Text style={styles.delayCountText}>
                {e.count} {unit}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function RevenueSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.skelBlock, { height: 120 }]} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.skelBlock, { flex: 1, height: 74 }]} />
        <View style={[styles.skelBlock, { flex: 1, height: 74 }]} />
      </View>
      <View style={[styles.skelBlock, { height: 108 }]} />
      <View style={[styles.skelBlock, { height: 108 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16 },
  skelBlock: { backgroundColor: colors.fillHigh, borderRadius: 16 },

  switcher: {
    flexDirection: 'row',
    backgroundColor: colors.fillLow,
    borderRadius: 14,
    padding: 4,
  },
  switchTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  switchInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchTabActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  switchText: { ...type.labelMd, color: colors.textMuted },
  switchTextActive: { color: colors.navy },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.overdue,
    borderRadius: 16,
    padding: 14,
  },
  alertIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  alertSub: { fontFamily: fonts.medium, fontSize: 13, color: '#ffffffcc', marginTop: 2 },
  alertBtn: { backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  alertBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.overdue },

  hero: {
    backgroundColor: colors.navyDark,
    borderRadius: 20,
    padding: 22,
  },
  heroLabel: { ...type.labelSm, color: '#A9C7FF' },
  heroValue: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 42, color: colors.white, marginTop: 8 },
  heroMeta: { fontFamily: fonts.medium, fontSize: 14, color: '#ffffffb3', marginTop: 6 },

  kpiRow: { flexDirection: 'row', gap: 12 },
  kpi: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  kpiLabel: { ...type.labelSm, color: colors.outline },
  kpiValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.navy, marginTop: 6 },

  section: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, marginTop: 4 },
  empty: { ...type.bodyMd, color: colors.textMuted },

  deptCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  deptTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deptIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deptName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  deptSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  deptRevenue: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  deptShare: { fontFamily: fonts.semibold, fontSize: 13, color: colors.outline, marginTop: 2 },

  progressTrack: { height: 8, borderRadius: 999, backgroundColor: colors.fillHigh, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999 },

  deptOverdue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deptOverdueText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.red },

  delayCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  delayDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  delayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  delayTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  delayEmpty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  delayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  delayName: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink, flex: 1, marginRight: 12 },
  delayCount: { backgroundColor: colors.overdueTint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  delayCountText: { fontFamily: fonts.bold, fontSize: 12, color: colors.overdueTintText },

  staffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  staffBtnText: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
});
