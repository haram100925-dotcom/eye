/**
 * Sound synthesis and Text-to-Speech audio guide for eye training
 * Supports specialized '서현씨' (Seohyun) coaching voice with natural pitch and rate tuning
 */

import { VoicePersona } from '../types';

class AudioGuideManager {
  private ctx: AudioContext | null = null;
  private voiceEnabled: boolean = true;
  private soundEnabled: boolean = true;
  private voicePersona: VoicePersona = 'seohyun';
  private voiceSpeed: number = 0.95;
  private currentLanguage: string = 'ko';
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoices();
      };
    }
  }

  private refreshVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setPreferences(
    sound: boolean,
    voice: boolean,
    persona: VoicePersona = 'seohyun',
    speed: number = 0.95,
    lang: string = 'ko'
  ) {
    this.soundEnabled = sound;
    this.voiceEnabled = voice;
    this.voicePersona = persona;
    this.voiceSpeed = speed;
    this.currentLanguage = lang;
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getVoicePersona(): VoicePersona {
    return this.voicePersona;
  }

  public getVoiceSpeed(): number {
    return this.voiceSpeed;
  }

  /**
   * Finds the best matching voice for the selected persona and language.
   */
  public getMatchedVoice(
    persona: VoicePersona = this.voicePersona,
    lang: string = 'ko'
  ): {
    voice: SpeechSynthesisVoice | null;
    isNativeSeohyun: boolean;
    voiceName: string;
  } {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { voice: null, isNativeSeohyun: false, voiceName: '음성 합성 미지원' };
    }

    const voices =
      this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();

    if (!voices || voices.length === 0) {
      return { voice: null, isNativeSeohyun: false, voiceName: '음성 로딩 중...' };
    }

    // Filter by requested language (ko, en, ja, zh, es, fr)
    const targetVoices = voices.filter((v) => {
      const vLang = v.lang.toLowerCase();
      if (lang === 'en') return vLang.startsWith('en');
      if (lang === 'ja') return vLang.startsWith('ja');
      if (lang === 'zh') return vLang.startsWith('zh');
      if (lang === 'es') return vLang.startsWith('es');
      if (lang === 'fr') return vLang.startsWith('fr');
      return vLang.includes('ko') || vLang.includes('kor');
    });

    if (targetVoices.length === 0) {
      return { voice: voices[0] || null, isNativeSeohyun: false, voiceName: '기본 시스템 음성' };
    }

    if (lang === 'ko') {
      const seohyunVoice = targetVoices.find((v) => {
        const name = v.name.toLowerCase();
        return name.includes('seohyun') || name.includes('서현');
      });

      if (persona === 'seohyun') {
        if (seohyunVoice) {
          return { voice: seohyunVoice, isNativeSeohyun: true, voiceName: seohyunVoice.name };
        }
        const preferredFemale = targetVoices.find((v) => {
          const name = v.name.toLowerCase();
          return (
            name.includes('sunhi') ||
            name.includes('sun-hi') ||
            name.includes('선희') ||
            name.includes('yuna') ||
            name.includes('유나') ||
            name.includes('sora') ||
            name.includes('female')
          );
        });
        const chosen = preferredFemale || targetVoices[0];
        return {
          voice: chosen,
          isNativeSeohyun: false,
          voiceName: `${chosen.name} (서현 보이스 튜닝 적용)`,
        };
      }
    }

    return {
      voice: targetVoices[0],
      isNativeSeohyun: false,
      voiceName: targetVoices[0].name,
    };
  }

  /**
   * Plays a crisp, gentle chime for a correct match
   */
  public playSuccessChime() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Plays a soft error sound when wrong patch selected
   */
  public playErrorChime() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  /**
   * Plays a celebratory fanfare when completing daily 3-minute or stage
   */
  public playCelebrationFanfare() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = startTime + idx * 0.11;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.32);
    });
  }

  /**
   * Plays gentle timer tick
   */
  public playTick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Speaks audio guidance using Web Speech API with language support
   */
  public speak(text: string, customPitch?: number, customRate?: number, lang?: string) {
    if (!this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const targetLang = lang || this.currentLanguage || 'ko';

    try {
      window.speechSynthesis.cancel(); // cancel previous utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      const langMap: Record<string, string> = {
        ko: 'ko-KR',
        en: 'en-US',
        ja: 'ja-JP',
        zh: 'zh-CN',
        es: 'es-ES',
        fr: 'fr-FR',
      };
      utterance.lang = langMap[targetLang] || 'ko-KR';

      const matched = this.getMatchedVoice(this.voicePersona, targetLang);
      if (matched.voice) {
        utterance.voice = matched.voice;
      }

      // Persona voice calibration
      if (this.voicePersona === 'seohyun' || targetLang !== 'ko') {
        utterance.rate = customRate !== undefined ? customRate : this.voiceSpeed;
        utterance.pitch =
          customPitch !== undefined ? customPitch : matched.isNativeSeohyun ? 1.0 : 1.05;
      } else if (this.voicePersona === 'bright') {
        utterance.rate = customRate !== undefined ? customRate : Math.min(1.15, this.voiceSpeed * 1.1);
        utterance.pitch = customPitch !== undefined ? customPitch : 1.16;
      } else {
        // gentle
        utterance.rate = customRate !== undefined ? customRate : Math.max(0.85, this.voiceSpeed * 0.92);
        utterance.pitch = customPitch !== undefined ? customPitch : 0.98;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback if speech synthesis is disabled or errors
    }
  }

  /**
   * Voice preview for voice coach in current language
   */
  public previewSeohyunVoice(lang?: string) {
    const targetLang = lang || this.currentLanguage || 'ko';
    const previewPhrases: Record<string, string> = {
      ko: '안녕하세요! 여러분의 눈 건강 파트너 서현입니다. 매일 3분씩 저와 함께 맑고 건강한 눈을 만들어보세요.',
      en: 'Hello! I am your vision health coach. Spend 3 minutes a day with me to restore clear and healthy sight.',
      ja: 'こんにちは！あなたの目の健康パートナーです。毎日3分間、一緒に視力回復を始めましょう。',
      zh: '您好！我是您的视力健康教练。每天坚持3分钟，让我们一起守护清晰明亮的视界。',
      es: '¡Hola! Soy su entrenadora de salud visual. Dedique 3 minutos al día conmigo para una visión más clara.',
      fr: 'Bonjour ! Je suis votre coach en santé visuelle. Passez 3 minutes par jour avec moi pour retrouver une vue nette.',
    };
    this.speak(previewPhrases[targetLang] || previewPhrases.ko, undefined, undefined, targetLang);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioGuide = new AudioGuideManager();
