'use client';

import React from 'react';
import { formatVND } from '@/lib/utils';
import { ReceiptData, bridge } from '@/lib/bridge';
import { Printer, Check, X } from 'lucide-react';

interface ReceiptPreviewProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrintAgain = async () => {
    await bridge.printReceipt(receipt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-foreground">Hóa đơn bán lẻ (ESC/POS 80mm)</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper (Thermal 80mm visual style) */}
        <div className="p-6 bg-white text-zinc-900 font-mono text-xs select-text overflow-y-auto max-h-[70vh]">
          {/* Complex Header */}
          <div className="text-center pb-4 border-b border-dashed border-zinc-400 space-y-1">
            <h2 className="text-base font-black tracking-wider">ANTIGRAVITY SPORTS</h2>
            <p className="text-[11px] text-zinc-600">Tổ hợp Thể thao & Giải trí Cao cấp</p>
            <p className="text-[10px] text-zinc-500">Đ/c: Khu Liên hợp Thể thao Quốc gia</p>
            <p className="text-[10px] text-zinc-500">Hotline: 1900 8888 • MST: 0312345678</p>
          </div>

          {/* Metadata */}
          <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Mã hóa đơn:</span>
              <span className="font-bold">{receipt.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{receipt.createdAt.slice(0, 19).replace('T', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{receipt.cashierName}</span>
            </div>
            {receipt.customerPhone && (
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span>{receipt.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="py-3 border-b border-dashed border-zinc-400">
            <div className="flex justify-between font-bold pb-1 text-[11px]">
              <span className="w-1/2">Tên món</span>
              <span className="w-12 text-center">SL</span>
              <span className="w-16 text-right">Đơn giá</span>
              <span className="w-20 text-right">T.Tiền</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span className="w-1/2 truncate font-semibold">{item.name}</span>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <span className="w-16 text-right">{formatVND(item.unitPrice).replace(' đ', '')}</span>
                  <span className="w-20 text-right font-bold">{formatVND(item.totalPrice).replace(' đ', '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Tiền hàng (chưa thuế):</span>
              <span>{formatVND(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Thuế GTGT (VAT 8%):</span>
              <span>{formatVND(receipt.vatAmount)}</span>
            </div>
            {receipt.discountAmount ? (
              <div className="flex justify-between text-zinc-700">
                <span>Chiết khấu Voucher:</span>
                <span>-{formatVND(receipt.discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-zinc-300">
              <span>TỔNG THANH TOÁN:</span>
              <span>{formatVND(receipt.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Hình thức:</span>
              <span className="font-bold">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Khách đưa:</span>
              <span>{formatVND(receipt.paidAmount)}</span>
            </div>
            {receipt.changeAmount ? (
              <div className="flex justify-between font-bold">
                <span>Tiền thối lại:</span>
                <span>{formatVND(receipt.changeAmount)}</span>
              </div>
            ) : null}
          </div>

          {/* Footer note */}
          <div className="text-center pt-4 space-y-1 text-[10px] text-zinc-500">
            <p className="font-bold text-zinc-700">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</p>
            <p>Hóa đơn điện tử VAT tra cứu tại: https://sports.antigravity.vn/invoices</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-secondary text-foreground text-xs font-bold rounded-xl hover:bg-muted"
          >
            Đóng (Esc)
          </button>
          <button
            onClick={handlePrintAgain}
            className="flex-1 py-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In lại biên lai (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
