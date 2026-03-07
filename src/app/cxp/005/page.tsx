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

export default function CXP005Page() {
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
              #005
            </span>
            <span className="text-sm text-white/40">축 1 — The Real Korea</span>
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
            5 Korean Cheat Codes — How to Make Any Elder Love You
          </h1>
          <p className="text-sm text-white/50">
            004의 철학이 일상에서 작동하는 5가지 구체적 행동 — &quot;3년 수련을 30초로&quot;
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: '타깃 길이', value: 'TT 25초 / IG 30초', icon: Clock },
              { label: '언어', value: '영어 (한국어 믹스)', icon: Mic },
              { label: '상태', value: '기획 완료', icon: Layers },
              { label: '촬영', value: '대표님 단독 가능', icon: Camera },
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
                004(절의 철학)를 본 시청자가 &quot;그래서 구체적으로 어떻게?&quot;에 답하는 편.
                <span className="text-[#C4A052]"> &quot;여행 팁 리스트&quot;가 아니라 &quot;004의 스승이 가르친 원칙이 일상에서 작동한다&quot;</span>는 연결고리.
              </p>
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">왜 이 접근인가</h4>
                <ul className="space-y-1.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>&quot;리스트형 숏폼&quot;은 가장 공유되는 포맷 — 하지만 &quot;깊이&quot;가 없으면 일회성</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>각 행동의 &quot;뿌리(root)&quot;를 제사·수련·유교로 연결 → 팁이 아닌 문화 해독</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>004의 &quot;empty yourself&quot; 콜백으로 시리즈 연결감 강화</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>시리즈 중 가장 shareable — &quot;실용 + 깊이&quot;의 확산(spread) 에피소드</li>
                </ul>
              </div>

              {/* 5가지 행동 */}
              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">5가지 행동 — 뿌리(Root)</h4>
                <div className="space-y-3">
                  {[
                    { num: '1', behavior: '두 손으로 받기/드리기', root: '제사에서 신에게 올릴 때 두 손 → 어른을 신처럼 모시는 것' },
                    { num: '2', behavior: '고개 돌려 마시기', root: '스승 앞에서 수련생은 정면에서 물도 마시지 않음' },
                    { num: '3', behavior: '어른보다 먼저 먹지 않기', root: '제사의 "진설" 순서가 일상 식사에 스며든 것' },
                    { num: '4', behavior: '나이를 묻는 것이 필수', root: '유교의 장유유서 → 관계가 정해져야 말이 정해짐' },
                    { num: '5', behavior: '빈 잔을 채워주기', root: '자기 잔을 채우지 않는 것 = 004의 "emptying yourself" 콜백' },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-3 border-l-2 border-[#C4A052]/30 pl-3">
                      <span className="text-xs font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded shrink-0">{item.num}</span>
                      <div>
                        <p className="text-sm text-white/70 font-medium">{item.behavior}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.root}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 스크립트 */}
          <CollapsibleSection title="스크립트" icon={Film}>
            <div className="pt-4 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡 버전 (25초)</h4>
                <div className="space-y-3">
                  {[
                    { time: '0-4초', label: '후킹', screen: '대표님 정면 (세미포멀)', subtitle: '"My teacher spent 3 years teaching me how to show respect with my body. I\'ll show you in 25 seconds."', note: '권위 + 도전' },
                    { time: '4-8초', label: '#1 두 손', screen: '두 손으로 잔/물건 건네는 클로즈업', subtitle: '"Both hands. Always. In Korean rituals, you offer to the gods with both hands. Korean elders? Same energy."', note: '제사 연결' },
                    { time: '8-12초', label: '#2 고개 돌림', screen: '고개 돌려 마시는 시연', subtitle: '"Drinking next to an elder? Turn away. In my training, we never faced our teacher while drinking. Not even water."', note: '수련 경험' },
                    { time: '12-15초', label: '#3 어른 먼저', screen: '식탁에서 기다리는 모습', subtitle: '"Never eat first. This comes from 제사 — ancestral rituals. The order is sacred."', note: '한국어 믹스: 제사' },
                    { time: '15-18초', label: '#4 나이', screen: '대표님 정면 (대화 톤)', subtitle: '"\'How old are you?\' — not rude. Necessary. Because in Korean, you literally speak a different language depending on who\'s older."', note: '존댓말/반말 설명' },
                    { time: '18-21초', label: '#5 빈 잔', screen: '빈 잔 채워주는 클로즈업', subtitle: '"Someone\'s glass is empty? Fill it. Never your own. Remember — empty yourself first."', note: '004 콜백' },
                    { time: '21-25초', label: '캐치프레이즈', screen: '대표님 클로즈업 (정면 응시)', subtitle: '"These aren\'t tips. These are a thousand years of love disguised as manners. This is the real Korea."', note: '단호 + 따뜻' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스 버전 (30초) — 확장</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[4-10초]</span> #1, #2 확장 — &quot;Both hands — because in 제사, you offer to the gods with two hands. Your grandmother? She deserves the same.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[10-16초]</span> #3, #4 확장 — &quot;The order matters. In ancestral rituals, 진설 dictates who eats first. That rule didn&apos;t stay at the altar — it moved to every dinner table.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[16-22초]</span> #5 확장 — &quot;You never fill your own glass. You fill theirs. They fill yours. It&apos;s not about the drink — it&apos;s about saying: I see you.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[22-30초]</span> 마무리 — 캐치프레이즈 + 여운 (슬로우 페이드)
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
                      { section: '후킹 (0-4초)', tone: '권위, 도전적', speed: '보통', emotion: '"3년을 25초로 압축"' },
                      { section: '#1-#2 (4-12초)', tone: '리듬감, 빠르게', speed: '빠르게', emotion: '행동 → 잠깐 멈춤 → 뿌리 설명' },
                      { section: '#3-#4 (12-18초)', tone: '설명적, 자연스러움', speed: '보통', emotion: '문화 맥락 전달' },
                      { section: '#5 (18-21초)', tone: '개인적, 진솔', speed: '느리게', emotion: '004 콜백 — 여운' },
                      { section: '캐치프레이즈 (21-25초)', tone: '단호 + 따뜻', speed: '천천히', emotion: '정면 응시, 확신' },
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
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">리듬 패턴</h4>
                <p className="text-sm text-white/50 mb-3">
                  각 행동: <span className="text-white/70">빠르게(행동)</span> → <span className="text-white/70">살짝 느리게(뿌리 설명)</span>. 리스트형이지만 일정한 박자가 아닌 <span className="text-[#C4A052]">속도 변화</span>로 지루함 방지.
                </p>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">한국어 믹스 포인트</h4>
                <div className="space-y-2 text-sm text-white/50">
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">제사 (jesa)</span><span className="text-white/40">ancestral rituals — 영어로 완전 번역 불가, 그대로 사용</span></div>
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">존댓말/반말</span><span className="text-white/40">&quot;you literally speak a different language&quot;로 설명 — 직접 언급</span></div>
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">절 (jeol)</span><span className="text-white/40">004에서 이미 도입된 개념 — 시리즈 연결</span></div>
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
                    '세미포멀 outfit 준비 (004와 톤 연결)',
                    '소품: 컵/잔, 음료, 숟가락, 접시',
                    '한식당 또는 좌식 테이블 촬영 장소 확보',
                    '5가지 행동 시연 리허설',
                    '004 콜백 대사 ("empty yourself first") 톤 확인',
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 text-xs text-white/50 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-[#C4A052] focus:ring-[#C4A052]/50" />
                      <span className="group-hover:text-white/70 transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">대표님 단독 촬영</h4>
                <p className="text-sm text-white/50">004(절의 철학) 촬영과 같은 날 연속 가능. 의상 톤 유지하되 장소를 한식당/좌식으로 전환하면 시각적 변화. 예상 소요 약 40분.</p>
              </div>

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
                        { cut: 'G1', content: '"3 years... 25 seconds" 후킹', frame: '미디엄', note: '권위 + 도전' },
                        { cut: 'G2', content: '두 손으로 잔 건네기', frame: '손 클로즈업', note: '소품 활용' },
                        { cut: 'G3', content: '고개 돌려 마시기', frame: '미디엄 → 옆모습', note: '동작 시연' },
                        { cut: 'G4', content: '어른 먼저 — 식탁에서 기다림', frame: '테이블 위 풀샷', note: '한식당 세팅' },
                        { cut: 'G5', content: '"How old are you?" 나이 질문', frame: '미디엄', note: '대화 톤' },
                        { cut: 'G6', content: '빈 잔 채워주기', frame: '손 클로즈업', note: '004 콜백 킬링 컷' },
                        { cut: 'G7', content: '캐치프레이즈', frame: '클로즈업', note: '정면 응시' },
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
            </div>
          </CollapsibleSection>

          {/* 편집 가이드 */}
          <CollapsibleSection title="편집 가이드" icon={Scissors}>
            <div className="pt-4 space-y-5">
              <p className="text-sm text-white/50">
                핵심: <span className="text-white/70">리스트형 리듬 편집</span>. 각 행동마다 &quot;동작 인서트 + 설명&quot; 교차. 빠른 컷과 느린 설명의 <span className="text-[#C4A052]">속도 대비</span>가 핵심.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-white/30 font-medium py-2 px-2">구간</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">화면</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">오디오</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { section: '0-4초', visual: '대표님 정면 (후킹)', audio: '음성 100%' },
                      { section: '4-8초', visual: 'G2 손 클로즈업 ↔ 대표님 설명', audio: '음성 100%' },
                      { section: '8-12초', visual: 'G3 고개 돌림 시연', audio: '음성 100%' },
                      { section: '12-15초', visual: 'G4 식탁 세팅 + 기다림', audio: '음성 100%' },
                      { section: '15-18초', visual: 'G5 대표님 정면 (대화 톤)', audio: '음성 100%' },
                      { section: '18-21초', visual: 'G6 빈 잔 채우기 클로즈업', audio: '음성 100% → 약간 느림' },
                      { section: '21-25초', visual: 'G7 클로즈업 → 여운', audio: '음성 100% → 페이드' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">편집 포인트</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— 각 행동 전환 시 숫자 텍스트 오버레이 (1, 2, 3, 4, 5) — 리스트 리듬 시각화</li>
                  <li>— #5 빈 잔 장면에서 &quot;empty yourself first&quot; 텍스트 페이드인 — 004 콜백 강조</li>
                  <li>— 행동 시연 컷은 빠르게(1-2초), 뿌리 설명은 약간 길게 — 속도 대비</li>
                  <li>— 캐치프레이즈에서 배경음 드롭 → 음성만 남김</li>
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
                      My teacher spent 3 years teaching me this. Here are 5 ways to make any Korean elder love you — and why each one goes back a thousand years.
                      <br /><br />
                      These aren&apos;t tips. These are a thousand years of love disguised as manners.
                      <br /><br />
                      This is the real Korea.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#koreanculture', '#koreanmanners', '#koreanetiquette', '#koreantradition', '#therealkorea', '#koreanelders', '#respectinkorea', '#jesa', '#koreanlanguage'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                      5 things that will make any Korean elder smile at you — and every single one traces back to ancestral rituals, Confucian philosophy, or years of traditional arts training.
                      <br /><br />
                      Both hands. Turn away. Wait. Ask. Fill their glass.
                      <br /><br />
                      These aren&apos;t travel tips. These are love, compressed into gestures. A thousand years of it.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">고정 댓글</h4>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    #2 shocks everyone. In Korean traditional arts training, you never face your teacher while drinking. Not even water. It&apos;s not about the drink — it&apos;s about showing you know your place.
                    <br /><br />
                    Which one surprised you?
                  </p>
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
                      { metric: '틱톡 조회수', target: '5,000+', note: '리스트형 = 높은 도달률' },
                      { metric: '완주율', target: '50%+', note: '"5가지 다 보고 싶다" 구조' },
                      { metric: '저장', target: '좋아요 대비 30%+', note: '"나중에 써먹어야지" 실용성' },
                      { metric: '공유', target: '도달 대비 5%+', note: '가장 shareable 에피소드' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">시리즈 포지션</h4>
                <p className="text-sm text-white/50">005는 시리즈의 <span className="text-[#C4A052]">&quot;확산(spread)&quot;</span> 에피소드 — 가장 공유 가능한 &quot;실용 + 깊이&quot; 콘텐츠. 004의 철학적 기반 위에 구체적 행동을 제시하여 시청자가 &quot;바로 써먹을 수 있는&quot; 가치 제공.</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 시리즈 위치 */}
          <CollapsibleSection title="시리즈 위치 — 004 → 005 연결" icon={Layers}>
            <div className="pt-4">
              <div className="space-y-2">
                {[
                  { ep: '003', title: '한국의 사우나 문화', hook: '"Koreans get naked with strangers — and it\'s healing."' },
                  { ep: '004', title: '절의 철학 — Emptying Yourself', hook: '"The deepest bow isn\'t about going low. It\'s about emptying yourself."', prerequisite: true },
                  { ep: '005', title: '5 Korean Cheat Codes', hook: '"3 years of training in 25 seconds."', active: true },
                  { ep: '006', title: '(다음 편)', hook: 'TBD' },
                ].map((item) => (
                  <div key={item.ep} className={`flex items-center gap-3 rounded-lg p-3 ${item.active ? 'bg-[#C4A052]/10 border border-[#C4A052]/20' : item.prerequisite ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-white/[0.03]'}`}>
                    <span className={`text-[10px] font-mono w-8 h-5 rounded flex items-center justify-center ${item.active ? 'text-[#C4A052] bg-[#C4A052]/20' : item.prerequisite ? 'text-white/50 bg-white/[0.08]' : 'text-white/30 bg-white/[0.05]'}`}>
                      {item.ep}
                    </span>
                    <span className={`text-sm font-medium ${item.active ? 'text-[#C4A052]' : item.prerequisite ? 'text-white/70' : 'text-white/60'}`}>{item.title}</span>
                    {item.prerequisite && <span className="text-[10px] text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded">선행편</span>}
                    <span className="text-xs text-white/35 ml-auto italic">{item.hook}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 mt-4">
                <p className="text-sm text-white/50">
                  <span className="text-white/30">연결 구조:</span> 004에서 &quot;empty yourself&quot;의 철학을 제시 → 005에서 &quot;그 철학이 일상에서 어떤 행동으로 나타나는가&quot;를 5가지로 풀어냄. #5(빈 잔 채우기)가 004로의 직접 콜백.
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
