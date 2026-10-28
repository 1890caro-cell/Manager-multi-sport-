import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TopBar } from '../../components/TopBar';
import { api } from '../../api/client';
import { formatVND } from '../../utils/format';
import { generateIdempotencyKey } from '../../utils/idempotency';

export const TournamentsScreen = ({ navigation }: any) => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [teamName, setTeamName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('0901234567');
  const [playerCount, setPlayerCount] = useState('7');

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const res = await api.tournaments.getAll();
      if (res && res.length > 0) {
        setTournaments(res);
      } else {
        setTournaments([
          {
            id: 'tour_fb_2026',
            name: 'Antigravity Champions Cup 2026',
            sport: 'Bóng đá 7 người',
            status: 'REGISTRATION',
            prizePool: 30000000,
            entryFee: 1500000,
            teamsCount: 12,
            maxTeams: 16,
            startDate: '15/11/2026',
            format: 'Single Elimination (Loại trực tiếp)',
            icon: '🏆',
          },
          {
            id: 'tour_pickle_2026',
            name: 'Giải Pickleball Đôi Nam Nữ Mở Rộng',
            sport: 'Pickleball',
            status: 'REGISTRATION',
            prizePool: 15000000,
            entryFee: 500000,
            teamsCount: 24,
            maxTeams: 32,
            startDate: '20/11/2026',
            format: 'Vòng bảng + Loại trực tiếp',
            icon: '🏓',
          },
          {
            id: 'tour_esports_2026',
            name: 'Cyber Battle: LMHT & Valorant Cup',
            sport: 'Esports Máy trạm',
            status: 'ONGOING',
            prizePool: 20000000,
            entryFee: 500000,
            teamsCount: 16,
            maxTeams: 16,
            startDate: '25/10/2026',
            format: 'Bo3 Nhánh thắng nhánh thua',
            icon: '🎮',
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
    loadTournaments();
  }, []);

  const handleRegisterTeam = async () => {
    if (!teamName || !captainPhone) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Tên đội và Số điện thoại đội trưởng.');
      return;
    }

    try {
      await api.tournaments.registerTeam(
        selectedTournament.id,
        {
          teamName,
          captainPhone,
          playerCount: Number(playerCount) || 7,
        },
        generateIdempotencyKey(),
      );
      const fee = selectedTournament.entryFee;
      setSelectedTournament(null);
      Alert.alert(
        'Đăng ký đội thành công!',
        `Đội [${teamName}] đã ghi danh giải đấu. Lệ phí ${formatVND(fee)} đã được trích từ Ví nội bộ.`,
      );
    } catch (err: any) {
      Alert.alert('Đăng ký thất bại', err.message || 'Không thể đăng ký đội');
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title="Giải đấu & Esports" subtitle="Sơ đồ nhánh đấu & Đăng ký trực tiếp" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 32 }} />
        ) : (
          tournaments.map((tour) => {
            const isRegOpen = tour.status === 'REGISTRATION';
            return (
              <View key={tour.id} style={styles.tourCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{tour.icon || '🏆'}</Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.tourSport}>{tour.sport}</Text>
                    <Text style={styles.tourName}>{tour.name}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isRegOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isRegOpen ? '#10b981' : '#3b82f6' },
                      ]}
                    >
                      {isRegOpen ? 'ĐANG MỞ ĐĂNG KÝ' : 'ĐANG THI ĐẤU'}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailKey}>Tổng giải thưởng:</Text>
                    <Text style={styles.prizeVal}>{formatVND(tour.prizePool)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailKey}>Lệ phí tham gia:</Text>
                    <Text style={styles.feeVal}>{formatVND(tour.entryFee)}/đội</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailKey}>Quy mô:</Text>
                    <Text style={styles.detailVal}>
                      {tour.teamsCount} / {tour.maxTeams} đội đã đăng ký
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailKey}>Khởi tranh:</Text>
                    <Text style={styles.detailVal}>{tour.startDate}</Text>
                  </View>
                </View>

                {/* Visual Bracket Preview (F16.5) */}
                <View style={styles.bracketBox}>
                  <Text style={styles.bracketTitle}>Nhánh đấu (Semifinals ➔ Final)</Text>
                  <View style={styles.matchMockRow}>
                    <View style={styles.matchMockBox}>
                      <Text style={styles.teamMock}>FC Tiger (3)</Text>
                      <Text style={styles.teamMock}>FC Dragon (1)</Text>
                    </View>
                    <Text style={styles.bracketConnector}>➔</Text>
                    <View style={[styles.matchMockBox, styles.finalMatchBox]}>
                      <Text style={styles.finalTitle}>🏆 Chung kết</Text>
                      <Text style={styles.teamMock}>FC Tiger vs TBD</Text>
                    </View>
                  </View>
                </View>

                {/* Action Button */}
                {isRegOpen && (
                  <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={() => setSelectedTournament(tour)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.registerBtnText}>Đăng ký đội thi đấu ➔</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Team Registration Modal */}
      {selectedTournament && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedTournament(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.regModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Đăng ký tham gia giải đấu</Text>
                <TouchableOpacity onPress={() => setSelectedTournament(null)}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.targetTourName}>{selectedTournament.name}</Text>
              <Text style={styles.targetTourFee}>
                Lệ phí: {formatVND(selectedTournament.entryFee)} (Trừ trực tiếp vào ví)
              </Text>

              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tên đội thi đấu</Text>
                  <TextInput
                    style={styles.input}
                    value={teamName}
                    onChangeText={setTeamName}
                    placeholder="Ví dụ: FC Sài Gòn Warriors"
                    placeholderTextColor="#71717a"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SĐT Đội trưởng liên hệ</Text>
                  <TextInput
                    style={styles.input}
                    value={captainPhone}
                    onChangeText={setCaptainPhone}
                    keyboardType="phone-pad"
                    placeholder="0901234567"
                    placeholderTextColor="#71717a"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số lượng vận động viên</Text>
                  <TextInput
                    style={styles.input}
                    value={playerCount}
                    onChangeText={setPlayerCount}
                    keyboardType="numeric"
                    placeholder="7"
                    placeholderTextColor="#71717a"
                  />
                </View>

                <TouchableOpacity
                  style={styles.confirmRegBtn}
                  onPress={handleRegisterTeam}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmRegText}>Xác nhận ghi danh đội</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    gap: 16,
  },
  tourCard: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 14,
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
  tourSport: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tourName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 14,
  },
  detailItem: {
    width: '48%',
  },
  detailKey: {
    fontSize: 11,
    color: '#71717a',
  },
  prizeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f59e0b',
    marginTop: 2,
  },
  feeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
    marginTop: 2,
  },
  bracketBox: {
    backgroundColor: '#09090b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 14,
  },
  bracketTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  matchMockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matchMockBox: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 4,
  },
  finalMatchBox: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  finalTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },
  teamMock: {
    fontSize: 11,
    color: '#f4f4f5',
    fontWeight: '600',
  },
  bracketConnector: {
    color: '#71717a',
    fontSize: 14,
  },
  registerBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  regModalCard: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  closeText: {
    color: '#a1a1aa',
    fontSize: 18,
    fontWeight: '700',
  },
  targetTourName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  targetTourFee: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
    marginBottom: 16,
  },
  modalForm: {
    gap: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f4f4f5',
    fontSize: 14,
  },
  confirmRegBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmRegText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
