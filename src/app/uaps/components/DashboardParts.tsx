'use client';

import { motion } from 'framer-motion';
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

// UAPS 대시보드 공용 섹션 래퍼 (샴페인·전 카테고리 공유).
// page.tsx와 [category]/page.tsx에 중복 정의돼 있던 것을 통합.
export function SectionWrapper({
  title,
  icon: Icon,
  children,
  delay = 0,
  action,
  iconColor = '#22d3ee',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  delay?: number;
  action?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent rounded-3xl" />
      <div className="relative bg-[#0d1421]/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${iconColor}15` }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <h3 className="text-lg font-medium text-white/90">{title}</h3>
          </div>
          {action}
        </div>
        {children}
      </div>
    </motion.div>
  );
}

// UAPS 보정 계수 조절 슬라이더 (⚙️설정 팝업 내부, 샴페인·전 카테고리 공유).
// 샴페인판의 description 툴팁 + [category]판의 accent 테마색을 통합.
// accent 기본값은 cyan(#22d3ee)이라 샴페인은 기존과 동일하게 렌더된다.
export function CoefficientSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  scientificBasis,
  recommendedValue,
  sourceType,
  description,
  accent = '#22d3ee',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  scientificBasis?: string;
  recommendedValue?: number;
  sourceType?: 'hypothesis' | 'scientific';
  description?: string;
  accent?: string;
  accentRgb?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const openTooltip = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
      });
    }
    setShowTooltip(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-white/50">{label}</label>
          {description && (
            <>
              <button
                ref={btnRef}
                type="button"
                onMouseEnter={openTooltip}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => showTooltip ? setShowTooltip(false) : openTooltip()}
                className="text-white/25 hover:text-white/60 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showTooltip && typeof document !== 'undefined' && createPortal(
                <div
                  className="fixed w-72 bg-[#12131a] border border-white/[0.12] rounded-xl p-3.5 shadow-2xl z-[9999]"
                  style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-100%)' }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <p className="text-[11px] leading-[1.7] text-white/60 whitespace-pre-line">{description}</p>
                </div>,
                document.body
              )}
            </>
          )}
        </div>
        <span className="text-xs font-mono font-medium" style={{ color: accent }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: accent, ['--thumb' as string]: accent }}
        className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--thumb)] [&::-webkit-slider-thumb]:shadow-lg"
      />
      <div className="flex justify-between text-[10px] text-white/20 mt-1">
        <span>{min}</span>
        {recommendedValue !== undefined && (
          <span style={{ color: `${accent}80` }}>권장 {recommendedValue}</span>
        )}
        <span>{max}</span>
      </div>
      {scientificBasis && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              sourceType === 'scientific' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-[10px] text-white/30">{scientificBasis}</span>
        </div>
      )}
    </div>
  );
}
