import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import { formatVND } from '../utils/format';

interface VietQrModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  transferContent: string;
  bankName?: string;
  accountNo?: string;
  accountName?: string;
  onPaidSuccess?: () => void;
}

export const VietQrModal: React.FC<VietQrModalProps> = ({
  visible,
  onClose,
  amount,
  transferContent,
  bankName = 'VietinBank (Napas 247)',
  accountNo = '0868888999',
  accountName = 'TO HOP THE THAO ANTIGRAVITY',
  onPaidSuccess,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (val: string, label: string) => {
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('Đã sao chép', `Đã sao chép ${label}: ${val}`);
  };

  const handleOpenBankingApp = () => {
    // Attempt banking universal link / scheme or prompt user
    const bankingUrl = 'vietqr://';
    Linking.canOpenURL(bankingUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(bankingUrl);
        } else {
          Alert.alert(
            'Chuyển tiền tự động',
            'Vui lòng mở ứng dụng ngân hàng của bạn và quét mã QR hoặc chuyển khoản với nội dung chính xác.',
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Chuyển tiền tự động',
          'Vui lòng mở ứng dụng ngân hàng của bạn và quét mã QR hoặc chuyển khoản với nội dung chính xác.',
        );
      });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Thanh toán VietQR Chuyển khoản</Text>
              <Text style={styles.headerSubtitle}>Tự động nhận diện giao dịch 24/7</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Box */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Số tiền cần thanh toán</Text>
            <Text style={styles.amountValue}>{formatVND(amount)}</Text>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrContainer}>
            <View style={styles.qrFrame}>
              {/* Simulated EMVCo high quality QR code container */}
              <View style={styles.qrCornerTL} />
              <View style={styles.qrCornerTR} />
              <View style={styles.qrCornerBL} />
              <View style={styles.qrCenterBadge}>
                <Text style={styles.qrCenterNapas}>VietQR</Text>
                <Text style={styles.qrCenterText}>Napas 247</Text>
              </View>
            </View>
            <Text style={styles.qrHint}>Quét mã bằng bất kỳ App Ngân hàng nào</Text>
          </View>

          {/* Transfer Info */}
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Ngân hàng:</Text>
              <Text style={styles.infoVal}>{bankName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Số tài khoản:</Text>
              <TouchableOpacity
                onPress={() => handleCopy(accountNo, 'Số tài khoản')}
                style={styles.copyRow}
              >
                <Text style={[styles.infoVal, styles.highlightText]}>{accountNo}</Text>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Chủ tài khoản:</Text>
              <Text style={styles.infoVal}>{accountName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Nội dung:</Text>
              <TouchableOpacity
                onPress={() => handleCopy(transferContent, 'Nội dung')}
                style={styles.copyRow}
              >
                <Text style={[styles.infoVal, styles.contentHighlight]}>{transferContent}</Text>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.openAppBtn}
              onPress={handleOpenBankingApp}
              activeOpacity={0.8}
            >
              <Text style={styles.openAppText}>📱 Mở App Ngân hàng</Text>
            </TouchableOpacity>

            {onPaidSuccess && (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={onPaidSuccess}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmText}>Tôi đã chuyển khoản thành công</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#a1a1aa',
    fontWeight: '700',
  },
  amountBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  qrFrame: {
    width: 170,
    height: 170,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrCornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderWidth: 5,
    borderColor: '#09090b',
  },
  qrCornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderWidth: 5,
    borderColor: '#09090b',
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 32,
    height: 32,
    borderWidth: 5,
    borderColor: '#09090b',
  },
  qrCenterBadge: {
    backgroundColor: '#09090b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  qrCenterNapas: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
  },
  qrCenterText: {
    color: '#3b82f6',
    fontSize: 9,
    fontWeight: '800',
  },
  qrHint: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 8,
  },
  infoList: {
    backgroundColor: '#09090b',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoKey: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  highlightText: {
    color: '#3b82f6',
    fontFamily: 'Courier',
  },
  contentHighlight: {
    color: '#10b981',
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyIcon: {
    fontSize: 12,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 8,
  },
  openAppBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  openAppText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#27272a',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
});
