'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Loader2, Inbox } from 'lucide-react';
import { PRODUCTS } from '@/lib/types';
import type { TastingSubmission, TastingSubmissionStatus } from '@/lib/types/uaps';

const GOLD = '#C4A052';

const AXES: { key: keyof TastingSubmission; tKey: keyof TastingSubmission; label: string }[] = [
  { key: 'actualFruity', tKey: 'terrestrialFruity', label: '과실향' },
  { key: 'actualFloralMineral', tKey: 'terrestrialFloralMineral', label: '플로럴·미네랄' },
  { key: 'actualYeastyAutolytic', tKey: 'terrestrialYeastyAutolytic', label: '효모·숙성향' },
  { key: 'actualAcidityFreshness', tKey: 'terrestrialAcidityFreshness', label: '산도·상쾌함' },
  { key: 'actualBodyTexture', tKey: 'terrestrialBodyTexture', label: '바디감·질감' },
  { key: 'actualFinishComplexity', tKey: 'terrestrialFinishComplexity', label: '여운·복합미' },
];

function productName(id: string): string {
  const p = PRODUCTS.find(p => p.id === id);
  return p?.nameKo ?? p?.name ?? id;
}

const TABS: { value: TastingSubmissionStatus; label: string }[] = [
  { value: 'pending', label: '대기' },
  { value: 'approved', label: '승인됨' },
  { value: 'rejected', label: '거부됨' },
];

export default function TastingReviewPage() {
  const [tab, setTab] = useState<TastingSubmissionStatus>('pending');
  const [list, setList] = useState<TastingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (status: TastingSubmissionStatus) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/uaps/tasting-submissions?status=${status}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? '목록을 불러오지 못했습니다.');
        setList([]);
      } else {
        setList(data.submissions ?? []);
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    try {
      const res = await fetch('/api/uaps/tasting-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      if (res.ok) {
        setList(prev => prev.filter(s => s.id !== id));
      } else {
        const data = await res.json();
        setError(data?.error ?? '처리에 실패했습니다.');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0b0d] text-white pb-24">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-14 pb-6">
        <Link href="/uaps" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />UAPS 대시보드
        </Link>
        <p className="text-white/35 text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-3 font-light">
          외부 기록자 제출 검토
        </p>
        <h1 className="text-2xl sm:text-4xl text-white/90 mb-2 leading-tight font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          비교 시음 제출함
        </h1>
        <p className="text-white/40 text-sm leading-relaxed">
          외부 기록자가 공개 링크로 제출한 비교 시음입니다. 승인하면 정식 데이터(retrieval_results)로 반영됩니다.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* 탭 */}
        <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.value ? 'bg-white/[0.07] text-white/85' : 'text-white/35 hover:text-white/55'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] px-4 py-3 mb-4">
            <p className="text-[12px] text-red-300/70">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/25">
            <Inbox className="w-8 h-8 mb-3" />
            <p className="text-sm">{tab === 'pending' ? '대기 중인 제출이 없습니다.' : '항목이 없습니다.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(s => (
              <div key={s.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
                {/* 헤더 */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white/85">{s.recorderName}</span>
                      {s.recorderAffiliation && (
                        <span className="text-[11px] text-white/35">· {s.recorderAffiliation}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {productName(s.productId)} · 패널 {s.tastingPanelSize}명
                      {s.retrievalDate && ` · ${s.retrievalDate}`}
                      {s.actualDurationMonths != null && ` · ${s.actualDurationMonths}개월`}
                    </p>
                  </div>
                  {tab === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => act(s.id, 'approve')} disabled={busyId === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all disabled:opacity-50"
                        style={{ borderColor: `${GOLD}40`, color: GOLD, backgroundColor: `${GOLD}0c` }}>
                        {busyId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        승인
                      </button>
                      <button onClick={() => act(s.id, 'reject')} disabled={busyId === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-white/45 text-xs hover:text-white/70 hover:border-white/25 transition-all disabled:opacity-50">
                        <X className="w-3 h-3" />거부
                      </button>
                    </div>
                  )}
                </div>

                {/* 6축 비교 */}
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.06]">
                    <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">풍미 축</span>
                    <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest w-12 text-right" style={{ color: `${GOLD}99` }}>해저</span>
                    <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest w-12 text-right">지상</span>
                  </div>
                  {AXES.map(a => {
                    const u = s[a.key] as number | null;
                    const t = s[a.tKey] as number | null;
                    return (
                      <div key={a.label} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-1.5 border-b border-white/[0.03] last:border-0 items-center">
                        <span className="text-[12px] text-white/50">{a.label}</span>
                        <span className="text-[12px] font-mono w-12 text-right tabular-nums" style={{ color: GOLD }}>{u ?? '—'}</span>
                        <span className="text-[12px] font-mono text-white/45 w-12 text-right tabular-nums">{t ?? '—'}</span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-1.5 bg-white/[0.02] items-center">
                    <span className="text-[12px] text-white/70 font-medium">종합 선호도</span>
                    <span className="text-[12px] font-mono w-12 text-right tabular-nums font-semibold" style={{ color: GOLD }}>{s.actualOverallQuality ?? '—'}</span>
                    <span className="text-[12px] font-mono text-white/55 w-12 text-right tabular-nums font-semibold">{s.terrestrialOverallQuality ?? '—'}</span>
                  </div>
                </div>

                {s.tastingNotes && (
                  <p className="text-[12px] text-white/45 leading-relaxed mt-3 whitespace-pre-wrap">{s.tastingNotes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
