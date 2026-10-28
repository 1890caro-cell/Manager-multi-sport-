'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Building2,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  FileText,
} from 'lucide-react';
import { api, getStoredToken, getStoredUser, removeStoredToken, setStoredUser } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // VAT Invoice Information
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const token = getStoredToken();
        if (!token) {
          router.push('/login?redirect=/profile');
          return;
        }

        const user = (await api.auth.getMe()) || getStoredUser();
        if (user) {
          setFullName(user.fullName || '');
          setPhone(user.phone || '');
          setEmail(user.email || '');
          setEmergencyPhone(user.emergencyPhone || '');

          if (user.invoiceProfile) {
            setCompanyName(user.invoiceProfile.companyName || '');
            setTaxCode(user.invoiceProfile.taxCode || '');
            setCompanyAddress(user.invoiceProfile.companyAddress || '');
            setInvoiceEmail(user.invoiceProfile.invoiceEmail || '');
          }
        }
      } catch {
        const cachedUser = getStoredUser();
        if (cachedUser) {
          setFullName(cachedUser.fullName || '');
          setPhone(cachedUser.phone || '');
          setEmail(cachedUser.email || '');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const updateData = {
        fullName,
        email,
        emergencyPhone,
        invoiceProfile: {
          companyName,
          taxCode,
          companyAddress,
          invoiceEmail: invoiceEmail || email,
        },
      };

      const updated = await api.auth.updateProfile(updateData);
      setStoredUser(updated || updateData);
      setSuccessMsg('Đã cập nhật thông tin cá nhân và hồ sơ hóa đơn VAT thành công!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-xs text-slate-400">Đang tải hồ sơ người dùng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tài Khoản & Hồ Sơ Cá Nhân
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin hội viên, cấu hình xuất hóa đơn đỏ doanh nghiệp và bảo mật
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>

      {successMsg && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="mt-8 space-y-8">
        {/* Personal Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Thông Tin Cơ Bản</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại đăng nhập</label>
              <input
                type="text"
                disabled
                value={phone}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Số điện thoại liên kết tài khoản không thể tự ý thay đổi
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa chỉ Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số điện thoại khẩn cấp / Người thân
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="Dùng khi có sự cố sức khỏe trên sân"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* VAT Invoice Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Thông Tin Xuất Hóa Đơn Điện Tử (VAT)
              </h2>
              <p className="text-xs text-slate-400">
                Lưu sẵn thông tin để hệ thống tự động xuất hóa đơn đỏ doanh nghiệp khi đặt sân
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Tên đơn vị / Doanh nghiệp</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ví dụ: Công ty TNHH Giải Pháp Thể Thao Việt Nam"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã số thuế (MST)</label>
              <input
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="Ví dụ: 0108123456"
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email nhận hóa đơn (nếu khác email cá nhân)
              </label>
              <input
                type="email"
                value={invoiceEmail}
                onChange={(e) => setInvoiceEmail(e.target.value)}
                placeholder="ketoan@doanhnghiep.vn"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Địa chỉ doanh nghiệp theo đăng ký thuế
              </label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Số nhà, đường phố, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi hồ sơ
          </button>
        </div>
      </form>
    </div>
  );
}
