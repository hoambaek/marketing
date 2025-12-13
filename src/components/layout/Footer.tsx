'use client';

import { motion } from 'framer-motion';

interface FooterProps {
  subtitle?: string;
}

export function Footer({ subtitle }: FooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
      className="relative py-12 sm:py-20 px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="text-center">
          <span
            className="text-white/10 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Muse de Marée
          </span>
          {subtitle && (
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/20 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </motion.footer>
  );
}
