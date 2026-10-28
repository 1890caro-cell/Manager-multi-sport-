'use client';

import React, { useState } from 'react';
import { formatVND } from '@/lib/utils';
import { bridge } from '@/lib/bridge';
import { Clock, DollarSign, AlertTriangle, CheckCircle2, X, Printer, Lock } from 'lucide-react';

interface ShiftModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'OPEN' | 'CLOSE';
  cashierName?: string;
  currentShiftData?: {
    id: string;
    openedAt: string;
    initialFloat: number;
    cashSales: number;
    vietQrSales: number;
    walletSales: number;
    expectedCash: number;
    totalOrdersCount: number;
  };
  onSuccess: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  visible,
  onClose,
  mode,
  cashierName = 'Thu ngân Quầy 01',
  currentShiftData,
  onSuccess,
}) => {
  const [initialFloatInput, setInitialFloatInput] = useState<string>('1000000');
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!visible) return null;

  const initialFloat = Number(initialFloatInput.replace(/\D/g, '')) || 0;
  const actualCash = Number(actualCashInput.replace(/\D/g, '')) || 0;

  const expectedCash = currentShiftData?.expectedCash || 0;
  const difference = actualCash - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (mode === 'OPEN') {
        // Trigger drawer pulse for initial float
        await bridge.openCashDrawer();
      } else {
        // Close shift -> print shift report
        await bridge.openCashDrawer();
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Lỗi ca thu ngân: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {mode === 'OPEN' ? <Clock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {mode === 'OPEN' ? 'Mở ca thu ngân mới' : 'Chốt ca & Kiểm đếm tiền mặt'}
              </h3>
              <p className="text-xs text-muted-foreground">Thu ngân: {cashierName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {mode === 'OPEN' ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl">
                <span className="text-xs text-primary font-bold uppercase tracking-wider block mb-1">
                  Quy tắc vận hành SPEC F12.5:
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bắt buộc nhập số tiền mặt bàn giao đầu ca (Initial Float). Khi nhấn xác nhận mở ca, két tiền sẽ tự động bật để bạn đặt tiền mồi vào két.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Tiền mặt đầu ca (VND):</label>
                <input
                  type="text"
                  value={initialFloatInput}
                  onChange={(e) => setInitialFloatInput(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-primary font-semibold">
                  Quy đổi: {formatVND(initialFloat)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Shift Stats Card */}
              <div className="p-4 bg-background border border-border rounded-2xl space-y-2.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tiền mặt đầu ca:</span>
                  <span className="font-mono text-foreground font-semibold">
                    {formatVND(currentShiftData?.initialFloat || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Doanh thu tiền mặt trong ca:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    +{formatVND(currentShiftData?.cashSales || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Doanh thu VietQR:</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {formatVND(currentShiftData?.vietQrSales || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Doanh thu Ví nội bộ:</span>
                  <span className="font-mono text-purple-400 font-semibold">
                    {formatVND(currentShiftData?.walletSales || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between text-sm font-bold">
                  <span className="text-foreground">Dự kiến tiền trong két:</span>
                  <span className="font-mono text-primary text-base">
                    {formatVND(expectedCash)}
                  </span>
                </div>
              </div>

              {/* Actual Cash Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Số tiền mặt thực tế kiểm đếm (VND):
                </label>
                <input
                  type="text"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Nhập số tiền thực đếm trong két..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Difference Result Badge */}
              {actualCashInput && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    difference === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : difference > 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-destructive/10 border-destructive/30 text-destructive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {difference === 0 ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-xs font-bold">
                      {difference === 0
                        ? 'Khớp 100% sổ sách kế toán'
                        : difference > 0
                        ? `Thừa tiền két: +${formatVND(difference)}`
                        : `Thiếu hụt tiền két: ${formatVND(difference)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Ghi chú chốt ca / Giải trình chênh lệch:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm nếu có..."
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
            >
              {mode === 'OPEN' ? (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Xác nhận mở ca & Bật két</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Chốt ca & In báo cáo ca</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
