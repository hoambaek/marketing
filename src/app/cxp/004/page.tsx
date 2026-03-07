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
              { label: '타깃 길이', value: 'TT 24초 / IG 30초', icon: Clock },
              { label: '언어', value: '영어 (한국어 믹스)', icon: Mic },
              { label: '상태', value: '기획 완료 — 단독 촬영', icon: Layers },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡 버전 (24초)</h4>
                <div className="space-y-3">
                  {[
                    { time: '0-4초', label: '후킹', screen: '대표님 한복 차림, 정면 응시', subtitle: '"My first day of Korean traditional arts training. I was six. I expected to play music."', note: '담담한 톤, 천천히' },
                    { time: '4-8초', label: '반전', screen: '대표님 정면 — 짧은 정적 후', subtitle: '"My teacher didn\'t let me touch an instrument for three months. She taught me how to bow."', note: '반전의 핵심 — "bow"에서 잠깐 멈춤' },
                    { time: '8-15초', label: '핵심', screen: '대표님 절 시연 + 클로즈업 교차', subtitle: '"Every class — before I played a single note — she watched my 절. How I went down. How long I stayed. How I came back up. If my bow wasn\'t right, she\'d say: \'오늘은 소리가 안 나올 거야.\' \'Your sound won\'t come out today.\'"', note: '절 시연 장면 삽입 — 내려가고, 머무르고, 올라오는 과정' },
                    { time: '15-20초', label: '철학', screen: '대표님 정면 클로즈업', subtitle: '"She was always right. Because 절 is not about bending your body. It\'s about emptying yourself before you receive something."', note: '가장 느린 구간 — 숨결이 들릴 정도로' },
                    { time: '20-24초', label: '캐치프레이즈', screen: '대표님 클로즈업 → 여운', subtitle: '"That\'s why Koreans read your bow before they hear your words. This is the real Korea."', note: '정면 응시 → 페이드 아웃 (정적)' },
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
                    <span className="text-white/30">[8-18초]</span> 핵심 확장 — 절 시연을 더 길게, 손끝/시선/호흡의 디테일을 보여줌. &quot;How I went down — slowly. How long I stayed — until she nodded. How I came back up — without rushing.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[18-24초]</span> 철학 확장 — &quot;절 is not performance. It&apos;s preparation. You empty yourself so the music has somewhere to enter.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[24-28초]</span> 마무리 — &quot;한국 사람은 다 알아요. Your bow tells them everything before you say a word.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[28-30초]</span> 캐치프레이즈 — 정적 2초 → &quot;This is the real Korea.&quot;
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
                      { section: '후킹 (0-4초)', tone: '담담, 회상하는', speed: '느리게', emotion: '6살의 기억을 꺼내듯' },
                      { section: '반전 (4-8초)', tone: '담백한 놀라움', speed: '보통 → 멈춤', emotion: '"bow"에서 잠깐 정적' },
                      { section: '핵심 (8-15초)', tone: '묘사적, 정밀', speed: '천천히', emotion: '선생님의 시선을 재현' },
                      { section: '철학 (15-20초)', tone: '깊고 진솔', speed: '가장 느리게', emotion: '숨결이 들릴 정도' },
                      { section: '캐치프레이즈', tone: '단호 + 여운', speed: '천천히', emotion: '정면 응시, 정적 마무리' },
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
                  <li>001 한복: 교정형 (&quot;이건 틀렸어&quot;)</li>
                  <li>002 절 해독: 분석형 (&quot;한국인은 이걸 읽었다&quot;)</li>
                  <li>003 대취타: 에너지형 (&quot;이게 진짜야&quot;)</li>
                  <li className="text-[#C4A052]">004 수련: 수련자형 (&quot;나는 이렇게 배웠다&quot;) — 가장 개인적, 가장 깊음</li>
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
                    '한복 준비 (001/002와 동일 세팅 — 같은 날 연속 촬영 가능)',
                    '촬영 장소 확보 (001/002와 동일)',
                    '절 시연 연습 — 내려가고, 머무르고, 올라오는 각 단계의 디테일',
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
                <p className="text-sm text-white/50">001 한복 팩트체크 (45분) → 002 절 해독 (40분) → 의상 유지 → 004 수련 이야기 (30분) = 총 약 2시간</p>
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
                        { cut: 'F1', content: '"I was six" 회상 도입', frame: '미디엄', note: '담담한 시선' },
                        { cut: 'F2', content: '"She taught me how to bow"', frame: '미디엄', note: '반전 순간' },
                        { cut: 'F3', content: '절 시연 — 내려가는 과정', frame: '풀샷', note: '천천히, 호흡' },
                        { cut: 'F4', content: '절 시연 — 머무르는 순간', frame: '풀샷 → 손 클로즈업', note: '킬링 컷 — 정적' },
                        { cut: 'F5', content: '절 시연 — 올라오는 과정', frame: '풀샷', note: '절제된 동작' },
                        { cut: 'F6', content: '"오늘은 소리가 안 나올 거야" 인용', frame: '클로즈업', note: '한국어 전환' },
                        { cut: 'F7', content: '"emptying yourself" 철학', frame: '클로즈업', note: '가장 깊은 톤' },
                        { cut: 'F8', content: '캐치프레이즈 → 정적 마무리', frame: '클로즈업', note: '정면 응시 → 페이드' },
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
              <p className="text-sm text-white/60">
                편집 키워드: <span className="text-[#C4A052]">정적과 여운</span>. 느린 호흡, 텍스트 팝업 없음, BGM 없음, 유머 없음. 정적이 음악이다.
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
                      { section: '0-4초 (후킹)', visual: '대표님 정면, 한복', audio: '음성 100% — 주변 정적' },
                      { section: '4-8초 (반전)', visual: '대표님 정면, 짧은 정적', audio: '음성 100% → "bow"에서 멈춤' },
                      { section: '8-15초 (핵심)', visual: '절 시연 풀샷 + 손/시선 클로즈업 교차', audio: '음성 100%, 절 동작 소리만' },
                      { section: '15-20초 (철학)', visual: '대표님 클로즈업', audio: '음성 100% — 숨결이 들릴 정도로 느리게' },
                      { section: '20-24초 (마무리)', visual: '대표님 클로즈업 → 페이드 아웃', audio: '음성 100% → 정적 여운 1-2초' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">핵심: 정적의 힘</h4>
                <p className="text-sm text-white/50 leading-relaxed">
                  이 에피소드의 무기는 <span className="text-[#C4A052]">소리가 없는 순간</span>이다.
                  절하는 동안의 정적, &quot;오늘은 소리가 안 나올 거야&quot; 후의 짧은 침묵,
                  마지막 &quot;This is the real Korea&quot; 후 1-2초의 여운.
                  BGM, 텍스트 팝업, 효과음 일체 사용하지 않는다.
                </p>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">편집 포인트</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— 절 시연(F3-F5)은 슬로모션 금지 — 실제 속도 그대로가 더 강력</li>
                  <li>— &quot;How I went down / stayed / came back up&quot; 각 구절에 해당 동작 매칭</li>
                  <li>— 한국어 인용 구간에 자막 불필요 — 바로 영어 번역이 따라옴</li>
                  <li>— 마지막 2초: 대표님 정면 응시한 채 컷 없이 페이드 아웃</li>
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
                      <br /><br />
                      I expected to play music. My teacher made me bow for three months before I touched an instrument.
                      <br /><br />
                      &quot;Your sound won&apos;t come out today.&quot; She said it every time my bow wasn&apos;t right. She was always right.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#koreanbowing', '#jeol', '#koreanculture', '#therealkorea', '#koreanarts', '#traditionalartskorea', '#koreantradition', '#respectculture'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">고정 댓글</h4>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    &quot;오늘은 소리가 안 나올 거야.&quot; / &quot;Your sound won&apos;t come out today.&quot;
                    <br /><br />
                    My teacher said this every time my bow wasn&apos;t right. 절 is not about bending. It&apos;s about emptying yourself before you receive something.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                      I was six years old. My first Korean traditional arts class.
                      <br /><br />
                      I thought I&apos;d learn to play music. Instead, my teacher taught me how to bow. For three months.
                      <br /><br />
                      Every class — before a single note — she watched my 절. How I went down. How long I stayed. How I came back up.
                      <br /><br />
                      &quot;절이 안 되면 소리도 안 된다.&quot;
                      <br />
                      If your bow isn&apos;t right, your sound won&apos;t come out.
                      <br /><br />
                      She was always right.
                    </p>
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
                      <th className="text-left text-white/30 font-medium py-2 px-2">비고</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { metric: '틱톡 조회수', target: '2,000+', note: '개인 스토리텔링 기반' },
                      { metric: '완주율', target: '55%+', note: '24초 + 정적 구조 = 끝까지 봐야 답 나옴' },
                      { metric: '저장', target: '좋아요 대비 35%+', note: '"다시 느끼고 싶다" — 감성 저장' },
                      { metric: '팔로우 전환', target: '조회 대비 2%+', note: '전환 에피소드 — "이 사람 진짜다"' },
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
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">004의 역할</h4>
                <p className="text-sm text-white/50">
                  004는 시리즈의 <span className="text-[#C4A052]">&quot;전환(conversion)&quot; 에피소드</span>.
                  001-003으로 흥미를 가진 시청자가 004를 보고 &quot;이 사람은 진짜다. 팔로우해야겠다&quot;는 결정을 내리는 포인트.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { ep: '001', title: '한복 팩트체크', hook: '"K-drama got this wrong."', role: '발견' },
                  { ep: '002', title: '절의 미세한 차이', hook: '"Same bow. Koreans saw a power struggle."', role: '해독' },
                  { ep: '003', title: '대취타의 진짜 소리', hook: '"460 million views. But the real thing?"', role: '에너지' },
                  { ep: '004', title: '수련 — 절이 소리보다 먼저', hook: '"My teacher watched my bow before she heard me play."', role: '전환', active: true },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">002 → 004 연결</h4>
                <p className="text-sm text-white/50">
                  002(현상): &quot;한국인은 절의 2도 차이를 즉시 읽는다&quot;
                  <br />
                  004(원인): &quot;6살 때부터 이렇게 배웠으니까&quot;
                  <br /><br />
                  002를 본 시청자가 004를 발견하면 → <span className="text-[#C4A052]">&quot;아, 그래서 이 사람이 그걸 읽을 수 있었구나&quot;</span>
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
