'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@clerk/nextjs';

const navigation = [
  { name: '대시보드', href: '/' },
  { name: '월별플랜', href: '/monthly-plan' },
  { name: '이슈관리', href: '/issues' },
  { name: '캘린더', href: '/calendar' },
  { name: 'KPI', href: '/kpi' },
  { name: '재고관리', href: '/inventory' },
  { name: '예산관리', href: '/budget' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
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
              <Link href="/" className="flex items-center gap-3 group">
                {/* Logo Image */}
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="Muse de Marée"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                {/* Logo Text */}
                <div>
                  <p
                    className="text-lg sm:text-xl tracking-tight text-white/90"
                    style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
                  >
                    Muse de Marée
                  </p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#b7916e] -mt-0.5">
                    Master Plan
                  </p>
                </div>
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
