'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Footer } from '@/components/layout/Footer';

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4.5 h-4.5 text-[#C4A052]/70" />
          <h2 className="text-base font-medium text-white/80">{title}</h2>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/30 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-white/[0.04]"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

type StatusType = 'READY' | 'IDEA' | 'PLANNED' | 'PUBLISHED' | 'DROPPED';

const STATUS_STYLES: Record<StatusType, { color: string; bg: string; border: string }> = {
  READY: { color: '#4ade80', bg: '#4ade8015', border: '#4ade8030' },
  IDEA: { color: '#60a5fa', bg: '#60a5fa15', border: '#60a5fa30' },
  PLANNED: { color: '#C4A052', bg: '#C4A05215', border: '#C4A05230' },
  PUBLISHED: { color: '#a78bfa', bg: '#a78bfa15', border: '#a78bfa30' },
  DROPPED: { color: '#6b7280', bg: '#6b728015', border: '#6b728030' },
};

function StatusBadge({ status }: { status: StatusType }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

const AXIS_1 = [
  { id: '1-01', title: '한복 실제 착장법 (K-드라마 팩트체크)', hook: '"This is NOT how you wear hanbok."', status: 'PLANNED' as StatusType, note: 'content-plan-001' },
  { id: '1-02', title: 'K-드라마 절 해독', hook: '"Same bow. Koreans saw a power struggle."', status: 'PLANNED' as StatusType, note: 'content-plan-002' },
  { id: '1-03', title: '한국 도자기 vs 중국 vs 일본', hook: '"They look the same. They\'re NOT."', status: 'IDEA' as StatusType, note: '시각적 비교 강력' },
  { id: '1-04', title: '인간문화재 방문 시리즈', hook: '"Meeting Korea\'s last living treasures."', status: 'IDEA' as StatusType, note: '장기 시리즈, 섭외 필요' },
  { id: '1-05', title: '한국 전통 색 오방색', hook: '"Every color in Korea means something."', status: 'IDEA' as StatusType, note: 'K-pop MV 연결 가능' },
  { id: '1-06', title: '한국 전통 결혼식', hook: '"Korean weddings are nothing like you think."', status: 'IDEA' as StatusType, note: '비주얼 강력' },
  { id: '1-07', title: '절의 철학 — 스승이 악기 전에 절부터 가르친 이유', hook: '"My teacher didn\'t let me touch an instrument for 3 months."', status: 'PLANNED' as StatusType, note: 'content-plan-004' },
  { id: '1-08', title: '예절의 뿌리 5가지', hook: '"3 years of training in 25 seconds."', status: 'PLANNED' as StatusType, note: 'content-plan-005' },
];

const AXIS_2 = [
  { id: '2-01', title: '눈치 — 한국의 6번째 감각', hook: '"Koreans have a 6th sense. No English word for it."', status: 'READY' as StatusType, note: 'NYT 베스트셀러 검증' },
  { id: '2-02', title: '호칭 문화 — 이름을 부르면 무례', hook: '"Calling someone by name can be an insult."', status: 'READY' as StatusType, note: 'K-드라마 팬 즉시 공감' },
  { id: '2-03', title: '정(Jeong)', hook: '"The emotion that makes Koreans stay."', status: 'IDEA' as StatusType, note: '감성형, 공유 유도' },
  { id: '2-04', title: '한(Han)', hook: '"An emotion only Koreans feel."', status: 'IDEA' as StatusType, note: 'K-드라마 팬 공감 극대화' },
  { id: '2-05', title: '멋 — style도 beauty도 cool도 아닌 것', hook: '"No English word exists for this."', status: 'IDEA' as StatusType, note: '전략서 원본 아이디어' },
  { id: '2-06', title: '풍류 — 한국식 즐거움', hook: '"Korea\'s lost art of enjoying life."', status: 'IDEA' as StatusType, note: '002 가야금에서 분리' },
  { id: '2-07', title: '효(Hyo) — 한국의 효도 문화', hook: '"In Korea, your parents come first. Always."', status: 'IDEA' as StatusType, note: '예절편과 연결 가능' },
];

const AXIS_3 = [
  { id: '3-01', title: 'BTS 대취타의 원본', hook: '"Suga sampled a King\'s entrance."', status: 'PLANNED' as StatusType, note: 'content-plan-003' },
  { id: '3-02', title: 'K-pop 안무 속 전통 춤 DNA', hook: '"K-pop choreography has a 500-year-old secret."', status: 'READY' as StatusType, note: 'BTS IDOL, 탈춤 연결' },
  { id: '3-03', title: 'Stray Kids 소리꾼 x 판소리', hook: '"This K-pop group is singing 판소리."', status: 'IDEA' as StatusType, note: '팬덤 유입' },
  { id: '3-04', title: 'BLACKPINK MV 속 한국 상징', hook: '"Hidden Korean symbols in BP\'s MV."', status: 'IDEA' as StatusType, note: 'BLINK 유입' },
  { id: '3-05', title: '한국 전통 색채가 현대 패션에 들어간 방식', hook: '"Korean traditional colors in modern fashion."', status: 'IDEA' as StatusType, note: '패션 관심층' },
  { id: '3-06', title: '한국 건축 — 왜 지붕이 곡선인가', hook: '"Why Korean roofs curve upward."', status: 'IDEA' as StatusType, note: '시각적' },
];

const AXIS_4 = [
  { id: '4-01', title: 'K-Beauty의 진짜 기원 — 신라의 화장 문화', hook: '"K-Beauty started 1,500 years ago. In a kingdom."', status: 'READY' as StatusType, note: '신라 화랑의 화장, 동백기름' },
  { id: '4-02', title: '고려 여성의 뷰티 — 세계 최초 수준의 스킨케어', hook: '"Korean women invented skincare routines 1,000 years ago."', status: 'READY' as StatusType, note: '고려 귀족 여성의 다단계 스킨케어' },
  { id: '4-03', title: '조선시대 뷰티 — 궁중 화장법의 비밀', hook: '"Joseon Queens had a 7-step beauty ritual. Sound familiar?"', status: 'READY' as StatusType, note: '7-step → 현대 K-Beauty 루틴의 원형' },
  { id: '4-04', title: '조선의 미백 집착 — 그 뿌리와 현재', hook: '"Korea\'s obsession with clear skin is 500 years old."', status: 'IDEA' as StatusType, note: '쌀뜨물 세안, 녹두 팩 → 현대 성분' },
  { id: '4-05', title: '개화기 — 서양 화장품과 한국 전통의 충돌', hook: '"When Western makeup met Korean tradition — chaos."', status: 'IDEA' as StatusType, note: '박가분, 최초의 한국 화장품 브랜드' },
  { id: '4-06', title: '동백기름에서 카멜리아 오일까지', hook: '"Your expensive camellia oil? Korea used it for free. For centuries."', status: 'READY' as StatusType, note: '성분 하나로 천년 연결' },
  { id: '4-07', title: '한국 남자도 화장했다 — 화랑의 뷰티', hook: '"Korean MEN wore makeup 1,500 years ago. Before anyone."', status: 'READY' as StatusType, note: '성별 반전 + 역사 = 후킹 최강' },
  { id: '4-08', title: '"10-step routine"의 진짜 기원', hook: '"The 10-step K-Beauty routine isn\'t marketing. It\'s history."', status: 'READY' as StatusType, note: '가장 직접적인 전통→현대 연결' },
];

const SERIES = [
  { name: '"K-Drama Decoded"', content: '001 한복 + 002 절 + 후속편들', status: '001, 002 기획 완료' },
  { name: '"The Sound of Korea"', content: '대취타(003) → 장구 → 대금 → 해금 → 사물놀이', status: '003 기획 완료' },
  { name: '"K-pop의 뿌리"', content: '대취타(003) → 소리꾼 → BP → IDOL → ATEEZ', status: '003 기획 완료' },
  { name: '"You Can\'t Translate This"', content: '눈치 → 호칭 → 정 → 한 → 멋 → 풍류', status: '아이디어' },
  { name: '"Korean Manners 101"', content: '절(002) → 철학(004) → 뿌리(005) → 식사예절 → 음주예절', status: '002, 004, 005 기획 완료' },
  { name: '"K-Beauty의 뿌리"', content: '신라(4-01) → 고려(4-02) → 조선(4-03) → 개화기(4-05) → 성분(4-06)', status: '아이디어 — 시리즈 구조 확정' },
];

function IdeaTable({ items }: { items: typeof AXIS_1 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left text-white/30 font-medium py-2 px-2 w-12">ID</th>
            <th className="text-left text-white/30 font-medium py-2 px-2">소재</th>
            <th className="text-left text-white/30 font-medium py-2 px-2 hidden sm:table-cell">후킹</th>
            <th className="text-left text-white/30 font-medium py-2 px-2 w-20">상태</th>
            <th className="text-left text-white/30 font-medium py-2 px-2 hidden sm:table-cell">비고</th>
          </tr>
        </thead>
        <tbody className="text-sm text-white/50">
          {items.map((item) => (
            <tr key={item.id} className="border-b border-white/[0.03]">
              <td className="py-2.5 px-2 font-mono text-[#C4A052]/70 text-xs">{item.id}</td>
              <td className="py-2.5 px-2 text-white/60">{item.title}</td>
              <td className="py-2.5 px-2 text-white/40 italic text-xs hidden sm:table-cell">{item.hook}</td>
              <td className="py-2.5 px-2"><StatusBadge status={item.status} /></td>
              <td className="py-2.5 px-2 text-white/30 text-xs hidden sm:table-cell">{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CXPIdeasPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/cxp"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            CXP
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-[#C4A052]" />
            <span className="text-xs text-white/40">Ideas Pipeline</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-light text-white/90 tracking-tight mb-2"
            style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
          >
            Content Ideas Backlog
          </h1>
          <p className="text-sm text-white/50">
            콘텐츠 소재 아이디어 저장소 — 후킹 검증, 우선순위 관리, 기획 파이프라인
          </p>

          {/* 상태 범례 */}
          <div className="flex flex-wrap gap-3 mt-5">
            {(['READY', 'IDEA', 'PLANNED', 'PUBLISHED', 'DROPPED'] as StatusType[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <StatusBadge status={s} />
                <span className="text-[10px] text-white/30">
                  {s === 'READY' && '후킹 검증됨'}
                  {s === 'IDEA' && '추가 검증 필요'}
                  {s === 'PLANNED' && '기획서 완료'}
                  {s === 'PUBLISHED' && '업로드 완료'}
                  {s === 'DROPPED' && '보류/폐기'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 축별 아이디어 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <CollapsibleSection title='축 1: "The Real Korea" — 진짜 한국 보여주기 (50%)' icon={Lightbulb} defaultOpen={true}>
            <div className="pt-4">
              <IdeaTable items={AXIS_1} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title='축 2: "Lost in Translation" — 한국어에만 있는 것들 (25%)' icon={Lightbulb}>
            <div className="pt-4">
              <IdeaTable items={AXIS_2} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title='축 3: "Korea meets the World" — 전통 x 현대 (25%)' icon={Lightbulb}>
            <div className="pt-4">
              <IdeaTable items={AXIS_3} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title='축 4: "K-Beauty의 뿌리" — 한국 뷰티의 천년 역사 (시리즈)' icon={Lightbulb}>
            <div className="pt-4 space-y-4">
              <div className="bg-white/[0.03] rounded-xl p-4">
                <p className="text-sm text-white/50 leading-relaxed">
                  K-Beauty가 전 세계 여성들에게 폭발적 인기. 하지만 이것이 갑자기 나온 게 아니라
                  신라 → 고려 → 조선 → 개화기 → 현대로 이어지는 천년 뷰티 문화의 결과물.
                </p>
                <p className="text-sm text-[#C4A052] mt-2 italic">
                  &quot;K-Beauty isn&apos;t a trend. It&apos;s a thousand years.&quot; — 시리즈 태그라인
                </p>
                <p className="text-xs text-white/30 mt-2">
                  대표님 자산: 한국 전통문화 20년 전공 → 전통 미용/화장 문화는 한복, 의례, 궁중문화와 직결
                </p>
              </div>
              <IdeaTable items={AXIS_4} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="시리즈 기획" icon={Lightbulb}>
            <div className="pt-4">
              <div className="space-y-2">
                {SERIES.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
                    <span className="text-sm text-[#C4A052] font-medium min-w-0 shrink-0">{s.name}</span>
                    <span className="text-xs text-white/40 truncate">{s.content}</span>
                    <span className="text-[10px] text-white/30 ml-auto shrink-0">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* 등록 규칙 */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-medium text-white/60 mb-3">아이디어 등록 규칙</h3>
            <ol className="space-y-2 text-sm text-white/40 list-decimal list-inside">
              <li>후킹 문장이 영어 한 줄로 나와야 등록</li>
              <li>대표님의 20년 전공 자산이 연결되어야 함</li>
              <li>&quot;누구나 할 수 있는 콘텐츠&quot;면 DROPPED</li>
              <li>데이터(검색량, 기존 바이럴 사례)가 있으면 READY로 승격</li>
            </ol>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
