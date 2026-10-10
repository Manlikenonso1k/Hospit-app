/// <reference types="node" />
import { existsSync } from 'node:fs';
import { ExpoConfig, ConfigContext } from 'expo/config';

// Android push (FCM) needs google-services.json embedded at build time. Only
// reference it when it's actually present so builds don't break before you add
// it. Drop the file from Firebase at the project root and it's picked up.
const googleServicesFile = existsSync('./google-services.json') ? './google-services.json' : undefined;

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
  // Preview (the APK you send your boss) runs the "staging" variant — point it at
  // the live Iceland backend so the installed app can actually log in.
  staging: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://icelandbeach.com/api',
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
  // Must match the EAS project (projectId below); the slug is Expo's internal
  // project identifier and does not affect the app's display name or package id.
  slug: 'nonso',
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
    ...(googleServicesFile ? { googleServicesFile } : {}),
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
      // The EAS project this app is linked to (eas.dev → project settings).
      projectId: process.env.EAS_PROJECT_ID ?? '5ef7f378-815d-4a1c-af5c-812e1521eb75',
    },
  },
});
