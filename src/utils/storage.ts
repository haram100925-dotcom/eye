import {
  AppLanguage,
  StageConfig,
  TrainingSessionRecord,
  UserPreferences,
  VisionTestRecord,
  ReminderConfig,
} from '../types';

const SUPPORTED_LANGUAGES: AppLanguage[] = ['ko', 'en', 'ja', 'zh', 'es', 'fr'];

function mapLocaleToAppLanguage(locale: string): AppLanguage | null {
  const lower = locale.toLowerCase().trim();
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('en')) return 'en';
  return null;
}

/**
 * Automatically detects the user's region/store language from URL (?lang=),
 * device/browser preferred languages (reflects Google Play / iOS / OS locale),
 * and timezone fallback, defaulting globally to 'en' for non-matched regions.
 */
export function detectDefaultLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'ko';

  try {
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang')?.toLowerCase() as AppLanguage | undefined;
    if (paramLang && SUPPORTED_LANGUAGES.includes(paramLang)) {
      return paramLang;
    }
  } catch {
    // Ignore URL parse error
  }

  try {
    const locales: string[] = [];
    if (Array.isArray(navigator.languages)) {
      locales.push(...navigator.languages);
    }
    if (navigator.language) {
      locales.push(navigator.language);
    }
    for (const loc of locales) {
      const mapped = mapLocaleToAppLanguage(loc);
      if (mapped) return mapped;
    }
  } catch {
    // Ignore navigator locale error
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Seoul') return 'ko';
    if (tz === 'Asia/Tokyo') return 'ja';
    if (
      tz === 'Asia/Shanghai' ||
      tz === 'Asia/Taipei' ||
      tz === 'Asia/Hong_Kong' ||
      tz === 'Asia/Macau' ||
      tz === 'Asia/Chongqing'
    ) {
      return 'zh';
    }
    if (
      tz === 'Europe/Madrid' ||
      tz === 'America/Mexico_City' ||
      tz === 'America/Bogota' ||
      tz === 'America/Argentina/Buenos_Aires' ||
      tz === 'America/Lima' ||
      tz === 'America/Santiago'
    ) {
      return 'es';
    }
    if (
      tz === 'Europe/Paris' ||
      tz === 'Europe/Brussels' ||
      tz === 'Africa/Casablanca'
    ) {
      return 'fr';
    }
  } catch {
    // Ignore timezone error
  }

  return 'en';
}

export const STAGES_CONFIG: StageConfig[] = [
  {
    level: 1,
    title: '1단계: 기초 가로·세로·45° 대각선',
    subtitle: '시각 피질 워밍업',
    description: '수평(0°), 수직(90°)과 기본 대각선(45°) 가보르 패치 중 같은 방향을 찾아 짝을 맞추세요.',
    gridRows: 3,
    gridCols: 3,
    targetCount: 3,
    contrast: 0.95,
    frequency: 20,
    orientations: [0, 45, 90],
    timeLimit: 60,
    type: 'match_pair',
  },
  {
    level: 2,
    title: '2단계: 4방향 사선 인지',
    subtitle: '기본 각도 확장',
    description: '0°, 45°, 90°, 135°의 4방향 줄무늬 중에서 제시된 목표 패치와 동일한 패치를 모두 찾아보세요.',
    gridRows: 3,
    gridCols: 3,
    targetCount: 4,
    contrast: 0.9,
    frequency: 18,
    orientations: [0, 45, 90, 135],
    timeLimit: 55,
    type: 'find_target',
  },
  {
    level: 3,
    title: '3단계: 6방향 기울기 탐색',
    subtitle: '30°·150° 사선 추가',
    description: '넓어진 4x3 화면에서 30°·45°·135°·150° 등 다양한 기울기를 가진 가보르 패치 쌍을 찾아보세요.',
    gridRows: 3,
    gridCols: 4,
    targetCount: 4,
    contrast: 0.85,
    frequency: 16,
    orientations: [0, 30, 45, 90, 135, 150],
    timeLimit: 50,
    type: 'match_pair',
  },
  {
    level: 4,
    title: '4단계: 8방향 미세 기울기',
    subtitle: '밀도 및 각도 인지',
    description: '촘촘해진 줄무늬와 8가지 기울기(30°·45°·60°·120°·135°·150° 포함)를 정확히 구별하세요.',
    gridRows: 4,
    gridCols: 3,
    targetCount: 4,
    contrast: 0.8,
    frequency: 13,
    orientations: [0, 30, 45, 60, 90, 120, 135, 150],
    timeLimit: 50,
    type: 'match_pair',
  },
  {
    level: 5,
    title: '5단계: 매직아이 입체시 (초급)',
    subtitle: '모양체근 스트레칭',
    description: '화면의 두 점을 흐릿하게 보아 3개로 겹쳐지게 만든 후, 숨겨진 3D 입체 도형을 찾아보세요.',
    gridRows: 1,
    gridCols: 1,
    targetCount: 1,
    contrast: 0.9,
    frequency: 16,
    orientations: [0],
    timeLimit: 90,
    type: 'stereogram_depth',
  },
  {
    level: 6,
    title: '6단계: 사선 전용 미세 각도 분별',
    subtitle: '노안 초점 세밀화',
    description: '수평·수직 없이 다양한 기울기(15°, 30°, 60°, 75°, 120°, 150°)만 구별하며 미세 초점 조절력을 깨웁니다.',
    gridRows: 4,
    gridCols: 4,
    targetCount: 5,
    contrast: 0.75,
    frequency: 15,
    orientations: [15, 30, 60, 75, 120, 150],
    timeLimit: 50,
    type: 'match_pair',
  },
  {
    level: 7,
    title: '7단계: 저대비 8방향 기울기 감지',
    subtitle: '흐릿함 극복 훈련',
    description: '대비가 옅고 20°·70°·110°·160° 등 미세하게 기울어진 패치를 찾으며 시각 보정 능력을 강화합니다.',
    gridRows: 4,
    gridCols: 4,
    targetCount: 5,
    contrast: 0.55,
    frequency: 15,
    orientations: [0, 20, 45, 70, 90, 110, 135, 160],
    timeLimit: 45,
    type: 'match_pair',
  },
  {
    level: 8,
    title: '8단계: 매직아이 입체시 (중급)',
    subtitle: '양안 원근 조절력 강화',
    description: '더 깊은 원근 심도를 가진 3D 패턴 속에서 숨겨진 별/다이아몬드 형상을 인지해보세요.',
    gridRows: 1,
    gridCols: 1,
    targetCount: 1,
    contrast: 0.85,
    frequency: 14,
    orientations: [0],
    timeLimit: 90,
    type: 'stereogram_depth',
  },
  {
    level: 9,
    title: '9단계: 고밀도 20° 간격 정밀 기울기',
    subtitle: '주변시 및 각도 확장',
    description: '5x4 그리드 속에서 15°, 35°, 55°, 75°, 105°, 125°, 145°, 165°의 촘촘한 기울기를 포착하세요.',
    gridRows: 4,
    gridCols: 5,
    targetCount: 6,
    contrast: 0.65,
    frequency: 11,
    orientations: [15, 35, 55, 75, 105, 125, 145, 165],
    timeLimit: 45,
    type: 'match_pair',
  },
  {
    level: 10,
    title: '10단계: 마스터 12방향 정밀 트레이닝',
    subtitle: '15° 단위 전방위 마스터',
    description: '저대비(0.42) + 초미세 주파수 + 15° 간격 12방향 기울기로 시각 신경망의 최대 집중력을 이끌어냅니다.',
    gridRows: 4,
    gridCols: 5,
    targetCount: 7,
    contrast: 0.42,
    frequency: 10,
    orientations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165],
    timeLimit: 45,
    type: 'match_pair',
  },
];

const PREFS_KEY = 'eye_training_preferences';
const V2_BLACK_DEFAULT_KEY = 'eye_training_v2_black_default';
const SESSIONS_KEY = 'eye_training_sessions';
const VISION_KEY = 'eye_training_vision_tests';
const UNLOCKED_LEVEL_KEY = 'eye_training_unlocked_level';
const REMINDERS_KEY = 'eye_training_reminders';

export const defaultPreferences: UserPreferences = {
  targetGroup: 'presbyopia', // Default for middle-aged / senior users or customizable
  fontSize: 'large',
  language: detectDefaultLanguage(),
  warmFilter: true,
  highContrast: false,
  nightMode: true,
  voiceGuide: true,
  voicePersona: 'seohyun', // Default to Seohyun's voice
  voiceSpeed: 0.95, // Calm, clear tempo
  soundEffects: true,
  dailyGoalMinutes: 3,
};

export const defaultReminders: ReminderConfig = {
  enabled: true,
  rule202020: true,
  ruleIntervalMinutes: 30,
  scheduledReminders: ['09:00', '14:00', '21:00'],
  sound: true,
};

export function loadPreferences(): UserPreferences {
  const autoLang = detectDefaultLanguage();
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const hasMigratedBlack = localStorage.getItem(V2_BLACK_DEFAULT_KEY) === '1';

    if (raw) {
      const parsed = JSON.parse(raw);
      const merged: UserPreferences = {
        ...defaultPreferences,
        ...parsed,
        language: parsed.language || autoLang,
        voicePersona: parsed.voicePersona || 'seohyun',
        voiceSpeed: parsed.voiceSpeed || 0.95,
      };
      // One-time migration so default evening black mode takes effect cleanly on update
      if (!hasMigratedBlack) {
        merged.nightMode = true;
        localStorage.setItem(V2_BLACK_DEFAULT_KEY, '1');
        localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
      }
      return merged;
    }

    if (!hasMigratedBlack) {
      localStorage.setItem(V2_BLACK_DEFAULT_KEY, '1');
    }
  } catch (e) {
    console.error('Failed to load preferences', e);
  }
  return {
    ...defaultPreferences,
    language: autoLang,
    nightMode: true,
  };
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences', e);
  }
}

export function loadReminders(): ReminderConfig {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (raw) return { ...defaultReminders, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load reminders', e);
  }
  return defaultReminders;
}

export function saveReminders(reminders: ReminderConfig): void {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error('Failed to save reminders', e);
  }
}

export function getUnlockedLevel(): number {
  try {
    const raw = localStorage.getItem(UNLOCKED_LEVEL_KEY);
    if (raw) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 1) return val;
    }
  } catch (e) {
    console.error('Failed to load unlocked level', e);
  }
  return 1;
}

export function setUnlockedLevel(lvl: number): void {
  try {
    const current = getUnlockedLevel();
    if (lvl > current) {
      localStorage.setItem(UNLOCKED_LEVEL_KEY, String(lvl));
    }
  } catch (e) {
    console.error('Failed to set unlocked level', e);
  }
}

export function loadSessions(): TrainingSessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions', e);
  }
  // Initial seed with past 3 days so charts have immediate visual preview
  const today = new Date();
  const sampleSessions: TrainingSessionRecord[] = [
    {
      id: 'seed-1',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      timestamp: Date.now() - 86400000 * 2,
      durationSeconds: 180,
      type: '3min_routine',
      level: 1,
      score: 120,
      accuracy: 92,
      fatigueBefore: 7,
      fatigueAfter: 3,
    },
    {
      id: 'seed-2',
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      timestamp: Date.now() - 86400000 * 1,
      durationSeconds: 195,
      type: '3min_routine',
      level: 2,
      score: 145,
      accuracy: 95,
      fatigueBefore: 6,
      fatigueAfter: 2,
    },
  ];
  saveSessions(sampleSessions);
  return sampleSessions;
}

export function saveSessions(sessions: TrainingSessionRecord[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

export function addSession(session: Omit<TrainingSessionRecord, 'id' | 'timestamp'>): TrainingSessionRecord {
  const sessions = loadSessions();
  const newRecord: TrainingSessionRecord = {
    ...session,
    id: 'ses-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
  };
  sessions.unshift(newRecord);
  saveSessions(sessions);
  return newRecord;
}

export function loadVisionTests(): VisionTestRecord[] {
  try {
    const raw = localStorage.getItem(VISION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load vision tests', e);
  }
  // Default seed for initial trend visualization
  const samples: VisionTestRecord[] = [
    {
      id: 'vis-1',
      date: new Date(Date.now() - 86400000 * 14).toISOString().split('T')[0],
      leftEye: 0.5,
      rightEye: 0.6,
      bothEyes: 0.6,
      note: '훈련 시작 전 초기 측정',
    },
    {
      id: 'vis-2',
      date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
      leftEye: 0.6,
      rightEye: 0.7,
      bothEyes: 0.7,
      note: '1주일차 가보르 훈련 후',
    },
  ];
  saveVisionTests(samples);
  return samples;
}

export function saveVisionTests(tests: VisionTestRecord[]): void {
  try {
    localStorage.setItem(VISION_KEY, JSON.stringify(tests));
  } catch (e) {
    console.error('Failed to save vision tests', e);
  }
}

export function addVisionTest(test: Omit<VisionTestRecord, 'id'>): VisionTestRecord {
  const tests = loadVisionTests();
  const newRecord: VisionTestRecord = {
    ...test,
    id: 'vis-' + Date.now(),
  };
  tests.unshift(newRecord);
  saveVisionTests(tests);
  return newRecord;
}

/**
 * Calculates current streak in consecutive days
 */
export function calculateStreak(sessions: TrainingSessionRecord[]): number {
  if (!sessions.length) return 0;
  
  const dates = Array.from(new Set(sessions.map((s) => s.date))).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!dates.includes(today) && !dates.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  let checkDate = dates.includes(today) ? new Date() : new Date(Date.now() - 86400000);

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dates.includes(dateStr)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}
