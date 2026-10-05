/// <reference types="node" />
import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Three build variants (dev / staging / prod). EAS sets APP_VARIANT per profile
 * (see eas.json); the API base URL is read from EXPO_PUBLIC_API_BASE_URL so it
 * is never hardcoded — for local dev it points at the PC's LAN IP, NOT localhost
 * (on a phone, localhost means the phone itself). See RUN_LOCAL.md in the
 * Laravel repo for how to find your IPv4 with `ipconfig`.
 */
type Variant = 'development' | 'staging' | 'production';

const VARIANT = (process.env.APP_VARIANT as Variant) ?? 'development';

const API_BASE_URL_BY_VARIANT: Record<Variant, string> = {
  development: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.0.100:8000/api',
  staging: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://staging.icelandbeach.com/api',
  production: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://icelandbeach.com/api',
};

const NAME_BY_VARIANT: Record<Variant, string> = {
  development: 'Hospi Sales (Dev)',
  staging: 'Hospi Sales (Staging)',
  production: 'Hospi Sales',
};

const BUNDLE_ID_BY_VARIANT: Record<Variant, string> = {
  development: 'com.icelandbeach.hospisales.dev',
  staging: 'com.icelandbeach.hospisales.staging',
  production: 'com.icelandbeach.hospisales',
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAME_BY_VARIANT[VARIANT],
  slug: 'hospi-sales',
  scheme: 'hospisales',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID_BY_VARIANT[VARIANT],
  },
  android: {
    package: BUNDLE_ID_BY_VARIANT[VARIANT],
    adaptiveIcon: {
      backgroundColor: '#002F61',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#002F61',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#002F61',
      },
    ],
  ],
  extra: {
    variant: VARIANT,
    apiBaseUrl: API_BASE_URL_BY_VARIANT[VARIANT],
    router: {},
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
  },
});
