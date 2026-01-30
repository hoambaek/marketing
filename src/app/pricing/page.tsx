'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Wine,
  Target,
  DollarSign,
  BarChart3,
  Package,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Percent,
  Calculator,
  Award,
  Building2,
  Users,
  Gem,
  RefreshCw,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { fetchCostCalculatorSettingsByYear, fetchPricingSettings, upsertPricingSettings } from '@/lib/supabase/database';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toast-store';

// ═══════════════════════════════════════════════════════════════════════════
// 데이터 (pricing-report.md 기반)
// ═══════════════════════════════════════════════════════════════════════════

interface PricingTier {
  id: string;
  tier: 'ENTRY' | 'MID' | 'HIGH' | 'ULTRA' | 'MAGNUM';
  nameKo: string;
  nameEn: string;
  subtitle: string;
  quantity: number;
  costPerBottle: number;
  b2bPrice: number;
  consumerPrice: number;
  agingPeriod: string;
  features: string[];
  targetChannel: string[];
  isNumbered?: boolean;
  maxNumber?: number;
}

interface EditableTierValues {
  quantity: number;
  b2bPrice: number;
  consumerPrice: number;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'entry',
    tier: 'ENTRY',
    nameKo: '앙 리유 쉬르 브뤼',
    nameEn: 'En Lieu Sûr',
    subtitle: '바다의 시간으로 가는 첫 번째 문',
    quantity: 200,
    costPerBottle: 78811,
    b2bPrice: 99000,
    consumerPrice: 150000,
    agingPeriod: '6개월',
    features: ['Entry 라인', '대중 접근성 극대화', 'Abyss 소비자가의 절반'],
    targetChannel: ['와인바', '호텔 미니바', '레스토랑'],
  },
  {
    id: 'bdb',
    tier: 'MID',
    nameKo: '엘레멘 드 쉬르프리즈 BDB',
    nameEn: 'Élément de Surprise',
    subtitle: '100% 샤르도네, 놀라움의 요소',
    quantity: 110,
    costPerBottle: 87346,
    b2bPrice: 219000,
    consumerPrice: 320000,
    agingPeriod: '1년',
    features: ['100% 샤르도네', '블랑드블랑', 'Abyss 동등 포지션'],
    targetChannel: ['와인 전문가', '파인다이닝', '프리미엄 와인숍'],
  },
  {
    id: 'atome-1y',
    tier: 'HIGH',
    nameKo: '아톰 크로슈 (1년)',
    nameEn: 'Atomes Crochus',
    subtitle: '기가 통하는 이들을 위한',
    quantity: 100,
    costPerBottle: 90855,
    b2bPrice: 299000,
    consumerPrice: 450000,
    agingPeriod: '1년',
    features: ['시그니처 라인', '100병 한정', 'Abyss보다 프리미엄'],
    targetChannel: ['5성급 호텔', '파인다이닝', '와인 컬렉터'],
  },
  {
    id: 'atome-2y',
    tier: 'ULTRA',
    nameKo: '아톰 크로슈 (2년)',
    nameEn: 'Atomes Crochus 2Y',
    subtitle: '두 배의 시간, 두 배의 깊이',
    quantity: 40,
    costPerBottle: 90855,
    b2bPrice: 599000,
    consumerPrice: 900000,
    agingPeriod: '2년',
    features: ['세계 유일 2년 해저숙성', 'Dom P2급 컬렉터', '극한 희소성'],
    targetChannel: ['컬렉터', 'VIP 고객', '투자 가치'],
    isNumbered: true,
    maxNumber: 40,
  },
  {
    id: 'magnum',
    tier: 'MAGNUM',
    nameKo: '앙 리유 쉬르 매그넘',
    nameEn: 'En Lieu Sûr Magnum',
    subtitle: '세상에 24병만 존재',
    quantity: 24,
    costPerBottle: 109631,
    b2bPrice: 299000,
    consumerPrice: 450000,
    agingPeriod: '1년',
    features: ['1.5L 대용량', '24병 한정', '희소성 프리미엄'],
    targetChannel: ['프리미엄 레스토랑', '특별 이벤트', '프리미엄 와인숍'],
    isNumbered: true,
    maxNumber: 24,
  },
];

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  ENTRY: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  MID: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
    gradient: 'from-sky-500/20 to-sky-500/5',
  },
  HIGH: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  ULTRA: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  MAGNUM: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    gradient: 'from-rose-500/20 to-rose-500/5',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount));
}

function formatCompact(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}천만`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}만`;
  }
  return amount.toLocaleString();
}

// ═══════════════════════════════════════════════════════════════════════════
// 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'gold',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  color?: 'gold' | 'emerald' | 'cyan' | 'purple' | 'rose';
}) {
  const colorClasses = {
    gold: 'bg-[#b7916e]/10 border-[#b7916e]/20 text-[#d4c4a8]',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl overflow-hidden border ${colorClasses[color]}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 opacity-60" />
          <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
        </div>
        <p
          className="text-2xl sm:text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-pretendard), 'Pretendard', -apple-system, sans-serif" }}
        >
          {value}
        </p>
        {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
      </div>
    </motion.div>
  );
}

function ProductCard({
  tier,
  adjustedQuantity,
  onQuantityChange,
  isExpanded,
  onToggle,
  actualCostPerBottle,
  editableValues,
  onEditableChange,
}: {
  tier: PricingTier;
  adjustedQuantity: number;
  onQuantityChange: (id: string, quantity: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
  actualCostPerBottle: number;
  editableValues: EditableTierValues;
  onEditableChange: (id: string, field: keyof EditableTierValues, value: number) => void;
}) {
  const colors = TIER_COLORS[tier.tier];
  const maxQuantity = editableValues.quantity;
  const b2bPrice = editableValues.b2bPrice;
  const consumerPrice = editableValues.consumerPrice;
  const revenue = adjustedQuantity * b2bPrice;
  const cost = adjustedQuantity * actualCostPerBottle;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const handleInputChange = (field: keyof EditableTierValues, value: string) => {
    const numValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
    onEditableChange(tier.id, field, numValue);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.gradient}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`p-2 sm:p-2.5 rounded-xl ${colors.bg} border ${colors.border}`}>
            <Wine className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                {tier.tier}
              </span>
              <span className="text-xs text-white/30">{tier.agingPeriod}</span>
            </div>
            <h3 className="text-sm sm:text-base font-medium text-white/90 mt-1">{tier.nameKo}</h3>
            <p className="text-xs text-white/40 italic">{tier.nameEn}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-lg font-semibold text-white/90" style={{ fontFamily: "var(--font-pretendard), sans-serif" }}>
              ₩{formatCurrency(b2bPrice)}
            </p>
            <p className="text-xs text-white/40">B2B 납품가</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
              {/* Editable Prices */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-[10px] text-white/40 mb-1">원가</p>
                  <p className="text-sm font-medium text-white/70">₩{formatCurrency(actualCostPerBottle)}</p>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl group">
                  <p className="text-[10px] text-white/40 mb-1">B2B가</p>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-white/40">₩</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(b2bPrice)}
                      onChange={(e) => handleInputChange('b2bPrice', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full pl-4 text-sm font-medium ${colors.text} bg-transparent border-b border-transparent focus:border-white/20 outline-none transition-colors`}
                    />
                  </div>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl group">
                  <p className="text-[10px] text-white/40 mb-1">소비자가</p>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-white/40">₩</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(consumerPrice)}
                      onChange={(e) => handleInputChange('consumerPrice', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-4 text-sm font-medium text-white/90 bg-transparent border-b border-transparent focus:border-white/20 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Max Quantity Input */}
              <div className="p-3 bg-white/[0.03] rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/40">총 재고량</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxQuantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-16 text-right text-sm font-medium ${colors.text} bg-transparent border-b border-transparent focus:border-white/20 outline-none transition-colors`}
                    />
                    <span className="text-sm text-white/40">병</span>
                  </div>
                </div>
              </div>

              {/* Quantity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">판매 수량</span>
                  <span className={`text-sm font-medium ${colors.text}`}>{adjustedQuantity}병 / {maxQuantity}병</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxQuantity}
                  value={Math.min(adjustedQuantity, maxQuantity)}
                  onChange={(e) => onQuantityChange(tier.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b7916e] [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
                    [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-black/30"
                />
              </div>

              {/* Calculations */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-[10px] text-white/40 mb-1">예상 매출</p>
                  <p className="text-base font-medium text-cyan-400">₩{formatCompact(revenue)}</p>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-[10px] text-white/40 mb-1">예상 이익</p>
                  <p className={`text-base font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₩{formatCompact(profit)}
                    <span className="text-xs ml-1 opacity-70">({margin.toFixed(1)}%)</span>
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5">
                {tier.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-white/50"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Target Channels */}
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Building2 className="w-3.5 h-3.5" />
                <span>{tier.targetChannel.join(' · ')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[85vh] bg-[#0d1421] border border-white/[0.08] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0d1421]/95 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#b7916e]/10 rounded-xl">
              <FileText className="w-5 h-5 text-[#b7916e]" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white/90">가격 전략 보고서</h2>
              <p className="text-xs text-white/40">버전 3.2 (Final) · 2026-01-30</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6 space-y-8">
          {/* Executive Summary */}
          <section>
            <h3 className="text-xl font-medium text-white/90 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#b7916e]" />
              Executive Summary
            </h3>
            <div className="p-5 bg-gradient-to-br from-[#b7916e]/10 to-transparent border border-[#b7916e]/20 rounded-xl">
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Muse de Marée는 세계 유일의 <span className="text-[#d4c4a8] font-medium">한국 남해 해저숙성 샴페인</span>으로,
                프랑스 Champagne Mignon-Boulard의 큐베를 한국 남해 30m 해저에서 6개월~2년간 숙성한 제품입니다.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white/[0.04] rounded-lg text-center">
                  <p className="text-xs text-white/40">총 B2B 매출</p>
                  <p className="text-lg font-medium text-emerald-400">₩104.9M</p>
                </div>
                <div className="p-3 bg-white/[0.04] rounded-lg text-center">
                  <p className="text-xs text-white/40">목표 달성률</p>
                  <p className="text-lg font-medium text-cyan-400">105%</p>
                </div>
                <div className="p-3 bg-white/[0.04] rounded-lg text-center">
                  <p className="text-xs text-white/40">총 수량</p>
                  <p className="text-lg font-medium text-white/90">474병</p>
                </div>
                <div className="p-3 bg-white/[0.04] rounded-lg text-center">
                  <p className="text-xs text-white/40">매출 총이익률</p>
                  <p className="text-lg font-medium text-purple-400">61.2%</p>
                </div>
              </div>
            </div>
          </section>

          {/* Product Lineup */}
          <section>
            <h3 className="text-xl font-medium text-white/90 mb-4 flex items-center gap-2">
              <Wine className="w-5 h-5 text-[#b7916e]" />
              제품 라인업
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-4 text-white/40 font-medium">제품</th>
                    <th className="text-center py-3 px-4 text-white/40 font-medium">숙성</th>
                    <th className="text-center py-3 px-4 text-white/40 font-medium">수량</th>
                    <th className="text-right py-3 px-4 text-white/40 font-medium">B2B가</th>
                    <th className="text-right py-3 px-4 text-white/40 font-medium">소비자가</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_TIERS.map((tier) => (
                    <tr key={tier.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${TIER_COLORS[tier.tier].bg} ${TIER_COLORS[tier.tier].text} mr-2`}>
                          {tier.tier}
                        </span>
                        <span className="text-white/80">{tier.nameKo}</span>
                      </td>
                      <td className="text-center py-3 px-4 text-white/60">{tier.agingPeriod}</td>
                      <td className="text-center py-3 px-4 text-white/60">{tier.quantity}병</td>
                      <td className="text-right py-3 px-4 text-[#d4c4a8]">₩{formatCurrency(tier.b2bPrice)}</td>
                      <td className="text-right py-3 px-4 text-white/80">₩{formatCurrency(tier.consumerPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Competitive Positioning */}
          <section>
            <h3 className="text-xl font-medium text-white/90 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#b7916e]" />
              경쟁 포지셔닝
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <h4 className="text-sm font-medium text-white/80 mb-3">vs Leclerc Briant Abyss</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>연간 생산량 <span className="text-emerald-400">7.4배 희소</span> (474병 vs 3,500병)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>숙성 옵션 다양성 (6개월~2년 선택)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>한국 남해 로컬 프리미엄 스토리</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <h4 className="text-sm font-medium text-white/80 mb-3">가격 포지셔닝</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-400">•</span>
                    <span>Entry ₩150K: Abyss의 <span className="text-sky-400">-50%</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>아톰 1년 ₩450K: Abyss보다 <span className="text-amber-400">+10% 프리미엄</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>아톰 2년 ₩900K: <span className="text-purple-400">Dom P2급</span> 컬렉터 와인</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* B2B Distribution Strategy */}
          <section>
            <h3 className="text-xl font-medium text-white/90 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#b7916e]" />
              B2B 유통 전략
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <h4 className="text-sm font-medium text-white/80 mb-2">호텔</h4>
                <p className="text-xs text-white/50 mb-2">채널 마진 26~33%</p>
                <p className="text-[10px] text-white/40">미니바, 룸서비스, 레스토랑</p>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <h4 className="text-sm font-medium text-white/80 mb-2">레스토랑</h4>
                <p className="text-xs text-white/50 mb-2">채널 마진 29~38%</p>
                <p className="text-[10px] text-white/40">와인 페어링, 특별 코스</p>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <h4 className="text-sm font-medium text-white/80 mb-2">와인숍</h4>
                <p className="text-xs text-white/50 mb-2">채널 마진 23~33%</p>
                <p className="text-[10px] text-white/40">컬렉터, VIP 고객</p>
              </div>
            </div>
          </section>

          {/* Key Metrics */}
          <section>
            <h3 className="text-xl font-medium text-white/90 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#b7916e]" />
              핵심 성과 지표
            </h3>
            <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-white/40 mb-1">총 B2B 매출</p>
                  <p className="text-xl font-medium text-emerald-400">₩104.9M</p>
                  <p className="text-[10px] text-white/30">목표 ₩100M의 105%</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">평균 B2B가</p>
                  <p className="text-xl font-medium text-cyan-400">₩221K</p>
                  <p className="text-[10px] text-white/30">목표 ₩211K 달성</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">매출 총이익률</p>
                  <p className="text-xl font-medium text-purple-400">61.2%</p>
                  <p className="text-[10px] text-white/30">목표 50%+ 초과</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

// 제품명 매핑 (cost-calculator nameKo -> pricing tier id)
const PRODUCT_NAME_MAP: Record<string, string> = {
  '앙 리유 쉬르 브뤼': 'entry',
  '엘레멘 드 쉬르프리즈 BDB': 'bdb',
  '아톰 크로슈 (1년)': 'atome-1y',
  '아톰 크로슈 (2년)': 'atome-2y',
  '앙 리유 쉬르 매그넘': 'magnum',
};

export default function PricingPage() {
  const [expandedCard, setExpandedCard] = useState<string | null>('entry');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    PRICING_TIERS.reduce((acc, tier) => ({ ...acc, [tier.id]: tier.quantity }), {})
  );

  // 수정 가능한 티어 값들
  const [editableValues, setEditableValues] = useState<Record<string, EditableTierValues>>(() =>
    PRICING_TIERS.reduce((acc, tier) => ({
      ...acc,
      [tier.id]: {
        quantity: tier.quantity,
        b2bPrice: tier.b2bPrice,
        consumerPrice: tier.consumerPrice,
      },
    }), {})
  );

  // DB 저장 상태
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [isPricingLoaded, setIsPricingLoaded] = useState(false);

  // Cost calculator 연동
  const [productCosts, setProductCosts] = useState<Record<string, number>>({});
  const [exchangeRate, setExchangeRate] = useState(1500);
  const [isCostLoading, setIsCostLoading] = useState(true);
  const [costSyncStatus, setCostSyncStatus] = useState<'loading' | 'synced' | 'offline'>('loading');

  // Cost calculator 상수
  const DEPRECIATION_YEARS = 4;
  const LOSS_RATE = 0.03;

  // Cost calculator에서 원가 데이터 불러오기 (최종 병당 원가 계산)
  useEffect(() => {
    const loadCostData = async () => {
      if (!isSupabaseConfigured()) {
        setCostSyncStatus('offline');
        setIsCostLoading(false);
        return;
      }

      try {
        const settings = await fetchCostCalculatorSettingsByYear(2026);
        if (settings?.champagneTypes && settings.champagneTypes.length > 0) {
          const rate = settings.exchangeRate || 1500;
          setExchangeRate(rate);

          // cost-calculator와 동일한 계산 로직
          const champagneTypes = settings.champagneTypes;
          const totalBottles = champagneTypes.reduce((sum, type) => sum + type.bottles, 0);

          if (totalBottles === 0) {
            setCostSyncStatus('offline');
            setIsCostLoading(false);
            return;
          }

          // 샴페인 총 원가 (KRW)
          const champagneTotalCostKrw = champagneTypes.reduce(
            (sum, type) => sum + type.bottles * (type.costPerBottle || 0) * rate,
            0
          );

          // 감가상각비
          const depreciation = (settings.structureCost || 0) / DEPRECIATION_YEARS;

          // 손실분 비용
          const lossCost = champagneTotalCostKrw * LOSS_RATE;

          // 비용 항목들
          const importCost = (settings.shippingCost || 0) + (settings.insuranceCost || 0) +
                            (settings.taxCost || 0) + (settings.customsFee || 0);
          const processingCost = depreciation + (settings.seaUsageFee || 0) +
                                (settings.aiMonitoringCost || 0) + lossCost + (settings.certificationCost || 0);
          const sellingCostWithoutPackaging = (settings.marketingCost || 0) + (settings.sgaCost || 0);

          // 각 제품별 최종 원가 계산
          const costs: Record<string, number> = {};
          champagneTypes.forEach((type) => {
            if (type.bottles === 0) return;

            const tierId = PRODUCT_NAME_MAP[type.name];
            if (!tierId) return;

            const typeRatio = type.bottles / totalBottles;
            const typeChampagneCostKrw = type.bottles * (type.costPerBottle || 0) * rate;
            const typePackagingCost = type.packagingCost || 0;
            const typeTotalCost = typeChampagneCostKrw + typePackagingCost +
                                  (importCost + processingCost + sellingCostWithoutPackaging) * typeRatio;
            const typeSellableBottles = Math.floor(type.bottles * (1 - LOSS_RATE));
            const typeCostPerBottleKrw = typeSellableBottles > 0 ? typeTotalCost / typeSellableBottles : 0;

            costs[tierId] = typeCostPerBottleKrw;
          });

          setProductCosts(costs);
          setCostSyncStatus('synced');
        } else {
          setCostSyncStatus('offline');
        }
      } catch (error) {
        console.error('Failed to load cost data:', error);
        setCostSyncStatus('offline');
      } finally {
        setIsCostLoading(false);
      }
    };

    loadCostData();
  }, []);

  // 저장된 가격 설정 불러오기
  useEffect(() => {
    const loadPricingSettings = async () => {
      if (!isSupabaseConfigured()) {
        setIsPricingLoaded(true);
        return;
      }

      try {
        const settings = await fetchPricingSettings(2026);
        if (settings && settings.length > 0) {
          const loadedValues: Record<string, EditableTierValues> = {};
          const loadedQuantities: Record<string, number> = {};

          settings.forEach((setting) => {
            loadedValues[setting.tierId] = {
              quantity: setting.quantity,
              b2bPrice: setting.b2bPrice,
              consumerPrice: setting.consumerPrice,
            };
            loadedQuantities[setting.tierId] = setting.quantity;
          });

          // 기존 기본값과 병합 (저장되지 않은 티어는 기본값 유지)
          setEditableValues((prev) => ({ ...prev, ...loadedValues }));
          setQuantities((prev) => {
            const merged = { ...prev };
            Object.keys(loadedQuantities).forEach((id) => {
              merged[id] = Math.min(prev[id] || loadedQuantities[id], loadedQuantities[id]);
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('Failed to load pricing settings:', error);
      } finally {
        setIsPricingLoaded(true);
      }
    };

    loadPricingSettings();
  }, []);

  // 원가 가져오기 (DB 값 우선, 없으면 기본값)
  const getCostPerBottle = useCallback((tierId: string, defaultCost: number) => {
    return productCosts[tierId] || defaultCost;
  }, [productCosts]);

  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [id]: quantity }));
  }, []);

  const handleEditableChange = useCallback((id: string, field: keyof EditableTierValues, value: number) => {
    setEditableValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    // 수량이 변경되면 판매 수량도 조정
    if (field === 'quantity') {
      setQuantities((prev) => ({
        ...prev,
        [id]: Math.min(prev[id], value),
      }));
    }
    setHasChanges(true);
    setSaveStatus('idle');
  }, []);

  // DB에 저장
  const handleSave = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      toast.error('DB 연결이 설정되지 않았습니다');
      return;
    }

    setSaveStatus('saving');
    try {
      const success = await upsertPricingSettings(2026, editableValues);
      if (success) {
        setSaveStatus('saved');
        setHasChanges(false);
        toast.success('가격 설정이 저장되었습니다');
        // 3초 후 상태 초기화
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        toast.error('저장에 실패했습니다');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      toast.error('저장 중 오류가 발생했습니다');
    }
  }, [editableValues]);

  const calculations = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalQuantity = 0;
    let totalMaxQuantity = 0;

    PRICING_TIERS.forEach((tier) => {
      const qty = quantities[tier.id] || 0;
      const cost = getCostPerBottle(tier.id, tier.costPerBottle);
      const tierValues = editableValues[tier.id];
      const b2bPrice = tierValues?.b2bPrice || tier.b2bPrice;
      const maxQty = tierValues?.quantity || tier.quantity;
      totalRevenue += qty * b2bPrice;
      totalCost += qty * cost;
      totalQuantity += qty;
      totalMaxQuantity += maxQty;
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const sellRate = totalMaxQuantity > 0 ? (totalQuantity / totalMaxQuantity) * 100 : 0;
    const targetRevenue = 100000000; // 1억
    const targetAchievement = (totalRevenue / targetRevenue) * 100;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      totalQuantity,
      totalMaxQuantity,
      sellRate,
      targetAchievement,
    };
  }, [quantities, getCostPerBottle, editableValues]);

  const resetQuantities = () => {
    setQuantities(PRICING_TIERS.reduce((acc, tier) => ({ ...acc, [tier.id]: tier.quantity }), {}));
    setEditableValues(PRICING_TIERS.reduce((acc, tier) => ({
      ...acc,
      [tier.id]: {
        quantity: tier.quantity,
        b2bPrice: tier.b2bPrice,
        consumerPrice: tier.consumerPrice,
      },
    }), {}));
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139, 92, 246, 0.08), transparent),
                              radial-gradient(ellipse 50% 30% at 20% 60%, rgba(6, 182, 212, 0.06), transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-4 sm:pt-10 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-4 sm:mb-6"
          >
            <Link
              href="/budget"
              className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all group"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-[#b7916e]/60" />
              <span>예산관리</span>
            </Link>
            <button
              onClick={() => setIsReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-purple-400/80 hover:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>보고서 보기</span>
            </button>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="p-2 sm:p-2.5 bg-[#b7916e]/10 border border-[#b7916e]/20 rounded-xl">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#b7916e]" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">Sales Strategy</p>
                    <h1
                      className="text-2xl sm:text-4xl text-white/95 tracking-tight"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      Pricing Strategy
                    </h1>
                  </div>
                </div>
                <p className="text-white/40 text-sm max-w-md hidden sm:block">
                  474병 첫 빈티지 판매 전략 시뮬레이터
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* 원가 연동 상태 */}
                <Link
                  href="/cost-calculator"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                    costSyncStatus === 'synced'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                      : costSyncStatus === 'loading'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                      : 'text-white/40 bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
                  }`}
                >
                  {costSyncStatus === 'loading' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : costSyncStatus === 'synced' ? (
                    <Calculator className="w-3 h-3" />
                  ) : (
                    <Calculator className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">
                    {costSyncStatus === 'synced' ? '원가 연동됨' : costSyncStatus === 'loading' ? '로딩...' : '원가 미연동'}
                  </span>
                </Link>
                {/* 저장 버튼 */}
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || !hasChanges}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    saveStatus === 'saved'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : saveStatus === 'saving'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                      : hasChanges
                      ? 'text-[#b7916e] bg-[#b7916e]/10 border-[#b7916e]/20 hover:bg-[#b7916e]/20'
                      : 'text-white/30 bg-white/[0.02] border-white/[0.04] cursor-not-allowed'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : saveStatus === 'saved' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">
                    {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장됨' : '저장'}
                  </span>
                </button>
                <button
                  onClick={resetQuantities}
                  className="px-3 py-1.5 text-xs text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all"
                >
                  초기화
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={DollarSign}
              label="예상 매출"
              value={`₩${formatCompact(calculations.totalRevenue)}`}
              subValue={`목표 달성 ${calculations.targetAchievement.toFixed(0)}%`}
              color={calculations.targetAchievement >= 100 ? 'emerald' : 'cyan'}
            />
            <StatCard
              icon={TrendingUp}
              label="예상 이익"
              value={`₩${formatCompact(calculations.totalProfit)}`}
              subValue={`마진 ${calculations.profitMargin.toFixed(1)}%`}
              color="emerald"
            />
            <StatCard
              icon={Package}
              label="판매 수량"
              value={`${calculations.totalQuantity}병`}
              subValue={`${calculations.totalMaxQuantity}병 중 ${calculations.sellRate.toFixed(0)}%`}
              color="purple"
            />
            <StatCard
              icon={Calculator}
              label="총 원가"
              value={`₩${formatCompact(calculations.totalCost)}`}
              color="rose"
            />
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#b7916e]" />
                <span className="text-sm text-white/60">매출 목표 달성률</span>
              </div>
              <span className="text-sm font-medium text-white/80">
                ₩{formatCompact(calculations.totalRevenue)} / ₩1억
              </span>
            </div>
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(calculations.targetAchievement, 100)}%` }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`h-full rounded-full ${
                  calculations.targetAchievement >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : calculations.targetAchievement >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-[#b7916e] to-[#d4c4a8]'
                }`}
              />
            </div>
            {calculations.targetAchievement >= 100 && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                목표 달성! 초과 매출 ₩{formatCompact(calculations.totalRevenue - 100000000)}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Product Cards */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Wine className="w-5 h-5 text-[#b7916e]" />
            <h2 className="text-lg font-medium text-white/90">제품별 판매 설정</h2>
          </div>
          <div className="space-y-3">
            {PRICING_TIERS.map((tier) => (
              <ProductCard
                key={tier.id}
                tier={tier}
                adjustedQuantity={quantities[tier.id] || 0}
                onQuantityChange={handleQuantityChange}
                isExpanded={expandedCard === tier.id}
                onToggle={() => setExpandedCard(expandedCard === tier.id ? null : tier.id)}
                actualCostPerBottle={getCostPerBottle(tier.id, tier.costPerBottle)}
                editableValues={editableValues[tier.id] || { quantity: tier.quantity, b2bPrice: tier.b2bPrice, consumerPrice: tier.consumerPrice }}
                onEditableChange={handleEditableChange}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Breakdown */}
      <section className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-5 sm:p-6 bg-gradient-to-br from-[#b7916e]/10 to-transparent border border-[#b7916e]/20 rounded-2xl">
            <h3 className="text-lg font-medium text-white/90 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#b7916e]" />
              티어별 매출 구성
            </h3>
            <div className="space-y-3">
              {PRICING_TIERS.map((tier) => {
                const qty = quantities[tier.id] || 0;
                const tierValues = editableValues[tier.id];
                const b2bPrice = tierValues?.b2bPrice || tier.b2bPrice;
                const revenue = qty * b2bPrice;
                const percentage =
                  calculations.totalRevenue > 0 ? (revenue / calculations.totalRevenue) * 100 : 0;
                const colors = TIER_COLORS[tier.tier];

                return (
                  <div key={tier.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{tier.nameKo}</span>
                      <span className="text-white/50">
                        ₩{formatCompact(revenue)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full bg-gradient-to-r ${colors.gradient.replace('to-', 'to-').replace('/5', '/60')}`}
                        style={{
                          background: `linear-gradient(to right, ${
                            tier.tier === 'ENTRY'
                              ? '#10b981'
                              : tier.tier === 'MID'
                              ? '#0ea5e9'
                              : tier.tier === 'HIGH'
                              ? '#f59e0b'
                              : tier.tier === 'ULTRA'
                              ? '#a855f7'
                              : '#f43f5e'
                          }, ${
                            tier.tier === 'ENTRY'
                              ? '#34d399'
                              : tier.tier === 'MID'
                              ? '#38bdf8'
                              : tier.tier === 'HIGH'
                              ? '#fbbf24'
                              : tier.tier === 'ULTRA'
                              ? '#c084fc'
                              : '#fb7185'
                          })`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportOpen && <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
