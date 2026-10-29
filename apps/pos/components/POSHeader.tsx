'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bridge } from '@/lib/bridge';
import { usePOS } from '@/lib/pos-context';
import {
  ShoppingCart,
  Clock,
  Receipt,
  ShoppingBag,
  Cpu,
  QrCode,
  Lock,
  Unlock,
  KeyRound,
  User,
  ShieldCheck,
} from 'lucide-react';

interface POSHeaderProps {
  currentShift?: any;
  onOpenShiftModal?: () => void;
  onCloseShiftModal?: () => void;
  bridgeOnline?: boolean;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  currentShift: propShift,
  onOpenShiftModal: propOpenShift,
  onCloseShiftModal: propCloseShift,
  bridgeOnline: propBridgeOnline,
}) => {
  const pathname = usePathname();
  const pos = usePOS();

  // Prefer props if passed, otherwise fall back to synchronized POSContext
  const currentShift = propShift !== undefined ? propShift : pos.currentShift;
  const onOpenShiftModal = propOpenShift || (() => pos.openShiftModal('OPEN'));
  const onCloseShiftModal = propCloseShift || (() => pos.openShiftModal('CLOSE'));
  const bridgeOnline = propBridgeOnline !== undefined ? propBridgeOnline : pos.bridgeOnline;
  const currentUser = pos.currentUser;

  const handlePulseDrawer = async () => {
    await bridge.openCashDrawer();
  };

  const navLinks = [
    { href: '/', label: 'Bán hàng', icon: ShoppingCart },
    { href: '/check-in', label: 'Check-in sân', icon: QrCode },
    { href: '/shifts', label: 'Ca thu ngân', icon: Clock },
    { href: '/orders', label: 'Hóa đơn & Hủy', icon: Receipt },
    { href: '/rentals', label: 'Thuê dụng cụ', icon: ShoppingBag },
    { href: '/hardware', label: 'Thiết bị IoT', icon: Cpu },
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            ADMIN
          </span>
        );
      case 'MANAGER':
        return (
          <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            QUẢN LÝ
          </span>
        );
      case 'CASHIER':
      default:
        return (
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            THU NGÂN
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border px-4 flex items-center justify-between flex-shrink-0 select-none">
      {/* Brand & Nav Tabs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-sm text-primary-foreground shadow-sm">
            POS
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-foreground leading-none">
              ANTIGRAVITY
            </h1>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              Canteen & Retail Quầy
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Hardware, Staff Auth & Shift Badges */}
      <div className="flex items-center gap-2.5">
        {/* Staff Profile Chip (Clickable for Role Switcher / Verification) */}
        <button
          type="button"
          onClick={pos.openAuthModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border hover:bg-muted/80 transition-all text-left"
          title="Bấm để đổi ca nhân viên hoặc nâng quyền Quản lý"
        >
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground leading-tight">
              {currentUser?.fullName || 'Thu ngân Quầy POS'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {getRoleBadge(currentUser?.role)}
            </div>
          </div>
        </button>

        {/* Hardware Bridge Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border">
          <div
            className={`w-2 h-2 rounded-full ${
              bridgeOnline ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'
            }`}
          />
          <span className="text-[11px] font-semibold text-muted-foreground">
            Bridge: <span className="text-foreground">{bridgeOnline ? 'Sẵn sàng' : 'Mất kết nối'}</span>
          </span>
        </div>

        {/* Pulse Cash Drawer Button */}
        <button
          onClick={handlePulseDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-muted transition-colors border border-border"
          title="Bật mở két tiền thử nghiệm"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>Bật két</span>
        </button>

        {/* Shift Badge & Actions (Synchronized 100% across all pages) */}
        {currentShift ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Unlock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-mono">
                {currentShift.id || currentShift.shiftCode || 'CA ĐANG MỞ'}
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseShiftModal}
              className="px-3 py-1.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 text-xs font-bold hover:bg-destructive/25 transition-colors"
            >
              Chốt ca
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">CHƯA MỞ CA</span>
            </div>
            <button
              type="button"
              onClick={onOpenShiftModal}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Mở ca ngay
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
