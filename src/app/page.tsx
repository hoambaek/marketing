'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import { useBudgetStore } from '@/lib/store/budget-store';
import { useIssueStore } from '@/lib/store/issue-store';
import { useInventoryStore } from '@/lib/store/inventory-store';
import { Footer } from '@/components/layout/Footer';
import {
  PHASE_INFO,
} from '@/lib/types';
import {
  AlertTriangle,
  TrendingUp,
  Wallet,
  AlertCircle,
  Target,
  ArrowUpRight,
  Sparkles,
  Clock,
  Wine,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function getDaysUntilLaunch(): number {
  const launchDate = new Date('2026-08-01');
  const today = new Date();
  const diffTime = launchDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

function getCurrentPhase(): number {
  const today = new Date();
  const targetYear = 2026;
  if (today.getFullYear() < targetYear) return 1;
  if (today.getFullYear() > targetYear) return 5;
  const month = today.getMonth() + 1;
  for (const phase of PHASE_INFO) {
    if (phase.months.includes(month)) return phase.id;
  }
  return 1;
}

function formatCurrency(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
}

// ═══════════════════════════════════════════════════════════════════════════
// Health Score Ring Component
// ═══════════════════════════════════════════════════════════════════════════

function HealthScoreRing({ score, size = 240 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Health color based on score
  const getHealthColor = (s: number) => {
    if (s >= 70) return { stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)', label: 'Healthy' };
    if (s >= 40) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', label: 'Attention' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)', label: 'Critical' };
  };

  const health = getHealthColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: health.glow }}
      />

      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={health.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-6xl sm:text-7xl font-light text-white/95"
          style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
        >
          {score}
        </motion.span>
        <span className="text-xs tracking-[0.3em] uppercase text-white/40 mt-1">
          {health.label}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Stat Card Component
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  subValue,
  progress,
  icon: Icon,
  href,
  alert
}: {
  label: string;
  value: string | number;
  subValue?: string;
  progress?: number;
  icon: React.ElementType;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={`relative p-5 rounded-2xl cursor-pointer group overflow-hidden ${
          alert
            ? 'bg-gradient-to-br from-rose-500/10 to-rose-500/[0.02] border border-rose-500/20'
            : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08]'
        }`}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#b7916e]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <Icon className={`w-5 h-5 ${alert ? 'text-rose-400' : 'text-white/30'}`} />
            <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-[#b7916e] transition-colors" />
          </div>

          <p className={`text-3xl font-light mb-1 ${alert ? 'text-rose-400' : 'text-white/90'}`}
             style={{ fontFamily: "var(--font-cormorant), serif" }}>
            {value}
          </p>

          <p className="text-xs text-white/40 mb-3">{label}</p>

          {progress !== undefined && (
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={`h-full rounded-full ${
                  alert ? 'bg-rose-500' :
                  progress > 80 ? 'bg-emerald-500' :
                  progress > 50 ? 'bg-amber-500' : 'bg-white/30'
                }`}
              />
            </div>
          )}

          {subValue && (
            <p className="text-[10px] text-white/30 mt-2">{subValue}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Attention Item Component
// ═══════════════════════════════════════════════════════════════════════════

function AttentionItem({
  type,
  title,
  severity,
  href
}: {
  type: 'issue' | 'budget' | 'task' | 'deadline';
  title: string;
  severity: 'critical' | 'warning' | 'info';
  href: string;
}) {
  const severityStyles = {
    critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', dot: 'bg-rose-500', text: 'text-rose-300' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500', text: 'text-amber-300' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-500', text: 'text-blue-300' },
  };

  const style = severityStyles[severity];

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 4 }}
        className={`flex items-center gap-3 p-3 rounded-xl ${style.bg} border ${style.border} cursor-pointer group`}
      >
        <div className={`w-2 h-2 rounded-full ${style.dot} ${severity === 'critical' ? 'animate-pulse' : ''}`} />
        <p className={`text-sm ${style.text} flex-1 truncate`}>{title}</p>
        <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
      </motion.div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const {
    getTotalProgress,
    tasks,
    mustDoItems,
    isInitialized: masterplanInitialized,
    initializeFromSupabase: initMasterplan
  } = useMasterPlanStore();

  const {
    getTotalBudgeted,
    getTotalSpent,
    isInitialized: budgetInitialized,
    initializeFromSupabase: initBudget
  } = useBudgetStore();

  const {
    issues,
    getOpenIssues,
    getCriticalIssues,
    isInitialized: issueInitialized,
    initializeFromSupabase: initIssues
  } = useIssueStore();

  const {
    getTotalInventoryValue,
    isInitialized: inventoryInitialized,
    initializeInventory
  } = useInventoryStore();

  const selectedYear = 2026; // Fixed year for budget/task filtering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!masterplanInitialized) initMasterplan();
    if (!budgetInitialized) initBudget();
    if (!issueInitialized) initIssues();
    if (!inventoryInitialized) initializeInventory();
  }, [masterplanInitialized, budgetInitialized, issueInitialized, inventoryInitialized, initMasterplan, initBudget, initIssues, initializeInventory]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Computed Values
  // ═══════════════════════════════════════════════════════════════════════════

  const taskProgress = mounted ? getTotalProgress() : 0;
  const daysUntilLaunch = mounted ? getDaysUntilLaunch() : 0;
  const currentPhase = mounted ? getCurrentPhase() : 1;
  const currentPhaseInfo = PHASE_INFO.find(p => p.id === currentPhase);

  const totalBudget = mounted ? getTotalBudgeted(selectedYear) : 0;
  const totalSpent = mounted ? getTotalSpent(selectedYear) : 0;
  const budgetUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const openIssues = mounted ? getOpenIssues() : [];
  const criticalIssues = mounted ? getCriticalIssues() : [];
  const totalIssues = mounted ? issues.length : 0;
  const resolvedIssues = mounted ? issues.filter(i => i.status === 'resolved' || i.status === 'closed').length : 0;
  const issueResolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100;

  const mustDoCompleted = mounted ? mustDoItems.filter(m => m.done).length : 0;
  const mustDoTotal = mounted ? mustDoItems.length : 0;
  const mustDoProgress = mustDoTotal > 0 ? Math.round((mustDoCompleted / mustDoTotal) * 100) : 0;

  const inventory = mounted ? getTotalInventoryValue() : { totalBottles: 0, available: 0, sold: 0, reserved: 0 };

  // Calculate Health Score (weighted average)
  const healthScore = mounted ? Math.round(
    (taskProgress * 0.35) +           // 35% weight on task progress
    (mustDoProgress * 0.25) +         // 25% weight on must-do completion
    ((100 - Math.min(budgetUsage, 100)) * 0.20) +  // 20% weight on budget health (inverse)
    ((100 - Math.min(criticalIssues.length * 20, 100)) * 0.20)  // 20% weight on issue severity
  ) : 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // Attention Items (things that need attention)
  // ═══════════════════════════════════════════════════════════════════════════

  const attentionItems: Array<{
    type: 'issue' | 'budget' | 'task' | 'deadline';
    title: string;
    severity: 'critical' | 'warning' | 'info';
    href: string;
  }> = [];

  // Add critical issues
  criticalIssues.forEach(issue => {
    attentionItems.push({
      type: 'issue',
      title: issue.title,
      severity: 'critical',
      href: '/issues'
    });
  });

  // Add budget warning if over 70%
  if (budgetUsage > 70) {
    attentionItems.push({
      type: 'budget',
      title: `${selectedYear}년 예산 ${budgetUsage}% 소진`,
      severity: budgetUsage > 90 ? 'critical' : 'warning',
      href: '/budget'
    });
  }

  // Add overdue tasks (tasks that are pending in past months)
  const currentMonth = new Date().getMonth() + 1;
  const overdueTasks = mounted ? tasks.filter(t =>
    t.year === selectedYear &&
    t.month < currentMonth &&
    t.status === 'pending'
  ).slice(0, 2) : [];

  overdueTasks.forEach(task => {
    attentionItems.push({
      type: 'task',
      title: `${task.month}월 미완료: ${task.title}`,
      severity: 'warning',
      href: `/month/${task.month}`
    });
  });

  // Limit to 5 items max
  const displayAttentionItems = attentionItems.slice(0, 5);

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-[#0a1018] to-[#0d1525]" />
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-[#b7916e]/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/[0.015] rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="h-px w-8 bg-gradient-to-r from-[#b7916e] to-transparent" />
                <span className="text-[#b7916e] text-xs tracking-[0.25em] uppercase font-light">
                  Command Center
                </span>
              </motion.div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl text-white/95 tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                Dashboard
              </h1>
            </div>

            {/* Today's Date */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-right"
            >
              <p className="text-2xl sm:text-3xl text-white/90"
                 style={{ fontFamily: "var(--font-cormorant), serif" }}>
                {mounted ? new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : ''}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {mounted ? new Date().toLocaleDateString('ko-KR', { weekday: 'long' }) : ''}
              </p>
            </motion.div>
          </motion.div>

          {/* Hero Section - Health Score + Launch Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 mb-12"
          >
            {/* Health Score Ring */}
            <div className="relative">
              <HealthScoreRing score={healthScore} size={220} />
            </div>

            {/* Launch Info */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <p className="text-7xl sm:text-8xl font-light text-white/90 mb-2"
                   style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  D-{daysUntilLaunch}
                </p>
                <p className="text-sm text-white/40 tracking-wide mb-4">2026년 8월 1일 런칭</p>

                {/* Phase Indicator */}
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  {PHASE_INFO.map((phase) => (
                    <div
                      key={phase.id}
                      className={`w-3 h-3 rounded-full transition-all ${
                        phase.id < currentPhase
                          ? 'bg-emerald-500'
                          : phase.id === currentPhase
                          ? 'bg-[#b7916e] ring-2 ring-[#b7916e]/30 ring-offset-2 ring-offset-[#0a0f1a]'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#b7916e] mt-2">
                  Phase {currentPhase}: {currentPhaseInfo?.name}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <StatCard
              label="태스크 진행률"
              value={`${taskProgress}%`}
              progress={taskProgress}
              icon={TrendingUp}
              href="/monthly-plan"
              subValue={`${tasks.filter(t => t.status === 'done').length}개 완료`}
            />
            <StatCard
              label="예산 소진"
              value={`${budgetUsage}%`}
              progress={budgetUsage}
              icon={Wallet}
              href="/budget"
              subValue={`${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}`}
              alert={budgetUsage > 90}
            />
            <StatCard
              label="이슈 해결률"
              value={`${issueResolutionRate}%`}
              progress={issueResolutionRate}
              icon={AlertCircle}
              href="/issues"
              subValue={openIssues.length > 0 ? `${openIssues.length}개 미해결` : '모두 해결'}
              alert={criticalIssues.length > 0}
            />
            <StatCard
              label="Must-Do"
              value={`${mustDoProgress}%`}
              progress={mustDoProgress}
              icon={Target}
              href="/checklist"
              subValue={`${mustDoCompleted} / ${mustDoTotal} 완료`}
            />
          </motion.div>

          {/* Attention Section */}
          {displayAttentionItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/60 tracking-wide">Attention Needed</span>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              <div className="space-y-2">
                {displayAttentionItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  >
                    <AttentionItem {...item} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* All Clear State */}
          {displayAttentionItems.length === 0 && mounted && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mb-8"
            >
              <div className="relative p-8 rounded-2xl overflow-hidden text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02]" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-2xl" />

                <div className="relative">
                  <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <p className="text-lg text-emerald-300" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    All Systems Nominal
                  </p>
                  <p className="text-xs text-white/40 mt-1">현재 주의가 필요한 항목이 없습니다</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { label: '월별플랜', href: '/monthly-plan', icon: Clock },
              { label: '이슈관리', href: '/issues', icon: AlertTriangle },
              { label: '재고현황', href: '/inventory', icon: Wine },
              { label: '캘린더', href: '/calendar', icon: Target },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-[#b7916e]/20 transition-all cursor-pointer group"
                >
                  <link.icon className="w-4 h-4 text-white/30 group-hover:text-[#b7916e] transition-colors" />
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    {link.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
