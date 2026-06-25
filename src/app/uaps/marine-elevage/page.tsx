'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Handshake,
  SearchX,
  HelpCircle,
  Thermometer,
  Anchor as AnchorIcon,
  Target,
  FlaskConical,
  MapPin,
  PenLine,
} from 'lucide-react';

// 단일 액센트 — 절제된 골드
const GOLD = '#C4A052';

// ═══════════════════════════════════════════════════════════════════════════
// 섹션 헤더
// ═══════════════════════════════════════════════════════════════════════════
function SectionLabel({ no, children }: { no: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-baseline gap-3 mb-5"
    >
      <span className="text-[11px] font-mono text-white/25 tracking-widest">{no}</span>
      <h2 className="text-xs sm:text-sm text-white/45 tracking-[0.15em] uppercase">{children}</h2>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6박자 설명 아크 — 단계 노드 (단색)
// ═══════════════════════════════════════════════════════════════════════════
function ArcStep({
  number,
  icon: Icon,
  tag,
  title,
  index,
  isLast = false,
  children,
}: {
  number: string;
  icon: React.ElementType;
  tag: string;
  title: string;
  index: number;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.55, delay: index * 0.05 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden hover:border-white/[0.12] transition-colors duration-500"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs text-white/50 border border-white/[0.1] bg-white/[0.02]">
              {number}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Icon className="w-3.5 h-3.5 text-white/35" />
                <p className="text-[10px] tracking-[0.15em] uppercase text-white/30">{tag}</p>
              </div>
              <h3 className="text-sm sm:text-base font-medium text-white/85 leading-snug">{title}</h3>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-white/45 leading-relaxed space-y-3 pl-0 sm:pl-[2.75rem]">
            {children}
          </div>
        </div>
      </motion.div>

      {!isLast && (
        <div className="flex justify-center my-1 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 + 0.35 }}
            className="origin-top"
          >
            <div className="w-px h-5 bg-white/[0.1]" />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// 시음 중 인용 박스 — 실제로 말할 문장 (골드 라인 하나만)
function SayThis({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-r-lg border-l-2 border-[#C4A052]/40 pl-4 pr-3 py-2.5 bg-white/[0.015]">
      <p className="text-[13px] sm:text-sm text-white/65 italic leading-relaxed">“{children}”</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 페이지
// ═══════════════════════════════════════════════════════════════════════════
export default function MarineElevagePage() {
  const lexicon: { avoid: string; use: string }[] = [
    { avoid: '바다 맛이 난다', use: '짠 미네랄 여운, brioche와 해풍이 겹치는 saline finish' },
    { avoid: '더 부드럽다', use: '산도가 더 낮게 깔린다, 둥글어진 tension' },
    { avoid: '기포가 좋다', use: '무스의 미세한 통합감(integrated mousse), 압력감 있는 비드' },
    { avoid: '깊은 맛', use: '수평적으로 펼쳐지는 텍스처, 차갑게 정돈된 미네랄리티' },
    { avoid: '고급스럽다', use: '더 긴 여운, 차분하게 정렬된 산미' },
  ];

  const coreWords = ['salinity', 'mousse', 'tension', 'texture', 'finish'];

  const forbidden: { phrase: string; why: string }[] = [
    { phrase: '“일반 샴페인보다 한 단계 위입니다”', why: '즉시 적대 — 위계 주장' },
    { phrase: '“바다 에너지가 와인을 바꿉니다”', why: '의사과학으로 분류됨' },
    { phrase: '“바다에 넣었더니 맛있어졌습니다”', why: '마케팅 냄새, 끝' },
    { phrase: '“샴페인의 미래를 바꿉니다”', why: '외부자의 오만으로 읽힘' },
    { phrase: '“완성합니다 (complete)”', why: '완성=우월·필요 함의 → “다른 마무리”로' },
  ];

  return (
    <main className="min-h-screen bg-[#0a0b0d] text-white pb-24">

      {/* ─── 헤더 ─────────────────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/uaps" className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
              <ArrowLeft className="w-3.5 h-3.5" />UAPS 대시보드
            </Link>
          </motion.div>

          <motion.p initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white/35 text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-3 sm:mb-5 font-light">
            Marine Élevage · 해저 숙성 정의 문서
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-5xl text-white/90 mb-5 sm:mb-7 leading-[1.18] tracking-tight font-light"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            포도밭이 기원이라면,<br />바다는 마지막 셀러입니다
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
            className="text-white/40 text-sm sm:text-base max-w-2xl font-light leading-relaxed">
            이 문서는 우리가 해저 숙성을 어떻게 정의하고, 어떻게 <span className="text-white/65">말해야 하는지</span>에 대한 기준입니다.
            모든 문장은 세 원칙 위에 섭니다 — 테루아는 존중, 축은 셀러로 이동, 주장은 측정 위에.
          </motion.p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="h-px bg-white/[0.07] mb-10 sm:mb-14" />
      </div>

      {/* ─── 0. 한 문장 ─────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 mb-14 sm:mb-20">
        <SectionLabel no="00">한 문장 · 호기심 있는 사람용</SectionLabel>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
          <p className="text-lg sm:text-2xl text-white/80 leading-relaxed font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            “포도밭이 샴페인의 기원이라면, 저희는 그 마지막 숙성(élevage)을 지상 셀러가 아니라
            <span className="text-white/95"> 바다라는 셀러</span>에서 진행합니다.
            더 좋다고 주장하는 게 아니라, <span style={{ color: GOLD }}>다른 마무리를 측정해서</span> 보여드리는 거예요.”
          </p>
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap gap-x-5 gap-y-1.5">
            {['기원(terroir)은 인정', '축은 셀러로 이동', '‘더 좋다’가 아니라 ‘다르다’'].map((t, i) => (
              <span key={t} className="text-[11px] text-white/40 flex items-center gap-1.5">
                <span className="font-mono text-white/25">{`0${i + 1}`}</span>{t}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/30 leading-relaxed">
            가볍게 물을 때는 길게 가지 마세요. 이 한 줄에 이미 안전장치 세 개가 들어 있습니다.
          </p>
        </motion.div>
      </section>

      {/* ─── 1. 6박자 설명 아크 ──────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 mb-14 sm:mb-20">
        <SectionLabel no="01">진지한 애호가용 · 6박자 설명 아크</SectionLabel>
        <p className="text-[11px] text-white/30 mb-6 -mt-2">
          인정 → 빈틈 → 질문 → 변수 → 예측(해자) → 블라인드+겸손. 이 순서를 지키면
          “신기한 술”이 아니라 “샴페인 엘레바주 담론에 다음 변수를 제출하는 브랜드”로 들립니다.
        </p>

        <div className="space-y-1">
          <ArcStep number="01" icon={Handshake} index={0} tag="인정 · 먼저 항복부터" title="샴페인의 위대함이 어디서 오는지 먼저 인정한다">
            <SayThis>샴페인의 위대함은 밭, 생산자, 블렌딩, 리저브 와인에서 옵니다. 저희는 이걸 부정할 생각이 전혀 없습니다.</SayThis>
            <p>이 문장이 없으면 외부자(한국 브랜드)의 모든 다음 말이 <span className="text-white/65">도전</span>으로 들립니다. 반드시 먼저 깔아야 합니다.</p>
          </ArcStep>

          <ArcStep number="02" icon={SearchX} index={1} tag="빈틈 · 공격이 아니라 질문의 여지" title="아직 탐구가 덜 된 영역을 보여준다">
            <SayThis>그런데 병입 이후의 숙성 환경은, 거의 모든 하우스가 같은 변수를 씁니다. 어두운 지하, 안정된 온도. 여기는 아직 탐구가 덜 된 영역이에요.</SayThis>
            <p>누구도 틀렸다고 말하지 않으면서 <span className="text-white/65">빈칸</span>을 보여줍니다.</p>
          </ArcStep>

          <ArcStep number="03" icon={HelpCircle} index={2} tag="질문 · 선언 아님" title="‘새 카테고리’를 선언하지 말고 질문으로 던진다">
            <SayThis>완성된 샴페인의 마지막 1년을, 지상 셀러가 아니라 수심 30m 바다에서 보내면 무엇이 달라질까. 저희는 이 질문에서 시작했습니다.</SayThis>
            <p>“새 카테고리입니다”라고 선언하지 마세요. 질문으로 던지면 상대가 스스로 답을 궁금해합니다. <span className="text-white/65">카테고리는 선언이 아니라 추대됩니다.</span></p>
          </ArcStep>

          <ArcStep number="04" icon={Thermometer} index={3} tag="메커니즘 · 신비화 금지, 변수로 환원" title="바다를 ‘마법’이 아니라 측정 가능한 조건으로 말한다">
            <SayThis>바다가 마법을 부리는 게 아닙니다. 해저는 낮고 일정한 온도, 빛의 부재, 정수압, 미세 진동이라는 측정 가능한 조건을 줍니다. 저희는 이 조건이 무스의 통합감, 산미의 인상, 텍스처, 여운에 어떤 차이를 만드는지 추적합니다.</SayThis>
            <div className="flex flex-wrap gap-1.5">
              {['낮고 일정한 온도', '빛의 부재', '정수압', '미세 진동'].map(v => (
                <span key={v} className="text-[10px] px-2 py-0.5 rounded border border-white/[0.1] text-white/45 font-mono">{v}</span>
              ))}
            </div>
            <p className="text-white/35 text-[11px]">“바다 에너지” “더 살아난다” 류는 절대 금지. 물리 변수로만 말해야 고수의 신뢰가 섭니다.</p>
          </ArcStep>

          <ArcStep number="05" icon={Target} index={4} tag="해자 · Abyss·Immersion과 가르는 지점" title="‘담갔다’가 아니라 ‘언제 꺼낼지를 예측하는 공정 제어’">
            <SayThis>기존 해저숙성 사례들은 고정 기간 침지예요. 저희는 다릅니다 — 해양 조건에서의 숙성 정점을 AI로 예측해서 입수·인양 시점 자체를 타게팅합니다. ‘바다에 담갔다’가 아니라 언제 꺼낼지를 예측하는 공정 제어입니다.</SayThis>
            <p>이게 <span className="text-white/75">감성 브랜드와 연구 브랜드를 가르는 단 하나의 문장</span>입니다. 여기서 UAPS를 전면에 세우세요.</p>
            <Link href="/uaps/how-it-works" className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors mt-1">
              <AnchorIcon className="w-3 h-3" /> UAPS 작동 원리 보기 →
            </Link>
          </ArcStep>

          <ArcStep number="06" icon={FlaskConical} index={5} isLast tag="증명 + 겸손 · premium의 핵심" title="블라인드로 비교하고, ‘무조건 낫다’고 말하지 않는다">
            <SayThis>그래서 저희는 같은 퀴베·같은 로트를 지상 대조군과 블라인드로 비교 시음합니다. 그리고 ‘바다가 무조건 낫다’고는 말하지 않습니다. 과학적으로 아직 그렇게 단정할 단계가 아니고, 저희도 그 겸손함을 유지하는 게 더 정직하다고 봐요.</SayThis>
            <p>고수일수록 이 마지막 겸손에서 경계를 풉니다. <span className="text-white/75">반증 가능하게 설계했다는 태도 자체가 가장 고급스러운 신호</span>입니다.</p>
          </ArcStep>
        </div>
      </section>

      {/* ─── 2. 감각 언어 키트 ──────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 mb-14 sm:mb-20">
        <SectionLabel no="02">감각 언어 키트 · “바다 맛”을 애호가 어휘로</SectionLabel>
        <p className="text-[11px] text-white/30 mb-6 -mt-2">
          설명의 절반은 시음 중 <span className="text-white/50">단어 선택</span>입니다. 왼쪽은 하수의 언어, 오른쪽은 고수의 언어.
        </p>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="grid grid-cols-2 bg-white/[0.02] border-b border-white/[0.07] px-4 py-2">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">피해야 할 말</span>
            <span className="text-[10px] font-mono text-white/55 uppercase tracking-widest">써야 할 말</span>
          </div>
          {lexicon.map((row, i) => (
            <div key={row.avoid} className={`grid grid-cols-2 gap-3 px-4 py-3 items-center ${i % 2 === 0 ? 'bg-white/[0.01]' : ''} border-b border-white/[0.03] last:border-0`}>
              <span className="text-[12px] text-white/30 line-through decoration-white/20">{row.avoid}</span>
              <span className="text-[12px] text-white/70 leading-snug">{row.use}</span>
            </div>
          ))}
        </motion.div>

        {/* 핵심 5단어 */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.015] p-4">
          <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-3">핵심 5단어만 기억하면 됩니다</p>
          <div className="flex flex-wrap gap-2">
            {coreWords.map(w => (
              <span key={w} className="text-sm font-mono px-3 py-1.5 rounded-lg border border-[#C4A052]/25 text-white/75" style={{ backgroundColor: `${GOLD}0a` }}>{w}</span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/35 leading-relaxed">
            이 다섯으로 바다의 차이를 <span className="text-white/55">기존 평가 언어 안에서 번역</span>하는 게 설득의 본질입니다.
          </p>
        </motion.div>
      </section>

      {/* ─── 3. 셀러를 장소의 체계로 ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 mb-14 sm:mb-20">
        <SectionLabel no="03">셀러를 ‘장소의 체계’로 말하기</SectionLabel>
        <p className="text-[11px] text-white/30 mb-6 -mt-2">
          애호가는 리외디(lieu-dit)처럼 <span className="text-white/50">체계화된 장소</span>에 반응합니다. “완도 바다에 넣었습니다”가 아니라:
        </p>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          {/* 헤더: 로트명 + 관측 출처 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/40" />
              <span className="text-sm font-mono font-medium text-white/80">Marine Lot · 완도(莞島)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.1] text-white/40">KHOA DT_0027</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.1] text-white/40">완도항 부이 TW_0078</span>
          </div>
          <p className="text-[11px] text-white/30 mb-4">
            국립해양조사원(KHOA) 실측 + 완도항 부이 + Open-Meteo 보조 · 1시간 간격 수집
          </p>

          {/* 실측 수집 항목 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {[
              { k: '투입 수심', v: '30 · 40 · 50 m', note: '표층→40m 깊이 보정' },
              { k: '수온', v: '실측 집계', note: 'FRI·BRI 동적 계수' },
              { k: '염분', v: '30–34 psu', note: '정상 범위 모니터링' },
              { k: '조류 유속', v: '부이 실측', note: 'K-TCI 질감 가속' },
              { k: '조위 · 수압', v: '조위+수심 환산', note: 'BRI 기포 보존' },
              { k: '측정 기간', v: '14개월 일별', note: '2025.01~ · 월별 프로파일' },
            ].map(item => (
              <div key={item.k} className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">{item.k}</p>
                <p className="text-[13px] font-mono text-white/75 leading-tight">{item.v}</p>
                <p className="text-[9px] text-white/25 mt-1 leading-tight">{item.note}</p>
              </div>
            ))}
          </div>

          <p className="text-[12px] text-white/45 leading-relaxed">
            “전 구간이 <span className="text-white/70">Sea Lab</span>에 기록돼 있습니다. 지상 셀러는 이 변수들을 측정하지 않죠.
            저희는 매 로트를 <span className="text-white/70">계측된 숙성 이력</span>으로 남깁니다 — 수온·염분·조류·수압이 일 단위로요.”
          </p>
          <p className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-white/30 leading-relaxed">
            데고르주망 일자를 라벨에 적는 그로워의 <span className="text-white/50">투명성 코드</span>와 같은 논리입니다.
            기록의 정밀함 자체가 정통성입니다.
          </p>
          <Link href="/data-log" className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors mt-3">
            <AnchorIcon className="w-3 h-3" /> Sea Lab 실측 데이터 보기 →
          </Link>
        </motion.div>

        {/* ── 측정을 방정식으로 — 실제 보정 계수 ── */}
        <p className="text-[11px] text-white/30 mt-10 mb-4">
          그리고 그 측정값은 <span className="text-white/55">실제 방정식</span>으로 들어갑니다.
          “바다가 좋다”가 아니라, 수온·수압·유속이 향·기포·질감에 미치는 영향을 물리식으로 계산합니다.
        </p>

        {/* 수식 기호 범례 — 중학생용 */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3 mb-5">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">기호 먼저 — 어렵지 않아요</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px] text-white/40">
            <p><code className="text-white/60 font-mono">exp(…)</code> 값을 가파르게 키우거나 줄임</p>
            <p><code className="text-white/60 font-mono">T</code> 바닷물 온도</p>
            <p><code className="text-white/60 font-mono">σ</code> 들쭉날쭉한 정도</p>
            <p><code className="text-white/60 font-mono">√</code> 제곱근(천천히 커짐)</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            {
              abbr: 'FRI', name: '향 보존 지수', basis: 'Arrhenius 방정식', tag: '과학적', weight: '0.40',
              formula: 'exp( −Ea / R · (1/T − 1/T₀) )',
              params: 'Ea 80 kJ/mol · T₀ 14 ℃ · R 8.314',
              note: '수온이 낮을수록 산화가 느려 향 보존이 좋아짐 (4 ℃→1.0, 25 ℃→0)',
              simple: '냉장고에 음식 넣으면 오래 가죠? 차가우면 향을 날리는 화학반응(산화)이 느려져요. 이 식은 “바닷물이 몇 ℃면 향이 얼마나 천천히 사라지는가”를 계산합니다. 차가울수록 점수가 1(최고)에 가까워요.',
            },
            {
              abbr: 'BRI', name: '기포 보존 지수', basis: "Henry 법칙 · Van't Hoff", tag: '과학적', weight: '0.25',
              formula: 'exp( −ΔsolH / R · (1/T − 1/T₀) ) · (P / P₀)',
              params: 'ΔsolH −19.9 kJ/mol · P₀ 1 atm',
              note: '저온·고압일수록 CO₂ 용해가 안정 → 기포가 미세하게 통합됨',
              simple: '따뜻한 콜라는 김이 빨리 빠지고, 차갑고 꽉 닫힌 콜라는 탄산이 오래 가죠. 깊은 바다는 차갑고(온도 T) 누르는 힘도 세요(압력 P). 이 두 가지를 곱해 “기포가 얼마나 곱게 남는가”를 계산합니다.',
            },
            {
              abbr: 'K-TCI', name: '운동학적 질감 계수', basis: '조류 유속 · 제곱근 스케일', tag: '근사', weight: '0.20',
              formula: '0.6 + √( v / 80 ) · (1.8 − 0.6)',
              params: 'v 조류 유속 cm/s · 상한 80',
              note: '해류가 병을 자연히 흔들어 리무아주(침전물 교반) 효과 (kf 0.6~1.8)',
              simple: '주스를 흔들면 가라앉은 게 섞이며 부드러워지죠. 바닷물 흐름(v)이 병을 살살 흔들어 같은 효과를 냅니다. 물살이 셀수록 효과가 커지지만, 무한정은 아니라서 제곱근(√)으로 천천히 올라 0.6~1.8 사이에 머물러요.',
            },
            {
              abbr: 'TSI', name: '온도 안정성 지수', basis: '월간 수온 표준편차', tag: '통계', weight: '0.15',
              formula: '1 − σ(month) / 5 ℃',
              params: '기준 변동폭 5 ℃',
              note: '해저 수온이 안정적으로 유지될수록 점수가 높아짐',
              simple: '온도가 매일 오르락내리락하면 와인이 스트레스를 받아요. 한 달 동안 수온이 얼마나 흔들렸는지(σ)를 재서, 적게 흔들릴수록 1(안정)에 가까운 점수를 줍니다.',
            },
          ].map((c, i) => (
            <motion.div key={c.abbr}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                {/* 약어 + 가중치 */}
                <div className="shrink-0 sm:w-24">
                  <div className="flex items-baseline gap-2 sm:flex-col sm:gap-0.5">
                    <span className="text-base font-mono font-semibold" style={{ color: GOLD }}>{c.abbr}</span>
                    <span className="text-[10px] text-white/30">가중치 {c.weight}</span>
                  </div>
                </div>
                {/* 본문 */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-white/80">{c.name}</span>
                    <span className="text-[10px] text-white/35">· {c.basis}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/[0.1] text-white/40">{c.tag}</span>
                  </div>
                  <code className="block text-[11px] sm:text-[12px] font-mono text-white/65 bg-black/25 rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap">
                    {c.formula}
                  </code>
                  <p className="text-[10px] text-white/30 font-mono">{c.params}</p>
                  <p className="text-[11px] text-white/40 leading-relaxed">{c.note}</p>
                  <div className="rounded-lg border-l-2 border-[#C4A052]/30 bg-white/[0.015] pl-3 pr-3 py-2 mt-1">
                    <p className="text-[10px] text-white/30 mb-0.5">쉽게 말하면</p>
                    <p className="text-[11px] text-white/55 leading-relaxed">{c.simple}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* TCI 가설 단서 + 종합식 */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 space-y-3">
          <div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">종합 환경 점수</p>
            <code className="block text-[11px] sm:text-[12px] font-mono text-white/60 bg-black/25 rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap">
              Score = 0.40·FRI + 0.25·BRI + 0.20·K-TCI + 0.15·TSI
            </code>
            <p className="text-[11px] text-white/40 leading-relaxed mt-2">
              네 점수를 <span className="text-white/55">중요도(가중치)만큼 섞어</span> 하나의 환경 점수로 만듭니다.
              향 보존을 가장 중요하게(40%) 보고, 그다음 기포(25%)·질감(20%)·온도 안정성(15%) 순이에요.
            </p>
          </div>
          <p className="text-[11px] text-white/35 leading-relaxed">
            <span style={{ color: GOLD }}>정직하게</span> — FRI·BRI는 검증된 물리·화학 방정식 위에 섭니다.
            K-TCI는 운동학적 근사, TSI는 통계 지표입니다. 질감 보정의 일부(TCI)는 아직
            <span className="text-white/55"> 가설적 추정(기본 0.30)</span> 단계이며, 비교 시음 데이터로 베이지안 보정해 나갑니다.
          </p>
          <Link href="/uaps/how-it-works" className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors">
            <AnchorIcon className="w-3 h-3" /> 계수 도출 과정 자세히 보기 →
          </Link>
        </motion.div>
      </section>

      {/* ─── 4. 작가 한 줄 ──────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 mb-14 sm:mb-20">
        <SectionLabel no="04">작가 한 줄 · 인물 서사 심기</SectionLabel>
        <p className="text-[11px] text-white/30 mb-6 -mt-2">
          기회가 되면(짧게) 본인을 한 번 등장시키세요. <span className="text-white/50">컬트는 반드시 ‘얼굴’을 요구합니다.</span>
        </p>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
          <PenLine className="absolute top-5 right-5 w-5 h-5 text-white/15" />
          <p className="text-base sm:text-lg text-white/75 leading-relaxed font-light italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            “저는 원래 시간을 물질로 다루는 작업을 해왔습니다 — 시간을 한 장에 압축하는 사진이요.
            바다 숙성은 그 질문의 연장이에요. <span style={{ color: GOLD }}>‘시간을 어디에서 통과시킬 것인가.’</span>”
          </p>
          <p className="mt-4 text-[11px] text-white/30 leading-relaxed">
            ‘엘레바주의 철학자’라는 인물 축이 한 문장이라도 들어가면, 제품이 기념품에서
            <span className="text-white/50"> 작가의 탐구</span>로 격상됩니다.
          </p>
        </motion.div>
      </section>

      {/* ─── 5. 절대 하면 안 되는 말 ─────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 mb-10">
        <SectionLabel no="05">절대 하면 안 되는 말 · 방어 본능 스위치</SectionLabel>
        <p className="text-[11px] text-white/30 mb-6 -mt-2">
          한 문장이라도 나오면 고수의 방어 본능이 켜집니다. 아래는 즉시 신뢰를 잃는 표현들.
        </p>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/[0.08] overflow-hidden">
          {forbidden.map((f, i) => (
            <div key={f.phrase} className={`flex items-start gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''} border-b border-white/[0.03] last:border-0`}>
              <span className="text-white/25 font-mono text-xs shrink-0 mt-0.5">✕</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-white/55">{f.phrase}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{f.why}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* 마무리 원칙 */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 rounded-xl border border-[#C4A052]/20 p-5" style={{ backgroundColor: `${GOLD}08` }}>
          <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-2">설명의 골격</p>
          <p className="text-sm text-white/65 leading-relaxed font-mono">
            인정 → 빈틈 → 질문 → 변수 → <span style={{ color: GOLD }}>예측(해자)</span> → 블라인드 + 겸손
          </p>
          <p className="mt-2 text-[12px] text-white/35 leading-relaxed">
            모든 문장이 <span className="text-white/55">terroir는 존중, 축은 셀러, 주장은 측정 위에</span> 서 있어야 합니다.
          </p>
        </motion.div>
      </section>

    </main>
  );
}
