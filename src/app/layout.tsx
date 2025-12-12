import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Lora } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import SupabaseInitializer from '@/components/SupabaseInitializer';
import { ClerkWrapper } from '@/components/ClerkWrapper';
import Toast from '@/components/Toast';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '뮤즈드마레 마스터플랜 | Muse de Marée',
  description: '해저숙성 샴페인 브랜드 런칭을 위한 마스터플랜 관리 시스템',
  keywords: ['뮤즈드마레', 'Muse de Marée', '해저숙성', '샴페인', '럭셔리', '마스터플랜'],
  authors: [{ name: '뮤즈드마레 팀' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Muse de Marée',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    title: '뮤즈드마레 마스터플랜',
    description: '해저숙성 샴페인 브랜드 런칭 마스터플랜',
    type: 'website',
    locale: 'ko_KR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // Allow content to extend into safe areas
  themeColor: '#0a0f1a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkWrapper>
      <html lang="ko" suppressHydrationWarning className={`${cormorant.variable} ${lora.variable}`}>
        <body className="min-h-screen bg-gradient-animated bg-ambient-glow bg-grain">
          {/* Header */}
          <Header />

          {/* Main Content */}
          <SupabaseInitializer>
            <main className="pt-16 min-h-screen">
              {children}
            </main>
          </SupabaseInitializer>

          {/* Toast Notifications */}
          <Toast />
        </body>
      </html>
    </ClerkWrapper>
  );
}
