/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TopNavbar,
  BottomTabBar,
  ActiveTab,
} from './components/Navigation';
import { MascotGuide } from './components/MascotGuide';
import { DailyRoutine3Min } from './components/DailyRoutine3Min';
import { GaborStageGame } from './components/GaborStageGame';
import { DailyPatternGenerator } from './components/DailyPatternGenerator';
import { VisionAcuityTest } from './components/VisionAcuityTest';
import { EyeTrackerStats } from './components/EyeTrackerStats';
import { ReminderModal } from './components/ReminderModal';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { StoreSEOGuideModal } from './components/StoreSEOGuideModal';
import { AdBanner } from './components/AdBanner';
import { AppOpenAdOverlay } from './components/AppOpenAdOverlay';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineBanner } from './components/OfflineBanner';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  isNativeApp,
  isDevEnvironment,
  initNativeAdMob,
  showNativeInterstitial,
  PLAY_STORE_URL,
} from './utils/admobNative';
import {
  loadPreferences,
  savePreferences,
  loadSessions,
  calculateStreak,
} from './utils/storage';
import { UserPreferences, AppLanguage } from './types';
import { audioGuide } from './utils/audioGuide';
import { getTranslation } from './utils/i18n';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Flame,
  Award,
  ChevronRight,
  ShieldCheck,
  Heart,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('routine');
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences());
  const [streakCount, setStreakCount] = useState<number>(0);
  const [isReminderOpen, setIsReminderOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isStoreSEOOpen, setIsStoreSEOOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isAppOpenAdVisible, setIsAppOpenAdVisible] = useState<boolean>(false);
  const [adTriggerReason, setAdTriggerReason] = useState<'startup' | 'completion'>('startup');
  const [nativeBannerHeight, setNativeBannerHeight] = useState<number>(0);
  const isNative = isNativeApp();
  const showDevGuide = isDevEnvironment();

  // Initialize native AdMob (banner + preloaded interstitial) in Capacitor Android app,
  // or trigger web startup ad overlay on web browsers
  useEffect(() => {
    if (isNative) {
      void initNativeAdMob((heightPx) => {
        setNativeBannerHeight(heightPx);
      });
      return;
    }

    const hasSeenStartupAd = sessionStorage.getItem('eye_training_startup_ad_seen');
    if (!hasSeenStartupAd) {
      const timer = setTimeout(() => {
        setAdTriggerReason('startup');
        setIsAppOpenAdVisible(true);
        sessionStorage.setItem('eye_training_startup_ad_seen', 'true');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isNative]);

  // Official live production deployment URL
  const productionUrl = 'https://cronya.pe.kr/eye/';
  const sharedUrl = productionUrl;

  // PWA / Play Store install state & modal management
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroidWeb,
    showModal: showInstallModal,
    install: installPWA,
    openModal: openInstallModal,
    dismissModal: dismissInstallModal,
  } = usePWAInstall();

  // Sync preferences and streak on mount
  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
    audioGuide.setPreferences(
      prefs.soundEffects,
      prefs.voiceGuide,
      prefs.voicePersona,
      prefs.voiceSpeed,
      prefs.language || 'ko'
    );

    const sessions = loadSessions();
    setStreakCount(calculateStreak(sessions));
  }, [refreshKey]);

  // Keep <html lang> and page title aligned with detected/selected language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const activeLang = preferences.language || 'ko';
      document.documentElement.lang = activeLang;
      const localized = getTranslation(activeLang);
      document.title = `${localized.appName} - ${localized.appSubtitle}`;
    }
  }, [preferences.language]);

  const handleSelectTab = (newTab: ActiveTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (isNative) {
      // Page/Tab navigation interstitial ad (ca-app-pub-2281115817010682/8542034027)
      void showNativeInterstitial({ minCooldownMs: 30000 });
    }
  };

  const handleSessionFinished = () => {
    const sessions = loadSessions();
    setStreakCount(calculateStreak(sessions));
    setRefreshKey((k) => k + 1);

    setTimeout(() => {
      if (isNative) {
        void showNativeInterstitial({ force: true, minCooldownMs: 10000 });
      } else {
        setAdTriggerReason('completion');
        setIsAppOpenAdVisible(true);
      }
    }, 1200);
  };

  const handleToggleNightMode = () => {
    const updated: UserPreferences = {
      ...preferences,
      nightMode: !preferences.nightMode,
    };
    setPreferences(updated);
    savePreferences(updated);
    if (updated.nightMode) {
      audioGuide.playSuccessChime();
    }
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    const updated: UserPreferences = {
      ...preferences,
      language: newLang,
    };
    setPreferences(updated);
    savePreferences(updated);
    audioGuide.setPreferences(
      updated.soundEffects,
      updated.voiceGuide,
      updated.voicePersona,
      updated.voiceSpeed,
      updated.language || 'ko'
    );
    audioGuide.playSuccessChime();
  };

  const t = getTranslation(preferences.language || 'ko');

  // Font size class mapping for seniors
  const fontSizeClass =
    preferences.fontSize === 'extra-large'
      ? 'text-lg'
      : preferences.fontSize === 'large'
      ? 'text-base'
      : 'text-sm';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        preferences.nightMode ? 'night-mode bg-black text-zinc-100' : 'bg-slate-50 text-slate-800'
      } ${preferences.warmFilter ? 'warm-tint' : ''} ${preferences.highContrast ? 'high-contrast' : ''} ${fontSizeClass}`}
    >
      {/* 1. Header Bar following Top Bar Contract */}
      <TopNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenReminder={() => setIsReminderOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        streakCount={streakCount}
        nightMode={preferences.nightMode}
        onToggleNightMode={handleToggleNightMode}
        onOpenInstall={openInstallModal}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenStoreSEO={showDevGuide ? () => setIsStoreSEOOpen(true) : undefined}
        isInstalled={isInstalled}
        isAndroidWeb={isAndroidWeb}
        language={preferences.language || 'ko'}
        onSelectLanguage={handleLanguageChange}
      />

      {/* 2. Main Content Area */}
      <main
        className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 pb-36 md:pb-20 space-y-4"
        style={
          isNative
            ? { paddingBottom: `${(nativeBannerHeight > 0 ? nativeBannerHeight : 60) + 88}px` }
            : undefined
        }
      >
        {/* Mascot Coaching Guide Card */}
        <MascotGuide
          targetGroup={preferences.targetGroup}
          voiceEnabled={preferences.voiceGuide}
          language={preferences.language || 'ko'}
          mood={
            activeTab === 'routine'
              ? 'greeting'
              : activeTab === 'stages'
              ? 'coaching'
              : activeTab === 'stats'
              ? 'cheering'
              : 'coaching'
          }
        />

        {/* Tab 1: 3-Minute Guided Routine */}
        {activeTab === 'routine' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <DailyRoutine3Min
              targetGroup={preferences.targetGroup}
              voiceEnabled={preferences.voiceGuide}
              onFinish={handleSessionFinished}
              language={preferences.language || 'ko'}
            />

            {/* Scientific Evidence & Quick Highlights */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>
                  {preferences.language === 'en'
                    ? 'Why is the 3-minute Gabor routine effective?'
                    : preferences.language === 'ja'
                    ? 'なぜ1日3分のガボールルーティンが効果的なのか？'
                    : preferences.language === 'zh'
                    ? '为什么每日3分钟伽博训练如此有效？'
                    : preferences.language === 'es'
                    ? '¿Por qué es tan eficaz la rutina Gabor de 3 minutos?'
                    : preferences.language === 'fr'
                    ? 'Pourquoi la routine Gabor de 3 min est-elle si efficace ?'
                    : '왜 하루 3분 루틴이 효과적인가요?'}
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {preferences.language === 'en'
                  ? 'According to clinical trials and UC Berkeley vision research, practicing Gabor patches for 3 minutes daily promotes neuroplasticity in the visual cortex to restore blurred edges, meaningfully improving perceived acuity in presbyopia and myopia.'
                  : preferences.language === 'ja'
                  ? '眼科専門医・平松類医師の臨床およびUCバークレー校の視覚研究によると、ガボールパッチを1日3分継続することで、脳の視覚野の神経可塑性が刺激され、老眼や近視の見えにくさが有意に改善されます。'
                  : preferences.language === 'zh'
                  ? '根据眼科临床与加州大学伯克利分校视觉科学研究，每天坚持3分钟伽博斑块训练，可促进大脑视觉皮层边缘模糊重构的神经可塑性，显著改善老花眼和青少年近视的清晰度。'
                  : preferences.language === 'es'
                  ? 'Según investigaciones clínicas y de la Universidad de Berkeley, practicar con parches de Gabor 3 minutos al día activa la neuroplasticidad del córtex visual, mejorando significativamente la nitidez cerebral en presbicia y fatiga ocular.'
                  : preferences.language === 'fr'
                  ? 'Selon les études cliniques et les recherches de l’Université de Berkeley, pratiquer les patchs de Gabor 3 min par jour stimule la neuroplasticité du cortex visuel, améliorant nettement la netteté perçue pour la presbytie et la fatigue oculaire.'
                  : '안과 전문의 히라마쓰 루이 박사의 임상 및 UC 버클리 시각과학 연구에 따르면, 가보르 패치를 하루 3분씩 지속할 경우 뇌의 시각 피질에서 흐릿한 윤곽을 복원하는 신경 가소성(Neuroplasticity)이 촉진되어 노안과 청소년 근시의 체감 시력이 유의미하게 개선됩니다.'}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-teal-700 font-medium">
                <span>
                  {preferences.language === 'en'
                    ? 'Glasses & Contacts OK'
                    : preferences.language === 'ja'
                    ? 'メガネ・コンタクト着用OK'
                    : preferences.language === 'zh'
                    ? '可佩戴眼镜与隐形眼镜'
                    : preferences.language === 'es'
                    ? 'Uso con gafas/lentillas OK'
                    : preferences.language === 'fr'
                    ? 'Compatible lunettes & lentilles'
                    : '안경·렌즈 착용 가능'}
                </span>
                <span>·</span>
                <span>
                  {preferences.language === 'en'
                    ? 'Non-invasive Natural Care'
                    : preferences.language === 'ja'
                    ? '非侵襲の自然療法'
                    : preferences.language === 'zh'
                    ? '无创自然训练'
                    : preferences.language === 'es'
                    ? 'Entrenamiento natural no invasivo'
                    : preferences.language === 'fr'
                    ? 'Soin naturel non invasif'
                    : '비침습적 자연 훈련'}
                </span>
                <span>·</span>
                <span>
                  {preferences.language === 'en'
                    ? 'Relieves Ciliary Muscle Fatigue'
                    : preferences.language === 'ja'
                    ? '毛様体筋の疲労緩和'
                    : preferences.language === 'zh'
                    ? '缓解睫状肌疲劳'
                    : preferences.language === 'es'
                    ? 'Alivia la fatiga ciliar'
                    : preferences.language === 'fr'
                    ? 'Soulage le muscle ciliaire'
                    : '모양체근 피로 완화'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 10-Stage Course */}
        {activeTab === 'stages' && (
          <div className="animate-in fade-in duration-200">
            <GaborStageGame
              targetGroup={preferences.targetGroup}
              voiceEnabled={preferences.voiceGuide}
              onSessionComplete={handleSessionFinished}
              language={preferences.language || 'ko'}
            />
          </div>
        )}

        {/* Tab 3: Daily Pattern Generator & Custom Image */}
        {activeTab === 'pattern' && (
          <div className="animate-in fade-in duration-200">
            <DailyPatternGenerator
              targetGroup={preferences.targetGroup}
              nightMode={preferences.nightMode}
              language={preferences.language || 'ko'}
            />
          </div>
        )}

        {/* Tab 4: Visual Acuity Self-Test */}
        {activeTab === 'vision_test' && (
          <div className="animate-in fade-in duration-200">
            <VisionAcuityTest
              onTestComplete={handleSessionFinished}
              language={preferences.language || 'ko'}
            />
          </div>
        )}

        {/* Tab 5: Health & Improvement Tracker */}
        {activeTab === 'stats' && (
          <div className="animate-in fade-in duration-200">
            <EyeTrackerStats
              targetGroup={preferences.targetGroup}
              refreshKey={refreshKey}
              language={preferences.language || 'ko'}
            />
          </div>
        )}
      </main>

      {/* 2.5 Persistent AdBanner (Web AdSense fallback; hidden when native AdMob banner is active) */}
      <AdBanner className="fixed bottom-16 left-0 right-0 z-30 md:static md:bottom-auto shadow-md" />

      {/* 3. Mobile Ergonomic Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        language={preferences.language || 'ko'}
        bottomOffsetPx={isNative ? nativeBannerHeight : 0}
      />

      {/* 4. Modals */}
      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        language={preferences.language || 'ko'}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(newPrefs) => setPreferences(newPrefs)}
        onOpenInstall={openInstallModal}
        onOpenStoreSEO={showDevGuide ? () => setIsStoreSEOOpen(true) : undefined}
        isInstalled={isInstalled}
        isAndroidWeb={isAndroidWeb}
      />

      {/* Share / QR Code Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        sharedUrl={sharedUrl}
      />

      {/* Store & SEO Guide Modal (AI Studio / Dev Environment Only) */}
      {showDevGuide && (
        <StoreSEOGuideModal
          isOpen={isStoreSEOOpen}
          onClose={() => setIsStoreSEOOpen(false)}
          siteUrl={sharedUrl}
        />
      )}

      {/* Platform-Aware Install Modal: Play Store for Android Web, PWA for iOS */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={dismissInstallModal}
        onInstall={installPWA}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroidWeb={isAndroidWeb}
        playStoreUrl={PLAY_STORE_URL}
        language={preferences.language || 'ko'}
      />

      {/* Offline Status Toast */}
      <OfflineBanner />

      {/* Web Ad Overlay (Startup & Completion; skipped inside native app) */}
      <AppOpenAdOverlay
        isOpen={isAppOpenAdVisible}
        onDismiss={() => setIsAppOpenAdVisible(false)}
        triggerReason={adTriggerReason}
      />
    </div>
  );
}
