import React from 'react';
import {
  Download,
  X,
  Smartphone,
  Share,
  Zap,
  WifiOff,
  ExternalLink,
  BellRing,
  ShieldCheck,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { PLAY_STORE_URL } from '../utils/admobNative';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroidWeb?: boolean;
  playStoreUrl?: string;
  language?: AppLanguage;
}

const MODAL_TEXT: Record<
  AppLanguage,
  {
    androidBadge: string;
    androidTitle: string;
    androidDesc: string;
    androidCta: string;
    androidSub: string;
    pwaBadge: string;
    pwaTitle: string;
    iosGuideTitle: string;
    iosStep1Prefix: string;
    iosStep1Highlight: string;
    iosStep1Suffix: string;
    iosStep2Prefix: string;
    iosStep2Highlight: string;
    iosStep2Suffix: string;
    iosStep3Prefix: string;
    iosStep3Highlight: string;
    iosStep3Suffix: string;
    benefit1Title: string;
    benefit1Sub: string;
    benefit2Title: string;
    benefit2Sub: string;
    benefit3Title: string;
    benefit3Sub: string;
    androidBenefit3Title: string;
    androidBenefit3Sub: string;
    installPwaBtn: string;
    installPwaSub: string;
    fallbackMenu: string;
    dismissLater: string;
    closeAria: string;
  }
> = {
  ko: {
    androidBadge: 'Google Play 공식 앱',
    androidTitle: '안드로이드 전용 앱으로 설치하세요',
    androidDesc:
      '안드로이드 스마트폰에서는 웹 설치 대신 Google Play 스토어 공식 앱으로 더 빠르고 안정적인 3분 시력 훈련을 이용하실 수 있습니다.',
    androidCta: 'Google Play 스토어에서 설치하기',
    androidSub: '안드로이드 공식 네이티브 앱 · 무료 다운로드',
    pwaBadge: '앱 설치 안내',
    pwaTitle: '스마트폰에 앱으로 설치하세요',
    iosGuideTitle: '아이폰(iOS Safari) 홈 화면 앱 설치 방법',
    iosStep1Prefix: '사파리 브라우저 하단 중앙의 ',
    iosStep1Highlight: '[공유 버튼 ⎋]',
    iosStep1Suffix: '을 터치하세요.',
    iosStep2Prefix: '메뉴를 아래로 스크롤한 뒤 ',
    iosStep2Highlight: '[홈 화면에 추가 ⊞]',
    iosStep2Suffix: '를 선택하세요.',
    iosStep3Prefix: '우측 상단 ',
    iosStep3Highlight: '[추가]',
    iosStep3Suffix: '를 누르면 아이폰 홈 화면에 앱이 설치됩니다.',
    benefit1Title: '1초 바로실행',
    benefit1Sub: '홈 화면 아이콘',
    benefit2Title: '전체 화면',
    benefit2Sub: '주소창 없는 앱',
    benefit3Title: '오프라인 지원',
    benefit3Sub: '데이터 없이 훈련',
    androidBenefit3Title: '네이티브 최적화',
    androidBenefit3Sub: '빠른 화면 & 알림',
    installPwaBtn: '홈 화면에 앱 설치하기',
    installPwaSub: '스토어 로그인 없이 즉시 설치됩니다',
    fallbackMenu:
      "브라우저 메뉴(점 3개)를 누르고 '앱 설치' 또는 '홈 화면에 추가'를 선택하시면 즉시 앱으로 저장됩니다.",
    dismissLater: '나중에 설치하기',
    closeAria: '닫기',
  },
  en: {
    androidBadge: 'Official Android App',
    androidTitle: 'Get the Official Google Play App',
    androidDesc:
      'On Android devices, install the native app directly from Google Play Store for smoother vision workouts and native performance.',
    androidCta: 'Get it on Google Play',
    androidSub: 'Official Android Native App · Free Download',
    pwaBadge: 'Install Web App',
    pwaTitle: 'Add to Your Home Screen',
    iosGuideTitle: 'How to Install on iPhone (iOS Safari)',
    iosStep1Prefix: 'Tap the ',
    iosStep1Highlight: '[Share ⎋]',
    iosStep1Suffix: ' button at the bottom of Safari.',
    iosStep2Prefix: 'Scroll down and tap ',
    iosStep2Highlight: '[Add to Home Screen ⊞]',
    iosStep2Suffix: '.',
    iosStep3Prefix: 'Tap ',
    iosStep3Highlight: '[Add]',
    iosStep3Suffix: ' at the top right to install on your iPhone.',
    benefit1Title: 'Instant Launch',
    benefit1Sub: 'Home screen icon',
    benefit2Title: 'Full Screen',
    benefit2Sub: 'Clean app view',
    benefit3Title: 'Offline Ready',
    benefit3Sub: 'Train anywhere',
    androidBenefit3Title: 'Native Speed',
    androidBenefit3Sub: 'Smooth Android UI',
    installPwaBtn: 'Install App to Home Screen',
    installPwaSub: 'Instant install with no account needed',
    fallbackMenu:
      'Open your browser menu and choose "Install app" or "Add to Home Screen".',
    dismissLater: 'Maybe Later',
    closeAria: 'Close',
  },
  ja: {
    androidBadge: 'Google Play 公式アプリ',
    androidTitle: 'Google Playストアからアプリを入手',
    androidDesc:
      'Android端末では、Google Playストアの公式ネイティブアプリをインストールして、より快適に1日3分の視力訓練をご利用いただけます。',
    androidCta: 'Google Play で入手する',
    androidSub: 'Android 公式ネイティブアプリ・無料ダウンロード',
    pwaBadge: 'アプリ追加案内',
    pwaTitle: 'ホーム画面にアプリを追加',
    iosGuideTitle: 'iPhone (Safari) ホーム画面への追加方法',
    iosStep1Prefix: 'Safari下部の ',
    iosStep1Highlight: '[共有ボタン ⎋]',
    iosStep1Suffix: ' をタップします。',
    iosStep2Prefix: '下にスクロールして ',
    iosStep2Highlight: '[ホーム画面に追加 ⊞]',
    iosStep2Suffix: ' を選択します。',
    iosStep3Prefix: '右上の ',
    iosStep3Highlight: '[追加]',
    iosStep3Suffix: ' を押すとアプリとしてインストールされます。',
    benefit1Title: '1秒で起動',
    benefit1Sub: 'ホームアイコン',
    benefit2Title: '全画面表示',
    benefit2Sub: 'スッキリ画面',
    benefit3Title: 'オフライン対応',
    benefit3Sub: '通信量ゼロ',
    androidBenefit3Title: 'ネイティブ最適化',
    androidBenefit3Sub: '快適な操作性',
    installPwaBtn: 'ホーム画面にインストール',
    installPwaSub: 'ストア登録不要ですぐに追加できます',
    fallbackMenu:
      'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選択してください。',
    dismissLater: 'あとで',
    closeAria: '閉じる',
  },
  zh: {
    androidBadge: 'Google Play 官方应用',
    androidTitle: '前往 Google Play 商店下载官方应用',
    androidDesc:
      '在 Android 设备上，建议直接通过 Google Play 商店安装官方原生应用，享受更流畅的3分钟护眼训练体验。',
    androidCta: '前往 Google Play 安装',
    androidSub: 'Android 官方原生应用 · 免费下载',
    pwaBadge: '应用安装指南',
    pwaTitle: '将应用安装到手机桌面',
    iosGuideTitle: 'iPhone (iOS Safari) 添加到主屏幕方法',
    iosStep1Prefix: '轻点 Safari 底部的 ',
    iosStep1Highlight: '[分享按钮 ⎋]',
    iosStep1Suffix: '。',
    iosStep2Prefix: '向下滑动并选择 ',
    iosStep2Highlight: '[添加到主屏幕 ⊞]',
    iosStep2Suffix: '。',
    iosStep3Prefix: '点击右上角 ',
    iosStep3Highlight: '[添加]',
    iosStep3Suffix: ' 即可在桌面生成应用图标。',
    benefit1Title: '一键直达',
    benefit1Sub: '桌面图标启动',
    benefit2Title: '全屏沉浸',
    benefit2Sub: '无地址栏干扰',
    benefit3Title: '离线训练',
    benefit3Sub: '随时随地护眼',
    androidBenefit3Title: '原生性能',
    androidBenefit3Sub: '流畅稳定体验',
    installPwaBtn: '安装到主屏幕',
    installPwaSub: '无需登录应用商店即可快速安装',
    fallbackMenu:
      '点击浏览器右上角菜单，选择“安装应用”或“添加到主屏幕”即可保存。',
    dismissLater: '以后再说',
    closeAria: '关闭',
  },
  es: {
    androidBadge: 'App Oficial en Google Play',
    androidTitle: 'Descarga la App Oficial en Google Play',
    androidDesc:
      'En Android, instala la aplicación nativa desde Google Play Store para disfrutar de una experiencia más fluida y estable.',
    androidCta: 'Disponible en Google Play',
    androidSub: 'Aplicación Nativa Oficial Android · Gratis',
    pwaBadge: 'Instalar Aplicación',
    pwaTitle: 'Instala la App en tu Teléfono',
    iosGuideTitle: 'Cómo instalar en iPhone (iOS Safari)',
    iosStep1Prefix: 'Toca el botón ',
    iosStep1Highlight: '[Compartir ⎋]',
    iosStep1Suffix: ' en la barra inferior de Safari.',
    iosStep2Prefix: 'Desplázate hacia abajo y selecciona ',
    iosStep2Highlight: '[Añadir a pantalla de inicio ⊞]',
    iosStep2Suffix: '.',
    iosStep3Prefix: 'Toca ',
    iosStep3Highlight: '[Añadir]',
    iosStep3Suffix: ' arriba a la derecha para instalar la app.',
    benefit1Title: 'Inicio Rápido',
    benefit1Sub: 'Icono directo',
    benefit2Title: 'Pantalla Completa',
    benefit2Sub: 'Sin barra web',
    benefit3Title: 'Sin Conexión',
    benefit3Sub: 'Entrena offline',
    androidBenefit3Title: 'App Nativa',
    androidBenefit3Sub: 'Máxima fluidez',
    installPwaBtn: 'Instalar en Pantalla de Inicio',
    installPwaSub: 'Instalación directa sin tienda',
    fallbackMenu:
      'Abre el menú del navegador y selecciona "Instalar aplicación" o "Añadir a pantalla de inicio".',
    dismissLater: 'Más tarde',
    closeAria: 'Cerrar',
  },
  fr: {
    androidBadge: 'App Officielle Google Play',
    androidTitle: 'Téléchargez l’App sur Google Play',
    androidDesc:
      'Sur Android, installez l’application native officielle depuis le Google Play Store pour un entraînement visuel plus fluide.',
    androidCta: 'Télécharger sur Google Play',
    androidSub: 'Application Android Native Officielle · Gratuite',
    pwaBadge: 'Installer l’App',
    pwaTitle: 'Installer sur votre Écran d’Accueil',
    iosGuideTitle: 'Installer sur iPhone (iOS Safari)',
    iosStep1Prefix: 'Appuyez sur le bouton ',
    iosStep1Highlight: '[Partager ⎋]',
    iosStep1Suffix: ' en bas de Safari.',
    iosStep2Prefix: 'Faites défiler et choisissez ',
    iosStep2Highlight: '[Sur l’écran d’accueil ⊞]',
    iosStep2Suffix: '.',
    iosStep3Prefix: 'Appuyez sur ',
    iosStep3Highlight: '[Ajouter]',
    iosStep3Suffix: ' en haut à droite pour installer l’app.',
    benefit1Title: 'Accès Direct',
    benefit1Sub: 'Icône d’accueil',
    benefit2Title: 'Plein Écran',
    benefit2Sub: 'Interface dédiée',
    benefit3Title: 'Hors Ligne',
    benefit3Sub: 'Sans connexion',
    androidBenefit3Title: 'App Native',
    androidBenefit3Sub: 'Fluidité Android',
    installPwaBtn: 'Installer sur l’Écran d’Accueil',
    installPwaSub: 'Installation immédiate sans compte',
    fallbackMenu:
      'Ouvrez le menu du navigateur et sélectionnez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
    dismissLater: 'Plus tard',
    closeAria: 'Fermer',
  },
};

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS,
  isAndroidWeb = false,
  playStoreUrl = PLAY_STORE_URL,
  language = 'ko',
}) => {
  if (!isOpen) return null;

  const copy = MODAL_TEXT[language] || MODAL_TEXT.ko;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src="./pwa-192x192.png"
                alt={isAndroidWeb ? copy.androidTitle : copy.pwaTitle}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                  {isAndroidWeb ? copy.androidBadge : copy.pwaBadge}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {isAndroidWeb ? copy.androidTitle : copy.pwaTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            aria-label={copy.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-2.5 text-center">
            <div className="w-7 h-7 mx-auto rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-800">{copy.benefit1Title}</p>
            <p className="text-[10px] text-slate-500">{copy.benefit1Sub}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-2.5 text-center">
            <div className="w-7 h-7 mx-auto rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-800">{copy.benefit2Title}</p>
            <p className="text-[10px] text-slate-500">{copy.benefit2Sub}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-2.5 text-center">
            <div className="w-7 h-7 mx-auto rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5">
              {isAndroidWeb ? <ShieldCheck className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <p className="text-[11px] font-bold text-slate-800">
              {isAndroidWeb ? copy.androidBenefit3Title : copy.benefit3Title}
            </p>
            <p className="text-[10px] text-slate-500">
              {isAndroidWeb ? copy.androidBenefit3Sub : copy.benefit3Sub}
            </p>
          </div>
        </div>

        {/* Dynamic Platform Action: Android Web -> Google Play Store | iOS -> Safari PWA | Desktop -> Web PWA */}
        {isAndroidWeb ? (
          <div className="space-y-2.5">
            <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-3 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
              <BellRing className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>{copy.androidDesc}</span>
            </div>

            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              <span>{copy.androidCta}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <p className="text-[11px] text-center text-slate-500">{copy.androidSub}</p>
          </div>
        ) : isIOS ? (
          <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-3.5 space-y-2">
            <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5 text-teal-700" />
              <span>{copy.iosGuideTitle}</span>
            </p>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                {copy.iosStep1Prefix}
                <strong className="text-teal-800 font-semibold">{copy.iosStep1Highlight}</strong>
                {copy.iosStep1Suffix}
              </li>
              <li className="leading-relaxed">
                {copy.iosStep2Prefix}
                <strong className="text-teal-800 font-semibold">{copy.iosStep2Highlight}</strong>
                {copy.iosStep2Suffix}
              </li>
              <li className="leading-relaxed">
                {copy.iosStep3Prefix}
                <strong className="text-teal-800 font-semibold">{copy.iosStep3Highlight}</strong>
                {copy.iosStep3Suffix}
              </li>
            </ol>
          </div>
        ) : isInstallable ? (
          <div className="space-y-2">
            <button
              onClick={onInstall}
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{copy.installPwaBtn}</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">{copy.installPwaSub}</p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed text-center">
            {copy.fallbackMenu}
          </div>
        )}

        {/* Footer Dismiss Button */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-center"
          >
            {copy.dismissLater}
          </button>
        </div>
      </div>
    </div>
  );
};
