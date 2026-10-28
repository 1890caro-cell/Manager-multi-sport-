import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AdminLayoutShell } from '@/components/layout/admin-layout-shell';

export const metadata: Metadata = {
  title: 'Antigravity Sports Complex - Hệ Thống Quản Trị & Vận Hành',
  description: 'Trang quản trị trung tâm tổ hợp thể thao cao cấp: Sân bãi, Gym, POS, Gaming, Tài chính & IoT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased text-slate-900 bg-slate-50">
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </body>
    </html>
  );
}
