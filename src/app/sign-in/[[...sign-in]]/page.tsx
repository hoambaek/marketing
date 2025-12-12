'use client';

import { SignIn } from '@clerk/nextjs';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0d1525] to-[#0a0f1a]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 145, 110, 0.15), transparent),
                              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(139, 92, 246, 0.08), transparent)`,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl text-white/90 mb-2"
            style={{ fontFamily: "var(--font-cormorant), 'Playfair Display', Georgia, serif" }}
          >
            Muse de Marée
          </h1>
          <p className="text-white/40 text-sm">재고관리 시스템 로그인</p>
        </div>

        {isClerkConfigured ? (
          /* Clerk Sign In - 회원가입 링크 숨김 */
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-[#0d1525]/80 backdrop-blur-xl border border-white/10 shadow-2xl',
                headerTitle: 'text-white text-xl',
                headerSubtitle: 'text-white/50',
                formButtonPrimary: 'bg-[#b7916e] hover:bg-[#a07d5c] text-white',
                formFieldLabel: 'text-white/60',
                formFieldInput: 'bg-[#0a0f1a] border-white/30 text-white placeholder:text-white/30 focus:border-[#b7916e]/50',
                footerAction: 'hidden', // 회원가입 링크 숨김
                footer: 'hidden', // 전체 푸터 숨김
                dividerLine: 'bg-white/10',
                dividerText: 'text-white/40',
                socialButtonsBlockButton: 'bg-white/5 border-white/10 text-white hover:bg-white/10',
                socialButtonsBlockButtonText: 'text-white font-medium',
                identifierPreviewText: 'text-white',
                identifierPreviewEditButton: 'text-[#b7916e] hover:text-[#d4c4a8]',
                formFieldAction: 'text-[#b7916e] hover:text-[#d4c4a8]',
                alert: 'bg-red-500/10 border-red-500/20 text-red-400',
                otpCodeFieldInput: 'bg-[#0a0f1a] border-white/40 text-white text-center text-xl',
                otpCodeField: 'border-white/40',
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl={undefined} // 회원가입 비활성화
          />
        ) : (
          /* Clerk 미설정 시 안내 메시지 */
          <div className="bg-[#0d1525]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-amber-400/60" />
            </div>
            <h2 className="text-white/80 text-lg mb-2">인증 시스템 미설정</h2>
            <p className="text-white/40 text-sm mb-4">
              Clerk API 키가 설정되지 않았습니다.<br />
              .env.local 파일에 Clerk 키를 추가해주세요.
            </p>
            <Link
              href="/inventory"
              className="inline-block px-6 py-3 rounded-xl bg-[#b7916e]/20 border border-[#b7916e]/30 text-[#d4c4a8] hover:bg-[#b7916e]/30 transition-all"
            >
              재고관리 바로가기
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-8">
          관리자 전용 시스템입니다
        </p>
      </motion.div>
    </div>
  );
}
