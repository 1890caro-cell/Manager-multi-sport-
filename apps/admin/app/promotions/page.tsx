'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Tag,
  PlusCircle,
  Gift,
  CheckCircle2,
  Calendar,
  Layers,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateOnly } from '@/lib/utils';

export default function AdminPromotionsPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'VOUCHERS' | 'COMBOS'>('VOUCHERS');
  const [loading, setLoading] = useState(false);

  // New Voucher Modal
  const [voucherModal, setVoucherModal] = useState(false);
  const [vCode, setVCode] = useState('');
  const [vDiscountType, setVDiscountType] = useState('PERCENT');
  const [vDiscountValue, setVDiscountValue] = useState('20');
  const [vMaxDiscount, setVMaxDiscount] = useState('100000');
  const [vUsageLimit, setVUsageLimit] = useState('100');
  const [creatingVoucher, setCreatingVoucher] = useState(false);

  // New Combo Modal
  const [comboModal, setComboModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cPrice, setCPrice] = useState('800000');
  const [creatingCombo, setCreatingCombo] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, cRes] = await Promise.allSettled([
        api.promotions.getVouchers(),
        api.promotions.getCombos(),
      ]);

      if (vRes.status === 'fulfilled' && Array.isArray(vRes.value)) {
        setVouchers(vRes.value);
      }
      if (cRes.status === 'fulfilled' && Array.isArray(cRes.value)) {
        setCombos(cRes.value);
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

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingVoucher(true);
      await api.promotions.createVoucher({
        code: vCode.toUpperCase(),
        discountType: vDiscountType,
        discountValue: parseInt(vDiscountValue, 10),
        maxDiscountAmount: parseInt(vMaxDiscount, 10),
        usageLimit: parseInt(vUsageLimit, 10),
      });

      showToast(`Đã tạo mã ưu đãi "${vCode.toUpperCase()}"!`);
      setVoucherModal(false);
      setVCode('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo voucher');
    } finally {
      setCreatingVoucher(false);
    }
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingCombo(true);
      await api.promotions.createCombo({
        name: cName,
        price: parseInt(cPrice, 10),
        items: [
          { serviceType: 'GYM', quantity: 30, description: '30 ngày tập gym' },
          { serviceType: 'CANTEEN', quantity: 5, description: '5 chai Pocari Sweat' },
        ],
      });

      showToast(`Đã tạo gói Combo "${cName}" thành công!`);
      setComboModal(false);
      setCName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo combo');
    } finally {
      setCreatingCombo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Khuyến Mãi, Mã Giảm Giá & Gói Combo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị ngân sách voucher, chiến dịch tri ân hội viên và gói dịch vụ kết hợp liên ngành
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'VOUCHERS' ? (
            <button
              onClick={() => setVoucherModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Tạo mã giảm giá
            </button>
          ) : (
            <button
              onClick={() => setComboModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Tạo gói Combo mới
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
          onClick={() => setActiveTab('VOUCHERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'VOUCHERS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Mã Giảm Giá ({vouchers.length})
        </button>
        <button
          onClick={() => setActiveTab('COMBOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COMBOS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gift className="w-3.5 h-3.5" /> Gói Combo Đa Dịch Vụ ({combos.length})
        </button>
      </div>

      {/* Tab 1: Vouchers */}
      {activeTab === 'VOUCHERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Mã Voucher</th>
                <th className="px-4 py-3">Mức Giảm</th>
                <th className="px-4 py-3">Giảm Tối Đa</th>
                <th className="px-4 py-3">Lượt Đã Dùng</th>
                <th className="px-4 py-3 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono font-black text-slate-900 text-sm">
                    {v.code}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-700">
                    {v.discountType === 'PERCENT' ? `${v.discountValue}%` : formatVND(v.discountValue)}
                  </td>
                  <td className="px-4 py-3 font-mono">{formatVND(v.maxDiscountAmount || 0)}</td>
                  <td className="px-4 py-3 font-mono">
                    {v.usedCount || 0} / {v.usageLimit || 100}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Đang kích hoạt
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Combos */}
      {activeTab === 'COMBOS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {combos.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Combo Thể Thao
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-2">{c.name}</h3>

                <div className="mt-3 p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Quyền lợi bao gồm:</p>
                  <p>• Thẻ tập gym không giới hạn 30 ngày</p>
                  <p>• 5 lượt nước điện giải thể thao Canteen</p>
                  <p>• Miễn phí mượn vợt cầu lông tiêu chuẩn</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Giá trọn gói</span>
                  <span className="text-base font-black text-purple-700 font-mono">
                    {formatVND(c.price)}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Tiết kiệm 25%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Voucher Modal */}
      {voucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tạo Mã Giảm Giá Mới</h3>
              <button onClick={() => setVoucherModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã Voucher (viết hoa) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: THETHAO2026"
                  value={vCode}
                  onChange={(e) => setVCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl uppercase font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại giảm giá *</label>
                  <select
                    value={vDiscountType}
                    onChange={(e) => setVDiscountType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức giảm *</label>
                  <input
                    type="number"
                    required
                    value={vDiscountValue}
                    onChange={(e) => setVDiscountValue(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giảm tối đa (VNĐ) *</label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={vMaxDiscount}
                    onChange={(e) => setVMaxDiscount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượt tối đa *</label>
                  <input
                    type="number"
                    required
                    value={vUsageLimit}
                    onChange={(e) => setVUsageLimit(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoucherModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingVoucher}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Tạo voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Combo Modal */}
      {comboModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tạo Gói Combo Đa Dịch Vụ</h3>
              <button onClick={() => setComboModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCombo} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên gói Combo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Combo Vàng: 1 Tháng Gym + 5 Chai Nước"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giá trọn gói (VNĐ) *</label>
                <input
                  type="number"
                  step="50000"
                  required
                  value={cPrice}
                  onChange={(e) => setCPrice(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setComboModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingCombo}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creatingCombo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Tạo combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
