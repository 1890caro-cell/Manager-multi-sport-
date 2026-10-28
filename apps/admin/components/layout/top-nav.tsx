'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  User,
  LogOut,
  Bell,
  Shield,
  Activity,
  CreditCard,
} from 'lucide-react';
import { getStoredUser, removeStoredToken } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export function TopNav() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    removeStoredToken();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      {/* Clock & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono font-medium">
            {currentTime.toLocaleTimeString('vi-VN', { hour12: false })} -{' '}
            {currentTime.toLocaleDateString('vi-VN')}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Activity className="w-3 h-3 text-emerald-600" />
          <span>Cơ sở hoạt động: 06:00 - 22:00</span>
        </div>
      </div>

      {/* Profile & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
              {user?.fullName || 'Ban Quản Trị'}
            </p>
            <p className="text-[10px] font-mono text-emerald-700 font-semibold uppercase">
              {user?.role || 'ADMIN'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Đăng xuất khỏi phiên làm việc"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
