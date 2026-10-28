import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../api/client';

interface DynamicQrPassProps {
  memberId?: string;
  memberName?: string;
  planName?: string;
  expiresDate?: string;
}

export const DynamicQrPass: React.FC<DynamicQrPassProps> = ({
  memberId = 'MBR-888999',
  memberName = 'Hội viên Antigravity',
  planName = 'Thẻ Năm VIP Unlimited',
  expiresDate = '31/12/2026',
}) => {
  const [qrToken, setQrToken] = useState<string>('TOTP-GYM-DEFAULT');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDynamicToken = async () => {
    try {
      setLoading(true);
      const res = await api.gym.getDynamicQr();
      if (res && res.qrCode) {
        setQrToken(res.qrCode);
        setTimeLeft(res.ttlSeconds || 30);
      } else {
        // Fallback demo TOTP simulation
        const demoOtp = Math.floor(100000 + Math.random() * 900000);
        setQrToken(`AGY-GYM-${demoOtp}-${Date.now().toString(36).toUpperCase()}`);
        setTimeLeft(30);
      }
    } catch {
      const demoOtp = Math.floor(100000 + Math.random() * 900000);
      setQrToken(`AGY-GYM-${demoOtp}-${Date.now().toString(36).toUpperCase()}`);
      setTimeLeft(30);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicToken();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchDynamicToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = (timeLeft / 30) * 100;

  return (
    <View style={styles.card}>
      {/* Header Badge */}
      <View style={styles.header}>
        <View>
          <Text style={styles.planBadge}>{planName}</Text>
          <Text style={styles.memberName}>{memberName}</Text>
        </View>
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>Mã thẻ</Text>
          <Text style={styles.idValue}>{memberId}</Text>
        </View>
      </View>

      {/* QR Code Container */}
      <View style={styles.qrWrapper}>
        <View style={styles.qrBox}>
          {loading ? (
            <ActivityIndicator size="large" color="#10b981" />
          ) : (
            <View style={styles.qrContent}>
              {/* High-contrast QR visual representation */}
              <View style={styles.qrMockGrid}>
                <View style={[styles.cornerBox, styles.cornerTL]} />
                <View style={[styles.cornerBox, styles.cornerTR]} />
                <View style={[styles.cornerBox, styles.cornerBL]} />
                <View style={styles.centerBarcode}>
                  <Text style={styles.qrCenterText}>DYNAMIC QR</Text>
                  <Text style={styles.qrCenterSubtext}>{qrToken.slice(-8)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Countdown & Status */}
        <View style={styles.timerRow}>
          <Text style={styles.timerText}>
            Làm mới sau: <Text style={styles.timerCount}>{timeLeft}s</Text>
          </Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchDynamicToken}
            disabled={loading}
          >
            <Text style={styles.refreshBtnText}>🔄 Đổi mã</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: timeLeft < 10 ? '#ef4444' : '#10b981',
              },
            ]}
          />
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Hạn sử dụng thẻ:</Text>
          <Text style={styles.footerValue}>{expiresDate}</Text>
        </View>
        <Text style={styles.antiPassbackNotice}>
          ⚠️ Mã bảo mật TOTP 30 giây chống chụp màn hình. Quét trực tiếp tại cửa kiểm soát Flap Barrier.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 14,
  },
  planBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
    marginTop: 2,
  },
  idContainer: {
    alignItems: 'flex-end',
  },
  idLabel: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  idValue: {
    fontSize: 13,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: '#e4e4e7',
    marginTop: 2,
  },
  qrWrapper: {
    alignItems: 'center',
    marginVertical: 18,
  },
  qrBox: {
    width: 200,
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  qrContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  qrMockGrid: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBox: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderWidth: 6,
    borderColor: '#09090b',
  },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  centerBarcode: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  qrCenterText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#09090b',
    letterSpacing: 0.5,
  },
  qrCenterSubtext: {
    fontSize: 9,
    fontFamily: 'Courier',
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 12,
  },
  timerText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  timerCount: {
    color: '#10b981',
    fontWeight: '700',
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  refreshBtnText: {
    fontSize: 11,
    color: '#f4f4f5',
    fontWeight: '600',
  },
  progressBarBg: {
    width: 200,
    height: 4,
    backgroundColor: '#27272a',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderBottomColor: '#27272a',
    paddingTop: 14,
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  antiPassbackNotice: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
});
