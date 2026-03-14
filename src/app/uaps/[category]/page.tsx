'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  Sparkles,
  Target,
  Database,
  Gauge,
  Save,
  BarChart3,
  Info,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';
import { useUAPSStore } from '@/lib/store/uaps-store';
import type {
  AgingProduct,
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
  REDUCTION_POTENTIAL_LABELS,
  FLAVOR_AXES,
  CATEGORY_FIELD_CONFIG,
  CATEGORY_SUBTYPES,
  CATEGORY_REDUCTION_CHECKLIST,
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
import { OceanConditionsCard, OptimalDepthCard, EnvironmentalImpactCard } from '../components/OceanCardsV3';
import { calculateProductOceanStats } from '@/lib/utils/uaps-ocean-profile';

// ═══════════════════════════════════════════════════════════════════════════
// 카테고리 목록 (드롭다운용)
// ═══════════════════════════════════════════════════════════════════════════

const ALL_CATEGORIES = [
  { slug: 'champagne',  label: '샴페인',      emoji: '🥂', href: '/uaps' },
  { slug: 'red-wine',   label: '레드와인',    emoji: '🍷', href: '/uaps/red-wine' },
  { slug: 'white-wine', label: '화이트와인',  emoji: '🍾', href: '/uaps/white-wine' },
  { slug: 'whisky',     label: '위스키',      emoji: '🥃', href: '/uaps/whisky' },
  { slug: 'soy-sauce',  label: '간장',        emoji: '🫙', href: '/uaps/soy-sauce' },
  { slug: 'vinegar',    label: '식초',        emoji: '🍶', href: '/uaps/vinegar' },
  { slug: 'cold-brew',  label: '콜드브루',    emoji: '☕', href: '/uaps/cold-brew' },
  { slug: 'spirits',    label: '소주',        emoji: '🍵', href: '/uaps/spirits' },
  { slug: 'yakju',      label: '전통주',      emoji: '🍚', href: '/uaps/yakju' },
  { slug: 'puerh',      label: '보이차',      emoji: '🫖', href: '/uaps/puerh' },
];

// slug → DB category name
const SLUG_TO_DB_CATEGORY: Record<string, string> = {
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

// ═══════════════════════════════════════════════════════════════════════════
// 카테고리별 테마 설정
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_CONFIG: Record<string, {
  label: string;
  title: string;
  subtitle: string;
  accent: string;      // hex
  accentRgb: string;   // r, g, b
  secondAccent: string;
  bgFrom: string;
  bgVia: string;
  icon: string;
}> = {
  'red-wine': {
    label: '레드와인',
    title: 'Red Wine Intelligence',
    subtitle: '레드와인 해저 숙성 풍미 예측 시스템',
    accent: '#e11d48',
    accentRgb: '225, 29, 72',
    secondAccent: '#fb7185',
    bgFrom: '#1a0008',
    bgVia: '#1a000c',
    icon: '🍷',
  },
  'white-wine': {
    label: '화이트와인',
    title: 'White Wine Intelligence',
    subtitle: '화이트와인 해저 숙성 풍미 예측 시스템',
    accent: '#ca8a04',
    accentRgb: '202, 138, 4',
    secondAccent: '#fde68a',
    bgFrom: '#120e00',
    bgVia: '#1a1400',
    icon: '🍾',
  },
  whisky: {
    label: '위스키',
    title: 'Whisky Intelligence',
    subtitle: '위스키 해저 숙성 풍미 예측 시스템',
    accent: '#d97706',
    accentRgb: '217, 119, 6',
    secondAccent: '#fbbf24',
    bgFrom: '#120a00',
    bgVia: '#1a0e00',
    icon: '🥃',
  },
  'soy-sauce': {
    label: '간장',
    title: 'Soy Sauce Intelligence',
    subtitle: '간장 해저 숙성 풍미 예측 시스템',
    accent: '#92400e',
    accentRgb: '146, 64, 14',
    secondAccent: '#d97706',
    bgFrom: '#1a1000',
    bgVia: '#1a1208',
    icon: '🫙',
  },
  vinegar: {
    label: '식초',
    title: 'Vinegar Intelligence',
    subtitle: '식초 해저 숙성 풍미 예측 시스템',
    accent: '#10b981',
    accentRgb: '16, 185, 129',
    secondAccent: '#6ee7b7',
    bgFrom: '#081a10',
    bgVia: '#0a1f12',
    icon: '🍶',
  },
  'cold-brew': {
    label: '콜드브루',
    title: 'Cold Brew Intelligence',
    subtitle: '콜드브루 해저 숙성 풍미 예측 시스템',
    accent: '#f97316',
    accentRgb: '249, 115, 22',
    secondAccent: '#fdba74',
    bgFrom: '#1a0d00',
    bgVia: '#1a1008',
    icon: '☕',
  },
  spirits: {
    label: '소주',
    title: 'Soju Intelligence',
    subtitle: '소주·전통 증류주 해저 숙성 풍미 예측 시스템',
    accent: '#06b6d4',
    accentRgb: '6, 182, 212',
    secondAccent: '#67e8f9',
    bgFrom: '#001a1f',
    bgVia: '#001a20',
    icon: '🍵',
  },
  yakju: {
    label: '전통주',
    title: 'Jeontongju Intelligence',
    subtitle: '전통주 해저 숙성 풍미 예측 시스템',
    accent: '#84cc16',
    accentRgb: '132, 204, 22',
    secondAccent: '#bef264',
    bgFrom: '#0a1400',
    bgVia: '#0c1a00',
    icon: '🍚',
  },
  puerh: {
    label: '보이차',
    title: 'Puerh Intelligence',
    subtitle: '보이차(생차) 해저 숙성 풍미 예측 시스템',
    accent: '#f43f5e',
    accentRgb: '244, 63, 94',
    secondAccent: '#fda4af',
    bgFrom: '#1a000a',
    bgVia: '#1a000d',
    icon: '🫖',
  },
};

const DEFAULT_CONFIG = CATEGORY_CONFIG['soy-sauce'];

// ═══════════════════════════════════════════════════════════════════════════
// 공통 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════

function GlowCard({
  children,
  className = '',
  accentRgb,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  accentRgb: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div
        className="absolute inset-0 rounded-2xl blur-xl group-hover:opacity-150 transition-all"
        style={{ background: `radial-gradient(ellipse at center, rgba(${accentRgb}, 0.04), transparent)` }}
      />
      <div className={`relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all ${className}`}>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${accentRgb}, 0.4), transparent)` }}
        />
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
  iconColor,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  delay?: number;
  action?: React.ReactNode;
  iconColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent rounded-3xl" />
      <div className="relative bg-[#0d1421]/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${iconColor}18` }}>
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

export default function CategoryUAPSPage() {
  const params = useParams();
  const categorySlug = typeof params.category === 'string' ? params.category : 'soy-sauce';
  const categoryDbName = SLUG_TO_DB_CATEGORY[categorySlug] ?? categorySlug;
  const theme = CATEGORY_CONFIG[categorySlug] ?? DEFAULT_CONFIG;

  const {
    agingProducts,
    selectedProductId,
    predictions,
    latestPrediction,
    modelDataCount,
    terrestrialModels,
    config,
    isLoading,
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
    loadConfig,
    updateCoefficient,
    clearError,
  } = useUAPSStore();

  // v3.1: 해양 데이터 스토어 — 실시간 + 전체 기간 통계
  const {
    currentConditions: oceanCurrentConditions,
    historicalOceanStats,
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
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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

  const beforeProfile = useMemo(() => {
    if (latestPrediction?.expertProfileJson) return latestPrediction.expertProfileJson;
    if (!selectedProduct || terrestrialModels.length === 0) return null;
    const clusters = findSimilarClusters(selectedProduct, terrestrialModels);
    if (clusters.length === 0) return null;
    return predictFlavorProfileStatistical(clusters, 0, config, selectedProduct);
  }, [selectedProduct, terrestrialModels, config, latestPrediction]);

  const afterProfile = useMemo(() => {
    if (!selectedProduct) return null;
    const months = selectedProduct.plannedDurationMonths;
    if (!months) return null;
    if (beforeProfile && latestPrediction?.expertProfileJson) {
      return applyAgingAdjustments(beforeProfile, months, config);
    }
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
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${theme.bgFrom}, ${theme.bgVia}, ${theme.bgFrom})` }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(${theme.accentRgb}, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(183, 145, 110, 0.06), transparent),
                              radial-gradient(ellipse 50% 30% at 80% 50%, rgba(${theme.accentRgb}, 0.08), transparent)`,
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
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px origin-left"
              style={{ background: `linear-gradient(to right, ${theme.accent}, transparent)` }}
            />

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
                style={{ color: `rgba(${theme.accentRgb}, 0.7)` }}
              >
                Undersea Aging Predictive System · {theme.label}
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="sm:block inline">{theme.icon} </span>
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${theme.accent}, #B76E79, ${theme.accent})`,
                  }}
                >
                  {theme.title}
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-white/40 text-sm sm:text-lg max-w-lg font-light leading-relaxed"
              >
                {theme.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="mt-4 flex items-center gap-2"
              >
                {/* 카테고리 선택 드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.1] text-white/35 text-xs hover:bg-white/[0.04] hover:border-white/20 hover:text-white/55 transition-all duration-300"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    카테고리
                    <ChevronDown className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 z-50 bg-[#0d1421]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl min-w-[140px]"
                      >
                        {ALL_CATEGORIES.map((cat) => {
                          const isActive = cat.slug === categorySlug || (cat.slug === 'champagne' && false);
                          return (
                            <Link
                              key={cat.slug}
                              href={cat.href}
                              onClick={() => setShowCategoryDropdown(false)}
                              className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-all hover:bg-white/[0.06] ${isActive ? 'text-white/80 bg-white/[0.04]' : 'text-white/40 hover:text-white/70'}`}
                            >
                              <span>{cat.emoji}</span>
                              <span>{cat.label}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/uaps/how-it-works"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs transition-all duration-300"
                  style={{
                    borderColor: `rgba(${theme.accentRgb}, 0.2)`,
                    color: `rgba(${theme.accentRgb}, 0.6)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `rgba(${theme.accentRgb}, 0.06)`;
                    e.currentTarget.style.borderColor = `rgba(${theme.accentRgb}, 0.3)`;
                    e.currentTarget.style.color = `rgba(${theme.accentRgb}, 0.8)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = `rgba(${theme.accentRgb}, 0.2)`;
                    e.currentTarget.style.color = `rgba(${theme.accentRgb}, 0.6)`;
                  }}
                >
                  <Info className="w-3 h-3" />
                  작동 원리
                </Link>
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
            { label: '등록 제품', value: agingProducts.length, unit: '개', icon: Wine, color: theme.accent },
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
                <div className="flex flex-col items-center sm:items-start">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1.5 sm:mb-3" style={{ backgroundColor: `${stat.color}18` }}>
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
          iconColor={theme.accent}
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
          {(() => {
            const filtered = agingProducts.filter((p) => (p.productCategory ?? 'champagne') === categoryDbName);
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
              {filtered.map((product) => (
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
                        ? 'border-white/20 bg-white/[0.04]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                    style={selectedProductId === product.id ? {
                      borderColor: `rgba(${theme.accentRgb}, 0.5)`,
                      backgroundColor: `rgba(${theme.accentRgb}, 0.06)`,
                      boxShadow: `0 0 20px rgba(${theme.accentRgb}, 0.08)`,
                    } : {}}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm truncate pr-2">
                        {product.productName}
                      </h4>
                      <span
                        className={`text-[10px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full ${
                          product.status === 'immersed'
                            ? 'bg-white/10 text-white/50'
                            : product.status === 'harvested'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-white/[0.06] text-white/50'
                        }`}
                        style={product.status === 'immersed' ? {
                          backgroundColor: `rgba(${theme.accentRgb}, 0.15)`,
                          color: theme.accent,
                        } : {}}
                      >
                        {PRODUCT_STATUS_LABELS[product.status]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">
                          {product.wineType
                            ? WINE_TYPE_LABELS[product.wineType]
                            : product.productCategory}
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

        {/* 제품 추가/수정 모달 */}
        <AnimatePresence>
          {(showModal || editingProduct) && (
            <ProductModal
              onClose={() => { setShowModal(false); setEditingProduct(null); }}
              initialData={editingProduct}
              accentRgb={theme.accentRgb}
              accent={theme.accent}
              categoryDbName={categoryDbName}
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
          <motion.div
            key="simulation-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
            className="relative"
          >
            <div className="absolute inset-0 rounded-2xl" style={{ background: `radial-gradient(ellipse at top, rgba(${theme.accentRgb}, 0.03), transparent)` }} />
            <div className="relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                style={{ background: `linear-gradient(90deg, transparent, rgba(${theme.accentRgb}, 0.3), transparent)` }}
              />

              {/* 시뮬레이터 행 */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.04] space-y-3 sm:space-y-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.08)` }}>
                      <Target className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    </div>
                    <span className="text-xs text-white/40 uppercase tracking-wider">Simulation</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/25">기간</span>
                    <span className="text-sm font-light font-mono" style={{ color: theme.accent }}>
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
                    onClick={() => runPrediction(selectedProductId, selectedProduct.plannedDurationMonths || 18)}
                    disabled={isPredicting || !selectedProduct.plannedDurationMonths}
                    className="flex items-center gap-1.5 text-black font-medium rounded-lg px-3.5 py-2 sm:py-1.5 text-xs hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    style={{ background: `linear-gradient(to right, ${theme.accent}e6, rgba(${theme.accentRgb}, 0.85))` }}
                  >
                    {isPredicting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {isPredicting ? '분석 중' : 'AI 예측'}
                  </button>
                </div>

                {latestPrediction?.overallQualityScore != null && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {[
                      { label: '종합', value: latestPrediction.overallQualityScore, color: '#C4A052' },
                      { label: '질감', value: latestPrediction.textureMaturityScore, color: '#34d399' },
                      { label: '향', value: latestPrediction.aromaFreshnessScore, color: theme.accent },
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
                  </div>
                )}
              </div>

              {/* AI 인사이트 */}
              {latestPrediction && (
                <div className="px-5 py-3 space-y-2">
                  {latestPrediction.aiInsightText ? (
                    <>
                      {latestPrediction.aiInsightText.includes('\n') ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.06)` }}>
                              <Wine className="w-3 h-3" style={{ color: `rgba(${theme.accentRgb}, 0.6)` }} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase tracking-wider" style={{ color: `rgba(${theme.accentRgb}, 0.4)` }}>Before</span>
                              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                                {latestPrediction.aiInsightText.split('\n')[0]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-md bg-[#B76E79]/[0.06] shrink-0 mt-0.5">
                              <Sparkles className="w-3 h-3 text-[#B76E79]/60" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-[#B76E79]/40 uppercase tracking-wider">After</span>
                              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
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
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            {latestPrediction.aiInsightText}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div />
                        {latestPrediction.predictionConfidence != null && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-10 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${latestPrediction.predictionConfidence * 100}%`,
                                  backgroundColor: theme.accent + '99',
                                }}
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
        {/* 풍미 레이더 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {(beforeProfile || afterProfile) && (
          <SectionWrapper title="풍미 프로파일" icon={BarChart3} iconColor="#B76E79" delay={0.3}>
            <FlavorRadar beforeProfile={beforeProfile} afterProfile={afterProfile} accentRgb={theme.accentRgb} accent={theme.accent} />
          </SectionWrapper>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 숙성 타임라인 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selectedProduct && timelineData.length > 0 && (
          <SectionWrapper title="숙성 타임라인" icon={Gauge} iconColor="#C4A052" delay={0.35}>
            <div className="h-[280px] sm:h-[400px]">
              <TimelineChart data={timelineData} harvestWindow={harvestWindow} />
            </div>
            {harvestWindow && (
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-[#C4A052]/[0.10] border border-[#C4A052]/[0.25] rounded-lg px-3 py-2">
                    <span className="text-[9px] text-[#C4A052]/70 uppercase tracking-wider font-medium">Peak</span>
                    <span className="text-sm font-medium text-[#C4A052]" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
                      {harvestWindow.peakMonth}<span className="text-[10px] text-[#C4A052]/50 ml-px">개월</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                    <span className="text-[9px] text-white/25 uppercase tracking-wider">품질</span>
                    <span className="text-sm font-light text-white/60" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
                      {Math.round(harvestWindow.peakScore)}<span className="text-[10px] text-white/20 ml-px">/100</span>
                    </span>
                  </div>
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
                </div>
              </div>
            )}
          </SectionWrapper>
        )}

        {/* v3.0: 해양 환경 카드 3종 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <OceanConditionsCard
            currentConditions={oceanCurrentConditions}
            accentColor={theme.accent}
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
            accentColor={theme.accent}
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
            accentColor={theme.accent}
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
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, rgba(${theme.accentRgb}, 0.3), transparent)` }}
                />
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.1)` }}>
                    <Settings2 className="w-4 h-4" style={{ color: theme.accent }} />
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
                  <CoefficientSlider label="TCI (질감 성숙)" value={localTci} onChange={setLocalTci} min={0.1} max={1.0} step={0.05} accent={theme.accent} accentRgb={theme.accentRgb} scientificBasis="가설적 추정 — 실험 검증 필요" sourceType="hypothesis" />
                  <CoefficientSlider label="FRI (향 신선도)" value={localFri} onChange={setLocalFri} min={0.1} max={1.0} step={0.01} accent={theme.accent} accentRgb={theme.accentRgb} scientificBasis="아레니우스 방정식 · Ea=47kJ/mol" recommendedValue={0.56} sourceType="scientific" />
                  <CoefficientSlider label="BRI (기포 안정화)" value={localBri} onChange={setLocalBri} min={1.0} max={2.5} step={0.05} accent={theme.accent} accentRgb={theme.accentRgb} scientificBasis="헨리의 법칙 · 수심 30m CO₂" recommendedValue={1.6} sourceType="scientific" />
                </div>
                <div className="flex gap-3 px-5 pb-5">
                  <button
                    onClick={() => setShowCoefficientDialog(false)}
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 rounded-xl py-2 text-sm transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => { await handleSaveCoefficients(); setShowCoefficientDialog(false); }}
                    className="flex-1 flex items-center justify-center gap-2 text-black font-medium rounded-xl py-2 text-sm hover:opacity-90 transition-opacity"
                    style={{ background: `linear-gradient(to right, ${theme.accent}e6, rgba(${theme.accentRgb}, 0.85))` }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    저장
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
  accent,
  accentRgb,
  categoryDbName = 'champagne',
}: {
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
  initialData?: AgingProduct | null;
  accent: string;
  accentRgb: string;
  categoryDbName?: string;
}) {
  const isEdit = !!initialData;
  const productCategory = initialData?.productCategory ?? categoryDbName;

  // 카테고리별 동적 설정
  const fieldConfig = CATEGORY_FIELD_CONFIG[productCategory] ?? CATEGORY_FIELD_CONFIG['champagne'];
  const subtypeOptions = CATEGORY_SUBTYPES[productCategory] ?? CATEGORY_SUBTYPES['champagne'];
  const reductionChecklist: ReductionCheckItem[] = CATEGORY_REDUCTION_CHECKLIST[productCategory] ?? CATEGORY_REDUCTION_CHECKLIST['champagne'];

  const [productName, setProductName] = useState(initialData?.productName ?? '');
  const [subtype, setSubtype] = useState<string>(
    initialData?.wineType ?? subtypeOptions[0]?.value ?? ''
  );
  const [vintage, setVintage] = useState<string>(initialData?.vintage?.toString() ?? '');
  const [ph, setPh] = useState<string>(initialData?.ph?.toString() ?? '');
  const [dosage, setDosage] = useState<string>(initialData?.dosage?.toString() ?? '');
  const [alcohol, setAlcohol] = useState<string>(initialData?.alcohol?.toString() ?? '');

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

  // v3.0: 마개 타입
  const [closureType, setClosureType] = useState<string>(
    initialData?.closureType ?? CATEGORY_DEFAULT_CLOSURE[productCategory] ?? 'cork_natural'
  );

  const [terrestrialAgingYears, setTerrestrialAgingYears] = useState<string>(
    initialData?.terrestrialAgingYears?.toString() ?? ''
  );
  const [immersionDate, setImmersionDate] = useState(initialData?.immersionDate ?? '');
  const [plannedDurationMonths, setPlannedDurationMonths] = useState<string>(initialData?.plannedDurationMonths?.toString() ?? '');
  const [agingDepth, setAgingDepth] = useState<string>(initialData?.agingDepth?.toString() ?? '30');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      closureType: closureType as ClosureType,
      vintage: vintage ? Number(vintage) : null,
      producer: '',
      ph: ph ? Number(ph) : null,
      dosage: dosage ? Number(dosage) : null,
      alcohol: alcohol ? Number(alcohol) : null,
      acidity: null,
      reductionPotential,
      reductionChecks: { ...reductionChecks, _subtype: subtype as unknown as boolean },
      immersionDate: immersionDate || null,
      plannedDurationMonths: plannedDurationMonths ? Number(plannedDurationMonths) : null,
      agingDepth: agingDepth ? Number(agingDepth) : 30,
      terrestrialAgingYears: terrestrialAgingYears ? Number(terrestrialAgingYears) : null,
      notes: notes.trim() || null,
    });
    setIsSubmitting(false);
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors';
  const labelClass = 'block text-xs text-white/50 mb-1.5';
  const accentStyle = { borderColor: `rgba(${accentRgb}, 0.3)`, backgroundColor: `rgba(${accentRgb}, 0.05)` };

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
          <div className="p-2 rounded-xl" style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}>
            <Anchor className="w-5 h-5" style={{ color: accent }} />
          </div>
          <h2 className="text-lg font-medium text-white flex-1">
            {isEdit ? '숙성 제품 수정' : '새 숙성 제품 등록'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 제품명 */}
          <div>
            <label className={labelClass}>제품명 *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="제품명을 입력하세요"
              className={inputClass}
              required
            />
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
                          ? ''
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      }`}
                      style={reductionChecks[item.id] ? accentStyle : undefined}
                    >
                      <input
                        type="radio"
                        name={`group-${group}`}
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        style={{ accentColor: accent }}
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
                          ? ''
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      }`}
                      style={reductionChecks[item.id] ? accentStyle : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        style={{ accentColor: accent }}
                        className="rounded"
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
            <p className="text-[11px] text-white/20 mt-1">마개별 산소 투과율(OTR)이 숙성 예측에 반영됩니다.</p>
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
                <span className="text-xs whitespace-nowrap" style={{ color: accent }}>실측값 사용</span>
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
              className="flex-1 flex items-center justify-center gap-2 text-black font-medium rounded-xl py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(to right, ${accent}, rgba(${accentRgb}, 0.85))` }}
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
// Flavor Radar
// ═══════════════════════════════════════════════════════════════════════════

function FlavorRadar({
  beforeProfile,
  afterProfile,
  accent,
  accentRgb,
}: {
  beforeProfile: Record<string, number> | null;
  afterProfile: Record<string, number> | null;
  accent: string;
  accentRgb: string;
}) {
  const fallback = { fruity: 50, floralMineral: 45, yeastyAutolytic: 40, acidityFreshness: 55, bodyTexture: 50, finishComplexity: 50 };
  const before = beforeProfile || fallback;
  const after = afterProfile || before;

  const radarData = FLAVOR_AXES.map((axis) => ({
    axis: axis.label,
    before: Math.round(Math.min(100, Math.max(5, before[axis.key] ?? 50))),
    after: Math.round(Math.min(100, Math.max(5, after[axis.key] ?? 50))),
  }));

  const changes = radarData.map((d) => ({
    label: d.axis,
    before: d.before,
    after: d.after,
    diff: d.after - d.before,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
      <div className="flex-1 h-[300px] sm:h-[380px] lg:h-[420px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="78%">
            <defs>
              <radialGradient id="catRadarBeforeFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accent} stopOpacity={0.10} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </radialGradient>
              <radialGradient id="catRadarAfterFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#B76E79" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#B76E79" stopOpacity={0.06} />
              </radialGradient>
              <filter id="catRadarGlow">
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
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="투하 전" dataKey="before" stroke={`rgba(${accentRgb},0.4)`} fill="url(#catRadarBeforeFill)" strokeWidth={1} strokeDasharray="4 3" />
            <Radar name="AI 예측" dataKey="after" stroke="#B76E79" fill="url(#catRadarAfterFill)" strokeWidth={2} filter="url(#catRadarGlow)" />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="lg:w-[220px] flex flex-col justify-center lg:pl-2 lg:border-l lg:border-white/[0.04]">
        <div className="flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2 mb-4 lg:mb-5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-px border-t border-dashed" style={{ borderColor: `${accent}80` }} />
            <span className="text-[10px] text-white/40 tracking-wide">투하 전</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-[2px] rounded-full bg-[#B76E79]" />
            <span className="text-[10px] text-white/40 tracking-wide">해저 숙성 후</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
          {changes.map((c) => {
            const isPositive = c.diff > 0;
            const isNegative = c.diff < 0;
            return (
              <div
                key={c.label}
                className="flex items-center justify-between rounded-lg px-3 py-2 border"
                style={{
                  backgroundColor: isPositive ? `rgba(183,110,121,0.06)` : isNegative ? `rgba(${accentRgb},0.04)` : 'rgba(255,255,255,0.02)',
                  borderColor: isPositive ? 'rgba(183,110,121,0.12)' : isNegative ? `rgba(${accentRgb},0.08)` : 'rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/30 tracking-wide leading-none mb-0.5">{c.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-white/20 font-mono">{c.before}</span>
                    <span className="text-[8px] text-white/15">→</span>
                    <span className="text-[10px] text-white/45 font-mono">{c.after}</span>
                  </div>
                </div>
                <span
                  className="text-xs font-mono font-semibold tabular-nums"
                  style={{
                    color: isPositive ? '#B76E79' : isNegative ? `rgba(${accentRgb},0.7)` : 'rgba(255,255,255,0.15)',
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  }}
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
// Timeline 차트 (재사용)
// ═══════════════════════════════════════════════════════════════════════════

function TimelineChart({
  data,
  harvestWindow,
}: {
  data: { month: number; textureMaturity: number; aromaFreshness: number; offFlavorRisk: number; bubbleRefinement: number; compositeQuality?: number; gainScore?: number; lossScore?: number }[];
  harvestWindow: { startMonths: number; endMonths: number; peakMonth: number; peakScore: number; recommendation: string } | null;
}) {
  const peakPoint = harvestWindow ? data.find((d) => d.month === harvestWindow.peakMonth) : null;

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
          {quality != null && <span className="text-sm font-mono font-medium text-[#C4A052]">{Math.round(quality)}</span>}
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
          <linearGradient id="catQualityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4A052" stopOpacity={0.2} />
            <stop offset="60%" stopColor="#C4A052" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#C4A052" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="catGainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="catLossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
          <filter id="catPeakGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} label={{ value: '개월', position: 'insideBottomRight', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} />
        <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} tickCount={6} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(196,160,82,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey="gainScore" stroke="none" fill="url(#catGainFill)" legendType="none" />
        <Area type="monotone" dataKey="lossScore" stroke="none" fill="url(#catLossFill)" legendType="none" />
        <Line type="monotone" dataKey="textureMaturity" stroke="#34d399" strokeWidth={1} strokeOpacity={0.4} dot={false} legendType="none" />
        <Line type="monotone" dataKey="bubbleRefinement" stroke="#34d399" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 4" dot={false} legendType="none" />
        <Line type="monotone" dataKey="aromaFreshness" stroke="#f87171" strokeWidth={1} strokeOpacity={0.35} dot={false} legendType="none" />
        <Line type="monotone" dataKey="offFlavorRisk" stroke="#f87171" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 4" dot={false} legendType="none" />
        <Area type="monotone" dataKey="compositeQuality" stroke="#C4A052" strokeWidth={2.5} fill="url(#catQualityGradient)" dot={false} activeDot={{ r: 4, fill: '#C4A052', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 1.5 }} legendType="none" />
        {harvestWindow && (
          <ReferenceLine x={harvestWindow.peakMonth} stroke="#C4A052" strokeWidth={1} strokeDasharray="2 3" strokeOpacity={0.4} />
        )}
        {harvestWindow && peakPoint && (
          <ReferenceDot x={harvestWindow.peakMonth} y={peakPoint.compositeQuality ?? 0} r={5} fill="#C4A052" stroke="rgba(255,255,255,0.9)" strokeWidth={2} filter="url(#catPeakGlow)" />
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
  accent,
  accentRgb,
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
  accent: string;
  accentRgb: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-white/50">{label}</label>
        <span className="text-xs font-mono font-medium" style={{ color: accent }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
        style={{ accentColor: accent }}
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
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sourceType === 'scientific' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-[10px] text-white/30">{scientificBasis}</span>
        </div>
      )}
    </div>
  );
}
