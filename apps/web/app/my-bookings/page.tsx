'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api, getStoredToken } from '@/lib/api';
import { formatVND, formatDateTime, formatDateOnly } from '@/lib/utils';
import { QrCodeDisplay } from '@/components/qr-code';

interface BookingItem {
  id: string;
  bookingCode: string;
  resourceId: string;
  resourceName?: string;
  sportType: string;
  date: string;
  slotIndices: number[];
  startTime?: string;
  endTime?: string;
  totalAmount: number;
  status: 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  holdExpiresAt?: string;
  checkInCode?: string;
  createdAt: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal states
  const [activeTicket, setActiveTicket] = useState<BookingItem | null>(null);
  const [cancelModalItem, setCancelModalItem] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Reschedule modal states
  const [rescheduleModalItem, setRescheduleModalItem] = useState<BookingItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newStartHour, setNewStartHour] = useState('18:00');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);

  const calculateCancelRefund = (booking: BookingItem) => {
    if (!booking.date || !booking.slotIndices?.length) {
      return { eligible: false, refundAmount: 0, hoursRemaining: 0 };
    }
    const minSlot = Math.min(...booking.slotIndices);
    const startHour = Math.floor(minSlot / 2);
    const startMinute = (minSlot % 2) * 30;
    const [y, m, d] = booking.date.split('-').map(Number);
    const startUtc = new Date(Date.UTC(y, m - 1, d, startHour - 7, startMinute));
    const now = new Date();
    const hoursRemaining = Math.max(0, (startUtc.getTime() - now.getTime()) / (3600 * 1000));
    const eligible = hoursRemaining >= 24;
    const refundAmount = eligible ? (booking.totalAmount || 0) : 0;
    return { eligible, refundAmount, hoursRemaining };
  };

  const handleRescheduleBooking = async () => {
    if (!rescheduleModalItem || !newDate) return;
    try {
      setRescheduling(true);
      const [h, m] = newStartHour.split(':').map(Number);
      const startSlot = h * 2 + (m === 30 ? 1 : 0);
      const slotCount = rescheduleModalItem.slotIndices?.length || 2;
      const newSlotIndices = Array.from({ length: slotCount }, (_, i) => startSlot + i);

      await api.booking.reschedule(rescheduleModalItem.id, {
        newDate,
        newSlotIndices,
      });

      setRescheduleSuccess(`Đã đổi lịch đặt sân ${rescheduleModalItem.bookingCode} thành công sang ngày ${newDate} (${newStartHour}).`);
      setRescheduleModalItem(null);
      fetchBookings();
      setTimeout(() => setRescheduleSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đổi lịch đặt sân');
    } finally {
      setRescheduling(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken();
      if (!token) {
        router.push('/login?redirect=/my-bookings');
        return;
      }
      const data = await api.booking.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đặt sân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalItem) return;
    try {
      setCancelling(true);
      await api.booking.cancel(cancelModalItem.id, cancelReason);
      setCancelSuccess(`Đã hủy đặt sân ${cancelModalItem.bookingCode} thành công.`);
      setCancelModalItem(null);
      setCancelReason('');
      fetchBookings();
      setTimeout(() => setCancelSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy đặt sân');
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = bookings
    .map((b) => ({
      ...b,
      id: b.id || (b as any)._id,
      totalAmount: b.totalAmount !== undefined ? b.totalAmount : (b as any).totalPrice || 0,
      sportType: b.sportType || (b as any).sport || 'SPORTS',
      status: ((b.status as any) === 'HOLD' ? 'HELD' : b.status) as BookingItem['status'],
      resourceName: b.resourceName || ((b as any).resourceCode ? `Sân ${(b as any).resourceCode}` : undefined),
      slotIndices: Array.isArray(b.slotIndices) ? b.slotIndices : [],
    }))
    .filter((b) => {
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'UPCOMING') return b.status === 'CONFIRMED' || b.status === 'HELD';
      if (filterStatus === 'COMPLETED') return b.status === 'COMPLETED' || b.status === 'CHECKED_IN';
      if (filterStatus === 'CANCELLED') return b.status === 'CANCELLED';
      return true;
    });

  const getStatusBadge = (status: BookingItem['status']) => {
    switch (status) {
      case 'HELD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Hourglass className="w-3 h-3 animate-spin" /> Giữ chỗ (10 phút)
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Đang sử dụng sân
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Hoàn tất
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lịch Đặt Sân Của Tôi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý lịch thi đấu, xuất mã QR vào sân và tra cứu hóa đơn VAT
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Đặt sân mới <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {cancelSuccess && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{cancelSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'UPCOMING', label: 'Sắp tới & Đã đặt' },
          { key: 'COMPLETED', label: 'Hoàn tất' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm">Đang tải danh sách đặt sân...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-rose-800 font-semibold">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có lịch đặt sân nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Bạn chưa có phiên đặt sân nào trong trạng thái này. Đặt sân ngay để trải nghiệm cơ sở vật
            chất thể thao tiêu chuẩn Olympic!
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Đặt sân ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((booking) => {
            const startSlot = Math.min(...booking.slotIndices);
            const endSlot = Math.max(...booking.slotIndices) + 1;
            const startTimeStr = `${Math.floor(startSlot / 2)
              .toString()
              .padStart(2, '0')}:${startSlot % 2 === 0 ? '00' : '30'}`;
            const endTimeStr = `${Math.floor(endSlot / 2)
              .toString()
              .padStart(2, '0')}:${endSlot % 2 === 0 ? '00' : '30'}`;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        #{booking.bookingCode || booking.id.slice(-6).toUpperCase()}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {booking.resourceName || `Sân thể thao ${booking.sportType}`}
                      </h3>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">
                        {formatDateOnly(booking.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-emerald-700">
                        {startTimeStr} - {endTimeStr}
                      </span>
                      <span className="text-slate-400">({booking.slotIndices.length * 30} phút)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Khu tổ hợp thể thao Antigravity Complex</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tổng thanh toán:</span>
                    <span className="text-sm font-extrabold text-emerald-600 font-mono">
                      {formatVND(booking.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN' ? (
                    <div className="flex-1 flex items-center gap-2">
                      <button
                        onClick={() => setActiveTicket(booking)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Mã QR Check-in
                      </button>

                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => {
                            setRescheduleModalItem(booking);
                            setNewDate(booking.date);
                          }}
                          className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Đổi lịch
                        </button>
                      )}
                    </div>
                  ) : booking.status === 'HELD' ? (
                    <div className="w-full flex gap-2">
                      <Link
                        href={`/booking?resume=${booking.id}`}
                        className="flex-1 text-center py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Thanh toán ngay
                      </Link>
                      <button
                        onClick={() => setCancelModalItem(booking)}
                        className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : null}

                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setCancelModalItem(booking)}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-600 px-2 py-1 rounded transition-colors whitespace-nowrap"
                    >
                      Hủy sân
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Success Notification */}
      {rescheduleSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{rescheduleSuccess}</span>
        </div>
      )}

      {/* QR Ticket Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Vé Vào Sân Điện Tử
              </span>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              {activeTicket.resourceName || `Sân thể thao ${activeTicket.sportType}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDateOnly(activeTicket.date)}
            </p>

            <div className="my-5">
              <QrCodeDisplay
                value={activeTicket.bookingCode || activeTicket.id}
                label="Quét tại cổng / quầy thu ngân POS"
                sublabel={`Mã: ${activeTicket.bookingCode || activeTicket.id.slice(-6).toUpperCase()}`}
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs text-slate-600 space-y-1">
              <p>• Xuất trình mã này trước giờ thi đấu 10 phút tại quầy hoặc máy quét POS.</p>
              <p>• Mã hợp lệ cho tất cả thành viên trong nhóm tham gia trận đấu.</p>
            </div>

            <button
              onClick={() => setActiveTicket(null)}
              className="mt-5 w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Đóng vé
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal with Dynamic 24h Cutoff Policy */}
      {cancelModalItem && (() => {
        const refundInfo = calculateCancelRefund(cancelModalItem);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">Xác nhận hủy đặt sân</h3>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Bạn có chắc chắn muốn hủy đặt sân{' '}
                <strong className="text-slate-900">
                  {cancelModalItem.bookingCode || cancelModalItem.id.slice(-6).toUpperCase()}
                </strong>
                ?
              </p>

              {/* Dynamic 24h Refund Policy Notice */}
              <div className={`p-3.5 border rounded-xl text-xs mb-4 space-y-1.5 ${
                refundInfo.eligible
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Chính sách hoàn tiền (Mốc 24h):</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    refundInfo.eligible ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
                  }`}>
                    {refundInfo.eligible ? 'HOÀN 100% CỌC' : 'HOÀN 0 ĐỒNG'}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {refundInfo.eligible
                    ? `Bạn đang hủy trước giờ bắt đầu ${refundInfo.hoursRemaining.toFixed(1)} giờ (trước mốc 24h). Số tiền ${formatVND(refundInfo.refundAmount)} sẽ được hoàn tự động vào ví nội bộ.`
                    : `Thời gian tới giờ chơi còn ${refundInfo.hoursRemaining.toFixed(1)} giờ (dưới 24h). Theo quy chế tổ hợp thể thao, lượt đặt này không áp dụng hoàn tiền.`}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do hủy sân (không bắt buộc)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do để ban quản lý hỗ trợ cải thiện dịch vụ..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalItem(null)}
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Giữ lại sân
                </button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận hủy sân
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reschedule Modal */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-900">Đổi lịch đặt sân</h3>
              <button
                onClick={() => setRescheduleModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Đổi ca chơi cho vé <strong className="text-slate-900">{rescheduleModalItem.bookingCode}</strong> ({rescheduleModalItem.resourceName || `Sân ${rescheduleModalItem.sportType}`}).
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 mb-4 space-y-1">
              <p className="font-bold">Quy định đổi lịch (A03):</p>
              <p>• Đổi trước giờ bắt đầu ít nhất 2 giờ, tối đa 2 lần/vé.</p>
              <p>• Chênh lệch giá nếu khung mới đắt hơn sẽ thu thêm, rẻ hơn hoàn vào ví.</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn ngày mới
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn khung giờ bắt đầu
                </label>
                <select
                  value={newStartHour}
                  onChange={(e) => setNewStartHour(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="06:00">06:00 Sáng</option>
                  <option value="07:00">07:00 Sáng</option>
                  <option value="08:00">08:00 Sáng</option>
                  <option value="15:00">15:00 Chiều</option>
                  <option value="16:00">16:00 Chiều</option>
                  <option value="17:00">17:00 Chiều</option>
                  <option value="18:00">18:00 Tối</option>
                  <option value="19:00">19:00 Tối</option>
                  <option value="20:00">20:00 Tối</option>
                  <option value="21:00">21:00 Tối</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Thời lượng giữ nguyên: {rescheduleModalItem.slotIndices.length * 30} phút
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleModalItem(null)}
                disabled={rescheduling}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRescheduleBooking}
                disabled={rescheduling}
                className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {rescheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Xác nhận đổi lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
