'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
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
  Save,
  BarChart3,
  Info,
  LayoutGrid,
  ChevronDown,
  ClipboardCheck,
} from 'lucide-react';

// 카테고리 목록
const UAPS_CATEGORIES = [
  { slug: 'champagne',  label: '샴페인',      emoji: '🥂', color: '#C4A052', href: '/uaps' },
  { slug: 'red-wine',   label: '레드와인',    emoji: '🍷', color: '#9f1239', href: '/uaps/red-wine' },
  { slug: 'white-wine', label: '화이트와인',  emoji: '🍾', color: '#ca8a04', href: '/uaps/white-wine' },
  { slug: 'whisky',     label: '위스키',      emoji: '🥃', color: '#d97706', href: '/uaps/whisky' },
  { slug: 'soy-sauce',  label: '간장',        emoji: '🫙', color: '#92400e', href: '/uaps/soy-sauce' },
  { slug: 'vinegar',    label: '식초',        emoji: '🍶', color: '#10b981', href: '/uaps/vinegar' },
  { slug: 'cold-brew',  label: '콜드브루',    emoji: '☕', color: '#f97316', href: '/uaps/cold-brew' },
  { slug: 'spirits',    label: '소주',        emoji: '🍵', color: '#06b6d4', href: '/uaps/spirits' },
  { slug: 'yakju',      label: '전통주',      emoji: '🍚', color: '#84cc16', href: '/uaps/yakju' },
  { slug: 'puerh',      label: '보이차',      emoji: '🫖', color: '#f43f5e', href: '/uaps/puerh' },
];

// slug → DB product_category 매핑 (DB 실제값 기준)
const UAPS_CATEGORY_DB: Record<string, string> = {
  'champagne':  'champagne',
  'red-wine':   'red_wine',
  'white-wine': 'white_wine',
  'whisky':     'whisky',
  'soy-sauce':  'soy_sauce',
  'vinegar':    'vinegar',
  'cold-brew':  'coldbrew',
  'spirits':    'spirits',
  'yakju':      'spirits',
  'puerh':      'puer',
};

import { useUAPSStore } from '@/lib/store/uaps-store';
import type {
  AgingProduct,
  AgingPrediction,
  ProductInput,
  WineType,
  ReductionPotential,
  ReductionCheckItem,
  ClosureType,
  OceanConditionsForPrediction,
  DepthSimulationResult,
} from '@/lib/types/uaps';
import {
  WINE_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
  REDUCTION_POTENTIAL_LABELS,
  MODEL_STATUS_LABELS,
  FLAVOR_AXES,
  CATEGORY_SUBTYPES,
  CATEGORY_REDUCTION_CHECKLIST,
  CATEGORY_FIELD_CONFIG,
  CLOSURE_TYPE_LABELS,
  CATEGORY_DEFAULT_CLOSURE,
  CATEGORY_EA_MAP,
} from '@/lib/types/uaps';
import {
  generateTimelineData,
  calculateOptimalHarvestWindow,
  findSimilarClusters,
  predictFlavorProfileStatistical,
  simulateDepthQualities,
  deriveKineticFactorFromOcean,
} from '@/lib/utils/uaps-engine';
import { applyAgingAdjustments } from '@/lib/utils/uaps-ai-predictor';
import { useOceanDataStore } from '@/lib/store/ocean-data-store';
import {
  OceanConditionsCard, OptimalDepthCard, EnvironmentalImpactCard,
  MonthlyProfileCard,
} from './components/OceanCardsV3';
import { calculateProductOceanStats } from '@/lib/utils/uaps-ocean-profile';

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
    terrestrialModels,
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

  // v3.0: 해양 데이터 스토어 — 실시간 + 전체 기간 통계
  const {
    currentConditions: oceanCurrentConditions,
    historicalOceanStats,
    monthlyOceanProfiles,
    annualOceanProfile,
    dailyData,
    fetchCurrentConditions: loadOceanConditions,
    loadHistoricalOceanStats,
  } = useOceanDataStore();

  useEffect(() => {
    loadAgingProducts();
    loadModelStatus();
    loadConfig();
    loadPredictions();
    loadOceanConditions();
    loadHistoricalOceanStats();
  }, [loadAgingProducts, loadModelStatus, loadConfig, loadPredictions, loadOceanConditions, loadHistoricalOceanStats]);

  const selectedProduct = useMemo(
    () => agingProducts.find((p) => p.id === selectedProductId) ?? null,
    [agingProducts, selectedProductId]
  );

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AgingProduct | null>(null);
  const [showCoefficientDialog, setShowCoefficientDialog] = useState(false);
  const [showRetrievalModal, setShowRetrievalModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [listCategory, setListCategory] = useState('champagne');
  // predictionMonths는 제품의 plannedDurationMonths 사용

  const [localTci, setLocalTci] = useState(config.tci);
  const [localFri, setLocalFri] = useState(config.fri);
  const [localBri, setLocalBri] = useState(config.bri);

  useEffect(() => {
    setLocalTci(config.tci);
    setLocalFri(config.fri);
    setLocalBri(config.bri);
  }, [config.tci, config.fri, config.bri]);

  // 투입 월 추출 (immersionDate에서, 없으면 현재 월)
  const immersionMonth = useMemo(() => {
    if (selectedProduct?.immersionDate) {
      const m = parseInt(selectedProduct.immersionDate.split('-')[1], 10);
      return isNaN(m) ? new Date().getMonth() + 1 : m;
    }
    return new Date().getMonth() + 1;
  }, [selectedProduct]);

  // AI 예측의 agingFactors/qualityWeights가 있으면 타임라인에 주입
  const aiAgingFactors = latestPrediction?.agingFactorsJson ?? undefined;
  const aiQualityWeights = latestPrediction?.qualityWeightsJson ?? undefined;

  const timelineData = useMemo(() => {
    if (!selectedProduct) return [];
    return generateTimelineData(
      selectedProduct, config,
      aiAgingFactors, aiQualityWeights,
      monthlyOceanProfiles ?? undefined,
      immersionMonth
    );
  }, [selectedProduct, config, aiAgingFactors, aiQualityWeights, monthlyOceanProfiles, immersionMonth]);

  const harvestWindow = useMemo(() => {
    if (!selectedProduct) return null;
    return calculateOptimalHarvestWindow(
      selectedProduct, config,
      aiAgingFactors, aiQualityWeights,
      monthlyOceanProfiles ?? undefined,
      immersionMonth
    );
  }, [selectedProduct, config, aiAgingFactors, aiQualityWeights, monthlyOceanProfiles, immersionMonth]);

  const beforeProfile = useMemo(() => {
    // 제품 미선택 시 null → FlavorRadar에서 ZERO_PROFILE 사용
    if (!selectedProduct) return null;
    // 1순위: AI 예측에서 생성된 전문가 프로파일
    if (latestPrediction?.expertProfileJson) {
      return latestPrediction.expertProfileJson;
    }
    // 2순위: 기존 통계 기반
    if (terrestrialModels.length === 0) return null;
    const clusters = findSimilarClusters(selectedProduct, terrestrialModels);
    if (clusters.length === 0) return null;
    return predictFlavorProfileStatistical(clusters, 0, config, selectedProduct);
  }, [selectedProduct, terrestrialModels, config, latestPrediction]);

  const afterProfile = useMemo(() => {
    if (!selectedProduct) return null;
    const months = selectedProduct.plannedDurationMonths;
    if (!months) return null;

    // 전문가 프로파일이 있으면 TCI/FRI 보정만 적용
    if (beforeProfile && latestPrediction?.expertProfileJson) {
      return applyAgingAdjustments(beforeProfile, months, config);
    }

    // 통계 기반 폴백
    if (terrestrialModels.length === 0) return null;
    const clusters = findSimilarClusters(selectedProduct, terrestrialModels);
    if (clusters.length === 0) return null;
    return predictFlavorProfileStatistical(clusters, months, config, selectedProduct);
  }, [selectedProduct, terrestrialModels, config, beforeProfile, latestPrediction]);

  const handleSaveCoefficients = useCallback(async () => {
    if (localTci !== config.tci) await updateCoefficient('tci_coefficient', localTci);
    if (localFri !== config.fri) await updateCoefficient('fri_coefficient', localFri);
    if (localBri !== config.bri) await updateCoefficient('bri_coefficient', localBri);
  }, [localTci, localFri, localBri, config.tci, config.fri, config.bri, updateCoefficient]);

  // 오늘 날짜의 데이터 소스 (KHOA / Open-Meteo / hybrid)
  const todayDataSource = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = dailyData.find((d) => d.date === today);
    return todayRecord?.dataSource ?? dailyData[0]?.dataSource ?? null;
  }, [dailyData]);

  // 제품 투입일 기반 수심 보정 환경 통계
  const productOceanStats = useMemo(() => {
    if (!selectedProduct || !dailyData || dailyData.length === 0) return null;
    const immersionDate = selectedProduct.immersionDate;
    if (!immersionDate) return null;
    return calculateProductOceanStats(dailyData, immersionDate, selectedProduct.agingDepth || 30);
  }, [selectedProduct, dailyData]);

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
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-red-500/20 border border-red-500/40 text-red-300 px-4 sm:px-5 py-3 rounded-xl backdrop-blur-md flex items-center gap-3 sm:max-w-lg"
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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="mt-4 flex items-center gap-2"
              >
                {/* 카테고리 드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.1] text-white/40 text-xs hover:bg-white/[0.04] hover:border-white/20 hover:text-white/60 transition-all duration-300"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    카테고리
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <>
                        {/* 배경 오버레이 */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowCategoryDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 z-50 bg-[#0d1421]/95 border border-white/[0.08] rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden min-w-[160px]"
                        >
                          <div className="p-1.5">
                            <p className="text-[9px] text-white/25 uppercase tracking-wider px-3 pt-1.5 pb-1">카테고리 예측</p>
                            {UAPS_CATEGORIES.map((cat) => (
                              <Link
                                key={cat.slug}
                                href={cat.href}
                                onClick={() => setShowCategoryDropdown(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">
                                  {cat.label}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/uaps/how-it-works"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 text-cyan-400/60 text-xs hover:bg-cyan-400/[0.06] hover:border-cyan-400/30 hover:text-cyan-400/80 transition-all duration-300"
                  >
                    <Info className="w-3 h-3" />
                    작동 원리
                  </Link>
                  <button
                    onClick={trainModel}
                    disabled={isTraining}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C4A052]/20 text-[#C4A052]/60 text-xs hover:bg-[#C4A052]/[0.06] hover:border-[#C4A052]/30 hover:text-[#C4A052]/80 transition-all duration-300 disabled:opacity-50"
                  >
                    {isTraining ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {isTraining ? '학습 중...' : '모델 재학습'}
                  </button>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-white/25">
                    <span className={`w-1.5 h-1.5 rounded-full ${modelStatus === 'trained' ? 'bg-emerald-400' : modelStatus === 'training' ? 'bg-amber-400' : 'bg-white/30'}`} />
                    {MODEL_STATUS_LABELS[modelStatus]}
                    {modelLastTrained && <span>· {new Date(modelLastTrained).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>}
                    <span>· {modelDataCount.toLocaleString()}건</span>
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Content Area */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 space-y-6">

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
              <div className="relative bg-[#0d1421]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-2.5 sm:p-4 hover:border-white/[0.12] transition-all">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.color}40, transparent)` }}
                />
                {/* 모바일: 아이콘+숫자 수직 컴팩트, 데스크톱: 기존 레이아웃 */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1.5 sm:mb-3" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: stat.color }} />
                  </div>
                  <p className="text-[9px] sm:text-xs text-white/40 uppercase tracking-wider mb-0.5 sm:mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-0.5 sm:gap-1.5">
                    <span className="text-lg sm:text-2xl font-light tracking-tight" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                    <span className="text-[10px] sm:text-sm text-white/30">{stat.unit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 숙성 제품 리스트 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionWrapper
          title="숙성 제품 리스트"
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
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {UAPS_CATEGORIES.map((cat) => {
              const dbCat = UAPS_CATEGORY_DB[cat.slug] ?? cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setListCategory(dbCat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    listCategory === dbCat
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/10'
                  }`}
                  style={listCategory === dbCat ? { borderColor: cat.color + '60', color: cat.color, backgroundColor: cat.color + '12' } : {}}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          {(() => {
            const filtered = agingProducts.filter((p) => (p.productCategory ?? 'champagne') === listCategory);
            return isLoading && agingProducts.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-white/30">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              로딩 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wine className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">
                이 카테고리에 등록된 제품이 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((product, idx) => (
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
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.08] text-[10px] text-white/50 font-mono mr-1.5">{idx + 1}</span>
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
                          {product.wineType
                            ? WINE_TYPE_LABELS[product.wineType]
                            : CATEGORY_SUBTYPES[product.productCategory]?.find(
                                (s) => s.value === String((product.reductionChecks as Record<string, unknown> | null)?._subtype ?? '')
                              )?.label ?? product.productCategory}
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
          );
          })()}

        </SectionWrapper>

      {/* 제품 추가/수정 모달 — 최상위 레벨에서 렌더링 */}
      <AnimatePresence>
        {(showModal || editingProduct) && (
          <ProductModal
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            initialData={editingProduct}
            initialCategory={editingProduct?.productCategory ?? listCategory}
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
        {/* 예측 시뮬레이터 + AI 인사이트 — 컴팩트 단일 행 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selectedProductId && selectedProduct && (
          <motion.div
            key="simulation-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent rounded-2xl" />
            <div className="relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* 상단 스트립 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

              {/* 시뮬레이터 행 */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.04] space-y-3 sm:space-y-0">
                {/* 상단: 라벨 + 기간 + 버튼 */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <div className="p-1.5 rounded-lg bg-cyan-500/[0.08]">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-xs text-white/40 uppercase tracking-wider">Simulation</span>
                  </div>

                  {/* 숙성 기간 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/25">기간</span>
                    <span className="text-sm font-light text-cyan-400 font-mono">
                      {selectedProduct.plannedDurationMonths ?? '—'}
                    </span>
                    <span className="text-[10px] text-white/20">개월</span>
                  </div>

                  <div className="flex-1" />

                  <button
                    onClick={() => setShowCoefficientDialog(true)}
                    className="p-2 sm:p-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all shrink-0"
                    title="보정 계수 설정"
                  >
                    <Settings2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowRetrievalModal(true)}
                    disabled={!latestPrediction}
                    className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-medium text-emerald-400 transition-all disabled:opacity-30 shrink-0"
                    title={!latestPrediction ? '예측을 먼저 실행하세요' : '비교 시음 결과 입력'}
                  >
                    <ClipboardCheck className="w-3 h-3" />
                    비교 시음
                  </button>
                  <button
                    onClick={() => runPrediction(selectedProductId, selectedProduct.plannedDurationMonths || 18)}
                    disabled={isPredicting || !selectedProduct.plannedDurationMonths}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-black font-medium rounded-lg px-3.5 py-2 sm:py-1.5 text-xs hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isPredicting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {isPredicting ? '분석 중' : 'AI 예측'}
                  </button>
                </div>

                {/* 품질 점수 — 모바일: 별도 행, 데스크톱: 인라인 */}
                {latestPrediction?.overallQualityScore != null && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {[
                      { label: '종합', value: latestPrediction.overallQualityScore, color: '#C4A052' },
                      { label: '질감', value: latestPrediction.textureMaturityScore, color: '#34d399' },
                      { label: '향', value: latestPrediction.aromaFreshnessScore, color: '#22d3ee' },
                      { label: '환원취', value: latestPrediction.offFlavorRiskScore, color: '#f87171' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] text-white/30">{s.label}</span>
                        <span className="text-xs font-mono font-medium" style={{ color: `${s.color}cc` }}>
                          {s.value != null ? Math.round(s.value) : '—'}
                        </span>
                      </div>
                    ))}
                    <span className="text-[9px] text-white/15 ml-1 font-mono">
                      ±{Math.round((1 - latestPrediction.predictionConfidence) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* AI 인사이트 행 */}
              {latestPrediction && (
                <div className="px-5 py-3 space-y-2">
                  {latestPrediction.aiInsightText ? (
                    <>
                      {/* 투하 전·후 2단 인사이트 */}
                      {latestPrediction.aiInsightText.includes('\n') ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* 투하 전 특징 */}
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-md bg-cyan-400/[0.06] shrink-0 mt-0.5">
                              <Wine className="w-3 h-3 text-cyan-400/60" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-cyan-400/40 uppercase tracking-wider">Before</span>
                              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5 line-clamp-3">
                                {latestPrediction.aiInsightText.split('\n')[0]}
                              </p>
                            </div>
                          </div>
                          {/* 숙성 후 예측 */}
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-md bg-[#B76E79]/[0.06] shrink-0 mt-0.5">
                              <Sparkles className="w-3 h-3 text-[#B76E79]/60" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-[#B76E79]/40 uppercase tracking-wider">After</span>
                              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5 line-clamp-3">
                                {latestPrediction.aiInsightText.split('\n').slice(1).join(' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded-lg bg-[#B76E79]/[0.08] shrink-0 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#B76E79]" />
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed line-clamp-3">
                            {latestPrediction.aiInsightText}
                          </p>
                        </div>
                      )}
                      {/* 출처 + 신뢰도 */}
                      <div className="flex items-center justify-between">
                        <div />
                        {latestPrediction.predictionConfidence != null && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-10 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  latestPrediction.predictionConfidence >= 0.8 ? 'bg-emerald-400/60' :
                                  latestPrediction.predictionConfidence >= 0.5 ? 'bg-amber-400/60' : 'bg-red-400/60'
                                }`}
                                style={{ width: `${latestPrediction.predictionConfidence * 100}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-white/25 font-mono">
                              {Math.round(latestPrediction.predictionConfidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-white/25 italic">AI 예측을 실행하면 투하 전·후 비교 인사이트가 표시됩니다</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 차트 (풍미 레이더 + 타임라인) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionWrapper title="풍미 프로파일" icon={BarChart3} iconColor="#B76E79" delay={0.3}>
          <FlavorRadar
            beforeProfile={beforeProfile}
            afterProfile={afterProfile}
            products={agingProducts.filter(p => (p.productCategory ?? 'champagne') === listCategory)}
            selectedProductId={selectedProductId}
            onSelectProduct={selectProduct}
          />
        </SectionWrapper>

        <SectionWrapper title="숙성 타임라인" icon={Gauge} iconColor="#C4A052" delay={0.35}>
          <div className="h-[220px] sm:h-[300px]">
            {timelineData.length > 0 ? (
              <TimelineChart data={timelineData} harvestWindow={harvestWindow} plannedMonths={selectedProduct?.plannedDurationMonths ?? null} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-white/20">제품을 선택하면 숙성 타임라인이 표시됩니다</p>
              </div>
            )}
          </div>
          {harvestWindow ? (
            <div className="mt-1.5 space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 효율 최적점 (초록, 피크보다 빠를 때만) */}
                {(() => {
                  const threshold = harvestWindow.peakScore - 4;
                  const eff = timelineData.find(d => (d.compositeQuality ?? 0) >= threshold);
                  if (eff && eff.month < harvestWindow.peakMonth) {
                    return (
                      <div className="flex items-center gap-1.5 bg-emerald-400/[0.08] border border-emerald-400/[0.20] rounded-lg px-3 py-2" title="피크 대비 4점 이내에 처음 도달하는 시점 — 비용 효율 최적">
                        <span className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-medium">추천</span>
                        <span className="text-sm font-medium text-emerald-400">
                          {eff.month}<span className="text-[10px] text-emerald-400/50 ml-px">개월</span>
                        </span>
                        <span className="text-[9px] text-emerald-400/40">{Math.round(eff.compositeQuality ?? 0)}점</span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* 이론적 피크 (금색) */}
                <div className="flex items-center gap-1.5 bg-[#C4A052]/[0.10] border border-[#C4A052]/[0.25] rounded-lg px-3 py-2 shadow-[0_0_12px_rgba(196,160,82,0.08)]">
                  <span className="text-[9px] text-[#C4A052]/70 uppercase tracking-wider font-medium">Peak</span>
                  <span className="text-sm font-medium text-[#C4A052]">
                    {harvestWindow.peakMonth}<span className="text-[10px] text-[#C4A052]/50 ml-px">개월</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-1.5" title="질감·향·환원취·기포를 종합한 품질 점수 (0~100)">
                  <span className="text-[9px] text-white/25 uppercase tracking-wider">품질</span>
                  <span className="text-sm font-light text-white/60">
                    {Math.round(harvestWindow.peakScore)}<span className="text-[10px] text-white/20 ml-px">/100</span>
                  </span>
                </div>
                {/* 계획 기간 내 피크 (시안, 이론적과 다를 때만) */}
                {selectedProduct?.plannedDurationMonths && harvestWindow.peakMonth > selectedProduct.plannedDurationMonths && (
                  <>
                    <span className="text-white/10 text-[8px]">|</span>
                    <div className="flex items-center gap-1.5 bg-cyan-400/[0.06] border border-cyan-400/[0.15] rounded-lg px-2.5 py-1.5">
                      <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider font-medium">{selectedProduct.plannedDurationMonths}개월 내</span>
                      <span className="font-light text-cyan-400/80">
                        {(() => {
                          const planned = timelineData.filter(d => d.month <= (selectedProduct.plannedDurationMonths ?? 12));
                          if (planned.length === 0) return '—';
                          const best = planned.reduce((a, b) => (b.compositeQuality ?? 0) > (a.compositeQuality ?? 0) ? b : a);
                          return <><span className="text-sm font-mono">{best.month}</span><span className="text-[9px]">개월 · </span><span className="text-sm font-mono">{Math.round(best.compositeQuality ?? 0)}</span><span className="text-[9px]">점</span></>;
                        })()}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 rounded-full bg-[#C4A052]" />
                  <span className="text-[9px] text-white/30">종합 품질</span>
                </div>
                <span className="text-white/10 text-[8px] hidden sm:inline">|</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-px bg-emerald-400/40" />
                  <span className="text-[9px] text-emerald-400/30">질감</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-px border-t border-dashed border-emerald-400/30" />
                  <span className="text-[9px] text-emerald-400/30">기포</span>
                </div>
                <span className="text-white/10 text-[8px] hidden sm:inline">|</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-px bg-red-400/35" />
                  <span className="text-[9px] text-red-400/30">향 감쇠</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-px border-t border-dashed border-red-400/30" />
                  <span className="text-[9px] text-red-400/30">환원취</span>
                </div>
                <span className="text-white/10 text-[8px] hidden sm:inline">|</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                  <span className="text-[9px] text-emerald-400/30">추천 (±4점)</span>
                </div>
                {selectedProduct?.plannedDurationMonths && (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-px border-t border-dashed border-cyan-400/40" />
                      <span className="text-[9px] text-cyan-400/30">계획 기간</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 rounded-full bg-[#C4A052]/30" />
                <span className="text-[9px] text-white/20">종합 품질</span>
              </div>
              <span className="text-white/10 text-[8px] hidden sm:inline">|</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-px bg-emerald-400/20" />
                <span className="text-[9px] text-white/20">질감</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-px bg-red-400/20" />
                <span className="text-[9px] text-white/20">향 감쇠</span>
              </div>
            </div>
          )}
        </SectionWrapper>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* v3.0: 해양 환경 현황 + 최적 깊이 (2열) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OceanConditionsCard
            currentConditions={oceanCurrentConditions}
            dataSource={todayDataSource}
            tsiScore={annualOceanProfile?.tsiScore ?? null}
            accentColor="#22d3ee"
          />
          <OptimalDepthCard
            product={selectedProduct}
            config={config}
            months={selectedProduct?.plannedDurationMonths ?? 12}
            oceanConditions={productOceanStats ? {
              seaTemperature: productOceanStats.seaTemperature,
              currentVelocity: productOceanStats.currentVelocity,
              waveHeight: productOceanStats.waveHeight,
              wavePeriod: productOceanStats.wavePeriod,
              waterPressure: productOceanStats.waterPressure,
              salinity: productOceanStats.salinity,
            } : historicalOceanStats ? {
              seaTemperature: historicalOceanStats.seaTemperature,
              currentVelocity: historicalOceanStats.currentVelocity,
              waveHeight: historicalOceanStats.waveHeight,
              wavePeriod: historicalOceanStats.wavePeriod,
              waterPressure: historicalOceanStats.waterPressure,
              salinity: historicalOceanStats.salinity,
            } : null}
            accentColor="#C4A052"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* v3.1: 월별 수온 + 환경 영향도 (2열) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthlyProfileCard
            monthlyProfiles={monthlyOceanProfiles}
            accentColor="#22d3ee"
          />
          <EnvironmentalImpactCard
            oceanConditions={productOceanStats ? {
              seaTemperature: productOceanStats.seaTemperature,
              currentVelocity: productOceanStats.currentVelocity,
              waveHeight: productOceanStats.waveHeight,
              wavePeriod: productOceanStats.wavePeriod,
              waterPressure: productOceanStats.waterPressure,
              salinity: productOceanStats.salinity,
            } : historicalOceanStats ? {
              seaTemperature: historicalOceanStats.seaTemperature,
              currentVelocity: historicalOceanStats.currentVelocity,
              waveHeight: historicalOceanStats.waveHeight,
              wavePeriod: historicalOceanStats.wavePeriod,
              waterPressure: historicalOceanStats.waterPressure,
              salinity: historicalOceanStats.salinity,
            } : null}
            depthInfo={productOceanStats ? {
              depth: productOceanStats.correctionDepth,
              depthCorrected: productOceanStats.depthCorrected,
              dataPoints: productOceanStats.dataPoints,
              periodStart: productOceanStats.periodStart,
              periodEnd: productOceanStats.periodEnd,
            } : undefined}
            accentColor="#B76E79"
          />
        </div>

        {/* 보정 계수 다이얼로그 */}
        <AnimatePresence>
          {showCoefficientDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={(e) => { if (e.target === e.currentTarget) setShowCoefficientDialog(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0d1421] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                  <div className="p-2 bg-cyan-500/10 rounded-xl">
                    <Settings2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-medium text-white">보정 계수</h2>
                    <p className="text-[10px] text-white/25 mt-0.5">예측 시 적용 · 모델 학습에는 미사용</p>
                  </div>
                  <button onClick={() => setShowCoefficientDialog(false)} className="text-white/30 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-5">
                  <CoefficientSlider
                    label="TCI (질감 성숙)"
                    value={localTci}
                    onChange={setLocalTci}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    scientificBasis="가설적 추정 — 실험 검증 필요"
                    sourceType="hypothesis"
                    description={`Texture Catalysis Index — 해저 환경이 질감 발전(효모 자가분해·바디감)을 얼마나 촉진하는지 나타냅니다.\n\n도출 방식: 현재는 실험 데이터가 없어 가설 기반 추정치입니다. 해저의 일정한 저온(4~8°C)·고압(수심 30m ≈ 4기압) 환경이 효모 세포벽 분해를 가속한다는 가설에 기반하며, 값이 높을수록 숙성이 빠르게 진행됩니다.\n\n향후 실제 해저 숙성 와인의 관능 평가 데이터로 검증·보정할 예정입니다.`}
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
                    description={`Freshness Retention Index — 해저 숙성 중 과실향·산도가 보존되는 비율입니다.\n\n아레니우스 방정식이란?\n화학 반응 속도가 온도에 따라 얼마나 변하는지 계산하는 공식입니다.\n  k = A × e^(-Ea / RT)\n  k: 반응 속도, Ea: 활성화 에너지, R: 기체 상수, T: 절대 온도\n\n계산 방식:\n해저(약 6°C)와 셀러(약 12°C)의 산화 반응 속도를 비교합니다.\n  셀러 속도: k₁ = A × e^(-47000 / 8.314 × 285)\n  해저 속도: k₂ = A × e^(-47000 / 8.314 × 279)\n  FRI = k₂ / k₁ ≈ 0.56\n\n즉, 해저에서는 향 손실이 셀러 대비 56% 수준으로 느려집니다.`}
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
                    description={`Bubble Refinement Index — 수압이 CO₂ 기포를 얼마나 미세하게 만드는지 나타냅니다.\n\n헨리의 법칙이란?\n기체가 액체에 녹는 양은 압력에 비례한다는 법칙입니다.\n  C = k_H × P\n  C: 용해된 기체 농도, k_H: 헨리 상수, P: 기체 압력\n\n계산 방식:\n수심 30m에서는 수압이 약 4기압(지상 1 + 수압 3)입니다.\n  지상 CO₂ 용해: C₁ = k_H × 1atm\n  해저 CO₂ 용해: C₂ = k_H × 4atm\n  BRI = C₂ / C₁ = 4.0 (이론값)\n\n실제로는 온도·와인 성분 영향으로 보정하여 권장값 1.6을 사용합니다. 값이 높을수록 CO₂가 더 많이 녹아 기포가 작고 섬세해집니다.`}
                  />
                </div>
                <div className="flex gap-3 px-5 pb-5">
                  <button
                    onClick={() => setShowCoefficientDialog(false)}
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 rounded-xl py-2 text-sm transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveCoefficients();
                      setShowCoefficientDialog(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-black font-medium rounded-xl py-2 text-sm hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-3.5 h-3.5" />
                    저장
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* v5.0: 인양 실측 입력 모달 */}
        {showRetrievalModal && selectedProduct && latestPrediction && typeof document !== 'undefined' && createPortal(
          <RetrievalInputModal
            product={selectedProduct}
            prediction={latestPrediction}
            beforeProfile={beforeProfile}
            onClose={() => setShowRetrievalModal(false)}
            onSaved={() => setShowRetrievalModal(false)}
          />,
          document.body
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 비교 시음 입력 모달 (v5.0)
// ═══════════════════════════════════════════════════════════════════════════

const TASTING_FIELDS = [
  { key: 'fruity', label: '과실향' },
  { key: 'floralMineral', label: '플로럴·미네랄' },
  { key: 'yeastyAutolytic', label: '효모·숙성향' },
  { key: 'acidityFreshness', label: '산도·상쾌함' },
  { key: 'bodyTexture', label: '바디감·질감' },
  { key: 'finishComplexity', label: '여운·복합미' },
] as const;

type TastingScores = Record<string, string>;

function RetrievalInputModal({
  product,
  prediction,
  beforeProfile: aiBeforeProfile,
  onClose,
  onSaved,
}: {
  product: AgingProduct;
  prediction: AgingPrediction;
  beforeProfile: Record<string, number> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<'terrestrial' | 'undersea'>('terrestrial');
  const [meta, setMeta] = useState({
    retrievalDate: new Date().toISOString().split('T')[0],
    actualDurationMonths: prediction.underseaDurationMonths ?? 12,
    tastingPanelSize: '1',
    tastingNotes: '',
  });
  const [terrestrial, setTerrestrial] = useState<TastingScores>({ fruity: '', floralMineral: '', yeastyAutolytic: '', acidityFreshness: '', bodyTexture: '', finishComplexity: '', overallQuality: '' });
  const [undersea, setUndersea] = useState<TastingScores>({ fruity: '', floralMineral: '', yeastyAutolytic: '', acidityFreshness: '', bodyTexture: '', finishComplexity: '', overallQuality: '' });
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  // 기존 저장 데이터 로드
  useEffect(() => {
    (async () => {
      const { fetchRetrievalResults } = await import('@/lib/supabase/database/uaps');
      const results = await fetchRetrievalResults(product.id);
      if (!results || results.length === 0) return;
      const latest = results[0];
      setExistingId(latest.id);
      const str = (v: number | null) => v !== null ? String(v) : '';
      setTerrestrial({
        fruity: str(latest.terrestrialFruity),
        floralMineral: str(latest.terrestrialFloralMineral),
        yeastyAutolytic: str(latest.terrestrialYeastyAutolytic),
        acidityFreshness: str(latest.terrestrialAcidityFreshness),
        bodyTexture: str(latest.terrestrialBodyTexture),
        finishComplexity: str(latest.terrestrialFinishComplexity),
        overallQuality: str(latest.terrestrialOverallQuality),
      });
      setUndersea({
        fruity: str(latest.actualFruity),
        floralMineral: str(latest.actualFloralMineral),
        yeastyAutolytic: str(latest.actualYeastyAutolytic),
        acidityFreshness: str(latest.actualAcidityFreshness),
        bodyTexture: str(latest.actualBodyTexture),
        finishComplexity: str(latest.actualFinishComplexity),
        overallQuality: str(latest.actualOverallQuality),
      });
      setMeta(m => ({
        ...m,
        retrievalDate: latest.retrievalDate || m.retrievalDate,
        actualDurationMonths: latest.actualDurationMonths ?? m.actualDurationMonths,
        tastingPanelSize: String(latest.tastingPanelSize ?? 1),
        tastingNotes: latest.tastingNotes || '',
      }));
    })();
  }, [product.id]);

  // 해저 숙성 예측값
  const underseaPredMap: Record<string, number | null> = {
    fruity: prediction.predictedFruity,
    floralMineral: prediction.predictedFloralMineral,
    yeastyAutolytic: prediction.predictedYeastyAutolytic,
    acidityFreshness: prediction.predictedAcidityFreshness,
    bodyTexture: prediction.predictedBodyTexture,
    finishComplexity: prediction.predictedFinishComplexity,
    overallQuality: prediction.overallQualityScore,
  };

  // 지상 보관 예측값 (투하 전 프로파일)
  const terrestrialPredMap: Record<string, number | null> = {
    fruity: aiBeforeProfile?.fruity ?? null,
    floralMineral: aiBeforeProfile?.floralMineral ?? null,
    yeastyAutolytic: aiBeforeProfile?.yeastyAutolytic ?? null,
    acidityFreshness: aiBeforeProfile?.acidityFreshness ?? null,
    bodyTexture: aiBeforeProfile?.bodyTexture ?? null,
    finishComplexity: aiBeforeProfile?.finishComplexity ?? null,
    overallQuality: null,
  };

  const num = (v: string) => v ? Number(v) : null;

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      productId: product.id,
      retrievalDate: meta.retrievalDate,
      actualDurationMonths: meta.actualDurationMonths,
      actualFruity: num(undersea.fruity),
      actualFloralMineral: num(undersea.floralMineral),
      actualYeastyAutolytic: num(undersea.yeastyAutolytic),
      actualAcidityFreshness: num(undersea.acidityFreshness),
      actualBodyTexture: num(undersea.bodyTexture),
      actualFinishComplexity: num(undersea.finishComplexity),
      actualOverallQuality: num(undersea.overallQuality),
      terrestrialFruity: num(terrestrial.fruity),
      terrestrialFloralMineral: num(terrestrial.floralMineral),
      terrestrialYeastyAutolytic: num(terrestrial.yeastyAutolytic),
      terrestrialAcidityFreshness: num(terrestrial.acidityFreshness),
      terrestrialBodyTexture: num(terrestrial.bodyTexture),
      terrestrialFinishComplexity: num(terrestrial.finishComplexity),
      terrestrialOverallQuality: num(terrestrial.overallQuality),
      tastingPanelSize: Number(meta.tastingPanelSize) || 1,
      tastingNotes: meta.tastingNotes || null,
      isSimulated: false,
      predictionId: prediction.id,
    };

    if (existingId) {
      const { updateRetrievalResult } = await import('@/lib/supabase/database/uaps');
      await updateRetrievalResult(existingId, payload);
    } else {
      const { createRetrievalResult } = await import('@/lib/supabase/database/uaps');
      await createRetrievalResult(payload);
    }
    setSaving(false);
    onSaved();
  };

  const scores = tab === 'terrestrial' ? terrestrial : undersea;
  const setScores = tab === 'terrestrial' ? setTerrestrial : setUndersea;
  const isTerrestrial = tab === 'terrestrial';

  // 입력 완료 상태 표시
  const terrestrialFilled = Object.values(terrestrial).some(v => v !== '');
  const underseaFilled = Object.values(undersea).some(v => v !== '');

  const inputClass = 'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 transition-colors';
  const labelClass = 'block text-xs text-white/50 mb-1.5';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0d1421] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        {/* 헤더 — ProductModal과 동일 */}
        <div className="flex items-center gap-3 p-5 border-b border-white/[0.06]">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium text-white">비교 시음 입력</h2>
            <p className="text-[11px] text-white/30 mt-0.5">{product.productName} · {product.producer}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 예측 요약 */}
          <div className="bg-[#C4A052]/[0.06] border border-[#C4A052]/[0.15] rounded-xl px-4 py-3">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-white/30">AI 예측 품질</span>
                <span className="text-[#C4A052] font-mono font-medium ml-1.5">{Math.round(prediction.overallQualityScore ?? 0)}점</span>
              </div>
              <div>
                <span className="text-white/30">숙성 예측</span>
                <span className="text-white/50 font-mono ml-1.5">{prediction.underseaDurationMonths}개월</span>
              </div>
              {product.vintage && (
                <div>
                  <span className="text-white/30">빈티지</span>
                  <span className="text-white/50 font-mono ml-1.5">{product.vintage}</span>
                </div>
              )}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>시음 날짜</label>
              <input type="date" value={meta.retrievalDate} onChange={e => setMeta(f => ({ ...f, retrievalDate: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>숙성 기간 (개월)</label>
              <input type="number" value={meta.actualDurationMonths} onChange={e => setMeta(f => ({ ...f, actualDurationMonths: Number(e.target.value) }))}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>시음 패널 수</label>
              <input type="number" min={1} value={meta.tastingPanelSize} onChange={e => setMeta(f => ({ ...f, tastingPanelSize: e.target.value }))}
                className={inputClass} />
            </div>
          </div>

          {/* 탭: 지상 보관 vs 해저 숙성 */}
          <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
            <button
              onClick={() => setTab('terrestrial')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${
                isTerrestrial ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-sm' : 'text-white/35 hover:text-white/55 border border-transparent'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              지상 보관 (대조군)
              {terrestrialFilled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
            <button
              onClick={() => setTab('undersea')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${
                !isTerrestrial ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm' : 'text-white/35 hover:text-white/55 border border-transparent'
              }`}
            >
              <Anchor className="w-3.5 h-3.5" />
              해저 숙성
              {underseaFilled && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            </button>
          </div>

          {/* 풍미 6축 입력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass} style={{ marginBottom: 0 }}>
                {isTerrestrial ? '지상 보관 시음 결과' : '해저 숙성 시음 결과'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const empty = { fruity: '', floralMineral: '', yeastyAutolytic: '', acidityFreshness: '', bodyTexture: '', finishComplexity: '', overallQuality: '' };
                    if (isTerrestrial) setTerrestrial(empty); else setUndersea(empty);
                  }}
                  className="text-[10px] text-white/30 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded border border-white/10 hover:border-red-400/30"
                >
                  초기화
                </button>
                <span className="text-[10px] text-[#C4A052]/50">AI 예측 참고</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TASTING_FIELDS.map(f => {
                const activePredMap = isTerrestrial ? terrestrialPredMap : underseaPredMap;
                const predVal = activePredMap[f.key];
                const predStr = predVal != null ? String(Math.round(predVal)) : '';
                return (
                  <div key={f.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-white/40">{f.label}</label>
                      {predStr && <span className="text-[10px] text-[#C4A052]/35 font-mono">{predStr}</span>}
                    </div>
                    <input type="number" min={0} max={100} value={scores[f.key] || ''}
                      onChange={e => setScores(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={predStr || '0~100'}
                      className={inputClass} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 종합 품질 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass} style={{ marginBottom: 0 }}>종합 품질 (0~100)</label>
              {!isTerrestrial && <span className="text-[10px] text-[#C4A052]/35 font-mono">{Math.round(prediction.overallQualityScore ?? 0)}</span>}
            </div>
            <input type="number" min={0} max={100} value={scores.overallQuality || ''}
              onChange={e => setScores(prev => ({ ...prev, overallQuality: e.target.value }))}
              placeholder={isTerrestrial ? '0~100' : String(Math.round(prediction.overallQualityScore ?? 0))}
              className={inputClass} />
          </div>

          {/* 시음 노트 */}
          <div>
            <label className={labelClass}>시음 노트</label>
            <textarea value={meta.tastingNotes} onChange={e => setMeta(f => ({ ...f, tastingNotes: e.target.value }))}
              rows={2} className={inputClass + ' resize-none'} placeholder="특이사항, 비교 소감 등" />
          </div>

          {/* 저장 */}
          <button onClick={handleSave} disabled={saving || (!terrestrialFilled && !underseaFilled)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/90 to-cyan-400/90 text-black font-medium rounded-xl py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            비교 시음 저장
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 제품 추가/수정 모달
// ═══════════════════════════════════════════════════════════════════════════

// 모달용 카테고리 목록 (DB product_category 값 기준)
const MODAL_CATEGORIES = [
  { value: 'champagne',   label: '🥂 샴페인' },
  { value: 'red_wine',    label: '🍷 레드와인' },
  { value: 'white_wine',  label: '🍾 화이트와인' },
  { value: 'whisky',      label: '🥃 위스키' },
  { value: 'sake',        label: '🍶 사케' },
  { value: 'coldbrew',    label: '☕ 콜드브루' },
  { value: 'puer',        label: '🫖 생차/보이차' },
  { value: 'soy_sauce',   label: '🫙 간장' },
  { value: 'vinegar',     label: '🍶 식초' },
  { value: 'spirits',     label: '🍚 한국 전통주' },
];

function ProductModal({
  onClose,
  onSubmit,
  initialData,
  initialCategory = 'champagne',
}: {
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
  initialData?: AgingProduct | null;
  initialCategory?: string;
}) {
  const isEdit = !!initialData;
  const [productCategory, setProductCategory] = useState(
    initialData?.productCategory ?? initialCategory
  );
  const [productName, setProductName] = useState(initialData?.productName ?? '');

  // 카테고리별 동적 설정
  const fieldConfig = CATEGORY_FIELD_CONFIG[productCategory] ?? CATEGORY_FIELD_CONFIG['champagne'];
  const subtypeOptions = CATEGORY_SUBTYPES[productCategory] ?? CATEGORY_SUBTYPES['champagne'];
  const reductionChecklist: ReductionCheckItem[] = CATEGORY_REDUCTION_CHECKLIST[productCategory] ?? CATEGORY_REDUCTION_CHECKLIST['champagne'];

  const [subtype, setSubtype] = useState<string>(
    initialData?.wineType ?? subtypeOptions[0]?.value ?? ''
  );
  const [vintage, setVintage] = useState<string>(initialData?.vintage?.toString() ?? '');
  const [ph, setPh] = useState<string>(initialData?.ph?.toString() ?? '');
  const [dosage, setDosage] = useState<string>(initialData?.dosage?.toString() ?? '');
  const [alcohol, setAlcohol] = useState<string>(initialData?.alcohol?.toString() ?? '');
  const [closureType, setClosureType] = useState<string>(
    initialData?.closureType ?? CATEGORY_DEFAULT_CLOSURE[productCategory] ?? 'cork_natural'
  );

  // 카테고리 변경 시 서브타입 + 체크리스트 초기화
  const handleCategoryChange = (newCategory: string) => {
    setProductCategory(newCategory);
    const newSubtypes = CATEGORY_SUBTYPES[newCategory];
    if (newSubtypes?.[0]) setSubtype(newSubtypes[0].value);
    const newChecklist = CATEGORY_REDUCTION_CHECKLIST[newCategory] ?? [];
    const freshChecks: Record<string, boolean> = {};
    newChecklist.forEach((item) => { freshChecks[item.id] = false; });
    setReductionChecks(freshChecks);
    if (!CATEGORY_FIELD_CONFIG[newCategory]?.showDosage) setDosage('');
    if (!CATEGORY_FIELD_CONFIG[newCategory]?.showVintage) setVintage('');
    setClosureType(CATEGORY_DEFAULT_CLOSURE[newCategory] ?? 'cork_natural');
  };

  // 환원 성향 체크리스트 → 자동 산출
  const [reductionChecks, setReductionChecks] = useState<Record<string, boolean>>(() => {
    if (initialData?.reductionChecks) return { ...initialData.reductionChecks };
    const initial: Record<string, boolean> = {};
    reductionChecklist.forEach((item) => { initial[item.id] = false; });
    return initial;
  });

  const reductionScore = reductionChecklist.reduce(
    (sum, item) => sum + (reductionChecks[item.id] ? item.weight : 0), 0
  );
  const reductionPotential: ReductionPotential = reductionScore >= 3 ? 'high' : reductionScore >= 1 ? 'medium' : 'low';

  const toggleReductionCheck = (id: string) => {
    const item = reductionChecklist.find((c) => c.id === id);
    setReductionChecks((prev) => {
      const next = { ...prev };
      if (item?.group) {
        reductionChecklist.forEach((c) => {
          if (c.group === item.group && c.id !== id) next[c.id] = false;
        });
      }
      next[id] = !prev[id];
      return next;
    });
  };

  // 그룹별 분리 (라디오 그룹 vs 복수 선택)
  const groupedItems = reductionChecklist.filter((item) => item.group !== null);
  const ungroupedItems = reductionChecklist.filter((item) => item.group === null);
  const uniqueGroups = [...new Set(groupedItems.map((item) => item.group))];

  const [terrestrialAgingYears, setTerrestrialAgingYears] = useState<string>(
    initialData?.terrestrialAgingYears?.toString() ?? ''
  );
  const [immersionDate, setImmersionDate] = useState(initialData?.immersionDate ?? '');
  const [plannedDurationMonths, setPlannedDurationMonths] = useState<string>(initialData?.plannedDurationMonths?.toString() ?? '');
  const [agingDepth, setAgingDepth] = useState<string>(initialData?.agingDepth?.toString() ?? '30');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAISearching, setIsAISearching] = useState(false);

  const handleAISearch = async () => {
    if (!productName.trim()) return;
    setIsAISearching(true);
    try {
      const res = await fetch('/api/uaps/product-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim(), productCategory }),
      });
      if (!res.ok) throw new Error('AI 조회 실패');
      const info = await res.json();

      // 필드 자동 채우기 (기존 값이 비어있을 때만)
      if (info.subtype) {
        const match = subtypeOptions.find(
          (opt: { value: string; label: string }) =>
            opt.value.toLowerCase() === info.subtype.toLowerCase() ||
            opt.label.toLowerCase().includes(info.subtype.toLowerCase())
        );
        if (match) setSubtype(match.value);
      }
      if (info.vintage && !vintage) setVintage(String(info.vintage));
      if (info.ph && !ph) setPh(String(info.ph));
      if (info.dosage && !dosage) setDosage(String(info.dosage));
      if (info.alcohol && !alcohol) setAlcohol(String(info.alcohol));
      if (info.closureType) {
        const validClosures = Object.keys(CLOSURE_TYPE_LABELS);
        if (validClosures.includes(info.closureType)) setClosureType(info.closureType);
      }
      if (info.terrestrialAgingYears && !terrestrialAgingYears) {
        setTerrestrialAgingYears(String(info.terrestrialAgingYears));
      }
      if (info.notes && !notes) setNotes(info.notes);

      // 환원 성향 체크리스트: AI가 직접 체크한 항목 반영
      if (info.reductionChecks && typeof info.reductionChecks === 'object') {
        const newChecks: Record<string, boolean> = {};
        reductionChecklist.forEach((item) => { newChecks[item.id] = false; });

        // AI 응답의 체크 항목 반영
        for (const [id, val] of Object.entries(info.reductionChecks)) {
          if (val === true && reductionChecklist.some(item => item.id === id)) {
            // 그룹 체크: 같은 그룹 내 다른 항목은 false
            const checkItem = reductionChecklist.find(item => item.id === id);
            if (checkItem?.group) {
              reductionChecklist.forEach(item => {
                if (item.group === checkItem.group) newChecks[item.id] = false;
              });
            }
            newChecks[id] = true;
          }
        }

        setReductionChecks(newChecks);
      }
    } catch {
      // 실패 시 무시
    } finally {
      setIsAISearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    setIsSubmitting(true);
    // champagne만 WineType으로, 나머지는 null
    const isWineCategory = productCategory === 'champagne';
    await onSubmit({
      productName: productName.trim(),
      productCategory,
      wineType: isWineCategory ? (subtype as WineType) : null,
      vintage: vintage ? Number(vintage) : null,
      producer: '',
      ph: ph ? Number(ph) : null,
      dosage: dosage ? Number(dosage) : null,
      alcohol: alcohol ? Number(alcohol) : null,
      acidity: null,
      reductionPotential,
      reductionChecks: { ...reductionChecks, _subtype: subtype as unknown as boolean },
      closureType: closureType as ClosureType,
      immersionDate: immersionDate || null,
      plannedDurationMonths: plannedDurationMonths ? Number(plannedDurationMonths) : null,
      agingDepth: agingDepth ? Number(agingDepth) : 30,
      terrestrialAgingYears: terrestrialAgingYears ? Number(terrestrialAgingYears) : null,
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
          {/* 카테고리 선택 */}
          <div>
            <label className={labelClass}>카테고리</label>
            <select
              value={productCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={inputClass}
            >
              {MODAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* 제품명 + AI 정보 찾기 */}
          <div>
            <label className={labelClass}>제품명 *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="제품명을 입력하세요"
                className={inputClass + ' flex-1'}
                required
              />
              <button
                type="button"
                onClick={handleAISearch}
                disabled={!productName.trim() || isAISearching}
                className="shrink-0 px-3 py-2.5 bg-[#C4A052]/10 hover:bg-[#C4A052]/20 border border-[#C4A052]/20 text-[#C4A052] text-xs rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isAISearching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {isAISearching ? 'AI 검색 중...' : 'AI 정보 찾기'}
              </button>
            </div>
          </div>

          {/* 서브타입 + 빈티지 (동적) */}
          <div className={`grid gap-3 ${fieldConfig.showVintage ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className={labelClass}>{fieldConfig.subtypeLabel}</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className={inputClass}>
                {subtypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {fieldConfig.showVintage && (
              <div>
                <label className={labelClass}>{fieldConfig.vintageLabel}</label>
                <input type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} placeholder="2024" className={inputClass} />
              </div>
            )}
          </div>

          {/* pH / Dosage / Alcohol (동적) */}
          <div className={`grid grid-cols-1 gap-3 ${fieldConfig.showDosage && fieldConfig.showAlcohol ? 'sm:grid-cols-3' : fieldConfig.showDosage || fieldConfig.showAlcohol ? 'sm:grid-cols-2' : ''}`}>
            <div>
              <label className={labelClass}>pH <span className="text-white/20">(선택)</span></label>
              <input type="number" step="0.01" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="3.10" className={inputClass} />
            </div>
            {fieldConfig.showDosage && (
              <div>
                <label className={labelClass}>Dosage g/L <span className="text-white/20">(선택)</span></label>
                <input type="number" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="8" className={inputClass} />
              </div>
            )}
            {fieldConfig.showAlcohol && (
              <div>
                <label className={labelClass}>Alcohol % <span className="text-white/20">(선택)</span></label>
                <input type="number" value={alcohol} onChange={(e) => setAlcohol(e.target.value)} placeholder="12.5" className={inputClass} />
              </div>
            )}
          </div>

          {/* 환원 성향 체크리스트 (카테고리별 동적) */}
          <div>
            <label className={labelClass}>환원 성향 (해당 항목 체크)</label>
            {/* 그룹별 라디오 */}
            {uniqueGroups.map((group) => (
              <div key={group}>
                <p className="text-[11px] text-white/30 mb-1.5 mt-2">{group} (하나만 선택)</p>
                <div className="space-y-1.5">
                  {groupedItems.filter((item) => item.group === group).map((item) => (
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
                        name={`group-${group}`}
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        className="accent-cyan-400"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-white/30 ml-2 hidden sm:inline">{item.desc}</span>
                      </div>
                      <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : item.weight < 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                        {item.weight > 0 ? '+' : ''}{item.weight}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {/* 비그룹 복수 선택 */}
            {ungroupedItems.length > 0 && (
              <>
                <p className="text-[11px] text-white/30 mb-1.5 mt-3">특성 (복수 선택 가능)</p>
                <div className="space-y-1.5">
                  {ungroupedItems.map((item) => (
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
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        className="accent-cyan-400 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-white/30 ml-2 hidden sm:inline">{item.desc}</span>
                      </div>
                      <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : item.weight < 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                        {item.weight > 0 ? '+' : ''}{item.weight}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
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

          {/* v3.0: 마개 타입 */}
          <div>
            <label className={labelClass}>마개 타입</label>
            <select
              value={closureType}
              onChange={(e) => setClosureType(e.target.value)}
              className={inputClass}
            >
              {Object.entries(CLOSURE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-[11px] text-white/30 mt-1">
              마개의 산소 투과율(OTR)이 해저 숙성 시 FRI 보정에 반영됩니다.
            </p>
          </div>

          {/* 투하 전 지상 숙성 기간 */}
          <div>
            <label className={labelClass}>
              투하 전 숙성 기간 (년) <span className="text-white/20">(선택)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={terrestrialAgingYears}
                onChange={(e) => setTerrestrialAgingYears(e.target.value)}
                placeholder="투하 전 실제 숙성 연수"
                className={inputClass + ' flex-1'}
              />
              {terrestrialAgingYears && (
                <span className="text-xs text-cyan-400 whitespace-nowrap">실측값 사용</span>
              )}
            </div>
            <p className="text-[11px] text-white/30 mt-1.5">
              투하 전 실제 숙성 연수를 입력하면 예측 정밀도가 향상됩니다.
            </p>
          </div>

          {/* 투하 조건 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {/* 메모 */}
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

          {/* 버튼 */}
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

const FALLBACK_PROFILES: Record<WineType, Record<string, number>> = {
  blanc_de_blancs: { fruity: 70, floralMineral: 65, yeastyAutolytic: 35, acidityFreshness: 80, bodyTexture: 45, finishComplexity: 55 },
  blanc_de_noirs:  { fruity: 55, floralMineral: 40, yeastyAutolytic: 45, acidityFreshness: 65, bodyTexture: 65, finishComplexity: 55 },
  rose:            { fruity: 65, floralMineral: 50, yeastyAutolytic: 30, acidityFreshness: 70, bodyTexture: 50, finishComplexity: 45 },
  blend:           { fruity: 60, floralMineral: 45, yeastyAutolytic: 40, acidityFreshness: 70, bodyTexture: 55, finishComplexity: 50 },
  vintage:         { fruity: 40, floralMineral: 55, yeastyAutolytic: 65, acidityFreshness: 55, bodyTexture: 70, finishComplexity: 75 },
};

function FlavorRadar({
  beforeProfile,
  afterProfile,
  products,
  selectedProductId,
  onSelectProduct,
}: {
  beforeProfile: Record<string, number> | null;
  afterProfile: Record<string, number> | null;
  products?: { id: string; productName: string }[];
  selectedProductId?: string | null;
  onSelectProduct?: (id: string) => void;
}) {
  const ZERO_PROFILE: Record<string, number> = { fruity: 0, floralMineral: 0, yeastyAutolytic: 0, acidityFreshness: 0, bodyTexture: 0, finishComplexity: 0 };
  const before = beforeProfile || ZERO_PROFILE;
  const after = afterProfile || before;

  const radarData = FLAVOR_AXES.map((axis) => ({
    axis: axis.label,
    before: Math.round(Math.min(100, Math.max(0, before[axis.key] ?? 0))),
    after: Math.round(Math.min(100, Math.max(0, after[axis.key] ?? 0))),
  }));

  const changes = radarData.map((d) => ({
    label: d.axis,
    before: d.before,
    after: d.after,
    diff: d.after - d.before,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
      {/* 제품 번호 — 데스크탑: 좌측 세로, 모바일: 상단 가로 */}
      {products && products.length > 0 && (
        <div className="lg:w-[130px] lg:pr-3 lg:border-r lg:border-white/[0.04] flex lg:flex-col items-start">
          <div className="flex lg:flex-col gap-1.5 flex-wrap overflow-x-auto pb-1 lg:pb-0">
            {products!.map((p, i) => (
              <button
                key={p.id}
                onClick={() => onSelectProduct?.(p.id)}
                title={p.productName}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-all whitespace-nowrap ${
                  selectedProductId === p.id
                    ? 'bg-[#B76E79]/15 border border-[#B76E79]/30 text-[#B76E79]'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/[0.12]'
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/[0.08] text-[9px] font-mono shrink-0">{i + 1}</span>
                <span className="truncate max-w-[80px] lg:max-w-[100px]">{p.productName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 레이더 차트 */}
      <div className="flex-1 h-[280px] sm:h-[320px] lg:h-[360px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="88%">
            <defs>
              <radialGradient id="radarBeforeFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.10} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
              </radialGradient>
              <radialGradient id="radarAfterFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#B76E79" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#B76E79" stopOpacity={0.06} />
              </radialGradient>
              <filter id="radarGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.04)" gridType="circle" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'var(--font-pretendard, Pretendard, sans-serif)' }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="투하 전"
              dataKey="before"
              stroke="rgba(34,211,238,0.4)"
              fill="url(#radarBeforeFill)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <Radar
              name="AI 예측"
              dataKey="after"
              stroke="#B76E79"
              fill="url(#radarAfterFill)"
              strokeWidth={2}
              filter="url(#radarGlow)"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 우측 패널 — 범례 + 변화량 */}
      <div className="lg:w-[220px] flex flex-col justify-center lg:pl-2 lg:border-l lg:border-white/[0.04]">
        {/* 범례 */}
        <div className="flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2 mb-4 lg:mb-5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-px border-t border-dashed border-cyan-400/50" />
            <span className="text-[10px] text-white/40 tracking-wide">투하 전</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-[2px] rounded-full bg-[#B76E79]" />
            <span className="text-[10px] text-white/40 tracking-wide">해저 숙성 후</span>
          </div>
        </div>

        {/* 6축 변화량 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
          {changes.map((c) => {
            const isPositive = c.diff > 0;
            const isNegative = c.diff < 0;
            return (
              <div
                key={c.label}
                className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                  isPositive
                    ? 'bg-[#B76E79]/[0.06] border border-[#B76E79]/[0.12]'
                    : isNegative
                    ? 'bg-cyan-400/[0.04] border border-cyan-400/[0.08]'
                    : 'bg-white/[0.02] border border-white/[0.04]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[9px] lg:text-[10px] text-white/30 tracking-wide leading-none mb-0.5">{c.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] lg:text-xs text-white/20 font-mono">{c.before}</span>
                    <span className="text-[8px] lg:text-[10px] text-white/15">→</span>
                    <span className="text-[10px] lg:text-xs text-white/50 font-mono font-medium">{c.after}</span>
                  </div>
                </div>
                <span
                  className={`text-sm lg:text-base font-mono font-semibold tabular-nums ${
                    isPositive ? 'text-[#B76E79]' : isNegative ? 'text-cyan-400/70' : 'text-white/15'
                  }`}
                  style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
                >
                  {isPositive ? '+' : ''}{c.diff}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Timeline & Golden Window 차트
// ═══════════════════════════════════════════════════════════════════════════

function TimelineChart({
  data,
  harvestWindow,
  plannedMonths,
}: {
  data: { month: number; textureMaturity: number; aromaFreshness: number; offFlavorRisk: number; bubbleRefinement: number; compositeQuality?: number; gainScore?: number; lossScore?: number; netBenefit?: number }[];
  harvestWindow: { startMonths: number; endMonths: number; peakMonth: number; peakScore: number; recommendation: string } | null;
  plannedMonths?: number | null;
}) {
  const peakPoint = harvestWindow
    ? data.find((d) => d.month === harvestWindow.peakMonth)
    : null;

  // 계획 기간 내 피크 (이론적 피크와 다를 수 있음)
  const plannedPeakPoint = plannedMonths
    ? (() => {
        const planned = data.filter(d => d.month <= plannedMonths);
        if (planned.length === 0) return null;
        return planned.reduce((best, d) =>
          (d.compositeQuality ?? 0) > (best.compositeQuality ?? 0) ? d : best
        );
      })()
    : null;

  // 효율 최적점: 피크 점수에서 4점 이내에 처음 도달하는 시점
  const efficientPoint = harvestWindow
    ? (() => {
        const threshold = harvestWindow.peakScore - 4;
        return data.find(d => (d.compositeQuality ?? 0) >= threshold) ?? null;
      })()
    : null;

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: number }) => {
    if (!active || !payload?.length) return null;
    const get = (key: string) => payload.find((p) => p.dataKey === key)?.value;
    const quality = get('compositeQuality');
    const texture = get('textureMaturity');
    const bubble = get('bubbleRefinement');
    const aroma = get('aromaFreshness');
    const offFlavor = get('offFlavorRisk');
    const isPeak = harvestWindow && label === harvestWindow.peakMonth;
    return (
      <div className={`px-3 py-2.5 rounded-xl border backdrop-blur-md ${isPeak ? 'bg-[#C4A052]/10 border-[#C4A052]/30' : 'bg-[#0d1421]/90 border-white/[0.08]'}`}>
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <span className={`text-[11px] font-medium ${isPeak ? 'text-[#C4A052]' : 'text-white/60'}`}>
            {label}개월{isPeak ? ' — Peak' : ''}
          </span>
          {quality != null && (
            <span className="text-sm font-mono font-medium text-[#C4A052]">{Math.round(quality)}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {texture != null && <span className="text-[10px] text-emerald-400/60">질감 {Math.round(texture)}</span>}
          {aroma != null && <span className="text-[10px] text-red-400/50">향 {Math.round(aroma)}</span>}
          {bubble != null && <span className="text-[10px] text-emerald-400/60">기포 {Math.round(bubble)}</span>}
          {offFlavor != null && <span className="text-[10px] text-red-400/50">환원취 {Math.round(offFlavor)}</span>}
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 12, left: -10, bottom: 5 }}>
        <defs>
          {/* 종합 품질 곡선 아래 그라디언트 — 금색 */}
          <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4A052" stopOpacity={0.2} />
            <stop offset="60%" stopColor="#C4A052" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#C4A052" stopOpacity={0} />
          </linearGradient>
          {/* 이득 영역 */}
          <linearGradient id="gainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.22} />
            <stop offset="70%" stopColor="#22c55e" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
          {/* 손실 영역 */}
          <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} />
            <stop offset="70%" stopColor="#ef4444" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
          {/* 피크 마커 글로우 */}
          <filter id="peakGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
          tickFormatter={(v) => `${v}`}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          tickLine={false}
          label={{ value: '개월', position: 'insideBottomRight', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          tickCount={6}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(196,160,82,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />

        {/* 3구간 배경 제거됨 */}

        {/* 이득/손실 영역 — 극히 미묘한 배경 */}
        <Area type="monotone" dataKey="gainScore" stroke="none" fill="url(#gainFill)" legendType="none" />
        <Area type="monotone" dataKey="lossScore" stroke="none" fill="url(#lossFill)" legendType="none" />

        {/* 이득 고스트 라인: 질감(실선) + 기포(점선) — 에메랄드 */}
        <Line type="monotone" dataKey="textureMaturity" stroke="#34d399" strokeWidth={1} strokeOpacity={0.4} dot={false} legendType="none" />
        <Line type="monotone" dataKey="bubbleRefinement" stroke="#34d399" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 4" dot={false} legendType="none" />

        {/* 손실 고스트 라인: 향 신선도(실선, 하강=감쇠) + Off-flavor(점선) — 레드 */}
        <Line type="monotone" dataKey="aromaFreshness" stroke="#f87171" strokeWidth={1} strokeOpacity={0.35} dot={false} legendType="none" />
        <Line type="monotone" dataKey="offFlavorRisk" stroke="#f87171" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 4" dot={false} legendType="none" />

        {/* 종합 품질 곡선 — 주인공 */}
        <Area
          type="monotone"
          dataKey="compositeQuality"
          stroke="#C4A052"
          strokeWidth={2.5}
          fill="url(#qualityGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#C4A052', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 1.5 }}
          legendType="none"
        />

        {/* 계획 기간 수직선 (점선, 시안) */}
        {plannedMonths && (
          <ReferenceLine
            x={plannedMonths}
            stroke="#22d3ee"
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.3}
            label={{ value: `${plannedMonths}개월`, position: 'top', fill: 'rgba(34,211,238,0.5)', fontSize: 9 }}
          />
        )}

        {/* 이론적 피크 수직선 (금색) */}
        {harvestWindow && (
          <ReferenceLine
            x={harvestWindow.peakMonth}
            stroke="#C4A052"
            strokeWidth={1}
            strokeDasharray="2 3"
            strokeOpacity={0.4}
          />
        )}

        {/* 계획 기간 내 피크 마커 (시안, 이론적 피크와 다를 때만) */}
        {plannedMonths && plannedPeakPoint && harvestWindow && plannedPeakPoint.month !== harvestWindow.peakMonth && (
          <ReferenceDot
            x={plannedPeakPoint.month}
            y={plannedPeakPoint.compositeQuality ?? 0}
            r={4}
            fill="#22d3ee"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1.5}
          />
        )}

        {/* 효율 최적점 마커 + 라벨 (초록) */}
        {efficientPoint && harvestWindow && efficientPoint.month < harvestWindow.peakMonth && (
          <>
            <ReferenceDot
              x={efficientPoint.month}
              y={efficientPoint.compositeQuality ?? 0}
              r={4}
              fill="#34d399"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={efficientPoint.month}
              y={(efficientPoint.compositeQuality ?? 0) + 6}
              r={0}
              label={{ value: '추천', fill: '#34d399', fontSize: 9, fontWeight: 600 }}
            />
          </>
        )}

        {/* 이론적 피크 마커 + 라벨 (금색) */}
        {harvestWindow && peakPoint && (
          <>
            <ReferenceDot
              x={harvestWindow.peakMonth}
              y={peakPoint.compositeQuality ?? 0}
              r={5}
              fill="#C4A052"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              filter="url(#peakGlow)"
            />
            <ReferenceDot
              x={harvestWindow.peakMonth}
              y={(peakPoint.compositeQuality ?? 0) + 6}
              r={0}
              label={{ value: 'Peak', fill: '#C4A052', fontSize: 9, fontWeight: 600 }}
            />
          </>
        )}
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
  description,
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
