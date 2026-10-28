'use client';

import React, { useState } from 'react';
import { formatVND } from '@/lib/utils';
import { ProductItem } from './ProductGrid';
import { Trash2, Plus, Minus, UserCheck, Tag, AlertTriangle, CreditCard, ShoppingCart } from 'lucide-react';

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface CartPaneProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedPayment: () => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerName?: string;
  customerWalletBalance?: number;
  voucherDiscount: number;
  onApplyVoucher: (code: string) => void;
}

export const CartPane: React.FC<CartPaneProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedPayment,
  customerPhone,
  setCustomerPhone,
  customerName,
  customerWalletBalance,
  voucherDiscount,
  onApplyVoucher,
}) => {
  const [voucherInput, setVoucherInput] = useState('');

  // Calculations
  const rawSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const vatAmount = Math.round(rawSubtotal * 0.08); // VAT 8%
  const totalAmount = Math.max(0, rawSubtotal + vatAmount - voucherDiscount);

  // Invariant check: Any RETAIL items?
  const hasRetailItem = items.some((item) => item.product.group === 'RETAIL');

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-base">Giỏ hàng thanh toán</h3>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-destructive hover:underline font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hủy giỏ
          </button>
        )}
      </div>

      {/* Customer Lookup Bar */}
      <div className="p-3 border-b border-border/60 bg-background/50 flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="SĐT khách hàng (tùy chọn / ví)"
          className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none flex-1 font-mono"
        />
        {customerName && (
          <div className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
            {customerName} {customerWalletBalance !== undefined ? `(${formatVND(customerWalletBalance)})` : ''}
          </div>
        )}
      </div>

      {/* Invariant Alert if Cart has Retail items */}
      {hasRetailItem && (
        <div className="p-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300 leading-tight">
            Đơn chứa hàng <strong>BÁN LẺ (RETAIL)</strong>. Theo quy tắc 00-invariants.md, chỉ chấp nhận Tiền mặt hoặc VietQR (Khóa Ví nội bộ).
          </p>
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Chưa có món nào trong giỏ</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Chạm vào sản phẩm hoặc quét mã vạch</p>
          </div>
        ) : (
          items.map((item) => {
            const itemTotal = item.product.price * item.quantity;
            return (
              <div
                key={item.product.id}
                className="p-3 rounded-xl bg-background border border-border/80 flex items-center justify-between gap-2"
              >
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        item.product.group === 'RETAIL'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {item.product.group === 'RETAIL' ? 'LẺ' : 'CANTEEN'}
                    </span>
                    <h5 className="font-semibold text-xs text-foreground truncate">
                      {item.product.name}
                    </h5>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {formatVND(item.product.price)} / {item.product.unit}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-foreground hover:bg-muted active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs text-foreground font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-foreground hover:bg-muted active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Item Total Price */}
                <div className="w-20 text-right">
                  <span className="font-bold text-xs text-foreground font-mono block">
                    {formatVND(itemTotal)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-[10px] text-destructive hover:underline mt-0.5"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Voucher Code Input */}
      <div className="p-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={voucherInput}
            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
            placeholder="Mã Voucher giảm giá"
            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => {
              if (voucherInput.trim()) onApplyVoucher(voucherInput.trim());
            }}
            className="px-3 py-1.5 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-muted"
          >
            Áp dụng
          </button>
        </div>
      </div>

      {/* Price Summary & Payment Trigger */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tiền hàng (chưa thuế):</span>
          <span className="font-mono text-foreground font-semibold">{formatVND(rawSubtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Thuế GTGT (VAT 8%):</span>
          <span className="font-mono text-foreground font-semibold">{formatVND(vatAmount)}</span>
        </div>
        {voucherDiscount > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Chiết khấu Voucher:</span>
            <span className="font-mono font-bold">-{formatVND(voucherDiscount)}</span>
          </div>
        )}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">Tổng thanh toán:</span>
          <span className="font-extrabold text-xl text-primary font-mono">
            {formatVND(totalAmount)}
          </span>
        </div>

        {/* Primary Checkout Button */}
        <button
          onClick={onProceedPayment}
          disabled={items.length === 0}
          className="w-full py-4 bg-primary text-primary-foreground font-bold text-base rounded-xl mt-2 flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all active:scale-98"
        >
          <CreditCard className="w-5 h-5" />
          <span>Thanh toán ngay ({formatVND(totalAmount)})</span>
        </button>
      </div>
    </div>
  );
};
