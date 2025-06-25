
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elixr.app',
  appName: 'Elixr',
  webDir: 'dist', // This will be created by our build process
  server: {
    androidScheme: 'https',
    // For development with live reload:
    url: 'http://localhost:9002',
    cleartext: true
    
    // For production, comment out the url above and use webDir
  },plugins: {
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
      style: 'DEFAULT',
      backgroundColor: '#ffffff',
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
