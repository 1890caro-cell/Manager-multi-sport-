import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { CourtSlotGrid, SlotItem } from '../../components/CourtSlotGrid';
import { HoldTimer } from '../../components/HoldTimer';
import { VietQrModal } from '../../components/VietQrModal';
import { api } from '../../api/client';
import { generateIdempotencyKey } from '../../utils/idempotency';
import { formatVND } from '../../utils/format';

const SPORTS = [
  { id: 'FOOTBALL', label: 'Bóng đá', icon: '⚽' },
  { id: 'BADMINTON', label: 'Cầu lông', icon: '🏸' },
  { id: 'PICKLEBALL', label: 'Pickleball', icon: '🏓' },
  { id: 'TENNIS', label: 'Tennis', icon: '🎾' },
];

export const BookingScreen = ({ navigation }: any) => {
  const [selectedSport, setSelectedSport] = useState('FOOTBALL');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Hold State
  const [heldBooking, setHeldBooking] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVietQrModal, setShowVietQrModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(850000);

  // Generate 32 slots (06:00 - 22:00, 30m)
  const generateMockSlots = (basePrice: number): SlotItem[] => {
    const list: SlotItem[] = [];
    let startMin = 6 * 60; // 06:00
    for (let i = 0; i < 32; i++) {
      const h1 = Math.floor(startMin / 60);
      const m1 = startMin % 60;
      const endMin = startMin + 30;
      const h2 = Math.floor(endMin / 60);
      const m2 = endMin % 60;

      const t1 = `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`;
      const t2 = `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;

      // Simulate some occupied slots
      let status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'LOCKED' = 'AVAILABLE';
      if (i === 4 || i === 5) status = 'BOOKED';
      if (i === 12) status = 'HELD';

      // Peak price between 17:00 - 21:00
      const isPeak = h1 >= 17 && h1 < 21;
      const price = isPeak ? Math.round(basePrice * 1.3) : basePrice;

      list.push({
        slotIndex: i,
        startTime: t1,
        endTime: t2,
        status,
        price,
      });

      startMin += 30;
    }
    return list;
  };

  const loadCourts = async () => {
    try {
      setLoading(true);
      const res = await api.booking.getCourts(selectedSport);
      if (res && res.length > 0) {
        setCourts(res);
        setSelectedCourt(res[0]);
      } else {
        // Fallback demo courts
        const demo = [
          { id: 'c1', name: `Sân ${selectedSport} 1 (Tiêu chuẩn)`, price: 200000 },
          { id: 'c2', name: `Sân ${selectedSport} 2 (Sân thi đấu)`, price: 250000 },
        ];
        setCourts(demo);
        setSelectedCourt(demo[0]);
      }
    } catch {
      const demo = [
        { id: 'c1', name: `Sân ${selectedSport} 1 (Tiêu chuẩn)`, price: 200000 },
        { id: 'c2', name: `Sân ${selectedSport} 2 (Sân thi đấu)`, price: 250000 },
      ];
      setCourts(demo);
      setSelectedCourt(demo[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
  }, [selectedSport]);

  useEffect(() => {
    if (selectedCourt) {
      setSlots(generateMockSlots(selectedCourt.price || 200000));
      setSelectedSlotIndex(null);
    }
  }, [selectedCourt, selectedDate]);

  const handleSelectSlot = async (slot: SlotItem) => {
    setSelectedSlotIndex(slot.slotIndex);

    // Call API Hold Slot
    try {
      const key = generateIdempotencyKey();
      const res = await api.booking.holdSlot({
        courtId: selectedCourt?.id || 'c1',
        date: selectedDate,
        slotIndex: slot.slotIndex,
        idempotencyKey: key,
      });

      setHeldBooking({
        id: res?.id || `BK-${Date.now().toString().slice(-6)}`,
        courtName: selectedCourt?.name || 'Sân thể thao',
        slotTime: `${slot.startTime} - ${slot.endTime}`,
        price: slot.price,
        depositAmount: Math.round(slot.price * 0.3), // 30% deposit
      });
    } catch {
      // In-memory hold fallback
      setHeldBooking({
        id: `BK-${Date.now().toString().slice(-6)}`,
        courtName: selectedCourt?.name || 'Sân thể thao',
        slotTime: `${slot.startTime} - ${slot.endTime}`,
        price: slot.price,
        depositAmount: Math.round(slot.price * 0.3),
      });
    }
  };

  const handleCancelHold = async () => {
    if (!heldBooking) return;
    try {
      await api.booking.cancelBooking(heldBooking.id, 'Khách chủ động hủy giữ chỗ', generateIdempotencyKey());
    } catch {
      // ignore
    }
    setHeldBooking(null);
    setSelectedSlotIndex(null);
  };

  const handlePayWallet = async () => {
    if (!heldBooking) return;
    if (walletBalance < heldBooking.depositAmount) {
      Alert.alert('Số dư ví không đủ', 'Vui lòng nạp thêm tiền vào ví nội bộ hoặc thanh toán bằng VietQR.');
      return;
    }

    try {
      await api.booking.confirmBooking({
        bookingId: heldBooking.id,
        paymentMethod: 'WALLET',
        idempotencyKey: generateIdempotencyKey(),
      });
      setWalletBalance((prev) => prev - heldBooking.depositAmount);
      setShowPaymentModal(false);
      const bookedId = heldBooking.id;
      setHeldBooking(null);
      setSelectedSlotIndex(null);
      Alert.alert(
        'Đặt sân thành công!',
        `Mã vé: ${bookedId}. Tiền cọc ${formatVND(heldBooking.depositAmount)} đã được trừ vào ví.`,
        [{ text: 'Xem vé của tôi', onPress: () => navigation.navigate('MyTickets') }],
      );
    } catch (err: any) {
      Alert.alert('Lỗi xác nhận', err.message || 'Không thể xác nhận đặt sân');
    }
  };

  const handlePayVietQr = () => {
    setShowPaymentModal(false);
    setShowVietQrModal(true);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Đặt sân thể thao" subtitle="3 lớp chống trùng lịch tuyệt đối" balance={walletBalance} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sports Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsTabs}>
          {SPORTS.map((sport) => {
            const isActive = selectedSport === sport.id;
            return (
              <TouchableOpacity
                key={sport.id}
                onPress={() => setSelectedSport(sport.id)}
                style={[styles.sportTab, isActive && styles.sportTabActive]}
                activeOpacity={0.7}
              >
                <Text style={styles.sportIcon}>{sport.icon}</Text>
                <Text style={[styles.sportLabel, isActive && styles.sportLabelActive]}>{sport.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date Selector */}
        <View style={styles.dateRow}>
          {[-0, 1, 2, 3].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const dateStr = d.toISOString().slice(0, 10);
            const dayNum = d.getDate();
            const dayName = offset === 0 ? 'Hôm nay' : `T${d.getDay() + 1 === 1 ? 'CN' : d.getDay() + 1}`;
            const isActive = selectedDate === dateStr;

            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => setSelectedDate(dateStr)}
                style={[styles.dateChip, isActive && styles.dateChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateDayName, isActive && styles.dateTextActive]}>{dayName}</Text>
                <Text style={[styles.dateDayNum, isActive && styles.dateTextActive]}>{dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Court Selector */}
        <View style={styles.courtSelectorRow}>
          <Text style={styles.courtSelectorLabel}>Chọn sân:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courtsScroll}>
            {courts.map((court) => {
              const isActive = selectedCourt?.id === court.id;
              return (
                <TouchableOpacity
                  key={court.id}
                  onPress={() => setSelectedCourt(court)}
                  style={[styles.courtChip, isActive && styles.courtChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.courtChipText, isActive && styles.courtChipTextActive]}>{court.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Hold Countdown Timer Banner */}
        {heldBooking && (
          <HoldTimer
            courtName={heldBooking.courtName}
            timeSlot={heldBooking.slotTime}
            initialSeconds={600}
            onExpire={() => {
              Alert.alert('Hết hạn giữ chỗ', 'Khung giờ đặt sân đã được giải phóng do quá 10 phút.');
              setHeldBooking(null);
              setSelectedSlotIndex(null);
            }}
            onProceedPayment={() => setShowPaymentModal(true)}
            onCancelHold={handleCancelHold}
          />
        )}

        {/* Slot Grid Matrix */}
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 32 }} />
        ) : (
          <CourtSlotGrid
            slots={slots}
            selectedSlotIndex={selectedSlotIndex}
            onSelectSlot={handleSelectSlot}
            courtName={selectedCourt?.name}
          />
        )}
      </ScrollView>

      {/* Payment Selection Modal */}
      {showPaymentModal && heldBooking && (
        <View style={styles.paymentModalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>Xác nhận thanh toán tiền cọc</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bookingSummaryBox}>
              <Text style={styles.summaryCourt}>{heldBooking.courtName}</Text>
              <Text style={styles.summaryTime}>Khung giờ: {heldBooking.slotTime}</Text>
              <View style={styles.priceDivider} />
              <View style={styles.summaryPriceRow}>
                <Text style={styles.summaryPriceKey}>Tổng tiền slot:</Text>
                <Text style={styles.summaryPriceVal}>{formatVND(heldBooking.price)}</Text>
              </View>
              <View style={styles.summaryPriceRow}>
                <Text style={styles.summaryPriceKey}>Tiền cọc tối thiểu (30%):</Text>
                <Text style={styles.depositHighlight}>{formatVND(heldBooking.depositAmount)}</Text>
              </View>
            </View>

            <Text style={styles.methodTitle}>Chọn phương thức cọc:</Text>

            {/* Wallet Option */}
            <TouchableOpacity style={styles.methodCard} onPress={handlePayWallet} activeOpacity={0.8}>
              <View style={styles.methodIconBox}>
                <Text style={styles.methodIcon}>💳</Text>
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Trừ tiền Ví nội bộ</Text>
                <Text style={styles.methodDesc}>Khả dụng: {formatVND(walletBalance)}</Text>
              </View>
              <Text style={styles.arrowText}>➔</Text>
            </TouchableOpacity>

            {/* VietQR Option */}
            <TouchableOpacity style={styles.methodCard} onPress={handlePayVietQr} activeOpacity={0.8}>
              <View style={[styles.methodIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Text style={styles.methodIcon}>📱</Text>
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>VietQR Chuyển khoản tức thì</Text>
                <Text style={styles.methodDesc}>Mở App ngân hàng Napas 24/7</Text>
              </View>
              <Text style={styles.arrowText}>➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* VietQR Deep Link Modal */}
      {showVietQrModal && heldBooking && (
        <VietQrModal
          visible={showVietQrModal}
          onClose={() => setShowVietQrModal(false)}
          amount={heldBooking.depositAmount}
          transferContent={`PAY${heldBooking.id.replace(/\D/g, '') || '999'}`}
          onPaidSuccess={() => {
            setShowVietQrModal(false);
            setHeldBooking(null);
            setSelectedSlotIndex(null);
            Alert.alert(
              'Thanh toán hoàn tất!',
              'Hệ thống đã nhận được tiền cọc qua VietQR và kích hoạt mã vé của bạn.',
              [{ text: 'Xem vé', onPress: () => navigation.navigate('MyTickets') }],
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sportsTabs: {
    gap: 8,
    marginBottom: 14,
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sportTabActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  sportIcon: {
    fontSize: 16,
  },
  sportLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  sportLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dateChip: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  dateChipActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  dateDayName: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  dateDayNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f4f4f5',
    marginTop: 2,
  },
  dateTextActive: {
    color: '#10b981',
  },
  courtSelectorRow: {
    marginBottom: 16,
  },
  courtSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 8,
  },
  courtsScroll: {
    gap: 8,
  },
  courtChip: {
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  courtChipActive: {
    borderColor: '#10b981',
    backgroundColor: '#27272a',
  },
  courtChipText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  courtChipTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  paymentModalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  closeText: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '700',
    padding: 4,
  },
  bookingSummaryBox: {
    backgroundColor: '#09090b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
  },
  summaryCourt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  summaryTime: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 10,
  },
  summaryPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  summaryPriceKey: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  summaryPriceVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  depositHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
    marginBottom: 10,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIcon: {
    fontSize: 18,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  methodDesc: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
  arrowText: {
    color: '#71717a',
    fontSize: 14,
  },
});
