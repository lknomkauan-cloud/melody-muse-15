import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor config for the Android/iOS native build of Solando.
// The mic is granted via AndroidManifest (RECORD_AUDIO) + iOS Info.plist (NSMicrophoneUsageDescription).
const config: CapacitorConfig = {
  appId: 'app.solando',
  appName: 'Solando',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // No web permission prompt inside the native WebView — the OS handles it.
  },
};

export default config;
