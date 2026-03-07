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

export default function CXP002Page() {
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
              #002
            </span>
            <span className="text-sm text-white/40">축 3 + 축 1 — K-Drama 해독</span>
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
            She Bowed 2 Degrees Wrong — Every Korean Noticed
          </h1>
          <p className="text-sm text-white/50">
            K-드라마 속 절하는 장면을 해독 — 한국인은 즉시 읽었지만 외국인은 완전히 놓친 것
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: '타깃 길이', value: 'TT 20초 / IG 25초', icon: Clock },
              { label: '언어', value: '영어 (한국어 믹스)', icon: Mic },
              { label: '상태', value: '기획 완료', icon: Layers },
              { label: '1순위 장면', value: '슈룹 (Netflix)', icon: Film },
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
                K-드라마 속 절하는 장면 하나를 가져와서,
                <span className="text-[#C4A052]"> 한국인 시청자는 즉시 읽었지만 외국인은 완전히 놓친 것</span>을 해독한다.
                &quot;절의 종류를 알려줄게&quot;가 아니라 <span className="text-white/80">&quot;이 장면에서 한국인은 이걸 봤다. 당신은 못 봤다.&quot;</span>
              </p>
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">왜 이 접근인가</h4>
                <ul className="space-y-1.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>20년 전공자가 아니면 &quot;2도 차이&quot;를 읽을 수 없음</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>외국인은 &quot;절한다&quot; 밖에 못 봄 → &quot;어떻게 절했는지&quot;가 캐릭터의 감정/권력을 드러냄</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>K-드라마 팬의 &quot;아 그래서 그 장면이!&quot; 반응 = 공유 폭발</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>여행 팁이 아닌 <strong>문화 해독(Cultural Decoding)</strong> 포지션</li>
                </ul>
              </div>

              {/* 타깃 장면 후보 */}
              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">타깃 장면 후보</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/30 font-medium py-2 px-2">드라마</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">장면</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">해독 포인트</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white/50">
                      <tr className="border-b border-white/[0.03] bg-[#C4A052]/5">
                        <td className="py-2 px-2 text-[#C4A052] font-medium">슈룹 (1순위)</td>
                        <td className="py-2 px-2">세자빈 후보들이 대비 앞에서 절</td>
                        <td className="py-2 px-2 text-white/40">같은 큰절인데 미세한 차이 → 진심 vs 가식</td>
                      </tr>
                      <tr className="border-b border-white/[0.03]">
                        <td className="py-2 px-2">환혼</td>
                        <td className="py-2 px-2">낙수가 장욱에게 절</td>
                        <td className="py-2 px-2 text-white/40">신분 위장 중 — 절의 깊이가 갈등 드러냄</td>
                      </tr>
                      <tr className="border-b border-white/[0.03]">
                        <td className="py-2 px-2">미스터 션샤인</td>
                        <td className="py-2 px-2">유진의 조선식 절</td>
                        <td className="py-2 px-2 text-white/40">어색한 절 vs 진짜 절 — 문화 정체성</td>
                      </tr>
                    </tbody>
                  </table>
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
                    { time: '0-2초', label: '충격 후킹', screen: '슈룹 절하는 장면 캡처 (여러 세자빈 후보가 나란히 절)', subtitle: '"Everyone bowed the same. But one woman just declared war."', note: '텍스트 + 드라마 장면 (멘트 없음)' },
                    { time: '2-4초', label: 'Authority Hook', screen: '대표님 정면 (한복, 확신에 찬 표정)', subtitle: '"I\'ve read bows since I was six. Watch her hands."' },
                    { time: '4-12초', label: '해독 — 디테일 분석', screen: '드라마 장면 슬로모션/정지 + 대표님 설명 교차', subtitle: '"This one — fingers spread. Rushing through it. She doesn\'t mean it." ... "But this one — fingers together. Slow. Eyes down three seconds longer. She\'s not bowing to the Queen. She\'s saying: I will outlast everyone in this room."', note: '디테일 컷 1.2초씩: 손가락 벌어진/모은 극접사, 머리 올라오는 슬로모션' },
                    { time: '12-16초', label: '의외성 한 방', screen: '대표님이 직접 두 가지를 빠르게 시연', subtitle: '"절 is not just bowing. It\'s a sentence. Speed, depth, your eyes, even how you breathe — every Korean in the room reads all of it. In one bow, she told everyone: I was born for this throne."' },
                    { time: '16-18초', label: '전문가 레이어', screen: '대표님 정면 (클로즈업)', subtitle: '"I learned this when I was six. 한국인은 다 읽어요."' },
                    { time: '18-20초', label: '캐치프레이즈', screen: '대표님 클로즈업 (정면 응시)', subtitle: '"You watched a bow. Koreans read a whole conversation. This is the real Korea."' },
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
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[0-2초]</span> 충격 후킹 (동일)
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[2-4초]</span> Authority Hook (동일)
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[4-14초]</span> 해독 확장 — &quot;This one — fingers spread. Head comes up too fast. She&apos;s performing. Not respecting. Every Korean viewer felt it.&quot; ... &quot;But this one — fingers together, tight. She goes down slowly. Stays three seconds longer than required. Eyes never leave the floor. She&apos;s not showing respect. She&apos;s showing: I was born for this.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[14-18초]</span> 의외성 한 방 확장 — &quot;절 tells them everything. Speed. Depth. Breath. Where your eyes go. In one bow, she told an entire room of royals: every one of you will kneel to me someday.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[18-21초]</span> 전문가 레이어 — &quot;I started 절 training at six years old. My teacher watched my bow before she heard me play. 한국인은 다 읽어요. Koreans read all of it.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[21-23초]</span> 브릿지 — &quot;So when you watch K-drama and everyone bows &apos;the same way&apos; — they&apos;re not. Not even close.&quot;
                  </p>
                  <p className="text-sm text-white/50">
                    <span className="text-white/30">[23-25초]</span> 캐치프레이즈 — &quot;You saw a bow. Koreans read a conversation. This is the real Korea.&quot;
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
                      { section: '후킹 (0-2초)', tone: '— (텍스트)', speed: '—', emotion: '시각적 질문' },
                      { section: 'Authority Hook (2-4초)', tone: '도발적, 자신감', speed: '보통', emotion: '"당신이 못 본 걸 보여줄게"' },
                      { section: '해독 (4-12초)', tone: '분석가, 날카로움', speed: '느리게', emotion: '탐정이 증거 설명하듯' },
                      { section: '의외성 (12-16초)', tone: '개인적, 진솔', speed: '보통', emotion: '자기 경험에서 나오는 확신' },
                      { section: '캐치프레이즈 (18-20초)', tone: '단호 + 여운', speed: '천천히', emotion: '정면 응시' },
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
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">한국어 믹스 포인트</h4>
                <div className="space-y-2 text-sm text-white/50">
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">절 (jeol)</span><span className="text-white/40">&quot;절 is not just bowing&quot; — 영어 &quot;bow&quot;로 번역 불가한 깊이</span></div>
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">한국인은 다 읽어요</span><span className="text-white/40">마무리 전 — 한국어로 말하는 순간의 진정성</span></div>
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
                    '슈룹 해당 장면 타임스탬프 특정 및 캡처 (2-3초, 페어유즈)',
                    '한복 준비 (001과 동일 세팅 — 같은 날 연속 촬영)',
                    '"가식 절" vs "진심 절" 시연 연습',
                    '촬영 장소 확보 (001과 동일)',
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 text-xs text-white/50 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-[#C4A052] focus:ring-[#C4A052]/50" />
                      <span className="group-hover:text-white/70 transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">001과 같은 날 촬영</h4>
                <p className="text-sm text-white/50">001 한복 팩트체크 (45분) → 의상 유지 → 002 절 해독 (40분) = 총 약 1.5시간</p>
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
                        { cut: 'D1', content: '"Koreans see a power struggle"', frame: '미디엄', note: '도발적' },
                        { cut: 'D2', content: '시연 — "가식 절"', frame: '풀샷 + 손 클로즈업', note: '나쁜 예' },
                        { cut: 'D3', content: '시연 — "진심 절"', frame: '풀샷 + 손 클로즈업', note: '좋은 예' },
                        { cut: 'D4', content: '"3초 더 머무는" 순간', frame: '풀샷 슬로모션', note: '킬링 컷' },
                        { cut: 'D5', content: '"I learned this at six"', frame: '미디엄', note: '개인적 톤' },
                        { cut: 'D6', content: '"절 tells them everything"', frame: '미디엄', note: '전문가 확신' },
                        { cut: 'D7', content: '캐치프레이즈', frame: '클로즈업', note: '정면 응시' },
                        { cut: 'D8', content: '손가락 비교 (벌어진 vs 모은)', frame: '극접사', note: '편집 인서트' },
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
                핵심: <span className="text-white/70">드라마 장면 ↔ 대표님 시연 교차편집</span>. 001과 동일한 &quot;K-드라마 해독 시리즈&quot; 포맷이되 의상→행동으로 대상 변경.
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
                      { section: '0-2초', visual: '드라마 캡처 + 텍스트', audio: '정적 or 드라마 원음' },
                      { section: '2-4초', visual: '대표님 정면', audio: '음성 100%' },
                      { section: '4-12초', visual: '드라마 슬로모션 ↔ 대표님 분석 교차', audio: '음성 100%, 드라마 음소거' },
                      { section: '12-16초', visual: '대표님 시연 (D2, D3, D4)', audio: '음성 100%' },
                      { section: '18-20초', visual: '대표님 클로즈업', audio: '음성 100% → 여운' },
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
                  <li>— 드라마 장면에 화살표/원 표시로 &quot;손가락&quot;, &quot;시선&quot; 포인트 지적</li>
                  <li>— D2(가식) → D3(진심) 전환 시 화면 분할 또는 빠른 컷</li>
                  <li>— &quot;three seconds longer&quot; 구간: 시간 카운터 효과 (1... 2... 3...)</li>
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
                      Same bow. Every Korean saw something completely different.
                      <br /><br />
                      In this K-drama scene, two women bow to the Queen.
                      <br />
                      One is performing. One means it.
                      <br />
                      Koreans read it instantly. Here&apos;s how.
                      <br /><br />
                      손가락, 속도, 시선, 숨 — 절 is a whole language.
                      <br />
                      I&apos;ve been reading it since I was six.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#kdrama', '#underthequeensumbrella', '#koreanbowing', '#koreanculture', '#jeol', '#koreanmanners', '#therealkorea'].map((tag) => (
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
                      You watched two women bow.
                      <br />
                      Koreans watched a power struggle.
                      <br /><br />
                      Same 큰절. Same room. Same Queen.
                      <br />
                      But one had her fingers spread — rushing through it.
                      <br />
                      The other? Fingers tight. Slow descent.
                      <br />
                      Eyes on the floor three seconds longer than required.
                      <br /><br />
                      She wasn&apos;t bowing. She was declaring war.
                      <br /><br />
                      In Korean traditional arts, I learned 절 before I learned music.
                      <br />
                      Because your teacher reads your bow
                      <br />
                      before they listen to your playing.
                      <br /><br />
                      Speed. Depth. Breath. Where your eyes land.
                      <br />
                      한국인은 다 읽어요. Koreans read all of it.
                      <br /><br />
                      So next time you watch K-drama and think
                      <br />
                      &quot;they&apos;re all bowing the same&quot; — look closer.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#kdrama', '#koreanculture', '#jeol', '#koreanbowing', '#therealkorea', '#underthequeensumbrella', '#koreanheritage'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">고정 댓글</h4>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    In Korean traditional arts training, your teacher watches your bow before they hear you play. Your 절 tells them if you&apos;re ready — or faking it.
                    <br /><br />
                    Which K-drama bow scene should I decode next?
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
                      { metric: '틱톡 조회수', target: '3,000+', note: 'K-드라마 태그 유입' },
                      { metric: '완주율', target: '50%+', note: '"해독" 구조 = 끝까지 봐야 답 나옴' },
                      { metric: '저장', target: '좋아요 대비 25%+', note: '"다시 보면서 확인하고 싶다"' },
                      { metric: '공유', target: '도달 대비 3%+', note: 'K-드라마 팬끼리 공유' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">시리즈 브랜딩</h4>
                <p className="text-sm text-white/50">001(한복) + 002(절) = <span className="text-[#C4A052]">&quot;K-Drama Decoded&quot;</span> 시리즈 — &quot;외국인이 놓치는 것을 20년 전문가가 해독&quot;</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 시리즈 확장 */}
          <CollapsibleSection title='시리즈 확장 — "K-Drama Decoded"' icon={Layers}>
            <div className="pt-4">
              <div className="space-y-2">
                {[
                  { ep: '001', title: '한복 착장', hook: '"K-drama got this wrong."' },
                  { ep: '002', title: '절의 미세한 차이', hook: '"Same bow. Koreans saw a power struggle."', active: true },
                  { ep: '003', title: '식사 장면 — 누가 먼저 숟가락 드는지', hook: '"The first person to eat reveals everything."' },
                  { ep: '004', title: '존댓말 vs 반말 전환 순간', hook: '"The moment they switched language — Koreans gasped."' },
                  { ep: '005', title: '궁궐 문턱을 넘는 발', hook: '"Left foot or right foot? It matters."' },
                ].map((item) => (
                  <div key={item.ep} className={`flex items-center gap-3 rounded-lg p-3 ${item.active ? 'bg-[#C4A052]/10 border border-[#C4A052]/20' : 'bg-white/[0.03]'}`}>
                    <span className={`text-[10px] font-mono w-8 h-5 rounded flex items-center justify-center ${item.active ? 'text-[#C4A052] bg-[#C4A052]/20' : 'text-white/30 bg-white/[0.05]'}`}>
                      {item.ep}
                    </span>
                    <span className={`text-sm font-medium ${item.active ? 'text-[#C4A052]' : 'text-white/60'}`}>{item.title}</span>
                    <span className="text-xs text-white/35 ml-auto italic">{item.hook}</span>
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
