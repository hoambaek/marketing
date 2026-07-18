'use client';

/**
 * 전통주 후보 온톨로지 뷰 — 해저숙성할 전통주를 픽하는 기준판
 *
 * 채널이 원하는 유형 + 우리 서사 정합 + 해저숙성 적합성을 파셋으로 교차해
 * "무엇을 숙성할지" 판단한다. 파셋이 곧 픽 기준.
 * 분석 근거: docs/plans/musedemaree/2026-07-18-traditional-liquor-product-spec.md
 */

import { useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Award, ExternalLink, FlaskConical } from 'lucide-react';

export interface LiquorCandidate {
  id: string;
  name: string;
  producer: string | null;
  type: string;
  abv: string | null;
  aging_fit: '상' | '중' | '하' | null;
  narrative_fit: '상' | '중' | '하' | null;
  heritage: string | null;
  channel_demand: string[];
  price_tier: string | null;
  premium_headroom: '상' | '중' | '하' | null;
  secured_status: '확보' | '후보' | '시장참조' | null;
  traditional_status: string | null;
  pick_grade: '상' | '중' | '하' | '참조' | null;
  pick_reason: string | null;
  evidence_urls: string[];
  notes: string | null;
}

const FACETS: { key: keyof LiquorCandidate; label: string }[] = [
  { key: 'pick_grade', label: '픽 등급' },
  { key: 'type', label: '전통주 유형' },
  { key: 'aging_fit', label: '해저숙성 적합성' },
  { key: 'narrative_fit', label: '서사 정합' },
  { key: 'secured_status', label: '확보 상태' },
  { key: 'heritage', label: '헤리티지' },
  { key: 'channel_demand', label: '채널 수요' },
  { key: 'premium_headroom', label: '프리미엄 헤드룸' },
];

const GRADE_ORDER: Record<string, number> = { 상: 0, 중: 1, 하: 2, 참조: 3 };
const GRADE_COLOR: Record<string, string> = {
  상: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  중: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  하: 'text-white/40 border-white/10 bg-white/[0.03]',
  참조: 'text-sky-300/70 border-sky-400/20 bg-sky-400/[0.06]',
};

function valuesOf(l: LiquorCandidate, key: keyof LiquorCandidate): string[] {
  const v = l[key];
  if (Array.isArray(v)) return v as string[];
  if (v == null || v === '') return [];
  return [String(v)];
}

export function LiquorView({ liquors }: { liquors: LiquorCandidate[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selected, setSelected] = useState<LiquorCandidate | null>(null);

  // 전통주 탭 필터는 'l_' 접두사로 거래처 탭과 분리
  const active = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const f of FACETS) {
      const raw = searchParams.get(`l_${f.key}`);
      if (raw) m[f.key as string] = raw.split(',').filter(Boolean);
    }
    return m;
  }, [searchParams]);

  const setFacet = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const pk = `l_${key}`;
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
    for (const f of FACETS) params.delete(`l_${f.key}`);
    router.replace(`/prospects?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const facetOptions = useMemo(() => {
    const out: Record<string, { value: string; count: number }[]> = {};
    for (const f of FACETS) {
      const counts = new Map<string, number>();
      for (const l of liquors) {
        const passOthers = FACETS.every((other) => {
          if (other.key === f.key) return true;
          const sel = active[other.key as string];
          if (!sel?.length) return true;
          return sel.some((s) => valuesOf(l, other.key).includes(s));
        });
        if (!passOthers) continue;
        for (const v of valuesOf(l, f.key)) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      out[f.key as string] = [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) =>
          f.key === 'pick_grade' || f.key === 'aging_fit' || f.key === 'narrative_fit' || f.key === 'premium_headroom'
            ? (GRADE_ORDER[a.value] ?? 9) - (GRADE_ORDER[b.value] ?? 9)
            : b.count - a.count,
        );
    }
    return out;
  }, [liquors, active]);

  const filtered = useMemo(() => {
    return liquors
      .filter((l) => {
        for (const f of FACETS) {
          const sel = active[f.key as string];
          if (!sel?.length) continue;
          if (!sel.some((s) => valuesOf(l, f.key).includes(s))) return false;
        }
        return true;
      })
      .sort((a, b) => (GRADE_ORDER[a.pick_grade ?? '참조'] - GRADE_ORDER[b.pick_grade ?? '참조']) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  }, [liquors, active]);

  const activeCount = Object.values(active).reduce((s, arr) => s + arr.length, 0);
  const pickTop = liquors.filter((l) => l.pick_grade === '상').length;

  return (
    <div>
      <p className="mb-4 text-sm text-white/50">
        해저숙성 후보 <span className="text-[#b7916e]">{liquors.length}</span>종 · 픽 상{' '}
        <span className="text-emerald-300/80">{pickTop}</span>종 · 필터 <span className="text-white/70">{filtered.length}</span>종
        <span className="hidden sm:inline text-white/30"> — 파셋이 곧 픽 기준</span>
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
          <LiquorFacetPanel options={facetOptions} active={active} onToggle={setFacet} />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 text-xs border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">픽</th>
                  <th className="px-4 py-3 font-medium">전통주</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">유형·도수</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">숙성/서사</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">확보</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} onClick={() => setSelected(l)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded-md border text-xs font-semibold ${GRADE_COLOR[l.pick_grade ?? '참조']}`}>
                        {l.pick_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/90 font-medium">{l.name}</div>
                      <div className="text-white/40 text-xs mt-0.5">{l.producer}{l.heritage && ` · ${l.heritage}`}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-white/60">
                      <span className="px-1.5 py-0.5 rounded bg-[#b7916e]/10 text-[#d4a574] text-[11px]">{l.type}</span>
                      {l.abv && <span className="ml-1.5 text-white/50 text-xs">{l.abv}</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-white/50 text-xs">
                      숙성 {l.aging_fit ?? '—'} · 서사 {l.narrative_fit ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs ${l.secured_status === '확보' ? 'text-emerald-300/80' : l.secured_status === '후보' ? 'text-amber-300/70' : 'text-white/40'}`}>
                        {l.secured_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-white/40 text-sm">조건에 맞는 전통주가 없습니다.</td></tr>
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
              <LiquorFacetPanel options={facetOptions} active={active} onToggle={setFacet} />
              <button onClick={() => setMobileFilterOpen(false)}
                className="fixed bottom-4 left-5 right-5 py-3.5 rounded-xl bg-[#b7916e] text-[#0a0f1a] font-semibold text-sm">
                결과 {filtered.length}종 보기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && <LiquorDrawer liquor={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function LiquorFacetPanel({
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

function LiquorDrawer({ liquor: l, onClose }: { liquor: LiquorCandidate; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
      <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-md overflow-y-auto bg-[#0a0f1a] border-l border-white/[0.08] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl text-white/95">{l.name}</h2>
            <p className="text-white/40 text-sm mt-1">{l.producer}{l.type && ` · ${l.type}`}{l.abv && ` · ${l.abv}`}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/50" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold ${GRADE_COLOR[l.pick_grade ?? '참조']}`}>
            <Award className="w-3 h-3" /> 픽 {l.pick_grade}
          </span>
          {l.secured_status && <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-white/60 text-xs">{l.secured_status}</span>}
          {l.traditional_status && <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-white/60 text-xs">{l.traditional_status}</span>}
        </div>

        {l.pick_reason && (
          <div className="mb-5">
            <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">픽 근거</h3>
            <p className="text-white/80 text-sm leading-relaxed">{l.pick_reason}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-5">
          <Metric label="해저숙성 적합" grade={l.aging_fit} />
          <Metric label="서사 정합" grade={l.narrative_fit} />
          <Metric label="프리미엄 헤드룸" grade={l.premium_headroom} />
        </div>

        {l.heritage && <TextField label="헤리티지" value={l.heritage} />}
        {l.price_tier && <TextField label="현재 가격대" value={l.price_tier} />}
        {l.channel_demand?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">이 유형을 원하는 채널</h3>
            <div className="flex flex-wrap gap-1.5">
              {l.channel_demand.map((v) => (
                <span key={v} className="px-2 py-0.5 rounded bg-[#b7916e]/15 text-[#d4a574] text-xs">{v}</span>
              ))}
            </div>
          </div>
        )}
        {l.notes && <TextField label="메모" value={l.notes} />}

        {l.evidence_urls?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">근거 출처</h3>
            {l.evidence_urls.map((u) => (
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

function Metric({ label, grade }: { label: string; grade: string | null }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${GRADE_COLOR[grade ?? '참조'] ?? 'border-white/10'}`}>
      <div className="flex items-center justify-center gap-1 text-lg font-semibold">
        <FlaskConical className="w-3.5 h-3.5 opacity-60" />{grade ?? '—'}
      </div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
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
