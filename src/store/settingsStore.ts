import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'hospi_sound_enabled';
const isWeb = Platform.OS === 'web';

/**
 * Per-device app settings that outlive a session. Right now just the alert
 * sound toggle (new order / nudge / order-ready). Persisted in the OS keychain
 * on native and localStorage on web, so the choice sticks across launches.
 */
async function load(): Promise<boolean> {
  try {
    const v = isWeb
      ? (typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null)
      : await SecureStore.getItemAsync(KEY);
    return v === null ? true : v === '1'; // default ON
  } catch {
    return true;
  }
}

async function save(on: boolean): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== 'undefined') window.localStorage.setItem(KEY, on ? '1' : '0');
    } else {
      await SecureStore.setItemAsync(KEY, on ? '1' : '0');
    }
  } catch {
    // ignore — a dropped preference is not worth crashing over
  }
}

type SettingsState = {
  soundEnabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSoundEnabled: (on: boolean) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  hydrated: false,
  hydrate: async () => {
    const on = await load();
    set({ soundEnabled: on, hydrated: true });
  },
  setSoundEnabled: (on: boolean) => {
    set({ soundEnabled: on });
    void save(on);
  },
}));
