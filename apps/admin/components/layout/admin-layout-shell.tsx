'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname.startsWith('/(auth)');

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/60">
          {children}
        </main>
      </div>
    </div>
  );
}
