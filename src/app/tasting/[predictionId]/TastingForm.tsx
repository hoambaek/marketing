'use client';

import { useState, type CSSProperties } from 'react';

// 오늘 날짜 (로컬 타임존 기준, YYYY-MM-DD)
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
import { Warehouse, Anchor } from 'lucide-react';

const GOLD = '#C4A052';
// 골드와 같은 채도(HSL S≈47%)의 블루-네이비 — 해저 숙성 슬라이더용
const NAVY = '#3F5E9A';

// 6축 정의
const AXES = [
  { key: 'Fruity', label: '과실향' },
  { key: 'FloralMineral', label: '플로럴·미네랄' },
  { key: 'YeastyAutolytic', label: '효모·숙성향' },
  { key: 'AcidityFreshness', label: '산도·상쾌함' },
  { key: 'BodyTexture', label: '바디감·질감' },
  { key: 'FinishComplexity', label: '여운·복합미' },
] as const;

type AxisKey = typeof AXES[number]['key'];
type Scores = Record<AxisKey, number>;

const initialScores = (): Scores =>
  AXES.reduce((acc, a) => ({ ...acc, [a.key]: 50 }), {} as Scores);

function ScoreSlider({
  label, value, onChange, fillColor = GOLD,
}: { label: string; value: number; onChange: (v: number) => void; fillColor?: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-[13px] text-white/60 w-24 shrink-0">{label}</span>
      <input
        type="range" min={0} max={100} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="liquid-slider flex-1"
        style={{ '--val': `${value}%`, '--fill': fillColor } as CSSProperties}
        aria-label={label}
      />
      <span className="text-[13px] font-mono text-white/75 w-9 text-right tabular-nums">{value}</span>
    </div>
  );
}

export default function TastingForm({
  predictionId,
}: {
  predictionId: string;
}) {
  const [recorderName, setRecorderName] = useState('');
  const [recorderAffiliation, setRecorderAffiliation] = useState('');
  // 시음 날짜 기본값 = 오늘 (lazy 초기화)
  const [retrievalDate, setRetrievalDate] = useState(todayLocal);
  const [notes, setNotes] = useState('');

  const [undersea, setUndersea] = useState<Scores>(initialScores);
  const [terrestrial, setTerrestrial] = useState<Scores>(initialScores);
  const [underseaOverall, setUnderseaOverall] = useState(50);
  const [terrestrialOverall, setTerrestrialOverall] = useState(50);

  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit() {
    if (!recorderName.trim()) {
      setErrorMsg('기록자 이름을 입력해 주세요.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');

    const payload = {
      predictionId,
      recorderName: recorderName.trim(),
      recorderAffiliation: recorderAffiliation.trim() || null,
      retrievalDate: retrievalDate || null,
      tastingNotes: notes.trim() || null,
      actualFruity: undersea.Fruity,
      actualFloralMineral: undersea.FloralMineral,
      actualYeastyAutolytic: undersea.YeastyAutolytic,
      actualAcidityFreshness: undersea.AcidityFreshness,
      actualBodyTexture: undersea.BodyTexture,
      actualFinishComplexity: undersea.FinishComplexity,
      actualOverallQuality: underseaOverall,
      terrestrialFruity: terrestrial.Fruity,
      terrestrialFloralMineral: terrestrial.FloralMineral,
      terrestrialYeastyAutolytic: terrestrial.YeastyAutolytic,
      terrestrialAcidityFreshness: terrestrial.AcidityFreshness,
      terrestrialBodyTexture: terrestrial.BodyTexture,
      terrestrialFinishComplexity: terrestrial.FinishComplexity,
      terrestrialOverallQuality: terrestrialOverall,
    };

    try {
      const res = await fetch('/api/public/tasting-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error ?? '제출에 실패했습니다.');
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-[#C4A052]/25 bg-white/[0.02] p-8 text-center" style={{ borderColor: `${GOLD}30` }}>
        <h2 className="text-xl text-white/90 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>제출이 완료되었습니다</h2>
        <p className="text-sm text-white/45 leading-relaxed">
          기록해 주셔서 감사합니다. 제출하신 비교 시음 결과는 내부 검토 후 데이터에 반영됩니다.
        </p>
      </div>
    );
  }

  // text-base(16px): iOS에서 입력 포커스 시 자동 확대(줌) 방지. min-w-0: date 입력 넘침 방지
  const inputClass = 'w-full min-w-0 bg-white/[0.03] border border-white/[0.1] rounded-lg px-3 py-2.5 text-base text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#C4A052]/40 transition-colors';
  const labelClass = 'text-[11px] text-white/40 mb-1.5 block';

  return (
    <div className="space-y-8">
      {/* 기록자 정보 */}
      <section>
        <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">기록자 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>이름 *</label>
            <input value={recorderName} onChange={e => setRecorderName(e.target.value)} placeholder="홍길동" className={inputClass} maxLength={100} />
          </div>
          <div>
            <label className={labelClass}>소속 (선택)</label>
            <input value={recorderAffiliation} onChange={e => setRecorderAffiliation(e.target.value)} placeholder="WSET Diploma / 소믈리에" className={inputClass} maxLength={120} />
          </div>
          <div>
            <label className={labelClass}>시음 날짜</label>
            {/* appearance-none: iOS date 입력이 화면 밖으로 넘치는 문제 방지 */}
            <input type="date" value={retrievalDate} onChange={e => setRetrievalDate(e.target.value)} suppressHydrationWarning className={`${inputClass} appearance-none`} />
          </div>
        </div>
      </section>

      {/* 지상 보관 시음 */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Warehouse className="w-4 h-4 text-white/50" />
          <h2 className="text-[13px] font-medium text-white/80">지상 보관</h2>
        </div>
        {AXES.map(a => (
          <ScoreSlider key={a.key} label={a.label} value={terrestrial[a.key]}
            onChange={v => setTerrestrial(s => ({ ...s, [a.key]: v }))} />
        ))}
        <div className="mt-2 pt-2 border-t border-white/[0.06]">
          <ScoreSlider label="종합 선호도" value={terrestrialOverall} onChange={setTerrestrialOverall} />
        </div>
      </section>

      {/* 해저 숙성 시음 */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Anchor className="w-4 h-4" style={{ color: NAVY }} />
          <h2 className="text-[13px] font-medium text-white/80">해저 숙성</h2>
        </div>
        {AXES.map(a => (
          <ScoreSlider key={a.key} label={a.label} value={undersea[a.key]}
            onChange={v => setUndersea(s => ({ ...s, [a.key]: v }))} fillColor={NAVY} />
        ))}
        <div className="mt-2 pt-2 border-t border-white/[0.06]">
          <ScoreSlider label="종합 선호도" value={underseaOverall} onChange={setUnderseaOverall} fillColor={NAVY} />
        </div>
      </section>

      {/* 시음 노트 */}
      <section>
        <label className={labelClass}>시음 노트 (선택)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} maxLength={2000}
          placeholder="짠 미네랄 여운, 둥글어진 tension, 미세한 무스의 통합감 등 자유롭게 기록해 주세요."
          className={`${inputClass} resize-none`} />
      </section>

      {/* 제출 */}
      {status === 'error' && (
        <p className="text-[12px] text-red-300/70">{errorMsg}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={status === 'submitting'}
        className="w-full py-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-50"
        style={{ borderColor: `${GOLD}40`, color: GOLD, backgroundColor: `${GOLD}0c` }}
      >
        {status === 'submitting' ? '제출 중…' : '시음 결과 제출'}
      </button>
      <p className="text-[10px] text-white/25 text-center -mt-4">
        제출 내용은 내부 검토 후 반영됩니다. 개인정보는 기록자 식별 용도로만 사용됩니다.
      </p>
    </div>
  );
}
