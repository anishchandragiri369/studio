// Mobile app initialization and utilities
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';

class MobileApp {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Initialize status bar
      await this.initializeStatusBar();
      
      // Initialize splash screen
      await this.initializeSplashScreen();
      
      // Initialize keyboard
      await this.initializeKeyboard();
      
      // Initialize app state handlers
      await this.initializeAppHandlers();
      
      // Initialize network monitoring
      await this.initializeNetworkMonitoring();

      this.isInitialized = true;
      console.log('Mobile app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize mobile app:', error);
    }
  }

  private async initializeStatusBar() {
    if (Capacitor.getPlatform() === 'ios') {
      await StatusBar.setStyle({ style: Style.Default });
    } else if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setStyle({ style: Style.Default });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    }
  }

  private async initializeSplashScreen() {
    // Hide splash screen after app is ready
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 2000);
  }

  private async initializeKeyboard() {
    // Keyboard event listeners
    Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('Keyboard will show with height:', info.keyboardHeight);
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard will hide');
      document.body.style.setProperty('--keyboard-height', '0px');
    });
  }

  private async initializeAppHandlers() {
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
      if (isActive) {
        // App came to foreground
        this.onAppForeground();
      } else {
        // App went to background
        this.onAppBackground();
      }
    });

    // Handle deep links
    App.addListener('appUrlOpen', (event) => {
      console.log('App opened via URL:', event.url);
      this.handleDeepLink(event.url);
    });

    // Handle back button (Android)
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
  }

  private async initializeNetworkMonitoring() {
    // Monitor network status
    Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status);
      
      // Show notification to user about network status
      if (!status.connected) {
        this.showOfflineNotification();
      } else {
        this.hideOfflineNotification();
      }
    });

    // Get initial network status
    const status = await Network.getStatus();
    console.log('Current network status:', status);
  }

  private onAppForeground() {
    // Refresh data when app comes to foreground
    // You can dispatch events or call API refresh functions here
    window.dispatchEvent(new CustomEvent('app-foreground'));
  }

  private onAppBackground() {
    // Save state when app goes to background
    window.dispatchEvent(new CustomEvent('app-background'));
  }

  private handleDeepLink(url: string) {
    // Handle deep links (e.g., app://orders/123)
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Navigate to the appropriate page
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = path;
    }
  }

  private showOfflineNotification() {
    // Show offline notification
    const offlineNotification = document.createElement('div');
    offlineNotification.id = 'offline-notification';
    offlineNotification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff4444;
      color: white;
      text-align: center;
      padding: 8px;
      z-index: 9999;
      font-size: 14px;
    `;
    offlineNotification.textContent = 'No internet connection';
    document.body.appendChild(offlineNotification);
  }

  private hideOfflineNotification() {
    const notification = document.getElementById('offline-notification');
    if (notification) {
      notification.remove();
    }
  }

  // Utility methods for app features
  async triggerHapticFeedback(style: ImpactStyle = ImpactStyle.Medium) {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  }

  async setStatusBarColor(color: string) {
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color });
    }
  }

  async hideKeyboard() {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.hide();
    }
  }

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}

// Create singleton instance
export const mobileApp = new MobileApp();

// Initialize when module loads
if (typeof window !== 'undefined') {
  mobileApp.initialize();
}

// Export utilities
export const MobileUtils = {
  hapticFeedback: (style?: ImpactStyle) => mobileApp.triggerHapticFeedback(style),
  setStatusBarColor: (color: string) => mobileApp.setStatusBarColor(color),
  hideKeyboard: () => mobileApp.hideKeyboard(),
  isNative: () => mobileApp.isNative(),
  getPlatform: () => mobileApp.getPlatform(),
};
