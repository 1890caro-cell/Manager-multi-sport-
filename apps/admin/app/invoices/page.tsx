'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Loader2,
  FileWarning,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateOnly, formatDateTime } from '@/lib/utils';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [uninvoicedReport, setUninvoicedReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'ISSUED' | 'UNINVOICED'>('ISSUED');
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, uninvRes] = await Promise.allSettled([
        api.invoices.getList(),
        api.invoices.getUninvoicedReport(),
      ]);

      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) {
        setInvoices(invRes.value);
      }
      if (uninvRes.status === 'fulfilled' && uninvRes.value) {
        setUninvoicedReport(uninvRes.value);
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

  const handleRetryInvoice = async (id: string, code: string) => {
    try {
      setRetryingId(id);
      await api.invoices.retry(id);
      showToast(`Đã gửi lại yêu cầu ký số hóa đơn #${code}!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi phát hành lại hóa đơn');
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancelInvoice = async (id: string, code: string) => {
    const reason = prompt('Nhập biên bản hủy hóa đơn điện tử:');
    if (!reason) return;
    try {
      await api.invoices.cancel(id, reason);
      showToast(`Đã lập biên bản hủy hóa đơn #${code}!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy hóa đơn');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Hóa Đơn Điện Tử VAT
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi phát hành hóa đơn có mã CQT, ký số nhà cung cấp (MISA/VNPT/Viettel) và báo cáo doanh thu chưa xuất
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
          onClick={() => setActiveTab('ISSUED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ISSUED'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Danh Sách Hóa Đơn ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('UNINVOICED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'UNINVOICED'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileWarning className="w-3.5 h-3.5 text-amber-500" /> Báo Cáo Chưa Xuất HĐ
        </button>
      </div>

      {/* Tab 1: Issued Invoices Table */}
      {activeTab === 'ISSUED' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Số Hóa Đơn</th>
                <th className="px-4 py-3">Mã Tra Cứu</th>
                <th className="px-4 py-3">Nhà Cung Cấp</th>
                <th className="px-4 py-3">Đơn Vị Mua</th>
                <th className="px-4 py-3">Thuế GTGT</th>
                <th className="px-4 py-3">Tổng Tiền</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    #{inv.invoiceNumber || inv.invoiceCode}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                    {inv.lookupCode || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {inv.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">{inv.buyerName || 'Khách lẻ'}</span>
                    {inv.buyerTaxCode && (
                      <span className="block text-[10px] text-slate-400 font-mono">
                        MST: {inv.buyerTaxCode}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">{formatVND(inv.vatAmount || 0)}</td>
                  <td className="px-4 py-3 font-mono font-black text-slate-900">
                    {formatVND(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === 'ISSUED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Đã ký số CQT
                      </span>
                    ) : inv.status === 'FAILED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                        Lỗi kết nối
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Đã hủy
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                    {inv.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetryInvoice(inv.id, inv.invoiceNumber || inv.id.slice(-6))}
                        disabled={retryingId === inv.id}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold"
                      >
                        {retryingId === inv.id ? 'Đang gửi...' : 'Gửi lại'}
                      </button>
                    )}
                    {inv.status === 'ISSUED' && (
                      <button
                        onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber || inv.id.slice(-6))}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-semibold"
                      >
                        Hủy HĐ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Uninvoiced Report */}
      {activeTab === 'UNINVOICED' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              Đối Soát Doanh Thu Thanh Toán Chưa Lập Hóa Đơn
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Theo quy định Thông tư 78 và Nghị định 123, toàn bộ đơn hàng thanh toán thành công phải được xuất hóa đơn điện tử trong ngày.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2">
            <p>
              • Số giao dịch thanh toán chưa có hóa đơn:{' '}
              <strong className="text-slate-900 font-mono">
                {uninvoicedReport?.count || 0} giao dịch
              </strong>
            </p>
            <p>
              • Tổng giá trị chưa xuất:{' '}
              <strong className="text-emerald-700 font-mono text-sm">
                {formatVND(uninvoicedReport?.totalAmount || 0)}
              </strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
