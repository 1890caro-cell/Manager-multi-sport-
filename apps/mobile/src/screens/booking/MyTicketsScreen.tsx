import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { api } from '../../api/client';
import { formatVND } from '../../utils/format';
import { generateIdempotencyKey } from '../../utils/idempotency';

export const MyTicketsScreen = ({ navigation }: any) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<any | null>(null);
  const [selectedTicketForCancel, setSelectedTicketForCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Bận việc đột xuất');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.booking.getMyBookings();
      if (res && res.length > 0) {
        setTickets(res);
      } else {
        // Fallback demo tickets
        setTickets([
          {
            id: 'BK-789123',
            courtName: 'Sân bóng đá số 1 (7 người)',
            sport: 'Bóng đá',
            date: '28/10/2026',
            time: '18:00 - 19:30 (3 slots)',
            depositAmount: 180000,
            totalAmount: 600000,
            status: 'CONFIRMED',
            qrCheckIn: 'AGY-TKT-BK789123-SECURE',
          },
          {
            id: 'BK-542110',
            courtName: 'Sân Pickleball Pro 2',
            sport: 'Pickleball',
            date: '25/10/2026',
            time: '16:00 - 17:00 (2 slots)',
            depositAmount: 90000,
            totalAmount: 300000,
            status: 'COMPLETED',
            qrCheckIn: 'AGY-TKT-BK542110-DONE',
          },
        ]);
      }
    } catch {
      setTickets([
        {
          id: 'BK-789123',
          courtName: 'Sân bóng đá số 1 (7 người)',
          sport: 'Bóng đá',
          date: '28/10/2026',
          time: '18:00 - 19:30 (3 slots)',
          depositAmount: 180000,
          totalAmount: 600000,
          status: 'CONFIRMED',
          qrCheckIn: 'AGY-TKT-BK789123-SECURE',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleConfirmCancel = async () => {
    if (!selectedTicketForCancel) return;
    try {
      await api.booking.cancelBooking(
        selectedTicketForCancel.id,
        cancelReason,
        generateIdempotencyKey(),
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicketForCancel.id ? { ...t, status: 'CANCELLED' } : t)),
      );
      const refunded = selectedTicketForCancel.depositAmount;
      setSelectedTicketForCancel(null);
      Alert.alert(
        'Đã hủy lịch đặt sân',
        `Đơn hủy thành công. Tiền cọc ${formatVND(refunded)} đã được hoàn về Ví nội bộ theo chính sách hoàn cọc.`,
      );
    } catch (err: any) {
      Alert.alert('Lỗi hủy', err.message || 'Không thể hủy lịch đặt sân');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'UPCOMING') return t.status === 'CONFIRMED' || t.status === 'HELD';
    if (activeTab === 'COMPLETED') return t.status === 'COMPLETED';
    return t.status === 'CANCELLED';
  });

  return (
    <View style={styles.container}>
      <TopBar title="Vé của tôi" subtitle="Mã QR Check-in & Chính sách cọc" />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { id: 'UPCOMING', label: 'Sắp tới' },
          { id: 'COMPLETED', label: 'Hoàn tất' },
          { id: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 32 }} />
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
            <Text style={styles.emptySub}>Các trận thi đấu sắp diễn ra sẽ xuất hiện tại đây.</Text>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('Booking')}
              activeOpacity={0.8}
            >
              <Text style={styles.bookNowText}>Đặt sân ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketSport}>{ticket.sport}</Text>
                  <Text style={styles.ticketCourt}>{ticket.courtName}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {ticket.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : ticket.status}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Ngày thi đấu:</Text>
                  <Text style={styles.detailVal}>{ticket.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Khung giờ:</Text>
                  <Text style={styles.detailVal}>{ticket.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Đã cọc trước (30%):</Text>
                  <Text style={styles.depositVal}>{formatVND(ticket.depositAmount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Còn lại trả tại quầy:</Text>
                  <Text style={styles.detailVal}>
                    {formatVND(ticket.totalAmount - ticket.depositAmount)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              {ticket.status === 'CONFIRMED' && (
                <View style={styles.ticketActions}>
                  <TouchableOpacity
                    style={styles.cancelTicketBtn}
                    onPress={() => setSelectedTicketForCancel(ticket)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelTicketText}>Hủy & Hoàn cọc</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.qrCheckInBtn}
                    onPress={() => setSelectedTicketForQr(ticket)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.qrCheckInText}>📱 Mã QR Check-in</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* QR Check-in Modal */}
      {selectedTicketForQr && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedTicketForQr(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.qrModalCard}>
              <Text style={styles.qrModalTitle}>Mã Check-in Nhận sân</Text>
              <Text style={styles.qrModalSub}>Quét tại quầy lễ tân hoặc cổng tự động</Text>

              <View style={styles.qrSquare}>
                <View style={styles.qrCornerMockTL} />
                <View style={styles.qrCornerMockTR} />
                <View style={styles.qrCornerMockBL} />
                <Text style={styles.qrCodeText}>CHECK-IN PASS</Text>
                <Text style={styles.qrCodeId}>{selectedTicketForQr.id}</Text>
              </View>

              <Text style={styles.qrInfoCourt}>{selectedTicketForQr.courtName}</Text>
              <Text style={styles.qrInfoTime}>{selectedTicketForQr.time} • {selectedTicketForQr.date}</Text>

              <TouchableOpacity
                style={styles.closeQrBtn}
                onPress={() => setSelectedTicketForQr(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeQrText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Cancellation Confirmation Modal */}
      {selectedTicketForCancel && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTicketForCancel(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.cancelModalCard}>
              <Text style={styles.cancelModalTitle}>Xác nhận hủy đặt sân</Text>
              <Text style={styles.cancelModalNotice}>
                Chính sách: Hủy trước 24 giờ sẽ được hoàn 100% tiền cọc vào Ví nội bộ ngay lập tức.
              </Text>

              <View style={styles.refundAmountBox}>
                <Text style={styles.refundAmountLabel}>Số tiền hoàn cọc dự kiến:</Text>
                <Text style={styles.refundAmountVal}>
                  {formatVND(selectedTicketForCancel.depositAmount)}
                </Text>
              </View>

              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  style={styles.backModalBtn}
                  onPress={() => setSelectedTicketForCancel(null)}
                >
                  <Text style={styles.backModalText}>Giữ lại vé</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={handleConfirmCancel}
                >
                  <Text style={styles.confirmCancelText}>Xác nhận hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#18181b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabBtnActive: {
    backgroundColor: '#27272a',
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  emptySub: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
    textAlign: 'center',
  },
  bookNowBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  bookNowText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 12,
  },
  ticketSport: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ticketCourt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  ticketDetails: {
    paddingVertical: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailKey: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  depositVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
  },
  cancelTicketBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
  },
  cancelTicketText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  qrCheckInBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  qrCheckInText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  qrModalCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  qrModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  qrModalSub: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
  },
  qrSquare: {
    width: 180,
    height: 180,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrCornerMockTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderWidth: 5,
    borderColor: '#09090b',
  },
  qrCornerMockTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderWidth: 5,
    borderColor: '#09090b',
  },
  qrCornerMockBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 30,
    height: 30,
    borderWidth: 5,
    borderColor: '#09090b',
  },
  qrCodeText: {
    color: '#09090b',
    fontSize: 10,
    fontWeight: '900',
  },
  qrCodeId: {
    color: '#10b981',
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  qrInfoCourt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  qrInfoTime: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeQrBtn: {
    backgroundColor: '#27272a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  closeQrText: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelModalCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cancelModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  cancelModalNotice: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginTop: 8,
  },
  refundAmountBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  refundAmountLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  refundAmountVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  backModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#27272a',
    alignItems: 'center',
  },
  backModalText: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
