import { format } from 'date-fns';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SESSION_STATUS_COLORS } from '@/constants/statusColors';
import type { TrainingSession, UserProfile } from '@/types/domain';

interface AdminSessionCardProps {
  session: TrainingSession;
  user?: UserProfile | null;
  onPress?: () => void;
}

export function AdminSessionCard({ session, user, onPress }: AdminSessionCardProps) {
  const statusColor = SESSION_STATUS_COLORS[session.status];
  const timeLabel = `${format(session.startsAt, 'h:mm a')} - ${format(session.endsAt, 'h:mm a')}`;
  const statusLabel = session.status.charAt(0) + session.status.slice(1).toLowerCase().replace('_', ' ');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="defaultSemiBold" style={styles.userName}>
            {user?.displayName ?? 'Unknown User'}
          </ThemedText>
          <ThemedText style={styles.timeText}>{timeLabel}</ThemedText>
        </View>
        {session.status !== 'SCHEDULED' && (
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <ThemedText style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</ThemedText>
          </View>
        )}
      </View>
      {session.notes ? (
        <ThemedText numberOfLines={1} style={styles.notes}>
          {session.notes}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    color: '#111827',
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notes: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
});
