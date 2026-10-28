'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Calendar,
  Wallet,
  Dumbbell,
  Trophy,
  Tag,
  Info,
  CheckCircle2,
  Trash2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { api, getStoredToken } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'BOOKING' | 'WALLET' | 'GYM' | 'TOURNAMENT' | 'PROMOTION' | 'SYSTEM';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Đặt sân bóng đá thành công',
    message: 'Lịch đặt sân 7 người A của bạn vào ngày 26/10 lúc 17:30 đã được xác nhận. Vui lòng quét mã QR khi đến sân.',
    category: 'BOOKING',
    read: false,
    actionUrl: '/my-bookings',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Biến động số dư ví: +500.000 VNĐ',
    message: 'Giao dịch nạp tiền VietQR tự động thành công. Số dư khả dụng hiện tại là 750.000 VNĐ.',
    category: 'WALLET',
    read: false,
    actionUrl: '/wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Nhắc nhở: Lớp Vinyasa Yoga sáng mai',
    message: 'Lớp học của HLV Nguyễn Thị Minh An sẽ bắt đầu lúc 06:30 tại Phòng Studio 2. Chúc bạn có buổi tập tràn đầy năng lượng!',
    category: 'GYM',
    read: true,
    actionUrl: '/pt-classes',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'Mở đăng ký Giải Cầu Lông Mở Rộng 2026',
    message: 'Tổng giải thưởng 30.000.000 VNĐ. Số lượng đội có hạn, nhanh tay đăng ký trước ngày 10/11!',
    category: 'TOURNAMENT',
    read: true,
    actionUrl: '/tournaments',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        const token = getStoredToken();
        if (token) {
          const res = await api.notifications.getMyNotifications();
          if (Array.isArray(res) && res.length > 0) {
            setNotifications(res);
          }
        }
      } catch {
        // Fallback default sample notifications
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
    } catch {
      // Optimistic local update
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getCategoryIcon = (cat: NotificationItem['category']) => {
    switch (cat) {
      case 'BOOKING':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'WALLET':
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case 'GYM':
        return <Dumbbell className="w-4 h-4 text-amber-600" />;
      case 'TOURNAMENT':
        return <Trophy className="w-4 h-4 text-purple-600" />;
      case 'PROMOTION':
        return <Tag className="w-4 h-4 text-rose-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'UNREAD') return !n.read;
    return n.category === filterCategory;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trung Tâm Thông Báo
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white">
                {unreadCount} mới
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Cập nhật trạng thái đặt sân, biến động số dư ví, lịch tập và tin tức sự kiện
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-4">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
          { key: 'BOOKING', label: 'Đặt sân' },
          { key: 'WALLET', label: 'Biến động ví' },
          { key: 'GYM', label: 'Gym & Lớp' },
          { key: 'TOURNAMENT', label: 'Giải đấu' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterCategory(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterCategory === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Không có thông báo nào</h3>
            <p className="text-xs text-slate-500 mt-1">
              Các thông báo mới về đơn đặt sân và tài khoản sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  !item.read ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm ${
                          !item.read ? 'font-extrabold text-slate-950' : 'font-medium text-slate-800'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{formatDateTime(item.createdAt)}</span>
                      {item.actionUrl && (
                        <Link
                          href={item.actionUrl}
                          className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          Xem chi tiết <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Đánh dấu đã đọc"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors flex-shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
