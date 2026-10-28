'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Wallet,
  Banknote,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, generateIdempotencyKey } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  category: 'CANTEEN' | 'RETAIL';
  price: number;
  vatRate: number;
  quantity: number;
}

export default function AdminPosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Checkout modal
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR' | 'INTERNAL_WALLET'>('CASH');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.canteen.getProducts();
      if (Array.isArray(res)) {
        setProducts(res);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          vatRate: product.vatRate || 8,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vatTotal = cart.reduce(
    (sum, item) => sum + Math.round((item.price * item.quantity * item.vatRate) / (100 + item.vatRate)),
    0,
  );
  const totalAmount = subtotal;

  const cashReceivedInt = parseInt(cashReceived, 10) || 0;
  const changeAmount = Math.max(0, cashReceivedInt - totalAmount);

  // Check if cart contains any RETAIL product for internal wallet invariant rule
  const hasRetailItem = cart.some((item) => item.category === 'RETAIL');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'INTERNAL_WALLET' && hasRetailItem) {
      alert('Quy tắc hệ thống: Ví nội bộ chỉ được phép thanh toán sản phẩm CANTEEN (đồ ăn, thức uống), không áp dụng cho hàng bán lẻ dụng cụ.');
      return;
    }

    if (paymentMethod === 'CASH' && cashReceivedInt < totalAmount) {
      alert('Số tiền khách đưa không được nhỏ hơn tổng tiền đơn hàng');
      return;
    }

    try {
      setSubmittingOrder(true);
      const idempotencyKey = generateIdempotencyKey('pos-order');
      const orderData = {
        items: cart.map((c) => ({
          productId: c.id,
          productName: c.name,
          sku: c.sku,
          unitPrice: c.price,
          quantity: c.quantity,
          vatRate: c.vatRate,
        })),
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceivedInt : undefined,
        customerPhone: customerPhone || undefined,
        idempotencyKey,
      };

      await api.canteen.createPosOrder(orderData);
      setOrderSuccess(`Đã thanh toán thành công đơn hàng ${formatVND(totalAmount)}!`);
      clearCart();
      setCheckoutModal(false);
      setCashReceived('');
      setTimeout(() => setOrderSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo đơn hàng POS');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quầy Thu Ngân Bán Lẻ & POS Canteen
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Giao diện bán hàng tốc độ cao, quét mã vạch Barcode và thanh toán Tiền mặt / VietQR / Ví
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{orderSuccess}</span>
        </div>
      )}

      {/* POS Workspace: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Catalog & Search (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters & Barcode Scan Input */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Quét mã vạch Barcode hoặc tìm tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'CANTEEN', label: 'F&B Canteen' },
                { key: 'RETAIL', label: 'Dụng cụ bán lẻ' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 text-left shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    {p.sku}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2 group-hover:text-emerald-700">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-emerald-700">
                    {formatVND(p.price)}
                  </span>
                  <span className="w-5 h-5 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-500 text-xs font-bold transition-colors">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Active Cart (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between h-[650px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Giỏ Hàng Quầy ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                >
                  Xóa giỏ
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100 mt-2">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Giỏ hàng quầy đang trống</p>
                  <p className="text-[10px] mt-1">Chọn món bên trái để tạo đơn thanh toán</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatVND(item.price)} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Summary & Checkout */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Tiền hàng (chưa VAT):</span>
                <span className="font-mono">{formatVND(subtotal - vatTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Thuế GTGT (VAT 8%):</span>
                <span className="font-mono">{formatVND(vatTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Tổng cộng:</span>
                <span className="font-mono text-emerald-700 text-base">{formatVND(totalAmount)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => {
                setCashReceived(totalAmount.toString());
                setCheckoutModal(true);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              Thanh Toán ({formatVND(totalAmount)})
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Thanh Toán POS</h3>
              <button onClick={() => setCheckoutModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckout} className="py-4 space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-600">Tổng thanh toán:</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {formatVND(totalAmount)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Phương thức thanh toán *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 mx-auto mb-1" />
                    Tiền mặt
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      paymentMethod === 'VIETQR'
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1" />
                    VietQR
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('INTERNAL_WALLET')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      paymentMethod === 'INTERNAL_WALLET'
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    } ${hasRetailItem ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Wallet className="w-4 h-4 mx-auto mb-1" />
                    Ví Canteen
                  </button>
                </div>
              </div>

              {/* Cash specific: Received and Change */}
              {paymentMethod === 'CASH' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-amber-950">Tiền khách đưa (VNĐ):</label>
                    <input
                      type="number"
                      step="1000"
                      required
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-36 p-1.5 border border-amber-300 rounded-lg text-right font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-amber-200">
                    <span className="text-amber-900">Tiền thừa trả khách:</span>
                    <span className="font-mono text-emerald-700 text-sm">{formatVND(changeAmount)}</span>
                  </div>
                </div>
              )}

              {/* SĐT khách (tùy chọn để tích điểm / nhận HĐ điện tử) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điện thoại khách hàng (nhận HĐ điện tử VAT)
                </label>
                <input
                  type="tel"
                  placeholder="0912345678 (tùy chọn)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckoutModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {submittingOrder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Hoàn tất đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
