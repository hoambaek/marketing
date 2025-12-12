import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import SupabaseInitializer from '@/components/SupabaseInitializer';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '뮤즈드마레 마스터플랜 | Muse de Marée 2026',
  description: '2026년 해저숙성 샴페인 브랜드 런칭을 위한 마스터플랜 관리 시스템',
  keywords: ['뮤즈드마레', 'Muse de Marée', '해저숙성', '샴페인', '럭셔리', '마스터플랜'],
  authors: [{ name: '뮤즈드마레 팀' }],
  openGraph: {
    title: '뮤즈드마레 마스터플랜',
    description: '2026년 해저숙성 샴페인 브랜드 런칭 마스터플랜',
    type: 'website',
    locale: 'ko_KR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0f1a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={cormorant.variable}>
      <body className="min-h-screen bg-gradient-animated bg-ambient-glow bg-grain">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <SupabaseInitializer>
          <main className="pt-16 min-h-screen">
            {children}
          </main>
        </SupabaseInitializer>
      </body>
    </html>
  );
}
