'use client';

import React, { useState } from 'react';
import { formatVND } from '@/lib/utils';
import { Search, Barcode, Coffee, Utensils, Zap, ShoppingBag, Layers } from 'lucide-react';

export interface ProductItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  group: 'CANTEEN' | 'RETAIL';
  subCategory: string;
  price: number;
  stock: number;
  unit: string;
  vatRate: number;
  icon?: string;
}

interface ProductGridProps {
  products: ProductItem[];
  onAddToCart: (product: ProductItem) => void;
  onScanBarcode?: (barcode: string) => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả', icon: Layers },
  { id: 'DRINKS', label: 'Đồ uống & Cà phê', icon: Coffee },
  { id: 'ENERGY', label: 'Nước điện giải', icon: Zap },
  { id: 'FOOD', label: 'Đồ ăn nhanh', icon: Utensils },
  { id: 'RETAIL', label: 'Phụ kiện thể thao (Retail)', icon: ShoppingBag },
];

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onScanBarcode,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find((p) => p.barcode === barcodeInput.trim() || p.sku === barcodeInput.trim());
    if (found) {
      onAddToCart(found);
      setBarcodeInput('');
    } else if (onScanBarcode) {
      onScanBarcode(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      activeCategory === 'ALL' ||
      (activeCategory === 'RETAIL' && p.group === 'RETAIL') ||
      p.subCategory === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery.trim()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search & Barcode Scanner Header */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, mã SKU..."
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="relative w-64">
          <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Quét mã vạch..."
            className="w-full pl-10 pr-3 py-3 bg-card border border-primary/40 rounded-xl text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm scale-102'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Products Touch Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isRetail = product.group === 'RETAIL';

            return (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                disabled={isOutOfStock}
                className={`p-4 rounded-2xl bg-card border text-left flex flex-col justify-between transition-all active:scale-98 relative group ${
                  isOutOfStock
                    ? 'opacity-40 border-border cursor-not-allowed'
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                }`}
              >
                {/* Top Badges */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isRetail
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isRetail ? 'BÁN LẺ' : 'CANTEEN'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Còn: <span className="font-bold text-foreground">{product.stock}</span> {product.unit}
                  </span>
                </div>

                {/* Product Name & Icon */}
                <div className="my-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl flex-shrink-0">
                    {product.icon || (isRetail ? '🏸' : '🥤')}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {product.sku}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 w-full">
                  <span className="text-sm font-extrabold text-primary font-mono">
                    {formatVND(product.price)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    VAT {product.vatRate}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
