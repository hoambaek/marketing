'use client';

import { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, X, Loader2, Inbox, Link2, AlertTriangle } from 'lucide-react';
import { PRODUCTS } from '@/lib/types';
import type { AgingProduct, TastingSubmission, TastingSubmissionStatus } from '@/lib/types/uaps';
import { getFlavorAxes, PRODUCT_CATEGORY_LABELS } from '@/lib/types/uaps';

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

interface ProductGroup {
  id: string;
  name: string;
  category: string | null;
  linked: boolean;
  items: TastingSubmission[];
}

function SubmissionCard({
  s,
  pending,
  busy,
  onApprove,
  onReject,
}: {
  s: TastingSubmission;
  pending: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white/85">{s.recorderName}</span>
            {s.recorderAffiliation && (
              <span className="text-[11px] text-white/35">· {s.recorderAffiliation}</span>
            )}
          </div>
          <p className="text-[11px] text-white/35 mt-0.5 flex items-center gap-x-1.5 gap-y-1 flex-wrap">
            <span className="inline-flex items-center gap-1">
              {s.productLinked ? (
                <Link2 className="w-3 h-3 shrink-0" style={{ color: `${GOLD}cc` }} aria-label="제품 연결됨" />
              ) : (
                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400/90" aria-hidden />
              )}
              <span className={s.productLinked ? 'text-white/55' : 'text-amber-300/80'}>
                {s.productName ?? productName(s.productId)}
              </span>
            </span>
            {!s.productLinked && (
              <span
                className="inline-flex items-center px-1.5 py-px rounded border border-amber-500/30 bg-amber-500/[0.07] text-amber-300/80 text-[10px] leading-relaxed"
                title="product_id가 제품 DB(aging_products)에 없습니다. 승인해도 제품·카테고리에 연결되지 않는 고아 데이터가 됩니다."
              >
                제품 미연결
              </span>
            )}
            <span>
              · 패널 {s.tastingPanelSize}명
              {s.retrievalDate && ` · ${s.retrievalDate}`}
              {s.actualDurationMonths != null && ` · ${s.actualDurationMonths}개월`}
            </span>
          </p>
        </div>
        {pending && (
          <div className="flex gap-2">
            <button onClick={onApprove} disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all disabled:opacity-50"
              style={{ borderColor: `${GOLD}40`, color: GOLD, backgroundColor: `${GOLD}0c` }}>
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              승인
            </button>
            <button onClick={onReject} disabled={busy}
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
        {getFlavorAxes(s.productCategory).map((axis, i) => {
          const a = AXES[i];
          const u = s[a.key] as number | null;
          const t = s[a.tKey] as number | null;
          return (
            <div key={a.key} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-1.5 border-b border-white/[0.03] last:border-0 items-center">
              <span className="text-[12px] text-white/50">{axis.label}</span>
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
  );
}

function TastingReview() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TastingSubmissionStatus>('pending');
  const [list, setList] = useState<TastingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  // 제품 필터 — 대시보드에서 제품을 선택한 채 넘어오면 그 제품만 보인다 (?product=)
  const [productFilter, setProductFilter] = useState<string>(searchParams.get('product') ?? 'all');

  // 제품 미연결 제출 승인용 — 카테고리·제품 선택 모달
  const [linkTarget, setLinkTarget] = useState<TastingSubmission | null>(null);
  const [products, setProducts] = useState<AgingProduct[] | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selCategory, setSelCategory] = useState('');
  const [selProductId, setSelProductId] = useState('');

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

  // 제품별 그룹 — 현재 탭 목록에서 파생 (제출 순서 유지)
  const groups = useMemo<ProductGroup[]>(() => {
    const map = new Map<string, ProductGroup>();
    for (const s of list) {
      let g = map.get(s.productId);
      if (!g) {
        g = {
          id: s.productId,
          name: s.productName ?? productName(s.productId),
          category: s.productCategory ?? null,
          linked: s.productLinked !== false,
          items: [],
        };
        map.set(s.productId, g);
      }
      g.items.push(s);
    }
    return [...map.values()];
  }, [list]);

  const visibleGroups = productFilter === 'all' ? groups : groups.filter(g => g.id === productFilter);
  const tabLabel = TABS.find(t => t.value === tab)?.label ?? '';

  async function act(id: string, action: 'approve' | 'reject', productId?: string) {
    setBusyId(id);
    try {
      const res = await fetch('/api/uaps/tasting-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, ...(productId ? { productId } : {}) }),
      });
      if (res.ok) {
        setList(prev => prev.filter(s => s.id !== id));
        setLinkTarget(null);
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

  // 미연결 제출의 승인 버튼 → 제품 선택 모달을 먼저 띄운다
  async function openLinkModal(s: TastingSubmission) {
    setLinkTarget(s);
    setSelCategory(s.productCategory ?? '');
    setSelProductId('');
    if (products === null && !productsLoading) {
      setProductsLoading(true);
      try {
        const res = await fetch('/api/uaps/products');
        const data = res.ok ? await res.json() : { products: [] };
        setProducts((data.products as AgingProduct[]) ?? []);
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    }
  }

  const categories = [...new Set((products ?? []).map(p => p.productCategory))];
  const categoryProducts = (products ?? []).filter(p => p.productCategory === selCategory);
  const categoryLabel = (c: string) =>
    PRODUCT_CATEGORY_LABELS[c as keyof typeof PRODUCT_CATEGORY_LABELS] ?? c;

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
        <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 mb-4 w-fit">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.value ? 'bg-white/[0.07] text-white/85' : 'text-white/35 hover:text-white/55'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 제품 필터 — 어느 제품의 제출인지 섞이지 않게 나눠 본다 */}
        {!loading && groups.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-6">
            <button
              onClick={() => setProductFilter('all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all"
              style={productFilter === 'all'
                ? { borderColor: `${GOLD}40`, color: GOLD, backgroundColor: `${GOLD}0c` }
                : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            >
              전체
              <span className="font-mono tabular-nums opacity-70">{list.length}</span>
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setProductFilter(g.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all max-w-[240px]"
                style={productFilter === g.id
                  ? { borderColor: `${GOLD}40`, color: GOLD, backgroundColor: `${GOLD}0c` }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
              >
                {!g.linked && <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400/90" aria-hidden />}
                <span className="truncate">{g.name}</span>
                <span className="font-mono tabular-nums opacity-70 shrink-0">{g.items.length}</span>
              </button>
            ))}
          </div>
        )}

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
        ) : visibleGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/25">
            <Inbox className="w-8 h-8 mb-3" />
            <p className="text-sm mb-4">선택한 제품의 {tabLabel} 제출이 없습니다.</p>
            <button
              onClick={() => setProductFilter('all')}
              className="px-4 py-1.5 rounded-full border border-white/15 text-white/45 text-xs hover:text-white/70 hover:border-white/25 transition-all"
            >
              전체 보기
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleGroups.map(g => (
              <section key={g.id}>
                {/* 제품 그룹 헤더 */}
                <div className="flex items-baseline gap-2.5 flex-wrap mb-3 pb-2 border-b border-white/[0.06]">
                  {g.category && (
                    <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">
                      {categoryLabel(g.category)}
                    </span>
                  )}
                  <h2 className="text-lg text-white/80 font-light leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {g.name}
                  </h2>
                  <span className="text-[11px] text-white/30 font-mono tabular-nums">{g.items.length}건</span>
                  {!g.linked && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-px rounded border border-amber-500/30 bg-amber-500/[0.07] text-amber-300/80 text-[10px]">
                      <AlertTriangle className="w-3 h-3" aria-hidden />제품 미연결
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {g.items.map(s => (
                    <SubmissionCard
                      key={s.id}
                      s={s}
                      pending={tab === 'pending'}
                      busy={busyId === s.id}
                      onApprove={() => (s.productLinked === false ? openLinkModal(s) : act(s.id, 'approve'))}
                      onReject={() => act(s.id, 'reject')}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* 제품 미연결 승인 — 카테고리·제품 선택 모달 */}
      {linkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setLinkTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#101216] p-6 shadow-2xl">
            <div className="flex items-start gap-2.5 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400/90 mt-0.5 shrink-0" />
              <h2 className="text-base text-white/90 font-medium leading-snug">
                제품이 연결되지 않은 제출입니다
              </h2>
            </div>
            <p className="text-[12px] text-white/45 leading-relaxed mb-5">
              {linkTarget.recorderName}님의 제출이 제품 DB와 연결되어 있지 않습니다.
              이대로 승인하면 어떤 제품·카테고리에도 반영되지 않습니다.
              연결할 카테고리와 제품을 선택해 주세요.
            </p>

            {productsLoading ? (
              <div className="flex items-center justify-center py-10 text-white/30">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">
                    카테고리
                  </label>
                  <select
                    value={selCategory}
                    onChange={e => { setSelCategory(e.target.value); setSelProductId(''); }}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 focus:outline-none focus:border-white/25 [&>option]:bg-[#101216]"
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{categoryLabel(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">
                    제품
                  </label>
                  <select
                    value={selProductId}
                    onChange={e => setSelProductId(e.target.value)}
                    disabled={!selCategory}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 focus:outline-none focus:border-white/25 disabled:opacity-40 [&>option]:bg-[#101216]"
                  >
                    <option value="">
                      {!selCategory
                        ? '카테고리를 먼저 선택하세요'
                        : categoryProducts.length === 0
                          ? '이 카테고리에 등록된 제품이 없습니다'
                          : '제품 선택'}
                    </option>
                    {categoryProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.productName}{p.vintage ? ` (${p.vintage})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setLinkTarget(null)}
                className="px-4 py-2 rounded-lg border border-white/15 text-white/45 text-xs hover:text-white/70 hover:border-white/25 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => act(linkTarget.id, 'approve', selProductId)}
                disabled={!selProductId || busyId === linkTarget.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs transition-all disabled:opacity-40"
                style={{ borderColor: `${GOLD}40`, color: GOLD, backgroundColor: `${GOLD}0c` }}
              >
                {busyId === linkTarget.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                연결하고 승인
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TastingReviewPage() {
  // useSearchParams는 Suspense 경계가 필요하다 (?product= 진입 필터)
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0a0b0d]" />}>
      <TastingReview />
    </Suspense>
  );
}
