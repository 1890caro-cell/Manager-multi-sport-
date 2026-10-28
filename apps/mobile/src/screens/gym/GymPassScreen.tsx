import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { DynamicQrPass } from '../../components/DynamicQrPass';
import { VietQrModal } from '../../components/VietQrModal';
import { formatVND } from '../../utils/format';
import { generateIdempotencyKey } from '../../utils/idempotency';

const GYM_PLANS = [
  {
    id: 'plan_1m',
    name: 'Gói 1 Tháng Tiêu chuẩn',
    duration: '30 ngày',
    price: 650000,
    perks: ['Không giới hạn giờ tập', 'Tủ đồ locker thông minh', 'Tắm nóng lạnh & Sauna'],
  },
  {
    id: 'plan_3m',
    name: 'Gói 3 Tháng Tiết kiệm',
    duration: '90 ngày',
    price: 1800000,
    perks: ['Tặng 1 buổi định hướng với HLV', 'Bao gồm toàn bộ tiện ích', 'Giảm 10% đồ uống Canteen'],
  },
  {
    id: 'plan_12m',
    name: 'Gói 12 Tháng VIP Unlimited',
    duration: '365 ngày',
    price: 5500000,
    perks: ['Tặng 3 buổi PT 1-1', 'Thẻ RFID vật lý cao cấp', 'Ưu tiên đặt slot giờ vàng'],
  },
];

export const GymPassScreen = ({ navigation }: any) => {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showVietQr, setShowVietQr] = useState<boolean>(false);

  const handleBuyPlan = (plan: any) => {
    setSelectedPlan(plan);
    Alert.alert(
      `Đăng ký ${plan.name}`,
      `Tổng thanh toán: ${formatVND(plan.price)}. Chọn hình thức thanh toán:`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Trừ Ví nội bộ',
          onPress: () => {
            Alert.alert(
              'Thành công',
              `Gói tập ${plan.name} đã được kích hoạt thành công! Hạn dùng: ${plan.duration}.`,
            );
          },
        },
        {
          text: 'VietQR Chuyển khoản',
          onPress: () => setShowVietQr(true),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <TopBar title="Thẻ tập & Cổng Gym" subtitle="Dynamic QR TOTP chống Anti-Passback" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dynamic QR Turnstile Pass */}
        <DynamicQrPass
          memberId="MBR-998822"
          memberName="Nguyễn Văn A"
          planName="Thẻ Năm VIP Unlimited"
          expiresDate="31/12/2026"
        />

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Hướng dẫn qua cổng Flap Barrier:</Text>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>Đưa màn hình điện thoại vào mắt quét của cổng xoay trong khoảng cách 10 - 15cm.</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>Đèn báo xanh chuyển sang mở cánh flap trong thời gian thực (dưới 200ms).</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>Mỗi mã QR chỉ sử dụng một lần cho một người; không quét quay vòng liên tiếp (Anti-Passback).</Text>
          </View>
        </View>

        {/* Membership Plans */}
        <Text style={styles.sectionTitle}>Các gói tập hội viên</Text>
        <View style={styles.plansList}>
          {GYM_PLANS.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDuration}>Thời hạn: {plan.duration}</Text>
                </View>
                <Text style={styles.planPrice}>{formatVND(plan.price)}</Text>
              </View>

              <View style={styles.perksList}>
                {plan.perks.map((perk, idx) => (
                  <View key={idx} style={styles.perkItem}>
                    <Text style={styles.perkCheck}>✓</Text>
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.buyPlanBtn}
                onPress={() => handleBuyPlan(plan)}
                activeOpacity={0.8}
              >
                <Text style={styles.buyPlanText}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* VietQR Modal */}
      {selectedPlan && showVietQr && (
        <VietQrModal
          visible={showVietQr}
          onClose={() => setShowVietQr(false)}
          amount={selectedPlan.price}
          transferContent={`GYM${generateIdempotencyKey().slice(-6).toUpperCase()}`}
          onPaidSuccess={() => {
            setShowVietQr(false);
            Alert.alert(
              'Thanh toán hoàn tất',
              `Gói tập ${selectedPlan.name} đã được kích hoạt thành công vào thẻ hội viên của bạn!`,
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
    gap: 20,
  },
  instructionCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 10,
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumber: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 12,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  planDuration: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  perksList: {
    paddingVertical: 12,
    gap: 6,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkCheck: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 12,
  },
  perkText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  buyPlanBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buyPlanText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
