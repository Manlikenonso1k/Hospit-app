import Constants from 'expo-constants';

type Extra = {
  variant?: string;
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const API_PORT = 8000;

/**
 * In Expo dev, the device reached Metro at the PC's LAN IP — so the API lives at
 * that SAME IP on port 8000. Deriving it from the Metro host means a changing
 * DHCP address never needs a manual .env edit; restart Metro and it just follows.
 * Returns null on web/localhost so the plain localhost fallback is used there.
 */
function devApiFromMetroHost(): string | null {
  const anyConstants = Constants as unknown as {
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    manifest?: { debuggerHost?: string };
  };

  const hostUri =
    Constants.expoConfig?.hostUri ??
    anyConstants.expoGoConfig?.debuggerHost ??
    anyConstants.manifest2?.extra?.expoGo?.debuggerHost ??
    anyConstants.manifest?.debuggerHost;

  if (!hostUri) return null;

  const host = String(hostUri).split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;

  return `http://${host}:${API_PORT}/api`;
}

const variant = extra.variant ?? 'development';
const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

/**
 * Resolution order:
 *   1. EXPO_PUBLIC_API_BASE_URL (explicit override — e.g. to point at staging).
 *   2. In development: the Metro host's LAN IP (phone) → localhost (web/same PC).
 *      The app.config placeholder is intentionally NOT used in dev so it can't
 *      shadow localhost on web.
 *   3. In staging/production: the per-variant URL baked into app.config.ts.
 */
function resolveApiBaseUrl(): string {
  if (explicit && explicit.length > 0) return explicit;

  if (variant === 'development') {
    return devApiFromMetroHost() ?? `http://localhost:${API_PORT}/api`;
  }

  return extra.apiBaseUrl ?? `http://localhost:${API_PORT}/api`;
}

export const config = {
  variant,
  apiBaseUrl: resolveApiBaseUrl(),
};
