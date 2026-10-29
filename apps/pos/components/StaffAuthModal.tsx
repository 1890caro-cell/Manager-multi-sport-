'use client';

import React, { useState } from 'react';
import { usePOS } from '@/lib/pos-context';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  RefreshCw,
  LogOut,
  ChevronRight,
  UserCheck,
  Key,
} from 'lucide-react';

export const StaffAuthModal: React.FC = () => {
  const { currentUser, isAuthModalOpen, closeAuthModal, switchUser, loginUser } = usePOS();

  const [phoneInput, setPhoneInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleQuickSwitch = async (role: 'CASHIER' | 'MANAGER' | 'ADMIN') => {
    try {
      setLoading(true);
      setError(null);
      await switchUser(role);
      setSuccess(`Đã chuyển sang tài khoản ${role}!`);
      setTimeout(() => {
        setSuccess(null);
        closeAuthModal();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Không thể chuyển đổi tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !pinInput) {
      setError('Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await loginUser(phoneInput, pinInput);
      setSuccess(`Đăng nhập thành công: ${user.fullName} (${user.role})`);
      setTimeout(() => {
        setSuccess(null);
        closeAuthModal();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Số điện thoại hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
            ADMIN / CHỦ CƠ SỞ
          </span>
        );
      case 'MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/30">
            MANAGER / QUẢN LÝ
          </span>
        );
      case 'CASHIER':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            CASHIER / THU NGÂN
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground">
                Phân Quyền & Tài Khoản Thu Ngân
              </h3>
              <p className="text-xs text-muted-foreground">
                Xác thực ca làm việc và phân cấp quyền trên máy POS
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Staff Card */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">
                    {currentUser?.fullName || 'Thu ngân Quầy POS'}
                  </h4>
                  {currentUser && getRoleBadge(currentUser.role)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  SĐT: <span className="font-mono">{currentUser?.phone || '0966666666'}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Đang trực
              </span>
            </div>
          </div>

          {/* Quick Staff Switch Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Chuyển nhanh ca làm việc (Quick Roles Switch)
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={loading || currentUser?.role === 'CASHIER'}
                onClick={() => handleQuickSwitch('CASHIER')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  currentUser?.role === 'CASHIER'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-background hover:bg-muted border-border text-foreground hover:border-border/80'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5 font-bold">
                  💼
                </div>
                <div className="font-bold text-xs">Thu ngân</div>
                <div className="text-[10px] text-muted-foreground font-mono">0966666666</div>
              </button>

              <button
                type="button"
                disabled={loading || currentUser?.role === 'MANAGER'}
                onClick={() => handleQuickSwitch('MANAGER')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  currentUser?.role === 'MANAGER'
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                    : 'bg-background hover:bg-muted border-border text-foreground hover:border-border/80'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1.5 font-bold">
                  👔
                </div>
                <div className="font-bold text-xs">Quản lý</div>
                <div className="text-[10px] text-muted-foreground font-mono">0977777777</div>
              </button>

              <button
                type="button"
                disabled={loading || currentUser?.role === 'ADMIN'}
                onClick={() => handleQuickSwitch('ADMIN')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                    : 'bg-background hover:bg-muted border-border text-foreground hover:border-border/80'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1.5 font-bold">
                  👑
                </div>
                <div className="font-bold text-xs">Admin</div>
                <div className="text-[10px] text-muted-foreground font-mono">0988888888</div>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Custom Staff Login Form */}
          <form onSubmit={handleCustomLogin} className="pt-4 border-t border-border space-y-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Hoặc đăng nhập tài khoản nhân viên khác
            </span>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Số điện thoại..."
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <input
                type="password"
                placeholder="Mật khẩu / PIN..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Key className="w-3.5 h-3.5" />
              )}
              <span>Xác thực đăng nhập</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
