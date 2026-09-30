import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMe } from '@/api/hooks';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState, Loading } from '@/components/ui';
import { colors } from '@/theme/colors';

export default function RevenueScreen() {
  const me = useMe();
  if (!me.data) return <View style={{ flex: 1, backgroundColor: colors.bg }}><Loading /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <AppHeader me={me.data} subtitle="Revenue" />
      </SafeAreaView>
      <EmptyState
        title="Revenue dashboard"
        subtitle="Cross-department revenue lands here in a later phase. Order accountability ships first."
      />
    </View>
  );
}
