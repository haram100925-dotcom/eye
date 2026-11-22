import React, { useEffect, useRef } from 'react';
import { renderGaborToCanvas, GaborParams } from '../utils/gaborGenerator';

interface GaborPatchCanvasProps extends GaborParams {
  selected?: boolean;
  isMatched?: boolean;
  isTargetIndicator?: boolean;
  onClick?: () => void;
  className?: string;
  badgeLabel?: string;
}

export const GaborPatchCanvas: React.FC<GaborPatchCanvasProps> = ({
  size = 72,
  orientationDeg,
  wavelength,
  phase = 0,
  contrast = 0.9,
  sigma,
  gamma = 1.0,
  selected = false,
  isMatched = false,
  isTargetIndicator = false,
  onClick,
  className = '',
  badgeLabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderGaborToCanvas(canvasRef.current, {
      size,
      orientationDeg,
      wavelength,
      phase,
      contrast,
      sigma,
      gamma,
    });
  }, [size, orientationDeg, wavelength, phase, contrast, sigma, gamma]);

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={isMatched ? undefined : onClick}
      onKeyDown={(e) => {
        if (onClick && !isMatched && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative inline-flex items-center justify-center p-1 rounded-2xl transition-all select-none ${
        onClick && !isMatched ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${
        selected
          ? 'ring-4 ring-teal-500 bg-teal-50/80 shadow-md'
          : isMatched
          ? 'opacity-30 grayscale pointer-events-none scale-95'
          : 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs'
      } ${isTargetIndicator ? 'ring-2 ring-amber-500/80 bg-amber-50/50' : ''} ${className}`}
      style={{ minWidth: 48, minHeight: 48 }}
      aria-label={`가보르 패치 기울기 ${orientationDeg}도`}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-xl block pointer-events-none"
      />
      {badgeLabel && (
        <span className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full shadow-xs">
          {badgeLabel}
        </span>
      )}
    </div>
  );
};
