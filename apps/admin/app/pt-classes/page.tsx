'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle2,
  Star,
  Award,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatVND, formatDateOnly } from '@/lib/utils';

export default function AdminPtClassesPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [ptBookings, setPtBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'TRAINERS' | 'CLASSES' | 'BOOKINGS'>('CLASSES');

  // New Class Modal
  const [classModal, setClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classCategory, setClassCategory] = useState('YOGA');
  const [classTrainer, setClassTrainer] = useState('');
  const [classSchedule, setClassSchedule] = useState('Thứ 2, 4, 6');
  const [classTimeSlot, setClassTimeSlot] = useState('07:00 - 08:00');
  const [classCapacity, setClassCapacity] = useState('20');
  const [classPrice, setClassPrice] = useState('150000');
  const [creatingClass, setCreatingClass] = useState(false);

  // New Trainer Modal
  const [trainerModal, setTrainerModal] = useState(false);
  const [trName, setTrName] = useState('');
  const [trSpecialty, setTrSpecialty] = useState('Tăng cơ & Giảm cân');
  const [trExperience, setTrExperience] = useState('5');
  const [trHourlyRate, setTrHourlyRate] = useState('500000');
  const [creatingTrainer, setCreatingTrainer] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trRes, clsRes, bkRes] = await Promise.allSettled([
        api.ptClass.getTrainers(),
        api.ptClass.getClasses(),
        api.ptClass.getPtBookings(),
      ]);

      if (trRes.status === 'fulfilled' && Array.isArray(trRes.value)) {
        setTrainers(trRes.value);
        if (!classTrainer && trRes.value.length > 0) {
          setClassTrainer(trRes.value[0].name);
        }
      }
      if (clsRes.status === 'fulfilled' && Array.isArray(clsRes.value)) {
        setClasses(clsRes.value);
      }
      if (bkRes.status === 'fulfilled' && Array.isArray(bkRes.value)) {
        setPtBookings(bkRes.value);
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

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingClass(true);
      await api.ptClass.createClass({
        name: className,
        category: classCategory,
        trainerName: classTrainer,
        schedule: classSchedule,
        timeSlot: classTimeSlot,
        capacity: parseInt(classCapacity, 10),
        price: parseInt(classPrice, 10),
      });

      showToast(`Đã tạo lớp học nhóm "${className}" thành công!`);
      setClassModal(false);
      setClassName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo lớp học');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingTrainer(true);
      await api.ptClass.createTrainer({
        name: trName,
        specialty: trSpecialty,
        experienceYears: parseInt(trExperience, 10),
        hourlyRate: parseInt(trHourlyRate, 10),
        certifications: ['NASM Certified Personal Trainer'],
      });

      showToast(`Đã thêm HLV "${trName}" vào hệ thống!`);
      setTrainerModal(false);
      setTrName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm HLV');
    } finally {
      setCreatingTrainer(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý HLV Cá Nhân & Lớp Học Nhóm
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Điều phối đội ngũ huấn luyện viên PT, danh sách lớp Yoga, Zumba, HIIT và lịch học viên
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'CLASSES' ? (
            <button
              onClick={() => setClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Mở lớp học mới
            </button>
          ) : activeTab === 'TRAINERS' ? (
            <button
              onClick={() => setTrainerModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Thêm HLV mới
            </button>
          ) : null}

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
          onClick={() => setActiveTab('CLASSES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CLASSES'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Lớp Học Nhóm ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('TRAINERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TRAINERS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Đội Ngũ HLV 1-1 ({trainers.length})
        </button>
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BOOKINGS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Lịch Tập PT 1-1 ({ptBookings.length})
        </button>
      </div>

      {/* Tab 1: Group Classes */}
      {activeTab === 'CLASSES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {cls.category}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-700">
                    {formatVND(cls.price)}
                    <span className="text-[10px] font-normal text-slate-400">/buổi</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>

                <div className="mt-3 p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1.5">
                  <p>
                    • Lịch học: <strong>{cls.schedule} ({cls.timeSlot})</strong>
                  </p>
                  <p>
                    • HLV: <strong className="text-slate-900">{cls.trainerName}</strong>
                  </p>
                  <p>
                    • Sĩ số:{' '}
                    <strong className="text-emerald-700 font-mono">
                      {cls.enrolled || 0} / {cls.capacity} học viên
                    </strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Trạng thái: Đang mở ghi danh</span>
                <span className="font-mono text-[10px]">#{cls.id.slice(-6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Trainers */}
      {activeTab === 'TRAINERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trainers.map((tr) => (
            <div
              key={tr.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow">
                    {tr.name.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{tr.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{tr.rating || 4.9}</span>
                      <span className="text-slate-400 font-normal">({tr.totalReviews || 90} bài đánh giá)</span>
                    </div>
                  </div>
                </div>

                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 mb-3">
                  {tr.specialty}
                </span>

                <div className="space-y-1 text-xs text-slate-600">
                  <p>• Kinh nghiệm: {tr.experienceYears} năm</p>
                  <p>• Thù lao: <strong className="font-mono text-blue-700">{formatVND(tr.hourlyRate)}/buổi</strong></p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Sẵn sàng nhận lịch dạy
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: PT Bookings */}
      {activeTab === 'BOOKINGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Học Viên</th>
                <th className="px-4 py-3">HLV Phụ Trách</th>
                <th className="px-4 py-3">Ngày & Giờ Tập</th>
                <th className="px-4 py-3">Mục Tiêu Thể Hình</th>
                <th className="px-4 py-3 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {ptBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có lịch đặt PT nào ghi nhận.
                  </td>
                </tr>
              ) : (
                ptBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{b.customerName || 'Học viên'}</td>
                    <td className="px-4 py-3 font-semibold text-blue-800">{b.trainerName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">
                      {formatDateOnly(b.date)} ({b.timeSlot})
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.notes || 'Tập cơ bản'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Đã xác nhận
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Class Modal */}
      {classModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Mở Lớp Học Nhóm Mới</h3>
              <button onClick={() => setClassModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên lớp học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Pilates Mat Phục Hồi Cột Sống"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thể loại *</label>
                  <select
                    value={classCategory}
                    onChange={(e) => setClassCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="YOGA">Yoga</option>
                    <option value="ZUMBA">Zumba</option>
                    <option value="HIIT">HIIT Cardio</option>
                    <option value="SPINNING">Spinning RPM</option>
                    <option value="PILATES">Pilates</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HLV Phụ Trách *</label>
                  <input
                    type="text"
                    required
                    value={classTrainer}
                    onChange={(e) => setClassTrainer(e.target.value)}
                    placeholder="Nguyễn Thị Minh An"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lịch học trong tuần *</label>
                  <input
                    type="text"
                    required
                    value={classSchedule}
                    onChange={(e) => setClassSchedule(e.target.value)}
                    placeholder="Thứ 2, 4, 6"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khung giờ *</label>
                  <input
                    type="text"
                    required
                    value={classTimeSlot}
                    onChange={(e) => setClassTimeSlot(e.target.value)}
                    placeholder="07:00 - 08:00"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sức chứa tối đa *</label>
                  <input
                    type="number"
                    required
                    value={classCapacity}
                    onChange={(e) => setClassCapacity(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học phí / Buổi (VNĐ) *</label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={classPrice}
                    onChange={(e) => setClassPrice(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClassModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingClass}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creatingClass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Tạo lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Trainer Modal */}
      {trainerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Thêm Huấn Luyện Viên Mới</h3>
              <button onClick={() => setTrainerModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrainer} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ tên HLV *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Hoàng Nam"
                  value={trName}
                  onChange={(e) => setTrName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chuyên môn thể hình *</label>
                <input
                  type="text"
                  required
                  value={trSpecialty}
                  onChange={(e) => setTrSpecialty(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số năm kinh nghiệm *</label>
                  <input
                    type="number"
                    required
                    value={trExperience}
                    onChange={(e) => setTrExperience(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thù lao / Buổi (VNĐ) *</label>
                  <input
                    type="number"
                    step="50000"
                    required
                    value={trHourlyRate}
                    onChange={(e) => setTrHourlyRate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTrainerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingTrainer}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {creatingTrainer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Lưu hồ sơ HLV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
