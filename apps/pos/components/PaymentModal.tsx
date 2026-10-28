'use client';

import React, { useState } from 'react';
import { formatVND } from '@/lib/utils';
import { TouchNumpad } from './TouchNumpad';
import { bridge, ReceiptData } from '@/lib/bridge';
import { Banknote, QrCode, Wallet, Split, X, Printer, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  totalAmount: number;
  items: any[];
  hasRetailItem: boolean;
  customerPhone?: string;
  customerWalletBalance?: number;
  cashierName?: string;
  onPaymentSuccess: (receiptData: ReceiptData) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  totalAmount,
  items,
  hasRetailItem,
  customerPhone,
  customerWalletBalance = 0,
  cashierName = 'Thu ngân Quầy 01',
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<'CASH' | 'VIETQR' | 'WALLET' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);

  if (!visible) return null;

  const numericCash = Number(cashTendered) || 0;
  const changeAmount = Math.max(0, numericCash - totalAmount);

  const handleCompletePayment = async (selectedMethod: 'CASH' | 'VIETQR' | 'WALLET' | 'SPLIT') => {
    try {
      setProcessing(true);
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const receiptData: ReceiptData = {
        orderId,
        cashierName,
        createdAt: new Date().toISOString(),
        items: items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: i.product.price,
          totalPrice: i.product.price * i.quantity,
        })),
        subtotal: Math.round(totalAmount / 1.08),
        vatAmount: Math.round(totalAmount - totalAmount / 1.08),
        totalAmount,
        paymentMethod: selectedMethod,
        paidAmount: selectedMethod === 'CASH' ? numericCash || totalAmount : totalAmount,
        changeAmount: selectedMethod === 'CASH' ? changeAmount : 0,
        customerPhone,
      };

      // 1. If cash -> trigger cash drawer pulse
      if (selectedMethod === 'CASH') {
        await bridge.openCashDrawer();
      }

      // 2. If auto print -> trigger ESC/POS 80mm printer
      if (autoPrintReceipt) {
        await bridge.printReceipt(receiptData);
      }

      onPaymentSuccess(receiptData);
    } catch (err: any) {
      alert(`Lỗi xử lý thanh toán: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h3 className="text-xl font-black text-foreground">Thanh toán đơn hàng POS</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tổng tiền cần thanh toán: <span className="font-bold text-primary font-mono text-sm">{formatVND(totalAmount)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body 2 columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 p-6 gap-6">
          {/* Method Selector (4 cols) */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Chọn phương thức thanh toán:
            </span>

            {/* Cash */}
            <button
              onClick={() => setMethod('CASH')}
              className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                method === 'CASH'
                  ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Tiền mặt (Cash)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Tự động tính tiền thối & mở két</p>
              </div>
            </button>

            {/* VietQR */}
            <button
              onClick={() => setMethod('VIETQR')}
              className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                method === 'VIETQR'
                  ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-xl flex-shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">VietQR Động (Napas 24/7)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Khách quét bằng mọi App ngân hàng</p>
              </div>
            </button>

            {/* Wallet (Blocked if has Retail) */}
            <button
              onClick={() => {
                if (!hasRetailItem) setMethod('WALLET');
              }}
              disabled={hasRetailItem}
              className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                hasRetailItem
                  ? 'opacity-40 border-border bg-background cursor-not-allowed'
                  : method === 'WALLET'
                  ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-xl flex-shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">Ví điện tử nội bộ</h4>
                  {hasRetailItem && (
                    <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.2 rounded font-bold">
                      KHÓA
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasRetailItem
                    ? 'Cấm dùng cho hàng bán lẻ (SPEC F12.1)'
                    : customerWalletBalance > 0
                    ? `Số dư: ${formatVND(customerWalletBalance)}`
                    : 'Trừ trực tiếp số dư hội viên'}
                </p>
              </div>
            </button>

            {/* Invariant Warning */}
            {hasRetailItem && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  <strong>Bất biến Rule 00-invariants.md:</strong> Ví nội bộ chỉ áp dụng cho dòng thuộc nhóm Canteen, tuyệt đối không dùng cho hàng Bán lẻ (vợt, bóng, phụ kiện).
                </p>
              </div>
            )}

            {/* Hardware Print Toggle */}
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <Printer className="w-4 h-4 text-primary" />
                <span>Tự động in hóa đơn 80mm qua Bridge</span>
              </label>
            </div>
          </div>

          {/* Action Pane (7 cols) */}
          <div className="md:col-span-7 bg-background p-5 rounded-2xl border border-border flex flex-col justify-between">
            {method === 'CASH' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">Thu tiền mặt tại quầy</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Két tiền tự bật
                  </span>
                </div>
                <TouchNumpad
                  value={cashTendered}
                  onChange={setCashTendered}
                  targetAmount={totalAmount}
                  onConfirm={() => handleCompletePayment('CASH')}
                />
              </div>
            ) : method === 'VIETQR' ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-4 space-y-3">
                <div className="bg-white rounded-2xl p-2 shadow-lg border border-border">
                  <img
                    src={`https://img.vietqr.io/image/970422-VQRQANCXY2688-compact2.png?amount=${totalAmount}&addInfo=POS%20BILL&accountName=CAO%20NGUYEN%20ANH`}
                    alt="VietQR PayOS"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                </div>

                <div>
                  <h4 className="font-bold text-base text-foreground">Quét mã VietQR chuyển khoản (PayOS)</h4>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <div>MBBank: <strong className="text-foreground">VQRQANCXY2688</strong></div>
                    <div>Chủ TK: <strong className="text-foreground">CAO NGUYEN ANH</strong></div>
                    <div className="text-primary font-bold">{formatVND(totalAmount)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCompletePayment('VIETQR')}
                  disabled={processing}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận đã nhận được tiền</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full space-y-6 py-6">
                <div className="p-4 bg-card rounded-xl border border-border space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Khách hàng:</span>
                    <span className="font-semibold text-foreground">{customerPhone || 'Chưa gắn SĐT'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Số dư ví hiện tại:</span>
                    <span className="font-bold text-primary font-mono">{formatVND(customerWalletBalance)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Số dư sau thanh toán:</span>
                    <span className="font-bold font-mono text-foreground">
                      {formatVND(customerWalletBalance - totalAmount)}
                    </span>
                  </div>
                </div>

                {customerWalletBalance < totalAmount ? (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs">
                    Số dư ví không đủ để thanh toán đơn hàng này. Vui lòng nạp thêm tiền hoặc chọn phương thức Tiền mặt / VietQR.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCompletePayment('WALLET')}
                    disabled={processing}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold text-base rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Xác nhận trừ tiền ví ({formatVND(totalAmount)})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
