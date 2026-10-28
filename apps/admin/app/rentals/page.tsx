'use client';

import React, { useEffect, useState } from 'react';
import {
  BadgePercent,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateTime, formatDateOnly, generateIdempotencyKey } from '@/lib/utils';

export default function AdminRentalsPage() {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'EQUIPMENT'>('TICKETS');

  // New Rental Ticket Modal
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Return Rental Modal
  const [returnModal, setReturnModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [returnCondition, setReturnCondition] = useState<'GOOD' | 'DAMAGED' | 'LOST'>('GOOD');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqRes, tkRes] = await Promise.allSettled([
        api.rentals.getEquipment(),
        api.rentals.getTickets(),
      ]);

      if (eqRes.status === 'fulfilled' && Array.isArray(eqRes.value)) {
        setEquipmentList(eqRes.value);
        if (!selectedEquipId && eqRes.value.length > 0) {
          setSelectedEquipId(eqRes.value[0].id);
        }
      }
      if (tkRes.status === 'fulfilled' && Array.isArray(tkRes.value)) {
        setTickets(tkRes.value);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingTicket(true);
      const idempotencyKey = generateIdempotencyKey('rental-ticket');
      await api.rentals.createTicket({
        equipmentId: selectedEquipId,
        quantity: parseInt(ticketQuantity, 10),
        customerName,
        customerPhone,
        idempotencyKey,
      });

      showToast(`Đã lập phiếu thuê dụng cụ cho khách ${customerName}!`);
      setNewTicketModal(false);
      setCustomerName('');
      setCustomerPhone('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lập phiếu thuê');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleReturnTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setSubmittingReturn(true);
      await api.rentals.returnTicket(selectedTicket.id, {
        condition: returnCondition,
      });

      showToast(`Đã hoàn tất trả dụng cụ cho phiếu #${selectedTicket.ticketCode || selectedTicket.id.slice(-6)}!`);
      setReturnModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi trả đồ');
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Cho Thuê Dụng Cụ Thể Thao & Bồi Thường
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý dụng cụ (vợt, bóng, giày), tiền đặt cọc và xử lý khấu trừ bồi thường hư hỏng / mất mát
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNewTicketModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Lập phiếu thuê mới
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TICKETS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Phiếu Thuê Đang Hoạt Động ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('EQUIPMENT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'EQUIPMENT'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BadgePercent className="w-3.5 h-3.5" /> Danh Mục Dụng Cụ ({equipmentList.length})
        </button>
      </div>

      {/* Tab 1: Active Rental Tickets */}
      {activeTab === 'TICKETS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Mã Phiếu</th>
                <th className="px-4 py-3">Dụng Cụ</th>
                <th className="px-4 py-3">Khách Thuê</th>
                <th className="px-4 py-3">Thời Điểm Thuê</th>
                <th className="px-4 py-3">Tiền Cọc Đã Thu</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Hiện chưa có phiếu thuê nào đang hoạt động.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      #{t.ticketCode || t.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {t.equipmentName || 'Dụng cụ'} (x{t.quantity})
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{t.customerName}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{t.customerPhone}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {formatDateTime(t.rentedAt || t.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono font-extrabold text-slate-900">
                      {formatVND(t.depositAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'RENTING' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Đang thuê
                        </span>
                      ) : t.status === 'OVERDUE' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Quá hạn
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Đã trả đồ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status === 'RENTING' || t.status === 'OVERDUE' ? (
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setReturnCondition('GOOD');
                            setReturnModal(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
                        >
                          Nhận trả đồ
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Equipment Catalog */}
      {activeTab === 'EQUIPMENT' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {equipmentList.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {eq.sportType}
                  </span>
                  <span className="font-mono font-black text-emerald-700">
                    {formatVND(eq.price)}
                    <span className="text-[10px] font-normal text-slate-400">/{eq.pricingType === 'PER_TURN' ? 'lượt' : 'giờ'}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{eq.name}</h3>

                <div className="mt-3 p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1">
                  <p>• Tiền cọc: <strong className="font-mono">{formatVND(eq.depositAmount)}</strong></p>
                  <p>• Phạt hỏng: <strong className="font-mono text-amber-700">{formatVND(eq.damageFee)}</strong></p>
                  <p>• Phạt mất: <strong className="font-mono text-rose-700">{formatVND(eq.lostFee)}</strong></p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Sẵn sàng: <strong className="text-slate-900">{eq.availableQuantity} / {eq.totalQuantity}</strong>
                </span>
                <span className="font-mono text-[10px] text-slate-400">#{eq.code}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return Rental Modal */}
      {returnModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nhận Trả Dụng Cụ & Hoàn Cọc</h3>
              <button onClick={() => setReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnTicket} className="py-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <p>Khách thuê: <strong className="text-slate-900">{selectedTicket.customerName}</strong> ({selectedTicket.customerPhone})</p>
                <p>Dụng cụ: <strong>{selectedTicket.equipmentName}</strong> (x{selectedTicket.quantity})</p>
                <p>Tiền cọc ban đầu: <strong className="text-emerald-700 font-mono">{formatVND(selectedTicket.depositAmount)}</strong></p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Tình trạng dụng cụ khi kiểm tra nhận lại *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnCondition('GOOD')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      returnCondition === 'GOOD'
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Nguyên vẹn (Hoàn 100% cọc)
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnCondition('DAMAGED')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      returnCondition === 'DAMAGED'
                        ? 'bg-amber-600 text-white font-bold border-amber-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Hư hỏng nhẹ (Trừ phí hỏng)
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnCondition('LOST')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      returnCondition === 'LOST'
                        ? 'bg-rose-600 text-white font-bold border-rose-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Mất mát (Trừ phí mất)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {submittingReturn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận hoàn tất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Lập Phiếu Thuê Dụng Cụ Tại Quầy</h3>
              <button onClick={() => setNewTicketModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dụng cụ cần thuê *</label>
                <select
                  value={selectedEquipId}
                  onChange={(e) => setSelectedEquipId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({formatVND(eq.price)} - Cọc: {formatVND(eq.depositAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số lượng *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={ticketQuantity}
                  onChange={(e) => setTicketQuantity(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {submittingTicket ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Tạo phiếu thuê
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
