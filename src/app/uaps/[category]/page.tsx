'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  ClosureType,
  OceanConditionsForPrediction,
  DepthSimulationResult,
} from '@/lib/types/uaps';
import {
  WINE_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  CATEGORY_EA_MAP,
  HIDDEN_UAPS_CATEGORIES,
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
import { SectionWrapper, CoefficientSlider } from '../components/DashboardParts';
import { ProductModal } from '../components/ProductModal';
import { FlavorRadar } from '../components/FlavorRadar';
import { TimelineChart } from '../components/TimelineChart';
import { PredictionSimulator } from '../components/PredictionSimulator';
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
  { slug: 'green-bean', label: '생두',        emoji: '🫘', href: '/uaps/green-bean' },
  { slug: 'yakju',      label: '전통주',      emoji: '🍚', href: '/uaps/yakju' },
  { slug: 'soju',       label: '증류주',      emoji: '🍶', href: '/uaps/soju' },
  { slug: 'puerh',      label: '보이차',      emoji: '🫖', href: '/uaps/puerh' },
];

// slug → DB category name
const SLUG_TO_DB_CATEGORY: Record<string, string> = {
  'red-wine':   'red_wine',
  'white-wine': 'white_wine',
  'whisky':     'whisky',
  'soy-sauce':  'soy_sauce',
  'vinegar':    'vinegar',
  'green-bean': 'green_coffee_bean',
  'yakju':      'yakju_cheongju',
  'soju':       'spirits',
  'puerh':      'puer',
};

// 숨김 카테고리를 제외한 노출용 목록 (숨김 관리: HIDDEN_UAPS_CATEGORIES)
const VISIBLE_ALL_CATEGORIES = ALL_CATEGORIES.filter(
  (c) => !HIDDEN_UAPS_CATEGORIES.has(SLUG_TO_DB_CATEGORY[c.slug]),
);

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
  'green-bean': {
    label: '생두',
    title: 'Green Bean Intelligence',
    subtitle: '생두(그린빈) 해저 숙성 풍미 예측 시스템',
    accent: '#f97316',
    accentRgb: '249, 115, 22',
    secondAccent: '#fdba74',
    bgFrom: '#1a0d00',
    bgVia: '#1a1008',
    icon: '🫘',
  },
  soju: {
    label: '증류주',
    title: 'Soju Intelligence',
    subtitle: '증류식 소주 해저 숙성 풍미 예측 시스템',
    accent: '#06b6d4',
    accentRgb: '6, 182, 212',
    secondAccent: '#67e8f9',
    bgFrom: '#001a1f',
    bgVia: '#001a20',
    icon: '🍶',
  },
  yakju: {
    label: '전통주',
    title: 'Jeontongju Intelligence',
    subtitle: '전통주(약주·청주) 해저 숙성 풍미 예측 시스템',
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
    allDailyData,
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [localTci, setLocalTci] = useState(config.tci);
  const [localFri, setLocalFri] = useState(config.fri);
  const [localBri, setLocalBri] = useState(config.bri);

  useEffect(() => {
    setLocalTci(config.tci);
    setLocalFri(config.fri);
    setLocalBri(config.bri);
  }, [config.tci, config.fri, config.bri]);

  // AI 예측의 카테고리별 계수(agingFactors/qualityWeights)를 타임라인에 주입
  // (메인 /uaps 페이지와 동일 — 미전달 시 샴페인 기본값으로 폴백되어 비샴페인 곡선이 왜곡됨)
  const aiAgingFactors = latestPrediction?.agingFactorsJson ?? undefined;
  const aiQualityWeights = latestPrediction?.qualityWeightsJson ?? undefined;

  const timelineData = useMemo(() => {
    if (!selectedProduct) return [];
    return generateTimelineData(selectedProduct, config, aiAgingFactors, aiQualityWeights);
  }, [selectedProduct, config, aiAgingFactors, aiQualityWeights]);

  const harvestWindow = useMemo(() => {
    if (!selectedProduct) return null;
    return calculateOptimalHarvestWindow(selectedProduct, config, aiAgingFactors, aiQualityWeights);
  }, [selectedProduct, config, aiAgingFactors, aiQualityWeights]);

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
    // 침지 기간 전체 평균 → 뷰 창 dailyData가 아니라 전체 히스토리(allDailyData) 사용 (page.tsx와 동일)
    const source = allDailyData && allDailyData.length > 0 ? allDailyData : dailyData;
    if (!selectedProduct || !source || source.length === 0) return null;
    const immersionDate = selectedProduct.immersionDate;
    if (!immersionDate) return null;
    // 환경 표시는 운영 깊이 30m 기준으로 통일 (수온은 이미 30m 보정된 값 → 재보정 없음)
    return calculateProductOceanStats(source, immersionDate, 30);
  }, [selectedProduct, dailyData, allDailyData]);

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
                        {VISIBLE_ALL_CATEGORIES.map((cat) => {
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
              lockedCategory={categoryDbName}
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
          <PredictionSimulator
            selectedProductId={selectedProductId}
            selectedProduct={selectedProduct}
            latestPrediction={latestPrediction}
            isPredicting={isPredicting}
            linkCopied={linkCopied}
            setLinkCopied={setLinkCopied}
            onOpenCoefficientDialog={() => setShowCoefficientDialog(true)}
            runPrediction={runPrediction}
            accent={theme.accent}
            accentRgb={theme.accentRgb}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 풍미 레이더 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {(beforeProfile || afterProfile) && (
          <SectionWrapper title="풍미 프로파일" icon={BarChart3} iconColor="#B76E79" delay={0.3}>
            <FlavorRadar beforeProfile={beforeProfile} afterProfile={afterProfile} accentRgb={theme.accentRgb} accent={theme.accent} category={categoryDbName} />
          </SectionWrapper>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 숙성 타임라인 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selectedProduct && timelineData.length > 0 && (
          <SectionWrapper title="숙성 타임라인" icon={Gauge} iconColor="#C4A052" delay={0.35}>
            <div className="h-[280px] sm:h-[400px]">
              <TimelineChart data={timelineData} harvestWindow={harvestWindow} plannedMonths={selectedProduct?.plannedDurationMonths ?? null} />
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

