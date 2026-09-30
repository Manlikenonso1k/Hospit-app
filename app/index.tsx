import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useMe } from '@/api/hooks';
import { useAuthStore } from '@/store/authStore';
import { homeForRoles, HOME_ROUTE } from '@/lib/roles';
import { Loading } from '@/components/ui';
import { colors } from '@/theme/colors';

/**
 * Boot router. Waits for the secure-store token to hydrate, then:
 *  - no token        -> Welcome
 *  - token + /api/me -> the role's home (role comes from the server, never a pick)
 *  - token but /me 401 -> the client cleared it, so we fall back to Welcome
 */
export default function Boot() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  const me = useMe();

  useEffect(() => {
    // no-op; presence keeps this a client component with the query mounted
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/welcome" />;
  }

  if (me.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading label="Signing you in…" />
      </View>
    );
  }

  if (me.isError || !me.data) {
    // 401 already cleared the token in the client; send them to Welcome.
    return <Redirect href="/welcome" />;
  }

  const home = homeForRoles(me.data.user.roles);
  return <Redirect href={HOME_ROUTE[home] as never} />;
}
