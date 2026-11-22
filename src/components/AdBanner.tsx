import React, { useState, useEffect } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { isNativeApp } from '../utils/admobNative';

interface AdBannerProps {
  slotId?: string;
  adSenseClientId?: string;
  className?: string;
  autoRefreshIntervalSeconds?: number;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = '9855115692',
  adSenseClientId = 'ca-pub-2281115817010682',
  className = '',
  autoRefreshIntervalSeconds = 45,
}) => {
  const isNative = isNativeApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [adCycle, setAdCycle] = useState<number>(0);

  // Rotate sample ads if native AdSense banner is loading or blocked by adblock
  const sponsorAds = [
    {
      title: '루테인 지아잔틴 24:4 안과 추천 배합',
      desc: '장시간 스마트폰 블루라이트 케어 · 노안 침침함 완화 특가',
      query: '눈+피로+루테인+지아잔틴',
      tag: '스폰서',
    },
    {
      title: '아스타잔틴 눈 피로도 개선 건강기능식품',
      desc: '모양체근 피로 완화 및 초점 조절력 보조 비타민 A·E',
      query: '아스타잔틴+눈+피로+개선',
      tag: '추천',
    },
    {
      title: '온열 눈 마사지기 & 안구 찜질팩 기획전',
      desc: '자기 전 10분 따뜻한 눈 혈액순환 케어로 뻑뻑함 해소',
      query: '온열+눈+마사지기+안대',
      tag: '특가',
    },
  ];

  const currentAd = sponsorAds[adCycle % sponsorAds.length];

  // Auto-refresh interval (일정 시간 후 자동 새로고침)
  useEffect(() => {
    if (isNative) return;
    const timer = setInterval(() => {
      setAdCycle((prev) => prev + 1);

      // Trigger AdMob / AdSense adsbygoogle refresh
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        }
      } catch {
        // Fallback gracefully
      }
    }, autoRefreshIntervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshIntervalSeconds, isNative]);

  if (isNative || isDismissed) return null;

  return (
    <aside
      className={`w-full bg-slate-900 border-t border-slate-800 text-white select-none transition-all shadow-lg ${className}`}
      aria-label="스폰서 사각형 배너 광고"
    >
      <div className="max-w-4xl mx-auto px-3 py-1.5 flex items-center justify-between gap-2.5">
        {/* Left: AdMob Tag Badge & Sponsor text */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col items-center shrink-0">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">
              AD
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 truncate">
                {currentAd.title}
              </span>
              <span className="hidden sm:inline text-[10px] bg-teal-900/60 text-teal-300 px-1.5 py-0.2 rounded border border-teal-700/50">
                {currentAd.tag}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate hidden xs:block">
              {currentAd.desc}
            </p>
          </div>
        </div>

        {/* Real AdMob Banner Hidden Injected Slot */}
        <div className="hidden">
          <ins
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '320px', height: '50px' }}
            data-ad-client={adSenseClientId}
            data-ad-slot={slotId}
            data-ad-format="horizontal"
            data-full-width-responsive="false"
          />
        </div>

        {/* Right: CTA Button & Information */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`https://www.google.com/search?q=${currentAd.query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1 px-2.5 sm:px-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <span>혜택 보기</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
            title="광고 안내"
            aria-label="광고 안내"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Popover */}
      {showInfo && (
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-300">
              💡 Google AdMob 배너 광고 (단위: ca-app-pub-2281115817010682/{slotId})
            </p>
            <p className="text-[10px] text-slate-500">
              {autoRefreshIntervalSeconds}초마다 새로운 광고로 자동 새로고침됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="text-slate-400 hover:text-white ml-2 underline text-[10px] cursor-pointer"
          >
            닫기
          </button>
        </div>
      )}
    </aside>
  );
};
