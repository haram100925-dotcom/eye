import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Volume2,
  X,
  Check,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { loadReminders, saveReminders } from '../utils/storage';
import { audioGuide } from '../utils/audioGuide';
import { ReminderConfig, AppLanguage } from '../types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
}

const REMINDER_VOICE: Record<
  AppLanguage,
  {
    notifTitle: string;
    notifBody: string;
    fallbackSpeak: string;
    savedSpeak: string;
    restSpeak: string;
    doneSpeak: string;
  }
> = {
  ko: {
    notifTitle: '눈 건강 20-20-20 알림',
    notifBody: '모니터를 20분 보셨다면 지금 20초간 먼 곳을 바라보며 모양체근을 쉬게 해주세요!',
    fallbackSpeak: '눈 운동 시간입니다! 20초간 먼 곳을 바라보세요.',
    savedSpeak: '알림 설정이 저장되었습니다. 눈 운동 시간을 알려드릴게요!',
    restSpeak: '20분 작업 완료! 이제 20초간 6미터 먼 곳을 바라보며 눈을 쉬어주세요.',
    doneSpeak: '휴식 완료! 눈 피로가 풀렸습니다.',
  },
  en: {
    notifTitle: '20-20-20 Eye Care Reminder',
    notifBody: 'Look at something 20 feet away for 20 seconds to relax your eye muscles!',
    fallbackSpeak: 'Time for an eye break! Look far away for 20 seconds.',
    savedSpeak: 'Reminder saved. We will notify you when it is time to rest your eyes.',
    restSpeak: '20 minutes complete! Look 6 meters away for 20 seconds to rest your eyes.',
    doneSpeak: 'Rest complete! Your eyes feel refreshed.',
  },
  ja: {
    notifTitle: '目の健康 20-20-20 お知らせ',
    notifBody: '20分間画面を見たら、20秒間遠くを見て毛様体筋を休ませましょう！',
    fallbackSpeak: '目の体操の時間です！20秒間遠くを見てください。',
    savedSpeak: 'リマインダーが保存されました。',
    restSpeak: '20分経過しました！6メートル先の遠くを20秒間眺めて目を休めてください。',
    doneSpeak: '休憩完了です！目の疲れが和らぎました。',
  },
  zh: {
    notifTitle: '护眼 20-20-20 休息提醒',
    notifBody: '用眼20分钟后，请向6米外远眺20秒放松睫状肌！',
    fallbackSpeak: '护眼时间到了！请远眺20秒。',
    savedSpeak: '提醒设置已保存，到点会提醒您放松双眼。',
    restSpeak: '20分钟已到！请向6米外远眺20秒放松眼睛。',
    doneSpeak: '休息完成！眼部疲劳已得到舒缓。',
  },
  es: {
    notifTitle: 'Recordatorio Visual 20-20-20',
    notifBody: 'Mire a un punto a 6 metros de distancia durante 20 segundos para relajar la vista.',
    fallbackSpeak: '¡Hora de descansar la vista! Mire a lo lejos durante 20 segundos.',
    savedSpeak: 'Recordatorio guardado. Le avisaremos cuando sea hora de descansar.',
    restSpeak: '¡20 minutos completados! Mire a 6 metros de distancia durante 20 segundos.',
    doneSpeak: '¡Descanso completado! Sus ojos están más relajados.',
  },
  fr: {
    notifTitle: 'Rappel Santé Visuelle 20-20-20',
    notifBody: 'Regardez à 6 mètres de distance pendant 20 secondes pour détendre vos yeux.',
    fallbackSpeak: 'C’est l’heure de reposer vos yeux ! Regardez au loin pendant 20 secondes.',
    savedSpeak: 'Rappel enregistré. Nous vous avertirons à l’heure prévue.',
    restSpeak: '20 minutes écoulées ! Regardez à 6 mètres pendant 20 secondes.',
    doneSpeak: 'Pause terminée ! Vos yeux sont reposés.',
  },
};

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  language = 'ko',
}) => {
  const [config, setConfig] = useState<ReminderConfig>(loadReminders());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState<boolean>(false);
  const voiceText = REMINDER_VOICE[language] || REMINDER_VOICE.ko;

  // 20-20-20 Live Mini Timer
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isRestingPhase, setIsRestingPhase] = useState<boolean>(false); // 20s rest
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(20);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setNotifPermission(res);
      if (res === 'granted') {
        sendTestNotification();
      }
    }
  };

  const sendTestNotification = async () => {
    const title = voiceText.notifTitle;
    const body = voiceText.notifBody;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        // Android Chrome requires ServiceWorkerRegistration.showNotification
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: './pwa-192x192.png',
              badge: './pwa-192x192.png',
              tag: 'eye-training-reminder',
            });
            audioGuide.playSuccessChime();
            setTestSent(true);
            setTimeout(() => setTestSent(false), 3000);
            return;
          }
        }

        // Desktop standard notification
        new Notification(title, {
          body,
          icon: './pwa-192x192.png',
        });
        audioGuide.playSuccessChime();
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } catch (e) {
        console.warn('Native notification fallback', e);
        audioGuide.playSuccessChime();
        audioGuide.speak(voiceText.fallbackSpeak, undefined, undefined, language);
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    } else {
      audioGuide.playSuccessChime();
      audioGuide.speak(voiceText.savedSpeak, undefined, undefined, language);
    }
  };

  const handleToggleInterval = (minutes: number) => {
    const updated: ReminderConfig = { ...config, ruleIntervalMinutes: minutes };
    setConfig(updated);
    saveReminders(updated);
  };

  const handleToggleSchedule = (timeStr: string) => {
    const exists = config.scheduledReminders.includes(timeStr);
    const updatedList = exists
      ? config.scheduledReminders.filter((t) => t !== timeStr)
      : [...config.scheduledReminders, timeStr].sort();
    const updated: ReminderConfig = { ...config, scheduledReminders: updatedList };
    setConfig(updated);
    saveReminders(updated);
  };

  // 20-20-20 Rule Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (!isRestingPhase) {
          setTimerSecondsLeft((prev) => {
            if (prev <= 1) {
              // Trigger rest phase
              setIsRestingPhase(true);
              setRestSecondsLeft(20);
              sendTestNotification();
              audioGuide.speak(voiceText.restSpeak, undefined, undefined, language);
              return 20 * 60;
            }
            return prev - 1;
          });
        } else {
          setRestSecondsLeft((prev) => {
            if (prev <= 1) {
              setIsRestingPhase(false);
              audioGuide.playSuccessChime();
              audioGuide.speak(voiceText.doneSpeak, undefined, undefined, language);
              return 20;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isRestingPhase, language, voiceText]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">눈 운동 주기 알림 설정</h3>
              <p className="text-xs text-slate-500">노안 및 청소년 스마트폰 근시 예방 알림</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Web Notification Permission Prompt */}
        <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-teal-900">기기 푸시 알림 허용</h4>
            <p className="text-[11px] text-teal-700 leading-tight">
              {notifPermission === 'granted'
                ? '브라우저 알림이 켜져 있습니다.'
                : '스마트폰과 PC에서 제때 알림을 받으려면 허용이 필요합니다.'}
            </p>
          </div>
          {notifPermission === 'granted' ? (
            <button
              onClick={sendTestNotification}
              className="text-xs font-semibold text-teal-800 bg-white hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-colors shrink-0"
            >
              {testSent ? '발송 완료!' : '테스트 발송'}
            </button>
          ) : (
            <button
              onClick={handleRequestPermission}
              className="text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-xs"
            >
              알림 켜기
            </button>
          )}
        </div>

        {/* 20-20-20 Rule Live Break Timer */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                20-20-20 눈 휴식 실시간 타이머
              </h4>
              <p className="text-[11px] text-slate-500">
                20분 작업 후 20초간 6m 먼 곳을 바라보는 안과학 표준 규칙
              </p>
            </div>
            <span
              className={`font-mono text-base font-extrabold px-3 py-1 rounded-xl ${
                isRestingPhase
                  ? 'bg-amber-100 text-amber-900 animate-pulse'
                  : 'bg-white text-teal-800 border border-slate-200'
              }`}
            >
              {isRestingPhase ? `휴식: ${restSecondsLeft}초` : formatTimer(timerSecondsLeft)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="flex-1 h-10 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTimerRunning ? '일시 정지' : '20-20-20 타이머 시작'}</span>
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setIsRestingPhase(false);
                setTimerSecondsLeft(20 * 60);
              }}
              className="h-10 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Periodic Interval Setting */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900">알림 주기 선택</h4>
          <div className="grid grid-cols-3 gap-2">
            {[20, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handleToggleInterval(mins)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  config.ruleIntervalMinutes === mins
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {mins}분마다
              </button>
            ))}
          </div>
        </div>

        {/* Daily Schedule Preset Times */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900">하루 권장 훈련 시간대</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { time: '09:00', label: '아침 기상 후' },
              { time: '14:00', label: '오후 눈 피로' },
              { time: '21:00', label: '취침 전 힐링' },
            ].map(({ time, label }) => {
              const active = config.scheduledReminders.includes(time);
              return (
                <button
                  key={time}
                  onClick={() => handleToggleSchedule(time)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-mono font-bold">{time}</p>
                  <span className="text-[10px] text-slate-500">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          설정 저장 및 닫기
        </button>
      </div>
    </div>
  );
};
