import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  ArrowRight,
  Focus,
  Activity,
  Flame,
  Award,
  SlidersHorizontal,
  Compass,
  Timer,
} from 'lucide-react';
import { GaborPatchCanvas } from './GaborPatchCanvas';
import {
  GaborVariety,
  getGaborVarietyParams,
  getLocalizedOrientationInfo,
} from '../utils/gaborGenerator';
import { audioGuide } from '../utils/audioGuide';
import { addSession, calculateStreak, loadSessions } from '../utils/storage';
import { TargetGroup, TrainingSessionRecord, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';

interface DailyRoutineProps {
  targetGroup: TargetGroup;
  voiceEnabled: boolean;
  onFinish?: (session: TrainingSessionRecord) => void;
  language?: AppLanguage;
}

type RoutineStep = 'intro' | 'gabor' | 'accommodation' | 'completed';

export type AngleMode = 'progressive' | 'easy_2' | 'normal_4' | 'expert_8';

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
  const timeTier = elapsed >= 85 ? 4 : elapsed >= 55 ? 3 : elapsed >= 25 ? 2 : 1;
  const matchTier = matches >= 6 ? 4 : matches >= 4 ? 3 : matches >= 2 ? 2 : 1;
  return Math.max(timeTier, matchTier);
}

export const getAngleConfig = (
  lang: AppLanguage = 'ko'
): Record<
  AngleMode,
  { label: string; shortLabel: string; desc: string; angles: number[]; badge: string }
> => ({
  progressive: {
    label:
      lang === 'en'
        ? 'Auto Progressive Tilt (Recommended)'
        : lang === 'ja'
        ? '自動段階傾き (推奨)'
        : lang === 'zh'
        ? '自动渐进倾角 (推荐)'
        : lang === 'es'
        ? 'Inclinación Progresiva (Recomendado)'
        : lang === 'fr'
        ? 'Inclinaison Progressive (Conseillé)'
        : '자동 점진 기울기 (추천)',
    shortLabel:
      lang === 'en'
        ? 'Auto Tilt'
        : lang === 'ja'
        ? '自動傾き'
        : lang === 'zh'
        ? '自动倾角'
        : lang === 'es'
        ? 'Progresivo'
        : lang === 'fr'
        ? 'Progressif'
        : '자동 기울기',
    desc:
      lang === 'en'
        ? 'Starts with H/V & 45° diagonals, then progressively adds 30°·60°·15° tilted stripes as you advance.'
        : lang === 'ja'
        ? '縦・横・45°斜めから始まり、終盤に近づくほど30°・60°・15°の微細な傾きが自動で追加されます。'
        : lang === 'zh'
        ? '从横竖与45°斜向开始，随着训练深入自动解锁30°、60°、15°等精细倾斜角度。'
        : lang === 'es'
        ? 'Comienza con H/V y diagonales de 45° y añade ángulos finos de 30°, 60° y 15° al avanzar.'
        : lang === 'fr'
        ? 'Débute avec H/V et 45° puis débloque des inclinaisons fines à 30°, 60° et 15° au fil de la séance.'
        : '초반 4방향(가로·세로·45° 대각선)에서 시작해, 뒤로 갈수록 30°·60°·15° 미세 기울기가 자동으로 추가됩니다.',
    angles: PROGRESSIVE_TIER_ANGLES[1],
    badge:
      lang === 'en'
        ? 'Auto Escalate'
        : lang === 'ja'
        ? '段階拡張'
        : lang === 'zh'
        ? '渐进解锁'
        : lang === 'es'
        ? 'Progresivo'
        : lang === 'fr'
        ? 'Progressif'
        : '자동 확장',
  },
  easy_2: {
    label:
      lang === 'en'
        ? 'Easy (Horizontal ━ / Vertical ┃ only)'
        : lang === 'ja'
        ? '超かんたん (横 ━ / 縦 ┃ のみ)'
        : lang === 'zh'
        ? '极简 (仅水平 ━ / 垂直 ┃)'
        : lang === 'es'
        ? 'Fácil (Solo Horizontal ━ / Vertical ┃)'
        : lang === 'fr'
        ? 'Facile (Horizontal ━ / Vertical ┃ uniquement)'
        : '초간편 (가로 ━ / 세로 ┃ 만)',
    shortLabel:
      lang === 'en'
        ? 'Easy (H · V)'
        : lang === 'ja'
        ? '超かんたん (縦・横)'
        : lang === 'zh'
        ? '极简 (水平·垂直)'
        : lang === 'es'
        ? 'Fácil (H · V)'
        : lang === 'fr'
        ? 'Facile (H · V)'
        : '초간편 (가로·세로)',
    desc:
      lang === 'en'
        ? 'Consists only of 90° right angles (horizontal & vertical) without confusion.'
        : lang === 'ja'
        ? '傾きなしの90度直角のみで構成され、迷わず一目で判別できます。'
        : lang === 'zh'
        ? '仅由90度直角（水平与垂直）组成，毫无混淆，一目了然。'
        : lang === 'es'
        ? 'Compuesto solo por ángulos rectos de 90° (horizontal y vertical) para ver al instante sin confusión.'
        : lang === 'fr'
        ? 'Composé uniquement d’angles droits à 90° (horizontal et vertical) pour une lisibilité directe.'
        : '기울기 없이 90도 직각으로만 구성되어 헷갈리지 않고 한눈에 바로 보입니다.',
    angles: [0, 90],
    badge:
      lang === 'en'
        ? 'Beginner Pick'
        : lang === 'ja'
        ? '初級おすすめ'
        : lang === 'zh'
        ? '初级推荐'
        : lang === 'es'
        ? 'Recomendado'
        : lang === 'fr'
        ? 'Conseillé'
        : '초급 추천',
  },
  normal_4: {
    label:
      lang === 'en'
        ? 'Standard 4-Way (H, V, Diagonals)'
        : lang === 'ja'
        ? '基本4方向 (縦・横・斜め)'
        : lang === 'zh'
        ? '基本4方向 (水平·垂直·对角)'
        : lang === 'es'
        ? 'Estándar 4 vías (H, V, Diagonales)'
        : lang === 'fr'
        ? 'Standard 4 voies (H, V, Diagonales)'
        : '기본 4방향 (가로·세로·대각선)',
    shortLabel:
      lang === 'en'
        ? 'Standard (4-Way)'
        : lang === 'ja'
        ? '基本4方向'
        : lang === 'zh'
        ? '基本4方向'
        : lang === 'es'
        ? 'Estándar 4 vías'
        : lang === 'fr'
        ? 'Standard 4 voies'
        : '기본 4방향',
    desc:
      lang === 'en'
        ? 'Horizontal, vertical, and two 45° diagonals for balanced visual processing.'
        : lang === 'ja'
        ? '縦・横・右上がり・左上がりの4方向（45度間隔でしっかり識別）。'
        : lang === 'zh'
        ? '水平、垂直、右上和左上4个方向（45度间隔明确区分）。'
        : lang === 'es'
        ? 'Horizontal, vertical y dos diagonales de 45° para un estímulo visual equilibrado.'
        : lang === 'fr'
        ? 'Horizontal, vertical et deux diagonales à 45° pour un équilibre visuel optimal.'
        : '가로, 세로, 우상향, 좌상향 4방향 (45도 간격으로 확실하게 구분)',
    angles: [0, 45, 90, 135],
    badge:
      lang === 'en'
        ? 'Intermediate'
        : lang === 'ja'
        ? '中級'
        : lang === 'zh'
        ? '中级'
        : lang === 'es'
        ? 'Intermedio'
        : lang === 'fr'
        ? 'Intermédiaire'
        : '중급',
  },
  expert_8: {
    label:
      lang === 'en'
        ? 'Precision 8-Way (Fine Tilt Challenge)'
        : lang === 'ja'
        ? '精密8方向 (微細傾き挑戦)'
        : lang === 'zh'
        ? '高精8方向 (细微倾角挑战)'
        : lang === 'es'
        ? 'Precisión 8 vías (Reto de micro-ángulo)'
        : lang === 'fr'
        ? 'Précision 8 voies (Défi micro-angle)'
        : '정밀 8방향 (미세 기울기 도전)',
    shortLabel:
      lang === 'en'
        ? 'Precision (8-Way)'
        : lang === 'ja'
        ? '精密8方向'
        : lang === 'zh'
        ? '高精8方向'
        : lang === 'es'
        ? 'Precisión 8 vías'
        : lang === 'fr'
        ? 'Précision 8 voies'
        : '정밀 8방향',
    desc:
      lang === 'en'
        ? 'Includes subtle 30° and 60° tilt variations for high-level neural cortex challenge.'
        : lang === 'ja'
        ? '30度や60度などの細かな角度まで含む上級者向けの精密モード。'
        : lang === 'zh'
        ? '包含30度、60度等细微倾斜角度的高难度进阶模式。'
        : lang === 'es'
        ? 'Incluye sutiles variaciones a 30° y 60° para un reto avanzado de agudeza visual.'
        : lang === 'fr'
        ? 'Comprend de fines variations à 30° et 60° pour un défi neuronal de haute précision.'
        : '30도, 60도 등 미세한 각도까지 포함된 상급자용 고난도 모드',
    angles: [0, 30, 45, 60, 90, 120, 135, 150],
    badge:
      lang === 'en'
        ? 'Advanced'
        : lang === 'ja'
        ? '上級'
        : lang === 'zh'
        ? '高级'
        : lang === 'es'
        ? 'Avanzado'
        : lang === 'fr'
        ? 'Avancé'
        : '상급',
  },
});

interface PatchItem {
  id: number;
  orientation: number;
  wavelength: number;
  contrast: number;
  phase: number;
  sigma?: number;
  variety: GaborVariety;
}

export const DailyRoutine3Min: React.FC<DailyRoutineProps> = ({
  targetGroup,
  voiceEnabled,
  onFinish,
  language = 'ko',
}) => {
  const t = getTranslation(language);
  const angleConfig = getAngleConfig(language);

  // Timer State (Total 180 seconds = 3 minutes)
  const TOTAL_SECONDS = 180;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<RoutineStep>('intro');

  // Pre/Post Fatigue check
  const [fatigueBefore, setFatigueBefore] = useState<number>(6);
  const [fatigueAfter, setFatigueAfter] = useState<number>(2);

  // Gabor Training State (High density: 24 patches, matching 3 or 4 of a kind)
  const TOTAL_GRID_COUNT = 24;
  const [targetMatchCount, setTargetMatchCount] = useState<3 | 4>(3); // 3개 or 4개
  const [angleMode, setAngleMode] = useState<AngleMode>('progressive'); // Default to progressive tilt escalation!
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

  const getAllowedAngles = useCallback(
    (mode: AngleMode, tier: number) => {
      if (mode === 'progressive') {
        return PROGRESSIVE_TIER_ANGLES[tier] || PROGRESSIVE_TIER_ANGLES[1];
      }
      return angleConfig[mode].angles;
    },
    [angleConfig]
  );

  // Generate dense 24 Gabor patches with guaranteed matching sets
  const generateGaborGrid = useCallback(
    (
      matchCount: 3 | 4 = targetMatchCount,
      currentMode: AngleMode = angleMode,
      tierOverride: number = progressiveTier
    ) => {
      const baseAllowed = getAllowedAngles(currentMode, tierOverride);
      // Shuffle angles so tilted orientations are evenly represented from set 0 onward
      const allowedAngles = [...baseAllowed].sort(() => Math.random() - 0.5);
      const varieties: GaborVariety[] = [
        'single_faint',
        'double_strong',
        'triple_balanced',
        'single_bold',
        'double_soft',
      ];
      const items: PatchItem[] = [];

      const numSets = Math.floor(TOTAL_GRID_COUNT / matchCount);
      for (let s = 0; s < numSets; s++) {
        const angle = allowedAngles[s % allowedAngles.length];
        // Shuffle varieties for this set (strictly 1 to 3 lines max)
        const setVarieties = [...varieties].sort(() => Math.random() - 0.5);
        for (let k = 0; k < matchCount; k++) {
          idCounterRef.current += 1;
          const chosenVar = setVarieties[k % setVarieties.length];
          const vParams = getGaborVarietyParams(chosenVar, 60);
          items.push({
            id: idCounterRef.current,
            orientation: angle,
            wavelength: vParams.wavelength,
            contrast: vParams.contrast,
            phase: vParams.phase,
            sigma: vParams.sigma,
            variety: chosenVar,
          });
        }
      }

      // Shuffle thoroughly
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      setGaborPatches(items);
      setSelectedPatchIds([]);
    },
    [targetMatchCount, angleMode, progressiveTier, getAllowedAngles]
  );

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          const next = prev - 1;

          // Transition to Step 2: accommodation exercise at 60s left
          if (next === 60 && currentStep === 'gabor') {
            setCurrentStep('accommodation');
            const accPhrases: Record<string, string> = {
              ko: '잘하셨습니다! 이제 화면 중앙의 원근 조절 링을 따라 모양체근을 편안하게 이완하세요.',
              en: 'Well done! Now follow the breathing ring in the center to relax your ciliary focusing muscles.',
              ja: '素晴らしいです！画面中央のピント調整リングを見つめて、毛様体筋をリラックスさせましょう。',
              zh: '做得很棒！现在请跟随屏幕中央的变焦环，放松眼部睫状肌。',
              es: '¡Bien hecho! Ahora siga el anillo de enfoque central para relajar el músculo ciliar.',
              fr: 'Bravo ! Suivez maintenant l’anneau de mise au point au centre pour détendre votre muscle ciliaire.',
            };
            audioGuide.speak(accPhrases[language] || accPhrases.ko, undefined, undefined, language);
          }

          // Complete
          if (next === 0) {
            handleCompleteRoutine();
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

  // Step 2 animation loop for accommodation ring
  useEffect(() => {
    if (currentStep === 'accommodation' && isActive) {
      let phase = 0;
      const animate = () => {
        phase += 0.035;
        // smooth sinusoidal breathing
        setFocusProgress((Math.sin(phase) + 1) * 50);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentStep, isActive]);

  // Progressive tilt escalation during Gabor phase (as time or matches progress)
  useEffect(() => {
    if (currentStep !== 'gabor' || !isActive || angleMode !== 'progressive') return;
    const nextTier = computeProgressiveTier(secondsRemaining, gaborMatchesCount);
    if (nextTier > progressiveTier) {
      setProgressiveTier(nextTier);
      const newAngles = PROGRESSIVE_NEW_ANGLES[nextTier] || PROGRESSIVE_TIER_ANGLES[nextTier];
      const tierToastMap: Record<number, Record<AppLanguage, string>> = {
        2: {
          ko: '📐 기울기 확장 (2/4단계): 30°·150° 사선 패턴 추가!',
          en: '📐 Tilt Upgraded (Tier 2/4): 30° & 150° oblique stripes added!',
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

      // Inject a full targetMatchCount set of newly unlocked tilted patches while keeping solvability intact
      setGaborPatches((prev) => {
        const selectedAngleSet = new Set(
          prev.filter((p) => selectedPatchIds.includes(p.id)).map((p) => p.orientation)
        );
        const byAngle = new Map<number, PatchItem[]>();
        prev.forEach((p) => {
          if (!selectedPatchIds.includes(p.id) && !selectedAngleSet.has(p.orientation)) {
            const list = byAngle.get(p.orientation) || [];
            list.push(p);
            byAngle.set(p.orientation, list);
          }
        });
        // Prefer replacing cardinal 0° or 90° sets first so tilted patterns take center stage
        const candidates = Array.from(byAngle.entries())
          .filter(([, list]) => list.length >= targetMatchCount)
          .sort((a, b) => {
            const aCardinal = a[0] === 0 || a[0] === 90 ? 0 : 1;
            const bCardinal = b[0] === 0 || b[0] === 90 ? 0 : 1;
            return aCardinal - bCardinal;
          });
        if (candidates.length === 0) return prev;
        const victimIds = new Set(candidates[0][1].slice(0, targetMatchCount).map((p) => p.id));
        const injectedAngle = newAngles[Math.floor(Math.random() * newAngles.length)];
        return prev.map((p) =>
          victimIds.has(p.id) ? { ...p, orientation: injectedAngle } : p
        );
      });
    }
  }, [
    currentStep,
    isActive,
    angleMode,
    secondsRemaining,
    gaborMatchesCount,
    progressiveTier,
    selectedPatchIds,
    targetMatchCount,
    language,
  ]);

  const handleStartRoutine = () => {
    setProgressiveTier(1);
    setGaborMatchesCount(0);
    setComboCount(0);
    generateGaborGrid(targetMatchCount, angleMode, 1);
    setCurrentStep('gabor');
    setIsActive(true);
    setSecondsRemaining(TOTAL_SECONDS);
    const startPhrases: Record<string, string> = {
      ko: `하루 3분 시력 회복 루틴을 시작합니다. 화면의 가보르 패치 중 같은 줄무늬 각도 ${targetMatchCount}개를 찾아 터치하세요!`,
      en: `Starting your daily 3-minute vision routine. Tap ${targetMatchCount} patches with matching stripe angles!`,
      ja: `1日3分の視力回復ルーティンを開始します。同じ傾きのパッチを${targetMatchCount}個探してタップしてください！`,
      zh: `开始每日3分钟视力康复日常。请在屏幕上找出${targetMatchCount}个相同条纹角度的斑块并点击！`,
      es: `Iniciando la rutina visual de 3 minutos. ¡Toque ${targetMatchCount} parches con el mismo ángulo de rayas!`,
      fr: `Démarrage de votre routine visuelle de 3 minutes. Touchez ${targetMatchCount} patchs ayant la même orientation !`,
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

  // Switch difficulty mode between 3 of a kind and 4 of a kind
  const handleToggleDifficulty = (count: 3 | 4) => {
    setTargetMatchCount(count);
    setSelectedPatchIds([]);
    setMismatchHint(null);
    generateGaborGrid(count, angleMode);
    audioGuide.playTick();
    if (count === 4) {
      const p4: Record<string, string> = {
        ko: '초고난도 마스터 모드! 같은 각도 4개를 찾아보세요.',
        en: 'Master mode! Find 4 matching patches of the same angle.',
        ja: 'マスターモード！同じ向きのパッチを4個探してください。',
        zh: '大师模式！请找出4个相同角度的斑块。',
        es: '¡Modo Maestro! Busque 4 parches con el mismo ángulo.',
        fr: 'Mode Maître ! Trouvez 4 patchs ayant le même angle.',
      };
      audioGuide.speak(p4[language] || p4.ko, undefined, undefined, language);
    } else {
      const p3: Record<string, string> = {
        ko: '도전 모드! 같은 각도 3개를 찾아보세요.',
        en: 'Standard mode! Find 3 matching patches of the same angle.',
        ja: '標準モード！同じ向きのパッチを3個探してください。',
        zh: '标准模式！请找出3个相同角度的斑块。',
        es: '¡Modo Básico! Busque 3 parches con el mismo ángulo.',
        fr: 'Mode Standard ! Trouvez 3 patchs ayant le même angle.',
      };
      audioGuide.speak(p3[language] || p3.ko, undefined, undefined, language);
    }
  };

  // Switch angle complexity mode (Auto Progressive / Easy / Normal / Expert)
  const handleAngleModeChange = (mode: AngleMode) => {
    setAngleMode(mode);
    setSelectedPatchIds([]);
    setMismatchHint(null);
    if (currentStep === 'gabor') {
      const tier = mode === 'progressive' ? computeProgressiveTier(secondsRemaining, gaborMatchesCount) : 1;
      setProgressiveTier(tier);
      generateGaborGrid(targetMatchCount, mode, tier);
    }
    audioGuide.playTick();
    if (mode === 'progressive') {
      const pProg: Record<string, string> = {
        ko: '자동 점진 기울기 모드! 뒤로 갈수록 다양한 기울기가 추가됩니다.',
        en: 'Auto progressive tilt mode! Finer diagonal angles unlock as you continue.',
        ja: '自動段階傾きモード！進むにつれて細かな傾きが追加されます。',
        zh: '自动渐进倾角模式！训练越深入将解锁更多倾斜角度。',
        es: '¡Modo inclinación progresiva! Se añadirán más ángulos conforme avance.',
        fr: 'Mode inclinaison progressive ! De nouveaux angles s’ajouteront au fil de la séance.',
      };
      audioGuide.speak(pProg[language] || pProg.ko, undefined, undefined, language);
    } else if (mode === 'easy_2') {
      const pEasy: Record<string, string> = {
        ko: '초간편 모드! 가로와 세로 줄무늬만 집중해보세요.',
        en: 'Easy mode! Focus only on horizontal and vertical stripes.',
        ja: '超かんたんモード！縦と横の縞だけに集中してください。',
        zh: '极简模式！仅专注于水平与垂直条纹。',
        es: '¡Modo Fácil! Concéntrese solo en rayas horizontales y verticales.',
        fr: 'Mode Facile ! Concentrez-vous sur les rayures horizontales et verticales.',
      };
      audioGuide.speak(pEasy[language] || pEasy.ko, undefined, undefined, language);
    } else if (mode === 'normal_4') {
      const pNorm: Record<string, string> = {
        ko: '기본 4방향 모드로 전환되었습니다.',
        en: 'Switched to standard 4-way angle mode.',
        ja: '基本4方向モードに切り替えました。',
        zh: '已切换为基本4方向模式。',
        es: 'Cambiado a modo estándar de 4 direcciones.',
        fr: 'Passage au mode standard à 4 directions.',
      };
      audioGuide.speak(pNorm[language] || pNorm.ko, undefined, undefined, language);
    } else {
      const pExp: Record<string, string> = {
        ko: '정밀 8방향 모드! 미세 기울기 도전입니다.',
        en: 'Precision 8-way mode! Challenge fine angle differences.',
        ja: '精密8方向モード！微細な傾きへの挑戦です。',
        zh: '高精8方向模式！挑战微细角度辨析。',
        es: '¡Modo Precisión de 8 vías! Reto de ángulos sutiles.',
        fr: 'Mode Précision 8 voies ! Relevez le défi des angles subtils.',
      };
      audioGuide.speak(pExp[language] || pExp.ko, undefined, undefined, language);
    }
  };

  // Crucial requirement:
  // When clicked, don't leave remaining ones empty/obvious; show success effect and REFILL immediately!
  const handleSelectGaborPatch = (item: PatchItem) => {
    setMismatchHint(null);

    // If already in selected array, deselect it
    if (selectedPatchIds.includes(item.id)) {
      setSelectedPatchIds((prev) => prev.filter((id) => id !== item.id));
      return;
    }

    const currentSelected = gaborPatches.filter((p) => selectedPatchIds.includes(p.id));

    // If we have selected items, verify that the new item matches the angle of the previous ones
    if (currentSelected.length > 0) {
      const targetAngle = currentSelected[0].orientation;
      if (item.orientation !== targetAngle) {
        // Wrong match - soft audio error, reset selection, and show gentle explanation!
        audioGuide.playErrorChime();
        const targetInfo = getLocalizedOrientationInfo(targetAngle, language);
        const tappedInfo = getLocalizedOrientationInfo(item.orientation, language);

        setMismatchHint(
          language === 'en'
            ? `Angle mismatch: Looking for [${targetInfo.label} ${targetInfo.symbol}] but tapped [${tappedInfo.label} ${tappedInfo.symbol}]!`
            : language === 'ja'
            ? `向き不一致: [${targetInfo.label} ${targetInfo.symbol}] を探している最中に [${tappedInfo.label} ${tappedInfo.symbol}] をタップしました！`
            : language === 'zh'
            ? `方向不符：目标为 [${targetInfo.label} ${targetInfo.symbol}]，您点击了 [${tappedInfo.label} ${tappedInfo.symbol}]！`
            : language === 'es'
            ? `¡Ángulo diferente: Buscando [${targetInfo.label} ${targetInfo.symbol}] pero tocó [${tappedInfo.label} ${tappedInfo.symbol}]!`
            : language === 'fr'
            ? `Angle différent : Recherche de [${targetInfo.label} ${targetInfo.symbol}] mais touché [${tappedInfo.label} ${tappedInfo.symbol}] !`
            : `방향 다름: [${targetInfo.label} ${targetInfo.symbol}]을 찾는 중인데 [${tappedInfo.label} ${tappedInfo.symbol}]을 누르셨어요!`
        );
        setTimeout(() => setMismatchHint(null), 3000);
        setSelectedPatchIds([]);
        setComboCount(0);
        return;
      }
    }

    // New item matches or is first item
    const newSelectedIds = [...selectedPatchIds, item.id];

    if (newSelectedIds.length === targetMatchCount) {
      // MATCH SUCCESS!
      audioGuide.playSuccessChime();
      const newCombo = comboCount + 1;
      const nextMatchTotal = gaborMatchesCount + 1;
      setComboCount(newCombo);
      setGaborMatchesCount(nextMatchTotal);

      const bonusMsg =
        language === 'en'
          ? targetMatchCount === 4
            ? `Master Match! 4 aligned (+150 pts)${newCombo > 1 ? ` · ${newCombo}x Streak!` : ''}`
            : `Great! 3 matched (+100 pts)${newCombo > 1 ? ` · ${newCombo}x Streak!` : ''}`
          : language === 'ja'
          ? targetMatchCount === 4
            ? `マスター成功！4個一致 (+150点)${newCombo > 1 ? ` · ${newCombo}連続コンボ！` : ''}`
            : `成功！3個一致 (+100点)${newCombo > 1 ? ` · ${newCombo}連続コンボ！` : ''}`
          : language === 'zh'
          ? targetMatchCount === 4
            ? `大师成功！4个配对 (+150分)${newCombo > 1 ? ` · ${newCombo}连击！` : ''}`
            : `成功！3个配对 (+100分)${newCombo > 1 ? ` · ${newCombo}连击！` : ''}`
          : language === 'es'
          ? targetMatchCount === 4
            ? `¡Maestro! 4 emparejados (+150 pts)${newCombo > 1 ? ` · ¡Racha x${newCombo}!` : ''}`
            : `¡Bien! 3 emparejados (+100 pts)${newCombo > 1 ? ` · ¡Racha x${newCombo}!` : ''}`
          : language === 'fr'
          ? targetMatchCount === 4
            ? `Maître ! 4 associés (+150 pts)${newCombo > 1 ? ` · Série x${newCombo} !` : ''}`
            : `Bravo ! 3 associés (+100 pts)${newCombo > 1 ? ` · Série x${newCombo} !` : ''}`
          : targetMatchCount === 4
          ? `마스터 성공! 4개 일치 (+150점) ${newCombo > 1 ? `· ${newCombo}연속 콤보!` : ''}`
          : `✨ 성공! 3개 일치 (+100점) ${newCombo > 1 ? `· ${newCombo}연속 콤보!` : ''}`;
      setSuccessToast(bonusMsg);
      setTimeout(() => setSuccessToast(null), 2000);

      // Re-populate matched slots with new challenging random patches so the board ALWAYS STAYS FULL!
      const effectiveTier =
        angleMode === 'progressive'
          ? computeProgressiveTier(secondsRemaining, nextMatchTotal)
          : progressiveTier;
      const allowedAngles = getAllowedAngles(angleMode, effectiveTier);
      const tiltedPool = allowedAngles.filter((a) => a !== 0 && a !== 90);
      const replacementAngle =
        angleMode === 'progressive' && tiltedPool.length > 0 && Math.random() < 0.78
          ? tiltedPool[Math.floor(Math.random() * tiltedPool.length)]
          : allowedAngles[Math.floor(Math.random() * allowedAngles.length)];
      const varieties: GaborVariety[] = [
        'single_faint',
        'double_strong',
        'triple_balanced',
        'single_bold',
        'double_soft',
      ];
      const replacementVarieties = [...varieties].sort(() => Math.random() - 0.5);

      setGaborPatches((prev) =>
        prev.map((p) => {
          const matchedIdx = newSelectedIds.indexOf(p.id);
          if (matchedIdx !== -1) {
            idCounterRef.current += 1;
            const chosenVar = replacementVarieties[matchedIdx % replacementVarieties.length];
            const vParams = getGaborVarietyParams(chosenVar, 60);
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
        })
      );

      setSelectedPatchIds([]);
    } else {
      // First or second matching item clicked
      audioGuide.playTick();
      setSelectedPatchIds(newSelectedIds);
    }
  };

  const handleCompleteRoutine = () => {
    setIsActive(false);
    setCurrentStep('completed');
    audioGuide.playCelebrationFanfare();
    const completePhrases: Record<string, string> = {
      ko: '축하합니다! 서현 코치와 함께 오늘의 3분 눈 건강 훈련을 모두 완료하셨습니다.',
      en: 'Congratulations! You have completed today’s 3-minute eye health training.',
      ja: 'おめでとうございます！本日の3分間視力トレーニングを無事完了しました。',
      zh: '恭喜！您已顺利完成今天的3分钟视力健康训练。',
      es: '¡Felicidades! Ha completado su entrenamiento de salud visual de 3 minutos de hoy.',
      fr: 'Félicitations ! Vous avez terminé votre entraînement de santé visuelle de 3 minutes aujourd’hui.',
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

    // Save session
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
          <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
            3M
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{t.routine.badge}</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>
                {currentStep === 'intro' && t.routine.stepIndicator}
                {currentStep === 'gabor' &&
                  (language === 'en'
                    ? '1~2m: Gabor Match'
                    : language === 'ja'
                    ? '1~2分: ガボール一致'
                    : language === 'zh'
                    ? '1~2分: 伽博配对'
                    : language === 'es'
                    ? '1~2m: Coincidencia Gabor'
                    : language === 'fr'
                    ? '1~2m: Correspondance Gabor'
                    : '1~2분: 가보르 짝맞추기')}
                {currentStep === 'accommodation' &&
                  (language === 'en'
                    ? '3m: 20-20-20 Stretch'
                    : language === 'ja'
                    ? '3分: 20-20-20ストレッチ'
                    : language === 'zh'
                    ? '3分: 20-20-20远近放松'
                    : language === 'es'
                    ? '3m: Estiramiento 20-20-20'
                    : language === 'fr'
                    ? '3m: Étirement 20-20-20'
                    : '3분: 20-20-20 스트레칭')}
                {currentStep === 'completed' && t.routine.completeTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Big Digital Timer & Control */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl sm:text-2xl font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl tracking-tight">
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

      {/* Progress Bars for Routine */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div
          className={`h-2 rounded-full transition-all ${
            secondsRemaining <= 60 ? 'bg-teal-600' : isActive ? 'bg-teal-400' : 'bg-slate-200'
          }`}
          title="1~2m"
        />
        <div
          className={`h-2 rounded-full transition-all ${
            secondsRemaining === 0 ? 'bg-teal-600' : secondsRemaining < 60 ? 'bg-teal-400' : 'bg-slate-200'
          }`}
          title="3m"
        />
      </div>

      {/* SCREEN 1: INTRO / PRE-ASSESSMENT */}
      {currentStep === 'intro' && (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-2">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-xs sm:text-sm">
              <Focus className="w-4 h-4 text-teal-700" />
              <span>{t.routine.startTitle}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.routine.startDesc}
            </p>
          </div>

          {/* Difficulty mode selector before start */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
              <span>
                {language === 'en'
                  ? 'Target Match Count'
                  : language === 'ja'
                  ? '一致目標数'
                  : language === 'zh'
                  ? '匹配目标数量'
                  : language === 'es'
                  ? 'Objetivo de Coincidencias'
                  : language === 'fr'
                  ? 'Objectif de Correspondances'
                  : '일치 목표 개수'}
              </span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleDifficulty(3)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  targetMatchCount === 3
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {language === 'en'
                  ? 'Standard (Match 3 same angle)'
                  : language === 'ja'
                  ? '標準モード (同じ向き3個)'
                  : language === 'zh'
                  ? '标准模式 (匹配3个同角)'
                  : language === 'es'
                  ? 'Modo Básico (3 del mismo ángulo)'
                  : language === 'fr'
                  ? 'Mode Standard (3 du même angle)'
                  : '기본 모드 (같은 각도 3개 매칭)'}
              </button>
              <button
                type="button"
                onClick={() => handleToggleDifficulty(4)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  targetMatchCount === 4
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {language === 'en'
                  ? 'Master (Match 4 same angle)'
                  : language === 'ja'
                  ? 'マスターモード (同じ向き4個)'
                  : language === 'zh'
                  ? '大师模式 (匹配4个同角)'
                  : language === 'es'
                  ? 'Modo Maestro (4 del mismo ángulo)'
                  : language === 'fr'
                  ? 'Mode Maître (4 du même angle)'
                  : '마스터 모드 (같은 각도 4개 매칭)'}
              </button>
            </div>
          </div>

          {/* Orientation & Tilt Progression Selector */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-teal-700" />
                <span>{t.routine.difficultyTitle}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                {angleConfig[angleMode].badge}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['progressive', 'normal_4', 'expert_8', 'easy_2'] as AngleMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleAngleModeChange(mode)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                    angleMode === mode
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {angleConfig[mode].shortLabel}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {angleConfig[angleMode].desc}
            </p>
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

      {/* SCREEN 2: HIGH-DENSITY GABOR TRAINING (FULL SCREEN GRID) */}
      {currentStep === 'gabor' && (
        <div className="space-y-3">
          {/* Status bar */}
          <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">
                {t.routine.currentGoal} ({targetMatchCount})
              </span>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Quick Angle Mode Switcher Chips in-game */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-100 rounded-xl text-[11px]">
            <span className="text-slate-600 font-semibold px-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-teal-700" />
              <span>
                {angleMode === 'progressive'
                  ? language === 'en'
                    ? `Tilt Stage ${progressiveTier}/4 (${PROGRESSIVE_TIER_ANGLES[progressiveTier].length} dirs)`
                    : language === 'ja'
                    ? `傾き段階 ${progressiveTier}/4 (${PROGRESSIVE_TIER_ANGLES[progressiveTier].length}方向)`
                    : language === 'zh'
                    ? `倾角 ${progressiveTier}/4阶 (${PROGRESSIVE_TIER_ANGLES[progressiveTier].length}向)`
                    : language === 'es'
                    ? `Nivel ${progressiveTier}/4 (${PROGRESSIVE_TIER_ANGLES[progressiveTier].length} vías)`
                    : language === 'fr'
                    ? `Palier ${progressiveTier}/4 (${PROGRESSIVE_TIER_ANGLES[progressiveTier].length} voies)`
                    : `기울기 ${progressiveTier}/4단계 (${PROGRESSIVE_TIER_ANGLES[progressiveTier].length}방향)`
                  : language === 'en'
                  ? 'Angle:'
                  : language === 'ja'
                  ? '傾き:'
                  : language === 'zh'
                  ? '角度:'
                  : language === 'es'
                  ? 'Ángulo:'
                  : language === 'fr'
                  ? 'Angle :'
                  : '기울기:'}
              </span>
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {(['progressive', 'normal_4', 'expert_8', 'easy_2'] as AngleMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleAngleModeChange(mode)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    angleMode === mode
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {angleConfig[mode].shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE TARGET DIRECTION GUIDE BANNER */}
          {selectedPatchIds.length > 0 ? (
            (() => {
              const firstPatch = gaborPatches.find((p) => selectedPatchIds.includes(p.id));
              if (!firstPatch) return null;
              const info = getLocalizedOrientationInfo(firstPatch.orientation, language);
              const remaining = targetMatchCount - selectedPatchIds.length;

              return (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2.5">
                    <GaborPatchCanvas
                      size={38}
                      orientationDeg={firstPatch.orientation}
                      wavelength={Math.round(firstPatch.wavelength * 0.65)}
                      contrast={firstPatch.contrast}
                      phase={firstPatch.phase}
                      isTargetIndicator
                      className="shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>
                          {language === 'en'
                            ? 'Target angle:'
                            : language === 'ja'
                            ? '目標の向き:'
                            : language === 'zh'
                            ? '目标方向:'
                            : language === 'es'
                            ? 'Ángulo objetivo:'
                            : language === 'fr'
                            ? 'Angle cible :'
                            : '선택한 목표 방향:'}
                        </span>
                        <span className="text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md font-extrabold text-xs">
                          {info.label} ({info.symbol})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium pt-0.5">
                        {language === 'en' ? (
                          <>Tap <strong className="text-amber-800 underline">{remaining}</strong> more matching patches!</>
                        ) : language === 'ja' ? (
                          <>同じ向きのパッチをあと <strong className="text-amber-800 underline">{remaining}個</strong> タップ！</>
                        ) : language === 'zh' ? (
                          <>请再点击 <strong className="text-amber-800 underline">{remaining}个</strong> 相同方向的斑块！</>
                        ) : language === 'es' ? (
                          <>¡Toque <strong className="text-amber-800 underline">{remaining}</strong> parches más de este ángulo!</>
                        ) : language === 'fr' ? (
                          <>Touchez <strong className="text-amber-800 underline">{remaining}</strong> autres patchs de même angle !</>
                        ) : (
                          <>같은 방향 패치를 <strong className="text-amber-800 underline">{remaining}개</strong> 더 터치하세요!</>
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
                ? '💡 Tap any patch to reveal the target orientation to match at the top.'
                : language === 'ja'
                ? '💡 パッチを1つタップすると、探す向き（縦・横など）が上に大きく表示されます。'
                : language === 'zh'
                ? '💡 点击任意一个色块，上方将大字提示需寻找的目标条纹朝向。'
                : language === 'es'
                ? '💡 Toque cualquier parche para ver el ángulo objetivo a emparejar arriba.'
                : language === 'fr'
                ? '💡 Touchez n’importe quel patch pour voir l’angle cible à associer en haut.'
                : '💡 아무 패치나 1개 터치하면 찾을 방향(가로/세로 등)이 상단에 크게 안내됩니다.'}
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

          {/* Screen-filling Dense 24 Gabor Grid: 6 cols x 4 rows on tablet/desktop, 4 cols x 6 rows on small phone */}
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

          {/* Mode Switcher in-game */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
            <span>
              {language === 'en'
                ? `💡 Find and tap ${targetMatchCount} patches with identical stripe angles.`
                : language === 'ja'
                ? `💡 同じ傾きのパッチを${targetMatchCount}個見つけてタップしてください。`
                : language === 'zh'
                ? `💡 找出并点击${targetMatchCount}个相同倾斜角度的斑块。`
                : language === 'es'
                ? `💡 Busque y toque ${targetMatchCount} parches con el mismo ángulo de rayas.`
                : language === 'fr'
                ? `💡 Repérez et touchez ${targetMatchCount} patchs ayant exactement le même angle.`
                : `💡 같은 각도(기울기)의 패치 ${targetMatchCount}개를 찾아 터치하세요.`}
            </span>
            <button
              type="button"
              onClick={() => handleToggleDifficulty(targetMatchCount === 3 ? 4 : 3)}
              className="text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer"
            >
              {targetMatchCount === 3
                ? (language === 'en' ? 'Switch to Master (4)' : language === 'ja' ? '4個マスターモードへ' : language === 'zh' ? '切换至4个大师模式' : language === 'es' ? 'Cambiar a Modo Maestro (4)' : language === 'fr' ? 'Passer au Mode Maître (4)' : '4개 마스터 모드로 전환')
                : (language === 'en' ? 'Switch to Standard (3)' : language === 'ja' ? '3個標準モードへ' : language === 'zh' ? '切换至3个挑战模式' : language === 'es' ? 'Cambiar a Modo Básico (3)' : language === 'fr' ? 'Passer au Mode Standard (3)' : '3개 도전 모드로 전환')}
            </button>
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
