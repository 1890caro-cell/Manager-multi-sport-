import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { setAuthToken } from '../../api/client';

export const ProfileScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('Nguyễn Văn A');
  const [phone] = useState('0901234567');
  const [email, setEmail] = useState('nguyenvana@gmail.com');

  // Company VAT info (M08)
  const [companyName, setCompanyName] = useState('Công ty Cổ phần Công nghệ XYZ');
  const [taxCode, setTaxCode] = useState('0312345678');
  const [companyAddress, setCompanyAddress] = useState('123 Nguyễn Huệ, Quận 1, TP.HCM');
  const [invoiceEmail, setInvoiceEmail] = useState('ketoan@xyz.com.vn');

  // App Settings
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [znsEnabled, setZnsEnabled] = useState(true);

  const handleSaveProfile = () => {
    Alert.alert('Thành công', 'Thông tin cá nhân và hồ sơ xuất HĐĐT doanh nghiệp đã được cập nhật.');
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          setAuthToken(null);
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Tài khoản hội viên" subtitle="Hồ sơ cá nhân & Cấu hình VAT" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userPhone}>{phone}</Text>
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>HỘI VIÊN VIP UNLIMITED</Text>
            </View>
          </View>
        </View>

        {/* Personal Details */}
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#71717a"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email cá nhân</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#71717a"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Company VAT Info (F08.2) */}
        <Text style={styles.sectionTitle}>Thông tin xuất Hóa đơn điện tử VAT (Doanh nghiệp)</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên cơ quan / Công ty</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Công ty TNHH..."
              placeholderTextColor="#71717a"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mã số thuế (MST)</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Courier' }]}
              value={taxCode}
              onChangeText={setTaxCode}
              placeholder="0312345678"
              placeholderTextColor="#71717a"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ trụ sở đăng ký</Text>
            <TextInput
              style={styles.input}
              value={companyAddress}
              onChangeText={setCompanyAddress}
              placeholder="Số nhà, đường, phường, quận..."
              placeholderTextColor="#71717a"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email nhận hóa đơn đỏ</Text>
            <TextInput
              style={styles.input}
              value={invoiceEmail}
              onChangeText={setInvoiceEmail}
              placeholder="ketoan@company.com"
              placeholderTextColor="#71717a"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Lưu thông tin</Text>
          </TouchableOpacity>
        </View>

        {/* Security & Preferences */}
        <Text style={styles.sectionTitle}>Cài đặt bảo mật & Thông báo</Text>
        <View style={styles.formCard}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Khóa bằng FaceID / Vân tay</Text>
              <Text style={styles.switchDesc}>Mở khóa ứng dụng và xác nhận giao dịch ví</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#27272a', true: '#10b981' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Thông báo đẩy (Push)</Text>
              <Text style={styles.switchDesc}>Nhắc giờ đặt sân và lịch lớp</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#27272a', true: '#10b981' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Thông báo Zalo ZNS</Text>
              <Text style={styles.switchDesc}>Nhận biên lai và mã OTP qua Zalo</Text>
            </View>
            <Switch
              value={znsEnabled}
              onValueChange={setZnsEnabled}
              trackColor={{ false: '#27272a', true: '#10b981' }}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>🚪 Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 14,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  userPhone: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 2,
  },
  vipBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  vipBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  input: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f4f4f5',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  switchDesc: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
  },
  logoutBtn: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
