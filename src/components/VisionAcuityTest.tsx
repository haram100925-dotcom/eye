import React, { useState } from 'react';
import {
  Target,
  Play,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Info,
} from 'lucide-react';
import { audioGuide } from '../utils/audioGuide';
import { addVisionTest } from '../utils/storage';
import { VisionTestRecord, AppLanguage } from '../types';
import { InterstitialAdModal } from './InterstitialAdModal';
import { getTranslation } from '../utils/i18n';
import { isNativeApp, showNativeInterstitial } from '../utils/admobNative';

interface VisionTestProps {
  onTestComplete?: (record: VisionTestRecord) => void;
  language?: AppLanguage;
}

type Direction = 'up' | 'right' | 'down' | 'left';
type EyeStage = 'left' | 'right' | 'both';

const VISION_LEVELS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.5];

export const VisionAcuityTest: React.FC<VisionTestProps> = ({ onTestComplete, language = 'ko' }) => {
  const [stage, setStage] = useState<'intro' | 'testing' | 'result'>('intro');
  const [showAd, setShowAd] = useState<boolean>(false);
  const [currentEye, setCurrentEye] = useState<EyeStage>('left');
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [currentDir, setCurrentDir] = useState<Direction>('right');
  const [streakCorrect, setStreakCorrect] = useState<number>(0);
  const t = getTranslation(language);

  // Result records
  const [leftScore, setLeftScore] = useState<number>(0.1);
  const [rightScore, setRightScore] = useState<number>(0.1);
  const [bothScore, setBothScore] = useState<number>(0.1);

  const getRandomDirection = (): Direction => {
    const dirs: Direction[] = ['up', 'right', 'down', 'left'];
    return dirs[Math.floor(Math.random() * dirs.length)];
  };

  const startTest = () => {
    setStage('testing');
    setCurrentEye('left');
    setLevelIndex(0);
    setStreakCorrect(0);
    setCurrentDir(getRandomDirection());
    audioGuide.speak(
      language === 'en'
        ? 'Starting self vision exam. Cover your right eye and select the opening direction of the ring.'
        : language === 'ja'
        ? '視力セルフ測定を開始します。右目を隠して、環の切れ目の方向を選んでください。'
        : language === 'zh'
        ? '开始视力自测。请遮住右眼，选择圆环缺口朝向。'
        : language === 'es'
        ? 'Iniciando autoevaluación visual. Cubra su ojo derecho y seleccione la apertura del anillo.'
        : language === 'fr'
        ? 'Début du test visuel. Couvrez votre œil droit et sélectionnez l’ouverture de l’anneau.'
        : '시력 자가 측정을 시작합니다. 오른쪽 눈을 가리고 화면의 고리 뚫린 방향을 선택하세요.',
      undefined,
      undefined,
      language
    );
  };

  // Convert decimal acuity to SVG Landolt C ring size
  const getRingSize = (acuity: number) => {
    // 0.1 is large (e.g. 110px), 1.5 is small (e.g. 14px)
    return Math.max(14, Math.round(110 / (acuity * 4 + 0.6)));
  };

  const handleSelectDirection = (chosen: Direction) => {
    const isCorrect = chosen === currentDir;

    if (isCorrect) {
      audioGuide.playSuccessChime();
      const currentAcuity = VISION_LEVELS[levelIndex];

      if (levelIndex + 1 < VISION_LEVELS.length) {
        setLevelIndex((prev) => prev + 1);
        setCurrentDir(getRandomDirection());
      } else {
        advanceEyeStage(currentAcuity);
      }
    } else {
      audioGuide.playErrorChime();
      const finalAcuity = VISION_LEVELS[Math.max(0, levelIndex - 1)];
      advanceEyeStage(finalAcuity);
    }
  };

  const advanceEyeStage = (scoreAchieved: number) => {
    if (currentEye === 'left') {
      setLeftScore(scoreAchieved);
      setCurrentEye('right');
      setLevelIndex(0);
      setCurrentDir(getRandomDirection());
      const leftDonePhrases: Record<string, string> = {
        ko: '왼쪽 눈 완료. 이제 왼쪽 눈을 가리고 오른쪽 눈으로 측정합니다.',
        en: 'Left eye completed. Now cover your left eye and test your right eye.',
        ja: '左目の測定完了。次は左目を隠して、右目で測定します。',
        zh: '左眼测试完成。现在请遮住左眼，进行右眼测试。',
        es: 'Ojo izquierdo completado. Ahora cubra su ojo izquierdo y evalúe su ojo derecho.',
        fr: 'Œil gauche terminé. Couvrez maintenant votre œil gauche pour tester l’œil droit.',
      };
      audioGuide.speak(leftDonePhrases[language] || leftDonePhrases.ko, undefined, undefined, language);
    } else if (currentEye === 'right') {
      setRightScore(scoreAchieved);
      setCurrentEye('both');
      setLevelIndex(0);
      setCurrentDir(getRandomDirection());
      const rightDonePhrases: Record<string, string> = {
        ko: '오른쪽 눈 완료. 이제 양쪽 눈을 모두 뜨고 측정합니다.',
        en: 'Right eye completed. Now open both eyes for the binocular test.',
        ja: '右目の測定完了。次は両目を開けて測定します。',
        zh: '右眼测试完成。现在请睁开双眼进行双眼测试。',
        es: 'Ojo derecho completado. Ahora abra ambos ojos para la prueba binocular.',
        fr: 'Œil droit terminé. Ouvrez maintenant les deux yeux pour le test binoculaire.',
      };
      audioGuide.speak(rightDonePhrases[language] || rightDonePhrases.ko, undefined, undefined, language);
    } else {
      setBothScore(scoreAchieved);
      setStage('result');
      audioGuide.playCelebrationFanfare();
      const completePhrases: Record<string, string> = {
        ko: '시력 측정이 완료되었습니다! 결과가 저장되었습니다.',
        en: 'Vision acuity test completed! Your record has been saved.',
        ja: '視力セルフ測定が完了しました！記録が保存されました。',
        zh: '视力自测完成！记录已自动保存。',
        es: '¡Evaluación visual completada! El registro ha sido guardado.',
        fr: 'Test d’acuité visuelle terminé ! Votre résultat a été enregistré.',
      };
      audioGuide.speak(completePhrases[language] || completePhrases.ko, undefined, undefined, language);

      const record = addVisionTest({
        date: new Date().toISOString().split('T')[0],
        leftEye: leftScore,
        rightEye: rightScore,
        bothEyes: scoreAchieved,
        note: '란돌트 고리 자가 시력 측정',
      });

      if (onTestComplete) {
        onTestComplete(record);
      }
    }
  };

  const currentAcuity = VISION_LEVELS[levelIndex];
  const ringPx = getRingSize(currentAcuity);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-teal-800">{t.visionTest.badge}</span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">{t.appName}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900">{t.visionTest.title}</h2>
        </div>

        {stage === 'testing' && (
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl">
            {t.visionTest.estimatedAcuity} {currentAcuity.toFixed(1)}
          </span>
        )}
      </div>

      {/* INTRO SCREEN */}
      {stage === 'intro' && (
        <div className="py-4 space-y-4 text-center">
          <div className="w-16 h-16 bg-teal-50 text-teal-800 rounded-2xl mx-auto flex items-center justify-center border border-teal-100 shadow-xs">
            <Target className="w-8 h-8 text-teal-700" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {t.visionTest.title}
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              {t.visionTest.desc}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>{t.visionTest.step1Title} ➡️ {t.visionTest.step2Title} ➡️ {t.visionTest.step3Title}</span>
            </div>
          </div>

          <button
            onClick={async () => {
              if (isNativeApp()) {
                await showNativeInterstitial({ force: true });
                startTest();
              } else {
                setShowAd(true);
              }
            }}
            className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>{t.visionTest.startTestBtn}</span>
          </button>

          {/* Interstitial Ad Modal before Test (Web fallback only) */}
          <InterstitialAdModal
            isOpen={showAd}
            onAdCompleted={() => {
              setShowAd(false);
              startTest();
            }}
          />
        </div>
      )}

      {/* TESTING SCREEN */}
      {stage === 'testing' && (
        <div className="space-y-4">
          <div className="bg-slate-100/80 border border-slate-200 rounded-xl py-2 px-3 text-center text-xs text-slate-700 flex items-center justify-center gap-1.5 font-medium">
            <Target className="w-3.5 h-3.5 text-teal-700" />
            <span>
              {currentEye === 'left' && t.visionTest.step1Title}
              {currentEye === 'right' && t.visionTest.step2Title}
              {currentEye === 'both' && t.visionTest.step3Title}
            </span>
          </div>

          {/* Landolt Ring Viewport */}
          <div className="h-56 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-center p-4">
            <svg
              width={ringPx}
              height={ringPx}
              viewBox="0 0 100 100"
              style={{
                transform:
                  currentDir === 'right'
                    ? 'rotate(0deg)'
                    : currentDir === 'down'
                    ? 'rotate(90deg)'
                    : currentDir === 'left'
                    ? 'rotate(180deg)'
                    : 'rotate(270deg)',
              }}
              className="transition-transform duration-150"
            >
              {/* Landolt C shape */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                className="text-slate-900"
                strokeWidth="20"
                strokeDasharray="210 50"
                strokeDashoffset="25"
              />
            </svg>
          </div>

          {/* 4-way Directional Controls */}
          <div className="space-y-2">
            <p className="text-center text-xs font-medium text-slate-600">
              {t.visionTest.whichWayOpening}
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div />
              <button
                onClick={() => handleSelectDirection('up')}
                className="h-12 bg-white hover:bg-slate-50 active:bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-800 shadow-xs cursor-pointer"
                aria-label={t.visionTest.up}
                title={t.visionTest.up}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onClick={() => handleSelectDirection('left')}
                className="h-12 bg-white hover:bg-slate-50 active:bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-800 shadow-xs cursor-pointer"
                aria-label={t.visionTest.left}
                title={t.visionTest.left}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleSelectDirection('down')}
                className="h-12 bg-white hover:bg-slate-50 active:bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-800 shadow-xs cursor-pointer"
                aria-label={t.visionTest.down}
                title={t.visionTest.down}
              >
                <ArrowDown className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleSelectDirection('right')}
                className="h-12 bg-white hover:bg-slate-50 active:bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-800 shadow-xs cursor-pointer"
                aria-label={t.visionTest.right}
                title={t.visionTest.right}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT SCREEN */}
      {stage === 'result' && (
        <div className="py-4 space-y-4 text-center">
          <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">{t.visionTest.resultTitle}</h3>
            <p className="text-xs text-slate-500">
              {t.visionTest.resultDesc}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
            <div className="text-center">
              <span className="text-[11px] text-slate-400">{t.visionTest.leftEye}</span>
              <p className="text-xl font-black text-slate-900 font-mono">
                {leftScore.toFixed(1)}
              </p>
            </div>
            <div className="text-center border-x border-slate-200">
              <span className="text-[11px] text-slate-400">{t.visionTest.rightEye}</span>
              <p className="text-xl font-black text-slate-900 font-mono">
                {rightScore.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <span className="text-[11px] text-teal-700 font-semibold">{t.visionTest.bothEyes}</span>
              <p className="text-xl font-black text-teal-700 font-mono">
                {bothScore.toFixed(1)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStage('intro')}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.visionTest.retestBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
