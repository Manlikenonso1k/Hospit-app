import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Audible + tactile alert for the moments that need a head-up even when the
 * phone is in a pocket on a noisy floor: a new ticket for the chef, a manager
 * nudge, or an order going ready for the waiter. Pairs the existing on-screen
 * flash with a short chime and a haptic buzz.
 *
 * Everything is lazy-imported and wrapped in try/catch so it degrades to
 * silence (never a crash) on web, in Expo Go, or if a module is unavailable.
 * Honours the user's "Alert sounds" setting.
 */
let player: { seekTo?: (s: number) => void; play: () => void } | null = null;

async function getPlayer() {
  if (player) return player;
  const audio = await import('expo-audio');
  try {
    await audio.setAudioModeAsync?.({ playsInSilentMode: true } as never);
  } catch {
    // older/newer API shape — fine, just play at the default mode
  }
  // Static require so Metro bundles the asset.
  player = audio.createAudioPlayer(require('../../assets/alert.wav'));
  return player;
}

export async function playAlert(): Promise<void> {
  if (!useSettingsStore.getState().soundEnabled) return;

  // Haptic buzz (native only; no-op on web).
  if (Platform.OS !== 'web') {
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // haptics unavailable — sound alone is enough
    }
  }

  try {
    const p = await getPlayer();
    try {
      p.seekTo?.(0);
    } catch {
      // some platforms can't seek a just-loaded clip; play from current head
    }
    p.play();
  } catch {
    // audio module unavailable (e.g. restricted web context) — stay silent
  }
}
