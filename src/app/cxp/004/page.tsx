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
  Mic,
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

export default function CXP004Page() {
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
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#C4A052]/10 text-[#C4A052] border border-[#C4A052]/20">
              #004
            </span>
            <span className="text-sm text-white/40">축 1 + 축 2 — The Real Korea + Lost in Translation</span>
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
            My Teacher Watched My Bow Before She Heard Me Play
          </h1>
          <p className="text-sm text-white/50">
            국악 수업 첫날 악기 대신 절부터 가르친 이유 — 한국 예절의 뿌리를 개인 경험으로
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: '타깃 길이', value: 'TT 22초 / IG 28초', icon: Clock },
              { label: '언어', value: '영어 (한국어 믹스)', icon: Mic },
              { label: '상태', value: '기획 완료 — 대표님 단독 촬영 가능', icon: Layers },
              { label: '시리즈 위치', value: '전환 에피소드', icon: Film },
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          {/* 콘셉트 */}
          <CollapsibleSection title="콘셉트" icon={Layers} defaultOpen={true}>
            <div className="pt-4 space-y-4">
              <p className="text-[15px] text-white/60 leading-relaxed">
                한국 전통예술 수련 과정에서 체득한 예(禮)의 본질을 개인 경험으로 풀어낸다.
                <span className="text-[#C4A052]"> 국악 수업 첫날, 선생님이 악기를 만지게 하기 전에 절하는 법부터 가르쳤다.</span>
                &quot;절이 안 되면 소리도 안 된다&quot; — 이것이 한국 전통예술의 철학.
              </p>

              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">002와의 관계</h4>
                <ul className="space-y-1.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>002(현상): &quot;한국인은 절의 미세한 차이를 읽는다&quot;</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>004(원인): &quot;왜 읽을 수 있는가 — 어릴 때부터 이렇게 배웠으니까&quot;</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>002가 K-드라마 장면 해독이라면, 004는 <strong>나 자신의 수련 이야기</strong></li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>시리즈에서 가장 개인적이고 깊은 에피소드</li>
                </ul>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">왜 이 접근인가</h4>
                <ul className="space-y-1.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>수련자 톤 (&quot;나는 이렇게 배웠다&quot;) — 가장 진정성 있는 포지션</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>&quot;절 = 자신을 비우는 행위&quot;라는 철학적 깊이</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>6살부터의 수련 경험 = 대체 불가능한 콘텐츠</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>전환(conversion) 에피소드 — &quot;이 사람은 진짜다. 팔로우&quot; 결정 포인트</li>
                </ul>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">톤</h4>
                <p className="text-sm text-white/50">
                  시리즈에서 가장 개인적이고 깊은 에피소드. No BGM — <span className="text-[#C4A052]">정적이 음악이다.</span> 유머 없음. 텍스트 팝업 없음. 오직 숨결과 여운.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 스크립트 */}
          <CollapsibleSection title="스크립트" icon={Film}>
            <div className="pt-4 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡 버전 (22초)</h4>
                <div className="space-y-3">
                  {[
                    { time: '0-2초', label: '충격 후킹', screen: '대표님 정면 (한복, 진지한 표정)', subtitle: '"I wasn\'t allowed to touch an instrument for three months."', note: '담백, 충격 — 짧은 pause' },
                    { time: '2-4초', label: 'Authority Hook', screen: '대표님 (표정 변화 — 회상)', subtitle: '"I was six. First day of traditional arts training. 20 years ago."', note: '회상, 권위' },
                    { time: '4-8초', label: '반전', screen: '대표님 (약간의 미소)', subtitle: '"My teacher didn\'t teach me music. She taught me how to bow."', note: '반전의 핵심' },
                    { time: '8-14초', label: '핵심 — 왜?', screen: '대표님 절 시연 (측면, 천천히) + 정면 설명 교차', subtitle: '"Every class — before I played a single note — she watched my 절. How I went down. How long I stayed. How I came back up. If my bow wasn\'t right, she\'d say: \'오늘은 소리가 안 나올 거야.\' \'Your sound won\'t come out today.\'"', note: '절 시연 삽입 — 내려가고, 머무르고, 올라오는 과정' },
                    { time: '14-18초', label: '의외성 한 방', screen: '대표님 정면 (클로즈업으로 서서히)', subtitle: '"She was always right. Because 절 is not about bending your body. It\'s about emptying yourself before you receive something. If you can\'t bow, you can\'t hear the music."', note: '가장 느린 구간' },
                    { time: '18-20초', label: '전문가 확인', screen: '대표님 클로즈업 (눈빛)', subtitle: '"20 years later — she was right about everything."', note: '짧고 강한 확인' },
                    { time: '20-22초', label: '캐치프레이즈', screen: '대표님 클로즈업 (정면 응시, 단호)', subtitle: '"Koreans read your bow before they hear your words. This is the real Korea."', note: '정면 응시' },
                  ].map((scene) => (
                    <div key={scene.time} className="bg-white/[0.03] rounded-xl p-4 border-l-2 border-[#C4A052]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded">{scene.time}</span>
                        <span className="text-xs font-medium text-white/60">{scene.label}</span>
                      </div>
                      <p className="text-xs text-white/40 mb-1"><span className="text-white/30">화면:</span> {scene.screen}</p>
                      <p className="text-sm text-white/70 italic">{scene.subtitle}</p>
                      {scene.note && <p className="text-[10px] text-white/30 mt-1">{scene.note}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스 버전 (28초) — 확장</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[0-2초]</span> 충격 후킹 (동일)
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[2-4초]</span> Authority Hook (동일)
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[4-8초]</span> 반전 확장 — &quot;My teacher didn&apos;t teach me music. No gayageum. No drum. No song. For three months — just how to bow.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[8-16초]</span> 핵심 확장 — 절 시연 슬로모션 + &quot;Every single class — she watched my 절 first... Whether my breath was steady... If something was off: &apos;오늘은 소리가 안 나올 거야.&apos; And she was right. Every single time.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[16-22초]</span> 의외성 확장 — &quot;It took me years to understand why. 절 is not about bending your body... If you can&apos;t empty yourself in a bow, you can&apos;t empty yourself to hear the music. The instrument knows. The teacher knows. 한국 사람은 다 알아요.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[22-24초]</span> 전문가 확인 — &quot;20 years later — she was right about everything.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[24-26초]</span> 브릿지 — &quot;That&apos;s why in Korea, your bow speaks louder than your words.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[26-28초]</span> 캐치프레이즈 — &quot;I still bow first. Every single day. This is the real Korea.&quot;
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 멘트 가이드 */}
          <CollapsibleSection title="멘트 상세 — 발화 가이드" icon={Mic}>
            <div className="pt-4 space-y-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-white/30 font-medium py-2 px-2">구간</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">톤</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">속도</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">감정</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { section: '충격 후킹 (0-2초)', tone: '담백, 충격', speed: '느리게', emotion: '"3개월 동안 악기 금지"' },
                      { section: 'Authority Hook (2-4초)', tone: '회상, 권위', speed: '보통', emotion: '"6살, 20년 전"' },
                      { section: '반전 (4-8초)', tone: '살짝 놀라운', speed: '보통', emotion: '"악기 대신 절을 배웠다"' },
                      { section: '핵심 (8-14초)', tone: '스승의 목소리를 빌림', speed: '천천히', emotion: '경외 + 그리움' },
                      { section: '의외성 (14-18초)', tone: '깊고 확신에 찬', speed: '천천히', emotion: '"비울 수 없으면 들을 수 없다"' },
                      { section: '캐치프레이즈 (20-22초)', tone: '단호 + 여운', speed: '천천히', emotion: '정면 응시' },
                    ].map((row) => (
                      <tr key={row.section} className="border-b border-white/[0.03]">
                        <td className="py-2 px-2 text-white/60">{row.section}</td>
                        <td className="py-2 px-2">{row.tone}</td>
                        <td className="py-2 px-2 text-white/40">{row.speed}</td>
                        <td className="py-2 px-2 text-white/40">{row.emotion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 mb-2">톤 차이 (다른 편 대비)</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>001: 해독자 (&quot;이건 틀렸어&quot;)</li>
                  <li>002: 분석가 (&quot;한국인은 이걸 읽었다&quot;)</li>
                  <li>003: 연결자 (&quot;이게 진짜야&quot;)</li>
                  <li className="text-[#C4A052]">004: 수련자 (&quot;나는 이렇게 배웠다&quot;) — 가장 개인적이고 깊은 편</li>
                </ul>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 mb-2">한국어 믹스 포인트</h4>
                <div className="space-y-2 text-sm text-white/50">
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">절 (jeol)</span><span className="text-white/40">영어 &quot;bow&quot;로 번역 불가 — 자신을 비우는 행위의 깊이</span></div>
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">&quot;오늘은 소리가 안 나올 거야&quot;</span><span className="text-white/40">선생님의 원문 — 한국어로 말하는 순간의 무게감</span></div>
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">한국 사람은 다 알아요</span><span className="text-white/40">릴스 확장판 마무리 — 한국어 전환의 진정성</span></div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 촬영 체크리스트 */}
          <CollapsibleSection title="촬영 체크리스트" icon={Camera}>
            <div className="pt-4 space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">사전 준비</h4>
                <div className="space-y-2">
                  {[
                    '한복 준비 (전통예술 수련의 맥락)',
                    '촬영 장소 확보 (001, 002와 동일 장소 가능)',
                    '절 시연 준비 — "진심 절" 1가지만 (비교가 아닌 완벽한 절 하나)',
                    '호흡 타이밍 체크 — 정적 구간에서 숨결이 자연스럽게 들리도록',
                    '대표님 단독 촬영 — 별도 섭외 불필요',
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 text-xs text-white/50 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-[#C4A052] focus:ring-[#C4A052]/50" />
                      <span className="group-hover:text-white/70 transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">001/002/004 같은 날 촬영</h4>
                <p className="text-sm text-white/50">001(45분) → 002(40분) → 004(30분) = 총 약 2시간</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">컷 리스트 (F1-F8)</h4>
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
                        { cut: 'F1', content: '후킹/회상 멘트', frame: '미디엄, 정면', note: '회상하는 눈빛' },
                        { cut: 'F2', content: '반전 ("didn\'t let me touch")', frame: '미디엄, 정면', note: '살짝 미소' },
                        { cut: 'F3', content: '절 시연 — 천천히, 완벽하게 하나', frame: '풀샷, 측면', note: '슬로모션 옵션' },
                        { cut: 'F4', content: '절 중 "머무는 순간" — 바닥에 엎드린 상태', frame: '풀샷 측면 + 정면', note: '정적, 호흡 소리만' },
                        { cut: 'F5', content: '선생님 대사 인용', frame: '미디엄, 정면', note: '한국어 발화' },
                        { cut: 'F6', content: '"emptying yourself" 철학', frame: '클로즈업 (서서히)', note: '깊은 톤' },
                        { cut: 'F7', content: '캐치프레이즈', frame: '클로즈업', note: '정면 응시' },
                        { cut: 'F8', content: '절 완성 후 일어나는 순간', frame: '풀샷, 측면', note: '여운' },
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

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">촬영 포인트</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— F3, F4가 핵심 — 절의 &quot;머무는 시간&quot;이 비주얼 킬링 파트. F4에서 호흡 소리가 들리면 최고.</li>
                  <li>— 001/002/004 같은 날 3편 연속 촬영 가능: 001(45분) → 002(40분) → 004(30분) = 총 약 2시간</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 편집 가이드 */}
          <CollapsibleSection title="편집 가이드" icon={Scissors}>
            <div className="pt-4 space-y-5">
              <p className="text-sm text-white/60">
                편집 키워드: <span className="text-[#C4A052]">정적과 여운</span>. 느린 호흡, 텍스트 팝업 없음, BGM 없음, 유머 없음. 정적이 음악이다.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-white/30 font-medium py-2 px-2">구간</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">편집</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">오디오</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { section: '0-2초', visual: '대표님 정면, 한복', audio: '음성만, BGM 없음' },
                      { section: '2-4초', visual: '대표님 정면, 한 컷 유지', audio: '음성만' },
                      { section: '4-8초', visual: '대표님 (한 컷 유지)', audio: '음성만' },
                      { section: '8-14초 (핵심)', visual: '절 시연 인서트 ↔ 대표님', audio: '음성 + 옷감/호흡 소리' },
                      { section: '14-18초', visual: '클로즈업으로 서서히', audio: '음성만, 완전 정적' },
                      { section: '18-22초', visual: '대표님 클로즈업 → 페이드 아웃', audio: '음성 → 2초 정적으로 마무리' },
                    ].map((row) => (
                      <tr key={row.section} className="border-b border-white/[0.03]">
                        <td className="py-2 px-2 text-white/60">{row.section}</td>
                        <td className="py-2 px-2">{row.visual}</td>
                        <td className="py-2 px-2 text-white/40">{row.audio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">절대 하지 말 것</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— BGM — 이 편은 정적이 음악. 음악 넣으면 진정성 파괴</li>
                  <li>— 텍스트 팝업/이모지 — 격이 떨어짐</li>
                  <li>— 빠른 컷 — 이 편의 호흡은 절의 호흡과 같아야 함</li>
                  <li>— 유머 — 이 편에는 유머 없음. 진지함이 힘</li>
                </ul>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">유일하게 넣을 텍스트</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— 선생님 한국어 대사의 영어 번역 자막</li>
                  <li>— 마지막 &quot;This is the real Korea&quot;</li>
                  <li>— 그 외 텍스트 오버레이 최소화</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 업로드 세팅 */}
          <CollapsibleSection title="업로드 세팅" icon={Upload}>
            <div className="pt-4 space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                      My first day learning Korean traditional arts. I was six.
                      <br />
                      I expected to play music.
                      <br /><br />
                      My teacher didn&apos;t let me touch an instrument for three months.
                      <br />
                      She taught me how to bow.
                      <br /><br />
                      20 years later — I understand why.
                      <br /><br />
                      절 is not about bending your body.
                      <br />
                      It&apos;s about emptying yourself before you receive something.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#koreanculture', '#jeol', '#koreanbow', '#koreanheritage', '#traditionalarts', '#therealkorea', '#koreanwisdom'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">고정 댓글</h4>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    &quot;오늘은 소리가 안 나올 거야.&quot;
                    <br />
                    &quot;Your sound won&apos;t come out today.&quot;
                    <br /><br />
                    My teacher said this every time my bow wasn&apos;t right.
                    <br />
                    And she was right. Every single time.
                    <br /><br />
                    What&apos;s the most important thing YOUR teacher ever taught you?
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                      She didn&apos;t let me touch an instrument for three months.
                      <br /><br />
                      I was six. First day of Korean traditional arts training.
                      <br />
                      I came to learn music. She taught me how to bow.
                      <br /><br />
                      Every class — before a single note — she watched my 절 first.
                      <br />
                      How I went down. How long I stayed. Whether my breath was steady.
                      <br /><br />
                      If something was off:
                      <br />
                      &quot;오늘은 소리가 안 나올 거야.&quot;
                      <br />
                      &quot;Your sound won&apos;t come out today.&quot;
                      <br /><br />
                      She was always right.
                      <br /><br />
                      It took me years to understand.
                      <br />
                      절 is not about bending your body.
                      <br />
                      It&apos;s about emptying yourself before you receive something.
                      <br /><br />
                      If you can&apos;t empty yourself in a bow,
                      <br />
                      you can&apos;t empty yourself to hear the music.
                      <br /><br />
                      That&apos;s why in Korea, your bow speaks before your words.
                      <br />
                      That&apos;s why Koreans read your bow before they listen.
                      <br /><br />
                      20 years later, I still bow first.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#koreanheritage', '#jeol', '#koreanculture', '#therealkorea', '#traditionalarts', '#koreanwisdom', '#koreanbowing'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">스토리 시퀀스</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                  {[
                    { num: '1', content: '텍스트 — "What did your teacher teach you BEFORE they taught you your craft?"' },
                    { num: '2', content: 'Q&A 스티커 — 응답 유도' },
                    { num: '3', content: '릴스 공유 — "My answer."' },
                    { num: '4', content: '절 시연 3초 (F4 — 바닥에 머무는 순간) — "This silence taught me everything."' },
                  ].map((story) => (
                    <div key={story.num} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="text-[#C4A052] font-mono text-xs shrink-0">스토리 {story.num}:</span>
                      <span>{story.content}</span>
                    </div>
                  ))}
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
                      <th className="text-left text-white/30 font-medium py-2 px-2">비고</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { metric: '틱톡 조회수', target: '2,000+', note: '니치하지만 깊은 반응' },
                      { metric: '완주율', target: '55%+', note: '스토리텔링 구조 = 끝까지 들어야 함' },
                      { metric: '저장', target: '좋아요 대비 35%+', note: '"이건 기억해야 해" 콘텐츠' },
                      { metric: '공유', target: '도달 대비 3%+', note: '감동 공유' },
                      { metric: '댓글', target: '개인 경험 공유형 5건+', note: '"My teacher also..."' },
                    ].map((row) => (
                      <tr key={row.metric} className="border-b border-white/[0.03]">
                        <td className="py-2 px-2">{row.metric}</td>
                        <td className="py-2 px-2 text-[#C4A052]">{row.target}</td>
                        <td className="py-2 px-2 text-white/30">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">핵심 지표: 저장 + 팔로우 전환</h4>
                <p className="text-sm text-white/50">
                  004는 조회수보다 <span className="text-[#C4A052]">저장율과 팔로우 전환</span>이 핵심.
                  &quot;이 사람은 진짜다&quot;는 느낌이 들면 → 팔로우 결정.
                  시리즈의 전환(conversion) 에피소드 역할.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 시리즈 포지션 */}
          <CollapsibleSection title="시리즈 포지션" icon={Layers}>
            <div className="pt-4 space-y-4">
              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">4편 크로스 전략</h4>
                <div className="space-y-1.5 text-sm text-white/50">
                  <p>001 한복 팩트체크 — &quot;이 채널 뭐지? 재밌네&quot; (<span className="text-[#C4A052]">발견</span>)</p>
                  <p>002 절 해독 — &quot;한국인은 이렇게 읽는구나&quot; (<span className="text-[#C4A052]">신뢰</span>)</p>
                  <p>003 대취타 — BTS 팬덤에서 대량 유입 (<span className="text-[#C4A052]">트래픽</span>)</p>
                  <p>004 절의 철학 — &quot;이 사람은 진짜다. 팔로우&quot; (<span className="text-[#C4A052]">전환</span>)</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { ep: '001', title: '한복 팩트체크', hook: '"재밌네"', role: '발견' },
                  { ep: '002', title: '절 해독', hook: '"한국인 시선 신기하다"', role: '신뢰' },
                  { ep: '003', title: '대취타', hook: 'BTS 팬덤 대량 유입', role: '트래픽' },
                  { ep: '004', title: '절의 철학', hook: '"이 사람 진짜다. 팔로우"', role: '전환', active: true },
                ].map((item) => (
                  <div key={item.ep} className={`flex items-center gap-3 rounded-lg p-3 ${item.active ? 'bg-[#C4A052]/10 border border-[#C4A052]/20' : 'bg-white/[0.03]'}`}>
                    <span className={`text-[10px] font-mono w-8 h-5 rounded flex items-center justify-center ${item.active ? 'text-[#C4A052] bg-[#C4A052]/20' : 'text-white/30 bg-white/[0.05]'}`}>
                      {item.ep}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${item.active ? 'text-[#C4A052]' : 'text-white/60'}`}>{item.title}</span>
                      <span className="text-[10px] text-white/25 ml-2 uppercase">{item.role}</span>
                    </div>
                    <span className="text-xs text-white/35 italic hidden sm:block">{item.hook}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">002 → 004 연결 장치</h4>
                <p className="text-sm text-white/50">
                  002 캡션 또는 고정 댓글에:
                  <br />
                  <span className="text-[#C4A052] italic">&quot;How did I learn to read all this? Next video.&quot;</span>
                  <br />
                  → 004로 자연스러운 유도
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 캐러셀 후속편 */}
          <CollapsibleSection title="캐러셀 후속편 (인스타 전용)" icon={Layers}>
            <div className="pt-4 space-y-4">
              <p className="text-sm text-white/50">
                <span className="text-[#C4A052]">&quot;What 20 Years of Korean Arts Taught Me About Respect&quot;</span>
              </p>
              <div className="space-y-2">
                {[
                  { slide: '1 (커버)', content: '절 시연 사진 + "Lessons from 20 years"' },
                  { slide: '2', content: '"Lesson 1: Your bow speaks before you do." — 절 이야기' },
                  { slide: '3', content: '"Lesson 2: Empty yourself first." — 수련의 철학' },
                  { slide: '4', content: '"Lesson 3: The teacher sees everything." — 스승의 눈' },
                  { slide: '5', content: '"Lesson 4: Respect is not performance. It\'s practice."' },
                  { slide: '6', content: '대표님 어린 시절 → 현재 사진 (있으면)' },
                  { slide: '7 (CTA)', content: '"What did your teacher teach you first?"' },
                ].map((item) => (
                  <div key={item.slide} className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3">
                    <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded shrink-0">{item.slide}</span>
                    <span className="text-sm text-white/50">{item.content}</span>
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
