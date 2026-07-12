'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Layers,
  Target,
  Gauge,
  Anchor,
  Cloud,
  CloudOff,
  Loader2,
  Info,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useBudgetStore } from '@/lib/store/budget-store';
import { useInventoryStore } from '@/lib/store/inventory-store';
import { fetchCostCalculatorSettingsByYear } from '@/lib/supabase/database';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// 상수 — 제품 정의 (2026 라인업)
// 원가계산기(cost-calculator)·판매가(pricing)와 동일한 매핑을 사용한다.
// ═══════════════════════════════════════════════════════════════════════════

interface ProfitTier {
  id: string;
  nameKo: string;
  costName: string; // 원가계산기 champagneType.name (nameKo)
  productId: string; // inventory product id (판매수량 조회용)
  b2bPrice: number; // B2B 공급가액 (부가세 별도)
  consumerPrice: number; // 소비자가 (참고용)
  fallbackCost: number; // 원가계산기 오프라인 시 병당 변동원가 대체값
  defaultQuantity: number;
}

const PROFIT_TIERS: ProfitTier[] = [
  { id: 'entry', nameKo: '앙 리유 쉬르 브뤼', costName: '앙 리유 쉬르 브뤼', productId: 'en_lieu_sur_brut', b2bPrice: 99000, consumerPrice: 150000, fallbackCost: 78811, defaultQuantity: 200 },
  { id: 'bdb', nameKo: '엘레멘 드 쉬르프리즈 BDB', costName: '엘레멘 드 쉬르프리즈 BDB', productId: 'element_de_surprise', b2bPrice: 219000, consumerPrice: 320000, fallbackCost: 87346, defaultQuantity: 110 },
  { id: 'atome-1y', nameKo: '아톰 크로슈 (1년)', costName: '아톰 크로슈 (1년)', productId: 'atomes_crochus_1y', b2bPrice: 299000, consumerPrice: 450000, fallbackCost: 90855, defaultQuantity: 100 },
  { id: 'atome-2y', nameKo: '아톰 크로슈 (2년)', costName: '아톰 크로슈 (2년)', productId: 'atomes_crochus_2y', b2bPrice: 599000, consumerPrice: 900000, fallbackCost: 90855, defaultQuantity: 40 },
  { id: 'magnum', nameKo: '앙 리유 쉬르 매그넘', costName: '앙 리유 쉬르 매그넘', productId: 'en_lieu_sur_magnum', b2bPrice: 299000, consumerPrice: 450000, fallbackCost: 109631, defaultQuantity: 24 },
];

// 원가계산기 고정 상수 (cost-calculator/page.tsx와 동일)
const DEPRECIATION_YEARS = 4;
const LOSS_RATE = 0.03;

// ═══════════════════════════════════════════════════════════════════════════
// 유틸
// ═══════════════════════════════════════════════════════════════════════════

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount));
}

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1)}억`;
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}천만`;
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(0)}만`;
  return `${sign}${abs.toLocaleString()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 로컬 설정 (목표마진 · 제품별 목표수량/공급가 오버라이드) — localStorage 영속
// ═══════════════════════════════════════════════════════════════════════════

interface TierOverride {
  b2bPrice?: number;
  targetQty?: number;
}

type PnLMode = 'actual' | 'target';

interface ProfitSettings {
  targetMarginPct: number; // 손익분기 위에 가산할 목표 마진율 (%)
  overrides: Record<string, TierOverride>; // tierId -> override
  pnlMode: PnLMode; // 손익 밴드 기준: 실적(판매분) vs 목표(목표수량 다 팔 때)
}

const DEFAULT_SETTINGS: ProfitSettings = { targetMarginPct: 25, overrides: {}, pnlMode: 'actual' };

function loadSettings(year: number): ProfitSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(`muse-profit-settings-${year}`);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      targetMarginPct: typeof parsed.targetMarginPct === 'number' ? parsed.targetMarginPct : 25,
      overrides: parsed.overrides || {},
      pnlMode: parsed.pnlMode === 'target' ? 'target' : 'actual',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 하위 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

function PnLCard({
  label,
  value,
  suffix = '원',
  tone = 'neutral',
  hint,
  large = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'gold';
  hint?: string;
  large?: boolean;
}) {
  const toneColor =
    tone === 'positive'
      ? 'text-emerald-400'
      : tone === 'negative'
      ? 'text-rose-400'
      : tone === 'gold'
      ? 'text-[#d4c4a8]'
      : 'text-white/90';

  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl overflow-hidden ${large ? 'sm:col-span-2' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
      <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
      <div className="relative p-3 sm:p-5">
        <p className="text-[10px] sm:text-xs text-white/40 mb-1.5 sm:mb-2">{label}</p>
        <p
          className={`${large ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-2xl'} ${toneColor} tracking-tight`}
        >
          {value}
          <span className="text-xs sm:text-sm text-white/30"> {suffix}</span>
        </p>
        {hint && <p className="text-[9px] sm:text-[11px] text-white/30 mt-1">{hint}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인
// ═══════════════════════════════════════════════════════════════════════════

export default function ProfitDashboard({ year }: { year: number }) {
  // 고정비(실집행 지출) — budget 스토어
  const { getTotalExpense } = useBudgetStore(
    useShallow((s) => ({ getTotalExpense: s.getTotalExpense }))
  );
  const fixedCost = getTotalExpense(year);

  // 판매수량 — inventory 스토어
  const { initializeInventory, getProductSummary, isInitialized } = useInventoryStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isInitialized) initializeInventory();
  }, [isInitialized, initializeInventory]);

  // 원가계산기 → 병당 변동원가 (마케팅/판관비 제외)
  const [variableCostByTier, setVariableCostByTier] = useState<Record<string, number>>({});
  const [costStatus, setCostStatus] = useState<'loading' | 'synced' | 'offline'>('loading');

  const loadCostData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setCostStatus('offline');
      return;
    }
    try {
      const settings = await fetchCostCalculatorSettingsByYear(year);
      if (!settings?.champagneTypes || settings.champagneTypes.length === 0) {
        setCostStatus('offline');
        return;
      }
      const rate = settings.exchangeRate || 1500;
      const types = settings.champagneTypes;
      const totalCostKrw = types.reduce(
        (sum, t) => sum + t.bottles * (t.costPerBottle || 0) * rate,
        0
      );
      if (totalCostKrw === 0) {
        setCostStatus('offline');
        return;
      }
      // 변동원가에 들어가는 공유비용 = 수입비용 + 가공원가 (마케팅/판관비는 고정비이므로 제외)
      const depreciation = (settings.structureCost || 0) / DEPRECIATION_YEARS;
      const lossCost = totalCostKrw * LOSS_RATE;
      const importCost =
        (settings.shippingCost || 0) +
        (settings.insuranceCost || 0) +
        (settings.taxCost || 0) +
        (settings.customsFee || 0);
      const processingCost =
        depreciation +
        (settings.seaUsageFee || 0) +
        (settings.aiMonitoringCost || 0) +
        lossCost +
        (settings.certificationCost || 0);
      const sharedVariable = importCost + processingCost;

      const costs: Record<string, number> = {};
      types.forEach((t) => {
        if (t.bottles === 0) return;
        const tier = PROFIT_TIERS.find((pt) => pt.costName === t.name);
        if (!tier) return;
        const typeProductCostKrw = t.bottles * (t.costPerBottle || 0) * rate;
        const amountRatio = totalCostKrw > 0 ? typeProductCostKrw / totalCostKrw : 0;
        const allocatedShared = sharedVariable * amountRatio;
        const sharedPerBottle = allocatedShared / t.bottles;
        const packagingPerBottle = (t.packagingCost || 0) / t.bottles;
        costs[tier.id] = (t.costPerBottle || 0) * rate + sharedPerBottle + packagingPerBottle;
      });
      setVariableCostByTier(costs);
      setCostStatus('synced');
    } catch (error) {
      logger.error('ProfitDashboard: 원가 로드 실패', error);
      setCostStatus('offline');
    }
  }, [year]);

  useEffect(() => {
    setCostStatus('loading');
    loadCostData();
  }, [loadCostData]);

  // 설정 (목표마진 · 오버라이드)
  const [settings, setSettings] = useState<ProfitSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setSettings(loadSettings(year));
  }, [year]);

  const persist = useCallback(
    (next: ProfitSettings) => {
      setSettings(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`muse-profit-settings-${year}`, JSON.stringify(next));
      }
    },
    [year]
  );

  const setMargin = (pct: number) => persist({ ...settings, targetMarginPct: pct });
  const setPnlMode = (mode: PnLMode) => persist({ ...settings, pnlMode: mode });
  const setOverride = (tierId: string, patch: TierOverride) =>
    persist({
      ...settings,
      overrides: { ...settings.overrides, [tierId]: { ...settings.overrides[tierId], ...patch } },
    });

  // 제품별 계산
  const rows = useMemo(() => {
    const marginMultiplier = 1 + settings.targetMarginPct / 100;

    // 목표매출 합계 (고정비 배분 기준)
    const withTarget = PROFIT_TIERS.map((tier) => {
      const ov = settings.overrides[tier.id] || {};
      const b2bPrice = ov.b2bPrice ?? tier.b2bPrice;
      const summary = mounted && isInitialized ? getProductSummary(tier.productId) : null;
      const stockTotal = summary?.total ?? 0;
      const sold = summary?.sold ?? 0;
      const targetQty = ov.targetQty ?? (stockTotal > 0 ? stockTotal : tier.defaultQuantity);
      return { tier, b2bPrice, sold, stockTotal, targetQty };
    });

    const totalTargetRevenue = withTarget.reduce((s, r) => s + r.targetQty * r.b2bPrice, 0);

    return withTarget.map((r) => {
      const varCost = variableCostByTier[r.tier.id] ?? r.tier.fallbackCost;
      const contributionPerBottle = r.b2bPrice - varCost;

      // 고정비 배분 = 전사 고정비 × 목표매출 비중
      const revenueShare = totalTargetRevenue > 0 ? (r.targetQty * r.b2bPrice) / totalTargetRevenue : 0;
      const allocatedFixed = fixedCost * revenueShare;
      const allocatedFixedPerBottle = r.targetQty > 0 ? allocatedFixed / r.targetQty : 0;

      // 손익분기 공급가 = 병당 변동원가 + 병당 배분 고정비
      const breakEvenPrice = varCost + allocatedFixedPerBottle;
      // 권장 공급가 = 손익분기 위에 목표마진 가산
      const recommendedPrice = breakEvenPrice * marginMultiplier;

      // 손익분기 병수 = 배분 고정비 ÷ 병당 공헌이익 (현재 공급가 기준)
      const breakEvenBottles =
        contributionPerBottle > 0 ? allocatedFixed / contributionPerBottle : Infinity;

      // 실적 (판매수량 기준)
      const actualRevenue = r.sold * r.b2bPrice;
      const actualVarCost = r.sold * varCost;
      const actualContribution = actualRevenue - actualVarCost;

      // 목표 (목표수량 다 팔았을 때)
      const targetRevenue = r.targetQty * r.b2bPrice;
      const targetVarCost = r.targetQty * varCost;
      const targetContribution = targetRevenue - targetVarCost;

      // 현재 공급가 마진 (변동원가 대비, 고정비 배분 전)
      const grossMarginPct = r.b2bPrice > 0 ? (contributionPerBottle / r.b2bPrice) * 100 : 0;

      // 채널 흡수 이득 = 소비자가(참고) − B2B 공급가 (전통 유통이면 도소매가 가져갈 몫)
      const consumerPrice = r.tier.consumerPrice;
      const channelAbsorb = Math.max(0, consumerPrice - r.b2bPrice);

      return {
        ...r,
        varCost,
        contributionPerBottle,
        breakEvenPrice,
        recommendedPrice,
        breakEvenBottles,
        actualRevenue,
        actualVarCost,
        actualContribution,
        targetRevenue,
        targetVarCost,
        targetContribution,
        grossMarginPct,
        allocatedFixed,
        consumerPrice,
        channelAbsorb,
      };
    });
  }, [settings, variableCostByTier, fixedCost, mounted, isInitialized, getProductSummary]);

  // 전사 합계 — 실적/목표 모드에 따라 판매수량 vs 목표수량 사용
  const totals = useMemo(() => {
    const useTarget = settings.pnlMode === 'target';
    const revenue = rows.reduce((s, r) => s + (useTarget ? r.targetRevenue : r.actualRevenue), 0);
    const varCost = rows.reduce((s, r) => s + (useTarget ? r.targetVarCost : r.actualVarCost), 0);
    const contribution = revenue - varCost;
    const netProfit = contribution - fixedCost;
    const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    return { revenue, varCost, contribution, netProfit, netMarginPct };
  }, [rows, fixedCost, settings.pnlMode]);

  const activeRows = rows.filter((r) => r.targetQty > 0 || r.sold > 0);
  const isTarget = settings.pnlMode === 'target';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── 섹션 헤더 + 원가 동기화 상태 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#b7916e]/10 border border-[#b7916e]/20">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#b7916e]" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-medium text-white/90">손익 · 권장가</h2>
            <p className="text-[10px] sm:text-xs text-white/40">
              B2B 공급가액 기준 (부가세 별도) · 손익분기 우선
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs ${
            costStatus === 'synced'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
              : costStatus === 'loading'
              ? 'bg-white/[0.04] border-white/[0.08] text-cyan-400'
              : 'bg-white/[0.04] border-white/[0.08] text-white/40'
          }`}
        >
          {costStatus === 'loading' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> 원가 로딩
            </>
          ) : costStatus === 'synced' ? (
            <>
              <Cloud className="w-3 h-3" /> 원가계산기 연동
            </>
          ) : (
            <>
              <CloudOff className="w-3 h-3" /> 기본 원가값
            </>
          )}
        </div>
      </div>

      {/* ── 실적/목표 토글 ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          {([
            { id: 'actual', label: '실적' },
            { id: 'target', label: '목표' },
          ] as { id: PnLMode; label: string }[]).map((m) => (
            <button
              key={m.id}
              onClick={() => setPnlMode(m.id)}
              className={`px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                settings.pnlMode === m.id
                  ? 'bg-[#b7916e] text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] sm:text-xs text-white/40 text-right">
          {isTarget ? '목표수량을 다 팔았을 때의 예상 손익' : '실제 판매·지출 기준 손익'}
        </span>
      </div>

      {/* ── ① 손익 요약 밴드 ── */}
      <motion.div
        key={settings.pnlMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3"
      >
        <PnLCard
          label={isTarget ? '예상매출 (목표)' : '실매출 (판매분)'}
          value={formatCompact(totals.revenue)}
          tone="gold"
          hint={isTarget ? '목표수량 × 공급가' : '판매수량 × 공급가'}
        />
        <PnLCard
          label="변동원가"
          value={formatCompact(totals.varCost)}
          tone="neutral"
          hint={isTarget ? '목표수량 × 병당원가' : '판매수량 × 병당원가'}
        />
        <PnLCard label="공헌이익" value={formatCompact(totals.contribution)} tone={totals.contribution >= 0 ? 'positive' : 'negative'} hint="매출 − 변동원가" />
        <PnLCard label="고정비 (실집행)" value={formatCompact(fixedCost)} tone="negative" hint="연간 실지출 총액" />
        <PnLCard
          label={isTarget ? '예상순익 (목표)' : '순익'}
          value={formatCompact(totals.netProfit)}
          tone={totals.netProfit >= 0 ? 'positive' : 'negative'}
          hint="공헌이익 − 고정비"
          large
        />
      </motion.div>
      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/40 -mt-3">
        <Info className="w-3 h-3 shrink-0" />
        <span>
          순익률 {totals.netMarginPct.toFixed(1)}% · 부가세는 pass-through(매입세액공제)라 손익에서 제외 · 고정비는 아래 실집행 지출에서 자동 반영
        </span>
      </div>

      {/* ── 목표마진 슬라이더 ── */}
      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/[0.08] to-transparent" />
        <div className="absolute inset-0 border border-[#b7916e]/20 rounded-xl sm:rounded-2xl" />
        <div className="relative p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#b7916e]" />
              <span className="text-xs sm:text-sm text-white/70">목표 마진 (손익분기 위 가산)</span>
            </div>
            <span
              className="text-lg sm:text-2xl text-[#d4c4a8]"
                         >
              {settings.targetMarginPct}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={settings.targetMarginPct}
            onChange={(e) => setMargin(parseInt(e.target.value, 10))}
            className="w-full accent-[#b7916e] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] sm:text-[10px] text-white/30 mt-1">
            <span>0% (손익분기)</span>
            <span>30%</span>
            <span>60%</span>
          </div>
        </div>
      </div>

      {/* ── ② 제품별 권장가 역산 ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Layers className="w-4 h-4 text-white/50" />
          <h3 className="text-sm sm:text-base font-medium text-white/80">제품별 권장 공급가</h3>
        </div>
        {activeRows.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">
            제품 데이터가 없습니다. 재고를 등록하면 자동 반영됩니다.
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {activeRows.map((r) => {
              const belowBreakEven = r.b2bPrice < r.breakEvenPrice;
              const modeQty = isTarget ? r.targetQty : r.sold;
              const marginAmount = isTarget ? r.targetContribution : r.actualContribution;
              const marginPositive = r.contributionPerBottle >= 0;
              return (
                <motion.div
                  key={r.tier.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-xl sm:rounded-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-white/[0.06] rounded-xl sm:rounded-2xl" />
                  <div className="relative p-3 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#b7916e] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-medium text-white/90 truncate">{r.tier.nameKo}</p>
                          <p className="text-[10px] sm:text-xs text-white/40">
                            재고 {formatKRW(r.stockTotal)}병 · 판매 {formatKRW(r.sold)}병
                          </p>
                        </div>
                      </div>
                      {/* 권장 공급가 */}
                      <div className="text-right shrink-0">
                        <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider">권장 공급가</p>
                        <p
                          className="text-lg sm:text-2xl text-[#d4c4a8]"
                                                 >
                          {formatKRW(r.recommendedPrice)}
                          <span className="text-[10px] sm:text-xs text-white/30"> 원</span>
                        </p>
                      </div>
                    </div>

                    {/* 가격 사슬: 변동원가 → 손익분기 → 권장가 */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-xs mb-3">
                      <span className="px-2 py-1 rounded-lg bg-white/[0.04] text-white/60">
                        변동원가 {formatKRW(r.varCost)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/20" />
                      <span className="px-2 py-1 rounded-lg bg-white/[0.04] text-white/60">
                        손익분기 {formatKRW(r.breakEvenPrice)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/20" />
                      <span className="px-2 py-1 rounded-lg bg-[#b7916e]/15 text-[#d4c4a8]">
                        권장 {formatKRW(r.recommendedPrice)}
                      </span>
                    </div>

                    {/* 총 판매금액 = 공급가 × 수량 (모드별) */}
                    <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-[#b7916e]/[0.08] border border-[#b7916e]/15">
                      <span className="text-[10px] sm:text-xs text-white/50">
                        {isTarget ? '예상 판매금액' : '판매금액'} · 공급가 {formatKRW(r.b2bPrice)} × {formatKRW(isTarget ? r.targetQty : r.sold)}병
                      </span>
                      <span className="text-sm sm:text-lg text-[#d4c4a8] tabular-nums">
                        {formatKRW(isTarget ? r.targetRevenue : r.actualRevenue)}
                        <span className="text-[10px] text-white/30"> 원</span>
                      </span>
                    </div>

                    {/* 편집 가능한 현재 공급가 · 목표수량 */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <label className="block">
                        <span className="text-[10px] sm:text-xs text-white/40">현재 공급가 (원)</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatKRW(r.b2bPrice)}
                          onChange={(e) => {
                            const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                            setOverride(r.tier.id, { b2bPrice: num });
                          }}
                          className={`w-full mt-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/[0.04] border rounded-lg text-sm text-right text-white focus:outline-none transition-colors ${
                            belowBreakEven ? 'border-rose-500/40 focus:border-rose-500/60' : 'border-white/[0.08] focus:border-[#b7916e]/50'
                          }`}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] sm:text-xs text-white/40">목표 판매수량 (병)</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatKRW(r.targetQty)}
                          onChange={(e) => {
                            const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                            setOverride(r.tier.id, { targetQty: num });
                          }}
                          className="w-full mt-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-right text-white focus:outline-none focus:border-[#b7916e]/50 transition-colors"
                        />
                      </label>
                    </div>

                    {/* 마진율 · 마진액 (크게) */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className={`p-2.5 sm:p-3 rounded-lg border ${marginPositive ? 'bg-emerald-500/[0.08] border-emerald-500/15' : 'bg-rose-500/[0.08] border-rose-500/20'}`}>
                        <p className="text-[10px] sm:text-xs text-white/40">현재 마진율</p>
                        <p className={`text-xl sm:text-2xl ${marginPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {r.grossMarginPct.toFixed(1)}
                          <span className="text-xs sm:text-sm"> %</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-white/30">병당 마진 {formatKRW(r.contributionPerBottle)}원</p>
                      </div>
                      <div className={`p-2.5 sm:p-3 rounded-lg border ${marginPositive ? 'bg-emerald-500/[0.08] border-emerald-500/15' : 'bg-rose-500/[0.08] border-rose-500/20'}`}>
                        <p className="text-[10px] sm:text-xs text-white/40">{isTarget ? '예상 마진액' : '실제 마진액'}</p>
                        <p className={`text-xl sm:text-2xl ${marginAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatKRW(marginAmount)}
                          <span className="text-xs sm:text-sm"> 원</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-white/30">{formatKRW(modeQty)}병 기준 (매출 − 변동원가)</p>
                      </div>
                    </div>

                    {/* 손익분기 경고 */}
                    {belowBreakEven && (
                      <p className="mt-2 text-[10px] sm:text-xs text-rose-400">
                        ⚠ 현재가가 손익분기보다 {formatKRW(r.breakEvenPrice - r.b2bPrice)}원 낮음 (고정비 배분 포함)
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ③ 손익분기 게이지 ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Gauge className="w-4 h-4 text-white/50" />
          <h3 className="text-sm sm:text-base font-medium text-white/80">손익분기 진행</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {activeRows.map((r) => {
            const finite = Number.isFinite(r.breakEvenBottles);
            const pct = finite && r.breakEvenBottles > 0 ? Math.min((r.sold / r.breakEvenBottles) * 100, 100) : 0;
            const cleared = finite && r.sold >= r.breakEvenBottles;
            const remaining = finite ? Math.max(0, Math.ceil(r.breakEvenBottles - r.sold)) : Infinity;
            return (
              <div key={r.tier.id} className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.02]" />
                <div className="absolute inset-0 border border-white/[0.06] rounded-xl" />
                <div className="relative p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm text-white/70 truncate">{r.tier.nameKo}</p>
                    <p className={`text-[10px] sm:text-xs ${cleared ? 'text-emerald-400' : 'text-white/50'}`}>
                      {!finite
                        ? '공급가 ≤ 원가'
                        : cleared
                        ? `흑자전환 (BEP ${formatKRW(r.breakEvenBottles)}병 돌파)`
                        : `${formatKRW(remaining)}병 더 팔면 흑자`}
                    </p>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={`h-full rounded-full ${cleared ? 'bg-emerald-500' : 'bg-[#b7916e]'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] sm:text-[10px] text-white/30 mt-1">
                    <span>판매 {formatKRW(r.sold)}병</span>
                    <span>BEP {finite ? `${formatKRW(r.breakEvenBottles)}병` : '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ④ 자사유통 흡수 이득 ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Anchor className="w-4 h-4 text-white/50" />
          <h3 className="text-sm sm:text-base font-medium text-white/80">자사유통 흡수 이득</h3>
        </div>
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] to-transparent" />
          <div className="absolute inset-0 border border-cyan-500/15 rounded-xl sm:rounded-2xl" />
          <div className="relative p-3 sm:p-5">
            <div className="flex items-start gap-2 mb-3">
              <Coins className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-white/50 leading-relaxed">
                전통 유통(수입사→도매→소매)이라면 소비자가와 B2B 공급가의 차액을 중간 채널이 가져갑니다.
                뮤즈드마레는 수입사+생산자를 겸하므로 이 몫을 직접 흡수할 수 있습니다. (소비자가는 참고 기준값)
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {activeRows.map((r) => (
                <div key={r.tier.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-white/80 truncate">{r.tier.nameKo}</p>
                    <p className="text-[9px] sm:text-[10px] text-white/40">
                      소비자 {formatKRW(r.consumerPrice)} · B2B {formatKRW(r.b2bPrice)}
                    </p>
                  </div>
                  <p className="text-sm sm:text-base text-cyan-400 shrink-0" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    +{formatCompact(r.channelAbsorb)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
