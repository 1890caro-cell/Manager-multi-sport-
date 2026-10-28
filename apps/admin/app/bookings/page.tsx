'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Hourglass,
  RefreshCw,
  Search,
  ShieldAlert,
  Loader2,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateOnly, formatDateTime, generateIdempotencyKey } from '@/lib/utils';

interface BookingItem {
  id: string;
  bookingCode: string;
  resourceId: string;
  resourceName: string;
  sportType: string;
  date: string;
  slotIndices: number[];
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

const TIME_SLOTS: { index: number; label: string }[] = [];
for (let i = 12; i <= 43; i++) {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const min = i % 2 === 0 ? '00' : '30';
  TIME_SLOTS.push({ index: i, label: `${hour}:${min}` });
}

export default function AdminBookingsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Emergency Closure Modal
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [closureResourceId, setClosureResourceId] = useState<string>('');
  const [closureReason, setClosureReason] = useState<string>('MAINTENANCE');
  const [closureNotes, setClosureNotes] = useState<string>('');
  const [closingCourt, setClosingCourt] = useState(false);

  // Quick Action Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resList, bksList] = await Promise.allSettled([
        api.facilities.getResources(),
        api.bookings.getAll({ date: selectedDate, sportType: selectedSport !== 'ALL' ? selectedSport : undefined }),
      ]);

      if (resList.status === 'fulfilled' && Array.isArray(resList.value)) {
        setResources(resList.value);
        if (!closureResourceId && resList.value.length > 0) {
          setClosureResourceId(resList.value[0].id);
        }
      }

      if (bksList.status === 'fulfilled' && Array.isArray(bksList.value)) {
        setBookings(bksList.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedSport]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCheckIn = async (id: string, code: string) => {
    try {
      await api.bookings.checkIn(id);
      showToast(`Đã check-in thành công cho lượt đặt #${code}!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi check-in');
    }
  };

  const handleComplete = async (id: string, code: string) => {
    try {
      await api.bookings.complete(id);
      showToast(`Đã hoàn tất ca chơi #${code}!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hoàn tất lượt đặt');
    }
  };

  const handleCancelBooking = async (id: string, code: string) => {
    const reason = prompt('Nhập lý do hủy sân (hoàn cọc tự động vào ví):');
    if (!reason) return;
    try {
      await api.bookings.cancel(id, reason);
      showToast(`Đã hủy lượt đặt #${code} và hoàn tiền vào ví khách!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy đặt sân');
    }
  };

  const handleEmergencyClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setClosingCourt(true);
      const idempotencyKey = generateIdempotencyKey('closure');
      await api.facilities.createClosure({
        resourceId: closureResourceId,
        date: selectedDate,
        reason: closureReason,
        notes: closureNotes,
        idempotencyKey,
      });

      showToast('Đã kích hoạt khóa sân khẩn cấp thành công!');
      setClosureModalOpen(false);
      setClosureNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khóa sân');
    } finally {
      setClosingCourt(false);
    }
  };

  const handleCleanupExpired = async () => {
    try {
      await api.bookings.cleanupExpired();
      showToast('Đã quét và giải phóng các slot giữ chỗ hết hạn 10 phút!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi quét slot');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Sân Bãi & Điều Phối Lịch Đặt
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi ma trận sân thời gian thực, check-in tại quầy và công cụ đóng sân khẩn cấp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCleanupExpired}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
          >
            <Hourglass className="w-3.5 h-3.5" /> Dọn slot hết hạn
          </button>

          <button
            onClick={() => setClosureModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
          >
            <AlertOctagon className="w-3.5 h-3.5" /> Khóa sân khẩn cấp
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs p-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="text-xs p-2 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">Tất cả bộ môn</option>
              <option value="FOOTBALL">Bóng đá</option>
              <option value="BADMINTON">Cầu lông</option>
              <option value="PICKLEBALL">Pickleball</option>
              <option value="TENNIS">Tennis</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white border border-slate-300" /> Trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400" /> Giữ chỗ (10p)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" /> Đã đặt cọc
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500" /> Đang chơi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-300" /> Đóng sân
          </span>
        </div>
      </div>

      {/* Bookings Table & Dispatch */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">
            Danh Sách Phiên Đặt Sân Trong Ngày ({bookings.length} lượt)
          </h3>
          <span className="text-xs text-slate-400">
            Ngày: {formatDateOnly(selectedDate)}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Không có lượt đặt sân nào trong ngày đã chọn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Mã Đặt</th>
                  <th className="px-4 py-3">Sân Thể Thao</th>
                  <th className="px-4 py-3">Khung Giờ</th>
                  <th className="px-4 py-3">Khách Hàng</th>
                  <th className="px-4 py-3">Thanh Toán</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => {
                  const startSlot = Math.min(...b.slotIndices);
                  const endSlot = Math.max(...b.slotIndices) + 1;
                  const timeStr = `${Math.floor(startSlot / 2).toString().padStart(2, '0')}:${
                    startSlot % 2 === 0 ? '00' : '30'
                  } - ${Math.floor(endSlot / 2).toString().padStart(2, '0')}:${
                    endSlot % 2 === 0 ? '00' : '30'
                  }`;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        #{b.bookingCode || b.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900">{b.resourceName || b.sportType}</span>
                        <span className="block text-[10px] text-slate-400">{b.sportType}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                        {timeStr}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{b.customerName || 'Khách vãng lai'}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {b.customerPhone || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-slate-900">
                        {formatVND(b.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {b.status === 'CONFIRMED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã cọc
                          </span>
                        ) : b.status === 'CHECKED_IN' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Đang chơi
                          </span>
                        ) : b.status === 'HELD' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Giữ chỗ 10p
                          </span>
                        ) : b.status === 'COMPLETED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Hoàn tất
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCheckIn(b.id, b.bookingCode || b.id.slice(-6))}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
                          >
                            Check-in
                          </button>
                        )}
                        {b.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleComplete(b.id, b.bookingCode || b.id.slice(-6))}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
                          >
                            Xong trận
                          </button>
                        )}
                        {(b.status === 'CONFIRMED' || b.status === 'HELD') && (
                          <button
                            onClick={() => handleCancelBooking(b.id, b.bookingCode || b.id.slice(-6))}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-semibold"
                          >
                            Hủy
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergency Closure Modal */}
      {closureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-rose-600">
                <AlertOctagon className="w-5 h-5" />
                Khóa Sân Khẩn Cấp (Emergency Closure)
              </h3>
              <button
                onClick={() => setClosureModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEmergencyClosure} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn sân cần đóng *</label>
                <select
                  value={closureResourceId}
                  onChange={(e) => setClosureResourceId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.sportType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do đóng sân *</label>
                <select
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
                >
                  <option value="MAINTENANCE">Bảo trì mặt sân / Thiết bị hư hỏng</option>
                  <option value="WEATHER">Thời tiết xấu (Mưa bão ngập nước sân ngoài trời)</option>
                  <option value="FORCE_MAJEURE">Sự kiện bất khả kháng</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú chi tiết</label>
                <textarea
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="Ghi chú hiển thị cho khách và lưu nhật ký kiểm toán..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-[11px] space-y-1">
                <p className="font-bold">Lưu ý nghiệp vụ:</p>
                <p>• Các đơn đặt sân bị ảnh hưởng sẽ tự động được hoàn cọc 100% vào ví nội bộ.</p>
                <p>• Hệ thống sẽ gửi thông báo khẩn cấp qua SMS/ZNS/In-App cho khách hàng.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClosureModalOpen(false)}
                  disabled={closingCourt}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={closingCourt}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {closingCourt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận khóa sân
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
