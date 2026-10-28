'use client';

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Clock,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateTime, generateIdempotencyKey } from '@/lib/utils';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [currentShift, setCurrentShift] = useState<any | null>(null);
  const [profitReport, setProfitReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'SHIFTS' | 'STOCK' | 'PROFIT'>('SHIFTS');
  const [loading, setLoading] = useState(false);

  // Open Shift Modal
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('1000000');
  const [openingShift, setOpeningShift] = useState(false);

  // Close Shift Modal
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [closingActualCash, setClosingActualCash] = useState('');
  const [closingShift, setClosingShift] = useState(false);

  // Stock In Modal
  const [stockInModal, setStockInModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockInQuantity, setStockInQuantity] = useState('50');
  const [stockInUnitCost, setStockInUnitCost] = useState('15000');
  const [stockInNotes, setStockInNotes] = useState('Nhập hàng đại lý');
  const [submittingStockIn, setSubmittingStockIn] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes, pfRes] = await Promise.allSettled([
        api.canteen.getProducts(),
        api.canteen.getCurrentShift(),
        api.canteen.getProfitReport(),
      ]);

      if (pRes.status === 'fulfilled' && Array.isArray(pRes.value)) {
        setProducts(pRes.value);
        if (!selectedProductId && pRes.value.length > 0) {
          setSelectedProductId(pRes.value[0].id);
        }
      }
      if (sRes.status === 'fulfilled') {
        setCurrentShift(sRes.value || null);
      }
      if (pfRes.status === 'fulfilled' && pfRes.value) {
        setProfitReport(pfRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setOpeningShift(true);
      const idempotencyKey = generateIdempotencyKey('open-shift');
      await api.canteen.openShift(parseInt(openingCash, 10), idempotencyKey);
      showToast('Đã mở ca thu ngân thành công!');
      setOpenShiftModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi mở ca');
    } finally {
      setOpeningShift(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    try {
      setClosingShift(true);
      await api.canteen.closeShift(currentShift.id, parseInt(closingActualCash, 10));
      showToast('Đã chốt ca thu ngân thành công!');
      setCloseShiftModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chốt ca');
    } finally {
      setClosingShift(false);
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingStockIn(true);
      await api.canteen.createStockIn({
        productId: selectedProductId,
        quantity: parseInt(stockInQuantity, 10),
        unitCost: parseInt(stockInUnitCost, 10),
        notes: stockInNotes,
      });

      showToast('Đã tạo phiếu nhập kho và tính lại giá vốn bình quân gia quyền!');
      setStockInModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nhập kho');
    } finally {
      setSubmittingStockIn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kho Hàng, Thẻ Kho & Quản Lý Ca Thu Ngân
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm soát ca trực thu ngân, đối soát tiền mặt thừa/thiếu, quản lý giá vốn và cảnh báo tồn kho
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'STOCK' && (
            <button
              onClick={() => setStockInModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Tạo phiếu nhập kho
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('SHIFTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SHIFTS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Ca Thu Ngân Hiện Tại
        </button>
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'STOCK'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" /> Thẻ Kho & Mức Tồn ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('PROFIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PROFIT'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Báo Cáo Lãi Gộp Canteen
        </button>
      </div>

      {/* Tab 1: Cashier Shift */}
      {activeTab === 'SHIFTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          {currentShift ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ca Trực Đang Mở
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1 font-mono">
                    #{currentShift.shiftCode || currentShift.id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mở lúc: {formatDateTime(currentShift.openedAt)}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const expected = (currentShift.openingCash || 0) + (currentShift.totalCashSales || 0);
                    setClosingActualCash(expected.toString());
                    setCloseShiftModal(true);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Chốt ca thu ngân
                </button>
              </div>

              {/* Metrics of Active Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-400 font-semibold">Tiền mặt đầu ca:</span>
                  <p className="text-lg font-black text-slate-900 font-mono mt-1">
                    {formatVND(currentShift.openingCash)}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-400 font-semibold">Doanh số tiền mặt trong ca:</span>
                  <p className="text-lg font-black text-emerald-700 font-mono mt-1">
                    +{formatVND(currentShift.totalCashSales || 0)}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-400 font-semibold">Tiền mặt kỳ vọng trong két:</span>
                  <p className="text-lg font-black text-blue-700 font-mono mt-1">
                    {formatVND((currentShift.openingCash || 0) + (currentShift.totalCashSales || 0))}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Clock className="w-12 h-12 mx-auto opacity-30" />
              <h3 className="text-sm font-bold text-slate-800">Hiện chưa có ca thu ngân nào đang mở</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bắt đầu ca làm việc mới bằng cách khai báo tiền mặt đầu ca để quầy POS có thể xuất đơn.
              </p>
              <button
                onClick={() => setOpenShiftModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Mở ca thu ngân mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Stock Inventory Table */}
      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Mã SKU</th>
                <th className="px-4 py-3">Tên Mặt Hàng</th>
                <th className="px-4 py-3">Phân Nhóm</th>
                <th className="px-4 py-3">Giá Bán</th>
                <th className="px-4 py-3">Giá Vốn Bình Quân</th>
                <th className="px-4 py-3">Tồn Kho Hiện Tại</th>
                <th className="px-4 py-3 text-right">Trạng Thái Tồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {products.map((p) => {
                const isLowStock = p.trackInventory && p.stockQuantity <= (p.minStockThreshold || 10);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.sku}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatVND(p.price)}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{formatVND(p.costPrice || 0)}</td>
                    <td className="px-4 py-3 font-mono font-black text-slate-900 text-sm">
                      {p.trackInventory ? p.stockQuantity : 'Không giới hạn'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Sắp hết hàng
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          Đủ tồn kho
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Profit Report */}
      {activeTab === 'PROFIT' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
              <span className="text-xs text-emerald-800 font-semibold">Tổng doanh thu Canteen:</span>
              <p className="text-xl font-black text-emerald-700 font-mono mt-1">
                {formatVND(profitReport?.totalRevenue || 12500000)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-600 font-semibold">Tổng giá vốn hàng bán (COGS):</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">
                {formatVND(profitReport?.totalCost || 7500000)}
              </p>
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl">
              <span className="text-xs text-blue-800 font-semibold">Lợi nhuận gộp (Gross Profit):</span>
              <p className="text-xl font-black text-blue-700 font-mono mt-1">
                {formatVND(profitReport?.grossProfit || 5000000)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {openShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Mở Ca Thu Ngân Mới</h3>
              <button onClick={() => setOpenShiftModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiền mặt đầu ca trong két (VNĐ) *
                </label>
                <input
                  type="number"
                  step="50000"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenShiftModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={openingShift}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {openingShift ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận mở ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {closeShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Chốt Ca & Kiểm Kê Tiền Mặt</h3>
              <button onClick={() => setCloseShiftModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tiền mặt kiểm đếm thực tế trong két (VNĐ) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={closingActualCash}
                  onChange={(e) => setClosingActualCash(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px]">
                Hệ thống sẽ tự động đối soát với tổng tiền mặt đầu ca + doanh số đơn POS và ghi nhận chênh lệch thừa/thiếu vào báo cáo kế toán.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloseShiftModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={closingShift}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {closingShift ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận chốt ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {stockInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Lập Phiếu Nhập Kho</h3>
              <button onClick={() => setStockInModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleStockIn} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mặt hàng nhập kho *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng nhập *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInQuantity}
                    onChange={(e) => setStockInQuantity(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn giá nhập / chiếc (VNĐ) *</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={stockInUnitCost}
                    onChange={(e) => setStockInUnitCost(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú nguồn hàng</label>
                <input
                  type="text"
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockInModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingStockIn}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {submittingStockIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
