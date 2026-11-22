import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Target,
} from 'lucide-react';
import { audioGuide } from '../utils/audioGuide';
import { isNativeApp } from '../utils/admobNative';

interface InterstitialAdModalProps {
  isOpen: boolean;
  onAdCompleted: () => void;
  title?: string;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  onAdCompleted,
  title = '정밀 시력 측정을 위한 스폰서 광고',
}) => {
  const isNative = isNativeApp();
  const COUNTDOWN_SECONDS = 5;
  const [timeLeft, setTimeLeft] = useState<number>(COUNTDOWN_SECONDS);
  const [canProceed, setCanProceed] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (isOpen && !isNative) {
      setTimeLeft(COUNTDOWN_SECONDS);
      setCanProceed(false);

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanProceed(true);
            audioGuide.playSuccessChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isNative]);

  if (isNative || !isOpen) return null;

  const progressPercent = ((COUNTDOWN_SECONDS - timeLeft) / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Top Header: AD badge & Mandatory Countdown indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase border border-amber-300">
              전면 광고
            </span>
            <span className="text-xs text-slate-500 font-medium">스폰서 지원</span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
            {canProceed ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>시청 완료</span>
              </span>
            ) : (
              <span className="text-amber-800 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>{timeLeft}초 후 진행 가능</span>
              </span>
            )}
          </div>
        </div>

        {/* 5-Second Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Sponsor Content Area (Google AdSense/AdMob Rich Media format) */}
        <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-teal-300 uppercase tracking-wider font-semibold">
                  안과 전문 클리닉 제휴
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                  노안 & 초점 조절력 정밀 안과 검진
                </h4>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            침침한 시야, 글씨가 겹쳐 보인다면? 전국 50개 안과 네트워크에서 제공하는 전문 안구 정밀 검진 특별 할인 혜택을 확인해보세요.
          </p>

          <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-700/60">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>안심 스폰서 검증 완료</span>
            </span>
            <a
              href="https://www.google.com/search?q=%EB%85%B8%EC%95%88+%EC%A0%95%EB%B0%80+%EC%95%88%EA%B3%BC+%EA%B2%80%EC%A7%84"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 hover:text-teal-200 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>자세히 보기</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom Notice on Server Sustainability */}
        <p className="text-[11px] text-slate-500 text-center leading-tight">
          💡 무료 서비스 유지 및 서버 운영을 위해 시력 측정 전 스폰서 광고가 5초간 재생됩니다.
        </p>

        {/* Action Button: Disabled during 5s, vibrant when finished */}
        <button
          onClick={canProceed ? onAdCompleted : undefined}
          disabled={!canProceed}
          className={`w-full h-12 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            canProceed
              ? 'bg-teal-700 hover:bg-teal-800 text-white animate-pulse'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80'
          }`}
        >
          {canProceed ? (
            <>
              <span>광고 닫고 시력 측정 시작</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>광고 시청 중 ({timeLeft}초 남음)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
