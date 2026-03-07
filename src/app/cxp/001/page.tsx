'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Film,
  Camera,
  Scissors,
  Upload,
  BarChart3,
  Layers,
  Clock,
  MapPin,
  Mic,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { Footer } from '@/components/layout/Footer';

// 접을 수 있는 섹션 컴포넌트
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

export default function CXP001Page() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 뒤로가기 + 헤더 */}
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
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#C4A052]/10 text-[#C4A052] border border-[#C4A052]/20">
              #001
            </span>
            <span className="text-sm text-white/40">축 3 — Korea meets the World</span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Film className="w-3 h-3" />
              릴스 / 틱톡 숏폼
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-light text-white/90 tracking-tight mb-2"
            style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
          >
            K-Drama Hanbok Fact-Check
          </h1>
          <p className="text-sm text-white/50">
            K-드라마 속 한복 장면을 20년 전공자의 눈으로 감별 — "진짜는 이렇게 아름답다"를 보여주는 교정형 콘텐츠
          </p>

          {/* 메타 정보 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: '타깃 길이', value: 'TT 18초 / IG 22초', icon: Clock },
              { label: '언어', value: '영어 (한국어 믹스)', icon: Mic },
              { label: '상태', value: '기획 완료 — 촬영 준비 필요', icon: Layers },
              { label: '타깃 장면', value: '환혼 시즌1', icon: Film },
            ].map((meta) => (
              <div
                key={meta.label}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <meta.icon className="w-3 h-3 text-white/30" />
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">{meta.label}</span>
                </div>
                <p className="text-xs text-white/70 font-medium">{meta.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 콘셉트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          {/* 콘셉트 섹션 */}
          <CollapsibleSection title="콘셉트" icon={Layers} defaultOpen={true}>
            <div className="pt-4 space-y-4">
              <p className="text-[15px] text-white/60 leading-relaxed">
                K-드라마 속 한복 장면을 20년 전공자의 눈으로 감별한다.
                "틀렸다"고 비난하는 게 아니라, <span className="text-[#C4A052]">"진짜는 이렇게 아름답다"</span>를 보여주는 교정형 콘텐츠.
              </p>
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">왜 이 소재인가</h4>
                <ul className="space-y-1.5 text-sm text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A052] mt-0.5">—</span>
                    환혼: Netflix 글로벌 6억뷰+, 외국인 팬덤 활발
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A052] mt-0.5">—</span>
                    한복 착장 오류는 전공자만 잡아낼 수 있음 = 대표님만의 콘텐츠
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A052] mt-0.5">—</span>
                    "This is NOT how you..." 포맷은 Pasta Queen 검증 공식
                  </li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 스크립트 */}
          <CollapsibleSection title="스크립트" icon={Film}>
            <div className="pt-4 space-y-6">
              {/* 틱톡 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                  틱톡 버전 (18초)
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      time: '0-2초',
                      label: '충격 후킹',
                      screen: '환혼 드라마 장면 캡처 (한복 착장 클로즈업)',
                      subtitle: '"If you saw this in a K-drama — you were lied to."',
                      note: '텍스트 + 드라마 원본 사운드 (멘트 없음)',
                    },
                    {
                      time: '2-4초',
                      label: 'Authority Hook',
                      screen: '대표님 정면 (한복, 확신에 찬 표정)',
                      subtitle: '"I studied Korean traditional arts for 20 years. This is wrong."',
                    },
                    {
                      time: '4-12초',
                      label: '해독 + 시연',
                      screen: '드라마 빨간 원 표시 → 대표님 고름 시연 → 디테일 컷 교차',
                      subtitle: '"The goreum — this ribbon — was tied like this. Tight. Precise."',
                      note: '디테일 컷 1.2초씩: 손가락 극접사 → 천 질감 → 매듭 완성. 자막: GOREUM / JOSEON / 500 YEARS',
                    },
                    {
                      time: '12-16초',
                      label: '의외성 한 방',
                      screen: '완성된 한복 착장 풀샷',
                      subtitle: '"This ribbon isn\'t decoration. In Joseon dynasty, it showed your status, your family, and whether you were married."',
                    },
                    {
                      time: '16-18초',
                      label: '캐치프레이즈',
                      screen: '대표님 클로즈업',
                      subtitle: '"This is the real Korea."',
                    },
                  ].map((scene) => (
                    <div
                      key={scene.time}
                      className="bg-white/[0.03] rounded-xl p-4 border-l-2 border-[#C4A052]/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded">
                          {scene.time}
                        </span>
                        <span className="text-xs font-medium text-white/60">{scene.label}</span>
                      </div>
                      <p className="text-xs text-white/40 mb-1">
                        <span className="text-white/30">화면:</span> {scene.screen}
                      </p>
                      <p className="text-sm text-white/70 italic">{scene.subtitle}</p>
                      {scene.note && (
                        <p className="text-[10px] text-white/30 mt-1">{scene.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 릴스 버전 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                  인스타 릴스 버전 (22초)
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      time: '0-2초',
                      label: '충격 후킹',
                      text: '(동일)',
                    },
                    {
                      time: '2-4초',
                      label: 'Authority Hook',
                      text: '(동일)',
                    },
                    {
                      time: '4-14초',
                      label: '해독 + 시연 확장',
                      text: '"The goreum — this ribbon — was tied like this. Tight. Precise. Every fold carries 500 years of meaning. This isn\'t costume. This is identity."',
                    },
                    {
                      time: '14-18초',
                      label: '의외성 확장',
                      text: '"This ribbon isn\'t decoration. In Joseon dynasty, it told everyone your status, your family, your age. One look — Koreans knew everything."',
                    },
                    {
                      time: '18-20초',
                      label: '마무리',
                      text: '"A thousand years of detail. And it\'s still here."',
                    },
                    {
                      time: '20-22초',
                      label: '캐치프레이즈',
                      text: '"This is the real Korea."',
                    },
                  ].map((scene) => (
                    <div
                      key={scene.time}
                      className="bg-white/[0.03] rounded-xl p-4 border-l-2 border-[#C4A052]/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded">
                          {scene.time}
                        </span>
                        <span className="text-xs font-medium text-white/60">{scene.label}</span>
                      </div>
                      <p className="text-sm text-white/70 italic">{scene.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 촬영 체크리스트 */}
          <CollapsibleSection title="촬영 체크리스트" icon={Camera}>
            <div className="pt-4 space-y-5">
              {/* 사전 준비 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">사전 준비</h4>
                <div className="space-y-2">
                  {[
                    '환혼 해당 장면 타임스탬프 특정 및 캡처 (페어유즈 범위 확인)',
                    '한복 준비 — 드라마와 유사한 시대/스타일의 한복',
                    '고름 매기 시연용 소품 (필요시 별도 고름 리본)',
                    '촬영 장소 확보',
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 text-xs text-white/50 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-[#C4A052] focus:ring-[#C4A052]/50" />
                      <span className="group-hover:text-white/70 transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 촬영 장소 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  촬영 장소 옵션
                </h4>
                <div className="grid gap-2">
                  {[
                    { rank: 1, place: '한옥 배경 (자연광)', note: '가장 이상적' },
                    { rank: 2, place: '깔끔한 단색 벽 앞', note: '미니멀, 대표님에게 집중' },
                    { rank: 3, place: '전통 공방/작업실', note: '있는 그대로의 진정성' },
                  ].map((loc) => (
                    <div key={loc.rank} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
                      <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 w-5 h-5 rounded flex items-center justify-center">
                        {loc.rank}
                      </span>
                      <span className="text-sm text-white/60">{loc.place}</span>
                      <span className="text-[10px] text-white/30 ml-auto">{loc.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 촬영 장비 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">촬영 장비</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    '스마트폰 (세로 9:16 고정)',
                    '삼각대 또는 거치대',
                    '자연광 우선 / 링라이트',
                    '외장 마이크 (핀 or 숏건)',
                  ].map((item, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg p-2.5 text-xs text-white/50">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* 컷 리스트 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">컷 리스트</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/30 font-medium py-2 px-2">컷</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">내용</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">프레이밍</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">비고</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white/50">
                      {[
                        { cut: 'A1', content: '"But this?" 멘트', frame: '바스트샷', note: '살짝 고개 갸우뚱' },
                        { cut: 'A2', content: '고름 매기 시연 — 손 동작', frame: '핸드 클로즈업', note: '천천히, 정교하게' },
                        { cut: 'A3', content: '고름 매기 — 설명하면서', frame: '미디엄샷', note: '손과 얼굴 동시' },
                        { cut: 'A4', content: '완성된 착장 — 정면', frame: '풀샷', note: '자신감, 당당한 자세' },
                        { cut: 'A5', content: '고름 디테일', frame: '극접사', note: '매듭 정교함 강조' },
                        { cut: 'A6', content: '캐치프레이즈', frame: '클로즈업', note: '카메라 정면 응시' },
                      ].map((row) => (
                        <tr key={row.cut} className="border-b border-white/[0.03]">
                          <td className="py-2 px-2 font-mono text-[#C4A052]">{row.cut}</td>
                          <td className="py-2 px-2">{row.content}</td>
                          <td className="py-2 px-2 text-white/40">{row.frame}</td>
                          <td className="py-2 px-2 text-white/30">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 촬영 순서 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">촬영 순서 (효율)</h4>
                <div className="space-y-2">
                  {[
                    { step: 1, desc: '한복 착용 완료 → A4 (풀샷) → A6 (캐치프레이즈) → A3 (설명)' },
                    { step: 2, desc: '고름 풀고 → A2 (손 클로즈업 시연) 반복 촬영 2-3회' },
                    { step: 3, desc: 'A5 (디테일 컷) 마지막에 여유있게' },
                    { step: 4, desc: 'A1 (후킹 멘트) 에너지 높을 때 — 처음 또는 마지막' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3 text-xs">
                      <span className="text-[#C4A052] font-mono bg-[#C4A052]/10 w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </span>
                      <span className="text-white/50">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 편집 가이드 */}
          <CollapsibleSection title="편집 가이드" icon={Scissors}>
            <div className="pt-4 space-y-5">
              {/* 틱톡 편집 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡 편집</h4>
                <ul className="space-y-2 text-sm text-white/50">
                  <li>— 컷 전환: 빠르게 (1.5-2초 단위)</li>
                  <li>— 드라마 캡처 → 대표님 전환 시 "스와이프" 또는 "줌인" 트랜지션</li>
                  <li>— 텍스트: 큰 폰트, 화면 중앙 상단, 흰색 + 그림자</li>
                  <li>— 키워드 강조 (Goreum, Joseon 등은 색상 변경)</li>
                </ul>
              </div>

              {/* 릴스 편집 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스 편집</h4>
                <ul className="space-y-2 text-sm text-white/50">
                  <li>— 컷 전환: 틱톡보다 0.5초씩 여유</li>
                  <li>— 브랜드 컬러 틸(#3D5A56) 활용, 세리프 폰트</li>
                  <li>— 자체 오디오만 (트렌드 사운드 사용 안 함)</li>
                  <li>— 마지막 프레임: 2초간 정지 — "This is the real Korea." + 계정명</li>
                </ul>
              </div>

              {/* 공통 */}
              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">공통 주의사항</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— 워터마크/로고: 넣지 않음 (Phase 0 — 콘텐츠 자체에 집중)</li>
                  <li>— 필터: 없음 또는 최소한 — 한복 색감 왜곡 금지</li>
                  <li>— 배경음악: 전통 악기 잔잔한 선율 (저작권 프리) 또는 무음</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 업로드 세팅 */}
          <CollapsibleSection title="업로드 세팅" icon={Upload}>
            <div className="pt-4 space-y-5">
              {/* 틱톡 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic">
                      "This Korean drama has 600M views. But they got the hanbok wrong.
                      I studied Korean traditional arts for 20 years — here's what it really looks like."
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#hanbok', '#koreandrama', '#hwanhon', '#koreanculture', '#traditionalkorea', '#kdrama', '#netflix'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
                    <div>댓글: ON</div>
                    <div>듀엣: ON</div>
                    <div>스티치: ON</div>
                    <div>시간: 화 EST 19:00</div>
                  </div>
                </div>
              </div>

              {/* 인스타 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                      &ldquo;This is NOT how you wear hanbok.&rdquo;
                      <br /><br />
                      Every fold. Every knot. Every layer carries centuries of meaning.
                      <br /><br />
                      Korean dramas show you the beauty — but sometimes miss the truth.
                      I spent 20 years learning the real thing. Let me show you.
                      <br /><br />
                      What K-drama scene should I fact-check next? Drop it below.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
                    <div>커버: A4 컷 풀샷</div>
                    <div>위치: Seoul</div>
                    <div>시간: 수 EST 12:00</div>
                    <div>스토리 동시 공유 + 투표 스티커</div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 성과 측정 */}
          <CollapsibleSection title="성과 측정 기준" icon={BarChart3}>
            <div className="pt-4 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-white/30 font-medium py-2 px-2">지표</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">목표</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">측정 시점</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { metric: '틱톡 조회수', target: '1,000+', when: '48시간' },
                      { metric: '틱톡 완주율', target: '40%+', when: '48시간' },
                      { metric: '인스타 3초 유지율', target: '50%+', when: '48시간' },
                      { metric: '저장 비율', target: '좋아요 대비 15%+', when: '1주' },
                      { metric: '댓글', target: '"다음에 뭐 해줘" 요청 3건+', when: '1주' },
                    ].map((row) => (
                      <tr key={row.metric} className="border-b border-white/[0.03]">
                        <td className="py-2 px-2">{row.metric}</td>
                        <td className="py-2 px-2 text-[#C4A052]">{row.target}</td>
                        <td className="py-2 px-2 text-white/30">{row.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">반응 기반 다음 편 결정</h4>
                <ul className="space-y-2 text-sm text-white/40">
                  <li>— 댓글에서 가장 많이 요청된 드라마/장면 → 시리즈 2편 소재</li>
                  <li>— 완주율 40% 미달 시 → 후킹 3초 구간 재편집 후 재업로드 테스트</li>
                  <li>— 저장 비율 높으면 → 교육형 콘텐츠 수요 확인, 캐러셀 심화편 제작</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 시리즈 확장 */}
          <CollapsibleSection title="시리즈 확장 후보" icon={Layers}>
            <div className="pt-4">
              <p className="text-xs text-white/40 mb-3">
                이 포맷이 반응을 얻으면 시리즈화 — <span className="text-white/60">"Real or Drama?"</span> 또는 <span className="text-white/60">"K-Drama vs Real Korea"</span>
              </p>
              <div className="space-y-2">
                {[
                  { ep: 2, drama: '킹덤', point: '갓 착용법 — 신분에 따른 차이' },
                  { ep: 3, drama: '슈룹', point: '왕비 예복 — 대례복의 실제 무게와 착장 시간' },
                  { ep: 4, drama: '미스터 션샤인', point: '개화기 한복 — 서양 복식과의 충돌' },
                  { ep: 5, drama: '블랙핑크 MV', point: 'K-pop 속 개량 한복 — 전통과 얼마나 다른가' },
                ].map((item) => (
                  <div key={item.ep} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
                    <span className="text-[10px] font-mono text-white/30 bg-white/[0.05] w-5 h-5 rounded flex items-center justify-center">
                      {item.ep}
                    </span>
                    <span className="text-sm text-white/60 font-medium">{item.drama}</span>
                    <span className="text-xs text-white/35 ml-auto">{item.point}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
