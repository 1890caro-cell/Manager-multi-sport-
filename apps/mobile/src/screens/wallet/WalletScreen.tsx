import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { VietQrModal } from '../../components/VietQrModal';
import { api } from '../../api/client';
import { formatVND } from '../../utils/format';
import { generateIdempotencyKey } from '../../utils/idempotency';

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000];

export const WalletScreen = ({ navigation }: any) => {
  const [wallet, setWallet] = useState<{ balance: number; held: number; available: number }>({
    balance: 850000,
    held: 90000,
    available: 760000,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customAmount, setCustomAmount] = useState<string>('200000');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [topupAmount, setTopupAmount] = useState<number>(200000);

  const loadWallet = async () => {
    try {
      const [wRes, txRes] = await Promise.allSettled([
        api.wallet.getMyWallet(),
        api.wallet.getTransactions(),
      ]);
      if (wRes.status === 'fulfilled' && wRes.value) {
        setWallet(wRes.value);
      }
      if (txRes.status === 'fulfilled' && txRes.value) {
        setTransactions(txRes.value);
      } else {
        setTransactions([
          {
            id: 'TX-1001',
            type: 'TOPUP',
            title: 'Nạp tiền VietQR Napas',
            amount: 500000,
            date: '26/10/2026 10:15',
            status: 'SUCCESS',
          },
          {
            id: 'TX-1002',
            type: 'PAYMENT',
            title: 'Cọc sân bóng đá (BK-789123)',
            amount: -180000,
            date: '25/10/2026 14:30',
            status: 'SUCCESS',
          },
          {
            id: 'TX-1003',
            type: 'REFUND',
            title: 'Hoàn cọc sân Pickleball (BK-110293)',
            amount: 90000,
            date: '24/10/2026 09:00',
            status: 'SUCCESS',
          },
        ]);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleStartTopup = (amt: number) => {
    if (amt < 20000) {
      Alert.alert('Hạn mức không hợp lệ', 'Hạn mức nạp tối thiểu là 20.000 đ (SPEC M05).');
      return;
    }
    setTopupAmount(amt);
    setShowQrModal(true);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Ví điện tử nội bộ" subtitle="Sổ cái kép đối soát tự động 24/7" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          <Text style={styles.balanceAmount}>{formatVND(wallet.available)}</Text>

          <View style={styles.subBalancesRow}>
            <View style={styles.subBalanceItem}>
              <Text style={styles.subBalanceLabel}>Tổng số dư:</Text>
              <Text style={styles.subBalanceVal}>{formatVND(wallet.balance)}</Text>
            </View>
            <View style={styles.subBalanceDivider} />
            <View style={styles.subBalanceItem}>
              <Text style={styles.subBalanceLabel}>Tạm giữ (cọc sân):</Text>
              <Text style={[styles.subBalanceVal, { color: '#f59e0b' }]}>
                {formatVND(wallet.held)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Top-up Section */}
        <Text style={styles.sectionTitle}>Nạp tiền vào ví (VietQR)</Text>
        <View style={styles.topupBox}>
          <View style={styles.presetGrid}>
            {QUICK_AMOUNTS.map((amt) => {
              const isSelected = topupAmount === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                  onPress={() => {
                    setTopupAmount(amt);
                    setCustomAmount(String(amt));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    {formatVND(amt)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Input */}
          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>VND</Text>
            <TextInput
              style={styles.amountInput}
              value={customAmount}
              onChangeText={(val) => {
                const numeric = val.replace(/\D/g, '');
                setCustomAmount(numeric);
                if (numeric) setTopupAmount(Number(numeric));
              }}
              placeholder="Hoặc tự nhập số tiền..."
              placeholderTextColor="#71717a"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.topupSubmitBtn}
            onPress={() => handleStartTopup(Number(customAmount) || topupAmount)}
            activeOpacity={0.8}
          >
            <Text style={styles.topupSubmitText}>
              📱 Tạo mã VietQR nạp {formatVND(Number(customAmount) || topupAmount)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Lịch sử biến động số dư</Text>
        <View style={styles.txList}>
          {transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            return (
              <View key={tx.id} style={styles.txItem}>
                <View style={styles.txIconBox}>
                  <Text style={styles.txIcon}>{isPositive ? '⬇️' : '⬆️'}</Text>
                </View>

                <View style={styles.txDetails}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>

                <Text style={[styles.txAmount, isPositive ? styles.txGreen : styles.txWhite]}>
                  {isPositive ? `+${formatVND(tx.amount)}` : formatVND(tx.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* VietQR Top-up Modal */}
      {showQrModal && (
        <VietQrModal
          visible={showQrModal}
          onClose={() => setShowQrModal(false)}
          amount={topupAmount}
          transferContent={`NAP${generateIdempotencyKey().slice(-6).toUpperCase()}`}
          onPaidSuccess={() => {
            setShowQrModal(false);
            setWallet((prev) => ({
              ...prev,
              balance: prev.balance + topupAmount,
              available: prev.available + topupAmount,
            }));
            Alert.alert(
              'Nạp tiền thành công!',
              `Số dư khả dụng của bạn đã được cộng thêm ${formatVND(topupAmount)} qua VietQR.`,
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
  walletCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#10b981',
    marginVertical: 8,
  },
  subBalancesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 14,
    marginTop: 6,
  },
  subBalanceItem: {
    flex: 1,
  },
  subBalanceLabel: {
    fontSize: 11,
    color: '#71717a',
  },
  subBalanceVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f4f4f5',
    marginTop: 2,
  },
  subBalanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#27272a',
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  topupBox: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  presetBtnActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  presetTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#f4f4f5',
    fontSize: 15,
    fontFamily: 'Courier',
    fontWeight: '700',
    paddingVertical: 12,
  },
  topupSubmitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  topupSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  txList: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 8,
    gap: 4,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    fontSize: 14,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  txDate: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  txGreen: {
    color: '#10b981',
  },
  txWhite: {
    color: '#f4f4f5',
  },
});
