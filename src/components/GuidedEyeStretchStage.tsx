import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, MoveHorizontal, MoveVertical, Infinity as InfinityIcon, RotateCw, Sparkles } from 'lucide-react';
import { AppLanguage } from '../types';
import { audioGuide } from '../utils/audioGuide';

export type StretchExerciseId = 'horizontal' | 'vertical' | 'infinity' | 'circle' | 'blink';

export interface StretchExerciseMeta {
  id: StretchExerciseId;
  durationSec: number;
  title: Record<AppLanguage, string>;
  shortLabel: Record<AppLanguage, string>;
  instruction: Record<AppLanguage, string>;
  voicePrompt: Record<AppLanguage, string>;
  muscleFocus: Record<AppLanguage, string>;
}

export const STRETCH_EXERCISES: StretchExerciseMeta[] = [
  {
    id: 'horizontal',
    durationSec: 12,
    title: {
      ko: '좌·우 수평 시선 이동',
      en: 'Left-Right Horizontal Gaze',
      ja: '左右水平視線移動',
      zh: '左右水平视线移动',
      es: 'Mirada Horizontal Izq-Der',
      fr: 'Regard Horizontal G-D',
    },
    shortLabel: {
      ko: '좌우 이동',
      en: 'Left-Right',
      ja: '左右移動',
      zh: '左右移动',
      es: 'Horizontal',
      fr: 'Horizontal',
    },
    instruction: {
      ko: '고개는 고정하고 눈동자만 좌우로 움직이는 점을 끝까지 따라가세요.',
      en: 'Keep your head still and follow the dot smoothly from left to right.',
      ja: '頭を動かさず、左右に動く点を視線だけで追ってください。',
      zh: '保持头部不动，仅用眼球追随左右移动的光点。',
      es: 'Mantenga la cabeza quieta y siga el punto de izquierda a derecha.',
      fr: 'Gardez la tête immobile et suivez le point de gauche à droite.',
    },
    voicePrompt: {
      ko: '좌우 눈 스트레칭입니다. 고개는 고정하고 움직이는 점을 눈동자로만 따라가세요.',
      en: 'Horizontal eye stretch. Keep your head still and follow the moving dot left and right.',
      ja: '左右の目のストレッチです。頭を固定して動く点を追ってください。',
      zh: '左右眼部拉伸。请保持头部不动，用眼睛追随左右移动的光点。',
      es: 'Estiramiento horizontal. Siga el punto de izquierda a derecha sin mover la cabeza.',
      fr: 'Étirement horizontal. Suivez le point de gauche à droite sans bouger la tête.',
    },
    muscleFocus: {
      ko: '내직근 · 외직근 이완',
      en: 'Medial & Lateral Rectus',
      ja: '内直筋・外直筋',
      zh: '内直肌与外直肌',
      es: 'Músculos rectos horizontales',
      fr: 'Muscles droits horizontaux',
    },
  },
  {
    id: 'vertical',
    durationSec: 12,
    title: {
      ko: '상·하 수직 시선 이동',
      en: 'Up-Down Vertical Gaze',
      ja: '上下垂直視線移動',
      zh: '上下垂直视线移动',
      es: 'Mirada Vertical Arriba-Abajo',
      fr: 'Regard Vertical Haut-Bas',
    },
    shortLabel: {
      ko: '상하 이동',
      en: 'Up-Down',
      ja: '上下移動',
      zh: '上下移动',
      es: 'Vertical',
      fr: 'Vertical',
    },
    instruction: {
      ko: '턱을 당긴 채 시선만 위아래로 크게 뻗어 뭉친 눈 근육을 풀어주세요.',
      en: 'Stretch your gaze smoothly all the way up and down without tilting your head.',
      ja: '頭を動かさず、視線だけを上下に大きく動かして目の筋肉を伸ばします。',
      zh: '轻收下巴，仅用视线大幅度上下移动以舒缓眼肌紧绷。',
      es: 'Mueva suavemente la mirada hacia arriba y abajo sin inclinar la cabeza.',
      fr: 'Déplacez le regard de haut en bas sans incliner la tête.',
    },
    voicePrompt: {
      ko: '상하 눈 스트레칭입니다. 점을 따라 눈동자를 위아래로 천천히 움직여 주세요.',
      en: 'Vertical eye stretch. Move your eyes smoothly up and down with the dot.',
      ja: '上下のストレッチです。点に合わせて視線をゆっくり上下に動かしてください。',
      zh: '上下眼部拉伸。请跟随光点缓缓上下移动视线。',
      es: 'Estiramiento vertical. Siga el punto lentamente hacia arriba y abajo.',
      fr: 'Étirement vertical. Suivez le point doucement vers le haut et le bas.',
    },
    muscleFocus: {
      ko: '상직근 · 하직근 스트레칭',
      en: 'Superior & Inferior Rectus',
      ja: '上直筋・下直筋',
      zh: '上直肌与下直肌',
      es: 'Músculos rectos verticales',
      fr: 'Muscles droits verticaux',
    },
  },
  {
    id: 'infinity',
    durationSec: 12,
    title: {
      ko: '대각선 · 8자(∞) 시선 추적',
      en: 'Diagonal Figure-8 Tracking',
      ja: '対角線・8の字トラッキング',
      zh: '对角线·8字形追踪',
      es: 'Seguimiento en Ocho (∞)',
      fr: 'Suivi en Huit (∞)',
    },
    shortLabel: {
      ko: '8자 추적',
      en: 'Figure-8',
      ja: '8の字',
      zh: '8字追踪',
      es: 'Figura 8',
      fr: 'Figure 8',
    },
    instruction: {
      ko: '누운 8자 곡선과 대각선 궤적을 따라 시선을 부드럽게 이어가세요.',
      en: 'Trace the smooth figure-eight diagonal path gently with both eyes.',
      ja: '横向きの8の字と対角線の軌道に沿って視線を滑らかに動かしてください。',
      zh: '跟随横向8字形对角线轨迹柔和流畅地转动视线。',
      es: 'Siga suavemente la trayectoria diagonal en forma de ocho.',
      fr: 'Suivez doucement la trajectoire diagonale en forme de huit.',
    },
    voicePrompt: {
      ko: '대각선 8자 시선 추적입니다. 무한대 곡선을 그리듯 부드럽게 따라가세요.',
      en: 'Figure-eight stretch. Follow the smooth infinity path gently with your eyes.',
      ja: '対角線8の字ストレッチです。滑らかな曲線を視線で追ってください。',
      zh: '对角线8字形追踪拉伸。请顺着无穷大轨迹柔和追随。',
      es: 'Estiramiento en forma de ocho. Siga la curva continua con suavidad.',
      fr: 'Étirement en forme de huit. Suivez la courbe en douceur.',
    },
    muscleFocus: {
      ko: '사근 · 대각 협응 유연화',
      en: 'Oblique Coordination',
      ja: '斜筋・複合ストレッチ',
      zh: '眼斜肌协调放松',
      es: 'Coordinación oblicua',
      fr: 'Coordination oblique',
    },
  },
  {
    id: 'circle',
    durationSec: 12,
    title: {
      ko: '360° 원형 안구 돌리기',
      en: '360° Circular Eye Roll',
      ja: '360° 円形眼球回し',
      zh: '360° 环形转动眼球',
      es: 'Rotación Circular 360°',
      fr: 'Rotation Circulaire 360°',
    },
    shortLabel: {
      ko: '눈 돌리기',
      en: 'Eye Roll',
      ja: '円形回し',
      zh: '环形转动',
      es: 'Círculo',
      fr: 'Cercle',
    },
    instruction: {
      ko: '큰 원을 그리는 점을 따라 시계 방향·반시계 방향으로 천천히 눈을 굴려주세요.',
      en: 'Follow the circular path slowly clockwise and counterclockwise.',
      ja: '大きな円を描く点に沿って、時計回り・反時計回りにゆっくり回してください。',
      zh: '跟随圆环光点顺时针与逆时针缓慢转动眼球。',
      es: 'Siga la trayectoria circular en sentido horario y antihorario lentamente.',
      fr: 'Suivez la trajectoire circulaire dans un sens puis dans l’autre.',
    },
    voicePrompt: {
      ko: '원형 눈 돌리기입니다. 큰 원을 그리며 시계 방향과 반대 방향으로 천천히 굴려주세요.',
      en: 'Circular eye roll. Trace the wide circle slowly clockwise and back.',
      ja: '円形の眼球回しです。大きな円に沿ってゆっくり回してください。',
      zh: '环形转动眼球。请跟随大圆顺时针与逆时针缓慢转动。',
      es: 'Rotación circular. Siga el círculo amplio despacio en ambas direcciones.',
      fr: 'Rotation circulaire. Suivez le grand cercle doucement dans les deux sens.',
    },
    muscleFocus: {
      ko: '외안근 전방위 가동성 회복',
      en: 'Full Extraocular Mobility',
      ja: '外眼筋全方向ケア',
      zh: '全向眼外肌舒展',
      es: 'Movilidad extraocular total',
      fr: 'Mobilité oculaire globale',
    },
  },
  {
    id: 'blink',
    durationSec: 12,
    title: {
      ko: '리듬 눈 깜빡임 & 이완',
      en: 'Rhythmic Blink & Relax',
      ja: 'リズムまばたき＆保湿',
      zh: '节律眨眼与润眼放松',
      es: 'Parpadeo Rítmico y Relax',
      fr: 'Clignement Rythmé & Détente',
    },
    shortLabel: {
      ko: '눈 깜빡임',
      en: 'Blink',
      ja: 'まばたき',
      zh: '眨眼保湿',
      es: 'Parpadeo',
      fr: 'Clignement',
    },
    instruction: {
      ko: '중앙 아이콘이 닫힐 때 1초간 지그시 눈을 감았다가 편하게 떠서 눈물막을 적셔주세요.',
      en: 'When the center ring closes, gently squeeze shut for 1 second, then open softly.',
      ja: '中央の目のアイコンに合わせて1秒間ぎゅっと閉じ、優しく開いて潤いを保ちます。',
      zh: '配合中央图标闭合轻闭双眼1秒，再自然睁开以滋润泪膜。',
      es: 'Cuando el icono se cierre, apriete suavemente 1 segundo y abra con calma.',
      fr: 'Lorsque l’anneau se ferme, fermez doucement 1 seconde puis ouvrez.',
    },
    voicePrompt: {
      ko: '마지막 눈 깜빡임 이완입니다. 중앙 리듬에 맞춰 지그시 감았다가 부드럽게 떠주세요.',
      en: 'Rhythmic blinking relaxation. Close gently with the beat and open softly.',
      ja: '最後はリズムまばたきです。中央の動きに合わせて優しく閉じたり開いたりしましょう。',
      zh: '最后是节律眨眼放松。请配合中央节奏轻柔闭眼再睁开。',
      es: 'Parpadeo rítmico final. Cierre y abra los ojos suavemente al ritmo.',
      fr: 'Clignement rythmé final. Fermez et ouvrez doucement les yeux au rythme.',
    },
    muscleFocus: {
      ko: '마이봄샘 자극 · 안구 건조 완화',
      en: 'Tear Film & Dry-Eye Relief',
      ja: '涙膜循環・ドライアイケア',
      zh: '促进泪液循环缓解干涩',
      es: 'Hidratación lagrimal',
      fr: 'Hydratation du film lacrymal',
    },
  },
];

interface GuidedEyeStretchStageProps {
  exerciseIndex: number;
  exerciseSecondsLeft: number;
  isActive: boolean;
  language: AppLanguage;
  voiceEnabled?: boolean;
  announceOnExerciseChange?: boolean;
  compact?: boolean;
}

export const GuidedEyeStretchStage: React.FC<GuidedEyeStretchStageProps> = ({
  exerciseIndex,
  exerciseSecondsLeft,
  isActive,
  language,
  announceOnExerciseChange = true,
  compact = false,
}) => {
  const safeIndex = ((exerciseIndex % STRETCH_EXERCISES.length) + STRETCH_EXERCISES.length) % STRETCH_EXERCISES.length;
  const currentExercise = STRETCH_EXERCISES[safeIndex];
  const [phase, setPhase] = useState<number>(0);
  const lastAnnouncedRef = useRef<string | null>(null);
  const animRef = useRef<number | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Announce movement transition via audioGuide when active
  useEffect(() => {
    if (!isActive || !announceOnExerciseChange) return;
    const key = `${currentExercise.id}-${language}`;
    if (lastAnnouncedRef.current !== key) {
      lastAnnouncedRef.current = key;
      audioGuide.speak(
        currentExercise.voicePrompt[language] || currentExercise.voicePrompt.ko,
        undefined,
        undefined,
        language
      );
    }
  }, [currentExercise, isActive, language, announceOnExerciseChange]);

  useEffect(() => {
    if (!isActive) {
      lastAnnouncedRef.current = null;
    }
  }, [isActive]);

  // Smooth 60fps compositor loop for target trajectory & blink cadence
  useEffect(() => {
    if (!isActive || prefersReducedMotion) return;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      setPhase((prev) => prev + dt * 1.45);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [isActive, prefersReducedMotion]);

  // Calculate normalized (-1 to 1) target offset based on active exercise
  const targetPos = useMemo(() => {
    if (prefersReducedMotion || !isActive) {
      return { x: 0, y: 0, blinkClosed: false };
    }

    switch (currentExercise.id) {
      case 'horizontal': {
        const x = Math.sin(phase * 1.55);
        return { x, y: 0, blinkClosed: false };
      }
      case 'vertical': {
        const y = Math.sin(phase * 1.55);
        return { x: 0, y, blinkClosed: false };
      }
      case 'infinity': {
        // Lemniscate / figure-eight curve across full field
        const t = phase * 1.35;
        const x = Math.sin(t);
        const y = Math.sin(2 * t) * 0.72;
        return { x, y, blinkClosed: false };
      }
      case 'circle': {
        // Reverse direction halfway through the 12s window
        const dir = exerciseSecondsLeft > 6 ? 1 : -1;
        const t = phase * 1.45 * dir;
        return { x: Math.cos(t), y: Math.sin(t), blinkClosed: false };
      }
      case 'blink': {
        // 3-second cycle: open 1.9s, gentle squeeze shut 1.1s
        const cycle = (phase * 0.65) % 1;
        const blinkClosed = cycle > 0.63;
        return { x: 0, y: 0, blinkClosed };
      }
      default:
        return { x: 0, y: 0, blinkClosed: false };
    }
  }, [currentExercise.id, phase, exerciseSecondsLeft, isActive, prefersReducedMotion]);

  const ExerciseIcon =
    currentExercise.id === 'horizontal'
      ? MoveHorizontal
      : currentExercise.id === 'vertical'
      ? MoveVertical
      : currentExercise.id === 'infinity'
      ? InfinityIcon
      : currentExercise.id === 'circle'
      ? RotateCw
      : Eye;

  // Convert normalized (-1..1) to pixel offsets inside track box
  const maxOffsetX = compact ? 102 : 124;
  const maxOffsetY = compact ? 74 : 90;
  const translateX = targetPos.x * maxOffsetX;
  const translateY = targetPos.y * maxOffsetY;

  const blinkCloseLabel =
    language === 'en'
      ? 'Close eyes gently (1s)'
      : language === 'ja'
      ? '目を優しく閉じて (1秒)'
      : language === 'zh'
      ? '轻闭双眼 (1秒)'
      : language === 'es'
      ? 'Cierre suave (1s)'
      : language === 'fr'
      ? 'Fermez doucement (1s)'
      : '지그시 눈 감기 (1초)';

  const blinkOpenLabel =
    language === 'en'
      ? 'Open softly & breathe'
      : language === 'ja'
      ? '優しく開いてリラックス'
      : language === 'zh'
      ? '自然睁开保持湿润'
      : language === 'es'
      ? 'Abra suavemente'
      : language === 'fr'
      ? 'Ouvrez doucement'
      : '편안하게 눈 뜨기';

  return (
    <div className="space-y-3">
      {/* Top guidance strip: unboxed metadata + live countdown */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0">
            <ExerciseIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {currentExercise.title[language] || currentExercise.title.ko}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              {currentExercise.muscleFocus[language] || currentExercise.muscleFocus.ko}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono tabular-nums text-base font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200/60">
            {exerciseSecondsLeft}s
          </span>
        </div>
      </div>

      {/* Main Gaze Tracking Arena (Dark Obsidian Anti-Glare Canvas) */}
      <div
        className={`relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner ${
          compact ? 'h-56 sm:h-64' : 'h-64 sm:h-76'
        }`}
      >
        {/* Subtle Reference Track Geometry */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          viewBox="0 0 320 220"
          preserveAspectRatio="xMidYMid meet"
        >
          {currentExercise.id === 'horizontal' && (
            <line
              x1="34"
              y1="110"
              x2="286"
              y2="110"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          )}
          {currentExercise.id === 'vertical' && (
            <line
              x1="160"
              y1="26"
              x2="160"
              y2="194"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          )}
          {currentExercise.id === 'circle' && (
            <ellipse
              cx="160"
              cy="110"
              rx="116"
              ry="82"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          )}
          {currentExercise.id === 'infinity' && (
            <path
              d="M 160 110 C 215 36, 282 36, 282 110 C 282 184, 215 184, 160 110 C 105 36, 38 36, 38 110 C 38 184, 105 184, 160 110 Z"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          )}
          {currentExercise.id === 'blink' && (
            <circle
              cx="160"
              cy="110"
              r="68"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          )}
        </svg>

        {/* Center anchor crosshair (very subtle) */}
        <div className="w-2 h-2 rounded-full bg-slate-700/80 pointer-events-none" />

        {/* Gaze Target or Blink Guide */}
        {currentExercise.id === 'blink' ? (
          <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-transform duration-300 border-2 ${
                targetPos.blinkClosed
                  ? 'scale-90 bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'scale-105 bg-teal-500/15 border-teal-400 text-teal-300'
              }`}
            >
              <div className="relative flex flex-col items-center">
                {targetPos.blinkClosed ? (
                  <div className="w-12 h-1.5 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.7)]" />
                ) : (
                  <Eye className="w-12 h-12 stroke-[1.8]" />
                )}
              </div>
            </div>
            <span
              className={`text-sm font-bold tracking-tight ${
                targetPos.blinkClosed ? 'text-amber-300' : 'text-teal-300'
              }`}
            >
              {targetPos.blinkClosed ? blinkCloseLabel : blinkOpenLabel}
            </span>
          </div>
        ) : (
          <div
            className="absolute z-10 flex items-center justify-center will-change-transform"
            style={{
              transform: `translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, 0)`,
            }}
          >
            {/* Outer soft halo */}
            <div className="w-14 h-14 rounded-full bg-teal-400/20 border border-teal-400/50 flex items-center justify-center">
              {/* Inner crisp focal target */}
              <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_24px_rgba(251,191,36,0.75)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-950" />
              </div>
            </div>
          </div>
        )}

        {/* Corner direction hint */}
        {currentExercise.id === 'circle' && (
          <div className="absolute top-3 right-3 text-[11px] font-medium text-teal-300/90 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            {exerciseSecondsLeft > 6
              ? language === 'en'
                ? '↻ Clockwise'
                : language === 'ja'
                ? '↻ 時計回り'
                : language === 'zh'
                ? '↻ 顺时针'
                : language === 'es'
                ? '↻ Sentido horario'
                : language === 'fr'
                ? '↻ Sens horaire'
                : '↻ 시계 방향'
              : language === 'en'
              ? '↺ Counterclockwise'
              : language === 'ja'
              ? '↺ 反時計回り'
              : language === 'zh'
              ? '↺ 逆时针'
              : language === 'es'
              ? '↺ Antihorario'
              : language === 'fr'
              ? '↺ Sens antihoraire'
              : '↺ 반시계 방향'}
          </div>
        )}

        {/* Bottom instruction caption */}
        <div className="absolute bottom-3 left-3 right-3 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/85 px-3 py-1.5 rounded-xl border border-slate-800/90">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>{currentExercise.instruction[language] || currentExercise.instruction.ko}</span>
          </p>
        </div>
      </div>

      {/* Exercise Step Indicators */}
      <div className="grid grid-cols-5 gap-1.5">
        {STRETCH_EXERCISES.map((ex, idx) => {
          const isCurrent = idx === safeIndex;
          const isDone = idx < safeIndex;
          return (
            <div key={ex.id} className="space-y-1 text-center">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  isCurrent ? 'bg-teal-500' : isDone ? 'bg-teal-700/70' : 'bg-slate-200'
                }`}
              />
              <span
                className={`block text-[10px] truncate ${
                  isCurrent ? 'font-bold text-teal-700' : 'text-slate-400'
                }`}
              >
                {ex.shortLabel[language] || ex.shortLabel.ko}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
