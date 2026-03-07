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
  AlertTriangle,
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

export default function CXP003Page() {
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
              #003
            </span>
            <span className="text-sm text-white/40">축 3 — Korea meets the World (전통 x 현대)</span>
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
            The Sound Behind BTS — Daechwita
          </h1>
          <p className="text-sm text-white/50">
            BTS 슈가 대취타 4.6억뷰 — 그 곡의 진짜 원본 악기와 음악을 보여주는 콘텐츠
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: '타깃 길이', value: 'TT 18초 / IG 24초', icon: Clock },
              { label: '언어', value: '영어 (한국어 믹스)', icon: Mic },
              { label: '상태', value: '섭외 필요', icon: Layers },
              { label: '핵심 악기', value: '태평소 (Taepyeongso)', icon: Film },
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
                BTS 슈가의 &quot;대취타&quot; MV 4.6억 뷰. 전 세계 ARMY가 이 곡을 들었지만,
                대취타가 실제로 뭔지 — 어떤 악기가 쓰이는지, 왜 이 음악이 존재하는지는 모른다.
                <span className="text-[#C4A052]"> &quot;니가 좋아하는 그 곡의 진짜 원본&quot;</span>을 보여주는 콘텐츠.
              </p>

              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">데이터 기반</h4>
                <ul className="space-y-1.5 text-sm text-white/50">
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>Agust D &quot;대취타&quot; MV: YouTube <strong>4.6억 조회</strong>, Spotify <strong>3.5억 스트리밍</strong></li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>곡 발매 후 국립국악원 대취타 설명 영상: <strong>12만+</strong> 조회 (폭증)</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>태평소의 소리 = 한 번 들으면 절대 잊을 수 없음 — 숏폼 후킹 최강</li>
                  <li className="flex items-start gap-2"><span className="text-[#C4A052] mt-0.5">—</span>BTS ARMY = 세계 최대 K-culture 팬덤 → 내장된 유입 파이프라인</li>
                </ul>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">기존 콘텐츠와 차별점</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/30 font-medium py-2 px-2">기존</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">대표님</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white/50">
                      <tr className="border-b border-white/[0.03]"><td className="py-2 px-2">BTS 리액션/분석</td><td className="py-2 px-2 text-white/60">원본 대취타 음악 자체를 보여줌</td></tr>
                      <tr className="border-b border-white/[0.03]"><td className="py-2 px-2">국립국악원 교육</td><td className="py-2 px-2 text-white/60">20년 전공자의 영어 스토리텔링</td></tr>
                      <tr className="border-b border-white/[0.03]"><td className="py-2 px-2">팬 편집</td><td className="py-2 px-2 text-white/60">실제 연주 현장 + 전문가 해설</td></tr>
                      <tr><td className="py-2 px-2">&quot;슈가 대단하다&quot;</td><td className="py-2 px-2 text-white/60">&quot;슈가가 쓴 그 음악, 진짜는 이거다&quot;</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white/50 mb-2">대취타란</h4>
                  <ul className="space-y-1.5 text-sm text-white/40">
                    <li>조선시대 왕의 행차 시 군악</li>
                    <li>악기: 태평소, 나발, 나각, 용고, 징, 자바라</li>
                    <li>&quot;크게 불고 크게 친다&quot;는 뜻</li>
                    <li>왕이 궁 밖으로 나갈 때 길을 여는 음악</li>
                  </ul>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white/50 mb-2">태평소 — 주인공 악기</h4>
                  <ul className="space-y-1.5 text-sm text-white/40">
                    <li>대취타에서 유일한 멜로디 악기</li>
                    <li>작은 몸체 → 압도적 음량 (&quot;한국의 트럼펫&quot;)</li>
                    <li>슈가 인트로에서 가장 먼저 들리는 소리</li>
                    <li>작고 소박한 외형 vs 폭발적 소리 = 반전 매력</li>
                  </ul>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 스크립트 */}
          <CollapsibleSection title="스크립트" icon={Film}>
            <div className="pt-4 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">틱톡 버전 (18초)</h4>
                <div className="space-y-3">
                  {[
                    { time: '0-2초', label: '충격 후킹', screen: '슈가 "대취타" MV 인트로 캡처 (태평소 소리 시작 부분)', subtitle: '"You\'ve heard this song a hundred times. You have no idea what it really is."', note: 'MV 인트로 1초 → 컷, 멘트 없음 — 텍스트만' },
                    { time: '2-4초', label: 'Authority Hook', screen: '대표님 정면 (진지한 표정)', subtitle: '"I studied this music for 20 years. This is the real thing."', note: '짧은 정적 (0.3초) → 컷' },
                    { time: '4-10초', label: '진짜 대취타 공개', screen: '태평소 연주자가 실제 연주 시작 → 폭발적 소리', subtitle: '"Taepyeongso. 태평소."', note: '태평소 원음 100%, 1.2초 단위 디테일 컷: 서(reed) 극접사, 볼 바람, 벨 끝 소리, 손가락 운지' },
                    { time: '10-14초', label: '스토리텔링', screen: '대표님 등장 (연주 장면 인서트 컷 교차)', subtitle: '"This is Daechwita. Not the song. 600 years ago, when the King of Joseon walked out of the palace — this cleared the road. Blow hard. Strike hard. That\'s what 대취타 means."' },
                    { time: '14-16초', label: '의외성 한 방', screen: '태평소 외형 극접사 (손바닥보다 작은 악기) → 연주 순간', subtitle: '"This tiny thing? It\'s louder than everything else combined."' },
                    { time: '16-18초', label: '캐치프레이즈', screen: '대표님 클로즈업', subtitle: '"Suga sampled a King\'s entrance. This is the real Korea."' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스 버전 (24초) — 확장</h4>
                <div className="space-y-3">
                  {[
                    { time: '0-2초', label: '충격 후킹', desc: '틱톡과 동일' },
                    { time: '2-4초', label: 'Authority Hook', desc: '틱톡과 동일' },
                    { time: '4-12초', label: '공개 확장', desc: '태평소 솔로 → 다른 악기 합류, 앙상블 빌드업. "Taepyeongso. 태평소. The voice of Daechwita."' },
                    { time: '12-18초', label: '스토리텔링', desc: '"This is Daechwita. Not the song. The original. 600 years ago... 대취타 — 크게 불고, 크게 치다. One small instrument leading an army of sound."' },
                    { time: '18-22초', label: '의외성', desc: '"This tiny thing? Louder than everything else combined. The King\'s voice was this small."' },
                    { time: '22-24초', label: '캐치프레이즈', desc: '"Suga knew. Now you know. This is the real Korea." (마지막 2초: 대취타 잔향)' },
                  ].map((scene) => (
                    <div key={scene.time} className="bg-white/[0.03] rounded-xl p-4 border-l-2 border-[#C4A052]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded">{scene.time}</span>
                        <span className="text-xs font-medium text-white/60">{scene.label}</span>
                      </div>
                      <p className="text-sm text-white/50">{scene.desc}</p>
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
                      { section: '충격 후킹 (0-2초)', tone: '— (텍스트)', speed: '—', emotion: '시각적 충격' },
                      { section: 'Authority Hook (2-4초)', tone: '도발적, 자신감', speed: '보통', emotion: '"20년 전공자" 각인' },
                      { section: '공개 (4-10초)', tone: '침묵 — 소리가 말함', speed: '—', emotion: '태평소에 압도당하게 둠' },
                      { section: '스토리 (10-14초)', tone: '힘 있고 리드미컬', speed: '약간 빠르게', emotion: '군악의 에너지를 말투에 실음' },
                      { section: '의외성 (14-16초)', tone: '반전, 놀라움', speed: '보통', emotion: '"이 작은 게?" 충격' },
                      { section: '캐치프레이즈 (16-18초)', tone: '쿨하고 단호', speed: '천천히', emotion: '미소 + 여유' },
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
                  <li>002 가야금: 감성형 (&quot;이 소리 들어봐&quot;)</li>
                  <li className="text-[#C4A052]">003 대취타: 에너지형 (&quot;이게 진짜야&quot;) — 군악의 파워를 말투에 반영</li>
                </ul>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 mb-2">한국어 믹스 포인트</h4>
                <div className="space-y-2 text-sm text-white/50">
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">태평소</span><span className="text-white/40">악기 이름 공개 시 — 4음절의 리듬감</span></div>
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">대취타</span><span className="text-white/40">ARMY가 이미 아는 단어 — 인식 즉시</span></div>
                  <div className="flex gap-3"><span className="text-[#C4A052] shrink-0">크게 불고, 크게 치다</span><span className="text-white/40">한국어 원문의 힘 (릴스 확장판)</span></div>
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
                    '태평소 연주자 (또는 대취타 앙상블) 섭외 및 일정 확정',
                    '대취타 앙상블 가능 여부 확인 (불가 시 태평소 솔로)',
                    '슈가 "대취타" MV 인트로 캡처 (페어유즈 — 2-3초)',
                    '촬영 장소 사전 답사 (소리가 큰 악기 — 야외 추천)',
                    '대표님 의상 결정 (세미포멀 — 현대 x 전통 축)',
                    '연주자/연주단 초상권 동의서',
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 text-xs text-white/50 cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-[#C4A052] focus:ring-[#C4A052]/50" />
                      <span className="group-hover:text-white/70 transition-colors">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">섭외 우선순위</h4>
                <div className="space-y-2">
                  {[
                    { rank: 1, desc: '국립국악원 정악단 대취타 연주팀' },
                    { rank: 2, desc: '태평소 전공 연주자 단독' },
                    { rank: 3, desc: '국악 전공 동문 네트워크' },
                  ].map((s) => (
                    <div key={s.rank} className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3">
                      <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 w-5 h-5 rounded flex items-center justify-center">{s.rank}</span>
                      <span className="text-sm text-white/50">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">컷 리스트 (12컷)</h4>
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
                        { cut: 'C1', content: '태평소 외형 (손바닥 위)', frame: '극접사', note: '반전 준비' },
                        { cut: 'C2', content: '태평소 연주 시작 — 첫 음', frame: '미디엄', note: '핵심 임팩트' },
                        { cut: 'C3', content: '태평소 파워 연주', frame: '미디엄~풀샷', note: '에너지' },
                        { cut: 'C4', content: '서(reed) 극접사', frame: '극접사', note: '소리의 원천' },
                        { cut: 'C5', content: '대취타 풀 연주 (앙상블)', frame: '와이드', note: '스케일감' },
                        { cut: 'C6', content: '용고 치는 장면 (앙상블)', frame: '미디엄', note: '리듬 임팩트' },
                        { cut: 'C7', content: '"the real thing?" 멘트', frame: '미디엄', note: '도발적' },
                        { cut: 'C8', content: '스토리텔링 본문', frame: '미디엄', note: '에너지 톤' },
                        { cut: 'C9', content: '"Suga sampled..." 펀치라인', frame: '클로즈업', note: '쿨한 미소' },
                        { cut: 'C10', content: '캐치프레이즈', frame: '클로즈업', note: '정면 응시' },
                        { cut: 'C11', content: '태평소 크기 비교 (릴스 확장용)', frame: '미디엄', note: '반전 강조' },
                        { cut: 'C12', content: '비하인드 — 대표님 + 연주자 대화', frame: '와이드', note: '스토리용' },
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

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">촬영 장소 옵션</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/30 font-medium py-2 px-2">순위</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">장소</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">장점</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">주의점</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white/50">
                      {[
                        { rank: '1', place: '궁궐 앞/궁궐 담장 배경 (야외)', pros: '대취타 본래 맥락과 완벽 일치', cons: '촬영 허가, 소음' },
                        { rank: '2', place: '넓은 한옥 마당', pros: '소리 울림 + 한국적 배경', cons: '야외 소음' },
                        { rank: '3', place: '국악원 야외 공연장', pros: '공간 확보 용이', cons: '허가 필요' },
                        { rank: '4', place: '넓은 실내 (국악원 대연습실 등)', pros: '날씨 무관, 소리 통제', cons: '시각적 임팩트 약함' },
                      ].map((row) => (
                        <tr key={row.rank} className="border-b border-white/[0.03]">
                          <td className="py-2 px-2 font-mono text-[#C4A052]">{row.rank}</td>
                          <td className="py-2 px-2">{row.place}</td>
                          <td className="py-2 px-2 text-white/40">{row.pros}</td>
                          <td className="py-2 px-2 text-white/30">{row.cons}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[#C4A052]/70 mt-2">태평소는 음량이 매우 큼 — 야외 촬영 강력 추천.</p>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">촬영 장비</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— 스마트폰 (세로 9:16) + 삼각대 2개 (연주자 + 대표님)</li>
                  <li>— 외장 마이크 필수 — 태평소는 음량이 극도로 큼 → 게인 낮게 세팅</li>
                  <li>— 숏건 마이크 (악기에서 1m+) + 핀마이크 (대표님)</li>
                  <li>— 자연광 (야외) / 앙상블 촬영 시 광각 렌즈</li>
                </ul>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">촬영 순서</h4>
                <div className="space-y-2 text-sm text-white/40">
                  <p><span className="text-white/60">1단계 (40분):</span> 연주 촬영 — C2→C3→C4→C1 (3-4회), 앙상블 가능 시 C5→C6</p>
                  <p><span className="text-white/60">2단계 (20분):</span> 멘트 — C7→C8→C9→C10 (각 3-4회)</p>
                  <p><span className="text-white/60">3단계 (15분):</span> 보조 컷 — C11 크기 비교, C12 비하인드</p>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 편집 가이드 */}
          <CollapsibleSection title="편집 가이드" icon={Scissors}>
            <div className="pt-4 space-y-5">
              <p className="text-sm text-white/60">
                편집 키워드: <span className="text-[#C4A052]">충격과 에너지</span>. MV의 세련된 소리 → 원음의 날것 → &quot;이게 진짜였어?&quot; 충격.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-white/30 font-medium py-2 px-2">구간</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">오디오 레벨</th>
                      <th className="text-left text-white/30 font-medium py-2 px-2">비주얼</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/50">
                    {[
                      { s: '0-2초 (MV)', audio: 'MV 오디오 50%', visual: 'MV 캡처 + 충격 텍스트' },
                      { s: '2-4초 (Authority)', audio: '정적 0.3초 → 대표님 음성', visual: '대표님 정면' },
                      { s: '4-10초 (원음 공개)', audio: '태평소 원음 100% — 볼륨 터지게', visual: '연주 장면, 1.2초 컷' },
                      { s: '10-14초 (스토리)', audio: '대취타 배경 15%, 음성 100%', visual: '대표님 + 인서트' },
                      { s: '14-16초 (의외성)', audio: '정적 → 원음 폭발', visual: '외형 극접사 → 연주' },
                      { s: '16-18초 (마무리)', audio: '대취타 잔향 20%, 음성 100%', visual: '대표님 클로즈업' },
                    ].map((row) => (
                      <tr key={row.s} className="border-b border-white/[0.03]">
                        <td className="py-2 px-2 text-white/60">{row.s}</td>
                        <td className="py-2 px-2">{row.audio}</td>
                        <td className="py-2 px-2 text-white/40">{row.visual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">핵심: 5초의 반전</h4>
                <p className="text-sm text-white/50 leading-relaxed">
                  0-5초(MV) → 5초(원음 폭발)의 전환이 콘텐츠의 생명.
                  MV 소리는 믹싱된 세련된 소리, 원음은 야외에서 울리는 날것의 태평소.
                  <span className="text-[#C4A052]"> 편집 시 원음 볼륨을 절대 줄이지 않을 것.</span>
                </p>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> 절대 하지 말 것
                </h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— MV 영상 3초 이상 사용 — 저작권 리스크</li>
                  <li>— 태평소 원음 볼륨 줄이기 — 이 악기의 핵심은 음량</li>
                  <li>— BTS/슈가 비하/비판 뉘앙스 — &quot;슈가가 이걸 알았다&quot; 톤</li>
                  <li>— 과한 팬덤 아부 — 전문가의 인정 톤</li>
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
                      BTS Suga&apos;s Daechwita has 460 million views.
                      <br />
                      But have you heard the REAL Daechwita?
                      <br /><br />
                      This tiny instrument — taepyeongso — led the King&apos;s procession 600 years ago.
                      <br />
                      대취타: &quot;Blow hard. Strike hard.&quot; That&apos;s what it means.
                      <br /><br />
                      Suga sampled a King&apos;s entrance. Now you know.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#daechwita', '#bts', '#suga', '#agustd', '#taepyeongso', '#koreanmusic', '#traditionalmusic', '#koreanculture', '#kpop', '#army'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">고정 댓글</h4>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    Suga didn&apos;t just sample a beat. He sampled 600 years of Korean royal history.
                    <br /><br />
                    Which BTS song uses Korean tradition next? I&apos;ll break it down.
                    <br />
                    Drop your picks below.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">인스타 릴스</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase">캡션</span>
                    <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                      460 million views. But nobody showed you the original.
                      <br /><br />
                      BTS Suga&apos;s &quot;Daechwita&quot; sampled one of Korea&apos;s oldest military traditions.
                      <br />
                      대취타 — it literally means &quot;blow hard, strike hard.&quot;
                      <br /><br />
                      When the King of Joseon walked out of the palace,
                      <br />
                      this music cleared every road ahead of him.
                      <br />
                      Not a playlist. Not background music.
                      <br />
                      A wall of sound that said: the King is coming.
                      <br /><br />
                      And this tiny instrument — the taepyeongso (태평소) — is the voice that leads it all.
                      <br />
                      Smaller than your forearm. Louder than everything else combined.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['#daechwita', '#taepyeongso', '#bts', '#suga', '#agustd', '#koreanheritage', '#therealkorea', '#koreanmusic', '#army'].map((tag) => (
                      <span key={tag} className="text-[10px] text-[#C4A052]/60 bg-[#C4A052]/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">스토리 시퀀스</h4>
                <div className="space-y-2">
                  {[
                    '스토리 1: 대취타 MV 스크린샷 + "Everyone heard this song."',
                    '스토리 2: 태평소 실물 사진 — "But have you seen THIS?"',
                    '스토리 3: 태평소 원음 3초 — 볼륨업 스티커 + "Turn it UP."',
                    '스토리 4: 릴스 공유 — "Full breakdown here."',
                    '스토리 5: 투표 — "Did you know Daechwita was real music? Yes / Mind blown"',
                    '스토리 6: Q&A — "Which K-pop song should I trace back to Korean tradition?"',
                  ].map((story, i) => (
                    <p key={i} className="text-xs text-white/50">{story}</p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">ARMY 타깃 전략</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— BTS/슈가 해시태그 커뮤니티에서 자연 발견 유도</li>
                  <li>— ARMY 댓글에 적극 답글 — &quot;Suga has amazing taste in Korean heritage&quot;</li>
                  <li>— ARMY 팬계정 리포스트/인용 유도</li>
                  <li>— 국립국악원 공식 계정 반응 시 → 공식 협업 제안</li>
                </ul>
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
                      { metric: '틱톡 조회수', target: '10,000+', note: 'BTS 태그 유입' },
                      { metric: '완주율', target: '40%+', note: '18초, 짧지만 정보 밀도 높음' },
                      { metric: '저장', target: '좋아요 대비 20%+', note: '교육적 가치' },
                      { metric: '공유(Sends)', target: '도달 대비 5%+', note: 'ARMY 공유 문화' },
                      { metric: '댓글', target: '15건+', note: 'ARMY 유입 기대' },
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
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">핵심 지표: 공유(Sends)</h4>
                <p className="text-sm text-white/50">ARMY는 공유 문화가 극도로 강한 팬덤. &quot;슈가 관련 새로운 콘텐츠&quot; → 팬덤 내 자발적 확산. 공유율 5% 이상이면 팬덤 유입 성공.</p>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">001, 002, 003 크로스 비교</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/30 font-medium py-2 px-2"></th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">001 한복</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">002 가야금</th>
                        <th className="text-left text-white/30 font-medium py-2 px-2">003 대취타</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white/50">
                      <tr className="border-b border-white/[0.03]"><td className="py-2 px-2">유입 경로</td><td className="py-2 px-2">K-드라마 검색</td><td className="py-2 px-2">가야금 커버 검색</td><td className="py-2 px-2 text-[#C4A052]">BTS/ARMY 팬덤</td></tr>
                      <tr className="border-b border-white/[0.03]"><td className="py-2 px-2">강점 지표</td><td className="py-2 px-2">댓글/반응</td><td className="py-2 px-2">저장/공유</td><td className="py-2 px-2 text-[#C4A052]">공유/조회수</td></tr>
                      <tr className="border-b border-white/[0.03]"><td className="py-2 px-2">포지셔닝</td><td className="py-2 px-2">교정자</td><td className="py-2 px-2">번역자</td><td className="py-2 px-2 text-[#C4A052]">연결자</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* 시리즈 확장 */}
          <CollapsibleSection title="시리즈 확장 — K-pop x 전통문화" icon={Layers}>
            <div className="pt-4">
              <p className="text-sm text-white/50 mb-4">
                이 콘텐츠가 반응을 얻으면 <span className="text-[#C4A052]">&quot;K-pop의 뿌리 찾기&quot;</span> 스핀오프 시리즈:
              </p>
              <div className="space-y-2">
                {[
                  { ep: 1, artist: 'Agust D — 대취타', element: '태평소, 대취타 군악', hook: '"Suga sampled a King\'s entrance"', active: true },
                  { ep: 2, artist: 'Stray Kids — 소리꾼', element: '판소리 창법', hook: '"This K-pop group is singing 판소리"' },
                  { ep: 3, artist: 'BLACKPINK — How You Like That', element: '한복 요소, 전통 패턴', hook: '"Hidden Korean symbols in BP\'s MV"' },
                  { ep: 4, artist: 'BTS — IDOL', element: '탈춤, 얼쑤', hook: '"What BTS is actually chanting"' },
                  { ep: 5, artist: 'ATEEZ — Wonderland', element: '사물놀이 비트', hook: '"This beat is 500 years old"' },
                ].map((item) => (
                  <div key={item.ep} className={`flex items-start gap-3 rounded-lg p-3 ${item.active ? 'bg-[#C4A052]/10 border border-[#C4A052]/20' : 'bg-white/[0.03]'}`}>
                    <span className={`text-[10px] font-mono w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${item.active ? 'text-[#C4A052] bg-[#C4A052]/20' : 'text-white/30 bg-white/[0.05]'}`}>
                      {item.ep}
                    </span>
                    <div className="min-w-0">
                      <span className={`text-sm font-medium ${item.active ? 'text-[#C4A052]' : 'text-white/60'}`}>{item.artist}</span>
                      <span className="text-xs text-white/30 ml-2">{item.element}</span>
                      <p className="text-xs text-white/35 italic mt-0.5">{item.hook}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* 캐러셀 후속편 */}
          <CollapsibleSection title="캐러셀 후속편 (인스타 전용)" icon={Layers}>
            <div className="pt-4 space-y-4">
              <p className="text-sm text-white/50">
                릴스 업로드 다음 주 토요일: <span className="text-[#C4A052]">&quot;Daechwita: The King&apos;s Music That BTS Made Famous&quot;</span>
              </p>
              <div className="space-y-2">
                {[
                  { slide: '1 (커버)', content: '대취타 연주 장면 + "Daechwita 101"' },
                  { slide: '2', content: '대취타란? — 조선 왕의 행차 음악, 600년 역사' },
                  { slide: '3', content: '악기 구성 — 태평소, 나발, 나각, 용고, 징, 자바라' },
                  { slide: '4', content: '"Why Suga?" — 슈가가 대취타를 선택한 맥락' },
                  { slide: '5', content: 'MV vs 원본 — 사운드 비교' },
                  { slide: '6', content: '"대취타" 한자 풀이 — 大吹打 = 크게 불고 크게 치다' },
                  { slide: '7', content: '지금도 볼 수 있는 곳 — 경복궁 수문장 교대식, 국립국악원' },
                  { slide: '8 (CTA)', content: '"Share this with an ARMY who needs to know."' },
                ].map((item) => (
                  <div key={item.slide} className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3">
                    <span className="text-[10px] font-mono text-[#C4A052] bg-[#C4A052]/10 px-1.5 py-0.5 rounded shrink-0">{item.slide}</span>
                    <span className="text-sm text-white/50">{item.content}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40">ARMY의 저장 + 공유 극대화 타깃. &quot;팬으로서 알아야 할 배경지식&quot; 포지셔닝.</p>
            </div>
          </CollapsibleSection>

          {/* 저작권 */}
          <CollapsibleSection title="저작권/페어유즈 주의사항" icon={AlertTriangle}>
            <div className="pt-4 space-y-4">
              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 mb-2">슈가 &quot;대취타&quot; MV 사용</h4>
                <ul className="space-y-1.5 text-sm text-white/40">
                  <li>— 2-3초 캡처만 사용 (숏폼 리뷰/해설 목적 — 페어유즈)</li>
                  <li>— MV 오디오 최소화, 대표님 음성으로 빠르게 전환</li>
                  <li>— 틱톡: &quot;original sound&quot; 태그 사용 (MV 사운드 트랙 X)</li>
                </ul>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4">
                <h4 className="text-sm font-medium text-white/50 mb-2">대안 (MV 사용 없이)</h4>
                <p className="text-sm text-white/40">
                  후킹을 &quot;You&apos;ve heard Daechwita 460 million times.&quot; 텍스트만으로 시작 →
                  MV 캡처 대신 대표님이 직접 이야기 → 원음 공개. 저작권 리스크 zero.
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
