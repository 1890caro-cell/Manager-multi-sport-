'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  QrCode,
  Wallet,
  Banknote,
  Timer,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from 'lucide-react';
import { api, getStoredToken } from '@/lib/api';
import { formatVND, formatDateOnly, generateIdempotencyKey } from '@/lib/utils';
import { PaymentMethod } from '@sports/shared';

const TIME_SLOTS: { index: number; label: string; time: string }[] = [];
for (let i = 12; i <= 43; i++) {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const minute = (i % 2 === 0 ? '00' : '30');
  TIME_SLOTS.push({
    index: i,
    label: `${hour}:${minute}`,
    time: `${hour}:${minute}`,
  });
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSport = searchParams.get('sportType') || 'ALL';

  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateOnly(new Date()));
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // Selected slots: map of resourceId -> array of slotIndices
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

  // Reservation state
  const [isReserving, setIsReserving] = useState(false);
  const [reservedBooking, setReservedBooking] = useState<any | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(600); // 10 minutes

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.VIETQR);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load resources
  useEffect(() => {
    setLoadingResources(true);
    const sportFilter = selectedSport === 'ALL' ? undefined : selectedSport;
    api.booking.getResources(sportFilter)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setResources(list);
        if (list.length > 0 && !selectedResourceId) {
          setSelectedResourceId(list[0]._id);
        }
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoadingResources(false));
  }, [selectedSport]);

  // Hold countdown timer
  useEffect(() => {
    if (!reservedBooking) return;
    const interval = setInterval(() => {
      setHoldSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setReservedBooking(null);
          setErrorMessage('Thời gian giữ chỗ 10 phút đã hết hạn. Vui lòng chọn lại.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reservedBooking]);

  const activeResource = useMemo(() => {
    return resources.find((r) => r._id === selectedResourceId);
  }, [resources, selectedResourceId]);

  const toggleSlot = (slotIndex: number) => {
    if (reservedBooking) return; // Locked while checkout modal is open

    if (selectedSlots.includes(slotIndex)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slotIndex));
    } else {
      // Keep sorted
      const nextSlots = [...selectedSlots, slotIndex].sort((a, b) => a - b);
      // Validate contiguous slots
      let isContiguous = true;
      for (let i = 0; i < nextSlots.length - 1; i++) {
        if (nextSlots[i + 1]! - nextSlots[i]! !== 1) {
          isContiguous = false;
          break;
        }
      }
      if (!isContiguous && nextSlots.length > 1) {
        // Just select this single slot if discontinuous
        setSelectedSlots([slotIndex]);
      } else {
        setSelectedSlots(nextSlots);
      }
    }
  };

  const estimatedPrice = useMemo(() => {
    if (!activeResource || selectedSlots.length === 0) return 0;
    // Base price per 30m slot
    const defaultHourlyRate = 200000;
    const hourlyRate = activeResource.hourlyRate || defaultHourlyRate;
    return (hourlyRate / 2) * selectedSlots.length;
  }, [activeResource, selectedSlots]);

  const handleStartReservation = async () => {
    if (!getStoredToken()) {
      router.push('/login');
      return;
    }

    if (!selectedResourceId || selectedSlots.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 khung giờ thi đấu');
      return;
    }

    setErrorMessage(null);
    setIsReserving(true);

    try {
      const idempotencyKey = generateIdempotencyKey('RESERVE');
      const booking = await api.booking.reserve({
        resourceId: selectedResourceId,
        date: selectedDate,
        slotIndices: selectedSlots,
        idempotencyKey,
      });

      setReservedBooking(booking);
      setHoldSecondsRemaining(600); // 10 minutes
    } catch (err: any) {
      setErrorMessage(err.message || 'Khung giờ này vừa có người giữ chỗ hoặc đã được đặt');
    } finally {
      setIsReserving(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!reservedBooking) return;
    setIsConfirmingPayment(true);
    setErrorMessage(null);

    try {
      const idempotencyKey = generateIdempotencyKey('CONFIRM');
      await api.booking.confirm(reservedBooking.id || reservedBooking._id, {
        paymentMethod,
        idempotencyKey,
      });

      setPaymentSuccess(true);
      setTimeout(() => {
        router.push('/my-bookings');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Thanh toán xác nhận đặt chỗ thất bại');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const sportsTabs = [
    { type: 'ALL', label: 'Tất cả bộ môn' },
    { type: 'FOOTBALL', label: 'Bóng đá' },
    { type: 'BADMINTON', label: 'Cầu lông' },
    { type: 'PICKLEBALL', label: 'Pickleball' },
    { type: 'TENNIS', label: 'Tennis' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đặt sân thể thao trực tuyến
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xem lịch trống theo thời gian thực, giữ chỗ tức thì 10 phút chống trùng lịch
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <CalendarIcon className="w-4 h-4 text-emerald-600 ml-2" />
          <input
            type="date"
            value={selectedDate}
            min={formatDateOnly(new Date())}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlots([]);
            }}
            className="text-xs font-bold text-slate-800 bg-transparent pr-2 py-1 focus:outline-none"
          />
        </div>
      </div>

      {/* Sport Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sportsTabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => {
              setSelectedSport(tab.type);
              setSelectedSlots([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedSport === tab.type
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Booking Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Court Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Danh sách sân ({resources.length})
          </h3>

          {loadingResources ? (
            <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách sân...</div>
          ) : (
            <div className="space-y-2">
              {resources.map((r) => {
                const isSelected = r._id === selectedResourceId;
                return (
                  <button
                    key={r._id}
                    onClick={() => {
                      setSelectedResourceId(r._id);
                      setSelectedSlots([]);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{r.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                        {r.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      <span>{r.sportType}</span>
                      <span className="font-bold text-emerald-700">
                        {formatVND(r.hourlyRate || 200000)}/h
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Interactive Time Slot Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {activeResource?.name || 'Chọn sân để xem lịch'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ngày thi đấu: <strong className="text-slate-800">{selectedDate}</strong> · Bước nhảy: 30 phút/slot
                </p>
              </div>

              {/* Slot Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300" />
                  <span className="text-slate-600">Trống</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
                  <span className="text-slate-900 font-bold">Đang chọn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-300 border border-slate-400 opacity-60" />
                  <span className="text-slate-400">Đã đặt</span>
                </div>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlots.includes(slot.index);
                return (
                  <button
                    key={slot.index}
                    onClick={() => toggleSlot(slot.index)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500 shadow-md shadow-emerald-500/30 font-black scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{slot.label}</span>
                    <span className="text-[10px] font-normal opacity-70 mt-0.5">30m</span>
                  </button>
                );
              })}
            </div>

            {/* Selection Bar & Reservation Trigger */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  Đã chọn: <strong className="text-slate-900">{selectedSlots.length} khung giờ</strong>{' '}
                  ({selectedSlots.length * 30} phút)
                </div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">
                  Tạm tính: {formatVND(estimatedPrice)}
                </div>
              </div>

              <button
                onClick={handleStartReservation}
                disabled={isReserving || selectedSlots.length === 0}
                className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>{isReserving ? 'Đang kiểm tra...' : 'Giữ chỗ 10 phút'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout & Payment Modal */}
      {reservedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative">
            {/* Header with Countdown */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Đang giữ chỗ
                </span>
                <h3 className="text-xl font-black text-slate-900">Xác nhận thanh toán</h3>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black">
                <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>{formatCountdown(holdSecondsRemaining)}</span>
              </div>
            </div>

            {/* Booking Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Sân thi đấu:</span>
                <span className="font-bold text-slate-900">{activeResource?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày đặt:</span>
                <span className="font-bold text-slate-900">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-bold text-slate-900">
                  {selectedSlots.length * 30} phút ({selectedSlots.length} slot)
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                <span className="text-slate-900">Tổng tiền thanh toán:</span>
                <span className="text-emerald-600">{formatVND(estimatedPrice)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn phương thức thanh toán
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.VIETQR)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    paymentMethod === PaymentMethod.VIETQR
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>VietQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.INTERNAL_WALLET)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    paymentMethod === PaymentMethod.INTERNAL_WALLET
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <span>Ví nội bộ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    paymentMethod === PaymentMethod.CASH
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <span>Tại quầy</span>
                </button>
              </div>
            </div>

            {/* VietQR PayOS Display */}
            {paymentMethod === PaymentMethod.VIETQR && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-36 h-36 bg-white rounded-xl border border-emerald-300 p-1.5 shrink-0 flex items-center justify-center shadow-md">
                  <img
                    src={`https://img.vietqr.io/image/970422-VQRQANCXY2688-compact2.png?amount=${reservedBooking.estimatedPrice || 0}&addInfo=DATSAN%20${reservedBooking.bookingCode || 'SAN'}&accountName=CAO%20NGUYEN%20ANH`}
                    alt="VietQR PayOS"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs space-y-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">VietQR Chuyển khoản (PayOS)</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">Auto Webhook</span>
                  </div>
                  <div className="text-slate-600">Ngân hàng: <strong className="text-slate-900">MBBank (Quân Đội)</strong></div>
                  <div className="text-slate-600">Số tài khoản: <strong className="text-emerald-700 font-mono text-sm">VQRQANCXY2688</strong></div>
                  <div className="text-slate-600">Chủ tài khoản: <strong className="text-slate-900">CAO NGUYEN ANH</strong></div>
                  <div className="text-slate-600">Số tiền: <strong className="text-emerald-600 font-bold">{formatVND(reservedBooking.estimatedPrice || 0)}</strong></div>
                  <div className="text-[11px] bg-white/80 p-1.5 rounded-lg border border-emerald-100 text-emerald-800 font-bold">
                    Cú pháp: DATSAN {reservedBooking.bookingCode || 'SAN'}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReservedBooking(null)}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Hủy giữ chỗ
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isConfirmingPayment || paymentSuccess}
                className="w-2/3 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConfirmingPayment ? (
                  <span>Đang xử lý...</span>
                ) : paymentSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-slate-950" />
                    <span>Đã xác nhận thành công!</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận & Hoàn tất</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs text-slate-400">Đang tải ma trận đặt sân...</p>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}

