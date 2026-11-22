export type TargetGroup = 'presbyopia' | 'youth' | 'general';
export type FontSize = 'normal' | 'large' | 'extra-large';
export type AppLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr';

export type VoicePersona = 'seohyun' | 'gentle' | 'bright';

export interface UserPreferences {
  targetGroup: TargetGroup;
  fontSize: FontSize;
  language: AppLanguage;
  warmFilter: boolean;
  highContrast: boolean;
  nightMode: boolean;
  voiceGuide: boolean;
  voicePersona: VoicePersona;
  voiceSpeed: number;
  soundEffects: boolean;
  dailyGoalMinutes: number;
}

export interface TrainingSessionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  durationSeconds: number;
  type: '3min_routine' | 'gabor_stage' | 'stereogram' | 'pattern_custom' | 'eye_stretch';
  level?: number;
  score?: number;
  accuracy?: number; // percentage
  fatigueBefore?: number; // 1 to 10
  fatigueAfter?: number;  // 1 to 10
}

export interface VisionTestRecord {
  id: string;
  date: string;
  leftEye: number;
  rightEye: number;
  bothEyes: number;
  note?: string;
}

export interface StageConfig {
  level: number;
  title: string;
  subtitle: string;
  description: string;
  gridRows: number;
  gridCols: number;
  targetCount: number; // number of pairs or matches needed
  contrast: number; // 0.1 to 1.0
  frequency: number; // wavelength lambda
  orientations: number[]; // degrees e.g. [0, 90] or [0, 45, 90, 135]
  timeLimit: number; // seconds
  type: 'match_pair' | 'find_target' | 'stereogram_depth';
}

export interface ReminderConfig {
  enabled: boolean;
  rule202020: boolean; // 20-20-20 rule active
  ruleIntervalMinutes: number; // e.g. 20 min or 60 min
  scheduledReminders: string[]; // e.g. ['09:00', '14:00', '20:30']
  sound: boolean;
}
