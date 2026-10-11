import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useRegisterDevice } from '@/api/hooks';

// Remote push was removed from Expo Go in SDK 53. When running inside Expo Go we
// skip all notification work so the app loads for local UI/flow testing. Push
// works normally in a development build / EAS build.
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Android notification channels. Created up front so they appear in
 * Settings → Apps → Hospi → Notifications, where the user can change each
 * channel's sound to any ringtone. A channel's sound/importance are fixed once
 * created, so to change them we'd bump the channel id — not edit in place.
 */
async function setupAndroidChannels(N: typeof import('expo-notifications')): Promise<void> {
  await N.setNotificationChannelAsync('default', {
    name: 'General',
    importance: N.AndroidImportance.HIGH,
  });
  await N.setNotificationChannelAsync('overdue-orders', {
    name: 'Overdue orders',
    importance: N.AndroidImportance.MAX, // heads-up popup + sound, even on lock screen
    sound: 'overdue_alarm', // bundled via app.config expo-notifications "sounds"
    vibrationPattern: [0, 600, 250, 600, 250, 900],
    enableVibrate: true,
    lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    lightColor: '#DC2626',
  });
}

/**
 * Requests notification permission, creates the Android channels, gets this
 * device's Expo push token, and registers it so the server can page this user
 * (new order, overdue). Tapping a notification opens the order board.
 * Best-effort: skips silently in Expo Go, on a simulator, or without a projectId.
 */
export function usePushRegistration(enabled: boolean) {
  const register = useRegisterDevice();

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS === 'web') return; // no device push in the browser (dev testing)
    if (isExpoGo) {
      if (__DEV__) console.log('Push skipped in Expo Go — use a development build to test push.');
      return;
    }
    let cancelled = false;
    let responseSub: { remove: () => void } | undefined;

    (async () => {
      try {
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

        // Channels first — they must exist regardless of permission so the user
        // can see and tune them in Android settings.
        if (Platform.OS === 'android') {
          await setupAndroidChannels(Notifications);
        }

        // Open the board when a notification is tapped.
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as
            | { type?: string; order_id?: number }
            | undefined;
          if (data?.type === 'order.overdue' || data?.order_id != null) {
            router.push('/(app)/board');
          }
        });

        if (!Device.isDevice) return; // channels created; token needs a real device

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== 'granted') {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== 'granted') return;

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
      responseSub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
