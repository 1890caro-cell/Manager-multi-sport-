'use client';

import React, { useState } from 'react';
import { POSHeader } from '@/components/POSHeader';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { formatVND, formatDateTime } from '@/lib/utils';
import { bridge, ReceiptData } from '@/lib/bridge';
import { usePOS } from '@/lib/pos-context';
import { Receipt, Printer, RotateCcw, Search, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function OrdersPage() {
  const { currentUser } = usePOS();
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<any | null>(null);
  const [managerPin, setManagerPin] = useState('');
  const [cancelReason, setCancelReason] = useState('Khách đổi ý trả món');

  const [orders, setOrders] = useState([
    {
      id: 'ORD-882190',
      createdAt: '2026-10-26T14:15:00Z',
      cashier: 'Nguyễn Văn Thu Ngân',
      itemsCount: 3,
      itemsSummary: '2x Pocari Sweat 500ml, 1x Bánh mì que',
      totalAmount: 61000,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      customerPhone: '0901234567',
    },
    {
      id: 'ORD-882189',
      createdAt: '2026-10-26T13:40:00Z',
      cashier: 'Nguyễn Văn Thu Ngân',
      itemsCount: 1,
      itemsSummary: '1x Bóng đá Molten FIFA Pro số 5',
      totalAmount: 378000,
      paymentMethod: 'VIETQR',
      status: 'COMPLETED',
      customerPhone: '0988777666',
    },
    {
      id: 'ORD-882188',
      createdAt: '2026-10-26T12:20:00Z',
      cashier: 'Nguyễn Văn Thu Ngân',
      itemsCount: 2,
      itemsSummary: '2x Nước điện giải Revive',
      totalAmount: 324000,
      paymentMethod: 'WALLET',
      status: 'COMPLETED',
      customerPhone: '0901234567',
    },
  ]);

  const handleReprint = async (order: any) => {
    const data: ReceiptData = {
      orderId: order.id,
      cashierName: order.cashier,
      createdAt: order.createdAt,
      items: [
        { name: order.itemsSummary, quantity: order.itemsCount, unitPrice: order.totalAmount, totalPrice: order.totalAmount },
      ],
      subtotal: Math.round(order.totalAmount / 1.08),
      vatAmount: Math.round(order.totalAmount - order.totalAmount / 1.08),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paidAmount: order.totalAmount,
    };
    setSelectedReceipt(data);
    await bridge.printReceipt(data);
  };

  const handleConfirmCancel = () => {
    const isAuthorized = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN' || managerPin === '8888';
    if (!isAuthorized) {
      alert('Thao tác hủy hóa đơn bị từ chối! Bắt buộc phải có tài khoản Quản lý (Manager) / Admin hoặc nhập đúng mã PIN quản lý theo SPEC F12.4.');
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === cancellingOrder.id ? { ...o, status: 'CANCELLED' } : o)),
    );
    alert(`Đã hủy đơn hàng [${cancellingOrder.id}] thành công bởi [${currentUser?.fullName || 'Quản lý'}]. Số lượng sản phẩm đã được hoàn trả lại thẻ kho.`);
    setCancellingOrder(null);
    setManagerPin('');
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone && o.customerPhone.includes(search)) ||
      o.itemsSummary.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      <POSHeader />

      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">Lịch sử Hóa đơn & Hủy đơn hàng</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Xem lại danh sách đơn hàng ca trực, in lại hóa đơn nhiệt 80mm và hủy đơn có bảo mật PIN.
            </p>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn, SĐT khách..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border">
              <tr>
                <th className="p-3.5">Mã đơn</th>
                <th className="p-3.5">Thời gian</th>
                <th className="p-3.5">Chi tiết sản phẩm</th>
                <th className="p-3.5">Hình thức</th>
                <th className="p-3.5 text-right">Tổng tiền</th>
                <th className="p-3.5 text-center">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => {
                const isCancelled = order.status === 'CANCELLED';
                return (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-mono font-bold text-foreground">{order.id}</td>
                    <td className="p-3.5 text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-foreground">{order.itemsSummary}</p>
                      {order.customerPhone && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          Khách: {order.customerPhone}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-foreground">
                      <span className="px-2 py-0.5 rounded bg-secondary text-[11px]">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-foreground">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCancelled
                            ? 'bg-destructive/10 text-destructive border border-destructive/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isCancelled ? 'ĐÃ HỦY' : 'HOÀN TẤT'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleReprint(order)}
                        className="px-2.5 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-muted font-semibold text-[11px] inline-flex items-center gap-1"
                        title="In lại hóa đơn nhiệt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        In lại
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold text-[11px] inline-flex items-center gap-1 border border-destructive/20"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Hủy đơn
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Cancel Order Modal with Manager PIN */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                <h3 className="font-bold text-base text-foreground">Yêu cầu PIN Quản lý để hủy đơn</h3>
              </div>
              <button onClick={() => setCancellingOrder(null)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Theo quy định SPEC F12.4: Mọi tác vụ hủy hóa đơn bán hàng và hoàn trả hàng hóa đều bắt buộc nhập mã PIN của Quản lý ca để kiểm soát thất thoát.
            </p>

            <div className="p-3 bg-background rounded-xl border border-border space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mã đơn hủy:</span>
                <span className="font-bold text-foreground font-mono">{cancellingOrder.id}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Số tiền hoàn trả:</span>
                <span className="font-bold text-destructive font-mono">
                  {formatVND(cancellingOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Mã PIN Quản lý (Mặc định: 8888):</label>
              <input
                type="password"
                maxLength={6}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-center text-lg font-mono font-bold tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Lý do hủy đơn:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none"
              >
                <option value="Khách đổi ý trả món">Khách đổi ý trả món</option>
                <option value="Nhân viên thu ngân tính nhầm">Nhân viên thu ngân tính nhầm</option>
                <option value="Sản phẩm lỗi / hết hạn">Sản phẩm lỗi / hết hạn</option>
                <option value="Khác">Khác (có biên bản giải trình)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-destructive text-destructive-foreground font-bold text-xs rounded-xl hover:bg-destructive/90"
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview */}
      <ReceiptPreview receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
