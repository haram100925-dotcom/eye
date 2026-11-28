import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  CheckCircle2,
  Flame,
  Award,
  Focus,
} from 'lucide-react';
import { GaborPatchCanvas } from './GaborPatchCanvas';
import {
  GaborVariety,
  getGaborVarietyParams,
  getLocalizedOrientationInfo,
} from '../utils/gaborGenerator';
import { audioGuide } from '../utils/audioGuide';
import { addSession } from '../utils/storage';
import { TargetGroup, TrainingSessionRecord, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';
import { GuidedEyeStretchStage } from './GuidedEyeStretchStage';

interface DailyRoutineProps {
  targetGroup: TargetGroup;
  voiceEnabled: boolean;
  onFinish?: (session: TrainingSessionRecord) => void;
  language?: AppLanguage;
}

type RoutineStep = 'intro' | 'gabor' | 'accommodation' | 'stretching' | 'completed';

const MATCH_COUNT = 3;
const TOTAL_GRID_COUNT = 24;

const VARIETIES: GaborVariety[] = [
  'single_faint',
  'double_strong',
  'triple_balanced',
  'single_bold',
  'double_soft',
];

const PROGRESSIVE_TIER_ANGLES: Record<number, number[]> = {
  1: [0, 45, 90, 135],
  2: [0, 30, 45, 90, 135, 150],
  3: [0, 30, 45, 60, 90, 120, 135, 150],
  4: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165],
};

const PROGRESSIVE_NEW_ANGLES: Record<number, number[]> = {
  1: [45, 135],
  2: [30, 150],
  3: [60, 120],
  4: [15, 75, 105, 165],
};

function computeProgressiveTier(secsLeft: number, matches: number): number {
  const elapsed = Math.max(0, 180 - secsLeft);
  const timeTier = elapsed >= 68 ? 4 : elapsed >= 45 ? 3 : elapsed >= 22 ? 2 : 1;
  const matchTier = matches >= 6 ? 4 : matches >= 4 ? 3 : matches >= 2 ? 2 : 1;
  return Math.max(timeTier, matchTier);
}

interface PatchItem {
  id: number;
  orientation: number;
  wavelength: number;
  contrast: number;
  phase: number;
  sigma?: number;
  variety: GaborVariety;
}

function getShapeKey(p: Pick<PatchItem, 'orientation' | 'variety'>): string {
  return `${p.orientation}__${p.variety}`;
}

export const DailyRoutine3Min: React.FC<DailyRoutineProps> = ({
  voiceEnabled: _voiceEnabled,
  onFinish,
  language = 'ko',
}) => {
  const t = getTranslation(language);

  // Timer State (Total 180 seconds)
  const TOTAL_SECONDS = 180;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<RoutineStep>('intro');

  // Pre/Post Fatigue check
  const [fatigueBefore] = useState<number>(6);
  const [fatigueAfter, setFatigueAfter] = useState<number>(2);

  // Gabor Training State (24 patches = 8 identical-shape triples of 3)
  const [progressiveTier, setProgressiveTier] = useState<number>(1);
  const [gaborPatches, setGaborPatches] = useState<PatchItem[]>([]);
  const [selectedPatchIds, setSelectedPatchIds] = useState<number[]>([]);
  const [gaborMatchesCount, setGaborMatchesCount] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [mismatchHint, setMismatchHint] = useState<string | null>(null);

  // Step 2: Dynamic accommodation focus state
  const [focusProgress, setFocusProgress] = useState<number>(0); // 0 to 100 oscillation

  // Animation frame ref
  const animRef = useRef<number | null>(null);
  const idCounterRef = useRef<number>(100);

  // Guarantee the board ALWAYS contains at least one complete set of 3 identical-shape tiles
  const ensureBoardHasIdenticalTriple = useCallback(
    (items: PatchItem[], allowedAngles: number[]): PatchItem[] => {
      const counts = new Map<string, number>();
      items.forEach((p) => {
        const key = getShapeKey(p);
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      const hasValidTriple = Array.from(counts.values()).some((c) => c >= MATCH_COUNT);
      if (hasValidTriple || items.length < MATCH_COUNT) {
        return items;
      }

      const fallbackAngle = allowedAngles[Math.floor(Math.random() * allowedAngles.length)] ?? 45;
      const fallbackVar = VARIETIES[Math.floor(Math.random() * VARIETIES.length)];
      const vParams = getGaborVarietyParams(fallbackVar, 60);
      const replaceIds = new Set(items.slice(0, MATCH_COUNT).map((p) => p.id));

      return items.map((p) => {
        if (!replaceIds.has(p.id)) return p;
        idCounterRef.current += 1;
        return {
          id: idCounterRef.current,
          orientation: fallbackAngle,
          wavelength: vParams.wavelength,
          contrast: vParams.contrast,
          phase: vParams.phase,
          sigma: vParams.sigma,
          variety: fallbackVar,
        };
      });
    },
    []
  );

  // Generate dense 24 Gabor patches strictly as 8 sets of 3 IDENTICAL shapes (orientation + variety)
  const generateGaborGrid = useCallback(
    (tierOverride: number = 1) => {
      const allowedAngles = PROGRESSIVE_TIER_ANGLES[tierOverride] || PROGRESSIVE_TIER_ANGLES[1];
      const shuffledAngles = [...allowedAngles].sort(() => Math.random() - 0.5);
      const shuffledVars = [...VARIETIES].sort(() => Math.random() - 0.5);

      // Build distinct (angle, variety) pairs so each triple of 3 identical patches stands out cleanly
      const allCombos: Array<{ angle: number; variety: GaborVariety }> = [];
      for (const varItem of shuffledVars) {
        for (const angle of shuffledAngles) {
          allCombos.push({ angle, variety: varItem });
        }
      }
      // Shuffle combos and pick 8 triples
      for (let i = allCombos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCombos[i], allCombos[j]] = [allCombos[j], allCombos[i]];
      }

      const items: PatchItem[] = [];
      const numSets = Math.floor(TOTAL_GRID_COUNT / MATCH_COUNT);

      for (let s = 0; s < numSets; s++) {
        const combo = allCombos[s % allCombos.length];
        const vParams = getGaborVarietyParams(combo.variety, 60);
        for (let k = 0; k < MATCH_COUNT; k++) {
          idCounterRef.current += 1;
          items.push({
            id: idCounterRef.current,
            orientation: combo.angle,
            wavelength: vParams.wavelength,
            contrast: vParams.contrast,
            phase: vParams.phase,
            sigma: vParams.sigma,
            variety: combo.variety,
          });
        }
      }

      // Shuffle thoroughly
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      setGaborPatches(ensureBoardHasIdenticalTriple(items, allowedAngles));
      setSelectedPatchIds([]);
    },
    [ensureBoardHasIdenticalTriple]
  );

  // Timer countdown (90s Gabor -> 30s Accommodation -> 60s Eye Stretching)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          const next = prev - 1;

          // Transition to Step 2: 30s far-near accommodation at 90s left
          if (next === 90 && currentStep === 'gabor') {
            setCurrentStep('accommodation');
            const accPhrases: Record<string, string> = {
              ko: '잘하셨습니다! 이제 30초 동안 화면 중앙 원근 조절 링을 따라 눈 근육을 이완하세요.',
              en: 'Well done! Now follow the breathing ring for 30 seconds to relax your focusing muscles.',
              ja: '素晴らしいです！30秒間、画面中央のピント調整リングを見つめてリラックスしましょう。',
              zh: '太棒了！现在请跟随中央变焦环凝视30秒，放松睫状肌。',
              es: '¡Bien hecho! Siga el anillo de enfoque durante 30 segundos para relajar su vista.',
              fr: 'Bravo ! Suivez l’anneau de mise au point pendant 30 secondes pour détendre vos yeux.',
            };
            audioGuide.speak(accPhrases[language] || accPhrases.ko, undefined, undefined, language);
          }

          // Transition to Step 3: 60s guided eye stretching at 60s left
          if (next === 60 && currentStep === 'accommodation') {
            setCurrentStep('stretching');
          }

          if (next <= 0) {
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, currentStep, language]);

  // Trigger completion safely with latest state when countdown reaches 0
  useEffect(() => {
    if (isActive && secondsRemaining === 0 && currentStep !== 'completed' && currentStep !== 'intro') {
      handleCompleteRoutine();
    }
  });

  // Step 2 animation loop for accommodation ring
  useEffect(() => {
    if (currentStep === 'accommodation' && isActive) {
      let phase = 0;
      const animate = () => {
        phase += 0.035;
        setFocusProgress((Math.sin(phase) + 1) * 50);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentStep, isActive]);

  // Progressive tilt escalation during Gabor phase (swaps a whole identical-shape triple!)
  useEffect(() => {
    if (currentStep !== 'gabor' || !isActive) return;
    const nextTier = computeProgressiveTier(secondsRemaining, gaborMatchesCount);
    if (nextTier > progressiveTier) {
      setProgressiveTier(nextTier);
      const newAngles = PROGRESSIVE_NEW_ANGLES[nextTier] || PROGRESSIVE_TIER_ANGLES[nextTier];
      const tierToastMap: Record<number, Record<AppLanguage, string>> = {
        2: {
          ko: '📐 기울기 확장 (2/4단계): 30°·150° 사선 모양 추가!',
          en: '📐 Tilt Upgraded (Tier 2/4): 30° & 150° oblique shapes added!',
          ja: '📐 傾き拡張 (2/4段階): 30°・150°斜線パターン追加！',
          zh: '📐 倾角升级 (2/4阶): 新增 30°·150° 斜线图案！',
          es: '📐 Nivel 2/4: ¡Ángulos oblicuos de 30° y 150° añadidos!',
          fr: '📐 Palier 2/4 : Angles obliques à 30° et 150° ajoutés !',
        },
        3: {
          ko: '📐 기울기 확장 (3/4단계): 60°·120° 가파른 기울기 추가!',
          en: '📐 Tilt Upgraded (Tier 3/4): Steep 60° & 120° tilts added!',
          ja: '📐 傾き拡張 (3/4段階): 60°・120°急斜線パターン追加！',
          zh: '📐 倾角升级 (3/4阶): 新增 60°·120° 陡斜线图案！',
          es: '📐 Nivel 3/4: ¡Inclinaciones de 60° y 120° añadidas!',
          fr: '📐 Palier 3/4 : Inclinaisons prononcées à 60° et 120° ajoutées !',
        },
        4: {
          ko: '📐 최고 정밀 (4/4단계): 15° 간격 12방향 미세 기울기!',
          en: '📐 Max Precision (Tier 4/4): 12 fine tilt angles every 15°!',
          ja: '📐 最高精密 (4/4段階): 15°間隔12方向の微細傾き！',
          zh: '📐 最高精度 (4/4阶): 每15°全向12个微细倾角已解锁！',
          es: '📐 Precisión Máxima (4/4): ¡12 inclinaciones finas cada 15°!',
          fr: '📐 Précision Max (4/4) : 12 inclinaisons fines tous les 15° !',
        },
      };
      const msg = tierToastMap[nextTier]?.[language];
      if (msg) {
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(null), 2600);
      }

      // Swap an entire unselected identical-shape triple with a new identical tilted triple
      setGaborPatches((prev) => {
        const selectedKeys = new Set(
          prev.filter((p) => selectedPatchIds.includes(p.id)).map((p) => getShapeKey(p))
        );
        const byShape = new Map<string, PatchItem[]>();
        prev.forEach((p) => {
          const key = getShapeKey(p);
          if (!selectedPatchIds.includes(p.id) && !selectedKeys.has(key)) {
            const list = byShape.get(key) || [];
            list.push(p);
            byShape.set(key, list);
          }
        });

        const candidates = Array.from(byShape.entries())
          .filter(([, list]) => list.length >= MATCH_COUNT)
          .sort((a, b) => {
            const aAngle = a[1][0].orientation;
            const bAngle = b[1][0].orientation;
            const aCardinal = aAngle === 0 || aAngle === 90 ? 0 : 1;
            const bCardinal = bAngle === 0 || bAngle === 90 ? 0 : 1;
            return aCardinal - bCardinal;
          });

        if (candidates.length === 0) return prev;
        const victimIds = new Set(candidates[0][1].slice(0, MATCH_COUNT).map((p) => p.id));
        const injectedAngle = newAngles[Math.floor(Math.random() * newAngles.length)];
        const injectedVar = VARIETIES[Math.floor(Math.random() * VARIETIES.length)];
        const vParams = getGaborVarietyParams(injectedVar, 60);

        const nextItems = prev.map((p) =>
          victimIds.has(p.id)
            ? {
                ...p,
                orientation: injectedAngle,
                wavelength: vParams.wavelength,
                contrast: vParams.contrast,
                phase: vParams.phase,
                sigma: vParams.sigma,
                variety: injectedVar,
              }
            : p
        );
        return ensureBoardHasIdenticalTriple(
          nextItems,
          PROGRESSIVE_TIER_ANGLES[nextTier] || PROGRESSIVE_TIER_ANGLES[1]
        );
      });
    }
  }, [
    currentStep,
    isActive,
    secondsRemaining,
    gaborMatchesCount,
    progressiveTier,
    selectedPatchIds,
    language,
    ensureBoardHasIdenticalTriple,
  ]);

  const handleStartRoutine = () => {
    setProgressiveTier(1);
    setGaborMatchesCount(0);
    setComboCount(0);
    generateGaborGrid(1);
    setCurrentStep('gabor');
    setIsActive(true);
    setSecondsRemaining(TOTAL_SECONDS);
    const startPhrases: Record<string, string> = {
      ko: '3분 루틴을 시작합니다. 화면에서 완전히 똑같은 모양의 가보르 패치 3개를 찾아 터치하세요!',
      en: 'Starting your 3-minute routine. Find and tap 3 identical Gabor patches on the screen!',
      ja: '3分ルーティンを開始します。全く同じ形のガボールパッチを3個見つけてタップしてください！',
      zh: '开始3分钟日常。请在屏幕上找出3个完全相同形状的伽博斑块并点击！',
      es: 'Iniciando su rutina de 3 minutos. ¡Encuentre y toque 3 parches de Gabor exactamente iguales!',
      fr: 'Démarrage de votre routine de 3 minutes. Repérez et touchez 3 patchs de Gabor strictement identiques !',
    };
    audioGuide.speak(startPhrases[language] || startPhrases.ko, undefined, undefined, language);
  };

  const handleTogglePlay = () => {
    setIsActive((prev) => !prev);
    if (!isActive) {
      const resumePhrases: Record<string, string> = {
        ko: '훈련을 계속합니다.',
        en: 'Resuming training.',
        ja: 'トレーニングを再開します。',
        zh: '继续训练。',
        es: 'Reanudando entrenamiento.',
        fr: 'Reprise de l’entraînement.',
      };
      audioGuide.speak(resumePhrases[language] || resumePhrases.ko, undefined, undefined, language);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(TOTAL_SECONDS);
    setCurrentStep('intro');
    setProgressiveTier(1);
    setSelectedPatchIds([]);
    setGaborMatchesCount(0);
    setComboCount(0);
    setSuccessToast(null);
    setMismatchHint(null);
    audioGuide.stopSpeaking();
  };

  // Match strictly 3 IDENTICAL shapes (same orientation AND same stripe style/variety)
  const handleSelectGaborPatch = (item: PatchItem) => {
    setMismatchHint(null);

    if (selectedPatchIds.includes(item.id)) {
      setSelectedPatchIds((prev) => prev.filter((id) => id !== item.id));
      return;
    }

    const currentSelected = gaborPatches.filter((p) => selectedPatchIds.includes(p.id));

    if (currentSelected.length > 0) {
      const targetPatch = currentSelected[0];
      const isSameShape =
        item.orientation === targetPatch.orientation && item.variety === targetPatch.variety;

      if (!isSameShape) {
        audioGuide.playErrorChime();
        const targetInfo = getLocalizedOrientationInfo(targetPatch.orientation, language);

        setMismatchHint(
          language === 'en'
            ? `Shape mismatch: Find 3 identical [${targetInfo.label} ${targetInfo.symbol}] patches (both angle & stripe pattern must match)!`
            : language === 'ja'
            ? `形が異なります: [${targetInfo.label} ${targetInfo.symbol}] と角度・模様が全く同じパッチを3個選んでください！`
            : language === 'zh'
            ? `形状不一致：请找出3个角度和条纹完全相同的 [${targetInfo.label} ${targetInfo.symbol}] 斑块！`
            : language === 'es'
            ? `Forma diferente: ¡Busque 3 parches con ángulo y patrón idénticos [${targetInfo.label} ${targetInfo.symbol}]!`
            : language === 'fr'
            ? `Forme différente : Trouvez 3 patchs strictement identiques [${targetInfo.label} ${targetInfo.symbol}] !`
            : `모양 다름: 위 안내와 각도·줄무늬가 완전히 똑같은 [${targetInfo.label} ${targetInfo.symbol}] 3개를 찾으세요!`
        );
        setTimeout(() => setMismatchHint(null), 3000);
        setSelectedPatchIds([]);
        setComboCount(0);
        return;
      }
    }

    const newSelectedIds = [...selectedPatchIds, item.id];

    if (newSelectedIds.length === MATCH_COUNT) {
      // MATCH SUCCESS (3 identical shapes matched!) -> silent confetti burst
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.62 },
          colors: ['#0f766e', '#14b8a6', '#f59e0b', '#3b82f6'],
        });
      } catch {
        // Confetti fallback
      }
      const newCombo = comboCount + 1;
      const nextMatchTotal = gaborMatchesCount + 1;
      setComboCount(newCombo);
      setGaborMatchesCount(nextMatchTotal);

      const bonusMsg =
        language === 'en'
          ? `Great! 3 identical matched (+100 pts)${newCombo > 1 ? ` · ${newCombo}x Streak!` : ''}`
          : language === 'ja'
          ? `成功！同じ形3個一致 (+100点)${newCombo > 1 ? ` · ${newCombo}連続コンボ！` : ''}`
          : language === 'zh'
          ? `成功！3个相同形状配对 (+100分)${newCombo > 1 ? ` · ${newCombo}连击！` : ''}`
          : language === 'es'
          ? `¡Bien! 3 formas idénticas (+100 pts)${newCombo > 1 ? ` · ¡Racha x${newCombo}!` : ''}`
          : language === 'fr'
          ? `Bravo ! 3 formes identiques (+100 pts)${newCombo > 1 ? ` · Série x${newCombo} !` : ''}`
          : `✨ 성공! 똑같은 모양 3개 일치 (+100점)${newCombo > 1 ? ` · ${newCombo}연속 콤보!` : ''}`;
      setSuccessToast(bonusMsg);
      setTimeout(() => setSuccessToast(null), 2000);

      // Re-populate matched 3 slots with a NEW IDENTICAL TRIPLE (same angle + same variety)
      const effectiveTier = computeProgressiveTier(secondsRemaining, nextMatchTotal);
      const allowedAngles = PROGRESSIVE_TIER_ANGLES[effectiveTier] || PROGRESSIVE_TIER_ANGLES[1];
      const tiltedPool = allowedAngles.filter((a) => a !== 0 && a !== 90);
      const replacementAngle =
        tiltedPool.length > 0 && Math.random() < 0.78
          ? tiltedPool[Math.floor(Math.random() * tiltedPool.length)]
          : allowedAngles[Math.floor(Math.random() * allowedAngles.length)];
      const chosenVar = VARIETIES[Math.floor(Math.random() * VARIETIES.length)];
      const vParams = getGaborVarietyParams(chosenVar, 60);

      setGaborPatches((prev) => {
        const replaced = prev.map((p) => {
          if (newSelectedIds.includes(p.id)) {
            idCounterRef.current += 1;
            return {
              id: idCounterRef.current,
              orientation: replacementAngle,
              wavelength: vParams.wavelength,
              contrast: vParams.contrast,
              phase: vParams.phase,
              sigma: vParams.sigma,
              variety: chosenVar,
            };
          }
          return p;
        });
        return ensureBoardHasIdenticalTriple(replaced, allowedAngles);
      });

      setSelectedPatchIds([]);
    } else {
      audioGuide.playTick();
      setSelectedPatchIds(newSelectedIds);
    }
  };

  const handleCompleteRoutine = () => {
    setIsActive(false);
    setCurrentStep('completed');
    const completePhrases: Record<string, string> = {
      ko: '축하합니다! 오늘의 3분 루틴을 모두 완료하셨습니다.',
      en: 'Congratulations! You have completed today’s 3-minute routine.',
      ja: 'おめでとうございます！本日の3分ルーティンを無事完了しました。',
      zh: '恭喜！您已顺利完成今天的3分钟日常训练。',
      es: '¡Felicidades! Ha completado su rutina de 3 minutos de hoy.',
      fr: 'Félicitations ! Vous avez terminé votre routine de 3 minutes d’aujourd’hui.',
    };
    audioGuide.speak(completePhrases[language] || completePhrases.ko, undefined, undefined, language);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0f766e', '#14b8a6', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // Confetti fallback
    }

    const newSession = addSession({
      date: new Date().toISOString().split('T')[0],
      durationSeconds: 180,
      type: '3min_routine',
      score: 200 + gaborMatchesCount * 30 + comboCount * 15,
      accuracy: 98,
      fatigueBefore,
      fatigueAfter,
    });

    if (onFinish) {
      onFinish(newSession);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header bar with timer and step indicators */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Focus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{t.routine.badge}</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>
                {currentStep === 'intro' && t.routine.stepIndicator}
                {currentStep === 'gabor' &&
                  (language === 'en'
                    ? 'Phase 1 · Identical 3-Match (90s)'
                    : language === 'ja'
                    ? 'ステップ1 · 同じ形3個探し (90秒)'
                    : language === 'zh'
                    ? '第1阶段 · 3个相同形状配对 (90秒)'
                    : language === 'es'
                    ? 'Fase 1 · 3 Formas Idénticas (90s)'
                    : language === 'fr'
                    ? 'Phase 1 · 3 Formes Identiques (90s)'
                    : '1단계 · 똑같은 모양 3개 찾기 (90초)')}
                {currentStep === 'accommodation' &&
                  (language === 'en'
                    ? 'Phase 2 · Far-Near Gaze (30s)'
                    : language === 'ja'
                    ? 'ステップ2 · 遠近ピント調節 (30秒)'
                    : language === 'zh'
                    ? '第2阶段 · 远近交替凝视 (30秒)'
                    : language === 'es'
                    ? 'Fase 2 · Enfoque Cerca-Lejos (30s)'
                    : language === 'fr'
                    ? 'Phase 2 · Mise au Point Près-Loin (30s)'
                    : '2단계 · 원근 교대 응시 (30초)')}
                {currentStep === 'stretching' &&
                  (language === 'en'
                    ? 'Phase 3 · Eye Stretching (60s)'
                    : language === 'ja'
                    ? 'ステップ3 · 目のストレッチ (60秒)'
                    : language === 'zh'
                    ? '第3阶段 · 眼部拉伸 (60秒)'
                    : language === 'es'
                    ? 'Fase 3 · Estiramiento Ocular (60s)'
                    : language === 'fr'
                    ? 'Phase 3 · Étirements Oculaires (60s)'
                    : '3단계 · 최적 눈 스트레칭 (60초)')}
                {currentStep === 'completed' && t.routine.completeTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Big Digital Timer & Control */}
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-xl sm:text-2xl font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl tracking-tight">
            {formatTime(secondsRemaining)}
          </span>
          {currentStep !== 'intro' && currentStep !== 'completed' && (
            <button
              onClick={handleTogglePlay}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={isActive ? 'Pause' : 'Play'}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 3-Phase Progress Bars (90s Gabor · 30s Accommodation · 60s Eye Stretch) */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="space-y-1">
          <div
            className={`h-2 rounded-full transition-all ${
              secondsRemaining <= 90 ? 'bg-teal-600' : isActive ? 'bg-teal-400' : 'bg-slate-200'
            }`}
          />
          <span className="block text-[10px] text-slate-500 text-center tabular-nums">
            {language === 'en' ? '1. Gabor 90s' : language === 'ja' ? '1. ガボール 90秒' : language === 'zh' ? '1. 伽博 90秒' : language === 'es' ? '1. Gabor 90s' : language === 'fr' ? '1. Gabor 90s' : '1. 가보르 90초'}
          </span>
        </div>
        <div className="space-y-1">
          <div
            className={`h-2 rounded-full transition-all ${
              secondsRemaining <= 60
                ? 'bg-teal-600'
                : currentStep === 'accommodation'
                ? 'bg-teal-400'
                : 'bg-slate-200'
            }`}
          />
          <span className="block text-[10px] text-slate-500 text-center tabular-nums">
            {language === 'en' ? '2. Focus 30s' : language === 'ja' ? '2. 遠近 30秒' : language === 'zh' ? '2. 远近 30秒' : language === 'es' ? '2. Enfoque 30s' : language === 'fr' ? '2. Focus 30s' : '2. 원근 30초'}
          </span>
        </div>
        <div className="space-y-1">
          <div
            className={`h-2 rounded-full transition-all ${
              secondsRemaining === 0
                ? 'bg-teal-600'
                : currentStep === 'stretching'
                ? 'bg-teal-400'
                : 'bg-slate-200'
            }`}
          />
          <span className="block text-[10px] text-slate-500 text-center tabular-nums">
            {language === 'en' ? '3. Stretch 60s' : language === 'ja' ? '3. 体操 60秒' : language === 'zh' ? '3. 拉伸 60秒' : language === 'es' ? '3. Estirar 60s' : language === 'fr' ? '3. Étirer 60s' : '3. 스트레칭 60초'}
          </span>
        </div>
      </div>

      {/* SCREEN 1: CLEAN INTRO */}
      {currentStep === 'intro' && (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-2">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>{t.routine.startTitle}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.routine.startDesc}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-teal-800 tabular-nums">
              <span>{language === 'en' ? 'Gabor 90s' : language === 'ja' ? 'ガボール 90秒' : language === 'zh' ? '伽博 90秒' : '가보르 90초'}</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'en' ? 'Far-Near 30s' : language === 'ja' ? '遠近凝視 30秒' : language === 'zh' ? '远近凝视 30秒' : '원근 응시 30초'}</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'en' ? 'Eye Stretch 60s' : language === 'ja' ? '目の体操 60秒' : language === 'zh' ? '眼部拉伸 60秒' : '눈 스트레칭 60초'}</span>
            </div>
          </div>

          <button
            onClick={handleStartRoutine}
            className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{t.routine.startBtn}</span>
          </button>
        </div>
      )}

      {/* SCREEN 2: HIGH-DENSITY GABOR TRAINING (ALWAYS 3 IDENTICAL SHAPES) */}
      {currentStep === 'gabor' && (
        <div className="space-y-3">
          {/* Status bar */}
          <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">
                {t.routine.currentGoal}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {comboCount > 1 && (
                <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-xs animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {language === 'en'
                    ? `${comboCount} Streak!`
                    : language === 'ja'
                    ? `${comboCount}連続！`
                    : language === 'zh'
                    ? `${comboCount}连击！`
                    : language === 'es'
                    ? `¡Racha de ${comboCount}!`
                    : language === 'fr'
                    ? `Série de ${comboCount} !`
                    : `${comboCount}연속!`}
                </span>
              )}
              <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg">
                {language === 'en'
                  ? `Sets: ${gaborMatchesCount}`
                  : language === 'ja'
                  ? `達成: ${gaborMatchesCount}組`
                  : language === 'zh'
                  ? `完成: ${gaborMatchesCount}组`
                  : language === 'es'
                  ? `Completados: ${gaborMatchesCount}`
                  : language === 'fr'
                  ? `Réussis : ${gaborMatchesCount}`
                  : `성공: ${gaborMatchesCount}세트`}
              </span>
            </div>
          </div>

          {/* ACTIVE TARGET SHAPE GUIDE BANNER */}
          {selectedPatchIds.length > 0 ? (
            (() => {
              const firstPatch = gaborPatches.find((p) => selectedPatchIds.includes(p.id));
              if (!firstPatch) return null;
              const info = getLocalizedOrientationInfo(firstPatch.orientation, language);
              const remaining = MATCH_COUNT - selectedPatchIds.length;
              const previewSize = 42;
              const scale = previewSize / 60;

              return (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2.5">
                    <GaborPatchCanvas
                      size={previewSize}
                      orientationDeg={firstPatch.orientation}
                      wavelength={Math.max(4, Math.round(firstPatch.wavelength * scale))}
                      contrast={firstPatch.contrast}
                      phase={firstPatch.phase}
                      sigma={firstPatch.sigma ? Math.round(firstPatch.sigma * scale) : undefined}
                      isTargetIndicator
                      className="shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>
                          {language === 'en'
                            ? 'Target shape:'
                            : language === 'ja'
                            ? '目標の形:'
                            : language === 'zh'
                            ? '目标形状:'
                            : language === 'es'
                            ? 'Forma objetivo:'
                            : language === 'fr'
                            ? 'Forme cible :'
                            : '선택한 목표 모양:'}
                        </span>
                        <span className="text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md font-extrabold text-xs">
                          {info.label} ({info.symbol})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium pt-0.5">
                        {language === 'en' ? (
                          <>Tap <strong className="text-amber-800 underline">{remaining}</strong> more identical patches!</>
                        ) : language === 'ja' ? (
                          <>全く同じ形のパッチをあと <strong className="text-amber-800 underline">{remaining}個</strong> タップ！</>
                        ) : language === 'zh' ? (
                          <>请再点击 <strong className="text-amber-800 underline">{remaining}个</strong> 完全相同形状的斑块！</>
                        ) : language === 'es' ? (
                          <>¡Toque <strong className="text-amber-800 underline">{remaining}</strong> parches idénticos más!</>
                        ) : language === 'fr' ? (
                          <>Touchez <strong className="text-amber-800 underline">{remaining}</strong> autres patchs identiques !</>
                        ) : (
                          <>똑같은 모양 패치를 <strong className="text-amber-800 underline">{remaining}개</strong> 더 터치하세요!</>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatchIds([])}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-2 py-1 cursor-pointer"
                  >
                    {language === 'en' ? 'Cancel' : language === 'ja' ? '取消' : language === 'zh' ? '取消' : language === 'es' ? 'Cancelar' : language === 'fr' ? 'Annuler' : '취소'}
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 text-center">
              {language === 'en'
                ? '💡 Tap any patch to see the exact target shape to match 3 identical tiles.'
                : language === 'ja'
                ? '💡 1つタップすると、同じ形を3個揃える目標パターンが上に表示されます。'
                : language === 'zh'
                ? '💡 点击任意斑块，上方将提示需找出3个完全相同形状的目标图案。'
                : language === 'es'
                ? '💡 Toque cualquier parche para ver la forma exacta y reunir 3 idénticos.'
                : language === 'fr'
                ? '💡 Touchez un patch pour afficher la forme exacte à associer par 3.'
                : '💡 아무 패치나 1개 터치하면 똑같이 생긴 모양 3개를 찾도록 상단에 안내됩니다.'}
            </div>
          )}

          {/* Mismatch Alert Hint */}
          {mismatchHint && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl text-center shadow-xs animate-in zoom-in-95 duration-150 flex items-center justify-center gap-1.5">
              <span>⚠️</span>
              <span>{mismatchHint}</span>
            </div>
          )}

          {/* Toast Banner for Success */}
          {successToast && (
            <div className="p-2 bg-emerald-600 text-white text-xs font-bold rounded-xl text-center shadow-md animate-in zoom-in-95 duration-150">
              {successToast}
            </div>
          )}

          {/* Screen-filling Dense 24 Gabor Grid (Always 8 sets of 3 identical shapes) */}
          <div className="w-full bg-slate-900/95 p-3 rounded-2xl border border-slate-800 shadow-inner">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-2.5 justify-items-center">
              {gaborPatches.map((item) => {
                const isSelected = selectedPatchIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectGaborPatch(item)}
                    className={`relative w-full aspect-square rounded-xl p-1 transition-all cursor-pointer flex items-center justify-center select-none ${
                      isSelected
                        ? 'ring-4 ring-amber-400 bg-amber-400/20 scale-105 shadow-lg z-10'
                        : 'bg-slate-800 hover:bg-slate-700/90 border border-slate-700/80 active:scale-95'
                    }`}
                  >
                    <GaborPatchCanvas
                      size={60}
                      orientationDeg={item.orientation}
                      wavelength={item.wavelength}
                      contrast={item.contrast}
                      phase={item.phase}
                      sigma={item.sigma}
                      className="w-full h-full pointer-events-none rounded-lg"
                    />
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full text-[11px] font-bold flex items-center justify-center shadow-md">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-1 px-1 text-center">
            {language === 'en'
              ? '💡 Every shape on the board has 3 identical copies. Match 3 identical tiles!'
              : language === 'ja'
              ? '💡 盤面には必ず同じ形のパッチが3個ずつ配置されています。'
              : language === 'zh'
              ? '💡 面板上每种图案都保证有3个完全相同的斑块。'
              : language === 'es'
              ? '💡 Cada forma en el tablero siempre tiene 3 copias idénticas.'
              : language === 'fr'
              ? '💡 Chaque motif du plateau possède toujours 3 copies strictement identiques.'
              : '💡 화면에는 항상 똑같은 모양이 3개씩 짝을 이루어 배치되어 있습니다.'}
          </div>
        </div>
      )}

      {/* SCREEN 3: DYNAMIC ACCOMMODATION EXERCISE */}
      {currentStep === 'accommodation' && (
        <div className="space-y-4 text-center">
          <div className="text-xs text-slate-600">
            {language === 'en'
              ? 'Gently follow the expanding and contracting breathing ring at the center with your gaze.'
              : language === 'ja'
              ? '画面中央で呼吸するように拡大縮小するピント調整リングを優しく見つめてください。'
              : language === 'zh'
              ? '请自然注视屏幕中央如呼吸般放大缩小的调焦圆环。'
              : language === 'es'
              ? 'Contemple relajadamente el anillo central que se expande y contrae como una respiración.'
              : language === 'fr'
              ? 'Fixez doucement l’anneau central qui s’élargit et rétrécit comme une respiration.'
              : '화면 중앙에서 숨쉬듯 커지고 작아지는 원근 링을 눈동자로 편안하게 응시하세요.'}
          </div>

          {/* Accommodation Focus Target */}
          <div className="h-64 sm:h-72 bg-slate-900 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-inner">
            <div
              className="rounded-full border-4 border-teal-400 flex items-center justify-center transition-all duration-75 shadow-[0_0_30px_rgba(45,212,191,0.5)]"
              style={{
                width: `${60 + focusProgress * 1.4}px`,
                height: `${60 + focusProgress * 1.4}px`,
              }}
            >
              <div
                className="rounded-full bg-teal-300 transition-all duration-75"
                style={{
                  width: `${16 + focusProgress * 0.4}px`,
                  height: `${16 + focusProgress * 0.4}px`,
                }}
              />
            </div>

            <div className="absolute bottom-3 text-xs font-mono text-teal-300">
              {focusProgress > 50
                ? (language === 'en' ? '● Relax as if looking far away' : language === 'ja' ? '● 遠くを見るようにリラックス' : language === 'zh' ? '● 如眺望远方般放松' : language === 'es' ? '● Relájese como si mirara a lo lejos' : language === 'fr' ? '● Détendez-vous comme au loin' : '● 먼 곳을 바라보듯 이완')
                : (language === 'en' ? '○ Focus gently on the center' : language === 'ja' ? '○ 近くに意識を集中' : language === 'zh' ? '○ 聚焦近处目标' : language === 'es' ? '○ Enfoque suavemente cerca' : language === 'fr' ? '○ Concentrez-vous doucement' : '○ 가까운 곳에 집중')}
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {t.routine.restDesc}
          </div>
        </div>
      )}

      {/* SCREEN 4: GUIDED EYE STRETCHING (60s Finale: Left-Right, Up-Down, Infinity, Circle, Blink) */}
      {currentStep === 'stretching' && (() => {
        const stretchElapsed = Math.max(0, Math.min(59, 60 - secondsRemaining));
        const stretchExerciseIdx = Math.floor(stretchElapsed / 12);
        const stretchExSecsLeft = 12 - (stretchElapsed % 12);

        return (
          <div className="space-y-3 animate-in fade-in duration-200">
            <GuidedEyeStretchStage
              exerciseIndex={stretchExerciseIdx}
              exerciseSecondsLeft={stretchExSecsLeft}
              isActive={isActive}
              language={language}
              announceOnExerciseChange
              compact
            />
          </div>
        );
      })()}

      {/* SCREEN 4: COMPLETED SUMMARY */}
      {currentStep === 'completed' && (
        <div className="space-y-4 text-center py-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{t.routine.completeTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.routine.completeDesc}
            </p>
          </div>

          {/* Score card */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.stages.pairsFound}</span>
              <p className="text-base font-extrabold text-slate-900">{gaborMatchesCount}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.stats.streakTitle}</span>
              <p className="text-base font-extrabold text-amber-600">{comboCount}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.routine.accuracyLabel}</span>
              <p className="text-base font-extrabold text-teal-700">
                98%
              </p>
            </div>
          </div>

          {/* Post-fatigue check */}
          <div className="space-y-1.5 p-3.5 bg-teal-50/50 border border-teal-100 rounded-2xl text-left">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">{t.routine.fatigueQuestion}</span>
              <span className="font-bold text-teal-800">{fatigueAfter} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={fatigueAfter}
              onChange={(e) => setFatigueAfter(parseInt(e.target.value, 10))}
              className="w-full accent-teal-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <button
            onClick={handleReset}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors text-sm cursor-pointer"
          >
            {t.routine.retryBtn}
          </button>
        </div>
      )}
    </div>
  );
};
