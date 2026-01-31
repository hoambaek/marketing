'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { motion } from 'framer-motion';
import {
  Calculator,
  Wine,
  Truck,
  Shield,
  FileText,
  Anchor,
  Cpu,
  Award,
  Package,
  Megaphone,
  Building2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Info,
  ArrowLeft,
  Wallet,
  RefreshCw,
  Euro,
  Save,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useInventoryStore } from '@/lib/store/inventory-store';
import {
  fetchCostCalculatorSettingsByYear,
  upsertCostCalculatorSettings,
} from '@/lib/supabase/database';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { CostCalculatorChampagneType } from '@/lib/types';

// Fixed settings
const DEPRECIATION_YEARS = 4;
const LOSS_RATE = 0.03;
const DEFAULT_EXCHANGE_RATE = 1500; // Default EUR/KRW rate

// Available years for cost calculation
const AVAILABLE_YEARS = [2025, 2026, 2027, 2028];

// Format number with commas
function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('ko-KR');
}

// Format Euro with 2 decimal places
function formatEuro(num: number): string {
  if (num === 0) return '';
  return num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Parse number from formatted string
function parseNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

// Parse Euro from formatted string (handles both . and , as decimal separator)
function parseEuro(str: string): number {
  // Remove spaces and convert comma decimal separator to dot
  const normalized = str.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}

// Input field component with comma formatting (for KRW)
function NumberInput({
  label,
  value,
  onChange,
  icon: Icon,
  suffix = '원',
  placeholder = '0',
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ComponentType<{ className?: string }>;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value ? formatNumber(value) : '');

  // Sync display value when value changes externally (e.g., from DB load)
  useEffect(() => {
    setDisplayValue(value ? formatNumber(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setDisplayValue(raw ? formatNumber(num) : '');
    onChange(num);
  };

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60">
        {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-[#b7916e]/60" />}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#b7916e]/50 transition-colors text-right pr-9 sm:pr-12 ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />
        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs sm:text-sm">
          {suffix}
        </span>
      </div>
    </div>
  );
}

// Euro input field component with KRW conversion display
function EuroInput({
  label,
  value,
  onChange,
  exchangeRate,
  icon: Icon,
  placeholder = '0',
}: {
  label: string;
  value: number; // Value in EUR
  onChange: (value: number) => void;
  exchangeRate: number;
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value ? formatEuro(value) : '');

  // Update display when value changes externally
  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow numbers, comma and dot for decimal input
    const sanitized = raw.replace(/[^0-9.,]/g, '');
    setDisplayValue(sanitized);
    const num = parseEuro(sanitized);
    onChange(num);
  };

  const krwValue = value * exchangeRate;

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60">
        {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-[#b7916e]/60" />}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#b7916e]/50 transition-colors text-right pr-8 sm:pr-10"
        />
        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs sm:text-sm">
          €
        </span>
      </div>
      {value > 0 && (
        <p className="text-[10px] sm:text-xs text-cyan-400/70 text-right">
          ≈ {formatNumber(krwValue)}원
        </p>
      )}
    </div>
  );
}

// Text input component
function TextInput({
  label,
  value,
  onChange,
  placeholder = '',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs sm:text-sm text-white/60">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-[#b7916e]/50 transition-colors ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

// Result card component
function ResultCard({
  title,
  value,
  subtitle,
  color = 'gold',
  large = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  color?: 'gold' | 'cyan' | 'emerald' | 'purple';
  large?: boolean;
}) {
  const colorClasses = {
    gold: 'from-[#b7916e]/20 to-transparent border-[#b7916e]/30 text-[#d4c4a8]',
    cyan: 'from-cyan-500/20 to-transparent border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400',
    purple: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-gradient-to-br ${colorClasses[color]} border rounded-xl sm:rounded-2xl p-3 sm:p-5 ${large ? 'col-span-full' : ''}`}
    >
      <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1 sm:mb-2">{title}</p>
      <p className={`font-light tracking-tight ${large ? 'text-xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-2xl'}`}>
        {value}
      </p>
      {subtitle && <p className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">{subtitle}</p>}
    </motion.div>
  );
}

// Section component
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-xl sm:rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 sm:px-6 sm:py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-[#b7916e]/10 rounded-lg sm:rounded-xl">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#b7916e]" />
          </div>
          <h3 className="text-sm sm:text-lg font-medium text-white/90">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3 sm:px-6 sm:pb-6">{children}</div>}
    </motion.div>
  );
}

// Champagne type interface
interface ChampagneType {
  id?: string;
  name: string;
  bottles: number;
  costPerBottle: number;
  packagingCost: number; // 제품별 패키지 제작비
}

export default function CostCalculatorPage() {
  // Inventory store
  const { getAllProducts, isInitialized, initializeInventory } = useInventoryStore();

  // Year selection
  const [selectedYear, setSelectedYear] = useState(2026);

  // Champagne types (dynamic based on inventory)
  const [champagneTypes, setChampagneTypes] = useState<ChampagneType[]>([
    { name: '제품 1', bottles: 0, costPerBottle: 0, packagingCost: 0 },
    { name: '제품 2', bottles: 0, costPerBottle: 0, packagingCost: 0 },
    { name: '제품 3', bottles: 0, costPerBottle: 0, packagingCost: 0 },
    { name: '제품 4', bottles: 0, costPerBottle: 0, packagingCost: 0 },
  ]);

  // Exchange rate (EUR to KRW)
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [rateLastUpdated, setRateLastUpdated] = useState<string | null>(null);

  // Cost inputs (in EUR for champagne, in KRW for others)
  const [shippingCost, setShippingCost] = useState(0);
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [taxCost, setTaxCost] = useState(0);
  const [customsFee, setCustomsFee] = useState(0);
  const [structureCost, setStructureCost] = useState(0);
  const [seaUsageFee, setSeaUsageFee] = useState(0);
  const [aiMonitoringCost, setAiMonitoringCost] = useState(0);
  const [certificationCost, setCertificationCost] = useState(0);
  const [marketingCost, setMarketingCost] = useState(0);
  const [sgaCost, setSgaCost] = useState(0);

  // DB sync state
  const [isDbConnected] = useState(() => isSupabaseConfigured());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDbLoaded, setIsDbLoaded] = useState(false); // Track if DB load completed
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const dbCostPerBottleRef = useRef<Record<string, number>>({}); // Store DB costPerBottle values
  const dbPackagingCostRef = useRef<Record<string, number>>({}); // Store DB packagingCost values per product

  // Fetch current exchange rate
  const fetchExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      // Using exchangerate-api.com free tier (or fallback to frankfurter.app)
      const response = await fetch('https://api.frankfurter.app/latest?from=EUR&to=KRW');
      if (response.ok) {
        const data = await response.json();
        if (data.rates?.KRW) {
          setExchangeRate(Math.round(data.rates.KRW));
          setRateLastUpdated(new Date().toLocaleString('ko-KR'));
        }
      }
    } catch (error) {
      logger.error('Failed to fetch exchange rate:', error);
      // Keep the default or previously set rate
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Fetch exchange rate on mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Load settings from DB
  const loadSettingsFromDb = useCallback(async (year: number) => {
    if (!isDbConnected) {
      setIsDbLoaded(true); // Mark as "loaded" even if no DB
      return;
    }

    setIsLoading(true);
    setIsDbLoaded(false); // Reset before loading
    try {
      const settings = await fetchCostCalculatorSettingsByYear(year);
      if (settings) {
        // Apply loaded settings
        setExchangeRate(settings.exchangeRate || DEFAULT_EXCHANGE_RATE);
        setShippingCost(settings.shippingCost || 0);
        setInsuranceCost(settings.insuranceCost || 0);
        setTaxCost(settings.taxCost || 0);
        setCustomsFee(settings.customsFee || 0);
        setStructureCost(settings.structureCost || 0);
        setSeaUsageFee(settings.seaUsageFee || 0);
        setAiMonitoringCost(settings.aiMonitoringCost || 0);
        setCertificationCost(settings.certificationCost || 0);
        setMarketingCost(settings.marketingCost || 0);
        setSgaCost(settings.sgaCost || 0);

        // Store costPerBottle and packagingCost values in refs for inventory sync
        const costMap: Record<string, number> = {};
        const packagingMap: Record<string, number> = {};
        if (settings.champagneTypes && settings.champagneTypes.length > 0) {
          settings.champagneTypes.forEach((t) => {
            if (t.id) {
              costMap[t.id] = t.costPerBottle || 0;
              packagingMap[t.id] = t.packagingCost || 0;
            }
          });
          // Ensure packagingCost is included when setting champagneTypes
          setChampagneTypes(settings.champagneTypes.map(t => ({
            ...t,
            packagingCost: t.packagingCost || 0,
          })));
        }
        dbCostPerBottleRef.current = costMap;
        dbPackagingCostRef.current = packagingMap;

        setLastSaved(new Date(settings.updatedAt).toLocaleString('ko-KR'));
      } else {
        // Reset to defaults for new year
        dbCostPerBottleRef.current = {};
        dbPackagingCostRef.current = {};
        setShippingCost(0);
        setInsuranceCost(0);
        setTaxCost(0);
        setCustomsFee(0);
        setStructureCost(0);
        setSeaUsageFee(0);
        setAiMonitoringCost(0);
        setCertificationCost(0);
        setMarketingCost(0);
        setSgaCost(0);
        setLastSaved(null);
      }
    } catch (error) {
      logger.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
      setIsDbLoaded(true); // Mark DB load as complete
      isInitialLoadRef.current = false;
    }
  }, [isDbConnected]);

  // Save settings to DB (debounced)
  const saveSettingsToDb = useCallback(async () => {
    if (!isDbConnected || isInitialLoadRef.current) return;

    setIsSaving(true);
    try {
      const champagneTypesForDb: CostCalculatorChampagneType[] = champagneTypes.map((t) => ({
        id: t.id,
        name: t.name,
        bottles: t.bottles,
        costPerBottle: t.costPerBottle,
        packagingCost: t.packagingCost || 0,
      }));

      // Calculate total packaging cost from all products
      const totalPackagingCost = champagneTypes.reduce((sum, t) => sum + (t.packagingCost || 0), 0);

      await upsertCostCalculatorSettings({
        year: selectedYear,
        exchangeRate,
        champagneTypes: champagneTypesForDb,
        shippingCost,
        insuranceCost,
        taxCost,
        customsFee,
        structureCost,
        seaUsageFee,
        aiMonitoringCost,
        certificationCost,
        packagingCost: totalPackagingCost, // Store total for backwards compatibility
        marketingCost,
        sgaCost,
      });

      setLastSaved(new Date().toLocaleString('ko-KR'));
    } catch (error) {
      logger.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    isDbConnected,
    selectedYear,
    exchangeRate,
    champagneTypes,
    shippingCost,
    insuranceCost,
    taxCost,
    customsFee,
    structureCost,
    seaUsageFee,
    aiMonitoringCost,
    certificationCost,
    marketingCost,
    sgaCost,
  ]);

  // Load settings when year changes
  useEffect(() => {
    loadSettingsFromDb(selectedYear);
  }, [selectedYear, loadSettingsFromDb]);

  // Auto-save with debounce (2 seconds after last change)
  useEffect(() => {
    if (isInitialLoadRef.current || !isDbConnected) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveSettingsToDb();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    exchangeRate,
    champagneTypes,
    shippingCost,
    insuranceCost,
    taxCost,
    customsFee,
    structureCost,
    seaUsageFee,
    aiMonitoringCost,
    certificationCost,
    marketingCost,
    sgaCost,
    saveSettingsToDb,
    isDbConnected,
  ]);

  // Initialize inventory
  useEffect(() => {
    if (!isInitialized) {
      initializeInventory();
    }
  }, [isInitialized, initializeInventory]);

  // Get products filtered by year
  const yearProducts = useMemo(() => {
    if (!isInitialized) return [];
    const allProducts = getAllProducts();
    return allProducts.filter((p) => p.year === selectedYear);
  }, [isInitialized, getAllProducts, selectedYear]);

  // Sync inventory products (name, bottles) while preserving costPerBottle and packagingCost from DB
  useEffect(() => {
    // Wait for both inventory and DB to be loaded
    if (!isInitialized || !isDbLoaded) return;

    const allProducts = getAllProducts();
    const productsForYear = allProducts.filter((p) => p.year === selectedYear);

    if (productsForYear.length === 0) {
      return; // Keep existing data, don't reset
    }

    // Update only name and bottles from inventory, preserve costPerBottle and packagingCost from DB or current state
    setChampagneTypes((prev) => {
      const newTypes: ChampagneType[] = productsForYear.map((p) => {
        // First try to get from current state, then from DB ref
        const existing = prev.find((item) => item.id === p.id);
        const savedCost = existing?.costPerBottle ?? dbCostPerBottleRef.current[p.id] ?? 0;
        const savedPackaging = existing?.packagingCost ?? dbPackagingCostRef.current[p.id] ?? 0;
        return {
          id: p.id,
          name: p.nameKo || p.name,
          bottles: p.totalQuantity,
          costPerBottle: savedCost, // Preserve costPerBottle from state or DB
          packagingCost: savedPackaging, // Preserve packagingCost from state or DB
        };
      });
      return newTypes;
    });
  }, [isInitialized, isDbLoaded, getAllProducts, selectedYear]);

  // Update champagne type
  const updateChampagneType = (index: number, field: keyof ChampagneType, value: string | number) => {
    setChampagneTypes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Add new champagne type
  const addChampagneType = () => {
    setChampagneTypes((prev) => [
      ...prev,
      { name: `제품 ${prev.length + 1}`, bottles: 0, costPerBottle: 0, packagingCost: 0 },
    ]);
  };

  // Remove champagne type
  const removeChampagneType = (index: number) => {
    if (champagneTypes.length <= 1) return;
    setChampagneTypes((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculations = useMemo(() => {
    // Total bottles
    const totalBottles = champagneTypes.reduce((sum, type) => sum + type.bottles, 0);

    // Champagne total cost (EUR) - costPerBottle is in EUR
    const champagneTotalCostEur = champagneTypes.reduce(
      (sum, type) => sum + type.bottles * type.costPerBottle,
      0
    );

    // Convert to KRW
    const champagneTotalCost = champagneTotalCostEur * exchangeRate;

    // Depreciation (structure cost / 4 years)
    const depreciation = structureCost / DEPRECIATION_YEARS;

    // Loss cost (3% of champagne cost in KRW)
    const lossCost = champagneTotalCost * LOSS_RATE;

    // Actual sellable bottles (97%)
    const sellableBottles = Math.floor(totalBottles * (1 - LOSS_RATE));

    // Total packaging cost from all products
    const totalPackagingCost = champagneTypes.reduce((sum, type) => sum + (type.packagingCost || 0), 0);

    // Category subtotals (all in KRW)
    const productCost = champagneTotalCost;
    const importCost = shippingCost + insuranceCost + taxCost + customsFee;
    const processingCost = depreciation + seaUsageFee + aiMonitoringCost + lossCost + certificationCost;
    const sellingCost = totalPackagingCost + marketingCost + sgaCost;

    // Total cost
    const totalCost = productCost + importCost + processingCost + sellingCost;

    // Cost per bottle
    const costPerBottle = sellableBottles > 0 ? totalCost / sellableBottles : 0;

    // Selling cost without packaging (marketing + SGA)
    const sellingCostWithoutPackaging = marketingCost + sgaCost;

    // 공유 비용 (수입비용 + 가공원가 + 마케팅/판관비)을 총 판매가능 병수로 균등 배분
    const sharedCosts = importCost + processingCost + sellingCostWithoutPackaging;
    const sharedCostPerBottle = sellableBottles > 0 ? sharedCosts / sellableBottles : 0;

    // Cost breakdown by type
    const typeBreakdown = champagneTypes.map((type) => {
      if (type.bottles === 0) return { ...type, totalCost: 0, costPerBottleKrw: 0, costPerBottleEur: 0 };

      const typeSellableBottles = Math.floor(type.bottles * (1 - LOSS_RATE));
      const typePackagingCost = type.packagingCost || 0;

      // 병당 원가 = EUR원가(KRW) + 패키지비/병수 + 균등배분된 공유비용
      const packagingPerBottle = typeSellableBottles > 0 ? typePackagingCost / typeSellableBottles : 0;
      const typeCostPerBottleKrw = (type.costPerBottle * exchangeRate) + packagingPerBottle + sharedCostPerBottle;

      // 총 원가 = 병당 원가 × 판매가능 병수
      const typeTotalCost = typeCostPerBottleKrw * typeSellableBottles;

      return {
        ...type,
        totalCost: typeTotalCost,
        costPerBottleKrw: typeCostPerBottleKrw,
        costPerBottleEur: type.costPerBottle, // Original EUR price
      };
    });

    return {
      totalBottles,
      champagneTotalCostEur,
      champagneTotalCost,
      depreciation,
      lossCost,
      sellableBottles,
      productCost,
      importCost,
      processingCost,
      sellingCost,
      totalPackagingCost,
      totalCost,
      costPerBottle,
      typeBreakdown,
    };
  }, [
    champagneTypes,
    exchangeRate,
    shippingCost,
    insuranceCost,
    taxCost,
    customsFee,
    structureCost,
    seaUsageFee,
    aiMonitoringCost,
    certificationCost,
    marketingCost,
    sgaCost,
  ]);

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(183, 145, 110, 0.08), transparent)`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-3 sm:pt-10 pb-3 sm:pb-10 px-3 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Back to Budget Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 sm:mb-6"
          >
            <Link
              href="/budget"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all group"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-[#b7916e]/60" />
              <span>예산관리</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-3">
                  <div className="p-1.5 sm:p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg sm:rounded-xl">
                    <Calculator className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-xs text-white/40 uppercase tracking-wider">
                      Budget Management
                    </p>
                    <h1
                      className="text-xl sm:text-3xl lg:text-4xl text-white/95 leading-tight tracking-tight"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      원가 계산기
                    </h1>
                  </div>
                </div>
                <p className="text-white/40 text-xs sm:text-base max-w-md hidden sm:block">
                  해저숙성 샴페인 상품별 원가를 계산합니다
                </p>
              </div>

              {/* Fixed settings info - compact on mobile */}
              <div className="flex flex-wrap gap-1.5 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl">
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 text-[#b7916e]/60" />
                  <span className="text-[10px] sm:text-sm text-white/60">
                    감가상각: <span className="text-white/90">{DEPRECIATION_YEARS}년</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl">
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 text-[#b7916e]/60" />
                  <span className="text-[10px] sm:text-sm text-white/60">
                    손실률: <span className="text-white/90">{LOSS_RATE * 100}%</span>
                  </span>
                </div>
                {/* DB Sync Status */}
                <div className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border ${
                  isDbConnected
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-white/[0.04] border-white/[0.08]'
                }`}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 animate-spin" />
                      <span className="text-[10px] sm:text-sm text-cyan-400">로딩...</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <Save className="w-3 h-3 sm:w-4 sm:h-4 text-[#b7916e] animate-pulse" />
                      <span className="text-[10px] sm:text-sm text-[#b7916e]">저장...</span>
                    </>
                  ) : isDbConnected ? (
                    <>
                      <Cloud className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                      <span className="text-[10px] sm:text-sm text-white/60 hidden sm:inline">
                        {lastSaved ? `저장됨` : '자동 저장'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3 sm:w-4 sm:h-4 text-white/40" />
                      <span className="text-[10px] sm:text-sm text-white/40">오프라인</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Year Selector & Exchange Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/[0.06]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                {/* Year Selector */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-white/50">숙성년도</span>
                  <div className="flex gap-1.5 sm:gap-2">
                    {AVAILABLE_YEARS.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all ${
                          selectedYear === year
                            ? 'bg-[#b7916e] text-white'
                            : 'bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.08] border border-white/[0.06]'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exchange Rate */}
                <div className="flex flex-col items-start sm:items-end gap-0.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400/60" />
                    <span className="text-xs sm:text-sm text-white/50">EUR/KRW</span>
                    <input
                      type="text"
                      value={formatNumber(exchangeRate)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        const num = parseInt(raw, 10) || DEFAULT_EXCHANGE_RATE;
                        setExchangeRate(num);
                      }}
                      className="w-20 sm:w-24 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-md sm:rounded-lg text-white text-xs sm:text-sm text-right focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <span className="text-xs sm:text-sm text-white/40">원</span>
                    <button
                      onClick={fetchExchangeRate}
                      disabled={isLoadingRate}
                      className="p-1 sm:p-1.5 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-md sm:rounded-lg transition-all disabled:opacity-50"
                      title="현재 환율 가져오기"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoadingRate ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {rateLastUpdated && (
                    <span className="text-[10px] text-white/30">
                      {rateLastUpdated}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {/* Champagne Types Input */}
          <Section title="샴페인 종류별 입력" icon={Wine} defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              {champagneTypes.map((type, index) => (
                <motion.div
                  key={type.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative p-3 sm:p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg sm:rounded-xl space-y-3 sm:space-y-4"
                >
                  {/* Remove button - disabled for inventory-linked items */}
                  {champagneTypes.length > 1 && !type.id && (
                    <button
                      onClick={() => removeChampagneType(index)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 sm:p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-md sm:rounded-lg transition-all"
                      title="삭제"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#b7916e]" />
                    <span className="text-xs sm:text-sm font-medium text-white/70">종류 {index + 1}</span>
                    {type.id && (
                      <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full">
                        재고연동
                      </span>
                    )}
                  </div>
                  <TextInput
                    label="종류명"
                    value={type.name}
                    onChange={(value) => updateChampagneType(index, 'name', value)}
                    placeholder="예: Brut Nature"
                    disabled={!!type.id}
                  />
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <NumberInput
                      label="병수"
                      value={type.bottles}
                      onChange={(value) => updateChampagneType(index, 'bottles', value)}
                      suffix="병"
                      disabled={!!type.id}
                    />
                    <EuroInput
                      label="1병당 원가"
                      value={type.costPerBottle}
                      onChange={(value) => updateChampagneType(index, 'costPerBottle', value)}
                      exchangeRate={exchangeRate}
                    />
                  </div>
                  <NumberInput
                    label="패키지 제작비"
                    value={type.packagingCost}
                    onChange={(value) => updateChampagneType(index, 'packagingCost', value)}
                    icon={Package}
                  />
                  {type.bottles > 0 && type.costPerBottle > 0 && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <p className="text-[11px] sm:text-sm text-white/40">
                        소계: <span className="text-cyan-400">€{formatEuro(type.bottles * type.costPerBottle)}</span>
                        <span className="text-white/30 mx-1">→</span>
                        <span className="text-[#b7916e]">{formatNumber(type.bottles * type.costPerBottle * exchangeRate)}원</span>
                        {(type.packagingCost || 0) > 0 && (
                          <>
                            <span className="text-white/30 mx-1">+</span>
                            <span className="text-purple-400">패키지 {formatNumber(type.packagingCost)}원</span>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Add Type Button */}
            <div className="mt-3 sm:mt-4">
              <button
                onClick={addChampagneType}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-white/50 hover:text-white/80 bg-white/[0.02] hover:bg-white/[0.04] border border-dashed border-white/[0.1] hover:border-white/[0.2] rounded-lg sm:rounded-xl transition-all w-full justify-center"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>종류 추가</span>
              </button>
            </div>
          </Section>

          {/* Import Costs */}
          <Section title="수입 비용" icon={Truck} defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <NumberInput
                label="운송비"
                value={shippingCost}
                onChange={setShippingCost}
                icon={Truck}
              />
              <NumberInput
                label="보험료"
                value={insuranceCost}
                onChange={setInsuranceCost}
                icon={Shield}
              />
              <NumberInput
                label="세금 (관세/주세/부가세)"
                value={taxCost}
                onChange={setTaxCost}
                icon={FileText}
              />
              <NumberInput
                label="통관대행 수수료"
                value={customsFee}
                onChange={setCustomsFee}
                icon={FileText}
              />
            </div>
          </Section>

          {/* Processing Costs */}
          <Section title="가공 원가" icon={Anchor} defaultOpen={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <NumberInput
                label="해저숙성 구조물 제작비"
                value={structureCost}
                onChange={setStructureCost}
                icon={Anchor}
              />
              <NumberInput
                label="해역 사용료"
                value={seaUsageFee}
                onChange={setSeaUsageFee}
                icon={Anchor}
              />
              <NumberInput
                label="AI 모니터링 시스템"
                value={aiMonitoringCost}
                onChange={setAiMonitoringCost}
                icon={Cpu}
              />
              <NumberInput
                label="품질인증 비용"
                value={certificationCost}
                onChange={setCertificationCost}
                icon={Award}
              />
            </div>
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-[#b7916e]/10 border border-[#b7916e]/20 rounded-lg sm:rounded-xl">
              <p className="text-xs sm:text-sm text-white/60">
                <span className="text-[#b7916e]">자동 계산:</span> 감가상각비 = {formatNumber(calculations.depreciation)}원/년,
                손실분 비용 = {formatNumber(calculations.lossCost)}원
              </p>
            </div>
          </Section>

          {/* Selling Costs */}
          <Section title="판매 원가" icon={Package} defaultOpen={true}>
            <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg sm:rounded-xl">
              <p className="text-xs sm:text-sm text-white/60">
                <span className="text-purple-400">패키지 제작비</span>는 제품별로 입력됩니다.
                총 패키지비: <span className="text-purple-400">{formatNumber(calculations.totalPackagingCost)}원</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <NumberInput
                label="마케팅비"
                value={marketingCost}
                onChange={setMarketingCost}
                icon={Megaphone}
              />
              <NumberInput
                label="판관비"
                value={sgaCost}
                onChange={setSgaCost}
                icon={Building2}
              />
            </div>
          </Section>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 sm:mt-8"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#b7916e]/10 rounded-lg sm:rounded-xl">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#b7916e]" />
              </div>
              <h2 className="text-lg sm:text-xl font-medium text-white/90">계산 결과</h2>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                <p className="text-[10px] sm:text-xs text-white/40 mb-0.5 sm:mb-1">총 병수</p>
                <p className="text-base sm:text-xl font-light text-white/90">{formatNumber(calculations.totalBottles)}병</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                <p className="text-[10px] sm:text-xs text-white/40 mb-0.5 sm:mb-1">판매 가능 병수</p>
                <p className="text-base sm:text-xl font-light text-emerald-400">{formatNumber(calculations.sellableBottles)}병</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                <p className="text-[10px] sm:text-xs text-white/40 mb-0.5 sm:mb-1">손실 병수</p>
                <p className="text-base sm:text-xl font-light text-red-400">{formatNumber(calculations.totalBottles - calculations.sellableBottles)}병</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                <p className="text-[10px] sm:text-xs text-white/40 mb-0.5 sm:mb-1">손실률</p>
                <p className="text-base sm:text-xl font-light text-white/90">{LOSS_RATE * 100}%</p>
              </div>
            </div>

            {/* Category Subtotals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <ResultCard
                title="제품원가"
                value={`${formatNumber(calculations.productCost)}원`}
                subtitle={`€${formatEuro(calculations.champagneTotalCostEur)} × ${formatNumber(exchangeRate)}원`}
                color="purple"
              />
              <ResultCard
                title="수입비용"
                value={`${formatNumber(calculations.importCost)}원`}
                subtitle="운송+보험+세금+통관"
                color="cyan"
              />
              <ResultCard
                title="가공원가"
                value={`${formatNumber(calculations.processingCost)}원`}
                subtitle="감가상각+해역+모니터링+손실+인증"
                color="emerald"
              />
              <ResultCard
                title="판매원가"
                value={`${formatNumber(calculations.sellingCost)}원`}
                subtitle="패키지+마케팅+판관비"
                color="gold"
              />
            </div>

            {/* Final Results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <ResultCard
                title="총 원가 합계"
                value={`${formatNumber(calculations.totalCost)}원`}
                color="gold"
                large
              />
              <ResultCard
                title="병당 원가"
                value={`${formatNumber(calculations.costPerBottle)}원`}
                subtitle={`총 원가 ÷ 판매 가능 병수 (${formatNumber(calculations.sellableBottles)}병)`}
                color="gold"
                large
              />
            </div>

            {/* Type Breakdown */}
            {calculations.typeBreakdown.some((t) => t.bottles > 0) && (
              <div className="bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-xl sm:rounded-2xl p-3 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-white/90 mb-3 sm:mb-4">종류별 병당 원가</h3>
                <div className="space-y-2 sm:space-y-3">
                  {calculations.typeBreakdown
                    .filter((t) => t.bottles > 0)
                    .map((type, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 sm:p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg sm:rounded-xl"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#b7916e]" />
                          <div>
                            <p className="text-sm sm:text-base font-medium text-white/90">{type.name}</p>
                            <p className="text-[10px] sm:text-xs text-white/40">
                              {formatNumber(type.bottles)}병 · 원가 €{formatEuro(type.costPerBottleEur)}/병
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-xl font-light text-[#d4c4a8]">
                            {formatNumber(type.costPerBottleKrw)}원
                          </p>
                          <p className="text-[10px] sm:text-xs text-white/40">
                            총 {formatNumber(type.totalCost)}원
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
