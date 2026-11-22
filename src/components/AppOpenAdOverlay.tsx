import React, { useState, useEffect } from 'react';
import { Sparkles, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { isNativeApp } from '../utils/admobNative';

interface AppOpenAdOverlayProps {
  isOpen: boolean;
  onDismiss: () => void;
  triggerReason?: 'startup' | 'completion';
}

export const AppOpenAdOverlay: React.FC<AppOpenAdOverlayProps> = ({
  isOpen,
  onDismiss,
  triggerReason = 'startup',
}) => {
  const isNative = isNativeApp();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const [canSkip, setCanSkip] = useState<boolean>(false);

  // AdMob Interstitial Ad Unit ID provided by user
  const ADMOB_APP_OPEN_SLOT = '8542034027';
  const ADMOB_CLIENT_ID = 'ca-pub-2281115817010682';

  useEffect(() => {
    if (!isOpen || isNative) return;

    setSecondsRemaining(5);
    setCanSkip(false);

    // Try to trigger AdSense/AdMob adsbygoogle push if script is loaded
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      }
    } catch {
      // Graceful fallback
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isNative]);

  if (isNative || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 text-white backdrop-blur-md animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="앱 오프닝 스폰서 광고"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-lg mx-auto px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>눈건강 3분</span>
              <span className="text-[10px] bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded font-mono">
                {triggerReason === 'startup' ? '앱 로딩' : '훈련 완료'}
              </span>
            </span>
          </div>
        </div>

        {/* Skip / Dismiss Button with Countdown */}
        <div className="flex items-center gap-2">
          {!canSkip ? (
            <span className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              광고 건너뛰기까지 <strong className="text-teal-400 font-bold">{secondsRemaining}초</strong>
            </span>
          ) : (
            <button
              onClick={onDismiss}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-md animate-pulse"
            >
              <span>앱으로 이동하기</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Ad Content Container (Centered) */}
      <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col justify-center items-center text-center">
        {/* Real AdMob Web / AdSense Slot */}
        <div className="w-full min-h-[280px] sm:min-h-[340px] bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Ad Tag Badge */}
          <div className="flex items-center justify-between pb-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-widest uppercase">
              Google AdMob · AD
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              단위: ca-app-pub-.../8542
            </span>
          </div>

          {/* AdMob Injected Element */}
          <div className="w-full my-auto py-2">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', minHeight: '180px' }}
              data-ad-client={ADMOB_CLIENT_ID}
              data-ad-slot={ADMOB_APP_OPEN_SLOT}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />

            {/* Visual Sponsor Content Fallback (Guaranteed Rich Presentation) */}
            <div className="space-y-3 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  안과 전문 추천 눈 건강 솔루션
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  초고함량 루테인 지아잔틴 & 아스타잔틴 복합 포뮬러<br />
                  장시간 스마트폰 시청 및 노안 침침함 집중 케어
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <a
                  href="https://www.google.com/search?q=%EB%88%88+%ED%94%BC%EB%A1%9C+%EB%A3%A8%ED%85%8C%EC%9D%B8+%EC%A7%80%EC%95%84%EC%9E%94%ED%8B%B4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-98 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>스폰서 혜택 바로 확인하기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
            본 무료 애플리케이션은 Google AdMob 광고를 통해 지속적으로 업데이트됩니다.
          </p>
        </div>
      </div>

      {/* Bottom Progress & Skip Bar */}
      <div className="w-full max-w-lg mx-auto px-4 pb-6 pt-2 space-y-3">
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-500 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {canSkip ? '광고 시청이 완료되었습니다.' : `${secondsRemaining}초 후 닫기 가능`}
          </span>

          <button
            onClick={onDismiss}
            className="text-xs text-slate-300 hover:text-white underline font-semibold cursor-pointer"
          >
            {canSkip ? '광고 닫기 (바로 시작)' : '앱으로 건너뛰기'}
          </button>
        </div>
      </div>
    </div>
  );
};
