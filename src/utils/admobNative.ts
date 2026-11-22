import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  AdMobBannerSize,
} from '@capacitor-community/admob';

export const ADMOB_APP_ID = 'ca-app-pub-2281115817010682~4985485283';
export const ADMOB_BANNER_ID = 'ca-app-pub-2281115817010682/9855115692';
export const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-2281115817010682/8542034027';

export const PLAY_STORE_PACKAGE_ID = 'com.cronya.eye_training';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_ID}`;

let isInitialized = false;
let isPreparingInterstitial = false;
let interstitialReady = false;
let lastInterstitialShownAt = 0;
let pendingDismissResolve: (() => void) | null = null;
const listenerHandles: PluginListenerHandle[] = [];

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isAndroidNative(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export async function prepareNativeInterstitial(): Promise<void> {
  if (!isNativeApp() || isPreparingInterstitial || interstitialReady) {
    return;
  }
  isPreparingInterstitial = true;
  try {
    await AdMob.prepareInterstitial({
      adId: ADMOB_INTERSTITIAL_ID,
      isTesting: false,
    });
  } catch (err) {
    console.warn('Native AdMob prepareInterstitial error:', err);
    isPreparingInterstitial = false;
    interstitialReady = false;
  }
}

export async function showNativeBottomBanner(marginBottomPx = 0): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const options: BannerAdOptions = {
      adId: ADMOB_BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: marginBottomPx,
      isTesting: false,
    };
    await AdMob.showBanner(options);
  } catch (err) {
    console.warn('Native AdMob showBanner error:', err);
  }
}

export async function hideNativeBanner(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await AdMob.hideBanner();
  } catch {
    // Ignore when banner is not shown
  }
}

export async function resumeNativeBanner(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await AdMob.resumeBanner();
  } catch {
    await showNativeBottomBanner(0);
  }
}

export async function showNativeInterstitial(options?: {
  force?: boolean;
  minCooldownMs?: number;
}): Promise<boolean> {
  if (!isNativeApp()) return false;

  const now = Date.now();
  const minCooldownMs = options?.minCooldownMs ?? 30000;
  const elapsed = now - lastInterstitialShownAt;

  if (!options?.force && lastInterstitialShownAt > 0 && elapsed < minCooldownMs) {
    return false;
  }

  if (!interstitialReady) {
    void prepareNativeInterstitial();
    return false;
  }

  try {
    lastInterstitialShownAt = now;
    interstitialReady = false;

    const dismissedPromise = new Promise<void>((resolve) => {
      pendingDismissResolve = resolve;
      // Failsafe timeout in case dismiss event doesn't fire
      setTimeout(() => {
        if (pendingDismissResolve === resolve) {
          pendingDismissResolve = null;
          resolve();
        }
      }, 60000);
    });

    await AdMob.showInterstitial();
    await dismissedPromise;
    return true;
  } catch (err) {
    console.warn('Native AdMob showInterstitial error:', err);
    if (pendingDismissResolve) {
      pendingDismissResolve();
      pendingDismissResolve = null;
    }
    void prepareNativeInterstitial();
    return false;
  }
}

export async function initNativeAdMob(
  onBannerSizeChange?: (heightPx: number) => void
): Promise<void> {
  if (!isNativeApp() || isInitialized) return;
  isInitialized = true;

  try {
    await AdMob.initialize({
      initializeForTesting: false,
    });

    const sizeHandle = await AdMob.addListener(
      BannerAdPluginEvents.SizeChanged,
      (info: AdMobBannerSize) => {
        onBannerSizeChange?.(info.height);
      }
    );
    listenerHandles.push(sizeHandle);

    const loadedHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.Loaded,
      () => {
        isPreparingInterstitial = false;
        interstitialReady = true;
      }
    );
    listenerHandles.push(loadedHandle);

    const failedLoadHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.FailedToLoad,
      () => {
        isPreparingInterstitial = false;
        interstitialReady = false;
        setTimeout(() => {
          void prepareNativeInterstitial();
        }, 15000);
      }
    );
    listenerHandles.push(failedLoadHandle);

    const dismissedHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      () => {
        interstitialReady = false;
        if (pendingDismissResolve) {
          pendingDismissResolve();
          pendingDismissResolve = null;
        }
        setTimeout(() => {
          void prepareNativeInterstitial();
        }, 1000);
      }
    );
    listenerHandles.push(dismissedHandle);

    const failedShowHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.FailedToShow,
      () => {
        interstitialReady = false;
        if (pendingDismissResolve) {
          pendingDismissResolve();
          pendingDismissResolve = null;
        }
        setTimeout(() => {
          void prepareNativeInterstitial();
        }, 5000);
      }
    );
    listenerHandles.push(failedShowHandle);

    await showNativeBottomBanner(0);
    await prepareNativeInterstitial();
  } catch (err) {
    console.warn('Native AdMob initialization error:', err);
    isInitialized = false;
  }
}
