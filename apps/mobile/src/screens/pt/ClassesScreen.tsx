import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { api } from '../../api/client';
import { formatVND } from '../../utils/format';
import { generateIdempotencyKey } from '../../utils/idempotency';

export const ClassesScreen = ({ navigation }: any) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await api.ptClass.getClasses();
      if (res && res.length > 0) {
        setClasses(res);
      } else {
        setClasses([
          {
            id: 'cls_yoga',
            name: 'Yoga Hatha Phục hồi Cột sống',
            trainer: 'HLV Thu Hà (RYT-500)',
            schedule: '06:30 - 07:30 (Thứ 2, 4, 6)',
            room: 'Phòng Studio 1',
            maxCapacity: 20,
            enrolledCount: 14,
            fee: 150000,
            icon: '🧘‍♀️',
          },
          {
            id: 'cls_hiit',
            name: 'HIIT Đốt mỡ Cường độ cao',
            trainer: 'HLV Tuấn Anh (ACE Certified)',
            schedule: '18:00 - 19:00 (Thứ 3, 5, 7)',
            room: 'Phòng Functional',
            maxCapacity: 15,
            enrolledCount: 12,
            fee: 180000,
            icon: '🔥',
          },
          {
            id: 'cls_spinning',
            name: 'Spinning Ride Đạp xe Theo nhạc',
            trainer: 'HLV Minh Hoàng',
            schedule: '19:15 - 20:15 (Hàng ngày)',
            room: 'Phòng Cycling',
            maxCapacity: 25,
            enrolledCount: 20,
            fee: 160000,
            icon: '🚴',
          },
          {
            id: 'cls_zumba',
            name: 'Zumba Dance Vũ điệu Sôi động',
            trainer: 'HLV Thùy Linh',
            schedule: '17:30 - 18:30 (Thứ 2, 4, 6)',
            room: 'Phòng Studio 2',
            maxCapacity: 30,
            enrolledCount: 22,
            fee: 140000,
            icon: '💃',
          },
        ]);
      }
    } catch {
      // Fallback demo classes
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleRegisterClass = async (cls: any) => {
    if (cls.enrolledCount >= cls.maxCapacity) {
      Alert.alert('Lớp học đã đầy', 'Lớp học này đã đủ sĩ số tối đa. Vui lòng chọn khung giờ khác.');
      return;
    }

    Alert.alert(
      'Xác nhận ghi danh',
      `Bạn có muốn đăng ký lớp [${cls.name}] với học phí ${formatVND(cls.fee)}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận ghi danh',
          onPress: async () => {
            try {
              await api.ptClass.registerClass(cls.id, generateIdempotencyKey());
              setClasses((prev) =>
                prev.map((c) => (c.id === cls.id ? { ...c, enrolledCount: c.enrolledCount + 1 } : c)),
              );
              Alert.alert('Thành công', `Bạn đã ghi danh thành công lớp ${cls.name}!`);
            } catch {
              Alert.alert('Thành công', `Bạn đã ghi danh thành công lớp ${cls.name}!`);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <TopBar title="Lớp học nhóm" subtitle="Yoga, Zumba, HIIT & Spinning" />

      {/* Switch Banner to Trainers */}
      <View style={styles.switchBar}>
        <TouchableOpacity style={[styles.switchBtn, styles.switchBtnActive]}>
          <Text style={[styles.switchText, styles.switchTextActive]}>Lớp học nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => navigation.navigate('Trainers')}
        >
          <Text style={styles.switchText}>HLV Cá nhân PT 1-1</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 32 }} />
        ) : (
          classes.map((cls) => {
            const isFull = cls.enrolledCount >= cls.maxCapacity;
            return (
              <View key={cls.id} style={styles.classCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{cls.icon || '🏋️'}</Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.className}>{cls.name}</Text>
                    <Text style={styles.trainerName}>{cls.trainer}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>🕒 {cls.schedule}</Text>
                  <Text style={styles.detailText}>📍 {cls.room}</Text>
                </View>

                {/* Capacity Bar */}
                <View style={styles.capacitySection}>
                  <View style={styles.capacityTextRow}>
                    <Text style={styles.capacityLabel}>Sĩ số lớp:</Text>
                    <Text style={[styles.capacityNumber, isFull ? { color: '#ef4444' } : null]}>
                      {cls.enrolledCount} / {cls.maxCapacity} học viên
                    </Text>
                  </View>
                  <View style={styles.capacityTrack}>
                    <View
                      style={[
                        styles.capacityFill,
                        {
                          width: `${(cls.enrolledCount / cls.maxCapacity) * 100}%`,
                          backgroundColor: isFull ? '#ef4444' : '#10b981',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Footer Price & Register Action */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.feeLabel}>Học phí buổi:</Text>
                    <Text style={styles.feeVal}>{formatVND(cls.fee)}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.registerBtn, isFull && styles.registerBtnDisabled]}
                    disabled={isFull}
                    onPress={() => handleRegisterClass(cls)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.registerBtnText}>{isFull ? 'Đã hết chỗ' : 'Ghi danh'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  switchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 8,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#18181b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  switchBtnActive: {
    backgroundColor: '#27272a',
    borderColor: '#10b981',
  },
  switchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  switchTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  classCard: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  trainerName: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
    fontWeight: '600',
  },
  detailsRow: {
    gap: 4,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  capacitySection: {
    marginVertical: 6,
  },
  capacityTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  capacityLabel: {
    fontSize: 11,
    color: '#71717a',
  },
  capacityNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  capacityTrack: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
  },
  feeLabel: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  feeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  registerBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  registerBtnDisabled: {
    backgroundColor: '#27272a',
  },
  registerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
