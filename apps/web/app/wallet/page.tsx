'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Building2,
  Loader2,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { api, getStoredToken, getStoredUser } from '@/lib/api';
import { formatVND, formatDateTime, generateIdempotencyKey } from '@/lib/utils';
import { QrCodeDisplay } from '@/components/qr-code';

interface WalletData {
  totalBalance: number;
  courtBalance: number;
  gamingBalance: number;
  canteenBalance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'HOLD' | 'RELEASE';
  amount: number;
  balanceAfter: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000];

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData>({
    totalBalance: 0,
    courtBalance: 0,
    gamingBalance: 0,
    canteenBalance: 0,
    currency: 'VND',
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Topup Modal
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(200000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [topupStep, setTopupStep] = useState<'SELECT' | 'VIETQR'>('SELECT');
  const [topupCopiedField, setTopupCopiedField] = useState<string | null>(null);
  const [submittingTopup, setSubmittingTopup] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  const user = getStoredUser();

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      if (!token) {
        router.push('/login?redirect=/wallet');
        return;
      }

      const [wRes, txRes] = await Promise.allSettled([
        api.wallet.getBalance(),
        api.wallet.getTransactions(),
      ]);

      if (wRes.status === 'fulfilled' && wRes.value) {
        setWallet({
          totalBalance: wRes.value.balance || wRes.value.totalBalance || 0,
          courtBalance: wRes.value.courtBalance || 0,
          gamingBalance: wRes.value.gamingBalance || 0,
          canteenBalance: wRes.value.canteenBalance || 0,
          currency: 'VND',
        });
      }

      if (txRes.status === 'fulfilled' && Array.isArray(txRes.value)) {
        setTransactions(txRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setTopupCopiedField(field);
    setTimeout(() => setTopupCopiedField(null), 2000);
  };

  const handleProceedTopup = async () => {
    const finalAmount = customAmount ? parseInt(customAmount, 10) : topupAmount;
    if (isNaN(finalAmount) || finalAmount < 10000) {
      alert('Số tiền nạp tối thiểu là 10.000 VNĐ');
      return;
    }

    try {
      setSubmittingTopup(true);
      const idempotencyKey = generateIdempotencyKey('topup');
      await api.wallet.topup(finalAmount, idempotencyKey);
      setTopupStep('VIETQR');
    } catch {
      // Proceed to show QR for bank transfer anyway
      setTopupStep('VIETQR');
    } finally {
      setSubmittingTopup(false);
    }
  };

  const handleConfirmPaid = () => {
    setTopupSuccess('Đã gửi yêu cầu nạp tiền. Hệ thống sẽ tự động cập nhật ngay khi nhận được biến động số dư!');
    setTopupModalOpen(false);
    setTopupStep('SELECT');
    fetchWalletData();
    setTimeout(() => setTopupSuccess(null), 6000);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : topupAmount;
  const transferContent = `NAP ${user?.phone || 'VI' + (user?.id ? user.id.slice(-6) : '8888')}`;
  const bankAcc = '0987654321';
  const bankName = 'MBBank (Ngân hàng Quân Đội)';
  const vietQrPayload = `00020101021238540010A000000727012400069704220110${bankAcc}0208QRIBFTTA5303704540${finalAmount}5802VN62${transferContent.length.toString().padStart(2, '0')}${transferContent}6304`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ví Điện Tử Nội Bộ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý số dư thể thao, máy trạm gaming và canteen với sổ cái kế toán kép minh bạch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchWalletData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
          <button
            onClick={() => {
              setTopupStep('SELECT');
              setTopupModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nạp tiền vào ví
          </button>
        </div>
      </div>

      {topupSuccess && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{topupSuccess}</span>
        </div>
      )}

      {/* Wallet Balance Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Balance */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Tổng Số Dư Khả Dụng
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">Double-Entry Ledger</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white mt-1">
              {formatVND(wallet.totalBalance)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Sử dụng thanh toán tức thì mọi dịch vụ trong tổ hợp thể thao
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                setTopupStep('SELECT');
                setTopupModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Nạp tiền VietQR 24/7 <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-balances */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sân Thể Thao & PT
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
              {formatVND(wallet.courtBalance || wallet.totalBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Bóng đá, cầu lông, pickleball, gym</p>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit mt-3">
            Khấu trừ tự động
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Gaming & Canteen
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
              {formatVND(wallet.gamingBalance + wallet.canteenBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Nạp giờ máy trạm & order đồ ăn</p>
          </div>
          <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md inline-block w-fit mt-3">
            Liên kết POS quầy
          </span>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Lịch Sử Biến Động Số Dư</h2>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'TOPUP', label: 'Nạp tiền' },
              { key: 'PAYMENT', label: 'Thanh toán' },
              { key: 'REFUND', label: 'Hoàn tiền' },
              { key: 'HOLD', label: 'Tạm giữ' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  filterType === f.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Chưa có giao dịch nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nạp tiền vào ví ngay bằng VietQR để đặt sân và trải nghiệm dịch vụ nhanh chóng không cần
              chờ đợi!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.type === 'TOPUP' || tx.type === 'REFUND';

                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'TOPUP'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.type === 'REFUND'
                            ? 'bg-blue-100 text-blue-700'
                            : tx.type === 'HOLD'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tx.type === 'TOPUP' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : tx.type === 'REFUND' ? (
                          <RotateCcw className="w-5 h-5" />
                        ) : tx.type === 'HOLD' ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900">{tx.description}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(tx.createdAt)} • Mã GD: #{tx.id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm font-extrabold font-mono ${
                          isPositive ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatVND(Math.abs(tx.amount))}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Số dư sau GD: {formatVND(tx.balanceAfter)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Topup Modal */}
      {topupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Nạp Tiền Vào Ví Nội Bộ
              </h3>
              <button
                onClick={() => setTopupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {topupStep === 'SELECT' ? (
              <div className="py-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Chọn mệnh giá nạp nhanh
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setTopupAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all ${
                          topupAmount === amt && !customAmount
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {formatVND(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hoặc nhập số tiền khác (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    placeholder="Tối thiểu 10.000 VNĐ"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <p>• Số tiền sẽ được cộng ngay lập tức sau khi hệ thống ngân hàng xác nhận giao dịch.</p>
                  <p>• Hỗ trợ quét mã QR bằng tất cả ứng dụng ngân hàng và ví điện tử MoMo/ZaloPay.</p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTopupModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedTopup}
                    disabled={submittingTopup}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    {submittingTopup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Tiếp tục quét mã VietQR
                  </button>
                </div>
              </div>
            ) : (
              /* VietQR Display Step */
              <div className="py-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Mã VietQR Chuyển Khoản Tự Động
                </span>

                <div className="my-4">
                  <QrCodeDisplay
                    value={vietQrPayload}
                    size={200}
                    label={`Chuyển đúng: ${formatVND(finalAmount)}`}
                    sublabel="Ngân hàng Quân Đội (MBBank)"
                    showCopy={false}
                  />
                </div>

                {/* Account Details with Copy Buttons */}
                <div className="space-y-2 text-left bg-slate-50 p-3 rounded-2xl text-xs text-slate-700 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold">{bankName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{bankAcc}</span>
                      <button
                        onClick={() => handleCopy(bankAcc, 'acc')}
                        className="text-slate-400 hover:text-emerald-600"
                      >
                        {topupCopiedField === 'acc' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                        {transferContent}
                      </span>
                      <button
                        onClick={() => handleCopy(transferContent, 'content')}
                        className="text-slate-400 hover:text-emerald-600"
                      >
                        {topupCopiedField === 'content' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTopupStep('SELECT')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    ← Chọn lại số tiền
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPaid}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                  >
                    Tôi đã chuyển khoản xong
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
