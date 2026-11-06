import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.capricorn.fitmamma',
  appName: 'Fit Mamma',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    // CSS owns safe-area insets — automatic inset + our padding double-shrinks / skews width
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scheme: 'Fit Mamma',
  },
  plugins: {},
};

export default config;
