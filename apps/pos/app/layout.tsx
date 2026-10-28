import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antigravity Touch POS | Quầy Canteen & Bán lẻ',
  description: 'Giao diện POS bán hàng quầy cảm ứng tốc độ cao',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-background text-foreground overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
