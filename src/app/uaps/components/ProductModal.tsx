'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Anchor, X, Loader2, Sparkles } from 'lucide-react';
import {
  ProductInput,
  ProductStatus,
  AgingProduct,
  WineType,
  ClosureType,
  ReductionCheckItem,
  ReductionPotential,
  CATEGORY_FIELD_CONFIG,
  CATEGORY_SUBTYPES,
  CATEGORY_REDUCTION_CHECKLIST,
  CATEGORY_DEFAULT_CLOSURE,
  CLOSURE_TYPE_LABELS,
  REDUCTION_POTENTIAL_LABELS,
  HIDDEN_UAPS_CATEGORIES,
} from '@/lib/types/uaps';

// 모달 내 카테고리 선택기 옵션 (lockedCategory가 없을 때만 노출)
const MODAL_CATEGORIES = [
  { value: 'champagne',   label: '🥂 샴페인' },
  { value: 'red_wine',    label: '🍷 레드와인' },
  { value: 'white_wine',  label: '🍾 화이트와인' },
  { value: 'whisky',      label: '🥃 위스키' },
  { value: 'sake',        label: '🍶 사케' },
  { value: 'green_coffee_bean', label: '🫘 생두' },
  { value: 'puer',        label: '🫖 생차/보이차' },
  { value: 'soy_sauce',   label: '🫙 간장' },
  { value: 'vinegar',     label: '🍶 식초' },
  { value: 'yakju_cheongju', label: '🍚 전통주(약주·청주)' },
  { value: 'spirits',     label: '🍶 증류주(소주)' },
];

// UAPS 제품 등록/수정 모달 (샴페인·전 카테고리 공유).
// - 샴페인 페이지: lockedCategory 없이 호출 → 카테고리 선택기 노출, cyan 테마.
// - 카테고리 페이지: lockedCategory + accent 전달 → 카테고리 고정, 테마색 적용.
// AI 정보 찾기 버튼은 양쪽 공통 (통합으로 카테고리 페이지도 이 기능을 얻는다).
export function ProductModal({
  onClose,
  onSubmit,
  initialData,
  initialCategory = 'champagne',
  lockedCategory,
  accent = '#22d3ee',
  accentRgb = '34, 211, 238',
}: {
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
  initialData?: AgingProduct | null;
  initialCategory?: string;
  lockedCategory?: string;
  accent?: string;
  accentRgb?: string;
}) {
  const isEdit = !!initialData;
  const [productCategory, setProductCategory] = useState(
    initialData?.productCategory ?? lockedCategory ?? initialCategory
  );
  const [productName, setProductName] = useState(initialData?.productName ?? '');

  // 카테고리별 동적 설정
  const fieldConfig = CATEGORY_FIELD_CONFIG[productCategory] ?? CATEGORY_FIELD_CONFIG['champagne'];
  const subtypeOptions = CATEGORY_SUBTYPES[productCategory] ?? CATEGORY_SUBTYPES['champagne'];
  const reductionChecklist: ReductionCheckItem[] = CATEGORY_REDUCTION_CHECKLIST[productCategory] ?? CATEGORY_REDUCTION_CHECKLIST['champagne'];

  const [subtype, setSubtype] = useState<string>(
    initialData?.wineType ?? subtypeOptions[0]?.value ?? ''
  );
  const [vintage, setVintage] = useState<string>(initialData?.vintage?.toString() ?? '');
  const [ph, setPh] = useState<string>(initialData?.ph?.toString() ?? '');
  const [dosage, setDosage] = useState<string>(initialData?.dosage?.toString() ?? '');
  const [alcohol, setAlcohol] = useState<string>(initialData?.alcohol?.toString() ?? '');
  const [closureType, setClosureType] = useState<string>(
    initialData?.closureType ?? CATEGORY_DEFAULT_CLOSURE[productCategory] ?? 'cork_natural'
  );

  // 카테고리 변경 시 서브타입 + 체크리스트 초기화 (선택기 노출 시에만 사용)
  const handleCategoryChange = (newCategory: string) => {
    setProductCategory(newCategory);
    const newSubtypes = CATEGORY_SUBTYPES[newCategory];
    if (newSubtypes?.[0]) setSubtype(newSubtypes[0].value);
    const newChecklist = CATEGORY_REDUCTION_CHECKLIST[newCategory] ?? [];
    const freshChecks: Record<string, boolean> = {};
    newChecklist.forEach((item) => { freshChecks[item.id] = false; });
    setReductionChecks(freshChecks);
    if (!CATEGORY_FIELD_CONFIG[newCategory]?.showDosage) setDosage('');
    if (!CATEGORY_FIELD_CONFIG[newCategory]?.showVintage) setVintage('');
    setClosureType(CATEGORY_DEFAULT_CLOSURE[newCategory] ?? 'cork_natural');
  };

  // 환원 성향 체크리스트 → 자동 산출
  const [reductionChecks, setReductionChecks] = useState<Record<string, boolean>>(() => {
    if (initialData?.reductionChecks) return { ...initialData.reductionChecks };
    const initial: Record<string, boolean> = {};
    reductionChecklist.forEach((item) => { initial[item.id] = false; });
    return initial;
  });

  const reductionScore = reductionChecklist.reduce(
    (sum, item) => sum + (reductionChecks[item.id] ? item.weight : 0), 0
  );
  const reductionPotential: ReductionPotential = reductionScore >= 3 ? 'high' : reductionScore >= 1 ? 'medium' : 'low';

  const toggleReductionCheck = (id: string) => {
    const item = reductionChecklist.find((c) => c.id === id);
    setReductionChecks((prev) => {
      const next = { ...prev };
      if (item?.group) {
        reductionChecklist.forEach((c) => {
          if (c.group === item.group && c.id !== id) next[c.id] = false;
        });
      }
      next[id] = !prev[id];
      return next;
    });
  };

  // 그룹별 분리 (라디오 그룹 vs 복수 선택)
  const groupedItems = reductionChecklist.filter((item) => item.group !== null);
  const ungroupedItems = reductionChecklist.filter((item) => item.group === null);
  const uniqueGroups = [...new Set(groupedItems.map((item) => item.group))];

  const [terrestrialAgingYears, setTerrestrialAgingYears] = useState<string>(
    initialData?.terrestrialAgingYears?.toString() ?? ''
  );
  const [immersionDate, setImmersionDate] = useState(initialData?.immersionDate ?? '');
  const [plannedDurationMonths, setPlannedDurationMonths] = useState<string>(initialData?.plannedDurationMonths?.toString() ?? '');
  const [agingDepth, setAgingDepth] = useState<string>(initialData?.agingDepth?.toString() ?? '30');
  const [status, setStatus] = useState<ProductStatus>(initialData?.status ?? 'planned');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAISearching, setIsAISearching] = useState(false);

  const handleAISearch = async () => {
    if (!productName.trim()) return;
    setIsAISearching(true);
    try {
      const res = await fetch('/api/uaps/product-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim(), productCategory }),
      });
      if (!res.ok) throw new Error('AI 조회 실패');
      const info = await res.json();

      // 필드 자동 채우기 (기존 값이 비어있을 때만)
      if (info.subtype) {
        const match = subtypeOptions.find(
          (opt: { value: string; label: string }) =>
            opt.value.toLowerCase() === info.subtype.toLowerCase() ||
            opt.label.toLowerCase().includes(info.subtype.toLowerCase())
        );
        if (match) setSubtype(match.value);
      }
      if (info.vintage && !vintage) setVintage(String(info.vintage));
      if (info.ph && !ph) setPh(String(info.ph));
      if (info.dosage && !dosage) setDosage(String(info.dosage));
      if (info.alcohol && !alcohol) setAlcohol(String(info.alcohol));
      if (info.closureType) {
        const validClosures = Object.keys(CLOSURE_TYPE_LABELS);
        if (validClosures.includes(info.closureType)) setClosureType(info.closureType);
      }
      if (info.terrestrialAgingYears && !terrestrialAgingYears) {
        setTerrestrialAgingYears(String(info.terrestrialAgingYears));
      }
      if (info.notes && !notes) setNotes(info.notes);

      // 환원 성향 체크리스트: AI가 직접 체크한 항목 반영
      if (info.reductionChecks && typeof info.reductionChecks === 'object') {
        const newChecks: Record<string, boolean> = {};
        reductionChecklist.forEach((item) => { newChecks[item.id] = false; });

        // AI 응답의 체크 항목 반영
        for (const [id, val] of Object.entries(info.reductionChecks)) {
          if (val === true && reductionChecklist.some(item => item.id === id)) {
            // 그룹 체크: 같은 그룹 내 다른 항목은 false
            const checkItem = reductionChecklist.find(item => item.id === id);
            if (checkItem?.group) {
              reductionChecklist.forEach(item => {
                if (item.group === checkItem.group) newChecks[item.id] = false;
              });
            }
            newChecks[id] = true;
          }
        }

        setReductionChecks(newChecks);
      }
    } catch {
      // 실패 시 무시
    } finally {
      setIsAISearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    setIsSubmitting(true);
    // champagne만 WineType으로, 나머지는 null
    const isWineCategory = productCategory === 'champagne';
    await onSubmit({
      productName: productName.trim(),
      productCategory,
      wineType: isWineCategory ? (subtype as WineType) : null,
      vintage: vintage ? Number(vintage) : null,
      producer: '',
      ph: ph ? Number(ph) : null,
      dosage: dosage ? Number(dosage) : null,
      alcohol: alcohol ? Number(alcohol) : null,
      acidity: null,
      reductionPotential,
      reductionChecks: { ...reductionChecks, _subtype: subtype as unknown as boolean },
      closureType: closureType as ClosureType,
      immersionDate: immersionDate || null,
      plannedDurationMonths: plannedDurationMonths ? Number(plannedDurationMonths) : null,
      agingDepth: agingDepth ? Number(agingDepth) : 30,
      terrestrialAgingYears: terrestrialAgingYears ? Number(terrestrialAgingYears) : null,
      status,
      notes: notes.trim() || null,
    });
    setIsSubmitting(false);
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors';
  const labelClass = 'block text-xs text-white/50 mb-1.5';
  const accentStyle = { borderColor: `rgba(${accentRgb}, 0.3)`, backgroundColor: `rgba(${accentRgb}, 0.05)` };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0d1421] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center gap-3 p-5 border-b border-white/[0.06]">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `rgba(${accentRgb}, 0.1)` }}>
            <Anchor className="w-5 h-5" style={{ color: accent }} />
          </div>
          <h2 className="text-lg font-medium text-white flex-1">
            {isEdit ? '숙성 제품 수정' : '새 숙성 제품 등록'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 카테고리 선택 (lockedCategory가 없을 때만) */}
          {!lockedCategory && (
            <div>
              <label className={labelClass}>카테고리</label>
              <select
                value={productCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={inputClass}
              >
                {MODAL_CATEGORIES.filter((cat) => !HIDDEN_UAPS_CATEGORIES.has(cat.value)).map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 제품명 + AI 정보 찾기 */}
          <div>
            <label className={labelClass}>제품명 *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="제품명을 입력하세요"
                className={inputClass + ' flex-1'}
                required
              />
              <button
                type="button"
                onClick={handleAISearch}
                disabled={!productName.trim() || isAISearching}
                className="shrink-0 px-3 py-2.5 bg-[#C4A052]/10 hover:bg-[#C4A052]/20 border border-[#C4A052]/20 text-[#C4A052] text-xs rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isAISearching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {isAISearching ? 'AI 검색 중...' : 'AI 정보 찾기'}
              </button>
            </div>
          </div>

          {/* 서브타입 + 빈티지 (동적) */}
          <div className={`grid gap-3 ${fieldConfig.showVintage ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className={labelClass}>{fieldConfig.subtypeLabel}</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className={inputClass}>
                {subtypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {fieldConfig.showVintage && (
              <div>
                <label className={labelClass}>{fieldConfig.vintageLabel}</label>
                <input type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} placeholder="2024" className={inputClass} />
              </div>
            )}
          </div>

          {/* pH / Dosage / Alcohol (동적) */}
          <div className={`grid grid-cols-1 gap-3 ${fieldConfig.showDosage && fieldConfig.showAlcohol ? 'sm:grid-cols-3' : fieldConfig.showDosage || fieldConfig.showAlcohol ? 'sm:grid-cols-2' : ''}`}>
            <div>
              <label className={labelClass}>pH <span className="text-white/20">(선택)</span></label>
              <input type="number" step="0.01" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="3.10" className={inputClass} />
            </div>
            {fieldConfig.showDosage && (
              <div>
                <label className={labelClass}>Dosage g/L <span className="text-white/20">(선택)</span></label>
                <input type="number" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="8" className={inputClass} />
              </div>
            )}
            {fieldConfig.showAlcohol && (
              <div>
                <label className={labelClass}>Alcohol % <span className="text-white/20">(선택)</span></label>
                <input type="number" value={alcohol} onChange={(e) => setAlcohol(e.target.value)} placeholder="12.5" className={inputClass} />
              </div>
            )}
          </div>

          {/* 환원 성향 체크리스트 (카테고리별 동적) */}
          <div>
            <label className={labelClass}>환원 성향 (해당 항목 체크)</label>
            {/* 그룹별 라디오 */}
            {uniqueGroups.map((group) => (
              <div key={group}>
                <p className="text-[11px] text-white/30 mb-1.5 mt-2">{group} (하나만 선택)</p>
                <div className="space-y-1.5">
                  {groupedItems.filter((item) => item.group === group).map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                        reductionChecks[item.id]
                          ? ''
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      }`}
                      style={reductionChecks[item.id] ? accentStyle : undefined}
                    >
                      <input
                        type="radio"
                        name={`group-${group}`}
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        style={{ accentColor: accent }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-white/30 ml-2 hidden sm:inline">{item.desc}</span>
                      </div>
                      <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : item.weight < 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                        {item.weight > 0 ? '+' : ''}{item.weight}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {/* 비그룹 복수 선택 */}
            {ungroupedItems.length > 0 && (
              <>
                <p className="text-[11px] text-white/30 mb-1.5 mt-3">특성 (복수 선택 가능)</p>
                <div className="space-y-1.5">
                  {ungroupedItems.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                        reductionChecks[item.id]
                          ? ''
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      }`}
                      style={reductionChecks[item.id] ? accentStyle : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={reductionChecks[item.id] ?? false}
                        onChange={() => toggleReductionCheck(item.id)}
                        style={{ accentColor: accent }}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${reductionChecks[item.id] ? 'text-white' : 'text-white/60'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-white/30 ml-2 hidden sm:inline">{item.desc}</span>
                      </div>
                      <span className={`text-xs font-mono ${item.weight > 0 ? 'text-red-400/60' : item.weight < 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                        {item.weight > 0 ? '+' : ''}{item.weight}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
            {/* 자동 산출 결과 */}
            <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-white/40">산출 결과:</span>
              <span className={`text-sm font-medium ${
                reductionPotential === 'high' ? 'text-red-400' : reductionPotential === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {REDUCTION_POTENTIAL_LABELS[reductionPotential]}
              </span>
              <span className="text-[11px] text-white/20 font-mono">
                (점수: {reductionScore})
              </span>
            </div>
          </div>

          {/* v3.0: 마개 타입 */}
          <div>
            <label className={labelClass}>마개 타입</label>
            <select
              value={closureType}
              onChange={(e) => setClosureType(e.target.value)}
              className={inputClass}
            >
              {Object.entries(CLOSURE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-[11px] text-white/30 mt-1">
              마개의 산소 투과율(OTR)이 해저 숙성 시 FRI 보정에 반영됩니다.
            </p>
          </div>

          {/* 투하 전 지상 숙성 기간 */}
          <div>
            <label className={labelClass}>
              투하 전 숙성 기간 (년) <span className="text-white/20">(선택)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={terrestrialAgingYears}
                onChange={(e) => setTerrestrialAgingYears(e.target.value)}
                placeholder="투하 전 실제 숙성 연수"
                className={inputClass + ' flex-1'}
              />
              {terrestrialAgingYears && (
                <span className="text-xs whitespace-nowrap" style={{ color: accent }}>실측값 사용</span>
              )}
            </div>
            <p className="text-[11px] text-white/30 mt-1.5">
              투하 전 실제 숙성 연수를 입력하면 예측 정밀도가 향상됩니다.
            </p>
          </div>

          {/* 투하 조건 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>투하 예정일</label>
              <input type="date" value={immersionDate} onChange={(e) => setImmersionDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>예정 기간 (월)</label>
              <input type="number" value={plannedDurationMonths} onChange={(e) => setPlannedDurationMonths(e.target.value)} placeholder="18" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>숙성 깊이 (m)</label>
              <input type="number" value={agingDepth} onChange={(e) => setAgingDepth(e.target.value)} placeholder="30" className={inputClass} />
            </div>
          </div>

          {/* 상태 */}
          <div>
            <label className={labelClass}>상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className={inputClass}
            >
              <option value="planned">자동 (투하일 기준)</option>
              <option value="immersed">숙성 중</option>
              <option value="harvested">인양 완료</option>
              <option value="test">테스트</option>
            </select>
            <p className="text-[11px] text-white/30 mt-1">
              자동은 투하일이 지나면 &lsquo;숙성 중&rsquo;으로 표시됩니다. 인양 완료·테스트는 수동으로 고정됩니다.
            </p>
          </div>

          {/* 메모 */}
          <div>
            <label className={labelClass}>메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 참고사항..."
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 rounded-xl py-2.5 text-sm transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!productName.trim() || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 text-black font-medium rounded-xl py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(to right, ${accent}, rgba(${accentRgb}, 0.85))` }}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
