import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.billqyro.app',
  appName: 'BillQyro',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#f8f6f1'
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
