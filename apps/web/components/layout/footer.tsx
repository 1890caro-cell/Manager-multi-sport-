import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-20 border-t border-slate-800 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-lg">
                S
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                SPORTS COMPLEX
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tổ hợp Thể thao & Esports chuẩn quốc tế. Hệ thống đặt sân bóng đá, cầu lông, pickleball, tennis, phòng gym hiện đại và khu gaming cao cấp.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Thanh toán bảo mật VietQR & Hóa đơn VAT</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Dịch vụ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/booking" className="hover:text-white transition-colors">
                  Đặt sân thể thao theo giờ
                </Link>
              </li>
              <li>
                <Link href="/gym" className="hover:text-white transition-colors">
                  Gói thẻ hội viên Gym
                </Link>
              </li>
              <li>
                <Link href="/pt-classes" className="hover:text-white transition-colors">
                  Thuê HLV cá nhân (PT) & Lớp nhóm
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-white transition-colors">
                  Giải đấu thể thao & Esports
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-white transition-colors">
                  Ví nạp tiền nội bộ
                </Link>
              </li>
            </ul>
          </div>

          {/* Policy & Support */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Hỗ trợ & Chính sách
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/my-bookings" className="hover:text-white transition-colors">
                  Tra cứu & Hủy lượt đặt sân
                </Link>
              </li>
              <li>
                <Link href="/invoices" className="hover:text-white transition-colors">
                  Tra cứu hóa đơn điện tử
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Chính sách bảo mật & Quyền riêng tư
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Quy định hoàn cọc & hủy giờ tập</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-2.5 text-xs">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Thông tin liên hệ
            </h4>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Khu liên hợp Thể thao & Esports công nghệ cao, TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>06:00 - 22:00 (Mở cửa tất cả các ngày)</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Hotline: 1900 8888 (Hỗ trợ 24/7)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>support@sportscomplex.vn</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 Sports Complex Management System. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Tuân thủ nghiêm ngặt Luật An toàn thông tin & Kế toán Việt Nam.</p>
        </div>
      </div>
    </footer>
  );
}
