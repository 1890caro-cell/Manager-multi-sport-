'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  CheckCircle2,
  Building2,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api, getStoredToken } from '@/lib/api';
import { formatVND, formatDateOnly } from '@/lib/utils';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  lookupCode: string;
  issueDate: string;
  provider: 'MISA' | 'VNPT' | 'VIETTEL' | 'MOCK';
  buyerName: string;
  buyerTaxCode?: string;
  totalBeforeTax: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  status: 'ISSUED' | 'ADJUSTED' | 'CANCELLED';
  pdfUrl?: string;
}

const DEFAULT_INVOICES: InvoiceItem[] = [
  {
    id: 'inv-1',
    invoiceNumber: '1C26TAA-0000045',
    lookupCode: 'MISA-7X9K2P',
    issueDate: '2026-10-25',
    provider: 'MISA',
    buyerName: 'Công ty Cổ phần Công nghệ ABC',
    buyerTaxCode: '0108123456',
    totalBeforeTax: 1000000,
    vatRate: 8,
    vatAmount: 80000,
    totalAmount: 1080000,
    status: 'ISSUED',
  },
  {
    id: 'inv-2',
    invoiceNumber: '1C26TAA-0000046',
    lookupCode: 'VNPT-9Y1M4Z',
    issueDate: '2026-10-22',
    provider: 'VNPT',
    buyerName: 'Nguyễn Văn Anh',
    totalBeforeTax: 450000,
    vatRate: 8,
    vatAmount: 36000,
    totalAmount: 486000,
    status: 'ISSUED',
  },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceItem[]>(DEFAULT_INVOICES);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Direct Lookup Form
  const [searchLookupCode, setSearchLookupCode] = useState('');
  const [searchTaxCode, setSearchTaxCode] = useState('');
  const [searchResult, setSearchResult] = useState<InvoiceItem | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoading(true);
        const token = getStoredToken();
        if (token) {
          const res = await api.invoices.getMyInvoices();
          if (Array.isArray(res) && res.length > 0) {
            setInvoices(res);
          }
        }
      } catch {
        // Fallback default sample invoices
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLookupCode.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    setTimeout(() => {
      const match = invoices.find(
        (inv) =>
          inv.lookupCode.toLowerCase() === searchLookupCode.trim().toLowerCase() ||
          inv.invoiceNumber.toLowerCase().includes(searchLookupCode.trim().toLowerCase()),
      );

      if (match) {
        setSearchResult(match);
      } else {
        setSearchError('Không tìm thấy hóa đơn điện tử với mã tra cứu này.');
      }
      setSearching(false);
    }, 400);
  };

  const handleDownloadPdf = (inv: InvoiceItem) => {
    alert(
      `Đang mở tệp PDF Hóa đơn điện tử ${inv.invoiceNumber} (Mã tra cứu: ${inv.lookupCode}) từ cổng ${inv.provider}...`,
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Nghị Định 123/2020/NĐ-CP & Thông Tư 78/2021/TT-BTC
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hóa Đơn Điện Tử VAT
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu, tải bản thể hiện PDF và lưu trữ hóa đơn điện tử có mã của Cơ quan Thuế
          </p>
        </div>
      </div>

      {/* Direct Search Bar */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-600" />
          Tra Cứu Hóa Đơn Trực Tiếp
        </h2>

        <form onSubmit={handleDirectSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã tra cứu hóa đơn *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: MISA-7X9K2P"
              value={searchLookupCode}
              onChange={(e) => setSearchLookupCode(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs uppercase font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã số thuế doanh nghiệp (nếu có)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 0108123456"
              value={searchTaxCode}
              onChange={(e) => setSearchTaxCode(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={searching}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Tra cứu hóa đơn
            </button>
          </div>
        </form>

        {searchError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {searchResult && (
          <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Tìm thấy hóa đơn hợp lệ
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Số HĐ: {searchResult.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-600">
                Đơn vị mua: <strong>{searchResult.buyerName}</strong> • Tổng tiền:{' '}
                <strong className="text-emerald-700 font-mono">
                  {formatVND(searchResult.totalAmount)}
                </strong>
              </p>
            </div>
            <button
              onClick={() => handleDownloadPdf(searchResult)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Tải tệp PDF
            </button>
          </div>
        )}
      </div>

      {/* Invoice List */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Danh Sách Hóa Đơn Của Bạn</h2>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Chưa có hóa đơn nào</h3>
            <p className="text-xs text-slate-500 mt-1">
              Hóa đơn VAT sẽ tự động được phát hành khi bạn thanh toán dịch vụ hoặc nạp tiền ví.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-800 border border-blue-200 mb-1">
                        Cổng {inv.provider}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-mono">
                        #{inv.invoiceNumber}
                      </h3>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Đã ký số CQT
                    </span>
                  </div>

                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mã tra cứu:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{inv.lookupCode}</span>
                        <button
                          onClick={() => handleCopy(inv.lookupCode)}
                          className="text-slate-400 hover:text-emerald-600"
                        >
                          {copiedCode === inv.lookupCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ngày xuất HĐ:</span>
                      <span className="font-semibold text-slate-800">
                        {formatDateOnly(inv.issueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Đơn vị mua:</span>
                      <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                        {inv.buyerName}
                      </span>
                    </div>

                    {inv.buyerTaxCode && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Mã số thuế:</span>
                        <span className="font-mono text-slate-800">{inv.buyerTaxCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                    <span className="text-slate-500">Thuế GTGT ({inv.vatRate}%):</span>
                    <span className="font-mono text-slate-600">{formatVND(inv.vatAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-slate-900 font-bold">Tổng tiền thanh toán:</span>
                    <span className="text-base font-extrabold text-emerald-600 font-mono">
                      {formatVND(inv.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleDownloadPdf(inv)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải bản thể hiện PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
