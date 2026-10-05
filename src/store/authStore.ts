import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'hospi_sanctum_token';
const isWeb = Platform.OS === 'web';

/**
 * Token storage. On native (iOS/Android) the Sanctum token lives in the OS
 * keychain via expo-secure-store — unchanged. On web (dev testing only) we use
 * window.sessionStorage, which is PER-TAB: each browser tab keeps an independent
 * login, so you can open one role per tab. All web branches are wrapped in
 * try/catch and gated by Platform.OS === 'web' so native never hits this path.
 */
async function storageGet(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // ignore — storage may be blocked in private mode
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (isWeb) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

type AuthState = {
  token: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const token = await storageGet(TOKEN_KEY);
      set({ token: token ?? null, hydrated: true });
    } catch {
      set({ token: null, hydrated: true });
    }
  },

  setToken: async (token: string) => {
    await storageSet(TOKEN_KEY, token);
    set({ token });
  },

  clear: async () => {
    try {
      await storageDelete(TOKEN_KEY);
    } finally {
      set({ token: null });
    }
  },
}));
