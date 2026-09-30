import Constants from 'expo-constants';

type Extra = {
  variant?: string;
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * Resolved runtime config. apiBaseUrl comes from  (per build
 * variant) or an EXPO_PUBLIC_API_BASE_URL override — never hardcoded in a screen.
 */
export const config = {
  variant: extra.variant ?? 'development',
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra.apiBaseUrl ??
    'http://192.168.0.100:8000/api',
};
