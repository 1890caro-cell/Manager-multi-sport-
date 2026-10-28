'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  Award,
  Star,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Loader2,
  AlertCircle,
  Dumbbell,
  HeartPulse,
} from 'lucide-react';
import { api, getStoredToken } from '@/lib/api';
import { formatVND, formatDateOnly, generateIdempotencyKey } from '@/lib/utils';

interface GroupClass {
  id: string;
  name: string;
  category: 'YOGA' | 'ZUMBA' | 'HIIT' | 'SPINNING' | 'PILATES';
  trainerName: string;
  trainerTitle: string;
  schedule: string;
  timeSlot: string;
  durationMinutes: number;
  capacity: number;
  enrolled: number;
  price: number;
  description: string;
}

interface Trainer {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  certifications: string[];
  rating: number;
  totalReviews: number;
  hourlyRate: number;
  bio: string;
}

const DEFAULT_CLASSES: GroupClass[] = [
  {
    id: 'cls-1',
    name: 'Vinyasa Yoga Buổi Sáng',
    category: 'YOGA',
    trainerName: 'Nguyễn Thị Minh An',
    trainerTitle: 'HLV Yoga Alliance RYT-500',
    schedule: 'Thứ 2, 4, 6',
    timeSlot: '06:30 - 07:30',
    durationMinutes: 60,
    capacity: 20,
    enrolled: 14,
    price: 150000,
    description: 'Thanh lọc cơ thể, kéo giãn cơ bắp và khởi đầu ngày mới ngập tràn năng lượng tích cực.',
  },
  {
    id: 'cls-2',
    name: 'Zumba Cardio Vũ Đạo Năng Động',
    category: 'ZUMBA',
    trainerName: 'Trần Tuấn Kiệt',
    trainerTitle: 'HLV Zumba Fitness Quốc tế',
    schedule: 'Thứ 3, 5, 7',
    timeSlot: '18:00 - 19:00',
    durationMinutes: 60,
    capacity: 25,
    enrolled: 22,
    price: 120000,
    description: 'Đốt cháy tới 600 calories trên nền nhạc Latin sôi động, xua tan căng thẳng sau giờ làm việc.',
  },
  {
    id: 'cls-3',
    name: 'HIIT Cường Độ Cao Đốt Mỡ',
    category: 'HIIT',
    trainerName: 'Lê Hoàng Nam',
    trainerTitle: 'Cựu VĐV Điền kinh & Master Coach',
    schedule: 'Thứ 2, 4, 6',
    timeSlot: '19:15 - 20:15',
    durationMinutes: 60,
    capacity: 15,
    enrolled: 11,
    price: 180000,
    description: 'Các chuỗi bài tập ngắt quãng cường độ cao kích hoạt hiệu ứng đốt mỡ thụ động suốt 24h (EPOC).',
  },
  {
    id: 'cls-4',
    name: 'Spinning RPM Đua Xe Đạp Trong Nhà',
    category: 'SPINNING',
    trainerName: 'Đặng Quốc Bảo',
    trainerTitle: 'Les Mills Certified RPM Trainer',
    schedule: 'Thứ 3, 5, Chủ nhật',
    timeSlot: '17:30 - 18:30',
    durationMinutes: 60,
    capacity: 18,
    enrolled: 16,
    price: 160000,
    description: 'Tăng cường sức bền tim mạch, săn chắc cơ đùi và mông với hệ thống xe đạp đua cao cấp.',
  },
];

const DEFAULT_TRAINERS: Trainer[] = [
  {
    id: 'tr-1',
    name: 'Phạm Đức Huy',
    specialty: 'Tăng cơ chuyên sâu & Thể hình (Bodybuilding)',
    experienceYears: 8,
    certifications: ['NASM-CPT', 'Huy chương Vàng Thể hình Quốc Gia 2022'],
    rating: 4.95,
    totalReviews: 128,
    hourlyRate: 500000,
    bio: 'Kinh nghiệm huấn luyện hơn 500 hội viên biến đổi vóc dáng ngoạn mục, tối ưu phương pháp Hypertrophy khoa học.',
  },
  {
    id: 'tr-2',
    name: 'Vũ Thảo Trang',
    specialty: 'Giảm cân lành mạnh & Siết cơ nữ giới',
    experienceYears: 6,
    certifications: ['ACE Certified Personal Trainer', 'Chuyên gia Dinh dưỡng Thể thao ISSA'],
    rating: 4.92,
    totalReviews: 95,
    hourlyRate: 450000,
    bio: 'Đồng hành xây dựng thói quen ăn uống chuẩn macro, tạo đường cong quyến rũ không cần nhịn ăn cực đoan.',
  },
  {
    id: 'tr-3',
    name: 'Nguyễn Văn Hải',
    specialty: 'Phục hồi chấn thương & Boxing / Kickfit',
    experienceYears: 10,
    certifications: ['FMS Movement Screen', 'Đai đen Kickboxing / Muay Thái'],
    rating: 4.98,
    totalReviews: 164,
    hourlyRate: 600000,
    bio: 'Chuyên gia nắn chỉnh tư thế vẹo cột sống, đau lưng dưới và rèn luyện phản xạ đối kháng đỉnh cao.',
  },
];

export default function PtClassesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'CLASSES' | 'TRAINERS'>('CLASSES');
  const [classes, setClasses] = useState<GroupClass[]>(DEFAULT_CLASSES);
  const [trainers, setTrainers] = useState<Trainer[]>(DEFAULT_TRAINERS);
  const [loading, setLoading] = useState(false);

  // Class Registration Modal
  const [selectedClass, setSelectedClass] = useState<GroupClass | null>(null);
  const [registeringClass, setRegisteringClass] = useState(false);
  const [classSuccess, setClassSuccess] = useState<string | null>(null);

  // PT Booking Modal
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [ptDate, setPtDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ptTimeSlot, setPtTimeSlot] = useState<string>('09:00');
  const [ptNotes, setPtNotes] = useState<string>('');
  const [bookingPt, setBookingPt] = useState(false);
  const [ptSuccess, setPtSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clsRes, trRes] = await Promise.allSettled([
          api.ptClass.getClasses(),
          api.ptClass.getTrainers(),
        ]);
        if (clsRes.status === 'fulfilled' && Array.isArray(clsRes.value) && clsRes.value.length > 0) {
          setClasses(clsRes.value);
        }
        if (trRes.status === 'fulfilled' && Array.isArray(trRes.value) && trRes.value.length > 0) {
          setTrainers(trRes.value);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegisterClass = async () => {
    if (!selectedClass) return;
    const token = getStoredToken();
    if (!token) {
      router.push('/login?redirect=/pt-classes');
      return;
    }

    try {
      setRegisteringClass(true);
      const idempotencyKey = generateIdempotencyKey('class-reg');
      await api.ptClass.registerClass(selectedClass.id, { idempotencyKey });
      setClassSuccess(`Đăng ký thành công lớp ${selectedClass.name}!`);
      setSelectedClass(null);
      setTimeout(() => setClassSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đăng ký lớp học');
    } finally {
      setRegisteringClass(false);
    }
  };

  const handleBookPt = async () => {
    if (!selectedTrainer) return;
    const token = getStoredToken();
    if (!token) {
      router.push('/login?redirect=/pt-classes');
      return;
    }

    try {
      setBookingPt(true);
      const idempotencyKey = generateIdempotencyKey('pt-book');
      await api.ptClass.bookPt({
        trainerId: selectedTrainer.id,
        date: ptDate,
        timeSlot: ptTimeSlot,
        notes: ptNotes,
        idempotencyKey,
      });

      setPtSuccess(
        `Đặt lịch tập PT với HLV ${selectedTrainer.name} ngày ${formatDateOnly(ptDate)} lúc ${ptTimeSlot} thành công!`,
      );
      setSelectedTrainer(null);
      setTimeout(() => setPtSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đặt lịch PT');
    } finally {
      setBookingPt(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <HeartPulse className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Huấn Luyện Viên & Lớp Học Nhóm
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            PT Cá Nhân & Lớp Học Nhóm
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Đội ngũ HLV chứng chỉ quốc tế và các lớp học sôi động nâng cao sức khỏe toàn diện
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('CLASSES')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'CLASSES'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            Lớp Học Nhóm ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('TRAINERS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'TRAINERS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            HLV Cá Nhân 1-1 ({trainers.length})
          </button>
        </div>
      </div>

      {classSuccess && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{classSuccess}</span>
        </div>
      )}

      {ptSuccess && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{ptSuccess}</span>
        </div>
      )}

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'CLASSES' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((cls) => {
              const remainingSpots = cls.capacity - cls.enrolled;
              const isFull = remainingSpots <= 0;

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-800 mb-1">
                          {cls.category}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                      </div>
                      <span className="text-base font-extrabold text-emerald-600 font-mono">
                        {formatVND(cls.price)}
                        <span className="text-xs font-normal text-slate-400">/buổi</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">{cls.description}</p>

                    <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{cls.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">
                          {cls.timeSlot} ({cls.durationMinutes} phút)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          HLV: <strong className="text-slate-900">{cls.trainerName}</strong> (
                          {cls.trainerTitle})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="text-xs">
                      <span className="text-slate-400">Số chỗ còn lại: </span>
                      <span
                        className={`font-bold ${
                          isFull
                            ? 'text-rose-600'
                            : remainingSpots <= 3
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isFull ? 'Hết chỗ' : `${remainingSpots} / ${cls.capacity}`}
                      </span>
                    </div>

                    <button
                      disabled={isFull}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      Đăng ký ngay <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trainers.map((tr) => (
              <div
                key={tr.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                      {tr.name.split(' ').slice(-1)[0][0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{tr.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{tr.rating}</span>
                        <span className="text-slate-400 font-normal">({tr.totalReviews} đánh giá)</span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 mb-3">
                    {tr.specialty}
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">{tr.bio}</p>

                  <div className="space-y-1.5 mb-4 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      • Kinh nghiệm: <span className="font-normal">{tr.experienceYears} năm</span>
                    </p>
                    <p className="font-semibold text-slate-800">
                      • Chứng chỉ: <span className="font-normal">{tr.certifications.join(', ')}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Học phí</p>
                    <p className="text-base font-extrabold text-blue-700 font-mono">
                      {formatVND(tr.hourlyRate)}
                      <span className="text-xs font-normal text-slate-400">/buổi</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedTrainer(tr)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5"
                  >
                    Đặt lịch PT <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Class Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Xác nhận ghi danh lớp học</h3>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <p className="text-sm font-bold text-slate-900">{selectedClass.name}</p>
              <p className="text-slate-600">
                Lịch học: <strong>{selectedClass.schedule} ({selectedClass.timeSlot})</strong>
              </p>
              <p className="text-slate-600">
                HLV phụ trách: <strong>{selectedClass.trainerName}</strong>
              </p>
              <div className="pt-2 flex justify-between items-center text-sm">
                <span className="text-slate-500">Học phí:</span>
                <span className="text-base font-extrabold text-emerald-600 font-mono">
                  {formatVND(selectedClass.price)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedClass(null)}
                disabled={registeringClass}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={handleRegisterClass}
                disabled={registeringClass}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5"
              >
                {registeringClass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Xác nhận đăng ký
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PT Booking Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Đặt lịch tập 1-1 với HLV {selectedTrainer.name}
              </h3>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn ngày tập</label>
                <input
                  type="date"
                  value={ptDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPtDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khung giờ tập</label>
                <select
                  value={ptTimeSlot}
                  onChange={(e) => setPtTimeSlot(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {['07:00', '08:30', '10:00', '14:00', '16:00', '17:30', '19:00', '20:30'].map(
                    (slot) => (
                      <option key={slot} value={slot}>
                        {slot} - {slot.split(':')[0]}:50 (50 phút)
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mục tiêu luyện tập & Lưu ý sức khỏe
                </label>
                <textarea
                  value={ptNotes}
                  onChange={(e) => setPtNotes(e.target.value)}
                  placeholder="Ví dụ: Cần siết cơ giảm mỡ bụng, tiền sử đau lưng dưới nhẹ..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-500">Phí buổi tập:</span>
                <span className="text-base font-extrabold text-blue-700 font-mono">
                  {formatVND(selectedTrainer.hourlyRate)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTrainer(null)}
                disabled={bookingPt}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleBookPt}
                disabled={bookingPt}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5"
              >
                {bookingPt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Xác nhận đặt lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
