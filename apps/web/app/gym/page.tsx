'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Users,
  ShieldCheck,
  Sparkles,
  QrCode,
  CheckCircle2,
  Clock,
  Calendar,
  Zap,
  Flame,
  AlertTriangle,
  Loader2,
  CreditCard,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { api, getStoredToken } from '@/lib/api';
import { formatVND, formatDateOnly, generateIdempotencyKey } from '@/lib/utils';
import { QrCodeDisplay } from '@/components/qr-code';

interface GymPackage {
  id: string;
  code: string;
  name: string;
  durationMonths: number;
  price: number;
  benefits: string[];
  popular?: boolean;
}

interface GymMembership {
  id: string;
  packageCode: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN';
  remainingDays: number;
}

const DEFAULT_PACKAGES: GymPackage[] = [
  {
    id: 'pkg-1m',
    code: 'GYM_1M',
    name: 'Gói Cơ Bản 1 Tháng',
    durationMonths: 1,
    price: 450000,
    benefits: [
      'Không giới hạn lượt tập trong tháng',
      'Sử dụng toàn bộ khu vực tạ & cardio máy chạy',
      'Cổng QR thông minh ra vào tự động 06:00 - 22:00',
      'Tủ đồ cá nhân thông minh theo phiên',
    ],
  },
  {
    id: 'pkg-3m',
    code: 'GYM_3M',
    name: 'Gói Nâng Cao 3 Tháng',
    durationMonths: 3,
    price: 1200000,
    popular: true,
    benefits: [
      'Tiết kiệm 15% so với gói tháng',
      'Tặng 1 buổi định hướng InBody & hướng dẫn HLV',
      'Sử dụng phòng tắm nước nóng & phòng xông khô Sauna',
      'Quyền ưu tiên đặt tủ locker cố định',
      'Được bảo lưu thẻ 1 lần (tối đa 15 ngày)',
    ],
  },
  {
    id: 'pkg-6m',
    code: 'GYM_6M',
    name: 'Gói Chuyên Nghiệp 6 Tháng',
    durationMonths: 6,
    price: 2150000,
    benefits: [
      'Tiết kiệm 20% so với gói tháng',
      'Tặng 2 buổi PT 1-1 cá nhân hóa lộ trình tập',
      'Miễn phí mượn khăn tập cao cấp mỗi ngày',
      'Truy cập khu vực phục hồi cơ bắp & Jacuzzi',
      'Bảo lưu thẻ 2 lần (tổng tối đa 30 ngày)',
    ],
  },
  {
    id: 'pkg-12m',
    code: 'GYM_12M',
    name: 'Gói Kim Cương VIP 1 Năm',
    durationMonths: 12,
    price: 3800000,
    benefits: [
      'Ưu đãi lớn nhất - Tiết kiệm tới 30%',
      'Tặng 5 buổi PT 1-1 kèm kiểm tra InBody hàng tuần',
      'Gói quà tặng VIP: Bình nước thể thao + Áo đấu độc quyền',
      'Được dẫn 1 người bạn trải nghiệm miễn phí mỗi tháng',
      'Bảo lưu thẻ linh hoạt tới 60 ngày',
    ],
  },
];

export default function GymPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<GymPackage[]>(DEFAULT_PACKAGES);
  const [activeMembership, setActiveMembership] = useState<GymMembership | null>(null);
  const [capacity, setCapacity] = useState<{ current: number; max: number; percentage: number }>({
    current: 42,
    max: 100,
    percentage: 42,
  });
  const [loading, setLoading] = useState(true);

  // Dynamic QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [dynamicQrCode, setDynamicQrCode] = useState<string>('');
  const [qrCountdown, setQrCountdown] = useState<number>(30);

  // Purchase Modal
  const [selectedPackage, setSelectedPackage] = useState<GymPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'VIETQR'>('WALLET');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch capacity
      try {
        const cap = await api.gym.getCapacity();
        if (cap && typeof cap.current === 'number') {
          const max = cap.max || 100;
          setCapacity({
            current: cap.current,
            max,
            percentage: Math.min(100, Math.round((cap.current / max) * 100)),
          });
        }
      } catch {
        // Fallback demo capacity
      }

      // Fetch packages
      try {
        const pkgs = await api.gym.getPackages();
        if (Array.isArray(pkgs) && pkgs.length > 0) {
          setPackages(pkgs);
        }
      } catch {
        // Fallback default packages
      }

      // Fetch user membership if logged in
      const token = getStoredToken();
      if (token) {
        try {
          const memberships = await api.gym.getMyMemberships();
          if (Array.isArray(memberships) && memberships.length > 0) {
            const active = memberships.find((m) => m.status === 'ACTIVE') || memberships[0];
            setActiveMembership(active);
          }
        } catch {
          // No active membership
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamic QR countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (qrModalOpen && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown((prev) => prev - 1);
      }, 1000);
    } else if (qrModalOpen && qrCountdown === 0) {
      // Refresh dynamic QR code
      refreshDynamicQr();
    }
    return () => clearInterval(timer);
  }, [qrModalOpen, qrCountdown]);

  const refreshDynamicQr = async () => {
    if (!activeMembership) return;
    try {
      const res = await api.gym.getDynamicQr(activeMembership.id);
      setDynamicQrCode(
        res.qrToken ||
          res.code ||
          `GYM:${activeMembership.id}:${Date.now().toString(36).toUpperCase()}`,
      );
      setQrCountdown(30);
    } catch {
      // Offline fallback token
      setDynamicQrCode(
        `GYM:${activeMembership.id}:${Date.now().toString(36).toUpperCase()}`,
      );
      setQrCountdown(30);
    }
  };

  const handleOpenQrModal = () => {
    refreshDynamicQr();
    setQrModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    const token = getStoredToken();
    if (!token) {
      router.push('/login?redirect=/gym');
      return;
    }

    try {
      setPurchasing(true);
      const idempotencyKey = generateIdempotencyKey('gym-purchase');
      const res = await api.gym.purchase({
        packageCode: selectedPackage.code,
        paymentMethod,
        idempotencyKey,
      });

      setPurchaseSuccess(`Đăng ký thành công ${selectedPackage.name}!`);
      setSelectedPackage(null);
      fetchData();
      setTimeout(() => setPurchaseSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi kích hoạt gói tập');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Capacity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> Trung Tâm Fitness &
            Thể Hình Cao Cấp
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Gym & Fitness Thông Minh
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Không gian tập luyện chuẩn quốc tế, kiểm soát vào ra Turnstile tự động bằng Dynamic QR
          </p>
        </div>

        {/* Live Capacity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm min-w-[280px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> Sức chứa hiện tại:
            </span>
            <span className="font-mono font-extrabold text-slate-900">
              {capacity.current} / {capacity.max} người
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacity.percentage > 85
                  ? 'bg-rose-500'
                  : capacity.percentage > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${capacity.percentage}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>
              {capacity.percentage > 85
                ? 'Đang rất đông'
                : capacity.percentage > 70
                ? 'Khá đông'
                : 'Không gian lý tưởng để tập'}
            </span>
            <span className="text-emerald-700 font-bold">{capacity.percentage}%</span>
          </p>
        </div>
      </div>

      {purchaseSuccess && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{purchaseSuccess}</span>
        </div>
      )}

      {/* Active Membership Banner (If user has active package) */}
      {activeMembership && (
        <div className="mt-8 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Gói Tập Đang Kích Hoạt
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {activeMembership.packageName || 'Thẻ Hội Viên Gym'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Hiệu lực:{' '}
                  <strong className="text-white">
                    {formatDateOnly(activeMembership.startDate)} -{' '}
                    {formatDateOnly(activeMembership.endDate)}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Còn lại:{' '}
                  <strong className="text-emerald-400 font-mono text-sm">
                    {activeMembership.remainingDays || 30} ngày
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleOpenQrModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl shadow-lg transition-all hover:scale-[1.02]"
              >
                <QrCode className="w-5 h-5 text-slate-950" />
                Mã QR Vào Phòng Tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      <div className="mt-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chọn Gói Tập Thể Hình & Fitness
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Không phí ẩn. Trải nghiệm tự do toàn bộ máy móc thế hệ mới Technogym & LifeFitness
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-sm hover:shadow-md ${
                pkg.popular
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 relative'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-sm tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Phổ Biến Nhất
                  </span>
                )}

                <div className="text-center pb-5 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-lg">{pkg.name}</h3>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                      {formatVND(pkg.price)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Thời hạn {pkg.durationMonths} tháng
                  </p>
                </div>

                <ul className="mt-6 space-y-3">
                  {pkg.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    pkg.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Đăng ký ngay <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic QR Modal */}
      {qrModalOpen && activeMembership && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Dynamic QR Code
              </span>
              <button
                onClick={() => setQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">Mã Vào Cổng Turnstile</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động làm mới mỗi 30 giây để chống gian lận thẻ
            </p>

            <div className="my-5">
              <QrCodeDisplay
                value={dynamicQrCode}
                label="Đặt mã trước camera máy quét tại cửa vào"
                sublabel={`Hội viên: ${activeMembership.packageName}`}
                expiresInSeconds={qrCountdown}
                onRefresh={refreshDynamicQr}
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Cơ chế chống quay vòng (Anti-Passback):
              </p>
              <p>• Mã chỉ mở cổng cho 1 người/lượt. Không chụp ảnh màn hình chuyển cho người khác.</p>
              <p>• Phải quét mã ra (Exit Turnstile) trước khi có thể quét vào tiếp theo.</p>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-5 w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Xác nhận đăng ký gói tập</h3>
              <button
                onClick={() => setSelectedPackage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Gói đăng ký:</span>
                <span className="font-bold text-slate-900">{selectedPackage.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Thời hạn:</span>
                <span className="font-semibold text-slate-800">{selectedPackage.durationMonths} tháng</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <span className="text-lg font-extrabold text-emerald-600 font-mono">
                  {formatVND(selectedPackage.price)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('WALLET')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      paymentMethod === 'WALLET'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold">Ví nội bộ</p>
                      <p className="text-[10px] text-slate-400">Khấu trừ ngay</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      paymentMethod === 'VIETQR'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold">VietQR Chuyển khoản</p>
                      <p className="text-[10px] text-slate-400">Quét mã ngân hàng</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                disabled={purchasing}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-2"
              >
                {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Kích hoạt ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
