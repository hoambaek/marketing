'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
} from 'recharts';
import {
  Anchor,
  Wine,
  Brain,
  Plus,
  X,
  Trash2,
  Pencil,
  Loader2,
  AlertTriangle,
  Settings2,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Database,
  Gauge,
  ShieldAlert,
  Save,
  BarChart3,
} from 'lucide-react';
import { useUAPSStore } from '@/lib/store/uaps-store';
import type {
  AgingProduct,
  AgingPrediction,
  ProductInput,
  WineType,
  ReductionPotential,
} from '@/lib/types/uaps';
import {
  WINE_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
  REDUCTION_POTENTIAL_LABELS,
  MODEL_STATUS_LABELS,
  FLAVOR_AXES,
} from '@/lib/types/uaps';
import {
  generateTimelineData,
  calculateOptimalHarvestWindow,
} from '@/lib/utils/uaps-engine';

// ═══════════════════════════════════════════════════════════════════════════
// 공통 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

function GlowCard({
  children,
  className = '',
  color = 'cyan',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  color?: 'cyan' | 'rose' | 'amber' | 'emerald';
  delay?: number;
}) {
  const glowColors = {
    cyan: 'from-cyan-500/[0.03]',
    rose: 'from-[#B76E79]/[0.03]',
    amber: 'from-[#C4A052]/[0.03]',
    emerald: 'from-emerald-500/[0.03]',
  };
  const stripColors = {
    cyan: 'via-cyan-400/40',
    rose: 'via-[#B76E79]/40',
    amber: 'via-[#C4A052]/40',
    emerald: 'via-emerald-400/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${glowColors[color]} to-transparent rounded-2xl blur-xl group-hover:opacity-150 transition-all`} />
      <div className={`relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all ${className}`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent ${stripColors[color]} to-transparent`} />
        {children}
      </div>
    </motion.div>
  );
}

function SectionWrapper({
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
      <div className="relative bg-[#0d1421]/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
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

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════

export default function UAPSPage() {
  const {
    agingProducts,
    selectedProductId,
    predictions,
    latestPrediction,
    modelStatus,
    modelLastTrained,
    modelDataCount,
    modelGroupCount,
    config,
    isLoading,
    isTraining,
    isPredicting,
    error,
    loadAgingProducts,
    addAgingProduct,
    editAgingProduct,
    removeAgingProduct,
    selectProduct,
    loadPredictions,
    runPrediction,
    loadModelStatus,
    trainModel,
    loadConfig,
    updateCoefficient,
    clearError,
  } = useUAPSStore();

  useEffect(() => {
    loadAgingProducts();
    loadModelStatus();
    loadConfig();
    loadPredictions();
  }, [loadAgingProducts, loadModelStatus, loadConfig, loadPredictions]);

  const selectedProduct = useMemo(
    () => agingProducts.find((p) => p.id === selectedProductId) ?? null,
    [agingProducts, selectedProductId]
  );

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AgingProduct | null>(null);
  const [predictionMonths, setPredictionMonths] = useState(12);

  const [localTci, setLocalTci] = useState(config.tci);
  const [localFri, setLocalFri] = useState(config.fri);
  const [localBri, setLocalBri] = useState(config.bri);

  useEffect(() => {
    setLocalTci(config.tci);
    setLocalFri(config.fri);
    setLocalBri(config.bri);
  }, [config.tci, config.fri, config.bri]);

  const timelineData = useMemo(() => {
    if (!selectedProduct) return [];
    return generateTimelineData(selectedProduct, config);
  }, [selectedProduct, config]);

  const harvestWindow = useMemo(() => {
    if (!selectedProduct) return null;
    return calculateOptimalHarvestWindow(selectedProduct, config);
  }, [selectedProduct, config]);

  const handleSaveCoefficients = useCallback(async () => {
    if (localTci !== config.tci) await updateCoefficient('tci_coefficient', localTci);
    if (localFri !== config.fri) await updateCoefficient('fri_coefficient', localFri);
    if (localBri !== config.bri) await updateCoefficient('bri_coefficient', localBri);
  }, [localTci, localFri, localBri, config.tci, config.fri, config.bri, updateCoefficient]);

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(183, 145, 110, 0.06), transparent),
                              radial-gradient(ellipse 50% 30% at 80% 50%, rgba(34, 211, 238, 0.08), transparent)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* 에러 배너 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/40 text-red-300 px-5 py-3 rounded-xl backdrop-blur-md flex items-center gap-3 max-w-lg"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="ml-2 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Hero Section */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-cyan-400 to-transparent origin-left"
            />

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-cyan-400/70 text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
              >
                Undersea Aging Predictive System
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="sm:block inline">Predictive </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#B76E79] to-cyan-400">
                  Intelligence
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-white/40 text-sm sm:text-lg max-w-lg font-light leading-relaxed"
              >
                2-Layer Hybrid AI가 해저 숙성의 풍미 변화를 과학적으로 예측합니다
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Content Area */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 space-y-6">

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: '등록 제품', value: agingProducts.length, unit: '개', icon: Wine, color: '#22d3ee' },
            { label: '예측 실행', value: predictions.length, unit: '회', icon: Brain, color: '#B76E79' },
            { label: '학습 데이터', value: modelDataCount.toLocaleString(), unit: '건', icon: Database, color: '#C4A052' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent rounded-2xl blur-xl group-hover:from-white/[0.12] transition-all" />
              <div className="relative bg-[#0d1421]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.12] transition-all">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.color}40, transparent)` }}
                />
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-light tracking-tight" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                    <span className="text-sm text-white/30">{stat.unit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 숙성 제품 등록 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionWrapper
          title="숙성 제품 등록"
          icon={Anchor}
          iconColor="#22d3ee"
          delay={0.15}
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white font-medium rounded-xl px-4 py-2 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          }
        >
          {isLoading && agingProducts.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-white/30">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              로딩 중...
            </div>
          ) : agingProducts.length === 0 ? (
            <div className="text-center py-12">
              <Wine className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">
                등록된 제품이 없습니다. 새 제품을 추가해 주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agingProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div
                    onClick={() => selectProduct(product.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') selectProduct(product.id); }}
                    className={`w-full text-left border rounded-xl p-4 transition-all cursor-pointer ${
                      selectedProductId === product.id
                        ? 'border-cyan-400/50 bg-cyan-400/[0.06] shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm truncate pr-2">
                        {product.productName}
                      </h4>
                      <span
                        className={`text-[10px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full ${
                          product.status === 'immersed'
                            ? 'bg-cyan-500/15 text-cyan-400'
                            : product.status === 'harvested'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-white/[0.06] text-white/50'
                        }`}
                      >
                        {PRODUCT_STATUS_LABELS[product.status]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">
                          {WINE_TYPE_LABELS[product.wineType]}
                          {product.vintage ? ` · ${product.vintage}` : ''}
                        </p>
                        <p className="text-xs text-white/30">
                          {product.agingDepth}m
                          {product.plannedDurationMonths ? ` · ${product.plannedDurationMonths}개월` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
                          aria-label="수정"
                          title="수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${product.productName}" 제품을 삭제하시겠습니까?`)) {
                              removeAgingProduct(product.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                          aria-label="삭제"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </SectionWrapper>

      {/* 제품 추가/수정 모달 — 최상위 레벨에서 렌더링 */}
      <AnimatePresence>
        {(showModal || editingProduct) && (
          <ProductModal
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            initialData={editingProduct}
            onSubmit={async (input) => {
              if (editingProduct) {
                await editAgingProduct(editingProduct.id, input);
                setEditingProduct(null);
              } else {
                const result = await addAgingProduct(input);
                if (result) setShowModal(false);
              }
            }}
          />
        )}
      </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 예측 시뮬레이터 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selectedProductId && selectedProduct && (
          <SectionWrapper
            title="예측 시뮬레이터"
            icon={Target}
            iconColor="#22d3ee"
            delay={0.2}
            action={
              <button
                onClick={() => runPrediction(selectedProductId, predictionMonths)}
                disabled={isPredicting}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium rounded-xl px-5 py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPredicting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isPredicting ? '분석 중...' : 'AI 예측'}
              </button>
            }
          >
            <div className="space-y-4">
              {/* 슬라이더 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/50">숙성 기간</label>
                  <span className="text-lg font-light text-cyan-400 tracking-tight">
                    {predictionMonths}<span className="text-sm text-white/30 ml-1">개월</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={36}
                  step={1}
                  value={predictionMonths}
                  onChange={(e) => setPredictionMonths(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                />
                <div className="flex justify-between text-[10px] text-white/20">
                  <span>3개월</span>
                  <span>12</span>
                  <span>24</span>
                  <span>36개월</span>
                </div>
              </div>

              {/* 품질 점수 */}
              {latestPrediction?.overallQualityScore != null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pt-4 border-t border-white/[0.06]"
                >
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: '종합 품질', value: latestPrediction.overallQualityScore, color: '#22d3ee' },
                      { label: '질감 성숙', value: latestPrediction.textureMaturityScore, color: '#fbbf24' },
                      { label: '향 신선도', value: latestPrediction.aromaFreshnessScore, color: '#34d399' },
                      { label: 'Off-flavor', value: latestPrediction.offFlavorRiskScore, color: '#f87171' },
                    ].map((score) => (
                      <div key={score.label} className="text-center">
                        <div
                          className="w-14 h-14 mx-auto rounded-full border-2 flex items-center justify-center mb-1.5"
                          style={{ borderColor: `${score.color}50`, backgroundColor: `${score.color}08` }}
                        >
                          <span className="text-lg font-light" style={{ color: score.color }}>
                            {score.value != null ? Math.round(score.value) : '—'}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40">{score.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30 text-center mt-3">
                    예측 신뢰도 {Math.round(latestPrediction.predictionConfidence * 100)}%
                  </p>
                </motion.div>
              )}
            </div>
          </SectionWrapper>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* AI 인사이트 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {latestPrediction && (
          <SectionWrapper title="AI 인사이트" icon={Sparkles} iconColor="#B76E79" delay={0.25}>
            <div className="space-y-4">
              {latestPrediction.aiInsightText && (
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                  <p className="text-white/70 text-sm leading-relaxed italic">
                    &ldquo;{latestPrediction.aiInsightText}&rdquo;
                  </p>
                </div>
              )}

              {latestPrediction.aiRiskWarning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 text-sm font-medium mb-1">리스크 경고</p>
                    <p className="text-red-300/60 text-sm">{latestPrediction.aiRiskWarning}</p>
                  </div>
                </motion.div>
              )}

              {/* 신뢰도 바 */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/40 shrink-0">신뢰도</span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${latestPrediction.predictionConfidence * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      latestPrediction.predictionConfidence >= 0.8
                        ? 'bg-emerald-400'
                        : latestPrediction.predictionConfidence >= 0.5
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }`}
                  />
                </div>
                <span className="text-xs text-white/50 font-mono shrink-0">
                  {Math.round(latestPrediction.predictionConfidence * 100)}%
                </span>
              </div>
            </div>
          </SectionWrapper>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 차트 (풍미 레이더 + 타임라인) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {(latestPrediction || selectedProduct) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {latestPrediction && (
              <SectionWrapper title="풍미 프로파일" icon={BarChart3} iconColor="#B76E79" delay={0.3}>
                <div className="h-[350px]">
                  <FlavorRadar prediction={latestPrediction} />
                </div>
              </SectionWrapper>
            )}

            {selectedProduct && timelineData.length > 0 && (
              <SectionWrapper title="타임라인 & Golden Window" icon={Gauge} iconColor="#fbbf24" delay={0.35}>
                <div className="h-[350px]">
                  <TimelineChart data={timelineData} harvestWindow={harvestWindow} />
                </div>
                {harvestWindow && (
                  <p className="mt-3 text-xs text-white/35 leading-relaxed">
                    {harvestWindow.recommendation}
                  </p>
                )}
              </SectionWrapper>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 모델 & 보정 계수 설정 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 모델 상태 */}
          <SectionWrapper title="모델 상태" icon={Settings2} iconColor="#C4A052" delay={0.4}>
            <div className="space-y-3 mb-5">
              {[
                { label: '상태', value: MODEL_STATUS_LABELS[modelStatus], badge: true },
                { label: '최종 학습일', value: modelLastTrained ? new Date(modelLastTrained).toLocaleDateString('ko-KR') : '—' },
                { label: '학습 데이터', value: `${modelDataCount.toLocaleString()}건` },
                { label: '모델 그룹', value: `${modelGroupCount}개` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-white/40">{row.label}</span>
                  {row.badge ? (
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        modelStatus === 'trained'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : modelStatus === 'training'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-white/[0.06] text-white/40'
                      }`}
                    >
                      {row.value}
                    </span>
                  ) : (
                    <span className="text-xs text-white/60 font-mono">{row.value}</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={trainModel}
              disabled={isTraining}
              className="w-full flex items-center justify-center gap-2 bg-[#C4A052]/15 hover:bg-[#C4A052]/25 border border-[#C4A052]/20 text-[#C4A052] font-medium rounded-xl px-4 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTraining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isTraining ? '학습 진행 중...' : '모델 재학습'}
            </button>
          </SectionWrapper>

          {/* 보정 계수 */}
          <SectionWrapper title="보정 계수" icon={Settings2} iconColor="#22d3ee" delay={0.45}>
            <div className="space-y-5 mb-5">
              <CoefficientSlider
                label="TCI (질감 성숙)"
                value={localTci}
                onChange={setLocalTci}
                min={0.1}
                max={1.0}
                step={0.05}
                scientificBasis="가설적 추정 — 실험 검증 필요"
                sourceType="hypothesis"
              />
              <CoefficientSlider
                label="FRI (향 신선도)"
                value={localFri}
                onChange={setLocalFri}
                min={0.1}
                max={1.0}
                step={0.01}
                scientificBasis="아레니우스 방정식 · Ea=47kJ/mol"
                recommendedValue={0.56}
                sourceType="scientific"
              />
              <CoefficientSlider
                label="BRI (기포 안정화)"
                value={localBri}
                onChange={setLocalBri}
                min={1.0}
                max={2.5}
                step={0.05}
                scientificBasis="헨리의 법칙 · 수심 30m CO₂ 압력 구배"
                recommendedValue={1.6}
                sourceType="scientific"
              />
            </div>
            <button
              onClick={handleSaveCoefficients}
              className="w-full flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-all"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </SectionWrapper>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 제품 추가/수정 모달
// ═══════════════════════════════════════════════════════════════════════════

function ProductModal({
  onClose,
  onSubmit,
  initialData,
}: {
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
  initialData?: AgingProduct | null;
}) {
  const isEdit = !!initialData;
  const [productName, setProductName] = useState(initialData?.productName ?? '');
  const [wineType, setWineType] = useState<WineType>(initialData?.wineType ?? 'blanc_de_blancs');
  const [vintage, setVintage] = useState<string>(initialData?.vintage?.toString() ?? '');
  const [ph, setPh] = useState<string>(initialData?.ph?.toString() ?? '');
  const [dosage, setDosage] = useState<string>(initialData?.dosage?.toString() ?? '');
  const [alcohol, setAlcohol] = useState<string>(initialData?.alcohol?.toString() ?? '');
  // 환원 성향 체크리스트 → 자동 산출
  const REDUCTION_CHECKLIST = [
    { id: 'brutNature', label: '낮은 도사주', desc: 'Brut Nature · Extra Brut (0~6g/L)', weight: 2, group: 'dosage' },
    { id: 'brut', label: '일반 도사주', desc: 'Brut · Extra Dry (6~12g/L)', weight: 0, group: 'dosage' },
    { id: 'highDosage', label: '높은 도사주', desc: 'Demi-Sec · Doux (12g/L+)', weight: -2, group: 'dosage' },
    { id: 'reductive', label: '환원적 양조', desc: '스테인리스 스틸 발효 · 불활성 가스 블랭킷 · 저온 발효', weight: 1, group: null },
    { id: 'surLie', label: '장기 앙금 접촉', desc: 'Sur lie 장기 숙성', weight: 1, group: null },
    { id: 'oxidative', label: '산화적 양조 · 솔레라', desc: '산소 접촉 반복, 솔레라 블렌딩', weight: -1, group: null },
    { id: 'oak', label: '오크 숙성', desc: '오크통 숙성 과정 포함', weight: -1, group: null },
  ] as const;

  const [reductionChecks, setReductionChecks] = useState<Record<string, boolean>>(() => {
    // 수정 모드: DB에 저장된 체크리스트 복원
    if (initialData?.reductionChecks) return { ...initialData.reductionChecks };
    const initial: Record<string, boolean> = {};
    REDUCTION_CHECKLIST.forEach((item) => { initial[item.id] = false; });
    return initial;
  });

  const reductionScore = REDUCTION_CHECKLIST.reduce(
    (sum, item) => sum + (reductionChecks[item.id] ? item.weight : 0), 0
  );
  const reductionPotential: ReductionPotential = reductionScore >= 3 ? 'high' : reductionScore >= 1 ? 'medium' : 'low';

  const toggleReductionCheck = (id: string) => {
    const item = REDUCTION_CHECKLIST.find((c) => c.id === id);
    setReductionChecks((prev) => {
      const next = { ...prev };
      // 같은 그룹(dosage)은 라디오처럼 하나만 선택
      if (item?.group) {
        REDUCTION_CHECKLIST.forEach((c) => {
          if (c.group === item.group && c.id !== id) next[c.id] = false;
        });
      }
      next[id] = !prev[id];
      return next;
    });
  };

  const [immersionDate, setImmersionDate] = useState(initialData?.immersionDate ?? '');
  const [plannedDurationMonths, setPlannedDurationMonths] = useState<string>(initialData?.plannedDurationMonths?.toString() ?? '');
  const [agingDepth, setAgingDepth] = useState<string>(initialData?.agingDepth?.toString() ?? '30');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    setIsSubmitting(true);
    await onSubmit({
      productName: productName.trim(),
      wineType,
      vintage: vintage ? Number(vintage) : null,
      producer: '',
      ph: ph ? Number(ph) : null,
      dosage: dosage ? Number(dosage) : null,
      alcohol: alcohol ? Number(alcohol) : null,
      acidity: null,
      reductionPotential,
      reductionChecks: { ...reductionChecks },
      immersionDate: immersionDate || null,
      plannedDurationMonths: plannedDurationMonths ? Number(plannedDurationMonths) : null,
      agingDepth: agingDepth ? Number(agingDepth) : 30,
      notes: notes.trim() || null,
    });
    setIsSubmitting(false);
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors';
  const labelClass = 'block text-xs text-white/50 mb-1.5';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0d1421] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/[0.06]">
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            <Anchor className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-lg font-medium text-white flex-1">
            {isEdit ? '숙성 제품 수정' : '새 숙성 제품 등록'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>제품명 *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Muse de Marée Blanc de Blancs 2024"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>와인 타입</label>
              <select value={wineType} onChange={(e) => setWineType(e.target.value as WineType)} className={inputClass}>
                {Object.entries(WINE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>빈티지</label>
              <input type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} placeholder="2024" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>pH <span className="text-white/20">(선택)</span></label>
              <input type="number" step="0.01" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="3.10" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Dosage g/L <span className="text-white/20">(선택)</span></label>
              <input type="number" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="8" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Alcohol % <span className="text-white/20">(선택)</span></label>
              <input type="number" value={alcohol} onChange={(e) => setAlcohol(e.target.value)} placeholder="12.5" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>환원 성향 (해당 항목 체크)</label>
            {/* 도사주 구간 — 하나만 선택 */}
            <p className="text-[11px] text-white/30 mb-1.5 mt-2">도사주 (하나만 선택)</p>
            <div className="space-y-1.5">
              {REDUCTION_CHECKLIST.filter((item) => item.group === 'dosage').map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    reductionChecks[item.id]
                      ? 'border-cyan-400/30 bg-cyan-400/[0.05]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  <input
                    type="radio"
                    name="dosageGroup"
                    checked={reductionChecks[item.id]}
                    onChange={() => toggleReductionCheck(item.id)}
                    className="accent-cyan-400"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-white/30 ml-2">{item.desc}</span>
                  </div>
                  <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : item.weight < 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                    {item.weight > 0 ? '+' : ''}{item.weight}
                  </span>
                </label>
              ))}
            </div>
            {/* 양조 방식 — 복수 선택 가능 */}
            <p className="text-[11px] text-white/30 mb-1.5 mt-3">양조 방식 (복수 선택 가능)</p>
            <div className="space-y-1.5">
              {REDUCTION_CHECKLIST.filter((item) => item.group === null).map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    reductionChecks[item.id]
                      ? 'border-cyan-400/30 bg-cyan-400/[0.05]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={reductionChecks[item.id]}
                    onChange={() => toggleReductionCheck(item.id)}
                    className="accent-cyan-400 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-white/30 ml-2">{item.desc}</span>
                  </div>
                  <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : 'text-emerald-400/60'}`}>
                    {item.weight > 0 ? '+' : ''}{item.weight}
                  </span>
                </label>
              ))}
            </div>
            {/* 자동 산출 결과 */}
            <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-white/40">산출 결과:</span>
              <span className={`text-sm font-medium ${
                reductionPotential === 'high' ? 'text-red-400' : reductionPotential === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {REDUCTION_POTENTIAL_LABELS[reductionPotential]}
              </span>
              <span className="text-[11px] text-white/20 font-mono">
                (점수: {reductionScore})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>투하 예정일</label>
              <input type="date" value={immersionDate} onChange={(e) => setImmersionDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>예정 기간 (월)</label>
              <input type="number" value={plannedDurationMonths} onChange={(e) => setPlannedDurationMonths(e.target.value)} placeholder="18" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>숙성 깊이 (m)</label>
              <input type="number" value={agingDepth} onChange={(e) => setAgingDepth(e.target.value)} placeholder="30" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 참고사항..."
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 rounded-xl py-2.5 text-sm transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!productName.trim() || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-medium rounded-xl py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Flavor Radar 차트
// ═══════════════════════════════════════════════════════════════════════════

const BASELINE_PROFILES: Record<WineType, Record<string, number>> = {
  blanc_de_blancs: { citrus: 75, brioche: 12, honey: 8, nutty: 6, toast: 5, oxidation: 3 },
  blanc_de_noirs:  { citrus: 60, brioche: 18, honey: 10, nutty: 12, toast: 8, oxidation: 5 },
  rose:            { citrus: 55, brioche: 15, honey: 12, nutty: 8, toast: 6, oxidation: 4 },
  blend:           { citrus: 65, brioche: 15, honey: 10, nutty: 10, toast: 7, oxidation: 4 },
  vintage:         { citrus: 45, brioche: 25, honey: 18, nutty: 20, toast: 15, oxidation: 8 },
};

function FlavorRadar({ prediction }: { prediction: AgingPrediction }) {
  const baseline = BASELINE_PROFILES[prediction.wineType] || BASELINE_PROFILES.blend;

  const radarData = FLAVOR_AXES.map((axis) => {
    const predictedKey = `predicted${axis.key.charAt(0).toUpperCase() + axis.key.slice(1)}` as keyof AgingPrediction;
    return {
      axis: axis.label,
      before: baseline[axis.key] ?? 30,
      after: (prediction[predictedKey] as number | null) ?? 30,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} tickCount={5} />
        <Radar name="투하 전" dataKey="before" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={1} strokeDasharray="4 4" />
        <Radar name="AI 예측" dataKey="after" stroke="#B76E79" fill="#B76E79" fillOpacity={0.35} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Timeline & Golden Window 차트
// ═══════════════════════════════════════════════════════════════════════════

function TimelineChart({
  data,
  harvestWindow,
}: {
  data: { month: number; textureMaturity: number; aromaFreshness: number; offFlavorRisk: number; bubbleRefinement: number }[];
  harvestWindow: { startMonths: number; endMonths: number; recommendation: string } | null;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={(v) => `${v}m`} />
        <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: '#0d1421',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '12px',
          }}
          labelFormatter={(v) => `${v}개월`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />

        {harvestWindow && (
          <ReferenceArea
            x1={harvestWindow.startMonths}
            x2={harvestWindow.endMonths}
            y1={0}
            y2={100}
            fill="#22c55e"
            fillOpacity={0.06}
            stroke="#22c55e"
            strokeOpacity={0.15}
            strokeDasharray="4 4"
          />
        )}

        <Line type="monotone" dataKey="textureMaturity" name="질감 성숙도" stroke="#fbbf24" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="aromaFreshness" name="향 신선도" stroke="#22d3ee" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="offFlavorRisk" name="Off-flavor" stroke="#f87171" strokeWidth={2} strokeDasharray="6 3" dot={false} />
        <Line type="monotone" dataKey="bubbleRefinement" name="기포 미세화" stroke="#a78bfa" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 보정 계수 슬라이더
// ═══════════════════════════════════════════════════════════════════════════

function CoefficientSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  scientificBasis,
  recommendedValue,
  sourceType,
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
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-white/50">{label}</label>
        <span className="text-xs text-cyan-400 font-mono font-medium">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400 h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(34,211,238,0.3)]"
      />
      <div className="flex justify-between text-[10px] text-white/20 mt-1">
        <span>{min}</span>
        {recommendedValue !== undefined && (
          <span className="text-cyan-400/50">권장 {recommendedValue}</span>
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
