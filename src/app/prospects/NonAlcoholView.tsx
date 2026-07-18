'use client';

/**
 * 무알콜 라인업 온톨로지 뷰 — 소싱할 무알콜을 픽하는 기준판
 *
 * 국내 생산 우선 / 미수입 해외 2순위 / 이미 수입 제외(단가 안 나옴).
 * 해저숙성 적용 가능성(무탄산 still·전통 발효액만 실험 후보)을 파셋으로 교차.
 * 분석 근거: sales/sales-research/markets/mdm-b2b-map/nonalcoholic-lineup.md
 */

import { useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Award, ExternalLink, Globe } from 'lucide-react';

export interface NonAlcoholCandidate {
  id: string;
  name: string;
  category: string | null;
  origin: string | null;
  sourcing_tier: string | null;
  domestic_available: boolean | null;
  aging_applicable: string | null;
  pick_grade: '상' | '중' | '하' | '참조' | null;
  pick_reason: string | null;
  evidence_urls: string[];
  notes: string | null;
}

const FACETS: { key: keyof NonAlcoholCandidate; label: string }[] = [
  { key: 'sourcing_tier', label: '조달' },
  { key: 'pick_grade', label: '픽 등급' },
  { key: 'category', label: '스타일' },
  { key: 'aging_applicable', label: '해저숙성' },
  { key: 'origin', label: '원산지' },
];

const GRADE_ORDER: Record<string, number> = { 상: 0, 중: 1, 하: 2, 참조: 3 };
const GRADE_COLOR: Record<string, string> = {
  상: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  중: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  하: 'text-white/40 border-white/10 bg-white/[0.03]',
  참조: 'text-sky-300/70 border-sky-400/20 bg-sky-400/[0.06]',
};

function valuesOf(n: NonAlcoholCandidate, key: keyof NonAlcoholCandidate): string[] {
  const v = n[key];
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'boolean') return [];
  if (v == null || v === '') return [];
  return [String(v)];
}

export function NonAlcoholView({ items }: { items: NonAlcoholCandidate[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selected, setSelected] = useState<NonAlcoholCandidate | null>(null);

  const active = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const f of FACETS) {
      const raw = searchParams.get(`n_${f.key}`);
      if (raw) m[f.key as string] = raw.split(',').filter(Boolean);
    }
    return m;
  }, [searchParams]);

  const setFacet = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const pk = `n_${key}`;
      const cur = params.get(pk)?.split(',').filter(Boolean) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (next.length) params.set(pk, next.join(','));
      else params.delete(pk);
      router.replace(`/prospects?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const f of FACETS) params.delete(`n_${f.key}`);
    router.replace(`/prospects?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const facetOptions = useMemo(() => {
    const out: Record<string, { value: string; count: number }[]> = {};
    for (const f of FACETS) {
      const counts = new Map<string, number>();
      for (const n of items) {
        const passOthers = FACETS.every((other) => {
          if (other.key === f.key) return true;
          const sel = active[other.key as string];
          if (!sel?.length) return true;
          return sel.some((s) => valuesOf(n, other.key).includes(s));
        });
        if (!passOthers) continue;
        for (const v of valuesOf(n, f.key)) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      out[f.key as string] = [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) =>
          f.key === 'pick_grade'
            ? (GRADE_ORDER[a.value] ?? 9) - (GRADE_ORDER[b.value] ?? 9)
            : b.count - a.count,
        );
    }
    return out;
  }, [items, active]);

  const filtered = useMemo(() => {
    return items
      .filter((n) => {
        for (const f of FACETS) {
          const sel = active[f.key as string];
          if (!sel?.length) continue;
          if (!sel.some((s) => valuesOf(n, f.key).includes(s))) return false;
        }
        return true;
      })
      .sort((a, b) => (GRADE_ORDER[a.pick_grade ?? '참조'] - GRADE_ORDER[b.pick_grade ?? '참조']) || (a.sourcing_tier ?? '').localeCompare(b.sourcing_tier ?? '') || a.name.localeCompare(b.name));
  }, [items, active]);

  const activeCount = Object.values(active).reduce((s, arr) => s + arr.length, 0);
  const pickTop = items.filter((n) => n.pick_grade === '상').length;

  return (
    <div>
      <p className="mb-4 text-sm text-white/50">
        무알콜 후보 <span className="text-[#b7916e]">{items.length}</span>종 · 픽 상{' '}
        <span className="text-emerald-300/80">{pickTop}</span>종 · 필터 <span className="text-white/70">{filtered.length}</span>종
        <span className="hidden sm:inline text-white/30"> — 국내 생산 우선 · 무탄산만 해저숙성 후보</span>
      </p>

      <div className="flex items-center gap-2 mb-4 lg:hidden">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#b7916e]/10 border border-[#b7916e]/20 text-[#d4a574] text-sm"
        >
          <Filter className="w-4 h-4" /> 픽 기준 필터{activeCount > 0 && ` ·${activeCount}`}
        </button>
        {activeCount > 0 && <button onClick={clearAll} className="text-xs text-white/40 underline">전체 해제</button>}
      </div>

      {activeCount > 0 && (
        <div className="hidden lg:flex flex-wrap items-center gap-2 mb-4">
          {FACETS.flatMap((f) =>
            (active[f.key as string] ?? []).map((v) => (
              <button key={`${f.key}-${v}`} onClick={() => setFacet(f.key as string, v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#b7916e]/15 border border-[#b7916e]/25 text-[#d4a574] text-xs">
                {v} <X className="w-3 h-3" />
              </button>
            )),
          )}
          <button onClick={clearAll} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2">전체 해제</button>
        </div>
      )}

      <div className="flex gap-6">
        <aside className="hidden lg:block w-60 shrink-0">
          <NonAlcoholFacetPanel options={facetOptions} active={active} onToggle={setFacet} />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 text-xs border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">픽</th>
                  <th className="px-4 py-3 font-medium">무알콜</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">스타일·원산지</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">조달</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">해저숙성</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.id} onClick={() => setSelected(n)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded-md border text-xs font-semibold ${GRADE_COLOR[n.pick_grade ?? '참조']}`}>
                        {n.pick_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/90 font-medium">{n.name}</div>
                      {n.pick_reason && <div className="text-white/40 text-xs mt-0.5 line-clamp-1">{n.pick_reason}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-white/60">
                      {n.category && <span className="px-1.5 py-0.5 rounded bg-[#b7916e]/10 text-[#d4a574] text-[11px]">{n.category}</span>}
                      {n.origin && <span className="ml-1.5 text-white/50 text-xs">{n.origin}</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-white/50 text-xs">{n.sourcing_tier ?? '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-white/50 text-xs">{n.aging_applicable ?? '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-white/40 text-sm">조건에 맞는 무알콜이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[#0a0f1a] border-t border-white/[0.08] p-5 pb-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white/90 font-medium">픽 기준 필터</h2>
                <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5 text-white/50" /></button>
              </div>
              <NonAlcoholFacetPanel options={facetOptions} active={active} onToggle={setFacet} />
              <button onClick={() => setMobileFilterOpen(false)}
                className="fixed bottom-4 left-5 right-5 py-3.5 rounded-xl bg-[#b7916e] text-[#0a0f1a] font-semibold text-sm">
                결과 {filtered.length}종 보기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && <NonAlcoholDrawer item={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function NonAlcoholFacetPanel({
  options, active, onToggle,
}: {
  options: Record<string, { value: string; count: number }[]>;
  active: Record<string, string[]>;
  onToggle: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {FACETS.map((f) => {
        const opts = options[f.key as string] ?? [];
        if (!opts.length) return null;
        return (
          <details key={f.key as string} open className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none text-white/70 text-xs font-medium uppercase tracking-wide mb-2">
              {f.label}
              <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="space-y-1">
              {opts.map((o) => {
                const on = (active[f.key as string] ?? []).includes(o.value);
                return (
                  <button key={o.value} onClick={() => onToggle(f.key as string, o.value)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      on ? 'bg-[#b7916e]/15 text-[#d4a574]' : 'text-white/60 hover:bg-white/[0.04]'
                    }`}>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${on ? 'bg-[#b7916e] border-[#b7916e]' : 'border-white/20'}`}>
                        {on && <span className="w-1.5 h-1.5 bg-[#0a0f1a] rounded-sm" />}
                      </span>
                      {o.value}
                    </span>
                    <span className="text-white/30 tabular-nums">{o.count}</span>
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function NonAlcoholDrawer({ item: n, onClose }: { item: NonAlcoholCandidate; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-md overflow-y-auto bg-[#0a0f1a] border-l border-white/[0.08] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl text-white/95">{n.name}</h2>
            <p className="text-white/40 text-sm mt-1">{n.category}{n.origin && ` · ${n.origin}`}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/50" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold ${GRADE_COLOR[n.pick_grade ?? '참조']}`}>
            <Award className="w-3 h-3" /> 픽 {n.pick_grade}
          </span>
          {n.sourcing_tier && <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-white/60 text-xs">{n.sourcing_tier}</span>}
          {n.domestic_available && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.05] text-white/60 text-xs"><Globe className="w-3 h-3" /> 국내 조달</span>}
        </div>

        {n.pick_reason && (
          <div className="mb-5">
            <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">픽 근거</h3>
            <p className="text-white/80 text-sm leading-relaxed">{n.pick_reason}</p>
          </div>
        )}

        {n.aging_applicable && <TextField label="해저숙성 적용" value={n.aging_applicable} />}
        {n.notes && <TextField label="메모" value={n.notes} />}

        {n.evidence_urls?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">근거 출처</h3>
            {n.evidence_urls.map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#b7916e] text-xs hover:text-[#d4a574] break-all">
                <ExternalLink className="w-3 h-3 shrink-0" /> {u}
              </a>
            ))}
          </div>
        )}
      </motion.aside>
    </>
  );
}

function TextField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1">{label}</h3>
      <p className="text-white/80 text-sm">{value}</p>
    </div>
  );
}
