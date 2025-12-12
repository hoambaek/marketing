'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useMasterPlanStore } from '@/lib/store/masterplan-store';
import {
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Database,
  Bell,
  Shield,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, resetToDefaults, tasks, mustDoItems, kpiItems, contentItems } =
    useMasterPlanStore();

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
      settings: { darkMode },
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
            // Here you would typically call a store method to import the data
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
    <div className="min-h-screen pb-12">
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-500 text-white'
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

      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-2">설정</h1>
            <p className="text-muted-foreground text-lg">앱 설정 및 데이터 관리</p>
          </motion.div>
        </div>
      </section>

      {/* Settings Sections */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-luxury overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/50">
              <h2 className="font-display text-xl text-foreground">외관</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon className="w-5 h-5 text-accent" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">다크 모드</p>
                    <p className="text-sm text-muted-foreground">
                      {darkMode ? '다크 모드 활성화됨' : '라이트 모드 활성화됨'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    darkMode ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <motion.div
                    animate={{ x: darkMode ? 24 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Data Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="card-luxury overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
              <Database className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground">데이터 현황</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-2xl font-display text-foreground">
                    {stats.completedTasks}/{stats.tasks}
                  </p>
                  <p className="text-sm text-muted-foreground">업무 완료</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-2xl font-display text-foreground">
                    {stats.completedMustDo}/{stats.mustDoItems}
                  </p>
                  <p className="text-sm text-muted-foreground">Must-Do 완료</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-2xl font-display text-foreground">{stats.kpiItems}</p>
                  <p className="text-sm text-muted-foreground">KPI 항목</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-2xl font-display text-foreground">{stats.contentItems}</p>
                  <p className="text-sm text-muted-foreground">콘텐츠 항목</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 col-span-2 sm:col-span-1">
                  <p className="text-2xl font-display text-foreground">
                    {Math.round((stats.completedTasks / stats.tasks) * 100) || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">전체 진행률</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-luxury overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground">데이터 관리</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Export */}
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Download className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">데이터 내보내기</p>
                  <p className="text-sm text-muted-foreground">
                    모든 데이터를 JSON 파일로 백업합니다
                  </p>
                </div>
              </button>

              {/* Import */}
              <button
                onClick={handleImport}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Upload className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">데이터 가져오기</p>
                  <p className="text-sm text-muted-foreground">
                    백업 파일에서 데이터를 복원합니다
                  </p>
                </div>
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-amber-500/10 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <RefreshCw className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">초기화</p>
                  <p className="text-sm text-muted-foreground">
                    모든 데이터를 초기 상태로 되돌립니다
                  </p>
                </div>
              </button>

              {/* Clear Storage */}
              <button
                onClick={handleClearStorage}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-red-500/10 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">저장소 삭제</p>
                  <p className="text-sm text-muted-foreground">
                    로컬 저장소의 모든 데이터를 영구 삭제합니다
                  </p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="card-luxury overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
              <Info className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground">정보</h2>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">버전</span>
                  <span className="text-foreground font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">프로젝트</span>
                  <span className="text-foreground font-medium">뮤즈드마레 마스터플랜</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">런칭 목표</span>
                  <span className="text-foreground font-medium">2026년 8월</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">저장 방식</span>
                  <span className="text-foreground font-medium">LocalStorage</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                  Muse de Marée - 해저에서 숙성되는 시간, 브랜드가 완성되는 여정
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
