'use client';

import React, { useState } from 'react';
import { POSHeader } from '@/components/POSHeader';
import { formatVND, formatDateTime } from '@/lib/utils';
import { ShoppingBag, CheckCircle2, RotateCcw, AlertTriangle, Search, Plus } from 'lucide-react';

export default function RentalsPage() {
  const [rentals, setRentals] = useState([
    {
      id: 'RNT-20261026-01',
      customerPhone: '0901234567',
      customerName: 'Nguyễn Văn A',
      itemName: 'Vợt cầu lông Yonex Astrox 88D Pro',
      quantity: 2,
      depositAmount: 400000,
      rentalFee: 60000,
      rentedAt: '2026-10-26T14:00:00Z',
      status: 'RENTED',
    },
    {
      id: 'RNT-20261026-02',
      customerPhone: '0988777666',
      customerName: 'Trần Văn B',
      itemName: 'Bộ 10 Áo bib thi đấu bóng đá',
      quantity: 1,
      depositAmount: 100000,
      rentalFee: 50000,
      rentedAt: '2026-10-26T14:30:00Z',
      status: 'RENTED',
    },
  ]);

  const [returnTicket, setReturnTicket] = useState<any | null>(null);
  const [returnCondition, setReturnCondition] = useState<'GOOD' | 'DAMAGED' | 'LOST'>('GOOD');
  const [damageFee, setDamageFee] = useState<string>('0');

  const handleConfirmReturn = () => {
    if (!returnTicket) return;
    const penalty = Number(damageFee) || 0;
    const finalRefund = Math.max(0, returnTicket.depositAmount - penalty);

    setRentals((prev) =>
      prev.map((r) => (r.id === returnTicket.id ? { ...r, status: 'RETURNED' } : r)),
    );

    alert(
      `Đã nhận trả đồ [${returnTicket.itemName}]. Tình trạng: ${returnCondition}. Số tiền cọc hoàn lại khách: ${formatVND(
        finalRefund,
      )} (Đã trừ phí hư hại: ${formatVND(penalty)}).`,
    );
    setReturnTicket(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      <POSHeader />

      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">Quầy Cho thuê & Nhận trả dụng cụ</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Quy chuẩn SPEC M13: Quản lý phiếu thuê, cọc an toàn và khấu trừ hư hại khi nhận trả đồ.
            </p>
          </div>
        </div>

        {/* Active Rentals Table */}
        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Phiếu thuê đang hoạt động tại quầy</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <tr>
                  <th className="p-3.5">Mã phiếu</th>
                  <th className="p-3.5">Khách hàng</th>
                  <th className="p-3.5">Dụng cụ thể thao</th>
                  <th className="p-3.5 text-center">SL</th>
                  <th className="p-3.5 text-right">Tiền cọc</th>
                  <th className="p-3.5 text-right">Tiền thuê</th>
                  <th className="p-3.5">Thời gian thuê</th>
                  <th className="p-3.5 text-center">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rentals.map((r) => {
                  const isReturned = r.status === 'RETURNED';
                  return (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="p-3.5 font-mono font-bold text-foreground">{r.id}</td>
                      <td className="p-3.5">
                        <p className="font-semibold text-foreground">{r.customerName}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{r.customerPhone}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">{r.itemName}</td>
                      <td className="p-3.5 text-center font-bold">{r.quantity}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-primary">
                        {formatVND(r.depositAmount)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-muted-foreground">
                        {formatVND(r.rentalFee)}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{formatDateTime(r.rentedAt)}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReturned
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isReturned ? 'ĐÃ TRẢ ĐỒ' : 'ĐANG THUÊ'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {!isReturned && (
                          <button
                            onClick={() => {
                              setReturnTicket(r);
                              setDamageFee('0');
                              setReturnCondition('GOOD');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Nhận trả đồ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Return & Deposit Assessment Modal */}
      {returnTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">Đánh giá tình trạng & Quyết toán cọc</h3>
            <p className="text-xs text-muted-foreground">
              Phiếu thuê: <span className="font-mono font-bold text-foreground">{returnTicket.id}</span> • {returnTicket.itemName}
            </p>

            <div className="p-3.5 bg-background rounded-xl border border-border space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tiền cọc ban đầu:</span>
                <span className="font-mono font-bold text-primary">{formatVND(returnTicket.depositAmount)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tình trạng dụng cụ khi trả:</label>
              <select
                value={returnCondition}
                onChange={(e) => {
                  const cond = e.target.value as any;
                  setReturnCondition(cond);
                  if (cond === 'GOOD') setDamageFee('0');
                  if (cond === 'DAMAGED') setDamageFee('100000');
                  if (cond === 'LOST') setDamageFee(String(returnTicket.depositAmount));
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
              >
                <option value="GOOD">Tốt / Nguyên vẹn (Hoàn 100% cọc)</option>
                <option value="DAMAGED">Hư hỏng nhẹ (Trừ phí sửa chữa)</option>
                <option value="LOST">Mất mát / Hỏng nát (Tịch thu toàn bộ cọc)</option>
              </select>
            </div>

            {returnCondition !== 'GOOD' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Phí phạt / Khấu trừ bồi thường (VND):</label>
                <input
                  type="text"
                  value={damageFee}
                  onChange={(e) => setDamageFee(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-400">Tiền cọc hoàn lại khách:</span>
              <span className="font-bold font-mono text-base text-emerald-400">
                {formatVND(Math.max(0, returnTicket.depositAmount - (Number(damageFee) || 0)))}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setReturnTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90"
              >
                Xác nhận trả đồ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
