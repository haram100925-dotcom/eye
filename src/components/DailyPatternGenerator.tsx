import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Scan,
  RefreshCw,
  Focus,
  Check,
  Download,
  Calendar,
  Layers,
  SlidersHorizontal,
  HelpCircle,
  Maximize2,
  Columns,
  Share2,
} from 'lucide-react';
import {
  getDailySeedString,
  hashString,
  seededRandom,
  renderGaborToCanvas,
  GaborVariety,
  getGaborVarietyParams,
  getLocalizedOrientationInfo,
} from '../utils/gaborGenerator';
import { audioGuide } from '../utils/audioGuide';
import { addSession } from '../utils/storage';
import { TargetGroup, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';

interface DailyPatternProps {
  targetGroup: TargetGroup;
  nightMode?: boolean;
  language?: AppLanguage;
}

const sampleNatureImg = '/src/assets/images/sample_nature_view_1790721080406.jpg';

export const DailyPatternGenerator: React.FC<DailyPatternProps> = ({
  targetGroup,
  nightMode = false,
  language = 'ko',
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'daily' | 'custom'>('daily');
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>(sampleNatureImg);
  const [mosaicResolution, setMosaicResolution] = useState<number>(8); // 6, 8, 10, 12
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedDailyTask, setCompletedDailyTask] = useState<boolean>(false);
  const [customViewMode, setCustomViewMode] = useState<'mosaic' | 'split' | 'original'>('mosaic');

  // Daily seed state
  const todaySeedStr = getDailySeedString();
  const [dailyTargetOrientation, setDailyTargetOrientation] = useState<number>(45);
  const [dailyFoundCount, setDailyFoundCount] = useState<number>(0);
  const [dailyTotalTargets, setDailyTotalTargets] = useState<number>(5);

  // Canvas refs
  const dailyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const customCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate Daily Seeded Pattern (Larger grid: 6 cols x 5 rows = 30 large patches)
  const generateDailyPattern = useCallback(() => {
    if (!dailyCanvasRef.current) return;
    const canvas = dailyCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const seed = hashString(todaySeedStr);
    const rng = seededRandom(seed);

    const cols = 6;
    const rows = 5;
    const patchSize = 74; // Significantly larger patches
    const gap = 10;
    canvas.width = cols * (patchSize + gap) + gap;
    canvas.height = rows * (patchSize + gap) + gap;

    // Background
    ctx.fillStyle = nightMode ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const orientations = [0, 30, 45, 60, 90, 120, 135, 150];
    const targetDeg = orientations[Math.floor(rng() * orientations.length)];
    setDailyTargetOrientation(targetDeg);

    const varieties: GaborVariety[] = [
      'single_faint',
      'double_strong',
      'triple_balanced',
      'single_bold',
      'double_soft',
    ];

    let targetCount = 0;
    const tempCanvas = document.createElement('canvas');

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isTarget = rng() < 0.22 || (r === 2 && c === 2 && targetCount === 0);
        let deg = targetDeg;
        if (isTarget) {
          targetCount++;
        } else {
          const others = orientations.filter((o) => o !== targetDeg);
          deg = others[Math.floor(rng() * others.length)];
        }

        const chosenVar = varieties[Math.floor(rng() * varieties.length)];
        const vParams = getGaborVarietyParams(chosenVar, patchSize);

        renderGaborToCanvas(tempCanvas, {
          size: patchSize,
          orientationDeg: deg,
          wavelength: vParams.wavelength,
          contrast: vParams.contrast,
          phase: vParams.phase,
          sigma: vParams.sigma,
        });

        const x = gap + c * (patchSize + gap);
        const y = gap + r * (patchSize + gap);
        ctx.drawImage(tempCanvas, x, y);
      }
    }
    setDailyTotalTargets(targetCount);
    setDailyFoundCount(0);
    setCompletedDailyTask(false);
  }, [todaySeedStr, nightMode]);

  useEffect(() => {
    if (activeTab === 'daily') {
      generateDailyPattern();
    }
  }, [activeTab, generateDailyPattern]);

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImageSrc(event.target.result as string);
          setCustomViewMode('mosaic');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded/selected image into Gabor Orientation Mosaic (High resolution 520px)
  const renderCustomGaborMosaic = useCallback(() => {
    if (!customCanvasRef.current || !selectedImageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedImageSrc;
    img.onload = () => {
      const canvas = customCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 520; // High resolution large canvas
      canvas.width = size;
      canvas.height = size;

      // Draw original image on small offscreen canvas to sample luminance gradients
      const offCanvas = document.createElement('canvas');
      offCanvas.width = mosaicResolution;
      offCanvas.height = mosaicResolution;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, mosaicResolution, mosaicResolution);
      const imgData = offCtx.getImageData(0, 0, mosaicResolution, mosaicResolution).data;

      // Clear main canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, size, size);

      const cellPx = size / mosaicResolution;
      const patchCanvas = document.createElement('canvas');

      for (let y = 0; y < mosaicResolution; y++) {
        for (let x = 0; x < mosaicResolution; x++) {
          const idx = (y * mosaicResolution + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          // Luminance calculation
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Estimate local angle based on neighbor contrast
          let angle = (lum / 255) * 180;
          if (x > 0) {
            const leftLum =
              0.299 * imgData[idx - 4] + 0.587 * imgData[idx - 3] + 0.114 * imgData[idx - 2];
            angle = (Math.atan2(lum - leftLum, 25) * 180) / Math.PI + 90;
          }

          renderGaborToCanvas(patchCanvas, {
            size: Math.round(cellPx * 0.94),
            orientationDeg: Math.round(angle) % 180,
            wavelength: Math.max(8, Math.round(cellPx / 3.2)),
            contrast: 0.88,
          });

          ctx.drawImage(
            patchCanvas,
            x * cellPx + cellPx * 0.03,
            y * cellPx + cellPx * 0.03,
            cellPx * 0.94,
            cellPx * 0.94
          );
        }
      }

      setIsProcessing(false);
      audioGuide.playSuccessChime();
    };
  }, [selectedImageSrc, mosaicResolution]);

  useEffect(() => {
    if (activeTab === 'custom') {
      renderCustomGaborMosaic();
    }
  }, [activeTab, renderCustomGaborMosaic]);

  const handleCompleteDaily = () => {
    setCompletedDailyTask(true);
    audioGuide.playCelebrationFanfare();
    const patternDonePhrases: Record<string, string> = {
      ko: '오늘의 일일 가보르 패턴 훈련을 완료했습니다!',
      en: 'Completed today’s daily Gabor pattern training!',
      ja: '本日のデイリーガボールパターン訓練を完了しました！',
      zh: '今天的每日伽博图案训练已顺利完成！',
      es: '¡Ha completado el entrenamiento de patrones Gabor de hoy!',
      fr: 'Entraînement quotidien aux motifs Gabor terminé avec succès !',
    };
    audioGuide.speak(patternDonePhrases[language] || patternDonePhrases.ko, undefined, undefined, language);
    addSession({
      date: todaySeedStr,
      durationSeconds: 120,
      type: 'pattern_custom',
      score: 180,
      accuracy: 100,
    });
  };

  const handleDownloadCanvas = () => {
    const canvas = activeTab === 'daily' ? dailyCanvasRef.current : customCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `gabor-vision-pattern-${todaySeedStr}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-teal-800">{t.pattern.badge}</span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">{t.pattern.subBadge}</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {activeTab === 'daily' ? t.pattern.dailyTab : t.pattern.customTab}
          </h2>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.pattern.dailyTab}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.pattern.customTab}
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY SEEDED PATTERN (EXPANDED LARGE CANVAS) */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-teal-50/80 border border-teal-100 p-3 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-teal-900">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span className="font-semibold">{todaySeedStr} {t.pattern.todayPattern}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const orientInfo = getLocalizedOrientationInfo(dailyTargetOrientation, language);
                return (
                  <span className="text-teal-950 font-bold bg-white px-3 py-1 rounded-xl border border-teal-200 flex items-center gap-1.5 shadow-xs">
                    <span>{t.pattern.targetOrientation}</span>
                    <span className="text-white bg-teal-700 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                      <span>{orientInfo.symbol}</span>
                      <span>{orientInfo.label}</span>
                    </span>
                  </span>
                );
              })()}
              <span className="text-xs text-slate-500 font-mono">
                ({dailyTotalTargets}{t.pattern.targetsHidden})
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {t.pattern.guideText}{' '}
            <strong className="text-teal-900 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
              {getLocalizedOrientationInfo(dailyTargetOrientation, language).label} ({getLocalizedOrientationInfo(dailyTargetOrientation, language).symbol})
            </strong>
          </p>

          {/* Large Daily Canvas Container */}
          <div className="w-full flex justify-center p-3 sm:p-5 bg-slate-900/95 rounded-3xl border border-slate-800 shadow-inner overflow-x-auto">
            <canvas
              ref={dailyCanvasRef}
              className="rounded-2xl shadow-md max-w-full h-auto block"
              style={{ maxHeight: '460px' }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={handleDownloadCanvas}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.pattern.downloadPng}</span>
            </button>

            {completedDailyTask ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-4 py-2 rounded-xl">
                <Check className="w-4 h-4" />
                <span>{t.pattern.completedBadge}</span>
              </div>
            ) : (
              <button
                onClick={handleCompleteDaily}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t.pattern.foundAllBtn}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM IMAGE TO GABOR MOSAIC (EXPANDED LARGE CANVAS) */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          {/* Explanation Box answering user's question directly */}
          <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-950 font-bold text-xs sm:text-sm">
              <Focus className="w-4 h-4 text-teal-700 shrink-0" />
              <span>사진 가보르 모자이크 변환 원리</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              업로드하신 사진의 <strong>명암과 윤곽선 각도를 정밀 분석</strong>하여, 사진 전체가{' '}
              <strong>수십~수백 개의 과학적 가보르 패치 줄무늬로 이루어진 시력 자극 모자이크 이미지</strong>
              로 자동 변환 생성됩니다. 아래 <strong>[고화질 이미지 저장]</strong> 버튼으로 기기에 저장하실 수 있습니다.
            </p>
          </div>

          {/* Control Bar: Upload, Reset, View Mode, Resolution Slider */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center justify-center gap-1.5 py-2 px-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl cursor-pointer text-xs font-bold shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>내 사진 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    setSelectedImageSrc(sampleNatureImg);
                    setCustomViewMode('mosaic');
                  }}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                >
                  기본 숲 사진으로 리셋
                </button>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs">
                <button
                  onClick={() => setCustomViewMode('mosaic')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    customViewMode === 'mosaic'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  가보르 모자이크
                </button>
                <button
                  onClick={() => setCustomViewMode('split')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    customViewMode === 'split'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  나란히 비교
                </button>
                <button
                  onClick={() => setCustomViewMode('original')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    customViewMode === 'original'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  원본 사진
                </button>
              </div>
            </div>

            {/* Resolution Selector Slider */}
            <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
                <span>패치 밀도: {mosaicResolution}x{mosaicResolution} ({mosaicResolution * mosaicResolution}개 패치)</span>
              </span>
              <input
                type="range"
                min="6"
                max="12"
                step="2"
                value={mosaicResolution}
                onChange={(e) => setMosaicResolution(parseInt(e.target.value, 10))}
                className="w-full accent-teal-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-500 shrink-0">
                {mosaicResolution <= 6 ? '대형' : mosaicResolution <= 8 ? '표준' : '고밀도'}
              </span>
            </div>
          </div>

          {/* Large Canvas Display Area */}
          <div className="w-full bg-slate-950 p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center min-h-[380px] shadow-inner">
            {customViewMode === 'mosaic' && (
              <div className="flex flex-col items-center space-y-2 w-full">
                <div className="relative max-w-md w-full aspect-square rounded-2xl overflow-hidden border-2 border-teal-500/40 shadow-2xl bg-slate-900 flex items-center justify-center">
                  <canvas
                    ref={customCanvasRef}
                    className="w-full h-full object-contain block"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-teal-300 text-xs font-bold">
                      가보르 광학 변환 중...
                    </div>
                  )}
                </div>
                <span className="text-xs text-teal-300 font-semibold flex items-center gap-1.5 pt-1">
                  <Focus className="w-3.5 h-3.5" />
                  <span>변환 완료: 사진 윤곽선 기반 대화면 가보르 모자이크</span>
                </span>
              </div>
            )}

            {customViewMode === 'split' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl justify-items-center">
                {/* Original */}
                <div className="flex flex-col items-center space-y-1.5 w-full max-w-[280px]">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-700 shadow-md">
                    <img
                      src={selectedImageSrc}
                      alt="원본 사진"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-slate-400">선택된 원본 사진</span>
                </div>

                {/* Generated Gabor */}
                <div className="flex flex-col items-center space-y-1.5 w-full max-w-[280px]">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-teal-500/40 shadow-md bg-slate-900">
                    <canvas
                      ref={customCanvasRef}
                      className="w-full h-full object-contain block"
                    />
                  </div>
                  <span className="text-xs text-teal-300 font-semibold">
                    생성된 가보르 모자이크
                  </span>
                </div>
              </div>
            )}

            {customViewMode === 'original' && (
              <div className="flex flex-col items-center space-y-2 w-full max-w-md">
                <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                  <img
                    src={selectedImageSrc}
                    alt="원본 사진"
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
                <span className="text-xs text-slate-400">업로드된 원본 이미지</span>
              </div>
            )}
          </div>

          {/* Bottom Bar: Action & Download */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <span className="text-slate-500 text-[11px]">
              💡 생성된 가보르 모자이크를 1분간 편안하게 응시하면 뇌의 흐릿함 보정 신경망이 단련됩니다.
            </span>
            <button
              onClick={handleDownloadCanvas}
              className="text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 flex items-center gap-1.5 px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>고화질 이미지 저장 (PNG)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
