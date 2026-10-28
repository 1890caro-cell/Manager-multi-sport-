'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Building,
  Dumbbell,
  Users,
  ShoppingBag,
  Boxes,
  BadgePercent,
  Gamepad2,
  Trophy,
  Sparkles,
  WalletCards,
  FileText,
  Cpu,
  ShieldCheck,
  Settings,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  category: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    category: 'Vận hành cốt lõi',
    label: 'Tổng quan Realtime',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    category: 'Vận hành cốt lõi',
    label: 'Lịch Đặt & Khóa sân',
    href: '/bookings',
    icon: CalendarDays,
  },
  {
    category: 'Vận hành cốt lõi',
    label: 'Cơ sở & Bảng giá',
    href: '/facilities',
    icon: Building,
  },
  {
    category: 'Dịch vụ & Khu vực',
    label: 'Phòng Gym & Sức chứa',
    href: '/gym',
    icon: Dumbbell,
  },
  {
    category: 'Dịch vụ & Khu vực',
    label: 'PT & Lớp học nhóm',
    href: '/pt-classes',
    icon: Users,
  },
  {
    category: 'Bán hàng & Quầy POS',
    label: 'Quầy POS Canteen',
    href: '/pos',
    icon: ShoppingBag,
  },
  {
    category: 'Bán hàng & Quầy POS',
    label: 'Kho hàng & Ca thu ngân',
    href: '/inventory',
    icon: Boxes,
  },
  {
    category: 'Bán hàng & Quầy POS',
    label: 'Cho thuê dụng cụ',
    href: '/rentals',
    icon: BadgePercent,
  },
  {
    category: 'Gaming & Giải đấu',
    label: 'Phòng máy Gaming 70 máy',
    href: '/gaming',
    icon: Gamepad2,
  },
  {
    category: 'Gaming & Giải đấu',
    label: 'Giải đấu thể thao',
    href: '/tournaments',
    icon: Trophy,
  },
  {
    category: 'Gaming & Giải đấu',
    label: 'Khuyến mãi & Combo',
    href: '/promotions',
    icon: Sparkles,
  },
  {
    category: 'Tài chính & Pháp lý',
    label: 'Kế toán & Đối soát ví',
    href: '/finance',
    icon: WalletCards,
  },
  {
    category: 'Tài chính & Pháp lý',
    label: 'Hóa đơn điện tử VAT',
    href: '/invoices',
    icon: FileText,
  },
  {
    category: 'Hạ tầng & Hệ thống',
    label: 'Trạm Bridge & Thiết bị IoT',
    href: '/bridge',
    icon: Cpu,
  },
  {
    category: 'Hạ tầng & Hệ thống',
    label: 'Nhân sự & Phân quyền',
    href: '/users',
    icon: ShieldCheck,
  },
  {
    category: 'Hạ tầng & Hệ thống',
    label: 'Cấu hình hệ thống',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  // Group nav items by category
  const categories = Array.from(new Set(NAV_ITEMS.map((item) => item.category)));

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0 h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md flex-shrink-0">
          <Flame className="w-5 h-5 fill-slate-950" />
        </div>
        <div className="overflow-hidden">
          <span className="font-black text-sm tracking-tight text-white block truncate">
            ANTIGRAVITY ADMIN
          </span>
          <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase block">
            Operations Portal
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {categories.map((cat) => (
          <div key={cat} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {cat}
            </h3>
            <div className="space-y-0.5 mt-1.5">
              {NAV_ITEMS.filter((item) => item.category === cat).map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900',
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {isActive && <ChevronRight className="w-3 h-3 text-emerald-400 opacity-80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Footer info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống trực tuyến</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">v1.0.0-prod</span>
      </div>
    </aside>
  );
}
