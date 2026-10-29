'use client';

import React from 'react';
import { POSHeader } from '@/components/POSHeader';
import { formatVND, formatDateTime } from '@/lib/utils';
import { usePOS } from '@/lib/pos-context';
import { Clock, DollarSign, Lock, Unlock, CheckCircle2, AlertTriangle, Printer, History } from 'lucide-react';

export default function ShiftsPage() {
  const { currentShift, openShiftModal } = usePOS();

  const pastShifts = [
    {
      id: 'SHIFT-20261025-02',
      cashier: 'Trần Thị Thu Ngân 2',
      openedAt: '2026-10-25T14:30:00Z',
      closedAt: '2026-10-25T22:15:00Z',
      initialFloat: 1000000,
      totalRevenue: 8950000,
      cashRevenue: 4200000,
      actualCash: 5200000,
      discrepancy: 0,
      status: 'MATCHED',
    },
    {
      id: 'SHIFT-20261025-01',
      cashier: 'Nguyễn Văn Thu Ngân',
      openedAt: '2026-10-25T06:45:00Z',
      closedAt: '2026-10-25T14:30:00Z',
      initialFloat: 1000000,
      totalRevenue: 6400000,
      cashRevenue: 3100000,
      actualCash: 4120000,
      discrepancy: 20000,
      status: 'SURPLUS',
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      <POSHeader />

      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">Quản lý Ca thu ngân & Đối soát tiền mặt</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Quy chuẩn SPEC F12.5: Bắt buộc mở ca, kiểm đếm thực tế và đối soát doanh thu sổ sách.
            </p>
          </div>

          {currentShift ? (
            <button
              onClick={() => openShiftModal('CLOSE')}
              className="px-5 py-2.5 bg-destructive text-destructive-foreground font-bold text-xs rounded-xl hover:bg-destructive/90 flex items-center gap-2 shadow-sm"
            >
              <Lock className="w-4 h-4" />
              <span>Chốt ca thu ngân & Kiểm đếm</span>
            </button>
          ) : (
            <button
              onClick={() => openShiftModal('OPEN')}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center gap-2 shadow-sm"
            >
              <Unlock className="w-4 h-4" />
              <span>Mở ca làm việc mới</span>
            </button>
          )}
        </div>

        {/* Active Shift Details */}
        {currentShift && (
          <div className="p-6 bg-card rounded-2xl border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">{currentShift.id}</h3>
                  <p className="text-xs text-muted-foreground">
                    Bắt đầu: {formatDateTime(currentShift.openedAt)} • {currentShift.cashierName}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                CA ĐANG HOẠT ĐỘNG
              </div>
            </div>

            {/* Shift KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-background rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Tiền mặt đầu ca:</span>
                <div className="text-lg font-bold font-mono text-foreground mt-1">
                  {formatVND(currentShift.initialFloat)}
                </div>
              </div>

              <div className="p-4 bg-background rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Doanh thu tiền mặt:</span>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  +{formatVND(currentShift.cashSales)}
                </div>
              </div>

              <div className="p-4 bg-background rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Doanh thu VietQR:</span>
                <div className="text-lg font-bold font-mono text-blue-400 mt-1">
                  {formatVND(currentShift.vietQrSales)}
                </div>
              </div>

              <div className="p-4 bg-background rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Doanh thu Ví nội bộ:</span>
                <div className="text-lg font-bold font-mono text-purple-400 mt-1">
                  {formatVND(currentShift.walletSales)}
                </div>
              </div>
            </div>

            {/* Drawer Cash Expected */}
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-wider">
                  Dự kiến tiền mặt trong két hiện tại (SPEC F12.5)
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đầu ca ({formatVND(currentShift.initialFloat)}) + Thu tiền mặt ({formatVND(currentShift.cashSales)})
                </p>
              </div>
              <div className="text-2xl font-black font-mono text-foreground">
                {formatVND(currentShift.expectedCash)}
              </div>
            </div>
          </div>
        )}

        {/* Shift History Table */}
        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Lịch sử các ca đã chốt gần đây</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <tr>
                  <th className="p-3">Mã ca</th>
                  <th className="p-3">Thu ngân</th>
                  <th className="p-3">Mở ca</th>
                  <th className="p-3">Chốt ca</th>
                  <th className="p-3 text-right">Tổng doanh thu</th>
                  <th className="p-3 text-right">Tiền thực đếm</th>
                  <th className="p-3 text-center">Chênh lệch</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pastShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono font-bold text-foreground">{shift.id}</td>
                    <td className="p-3 font-semibold text-foreground">{shift.cashier}</td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(shift.openedAt)}</td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(shift.closedAt)}</td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      {formatVND(shift.totalRevenue)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-primary">
                      {formatVND(shift.actualCash)}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {shift.discrepancy === 0 ? (
                        <span className="text-emerald-400 font-bold">0 đ (Khớp)</span>
                      ) : (
                        <span className="text-amber-400 font-bold">+{formatVND(shift.discrepancy)}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
