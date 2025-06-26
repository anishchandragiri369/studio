import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elixr.app',
  appName: 'Elixr',
  webDir: 'out', // Use Next.js static export output
  server: {
    androidScheme: 'https',
    // For development with live reload:
    // url: 'http://192.168.29.232:9002',
    cleartext: true
    // For production, comment out the url above and use webDir
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#F2994A",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlaysWebView: false, // Prevent status bar from overlaying the web view
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    App: {
      disallowOverscroll: true,
    },
    Haptics: {},
    Network: {},
  },
};

export default config;
