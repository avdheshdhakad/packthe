import React, { useMemo } from 'react';
import { BoundingBox as BoundingBoxType } from '../../types';
import {
  calculateDynamicBoundingBox,
  DEFAULT_PADDING_MULTIPLIER,
} from '../../utils/boundingBoxCalculator';

export interface BoundingBoxProps {
  box: BoundingBoxType;
  text?: string;
  label?: string;
  confidence?: number;
  status?: string;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'declaration' | 'ocr-block' | 'violation';
  paddingMultiplier?: number;
  showLabelBadge?: boolean;
  interactive?: boolean;
  className?: string;
  id?: string;
}

/**
 * High-precision BoundingBox component for statutory packaging declarations & OCR tokens.
 *
 * Dynamically computes rendered width and height based on the actual text content length
 * found by the OCR engine, incorporating a consistent 10-15% padding multiplier to guarantee
 * that text tokens, decimals, currency symbols, and unit suffixes are never clipped.
 */
export const BoundingBox: React.FC<BoundingBoxProps> = ({
  box,
  text,
  label,
  confidence,
  status = 'detected',
  isSelected = false,
  onClick,
  variant = 'declaration',
  paddingMultiplier = DEFAULT_PADDING_MULTIPLIER,
  showLabelBadge = true,
  interactive = true,
  className = '',
  id,
}) => {
  // Dynamically calculate final width and dimensions with consistent 10-15% padding multiplier
  const dynamicBox = useMemo(() => {
    return calculateDynamicBoundingBox(box, text, {
      paddingMultiplier,
      clampToContainer: true,
    });
  }, [box, text, paddingMultiplier]);

  // Visual status styling
  const isViolation = status === 'invalid_format' || status === 'invalid' || status === 'violation';
  const isLowConfidence = status === 'low_confidence' || (typeof confidence === 'number' && confidence < 75);

  let borderStyle = 'border-emerald-400/90 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30';

  if (variant === 'ocr-block') {
    borderStyle = isSelected
      ? 'border-cyan-300 bg-cyan-500/40 ring-2 ring-cyan-400 z-30 shadow-lg'
      : 'border-cyan-400/60 bg-cyan-500/10 hover:border-cyan-300 hover:bg-cyan-500/25 z-10';
  } else if (isSelected) {
    borderStyle = 'border-white bg-blue-600/40 ring-4 ring-blue-500 text-white shadow-2xl z-30 scale-[1.01]';
  } else if (isViolation) {
    borderStyle = 'border-rose-500 bg-rose-500/25 text-rose-100 hover:bg-rose-500/35 z-15';
  } else if (isLowConfidence) {
    borderStyle = 'border-amber-400 bg-amber-500/25 text-amber-100 hover:bg-amber-500/35 z-15';
  }

  const tooltipTitle = text
    ? `${label ? `${label}: ` : ''}"${text}"${confidence ? ` (${confidence}%)` : ''} [Width: ${dynamicBox.width}%]`
    : label || 'Packaging Declaration';

  return (
    <div
      id={id || (label ? `bbox-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined)}
      onClick={interactive ? onClick : undefined}
      style={{
        position: 'absolute',
        left: `${dynamicBox.x}%`,
        top: `${dynamicBox.y}%`,
        width: `${dynamicBox.width}%`,
        height: `${dynamicBox.height}%`,
      }}
      className={`group rounded border-2 transition-all ${interactive ? 'cursor-pointer' : 'pointer-events-none'} ${borderStyle} ${
        isSelected ? 'z-30' : 'z-10'
      } ${className}`}
      title={tooltipTitle}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Corner indicators for precision metrology alignment */}
      <div className="absolute -top-1 -left-1 h-2 w-2 rounded-tl border-t-2 border-l-2 border-white/80 pointer-events-none" />
      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-tr border-t-2 border-r-2 border-white/80 pointer-events-none" />
      <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-bl border-b-2 border-l-2 border-white/80 pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-br border-b-2 border-r-2 border-white/80 pointer-events-none" />

      {/* Floating Badge with Label & Detected Text snippet */}
      {showLabelBadge && (label || text) && (
        <div
          className={`absolute -top-6 left-0 z-30 flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[9px] font-bold shadow-xl backdrop-blur-md transition-all pointer-events-none ${
            isSelected
              ? 'bg-blue-600 text-white ring-2 ring-blue-400 opacity-100'
              : 'bg-slate-950/95 text-white opacity-90 group-hover:opacity-100 group-hover:scale-105'
          }`}
        >
          {label && (
            <span
              className={
                isViolation
                  ? 'text-rose-300 font-extrabold'
                  : isLowConfidence
                  ? 'text-amber-300 font-extrabold'
                  : 'text-emerald-300 font-extrabold'
              }
            >
              {label}:
            </span>
          )}
          {text && (
            <span className="max-w-[220px] truncate text-slate-100 font-mono">
              "{text}"
            </span>
          )}
          {typeof confidence === 'number' && (
            <span className="text-[8px] text-slate-400 font-mono">
              ({confidence}%)
            </span>
          )}
          <span className="text-[7.5px] text-slate-500 font-mono tracking-tight hidden sm:inline">
            +{Math.round((dynamicBox.paddingMultiplier || DEFAULT_PADDING_MULTIPLIER) * 100)}% pad
          </span>
        </div>
      )}
    </div>
  );
};

export default BoundingBox;
