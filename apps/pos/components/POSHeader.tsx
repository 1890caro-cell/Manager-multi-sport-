'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bridge } from '@/lib/bridge';
import {
  ShoppingCart,
  Clock,
  Receipt,
  ShoppingBag,
  Cpu,
  Lock,
  Unlock,
  KeyRound,
} from 'lucide-react';

interface POSHeaderProps {
  currentShift?: any;
  onOpenShiftModal?: () => void;
  onCloseShiftModal?: () => void;
  bridgeOnline?: boolean;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  currentShift,
  onOpenShiftModal,
  onCloseShiftModal,
  bridgeOnline = true,
}) => {
  const pathname = usePathname();

  const handlePulseDrawer = async () => {
    await bridge.openCashDrawer();
  };

  const navLinks = [
    { href: '/', label: 'Bán hàng', icon: ShoppingCart },
    { href: '/shifts', label: 'Ca thu ngân', icon: Clock },
    { href: '/orders', label: 'Hóa đơn & Hủy', icon: Receipt },
    { href: '/rentals', label: 'Thuê dụng cụ', icon: ShoppingBag },
    { href: '/hardware', label: 'Thiết bị IoT', icon: Cpu },
  ];

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

      {/* Right Hardware & Shift Badges */}
      <div className="flex items-center gap-3">
        {/* Hardware Bridge Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border">
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

        {/* Shift Badge & Actions */}
        {currentShift ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Unlock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{currentShift.id || 'CA ĐANG MỞ'}</span>
            </div>
            {onCloseShiftModal && (
              <button
                onClick={onCloseShiftModal}
                className="px-3 py-1.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 text-xs font-bold hover:bg-destructive/25 transition-colors"
              >
                Chốt ca
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">CHƯA MỞ CA</span>
            </div>
            {onOpenShiftModal && (
              <button
                onClick={onOpenShiftModal}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Mở ca ngay
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
