'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Film, ChevronRight, Clapperboard, FileText, Sparkles, Lightbulb } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const CONTENT_PLANS = [
  {
    id: '001',
    title: 'K-Drama Hanbok Fact-Check',
    subtitle: '축 3 — Korea meets the World',
    format: '릴스 / 틱톡 숏폼',
    status: '기획 완료',
    statusColor: '#C4A052',
    description: 'K-드라마 속 한복 장면을 20년 전공자의 눈으로 감별하는 교정형 콘텐츠',
    href: '/cxp/001',
  },
  {
    id: '002',
    title: 'She Bowed 2 Degrees Wrong — Every Korean Noticed',
    subtitle: '축 3 + 축 1 — K-Drama 해독',
    format: '릴스 / 틱톡 숏폼',
    status: '기획 완료',
    statusColor: '#C4A052',
    description: 'K-드라마 속 절 장면을 해독 — 한국인은 즉시 읽었지만 외국인은 놓친 것',
    href: '/cxp/002',
  },
  {
    id: '003',
    title: 'The Sound Behind BTS — Daechwita',
    subtitle: '축 3 — Korea meets the World',
    format: '릴스 / 틱톡 숏폼',
    status: '기획 완료',
    statusColor: '#C4A052',
    description: 'BTS 슈가 대취타 4.6억뷰 — 그 곡의 진짜 원본 악기와 음악을 보여주는 콘텐츠',
    href: '/cxp/003',
  },
  {
    id: '004',
    title: 'My Teacher Watched My Bow Before She Heard Me Play',
    subtitle: '축 1 + 축 2 — The Real Korea',
    format: '릴스 / 틱톡 숏폼',
    status: '기획 완료',
    statusColor: '#C4A052',
    description: '국악 수업 첫날 악기 대신 절부터 가르친 이유 — 한국 예절의 뿌리를 개인 경험으로',
    href: '/cxp/004',
  },
  {
    id: '005',
    title: '5 Korean Cheat Codes — How to Make Any Elder Love You',
    subtitle: '축 1 — The Real Korea',
    format: '릴스 / 틱톡 숏폼',
    status: '기획 완료',
    statusColor: '#C4A052',
    description: '004의 철학이 일상에서 작동하는 5가지 구체적 행동 — "3년 수련을 30초로"',
    href: '/cxp/005',
  },
];

export default function CXPPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(61, 90, 86, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(183, 145, 110, 0.08), transparent)`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden sm:block absolute -left-6 top-1/2 w-16 h-px bg-gradient-to-r from-[#b7916e] to-transparent origin-left"
            />

            <div className="sm:pl-14">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-[#b7916e] text-[10px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4 font-light"
              >
                Content Experience Plan
              </motion.p>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl text-white/95 mb-2 sm:mb-6 leading-[1.1] tracking-tight"
                style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b7916e] via-[#d4c4a8] to-[#b7916e]">
                  CXP
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="hidden sm:block text-white/40 text-lg max-w-lg font-light leading-relaxed"
              >
                한국 전통문화를 세계에 전달하는
                <br />
                숏폼 콘텐츠 프로덕션 기획
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 프로젝트 설명 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Sparkles className="w-5 h-5 text-[#C4A052]/60 mt-0.5 shrink-0" />
              <div className="space-y-3 text-sm text-white/60 leading-relaxed">
                <p>
                  <span className="text-[#C4A052]">"자기 문화를 영어로 번역하는 사람"</span>이라는
                  포지셔닝을 기반으로, 틱톡과 인스타그램 릴스를 중심으로 콘텐츠를 제작합니다.
                </p>
                <p>
                  콘텐츠 3대 축 — <span className="text-white/70">The Real Korea</span> (진짜 한국 보여주기 50%),
                  <span className="text-white/70"> Lost in Translation</span> (한국어에만 있는 것들 25%),
                  <span className="text-white/70"> Korea meets the World</span> (전통 x 현대 25%)
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">

        {/* 전략 기획서 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4 px-1">
            Strategy
          </h2>
          <Link href="/cxp/strategy">
            <div className="group bg-[#3D5A56]/5 hover:bg-[#3D5A56]/10 border border-[#3D5A56]/20 hover:border-[#3D5A56]/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#3D5A56]/15 border border-[#3D5A56]/25 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#3D5A56]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-white/85 group-hover:text-white transition-colors">
                      The Pasta Queen 모델 분석 & 크리에이터 전략
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-white/40">ORKNEY Creator Team</span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/40">v1.0</span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#3D5A56]/15 text-[#3D5A56] border border-[#3D5A56]/25">
                        전략 기획서
                      </span>
                    </div>
                    <p className="text-xs text-white/35 mt-2 hidden sm:block">
                      "자기 문화를 영어로 번역하는 사람"의 포지셔닝 전략 — 성공 공식 분석, 대표 자산, 콘텐츠 3대 축, 네이밍, 성공 요건
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* 콘텐츠 아이디어 백로그 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8"
        >
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4 px-1">
            Ideas Backlog
          </h2>
          <Link href="/cxp/ideas">
            <div className="group bg-[#C4A052]/5 hover:bg-[#C4A052]/10 border border-[#C4A052]/20 hover:border-[#C4A052]/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#C4A052]/15 border border-[#C4A052]/25 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-[#C4A052]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-white/85 group-hover:text-white transition-colors">
                      콘텐츠 아이디어 백로그
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-white/40">3대 축 기반 아이디어 파이프라인</span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/40">READY · IDEA · PLANNED · PUBLISHED</span>
                    </div>
                    <p className="text-xs text-white/35 mt-2 hidden sm:block">
                      후킹 검증, 시리즈 기획, 우선순위 관리를 위한 콘텐츠 소재 저장소
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* 콘텐츠 플랜 목록 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4 px-1">
            Content Plans
          </h2>
          <div className="space-y-3">
            {CONTENT_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + index * 0.1 }}
              >
                <Link href={plan.href}>
                  <div className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 sm:p-6 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                          <span
                            className="text-lg font-light text-white/70"
                            style={{ fontFamily: "var(--font-cormorant), serif" }}
                          >
                            #{plan.id}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-white/85 group-hover:text-white transition-colors truncate">
                            {plan.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-white/40">{plan.subtitle}</span>
                            <span className="text-white/20">·</span>
                            <span className="flex items-center gap-1 text-xs text-white/40">
                              <Film className="w-3 h-3" />
                              {plan.format}
                            </span>
                            <span className="text-white/20">·</span>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                color: plan.statusColor,
                                backgroundColor: `${plan.statusColor}15`,
                                border: `1px solid ${plan.statusColor}30`,
                              }}
                            >
                              {plan.status}
                            </span>
                          </div>
                          <p className="text-xs text-white/35 mt-2 hidden sm:block">
                            {plan.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all shrink-0 ml-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
