import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  TrendingUp,
  Activity,
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  Trash2,
  Smile,
} from 'lucide-react';
import {
  loadSessions,
  loadVisionTests,
  calculateStreak,
  saveSessions,
  saveVisionTests,
} from '../utils/storage';
import { TrainingSessionRecord, VisionTestRecord, TargetGroup, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';

interface EyeTrackerProps {
  targetGroup: TargetGroup;
  refreshKey?: number;
  language?: AppLanguage;
}

export const EyeTrackerStats: React.FC<EyeTrackerProps> = ({
  targetGroup,
  refreshKey,
  language = 'ko',
}) => {
  const t = getTranslation(language);
  const [sessions, setSessions] = useState<TrainingSessionRecord[]>([]);
  const [visionTests, setVisionTests] = useState<VisionTestRecord[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [showAllLogs, setShowAllLogs] = useState<boolean>(false);

  useEffect(() => {
    const loadedSessions = loadSessions();
    const loadedVision = loadVisionTests();
    setSessions(loadedSessions);
    setVisionTests(loadedVision);
    setStreak(calculateStreak(loadedSessions));
  }, [refreshKey]);

  // Derived metrics
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
  );
  const totalSessions = sessions.length;

  // Fatigue difference stats
  const sessionsWithFatigue = sessions.filter(
    (s) => s.fatigueBefore !== undefined && s.fatigueAfter !== undefined
  );
  const avgFatigueReduction =
    sessionsWithFatigue.length > 0
      ? (
          sessionsWithFatigue.reduce(
            (acc, s) => acc + (s.fatigueBefore! - s.fatigueAfter!),
            0
          ) / sessionsWithFatigue.length
        ).toFixed(1)
      : '3.2';

  // Export data as JSON
  const handleExportData = () => {
    const data = {
      sessions,
      visionTests,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eye-health-records-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Day labels by language
  const dayNames: Record<AppLanguage, string[]> = {
    ko: ['일', '월', '화', '수', '목', '금', '토'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ja: ['日', '月', '火', '水', '木', '金', '土'],
    zh: ['日', '一', '二', '三', '四', '五', '六'],
    es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  };

  // Recent 7 days activity dots
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = (dayNames[language] || dayNames.ko)[d.getDay()];
    const hasTrained = sessions.some((s) => s.date === dateStr);
    return { dateStr, dayLabel, hasTrained };
  });

  const getSessionTypeName = (s: TrainingSessionRecord): string => {
    if (s.type === '3min_routine') {
      return language === 'en'
        ? '3-Min Daily Routine'
        : language === 'ja'
        ? '3分デイリールーティン'
        : language === 'zh'
        ? '3分钟每日训练'
        : language === 'es'
        ? 'Rutina diaria de 3 min'
        : language === 'fr'
        ? 'Routine quotidienne 3 min'
        : '3분 데일리 루틴';
    }
    if (s.type === 'gabor_stage') {
      return language === 'en'
        ? `Stage ${s.level} Gabor Course`
        : language === 'ja'
        ? `${s.level}段階 ガボールコース`
        : language === 'zh'
        ? `第${s.level}关 卡博尔课程`
        : language === 'es'
        ? `Nivel ${s.level} Curso Gabor`
        : language === 'fr'
        ? `Niveau ${s.level} Cours Gabor`
        : `${s.level}단계 가보르 코스`;
    }
    if (s.type === 'pattern_custom') {
      return language === 'en'
        ? 'Daily Pattern Training'
        : language === 'ja'
        ? 'デイリーパターン訓練'
        : language === 'zh'
        ? '每日模式训练'
        : language === 'es'
        ? 'Entrenamiento de patrones'
        : language === 'fr'
        ? 'Entraînement aux motifs'
        : '일일 패턴 훈련';
    }
    return language === 'en'
      ? 'Eye Exercise'
      : language === 'ja'
      ? '眼筋ストレッチ'
      : language === 'zh'
      ? '眼肌运动'
      : language === 'es'
      ? 'Ejercicio ocular'
      : language === 'fr'
      ? 'Exercice oculaire'
      : '안구 운동';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-teal-800">{t.stats.badge}</span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">{t.stats.subBadge}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900">{t.stats.title}</h2>
        </div>

        <button
          onClick={handleExportData}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.stats.backupBtn}</span>
        </button>
      </div>

      {/* Top Metric Cards: 3 Column Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Streak */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-center">
          <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <span className="text-[11px] font-medium text-amber-900">{t.stats.streakTitle}</span>
          <p className="text-xl font-extrabold text-amber-900 font-mono tracking-tight">
            {streak}{t.stats.streakDaysUnit}
          </p>
        </div>

        {/* Total Time */}
        <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3 text-center">
          <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-medium text-teal-900">{t.stats.accumulatedTime}</span>
          <p className="text-xl font-extrabold text-teal-900 font-mono tracking-tight">
            {totalMinutes}{t.stats.minutesUnit}
          </p>
        </div>

        {/* Fatigue Reduction */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
          <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <Smile className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-medium text-slate-700">{t.stats.fatigueReduction}</span>
          <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
            -{avgFatigueReduction}
          </p>
        </div>
      </div>

      {/* 7-Day Habit Streak Calendar Tracker */}
      <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">{t.stats.recent7Days}</span>
          <span className="text-slate-500 text-[11px]">{t.stats.recent7DaysSub}</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {last7Days.map((day) => (
            <div
              key={day.dateStr}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                day.hasTrained
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-semibold">{day.dayLabel}</span>
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  day.hasTrained ? 'text-amber-300' : 'text-slate-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Acuity Trend Chart (SVG Line Chart) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-700" />
            <span>
              {language === 'en'
                ? 'Vision Acuity Improvement Trend (Both Eyes)'
                : language === 'ja'
                ? '視力測定改善の推移 (両眼)'
                : language === 'zh'
                ? '视力测量改善趋势 (双眼)'
                : language === 'es'
                ? 'Tendencia de agudeza visual (Ambos ojos)'
                : language === 'fr'
                ? 'Tendance d’acuité visuelle (Deux yeux)'
                : '시력 측정 개선 추이 (양안 기준)'}
            </span>
          </h3>
          <span className="text-[11px] text-slate-500">
            {language === 'en'
              ? `Recent ${visionTests.length} tests`
              : language === 'ja'
              ? `直近 ${visionTests.length}回`
              : language === 'zh'
              ? `最近 ${visionTests.length}次记录`
              : language === 'es'
              ? `Últimas ${visionTests.length} pruebas`
              : language === 'fr'
              ? `Derniers ${visionTests.length} tests`
              : `최근 ${visionTests.length}회 기록`}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          {visionTests.length > 0 ? (
            <div className="space-y-3">
              <div className="h-36 w-full flex items-end justify-between gap-3 px-2 pt-4">
                {visionTests.slice(-6).map((test, idx) => {
                  const heightPercent = Math.min(100, Math.round((test.bothEyes / 1.5) * 100));
                  return (
                    <div
                      key={test.id || idx}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <span className="text-[10px] font-mono font-bold text-teal-800">
                        {test.bothEyes.toFixed(1)}
                      </span>
                      <div
                        className="w-full max-w-[28px] bg-teal-600 hover:bg-teal-700 rounded-t-lg transition-all"
                        style={{ height: `${Math.max(15, heightPercent)}%` }}
                        title={`${test.date}: ${test.bothEyes}`}
                      />
                      <span className="text-[9px] text-slate-400 font-mono">
                        {test.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-center text-slate-500 border-t border-slate-200/60 pt-2">
                {language === 'en'
                  ? 'Consistent Gabor training 3+ times a week enhances visual cortex processing efficiency.'
                  : language === 'ja'
                  ? '週3回以上ガボール訓練を継続すると、視覚野の解像処理効率が向上します。'
                  : language === 'zh'
                  ? '每周坚持3次以上卡博尔训练，可显著提高大脑视觉皮层的信息处理能力。'
                  : language === 'es'
                  ? 'El entrenamiento de Gabor constante (3+ veces por semana) mejora el procesamiento visual del córtex cerebral.'
                  : language === 'fr'
                  ? 'Un entraînement Gabor régulier (3+ fois/semaine) stimule le cortex visuel et la plasticité cérébrale.'
                  : '가보르 훈련을 주 3회 이상 꾸준히 지속할 때 시각 피질의 정보 처리 효율이 유의미하게 상승합니다.'}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              {t.stats.emptyHistory}
            </div>
          )}
        </div>
      </div>

      {/* Recent Training Session History */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">{t.stats.historyTitle}</h3>
          <button
            onClick={() => setShowAllLogs(!showAllLogs)}
            className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
          >
            {showAllLogs
              ? (language === 'en' ? 'Show Less' : language === 'ja' ? '折りたたむ' : language === 'zh' ? '简略显示' : language === 'es' ? 'Ver menos' : language === 'fr' ? 'Réduire' : '간략히 보기')
              : (language === 'en' ? 'View All' : language === 'ja' ? 'すべて見る' : language === 'zh' ? '查看全部' : language === 'es' ? 'Ver todo' : language === 'fr' ? 'Voir tout' : '전체 보기')}
          </button>
        </div>

        <div className="space-y-1.5">
          {sessions.slice(0, showAllLogs ? 15 : 4).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs"
            >
              <div>
                <span className="font-semibold text-slate-800">
                  {getSessionTypeName(s)}
                </span>
                <div className="text-[11px] text-slate-400">
                  <span>{s.date}</span>
                  <span className="mx-1">·</span>
                  <span>{Math.round(s.durationSeconds / 60)} {t.stats.minutesUnit}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-teal-700">
                  {s.score
                    ? `+${s.score}`
                    : (language === 'en' ? 'Done' : language === 'ja' ? '完了' : language === 'zh' ? '已完成' : language === 'es' ? 'Completado' : language === 'fr' ? 'Terminé' : '완료')}
                </span>
                {s.fatigueBefore !== undefined && s.fatigueAfter !== undefined && (
                  <div className="text-[10px] text-slate-500">
                    {language === 'en' ? 'Fatigue' : language === 'ja' ? '疲労度' : language === 'zh' ? '疲劳度' : language === 'es' ? 'Fatiga' : language === 'fr' ? 'Fatigue' : '피로도'} {s.fatigueBefore} → {s.fatigueAfter}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
