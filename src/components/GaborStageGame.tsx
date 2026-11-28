import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Lock,
  Unlock,
  Star,
  RotateCcw,
  ChevronRight,
  Trophy,
  CheckCircle2,
  Timer,
  Target,
  ArrowLeft,
} from 'lucide-react';
import { GaborPatchCanvas } from './GaborPatchCanvas';
import { STAGES_CONFIG, getUnlockedLevel, setUnlockedLevel, addSession } from '../utils/storage';
import { audioGuide } from '../utils/audioGuide';
import {
  renderStereogramToCanvas,
  StereogramShape,
  GaborVariety,
  getGaborVarietyParams,
  getLocalizedOrientationInfo,
} from '../utils/gaborGenerator';
import { StageConfig, TargetGroup, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';

interface GaborStageGameProps {
  targetGroup: TargetGroup;
  voiceEnabled: boolean;
  onSessionComplete?: () => void;
  language?: AppLanguage;
}

interface GridPatch {
  id: number;
  orientation: number;
  wavelength: number;
  contrast?: number;
  phase?: number;
  sigma?: number;
  matched: boolean;
}

export const GaborStageGame: React.FC<GaborStageGameProps> = ({
  targetGroup,
  voiceEnabled,
  onSessionComplete,
  language = 'ko',
}) => {
  const t = getTranslation(language);
  const [unlockedLevel, setUnlockedLevelState] = useState<number>(1);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);

  // Current stage active config
  const currentStage: StageConfig = STAGES_CONFIG[selectedLevel - 1] || STAGES_CONFIG[0];

  // Gameplay state
  const [timeLeft, setTimeLeft] = useState<number>(currentStage.timeLimit);
  const [gridPatches, setGridPatches] = useState<GridPatch[]>([]);
  const [firstSelectedId, setFirstSelectedId] = useState<number | null>(null);
  const [targetOrientation, setTargetOrientation] = useState<number>(0);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [successfulAttempts, setSuccessfulAttempts] = useState<number>(0);

  // Stereogram in level 5 & 8
  const stereogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stereogramShape, setStereogramShape] = useState<StereogramShape>('heart');
  const [stereogramGuessed, setStereogramGuessed] = useState<boolean>(false);

  useEffect(() => {
    setUnlockedLevelState(getUnlockedLevel());
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && timeLeft > 0 && !isCompleted && !isFailed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleStageFailed();
            return 0;
          }
          if (prev <= 5) {
            audioGuide.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeLeft, isCompleted, isFailed]);

  // Setup grid when stage starts
  const setupStage = useCallback((stage: StageConfig) => {
    setTimeLeft(stage.timeLimit);
    setIsCompleted(false);
    setIsFailed(false);
    setMatchesFound(0);
    setFirstSelectedId(null);
    setTotalAttempts(0);
    setSuccessfulAttempts(0);

    if (stage.type === 'stereogram_depth') {
      const shapes: StereogramShape[] = stage.level === 5 ? ['heart', 'star', 'ring'] : ['diamond', 'pyramid', 'ring'];
      const chosen = shapes[Math.floor(Math.random() * shapes.length)];
      setStereogramShape(chosen);
      setStereogramGuessed(false);
      setIsPlaying(true);
      setTimeout(() => {
        if (stereogramCanvasRef.current) {
          renderStereogramToCanvas(stereogramCanvasRef.current, chosen, 320, 240, 50);
        }
      }, 100);
      return;
    }

    const totalCells = stage.gridRows * stage.gridCols;
    const items: GridPatch[] = [];
    let id = 1;

    if (stage.type === 'find_target') {
      // Pick one orientation as target
      const targetDeg = stage.orientations[Math.floor(Math.random() * stage.orientations.length)];
      setTargetOrientation(targetDeg);

      // Fill grid: targetCount of target, rest are random distractors
      for (let i = 0; i < stage.targetCount; i++) {
        items.push({
          id: id++,
          orientation: targetDeg,
          wavelength: stage.frequency,
          matched: false,
        });
      }
      const otherOrientations = stage.orientations.filter((deg) => deg !== targetDeg);
      const distractorsNeeded = totalCells - stage.targetCount;
      for (let i = 0; i < distractorsNeeded; i++) {
        const deg = otherOrientations.length > 0
          ? otherOrientations[i % otherOrientations.length]
          : (targetDeg + 45) % 180;
        items.push({
          id: id++,
          orientation: deg,
          wavelength: stage.frequency,
          matched: false,
        });
      }
    } else {
      // 'match_pair': Pairs of orientations with diverse optical styles (strictly 1 to 3 lines max)
      const varieties: GaborVariety[] = [
        'single_faint',
        'double_strong',
        'triple_balanced',
        'single_bold',
        'double_soft',
      ];
      const pairsNeeded = Math.floor(totalCells / 2);
      const shuffledOrientations = [...stage.orientations].sort(() => Math.random() - 0.5);
      for (let i = 0; i < pairsNeeded; i++) {
        const deg = shuffledOrientations[i % shuffledOrientations.length];
        const chosenVar = varieties[i % varieties.length];
        const vParams = getGaborVarietyParams(chosenVar, 60);
        items.push({
          id: id++,
          orientation: deg,
          wavelength: vParams.wavelength,
          contrast: vParams.contrast,
          phase: vParams.phase,
          sigma: vParams.sigma,
          matched: false,
        });
        items.push({
          id: id++,
          orientation: deg,
          wavelength: vParams.wavelength,
          contrast: vParams.contrast,
          phase: vParams.phase,
          sigma: vParams.sigma,
          matched: false,
        });
      }
      if (items.length < totalCells) {
        const fallbackVar = varieties[0];
        const vParams = getGaborVarietyParams(fallbackVar, 60);
        items.push({
          id: id++,
          orientation: shuffledOrientations[0],
          wavelength: vParams.wavelength,
          contrast: vParams.contrast,
          phase: vParams.phase,
          sigma: vParams.sigma,
          matched: false,
        });
      }
    }

    // Shuffle grid
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    setGridPatches(items);
    setIsPlaying(true);
    audioGuide.speak(
      language === 'en'
        ? `Stage ${stage.level} start! Focus on ${stage.subtitle}.`
        : language === 'ja'
        ? `第${stage.level}段階スタート！${stage.subtitle}に集中してください。`
        : language === 'zh'
        ? `第${stage.level}关开始！请集中精力观察${stage.subtitle}。`
        : language === 'es'
        ? `¡Iniciando Nivel ${stage.level}! Concéntrese en ${stage.subtitle}.`
        : language === 'fr'
        ? `Début du Niveau ${stage.level} ! Concentrez-vous sur ${stage.subtitle}.`
        : `${stage.level}단계 시작! ${stage.subtitle}에 집중해보세요.`,
      undefined,
      undefined,
      language
    );
  }, [language]);

  const handleStartLevel = (lvl: number) => {
    setSelectedLevel(lvl);
    setupStage(STAGES_CONFIG[lvl - 1]);
  };

  const handlePatchClick = (patch: GridPatch) => {
    if (!isPlaying || isCompleted || patch.matched) return;

    if (currentStage.type === 'find_target') {
      setTotalAttempts((prev) => prev + 1);
      if (patch.orientation === targetOrientation) {
        // Correct target found!
        audioGuide.playSuccessChime();
        setSuccessfulAttempts((prev) => prev + 1);
        setGridPatches((prev) =>
          prev.map((p) => (p.id === patch.id ? { ...p, matched: true } : p))
        );
        const newFound = matchesFound + 1;
        setMatchesFound(newFound);

        if (newFound >= currentStage.targetCount) {
          handleStageClear();
        }
      } else {
        // Wrong target
        audioGuide.playErrorChime();
      }
      return;
    }

    // 'match_pair' mechanic
    if (firstSelectedId === null) {
      setFirstSelectedId(patch.id);
      audioGuide.playTick();
    } else if (firstSelectedId === patch.id) {
      setFirstSelectedId(null);
    } else {
      setTotalAttempts((prev) => prev + 1);
      const first = gridPatches.find((p) => p.id === firstSelectedId);
      if (first && first.orientation === patch.orientation) {
        // Matched!
        audioGuide.playSuccessChime();
        setSuccessfulAttempts((prev) => prev + 1);
        setGridPatches((prev) =>
          prev.map((p) => (p.id === first.id || p.id === patch.id ? { ...p, matched: true } : p))
        );
        setFirstSelectedId(null);
        const newMatches = matchesFound + 1;
        setMatchesFound(newMatches);

        if (newMatches >= currentStage.targetCount) {
          handleStageClear();
        }
      } else {
        // Mismatch
        audioGuide.playErrorChime();
        setFirstSelectedId(null);
      }
    }
  };

  const handleStereogramSolve = (shape: StereogramShape) => {
    if (shape === stereogramShape) {
      setStereogramGuessed(true);
      audioGuide.playSuccessChime();
      handleStageClear();
    } else {
      audioGuide.playErrorChime();
    }
  };

  const handleStageClear = () => {
    setIsPlaying(false);
    setIsCompleted(true);

    // Unlock next level
    const nextLvl = Math.min(10, selectedLevel + 1);
    setUnlockedLevel(nextLvl);
    setUnlockedLevelState(getUnlockedLevel());

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Fallback
    }

    // Record session
    addSession({
      date: new Date().toISOString().split('T')[0],
      durationSeconds: currentStage.timeLimit - timeLeft,
      type: 'gabor_stage',
      level: selectedLevel,
      score: 100 * selectedLevel + timeLeft * 10,
      accuracy: totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 100,
    });

    if (onSessionComplete) {
      onSessionComplete();
    }
  };

  const handleStageFailed = () => {
    setIsPlaying(false);
    setIsFailed(true);
    audioGuide.playErrorChime();
    const failPhrases: Record<string, string> = {
      ko: '시간이 초과되었습니다. 눈을 편안하게 깜빡인 후 다시 도전해보세요!',
      en: 'Time is up! Blink comfortably and try again!',
      ja: '時間切れです。目をリラックスしてまばたきしてから、もう一度挑戦しましょう！',
      zh: '时间到了！请轻柔眨眼放松片刻，然后再次挑战吧！',
      es: '¡Se acabó el tiempo! Parpadee suavemente para descansar e inténtelo de nuevo.',
      fr: 'Temps écoulé ! Clignez doucement des yeux pour vous détendre et réessayez !',
    };
    audioGuide.speak(failPhrases[language] || failPhrases.ko, undefined, undefined, language);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Top Header: Current stage selector or in-game status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-teal-800">{t.stages.title}</span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">
              {isPlaying ? `${t.stages.stageLabel} ${currentStage.level}` : t.stages.badge}
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {isPlaying ? `${t.stages.stageLabel} ${currentStage.level}: ${currentStage.subtitle}` : t.stages.desc}
          </h2>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-xl text-teal-800 font-mono text-sm font-bold">
              <Timer className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
            <button
              onClick={() => setIsPlaying(false)}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* NOT IN GAME: STAGE SELECTION GRID */}
      {!isPlaying && !isCompleted && !isFailed && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.stages.desc}
          </p>

          {/* 10-level scrollable / grid list */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {STAGES_CONFIG.map((st) => {
              const isUnlocked = st.level <= unlockedLevel;
              const isCurrent = st.level === unlockedLevel;

              return (
                <button
                  key={st.level}
                  onClick={() => isUnlocked && handleStartLevel(st.level)}
                  disabled={!isUnlocked}
                  className={`p-3 rounded-2xl border text-left transition-all relative min-h-[90px] flex flex-col justify-between cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                      : isUnlocked
                      ? 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      : 'bg-slate-50 border-slate-200/60 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold font-mono ${
                        isCurrent ? 'text-teal-700' : isUnlocked ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      Lv.{st.level}
                    </span>
                    {isUnlocked ? (
                      <Unlock className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-[12px] font-bold text-slate-900 truncate">
                      {st.subtitle}
                    </h4>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {st.type === 'stereogram_depth'
                        ? '3D Stereogram'
                        : language === 'en'
                        ? `${st.gridCols}x${st.gridRows} · ${st.orientations.length} angles`
                        : language === 'ja'
                        ? `${st.gridCols}x${st.gridRows} · ${st.orientations.length}方向`
                        : language === 'zh'
                        ? `${st.gridCols}x${st.gridRows} · ${st.orientations.length}角度`
                        : language === 'es'
                        ? `${st.gridCols}x${st.gridRows} · ${st.orientations.length} ángulos`
                        : language === 'fr'
                        ? `${st.gridCols}x${st.gridRows} · ${st.orientations.length} angles`
                        : `${st.gridCols}x${st.gridRows} · ${st.orientations.length}방향 기울기`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-teal-900">
                  {language === 'en'
                    ? `Unlocked Level: ${unlockedLevel} / 10`
                    : language === 'ja'
                    ? `現在の解放段階: ${unlockedLevel}段階 / 10段階`
                    : language === 'zh'
                    ? `当前解锁关卡: 第${unlockedLevel}关 / 10关`
                    : language === 'es'
                    ? `Nivel desbloqueado: ${unlockedLevel} / 10`
                    : language === 'fr'
                    ? `Niveau débloqué : ${unlockedLevel} / 10`
                    : `현재 해금 단계: ${unlockedLevel}단계 / 10단계`}
                </p>
                <p className="text-[11px] text-teal-700">
                  {language === 'en'
                    ? 'Clear each stage to automatically unlock the next challenge.'
                    : language === 'ja'
                    ? '各段階をクリアすると次の難易度が自動で開きます。'
                    : language === 'zh'
                    ? '每通关一个阶段，将自动开启更高难度的挑战。'
                    : language === 'es'
                    ? 'Supera cada nivel para desbloquear el siguiente reto automáticamente.'
                    : language === 'fr'
                    ? 'Réussissez chaque niveau pour débloquer automatiquement le suivant.'
                    : '각 단계를 클리어할 때마다 다음 난이도가 자동으로 열립니다.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleStartLevel(unlockedLevel)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              {language === 'en' ? 'Start Level' : language === 'ja' ? '挑戦開始' : language === 'zh' ? '开始挑战' : language === 'es' ? 'Comenzar' : language === 'fr' ? 'Commencer' : '도전 시작'}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE GAMEPLAY SCREEN */}
      {isPlaying && (
        <div className="space-y-3">
          {/* Target Indicator Bar (for find_target or stereogram) */}
          {currentStage.type === 'find_target' && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-2.5 px-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-950">
                  {language === 'en' ? 'Target Angle:' : language === 'ja' ? '目標の向き:' : language === 'zh' ? '目标方向:' : language === 'es' ? 'Ángulo objetivo:' : language === 'fr' ? 'Angle cible :' : '목표 방향:'}
                </span>
                <span className="text-xs font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  {getLocalizedOrientationInfo(targetOrientation, language).label} ({getLocalizedOrientationInfo(targetOrientation, language).symbol})
                </span>
                <GaborPatchCanvas
                  size={38}
                  orientationDeg={targetOrientation}
                  wavelength={currentStage.frequency}
                  contrast={currentStage.contrast}
                  isTargetIndicator
                />
              </div>
              <div className="text-xs font-bold text-amber-900 font-mono">
                {matchesFound} / {currentStage.targetCount}
              </div>
            </div>
          )}

          {currentStage.type === 'match_pair' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs px-1 text-slate-600">
                <span>
                  {language === 'en'
                    ? '💡 Tap 2 patches with the exact same stripe angle'
                    : language === 'ja'
                    ? '💡 同じ縞の向きを持つパッチを2枚見つけてタップ'
                    : language === 'zh'
                    ? '💡 找出并点击2个相同条纹方向的色块'
                    : language === 'es'
                    ? '💡 Toque 2 parches con la misma orientación de rayas'
                    : language === 'fr'
                    ? '💡 Touchez 2 patchs avec la même inclinaison de rayures'
                    : '💡 같은 방향의 패치 2개를 찾아 터치하세요'}
                </span>
                <span className="font-bold text-teal-700 font-mono">
                  {language === 'en'
                    ? `Pairs: ${matchesFound} / ${currentStage.targetCount}`
                    : language === 'ja'
                    ? `達成: ${matchesFound} / ${currentStage.targetCount}組`
                    : language === 'zh'
                    ? `配对: ${matchesFound} / ${currentStage.targetCount}对`
                    : language === 'es'
                    ? `Pares: ${matchesFound} / ${currentStage.targetCount}`
                    : language === 'fr'
                    ? `Paires : ${matchesFound} / ${currentStage.targetCount}`
                    : `달성: ${matchesFound} / ${currentStage.targetCount}쌍`}
                </span>
              </div>
              {firstSelectedId !== null && (() => {
                const sel = gridPatches.find((p) => p.id === firstSelectedId);
                if (!sel) return null;
                const info = getLocalizedOrientationInfo(sel.orientation, language);
                return (
                  <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-bold animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5">
                      <GaborPatchCanvas
                        size={36}
                        orientationDeg={sel.orientation}
                        wavelength={Math.round(sel.wavelength * 0.6)}
                        contrast={sel.contrast ?? currentStage.contrast}
                        phase={sel.phase ?? 0}
                        isTargetIndicator
                      />
                      <span>
                        {language === 'en'
                          ? `Selected: ${info.label} (${info.symbol}) ➡️ Tap matching one!`
                          : language === 'ja'
                          ? `選択中: ${info.label} (${info.symbol}) ➡️ 同じ向きをもう1枚タップ！`
                          : language === 'zh'
                          ? `已选方向: ${info.label} (${info.symbol}) ➡️ 再点击一个相同方向！`
                          : language === 'es'
                          ? `Seleccionado: ${info.label} (${info.symbol}) ➡️ ¡Toque la pareja!`
                          : language === 'fr'
                          ? `Sélectionné : ${info.label} (${info.symbol}) ➡️ Touchez l’autre !`
                          : `선택한 방향: ${info.label} (${info.symbol}) ➡️ 같은 방향을 하나 더 터치하세요!`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFirstSelectedId(null)}
                      className="text-[11px] text-amber-700 underline font-medium hover:text-amber-900 cursor-pointer"
                    >
                      {language === 'en' ? 'Cancel' : language === 'ja' ? '取消' : language === 'zh' ? '取消' : language === 'es' ? 'Cancelar' : language === 'fr' ? 'Annuler' : '취소'}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* GABOR GRID DISPLAY */}
          {currentStage.type !== 'stereogram_depth' && (
            <div
              className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 justify-items-center gap-2"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${currentStage.gridCols}, minmax(0, 1fr))`,
              }}
            >
              {gridPatches.map((patch) => (
                <GaborPatchCanvas
                  key={patch.id}
                  size={currentStage.gridCols >= 5 ? 52 : 62}
                  orientationDeg={patch.orientation}
                  wavelength={patch.wavelength}
                  contrast={patch.contrast ?? currentStage.contrast}
                  phase={patch.phase ?? 0}
                  sigma={patch.sigma}
                  selected={firstSelectedId === patch.id}
                  isMatched={patch.matched}
                  onClick={() => handlePatchClick(patch)}
                />
              ))}
            </div>
          )}

          {/* STEREOGRAM SPECIAL STAGE */}
          {currentStage.type === 'stereogram_depth' && (
            <div className="space-y-3">
              <div className="text-center text-xs text-slate-600">
                {language === 'en'
                  ? 'Gaze past the image with parallel eyes until 3D depth emerges. What shape is hidden?'
                  : language === 'ja'
                  ? '平行法で焦点を奥に合わせて立体視してください。隠れた3D図形は何でしょう？'
                  : language === 'zh'
                  ? '平行注视背景，使视线重合出现3D立体感。猜猜隐藏的是什么形状？'
                  : language === 'es'
                  ? 'Enfoque en paralelo más allá de la pantalla hasta ver en 3D. ¿Qué figura oculta ves?'
                  : language === 'fr'
                  ? 'Regardez au-delà de l’écran en vue parallèle pour voir en 3D. Quelle forme se cache ?'
                  : '두 점을 평행으로 응시해 3개로 겹쳐보세요. 숨은 3D 형상이 무엇인지 맞혀보세요!'}
              </div>

              <div className="flex justify-center bg-slate-900 p-2 rounded-2xl shadow-inner">
                <canvas ref={stereogramCanvasRef} className="rounded-xl max-w-full" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['heart', 'star', 'ring', 'diamond', 'pyramid'] as StereogramShape[])
                  .slice(0, 3)
                  .map((shape) => (
                    <button
                      key={shape}
                      onClick={() => handleStereogramSolve(shape)}
                      className="py-2.5 px-2 bg-white border border-slate-200 hover:bg-teal-50 hover:border-teal-300 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                    >
                      {shape === 'heart'
                        ? (language === 'en' ? 'Heart' : language === 'ja' ? 'ハート' : language === 'zh' ? '爱心' : language === 'es' ? 'Corazón' : language === 'fr' ? 'Cœur' : '하트')
                        : shape === 'star'
                        ? (language === 'en' ? 'Star' : language === 'ja' ? '星' : language === 'zh' ? '五角星' : language === 'es' ? 'Estrella' : language === 'fr' ? 'Étoile' : '별')
                        : shape === 'ring'
                        ? (language === 'en' ? 'Ring' : language === 'ja' ? 'リング' : language === 'zh' ? '圆环' : language === 'es' ? 'Anillo' : language === 'fr' ? 'Anneau' : '도넛 링')
                        : shape === 'diamond'
                        ? (language === 'en' ? 'Diamond' : language === 'ja' ? 'ダイヤ' : language === 'zh' ? '钻石' : language === 'es' ? 'Diamante' : language === 'fr' ? 'Diamant' : '다이아몬드')
                        : (language === 'en' ? 'Pyramid' : language === 'ja' ? 'ピラミッド' : language === 'zh' ? '金字塔' : language === 'es' ? 'Pirámide' : language === 'fr' ? 'Pyramide' : '피라미드')}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE CLEAR SCREEN */}
      {isCompleted && (
        <div className="py-4 space-y-4 text-center">
          <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">
              {language === 'en'
                ? `Stage ${currentStage.level} Cleared!`
                : language === 'ja'
                ? `第${currentStage.level}段階 クリア達成！`
                : language === 'zh'
                ? `第${currentStage.level}关 闯关成功！`
                : language === 'es'
                ? `¡Nivel ${currentStage.level} Superado!`
                : language === 'fr'
                ? `Niveau ${currentStage.level} Réussi !`
                : `${currentStage.level}단계 클리어 성공!`}
            </h3>
            <p className="text-xs text-slate-600">{currentStage.description}</p>
          </div>

          {/* Stars based on remaining time */}
          <div className="flex justify-center gap-1.5 py-1">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            <Star className={`w-6 h-6 ${timeLeft > 15 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            <Star className={`w-6 h-6 ${timeLeft > 30 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStartLevel(selectedLevel)}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.stages.retryBtn}</span>
            </button>
            <button
              onClick={() => {
                if (selectedLevel < 10) {
                  handleStartLevel(selectedLevel + 1);
                } else {
                  setIsCompleted(false);
                }
              }}
              className="h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
            >
              <span>{selectedLevel < 10 ? t.stages.nextStageBtn : t.settings.close}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE FAILED SCREEN */}
      {isFailed && (
        <div className="py-4 space-y-4 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
            <Timer className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">{t.stages.stageFailTitle}</h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsFailed(false)}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              {t.settings.close}
            </button>
            <button
              onClick={() => handleStartLevel(selectedLevel)}
              className="flex-1 h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              {t.stages.retryBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
