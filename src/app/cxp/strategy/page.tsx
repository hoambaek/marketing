'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Target,
  User,
  Layers,
  GitCompare,
  Quote,
  Globe,
  CheckCircle2,
  Rocket,
  ChevronDown,
} from 'lucide-react';
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
          <Icon className="w-4.5 h-4.5 text-[#3D5A56]" />
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

function ComparisonTable({
  headers,
  rows,
}: {
  headers: [string, string];
  rows: [string, string][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left font-medium py-2.5 px-3 bg-[#3D5A56]/20 text-[#3D5A56] rounded-tl-lg w-1/2">
              {headers[0]}
            </th>
            <th className="text-left font-medium py-2.5 px-3 bg-[#C4A052]/15 text-[#C4A052] rounded-tr-lg w-1/2">
              {headers[1]}
            </th>
          </tr>
        </thead>
        <tbody className="text-sm text-white/50">
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.03]">
              <td className="py-2.5 px-3">{row[0]}</td>
              <td className="py-2.5 px-3 text-white/60">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CXPStrategyPage() {
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

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#3D5A56]/20 text-[#3D5A56] border border-[#3D5A56]/30">
              Strategy
            </span>
            <span className="text-sm text-white/40">ORKNEY Creator Team</span>
            <span className="text-white/20">·</span>
            <span className="text-sm text-white/40">v1.0 | 2026.03.06</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-light text-white/90 tracking-tight mb-2"
            style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
          >
            The Pasta Queen 모델 분석 &<br className="sm:hidden" /> 한국 전통문화 크리에이터 전략
          </h1>
          <p className="text-sm text-white/50 italic">
            "자기 문화를 영어로 번역하는 사람"의 포지셔닝 전략
          </p>
        </motion.div>

        {/* 섹션들 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          {/* 1. 성공 공식 분석 */}
          <CollapsibleSection title="The Pasta Queen 성공 공식 분석" icon={Target} defaultOpen={true}>
            <div className="pt-4 space-y-5">
              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">프로필 개요</h4>
                <p className="text-sm text-white/60 leading-relaxed">
                  <span className="text-white/80">Nadia Caterina Munno</span> — 로마 귀족 가문 출신의 이탈리아 여성.
                  미국 플로리다 거주. "이탈리아 파스타"라는 하나의 주제로 Instagram 593만, TikTok 800만+ 팔로워 달성.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">성공 공식 7가지 요소</h4>
                <div className="space-y-2">
                  {[
                    { element: '칭호형 닉네임', pq: '"The Pasta Queen"', why: '즉시 각인' },
                    { element: '문화적 정통성', pq: '로마 귀족 가문', why: '"이 사람이 말하면 진짜"' },
                    { element: '강한 캐릭터', pq: '드라마틱한 목소리, 유머', why: '사람을 보러 옴' },
                    { element: '도구에 이름 붙이기', pq: 'Antonietta the Forchetta', why: '세계관 구축' },
                    { element: '영어 + 이탈리아름', pq: '글로벌 오디언스 + 감성', why: '시장 100배' },
                    { element: '접근성', pq: '바쁜 엄마도 가능한 레시피', why: '"나도 할 수 있네"' },
                    { element: '캐치프레이즈', pq: '"Just gorgeous!"', why: '시그니처 → 브랜드화' },
                  ].map((item) => (
                    <div key={item.element} className="grid grid-cols-[1fr_1.2fr_1fr] gap-2 bg-white/[0.03] rounded-lg p-3 text-xs">
                      <span className="text-white/60 font-medium">{item.element}</span>
                      <span className="text-white/45">{item.pq}</span>
                      <span className="text-white/35">{item.why}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">성장 타임라인</h4>
                <p className="text-sm text-white/50 leading-relaxed">
                  2020년 코로나 기간 TikTok 시작 → 5개월 만에 100만 팔로워. 매일 최소 1개 업로드.
                  바이럴 영상의 댓글을 전부 읽고 분석하여 피드백 루프 운영. 이후 Instagram, YouTube, 쿡북 출간, Amazon 소스 브랜드, TV 쇼까지 진출.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 2. 핵심 통찰 */}
          <CollapsibleSection title="핵심 통찰: 왜 이 모델이 적합한가" icon={Target}>
            <div className="pt-4 space-y-4">
              <p className="text-sm text-white/60">
                The Pasta Queen의 진짜 무기는 <span className="text-[#C4A052]">"자기 문화를 영어로 번역하는 사람"</span> 포지션.
              </p>
              <ComparisonTable
                headers={['The Pasta Queen', '대표님 가능성']}
                rows={[
                  ['이탈리아 음식 문화 → 영어 → 글로벌 593만', '한국 전통문화 → 영어 → 글로벌 오디언스'],
                  ['"파스타" = 전 세계가 아는 이탈리아 상징', '"한복, 도자기, 국악" = 전 세계가 열광하는 한국 상징'],
                  ['이탈리아 음식은 이미 글로벌 스테디셀러', '한국 전통문화는 지금이 폭발 직전'],
                ]}
              />
              <div className="bg-[#3D5A56]/10 border border-[#3D5A56]/20 rounded-xl p-4">
                <p className="text-sm text-white/70 italic leading-relaxed">
                  "이탈리아에 파스타가 있다면, 한국에는 천 년의 아름다움이 있다. 그리고 그것을 영어로 전달하는 사람이 아직 없다."
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">시장 타이밍: 왜 지금인가</h4>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2"><span className="text-[#3D5A56]">—</span>K-pop, K-drama가 한국 '현대' 문화를 전 세계에 깔아놓음</li>
                  <li className="flex items-start gap-2"><span className="text-[#3D5A56]">—</span>전 세계 사람들이 이제 "한국의 뿌리"에 궁금해하는 단계로 진입</li>
                  <li className="flex items-start gap-2"><span className="text-[#3D5A56]">—</span>한복, 전통 공예, 국악 — 유튜브/인스타에서 조회수가 폭발하는 주제</li>
                  <li className="flex items-start gap-2"><span className="text-[#3D5A56]">—</span>하지만 영어로 제대로 설명해주는 "사람"이 아직 없음</li>
                  <li className="flex items-start gap-2"><span className="text-[#3D5A56]">—</span>K-culture의 다음 웨이브 = 전통문화. 이 포지션의 The Pasta Queen이 부재</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 3. 대표 자산 재정리 */}
          <CollapsibleSection title="대표 자산 재정리" icon={User}>
            <div className="pt-4 space-y-5">
              {[
                {
                  title: '자산 1: 국악 20년+ 전공',
                  items: [
                    '한국 전통문화의 깊이를 "체험"으로 안다',
                    '인간문화재, 전통 공예 장인, 한복 장인과의 네트워크 보유',
                    '"관광객이 아닌 내부자" 시점 (Pasta Queen의 귀족 가문 정통성과 동일)',
                    '국악뿐 아니라 한국 전통 공예품, 한복, 전통 의례 등 폭넓은 전문 영역',
                  ],
                },
                {
                  title: '자산 2: 방송 진행 10년',
                  items: [
                    '카메라 앞에서 자연스럽다 — 크리에이터 최대 진입장벽 제거됨',
                    '스토리텔링 능력이 검증된 프로페셔널',
                    '말로 사람을 끌어당기는 힘이 있다',
                    '방송 진행자 특유의 리듬감과 전달력',
                  ],
                },
                {
                  title: '자산 3: 강한 에너지 + 심미안',
                  items: [
                    'Pasta Queen의 "Drama" = 대표님의 에너지',
                    '"이건 진짜, 이건 가짜"를 가르는 명확한 기준',
                    '직설적이고 확신 있는 표현 — 취향형 크리에이터의 핵심 연료',
                  ],
                },
              ].map((asset) => (
                <div key={asset.title}>
                  <h4 className="text-xs font-medium text-white/60 mb-2">{asset.title}</h4>
                  <ul className="space-y-2 text-sm text-white/45">
                    {asset.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#3D5A56] mt-0.5">—</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <ComparisonTable
                headers={['Pasta Queen 자산', '대표님 자산']}
                rows={[
                  ['로마 귀족 가문 = 정통성', '국악 20년+ 전공 = 정통성'],
                  ['드라마틱한 목소리 + 유머 = 방송력', '방송 진행자 10년 = 카메라 앞 프로'],
                  ['이탈리아어 섞어 쓰기 = 이국적 매력', '한국어 섞어 쓰기 = 이국적 매력'],
                  ['파스타 = 누구나 아는 이탈리아 상징', '한복, 도자기, 국악 = K-culture의 뿌리'],
                  ['이탈리아 할머니 레시피', '인간문화재 장인을 직접 찾아감'],
                ]}
              />
            </div>
          </CollapsibleSection>

          {/* 4. 포지셔닝 */}
          <CollapsibleSection title="포지셔닝: 한국 전통문화의 The Pasta Queen" icon={Target}>
            <div className="pt-4 space-y-5">
              <div className="bg-[#3D5A56]/10 border border-[#3D5A56]/20 rounded-xl p-4">
                <p className="text-sm text-white/70 italic leading-relaxed">
                  "전 세계 사람들이 K-pop, K-drama로 한국을 알았다면 —<br />
                  이 사람을 통해 한국의 진짜 뿌리를 만난다."
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">포지셔닝 공식</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-1.5 text-sm text-white/50 font-mono">
                  <p>한국 전통문화 전문가 (20년 정통성)</p>
                  <p>+ 프로 방송인의 스토리텔링 (10년 카메라 경험)</p>
                  <p>+ 강한 에너지와 심미안</p>
                  <p>+ 영어 전달</p>
                  <p className="text-[#C4A052] font-medium pt-1">= 한국 전통문화를 세계에 번역하는 유일한 크리에이터</p>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Pasta Queen과의 결정적 차이 (강점)</h4>
                <p className="text-sm text-white/50 leading-relaxed">
                  Pasta Queen은 문화를 '잘 아는 사람'이지만, 대표님은 20년을 전공한 '전문가'.
                  귀족 가문 출신이라 정통성이 있는 것과, 20년을 직접 몸으로 익히고 무대에 선 사람의 정통성은 다릅니다.
                  더 깊고, 더 진짜이며, 더 설명할 수 있는 것이 많습니다.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 5. 콘텐츠 3대 축 */}
          <CollapsibleSection title="콘텐츠 3대 축" icon={Layers}>
            <div className="pt-4 space-y-5">
              {/* 축 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-[#3D5A56] bg-[#3D5A56]/10 px-1.5 py-0.5 rounded">50%</span>
                  <h4 className="text-sm font-medium text-white/70">축 1: "The Real Korea" — 진짜 한국 보여주기</h4>
                </div>
                <p className="text-sm text-white/45 mb-2">
                  글로벌 오디언스가 가장 궁금해하는 것 = K-drama에서 본 한국의 실체. 관광객이 보는 한국이 아니라, 이 문화를 20년 전공한 사람이 보여주는 진짜 한국.
                </p>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— "한복이 실제로 어떻게 만들어지는지 — 장인의 손끝에서"</li>
                  <li>— "한국 전통 결혼식에서 실제로 일어나는 일"</li>
                  <li>— "이 소리를 들어본 적 있나요?" (국악 악기 소개)</li>
                  <li>— "한국에서 가장 오래된 기술을 가진 사람을 만나다" (인간문화재 방문)</li>
                </ul>
              </div>

              {/* 축 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-[#3D5A56] bg-[#3D5A56]/10 px-1.5 py-0.5 rounded">25%</span>
                  <h4 className="text-sm font-medium text-white/70">축 2: "Lost in Translation" — 한국어에만 있는 것들</h4>
                </div>
                <p className="text-sm text-white/45 mb-2">
                  영어로 번역할 수 없는 한국 개념 = 바이럴 콘텐츠의 보물. "영어에 이 단어가 없다"는 검증된 바이럴 포맷.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/30 font-medium py-2 px-2">한국어</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">설명</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">바이럴 포인트</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white/50">
                      {[
                        ['멋', 'style도, beauty도, cool도 아닌 것', '대응 단어 없음 → 궁금증'],
                        ['풍류', '한국 사람이 즐기는 방식', '동양 철학 관심층 공유'],
                        ['정', '한국 사람 사이에 흐르는 것', '관계/감정 콘텐츠 공유 폭발'],
                        ['한', '슬프지만 아름다운 감정', 'K-drama 팬 공감 극대화'],
                        ['흥', '한국 사람의 에너지', 'K-pop과 연결 → 대규모 공유'],
                      ].map((row) => (
                        <tr key={row[0]} className="border-b border-white/[0.03]">
                          <td className="py-2 px-2 text-[#C4A052] font-medium">{row[0]}</td>
                          <td className="py-2 px-2">{row[1]}</td>
                          <td className="py-2 px-2 text-white/35">{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 축 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-[#3D5A56] bg-[#3D5A56]/10 px-1.5 py-0.5 rounded">25%</span>
                  <h4 className="text-sm font-medium text-white/70">축 3: "Korea meets the World" — 전통 x 현대</h4>
                </div>
                <p className="text-sm text-white/45 mb-2">
                  전통이 현재와 만나는 순간. K-pop, K-drama 팬이 가장 많이 반응하는 교차 콘텐츠.
                </p>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— "K-pop 안무에 숨겨진 한국 전통 춤의 DNA"</li>
                  <li>— "한국 드라마 속 진짜 한국 문화 찾기"</li>
                  <li>— "한국 전통 색채가 현대 패션에 들어간 방식"</li>
                  <li>— "왜 전 세계가 갑자기 한국에 열광하는가 — 한국인의 시선으로"</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 6. 콘텐츠 공식 비교 */}
          <CollapsibleSection title="콘텐츠 공식 비교" icon={GitCompare}>
            <div className="pt-4">
              <ComparisonTable
                headers={['Pasta Queen 공식', '대표님 버전']}
                rows={[
                  ['"This is NOT how you make carbonara" (직설 교정형)', '"This is NOT how you wear hanbok" (관광객 한복 체험 vs 진짜 한복)'],
                  ['파스타 만들면서 이탈리아 문화 이야기', '전통 공예품 보여주면서 한국 문화 이야기'],
                  ['"Antonietta the Forchetta" (도구 이름)', '한국어 단어 가르치기 — "이건 \'멋\'이에요. 영어에는 이 단어가 없어요"'],
                  ['"Just gorgeous!" (캐치프레이즈)', '한국어 감탄사 캐치프레이즈 — "아이고~", "이게 바로 \'풍류\'예요"'],
                  ['이탈리아 할머니 레시피', '인간문화재 장인을 직접 찾아감'],
                  ['"Lover of Pasta, Drama and all things Italiana"', '"Lover of Hanbok, Heritage and all things Korean"'],
                ]}
              />
            </div>
          </CollapsibleSection>

          {/* 7. 네이밍 & 캐치프레이즈 */}
          <CollapsibleSection title="네이밍 & 캐치프레이즈" icon={Quote}>
            <div className="pt-4 space-y-5">
              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">채널명 후보</h4>
                <div className="space-y-2">
                  {[
                    { name: 'The Heritage Queen', structure: 'Pasta Queen 직접 차용', feel: '전통문화의 여왕, 강하고 직관적' },
                    { name: 'The Korean Curator', structure: '큐레이터 = 취향 편집자', feel: '문화를 큐레이션하는 사람' },
                    { name: 'The Culture Keeper', structure: '지키는 사람', feel: '천 년의 문화를 지키는 사람의 시선' },
                    { name: 'The Seoul Storyteller', structure: '서울 + 스토리텔러', feel: '방송 경력과 연결. 서울 한정 리스크' },
                    { name: 'The Hanbok Queen', structure: '가장 좁고 강함', feel: '한복에 집중하면 초기 바이럴에 유리' },
                  ].map((item) => (
                    <div key={item.name} className="grid grid-cols-[1fr_1fr_1.5fr] gap-2 bg-white/[0.03] rounded-lg p-3 text-xs">
                      <span className="text-[#C4A052] font-medium">{item.name}</span>
                      <span className="text-white/40">{item.structure}</span>
                      <span className="text-white/35">{item.feel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">캐치프레이즈 후보</h4>
                <div className="space-y-2">
                  {[
                    { phrase: '"This is the real Korea."', context: '진짜 한국을 보여줄 때마다 반복' },
                    { phrase: '"A thousand years of ___."', context: '"of beauty" / "of sound" / "of craft"' },
                    { phrase: '한국어 감탄사 + 영어 설명', context: '"아이고~ this is what Koreans say when..."' },
                    { phrase: '"You can\'t translate this."', context: '한국어에만 있는 개념을 소개할 때' },
                  ].map((item) => (
                    <div key={item.phrase} className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3 text-xs">
                      <span className="text-[#C4A052] font-medium shrink-0">{item.phrase}</span>
                      <span className="text-white/35">{item.context}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#3D5A56]/10 border border-[#3D5A56]/20 rounded-xl p-4">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">바이오 초안</h4>
                <p className="text-sm text-white/70 italic">
                  "Lover of Hanbok, Heritage and all things Korean.<br />
                  20 years of Korean traditional arts. I show you the real Korea."
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 8. 영어 콘텐츠의 전략적 이점 */}
          <CollapsibleSection title="영어 콘텐츠의 전략적 이점" icon={Globe}>
            <div className="pt-4 space-y-4">
              <ComparisonTable
                headers={['한국어 채널', '영어 채널']}
                rows={[
                  ['타깃: 한국인 (5천만)', '타깃: 영어권 (20억+)'],
                  ['K-culture 팬: 한국어 가능한 팬만', '전 세계 K-pop/K-drama 팬 전체'],
                  ['PriveTag 시너지: 제한적', '동남아 호텔 업계 관계자 직접 도달'],
                  ['경쟁 강도: 한국 전통문화 채널 다수', '영어 한국 전통문화 채널 극소수'],
                  ['수익화: 국내 광고, 협찬', '글로벌 브랜드딜, 관광청, Netflix 등'],
                  ['알고리즘 유리: 한국 내 추천', '글로벌 추천 (시장 규모 40배)'],
                ]}
              />
              <div className="bg-[#3D5A56]/10 border border-[#3D5A56]/20 rounded-xl p-4">
                <p className="text-sm text-white/70 italic">
                  "한국어 콘텐츠는 한국인에게 도달하지만,<br />
                  영어로 한국을 말하면 세계에 도달한다."
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">한국어 믹스 전략</h4>
                <p className="text-sm text-white/45 mb-2">
                  Pasta Queen이 영어 사이에 이탈리아어를 자연스럽게 섞듯, 영어 콘텐츠에 한국어를 감성적으로 섞는 것이 핵심.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.03] rounded-lg p-2.5 text-xs">
                    <span className="text-[10px] text-white/30 uppercase block mb-1">감탄사</span>
                    <span className="text-white/50">"아이고~", "대박!", "어머~"</span>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5 text-xs">
                    <span className="text-[10px] text-white/30 uppercase block mb-1">번역 불가</span>
                    <span className="text-white/50">"멋", "정", "풍류", "흥", "한"</span>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5 text-xs">
                    <span className="text-[10px] text-white/30 uppercase block mb-1">문화 용어</span>
                    <span className="text-white/50">"한복", "장인", "인간문화재"</span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 9. 성공 요건 체크리스트 */}
          <CollapsibleSection title="성공 요건 체크리스트" icon={CheckCircle2}>
            <div className="pt-4 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-white/30 font-medium py-2 px-2">성공 요소</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">보유 여부</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">비고</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { element: '정통성 (이 사람이 진짜)', status: '보유', note: '국악 20년, 전통문화 전문가' },
                      { element: '카메라 앞 카리스마', status: '보유', note: '방송 진행 10년' },
                      { element: '글로벌 관심 주제', status: '보유', note: 'K-culture → 전통문화 확장 중' },
                      { element: '영어 소통 능력', status: '확인 필요', note: '핵심 변수. 자연스러운 영어 전달력' },
                      { element: '캐치프레이즈', status: '개발 필요', note: '시그니처 문구 확정 필요' },
                      { element: '일관된 비주얼', status: '개발 필요', note: '피드 톤앤매너 확정 필요' },
                      { element: '지속 가능한 소재', status: '보유', note: '한국 전통문화 = 무한한 소재' },
                    ].map((row) => (
                      <tr key={row.element} className="border-b border-white/[0.03]">
                        <td className="py-2 px-2">{row.element}</td>
                        <td className="py-2 px-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            row.status === '보유' ? 'bg-emerald-500/10 text-emerald-400' :
                            row.status === '확인 필요' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-white/35">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">핵심 변수: 영어 소통</h4>
                <div className="space-y-2">
                  {[
                    { scenario: '영어 유창', strategy: '100% 영어 콘텐츠 + 한국어 믹스', effect: 'Pasta Queen 모델 그대로 적용 가능' },
                    { scenario: '영어 중급', strategy: '한국어 메인 + 영어 자막 + 핵심 영어 멘트', effect: '자막 기반 글로벌 도달. 악센트가 오히려 매력' },
                    { scenario: '영어 초급', strategy: '한국어 콘텐츠 + 영어 자막/더빙', effect: '콘텐츠 질 우선, 글로벌 확장은 단계적' },
                  ].map((item) => (
                    <div key={item.scenario} className="grid grid-cols-[0.7fr_1.3fr_1.5fr] gap-2 bg-white/[0.03] rounded-lg p-3 text-xs">
                      <span className="text-white/60 font-medium">{item.scenario}</span>
                      <span className="text-white/45">{item.strategy}</span>
                      <span className="text-white/35">{item.effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 10. 다음 단계 */}
          <CollapsibleSection title="다음 단계" icon={Rocket}>
            <div className="pt-4 space-y-5">
              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">즉시 결정 필요 사항</h4>
                <div className="space-y-2">
                  {[
                    { step: 1, item: '영어 채널명/핸들 결정', desc: '칭호형 (The ___ Queen) vs 본명형 결정' },
                    { step: 2, item: '영어 바이오 확정', desc: 'Pasta Queen 구조 차용한 3줄 바이오' },
                    { step: 3, item: '캐치프레이즈 확정', desc: '매 콘텐츠에 반복될 시그니처 문구' },
                    { step: 4, item: '비주얼 톤앤매너 확정', desc: '피드 컬러, 편집 스타일, 자막 스타일' },
                    { step: 5, item: '파일럿 스크립트 3편 작성', desc: 'Phase 0 바이럴 진입용 콘텐츠' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3 text-xs">
                      <span className="text-[#3D5A56] font-mono bg-[#3D5A56]/10 w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </span>
                      <div>
                        <span className="text-white/60 font-medium">{s.item}</span>
                        <span className="text-white/35 ml-2">{s.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Phase 0 파일럿 콘텐츠 (안)</h4>
                <div className="space-y-2">
                  {[
                    { num: 1, title: '"This is NOT how you wear hanbok"', desc: '관광객 한복 체험 vs 진짜 한복의 차이. 직설적 교정 + 아름다운 비주얼' },
                    { num: 2, title: '"A sound you\'ve never heard"', desc: '국악 악기 하나를 소개. 소리의 충격 + 20년 전공자의 설명' },
                    { num: 3, title: '"You can\'t translate this word"', desc: '"멋" 또는 "정" 설명. 한국어에만 있는 개념 → 댓글/공유 폭발' },
                  ].map((item) => (
                    <div key={item.num} className="bg-white/[0.03] rounded-xl p-4 border-l-2 border-[#3D5A56]/40">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-[#3D5A56]">영상 {item.num}</span>
                        <span className="text-sm text-white/70 font-medium">{item.title}</span>
                      </div>
                      <p className="text-sm text-white/40">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#3D5A56]/10 border border-[#3D5A56]/20 rounded-xl p-5">
                <p className="text-sm text-white/70 italic leading-relaxed">
                  "Pasta Queen이 이탈리아 파스타로 했던 것을,<br />
                  대표님은 한국 전통문화로 할 수 있습니다.<br /><br />
                  그리고 시장 타이밍은 지금이 더 좋습니다 —<br />
                  전 세계가 K-culture 다음 단계로 한국의 뿌리를 원하고 있고,<br />
                  영어로 그걸 진정성 있게 전달하는 크리에이터가 아직 없습니다.<br /><br />
                  20년 전공 + 10년 방송력.<br />
                  이것은 Pasta Queen의 귀족 가문 정통성 + 드라마틱 캐릭터와<br />
                  정확히 대응됩니다. 아니, 더 강력합니다."
                </p>
              </div>
            </div>
          </CollapsibleSection>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
