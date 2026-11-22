/**
 * Mathematical Gabor Patch & Stereogram Procedural Generator
 * Generates 100% royalty-free visual stimuli based on scientific vision research:
 * - Sinusoidal grating modulated by a 2D Gaussian envelope
 * - Autostereogram (Magic Eye) depth calculation
 * - Dynamic visual accommodation targets
 */

import { AppLanguage } from '../types';

export interface GaborParams {
  size: number; // canvas width/height in px
  orientationDeg: number; // 0 to 180 degrees
  wavelength: number; // pixels per cycle (frequency)
  phase?: number; // 0 to 2*PI
  contrast?: number; // 0.1 to 1.0
  sigma?: number; // Gaussian envelope standard deviation
  gamma?: number; // spatial aspect ratio (ellipticity)
}

export type GaborVariety =
  | 'single_faint' // 1줄 흐림 (1 faint line)
  | 'single_bold' // 1줄 강함 (1 strong line)
  | 'double_strong' // 2줄 강함 (2 strong lines)
  | 'double_soft' // 2줄 흐림 (2 soft lines)
  | 'triple_balanced'; // 3줄 표준 (3 lines max)

export interface OrientationInfo {
  deg: number;
  label: string;
  symbol: string;
  shortName: string;
}

export function getOrientationSymbol(orientationDeg: number): string {
  const norm = ((Math.round(orientationDeg) % 180) + 180) % 180;
  if (norm === 0) return '━';
  if (norm === 90) return '┃';
  if (norm > 0 && norm < 90) return '╱';
  return '╲';
}

/**
 * Returns localized direction labels and symbols for any orientation (0° to 179°)
 */
export function getLocalizedOrientationInfo(
  orientationDeg: number,
  lang: AppLanguage = 'ko'
): OrientationInfo {
  const norm = ((Math.round(orientationDeg) % 180) + 180) % 180;
  const symbol = getOrientationSymbol(norm);

  if (norm === 0) {
    const labels: Record<AppLanguage, string> = {
      ko: '수평 (0°)',
      en: 'Horizontal (0°)',
      ja: '水平 (0°)',
      zh: '水平 (0°)',
      es: 'Horizontal (0°)',
      fr: 'Horizontal (0°)',
    };
    const shortLabels: Record<AppLanguage, string> = {
      ko: '가로 ━',
      en: 'H (0°)',
      ja: '横 ━',
      zh: '水平 ━',
      es: 'H (0°)',
      fr: 'H (0°)',
    };
    return { deg: 0, label: labels[lang], symbol, shortName: shortLabels[lang] };
  }

  if (norm === 90) {
    const labels: Record<AppLanguage, string> = {
      ko: '수직 (90°)',
      en: 'Vertical (90°)',
      ja: '垂直 (90°)',
      zh: '垂直 (90°)',
      es: 'Vertical (90°)',
      fr: 'Vertical (90°)',
    };
    const shortLabels: Record<AppLanguage, string> = {
      ko: '세로 ┃',
      en: 'V (90°)',
      ja: '縦 ┃',
      zh: '垂直 ┃',
      es: 'V (90°)',
      fr: 'V (90°)',
    };
    return { deg: 90, label: labels[lang], symbol, shortName: shortLabels[lang] };
  }

  if (norm === 45) {
    const labels: Record<AppLanguage, string> = {
      ko: '우상향 대각선 (45°)',
      en: 'Diagonal Right (45°)',
      ja: '右斜め (45°)',
      zh: '右斜向 (45°)',
      es: 'Diagonal (45°)',
      fr: 'Diagonale (45°)',
    };
    const shortLabels: Record<AppLanguage, string> = {
      ko: '대각선 45° ╱',
      en: '45° ╱',
      ja: '45° ╱',
      zh: '45° ╱',
      es: '45° ╱',
      fr: '45° ╱',
    };
    return { deg: 45, label: labels[lang], symbol, shortName: shortLabels[lang] };
  }

  if (norm === 135) {
    const labels: Record<AppLanguage, string> = {
      ko: '좌상향 대각선 (135°)',
      en: 'Diagonal Left (135°)',
      ja: '左斜め (135°)',
      zh: '左斜向 (135°)',
      es: 'Diagonal (135°)',
      fr: 'Diagonale (135°)',
    };
    const shortLabels: Record<AppLanguage, string> = {
      ko: '역대각선 135° ╲',
      en: '135° ╲',
      ja: '135° ╲',
      zh: '135° ╲',
      es: '135° ╲',
      fr: '135° ╲',
    };
    return { deg: 135, label: labels[lang], symbol, shortName: shortLabels[lang] };
  }

  const tiltLabels: Record<AppLanguage, string> = {
    ko: `기울기 (${norm}°)`,
    en: `Tilt (${norm}°)`,
    ja: `傾き (${norm}°)`,
    zh: `倾斜 (${norm}°)`,
    es: `Inclinación (${norm}°)`,
    fr: `Inclinaison (${norm}°)`,
  };
  const shortTiltLabels: Record<AppLanguage, string> = {
    ko: `${norm}° 기울기 ${symbol}`,
    en: `${norm}° ${symbol}`,
    ja: `${norm}° ${symbol}`,
    zh: `${norm}° ${symbol}`,
    es: `${norm}° ${symbol}`,
    fr: `${norm}° ${symbol}`,
  };

  return {
    deg: norm,
    label: tiltLabels[lang],
    symbol,
    shortName: shortTiltLabels[lang],
  };
}

/**
 * Returns human-friendly direction labels and symbols (e.g. 가로 ━, 세로 ┃, 대각선 ╱)
 */
export function getOrientationInfo(orientationDeg: number): OrientationInfo {
  return getLocalizedOrientationInfo(orientationDeg, 'ko');
}

/**
 * Returns mathematically precise parameters for optical varieties (strictly 1 to 3 lines max):
 * - 1 line (faint / bold)
 * - 2 lines (strong / soft)
 * - 3 lines max (balanced)
 */
export function getGaborVarietyParams(
  variety: GaborVariety,
  size: number
): { wavelength: number; contrast: number; phase: number; sigma: number } {
  switch (variety) {
    case 'single_faint':
      // Exactly 1 faint central line
      return {
        wavelength: Math.round(size * 0.50),
        contrast: 0.42,
        phase: 0,
        sigma: size / 5.2,
      };
    case 'single_bold':
      // Exactly 1 strong central line
      return {
        wavelength: Math.round(size * 0.46),
        contrast: 0.94,
        phase: 0,
        sigma: size / 5.0,
      };
    case 'double_strong':
      // Exactly 2 strong, crisp parallel lines
      return {
        wavelength: Math.round(size * 0.34),
        contrast: 0.98,
        phase: Math.PI / 2,
        sigma: size / 4.6,
      };
    case 'double_soft':
      // Exactly 2 faint parallel lines
      return {
        wavelength: Math.round(size * 0.36),
        contrast: 0.50,
        phase: Math.PI / 2,
        sigma: size / 4.6,
      };
    case 'triple_balanced':
      // Exactly 3 lines max (1 center peak + 2 flanks)
      return {
        wavelength: Math.round(size * 0.28),
        contrast: 0.85,
        phase: 0,
        sigma: size / 4.4,
      };
  }
}

/**
 * Renders a scientifically accurate Gabor patch directly onto a canvas element
 */
export function renderGaborToCanvas(
  canvas: HTMLCanvasElement,
  params: GaborParams
): void {
  const {
    size,
    orientationDeg,
    wavelength,
    phase = 0,
    contrast = 0.9,
    sigma = size / 4.8,
    gamma = 1.0,
  } = params;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const theta = (orientationDeg * Math.PI) / 180;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const halfSize = size / 2;
  const twoSigmaSq = 2 * sigma * sigma;

  for (let y = 0; y < size; y++) {
    const yRel = y - halfSize;
    for (let x = 0; x < size; x++) {
      const xRel = x - halfSize;

      // Coordinate rotation
      const xPrime = xRel * cosTheta + yRel * sinTheta;
      const yPrime = -xRel * sinTheta + yRel * cosTheta;

      // 2D Gaussian envelope
      const gaussian = Math.exp(
        -(xPrime * xPrime + gamma * gamma * yPrime * yPrime) / twoSigmaSq
      );

      // Sinusoidal carrier
      const carrier = Math.cos((2 * Math.PI * xPrime) / wavelength + phase);

      // Modulated luminance (0 to 1, centered at 0.5)
      const gaborVal = 0.5 + 0.5 * contrast * gaussian * carrier;
      const gray = Math.round(Math.max(0, Math.min(255, gaborVal * 255)));

      const idx = (y * size + x) * 4;
      data[idx] = gray; // R
      data[idx + 1] = gray; // G
      data[idx + 2] = gray; // B
      data[idx + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Creates an image data URL of a Gabor patch
 */
export function getGaborDataUrl(params: GaborParams): string {
  const canvas = document.createElement('canvas');
  renderGaborToCanvas(canvas, params);
  return canvas.toDataURL('image/png');
}

export type StereogramShape = 'heart' | 'star' | 'circle' | 'ring' | 'diamond' | 'pyramid';

/**
 * Generates an Autostereogram (Magic Eye) depth-map onto canvas
 */
export function renderStereogramToCanvas(
  canvas: HTMLCanvasElement,
  shape: StereogramShape = 'heart',
  width: number = 360,
  height: number = 280,
  patternWidth: number = 55
): void {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // 1. Create depth map for shape
  const depthMap = new Float32Array(width * height);
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let depth = 0;

      switch (shape) {
        case 'heart': {
          // Heart curve equation
          const nx = dx / 55;
          const ny = -dy / 55;
          const heartEq = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * Math.pow(ny, 3);
          if (heartEq <= 0) {
            depth = Math.max(0, 1 - dist / 70);
          }
          break;
        }
        case 'star': {
          const angle = Math.atan2(dy, dx);
          const r = 50 + 25 * Math.cos(5 * angle);
          if (dist < r) {
            depth = 1 - dist / r;
          }
          break;
        }
        case 'ring': {
          if (dist > 30 && dist < 75) {
            const ringMid = 52.5;
            depth = 1 - Math.abs(dist - ringMid) / 22.5;
          }
          break;
        }
        case 'diamond': {
          const manhattan = Math.abs(dx) + Math.abs(dy);
          if (manhattan < 65) {
            depth = 1 - manhattan / 65;
          }
          break;
        }
        case 'pyramid': {
          const maxDist = Math.max(Math.abs(dx), Math.abs(dy));
          if (maxDist < 70) {
            depth = 1 - maxDist / 70;
          }
          break;
        }
        default: {
          // Circle / Sphere
          if (dist < 65) {
            depth = Math.sqrt(1 - (dist / 65) * (dist / 65));
          }
          break;
        }
      }

      depthMap[y * width + x] = Math.max(0, Math.min(1, depth));
    }
  }

  // 2. Synthesize Autostereogram using Random Dots with Depth Offset
  // Deterministic noise row pattern
  const maxDepthShift = 14;

  for (let y = 0; y < height; y++) {
    const rowColors: number[] = [];
    const same: number[] = [];
    for (let x = 0; x < width; x++) {
      same[x] = x;
    }

    for (let x = 0; x < width; x++) {
      const depth = depthMap[y * width + x];
      const separation = Math.round(patternWidth - depth * maxDepthShift);
      const left = Math.round(x - separation / 2);
      const right = left + separation;

      if (left >= 0 && right < width) {
        let visible = true;
        if (visible) {
          let l = same[left];
          while (l !== same[l]) l = same[l];
          let r = same[right];
          while (r !== same[r]) r = same[r];
          if (l !== r) {
            if (l < r) same[r] = l;
            else same[l] = r;
          }
        }
      }
    }

    // Assign dot colors
    const colors: [number, number, number][] = [];
    for (let x = 0; x < width; x++) {
      let root = x;
      while (root !== same[root]) root = same[root];
      if (!colors[root]) {
        // High contrast pleasant color palette: subtle cyan, slate, and amber dots
        const rnd = Math.random();
        if (rnd < 0.3) {
          colors[root] = [15, 118, 110]; // teal
        } else if (rnd < 0.6) {
          colors[root] = [30, 41, 59]; // slate
        } else if (rnd < 0.85) {
          colors[root] = [234, 88, 12]; // warm amber
        } else {
          colors[root] = [241, 245, 249]; // crisp white
        }
      }
      const col = colors[root];
      const idx = (y * width + x) * 4;
      data[idx] = col[0];
      data[idx + 1] = col[1];
      data[idx + 2] = col[2];
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Draw 2 reference fusion guide dots at the top
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(centerX - patternWidth / 2, 14, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX + patternWidth / 2, 14, 5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Procedural daily seed generator for fresh daily patterns
 */
export function getDailySeedString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Converts a string seed into a 32-bit integer
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
