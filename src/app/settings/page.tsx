'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { useIssueStore } from '@/lib/store/issue-store';
import { useInventoryStore } from '@/lib/store/inventory-store';
import { useBudgetStore } from '@/lib/store/budget-store';
import { AVAILABLE_YEARS } from '@/lib/types';
import {
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Database,
  Shield,
  Info,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Waves,
  Lock,
  X,
  Bell,
  BellOff,
  Calendar,
  Wallet,
  Package,
  ChevronRight,
  Globe,
  Cloud,
  CloudOff,
  Zap,
  Eye,
  Palette,
  Clock,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.01, y: -2, transition: { duration: 0.3 } },
};

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const ADMIN_PASSWORD = 'renlpp12';

const CURRENCY_OPTIONS = [
  { value: 'KRW', label: '₩ 원 (KRW)', symbol: '₩' },
  { value: 'USD', label: '$ 달러 (USD)', symbol: '$' },
  { value: 'EUR', label: '€ 유로 (EUR)', symbol: '€' },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 50];

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface AppSettings {
  defaultYear: number;
  currency: string;
  itemsPerPage: number;
  notifications: {
    budgetAlerts: boolean;
    dueDateAlerts: boolean;
    lowStockAlerts: boolean;
  };
  display: {
    compactMode: boolean;
    showAnimations: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultYear: 2026,
  currency: 'KRW',
  itemsPerPage: 20,
  notifications: {
    budgetAlerts: true,
    dueDateAlerts: true,
    lowStockAlerts: true,
  },
  display: {
    compactMode: false,
    showAnimations: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const { resetToDefaults, tasks, mustDoItems, kpiItems, contentItems } = useMasterPlanStore();
  const { issues } = useIssueStore();
  const { bottles } = useInventoryStore();
  const { budgetItems, expenseItems } = useBudgetStore();

  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // UI State
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: 'reset' | 'clear' | null;
  }>({ isOpen: false, action: null });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('muse-app-settings');
    if (saved) {
      try {
        setAppSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch {
        // Use defaults
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...newSettings };
    setAppSettings(updated);
    localStorage.setItem('muse-app-settings', JSON.stringify(updated));
    showNotification('success', '설정이 저장되었습니다');
  };

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openPasswordModal = (action: 'reset' | 'clear') => {
    setPasswordModal({ isOpen: true, action });
    setPasswordInput('');
    setPasswordError(false);
  };

  const closePasswordModal = () => {
    setPasswordModal({ isOpen: false, action: null });
    setPasswordInput('');
    setPasswordError(false);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      if (passwordModal.action === 'reset') {
        resetToDefaults();
        showNotification('success', '모든 데이터가 초기화되었습니다');
      } else if (passwordModal.action === 'clear') {
        localStorage.clear();
        showNotification('success', '저장소가 삭제되었습니다. 새로고침하세요');
      }
      closePasswordModal();
    } else {
      setPasswordError(true);
    }
  };

  // Export data
  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: appSettings,
      tasks,
      mustDoItems,
      kpiItems,
      contentItems,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muse-de-maree-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('success', '데이터가 내보내졌습니다');
  };

  // Import data
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.version && data.tasks) {
            showNotification('success', '데이터를 가져왔습니다. 새로고침하세요');
          } else {
            showNotification('error', '유효하지 않은 파일입니다');
          }
        } catch {
          showNotification('error', '파일 읽기 오류');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Stats
  const stats = {
    tasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'done').length,
    mustDoItems: mustDoItems.length,
    completedMustDo: mustDoItems.filter((m) => m.done).length,
    kpiItems: kpiItems.length,
    contentItems: contentItems.length,
    issues: issues.length,
    openIssues: issues.filter((i) => i.status === 'open' || i.status === 'in_progress').length,
    bottles: bottles.length,
    budgetItems: budgetItems.length,
    expenseItems: expenseItems.length,
    totalBudget: budgetItems.reduce((sum, b) => sum + b.budgeted, 0),
    totalExpense: expenseItems.reduce((sum, e) => sum + e.amount, 0),
  };

  const progressPercent = stats.tasks > 0 ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0;

  // Check Supabase connection
  const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-[#0a1018] to-[#0d1525]" />
        {/* Decorative orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#b7916e]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : notification.type === 'warning'
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : notification.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Decorative Element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-4 mb-8"
            >
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#b7916e]/50 to-[#b7916e]/80" />
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#b7916e]/20 to-[#b7916e]/5 border border-[#b7916e]/20">
                <Settings className="w-6 h-6 text-[#d4c4a8]" />
              </div>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#b7916e]/50 to-[#b7916e]/80" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl text-white/95 mb-4 tracking-tight"
              style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
            >
              설정
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-white/40 text-lg max-w-md mx-auto font-light"
            >
              앱 환경 설정 및 데이터 관리
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-5xl"
        >
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* App Settings Card */}
              <motion.div
                variants={itemVariants}
                initial="rest"
                whileHover="hover"
                animate="rest"
              >
                <motion.div
                  variants={cardHover}
                  className="relative rounded-3xl overflow-hidden"
                >
                  {/* Card Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                  <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                  {/* Header */}
                  <div className="relative px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20">
                      <Zap className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2
                        className="text-xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                      >
                        앱 설정
                      </h2>
                      <p className="text-sm text-white/40">기본 환경 설정</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative p-6 space-y-5">
                    {/* Default Year */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-white/40" />
                        <span className="text-white/70">기본 연도</span>
                      </div>
                      <select
                        value={appSettings.defaultYear}
                        onChange={(e) => saveSettings({ defaultYear: parseInt(e.target.value) })}
                        className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 focus:outline-none focus:ring-2 focus:ring-[#b7916e]/30 focus:border-[#b7916e]/50 transition-all cursor-pointer appearance-none min-w-[120px]"
                      >
                        {AVAILABLE_YEARS.map((year) => (
                          <option key={year} value={year} className="bg-[#0d1525]">
                            {year}년
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Currency */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-4 h-4 text-white/40" />
                        <span className="text-white/70">통화 단위</span>
                      </div>
                      <select
                        value={appSettings.currency}
                        onChange={(e) => saveSettings({ currency: e.target.value })}
                        className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 focus:outline-none focus:ring-2 focus:ring-[#b7916e]/30 focus:border-[#b7916e]/50 transition-all cursor-pointer appearance-none min-w-[140px]"
                      >
                        {CURRENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#0d1525]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Items per page */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4 text-white/40" />
                        <span className="text-white/70">페이지당 항목</span>
                      </div>
                      <select
                        value={appSettings.itemsPerPage}
                        onChange={(e) => saveSettings({ itemsPerPage: parseInt(e.target.value) })}
                        className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 focus:outline-none focus:ring-2 focus:ring-[#b7916e]/30 focus:border-[#b7916e]/50 transition-all cursor-pointer appearance-none min-w-[100px]"
                      >
                        {ITEMS_PER_PAGE_OPTIONS.map((num) => (
                          <option key={num} value={num} className="bg-[#0d1525]">
                            {num}개
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Notification Settings Card */}
              <motion.div variants={itemVariants}>
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                  <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                  {/* Header */}
                  <div className="relative px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20">
                      <Bell className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2
                        className="text-xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                      >
                        알림 설정
                      </h2>
                      <p className="text-sm text-white/40">알림 및 경고 설정</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative p-6 space-y-4">
                    {/* Budget Alerts */}
                    <button
                      onClick={() =>
                        saveSettings({
                          notifications: {
                            ...appSettings.notifications,
                            budgetAlerts: !appSettings.notifications.budgetAlerts,
                          },
                        })
                      }
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <Wallet className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 font-medium">예산 초과 알림</p>
                          <p className="text-sm text-white/40">예산 80% 초과 시 경고</p>
                        </div>
                      </div>
                      <div
                        className={`w-12 h-7 rounded-full transition-all relative ${
                          appSettings.notifications.budgetAlerts
                            ? 'bg-[#b7916e]'
                            : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${
                            appSettings.notifications.budgetAlerts ? 'left-6' : 'left-1'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Due Date Alerts */}
                    <button
                      onClick={() =>
                        saveSettings({
                          notifications: {
                            ...appSettings.notifications,
                            dueDateAlerts: !appSettings.notifications.dueDateAlerts,
                          },
                        })
                      }
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 font-medium">마감일 알림</p>
                          <p className="text-sm text-white/40">마감 3일 전 알림</p>
                        </div>
                      </div>
                      <div
                        className={`w-12 h-7 rounded-full transition-all relative ${
                          appSettings.notifications.dueDateAlerts
                            ? 'bg-[#b7916e]'
                            : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${
                            appSettings.notifications.dueDateAlerts ? 'left-6' : 'left-1'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Low Stock Alerts */}
                    <button
                      onClick={() =>
                        saveSettings({
                          notifications: {
                            ...appSettings.notifications,
                            lowStockAlerts: !appSettings.notifications.lowStockAlerts,
                          },
                        })
                      }
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Package className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 font-medium">재고 부족 알림</p>
                          <p className="text-sm text-white/40">재고 10개 미만 시 경고</p>
                        </div>
                      </div>
                      <div
                        className={`w-12 h-7 rounded-full transition-all relative ${
                          appSettings.notifications.lowStockAlerts
                            ? 'bg-[#b7916e]'
                            : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${
                            appSettings.notifications.lowStockAlerts ? 'left-6' : 'left-1'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Data Management Card */}
              <motion.div variants={itemVariants}>
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                  <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                  {/* Header */}
                  <div className="relative px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2
                        className="text-xl text-white/90"
                        style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                      >
                        데이터 관리
                      </h2>
                      <p className="text-sm text-white/40">백업 및 복원</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative p-6 space-y-3">
                    {/* Export */}
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-blue-500/[0.05] hover:border-blue-500/20 transition-all text-left group"
                    >
                      <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                        <Download className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white/80">데이터 내보내기</p>
                        <p className="text-sm text-white/40">JSON 파일로 백업</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>

                    {/* Import */}
                    <button
                      onClick={handleImport}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-emerald-500/[0.05] hover:border-emerald-500/20 transition-all text-left group"
                    >
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors">
                        <Upload className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white/80">데이터 가져오기</p>
                        <p className="text-sm text-white/40">백업 파일 복원</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>

                    {/* Danger Zone */}
                    <div className="pt-4 mt-4 border-t border-white/[0.06]">
                      <p className="text-xs text-white/30 uppercase tracking-wider mb-3">위험 구역</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPasswordModal('reset')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-amber-500/[0.08] hover:border-amber-500/30 transition-all group"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500/50" />
                          <RefreshCw className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-white/50 group-hover:text-amber-400 transition-colors">
                            초기화
                          </span>
                        </button>
                        <button
                          onClick={() => openPasswordModal('clear')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-red-500/[0.08] hover:border-red-500/30 transition-all group"
                        >
                          <Lock className="w-3.5 h-3.5 text-red-500/50" />
                          <Trash2 className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-white/50 group-hover:text-red-400 transition-colors">
                            저장소 삭제
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats & Info */}
            <div className="space-y-6">
              {/* Progress Card */}
              <motion.div variants={itemVariants}>
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/10 to-[#b7916e]/[0.02]" />
                  <div className="absolute inset-0 border border-[#b7916e]/20 rounded-3xl" />

                  <div className="relative p-6">
                    <div className="text-center mb-4">
                      <p
                        className="text-5xl text-[#d4c4a8] mb-1"
                        style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                      >
                        {progressPercent}%
                      </p>
                      <p className="text-sm text-[#b7916e]/60">전체 진행률</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#b7916e] to-[#d4c4a8] rounded-full"
                      />
                    </div>

                    <p className="text-center text-xs text-white/30 mt-3">
                      {stats.completedTasks} / {stats.tasks} 업무 완료
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Data Stats Card */}
              <motion.div variants={itemVariants}>
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                  <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                  <div className="relative px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30">
                      <Database className="w-4 h-4 text-[#d4c4a8]" />
                    </div>
                    <h3
                      className="text-lg text-white/90"
                      style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                    >
                      데이터 현황
                    </h3>
                  </div>

                  <div className="relative p-4 space-y-2">
                    {[
                      { label: 'Must-Do', value: `${stats.completedMustDo}/${stats.mustDoItems}`, color: 'text-violet-400' },
                      { label: 'KPI 항목', value: stats.kpiItems, color: 'text-blue-400' },
                      { label: '콘텐츠', value: stats.contentItems, color: 'text-emerald-400' },
                      { label: '이슈', value: `${stats.openIssues}/${stats.issues}`, color: 'text-amber-400' },
                      { label: '재고', value: `${stats.bottles}병`, color: 'text-rose-400' },
                      { label: '예산', value: stats.budgetItems, color: 'text-cyan-400' },
                      { label: '지출', value: stats.expenseItems, color: 'text-pink-400' },
                    ].map((item, i) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-sm text-white/50">{item.label}</span>
                        <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                      </div>
                    ))}

                    {/* Budget Summary */}
                    <div className="pt-3 mt-2 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-500/[0.05]">
                        <span className="text-sm text-emerald-400/70">총 예산</span>
                        <span className="text-sm font-medium text-emerald-400">
                          {stats.totalBudget.toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-rose-500/[0.05]">
                        <span className="text-sm text-rose-400/70">총 지출</span>
                        <span className="text-sm font-medium text-rose-400">
                          {stats.totalExpense.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Storage Status Card */}
              <motion.div variants={itemVariants}>
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                  <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                  <div className="relative p-5">
                    <div className="flex items-center gap-3 mb-4">
                      {isSupabaseConfigured ? (
                        <Cloud className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <CloudOff className="w-5 h-5 text-amber-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white/80">저장소 상태</p>
                        <p className="text-xs text-white/40">
                          {isSupabaseConfigured ? 'Supabase 연결됨' : '로컬 저장소 사용'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                        } animate-pulse`}
                      />
                      <span className="text-xs text-white/30">
                        {isSupabaseConfigured ? '클라우드 동기화 활성' : '오프라인 모드'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* About Card */}
              <motion.div variants={itemVariants}>
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                  <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />

                  <div className="relative p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Info className="w-5 h-5 text-white/30" />
                      <span className="text-sm text-white/60">정보</span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/40">버전</span>
                        <span className="text-white/70">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">프로젝트</span>
                        <span className="text-white/70">Muse de Marée</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">런칭 목표</span>
                        <span className="text-[#d4c4a8]">2026년 8월</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
                      <Waves className="w-5 h-5 text-[#b7916e]/50 mx-auto mb-2" />
                      <p className="text-[11px] text-white/20 italic">
                        해저에서 숙성되는 시간,
                        <br />
                        브랜드가 완성되는 여정
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/15">
              Muse de Marée · Settings
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={closePasswordModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#0d1525] border border-white/[0.1] rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      passwordModal.action === 'reset'
                        ? 'bg-amber-500/20 border border-amber-500/30'
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}
                  >
                    <Lock
                      className={`w-5 h-5 ${
                        passwordModal.action === 'reset' ? 'text-amber-400' : 'text-red-400'
                      }`}
                    />
                  </div>
                  <h3
                    className="text-lg text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {passwordModal.action === 'reset' ? '초기화 확인' : '저장소 삭제'}
                  </h3>
                </div>
                <button
                  onClick={closePasswordModal}
                  className="p-2 rounded-xl hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              {/* Warning Message */}
              <p className="text-sm text-white/50 mb-5 leading-relaxed">
                {passwordModal.action === 'reset'
                  ? '모든 데이터가 초기 상태로 되돌아갑니다. 이 작업은 되돌릴 수 없습니다.'
                  : '로컬 저장소의 모든 데이터가 영구적으로 삭제됩니다.'}
              </p>

              {/* Password Input */}
              <div className="mb-5">
                <label className="block text-xs text-white/40 mb-2">관리자 비밀번호</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="비밀번호를 입력하세요"
                  className={`w-full px-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 transition-all ${
                    passwordError
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-white/[0.1] focus:ring-[#b7916e]/30 focus:border-[#b7916e]/50'
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    비밀번호가 일치하지 않습니다
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closePasswordModal}
                  className="flex-1 px-4 py-3 border border-white/[0.1] rounded-xl text-white/60 hover:bg-white/[0.05] transition-colors text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-medium transition-colors ${
                    passwordModal.action === 'reset'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
