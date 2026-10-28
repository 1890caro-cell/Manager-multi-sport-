'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Dumbbell,
  Users,
  Trophy,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  QrCode,
  Flame,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND } from '@/lib/utils';

export default function HomePage() {
  const [gymCapacity, setGymCapacity] = useState<{ currentInside: number; maxCapacity: number } | null>(null);

  useEffect(() => {
    api.gym.getCapacity()
      .then((data) => setGymCapacity({ currentInside: data.currentInside || 0, maxCapacity: data.maxCapacity || 100 }))
      .catch(() => {});
  }, []);

  const sportCategories = [
    {
      title: 'Bóng đá sân cỏ nhân tạo',
      desc: 'Sân 5 và sân 7 tiêu chuẩn FIFA, cỏ chất lượng cao, dàn đèn LED rực rỡ.',
      badge: 'Bán chạy nhất',
      sportType: 'FOOTBALL',
      color: 'from-emerald-500 to-teal-700',
    },
    {
      title: 'Cầu lông thảm thi đấu',
      desc: 'Sàn gỗ lót thảm PVC chuyên dụng, trần cao 12m chuẩn quốc tế, không chói mắt.',
      badge: 'Đặt nhiều',
      sportType: 'BADMINTON',
      color: 'from-blue-500 to-indigo-700',
    },
    {
      title: 'Pickleball thời thượng',
      desc: 'Bộ môn thể thao bùng nổ, mặt sân sơn chuẩn quốc tế, trang thiết bị đồng bộ.',
      badge: 'Hot Trend',
      sportType: 'PICKLEBALL',
      color: 'from-amber-500 to-orange-700',
    },
    {
      title: 'Quần vợt Tennis',
      desc: 'Mặt sân cứng US Open cao cấp, hệ thống tưới và chiếu sáng ban đêm hoàn hảo.',
      badge: 'Tiêu chuẩn',
      sportType: 'TENNIS',
      color: 'from-purple-500 to-fuchsia-700',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>TỔ HỢP THỂ THAO & ESPORTS HIỆN ĐẠI NHẤT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Nâng tầm phong cách sống <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
              Thể thao & Giải trí đỉnh cao
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Đặt sân thể thao theo thời gian thực không lo trùng lịch, tập Gym với công nghệ nhận diện mã QR tự động, thuê Huấn luyện viên cá nhân và tham gia tranh tài các giải đấu quy mô lớn.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Đặt sân ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/gym"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-colors"
            >
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span>Gói hội viên Gym</span>
            </Link>
          </div>
        </div>

        {/* Real-time Gym Capacity Pill in Hero */}
        {gymCapacity && (
          <div className="mt-8 sm:mt-0 sm:absolute sm:top-10 sm:right-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-xl flex items-center gap-4 max-w-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Tải phòng Gym trực tiếp</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {gymCapacity.currentInside} / {gymCapacity.maxCapacity} <span className="text-xs text-slate-400 font-normal">người</span>
              </div>
              <div className="w-32 h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (gymCapacity.currentInside / gymCapacity.maxCapacity) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick Services Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/booking"
          className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
              Đặt sân thể thao
            </h3>
            <p className="text-xs text-slate-500 mt-1">Giữ chỗ 10p, xem lịch trống 24/7</p>
          </div>
        </Link>

        <Link
          href="/gym"
          className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              Hội viên Gym
            </h3>
            <p className="text-xs text-slate-500 mt-1">Quét mã QR vào cửa xoay tự động</p>
          </div>
        </Link>

        <Link
          href="/pt-classes"
          className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
              Lớp học & HLV PT
            </h3>
            <p className="text-xs text-slate-500 mt-1">Thuê PT 1-1, Yoga, Zumba, HIIT</p>
          </div>
        </Link>

        <Link
          href="/tournaments"
          className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
              Giải đấu thể thao
            </h3>
            <p className="text-xs text-slate-500 mt-1">Tranh tài, xem nhánh đấu trực tiếp</p>
          </div>
        </Link>
      </section>

      {/* Featured Sports Fields */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sân thể thao chất lượng cao
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Hệ thống sân bãi đạt chuẩn thi đấu, hỗ trợ chia sân và ghép sân linh hoạt
            </p>
          </div>
          <Link
            href="/booking"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Xem lịch tất cả sân</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sportCategories.map((item) => (
            <div
              key={item.sportType}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className={`h-28 bg-gradient-to-tr ${item.color} p-4 flex flex-col justify-between text-white relative`}>
                <span className="self-start px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold">
                  {item.badge}
                </span>
                <h3 className="font-extrabold text-base leading-snug drop-shadow-sm">{item.title}</h3>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                <Link
                  href={`/booking?sportType=${item.sportType}`}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Xem giờ trống</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features & Guarantees */}
      <section className="bg-slate-100/80 rounded-3xl p-8 border border-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Chống trùng lịch 3 lớp</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Được bảo vệ bằng cơ chế khóa nguyên tử Redis, khóa lạc quan và chỉ mục MongoDB, đảm bảo không bao giờ bị trùng sân.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Check-in một chạm</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Vé đặt sân và thẻ Gym tích hợp mã QR động, quẹt mở cửa xoay tự động tại quầy và cổng ra vào không cần chờ đợi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Thanh toán minh bạch</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Thanh toán ngân hàng VietQR tự động khớp đơn trong 3 giây. Hỗ trợ ví nội bộ và xuất hóa đơn điện tử VAT đầy đủ.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
