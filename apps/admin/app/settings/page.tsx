'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Save,
  Clock,
  DollarSign,
  Cpu,
  Users,
  Bell,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Edit2,
  FileText,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND } from '@/lib/utils';

interface SettingItem {
  key: string;
  label: string;
  description: string;
  category: 'booking' | 'gym' | 'gaming' | 'wallet' | 'invoice' | 'system';
  type: 'number' | 'boolean' | 'string' | 'currency' | 'select';
  options?: { value: string; label: string }[];
  defaultValue: any;
}

const SETTING_DEFINITIONS: SettingItem[] = [
  // Booking
  {
    key: 'booking.slotMinutes',
    label: 'Thời lượng mỗi slot đặt sân',
    description: 'Khoảng thời gian chuẩn của một slot đặt sân (phút)',
    category: 'booking',
    type: 'number',
    defaultValue: 30,
  },
  {
    key: 'booking.holdMinutes',
    label: 'Thời gian giữ chỗ thanh toán',
    description: 'Thời gian khóa slot tạm thời để khách quét mã thanh toán (phút)',
    category: 'booking',
    type: 'number',
    defaultValue: 10,
  },
  {
    key: 'booking.depositPercent',
    label: 'Tỷ lệ cọc tối thiểu',
    description: 'Tỷ lệ phần trăm cọc khi giữ sân trực tuyến (%)',
    category: 'booking',
    type: 'number',
    defaultValue: 30,
  },
  {
    key: 'booking.maxAdvanceDays',
    label: 'Số ngày mở đặt trước',
    description: 'Khách hàng có thể đặt sân trước tối đa bao nhiêu ngày',
    category: 'booking',
    type: 'number',
    defaultValue: 14,
  },
  {
    key: 'booking.allowOverlapCheck',
    label: 'Khóa kiểm tra trùng slot 3 lớp',
    description: 'Bật cơ chế Redis slot bit + MongoDB Unique Compound Index',
    category: 'booking',
    type: 'boolean',
    defaultValue: true,
  },

  // Gym
  {
    key: 'gym.capacity',
    label: 'Sức chứa trần phòng Gym',
    description: 'Số người tối đa trong phòng tập đồng thời (Cổng Flap Barrier tự khóa khi chạm ngưỡng)',
    category: 'gym',
    type: 'number',
    defaultValue: 100,
  },
  {
    key: 'gym.dailyTicketPrice',
    label: 'Giá vé tập ngày (VND)',
    description: 'Đơn giá vé ngày vãng lai chưa VAT',
    category: 'gym',
    type: 'currency',
    defaultValue: 60000,
  },
  {
    key: 'gym.dynamicQrTtlSeconds',
    label: 'Hiệu lực mã Dynamic QR TOTP',
    description: 'Chu kỳ làm mới mã QR chống chụp màn hình chia sẻ (giây)',
    category: 'gym',
    type: 'number',
    defaultValue: 30,
  },

  // Gaming
  {
    key: 'gaming.prepayEnabled',
    label: 'Bắt buộc trả trước nạp tài khoản',
    description: 'Máy trạm chỉ mở khi tài khoản có số dư lớn hơn 0',
    category: 'gaming',
    type: 'boolean',
    defaultValue: true,
  },
  {
    key: 'gaming.defaultHourlyRate',
    label: 'Giá giờ sảnh Thường (VND)',
    description: 'Đơn giá giờ chơi sảnh Standard (VND/giờ)',
    category: 'gaming',
    type: 'currency',
    defaultValue: 15000,
  },
  {
    key: 'gaming.vipHourlyRate',
    label: 'Giá giờ sảnh VIP 240Hz (VND)',
    description: 'Đơn giá giờ chơi khu vực máy thi đấu VIP (VND/giờ)',
    category: 'gaming',
    type: 'currency',
    defaultValue: 25000,
  },

  // Wallet
  {
    key: 'wallet.minTopup',
    label: 'Hạn mức nạp ví tối thiểu (VND)',
    description: 'Số tiền tối thiểu cho một lần nạp vào ví nội bộ',
    category: 'wallet',
    type: 'currency',
    defaultValue: 20000,
  },
  {
    key: 'wallet.maxBalance',
    label: 'Hạn mức số dư tối đa (VND)',
    description: 'Giới hạn số dư tối đa ví khách hàng để kiểm soát rủi ro',
    category: 'wallet',
    type: 'currency',
    defaultValue: 50000000,
  },

  // Invoice
  {
    key: 'invoice.vatRate',
    label: 'Thuế suất GTGT áp dụng (%)',
    description: 'Thuế suất VAT tiêu chuẩn tính vào hóa đơn điện tử',
    category: 'invoice',
    type: 'number',
    defaultValue: 8,
  },
  {
    key: 'invoice.provider',
    label: 'Cổng phát hành HĐĐT tích hợp',
    description: 'Nhà cung cấp giải pháp hóa đơn điện tử được kích hoạt',
    category: 'invoice',
    type: 'select',
    options: [
      { value: 'MOCK', label: 'Mock Dev Provider (Nội bộ thử nghiệm)' },
      { value: 'MISA', label: 'MISA meInvoice API' },
      { value: 'VIETTEL', label: 'Viettel Sinvoice API' },
      { value: 'VNPT', label: 'VNPT Invoice API' },
    ],
    defaultValue: 'MOCK',
  },

  // System & Notification
  {
    key: 'notification.znsDailyBudgetVnd',
    label: 'Ngân sách Zalo ZNS ngày (VND)',
    description: 'Hạn mức chi tiêu tin nhắn ZNS mỗi ngày. Vượt ngưỡng sẽ tự động chuyển sang In-App & Email',
    category: 'system',
    type: 'currency',
    defaultValue: 500000,
  },
  {
    key: 'bridge.heartbeatTimeoutSeconds',
    label: 'Ngưỡng cảnh báo mất kết nối IoT Bridge (giây)',
    description: 'Thời gian trễ tối đa giữa các gói tin Heartbeat từ Bridge Agent máy trạm',
    category: 'system',
    type: 'number',
    defaultValue: 60,
  },
];

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [editReason, setEditReason] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.settings.getAll();
      // res might be array of doc or object map
      if (res && typeof res === 'object') {
        if (Array.isArray(res)) {
          const map: Record<string, any> = {};
          res.forEach((item: any) => {
            map[item.key] = item.value;
          });
          setSettingsData(map);
        } else if ((res as any).data && typeof (res as any).data === 'object') {
          setSettingsData((res as any).data);
        } else {
          setSettingsData(res as Record<string, any>);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch settings from API, using defaults:', err.message);
      // Fallback defaults
      const defaults: Record<string, any> = {};
      SETTING_DEFINITIONS.forEach((s) => {
        defaults[s.key] = s.defaultValue;
      });
      setSettingsData(defaults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openEditModal = (item: SettingItem) => {
    setEditingItem(item);
    const currentValue = settingsData[item.key] !== undefined ? settingsData[item.key] : item.defaultValue;
    setEditValue(currentValue);
    setEditReason('');
    setAlert(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editReason.trim()) {
      setAlert({
        type: 'error',
        message: 'Bắt buộc phải nhập lý do thay đổi để lưu vết vào Audit Chain (SPEC 8.2)',
      });
      return;
    }

    try {
      setSaving(true);
      let parsedValue = editValue;
      if (editingItem.type === 'number' || editingItem.type === 'currency') {
        parsedValue = Number(editValue);
        if (isNaN(parsedValue)) {
          throw new Error('Giá trị phải là chữ số hợp lệ');
        }
      } else if (editingItem.type === 'boolean') {
        parsedValue = editValue === true || editValue === 'true';
      }

      await api.settings.update(editingItem.key, parsedValue, editReason.trim());
      setSettingsData((prev) => ({
        ...prev,
        [editingItem.key]: parsedValue,
      }));
      setAlert({
        type: 'success',
        message: `Đã cập nhật cấu hình [${editingItem.label}] và ghi nhận vào Audit Log SHA-256.`,
      });
      setEditingItem(null);
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Lỗi khi lưu cấu hình',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = SETTING_DEFINITIONS.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory,
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cấu hình hệ thống trung tâm
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Quản trị thông số vận hành động (SPEC Appendix C). Mọi thay đổi đều kích hoạt Audit Log SHA-256.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      )}

      {/* Categories Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {[
          { id: 'all', label: 'Tất cả thông số', icon: Sliders },
          { id: 'booking', label: 'Đặt sân & Thể thao', icon: Clock },
          { id: 'gym', label: 'Phòng Gym & Cổng Flap', icon: Users },
          { id: 'gaming', label: 'Cyber Gaming', icon: Cpu },
          { id: 'wallet', label: 'Ví & Tài chính', icon: DollarSign },
          { id: 'invoice', label: 'Hóa đơn & VAT', icon: Receipt },
          { id: 'system', label: 'Thông báo & IoT Bridge', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Invariants & Security Notice Banner */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Nguyên tắc bảo vệ dữ liệu (SPEC 00-invariants.md)</p>
          <p className="text-muted-foreground mt-0.5">
            Các thay đổi giá trị sẽ được áp dụng ngay lập tức vào Memory Cache của NestJS API và lưu vĩnh viễn vào MongoDB. 
            Mọi thao tác bắt buộc ghi kèm lý do vào <span className="text-primary font-medium">Bảo chứng SHA-256 Hash Chain</span> và chỉ tài khoản quyền <span className="text-primary font-medium">ADMIN</span> mới được phép thực thi.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => {
          const val = settingsData[item.key] !== undefined ? settingsData[item.key] : item.defaultValue;
          let displayVal = String(val);

          if (item.type === 'currency') {
            displayVal = formatVND(Number(val));
          } else if (item.type === 'boolean') {
            displayVal = val ? 'BẬT (Enabled)' : 'TẮT (Disabled)';
          } else if (item.type === 'select') {
            const opt = item.options?.find((o) => o.value === val);
            displayVal = opt ? opt.label : String(val);
          }

          return (
            <div
              key={item.key}
              className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">{item.label}</h3>
                    <code className="text-xs text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {item.key}
                    </code>
                  </div>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 text-xs font-medium border border-border/40"
                    title="Chỉnh sửa giá trị"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Giá trị hiện tại:
                </span>
                <span
                  className={`text-sm font-bold ${
                    item.type === 'boolean'
                      ? val
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                      : 'text-primary'
                  }`}
                >
                  {displayVal}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Setting Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Cập nhật cấu hình hệ thống</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Tên cấu hình</label>
                <p className="font-semibold text-foreground text-sm">{editingItem.label}</p>
                <code className="text-xs text-muted-foreground font-mono">{editingItem.key}</code>
              </div>

              {/* Input for Value */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Giá trị mới ({editingItem.type}):
                </label>
                {editingItem.type === 'boolean' ? (
                  <select
                    value={String(editValue)}
                    onChange={(e) => setEditValue(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="true">BẬT (True / Enabled)</option>
                    <option value="false">TẮT (False / Disabled)</option>
                  </select>
                ) : editingItem.type === 'select' ? (
                  <select
                    value={String(editValue)}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {editingItem.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={editingItem.type === 'string' ? 'text' : 'number'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                )}
                {editingItem.type === 'currency' && !isNaN(Number(editValue)) && (
                  <p className="text-xs text-primary font-medium">
                    Quy đổi: {formatVND(Number(editValue))}
                  </p>
                )}
              </div>

              {/* Mandatory Reason */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Lý do thay đổi (Bắt buộc ghi vào Audit Chain):
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ví dụ: Điều chỉnh giá giờ cao điểm theo quyết định BGĐ số 12/2026..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Xác nhận lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
