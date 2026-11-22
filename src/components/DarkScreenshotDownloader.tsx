import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Check,
  Copy,
  Layers,
  FileImage,
  Eye,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export interface ScreenshotSpec {
  id: string;
  name: string;
  category: 'phone' | 'tablet' | 'desktop' | 'feature';
  width: number;
  height: number;
  badge: string;
  title: string;
  subtitle: string;
  filename: string;
  description: string;
}

export const SCREENSHOT_SPECS: ScreenshotSpec[] = [
  {
    id: 'phone_1',
    name: '휴대전화 1: 3분 데일리 루틴',
    category: 'phone',
    width: 1080,
    height: 1920,
    badge: '안과 전문의 추천 가보르 뇌 훈련',
    title: '하루 3분, 침침한 눈이 시원해진다',
    subtitle: '가보르 패치 뇌 자극과 20-20-20 원근 스트레칭',
    filename: 'phone_1_routine_dark.png',
    description: '구글 플레이 필수 휴대전화 스크린샷 (9:16 비율, 1080x1920)',
  },
  {
    id: 'phone_2',
    name: '휴대전화 2: 가보르 패치 게임',
    category: 'phone',
    width: 1080,
    height: 1920,
    badge: '맞춤 난이도 & 실시간 가이드',
    title: '줄무늬를 찾으며 뇌 시각피질 활성화',
    subtitle: '초보자도 쉬운 2각도부터 정밀 8각도까지 맞춤 훈련',
    filename: 'phone_2_gabor_dark.png',
    description: '가보르 패치 매칭 게임 화면 (9:16 비율, 1080x1920)',
  },
  {
    id: 'phone_3',
    name: '휴대전화 3: 란돌트 시력 검사',
    category: 'phone',
    width: 1080,
    height: 1920,
    badge: '국제 안과학회 표준 란돌트 C',
    title: '8방향 틈새 판별로 정밀 자가 측정',
    subtitle: '병원에 가지 않고도 매일 확인하는 내 시력 수치',
    filename: 'phone_3_vision_test_dark.png',
    description: '국제 표준 란돌트 시력 측정 화면 (9:16 비율, 1080x1920)',
  },
  {
    id: 'phone_4',
    name: '휴대전화 4: 시력 개선 통계',
    category: 'phone',
    width: 1080,
    height: 1920,
    badge: '일일 통계 & 연속 출석 스트릭',
    title: '매일매일 달라지는 시력 변화 그래프',
    subtitle: '훈련 시간, 피로도 회복 추이, 성취 뱃지 기록',
    filename: 'phone_4_stats_dark.png',
    description: '시력 및 피로 회복 통계 화면 (9:16 비율, 1080x1920)',
  },
  {
    id: 'tablet_7inch',
    name: '7인치 태블릿 스크린샷',
    category: 'tablet',
    width: 1200,
    height: 1920,
    badge: '태블릿 대화면 최적화',
    title: '시원한 큰 화면에서 편안한 눈 운동',
    subtitle: '부모님 효도 선물로 좋은 선명한 대화면 모드',
    filename: 'tablet_7inch_dark.png',
    description: '구글 플레이 7인치 태블릿 등록용 (1200x1920)',
  },
  {
    id: 'desktop_16x9',
    name: '데스크톱 / 10인치 태블릿',
    category: 'desktop',
    width: 1920,
    height: 1080,
    badge: '16:9 와이드 가로 모드',
    title: 'PC 모니터와 대형 화면 완벽 지원',
    subtitle: '업무 중 모니터로 피로해진 눈을 즉시 풀어주는 스마트 트레이너',
    filename: 'desktop_16x9_dark.png',
    description: '구글 플레이 데스크톱/10인치 태블릿용 (1920x1080)',
  },
  {
    id: 'feature_graphic',
    name: '구글 플레이 그래픽 이미지 (필수)',
    category: 'feature',
    width: 1024,
    height: 500,
    badge: 'Google Play 상단 대표 추천 배너',
    title: '노안방지 - 눈건강 3분',
    subtitle: '하루 3분 가보르 패치 뇌 훈련 & 란돌트 시력 검사',
    filename: 'feature_graphic_1024x500_dark.png',
    description: '스토어 상단에 노출되는 필수 대표 그래픽 (1024x500)',
  },
];

export const DarkScreenshotDownloader: React.FC = () => {
  const [selectedSpec, setSelectedSpec] = useState<ScreenshotSpec>(SCREENSHOT_SPECS[0]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store text listing definitions
  const storeInfo = {
    appName: '노안방지 - 눈건강 3분',
    appNameAlternative: '노안방지 - 하루 3분 가보르 시력 훈련',
    shortDescription: '하루 3분 가보르 패치 뇌 훈련과 란돌트 시력 검사로 노안 예방 및 눈 피로 회복',
    fullDescription: `하루 3분, 침침한 눈이 시원해지는 놀라운 눈 건강 트레이너!
스마트폰 장시간 사용과 노화로 인해 침침하고 뻑뻑해진 눈, 이제 '노안방지 - 눈건강 3분'으로 집에서 간편하게 케어하세요.

안과 전문의들이 권장하는 '가보르 패치(Gabor Patch) 뇌 훈련'과 '국제 표준 란돌트 C 시력 검사', 그리고 '20-20-20 모양체근 원근 스트레칭'을 스마트폰 하나로 완벽하게 즐길 수 있습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 핵심 기능 및 특징
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🧠 안과 입증 가보르 패치(Gabor Patch) 뇌 훈련
• 흐릿한 줄무늬를 찾는 과정에서 대뇌 일차 시각피질(V1 영역)의 신경 회로를 자극합니다.
• 수정체의 노화를 뇌의 정보 처리 능력(시각 뇌 가소성)으로 보완하여 작은 글씨도 또렷하게 읽을 수 있도록 도와줍니다.
• 초보자를 위한 수평·수직 2방향부터 정밀 8방향까지 맞춤 난이도를 제공합니다.

2. 👁️ 국제 표준 란돌트 고리(Landolt Ring) 정밀 시력 검사
• 국제 안과 표준 규격에 맞춘 8방향 란돌트 C 틈새 판별 방식
• 좌안, 우안, 양안 시력을 0.1부터 2.0까지 정확하게 측정
• 병원에 가지 않고도 매주 내 시력 변화를 자가 측정할 수 있습니다.

3. ⏳ 하루 3분 데일리 집중 루틴
• 음성 코칭과 함께 진행되는 과학적인 3단계 시력 케어
• 1단계: 가보르 패치 뇌 시각 피질 자극 (집중력 및 뇌 해상력 강화)
• 2단계: 20-20-20 모양체근 원근 조절 이완 운동 (눈 피로 해소)
• 3단계: 란돌트 고리 시력 측정 및 오늘의 눈 건강 점수 확인

4. 📊 시력 & 눈 피로 회복 통계
• 매일 측정된 시력 추이를 한눈에 보여주는 직관적인 그래프
• 연속 출석 스트릭(Streak)과 성취 뱃지로 매일매일 재미있는 습관 형성
• 눈 피로도 개선도와 누적 훈련 시간 자동 기록

5. 🌙 눈이 편안한 프리미엄 다크모드 & 음성 안내
• 어두운 환경에서도 눈부심 없는 고대비 다크 테마 기본 탑재
• 부드러운 코치, 차분한 안과의사, 활기찬 트레이너 등 맞춤형 음성 가이드
• 완전 무료 & 오프라인 사용 가능

━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 이런 분들께 적극 추천합니다!
━━━━━━━━━━━━━━━━━━━━━━━━━━
✔ 스마트폰 화면을 볼 때 눈이 침침하고 초점이 늦게 맞으시는 분
✔ 작은 글씨나 책을 읽을 때 돋보기안경을 자주 찾으시는 40~60대 부모님
✔ 하루 종일 컴퓨터 모니터를 보는 직장인 및 눈 피로가 심한 수험생
✔ 안과에 자주 가지 않고 집에서 스마트하게 시력을 관리하고 싶으신 분

지금 바로 '노안방지 - 눈건강 3분'을 다운로드하고, 맑고 또렷한 눈 건강을 되찾으세요!`,
  };

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Draw Gabor patch pattern onto offscreen or canvas context
  const drawGaborPatch = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    angleDeg: number,
    freq: number = 0.12,
    phase: number = 0
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const sigma = radius * 0.42;

    const imgData = ctx.createImageData(radius * 2, radius * 2);
    const data = imgData.data;

    for (let py = -radius; py < radius; py++) {
      for (let px = -radius; px < radius; px++) {
        const dist = Math.sqrt(px * px + py * py);
        const idx = ((py + radius) * (radius * 2) + (px + radius)) * 4;

        if (dist > radius) {
          data[idx + 3] = 0;
          continue;
        }

        const xPrime = px * cosA + py * sinA;
        const gaussian = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        const sinusoidal = Math.cos(2 * Math.PI * freq * xPrime + phase);
        const intensity = 0.5 + 0.5 * sinusoidal * gaussian;

        const val = Math.floor(intensity * 255);
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = Math.floor(gaussian * 255);
      }
    }

    ctx.putImageData(imgData, cx - radius, cy - radius);
  };

  // Draw Landolt Ring onto canvas
  const drawLandoltRing = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerR: number,
    gapDirectionDeg: number // 0: Right, 90: Down, 180: Left, 270: Up
  ) => {
    const innerR = outerR * 0.6;
    const gapAngle = 0.5; // radians for gap
    const dirRad = (gapDirectionDeg * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(dirRad);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, outerR, gapAngle / 2, 2 * Math.PI - gapAngle / 2);
    ctx.arc(0, 0, innerR, 2 * Math.PI - gapAngle / 2, gapAngle / 2, true);
    ctx.closePath();
    ctx.fill();

    // Subtle glow
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  };

  // Generate canvas for a given spec
  const renderSpecToCanvas = (
    canvas: HTMLCanvasElement,
    spec: ScreenshotSpec
  ): Promise<string> => {
    return new Promise((resolve) => {
      canvas.width = spec.width;
      canvas.height = spec.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      const W = spec.width;
      const H = spec.height;

      // 1. Rich Deep Dark Theme Background
      const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H);
      bgGrad.addColorStop(0, '#090e1a');
      bgGrad.addColorStop(0.5, '#062024');
      bgGrad.addColorStop(1, '#031716');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Cosmic / Glow circles
      const glow1 = ctx.createRadialGradient(W * 0.5, H * 0.35, 10, W * 0.5, H * 0.35, W * 0.7);
      glow1.addColorStop(0, 'rgba(20, 184, 166, 0.22)');
      glow1.addColorStop(0.5, 'rgba(13, 148, 136, 0.08)');
      glow1.addColorStop(1, 'transparent');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, W, H);

      // 2. Render Special Layout for Feature Graphic (1024x500)
      if (spec.category === 'feature') {
        // Feature Graphic layout
        // Left eye icon glow
        const eyeX = 220;
        const eyeY = 250;

        ctx.save();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 120, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 118, 110, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Inner glowing iris
        const irisGrad = ctx.createRadialGradient(eyeX, eyeY, 10, eyeX, eyeY, 80);
        irisGrad.addColorStop(0, '#5eead4');
        irisGrad.addColorStop(0.5, '#0d9488');
        irisGrad.addColorStop(1, '#115e59');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 70, 0, Math.PI * 2);
        ctx.fill();

        // Gabor pattern inside eye
        ctx.restore();
        drawGaborPatch(ctx, eyeX, eyeY, 50, 45, 0.14);

        // Right side Title & Typography
        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('안과 의사 추천 · 하루 3분 디지털 눈 건강', 410, 150);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('노안방지 - 눈건강 3분', 410, 230);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('가보르 패치 뇌 훈련 & 국제 표준 란돌트 시력 검사', 410, 280);

        // Feature badges
        const badges = ['뇌 시각피질 자극', '20-20-20 스트레칭', '정밀 시력 검사', '100% 무료'];
        let bx = 410;
        badges.forEach((b) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(bx, 320, 130, 42, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b, bx + 65, 347);
          ctx.textAlign = 'left';

          bx += 140;
        });

        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // 3. Render Phone & Tablet Layouts (Portrait or Landscape)
      const isDesktop = spec.category === 'desktop';

      // Top Marketing Copy Header
      const headerTop = isDesktop ? 60 : 100;

      // Badge pill
      ctx.textAlign = 'center';
      const badgeText = spec.badge;
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const badgeWidth = ctx.measureText(badgeText).width + 60;
      const badgeX = (W - badgeWidth) / 2;

      ctx.fillStyle = 'rgba(20, 184, 166, 0.18)';
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(badgeX, headerTop, badgeWidth, 60, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5eead4';
      ctx.fillText(badgeText, W / 2, headerTop + 40);

      // Main Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = isDesktop ? 'bold 64px -apple-system, BlinkMacSystemFont, sans-serif' : 'bold 76px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(spec.title, W / 2, headerTop + 140);

      // Subtitle
      ctx.fillStyle = '#94a3b8';
      ctx.font = isDesktop ? '34px -apple-system, BlinkMacSystemFont, sans-serif' : '40px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(spec.subtitle, W / 2, headerTop + 205);

      // Device Mockup Container
      const devW = isDesktop ? 1400 : W * 0.86;
      const devH = isDesktop ? 700 : H - (headerTop + 280) + 120; // extends gracefully
      const devX = (W - devW) / 2;
      const devY = headerTop + 280;

      // Device frame glow
      ctx.shadowColor = 'rgba(45, 212, 191, 0.35)';
      ctx.shadowBlur = 45;

      // Outer bezel
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(devX, devY, devW, devH, isDesktop ? 24 : 56);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0; // reset shadow

      // Device Screen Inner
      const scrPad = 16;
      const scrX = devX + scrPad;
      const scrY = devY + scrPad;
      const scrW = devW - scrPad * 2;
      const scrH = devH - scrPad * 2;

      ctx.fillStyle = '#090d16'; // Deep AMOLED Dark Mode
      ctx.beginPath();
      ctx.roundRect(scrX, scrY, scrW, scrH, isDesktop ? 16 : 44);
      ctx.fill();

      // Top App Navbar inside mockup
      const navY = scrY + 30;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(scrX + 30, navY, scrW - 60, 90, 20);
      ctx.fill();

      // App Title in Navbar
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('노안방지 - 눈건강 3분', scrX + 60, navY + 56);

      // Status badges in Navbar
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(scrX + scrW - 240, navY + 20, 180, 50, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 7일 연속', scrX + scrW - 150, navY + 53);

      // RENDER SCREEN SPECIFIC CONTENTS INSIDE MOCKUP
      const contentY = navY + 130;

      if (spec.id === 'phone_1' || spec.id === 'tablet_7inch') {
        // SCREEN 1: 3-MINUTE ROUTINE
        // Circular Big Timer
        const timerCX = scrX + scrW / 2;
        const timerCY = contentY + 280;
        const timerR = 190;

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.arc(timerCX, timerCY, timerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#0d9488';
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.arc(timerCX, timerCY, timerR, -Math.PI / 2, Math.PI * 0.8);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 110px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('02:45', timerCX, timerCY + 35);

        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('1단계: 가보르 뇌 훈련 진행 중', timerCX, timerCY + 95);

        // Routine steps card
        const cardY = timerCY + 220;
        ctx.fillStyle = '#131e33';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(scrX + 40, cardY, scrW - 80, 240, 24);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('오늘의 3분 완성 코스', scrX + 75, cardY + 65);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '30px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('1. 가보르 패치 패턴 매칭 (1분 30초)', scrX + 75, cardY + 120);
        ctx.fillText('2. 20-20-20 모양체근 원근 스트레칭 (1분)', scrX + 75, cardY + 165);
        ctx.fillText('3. 란돌트 자가 시력 측정 (30초)', scrX + 75, cardY + 210);
      } else if (spec.id === 'phone_2') {
        // SCREEN 2: GABOR PATCH GAME
        // Target Direction Banner
        ctx.fillStyle = 'rgba(13, 148, 136, 0.25)';
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(scrX + 40, contentY, scrW - 80, 110, 20);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#5eead4';
        ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('방향 가이드: 수직 (90°) 줄무늬 패치를 3개 찾으세요!', scrX + scrW / 2, contentY + 68);

        // 3x3 Gabor Grid
        const gridCols = 3;
        const gridRows = 3;
        const cellW = (scrW - 120) / gridCols;
        const cellH = 180;
        const startGX = scrX + 60;
        const startGY = contentY + 140;

        const angles = [90, 0, 90, 45, 90, 135, 0, 90, 0];

        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridCols; c++) {
            const idx = r * gridCols + c;
            const px = startGX + c * cellW;
            const py = startGY + r * (cellH + 20);

            // Cell box
            const isTarget = angles[idx] === 90;
            ctx.fillStyle = isTarget ? 'rgba(20, 184, 166, 0.15)' : '#111827';
            ctx.strokeStyle = isTarget ? '#2dd4bf' : '#1f2937';
            ctx.lineWidth = isTarget ? 5 : 2;
            ctx.beginPath();
            ctx.roundRect(px, py, cellW - 20, cellH, 20);
            ctx.fill();
            ctx.stroke();

            // Draw Real Gabor Patch inside
            drawGaborPatch(ctx, px + (cellW - 20) / 2, py + cellH / 2, 55, angles[idx], 0.14);
          }
        }
      } else if (spec.id === 'phone_3') {
        // SCREEN 3: LANDOLT VISION TEST
        // Dark Test Card
        const cardY = contentY + 20;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(scrX + 40, cardY, scrW - 80, 480, 28);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('고리의 뚫린 방향을 터치하세요', scrX + scrW / 2, cardY + 70);

        // Glowing Landolt Ring
        drawLandoltRing(ctx, scrX + scrW / 2, cardY + 250, 110, 0); // Open to right (0 deg)

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('현재 검사 시력: 1.2', scrX + scrW / 2, cardY + 430);

        // 4 Key Directional Buttons below
        const btnY = cardY + 520;
        const dirs = ['▲ 상', '◀ 좌', '▶ 우 (선택됨)', '▼ 하'];
        const btnW = (scrW - 110) / 2;

        dirs.forEach((d, i) => {
          const bx = scrX + 40 + (i % 2) * (btnW + 30);
          const by = btnY + Math.floor(i / 2) * 110;
          const isSelected = i === 2;

          ctx.fillStyle = isSelected ? '#0d9488' : '#1e293b';
          ctx.strokeStyle = isSelected ? '#5eead4' : '#334155';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(bx, by, btnW, 85, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(d, bx + btnW / 2, by + 53);
        });
      } else if (spec.id === 'phone_4' || spec.id === 'desktop_16x9') {
        // SCREEN 4: STATS & GRAPH
        const statY = contentY + 20;

        // Big Acuity Card
        ctx.fillStyle = '#131e33';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(scrX + 40, statY, scrW - 80, 220, 24);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('현재 측정 평균 시력', scrX + 75, statY + 60);

        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 84px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('1.25', scrX + 75, statY + 155);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('▲ 훈련 전 대비 +0.25 향상!', scrX + 280, statY + 140);

        // Chart Card
        const chartY = statY + 250;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(scrX + 40, chartY, scrW - 80, 380, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('주간 시력 개선 추이', scrX + 75, chartY + 60);

        // Line graph coordinates
        const points = [
          { day: '월', val: 0.8, x: scrX + 110, y: chartY + 280 },
          { day: '화', val: 0.9, x: scrX + 220, y: chartY + 240 },
          { day: '수', val: 0.9, x: scrX + 330, y: chartY + 240 },
          { day: '목', val: 1.0, x: scrX + 440, y: chartY + 190 },
          { day: '금', val: 1.1, x: scrX + 550, y: chartY + 150 },
          { day: '토', val: 1.2, x: scrX + 660, y: chartY + 120 },
          { day: '일', val: 1.25, x: scrX + 770, y: chartY + 105 },
        ];

        // Draw line
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 8;
        ctx.beginPath();
        points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Draw points
        points.forEach((p) => {
          ctx.fillStyle = '#042f2e';
          ctx.strokeStyle = '#5eead4';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(p.day, p.x, chartY + 340);
        });
      }

      resolve(canvas.toDataURL('image/png'));
    });
  };

  // Generate previews on load
  useEffect(() => {
    let isMounted = true;
    const generateAllPreviews = async () => {
      setIsGenerating(true);
      const canvas = document.createElement('canvas');
      const results: Record<string, string> = {};

      for (const spec of SCREENSHOT_SPECS) {
        const url = await renderSpecToCanvas(canvas, spec);
        results[spec.id] = url;
      }

      if (isMounted) {
        setPreviewUrls(results);
        setIsGenerating(false);
      }
    };

    generateAllPreviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Single download trigger
  const handleDownload = async (spec: ScreenshotSpec) => {
    setDownloadingId(spec.id);
    let dataUrl = previewUrls[spec.id];

    if (!dataUrl) {
      const canvas = document.createElement('canvas');
      dataUrl = await renderSpecToCanvas(canvas, spec);
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = spec.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloadingId(null);
    }, 1000);
  };

  // Batch download all 7 images sequentially
  const handleBatchDownload = async () => {
    setIsGenerating(true);
    for (let i = 0; i < SCREENSHOT_SPECS.length; i++) {
      const spec = SCREENSHOT_SPECS[i];
      await handleDownload(spec);
      await new Promise((r) => setTimeout(r, 600)); // slight pause between downloads
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-teal-500/30 text-white space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>구글 플레이스토어 다크모드 애셋 일괄 다운로드</span>
                <span className="text-[10px] bg-teal-800 text-teal-200 px-2 py-0.5 rounded-full font-mono">
                  7종 완비
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                휴대전화 4장(1080x1920) + 7인치 태블릿(1200x1920) + 데스크톱(1920x1080) + 그래픽 이미지(1024x500)
              </p>
            </div>
          </div>

          <button
            onClick={handleBatchDownload}
            disabled={isGenerating}
            className="py-2 px-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>전체 7종 일괄 다운로드 (1-클릭)</span>
          </button>
        </div>
      </div>

      {/* Screenshot Selector & Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Left List of 7 Assets */}
        <div className="md:col-span-5 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block px-1">
            등록 애셋 선택
          </span>
          <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
            {SCREENSHOT_SPECS.map((spec) => {
              const isSelected = selectedSpec.id === spec.id;
              return (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpec(spec)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {spec.category === 'phone' && <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />}
                    {spec.category === 'tablet' && <Tablet className="w-4 h-4 text-teal-600 shrink-0" />}
                    {spec.category === 'desktop' && <Monitor className="w-4 h-4 text-teal-600 shrink-0" />}
                    {spec.category === 'feature' && <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />}
                    <div className="truncate text-left">
                      <p className="text-xs truncate">{spec.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {spec.width} x {spec.height} px
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-teal-700' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Preview & Download */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">{selectedSpec.name}</p>
                <p className="text-[10px] text-teal-400 font-mono">
                  {selectedSpec.filename} ({selectedSpec.width}x{selectedSpec.height}px)
                </p>
              </div>
              <button
                onClick={() => handleDownload(selectedSpec)}
                disabled={downloadingId === selectedSpec.id}
                className="py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {downloadingId === selectedSpec.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>PNG 다운로드</span>
              </button>
            </div>

            {/* Canvas Thumbnail Preview */}
            <div className="mt-2.5 flex items-center justify-center bg-slate-950/80 rounded-xl p-2 border border-slate-800 min-h-[220px]">
              {previewUrls[selectedSpec.id] ? (
                <img
                  src={previewUrls[selectedSpec.id]}
                  alt={selectedSpec.name}
                  className="max-h-[220px] rounded-lg shadow-lg object-contain border border-slate-700"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5">
                  <RefreshCw className="w-5 h-5 animate-spin text-teal-500" />
                  <span>다크모드 스크린샷 렌더링 중...</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {selectedSpec.description}
          </p>
        </div>
      </div>

      {/* STORE LISTING TEXT ASSETS (1-CLICK COPY SECTION) */}
      <div className="space-y-2.5 pt-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>구글 플레이스토어 기본 등록정보 (복사해서 바로 붙여넣기)</span>
        </h4>

        {/* App Name */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-[11px]">
              1. 앱 이름 (최대 30자)
            </span>
            <span className="text-[10px] text-teal-700 font-bold">13자 / 30자</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={storeInfo.appName}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
            />
            <button
              onClick={() => handleCopyText(storeInfo.appName, 'app-name')}
              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
            >
              {copiedField === 'app-name' ? '복사됨!' : '복사'}
            </button>
          </div>
        </div>

        {/* Short Description */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-[11px]">
              2. 간단한 설명 (최대 80자)
            </span>
            <span className="text-[10px] text-teal-700 font-bold">43자 / 80자</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={storeInfo.shortDescription}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800"
            />
            <button
              onClick={() => handleCopyText(storeInfo.shortDescription, 'short-desc')}
              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
            >
              {copiedField === 'short-desc' ? '복사됨!' : '복사'}
            </button>
          </div>
        </div>

        {/* Full Description */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-[11px]">
              3. 자세한 설명 (최대 4000자)
            </span>
            <button
              onClick={() => handleCopyText(storeInfo.fullDescription, 'full-desc')}
              className="py-1 px-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
            >
              {copiedField === 'full-desc' ? '전체 복사됨!' : '자세한 설명 전체 복사'}
            </button>
          </div>
          <textarea
            readOnly
            rows={5}
            value={storeInfo.fullDescription}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-[11px] font-mono text-slate-700 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
