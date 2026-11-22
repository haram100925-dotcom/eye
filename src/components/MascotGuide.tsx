import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, BookOpen, X, ChevronRight, Focus } from 'lucide-react';
import { audioGuide } from '../utils/audioGuide';
import { TargetGroup, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';

interface MascotGuideProps {
  mood?: 'greeting' | 'cheering' | 'coaching' | 'resting';
  customMessage?: string;
  targetGroup: TargetGroup;
  voiceEnabled: boolean;
  onToggleVoice?: () => void;
  showFullBanner?: boolean;
  language?: AppLanguage;
}

const mascotGuideImg = '/src/assets/images/eye_mascot_guide_1790721056776.jpg';
const mascotCelebrateImg = '/src/assets/images/eye_mascot_celebrate_1790721070157.jpg';

export const MascotGuide: React.FC<MascotGuideProps> = ({
  mood = 'coaching',
  customMessage,
  targetGroup,
  voiceEnabled,
  onToggleVoice,
  showFullBanner = false,
  language = 'ko',
}) => {
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const t = getTranslation(language);

  const defaultMessages: Record<AppLanguage, Record<string, Record<TargetGroup, string>>> = {
    ko: {
      greeting: {
        presbyopia: '반가워요! 저는 눈 건강 코치 서현이에요. 하루 3분 가보르 패치로 침침했던 눈과 노안 모양체근을 시원하게 깨워드릴게요!',
        youth: '안녕! 서현 코치와 함께 스마트폰으로 피로해진 눈을 회복해 볼까? 3분만 가보르 훈련을 따라오면 눈 피로가 싹 풀릴 거야!',
        general: '안녕하세요! 서현 코치와 함께하는 하루 3분 시력 회복 트레이닝을 시작해 볼까요? 뇌의 시각 피질을 자극해 선명함을 되찾아 드려요.',
      },
      coaching: {
        presbyopia: '서현 코치의 조언: 줄무늬의 기울기 각도에 집중해 보세요. 뇌 시각 피질의 정보 처리 능력과 모양체근 초점 조절력이 한층 더 강화됩니다.',
        youth: '서현 코치의 조언: 화면에서 30cm 거리를 두고, 같은 방향으로 기울어진 패치를 빠르게 찾아봐!',
        general: '서현 코치의 조언: 같은 기울기 각도의 패치를 찾아보세요. 시각 세포가 활성화되어 초점 조절력이 점진적으로 개선됩니다.',
      },
      cheering: {
        presbyopia: '대단하세요! 오늘 훈련으로 시각 피질 신경망이 한층 더 튼튼해졌어요. 저 서현이와 함께 꾸준히 하시면 글씨가 훨씬 또렷해져요!',
        youth: '멋진 집중력이었어! 안구 근육이 스트레칭되어 스마트폰 피로도가 확 줄어들었을 거야. 내일도 서현 코치와 또 만나자!',
        general: '오늘의 훈련 목표를 멋지게 달성하셨습니다! 눈이 한결 가볍고 시원해진 느낌이 드실 거예요.',
      },
      resting: {
        presbyopia: '서현 코치와 함께 쉬어가요: 잠시 두 손을 비벼 따뜻해진 손바닥을 양 눈 위에 덮어주세요. 모양체근의 긴장이 자연스럽게 풀립니다.',
        youth: '서현 코치와 함께 쉬어가요: 창밖 6미터 이상 먼 풍경을 20초간 멍하니 바라보며 안구 모양체근을 쉬게 해주세요.',
        general: '서현 코치와 함께 쉬어가요: 눈을 가볍게 10번 깜빡이고 천천히 심호흡을 해보세요. 눈물의 순환이 원활해집니다.',
      },
    },
    en: {
      greeting: {
        presbyopia: 'Welcome! I am your vision health coach. Spend 3 minutes with Gabor patches to awaken tired eyes and ciliary focusing muscles!',
        youth: 'Hey! Ready to relieve screen fatigue? Follow this 3-minute Gabor training to refresh your eyesight!',
        general: 'Hello! Welcome to your daily 3-minute vision recovery workout. Stimulate visual cortex pathways for crisp clarity.',
      },
      coaching: {
        presbyopia: "Coach's Tip: Focus on stripe angles. This trains your brain's visual cortex and restores ciliary muscle flexibility.",
        youth: "Coach's Tip: Keep 30cm distance from the screen and quickly spot matching oriented patches!",
        general: "Coach's Tip: Match identical angle orientations to progressively sharpen visual perception.",
      },
      cheering: {
        presbyopia: 'Outstanding! Your visual cortex pathways are now strengthened. Keep practicing daily for noticeable reading clarity!',
        youth: 'Great concentration! Eye muscle strain has been relieved. See you tomorrow for another session!',
        general: 'Goal achieved! Your eyes should feel refreshed and noticeably lighter now.',
      },
      resting: {
        presbyopia: 'Rest with Coach: Rub your palms together until warm and gently cup them over your closed eyes to release muscle tension.',
        youth: 'Rest with Coach: Gaze at an object 6 meters (20 feet) away for 20 seconds to relax your focusing muscles.',
        general: 'Rest with Coach: Blink gently 10 times and take a deep breath to replenish the tear film.',
      },
    },
    ja: {
      greeting: {
        presbyopia: 'ようこそ！目の健康コーチです。1日3分のガボールパッチで、かすみ目や老眼のピント筋を心地よく刺激しましょう！',
        youth: 'こんにちは！スマホで疲れた目を3分間のガボール訓練でスッキリ回復させましょう！',
        general: 'こんにちは！1日3分の視力回復トレーニングを始めましょう。脳の視覚野を刺激してくっきり視界を取り戻します。',
      },
      coaching: {
        presbyopia: 'コーチのアドバイス: 縞模様の傾きに集中してください。脳の視覚処理能力と毛様体筋のピント調整力が鍛えられます。',
        youth: 'コーチのアドバイス: 画面から30cm離れて、同じ向きのパッチを素早く探しましょう！',
        general: 'コーチのアドバイス: 同じ傾きのパッチを探すことで、視覚細胞が活性化されピントが合います。',
      },
      cheering: {
        presbyopia: '素晴らしいです！視覚野の神経回路が鍛えられました。毎日続けることで文字がより鮮明に見えるようになります！',
        youth: '集中力バッチリでした！目の緊張がほぐれました。明日も一緒に頑張りましょう！',
        general: '目標達成おめでとうございます！目がスッキリ軽くなったのを感じてください。',
      },
      resting: {
        presbyopia: '休憩タイム: 手のひらをこすり合わせて温め、閉じた目の上に優しく当てて毛様体筋の緊張をほぐしましょう。',
        youth: '休憩タイム: 6メートル以上遠くの景色を20秒間ぼんやり眺めて、目のピント筋を休ませましょう。',
        general: '休憩タイム: 軽く10回まばたきをして深呼吸し、目の潤いを保ちましょう。',
      },
    },
    zh: {
      greeting: {
        presbyopia: '您好！我是您的视力健康教练。每天3分钟伽博斑块训练，唤醒疲劳眼部睫状肌，改善老花眼困扰！',
        youth: '你好！用3分钟伽博视力训练缓解手机屏幕眼疲劳，让视线重新清澈明亮！',
        general: '您好！欢迎开启每日3分钟视力康复训练，激发大脑视觉皮质潜能。',
      },
      coaching: {
        presbyopia: '教练提示：集中观察条纹倾斜角度。大脑视皮质的信息补偿能力和睫状肌调节力将得到显著提升。',
        youth: '教练提示：与屏幕保持30厘米距离，迅速找到相同朝向的斑块！',
        general: '教练提示：寻找相同倾斜方向的斑块，激活视觉细胞，逐步提升聚焦清晰度。',
      },
      cheering: {
        presbyopia: '太棒了！今日训练已深度激活视觉神经网络。坚持每天练习，小字会越来越清晰！',
        youth: '专注力极佳！眼周肌肉已充分放松，眼疲劳大幅缓解。明天继续加油！',
        general: '恭喜达成今日目标！您的双眼现在应该感觉轻盈舒适。',
      },
      resting: {
        presbyopia: '休息时间：双手手掌快速摩擦至发热，轻轻敷在双眼上，放松眼周睫状肌。',
        youth: '休息时间：眺望6米（20英尺）外的远景20秒，给眼部调节肌放个假。',
        general: '休息时间：轻柔眨眼10次并深呼吸，滋润角膜表面。',
      },
    },
    es: {
      greeting: {
        presbyopia: '¡Bienvenido! Soy su entrenadora de salud visual. ¡Dedique 3 minutos con los parches de Gabor para despertar los ojos cansados y el músculo ciliar!',
        youth: '¡Hola! ¿Listo para aliviar la fatiga de las pantallas? ¡Sigue este entrenamiento Gabor de 3 minutos para refrescar tu vista!',
        general: '¡Hola! Bienvenido a su sesión diaria de 3 minutos de recuperación visual. Estimule la corteza visual para una mayor nitidez.',
      },
      coaching: {
        presbyopia: 'Consejo: Concéntrese en el ángulo de las rayas. Esto entrena la corteza visual cerebral y restablece la flexibilidad del músculo ciliar.',
        youth: 'Consejo: Mantén 30 cm de distancia de la pantalla y localiza rápidamente los parches con la misma orientación.',
        general: 'Consejo: Encuentre parches con ángulos idénticos para agudizar progresivamente la percepción visual.',
      },
      cheering: {
        presbyopia: '¡Excelente! Las vías de su corteza visual se han fortalecido. ¡Practique a diario para notar una lectura más nítida!',
        youth: '¡Gran concentración! La tensión ocular se ha aliviado. ¡Nos vemos mañana para otra sesión!',
        general: '¡Objetivo cumplido! Sus ojos deberían sentirse frescos y notablemente más descansados.',
      },
      resting: {
        presbyopia: 'Descanso: Frote las palmas de las manos hasta calentarlas y colóquelas suavemente sobre los ojos cerrados para relajar la tensión muscular.',
        youth: 'Descanso: Mira a un objeto a 6 metros (20 pies) de distancia durante 20 segundos para relajar los músculos de enfoque.',
        general: 'Descanso: Parpadee suavemente 10 veces y respire hondo para renovar la película lagrimal.',
      },
    },
    fr: {
      greeting: {
        presbyopia: 'Bienvenue ! Je suis votre coach en santé visuelle. Accordez-vous 3 minutes avec les patchs de Gabor pour réveiller vos yeux fatigués et votre muscle ciliaire !',
        youth: 'Salut ! Prêt à soulager la fatigue des écrans ? Suivez cet entraînement Gabor de 3 minutes pour rafraîchir votre regard !',
        general: 'Bonjour ! Bienvenue à votre séance quotidienne de 3 minutes pour stimuler votre cortex visuel et retrouver la netteté.',
      },
      coaching: {
        presbyopia: 'Conseil du coach : Concentrez-vous sur l’orientation des rayures. Cela stimule le cortex visuel et assouplit le muscle ciliaire.',
        youth: 'Conseil du coach : Gardez 30 cm de distance avec l’écran et repérez vite les patchs de même orientation !',
        general: 'Conseil du coach : Associez les patchs ayant le même angle pour affiner progressivement votre acuité perceptive.',
      },
      cheering: {
        presbyopia: 'Remarquable ! Vos circuits neuronaux visuels sont renforcés. Pratiquez chaque jour pour une lecture plus nette !',
        youth: 'Superbe concentration ! La fatigue oculaire est estompée. À demain pour une nouvelle séance !',
        general: 'Objectif atteint ! Vos yeux doivent se sentir rafraîchis et beaucoup plus légers.',
      },
      resting: {
        presbyopia: 'Pause détente : Frottez vos paumes l’une contre l’autre pour les réchauffer, puis posez-les doucement sur vos yeux fermés.',
        youth: 'Pause détente : Regardez au loin à 6 mètres pendant 20 secondes pour détendre vos muscles oculaires.',
        general: 'Pause détente : Clignez doucement des yeux 10 fois et respirez profondément pour hydrater vos yeux.',
      },
    },
  };

  const currentLang = language in defaultMessages ? language : 'ko';
  const message = customMessage || defaultMessages[currentLang][mood][targetGroup];
  const mascotImg = mood === 'cheering' ? mascotCelebrateImg : mascotGuideImg;

  const handleReadAloud = () => {
    audioGuide.speak(message, undefined, undefined, language);
  };

  const tutorialSteps = [
    {
      title: '하루 3분의 기적, 가보르 패치란?',
      desc: '캘리포니아 대학교 연구 및 히라마쓰 루이 박사의 안과학 임상 연구로 입증된 시력 회복법입니다. 흐릿한 가보르 무늬를 눈으로 찾고 구별하는 과정에서 뇌의 시각 피질(Visual Cortex)이 자극되어 흐릿한 상을 선명하게 재구성합니다.',
      tip: '안경이나 돋보기를 착용한 상태로도 편안하게 훈련하실 수 있습니다.',
    },
    {
      title: '노안과 근시, 왜 좋아질까요?',
      desc: '노안과 스마트폰 근시는 눈의 모양체근(초점 조절 근육)의 경직과 시각 정보 처리 능력 저하로 발생합니다. 고밀도 가보르 패치 3~4개 매칭과 원근 조절 훈련을 병행하면 모양체근이 유연해지고 뇌의 윤곽 보정 능력이 최대화됩니다.',
      tip: '무리하게 인상 쓰지 말고 편안하게 눈을 깜빡이며 훈련하세요.',
    },
    {
      title: '1단계부터 10단계 점진적 난이도',
      desc: '기초적인 뚜렷한 수평·수직 줄무늬(1단계)부터 미세 각도와 저대비 주파수, 고밀도 다중 매칭 훈련(10단계)까지 단계별로 차근차근 시력을 단련할 수 있습니다.',
      tip: '매일 3분 루틴을 완료하면 연속 달성 스탬프와 시력 통계가 기록됩니다.',
    },
  ];

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs transition-all">
        <div className="flex items-center justify-between gap-3">
          {/* Coach Identity & Guidance */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-100 font-bold text-xs">
              <Focus className="w-4 h-4 text-teal-700" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-900">{t.coach.title}</span>
                <span aria-hidden="true">·</span>
                <span className="text-teal-700 font-medium">
                  {targetGroup === 'presbyopia' ? t.coach.tagPresbyopia : targetGroup === 'youth' ? t.coach.tagYouth : t.coach.tagGeneral}
                </span>
              </div>
              {!isCollapsed && (
                <p className="text-xs text-slate-700 truncate mt-0.5 max-w-lg leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleReadAloud}
              title={t.coach.readAloud}
              aria-label={t.coach.readAloud}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTutorialModal(true)}
              className="text-xs text-slate-600 hover:text-teal-800 font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">{t.coach.principleGuide}</span>
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? t.coach.expand : t.coach.collapse}
              aria-label={isCollapsed ? t.coach.expand : t.coach.collapse}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
            </button>
          </div>
        </div>

        {/* Expanded detail when clicked or active */}
        {!isCollapsed && (
          <div className="sm:hidden mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
            {message}
          </div>
        )}
      </div>

      {/* Guide & Scientific Principle Tutorial Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowTutorialModal(false)}
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-teal-50 border border-teal-200 shrink-0">
                <img src={mascotGuideImg} alt="눈초리" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.coach.modalTitle}</h3>
                <p className="text-xs text-slate-500">{t.coach.modalSubtitle}</p>
              </div>
            </div>

            <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 mb-4">
              <h4 className="text-sm font-bold text-teal-900 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                {tutorialSteps[tutorialStep].title}
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 mb-3">
                {tutorialSteps[tutorialStep].desc}
              </p>
              <div className="bg-white rounded-xl p-2.5 border border-teal-100/80 text-[11px] text-teal-800">
                <span className="font-semibold">{t.coach.practiceTip}</span> {tutorialSteps[tutorialStep].tip}
              </div>
            </div>

            {/* Stepper Dots & Navigation */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {tutorialSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTutorialStep(idx)}
                    className={`h-2 rounded-full transition-all ${
                      tutorialStep === idx ? 'w-6 bg-teal-600' : 'w-2 bg-slate-200'
                    }`}
                    aria-label={`Step ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((prev) => prev - 1)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                  >
                    {t.coach.prev}
                  </button>
                )}
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((prev) => prev + 1)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>{t.coach.next}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTutorialModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    {t.coach.startTraining}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
