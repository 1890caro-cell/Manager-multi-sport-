import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HoldTimerProps {
  initialSeconds?: number;
  courtName: string;
  timeSlot: string;
  onExpire: () => void;
  onProceedPayment: () => void;
  onCancelHold: () => void;
}

export const HoldTimer: React.FC<HoldTimerProps> = ({
  initialSeconds = 600, // 10 minutes (SPEC 00-invariants.md)
  courtName,
  timeSlot,
  onExpire,
  onProceedPayment,
  onCancelHold,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = secondsLeft < 120; // Under 2 mins warning

  return (
    <View style={[styles.container, isLowTime && styles.containerLowTime]}>
      <View style={styles.infoRow}>
        <View style={styles.textColumn}>
          <Text style={styles.title}>Đang giữ chỗ tạm thời</Text>
          <Text style={styles.details}>
            {courtName} • {timeSlot}
          </Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerLabel}>Hết hạn sau</Text>
          <Text style={[styles.timerValue, isLowTime && styles.timerValueLowTime]}>
            {formattedTime}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancelHold}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Hủy giữ chỗ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={onProceedPayment}
          activeOpacity={0.8}
        >
          <Text style={styles.payText}>Tiến hành thanh toán ➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginVertical: 12,
  },
  containerLowTime: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  details: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  timerBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#09090b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  timerLabel: {
    fontSize: 10,
    color: '#71717a',
  },
  timerValue: {
    fontSize: 15,
    fontFamily: 'Courier',
    fontWeight: '800',
    color: '#3b82f6',
    marginTop: 1,
  },
  timerValueLowTime: {
    color: '#ef4444',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  payBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
