'use client';

import React, { useEffect, useState } from 'react';
import {
  Gamepad2,
  Monitor,
  Clock,
  Play,
  Square,
  Lock,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateTime, generateIdempotencyKey } from '@/lib/utils';

interface Station {
  id: string;
  name: string;
  zone: 'STANDARD' | 'VIP';
  status: 'AVAILABLE' | 'PLAYING' | 'OFFLINE';
  currentCustomer?: string;
  remainingMinutes?: number;
  ipAddress?: string;
}

export default function AdminGamingPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedZone, setSelectedZone] = useState<'ALL' | 'STANDARD' | 'VIP'>('ALL');
  const [loading, setLoading] = useState(false);

  // Start Session Modal
  const [startModal, setStartModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [startingSession, setStartingSession] = useState(false);

  // Add Time Modal
  const [addTimeModal, setAddTimeModal] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState('60');
  const [addingTime, setAddingTime] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const generateDemoStations = (): Station[] => {
    const list: Station[] = [];
    for (let i = 1; i <= 70; i++) {
      const isVip = i > 50;
      const isPlaying = i % 3 === 0 || i % 5 === 0;
      const isOffline = i % 17 === 0;

      list.push({
        id: `station-${i}`,
        name: isVip ? `VIP-${i - 50}` : `PC-${i.toString().padStart(2, '0')}`,
        zone: isVip ? 'VIP' : 'STANDARD',
        status: isOffline ? 'OFFLINE' : isPlaying ? 'PLAYING' : 'AVAILABLE',
        currentCustomer: isPlaying ? `Khách #${i * 123}` : undefined,
        remainingMinutes: isPlaying ? (i * 7) % 180 + 20 : undefined,
        ipAddress: `192.168.10.${100 + i}`,
      });
    }
    return list;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.gaming.getStations();
      if (Array.isArray(res) && res.length > 0) {
        setStations(res);
      } else {
        setStations(generateDemoStations());
      }
    } catch {
      setStations(generateDemoStations());
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

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;
    try {
      setStartingSession(true);
      const idempotencyKey = generateIdempotencyKey('gaming-start');
      await api.gaming.startSession({
        stationId: selectedStation.id,
        customerName,
        customerPhone,
        minutes: parseInt(durationMinutes, 10),
        idempotencyKey,
      });

      showToast(`Đã mở máy ${selectedStation.name} cho khách ${customerName}!`);
      setStartModal(false);
      setCustomerName('');
      setCustomerPhone('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi mở phiên máy trạm');
    } finally {
      setStartingSession(false);
    }
  };

  const handleEndSession = async (st: Station) => {
    if (!confirm(`Bạn có chắc chắn muốn kết thúc ca chơi và khóa máy ${st.name}?`)) return;
    try {
      await api.gaming.endSession(st.id);
      showToast(`Đã kết thúc phiên chơi trên máy ${st.name}!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi kết thúc phiên');
    }
  };

  const handleAddTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;
    try {
      setAddingTime(true);
      await api.gaming.addTime(selectedStation.id, parseInt(extraMinutes, 10));
      showToast(`Đã nạp thêm ${extraMinutes} phút cho máy ${selectedStation.name}!`);
      setAddTimeModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nạp giờ');
    } finally {
      setAddingTime(false);
    }
  };

  const filtered = stations.filter((s) => {
    if (selectedZone === 'ALL') return true;
    return s.zone === selectedZone;
  });

  const playingCount = stations.filter((s) => s.status === 'PLAYING').length;
  const availableCount = stations.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sơ Đồ Phòng Máy Gaming (70 Máy Trạm RTX 4080)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Giám sát trạng thái máy trạm thời gian thực, mở máy cho khách tại quầy và nạp giờ chơi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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

      {/* Filter & Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { key: 'ALL', label: `Tất cả (70 máy)` },
            { key: 'STANDARD', label: `Sảnh Thường (50 máy)` },
            { key: 'VIP', label: `Sảnh VIP 240Hz (20 máy)` },
          ].map((z) => (
            <button
              key={z.key}
              onClick={() => setSelectedZone(z.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedZone === z.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-3 h-3 rounded-md bg-emerald-500" /> Trống ({availableCount})
          </span>
          <span className="flex items-center gap-1.5 text-purple-700">
            <span className="w-3 h-3 rounded-md bg-purple-600" /> Đang chơi ({playingCount})
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-md bg-slate-300" /> Ngoại tuyến
          </span>
        </div>
      </div>

      {/* 70 Machines Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2.5">
        {filtered.map((st) => {
          const isPlaying = st.status === 'PLAYING';
          const isAvail = st.status === 'AVAILABLE';

          return (
            <div
              key={st.id}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between h-32 relative ${
                isPlaying
                  ? 'bg-purple-900 text-white border-purple-700 shadow-sm'
                  : isAvail
                  ? 'bg-white text-slate-900 border-slate-200 hover:border-emerald-500'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              {st.zone === 'VIP' && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase text-amber-400 bg-amber-950/40 px-1 rounded">
                  VIP
                </span>
              )}

              <div>
                <Monitor className={`w-5 h-5 mx-auto ${isPlaying ? 'text-purple-300' : isAvail ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-mono font-black text-xs block mt-1">{st.name}</span>
              </div>

              {isPlaying ? (
                <div>
                  <p className="text-[10px] text-purple-200 truncate">{st.currentCustomer}</p>
                  <p className="font-mono font-bold text-xs text-amber-300 mt-0.5">
                    {st.remainingMinutes}m
                  </p>
                </div>
              ) : isAvail ? (
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Sẵn sàng</span>
              ) : (
                <span className="text-[10px] text-slate-400">Offline</span>
              )}

              <div className="pt-1.5 border-t border-white/10 flex items-center justify-center gap-1">
                {isAvail ? (
                  <button
                    onClick={() => {
                      setSelectedStation(st);
                      setStartModal(true);
                    }}
                    className="w-full py-1 text-[10px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Mở máy
                  </button>
                ) : isPlaying ? (
                  <div className="flex w-full gap-1">
                    <button
                      onClick={() => {
                        setSelectedStation(st);
                        setAddTimeModal(true);
                      }}
                      className="flex-1 py-1 text-[9px] font-bold bg-purple-700 hover:bg-purple-600 text-white rounded"
                    >
                      +Giờ
                    </button>
                    <button
                      onClick={() => handleEndSession(st)}
                      className="px-1.5 py-1 text-[9px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded"
                    >
                      Khóa
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400 font-mono">{st.ipAddress}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Session Modal */}
      {startModal && selectedStation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Mở Máy {selectedStation.name} Tại Quầy
              </h3>
              <button onClick={() => setStartModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleStartSession} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên khách hàng / Nickname *</label>
                <input
                  type="text"
                  required
                  placeholder="Khách vãng lai / Game thủ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại (tích điểm / nạp ví)</label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời gian nạp ban đầu *</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-mono font-bold"
                >
                  <option value="60">60 phút (1 giờ)</option>
                  <option value="120">120 phút (2 giờ)</option>
                  <option value="180">180 phút (3 giờ)</option>
                  <option value="300">300 phút (Combo 5 giờ)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStartModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={startingSession}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {startingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Kích hoạt máy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Time Modal */}
      {addTimeModal && selectedStation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Nạp Thêm Giờ Máy {selectedStation.name}
              </h3>
              <button onClick={() => setAddTimeModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTime} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời gian nạp thêm *</label>
                <select
                  value={extraMinutes}
                  onChange={(e) => setExtraMinutes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white font-mono font-bold"
                >
                  <option value="30">+30 phút</option>
                  <option value="60">+60 phút (1 giờ)</option>
                  <option value="120">+120 phút (2 giờ)</option>
                  <option value="180">+180 phút (3 giờ)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddTimeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingTime}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {addingTime ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận nạp giờ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
