import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Eye,
  Award,
} from 'lucide-react';
import { AppLanguage, TrainingSessionRecord } from '../types';
import { getTranslation } from '../utils/i18n';
import { addSession } from '../utils/storage';
import { audioGuide } from '../utils/audioGuide';
import { GuidedEyeStretchStage, STRETCH_EXERCISES } from './GuidedEyeStretchStage';

interface EyeStretchingStudioProps {
  voiceEnabled: boolean;
  onSessionComplete?: (session: TrainingSessionRecord) => void;
  language?: AppLanguage;
}

type StretchMode = 'course' | 'single';

export const EyeStretchingStudio: React.FC<EyeStretchingStudioProps> = ({
  onSessionComplete,
  language = 'ko',
}) => {
  const t = getTranslation(language);
  const [mode, setMode] = useState<StretchMode>('course');
  const [selectedSingleIdx, setSelectedSingleIdx] = useState<number>(0);
  const [phaseState, setPhaseState] = useState<'ready' | 'running' | 'completed'>('ready');
  const [isActive, setIsActive] = useState<boolean>(false);

  const totalCourseSeconds = STRETCH_EXERCISES.reduce((acc, ex) => acc + ex.durationSec, 0); // 60s
  const singleDuration = STRETCH_EXERCISES[selectedSingleIdx]?.durationSec || 12;

  const [courseSecondsLeft, setCourseSecondsLeft] = useState<number>(totalCourseSeconds);
  const [singleSecondsLeft, setSingleSecondsLeft] = useState<number>(singleDuration);

  // Derive active exercise index & countdown inside the 60s full course
  const getCourseProgress = useCallback(
    (secsLeft: number) => {
      const elapsed = Math.max(0, totalCourseSeconds - secsLeft);
      let acc = 0;
      for (let i = 0; i < STRETCH_EXERCISES.length; i++) {
        const dur = STRETCH_EXERCISES[i].durationSec;
        if (elapsed < acc + dur) {
          return {
            idx: i,
            exSecsLeft: acc + dur - elapsed,
          };
        }
        acc += dur;
      }
      return { idx: STRETCH_EXERCISES.length - 1, exSecsLeft: 0 };
    },
    [totalCourseSeconds]
  );

  const handleFinishSession = useCallback(
    (durationSpent: number) => {
      setIsActive(false);
      setPhaseState('completed');

      const donePhrases: Record<AppLanguage, string> = {
        ko: '눈 스트레칭이 완료되었습니다! 눈 근육과 초점 조절 기능이 한결 부드러워졌어요.',
        en: 'Eye stretching complete! Your eye muscles and focusing flexibility feel refreshed.',
        ja: '目のストレッチが完了しました！目の筋肉とピント調節がすっきりほぐれました。',
        zh: '眼部拉伸完成！眼部肌肉与调焦能力已得到充分舒缓。',
        es: '¡Estiramiento ocular completado! Sus músculos oculares y enfoque están descansados.',
        fr: 'Étirement oculaire terminé ! Vos muscles oculaires et votre mise au point sont détendus.',
      };
      audioGuide.speak(donePhrases[language] || donePhrases.ko, undefined, undefined, language);

      try {
        confetti({
          particleCount: 75,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }

      const record = addSession({
        date: new Date().toISOString().split('T')[0],
        durationSeconds: durationSpent,
        type: 'eye_stretch',
        score: mode === 'course' ? 150 : 60,
        accuracy: 100,
      });

      if (onSessionComplete) {
        onSessionComplete(record);
      }
    },
    [language, mode, onSessionComplete]
  );

  useEffect(() => {
    if (!isActive || phaseState !== 'running') return;

    const timer = setInterval(() => {
      if (mode === 'course') {
        setCourseSecondsLeft((prev) => {
          if (prev <= 1) {
            handleFinishSession(totalCourseSeconds);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setSingleSecondsLeft((prev) => {
          if (prev <= 1) {
            handleFinishSession(singleDuration);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phaseState, mode, handleFinishSession, totalCourseSeconds, singleDuration]);

  const handleStart = () => {
    if (mode === 'course') {
      setCourseSecondsLeft(totalCourseSeconds);
    } else {
      setSingleSecondsLeft(singleDuration);
    }
    setPhaseState('running');
    setIsActive(true);
  };

  const handleSelectSingleExercise = (idx: number) => {
    setMode('single');
    setSelectedSingleIdx(idx);
    const dur = STRETCH_EXERCISES[idx]?.durationSec || 12;
    setSingleSecondsLeft(dur);
    setPhaseState('running');
    setIsActive(true);
  };

  const handleSwitchMode = (nextMode: StretchMode) => {
    audioGuide.stopSpeaking();
    setMode(nextMode);
    setIsActive(false);
    setPhaseState('ready');
    setCourseSecondsLeft(totalCourseSeconds);
    setSingleSecondsLeft(STRETCH_EXERCISES[selectedSingleIdx]?.durationSec || 12);
  };

  const handleSkipNextInCourse = () => {
    if (mode !== 'course') return;
    const { idx } = getCourseProgress(courseSecondsLeft);
    if (idx >= STRETCH_EXERCISES.length - 1) {
      handleFinishSession(totalCourseSeconds - courseSecondsLeft);
      return;
    }
    let remainingAfterNext = 0;
    for (let i = idx + 1; i < STRETCH_EXERCISES.length; i++) {
      remainingAfterNext += STRETCH_EXERCISES[i].durationSec;
    }
    setCourseSecondsLeft(remainingAfterNext);
  };

  const handleReset = () => {
    audioGuide.stopSpeaking();
    setIsActive(false);
    setPhaseState('ready');
    setCourseSecondsLeft(totalCourseSeconds);
    setSingleSecondsLeft(STRETCH_EXERCISES[selectedSingleIdx]?.durationSec || 12);
  };

  const courseProgress = getCourseProgress(courseSecondsLeft);
  const activeExerciseIdx = mode === 'course' ? courseProgress.idx : selectedSingleIdx;
  const activeExerciseSecondsLeft =
    mode === 'course' ? courseProgress.exSecsLeft : singleSecondsLeft;
  const displayRemainingSeconds = mode === 'course' ? courseSecondsLeft : singleSecondsLeft;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-bold text-teal-700">{t.stretching.badge}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{t.stretching.subBadge}</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 truncate">{t.stretching.title}</h2>
          </div>
        </div>

        <span className="font-mono tabular-nums text-lg sm:text-xl font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl shrink-0">
          {formatTime(displayRemainingSeconds)}
        </span>
      </div>

      {/* Mode Switcher: Full Course vs Single Focus */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => handleSwitchMode('course')}
          className={`flex-1 min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            mode === 'course'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.stretching.modeFullCourse}
        </button>
        <button
          type="button"
          onClick={() => handleSwitchMode('single')}
          className={`flex-1 min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            mode === 'single'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.stretching.modeSingleFocus}
        </button>
      </div>

      {/* Exercise Quick Selector Cards (Always reachable in single mode or ready state) */}
      {(phaseState === 'ready' || mode === 'single') && phaseState !== 'completed' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STRETCH_EXERCISES.map((ex, idx) => {
            const isChosen =
              mode === 'single' && selectedSingleIdx === idx && phaseState === 'running';
            const isSelectedReady = mode === 'single' && selectedSingleIdx === idx;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectSingleExercise(idx)}
                className={`min-h-[48px] px-2.5 py-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isChosen || isSelectedReady
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-teal-300'
                }`}
              >
                <span className="text-xs font-bold block truncate">
                  {ex.shortLabel[language] || ex.shortLabel.ko}
                </span>
                <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                  {ex.durationSec}s
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Ready Screen */}
      {phaseState === 'ready' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                {mode === 'course'
                  ? t.stretching.courseIntroTitle
                  : STRETCH_EXERCISES[selectedSingleIdx].title[language] ||
                    STRETCH_EXERCISES[selectedSingleIdx].title.ko}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {mode === 'course'
                ? t.stretching.desc
                : STRETCH_EXERCISES[selectedSingleIdx].instruction[language] ||
                  STRETCH_EXERCISES[selectedSingleIdx].instruction.ko}
            </p>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{t.stretching.startBtn}</span>
          </button>
        </div>
      )}

      {/* Active Guided Stretching View */}
      {phaseState === 'running' && (
        <div className="space-y-4">
          <GuidedEyeStretchStage
            exerciseIndex={activeExerciseIdx}
            exerciseSecondsLeft={activeExerciseSecondsLeft}
            isActive={isActive}
            language={language}
            announceOnExerciseChange
          />

          {/* Thumb-friendly Bottom Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsActive((prev) => !prev)}
              className="flex-1 min-h-[48px] px-4 py-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isActive ? t.stretching.pauseBtn : t.stretching.resumeBtn}</span>
            </button>

            {mode === 'course' && (
              <button
                type="button"
                onClick={handleSkipNextInCourse}
                className="min-h-[48px] px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <SkipForward className="w-4 h-4" />
                <span>{t.stretching.nextMoveBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              aria-label={t.stretching.resetBtn}
              title={t.stretching.resetBtn}
              className="min-h-[48px] min-w-[48px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Completed Screen */}
      {phaseState === 'completed' && (
        <div className="space-y-4 text-center py-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">{t.stretching.completeTitle}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {t.stretching.completeDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors text-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.stretching.retryBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
