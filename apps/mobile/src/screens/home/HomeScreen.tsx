import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { api } from '../../api/client';
import { formatVND } from '../../utils/format';

export const HomeScreen = ({ navigation }: any) => {
  const [capacity, setCapacity] = useState<{ currentCount: number; maxCapacity: number; percentage: number }>({
    currentCount: 38,
    maxCapacity: 100,
    percentage: 38,
  });
  const [walletBalance, setWalletBalance] = useState<number>(850000);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [capRes, walRes] = await Promise.allSettled([
        api.gym.getCapacity(),
        api.wallet.getMyWallet(),
      ]);
      if (capRes.status === 'fulfilled' && capRes.value) {
        setCapacity(capRes.value);
      }
      if (walRes.status === 'fulfilled' && walRes.value) {
        setWalletBalance(walRes.value.available || walRes.value.balance || 0);
      }
    } catch {
      // Keep state defaults
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCapacityStatus = (percent: number) => {
    if (percent >= 90) return { label: 'Rất đông (Gần đầy)', color: '#ef4444' };
    if (percent >= 60) return { label: 'Khá đông', color: '#f59e0b' };
    return { label: 'Thoáng đãng', color: '#10b981' };
  };

  const status = getCapacityStatus(capacity.percentage);

  return (
    <View style={styles.container}>
      <TopBar
        title="Antigravity Sports"
        subtitle="Tổ hợp thể thao cao cấp"
        balance={walletBalance}
        unreadCount={2}
        onPressNotification={() => navigation.navigate('Notifications')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#10b981" />}
      >
        {/* Live Gym Capacity Banner */}
        <TouchableOpacity
          style={styles.capacityCard}
          onPress={() => navigation.navigate('GymPass')}
          activeOpacity={0.85}
        >
          <View style={styles.capacityHeader}>
            <View>
              <View style={styles.liveBadgeRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>SỨC CHỨA PHÒNG GYM THỜI GIAN THỰC</Text>
              </View>
              <Text style={styles.capacityCount}>
                {capacity.currentCount}
                <Text style={styles.capacityMax}> / {capacity.maxCapacity} người</Text>
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(capacity.percentage, 100)}%`, backgroundColor: status.color },
              ]}
            />
          </View>

          <View style={styles.capacityFooter}>
            <Text style={styles.capacityHint}>Cổng Flap Barrier tự động điều tiết an toàn</Text>
            <Text style={styles.capacityAction}>Mở mã quét QR ➔</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Tiện ích nhanh</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Booking')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={styles.quickIcon}>⚽</Text>
            </View>
            <Text style={styles.quickLabel}>Đặt sân thể thao</Text>
            <Text style={styles.quickSub}>30p/slot chống trùng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Text style={styles.quickIcon}>💳</Text>
            </View>
            <Text style={styles.quickLabel}>Nạp ví VietQR</Text>
            <Text style={styles.quickSub}>Khớp lệnh tự động 24/7</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('GymPass')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={styles.quickIcon}>📱</Text>
            </View>
            <Text style={styles.quickLabel}>Dynamic QR Pass</Text>
            <Text style={styles.quickSub}>Vào cổng Turnstile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('MyTickets')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Text style={styles.quickIcon}>🎫</Text>
            </View>
            <Text style={styles.quickLabel}>Vé của tôi</Text>
            <Text style={styles.quickSub}>QR check-in & hoàn tiền</Text>
          </TouchableOpacity>
        </View>

        {/* Sports & Facilities Carousel / Cards */}
        <Text style={styles.sectionTitle}>Các bộ môn thể thao tiêu chuẩn</Text>
        <View style={styles.facilitiesList}>
          {[
            {
              id: 'football',
              name: 'Sân bóng đá cỏ nhân tạo',
              spec: 'Cỏ FIFA Quality Pro • Đèn LED 500 Lux',
              price: 'Từ 200.000 đ/slot',
              icon: '⚽',
            },
            {
              id: 'badminton',
              name: 'Sân cầu lông thảm Vinyl',
              spec: 'Thảm thi đấu Yonex • Chống chói lóa',
              price: 'Từ 80.000 đ/slot',
              icon: '🏸',
            },
            {
              id: 'pickleball',
              name: 'Cụm sân Pickleball chuẩn Mỹ',
              spec: 'Mặt sơn Acrylic 8 lớp • Lưới Pro',
              price: 'Từ 120.000 đ/slot',
              icon: '🏓',
            },
            {
              id: 'tennis',
              name: 'Sân Tennis mặt sân cứng',
              spec: 'Tiêu chuẩn ATP • Hệ thống thoát nước',
              price: 'Từ 180.000 đ/slot',
              icon: '🎾',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.facilityItem}
              onPress={() => navigation.navigate('Booking')}
              activeOpacity={0.8}
            >
              <View style={styles.facilityIconBox}>
                <Text style={styles.facilityIcon}>{item.icon}</Text>
              </View>
              <View style={styles.facilityInfo}>
                <Text style={styles.facilityName}>{item.name}</Text>
                <Text style={styles.facilitySpec}>{item.spec}</Text>
                <Text style={styles.facilityPrice}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Classes & Tournaments Row */}
        <View style={styles.promoRow}>
          <TouchableOpacity
            style={styles.promoCard}
            onPress={() => navigation.navigate('Classes')}
            activeOpacity={0.8}
          >
            <Text style={styles.promoBadge}>LỚP HỌC NHÓM</Text>
            <Text style={styles.promoTitle}>Yoga, Zumba & HIIT</Text>
            <Text style={styles.promoSub}>Đăng ký nhận ưu đãi 20%</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.promoCard}
            onPress={() => navigation.navigate('Tournaments')}
            activeOpacity={0.8}
          >
            <Text style={[styles.promoBadge, { color: '#3b82f6' }]}>GIẢI ĐẤU</Text>
            <Text style={styles.promoTitle}>Antigravity Cup 2026</Text>
            <Text style={styles.promoSub}>Giải thưởng 50.000.000 đ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  capacityCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 24,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  capacityCount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f4f4f5',
    marginTop: 4,
  },
  capacityMax: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  capacityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  capacityHint: {
    fontSize: 11,
    color: '#71717a',
  },
  capacityAction: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  quickIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickIcon: {
    fontSize: 18,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  quickSub: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
  facilitiesList: {
    gap: 10,
    marginBottom: 24,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 14,
  },
  facilityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityIcon: {
    fontSize: 22,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  facilitySpec: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
  facilityPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 4,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  promoCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  promoBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  promoSub: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
});
