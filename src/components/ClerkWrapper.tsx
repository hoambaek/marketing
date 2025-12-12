'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { koKR } from '@clerk/localizations';
import { ReactNode } from 'react';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const clerkAppearance = {
  variables: {
    colorPrimary: '#b7916e',
    colorBackground: '#0d1525',
    colorInputBackground: '#0a0f1a',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255, 255, 255, 0.6)',
  },
  elements: {
    formButtonPrimary: 'bg-[#b7916e] hover:bg-[#a07d5c]',
    card: 'bg-[#0d1525] border border-white/10',
    headerTitle: 'text-white',
    headerSubtitle: 'text-white/60',
    socialButtonsBlockButton: 'hidden',
    socialButtonsProviderIcon: 'hidden',
    dividerLine: 'hidden',
    dividerText: 'hidden',
    formFieldLabel: 'text-white/70',
    formFieldInput: 'bg-[#0a0f1a] border-white/10 text-white',
    footerActionLink: 'text-[#b7916e] hover:text-[#d4c4a8]',
  },
};

export function ClerkWrapper({ children }: { children: ReactNode }) {
  // Clerk가 설정되지 않은 경우 그냥 children 반환
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider localization={koKR} appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  );
}

// Clerk 설정 여부 확인 유틸리티
export const useClerkConfigured = () => isClerkConfigured;
