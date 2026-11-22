import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-600/95 text-white shadow-xl backdrop-blur-md border border-amber-400/30 animate-in slide-in-from-bottom duration-300 max-w-md">
      <div className="w-8 h-8 rounded-xl bg-amber-700/60 flex items-center justify-center shrink-0">
        <WifiOff className="w-4 h-4 text-amber-200" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-tight">오프라인 모드 실행 중</p>
        <p className="text-[11px] text-amber-100/90 leading-tight truncate">
          인터넷 없이도 가보르 훈련과 시력 테스트가 정상 작동합니다
        </p>
      </div>
    </div>
  );
};
