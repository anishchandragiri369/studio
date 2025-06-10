
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elixr.app',
  appName: 'Elixr',
  webDir: 'out', // Corresponds to Next.js static export directory
  server: {
    androidScheme: 'https', // Recommended for Android
    // For local development with live reload, you might temporarily set:
    // hostname: 'localhost:9002', // Your Next.js dev server
    // androidScheme: 'http',
    // iosScheme: 'http',
    // But for production builds, use the static webDir.
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff", // Example: white
      // androidSplashResourceName: "splash",
      // iosSplashResourceName: "Splash",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#F2994A", // Your primary color
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
