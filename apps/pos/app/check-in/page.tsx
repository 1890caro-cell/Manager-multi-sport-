'use client';

import React, { useState, useEffect, useRef } from 'react';
import { POSHeader } from '@/components/POSHeader';
import { api } from '@/lib/api';
import { formatVND, formatDateTime, formatDateOnly, formatSlotTimeRange } from '@/lib/utils';
import { bridge, ReceiptData } from '@/lib/bridge';
import {
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  MapPin,
  Calendar,
  Check,
  XCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Camera,
} from 'lucide-react';
import { CameraQrScanner } from '@/components/CameraQrScanner';

interface BookingItem {
  id: string;
  _id?: string;
  bookingCode: string;
  userId?: {
    _id?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  };
  resourceCode: string;
  sport: string;
  date: string;
  slotIndices: number[];
  baseUnitIds?: string[];
  status: 'HOLD' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  totalPrice: number;
  depositAmount: number;
  paidAmount: number;
  checkInAt?: string;
  checkOutAt?: string;
  createdAt: string;
}

export default function CheckInPage() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [todayBookings, setTodayBookings] = useState<BookingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED'>('ALL');
  const [isCameraActive, setIsCameraActive] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto focus input for scanner
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Fetch today's bookings
  const fetchTodayBookings = async () => {
    try {
      setFeedLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const items = await api.bookings.getAll({ date: today });
      setTodayBookings(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error('Lỗi khi tải lịch đặt sân hôm nay:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayBookings();
  }, []);

  // Search booking by code or phone
  const handleSearch = async (queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : searchInput).trim();
    if (!q) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Clean QR prefix if customer scanned standard app payload
      const cleanCode = q.replace(/^SPORTS:CHECKIN:/i, '');

      // Try fetching by exact code or id first
      try {
        const item = await api.bookings.getByIdOrCode(cleanCode);
        if (item) {
          setSelectedBooking(item);
          setSearchInput(item.bookingCode || cleanCode);
          return;
        }
      } catch (err: any) {
        // Fallback: search query via getAll
        const results = await api.bookings.getAll({ search: cleanCode });
        if (Array.isArray(results) && results.length > 0) {
          setSelectedBooking(results[0]);
          setSearchInput(results[0].bookingCode);
          return;
        }
        throw new Error(`Không tìm thấy lượt đặt sân khớp với "${cleanCode}"`);
      }
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy thông tin đặt sân');
      setSelectedBooking(null);
    } finally {
      setLoading(false);
    }
  };

  // Perform Check-in action
  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      setError(null);
      const targetId = selectedBooking.id || selectedBooking._id || selectedBooking.bookingCode;
      const updated = await api.bookings.checkIn(targetId);
      setSelectedBooking(updated);
      setSuccessMessage(`Check-in thành công cho vé ${updated.bookingCode}! Sân đã sẵn sàng.`);
      fetchTodayBookings();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thực hiện check-in');
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Complete action
  const handleComplete = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      setError(null);
      const targetId = selectedBooking.id || selectedBooking._id || selectedBooking.bookingCode;
      const updated = await api.bookings.complete(targetId);
      setSelectedBooking(updated);
      setSuccessMessage(`Đã hoàn tất ca chơi và trả sân cho vé ${updated.bookingCode}.`);
      fetchTodayBookings();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi hoàn tất ca chơi');
    } finally {
      setActionLoading(false);
    }
  };

  // Print Check-in Ticket Slip
  const handlePrintSlip = async () => {
    if (!selectedBooking) return;
    const receiptData: ReceiptData = {
      orderId: selectedBooking.bookingCode,
      cashierName: 'Thu ngân quầy',
      createdAt: new Date().toISOString(),
      items: [
        {
          name: `Sân ${selectedBooking.resourceCode} (${selectedBooking.sport})`,
          quantity: 1,
          unitPrice: selectedBooking.totalPrice,
          totalPrice: selectedBooking.totalPrice,
        },
      ],
      subtotal: selectedBooking.totalPrice,
      vatAmount: 0,
      totalAmount: selectedBooking.totalPrice,
      paymentMethod: 'VIETQR',
      paidAmount: selectedBooking.paidAmount || selectedBooking.totalPrice,
      customerPhone: selectedBooking.userId?.phone,
    };
    await bridge.printReceipt(receiptData);
  };

  // Filtered feed items
  const filteredBookings = todayBookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  const getStatusBadge = (status: BookingItem['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Chờ nhận sân
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đang sử dụng sân
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            <Check className="w-3.5 h-3.5" /> Đã hoàn tất
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="w-3.5 h-3.5" /> Đã hủy
          </span>
        );
      case 'HOLD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground border border-border">
            Giữ chỗ tạm
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">
      <POSHeader />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Side: Scanner & Detailed Inspection Card */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Quick Scanner Bar */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex items-center gap-3"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <QrCode className="w-5 h-5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Quét mã QR vé hoặc nhập mã vé BK-... / Số điện thoại..."
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none tracking-wide"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !searchInput.trim()}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Tra cứu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedBooking(null);
                  setIsCameraActive((prev) => !prev);
                }}
                className={`px-4 py-3 border rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                  isCameraActive
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                }`}
                title="Bật/Tắt Camera quét mã trực tiếp"
              >
                <Camera className="w-4 h-4" />
                <span>{isCameraActive ? 'Tắt Cam' : 'Bật Camera'}</span>
              </button>

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSelectedBooking(null);
                    setError(null);
                    setSuccessMessage(null);
                    searchInputRef.current?.focus();
                  }}
                  className="px-3 py-3 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Xóa
                </button>
              )}
            </form>

            {/* Error / Success Notifications */}
            {error && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2 font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* Selected Booking Detail Card */}
          {selectedBooking ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                {/* Header Ticket Info */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-black text-foreground tracking-tight">
                        {selectedBooking.bookingCode}
                      </span>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium mt-0.5 block">
                      Khởi tạo lúc: {formatDateTime(selectedBooking.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(null);
                        setSearchInput('');
                        setIsCameraActive(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
                      title="Mở camera quét vé tiếp theo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Quét vé tiếp</span>
                    </button>

                    <button
                      onClick={handlePrintSlip}
                      className="flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
                    >
                      <Printer className="w-4 h-4 text-muted-foreground" />
                      <span>In phiếu</span>
                    </button>
                  </div>
                </div>

                {/* Match & Facility Details */}
                <div className="grid grid-cols-2 gap-4 my-5">
                  <div className="p-4 bg-background border border-border rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Thông tin sân đấu
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                        {selectedBooking.resourceCode}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground">
                          Sân {selectedBooking.resourceCode}
                        </h4>
                        <p className="text-xs text-muted-foreground font-semibold">
                          Bộ môn: {selectedBooking.sport}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60 text-xs space-y-1.5 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-foreground font-semibold">
                          {formatDateOnly(selectedBooking.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-foreground font-bold">
                          {formatSlotTimeRange(selectedBooking.slotIndices)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Khách hàng & Thanh toán
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground">
                          {selectedBooking.userId?.fullName || 'Khách vãng lai'}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3" />
                          {selectedBooking.userId?.phone || 'Chưa có SĐT'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tổng tiền sân:</span>
                        <span className="font-bold text-foreground">
                          {formatVND(selectedBooking.totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Đã thanh toán:</span>
                        <span className="font-extrabold text-emerald-500">
                          {formatVND(selectedBooking.paidAmount || selectedBooking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Timeline Details */}
                <div className="p-3 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground flex items-center justify-around">
                  <div>
                    Check-in:{' '}
                    <span className="font-bold text-foreground">
                      {selectedBooking.checkInAt ? formatDateTime(selectedBooking.checkInAt) : 'Chưa nhận sân'}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div>
                    Trả sân:{' '}
                    <span className="font-bold text-foreground">
                      {selectedBooking.checkOutAt ? formatDateTime(selectedBooking.checkOutAt) : 'Chưa trả'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Big Buttons */}
              <div className="pt-6 border-t border-border mt-4">
                {selectedBooking.status === 'CONFIRMED' ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6" />
                    )}
                    <span>XÁC NHẬN CHECK-IN NHẬN SÂN</span>
                  </button>
                ) : selectedBooking.status === 'CHECKED_IN' ? (
                  <button
                    onClick={handleComplete}
                    disabled={actionLoading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                    <span>HOÀN TẤT CA CHƠI & TRẢ SÂN</span>
                  </button>
                ) : selectedBooking.status === 'COMPLETED' ? (
                  <div className="p-4 bg-muted border border-border rounded-xl text-center text-sm font-bold text-muted-foreground flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Lượt đặt sân này đã hoàn tất thành công.
                  </div>
                ) : selectedBooking.status === 'CANCELLED' ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center text-sm font-bold text-destructive flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Lượt đặt sân này đã bị hủy.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex-1 flex flex-col items-center justify-center">
              <CameraQrScanner
                isActive={isCameraActive}
                onToggleActive={() => setIsCameraActive((prev) => !prev)}
                onScanSuccess={(decodedText) => {
                  setSearchInput(decodedText);
                  handleSearch(decodedText);
                  setIsCameraActive(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Right Side: Real-time Today's Bookings Feed */}
        <div className="w-96 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Feed Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-foreground">Lịch Sân Hôm Nay</h3>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {todayBookings.length} lượt đặt sân
              </span>
            </div>
            <button
              onClick={fetchTodayBookings}
              disabled={feedLoading}
              className="p-2 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${feedLoading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-border flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'CONFIRMED', label: 'Chờ check-in' },
                { id: 'CHECKED_IN', label: 'Đang chơi' },
                { id: 'COMPLETED', label: 'Đã xong' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border p-2 space-y-1">
            {feedLoading && todayBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch hôm nay...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Không có lượt đặt nào trong danh mục này.
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isSelected = selectedBooking?.bookingCode === b.bookingCode;
                return (
                  <div
                    key={b.bookingCode || b.id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setSearchInput(b.bookingCode);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'border-transparent hover:bg-muted/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-foreground">
                        {b.bookingCode}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>

                    <div className="text-[11px] text-muted-foreground font-semibold flex items-center justify-between">
                      <span>Sân {b.resourceCode} ({b.sport})</span>
                      <span>{b.userId?.phone || 'Khách lẻ'}</span>
                    </div>

                    <div className="text-[10px] text-primary font-bold mt-1">
                      {formatSlotTimeRange(b.slotIndices)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
