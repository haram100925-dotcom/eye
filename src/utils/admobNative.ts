import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  AppOpenAdPluginEvents,
  AdMobBannerSize,
} from '@capacitor-community/admob';

export const ADMOB_APP_ID = 'ca-app-pub-2281115817010682~4985485283';
export const ADMOB_BANNER_ID = 'ca-app-pub-2281115817010682/9855115692';
// Note: In AdMob console, ca-app-pub-2281115817010682/8542034027 is registered as an App Open Ad unit ("앱 오프닝")
export const ADMOB_APP_OPEN_ID = 'ca-app-pub-2281115817010682/8542034027';
export const ADMOB_INTERSTITIAL_ID = ADMOB_APP_OPEN_ID;

export const PLAY_STORE_PACKAGE_ID = 'kr.pe.cronya.twa';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_ID}`;

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;
let listenersRegistered = false;
let inFlightLoadPromise: Promise<boolean> | null = null;
let appOpenReady = false;
let loadedAppOpenAdId: string | null = null;
let appOpenLoadedAt = 0;
let isShowingAppOpen = false;
let lastAppOpenShownAt = 0;
let consecutiveLoadFailures = 0;
let bannerLoadFailures = 0;
let bannerRetryTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let showRequestSeq = 0;
const listenerHandles: PluginListenerHandle[] = [];

// AdMob App Open ads expire after 4 hours; refresh conservatively at 3.5 hours
const APP_OPEN_EXPIRATION_MS = 3.5 * 60 * 60 * 1000;

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

function clearBannerRetryTimer(): void {
  if (bannerRetryTimer !== null) {
    clearTimeout(bannerRetryTimer);
    bannerRetryTimer = null;
  }
}

function markAppOpenReady(adUnitId?: string): void {
  clearRetryTimer();
  appOpenReady = true;
  loadedAppOpenAdId = adUnitId || ADMOB_APP_OPEN_ID;
  appOpenLoadedAt = Date.now();
  consecutiveLoadFailures = 0;
}

function isAppOpenUsable(): boolean {
  if (!appOpenReady) return false;
  if (appOpenLoadedAt > 0 && Date.now() - appOpenLoadedAt > APP_OPEN_EXPIRATION_MS) {
    appOpenReady = false;
    loadedAppOpenAdId = null;
    appOpenLoadedAt = 0;
    return false;
  }
  return true;
}

function scheduleAppOpenRetry(customDelayMs?: number): void {
  if (!isNativeApp() || retryTimer !== null || isAppOpenUsable()) return;
  const delayMs =
    customDelayMs ??
    (consecutiveLoadFailures <= 1 ? 4000 : consecutiveLoadFailures === 2 ? 8000 : 15000);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void prepareNativeInterstitial();
  }, delayMs);
}

function scheduleBannerRetry(): void {
  if (!isNativeApp() || bannerRetryTimer !== null || bannerLoadFailures > 5) return;
  const delayMs = bannerLoadFailures <= 1 ? 5000 : bannerLoadFailures === 2 ? 10000 : 20000;
  bannerRetryTimer = setTimeout(() => {
    bannerRetryTimer = null;
    void showNativeBottomBanner(0);
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
  if (isAppOpenUsable()) return true;
  if (inFlightLoadPromise) return inFlightLoadPromise;

  clearRetryTimer();

  inFlightLoadPromise = (async () => {
    const initialized = await ensureNativeAdMobInitialized();
    if (!initialized) {
      consecutiveLoadFailures += 1;
      scheduleAppOpenRetry();
      return false;
    }

    try {
      const check = await AdMob.isAppOpenLoaded({ adId: ADMOB_APP_OPEN_ID });
      if (check?.value) {
        markAppOpenReady(ADMOB_APP_OPEN_ID);
        return true;
      }

      const loadInfo = await AdMob.loadAppOpen({
        adId: ADMOB_APP_OPEN_ID,
      });
      markAppOpenReady(loadInfo?.adUnitId);
      console.info('[AdMob] AppOpen loaded:', loadInfo?.adUnitId || ADMOB_APP_OPEN_ID);
      return true;
    } catch (err) {
      console.warn('[AdMob] loadAppOpen error:', err);
      appOpenReady = false;
      loadedAppOpenAdId = null;
      appOpenLoadedAt = 0;
      consecutiveLoadFailures += 1;
      scheduleAppOpenRetry();
      return false;
    } finally {
      inFlightLoadPromise = null;
    }
  })();

  return inFlightLoadPromise;
}

export async function showNativeBottomBanner(marginBottomPx = 0): Promise<void> {
  if (!isNativeApp()) return;
  clearBannerRetryTimer();
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
    console.warn('[AdMob] showBanner error:', err);
    bannerLoadFailures += 1;
    scheduleBannerRetry();
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
  if (!isNativeApp() || isShowingAppOpen) return false;

  const requestId = ++showRequestSeq;
  const now = Date.now();
  const minCooldownMs = options?.minCooldownMs ?? 30000;
  const elapsed = now - lastAppOpenShownAt;

  if (!options?.force && lastAppOpenShownAt > 0 && elapsed < minCooldownMs) {
    if (!isAppOpenUsable()) {
      void prepareNativeInterstitial();
    }
    return false;
  }

  if (!isAppOpenUsable()) {
    const waitMs = options?.waitForReadyMs ?? (options?.force ? 4500 : 2500);
    const loadTask = prepareNativeInterstitial();
    const readyWithinWindow = await Promise.race<boolean>([
      loadTask,
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), waitMs);
      }),
    ]);

    if (requestId !== showRequestSeq) {
      return false;
    }

    if (!readyWithinWindow && !isAppOpenUsable()) {
      return false;
    }
  }

  if (requestId !== showRequestSeq || isShowingAppOpen) {
    return false;
  }

  const targetAdId = loadedAppOpenAdId || ADMOB_APP_OPEN_ID;
  const previousShownAt = lastAppOpenShownAt;

  isShowingAppOpen = true;
  appOpenReady = false;
  loadedAppOpenAdId = null;
  appOpenLoadedAt = 0;

  try {
    // Note: AppOpenAdPlugin.showAppOpen resolves once the user closes the full-screen App Open ad
    await AdMob.showAppOpen({ adId: targetAdId });
    lastAppOpenShownAt = Date.now();
    scheduleAppOpenRetry(800);
    return true;
  } catch (err) {
    console.warn('[AdMob] showAppOpen error:', err);
    lastAppOpenShownAt = previousShownAt;
    scheduleAppOpenRetry(1500);
    return false;
  } finally {
    isShowingAppOpen = false;
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
          AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
            bannerLoadFailures = 0;
            clearBannerRetryTimer();
            console.info('[AdMob] Banner loaded:', ADMOB_BANNER_ID);
          }),
          AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
            console.warn('[AdMob] Banner failed to load:', error?.code, error?.message);
            bannerLoadFailures += 1;
            scheduleBannerRetry();
          }),
          AdMob.addListener(AppOpenAdPluginEvents.Loaded, (info) => {
            markAppOpenReady(info?.adUnitId);
          }),
          AdMob.addListener(AppOpenAdPluginEvents.FailedToLoad, (error) => {
            console.warn('[AdMob] AppOpen failed to load:', error?.code, error?.message);
            appOpenReady = false;
            loadedAppOpenAdId = null;
            appOpenLoadedAt = 0;
            consecutiveLoadFailures += 1;
            scheduleAppOpenRetry();
          }),
          AdMob.addListener(AppOpenAdPluginEvents.Opened, () => {
            lastAppOpenShownAt = Date.now();
          }),
          AdMob.addListener(AppOpenAdPluginEvents.Closed, () => {
            appOpenReady = false;
            loadedAppOpenAdId = null;
            appOpenLoadedAt = 0;
            lastAppOpenShownAt = Date.now();
            scheduleAppOpenRetry(800);
          }),
          AdMob.addListener(AppOpenAdPluginEvents.FailedToShow, (error) => {
            console.warn('[AdMob] AppOpen failed to show:', error?.code, error?.message);
            appOpenReady = false;
            loadedAppOpenAdId = null;
            appOpenLoadedAt = 0;
            scheduleAppOpenRetry(3000);
          }),
        ]);
        listenerHandles.push(...handles);
      }

      isInitialized = true;

      // Load banner and App Open ad in parallel immediately
      void showNativeBottomBanner(0);
      void prepareNativeInterstitial();
      return true;
    } catch (err) {
      console.warn('[AdMob] Initialization error:', err);
      isInitialized = false;
      return false;
    } finally {
      initPromise = null;
    }
  })();

  await initPromise;
}
