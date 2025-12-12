'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
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
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export default function SettingsPage() {
  const { resetToDefaults, tasks, mustDoItems, kpiItems, contentItems } = useMasterPlanStore();

  const [notification, setNotification] = useState<{
    type: 'success' | 'warning';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Export data
  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      mustDoItems,
      kpiItems,
      contentItems,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muse-de-maree-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('success', '데이터가 성공적으로 내보내졌습니다.');
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
          if (data.version && data.tasks && data.mustDoItems) {
            showNotification('success', '데이터를 성공적으로 가져왔습니다. 페이지를 새로고침하세요.');
          } else {
            showNotification('warning', '유효하지 않은 백업 파일입니다.');
          }
        } catch {
          showNotification('warning', '파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Reset data
  const handleReset = () => {
    if (window.confirm('모든 데이터를 초기 상태로 되돌리시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      resetToDefaults();
      showNotification('success', '모든 데이터가 초기화되었습니다.');
    }
  };

  // Clear localStorage
  const handleClearStorage = () => {
    if (
      window.confirm(
        '로컬 저장소를 완전히 삭제하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.'
      )
    ) {
      localStorage.clear();
      showNotification('success', '로컬 저장소가 삭제되었습니다. 페이지를 새로고침하세요.');
    }
  };

  // Stats
  const stats = {
    tasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'done').length,
    mustDoItems: mustDoItems.length,
    completedMustDo: mustDoItems.filter((m) => m.done).length,
    kpiItems: kpiItems.length,
    contentItems: contentItems.length,
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.12), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59, 130, 246, 0.08), transparent)`,
          }}
        />
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-xl border ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {notification.message}
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-12"
          >
            {/* Decorative Line */}
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <div className="flex items-center gap-4">
                <motion.div
                  className="h-px w-16 bg-gradient-to-r from-transparent to-[#b7916e]/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                <Settings className="w-5 h-5 text-[#b7916e]" />
                <motion.div
                  className="h-px w-16 bg-gradient-to-l from-transparent to-[#b7916e]/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl text-white/90 mb-4 tracking-tight"
              style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
            >
              설정
            </motion.h1>

            <motion.p variants={itemVariants} className="text-white/40 text-lg max-w-xl mx-auto">
              앱 설정 및 데이터 관리
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Settings Sections */}
      <section className="px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl space-y-6"
        >
          {/* Data Statistics */}
          <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle at 50% 100%, rgba(183, 145, 110, 0.05), transparent 70%)',
              }}
            />

            <div className="relative px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30">
                <Database className="w-5 h-5 text-[#d4c4a8]" />
              </div>
              <h2
                className="text-xl text-white/90"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                데이터 현황
              </h2>
            </div>

            <div className="relative p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p
                    className="text-2xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {stats.completedTasks}/{stats.tasks}
                  </p>
                  <p className="text-sm text-white/40">업무 완료</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p
                    className="text-2xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {stats.completedMustDo}/{stats.mustDoItems}
                  </p>
                  <p className="text-sm text-white/40">Must-Do 완료</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p
                    className="text-2xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {stats.kpiItems}
                  </p>
                  <p className="text-sm text-white/40">KPI 항목</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p
                    className="text-2xl text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {stats.contentItems}
                  </p>
                  <p className="text-sm text-white/40">콘텐츠 항목</p>
                </div>
                <div className="p-4 rounded-xl bg-[#b7916e]/10 border border-[#b7916e]/20 col-span-2 sm:col-span-1">
                  <p
                    className="text-2xl text-[#d4c4a8]"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    {Math.round((stats.completedTasks / stats.tasks) * 100) || 0}%
                  </p>
                  <p className="text-sm text-[#b7916e]/70">전체 진행률</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            <div className="relative px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h2
                className="text-xl text-white/90"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                데이터 관리
              </h2>
            </div>

            <div className="relative p-6 space-y-3">
              {/* Export */}
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 text-left group/btn"
              >
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover/btn:bg-blue-500/30 transition-colors">
                  <Download className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white/80">데이터 내보내기</p>
                  <p className="text-sm text-white/40">모든 데이터를 JSON 파일로 백업합니다</p>
                </div>
              </button>

              {/* Import */}
              <button
                onClick={handleImport}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 text-left group/btn"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 group-hover/btn:bg-emerald-500/30 transition-colors">
                  <Upload className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white/80">데이터 가져오기</p>
                  <p className="text-sm text-white/40">백업 파일에서 데이터를 복원합니다</p>
                </div>
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-amber-500/[0.05] hover:border-amber-500/20 transition-all duration-300 text-left group/btn"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 group-hover/btn:bg-amber-500/30 transition-colors">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white/80">초기화</p>
                  <p className="text-sm text-white/40">모든 데이터를 초기 상태로 되돌립니다</p>
                </div>
              </button>

              {/* Clear Storage */}
              <button
                onClick={handleClearStorage}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-red-500/[0.05] hover:border-red-500/20 transition-all duration-300 text-left group/btn"
              >
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 group-hover/btn:bg-red-500/30 transition-colors">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white/80">저장소 삭제</p>
                  <p className="text-sm text-white/40">로컬 저장소의 모든 데이터를 영구 삭제합니다</p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* About */}
          <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

            <div className="relative px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
                <Info className="w-5 h-5 text-violet-400" />
              </div>
              <h2
                className="text-xl text-white/90"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                정보
              </h2>
            </div>

            <div className="relative p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-white/40">버전</span>
                  <span className="text-white/80 font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-white/40">프로젝트</span>
                  <span className="text-white/80 font-medium">뮤즈드마레 마스터플랜</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-white/40">런칭 목표</span>
                  <span className="text-[#d4c4a8] font-medium">2026년 8월</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/40">저장 방식</span>
                  <span className="text-white/80 font-medium">LocalStorage</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Waves className="w-5 h-5 text-[#b7916e]" />
                </div>
                <p className="text-sm text-white/30 italic">
                  해저에서 숙성되는 시간, 브랜드가 완성되는 여정
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bottom Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-12 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">
              Muse de Marée · Settings
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
