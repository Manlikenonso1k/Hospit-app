import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRegisterDevice } from '@/api/hooks';

// Remote push was removed from Expo Go in SDK 53. When running inside Expo Go we
// skip all notification work so the app loads for local UI/flow testing. Push
// works normally in a development build / EAS build.
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Requests notification permission, gets this device's Expo push token, and
 * registers it so the server can page this user (new order, overdue).
 * Best-effort: skips silently in Expo Go, on a simulator, or without a projectId.
 */
export function usePushRegistration(enabled: boolean) {
  const register = useRegisterDevice();

  useEffect(() => {
    if (!enabled) return;
    if (isExpoGo) {
      if (__DEV__) console.log('Push skipped in Expo Go — use a development build to test push.');
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        if (!Device.isDevice) return;

        // Lazy import so expo-notifications is never loaded inside Expo Go.
        const Notifications = await import('expo-notifications');

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== 'granted') {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
          });
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId || undefined;
        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );

        if (cancelled || !tokenResponse?.data) return;

        register.mutate({
          expo_token: tokenResponse.data,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
      } catch {
        // Push is an enhancement; never block the app on it.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
