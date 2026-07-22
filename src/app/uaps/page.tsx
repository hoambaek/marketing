'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  RefreshCw,
  Database,
  Gauge,
  Save,
  BarChart3,
  Info,
  LayoutGrid,
  ChevronDown,
  ClipboardCheck,
  ScrollText,
  Inbox,
} from 'lucide-react';

// 카테고리 목록
const UAPS_CATEGORIES = [
  { slug: 'champagne',  label: '샴페인',      emoji: '🥂', color: '#C4A052', href: '/uaps' },
  { slug: 'red-wine',   label: '레드와인',    emoji: '🍷', color: '#9f1239', href: '/uaps/red-wine' },
  { slug: 'white-wine', label: '화이트와인',  emoji: '🍾', color: '#ca8a04', href: '/uaps/white-wine' },
  { slug: 'whisky',     label: '위스키',      emoji: '🥃', color: '#d97706', href: '/uaps/whisky' },
  { slug: 'soy-sauce',  label: '간장',        emoji: '🫙', color: '#92400e', href: '/uaps/soy-sauce' },
  { slug: 'vinegar',    label: '식초',        emoji: '🍶', color: '#10b981', href: '/uaps/vinegar' },
  { slug: 'green-bean', label: '생두',        emoji: '🫘', color: '#f97316', href: '/uaps/green-bean' },
  { slug: 'yakju',      label: '전통주',      emoji: '🍚', color: '#84cc16', href: '/uaps/yakju' },
  { slug: 'soju',       label: '증류주',      emoji: '🍶', color: '#06b6d4', href: '/uaps/soju' },
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
  'green-bean': 'green_coffee_bean',
  'yakju':      'yakju_cheongju',
  'soju':       'spirits',
  'puerh':      'puer',
};

// 숨김 카테고리를 제외한 노출용 목록 (숨김 관리: HIDDEN_UAPS_CATEGORIES)
const VISIBLE_UAPS_CATEGORIES = UAPS_CATEGORIES.filter(
  (c) => !HIDDEN_UAPS_CATEGORIES.has(UAPS_CATEGORY_DB[c.slug]),
);

import { useUAPSStore } from '@/lib/store/uaps-store';
import type {
  AgingProduct,
  AgingPrediction,
  ProductInput,
  ClosureType,
  OceanConditionsForPrediction,
  DepthSimulationResult,
} from '@/lib/types/uaps';
import type { RetrievalResult } from '@/lib/types/uaps';
import {
  WINE_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
  MODEL_STATUS_LABELS,
  CATEGORY_SUBTYPES,
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
import {
  OceanConditionsCard, OptimalDepthCard, EnvironmentalImpactCard,
  MonthlyProfileCard,
} from './components/OceanCardsV3';
import { SectionWrapper, CoefficientSlider } from './components/DashboardParts';
import { ProductModal } from './components/ProductModal';
import { FlavorRadar } from './components/FlavorRadar';
import { TimelineChart } from './components/TimelineChart';
import { PredictionSimulator } from './components/PredictionSimulator';
import { calculateProductOceanStats } from '@/lib/utils/uaps-ocean-profile';

// ═══════════════════════════════════════════════════════════════════════════
// 공통 컴포넌트
// ═══════════════════════════════════════════════════════════════════════════


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
    // 침지 기간 전체(예: 1/1~현재)를 평균하려면 뷰 창(90일)에 제한된 dailyData가 아니라
    // 전체 히스토리(allDailyData, 2025-01-01~ 30m 보정)를 사용한다. 없으면 dailyData 폴백.
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
                            {VISIBLE_UAPS_CATEGORIES.map((cat) => (
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
                  <Link
                    href="/uaps/marine-elevage"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/15 text-white/50 text-xs hover:bg-white/[0.04] hover:border-white/25 hover:text-white/80 transition-all duration-300"
                  >
                    <ScrollText className="w-3 h-3" />
                    해저 숙성 정의 문서
                  </Link>
                  <Link
                    href="/uaps/tasting-review"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/15 text-white/50 text-xs hover:bg-white/[0.04] hover:border-white/25 hover:text-white/80 transition-all duration-300"
                  >
                    <Inbox className="w-3 h-3" />
                    제출 검토
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
            {VISIBLE_UAPS_CATEGORIES.map((cat) => {
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
          <PredictionSimulator
            selectedProductId={selectedProductId}
            selectedProduct={selectedProduct}
            latestPrediction={latestPrediction}
            isPredicting={isPredicting}
            linkCopied={linkCopied}
            setLinkCopied={setLinkCopied}
            onOpenCoefficientDialog={() => setShowCoefficientDialog(true)}
            runPrediction={runPrediction}
          />
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
            category={selectedProduct?.productCategory ?? listCategory}
          />
        </SectionWrapper>

        <SectionWrapper title="숙성 타임라인" icon={Gauge} iconColor="#C4A052" delay={0.35}>
          <div className="h-[280px] sm:h-[320px] lg:h-[360px]">
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

      </div>
    </div>
  );
}


