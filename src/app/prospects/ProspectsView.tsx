'use client';

/**
 * B2B 영업지도 뷰 — 파셋 필터 + 정렬 테이블 + 상세 드로어
 *
 * 온톨로지 §3 뷰1(파셋 테이블)+뷰4(상세)의 MVP. 필터는 파셋 내 OR, 파셋 간 AND.
 * 필터 상태는 URL(searchParams)에 인코딩 → 북마크·공유 가능(SaaS 필터 UX 정석).
 * 43곳 규모라 필터·정렬은 전부 클라이언트에서.
 */

import { useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Star, ExternalLink, MapPin, Crown } from 'lucide-react';

export interface Prospect {
  id: string;
  name: string;
  segment: string;
  sub_type: string | null;
  region: string | null;
  fit: '상' | '중' | '하';
  fit_reason: string | null;
  wine_program: string[];
  pairing: string | null;
  price_band: string | null;
  decision_maker_type: string | null;
  seasonality: string[];
  product_fit: string[];
  entry_asset: string | null;
  key_person: string | null;
  evidence_urls: string[];
  profile_md: string | null;
  source_file: string | null;
  stage: string;
  is_founder_direct: boolean;
}

// 파셋 정의 — 통제 어휘(값 사전). 순서 = 화면 표시 순서
const FACETS: { key: keyof Prospect; label: string; multi: boolean }[] = [
  { key: 'segment', label: '세그먼트', multi: true },
  { key: 'fit', label: 'Fit', multi: true },
  { key: 'product_fit', label: '제품 라인', multi: true },
  { key: 'wine_program', label: '와인 취향', multi: true },
  { key: 'decision_maker_type', label: '의사결정자', multi: true },
  { key: 'entry_asset', label: '접점 자산', multi: true },
  { key: 'region', label: '지역', multi: true },
  { key: 'stage', label: '단계', multi: true },
];

const FIT_ORDER: Record<string, number> = { 상: 0, 중: 1, 하: 2 };
const FIT_COLOR: Record<string, string> = {
  상: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  중: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  하: 'text-white/40 border-white/10 bg-white/[0.03]',
};

function valuesOf(p: Prospect, key: keyof Prospect): string[] {
  const v = p[key];
  if (Array.isArray(v)) return v as string[];
  if (v == null || v === '') return [];
  return [String(v)];
}

export function ProspectsView({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Prospect | null>(null);

  // URL → 선택된 필터 파싱 (facetKey=v1,v2)
  const active = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const f of FACETS) {
      const raw = searchParams.get(f.key);
      if (raw) m[f.key] = raw.split(',').filter(Boolean);
    }
    return m;
  }, [searchParams]);

  const q = searchParams.get('q')?.toLowerCase() ?? '';

  // 필터 상태를 URL에 반영
  const setFacet = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const cur = params.get(key)?.split(',').filter(Boolean) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (next.length) params.set(key, next.join(','));
      else params.delete(key);
      router.replace(`/prospects?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => router.replace('/prospects', { scroll: false }), [router]);

  const setSearch = useCallback(
    (text: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (text) params.set('q', text);
      else params.delete('q');
      router.replace(`/prospects?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // 파셋별 값+건수 (현재 다른 필터 적용 후의 건수 = 지능적 파셋)
  const facetOptions = useMemo(() => {
    const out: Record<string, { value: string; count: number }[]> = {};
    for (const f of FACETS) {
      const counts = new Map<string, number>();
      for (const p of prospects) {
        // 이 파셋을 제외한 나머지 필터를 적용한 뒤 건수 집계
        const passOthers = FACETS.every((other) => {
          if (other.key === f.key) return true;
          const sel = active[other.key as string];
          if (!sel?.length) return true;
          const pv = valuesOf(p, other.key);
          return sel.some((s) => pv.includes(s));
        });
        if (!passOthers) continue;
        for (const v of valuesOf(p, f.key)) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      out[f.key as string] = [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) =>
          f.key === 'fit' ? (FIT_ORDER[a.value] ?? 9) - (FIT_ORDER[b.value] ?? 9) : b.count - a.count,
        );
    }
    return out;
  }, [prospects, active]);

  // 필터 + 검색 적용 결과
  const filtered = useMemo(() => {
    return prospects
      .filter((p) => {
        for (const f of FACETS) {
          const sel = active[f.key as string];
          if (!sel?.length) continue;
          const pv = valuesOf(p, f.key);
          if (!sel.some((s) => pv.includes(s))) return false;
        }
        if (q) {
          const hay = `${p.name} ${p.sub_type ?? ''} ${p.fit_reason ?? ''} ${p.key_person ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (FIT_ORDER[a.fit] - FIT_ORDER[b.fit]) || a.segment.localeCompare(b.segment) || a.name.localeCompare(b.name));
  }, [prospects, active, q]);

  const activeCount = Object.values(active).reduce((s, arr) => s + arr.length, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-white/50">
        B2B 신규 거래처 후보 <span className="text-[#b7916e]">{prospects.length}</span>곳 · 필터{' '}
        <span className="text-white/70">{filtered.length}</span>곳
      </p>

      {/* 검색 + 모바일 필터 토글 */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          defaultValue={q}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름·근거·키맨 검색"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#b7916e]/40"
        />
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#b7916e]/10 border border-[#b7916e]/20 text-[#d4a574] text-sm"
        >
          <Filter className="w-4 h-4" /> 필터{activeCount > 0 && ` ·${activeCount}`}
        </button>
      </div>

      {/* 활성 필터 칩 */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FACETS.flatMap((f) =>
            (active[f.key as string] ?? []).map((v) => (
              <button
                key={`${f.key}-${v}`}
                onClick={() => setFacet(f.key as string, v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#b7916e]/15 border border-[#b7916e]/25 text-[#d4a574] text-xs"
              >
                {v} <X className="w-3 h-3" />
              </button>
            )),
          )}
          <button onClick={clearAll} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2">
            전체 해제
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* 데스크톱 파셋 패널 */}
        <aside className="hidden lg:block w-60 shrink-0">
          <FacetPanel options={facetOptions} active={active} onToggle={setFacet} />
        </aside>

        {/* 테이블 */}
        <div className="flex-1 min-w-0">
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 text-xs border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Fit</th>
                  <th className="px-4 py-3 font-medium">거래처</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">세그먼트</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">제품·취향</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">의사결정자</th>
                  <th className="px-4 py-3 font-medium">단계</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md border text-xs font-semibold ${FIT_COLOR[p.fit]}`}>
                        {p.fit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/90 font-medium">{p.name}</span>
                        {p.is_founder_direct && <Crown className="w-3.5 h-3.5 text-[#b7916e]" aria-label="대표 직접" />}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                        {p.region && <><MapPin className="w-3 h-3" />{p.region}</>}
                        {p.sub_type && <span>· {p.sub_type}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-white/60">{p.segment}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.product_fit.map((v) => (
                          <span key={v} className="px-1.5 py-0.5 rounded bg-[#b7916e]/10 text-[#d4a574] text-[11px]">{v}</span>
                        ))}
                        {p.wine_program.slice(0, 2).map((v) => (
                          <span key={v} className="px-1.5 py-0.5 rounded bg-white/[0.05] text-white/50 text-[11px]">{v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-white/50 text-xs">{p.decision_maker_type ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-white/60 text-xs">{p.stage}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-white/40 text-sm">
                      조건에 맞는 거래처가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 모바일 파셋 바텀시트 */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[#0a0f1a] border-t border-white/[0.08] p-5 pb-24"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white/90 font-medium">필터</h2>
                <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5 text-white/50" /></button>
              </div>
              <FacetPanel options={facetOptions} active={active} onToggle={setFacet} />
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="fixed bottom-4 left-5 right-5 py-3.5 rounded-xl bg-[#b7916e] text-[#0a0f1a] font-semibold text-sm"
              >
                결과 {filtered.length}곳 보기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 상세 드로어 */}
      <AnimatePresence>
        {selected && <DetailDrawer prospect={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function FacetPanel({
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
                  <button
                    key={o.value}
                    onClick={() => onToggle(f.key as string, o.value)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      on ? 'bg-[#b7916e]/15 text-[#d4a574]' : 'text-white/60 hover:bg-white/[0.04]'
                    }`}
                  >
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

function DetailDrawer({ prospect: p, onClose }: { prospect: Prospect; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50"
      />
      <motion.aside
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-md overflow-y-auto bg-[#0a0f1a] border-l border-white/[0.08] p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-white/95">{p.name}</h2>
              {p.is_founder_direct && <Crown className="w-4 h-4 text-[#b7916e]" />}
            </div>
            <p className="text-white/40 text-sm mt-1">
              {p.region && `${p.region} · `}{p.segment}{p.sub_type && ` · ${p.sub_type}`}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/50" /></button>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold ${FIT_COLOR[p.fit]}`}>
            <Star className="w-3 h-3" /> Fit {p.fit}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-white/60 text-xs">{p.stage}</span>
          {p.price_band && p.price_band !== '미확인' && (
            <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-white/60 text-xs">{p.price_band}</span>
          )}
        </div>

        {p.fit_reason && (
          <div className="mb-5">
            <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">Fit 근거</h3>
            <p className="text-white/80 text-sm leading-relaxed">{p.fit_reason}</p>
          </div>
        )}

        <Field label="제품 라인" values={p.product_fit} accent />
        <Field label="와인 취향" values={p.wine_program} />
        {p.pairing && <TextField label="페어링" value={p.pairing} />}
        {p.decision_maker_type && <TextField label="의사결정자" value={p.decision_maker_type} />}
        {p.key_person && <TextField label="키맨(공개정보)" value={p.key_person} />}
        {p.entry_asset && <TextField label="접점 자산" value={p.entry_asset} />}
        <Field label="시즌" values={p.seasonality} />

        {p.evidence_urls?.length > 0 && (
          <div className="mb-5">
            <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">근거 출처</h3>
            <div className="space-y-1">
              {p.evidence_urls.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 text-[#b7916e] text-xs hover:text-[#d4a574] break-all">
                  <ExternalLink className="w-3 h-3 shrink-0" /> {u}
                </a>
              ))}
            </div>
          </div>
        )}

        {p.source_file && (
          <p className="text-white/25 text-xs mt-6 pt-4 border-t border-white/[0.06]">
            출처 발굴: {p.source_file}
          </p>
        )}
      </motion.aside>
    </>
  );
}

function Field({ label, values, accent }: { label: string; values: string[]; accent?: boolean }) {
  if (!values?.length) return null;
  return (
    <div className="mb-4">
      <h3 className="text-white/40 text-xs uppercase tracking-wide mb-1.5">{label}</h3>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className={`px-2 py-0.5 rounded text-xs ${accent ? 'bg-[#b7916e]/15 text-[#d4a574]' : 'bg-white/[0.05] text-white/60'}`}>
            {v}
          </span>
        ))}
      </div>
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
