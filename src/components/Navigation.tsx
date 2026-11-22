import React, { useState } from 'react';
import {
  Flame,
  Layers,
  Timer,
  Scan,
  Target,
  BarChart3,
  Bell,
  SlidersHorizontal,
  Moon,
  Sun,
  Download,
  Share2,
  TrendingUp,
  Focus,
  Globe,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';

export type ActiveTab = 'routine' | 'stages' | 'pattern' | 'vision_test' | 'stats';

interface TopNavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenReminder: () => void;
  onOpenSettings: () => void;
  onOpenShare?: () => void;
  onOpenStoreSEO?: () => void;
  streakCount: number;
  nightMode: boolean;
  onToggleNightMode: () => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
  isAndroidWeb?: boolean;
  language?: AppLanguage;
  onSelectLanguage?: (lang: AppLanguage) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenReminder,
  onOpenSettings,
  onOpenShare,
  onOpenStoreSEO,
  streakCount,
  nightMode,
  onToggleNightMode,
  onOpenInstall,
  isInstalled = false,
  isAndroidWeb = false,
  language = 'ko',
  onSelectLanguage,
}) => {
  const t = getTranslation(language);
  const installLabel = isAndroidWeb
    ? language === 'en'
      ? 'Google Play'
      : language === 'ja'
      ? 'Google Play'
      : language === 'zh'
      ? 'Google Play'
      : language === 'es'
      ? 'Google Play'
      : language === 'fr'
      ? 'Google Play'
      : 'Play 스토어'
    : t.navbar.installApp;
  const brandTitle =
    language === 'en'
      ? 'Presbyopia'
      : language === 'ja'
      ? '老眼防止'
      : language === 'zh'
      ? '老花眼防护'
      : language === 'es'
      ? 'Presbicia'
      : language === 'fr'
      ? 'Presbytie'
      : '노안방지';
  const [showLangMenu, setShowLangMenu] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Zone 1: Clean, professional brand wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('routine');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 cursor-pointer"
        >
          <img
            src="./pwa-192x192.png"
            alt={brandTitle}
            className="w-8 h-8 rounded-full object-contain shrink-0"
          />
          <span className="font-bold text-slate-900 text-sm sm:text-base whitespace-nowrap">
            {brandTitle}
          </span>
        </a>

        {/* Zone 2: Clean text navigation links for desktop / tablet */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('routine')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'routine' ? 'text-teal-700 font-bold' : 'hover:text-slate-900'
            }`}
          >
            {t.tabs.routine}
          </button>
          <button
            onClick={() => onSelectTab('stages')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'stages' ? 'text-teal-700 font-bold' : 'hover:text-slate-900'
            }`}
          >
            {t.tabs.stages}
          </button>
          <button
            onClick={() => onSelectTab('pattern')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'pattern' ? 'text-teal-700 font-bold' : 'hover:text-slate-900'
            }`}
          >
            {t.tabs.pattern}
          </button>
          <button
            onClick={() => onSelectTab('vision_test')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'vision_test' ? 'text-teal-700 font-bold' : 'hover:text-slate-900'
            }`}
          >
            {t.tabs.visionTest}
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'stats' ? 'text-teal-700 font-bold' : 'hover:text-slate-900'
            }`}
          >
            {t.tabs.stats}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions + theme toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Streak Indicator */}
          <div className="hidden xs:flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-amber-800 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-current text-amber-600" />
            <span className="font-mono">{streakCount}{t.navbar.streakDays}</span>
          </div>

          {/* Quick Language Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="min-h-[40px] px-2 rounded-xl text-slate-700 hover:text-teal-900 hover:bg-slate-100 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title={t.navbar.language}
              aria-label={t.navbar.language}
            >
              <Globe className="w-4 h-4 text-teal-700" />
              <span className="uppercase text-[11px] font-extrabold">{language}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
                {[
                  { code: 'ko', label: '한국어' },
                  { code: 'en', label: 'English' },
                  { code: 'ja', label: '日本語' },
                  { code: 'zh', label: '简体中文' },
                  { code: 'es', label: 'Español' },
                  { code: 'fr', label: 'Français' },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      if (onSelectLanguage) {
                        onSelectLanguage(item.code as AppLanguage);
                      }
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      language === item.code
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {language === item.code && <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Install App Button: Google Play on Android web, PWA install on iOS/Desktop, hidden inside native app */}
          {!isInstalled && onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title={installLabel}
              aria-label={installLabel}
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden xs:inline">{installLabel}</span>
            </button>
          )}

          {/* Night Mode Theme Toggle Button */}
          <button
            onClick={onToggleNightMode}
            className={`min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              nightMode
                ? 'bg-indigo-950/80 text-amber-300 border border-indigo-700/60 hover:bg-indigo-900 shadow-inner'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={nightMode ? t.navbar.dayModeTitle : t.navbar.nightModeTitle}
            aria-label={nightMode ? t.navbar.dayModeTitle : t.navbar.nightModeTitle}
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenReminder}
            className="min-h-[40px] min-w-[40px] rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title={t.navbar.reminders}
            aria-label={t.navbar.reminders}
          >
            <Bell className="w-4 h-4" />
          </button>

          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="min-h-[40px] min-w-[40px] rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              title={t.navbar.share}
              aria-label={t.navbar.share}
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {onOpenStoreSEO && (
            <button
              onClick={onOpenStoreSEO}
              className="min-h-[40px] px-2.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t.navbar.storeSeo}
              aria-label={t.navbar.storeSeo}
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">{t.navbar.storeSeo}</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="min-h-[40px] min-w-[40px] rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title={t.navbar.settings}
            aria-label={t.navbar.settings}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

interface BottomTabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  language?: AppLanguage;
  bottomOffsetPx?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  language = 'ko',
  bottomOffsetPx = 0,
}) => {
  const t = getTranslation(language);
  const tabs = [
    { id: 'routine', label: t.tabs.routine, icon: Timer },
    { id: 'stages', label: t.tabs.stages, icon: Focus },
    { id: 'pattern', label: t.tabs.pattern, icon: Scan },
    { id: 'vision_test', label: t.tabs.visionTest, icon: Target },
    { id: 'stats', label: t.tabs.stats, icon: BarChart3 },
  ];

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pb-safe bottom-tab-bar transition-all duration-200"
      style={bottomOffsetPx > 0 ? { bottom: `${bottomOffsetPx}px` } : undefined}
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as ActiveTab)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors cursor-pointer ${
                isActive ? 'text-teal-700' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4] text-teal-700' : 'stroke-2 text-slate-400'}`} />
              <span
                className={`text-[10px] tracking-tight mt-1 whitespace-nowrap ${
                  isActive ? 'font-bold text-teal-800' : 'text-slate-500 font-normal'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
