'use client';

import React, { useEffect, useState } from 'react';
import {
  Building,
  PlusCircle,
  Tag,
  Clock,
  Layers,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateTime } from '@/lib/utils';

export default function AdminFacilitiesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [priceRules, setPriceRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'RESOURCES' | 'PRICING'>('RESOURCES');

  // New Resource Modal
  const [newResourceModal, setNewResourceModal] = useState(false);
  const [resName, setResName] = useState('');
  const [resSport, setResSport] = useState('FOOTBALL');
  const [resCourtType, setResCourtType] = useState('OUTDOOR');
  const [resIsComposite, setResIsComposite] = useState(false);
  const [resBaseUnits, setResBaseUnits] = useState('');
  const [creatingRes, setCreatingRes] = useState(false);

  // New Price Rule Modal
  const [newPriceModal, setNewPriceModal] = useState(false);
  const [priceSport, setPriceSport] = useState('FOOTBALL');
  const [priceBand, setPriceBand] = useState('PEAK');
  const [priceStart, setPriceStart] = useState('17:30');
  const [priceEnd, setPriceEnd] = useState('22:00');
  const [pricePerHour, setPricePerHour] = useState('400000');
  const [creatingPrice, setCreatingPrice] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, prData] = await Promise.allSettled([
        api.facilities.getResources(),
        api.facilities.getPriceRules(),
      ]);

      if (resData.status === 'fulfilled' && Array.isArray(resData.value)) {
        setResources(resData.value);
      }
      if (prData.status === 'fulfilled' && Array.isArray(prData.value)) {
        setPriceRules(prData.value);
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

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingRes(true);
      const baseUnitIds = resIsComposite
        ? resBaseUnits.split(',').map((u) => u.trim()).filter(Boolean)
        : [];

      await api.facilities.createResource({
        name: resName,
        sportType: resSport,
        courtType: resCourtType,
        isComposite: resIsComposite,
        baseUnitIds,
      });

      showToast(`Đã thêm sân thể thao "${resName}" thành công!`);
      setNewResourceModal(false);
      setResName('');
      setResBaseUnits('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo sân');
    } finally {
      setCreatingRes(false);
    }
  };

  const handleCreatePriceRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingPrice(true);
      const parsedPrice = parseInt(pricePerHour, 10);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        alert('Đơn giá phải là số nguyên dương hợp lệ');
        return;
      }

      await api.facilities.createPriceRule({
        appliesTo: priceSport,
        band: priceBand,
        startTime: priceStart,
        endTime: priceEnd,
        pricePerHour: parsedPrice,
      });

      showToast(`Đã cấu hình bảng giá khung giờ ${priceBand} cho môn ${priceSport}!`);
      setNewPriceModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo bảng giá');
    } finally {
      setCreatingPrice(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Cơ Sở Vật Chất & Bảng Giá Phân Phiên Bản
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh mục sân, cấu hình đồ thị sân ghép (Composite Courts) và bảng giá Peak/Off-peak
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'RESOURCES' ? (
            <button
              onClick={() => setNewResourceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Thêm sân mới
            </button>
          ) : (
            <button
              onClick={() => setNewPriceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Thêm quy tắc giá
            </button>
          )}

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
          onClick={() => setActiveTab('RESOURCES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RESOURCES'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" /> Danh mục Sân Thể Thao ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('PRICING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PRICING'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Bảng Giá Khung Giờ ({priceRules.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'RESOURCES' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {res.sportType}
                  </span>
                  {res.isComposite && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Sân Ghép
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{res.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Loại sân: <strong className="text-slate-700">{res.courtType || 'Tiêu chuẩn'}</strong>
                </p>

                {res.isComposite && res.baseUnitIds && res.baseUnitIds.length > 0 && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Cấu thành từ các sân đơn:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {res.baseUnitIds.map((uid: string) => (
                        <span
                          key={uid}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px] font-bold text-slate-800"
                        >
                          {uid}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Trạng thái: Sẵn sàng</span>
                <span className="font-mono text-[10px]">#{res.id.slice(-6)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Áp Dụng Cho</th>
                <th className="px-4 py-3">Khung Giờ (Band)</th>
                <th className="px-4 py-3">Thời Gian</th>
                <th className="px-4 py-3">Đơn Giá / Giờ</th>
                <th className="px-4 py-3">Phiên Bản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {priceRules.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{pr.appliesTo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pr.band === 'PEAK'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {pr.band === 'PEAK' ? 'Giờ cao điểm' : 'Giờ thường'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">
                    {pr.startTime} - {pr.endTime}
                  </td>
                  <td className="px-4 py-3 font-mono font-black text-emerald-700 text-sm">
                    {formatVND(pr.pricePerHour)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    v{pr.version || 1}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Resource Modal */}
      {newResourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Thêm Sân Thể Thao Mới</h3>
              <button
                onClick={() => setNewResourceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên sân *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sân bóng đá 7 người C"
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bộ môn *</label>
                  <select
                    value={resSport}
                    onChange={(e) => setResSport(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="FOOTBALL">Bóng đá</option>
                    <option value="BADMINTON">Cầu lông</option>
                    <option value="PICKLEBALL">Pickleball</option>
                    <option value="TENNIS">Tennis</option>
                    <option value="BASKETBALL">Bóng rổ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khu vực *</label>
                  <select
                    value={resCourtType}
                    onChange={(e) => setResCourtType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="OUTDOOR">Ngoài trời</option>
                    <option value="INDOOR">Trong nhà (Mái che)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={resIsComposite}
                    onChange={(e) => setResIsComposite(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Đây là sân ghép (Composite Court)</span>
                </label>
              </div>

              {resIsComposite && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã các sân cơ sở tạo thành (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: F1, F2"
                    value={resBaseUnits}
                    onChange={(e) => setResBaseUnits(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewResourceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingRes}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creatingRes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Tạo sân
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Price Rule Modal */}
      {newPriceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Thêm Quy Tắc Bảng Giá Mới</h3>
              <button
                onClick={() => setNewPriceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePriceRule} className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bộ môn *</label>
                  <select
                    value={priceSport}
                    onChange={(e) => setPriceSport(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="FOOTBALL">Bóng đá</option>
                    <option value="BADMINTON">Cầu lông</option>
                    <option value="PICKLEBALL">Pickleball</option>
                    <option value="TENNIS">Tennis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khung giờ *</label>
                  <select
                    value={priceBand}
                    onChange={(e) => setPriceBand(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="PEAK">Giờ cao điểm (PEAK)</option>
                    <option value="OFFPEAK">Giờ thường (OFFPEAK)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bắt đầu *</label>
                  <input
                    type="time"
                    required
                    value={priceStart}
                    onChange={(e) => setPriceStart(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kết thúc *</label>
                  <input
                    type="time"
                    required
                    value={priceEnd}
                    onChange={(e) => setPriceEnd(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đơn giá trên 1 giờ (VNĐ) *
                </label>
                <input
                  type="number"
                  step="10000"
                  required
                  placeholder="Ví dụ: 400000"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewPriceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingPrice}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creatingPrice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Lưu bảng giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
