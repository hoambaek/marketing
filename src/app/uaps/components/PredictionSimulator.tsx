'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, Settings2, Loader2, Play, Link2, Check, Inbox, Wine, Sparkles } from 'lucide-react';
import { AgingProduct, AgingPrediction } from '@/lib/types/uaps';

// UAPS 예측 시뮬레이터 카드 (샴페인·전 카테고리 공유).
// 상단 행(시뮬레이션 라벨·기간·버튼·품질점수) + AI 인사이트(고정 높이) + 신뢰도 바.
// accent/accentRgb로 테마색 주입(기본 cyan → 샴페인 동일). 신뢰도 바는 의미색(green/amber/red) 고정.
export function PredictionSimulator({
  selectedProductId,
  selectedProduct,
  latestPrediction,
  isPredicting,
  linkCopied,
  setLinkCopied,
  onOpenCoefficientDialog,
  runPrediction,
  accent = '#22d3ee',
  accentRgb = '34, 211, 238',
}: {
  selectedProductId: string;
  selectedProduct: AgingProduct;
  latestPrediction: AgingPrediction | null;
  isPredicting: boolean;
  linkCopied: boolean;
  setLinkCopied: (v: boolean) => void;
  onOpenCoefficientDialog: () => void;
  runPrediction: (productId: string, months: number, depth?: number) => Promise<AgingPrediction | null> | void;
  accent?: string;
  accentRgb?: string;
}) {
  return (
    <motion.div
      key="simulation-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
      className="relative"
    >
      <div className="absolute inset-0 rounded-2xl" style={{ background: `radial-gradient(ellipse at top, rgba(${accentRgb}, 0.03), transparent)` }} />
      <div className="relative bg-[#0d1421]/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* 상단 스트립 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${accentRgb}, 0.3), transparent)` }}
        />

        {/* 시뮬레이터 행 */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.04] space-y-3 sm:space-y-0">
          {/* 상단: 라벨 + 기간 + 버튼 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `rgba(${accentRgb}, 0.08)` }}>
                <Target className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">Simulation</span>
            </div>

            {/* 숙성 기간 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/25">기간</span>
              <span className="text-sm font-light font-mono" style={{ color: accent }}>
                {selectedProduct.plannedDurationMonths ?? '—'}
              </span>
              <span className="text-[10px] text-white/20">개월</span>
            </div>
            </div>

            <div className="hidden sm:block flex-1" />

            <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenCoefficientDialog}
              className="p-2 sm:p-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all shrink-0"
              title="보정 계수 설정"
            >
              <Settings2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={async () => {
                if (!latestPrediction) return;
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/tasting/${latestPrediction.id}`);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                } catch {
                  // 클립보드 권한 없을 때 프롬프트로 폴백
                  window.prompt(`'${selectedProduct.productName}' 기록자에게 전달할 링크`, `${window.location.origin}/tasting/${latestPrediction.id}`);
                }
              }}
              disabled={!latestPrediction}
              className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-medium text-emerald-400 transition-all disabled:opacity-30 shrink-0"
              title={!latestPrediction ? '예측을 먼저 실행하세요' : `'${selectedProduct.productName}' 전용 시음 입력 링크 복사 — 이 링크로 제출된 기록은 이 제품에 연결됩니다`}
            >
              {linkCopied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
              {linkCopied ? (
                <span className="inline-flex items-center gap-1">
                  복사됨<span className="max-w-[140px] truncate opacity-70">· {selectedProduct.productName}</span>
                </span>
              ) : '시음 기록 링크'}
            </button>
            <Link
              href={`/uaps/tasting-review?product=${selectedProductId}`}
              className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-all shrink-0"
              title={`'${selectedProduct.productName}'로 제출된 평가만 필터해서 검토`}
            >
              <Inbox className="w-3 h-3" />
              제출 검토
            </Link>
            <button
              onClick={() => runPrediction(selectedProductId, selectedProduct.plannedDurationMonths || 18)}
              disabled={isPredicting || !selectedProduct.plannedDurationMonths}
              className="flex items-center gap-1.5 text-black font-medium rounded-lg px-3.5 py-2 sm:py-1.5 text-xs hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: `linear-gradient(to right, ${accent}e6, rgba(${accentRgb}, 0.85))` }}
            >
              {isPredicting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {isPredicting ? '분석 중' : 'AI 예측'}
            </button>
            </div>
          </div>

          {/* 품질 점수 — 모바일: 별도 행, 데스크톱: 인라인 */}
          {latestPrediction?.overallQualityScore != null && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {[
                { label: '종합', value: latestPrediction.overallQualityScore, color: '#C4A052' },
                { label: '질감', value: latestPrediction.textureMaturityScore, color: '#34d399' },
                { label: '향', value: latestPrediction.aromaFreshnessScore, color: accent },
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

        {/* AI 인사이트 행 — 높이 완전 고정 */}
        <div className="px-5 pt-3 pb-5 space-y-2 h-[104px] overflow-hidden">
          {latestPrediction?.aiInsightText ? (
              <>
                {/* 투하 전·후 2단 인사이트 */}
                {latestPrediction.aiInsightText.includes('\n') ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 투하 전 특징 */}
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: `rgba(${accentRgb}, 0.06)` }}>
                        <Wine className="w-3 h-3" style={{ color: `rgba(${accentRgb}, 0.6)` }} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider" style={{ color: `rgba(${accentRgb}, 0.4)` }}>Before</span>
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
              </>
            ) : (
              <p className="text-[11px] text-white/25 italic">AI 예측을 실행하면 투하 전·후 비교 인사이트가 표시됩니다</p>
            )}
        </div>

        {/* 예측 신뢰도 바 */}
        {latestPrediction?.predictionConfidence != null && (
          <div className="px-5 py-2.5 border-t border-white/[0.04] flex items-center justify-end gap-3">
            <span className="text-[9px] text-white/25 uppercase tracking-wider">예측 신뢰도</span>
            <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  latestPrediction.predictionConfidence >= 0.7 ? 'bg-emerald-400/70' :
                  latestPrediction.predictionConfidence >= 0.45 ? 'bg-amber-400/70' : 'bg-red-400/70'
                }`}
                style={{ width: `${latestPrediction.predictionConfidence * 100}%` }}
              />
            </div>
            <span className={`text-xs font-mono font-medium ${
              latestPrediction.predictionConfidence >= 0.7 ? 'text-emerald-400/80' :
              latestPrediction.predictionConfidence >= 0.45 ? 'text-amber-400/80' : 'text-red-400/80'
            }`}>
              {Math.round(latestPrediction.predictionConfidence * 100)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
