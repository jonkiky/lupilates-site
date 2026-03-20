import { format } from 'date-fns';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SESSION_STATUS_COLORS } from '@/constants/statusColors';
import type { TrainingSession } from '@/types/domain';

interface SessionCardProps {
  session: TrainingSession;
  onPress?: () => void;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  const statusColor = SESSION_STATUS_COLORS[session.status];
  const dateLabel = format(session.startsAt, 'MMMM d, yyyy');
  const timeLabel = `${format(session.startsAt, 'h:mm a')} - ${format(session.endsAt, 'h:mm a')}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.dateText}>{dateLabel}</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.timeText}>
            {timeLabel}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
          <ThemedText style={[styles.badgeText, { color: statusColor }]}>
            {session.status.charAt(0) + session.status.slice(1).toLowerCase().replace('_', ' ')}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 16,
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notes: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
});
