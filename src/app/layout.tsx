import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFBFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0C1929' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-animated">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="pt-16 min-h-screen">
          {children}
        </main>

        {/* Subtle Background Pattern */}
        <div
          className="fixed inset-0 -z-10 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(26, 54, 93, 0.03) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </body>
    </html>
  );
}
