'use client';

import React, { useEffect, useState } from 'react';
import {
  Dumbbell,
  Users,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  PlusCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateOnly, formatDateTime, formatVND } from '@/lib/utils';

export default function AdminGymPage() {
  const [capacity, setCapacity] = useState({ current: 42, max: 100 });
  const [memberships, setMemberships] = useState<any[]>([]);
  const [accessEvents, setAccessEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Assign RFID Modal
  const [rfidModal, setRfidModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [rfidCode, setRfidCode] = useState('');
  const [assigningRfid, setAssigningRfid] = useState(false);

  // Reset Capacity Modal
  const [resetModal, setResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('Đóng cửa cuối ca kiểm tra thực tế');
  const [resetting, setResetting] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [capRes, memRes, evtRes] = await Promise.allSettled([
        api.gym.getCapacity(),
        api.gym.getMemberships({ search: searchQuery }),
        api.gym.getAccessEvents(),
      ]);

      if (capRes.status === 'fulfilled' && capRes.value) {
        setCapacity({
          current: capRes.value.current ?? 42,
          max: capRes.value.max ?? 100,
        });
      }
      if (memRes.status === 'fulfilled' && Array.isArray(memRes.value)) {
        setMemberships(memRes.value);
      }
      if (evtRes.status === 'fulfilled' && Array.isArray(evtRes.value)) {
        setAccessEvents(evtRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleResetCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResetting(true);
      await api.gym.resetCapacity(resetReason);
      showToast('Đã đặt lại bộ đếm sức chứa phòng gym về 0!');
      setResetModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi reset sức chứa');
    } finally {
      setResetting(false);
    }
  };

  const handleAssignRfid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      setAssigningRfid(true);
      await api.gym.assignRfid(selectedMember.id, rfidCode);
      showToast(`Đã gán thẻ RFID "${rfidCode}" cho hội viên ${selectedMember.customerName || selectedMember.id}!`);
      setRfidModal(false);
      setRfidCode('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gán thẻ RFID');
    } finally {
      setAssigningRfid(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Phòng Gym & Kiểm Soát Vào Ra Turnstile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Giám sát sức chứa thời gian thực (giới hạn 100 người), gán thẻ RFID và nhật ký cửa xoay
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Đặt lại bộ đếm sức chứa
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Realtime Capacity Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Công suất phòng Gym hiện tại
            </span>
            <div className="text-3xl font-black text-slate-900 font-mono mt-0.5">
              {capacity.current} / {capacity.max} người
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quy tắc Anti-Passback tự động ngăn chặn chia sẻ mã QR / quẹt thẻ liên tiếp
            </p>
          </div>
        </div>

        <div className="w-full md:w-72 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600">Tỷ lệ sử dụng</span>
            <span className="text-emerald-700">
              {Math.round((capacity.current / capacity.max) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                capacity.current > 85 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${(capacity.current / capacity.max) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Memberships & Turnstile Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Memberships Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Danh Sách Hội Viên Phòng Gym
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo SĐT, Họ tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Mã Thẻ</th>
                    <th className="px-4 py-3">Hội Viên</th>
                    <th className="px-4 py-3">Gói Tập</th>
                    <th className="px-4 py-3">Hạn Dùng</th>
                    <th className="px-4 py-3">Mã Thẻ RFID</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {memberships.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        #{m.membershipCode || m.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800">{m.customerName || 'Hội viên'}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {m.customerPhone || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {m.packageName || m.packageCode || 'Gói Gym'}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono">
                        {formatDateOnly(m.startDate)} - {formatDateOnly(m.endDate)}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {m.rfidCardId ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {m.rfidCardId}
                          </span>
                        ) : (
                          <span className="text-slate-400">Chưa gán</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setRfidCode(m.rfidCardId || '');
                            setRfidModal(true);
                          }}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold"
                        >
                          Gán RFID
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Turnstile Access Events Log (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Nhật Ký Quẹt Thẻ / QR Cổng Turnstile
            </h3>

            <div className="space-y-3">
              {accessEvents.slice(0, 7).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          evt.accessType === 'CHECK_IN' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900">
                        {evt.accessType === 'CHECK_IN' ? 'Vào cổng (IN)' : 'Ra cổng (OUT)'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {evt.customerName || evt.membershipCode || 'Hội viên'} • {evt.accessMethod}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-400">
                    {formatDateTime(evt.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Tự động ghi nhận từ Bridge Agent IoT qua kênh sự kiện bảo mật.
          </div>
        </div>
      </div>

      {/* Assign RFID Modal */}
      {rfidModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Gán Thẻ RFID Vật Lý</h3>
              <button
                onClick={() => setRfidModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignRfid} className="py-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Hội viên: <strong className="text-slate-900">{selectedMember.customerName || selectedMember.id}</strong>
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã thẻ RFID (quẹt thẻ trước đầu đọc hoặc nhập mã) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: RFID-GYM-998822"
                  value={rfidCode}
                  onChange={(e) => setRfidCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRfidModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={assigningRfid}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {assigningRfid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận gán thẻ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Capacity Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                Đặt Lại Sức Chứa Gym Về 0
              </h3>
              <button
                onClick={() => setResetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetCapacity} className="py-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Hành động này sẽ giải phóng toàn bộ danh sách hội viên đang ghi nhận trong phòng gym
                trên Redis.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do hiệu chỉnh *
                </label>
                <textarea
                  required
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận đặt lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
