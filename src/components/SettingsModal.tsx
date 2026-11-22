import React from 'react';
import {
  X,
  Type,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  Sun,
  Moon,
  Shield,
  Check,
  Play,
  Download,
  Smartphone,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { UserPreferences, TargetGroup, FontSize, VoicePersona, AppLanguage } from '../types';
import { savePreferences } from '../utils/storage';
import { audioGuide } from '../utils/audioGuide';
import { getTranslation } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onOpenInstall?: () => void;
  onOpenStoreSEO?: () => void;
  isInstalled?: boolean;
  isAndroidWeb?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onOpenInstall,
  onOpenStoreSEO,
  isInstalled = false,
  isAndroidWeb = false,
}) => {
  if (!isOpen) return null;

  const handleChange = (partial: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...partial };
    onUpdatePreferences(updated);
    savePreferences(updated);
    audioGuide.setPreferences(
      updated.soundEffects,
      updated.voiceGuide,
      updated.voicePersona,
      updated.voiceSpeed,
      updated.language || 'ko'
    );
  };

  const t = getTranslation(preferences.language || 'ko');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.settings.title}</h3>
              <p className="text-xs text-slate-500">{t.settings.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
            aria-label={t.settings.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 0. Language Selection (다개국어 설정) */}
        <div className="space-y-2 bg-teal-50/60 p-3 rounded-2xl border border-teal-200/80">
          <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-teal-700" />
            <span>{t.settings.langSelectTitle}</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { id: 'ko', label: '한국어', native: '한국어' },
              { id: 'en', label: 'English', native: 'English' },
              { id: 'ja', label: '日本語', native: '日本語' },
              { id: 'zh', label: '中文', native: '简体中文' },
              { id: 'es', label: 'Español', native: 'Español' },
              { id: 'fr', label: 'Français', native: 'Français' },
            ].map((langItem) => (
              <button
                key={langItem.id}
                type="button"
                onClick={() => handleChange({ language: langItem.id as AppLanguage })}
                className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  (preferences.language || 'ko') === langItem.id
                    ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs block truncate">{langItem.native}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1. Target Group (Presbyopia vs Youth vs General) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900">{t.settings.modeTitle}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'presbyopia', title: t.settings.modePresbyopia, desc: t.settings.modePresbyopiaDesc },
              { id: 'youth', title: t.settings.modeYouth, desc: t.settings.modeYouthDesc },
              { id: 'general', title: t.settings.modeGeneral, desc: t.settings.modeGeneralDesc },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleChange({ targetGroup: item.id as TargetGroup })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  preferences.targetGroup === item.id
                    ? 'bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold">{item.title}</p>
                <span className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Font Size (Senior accessibility) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-teal-700" />
            <span>{t.settings.fontSizeTitle}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { size: 'normal', label: t.settings.fontNormal, sub: t.settings.fontNormalSub },
              { size: 'large', label: t.settings.fontLarge, sub: t.settings.fontLargeSub },
              { size: 'extra-large', label: t.settings.fontExtraLarge, sub: t.settings.fontExtraLargeSub },
            ].map((f) => (
              <button
                key={f.size}
                onClick={() => handleChange({ fontSize: f.size as FontSize })}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  preferences.fontSize === f.size
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold block">{f.label}</span>
                <span className="text-[10px] opacity-80">{f.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Eye Protection Filters */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-600" />
            <span>{t.settings.screenTitle}</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-900/20 text-indigo-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">{t.settings.nightModeTitle}</span>
                  <p className="text-[11px] text-slate-500">{t.settings.nightModeDesc}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.nightMode}
                onChange={(e) => handleChange({ nightMode: e.target.checked })}
                className="w-5 h-5 accent-teal-700 rounded-md cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800">{t.settings.warmTintTitle}</span>
                <p className="text-[11px] text-slate-500">{t.settings.warmTintDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.warmFilter}
                onChange={(e) => handleChange({ warmFilter: e.target.checked })}
                className="w-5 h-5 accent-teal-700 rounded-md cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800">{t.settings.highContrastTitle}</span>
                <p className="text-[11px] text-slate-500">{t.settings.highContrastDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(e) => handleChange({ highContrast: e.target.checked })}
                className="w-5 h-5 accent-teal-700 rounded-md cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 4. Audio & Voice Guidance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-teal-700" />
              <span>{t.settings.audioTitle}</span>
            </label>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
              {preferences.language === 'en'
                ? 'English Coach'
                : preferences.language === 'ja'
                ? '日本語音声'
                : preferences.language === 'zh'
                ? '中文语音'
                : preferences.language === 'es'
                ? 'Voz en Español'
                : preferences.language === 'fr'
                ? 'Voix Française'
                : '서현 보이스'}
            </span>
          </div>

          {/* Voice switches */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">{t.settings.voiceGuideTitle}</span>
              <input
                type="checkbox"
                checked={preferences.voiceGuide}
                onChange={(e) => handleChange({ voiceGuide: e.target.checked })}
                className="w-4 h-4 accent-teal-700 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">{t.settings.soundEffectsTitle}</span>
              <input
                type="checkbox"
                checked={preferences.soundEffects}
                onChange={(e) => handleChange({ soundEffects: e.target.checked })}
                className="w-4 h-4 accent-teal-700 cursor-pointer"
              />
            </label>
          </div>

          {/* Voice Character Selection */}
          {preferences.voiceGuide && (
            <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
              <div>
                <span className="text-xs font-bold text-teal-900 block mb-1">
                  {t.settings.voicePersonaTitle}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      id: 'seohyun',
                      label: t.settings.personaSeohyun,
                    },
                    {
                      id: 'gentle',
                      label: t.settings.personaGentle,
                    },
                    {
                      id: 'bright',
                      label: t.settings.personaBright,
                    },
                  ].map((voice) => (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => handleChange({ voicePersona: voice.id as VoicePersona })}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        preferences.voicePersona === voice.id
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-bold">{voice.label}</span>
                        {preferences.voicePersona === voice.id && (
                          <Check className="w-3 h-3 text-teal-200" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Controller */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-700">{t.settings.voiceSpeedTitle}</span>
                  <span className="text-[11px] font-mono text-teal-800">
                    {preferences.voiceSpeed === 0.85
                      ? '0.85x'
                      : preferences.voiceSpeed === 0.95
                      ? '0.95x'
                      : '1.0x'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { speed: 0.85, label: '0.85x' },
                    { speed: 0.95, label: '0.95x' },
                    { speed: 1.0, label: '1.0x' },
                  ].map((s) => (
                    <button
                      key={s.speed}
                      type="button"
                      onClick={() => handleChange({ voiceSpeed: s.speed })}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all cursor-pointer ${
                        preferences.voiceSpeed === s.speed
                          ? 'bg-teal-100 text-teal-900 border-teal-400 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Button */}
              <button
                type="button"
                onClick={() => audioGuide.previewSeohyunVoice(preferences.language || 'ko')}
                className="w-full py-2.5 px-3 bg-white hover:bg-teal-50 border border-teal-300 text-teal-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-teal-700" />
                <span>
                  {preferences.language === 'en'
                    ? 'Preview Voice Coach'
                    : preferences.language === 'ja'
                    ? '音声を試聴'
                    : preferences.language === 'zh'
                    ? '试听语音指导'
                    : preferences.language === 'es'
                    ? 'Probar Voz del Entrenador'
                    : preferences.language === 'fr'
                    ? 'Écouter un Aperçu Vocal'
                    : '서현씨 목소리 들어보기 (미리듣기)'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 5. App Installation (Google Play on Android Web, PWA on iOS/Desktop, hidden in Native App) */}
        {!isInstalled && onOpenInstall && (
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-950">
                  {isAndroidWeb ? 'Google Play 공식 앱 설치' : '스마트폰 앱으로 설치'}
                </p>
                <p className="text-[11px] text-teal-800/80">
                  {isAndroidWeb
                    ? '안드로이드 네이티브 앱으로 더욱 쾌적하게 이용하세요'
                    : '홈 화면 바로가기 & 오프라인 실행 지원'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInstall();
              }}
              className="py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAndroidWeb ? '스토어' : '설치'}</span>
            </button>
          </div>
        )}

        {/* 6. Store & SEO Promotion Center */}
        {onOpenStoreSEO && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">스토어 출시 & 검색 홍보 가이드</p>
                <p className="text-[11px] text-slate-500">구글 광고, 플레이스토어 TWA, 네이버/구글 등록</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStoreSEO();
              }}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <span>가이드</span>
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          설정 완료
        </button>
      </div>
    </div>
  );
};
