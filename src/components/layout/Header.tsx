'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X, Settings, LogOut, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@clerk/nextjs';

interface NavItem {
  name: string;
  href: string;
  external?: boolean;
}

const navigation: NavItem[] = [
  { name: '대시보드', href: '/' },
  { name: '월별플랜', href: '/monthly-plan' },
  { name: '캘린더', href: '/calendar' },
  { name: 'KPI', href: '/kpi' },
  { name: '재고관리', href: '/inventory' },
  { name: '예산관리', href: '/budget' },
  { name: 'Data Log', href: '/data-log' },
  { name: 'UAPS', href: '/uaps' },
  { name: 'CXP', href: '/cxp' },
  { name: 'Members', href: '/admin' },
  { name: '블로그', href: 'https://blog.musedemaree.com/admin', external: true },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 외부 기록자용 공개 페이지(/tasting/*)에서는 내부 대시보드 네비게이션을 숨긴다
  if (pathname?.startsWith('/tasting')) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* iOS PWA Safe Area Background */}
      <div
        className="bg-[#0a0f1a] w-full"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />
      {/* Glassmorphism Background */}
      <div className="bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Link href="/" className="flex items-center gap-2.5 group">
                {/* 심볼 로고 */}
                <Image
                  src="/images/logo/logo_trans_W.png"
                  alt="Muse de Marée"
                  width={44}
                  height={36}
                  priority
                  className="h-8 w-auto opacity-95"
                />
                {/* 텍스트 로고 — 심볼과 시각적 중심을 맞추기 위해 살짝 위로 */}
                <Image
                  src="/images/logo/logo_text_trans_W.png"
                  alt="Muse de Marée"
                  width={170}
                  height={26}
                  priority
                  className="h-[18px] sm:h-5 w-auto opacity-90 -translate-y-[2px]"
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden md:flex items-center gap-1"
            >
              {navigation.map((item) => {
                const isActive = pathname === item.href;

                // 외부 링크 스타일링
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative px-4 py-2 text-sm font-medium transition-all rounded-lg flex items-center gap-1.5 text-[#b7916e]/70 hover:text-[#d4a574] hover:bg-[#b7916e]/[0.08] border border-transparent hover:border-[#b7916e]/20"
                    >
                      {item.name}
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 text-sm font-medium transition-colors rounded-lg',
                      isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    )}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-white/[0.08] border border-white/[0.06] rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </motion.div>

            {/* Right Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              {/* Logout - Desktop only */}
              <SignOutButton>
                <button className="hidden md:flex items-center gap-2 p-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all">
                  <LogOut className="w-5 h-5" />
                </button>
              </SignOutButton>

              {/* Settings */}
              <Link
                href="/settings"
                className="p-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
              >
                <Settings className="w-5 h-5" />
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </motion.div>
          </div>

          {/* Mobile Navigation */}
          <motion.div
            initial={false}
            animate={{
              height: mobileMenuOpen ? 'auto' : 0,
              opacity: mobileMenuOpen ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
          >
            <div className="py-4 space-y-1 border-t border-white/[0.06]">
              {navigation.map((item) => {
                const isActive = pathname === item.href;

                // 모바일 외부 링크 스타일링
                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-base font-medium rounded-xl transition-all text-[#b7916e]/80 hover:text-[#d4a574] hover:bg-[#b7916e]/[0.08] border border-[#b7916e]/10"
                    >
                      <span>{item.name}</span>
                      <ExternalLink className="w-4 h-4 opacity-60" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-4 py-3 text-base font-medium rounded-xl transition-colors',
                      isActive
                        ? 'text-white bg-white/[0.08]'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* Logout - Mobile */}
              <div className="pt-3 mt-3 border-t border-white/[0.06]">
                <SignOutButton>
                  <button className="flex items-center gap-3 w-full px-4 py-3 text-base font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.04] rounded-xl transition-colors">
                    <LogOut className="w-5 h-5" />
                    로그아웃
                  </button>
                </SignOutButton>
              </div>
            </div>
          </motion.div>
        </nav>
      </div>
    </header>
  );
}
