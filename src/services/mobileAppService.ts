import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';

export interface MobileStatus {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  isOnline: boolean;
}

type BackButtonHandler = () => boolean; // Returns true if handled, false to delegate to next

class MobileAppService {
  private backHandlers: BackButtonHandler[] = [];
  private lastBackPressTime = 0;
  private isInitialized = false;

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public getPlatform(): 'android' | 'ios' | 'web' {
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (this.isNative()) {
      try {
        // Configure Android status bar color and style
        await StatusBar.setBackgroundColor({ color: '#2563eb' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        console.warn('StatusBar configuration not available:', err);
      }

      try {
        // Hide splash screen after app mounts
        await SplashScreen.hide();
      } catch (err) {
        console.warn('SplashScreen hide warning:', err);
      }

      try {
        // Register native Android hardware back button handler
        await CapApp.addListener('backButton', () => {
          this.handleHardwareBack();
        });
      } catch (err) {
        console.warn('BackButton listener warning:', err);
      }
    }
  }

  /**
   * Register a component-level back handler (modal, full-screen preview, etc.)
   * Handlers run in reverse registration order (LIFO: topmost modal first).
   */
  public registerBackHandler(handler: BackButtonHandler): () => void {
    this.backHandlers.push(handler);
    return () => {
      this.backHandlers = this.backHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Triggers light haptic feedback on Android & iOS
   */
  public async triggerHaptic(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
    if (!this.isNative()) return;
    try {
      await Haptics.impact({ style });
    } catch {
      // Graceful fallback if haptics unsupported
    }
  }

  /**
   * Evaluates hardware back button press:
   * 1. Checks registered modal/subview handlers.
   * 2. If handled, stops.
   * 3. If on home/main page, requires double-press within 2s to exit app.
   */
  public handleHardwareBack(onHomeExitPrompt?: () => void): void {
    // Run latest registered handler first
    for (let i = this.backHandlers.length - 1; i >= 0; i--) {
      const handled = this.backHandlers[i]();
      if (handled) {
        return;
      }
    }

    // If no modal or subpage handled it, we are at the root level
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      if (this.isNative()) {
        CapApp.exitApp();
      }
    } else {
      this.lastBackPressTime = now;
      if (onHomeExitPrompt) {
        onHomeExitPrompt();
      }
    }
  }

  /**
   * Checks current network connection status
   */
  public async getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
    try {
      const status = await Network.getStatus();
      return { connected: status.connected, connectionType: status.connectionType };
    } catch {
      return {
        connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
        connectionType: 'unknown',
      };
    }
  }

  /**
   * Listens for network status changes
   */
  public onNetworkChange(callback: (connected: boolean) => void): () => void {
    try {
      const listenerPromise = Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
      return () => {
        listenerPromise.then((handle) => handle.remove()).catch(() => {});
      };
    } catch {
      const handleOnline = () => callback(true);
      const handleOffline = () => callback(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }
}

export const mobileApp = new MobileAppService();
