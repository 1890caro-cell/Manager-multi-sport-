'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Users,
  Calendar,
  Medal,
  Award,
  Swords,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  Gamepad2,
  Flame,
} from 'lucide-react';
import { api, getStoredToken } from '@/lib/api';
import { formatVND, formatDateOnly, generateIdempotencyKey } from '@/lib/utils';

interface Tournament {
  id: string;
  name: string;
  sportType: 'FOOTBALL' | 'BADMINTON' | 'PICKLEBALL' | 'TENNIS' | 'ESPORTS';
  format: 'SINGLE_ELIMINATION' | 'ROUND_ROBIN';
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'ONGOING' | 'COMPLETED';
  maxTeams: number;
  registeredTeamsCount: number;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  regDeadline: string;
  description: string;
}

interface MatchNode {
  id: string;
  round: string; // Tứ kết, Bán kết, Chung kết
  team1: { name: string; score?: number; winner?: boolean };
  team2: { name: string; score?: number; winner?: boolean };
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  time: string;
}

const DEFAULT_TOURNAMENTS: Tournament[] = [
  {
    id: 'tour-1',
    name: 'Giải Cầu Lông Mở Rộng Antigravity Open 2026',
    sportType: 'BADMINTON',
    format: 'SINGLE_ELIMINATION',
    status: 'REGISTRATION_OPEN',
    maxTeams: 16,
    registeredTeamsCount: 12,
    entryFee: 500000,
    prizePool: 30000000,
    startDate: '2026-11-15',
    endDate: '2026-11-17',
    regDeadline: '2026-11-10',
    description: 'Quy tụ các đôi vợt phong trào hàng đầu khu vực tranh cúp vô địch và tổng giải thưởng 30.000.000 VNĐ.',
  },
  {
    id: 'tour-2',
    name: 'Giải Bóng Đá Sân 7 - Cúp Mùa Thu',
    sportType: 'FOOTBALL',
    format: 'ROUND_ROBIN',
    status: 'REGISTRATION_OPEN',
    maxTeams: 8,
    registeredTeamsCount: 6,
    entryFee: 1500000,
    prizePool: 50000000,
    startDate: '2026-11-20',
    endDate: '2026-12-05',
    regDeadline: '2026-11-14',
    description: 'Thể thức vòng bảng đá vòng tròn tính điểm chọn 4 đội xuất sắc nhất vào bán kết và chung kết.',
  },
  {
    id: 'tour-3',
    name: 'Pickleball Champions Invitational',
    sportType: 'PICKLEBALL',
    format: 'SINGLE_ELIMINATION',
    status: 'UPCOMING',
    maxTeams: 32,
    registeredTeamsCount: 18,
    entryFee: 400000,
    prizePool: 25000000,
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    regDeadline: '2026-11-25',
    description: 'Sân chơi đỉnh cao cho cộng đồng Pickleball đang bùng nổ, thi đấu theo luật USAPA chính thức.',
  },
  {
    id: 'tour-4',
    name: 'Esports Championship: CS2 Cyber Arena',
    sportType: 'ESPORTS',
    format: 'SINGLE_ELIMINATION',
    status: 'REGISTRATION_OPEN',
    maxTeams: 16,
    registeredTeamsCount: 14,
    entryFee: 600000,
    prizePool: 40000000,
    startDate: '2026-11-22',
    endDate: '2026-11-23',
    regDeadline: '2026-11-18',
    description: 'Đấu trường Gaming Station 240Hz RTX 4080 thi đấu nhánh 16 đội tuyển Esports chuyên nghiệp.',
  },
];

const DEMO_BRACKET: MatchNode[] = [
  // Bán kết
  {
    id: 'm1',
    round: 'Bán Kết 1',
    team1: { name: 'Vortex Wolves', score: 2, winner: true },
    team2: { name: 'Dragon Slayers', score: 1, winner: false },
    status: 'FINISHED',
    time: '14:00 - Sân 1',
  },
  {
    id: 'm2',
    round: 'Bán Kết 2',
    team1: { name: 'Phoenix Blaze', score: 0, winner: false },
    team2: { name: 'Titan Force', score: 2, winner: true },
    status: 'FINISHED',
    time: '15:30 - Sân 2',
  },
  // Chung kết
  {
    id: 'm3',
    round: 'Chung Kết Vô Địch',
    team1: { name: 'Vortex Wolves', score: 3, winner: true },
    team2: { name: 'Titan Force', score: 2, winner: false },
    status: 'FINISHED',
    time: '17:00 - Sân Trung Tâm',
  },
];

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>(DEFAULT_TOURNAMENTS);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(DEFAULT_TOURNAMENTS[0]);
  const [bracketView, setBracketView] = useState(false);

  // Registration Modal
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [roster, setRoster] = useState(['', '', '']);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadTournaments() {
      try {
        const res = await api.tournaments.getList();
        if (Array.isArray(res) && res.length > 0) {
          setTournaments(res);
          setSelectedTournament(res[0]);
        }
      } catch {
        // Fallback default tournaments
      }
    }
    loadTournaments();
  }, []);

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    const token = getStoredToken();
    if (!token) {
      router.push('/login?redirect=/tournaments');
      return;
    }

    try {
      setSubmittingReg(true);
      const idempotencyKey = generateIdempotencyKey('team-reg');
      await api.tournaments.registerTeam(selectedTournament.id, {
        teamName,
        captainName,
        captainPhone,
        roster: roster.filter((r) => r.trim().length > 0),
        idempotencyKey,
      });

      setRegSuccess(`Đăng ký thành công đội "${teamName}" tham gia giải đấu!`);
      setRegModalOpen(false);
      setTeamName('');
      setCaptainName('');
      setCaptainPhone('');
      setTimeout(() => setRegSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đăng ký đội');
    } finally {
      setSubmittingReg(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-600" /> Hệ Thống Giải Đấu & Esports
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Giải Đấu & Cup Thể Thao
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Đấu trường chuyên nghiệp, sơ đồ thi đấu tương tác trực tiếp và tổng giải thưởng tiền mặt hấp dẫn
          </p>
        </div>

        <button
          onClick={() => setBracketView(!bracketView)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Swords className="w-4 h-4 text-emerald-400" />
          {bracketView ? 'Xem danh sách giải đấu' : 'Sơ đồ nhánh đấu trực tiếp (Bracket)'}
        </button>
      </div>

      {regSuccess && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{regSuccess}</span>
        </div>
      )}

      {/* Main Content */}
      {bracketView ? (
        /* Visual Tournament Bracket */
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Sơ đồ thi đấu mẫu
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {selectedTournament?.name || 'Vòng Đấu Loại Trực Tiếp (Single Elimination)'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Semifinals */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vòng Bán Kết</h3>
              {DEMO_BRACKET.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm relative"
                >
                  <div className="flex justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-semibold text-slate-600">{m.round}</span>
                    <span>{m.time}</span>
                  </div>

                  <div className="space-y-2">
                    <div
                      className={`flex justify-between items-center p-2 rounded-lg text-xs font-bold ${
                        m.team1.winner ? 'bg-emerald-100 text-emerald-950' : 'bg-white text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {m.team1.winner && <Medal className="w-3.5 h-3.5 text-amber-500" />}
                        {m.team1.name}
                      </span>
                      <span className="font-mono">{m.team1.score}</span>
                    </div>

                    <div
                      className={`flex justify-between items-center p-2 rounded-lg text-xs font-bold ${
                        m.team2.winner ? 'bg-emerald-100 text-emerald-950' : 'bg-white text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {m.team2.winner && <Medal className="w-3.5 h-3.5 text-amber-500" />}
                        {m.team2.name}
                      </span>
                      <span className="font-mono">{m.team2.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Finals */}
            <div className="space-y-6 flex flex-col justify-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Trận Chung Kết Tranh Ngôi Vô Địch
              </h3>
              {DEMO_BRACKET.slice(2, 3).map((m) => (
                <div
                  key={m.id}
                  className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border-2 border-amber-300 rounded-3xl p-5 shadow-md"
                >
                  <div className="flex justify-between text-xs text-amber-800 font-bold mb-3">
                    <span>{m.round}</span>
                    <span>{m.time}</span>
                  </div>

                  <div className="space-y-2.5">
                    <div
                      className={`flex justify-between items-center p-3 rounded-xl text-sm font-extrabold ${
                        m.team1.winner
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 fill-slate-950" />
                        {m.team1.name} (VÔ ĐỊCH)
                      </span>
                      <span className="font-mono text-base">{m.team1.score}</span>
                    </div>

                    <div
                      className={`flex justify-between items-center p-3 rounded-xl text-sm font-extrabold ${
                        m.team2.winner
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{m.team2.name} (Á Quân)</span>
                      <span className="font-mono text-base">{m.team2.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Tournaments Cards Grid */
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((t) => {
            const isFull = t.registeredTeamsCount >= t.maxTeams;

            return (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                        {t.sportType === 'ESPORTS' ? (
                          <Gamepad2 className="w-3 h-3" />
                        ) : (
                          <Trophy className="w-3 h-3" />
                        )}
                        {t.sportType} •{' '}
                        {t.format === 'SINGLE_ELIMINATION' ? 'Loại trực tiếp' : 'Vòng tròn'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{t.name}</h3>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                      {t.status === 'REGISTRATION_OPEN' ? 'Mở đăng ký' : 'Sắp diễn ra'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">{t.description}</p>

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl text-xs mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Tổng giải thưởng
                      </p>
                      <p className="text-base font-extrabold text-amber-600 font-mono mt-0.5">
                        {formatVND(t.prizePool)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Lệ phí đội
                      </p>
                      <p className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
                        {formatVND(t.entryFee)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Thời gian: <strong>{formatDateOnly(t.startDate)} - {formatDateOnly(t.endDate)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Hạn chót đăng ký: <strong>{formatDateOnly(t.regDeadline)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Số đội đã ghi danh:{' '}
                        <strong className="text-emerald-700 font-mono">
                          {t.registeredTeamsCount} / {t.maxTeams} đội
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    disabled={isFull}
                    onClick={() => {
                      setSelectedTournament(t);
                      setRegModalOpen(true);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isFull
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm'
                    }`}
                  >
                    {isFull ? 'Đã đủ số đội' : 'Đăng ký đội thi đấu'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Registration Modal */}
      {regModalOpen && selectedTournament && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Đăng ký đội tham gia {selectedTournament.name}
              </h3>
              <button
                onClick={() => setRegModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterTeam} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên đội bóng / Đội tuyển *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ví dụ: FC Phoenix, Saigon Warriors..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên Đội trưởng *</label>
                  <input
                    type="text"
                    required
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Danh sách thành viên đăng ký (tối thiểu 3 VĐV)
                </label>
                <div className="space-y-2">
                  {roster.map((player, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={player}
                      onChange={(e) => {
                        const newRoster = [...roster];
                        newRoster[idx] = e.target.value;
                        setRoster(newRoster);
                      }}
                      placeholder={`Vận động viên #${idx + 1}`}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setRoster([...roster, ''])}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    + Thêm thành viên
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-100">
                <span className="text-slate-500">Lệ phí giải đấu:</span>
                <span className="text-base font-extrabold text-amber-600 font-mono">
                  {formatVND(selectedTournament.entryFee)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRegModalOpen(false)}
                  disabled={submittingReg}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center gap-1.5"
                >
                  {submittingReg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận & Thanh toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
