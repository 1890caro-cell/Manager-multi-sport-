'use client';

import React, { useState, useEffect } from 'react';
import { POSHeader } from '@/components/POSHeader';
import { ProductGrid, ProductItem } from '@/components/ProductGrid';
import { CartPane, CartItem } from '@/components/CartPane';
import { PaymentModal } from '@/components/PaymentModal';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { ReceiptData } from '@/lib/bridge';
import { api } from '@/lib/api';
import { usePOS } from '@/lib/pos-context';
import { Lock, DollarSign } from 'lucide-react';

const INITIAL_PRODUCTS: ProductItem[] = [
  // Canteen Drinks
  {
    id: 'prod_pocari',
    sku: 'DRK-POCARI-500',
    barcode: '893500180001',
    name: 'Nước bù khoáng Pocari Sweat 500ml',
    group: 'CANTEEN',
    subCategory: 'ENERGY',
    price: 18000,
    stock: 120,
    unit: 'chai',
    vatRate: 8,
    icon: '⚡',
  },
  {
    id: 'prod_revive',
    sku: 'DRK-REVIVE-500',
    barcode: '893500180002',
    name: 'Nước điện giải Revive chanh muối',
    group: 'CANTEEN',
    subCategory: 'ENERGY',
    price: 15000,
    stock: 95,
    unit: 'chai',
    vatRate: 8,
    icon: '🍋',
  },
  {
    id: 'prod_redbull',
    sku: 'DRK-REDBULL-250',
    barcode: '893500180003',
    name: 'Nước tăng lực Red Bull Thái Lan',
    group: 'CANTEEN',
    subCategory: 'ENERGY',
    price: 20000,
    stock: 64,
    unit: 'lon',
    vatRate: 8,
    icon: '🐂',
  },
  {
    id: 'prod_coffee',
    sku: 'DRK-COFFEE-ICE',
    barcode: '893500180004',
    name: 'Cà phê đá Robusta pha máy',
    group: 'CANTEEN',
    subCategory: 'DRINKS',
    price: 25000,
    stock: 200,
    unit: 'ly',
    vatRate: 8,
    icon: '☕',
  },
  {
    id: 'prod_aquafina',
    sku: 'DRK-AQUA-500',
    barcode: '893500180005',
    name: 'Nước tinh khiết Aquafina 500ml',
    group: 'CANTEEN',
    subCategory: 'DRINKS',
    price: 10000,
    stock: 150,
    unit: 'chai',
    vatRate: 8,
    icon: '💧',
  },

  // Canteen Food
  {
    id: 'prod_banhmi',
    sku: 'FOD-BANHMI-PATE',
    barcode: '893500180006',
    name: 'Bánh mì que pate bơ nóng giòn',
    group: 'CANTEEN',
    subCategory: 'FOOD',
    price: 25000,
    stock: 40,
    unit: 'ổ',
    vatRate: 8,
    icon: '🥖',
  },
  {
    id: 'prod_xucxich',
    sku: 'FOD-SAUSAGE-GRILLED',
    barcode: '893500180007',
    name: 'Xúc xích Đức nướng phô mai',
    group: 'CANTEEN',
    subCategory: 'FOOD',
    price: 22000,
    stock: 35,
    unit: 'cây',
    vatRate: 8,
    icon: '🌭',
  },

  // Retail Accessories (Vợt, bóng, phụ kiện thể thao)
  {
    id: 'prod_ball_molten',
    sku: 'RTL-BALL-MOLTEN-F5',
    barcode: '893500180008',
    name: 'Bóng đá thi đấu Molten FIFA Pro số 5',
    group: 'RETAIL',
    subCategory: 'RETAIL',
    price: 350000,
    stock: 15,
    unit: 'quả',
    vatRate: 8,
    icon: '⚽',
  },
  {
    id: 'prod_tape',
    sku: 'RTL-TAPE-ANKLE',
    barcode: '893500180009',
    name: 'Băng keo quấn khớp cơ co giãn',
    group: 'RETAIL',
    subCategory: 'RETAIL',
    price: 45000,
    stock: 80,
    unit: 'cuộn',
    vatRate: 8,
    icon: '🩹',
  },
  {
    id: 'prod_shuttlecock',
    sku: 'RTL-SHUTTLE-YONEX',
    barcode: '893500180010',
    name: 'Hộp cầu lông lông vũ Yonex AS-40',
    group: 'RETAIL',
    subCategory: 'RETAIL',
    price: 240000,
    stock: 25,
    unit: 'ống',
    vatRate: 8,
    icon: '🏸',
  },
];

export default function TouchPOSPage() {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerWalletBalance, setCustomerWalletBalance] = useState<number>(0);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);

  const { currentShift, openShiftModal, recordSale } = usePOS();
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

  // Phone lookup simulation
  useEffect(() => {
    if (customerPhone.length >= 10) {
      if (customerPhone === '0901234567') {
        setCustomerName('Nguyễn Văn A (Hội viên VIP)');
        setCustomerWalletBalance(850000);
      } else {
        setCustomerName('Khách vãng lai');
        setCustomerWalletBalance(0);
      }
    } else {
      setCustomerName('');
      setCustomerWalletBalance(0);
    }
  }, [customerPhone]);

  // Cart operations
  const handleAddToCart = (product: ProductItem) => {
    if (!currentShift) {
      openShiftModal('OPEN');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setVoucherDiscount(0);
  };

  const handleApplyVoucher = (code: string) => {
    if (code === 'ANTIGRAVITY20' || code === 'CANTEEN10') {
      const discount = code === 'ANTIGRAVITY20' ? 20000 : 10000;
      setVoucherDiscount(discount);
      alert(`Đã áp dụng Voucher [${code}]: Giảm -${discount.toLocaleString('vi-VN')} đ`);
    } else {
      alert(`Mã voucher [${code}] không hợp lệ hoặc đã hết hạn.`);
    }
  };

  const handleScanBarcode = (barcode: string) => {
    alert(`Không tìm thấy sản phẩm có mã vạch: ${barcode}`);
  };

  const rawSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const vatAmount = Math.round(rawSubtotal * 0.08);
  const totalAmount = Math.max(0, rawSubtotal + vatAmount - voucherDiscount);
  const hasRetailItem = cart.some((item) => item.product.group === 'RETAIL');

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      {/* POS Top Header */}
      <POSHeader />

      {/* Main Touch Workspace */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4 relative">
        {/* Left: Product Touch Grid (65%) */}
        <section className="flex-[7] h-full flex flex-col overflow-hidden">
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            onScanBarcode={handleScanBarcode}
          />
        </section>

        {/* Right: Cart & Fast Checkout Column (35%) */}
        <aside className="flex-[4] h-full flex flex-col overflow-hidden">
          <CartPane
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onProceedPayment={() => {
              if (!currentShift) {
                openShiftModal('OPEN');
                return;
              }
              setShowPaymentModal(true);
            }}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            customerName={customerName}
            customerWalletBalance={customerWalletBalance}
            voucherDiscount={voucherDiscount}
            onApplyVoucher={handleApplyVoucher}
          />
        </aside>

        {/* Mandatory Shift Lockout Overlay if shift not opened */}
        {!currentShift && (
          <div className="absolute inset-0 z-40 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Ca thu ngân chưa mở</h2>
            <p className="text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
              Theo quy định vận hành SPEC F12.5 & Bất biến 00-invariants.md, thu ngân phải thực hiện Mở ca và bàn giao tiền đầu ca trước khi bắt đầu tạo đơn bán hàng.
            </p>
            <button
              onClick={() => openShiftModal('OPEN')}
              className="mt-6 px-8 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-2xl hover:bg-primary/90 flex items-center gap-2 shadow-lg"
            >
              <DollarSign className="w-5 h-5" />
              <span>Mở ca thu ngân ngay</span>
            </button>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={totalAmount}
        items={cart}
        hasRetailItem={hasRetailItem}
        customerPhone={customerPhone}
        customerWalletBalance={customerWalletBalance}
        cashierName={currentShift?.cashierName}
        onPaymentSuccess={(receipt) => {
          setShowPaymentModal(false);
          setCart([]);
          setVoucherDiscount(0);
          setLastReceipt(receipt);

          // Update shift sales
          if (currentShift) {
            recordSale(receipt.paymentMethod, receipt.totalAmount);
          }
        }}
      />

      {/* Thermal 80mm Receipt Preview Modal */}
      <ReceiptPreview
        receipt={lastReceipt}
        onClose={() => setLastReceipt(null)}
      />
    </div>
  );
}
