import type { CapacitorConfig } from '@capacitor/cli';

// Solando — build nativo Android/iOS.
// O app é SSR (TanStack Start), então o WebView nativo carrega a versão publicada.
// Microfone: RECORD_AUDIO no AndroidManifest + NSMicrophoneUsageDescription no iOS.
const config: CapacitorConfig = {
  appId: 'app.solando',
  appName: 'Solando',
  webDir: 'dist',
  server: {
    url: 'https://melody-muse-15.lovable.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
