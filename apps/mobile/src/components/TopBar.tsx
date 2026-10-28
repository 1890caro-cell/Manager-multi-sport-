import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatVND } from '../utils/format';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  balance?: number;
  onPressNotification?: () => void;
  unreadCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = 'Antigravity Sports',
  subtitle,
  balance,
  onPressNotification,
  unreadCount = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightContainer}>
        {balance !== undefined && (
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceLabel}>Ví:</Text>
            <Text style={styles.balanceValue}>{formatVND(balance)}</Text>
          </View>
        )}

        {onPressNotification && (
          <TouchableOpacity
            style={styles.notifButton}
            onPress={onPressNotification}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    position: 'relative',
  },
  notifIcon: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
});
