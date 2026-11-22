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
let initPromise: Promise<boolean> | null = null;
let listenersRegistered = false;
let inFlightPreparePromise: Promise<boolean> | null = null;
let interstitialReady = false;
let loadedInterstitialAdId: string | null = null;
let interstitialLoadedAt = 0;
let isShowingInterstitial = false;
let lastInterstitialShownAt = 0;
let consecutiveLoadFailures = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let pendingDismissResolve: (() => void) | null = null;
let showRequestSeq = 0;
const listenerHandles: PluginListenerHandle[] = [];

const INTERSTITIAL_EXPIRATION_MS = 55 * 60 * 1000; // AdMob interstitials expire after 60m

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

export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return Boolean(import.meta.env.DEV);
  if (isNativeApp()) return false;
  const host = window.location.hostname || '';
  return (
    Boolean(import.meta.env.DEV) ||
    host.includes('ais-dev-') ||
    host.includes('ais-pre-') ||
    host.includes('aistudio.google.com')
  );
}

function clearRetryTimer(): void {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function markInterstitialReady(adUnitId?: string): void {
  clearRetryTimer();
  interstitialReady = true;
  loadedInterstitialAdId = adUnitId || ADMOB_INTERSTITIAL_ID;
  interstitialLoadedAt = Date.now();
  consecutiveLoadFailures = 0;
}

function isInterstitialUsable(): boolean {
  if (!interstitialReady) return false;
  if (interstitialLoadedAt > 0 && Date.now() - interstitialLoadedAt > INTERSTITIAL_EXPIRATION_MS) {
    interstitialReady = false;
    loadedInterstitialAdId = null;
    interstitialLoadedAt = 0;
    return false;
  }
  return true;
}

function scheduleInterstitialRetry(customDelayMs?: number): void {
  if (!isNativeApp() || retryTimer !== null || isInterstitialUsable()) return;
  const delayMs =
    customDelayMs ??
    (consecutiveLoadFailures <= 1 ? 4000 : consecutiveLoadFailures === 2 ? 8000 : 15000);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void prepareNativeInterstitial();
  }, delayMs);
}

async function ensureNativeAdMobInitialized(): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (isInitialized) return true;
  if (initPromise) return initPromise;
  await initNativeAdMob();
  return isInitialized;
}

export async function prepareNativeInterstitial(): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (isInterstitialUsable()) return true;
  if (inFlightPreparePromise) return inFlightPreparePromise;

  clearRetryTimer();

  inFlightPreparePromise = (async () => {
    const initialized = await ensureNativeAdMobInitialized();
    if (!initialized) {
      consecutiveLoadFailures += 1;
      scheduleInterstitialRetry();
      return false;
    }

    try {
      const loadInfo = await AdMob.prepareInterstitial({
        adId: ADMOB_INTERSTITIAL_ID,
        isTesting: false,
      });
      markInterstitialReady(loadInfo?.adUnitId);
      return true;
    } catch (err) {
      console.warn('Native AdMob prepareInterstitial error:', err);
      interstitialReady = false;
      loadedInterstitialAdId = null;
      interstitialLoadedAt = 0;
      consecutiveLoadFailures += 1;
      scheduleInterstitialRetry();
      return false;
    } finally {
      inFlightPreparePromise = null;
    }
  })();

  return inFlightPreparePromise;
}

export async function showNativeBottomBanner(marginBottomPx = 0): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const initialized = await ensureNativeAdMobInitialized();
    if (!initialized) return;

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
  waitForReadyMs?: number;
}): Promise<boolean> {
  if (!isNativeApp() || isShowingInterstitial) return false;

  const requestId = ++showRequestSeq;
  const now = Date.now();
  const minCooldownMs = options?.minCooldownMs ?? 30000;
  const elapsed = now - lastInterstitialShownAt;

  if (!options?.force && lastInterstitialShownAt > 0 && elapsed < minCooldownMs) {
    if (!isInterstitialUsable()) {
      void prepareNativeInterstitial();
    }
    return false;
  }

  if (!isInterstitialUsable()) {
    const waitMs = options?.waitForReadyMs ?? (options?.force ? 4500 : 2500);
    const prepareTask = prepareNativeInterstitial();
    const readyWithinWindow = await Promise.race<boolean>([
      prepareTask,
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), waitMs);
      }),
    ]);

    if (requestId !== showRequestSeq) {
      return false;
    }

    if (!readyWithinWindow && !isInterstitialUsable()) {
      return false;
    }
  }

  if (requestId !== showRequestSeq || isShowingInterstitial) {
    return false;
  }

  const targetAdId = loadedInterstitialAdId || ADMOB_INTERSTITIAL_ID;
  const previousShownAt = lastInterstitialShownAt;

  isShowingInterstitial = true;
  interstitialReady = false;
  loadedInterstitialAdId = null;
  interstitialLoadedAt = 0;

  try {
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

    await AdMob.showInterstitial({ adId: targetAdId });
    lastInterstitialShownAt = Date.now();
    await dismissedPromise;
    return true;
  } catch (err) {
    console.warn('Native AdMob showInterstitial error:', err);
    lastInterstitialShownAt = previousShownAt;
    if (pendingDismissResolve) {
      pendingDismissResolve();
      pendingDismissResolve = null;
    }
    scheduleInterstitialRetry(1000);
    return false;
  } finally {
    isShowingInterstitial = false;
  }
}

export async function initNativeAdMob(
  onBannerSizeChange?: (heightPx: number) => void
): Promise<void> {
  if (!isNativeApp() || isInitialized) return;
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      await AdMob.initialize({
        initializeForTesting: false,
      });

      if (!listenersRegistered) {
        listenersRegistered = true;
        const handles = await Promise.all([
          AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: AdMobBannerSize) => {
            onBannerSizeChange?.(info.height);
          }),
          AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info) => {
            markInterstitialReady(info?.adUnitId);
          }),
          AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
            console.warn('Native AdMob interstitial failed to load:', error?.code, error?.message);
            interstitialReady = false;
            loadedInterstitialAdId = null;
            interstitialLoadedAt = 0;
            consecutiveLoadFailures += 1;
            scheduleInterstitialRetry();
          }),
          AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
            lastInterstitialShownAt = Date.now();
          }),
          AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
            interstitialReady = false;
            loadedInterstitialAdId = null;
            interstitialLoadedAt = 0;
            lastInterstitialShownAt = Date.now();
            if (pendingDismissResolve) {
              pendingDismissResolve();
              pendingDismissResolve = null;
            }
            scheduleInterstitialRetry(800);
          }),
          AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error) => {
            console.warn('Native AdMob interstitial failed to show:', error?.code, error?.message);
            interstitialReady = false;
            loadedInterstitialAdId = null;
            interstitialLoadedAt = 0;
            if (pendingDismissResolve) {
              pendingDismissResolve();
              pendingDismissResolve = null;
            }
            scheduleInterstitialRetry(3000);
          }),
        ]);
        listenerHandles.push(...handles);
      }

      isInitialized = true;

      // Load banner and interstitial in parallel so banner setup never delays interstitial readiness
      void showNativeBottomBanner(0);
      void prepareNativeInterstitial();
      return true;
    } catch (err) {
      console.warn('Native AdMob initialization error:', err);
      isInitialized = false;
      return false;
    } finally {
      initPromise = null;
    }
  })();

  await initPromise;
}
