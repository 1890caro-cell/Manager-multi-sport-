import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';

export const metadata: Metadata = {
  title: 'Sports Complex - Tổ hợp Thể thao & Esports',
  description: 'Hệ thống đặt sân bóng đá, cầu lông, pickleball, tennis, phòng gym và khu gaming hiện đại.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="flex flex-col min-h-screen font-sans antialiased bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
