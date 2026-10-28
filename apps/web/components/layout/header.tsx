'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Dumbbell,
  Trophy,
  Wallet,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';
import { getStoredToken, getStoredUser, removeStoredToken, api } from '@/lib/api';
import { formatVND } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const u = getStoredUser();
      setUser(u);

      // Lấy số dư ví & thông báo chưa đọc
      api.wallet.getBalance().then((w) => setWalletBalance(w.balance || 0)).catch(() => {});
      api.notifications.getUnreadCount().then((res) => setUnreadCount(res.unreadCount || 0)).catch(() => {});
    }
  }, [pathname]);

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setWalletBalance(null);
    window.location.href = '/login';
  };

  const navLinks = [
    { href: '/booking', label: 'Đặt sân', icon: Calendar },
    { href: '/gym', label: 'Gym', icon: Dumbbell },
    { href: '/pt-classes', label: 'Lớp học & PT', icon: User },
    { href: '/tournaments', label: 'Giải đấu', icon: Trophy },
    { href: '/my-bookings', label: 'Vé của tôi', icon: CreditCard },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-xl">
              S
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight block leading-tight">
                SPORTS COMPLEX
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold tracking-wider uppercase block">
                Tổ hợp Thể thao & Esports
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Wallet Badge */}
                <Link
                  href="/wallet"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{walletBalance !== null ? formatVND(walletBalance) : 'Ví nội bộ'}</span>
                </Link>

                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Link */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {user.fullName ? user.fullName[0]?.toUpperCase() : 'U'}
                  </div>
                  <span className="hidden lg:inline text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.fullName || user.phone}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 text-slate-400" />
                {item.label}
              </Link>
            );
          })}
          {user && (
            <Link
              href="/wallet"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>Ví: {walletBalance !== null ? formatVND(walletBalance) : 'Ví nội bộ'}</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
