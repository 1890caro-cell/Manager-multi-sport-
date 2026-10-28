import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { api } from '../../api/client';

export const NotificationsScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.getAll();
      if (res && res.length > 0) {
        setNotifications(res);
      } else {
        setNotifications([
          {
            id: 'ntf_1',
            title: 'Đặt sân thành công!',
            content: 'Lịch đặt Sân bóng đá số 1 lúc 18:00 - 19:30 ngày 28/10 đã được xác nhận. Tiền cọc 180.000 đ đã trừ vào ví.',
            eventType: 'BOOKING_CONFIRMED',
            createdAt: '10 phút trước',
            isRead: false,
            icon: '⚽',
          },
          {
            id: 'ntf_2',
            title: 'Biến động số dư ví nội bộ',
            content: 'Tài khoản ví vừa được cộng +500.000 đ từ giao dịch nạp tiền VietQR Napas (TX-1001).',
            eventType: 'WALLET_TOPUP',
            createdAt: '2 giờ trước',
            isRead: false,
            icon: '💳',
          },
          {
            id: 'ntf_3',
            title: 'Nhắc nhở lịch tập Yoga',
            content: 'Lớp Yoga Hatha của bạn sẽ diễn ra vào lúc 06:30 sáng mai tại Phòng Studio 1. Vui lòng đến trước 10 phút.',
            eventType: 'CLASS_REMINDER',
            createdAt: 'Hôm qua',
            isRead: true,
            icon: '🧘‍♀️',
          },
          {
            id: 'ntf_4',
            title: 'Hóa đơn điện tử VAT đã phát hành',
            content: 'Hóa đơn điện tử số HD-20261026-001 (VAT 8%) cho đơn đặt sân của bạn đã được gửi về email doanh nghiệp.',
            eventType: 'INVOICE_ISSUED',
            createdAt: '2 ngày trước',
            isRead: true,
            icon: '🧾',
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await api.notifications.markAsRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.notifications.markAllAsRead();
    } catch {
      // ignore
    }
  };

  const filtered = notifications.filter((n) => (!filterUnreadOnly ? true : !n.isRead));

  return (
    <View style={styles.container}>
      <TopBar title="Hộp thư thông báo" subtitle="Thông báo giao dịch & Lịch thi đấu" />

      {/* Action Header */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.filterChip, filterUnreadOnly && styles.filterChipActive]}
          onPress={() => setFilterUnreadOnly(!filterUnreadOnly)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filterUnreadOnly && styles.filterTextActive]}>
            {filterUnreadOnly ? '✓ Đang lọc: Chưa đọc' : 'Chỉ tin chưa đọc'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={styles.markAllText}>Đọc tất cả</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 32 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Không có thông báo mới</Text>
            <Text style={styles.emptySub}>Mọi cập nhật về lịch sân, ví và lớp học sẽ xuất hiện tại đây.</Text>
          </View>
        ) : (
          filtered.map((ntf) => (
            <TouchableOpacity
              key={ntf.id}
              style={[styles.notifCard, !ntf.isRead && styles.notifCardUnread]}
              onPress={() => handleMarkAsRead(ntf.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{ntf.icon || '🔔'}</Text>
              </View>

              <View style={styles.notifBody}>
                <View style={styles.titleRow}>
                  <Text style={styles.notifTitle}>{ntf.title}</Text>
                  {!ntf.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifContent}>{ntf.content}</Text>
                <Text style={styles.notifTime}>{ntf.createdAt}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  filterText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
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
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  notifCardUnread: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  notifBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  notifContent: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
    marginTop: 4,
  },
  notifTime: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 6,
  },
});
