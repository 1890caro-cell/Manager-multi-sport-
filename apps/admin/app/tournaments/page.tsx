'use client';

import React, { useEffect, useState } from 'react';
import {
  Trophy,
  PlusCircle,
  Users,
  CheckCircle2,
  Calendar,
  Gamepad2,
  Medal,
  RefreshCw,
  Loader2,
  Shield,
  Edit,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateOnly, generateIdempotencyKey } from '@/lib/utils';

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Tournament Modal
  const [createModal, setCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('BADMINTON');
  const [format, setFormat] = useState('SINGLE_ELIMINATION');
  const [maxTeams, setMaxTeams] = useState('16');
  const [entryFee, setEntryFee] = useState('500000');
  const [prizePool, setPrizePool] = useState('30000000');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [regDeadline, setRegDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [creating, setCreating] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.tournaments.getList();
      if (Array.isArray(res)) {
        setTournaments(res);
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

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const idempotencyKey = generateIdempotencyKey('tour-create');
      await api.tournaments.create({
        name,
        sportType,
        format,
        maxTeams: parseInt(maxTeams, 10),
        entryFee: parseInt(entryFee, 10),
        prizePool: parseInt(prizePool, 10),
        startDate,
        endDate,
        regDeadline,
        idempotencyKey,
      });

      showToast(`Đã tạo giải đấu "${name}" thành công!`);
      setCreateModal(false);
      setName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo giải đấu');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Giải Đấu & Sự Kiện Thể Thao
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Điều hành các giải đấu bóng đá, cầu lông, pickleball, tennis và esports; duyệt đội và quản lý nhánh đấu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Tạo giải đấu mới
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

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-600" />
                  {t.sportType}
                </span>

                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700">
                  {t.status || 'Mở đăng ký'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mt-1">{t.name}</h3>

              <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 text-slate-600">
                <p>
                  • Thể thức:{' '}
                  <strong>{t.format === 'SINGLE_ELIMINATION' ? 'Loại trực tiếp' : 'Vòng tròn'}</strong>
                </p>
                <p>
                  • Tổng giải thưởng:{' '}
                  <strong className="font-mono text-amber-600">{formatVND(t.prizePool)}</strong>
                </p>
                <p>
                  • Lệ phí đội:{' '}
                  <strong className="font-mono text-slate-800">{formatVND(t.entryFee)}</strong>
                </p>
                <p>
                  • Đội tham gia:{' '}
                  <strong className="font-mono text-emerald-700">
                    {t.registeredTeamsCount || 0} / {t.maxTeams} đội
                  </strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Thời gian: {formatDateOnly(t.startDate)} - {formatDateOnly(t.endDate)}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">#{t.id.slice(-6)}</span>
              <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                Xem nhánh đấu
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Tournament Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tạo Giải Đấu Mới</h3>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên giải đấu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cúp Cầu Lông Đôi Nam Mở Rộng 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bộ môn *</label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="BADMINTON">Cầu lông</option>
                    <option value="FOOTBALL">Bóng đá</option>
                    <option value="PICKLEBALL">Pickleball</option>
                    <option value="TENNIS">Tennis</option>
                    <option value="ESPORTS">Esports</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thể thức thi đấu *</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="SINGLE_ELIMINATION">Loại trực tiếp (Single Elimination)</option>
                    <option value="ROUND_ROBIN">Vòng tròn tính điểm (Round Robin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số đội tối đa *</label>
                  <input
                    type="number"
                    required
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lệ phí đội (VNĐ) *</label>
                  <input
                    type="number"
                    step="50000"
                    required
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổng giải thưởng (VNĐ) *</label>
                  <input
                    type="number"
                    step="1000000"
                    required
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kết thúc *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn đăng ký *</label>
                  <input
                    type="date"
                    required
                    value={regDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Tạo giải đấu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
