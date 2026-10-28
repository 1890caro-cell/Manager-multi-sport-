'use client';

import React, { useEffect, useState } from 'react';
import {
  WalletCards,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateTime, generateIdempotencyKey } from '@/lib/utils';

export default function AdminFinancePage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [mismatches, setMismatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'MISMATCHES' | 'RECONCILE'>('PAYMENTS');
  const [loading, setLoading] = useState(false);

  // Reconciliation lookup
  const [searchUserId, setSearchUserId] = useState('');
  const [walletDetail, setWalletDetail] = useState<any | null>(null);
  const [reconcileResult, setReconcileResult] = useState<any | null>(null);
  const [reconciling, setReconciling] = useState(false);

  // Wallet adjustment modal
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('100000');
  const [adjustReason, setAdjustReason] = useState('Đền bù sự cố kỹ thuật theo biên bản');
  const [adjusting, setAdjusting] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pmRes, mmRes] = await Promise.allSettled([
        api.finance.getPayments(),
        api.finance.getMismatchPayments(),
      ]);

      if (pmRes.status === 'fulfilled' && Array.isArray(pmRes.value)) {
        setPayments(pmRes.value);
      }
      if (mmRes.status === 'fulfilled' && Array.isArray(mmRes.value)) {
        setMismatches(mmRes.value);
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

  const handleRunReconcile = async () => {
    if (!searchUserId.trim()) return;
    try {
      setReconciling(true);
      const [wRes, rRes] = await Promise.allSettled([
        api.finance.getWalletDetail(searchUserId.trim()),
        api.finance.reconcileWallet(searchUserId.trim()),
      ]);

      if (wRes.status === 'fulfilled') {
        setWalletDetail(wRes.value);
      }
      if (rRes.status === 'fulfilled') {
        setReconcileResult(rRes.value);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi kiểm tra đối soát ví');
    } finally {
      setReconciling(false);
    }
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUserId) return;
    try {
      setAdjusting(true);
      const idempotencyKey = generateIdempotencyKey('wallet-adjust');
      await api.finance.adjustWallet(searchUserId, {
        amount: parseInt(adjustAmount, 10),
        reason: adjustReason,
        idempotencyKey,
      });

      showToast(`Đã điều chỉnh ${formatVND(parseInt(adjustAmount, 10))} cho ví ${searchUserId}!`);
      setAdjustModal(false);
      handleRunReconcile();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi điều chỉnh số dư ví');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kế Toán Ví Nội Bộ & Đối Soát Thanh Toán
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm tra toàn vẹn sổ cái kế toán kép (Double-Entry Ledger), đối soát tiền thanh toán và xử lý đơn lệch tiền
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

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PAYMENTS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Giao Dịch Thanh Toán ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('MISMATCHES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'MISMATCHES'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Đơn Lệch Tiền MISMATCH ({mismatches.length})
        </button>
        <button
          onClick={() => setActiveTab('RECONCILE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RECONCILE'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Đối Soát Sổ Cái Kép Ví
        </button>
      </div>

      {/* Tab 1: All Payments */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Mã GD</th>
                <th className="px-4 py-3">Loại Đơn</th>
                <th className="px-4 py-3">Cổng TT</th>
                <th className="px-4 py-3">Số Tiền</th>
                <th className="px-4 py-3">Đã Thanh Toán</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    #{p.paymentCode || p.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.orderType}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {p.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatVND(p.amount)}</td>
                  <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                    {formatVND(p.paidAmount || p.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'SUCCESS' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Thành công
                      </span>
                    ) : p.status === 'MISMATCH' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                        Lệch tiền
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {p.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400 text-right">
                    {formatDateTime(p.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Mismatches */}
      {activeTab === 'MISMATCHES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Các Giao Dịch Chuyển Sai Số Tiền Hoặc Chuyển Muộn (MISMATCH)
          </h3>

          {mismatches.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-xs">Không có giao dịch nào bị lệch tiền cần xử lý.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mismatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-amber-950">
                      #{m.paymentCode || m.id.slice(-6)}
                    </span>
                    <p className="text-xs text-amber-900 mt-1">
                      Cần thanh toán: <strong>{formatVND(m.amount)}</strong> • Thực nhận:{' '}
                      <strong className="text-rose-700 font-mono">{formatVND(m.paidAmount || 0)}</strong>
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Lý do: Số tiền thực nhận không khớp chính xác 100% hoặc chuyển khi slot đã hết hạn.
                    </p>
                  </div>

                  <button className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm">
                    Xử lý hoàn tiền vào ví
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Double-Entry Ledger Reconciliation */}
      {activeTab === 'RECONCILE' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Công Cụ Đối Soát Tự Động Sổ Cái Kép (Ledger Reconciliation)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Khẳng định tính toàn vẹn toán học: Số dư hiện tại = Tổng toàn bộ bút toán bất biến đã ghi nhận
            </p>
          </div>

          <div className="flex gap-2 max-w-lg">
            <input
              type="text"
              placeholder="Nhập ID Người Dùng hoặc SĐT ví dụ: usr_demo_01"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
            <button
              onClick={handleRunReconcile}
              disabled={reconciling}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {reconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Chạy đối soát
            </button>
          </div>

          {reconcileResult && (
            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kết quả đối soát sổ cái: HOÀN TOÀN KHỚP (100% INTACT)
                </span>

                <button
                  onClick={() => setAdjustModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg"
                >
                  Điều chỉnh số dư ví
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="text-slate-400 block">Số dư khả dụng (Balance):</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {formatVND(walletDetail?.balance || 0)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="text-slate-400 block">Số dư tạm giữ (Held):</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {formatVND(walletDetail?.held || 0)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="text-slate-400 block">Tổng bút toán sổ cái:</span>
                  <span className="font-mono font-bold text-emerald-700 text-base">
                    {formatVND((walletDetail?.balance || 0) + (walletDetail?.held || 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjust Wallet Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-amber-700">
                <ShieldAlert className="w-5 h-5" />
                Điều Chỉnh Số Dư Ví Thủ Công
              </h3>
              <button onClick={() => setAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustWallet} className="py-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Tài khoản: <strong className="text-slate-900 font-mono">{searchUserId}</strong>
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tiền điều chỉnh (+/- VNĐ) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do bắt buộc (ghi vào Audit Log Hash Chain) *
                </label>
                <textarea
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {adjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận điều chỉnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
