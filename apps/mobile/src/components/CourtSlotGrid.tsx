import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { formatVND } from '../utils/format';

export interface SlotItem {
  slotIndex: number;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'LOCKED';
  price: number;
}

interface CourtSlotGridProps {
  slots: SlotItem[];
  selectedSlotIndex: number | null;
  onSelectSlot: (slot: SlotItem) => void;
  courtName?: string;
}

export const CourtSlotGrid: React.FC<CourtSlotGridProps> = ({
  slots,
  selectedSlotIndex,
  onSelectSlot,
  courtName = 'Sân thể thao',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Khung giờ thi đấu: {courtName}</Text>
        <Text style={styles.subtitle}>Bước nhảy: 30 phút</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.statusAvailable]} />
          <Text style={styles.legendText}>Trống</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.statusSelected]} />
          <Text style={styles.legendText}>Đang chọn</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.statusHeld]} />
          <Text style={styles.legendText}>Giữ chỗ</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.statusBooked]} />
          <Text style={styles.legendText}>Đã đặt</Text>
        </View>
      </View>

      {/* Slots Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {slots.map((slot) => {
          const isSelected = selectedSlotIndex === slot.slotIndex;
          const isAvailable = slot.status === 'AVAILABLE';

          let slotStyle = styles.slotAvailable;
          let textStyle = styles.textAvailable;

          if (isSelected) {
            slotStyle = styles.slotSelected;
            textStyle = styles.textSelected;
          } else if (slot.status === 'HELD') {
            slotStyle = styles.slotHeld;
            textStyle = styles.textHeld;
          } else if (slot.status === 'BOOKED' || slot.status === 'LOCKED') {
            slotStyle = styles.slotBooked;
            textStyle = styles.textBooked;
          }

          return (
            <TouchableOpacity
              key={slot.slotIndex}
              disabled={!isAvailable}
              onPress={() => onSelectSlot(slot)}
              style={[styles.slotCard, slotStyle]}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeText, textStyle]}>
                {slot.startTime} - {slot.endTime}
              </Text>
              <Text style={[styles.priceText, isSelected ? styles.priceSelected : null]}>
                {isAvailable ? formatVND(slot.price) : slot.status === 'HELD' ? 'Đang giữ' : 'Đã đặt'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  subtitle: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#18181b',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  statusAvailable: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  statusSelected: {
    backgroundColor: '#10b981',
  },
  statusHeld: {
    backgroundColor: '#f59e0b',
  },
  statusBooked: {
    backgroundColor: '#ef4444',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 24,
  },
  slotCard: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotAvailable: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  slotSelected: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  slotHeld: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    opacity: 0.6,
  },
  slotBooked: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    opacity: 0.4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  textAvailable: {
    color: '#f4f4f5',
  },
  textSelected: {
    color: '#ffffff',
  },
  textHeld: {
    color: '#f59e0b',
  },
  textBooked: {
    color: '#71717a',
  },
  priceText: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
  },
  priceSelected: {
    color: '#ffffff',
  },
});
