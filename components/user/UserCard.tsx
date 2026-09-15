import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { USER_STATUS_COLORS } from '@/constants/statusColors';
import type { UserProfile } from '@/types/domain';

interface UserCardProps {
  user: UserProfile;
  onPress?: () => void;
}

export function UserCard({ user, onPress }: UserCardProps) {
  const statusColor = USER_STATUS_COLORS[user.status];
  const statusLabel = user.status === 'IN_TRAINING' ? 'In Training' : 'Inactive';
  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Unknown User';
  const initials = displayName.charAt(0).toUpperCase();
  const badgeColor = user.role === 'ADMIN' ? '#7C3AED' : statusColor;
  const badgeLabel = user.role === 'ADMIN' ? 'Admin' : statusLabel;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.avatar}>
        <ThemedText style={styles.avatarText}>{initials}</ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText type="defaultSemiBold" style={styles.name}>
          {displayName}
        </ThemedText>
        <ThemedText style={styles.email}>{user.email ?? ''}</ThemedText>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: badgeColor + '20' }]}>
        <ThemedText style={[styles.statusText, { color: badgeColor }]}>{badgeLabel}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: '#111827',
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
