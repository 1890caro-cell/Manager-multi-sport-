'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Dumbbell, CreditCard, Wallet } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/booking', label: 'Đặt sân', icon: Calendar },
    { href: '/gym', label: 'Gym', icon: Dumbbell },
    { href: '/my-bookings', label: 'Vé của tôi', icon: CreditCard },
    { href: '/wallet', label: 'Ví', icon: Wallet },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
