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
            전제: 004(절의 철학)를 본 시청자가 &quot;그래서 구체적으로 어떻게 해?&quot;에 답하는 편 — &quot;3년 수련을 20초로&quot;
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: '타깃 길이', value: 'TT 20초 / IG 25초', icon: Clock },
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
                    { num: '1', behavior: '두 손으로 받기/드리기', root: '제사에서 신에게 올릴 때 두 손 → 어른을 신처럼 모시는 것의 일상화' },
                    { num: '2', behavior: '고개 돌려 마시기', root: '스승 앞에서 수련생은 정면에서 물도 마시지 않음 → 겸양의 체화' },
                    { num: '3', behavior: '어른보다 먼저 먹지 않기', root: '제사의 "진설" 순서가 일상 식사에 스며든 것' },
                    { num: '4', behavior: '나이를 묻는 것이 필수', root: '유교의 오륜 중 장유유서 → 관계가 정해져야 말이 정해짐' },
                    { num: '5', behavior: '빈 잔을 채워주기', root: '자기 잔을 채우지 않는 것 = 004의 "emptying yourself" 철학 실전판' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡 버전 (20초)</h4>
                <div className="space-y-3">
                  {[
                    { time: '0-2초', label: '충격 후킹', screen: '대표님 정면 (세미포멀, 자신감)', subtitle: '"Everything you know about Korean manners is surface level."', note: '도발적, 단호' },
                    { time: '2-4초', label: 'Authority Hook', screen: '대표님 (확신에 찬 표정)', subtitle: '"3 years of training in 20 seconds. Here\'s what\'s really underneath."', note: '"3년 vs 20초" 반전' },
                    { time: '4-7초', label: '#1 두 손', screen: '시연 — 두 손으로 컵 건넴 (클로즈업)', subtitle: '"Both hands. Always. Not politeness — 제사. You offer to the gods with both hands."', note: '자막: 두 손' },
                    { time: '7-9초', label: '#2 고개 돌림', screen: '시연 — 고개 돌려 마시기 (측면)', subtitle: '"Turn away when drinking. My teacher never let us face her. Not even for water."', note: '자막: 고개 돌림' },
                    { time: '9-11초', label: '#3 어른 먼저', screen: '시연 — 숟가락 대기 제스처', subtitle: '"Never eat first. This is 제사 order — sacred."', note: '자막: 어른 먼저' },
                    { time: '11-13초', label: '#4 나이', screen: '대표님 정면', subtitle: '"\'How old are you?\' Not rude. Korean has two entire languages. Without age, you don\'t know which one to speak."', note: '자막: 나이' },
                    { time: '13-15초', label: '#5 빈 잔', screen: '시연 — 상대방 잔 채우기', subtitle: '"Empty glass? Fill theirs. Never yours. Empty yourself first."', note: '자막: 빈 잔, 004 콜백' },
                    { time: '15-20초', label: '의외성 + 캐치프레이즈', screen: '대표님 클로즈업 (정면 응시)', subtitle: '"These aren\'t tips you learn from a travel blog. Every single one comes from ancestral rituals that are a thousand years old. Koreans just forgot where they came from. A thousand years of love, disguised as manners. This is the real Korea."', note: '15-18초 의외성 → 18-20초 캐치프레이즈' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스 버전 (25초) — 확장</h4>
                <div className="space-y-3">
                  {[
                    { time: '0-4초', label: '충격 후킹 + Authority Hook', text: '틱톡과 동일' },
                    { time: '4-7초', label: '#1 두 손 (확장)', text: '"Both hands. Receiving, giving, pouring — always. Not politeness — 제사. You offer to the gods with both hands. To a Korean elder? Same reverence."' },
                    { time: '7-10초', label: '#2 고개 돌림 (확장)', text: '"Drinking next to someone older? Turn away. In my training, we never faced our teacher. Not tea. Not water. Nothing. \'I won\'t be bold in your presence.\'"' },
                    { time: '10-12초', label: '#3 어른 먼저', text: '"Never eat first. 제사 order — sacred. The sequence has been the same for centuries."' },
                    { time: '12-15초', label: '#4 나이 (확장)', text: '"\'How old are you?\' Not rude. Essential. Korean has two entire languages — 존댓말 and 반말. Without knowing age, you don\'t know which one to speak."' },
                    { time: '15-18초', label: '#5 빈 잔 (확장)', text: '"Empty glass? Fill theirs. Never yours. Pouring your own means nobody cares about you. So you care first. They care back. Empty yourself first."' },
                    { time: '18-22초', label: '의외성 한 방', text: '"These aren\'t travel tips. Every single one comes from ancestral rituals that are a thousand years old. This is what Confucian love looks like at a dinner table."' },
                    { time: '22-23초', label: '전문가 확인', text: '"My teacher taught me all five before she taught me a single note."' },
                    { time: '23-25초', label: '캐치프레이즈', text: '"A thousand years of love, disguised as manners. This is the real Korea."' },
                  ].map((scene) => (
                    <div key={scene.time} className="bg-white/[0.03] rounded-xl p-4 border-l-2 border-white/[0.08]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded">{scene.time}</span>
                        <span className="text-xs font-medium text-white/60">{scene.label}</span>
                      </div>
                      <p className="text-sm text-white/50 italic">{scene.text}</p>
                    </div>
                  ))}
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
                      { section: '충격 후킹 (0-2초)', tone: '도발적, 단호', speed: '보통', emotion: '"당신이 아는 건 표면"' },
                      { section: 'Authority Hook (2-4초)', tone: '자신감 + 도전', speed: '보통', emotion: '"3년 vs 20초" 반전' },
                      { section: '5가지 행동 (4-15초)', tone: '리듬감 + 권위', speed: '빠르게', emotion: '1.2초 컷, 박식한 에너지' },
                      { section: '뿌리 설명', tone: '톤 변화 — 한 단계 깊어짐', speed: '잠깐 느려짐', emotion: '"이건 아무나 모르는 거야"' },
                      { section: '의외성 (15-18초)', tone: '반전, 깊이', speed: '보통', emotion: '"한국인도 잊은 뿌리"' },
                      { section: '캐치프레이즈 (18-20초)', tone: '단호 + 따뜻', speed: '천천히', emotion: '진심' },
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
                    '소품: 컵 2개, 음료, 숟가락/젓가락, 밥상 세팅',
                    '의상: 세미포멀 (004의 한복과 대비 — 일상 적용 콘텐츠)',
                    '촬영 장소: 한식당 또는 좌식 테이블 있는 한옥',
                    '5가지 행동 시연 리허설',
                    '004 콜백 대사 ("empty yourself first") 톤 확인',
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 text-xs text-white/50 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-[#C4A052] focus:ring-[#C4A052]/50" />
                      <span className="group-hover:text-white/70 transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-3 italic">004(절의 철학) 촬영과 같은 날 연속 가능. 의상 톤 유지, 장소를 한식당/좌식으로 전환. 예상 약 40분.</p>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">촬영 순서</h4>
                <div className="space-y-3 text-sm text-white/50">
                  <div className="flex items-start gap-3 border-l-2 border-[#C4A052]/30 pl-3">
                    <span className="text-xs font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded shrink-0">1</span>
                    <div>
                      <p className="text-white/60 font-medium">시연 컷 (15분)</p>
                      <p className="text-xs text-white/40 mt-0.5">G2 → G3 → G4 → G6 (각 2-3회)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-l-2 border-[#C4A052]/30 pl-3">
                    <span className="text-xs font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded shrink-0">2</span>
                    <div>
                      <p className="text-white/60 font-medium">멘트 (20분)</p>
                      <p className="text-xs text-white/40 mt-0.5">전체 스크립트 통으로 3-4회 촬영 (리듬 유지)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-l-2 border-[#C4A052]/30 pl-3">
                    <span className="text-xs font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded shrink-0">3</span>
                    <div>
                      <p className="text-white/60 font-medium">비하인드 (5분)</p>
                      <p className="text-xs text-white/40 mt-0.5">5가지 스피드런 + 자연스러운 코멘트</p>
                    </div>
                  </div>
                </div>
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
                        { cut: 'G1', content: '후킹 멘트', frame: '미디엄, 정면', note: '자신감' },
                        { cut: 'G2', content: '두 손 컵 건넴', frame: '핸드 클로즈업', note: '' },
                        { cut: 'G3', content: '고개 돌려 마시기', frame: '미디엄, 측면', note: '킬링 동작' },
                        { cut: 'G4', content: '숟가락 대기', frame: '미디엄, 정면', note: '밥상 앞' },
                        { cut: 'G5', content: '나이/존댓말 멘트', frame: '미디엄, 정면', note: '표정으로 전달' },
                        { cut: 'G6', content: '잔 채우기', frame: '핸드 클로즈업', note: '정성스럽게' },
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
                핵심: <span className="text-white/70">리스트형이되, 매 항목에 &quot;깊이 레이어&quot; 전환</span>. 각 행동마다 &quot;표면(시연) → 깊이(뿌리)&quot; 교차. 이 전환이 반복되면서 시청자가 패턴을 인식하고 <span className="text-[#C4A052]">&quot;다음 뿌리는 뭘까?&quot;</span> 기대하며 완주.
              </p>

              <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">리스트형이되, 매 항목에 &quot;깊이 레이어&quot; 전환</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/30 font-medium py-2 px-2">구간</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">표면 (시연)</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">깊이 (뿌리)</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">편집</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white/50">
                      {[
                        { area: '두 손', surface: '컵 건넴', depth: '"제사에서 신에게"', edit: '시연 → 톤 변화 + 0.3초 pause' },
                        { area: '고개 돌림', surface: '돌려 마시기', depth: '"스승 앞에서"', edit: '시연 → 톤 변화' },
                        { area: '어른 먼저', surface: '기다리기', depth: '"제사 순서"', edit: '시연 → 톤 변화' },
                        { area: '나이', surface: '—', depth: '"두 개의 언어"', edit: '대표님 정면만' },
                        { area: '빈 잔', surface: '채우기', depth: '"emptying yourself"', edit: '시연 → 004 콜백' },
                      ].map((row) => (
                        <tr key={row.area} className="border-b border-white/[0.03]">
                          <td className="py-2 px-2 text-white/60">{row.area}</td>
                          <td className="py-2 px-2">{row.surface}</td>
                          <td className="py-2 px-2 text-white/40">{row.depth}</td>
                          <td className="py-2 px-2 text-white/30">{row.edit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-white/40 mt-2">&quot;표면 → 깊이&quot; 전환이 반복되면서 시청자가 패턴을 인식하고 &quot;다음 것의 뿌리는 뭘까?&quot; 기대하며 완주.</p>
              </div>

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
                      { section: '0-2초', visual: '대표님 정면 (후킹)', audio: '음성 100%' },
                      { section: '2-4초', visual: '대표님 (Authority Hook)', audio: '음성 100%' },
                      { section: '4-7초', visual: 'G2 손 클로즈업 ↔ 대표님 설명', audio: '음성 100%' },
                      { section: '7-9초', visual: 'G3 고개 돌림 시연', audio: '음성 100%' },
                      { section: '9-11초', visual: 'G4 식탁 세팅 + 기다림', audio: '음성 100%' },
                      { section: '11-13초', visual: 'G5 대표님 정면 (대화 톤)', audio: '음성 100%' },
                      { section: '13-15초', visual: 'G6 빈 잔 채우기 클로즈업', audio: '음성 100% → 약간 느림' },
                      { section: '15-20초', visual: 'G7 클로즈업 → 여운', audio: '음성 100% → 페이드' },
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
                  <li>— 번호 카운팅: 화면 한쪽에 1/5 ~ 5/5</li>
                  <li>— 시연: 빠르게 (1.5초), 뿌리 설명: 톤 변화 + 약간 느려짐 (0.5초 추가)</li>
                  <li>— 한국어 키워드: 큰 폰트 팝업 (제사, 존댓말, 절)</li>
                  <li>— BGM: 가볍되 전통 느낌 (가야금 잔잔한 배경 or 무음)</li>
                  <li>— #5 빈 잔 장면에서 &quot;empty yourself first&quot; 텍스트 페이드인 — 004 콜백</li>
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
                      My teacher spent 3 years teaching me these.
                      <br />
                      Here&apos;s 25 seconds.
                      <br /><br />
                      In Korea, manners aren&apos;t tips — they&apos;re rituals.
                      <br />
                      Every one of these comes from 제사, 유교, and centuries of tradition.
                      <br /><br />
                      1. 두 손 — both hands (from ancestral rituals)
                      <br />
                      2. 고개 돌림 — turn away when drinking (from arts training)
                      <br />
                      3. 어른 먼저 — elders eat first (from 제사 order)
                      <br />
                      4. 나이 — age decides your language (존댓말 vs 반말)
                      <br />
                      5. 빈 잔 — fill theirs, not yours (empty yourself first)
                      <br /><br />
                      These aren&apos;t tips. This is a thousand years of love.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#koreanculture', '#koreanmanners', '#koreanetiquette', '#jesa', '#koreanheritage', '#therealkorea', '#koreatips'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">고정 댓글</h4>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    #2 shocks everyone.
                    <br />
                    In Korean traditional arts training,
                    <br />
                    you never face your teacher while drinking. Not even water.
                    <br /><br />
                    It&apos;s not about the drink. It&apos;s about presence.
                    <br />
                    Which one surprised you? Drop the number.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                      My teacher spent 3 years teaching me respect.
                      <br />
                      I&apos;ll show you in 30 seconds.
                      <br /><br />
                      But these aren&apos;t &quot;Korean tips.&quot;
                      <br />
                      Every single one has roots in 제사 (ancestral rituals),
                      <br />
                      유교 (Confucian philosophy), and centuries of practice.
                      <br /><br />
                      Both hands → from offering to ancestors.
                      <br />
                      Turn away → from facing your master.
                      <br />
                      Elders first → from ritual order.
                      <br />
                      Ask age → because Korean has two languages (존댓말 / 반말).
                      <br />
                      Fill their glass → because you empty yourself first.
                      <br /><br />
                      A thousand years of love, disguised as table manners.
                      <br /><br />
                      My teacher taught me all five
                      <br />
                      before she let me play a single note.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#koreanculture', '#koreanmanners', '#koreanheritage', '#therealkorea', '#jesa', '#koreanwisdom', '#koreanetiquette'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">스토리 시퀀스</h4>
                <div className="space-y-2">
                  {[
                    { num: '1', content: '#2 — 고개 돌림 시연 3초 — "This shocks every foreigner."' },
                    { num: '2', content: '투표 — "Did you know Korean has TWO entire speech systems? Yes / WHAT"' },
                    { num: '3', content: '릴스 공유' },
                    { num: '4', content: 'Q&A — "Which Korean custom do you want me to explain the roots of?"' },
                  ].map((story) => (
                    <div key={story.num} className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-3">
                      <span className="text-xs font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded shrink-0">S{story.num}</span>
                      <p className="text-xs text-white/50">{story.content}</p>
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
                      { metric: '틱톡 조회수', target: '5,000+', note: '리스트형 + 전문가 깊이' },
                      { metric: '완주율', target: '50%+', note: '"다음 뿌리는 뭘까" 구조' },
                      { metric: '저장', target: '좋아요 대비 30%+', note: '실용 + 깊이 = 저장 최강' },
                      { metric: '공유', target: '도달 대비 3%+', note: '' },
                      { metric: '댓글', target: '번호 투표 + "didn\'t know" 류', note: '' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">004 → 005 크로스 전략</h4>
                <ul className="space-y-1.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>004에서 철학을 본 사람 → &quot;구체적으로 어떻게?&quot; → 005</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>005에서 리스트를 본 사람 → &quot;왜 이렇게까지 하지?&quot; → 004</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>두 편이 서로의 유입 통로</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 시리즈 위치 */}
          <CollapsibleSection title="시리즈 위치 — 5편 전체 라인업" icon={Layers}>
            <div className="pt-4">
              <div className="space-y-2">
                {[
                  { ep: '001', title: '한복 팩트체크', hook: '발견 ("재밌네")' },
                  { ep: '002', title: '절 해독', hook: '신뢰 ("한국인 시선 신기하다")' },
                  { ep: '003', title: '대취타', hook: '트래픽 (BTS 팬덤 유입)' },
                  { ep: '004', title: '절의 철학', hook: '전환 ("이 사람 진짜다. 팔로우")', prerequisite: true },
                  { ep: '005', title: '예절의 뿌리', hook: '확산 ("이거 친구한테 보내야 해")', active: true },
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
                  005는 시리즈의 <span className="text-[#C4A052]">&quot;확산(spread)&quot;</span> 에피소드. 004(감동)와 005(실용)가 짝을 이루어 팔로워를 고정시킨다.
                </p>
                <p className="text-sm text-white/40 mt-2">
                  004에서 &quot;empty yourself&quot;의 철학 → 005에서 &quot;그 철학이 일상에서 어떤 행동으로 나타나는가&quot;를 5가지로. 004(감동)와 005(실용)가 짝을 이루어 팔로워를 고정시킨다.
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
