import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'hospi_sanctum_token';

type AuthState = {
  token: string | null;
  hydrated: boolean;
  /** Load the persisted token on app launch. */
  hydrate: () => Promise<void>;
  /** Persist a freshly issued token (login). */
  setToken: (token: string) => Promise<void>;
  /** Wipe the token (logout / 401). */
  clear: () => Promise<void>;
};

/**
 * The Sanctum token lives in the OS keychain via expo-secure-store (never
 * AsyncStorage). `hydrated` gates the first render so we route to Welcome vs the
 * role home only once we know whether a token exists.
 */
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      set({ token: token ?? null, hydrated: true });
    } catch {
      set({ token: null, hydrated: true });
    }
  },

  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token });
  },

  clear: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } finally {
      set({ token: null });
    }
  },
}));
