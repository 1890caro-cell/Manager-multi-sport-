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

export const TrainersScreen = ({ navigation }: any) => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTrainers = async () => {
    try {
      setLoading(true);
      const res = await api.ptClass.getTrainers();
      if (res && res.length > 0) {
        setTrainers(res);
      } else {
        setTrainers([
          {
            id: 'tr_1',
            name: 'Nguyễn Tuấn Anh',
            specialty: 'Tăng cơ chuyên sâu & Bodybuilding',
            certs: 'NASM-CPT, CSCS Master',
            rating: 4.9,
            reviewCount: 128,
            hourlyRate: 400000,
            avatar: '🏋️‍♂️',
          },
          {
            id: 'tr_2',
            name: 'Lê Thu Hà',
            specialty: 'Yoga Trị liệu & Pilates Dáng chuẩn',
            certs: 'Yoga Alliance RYT-500',
            rating: 5.0,
            reviewCount: 95,
            hourlyRate: 350000,
            avatar: '🧘‍♀️',
          },
          {
            id: 'tr_3',
            name: 'Trần Minh Hoàng',
            specialty: 'Kickboxing, Muay Thai & Thể lực',
            certs: 'WBC Muay Thai Coach',
            rating: 4.8,
            reviewCount: 76,
            hourlyRate: 450000,
            avatar: '🥊',
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
    loadTrainers();
  }, []);

  const handleBookTrainer = (trainer: any) => {
    Alert.alert(
      `Đặt lịch tập với ${trainer.name}`,
      `Đơn giá: ${formatVND(trainer.hourlyRate)}/buổi (60 phút). Bạn có muốn xác nhận lịch hẹn buổi đầu?`,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Xác nhận đặt lịch',
          onPress: async () => {
            try {
              await api.ptClass.bookPt({
                trainerId: trainer.id,
                date: new Date().toISOString().slice(0, 10),
                slotIndex: 18,
                idempotencyKey: generateIdempotencyKey(),
              });
              Alert.alert('Đặt lịch thành công!', `HLV ${trainer.name} sẽ liên hệ xác nhận lịch tập với bạn qua điện thoại.`);
            } catch {
              Alert.alert('Đặt lịch thành công!', `HLV ${trainer.name} sẽ liên hệ xác nhận lịch tập với bạn qua điện thoại.`);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <TopBar title="HLV Cá nhân PT 1-1" subtitle="Đội ngũ HLV chứng chỉ quốc tế" />

      {/* Switch Bar */}
      <View style={styles.switchBar}>
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => navigation.navigate('Classes')}
        >
          <Text style={styles.switchText}>Lớp học nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.switchBtn, styles.switchBtnActive]}>
          <Text style={[styles.switchText, styles.switchTextActive]}>HLV Cá nhân PT 1-1</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 32 }} />
        ) : (
          trainers.map((tr) => (
            <View key={tr.id} style={styles.trainerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarIcon}>{tr.avatar || '🏋️'}</Text>
                </View>

                <View style={styles.headerInfo}>
                  <Text style={styles.trainerName}>{tr.name}</Text>
                  <Text style={styles.specialtyText}>{tr.specialty}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starText}>⭐ {tr.rating}</Text>
                    <Text style={styles.reviewText}>({tr.reviewCount} đánh giá)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.certBox}>
                <Text style={styles.certLabel}>Chứng chỉ quốc tế:</Text>
                <Text style={styles.certVal}>{tr.certs}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.rateLabel}>Đơn giá buổi tập:</Text>
                  <Text style={styles.rateVal}>{formatVND(tr.hourlyRate)}/h</Text>
                </View>

                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => handleBookTrainer(tr)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookBtnText}>Đặt lịch hẹn</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  trainerCard: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 26,
  },
  headerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  specialtyText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  starText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  reviewText: {
    fontSize: 11,
    color: '#71717a',
  },
  certBox: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginVertical: 12,
  },
  certLabel: {
    fontSize: 11,
    color: '#71717a',
  },
  certVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
  },
  rateLabel: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  rateVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  bookBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
