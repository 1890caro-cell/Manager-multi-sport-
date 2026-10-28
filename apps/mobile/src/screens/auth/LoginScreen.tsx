import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { api } from '../../api/client';

export const LoginScreen = ({ navigation }: any) => {
  const [phone, setPhone] = useState('0901234567');
  const [password, setPassword] = useState('HoiVien@2026');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      await api.auth.login(phone, password);
      navigation.replace('MainTabs');
    } catch (err: any) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Số điện thoại hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = () => {
    // FaceID / Fingerprint simulation
    Alert.alert(
      'Xác thực Sinh trắc học',
      'Đăng nhập bằng FaceID / Vân tay thành công!',
      [
        {
          text: 'Vào ứng dụng',
          onPress: () => navigation.replace('MainTabs'),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo & Intro */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>AGY</Text>
          </View>
          <Text style={styles.appName}>ANTIGRAVITY SPORTS</Text>
          <Text style={styles.appTagline}>Tổ hợp Thể thao & Giải trí Hiện đại</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Đăng nhập hội viên</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0901234567"
              placeholderTextColor="#71717a"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#71717a"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometricAuth}
            activeOpacity={0.7}
          >
            <Text style={styles.biometricText}>🔐 Đăng nhập bằng FaceID / Vân tay</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản hội viên? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f4f4f5',
    marginTop: 14,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f4f4f5',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  biometricBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#27272a',
  },
  biometricText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#71717a',
    fontSize: 13,
  },
  registerLink: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
});
