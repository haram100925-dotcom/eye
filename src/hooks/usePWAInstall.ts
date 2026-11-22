import { useEffect, useState, useCallback } from 'react';
import { isNativeApp } from '../utils/admobNative';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_DISMISSED_KEY = 'eye_training_pwa_dismissed_until';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isNative, setIsNative] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroidWeb, setIsAndroidWeb] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const native = isNativeApp();
    setIsNative(native);

    if (native) {
      // Inside Capacitor Android native shell: never show PWA or Play Store install prompts
      setIsInstalled(true);
      setIsIOS(false);
      setIsAndroidWeb(false);
      setShowModal(false);
      return;
    }

    // 1. Check if running in standalone mode (already installed as iOS/Desktop PWA)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://'));

    setIsInstalled(isStandalone);

    let iosDevice = false;
    let androidBrowser = false;

    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      iosDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
      androidBrowser = /android/.test(ua) && !iosDevice;
      setIsIOS(iosDevice);
      setIsAndroidWeb(androidBrowser);
    }

    const dismissedUntil = localStorage.getItem(PWA_DISMISSED_KEY);
    const isCoolingDown = Boolean(dismissedUntil && Date.now() < parseInt(dismissedUntil, 10));

    let autoTimer: ReturnType<typeof setTimeout> | null = null;

    // 2. On Android Web Browser: prompt Google Play Store app download instead of PWA install
    // On iOS Safari: prompt "Add to Home Screen" PWA guide
    if (!isStandalone && !isCoolingDown && (androidBrowser || iosDevice)) {
      autoTimer = setTimeout(() => {
        setShowModal(true);
      }, 3000);
    }

    // 3. Listen for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Always prevent default browser mini-infobar (especially important on Android Chrome
      // so we direct users to Google Play Store rather than PWA install)
      e.preventDefault();

      if (androidBrowser) {
        return;
      }

      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isStandalone && !isCoolingDown) {
        if (autoTimer) clearTimeout(autoTimer);
        autoTimer = setTimeout(() => {
          setShowModal(true);
        }, 3000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
      localStorage.removeItem(PWA_DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt || isAndroidWeb || isNative) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowModal(false);
        return true;
      }
    } catch (err) {
      console.error('PWA install error', err);
    }
    return false;
  }, [deferredPrompt, isAndroidWeb, isNative]);

  const dismissModal = useCallback((days = 3) => {
    setShowModal(false);
    const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(PWA_DISMISSED_KEY, expireTime.toString());
  }, []);

  const openModal = useCallback(() => {
    if (isNative) return;
    setShowModal(true);
  }, [isNative]);

  return {
    isNative,
    isInstallable: !!deferredPrompt && !isAndroidWeb && !isNative,
    isInstalled,
    isIOS,
    isAndroidWeb,
    showModal,
    install,
    openModal,
    dismissModal,
  };
}
