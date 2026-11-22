import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  sharedUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && sharedUrl) {
      QRCode.toDataURL(sharedUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f766e', // Teal 700 brand color
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error', err));
    }
  }, [isOpen, sharedUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sharedUrl);
      } else {
        const input = document.createElement('input');
        input.value = sharedUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '하루 3분 눈 건강 - 시력 회복 & 가보르 트레이너',
          text: '하루 3분 가보르 패치와 입체시 훈련으로 노안과 눈 피로를 회복해보세요!',
          url: sharedUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">앱 공유 & 스마트폰 열기</h3>
              <p className="text-xs text-slate-500">QR코드 및 링크 복사로 즉시 실행</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-white rounded-2xl shadow-sm border border-teal-200/60 mb-2.5">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="앱 접속 QR 코드"
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                QR 코드 생성 중...
              </div>
            )}
          </div>
          <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5 mb-0.5">
            <Smartphone className="w-3.5 h-3.5 text-teal-700" />
            <span>스마트폰 카메라로 비춰보세요</span>
          </p>
          <p className="text-[11px] text-slate-600">
            기본 카메라를 대면 주소 입력 없이 폰에서 바로 앱이 열립니다
          </p>
        </div>

        {/* URL Display & 1-Click Copy */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">앱 공식 링크</label>
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="text"
              readOnly
              value={sharedUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-700 hover:bg-teal-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>링크 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Short URL / Sharing Assistance */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>카카오톡/문자 공유 팁</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            위 <strong>[링크 복사]</strong> 버튼을 누른 후 카카오톡 채팅방에 붙여넣기만 하셔도 프리뷰 카드와 함께 예쁘게 전송됩니다.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          확인 완료
        </button>
      </div>
    </div>
  );
};
